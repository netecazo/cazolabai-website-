/* Business dashboard page: reads the files in the browser, runs engine.js, draws the report.
 * File contents are shown with textContent only, never as HTML. */
(function () {
    'use strict';
    const B = window.BizDash;
    const $ = id => document.getElementById(id);
    const STORE = 'cazolabai.bizdash.v1';

    const SLOTS = [
        { kind: 'sales', title: 'Sales', hint: 'Required. Point-of-sale, booking or invoice export: one row per sale.' },
        { kind: 'payroll', title: 'Payroll', hint: 'Payroll register for the same month: one row per person per pay run.' },
        { kind: 'bank', title: 'Bank statement', hint: 'Business account for the month, ideally with a category column.' },
        { kind: 'ads', title: 'Ad spend', hint: 'One row per channel: channel, spend, and optionally fee_pct for deal sites.' },
    ];
    const LABELS = {
        date: 'Date', invoice: 'Invoice / order', item: 'Service / item', staff: 'Staff member', channel: 'Lead source',
        amount: 'Amount', tip: 'Tip', is_new: 'New customer?', customer: 'Customer', payment: 'Payment method',
        employee: 'Employee', role: 'Role', hours: 'Hours', gross: 'Gross pay', employer_tax: 'Employer taxes',
        description: 'Description', debit: 'Money out', credit: 'Money in', category: 'Category',
        spend: 'Spend', leads: 'Leads', fee_pct: 'Fee % (deal sites)',
    };
    const files = { sales: null, payroll: null, bank: null, ads: null };
    let isSample = false;

    // ---------- small DOM helper ----------
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v == null || v === false) continue;
            if (k === 'class') el.className = v; else if (k === 'style') el.style.cssText = v; else el.setAttribute(k, v);
        }
        kids.flat().forEach(k => { if (k != null && k !== false) el.append(k instanceof Node ? k : String(k)); });
        return el;
    }
    const money = B.money, money2 = B.money2;
    const pct = v => Math.round(v * 100) + '%';

    // ---------- settings (kept on this device) ----------
    function loadSettings() {
        try { return JSON.parse(localStorage.getItem(STORE)) || {}; } catch (e) { return {}; }
    }
    function saveSettings() {
        try {
            localStorage.setItem(STORE, JSON.stringify({ name: $('bizName').value, brand: $('brandColor').value,
                accent: $('accentColor').value, tax: $('taxRate').value, logo: logoData }));
        } catch (e) { /* storage blocked or full: settings just won't be remembered */ }
    }
    let logoData = null;
    function applyColors() {
        document.documentElement.style.setProperty('--brand', $('brandColor').value);
        document.documentElement.style.setProperty('--accent', $('accentColor').value);
    }

    // ---------- file slots ----------
    function drawSlots() {
        const box = $('slots'); box.replaceChildren();
        SLOTS.forEach(s => {
            const f = files[s.kind];
            const miss = f ? B.missing(f.map, s.kind) : [];
            const slot = h('div', { class: 'slot' + (f ? (miss.length ? ' err' : ' ok') : '') },
                h('div', { class: 'slot-head' }, h('b', null, s.title), h('small', null, s.hint)));
            const input = h('input', { type: 'file', accept: '.csv,text/csv', id: 'file-' + s.kind, 'aria-label': s.title + ' file' });
            input.addEventListener('change', () => input.files[0] && readFile(s.kind, input.files[0]));
            slot.append(input);
            if (f) {
                slot.append(h('div', { class: 'status' }, miss.length
                    ? `${f.name}: couldn't find ${miss.map(m => LABELS[m]).join(' and ')}. Pick ${miss.length > 1 ? 'them' : 'it'} under Columns.`
                    : `${f.name}: ${f.rows.length.toLocaleString()} rows`));
                const det = h('details', { class: 'map' }, h('summary', null, 'Columns'));
                if (miss.length) det.open = true;
                const grid = h('div', { class: 'map-grid' });
                Object.keys(B.FIELDS[s.kind]).forEach(field => {
                    const sel = h('select', { id: `map-${s.kind}-${field}` }, h('option', { value: '' }, '(none)'),
                        f.headers.map(hd => h('option', { value: hd }, hd)));
                    sel.value = f.map[field] || '';
                    sel.addEventListener('change', () => { f.map[field] = sel.value || null; drawSlots(); render(); });
                    grid.append(h('label', null, LABELS[field] || field, sel));
                });
                det.append(grid); slot.append(det);
            }
            box.append(slot);
        });
    }

    function take(kind, name, text) {
        const p = B.parseCSV(text);
        files[kind] = { name, headers: p.headers, rows: p.rows, map: B.detectColumns(p.headers, kind) };
    }
    function readFile(kind, file) {
        const r = new FileReader();
        r.onload = () => { isSample = false; take(kind, file.name, r.result); drawSlots(); render(); };
        r.onerror = () => alert('That file could not be read. Save it as a .csv file and try again.');
        r.readAsText(file);
    }

    // ---------- report ----------
    function bars(rows, total, out) {
        const max = Math.max(...rows.map(r => r.amount), 1);
        return h('div', { class: 'bars' + (out ? ' out' : '') }, rows.map(r => h('div', { class: 'bar' },
            h('span', null, r.name),
            h('span', { class: 'v' }, money(r.amount), h('small', null, total ? pct(r.amount / total) : '')),
            h('span', { class: 'track' }, h('i', { style: `width:${Math.max(0, r.amount / max * 100)}%` })))));
    }
    function table(cols, rows) {
        return h('div', { class: 'tbl' }, h('table', null,
            h('thead', null, h('tr', null, cols.map(c => h('th', null, c[0])))),
            h('tbody', null, rows.map(r => h('tr', null, cols.map(c => { const v = c[1](r); return v instanceof Node ? h('td', null, v) : h('td', { class: c[2] ? c[2](r) || null : null }, v); }))))));
    }
    const who = (name, sub) => { const f = document.createDocumentFragment(); f.append(name); if (sub) f.append(h('span', { class: 'sub' }, sub)); return f; };
    const fmtDate = d => { const t = new Date(d + (d.length === 10 ? 'T00:00:00' : '')); return isNaN(t) ? d : t.toLocaleDateString('en-US', { month: 'short', day: 'numeric', year: 'numeric' }); };

    function render() {
        const out = $('out');
        const ready = files.sales && !B.missing(files.sales.map, 'sales').length;
        $('print').disabled = !ready;
        if (!ready) { out.replaceChildren(h('p', { class: 'empty' }, files.sales ? 'Pick the sales amount column under Columns to see the dashboard.' : 'Add a sales export, or try the sample files, to see the dashboard.')); return; }
        const use = {};
        for (const k of Object.keys(files)) use[k] = files[k] && !B.missing(files[k].map, k).length ? files[k] : null;
        let r;
        try { r = B.analyze(use, { taxRate: (Number($('taxRate').value) || 0) / 100 }); }
        catch (e) { out.replaceChildren(h('p', { class: 'empty' }, 'Something in these files could not be read: ' + e.message)); return; }

        const name = $('bizName').value.trim() || 'Your business';
        const period = r.period ? `${fmtDate(r.period.from)} to ${fmtDate(r.period.to)}` : '';
        const s = [];

        // header + takeaway
        let take = `You kept ${money(r.left)} of ${money(r.moneyIn)} that came in (${pct(r.margin || 0)}).`;
        if (r.left < 0) take = `You spent ${money(-r.left)} more than came in.`;
        if (r.tax > 0) take += ` Set aside ${money(r.tax)} for taxes.`;
        if (r.leak) take += ` The one thing to fix: ${r.leak.title}.`;
        s.push(h('header', { class: 'r-head', id: 'top' },
            h('div', { class: 'r-brand' }, logoData ? h('img', { src: logoData, alt: '' }) : null, h('span', { class: 'name' }, name),
                period ? h('span', { class: 'period' }, period) : null, isSample ? h('span', { class: 'pill' }, 'Sample data') : null),
            h('h1', null, 'The month at a glance'), h('p', { class: 'take' }, take)));

        // money in / out / left
        s.push(h('section', { class: 'sec', id: 'money' }, h('div', { class: 'money' },
            h('div', { class: 'fig' }, h('span', { class: 'lbl' }, 'Money in'), h('span', { class: 'big' }, money(r.moneyIn)), h('span', { class: 'note' }, 'Sales after refunds, not counting tips or gift cards')),
            h('div', { class: 'fig' }, h('span', { class: 'lbl' }, 'Money out'), h('span', { class: 'big' }, money(r.moneyOut)), h('span', { class: 'note' }, use.bank ? 'Payroll and every bill on the bank statement' : 'Payroll only: add a bank statement for the rest')),
            h('div', { class: 'fig left' }, h('span', { class: 'lbl' }, "What's left"), h('span', { class: 'big' + (r.left < 0 ? ' neg' : '') }, money(r.left)), h('span', { class: 'note' }, r.margin != null ? `${pct(r.margin)} of every dollar in, before taxes and the owner's pay` : '')))));

        // revenue
        const rev = [h('div', { class: 'card', id: 'by-item' }, h('h3', null, 'By service or product'), bars(r.byItem.slice(0, 12), r.moneyIn), r.byItem.length > 12 ? h('p', { class: 'note' }, `Top 12 of ${r.byItem.length}.`) : null)];
        if (r.byChannel.length) rev.push(h('div', { class: 'card', id: 'by-channel' }, h('h3', null, 'By how the customer found you'), h('p', { class: 'note' }, 'The lead source recorded on each sale.'), bars(r.byChannel, r.moneyIn)));
        s.push(h('section', { class: 'sec', id: 'revenue' }, h('h2', null, 'Where the money came from'), h('div', { class: 'grid2' }, rev)));

        // costs
        const cost = [h('div', { class: 'card', id: 'by-cost' }, h('h3', null, 'Every cost, biggest first'), r.spend.length ? bars(r.spend, r.moneyOut, true) : h('p', { class: 'note' }, 'Add a payroll file or bank statement to see costs.'))];
        if (r.people.length) cost.push(h('div', { class: 'card', id: 'payroll' }, h('h3', null, 'Payroll by person'), h('p', { class: 'note' }, 'Gross pay plus employer payroll taxes for the month. Tips paid through to staff are left out.'),
            table([['Person', p => who(p.name, p.role)], ['Hours', p => p.hasHours ? Math.round(p.hours).toLocaleString() : '—'], ['Cost', p => money(p.cost)]], r.people)));
        s.push(h('section', { class: 'sec', id: 'costs' }, h('h2', null, 'Where the money went'), h('div', { class: 'grid2' }, cost)));

        // decisions
        const dec = [];
        if (r.marketing.length) dec.push(h('div', { class: 'card', id: 'marketing' }, h('h3', null, 'Marketing: what came back for every $1'),
            h('p', { class: 'note' }, 'Revenue from customers who came through each channel, divided by what that channel cost. For deal sites, the cost is the share of list price the site keeps.'),
            table([['Channel', m => m.channel], ['Cost', m => money(m.cost)], ['Revenue', m => money(m.revenue)],
                ['Back per $1', m => m.perDollar == null ? '—' : money2(m.perDollar), m => m.perDollar == null ? '' : m.perDollar < 1 ? 'bad' : m.perDollar < 3 ? 'warn' : 'good'],
                ['New customers', m => m.newCustomers == null ? '—' : String(m.newCustomers)],
                ['Cost per new customer', m => m.costPerNew == null ? '—' : money(m.costPerNew), m => r.adCostPerNew && m.costPerNew > 2 * r.adCostPerNew ? 'bad' : '']], r.marketing),
            r.adCostPerNew != null ? h('p', { class: 'note' }, `Across all paid ads, one new customer cost ${money(r.adCostPerNew)}. In total, ${r.newCustomers} new customers came in this month.`) : null));
        else if (r.newCustomers != null) dec.push(h('div', { class: 'card' }, h('h3', null, 'New customers'), h('p', null, `${r.newCustomers} new customers this month. Add an ad-spend file to see what each one cost.`)));
        const providers = r.people.filter(p => p.revenue > 0);
        if (providers.length) dec.push(h('div', { class: 'card', id: 'team' }, h('h3', null, 'Team: revenue against what each person costs'),
            h('p', { class: 'note' }, 'Sales recorded under each person, divided by their full payroll cost. Below $2 usually means their pay is not covering their share of rent and overhead.'),
            table([['Person', p => who(p.name, p.role)], ['Revenue', p => money(p.revenue)], ['Cost', p => money(p.cost)],
                ['Back per $1', p => money2(p.perDollar), p => p.perDollar < 2 ? 'bad' : p.perDollar < 3 ? 'warn' : 'good']],
            [...providers].sort((a, b) => b.perDollar - a.perDollar)),
            r.people.length > providers.length ? h('p', { class: 'note' }, `${r.people.filter(p => !p.revenue).map(p => p.name).join(', ')} had no sales under their name (support roles), so they are not compared here.`) : null));
        else if (r.people.length) dec.push(h('div', { class: 'card' }, h('p', { class: 'note' }, 'Sales aren\'t linked to staff names, so revenue per person can\'t be shown. Pick the staff column under Sales > Columns.')));
        if (dec.length) s.push(h('section', { class: 'sec', id: 'decisions' }, h('h2', null, "What's paying off"), dec));

        // taxes
        s.push(h('section', { class: 'sec', id: 'taxes' }, h('h2', null, 'Set aside for taxes'), h('div', { class: 'card' },
            h('div', { class: 'tax' }, h('span', { class: 'big' }, money(r.tax)), h('span', null, `${$('taxRate').value}% of what's left (${money(Math.max(0, r.left))})`)),
            h('p', { class: 'note' }, 'Move this to a separate savings account now. It is an estimate: the real amount depends on the business structure, state taxes and deductions not in these files.'))));

        // leak
        if (r.leak) s.push(h('section', { class: 'sec', id: 'leak' }, h('div', { class: 'leak' },
            h('span', { class: 'lbl' }, 'Biggest leak this month'), h('h2', null, r.leak.title),
            h('p', null, h('span', { class: 'amt' }, money(r.leak.amount)), ' ', r.leak.measure),
            h('p', null, r.leak.why), h('p', { class: 'act' }, h('b', null, 'This month: '), r.leak.action))));
        else s.push(h('section', { class: 'sec', id: 'leak' }, h('div', { class: 'card' }, h('h3', null, 'No clear leak'), h('p', { class: 'note' }, 'Nothing stands out in these files. Add payroll and ad-spend files for a fuller check.'))));

        // checks
        const items = r.checks.map(c => h('li', { class: c.level }, h('b', null, c.title + '. '), h('span', null, c.text)))
            .concat(r.notes.map(n => h('li', null, h('span', null, n))));
        if (items.length) s.push(h('section', { class: 'sec', id: 'checks' }, h('h2', null, 'What was checked, and what to confirm'), h('div', { class: 'card' }, h('ul', { class: 'checks' }, items))));

        s.push(h('p', { class: 'foot' }, `Built from ${r.counts.sales.toLocaleString()} sales rows${use.payroll ? ', payroll' : ''}${use.bank ? ', bank statement' : ''}${use.ads ? ', ad spend' : ''}. Made with CazoLabAI.`));
        out.replaceChildren(h('div', { class: 'report' }, s));
    }

    // ---------- wiring ----------
    const st = loadSettings();
    if (st.name) $('bizName').value = st.name;
    if (st.brand) $('brandColor').value = st.brand;
    if (st.accent) $('accentColor').value = st.accent;
    if (st.tax) $('taxRate').value = st.tax;
    if (st.logo) logoData = st.logo;
    applyColors();
    ['bizName', 'taxRate'].forEach(id => $(id).addEventListener('input', () => { saveSettings(); render(); }));
    ['brandColor', 'accentColor'].forEach(id => $(id).addEventListener('input', () => { applyColors(); saveSettings(); }));
    $('logo').addEventListener('change', () => {
        const f = $('logo').files[0]; if (!f) return;
        if (f.size > 400000) { alert('Please use a logo under 400 KB.'); $('logo').value = ''; return; }
        const rd = new FileReader(); rd.onload = () => { logoData = rd.result; saveSettings(); render(); }; rd.readAsDataURL(f);
    });
    $('sample').addEventListener('click', async () => {
        const btn = $('sample'); btn.disabled = true;
        try {
            for (const s of SLOTS) {
                const res = await fetch('samples/' + s.kind + '.csv');
                if (!res.ok) throw new Error(res.status);
                take(s.kind, 'sample ' + s.kind + '.csv', await res.text());
            }
            isSample = true;
            $('bizName').value = 'Juniper & Rose Aesthetics';
            $('brandColor').value = '#2f4a3f'; $('accentColor').value = '#b5615f';
            applyColors(); drawSlots(); render();
            $('out').scrollIntoView({ behavior: 'smooth' });
        } catch (e) { alert('The sample files could not be loaded. Check your connection and try again.'); }
        btn.disabled = false;
    });
    $('clear').addEventListener('click', () => { Object.keys(files).forEach(k => { files[k] = null; }); isSample = false; drawSlots(); render(); });
    $('print').addEventListener('click', () => window.print());
    drawSlots(); render();
})();
