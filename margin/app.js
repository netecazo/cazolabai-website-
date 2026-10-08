/* Margin: the app. Reads files in the browser, keeps businesses and months on this device,
 * and draws one page per month. File contents are only ever shown with textContent. */
(function () {
    'use strict';
    const B = window.BizDash, S = window.MarginStore;
    const $ = id => document.getElementById(id);
    const app = $('app'), sheet = $('sheet'), sheetBody = $('sheet-body');
    const KINDS = { sales: 'Sales', payroll: 'Payroll', bank: 'Bank statement', ads: 'Ad spend' };
    const LABELS = {
        date: 'Date', invoice: 'Invoice / order', item: 'Service / item', staff: 'Staff member', channel: 'Lead source',
        amount: 'Amount', tip: 'Tip', is_new: 'New customer?', customer: 'Customer', payment: 'Payment method',
        employee: 'Employee', role: 'Role', hours: 'Hours', gross: 'Gross pay', employer_tax: 'Employer taxes',
        description: 'Description', debit: 'Money out', credit: 'Money in', category: 'Category',
        spend: 'Spend', leads: 'Leads', fee_pct: 'Fee % (deal sites)',
    };
    const PALETTE = ['#1f4d45', '#1e3a5f', '#4b2e83', '#7a1f3d', '#8a4b14', '#2b2b2b', '#0f766e', '#9a3412'];
    const ACCENTS = ['#b5615f', '#c2410c', '#b8892d', '#be185d', '#0e7490', '#6d28d9', '#15803d', '#475569'];
    const reduce = matchMedia('(prefers-reduced-motion: reduce)').matches;

    const state = { businesses: [], biz: null, reports: [], report: null };

    // ---------- helpers ----------
    function h(tag, attrs, ...kids) {
        const el = document.createElement(tag);
        for (const [k, v] of Object.entries(attrs || {})) {
            if (v == null || v === false) continue;
            if (k === 'class') el.className = v;
            else if (k === 'style') el.style.cssText = v;
            else if (k.startsWith('on')) el.addEventListener(k.slice(2), v);
            else el.setAttribute(k, v === true ? '' : v);
        }
        kids.flat(Infinity).forEach(k => { if (k != null && k !== false) el.append(k instanceof Node ? k : String(k)); });
        return el;
    }
    const ICONS = {
        chev: '<path d="m7 8 3 3 3-3"/>',
        right: '<path d="m8 5 5 5-5 5"/>',
        plus: '<path d="M10 4v12M4 10h12"/>',
        more: '<circle cx="5" cy="10" r="1.3"/><circle cx="10" cy="10" r="1.3"/><circle cx="15" cy="10" r="1.3"/>',
        lock: '<rect x="4.5" y="9" width="11" height="8" rx="2"/><path d="M7 9V6.5a3 3 0 0 1 6 0V9"/>',
        upload: '<path d="M10 13V4M6 8l4-4 4 4M4 13v2.5A1.5 1.5 0 0 0 5.5 17h9a1.5 1.5 0 0 0 1.5-1.5V13"/>',
        home: '<path d="M3.5 9 10 3.5 16.5 9v7a1 1 0 0 1-1 1h-3v-5h-5v5h-3a1 1 0 0 1-1-1z"/>',
        in: '<path d="M10 3v14M4 11l6 6 6-6" transform="rotate(180 10 10)"/>',
        out: '<path d="M4 15h3v-4H4zM8.5 15h3V6h-3zM13 15h3V9h-3z"/>',
        bulb: '<path d="M3 15.5 8 10l3 3 6-7M13 6h4v4"/>',
        flag: '<path d="M5 17V3.5M5 4h9l-2 3.5 2 3.5H5"/>',
        edit: '<path d="M12.5 4.5 15.5 7.5 7 16H4v-3z"/>',
        pdf: '<path d="M6 3h6l4 4v10H6z"/><path d="M12 3v4h4M8.5 11h5M8.5 14h5"/>',
        trash: '<path d="M4 6h12M8 6V4h4v2M6 6l1 11h6l1-11"/>',
        check: '<path d="m5 10 3.5 3.5L15 7"/>',
        alert: '<path d="M10 6v5M10 14v.5"/>',
        info: '<path d="M10 9v5M10 6v.5"/>',
        swap: '<path d="M4 7h11l-3-3M16 13H5l3 3"/>',
        x: '<path d="m5 5 10 10M15 5 5 15"/>',
    };
    function icon(name) {
        const s = document.createElementNS('http://www.w3.org/2000/svg', 'svg');
        s.setAttribute('viewBox', '0 0 20 20'); s.setAttribute('fill', 'none'); s.setAttribute('stroke', 'currentColor');
        s.setAttribute('stroke-width', '1.6'); s.setAttribute('stroke-linecap', 'round'); s.setAttribute('stroke-linejoin', 'round');
        s.setAttribute('aria-hidden', 'true');
        s.innerHTML = ICONS[name]; // constant markup defined above, never user data
        return s;
    }
    const money = v => B.money(v), money2 = v => B.money2(v);
    const pct = v => Math.round(v * 100) + '%';
    const initials = n => (n || '?').split(/\s+/).filter(w => /\w/.test(w)).slice(0, 2).map(w => w[0].toUpperCase()).join('') || '?';
    const monthName = key => { if (!key) return 'Report'; const [y, m] = key.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'long', year: 'numeric' }); };
    const monthShort = key => { if (!key) return ''; const [y, m] = key.split('-'); return new Date(+y, +m - 1, 1).toLocaleDateString('en-US', { month: 'short' }); };
    let toastT;
    function toast(msg) { const t = $('toast'); t.textContent = msg; t.hidden = false; clearTimeout(toastT); toastT = setTimeout(() => { t.hidden = true; }, 3200); }

    function applyBrand(b) {
        const r = document.documentElement.style;
        r.setProperty('--brand', b ? b.brand : '#1f4d45');
        r.setProperty('--accent', b ? b.accent : '#b5615f');
    }
    function mono(b, cls) {
        return h('span', { class: 'mono' + (cls ? ' ' + cls : ''), style: `background:${b.brand}` }, b.logo ? h('img', { src: b.logo, alt: '' }) : initials(b.name));
    }
    function countUp(el, to, fmt) {
        if (reduce || !Number.isFinite(to)) { el.textContent = fmt(to); return; }
        const t0 = performance.now(), d = 900;
        const step = t => { const k = Math.min(1, (t - t0) / d); el.textContent = fmt(to * (1 - Math.pow(1 - k, 3))); if (k < 1) requestAnimationFrame(step); };
        el.textContent = fmt(0); requestAnimationFrame(step);
    }

    // ---------- data ----------
    function filesFor(report) {
        const out = {};
        for (const k of Object.keys(KINDS)) {
            const f = report.files[k];
            if (!f) { out[k] = null; continue; }
            const p = B.parseCSV(f.text);
            out[k] = B.missing(f.map, k).length ? null : { rows: p.rows, map: f.map };
        }
        return out;
    }
    function analyzeReport(report, biz) {
        try { return B.analyze(filesFor(report), { taxRate: (biz.taxRate == null ? 24 : biz.taxRate) / 100 }); }
        catch (e) { return null; }
    }

    async function boot() {
        state.businesses = await S.businesses();
        let last = null;
        try { last = localStorage.getItem('margin.last'); } catch (e) { /* storage blocked */ }
        const b = state.businesses.find(x => x.id === last) || state.businesses[0];
        if (b) await openBusiness(b.id); else renderWelcome();
    }
    async function openBusiness(id, reportId) {
        state.biz = state.businesses.find(b => b.id === id);
        try { localStorage.setItem('margin.last', id); } catch (e) { /* storage blocked */ }
        state.reports = await S.reports(id);
        state.report = state.reports.find(r => r.id === reportId) || state.reports[state.reports.length - 1] || null;
        applyBrand(state.biz);
        renderBusiness();
    }

    // ---------- welcome ----------
    function renderWelcome() {
        applyBrand(null);
        app.replaceChildren(h('main', { class: 'welcome' },
            h('div', { class: 'mark' }, h('img', { src: 'icons/icon.svg', alt: '' }), 'Margin'),
            h('h1', null, 'Know what’s ', h('em', null, 'left.')),
            h('p', { class: 'lead' }, 'Drop in a month of sales, payroll, bank and ad exports from any business. Margin turns them into one page an owner can read in two minutes, and names the one leak to fix this month.'),
            h('div', { class: 'preview-strip', 'aria-hidden': 'true' }, ['Money in, out, left', 'Return on every ad dollar', 'Revenue per employee', 'Tax set-aside', 'The biggest leak'].map(t => h('span', null, t))),
            h('div', { class: 'row' },
                h('button', { class: 'btn', onclick: () => openBusinessSheet() }, 'Add a business'),
                h('button', { class: 'btn quiet', onclick: loadSample }, 'Explore a sample')),
            h('p', { class: 'fine' }, icon('lock'), 'Files are read on this device and never uploaded.')));
    }

    // ---------- business page ----------
    function topbar() {
        const b = state.biz;
        const right = h('div', { class: 'actions-right', style: 'display:flex;gap:8px;align-items:center' });
        if (state.reports.length) {
            const sel = h('select', { class: 'month', 'aria-label': 'Month', id: 'month', onchange: e => { state.report = state.reports.find(r => r.id === e.target.value); renderBusiness(); } },
                [...state.reports].reverse().map(r => h('option', { value: r.id }, monthShort(r.period) + ' ' + (r.period || '').slice(0, 4))));
            sel.value = state.report && state.report.id;
            right.append(sel);
        }
        right.append(h('button', { class: 'icon-btn', 'aria-label': 'Add a month', title: 'Add a month', onclick: () => openAddMonth() }, icon('plus')),
            h('button', { class: 'icon-btn', 'aria-label': 'More', title: 'More', onclick: openMenu }, icon('more')));
        return h('header', { class: 'topbar' }, h('div', { class: 'topbar-in' },
            h('button', { class: 'switcher', onclick: openSwitcher, 'aria-label': 'Switch business' }, mono(b), h('span', { class: 'name' }, b.name), icon('chev')),
            h('nav', { class: 'topnav', 'aria-label': 'Sections' }, navLinks()),
            right));
    }
    const SECTIONS = [['overview', 'Overview', 'home'], ['revenue', 'Revenue', 'in'], ['costs', 'Costs', 'out'], ['returns', 'Returns', 'bulb'], ['fix', 'Fix', 'flag']];
    const navLinks = () => SECTIONS.map(([id, label, ic]) => h('a', { href: '#' + id, 'data-sec': id, onclick: e => { e.preventDefault(); document.getElementById(id).scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } }, icon(ic), h('span', null, label)));

    function renderBusiness() {
        const b = state.biz;
        if (!state.report) {
            app.replaceChildren(topbar(), h('main', { class: 'page' }, emptyBusiness()));
            return;
        }
        const r = analyzeReport(state.report, b);
        if (!r) {
            app.replaceChildren(topbar(), h('main', { class: 'page' }, h('div', { class: 'card' }, h('h3', null, 'This month could not be read'),
                h('p', { class: 'muted' }, 'One of the files may have changed shape. Add the month again with fresh exports.'),
                h('button', { class: 'btn quiet', onclick: () => openAddMonth() }, 'Add files'))));
            return;
        }
        const idx = state.reports.indexOf(state.report);
        const prevRep = idx > 0 ? state.reports[idx - 1] : null;
        const prev = prevRep ? analyzeReport(prevRep, b) : null;
        const page = h('main', { class: 'page reveal' },
            h('div', { class: 'print-head' }, mono(b, 'lg'), h('div', null, h('b', null, b.name), h('div', { class: 'muted small' }, monthName(state.report.period)))),
            overview(r, prev, prevRep), revenue(r), costs(r), returns(r), fix(r),
            h('p', { class: 'foot' }, `${b.name} · ${monthName(state.report.period)} · built from ${r.counts.sales.toLocaleString()} sales rows${Object.keys(state.report.files).filter(k => k !== 'sales').map(k => ', ' + KINDS[k].toLowerCase()).join('')}`));
        app.replaceChildren(topbar(), page, h('nav', { class: 'tabbar', 'aria-label': 'Sections' }, navLinks()));
        spy();
    }

    function spy() {
        const links = document.querySelectorAll('[data-sec]');
        const set = id => links.forEach(a => a.classList.toggle('on', a.dataset.sec === id));
        set('overview');
        const io = new IntersectionObserver(es => { es.forEach(e => { if (e.isIntersecting) set(e.target.id); }); }, { rootMargin: '-45% 0px -50% 0px' });
        SECTIONS.forEach(([id]) => { const el = document.getElementById(id); if (el) io.observe(el); });
    }

    function delta(now, before, goodWhenUp, label) {
        if (before == null || !before) return null;
        const d = (now - before) / Math.abs(before);
        if (!Number.isFinite(d)) return null;
        const up = d >= 0; const good = up === goodWhenUp;
        return h('span', { class: 'delta ' + (Math.abs(d) < 0.005 ? '' : good ? 'up' : 'down') }, (up ? '↑ ' : '↓ ') + Math.abs(Math.round(d * 100)) + '% vs ' + label);
    }

    function overview(r, prev, prevRep) {
        const pl = prevRep ? monthShort(prevRep.period) : '';
        const big = h('div', { class: 'big num' + (r.left < 0 ? ' neg' : '') });
        countUp(big, r.left, money);
        const kept = Math.max(0, Math.min(1, r.margin || 0));
        const C = 2 * Math.PI * 44;
        const val = h('circle');
        const ring = h('div', { class: 'ring', role: 'img', 'aria-label': `${pct(kept)} of money in was kept` });
        const svg = document.createElementNS('http://www.w3.org/2000/svg', 'svg'); svg.setAttribute('viewBox', '0 0 100 100');
        const mk = (stroke, off, cls) => { const c = document.createElementNS('http://www.w3.org/2000/svg', 'circle');
            Object.entries({ cx: 50, cy: 50, r: 44, fill: 'none', stroke, 'stroke-width': 8, 'stroke-linecap': 'round', 'stroke-dasharray': C, 'stroke-dashoffset': off }).forEach(([k, v]) => c.setAttribute(k, v));
            if (cls) c.setAttribute('class', cls); return c; };
        svg.append(mk('var(--track)', 0), mk('var(--brand)', reduce ? C * (1 - kept) : C, 'val'));
        ring.append(svg, h('div', { class: 'lab' }, h('div', null, h('b', null, pct(kept)), h('span', null, 'kept'))));
        if (!reduce) requestAnimationFrame(() => requestAnimationFrame(() => svg.querySelector('.val').setAttribute('stroke-dashoffset', C * (1 - kept))));

        let take = [];
        if (r.left >= 0) take.push('You kept ', h('b', null, money(r.left)), ' of the ', money(r.moneyIn), ' that came in.');
        else take.push('You spent ', h('b', null, money(-r.left)), ' more than came in.');
        if (r.tax > 0) take.push(' Set aside ', h('b', null, money(r.tax)), ' for taxes.');
        if (r.leak) take.push(' The one thing to fix: ', h('b', null, r.leak.title), '.');

        const inV = h('div', { class: 'v num' }), outV = h('div', { class: 'v num' });
        countUp(inV, r.moneyIn, money); countUp(outV, r.moneyOut, money);
        const outShare = r.moneyIn ? Math.min(1, r.moneyOut / r.moneyIn) : 1;

        const hero = h('div', { class: 'hero' },
            h('div', { class: 'hero-top' }, h('span', { class: 'eyebrow' }, 'What’s left · ' + monthName(state.report.period)), state.biz.sample ? h('span', { class: 'pill' }, 'Sample data') : null),
            h('div', { class: 'hero-figure' }, h('div', { style: 'display:grid;gap:10px' }, big, prev ? delta(r.left, prev.left, true, pl) : null), ring),
            h('p', { class: 'take' }, take),
            h('div', { class: 'flow' },
                h('div', { class: 'flow-bar', role: 'img', 'aria-label': `Money out is ${pct(outShare)} of money in` }, h('i', { class: 'out', style: `width:${outShare * 100}%` }), h('i', { class: 'left', style: `width:${(1 - outShare) * 100}%` })),
                h('div', { class: 'tiles' },
                    h('div', { class: 'tile' }, h('span', { class: 'k eyebrow' }, h('span', { class: 'dot', style: 'background:var(--brand)' }), 'Money in'), inV, prev ? delta(r.moneyIn, prev.moneyIn, true, pl) : h('span', { class: 'muted small' }, 'Sales after refunds')),
                    h('div', { class: 'tile' }, h('span', { class: 'k eyebrow' }, h('span', { class: 'dot', style: 'background:color-mix(in oklab, var(--ink) 22%, var(--surface))' }), 'Money out'), outV, prev ? delta(r.moneyOut, prev.moneyOut, false, pl) : h('span', { class: 'muted small' }, 'Payroll and every bill')))));

        const cards = [h('div', { class: 'card tax' }, h('span', { class: 'eyebrow' }, 'Set aside for taxes'), h('div', { class: 'v num' }, money(r.tax)),
            h('p', { class: 'muted small' }, `${state.biz.taxRate}% of what's left. Move it to a separate account now. Your accountant's figure may differ.`))];
        if (r.leak) cards.push(h('a', { class: 'card leak-peek', href: '#fix', onclick: e => { e.preventDefault(); $('fix').scrollIntoView({ behavior: reduce ? 'auto' : 'smooth' }); } },
            h('span', { class: 'eyebrow' }, 'Biggest leak · ' + r.leak.title), h('div', { class: 'v num' }, money(r.leak.amount)),
            h('p', { class: 'muted small' }, r.leak.measure.charAt(0).toUpperCase() + r.leak.measure.slice(1) + '.'), h('span', { class: 'go' }, 'See the fix', icon('right'))));
        return h('section', { class: 'sec', id: 'overview', 'aria-label': 'Overview' }, hero, h('div', { class: 'duo' }, cards));
    }

    function bars(rows, total, out, limit) {
        const max = Math.max(...rows.map(r => r.amount), 1);
        const draw = list => list.map((r, i) => h('div', { class: 'bar' },
            h('span', { class: 'n' }, r.name), h('span', { class: 'v num' }, money(r.amount), h('small', null, total ? pct(r.amount / total) : '')),
            h('span', { class: 'track' }, h('i', { style: `width:${Math.max(0, r.amount / max * 100)}%;animation-delay:${i * 40}ms` }))));
        const box = h('div', { class: 'bars' + (out ? ' out' : '') }, draw(rows.slice(0, limit || rows.length)));
        if (limit && rows.length > limit) {
            const more = h('button', { class: 'btn text more no-print', onclick: () => { box.replaceChildren(...draw(rows)); more.remove(); } }, `Show all ${rows.length}`);
            return [box, more];
        }
        return [box];
    }

    function revenue(r) {
        const cards = [h('div', { class: 'card' }, h('h3', null, 'By service or product'), bars(r.byItem, r.moneyIn, false, 8))];
        if (r.byChannel.length) cards.push(h('div', { class: 'card' }, h('h3', null, 'By how customers found you'), h('p', { class: 'sub' }, 'The lead source recorded on each sale'), bars(r.byChannel, r.moneyIn, false, 8)));
        return h('section', { class: 'sec', id: 'revenue' }, h('div', { class: 'sec-head' }, h('h2', null, 'Where it came from'), h('p', null, `${money(r.moneyIn)} in sales after refunds. Tips and gift cards are left out.`)), h('div', { class: 'grid' }, cards));
    }

    function costs(r) {
        const shades = r.spend.map((_, i) => `color-mix(in oklab, var(--accent) ${Math.max(18, 100 - i * 11)}%, var(--surface))`);
        const breakdown = h('div', { class: 'card' }, h('h3', null, 'Every cost, biggest first'),
            r.spend.length ? [
                h('div', { class: 'stack', role: 'img', 'aria-label': 'Share of money out by category' }, r.spend.map((s, i) => h('i', { style: `width:${s.amount / r.moneyOut * 100}%;background:${shades[i]}`, title: s.name }))),
                h('div', { class: 'legend' }, r.spend.map((s, i) => h('div', { class: 'row' }, h('span', { class: 'dot', style: `background:${shades[i]}` }), h('span', null, s.name), h('span', { class: 'p num' }, pct(s.amount / r.moneyOut)), h('span', { class: 'a num' }, money(s.amount)))))]
                : h('p', { class: 'muted' }, 'Add a payroll file or bank statement to see costs.'));
        const cards = [breakdown];
        if (r.people.length) cards.push(h('div', { class: 'card' }, h('h3', null, 'Payroll by person'), h('p', { class: 'sub' }, 'Gross pay plus employer taxes. Tips paid through to staff are left out.'),
            h('div', { class: 'list' }, r.people.map(p => h('div', { class: 'li' }, h('span', { class: 'avatar' }, initials(p.name)),
                h('div', null, h('div', { class: 't' }, p.name), h('div', { class: 's' }, [p.role, p.hasHours ? Math.round(p.hours) + ' hrs' : ''].filter(Boolean).join(' · '))),
                h('div', { class: 'r' }, h('span', { class: 'main num' }, money(p.cost)), h('span', { class: 's num' }, pct(p.cost / r.moneyOut) + ' of costs'))))),
            h('div', { class: 'li', style: 'border-top:1px solid var(--hair-2)' }, h('span'), h('b', null, 'Total payroll'), h('b', { class: 'num' }, money(r.payrollTotal)))));
        return h('section', { class: 'sec', id: 'costs' }, h('div', { class: 'sec-head' }, h('h2', null, 'Where it went'), h('p', null, `${money(r.moneyOut)} out. The owner's own pay is not counted as a cost.`)), h('div', { class: 'grid' }, cards));
    }

    function returns(r) {
        const cards = [];
        const kp = [];
        if (r.newCustomers != null) kp.push(h('div', { class: 'card kpi' }, h('span', { class: 'eyebrow' }, 'New customers'), h('div', { class: 'v num' }, String(r.newCustomers))));
        if (r.adCostPerNew != null) kp.push(h('div', { class: 'card kpi' }, h('span', { class: 'eyebrow' }, 'Cost per new customer'), h('div', { class: 'v num' }, money(r.adCostPerNew)), h('span', { class: 'muted small' }, 'Across paid ads')));
        if (kp.length) cards.push(h('div', { class: 'kpis', style: 'grid-column:1/-1' }, kp));
        if (r.marketing.length) {
            const grade = v => v == null ? '' : v < 1 ? 'bad' : v < 3 ? 'warn' : 'good';
            cards.push(h('div', { class: 'card' }, h('h3', null, 'Back for every $1 of marketing'), h('p', { class: 'sub' }, 'Revenue from customers each channel brought, divided by what it cost. For deal sites the cost is their cut.'),
                h('div', { class: 'list' }, r.marketing.map(m => h('div', { class: 'li' },
                    h('span', { class: 'score num ' + grade(m.perDollar) }, m.perDollar == null ? '—' : money2(m.perDollar)),
                    h('div', null, h('div', { class: 't' }, m.channel), h('div', { class: 's num' }, `${money(m.cost)} → ${money(m.revenue)}`)),
                    h('div', { class: 'r' }, m.costPerNew != null ? h('span', { class: 'main num' }, money(m.costPerNew)) : h('span', { class: 'main' }, '—'), h('span', { class: 's' }, m.newCustomers != null ? `per new customer (${m.newCustomers})` : 'per new customer')))))));
        }
        const providers = r.people.filter(p => p.revenue > 0).sort((a, b) => b.perDollar - a.perDollar);
        if (providers.length) {
            const max = Math.max(...providers.map(p => Math.max(p.revenue, p.cost)));
            const grade = v => v < 2 ? 'bad' : v < 3 ? 'warn' : 'good';
            const support = r.people.filter(p => !p.revenue);
            cards.push(h('div', { class: 'card' }, h('h3', null, 'Revenue against what each person costs'), h('p', { class: 'sub' }, 'Under $2 back usually means their pay isn’t covering their share of rent and overhead.'),
                h('div', { class: 'list' }, providers.map(p => h('div', { class: 'li' }, h('span', { class: 'avatar' }, initials(p.name)),
                    h('div', null, h('div', { class: 't' }, p.name), h('div', { class: 's num' }, `${money(p.revenue)} in · ${money(p.cost)} cost`),
                        h('div', { class: 'minibar', 'aria-hidden': 'true' }, h('span', { class: 'rv', style: `width:${p.revenue / max * 100}%` }), h('span', { class: 'cs', style: `width:${p.cost / max * 100}%` }))),
                    h('div', { class: 'r' }, h('span', { class: 'tag ' + grade(p.perDollar) + ' num' }, money2(p.perDollar)), h('span', { class: 's' }, 'per $1'))))),
                support.length ? h('p', { class: 'muted small' }, `${support.map(p => p.name).join(', ')} ${support.length > 1 ? 'have' : 'has'} no sales under their name (a support role), so ${support.length > 1 ? 'they are' : 'that person is'} left out of this comparison.`) : null));
        }
        if (!cards.length) cards.push(h('div', { class: 'card' }, h('p', { class: 'muted' }, 'Add an ad-spend file and a payroll file, and make sure sales carry a lead source and staff name, to see what’s paying off.')));
        return h('section', { class: 'sec', id: 'returns' }, h('div', { class: 'sec-head' }, h('h2', null, 'What’s paying off'), h('p', null, 'Where each dollar of marketing and payroll came back from.')), h('div', { class: 'grid' }, cards));
    }

    function fix(r) {
        const out = [];
        if (r.leak) out.push(h('div', { class: 'leak' },
            h('span', { class: 'eyebrow' }, 'The biggest leak this month'),
            h('h3', null, r.leak.title),
            h('div', null, h('span', { class: 'amt num' }, money(r.leak.amount)), h('span', { class: 'muted' }, ' ' + r.leak.measure)),
            h('p', null, r.leak.why),
            h('div', { class: 'action' }, h('b', null, 'Do this month'), h('p', null, r.leak.action))));
        else out.push(h('div', { class: 'card' }, h('h3', null, 'No clear leak'), h('p', { class: 'muted' }, 'Nothing stands out in these files. Add payroll and ad-spend files for a fuller check.')));
        const ic = { good: 'check', warn: 'alert', bad: 'alert' };
        const items = r.checks.map(c => h('li', { class: c.level }, h('span', { class: 'ic' }, icon(ic[c.level] || 'info')), h('div', null, h('b', null, c.title), c.text)))
            .concat(r.notes.map(n => h('li', null, h('span', { class: 'ic' }, icon('info')), h('div', null, n))));
        if (items.length) out.push(h('div', { class: 'card' }, h('h3', null, 'Checked against your files'), h('ul', { class: 'checks' }, items)));
        return h('section', { class: 'sec', id: 'fix' }, h('div', { class: 'sec-head' }, h('h2', null, 'Fix this month')), out);
    }

    function emptyBusiness() {
        const drop = h('div', { class: 'drop' },
            h('span', { class: 'glyph' }, icon('upload')),
            h('h2', null, 'Add your first month'),
            h('p', null, 'Drop all of this month’s exports at once. Margin works out which file is which.'),
            h('button', { class: 'btn brand', onclick: () => openAddMonth() }, 'Choose files'),
            h('div', { class: 'kinds' },
                h('div', null, h('b', null, 'Sales'), 'Required. Point-of-sale, booking or invoice export.'),
                h('div', null, h('b', null, 'Payroll'), 'Payroll register for the same month.'),
                h('div', null, h('b', null, 'Bank statement'), 'Business account, ideally with categories.'),
                h('div', null, h('b', null, 'Ad spend'), 'Channel and spend; fee_pct for deal sites.')));
        wireDrop(drop, files => openAddMonth(files));
        return drop;
    }
    function wireDrop(el, cb) {
        el.addEventListener('dragover', e => { e.preventDefault(); el.classList.add('over'); });
        el.addEventListener('dragleave', () => el.classList.remove('over'));
        el.addEventListener('drop', e => { e.preventDefault(); el.classList.remove('over'); if (e.dataTransfer.files.length) cb([...e.dataTransfer.files]); });
    }

    // ---------- sheets ----------
    function openSheet(title, ...content) {
        sheetBody.replaceChildren(h('div', { class: 'sheet-head' }, h('h2', { id: 'sheet-title' }, title),
            h('button', { class: 'icon-btn', 'aria-label': 'Close', onclick: closeSheet }, icon('x'))), ...content);
        if (!sheet.open) sheet.showModal();
    }
    function closeSheet() { if (sheet.open) sheet.close(); }
    sheet.addEventListener('click', e => { if (e.target === sheet) closeSheet(); });

    function openBusinessSheet(existing) {
        const b = existing ? { ...existing } : { name: '', brand: PALETTE[0], accent: ACCENTS[0], taxRate: 24, logo: null };
        const preview = () => { applyBrand(b); };
        const swatches = (list, keyName) => {
            const wrap = h('div', { class: 'swatches', role: 'group', 'aria-label': keyName === 'brand' ? 'Main colour' : 'Accent colour' });
            const draw = () => {
                wrap.replaceChildren(...list.map(c => h('button', { type: 'button', class: 'sw', style: `background:${c}`, 'aria-label': c, 'aria-pressed': String(b[keyName].toLowerCase() === c), onclick: () => { b[keyName] = c; draw(); preview(); } })),
                    h('span', { class: 'sw custom', 'aria-pressed': String(!list.includes(b[keyName].toLowerCase())), title: 'Custom colour' },
                        h('input', { type: 'color', value: b[keyName], 'aria-label': 'Custom colour', oninput: e => { b[keyName] = e.target.value; preview(); }, onchange: draw })));
            };
            draw(); return wrap;
        };
        const logoBox = h('span');
        const drawLogo = () => logoBox.replaceChildren(mono({ ...b, name: b.name || 'New' }, 'lg'));
        drawLogo();
        const name = h('input', { type: 'text', id: 'biz-name', placeholder: 'e.g. Harbor Street Barbers', value: b.name, autocomplete: 'organization', oninput: e => { b.name = e.target.value; drawLogo(); } });
        const tax = h('input', { type: 'number', id: 'biz-tax', min: '0', max: '60', step: '0.5', value: String(b.taxRate) });
        const save = async () => {
            b.name = name.value.trim();
            if (!b.name) { name.focus(); toast('Give the business a name.'); return; }
            b.taxRate = Math.max(0, Math.min(60, Number(tax.value) || 0));
            if (!existing) { b.id = S.uid(); b.createdAt = Date.now(); }
            await S.saveBusiness(b);
            state.businesses = await S.businesses();
            closeSheet();
            await openBusiness(b.id, state.report && state.report.id);
            if (!existing) toast('Business added. Now add its first month.');
        };
        openSheet(existing ? 'Edit business' : 'New business',
            h('div', { class: 'form' },
                h('label', { class: 'fl' }, 'Business name', name),
                h('div', { class: 'logo-pick' }, logoBox, h('label', null, 'Upload logo', h('input', { type: 'file', accept: 'image/*', onchange: e => {
                    const f = e.target.files[0]; if (!f) return;
                    if (f.size > 500000) { toast('Use a logo under 500 KB.'); return; }
                    const rd = new FileReader(); rd.onload = () => { b.logo = rd.result; drawLogo(); }; rd.readAsDataURL(f);
                } })), b.logo ? h('button', { type: 'button', class: 'btn text', onclick: e => { b.logo = null; drawLogo(); e.target.remove(); } }, 'Remove') : null),
                h('div', { class: 'fl' }, 'Main colour', swatches(PALETTE, 'brand')),
                h('div', { class: 'fl' }, 'Accent colour', swatches(ACCENTS, 'accent')),
                h('label', { class: 'fl' }, 'Tax set-aside rate (%)', tax)),
            h('div', { class: 'sheet-actions' },
                existing ? h('button', { class: 'btn danger', onclick: () => confirmDeleteBusiness(existing) }, 'Delete') : null,
                h('div', { class: 'grow' }, h('button', { class: 'btn quiet', onclick: () => { closeSheet(); applyBrand(state.biz); } }, 'Cancel'), h('button', { class: 'btn', onclick: save }, existing ? 'Save' : 'Add business'))));
        sheet.addEventListener('close', () => applyBrand(state.biz), { once: true });
    }

    function confirmDeleteBusiness(b) {
        openSheet('Delete ' + b.name + '?', h('p', { class: 'muted' }, `This removes ${b.name} and all its saved months from this device. Your original files are not affected.`),
            h('div', { class: 'sheet-actions' }, h('div', { class: 'grow' }, h('button', { class: 'btn quiet', onclick: closeSheet }, 'Keep it'),
                h('button', { class: 'btn', style: 'background:var(--bad);color:#fff', onclick: async () => {
                    await S.deleteBusiness(b.id); state.businesses = await S.businesses(); closeSheet();
                    if (state.businesses[0]) await openBusiness(state.businesses[0].id); else { state.biz = null; renderWelcome(); }
                    toast(b.name + ' deleted.');
                } }, 'Delete'))));
    }

    function openSwitcher() {
        openSheet('Businesses', h('div', { class: 'blist' },
            state.businesses.map(b => h('button', { class: 'bitem' + (state.biz && b.id === state.biz.id ? ' on' : ''), onclick: async () => { closeSheet(); await openBusiness(b.id); } },
                mono(b), h('div', null, h('div', { class: 't' }, b.name), h('div', { class: 's' }, b.sample ? 'Sample business' : 'Saved on this device')), h('span', { class: 'chev' }, icon('right')))),
            h('button', { class: 'bitem', onclick: () => openBusinessSheet() }, h('span', { class: 'mono', style: 'background:var(--track);color:var(--ink)' }, icon('plus')), h('div', null, h('div', { class: 't' }, 'Add a business'))),
            state.businesses.some(b => b.sample) ? null : h('button', { class: 'bitem', onclick: () => { closeSheet(); loadSample(); } }, h('span', { class: 'mono', style: 'background:var(--track);color:var(--ink)' }, icon('swap')), h('div', null, h('div', { class: 't' }, 'Add the sample business')))));
    }

    function openMenu() {
        const items = [
            ['edit', 'Edit business', () => openBusinessSheet(state.biz)],
            ['plus', 'Add a month', () => openAddMonth()],
        ];
        if (state.report) items.push(['pdf', 'Save as PDF', () => { closeSheet(); setTimeout(() => window.print(), 250); }],
            ['trash', 'Delete ' + monthName(state.report.period), async () => {
                await S.deleteReport(state.report.id); closeSheet(); toast(monthName(state.report.period) + ' deleted.'); await openBusiness(state.biz.id);
            }, true]);
        openSheet(state.biz.name, h('div', { class: 'menu' }, items.map(([ic, label, fn, danger]) => h('button', { class: danger ? 'danger' : null, onclick: fn }, icon(ic), label))));
    }

    // ---------- add a month ----------
    function openAddMonth(initial) {
        const pending = [];
        const list = h('div', { class: 'files' });
        const err = h('p', { class: 'small', style: 'color:var(--bad)', hidden: true });
        const build = h('button', { class: 'btn', disabled: true }, 'Build dashboard');

        const draw = () => {
            list.replaceChildren(...pending.map((f, i) => {
                const miss = f.kind ? B.missing(f.map, f.kind) : [];
                const kindSel = h('select', { 'aria-label': 'File type for ' + f.name, onchange: e => { f.kind = e.target.value || null; f.map = f.kind ? B.detectColumns(f.headers, f.kind) : {}; draw(); } },
                    h('option', { value: '' }, 'Not used'), Object.entries(KINDS).map(([k, l]) => h('option', { value: k }, l)));
                kindSel.value = f.kind || '';
                const det = f.kind ? h('details', null, h('summary', null, miss.length ? 'Pick the missing columns' : 'Columns'),
                    h('div', { class: 'colmap' }, Object.keys(B.FIELDS[f.kind]).map(field => {
                        const sel = h('select', { onchange: e => { f.map[field] = e.target.value || null; draw(); } }, h('option', { value: '' }, '(none)'), f.headers.map(x => h('option', { value: x }, x)));
                        sel.value = f.map[field] || ''; return h('label', null, LABELS[field] || field, sel);
                    }))) : null;
                if (det && miss.length) det.open = true;
                return h('div', { class: 'file' + (miss.length ? ' err' : '') },
                    h('div', { class: 'file-top' }, h('div', { style: 'min-width:0' }, h('div', { class: 'nm' }, f.name), h('div', { class: 'meta' }, `${f.rows.length.toLocaleString()} rows`)),
                        kindSel, h('button', { class: 'icon-btn', style: 'width:32px;height:32px', 'aria-label': 'Remove ' + f.name, onclick: () => { pending.splice(i, 1); draw(); } }, icon('x'))),
                    miss.length ? h('div', { class: 'warn-t' }, `Couldn't find ${miss.map(m => LABELS[m]).join(' and ')}.`) : null, det);
            }));
            const kinds = pending.filter(f => f.kind).map(f => f.kind);
            const dupe = Object.keys(KINDS).find(k => kinds.filter(x => x === k).length > 1);
            const bad = pending.some(f => f.kind && B.missing(f.map, f.kind).length);
            err.hidden = true;
            if (pending.length && !kinds.includes('sales')) { err.textContent = 'Add the sales export, or set which file is sales.'; err.hidden = false; }
            else if (dupe) { err.textContent = `Two files are set as ${KINDS[dupe].toLowerCase()}. Combine them into one, or set one to Not used.`; err.hidden = false; }
            build.disabled = !kinds.includes('sales') || !!dupe || bad;
        };
        const add = files => {
            let pendingReads = files.length;
            files.forEach(file => {
                if (!/\.(csv|txt)$/i.test(file.name) && file.type && !/csv|text/.test(file.type)) { toast(file.name + ' is not a CSV. Export it as CSV and try again.'); if (!--pendingReads) draw(); return; }
                const rd = new FileReader();
                rd.onload = () => {
                    const p = B.parseCSV(rd.result); const c = B.classify(p.headers);
                    pending.push({ name: file.name, text: rd.result, headers: p.headers, rows: p.rows, kind: c ? c.kind : null, map: c ? c.map : {} });
                    if (!--pendingReads) draw();
                };
                rd.onerror = () => { toast(file.name + ' could not be read.'); if (!--pendingReads) draw(); };
                rd.readAsText(file);
            });
        };
        const input = h('input', { type: 'file', accept: '.csv,text/csv', multiple: true, onchange: e => { add([...e.target.files]); e.target.value = ''; } });
        const picker = h('label', { class: 'picker' }, input, h('b', null, 'Choose CSV files'), h('span', null, 'Or drop them here. Sales is required; payroll, bank and ad spend add the rest.'));
        wireDrop(picker, add);
        build.addEventListener('click', async () => {
            const files = {};
            pending.filter(f => f.kind).forEach(f => { files[f.kind] = { name: f.name, text: f.text, map: f.map }; });
            const report = { id: S.uid(), businessId: state.biz.id, files, createdAt: Date.now() };
            const r = analyzeReport(report, state.biz);
            if (!r) { err.textContent = 'These files could not be read together. Check the sales file has amounts.'; err.hidden = false; return; }
            report.period = B.periodKey(r.period) || new Date().toISOString().slice(0, 7);
            const same = state.reports.find(x => x.period === report.period);
            if (same) { report.id = same.id; }
            await S.saveReport(report);
            closeSheet();
            await openBusiness(state.biz.id, report.id);
            toast(`${monthName(report.period)} ${same ? 'updated' : 'added'}.`);
        });
        openSheet('Add a month', picker, list, err, h('p', { class: 'muted small' }, 'If a month is already saved, it is replaced. Files stay on this device.'),
            h('div', { class: 'sheet-actions' }, h('div', { class: 'grow' }, h('button', { class: 'btn quiet', onclick: closeSheet }, 'Cancel'), build)));
        if (initial && initial.length) add(initial);
    }

    // ---------- sample ----------
    async function loadSample() {
        try {
            const months = [['2026-08', 'samples/2026-08/'], ['2026-09', 'samples/']];
            const biz = { id: S.uid(), name: 'Juniper & Rose Aesthetics', brand: '#1f4d45', accent: '#b5615f', taxRate: 24, logo: null, sample: true, createdAt: Date.now() };
            const reports = [];
            for (const [period, base] of months) {
                const files = {};
                for (const k of Object.keys(KINDS)) {
                    const res = await fetch(base + k + '.csv'); if (!res.ok) throw new Error(res.status);
                    const text = await res.text(); files[k] = { name: k + '.csv', text, map: B.detectColumns(B.parseCSV(text).headers, k) };
                }
                reports.push({ id: S.uid(), businessId: biz.id, period, files, createdAt: Date.now() });
            }
            await S.saveBusiness(biz);
            for (const r of reports) await S.saveReport(r);
            state.businesses = await S.businesses();
            await openBusiness(biz.id);
        } catch (e) { toast('The sample could not be loaded. Check your connection and try again.'); }
    }

    if ('serviceWorker' in navigator && location.protocol === 'https:') navigator.serviceWorker.register('sw.js').catch(() => {});
    boot();
})();
