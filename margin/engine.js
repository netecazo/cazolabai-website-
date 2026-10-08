/* Business dashboard calculations. No DOM here, so the maths can be unit-tested
 * (engine.test.mjs). Works for any business: column names are detected from the
 * file headers and can be overridden, and nothing about the industry is built in.
 *
 * Inputs are four CSV exports for one period: sales (required), payroll, bank
 * statement and an ad-spend report (each optional).
 */
(function (root) {
    'use strict';

    const num = v => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : 0;
        let s = String(v == null ? '' : v).trim();
        const neg = /^\(.*\)$/.test(s);                 // accounting negatives: (120.00)
        s = s.replace(/[()$£€\s]/g, '').replace(/,/g, '');
        const n = Number(s);
        return Number.isFinite(n) ? (neg ? -Math.abs(n) : n) : 0;
    };
    const r2 = x => Math.round(x * 100) / 100;
    const sum = (a, f) => a.reduce((t, x) => t + f(x), 0);
    const key = s => String(s == null ? '' : s).trim().toLowerCase();

    // RFC 4180-ish CSV: quoted fields, doubled quotes, CRLF, BOM.
    function parseCSV(text) {
        text = String(text).replace(/^﻿/, '');
        const out = []; let row = []; let f = ''; let q = false;
        for (let i = 0; i < text.length; i++) {
            const c = text[i];
            if (q) {
                if (c === '"') { if (text[i + 1] === '"') { f += '"'; i++; } else q = false; }
                else f += c;
            } else if (c === '"') q = true;
            else if (c === ',') { row.push(f); f = ''; }
            else if (c === '\n' || c === '\r') {
                if (c === '\r' && text[i + 1] === '\n') i++;
                row.push(f); f = ''; if (row.some(x => x !== '')) out.push(row); row = [];
            } else f += c;
        }
        row.push(f); if (row.some(x => x !== '')) out.push(row);
        if (!out.length) return { headers: [], rows: [] };
        const headers = out[0].map(h => h.trim());
        const rows = out.slice(1).map(r => Object.fromEntries(headers.map((h, i) => [h, (r[i] || '').trim()])));
        return { headers, rows };
    }

    // Header names each field is recognised by, after lower-casing and squashing punctuation to "_".
    const FIELDS = {
        sales: {
            date: ['date', 'sale_date', 'order_date', 'transaction_date', 'created_at', 'day'],
            invoice: ['invoice', 'invoice_id', 'invoice_number', 'order', 'order_id', 'order_number', 'receipt', 'receipt_id', 'transaction_id', 'ticket', 'ticket_id', 'sale_id'],
            item: ['service', 'item', 'product', 'item_name', 'product_name', 'service_name', 'category', 'description'],
            staff: ['provider', 'staff', 'employee', 'stylist', 'technician', 'tech', 'server', 'rep', 'sales_rep', 'team_member', 'trainer', 'practitioner', 'coach', 'instructor', 'barber', 'artist', 'therapist', 'consultant', 'agent', 'doctor', 'dentist', 'hygienist', 'groomer', 'cashier', 'assigned_to', 'salesperson'],
            channel: ['lead_source', 'source', 'channel', 'referral_source', 'how_heard', 'marketing_source', 'utm_source', 'acquisition_channel'],
            amount: ['amount', 'net_sales', 'net_amount', 'total', 'price', 'revenue', 'sale_amount', 'subtotal', 'net', 'gross_sales'],
            tip: ['tip', 'tips', 'gratuity'],
            is_new: ['new_client', 'new_customer', 'first_visit', 'is_new', 'new'],
            customer: ['client_id', 'customer_id', 'client', 'customer', 'client_name', 'customer_name'],
            payment: ['payment_method', 'payment', 'tender', 'payment_type', 'tender_type'],
        },
        payroll: {
            employee: ['employee', 'employee_name', 'name', 'staff', 'worker', 'team_member'],
            role: ['role', 'title', 'job_title', 'position', 'department'],
            hours: ['hours', 'hours_worked', 'total_hours', 'regular_hours'],
            gross: ['gross_pay', 'gross', 'gross_wages', 'total_pay', 'wages', 'gross_earnings', 'total_gross'],
            employer_tax: ['employer_taxes', 'employer_tax', 'er_taxes', 'company_taxes', 'employer_contributions'],
        },
        bank: {
            date: ['date', 'posted_date', 'transaction_date', 'posting_date'],
            description: ['description', 'memo', 'payee', 'details', 'name', 'merchant', 'transaction'],
            amount: ['amount', 'net_amount', 'transaction_amount'],
            debit: ['debit', 'withdrawal', 'withdrawals', 'money_out', 'paid_out'],
            credit: ['credit', 'deposit', 'deposits', 'money_in', 'paid_in'],
            category: ['category', 'type', 'account', 'expense_category', 'class'],
        },
        ads: {
            channel: ['channel', 'platform', 'source', 'campaign', 'network'],
            spend: ['spend', 'cost', 'amount_spent', 'amount', 'ad_spend', 'budget_spent'],
            leads: ['leads', 'conversions', 'results', 'signups'],
            fee_pct: ['fee_pct', 'platform_fee_pct', 'commission_pct', 'fee_percent', 'commission'],
        },
    };
    const REQUIRED = { sales: ['amount'], payroll: ['employee', 'gross'], bank: ['description'], ads: ['channel', 'spend'] };

    const squash = h => key(h).replace(/[^a-z0-9]+/g, '_').replace(/^_|_$/g, '');
    function detectColumns(headers, kind) {
        const map = {}; const used = new Set();
        for (const [field, names] of Object.entries(FIELDS[kind])) {
            let hit = null;
            for (const n of names) {                       // exact match first, in priority order
                hit = headers.find(h => !used.has(h) && squash(h) === n);
                if (hit) break;
            }
            if (!hit) for (const n of names) {             // then "contains", for headers like "Net Sales ($)"
                hit = headers.find(h => !used.has(h) && n.length > 3 && squash(h).includes(n));
                if (hit) break;
            }
            map[field] = hit || null;
            if (hit) used.add(hit);
        }
        return map;
    }
    const missing = (map, kind) => REQUIRED[kind].filter(f => !map[f] && !(kind === 'bank' && f === 'amount'))
        .concat(kind === 'bank' && !map.amount && !(map.debit || map.credit) ? ['amount'] : []);

    const yes = v => /^(y|yes|true|1|new|first)$/i.test(String(v || '').trim());
    const isGiftCard = s => /gift\s*(card|cert)/i.test(s || '');
    const isCash = s => /^cash$/i.test(String(s || '').trim());

    // Bank lines sorted into the owner's buckets. Inflows and money moved to the owner are not costs.
    const BUCKETS = [
        ['Owner pay', /owner|draw|distribution|shareholder/],
        ['Transfer', /transfer|xfer|loan principal|credit card payment/],
        ['Payroll', /payroll|gusto|adp|paychex|wages|salar|rippling|tips? (payout|passthrough)/],
        ['Rent', /\brent\b|lease|landlord/],
        ['Ads', /advertis|marketing|\bads?\b|meta platforms|facebook|instagram|google ads|tiktok|yelp|groupon/],
        ['Software', /software|subscription|saas|quickbooks|xero|canva|adobe|workspace|zoom|slack|mailchimp|podium|boulevard|vagaro|mindbody|loom|shopify plan/],
        ['Maintenance', /maintenance|repair|janitor|cleaning|plumb|roto|hvac|service contract|pest/],
        ['Supplies', /suppl|inventory|product|cogs|restock|wholesale|materials|stock/],
    ];
    function bucketOf(category, description) {
        const c = key(category), d = key(description);
        for (const [name, re] of BUCKETS) if (re.test(c)) return name;
        for (const [name, re] of BUCKETS) if (re.test(d)) return name;
        return category ? String(category).trim() : 'Other';
    }
    const PROCESSOR = /square|stripe|clover|toast|shopify|paypal|heartland|merchant|card settlement|sumup|helcim/;

    // One period's numbers. files: {sales, payroll, bank, ads} each {rows, map} or null.
    function analyze(files, opts = {}) {
        const taxRate = opts.taxRate == null ? 0.24 : opts.taxRate;
        const notes = []; const checks = [];
        const S = files.sales; if (!S) throw new Error('A sales file is needed.');
        const sm = S.map; const g = (r, f) => (sm[f] ? r[sm[f]] : '');

        // --- sales: drop exact duplicate invoices, hold gift cards out of revenue
        const seen = new Map(); const dups = [];
        const all = S.rows.map(r => ({
            date: g(r, 'date'), invoice: g(r, 'invoice'), item: g(r, 'item') || 'Sales', staff: g(r, 'staff'),
            channel: g(r, 'channel') || 'Not recorded', amount: num(g(r, 'amount')), tip: num(g(r, 'tip')),
            isNew: sm.is_new ? yes(g(r, 'is_new')) : null, customer: g(r, 'customer'), payment: g(r, 'payment'),
        }));
        const kept = all.filter(r => {
            if (!r.invoice) return true;
            const prev = seen.get(r.invoice);
            if (prev && ['amount', 'tip', 'item', 'staff', 'date', 'customer'].every(k => prev[k] === r[k])) { dups.push(r); return false; }
            seen.set(r.invoice, r); return true;
        });
        const gift = kept.filter(r => isGiftCard(r.item));
        const sales = kept.filter(r => !isGiftCard(r.item));
        const refunds = sales.filter(r => r.amount < 0);
        const blank = sales.filter(r => r.channel === 'Not recorded');
        const moneyIn = r2(sum(sales, r => r.amount));
        const dates = all.map(r => r.date).filter(Boolean).sort();
        const period = dates.length ? { from: dates[0], to: dates[dates.length - 1] } : null;

        const group = (rows, f) => {
            const t = new Map(); rows.forEach(r => t.set(f(r), (t.get(f(r)) || 0) + r.amount));
            return [...t].map(([name, amount]) => ({ name, amount: r2(amount), share: moneyIn ? amount / moneyIn : 0 }))
                .sort((a, b) => b.amount - a.amount);
        };
        const byItem = group(sales, r => r.item);
        const byChannel = sm.channel ? group(sales, r => r.channel) : [];
        if (!sm.channel) notes.push('The sales file has no lead-source column, so revenue by channel and marketing returns can\'t be worked out.');

        if (dups.length) checks.push({ level: 'bad', title: 'Possible double charge', text: `${dups.length} sale${dups.length > 1 ? 's' : ''} appear${dups.length > 1 ? '' : 's'} twice with the same invoice number (${dups.map(d => d.invoice).slice(0, 3).join(', ')}), worth ${money(sum(dups, d => d.amount + d.tip))}. ${dups.length > 1 ? 'They are' : 'It is'} left out of revenue. Check whether the customer was charged twice and refund if so.`, amount: r2(sum(dups, d => d.amount + d.tip)) });
        if (blank.length && sm.channel) checks.push({ level: 'warn', title: 'Lead source missing', text: `${blank.length} sales worth ${money(sum(blank, r => r.amount))} have no lead source, so channel returns may be a little higher than shown.` });
        if (gift.length) checks.push({ level: 'info', title: 'Gift cards left out', text: `${money(sum(gift, r => r.amount))} of gift cards were sold. That is cash in, but it becomes revenue only when the card is used.` });
        if (refunds.length) checks.push({ level: 'info', title: 'Refunds netted', text: `${refunds.length} refund${refunds.length > 1 ? 's' : ''} totalling ${money(-sum(refunds, r => r.amount))} ${refunds.length > 1 ? 'are' : 'is'} subtracted from revenue.` });

        // --- payroll
        let people = []; let payrollTotal = null;
        if (files.payroll) {
            const pm = files.payroll.map; const t = new Map();
            files.payroll.rows.forEach(r => {
                const name = String(r[pm.employee] || '').trim(); if (!name) return;
                const e = t.get(key(name)) || { name, role: '', hours: 0, cost: 0 };
                e.role = e.role || (pm.role ? r[pm.role] : '');
                e.hours += pm.hours ? num(r[pm.hours]) : 0;
                e.cost += num(r[pm.gross]) + (pm.employer_tax ? num(r[pm.employer_tax]) : 0);
                t.set(key(name), e);
            });
            people = [...t.values()].map(e => {
                const revenue = r2(sum(sales.filter(s => key(s.staff) === key(e.name)), s => s.amount));
                return { ...e, cost: r2(e.cost), revenue, perDollar: e.cost ? r2(revenue / e.cost) : null, hasHours: !!pm.hours };
            }).sort((a, b) => b.cost - a.cost);
            payrollTotal = r2(sum(people, p => p.cost));
            if (!pm.employer_tax) notes.push('The payroll file has no employer-tax column, so payroll cost is gross pay only and is a little low.');
        }

        // --- bank
        let buckets = new Map(); let deposits = []; let bankPayroll = 0; let ownerPay = 0; let bankAds = 0;
        if (files.bank) {
            const bm = files.bank.map;
            files.bank.rows.forEach(r => {
                const desc = r[bm.description] || ''; const cat = bm.category ? r[bm.category] : '';
                let amt = bm.amount ? num(r[bm.amount]) : num(bm.credit ? r[bm.credit] : 0) - Math.abs(num(bm.debit ? r[bm.debit] : 0));
                if (amt > 0) { deposits.push({ desc, cat, amount: amt }); return; }
                if (amt === 0) return;
                const out = -amt; const b = bucketOf(cat, desc);
                if (b === 'Owner pay') { ownerPay += out; return; }
                if (b === 'Transfer') return;
                if (b === 'Payroll') { if (!/tip/i.test(desc + ' ' + cat)) bankPayroll += out; else return; }
                if (b === 'Ads') bankAds += out;
                buckets.set(b, (buckets.get(b) || 0) + out);
            });
        }
        // Payroll comes from the register when there is one: it splits by person and includes employer taxes.
        if (payrollTotal != null) buckets.set('Payroll', payrollTotal);
        if (payrollTotal != null && files.bank && bankPayroll) {
            const diff = r2(bankPayroll - payrollTotal);
            checks.push(Math.abs(diff) < 1
                ? { level: 'good', title: 'Payroll ties out', text: `The payroll register (${money(payrollTotal)}) matches what left the bank for payroll.` }
                : { level: 'warn', title: 'Payroll doesn\'t match the bank', text: `The payroll register says ${money(payrollTotal)}, but ${money(bankPayroll)} left the bank for payroll. A pay run may fall in another month, or a payroll fee is in the bank figure. I used the register.` });
        }

        // card fees: card sales minus what the processor deposited
        const cardSales = sum(all.filter(r => !isCash(r.payment)), r => r.amount + r.tip);
        const procDeposits = sum(deposits.filter(d => PROCESSOR.test(key(d.desc))), d => d.amount);
        let feeRate = null;
        if (files.bank && procDeposits > 0 && cardSales > 0) {
            const fees = cardSales - procDeposits; feeRate = fees / cardSales;
            if (feeRate >= 0 && feeRate < 0.1) {
                buckets.set('Card processing fees', (buckets.get('Card processing fees') || 0) + fees);
                checks.push({ level: feeRate > 0.035 ? 'warn' : 'good', title: 'Card fees', text: `Card deposits are ${(feeRate * 100).toFixed(1)}% below card sales${feeRate > 0.035 ? ', higher than the usual 2.6–3.0%. Ask the processor for better rates.' : ', a normal processing rate.'}` });
            } else { feeRate = null; notes.push('Card deposits don\'t line up with card sales closely enough to work out card fees, so they are not shown separately.'); }
        }
        if (sm.payment && files.bank) {
            const cashSales = sum(all.filter(r => isCash(r.payment)), r => r.amount + r.tip);
            const cashDep = sum(deposits.filter(d => /cash/.test(key(d.desc))), d => d.amount);
            if (cashSales > 0 && cashDep > 0 && cashSales - cashDep >= 1)
                checks.push({ level: 'warn', title: 'Cash short', text: `Cash sales were ${money(cashSales)}, but ${money(cashDep)} was deposited. Find out where the ${money(cashSales - cashDep)} went.`, amount: r2(cashSales - cashDep), kind: 'cash' });
        }
        if (ownerPay) notes.push(`${money(ownerPay)} paid to the owner (draws or distributions) is the owner's pay, not a business cost, so it is left out of money out.`);
        if (!files.bank) notes.push('No bank statement, so money out is payroll only. Add the bank statement to see rent, supplies and every other bill.');

        const spend = [...buckets].map(([name, amount]) => ({ name, amount: r2(amount) })).filter(b => b.amount > 0)
            .sort((a, b) => b.amount - a.amount);
        const moneyOut = r2(sum(spend, b => b.amount));
        const left = r2(moneyIn - moneyOut);

        // --- marketing
        let marketing = [];
        if (files.ads && sm.channel) {
            const am = files.ads.map;
            marketing = files.ads.rows.filter(r => r[am.channel]).map(r => {
                const ch = String(r[am.channel]).trim();
                const rows = sales.filter(s => key(s.channel) === key(ch));
                const revenue = r2(sum(rows, s => s.amount));
                const fee = am.fee_pct ? num(r[am.fee_pct]) : 0;
                const feeBased = num(r[am.spend]) === 0 && fee > 0 && fee < 100;
                const cost = r2(feeBased ? revenue * fee / (100 - fee) : num(r[am.spend]));
                const fresh = sm.is_new ? rows.filter(s => s.isNew).length : null;
                return { channel: ch, cost, revenue, feeBased, feePct: feeBased ? fee : null, listValue: feeBased ? r2(revenue + cost) : null,
                    perDollar: cost ? r2(revenue / cost) : null, newCustomers: fresh, costPerNew: fresh ? r2(cost / fresh) : null, matched: rows.length > 0 };
            }).sort((a, b) => (b.perDollar || 0) - (a.perDollar || 0));
            const unmatched = marketing.filter(m => !m.matched && m.cost > 0);
            if (unmatched.length) checks.push({ level: 'warn', title: 'Ad channel not found in sales', text: `${unmatched.map(m => m.channel).join(', ')} ${unmatched.length > 1 ? 'have' : 'has'} spend but no sales with that lead source. Check the channel names match between the two files.` });
            const reported = sum(marketing.filter(m => !m.feeBased), m => m.cost);
            if (files.bank && bankAds && Math.abs(bankAds - reported) >= 1)
                checks.push({ level: 'warn', title: 'Ad bills differ from the ads report', text: `The ads report says ${money(reported)}; the bank paid ${money(bankAds)} for ads. Billing dates often fall across months. Returns use the report; money out uses the bank.` });
        }
        const paid = marketing.filter(m => !m.feeBased && m.newCustomers);
        const adCostPerNew = paid.length ? r2(sum(paid, m => m.cost) / sum(paid, m => m.newCustomers)) : null;
        const newCustomers = sm.is_new ? sales.filter(r => r.isNew).length : null;
        if (!sm.is_new) notes.push('The sales file has no new-customer column, so cost per new customer can\'t be worked out.');

        // --- the single biggest leak, in dollars this period
        const leaks = [];
        const best = marketing.filter(m => m.costPerNew && m.newCustomers >= 5).sort((a, b) => a.costPerNew - b.costPerNew)[0];
        marketing.forEach(m => {
            let over = 0;
            if (best && m !== best && m.newCustomers) over = m.cost - m.newCustomers * best.costPerNew;
            else if (m.perDollar != null && m.perDollar < 1) over = m.cost - m.revenue;
            if (over > 0 && (m.perDollar < 3 || !best)) leaks.push({ kind: 'channel', amount: r2(over), m, best });
        });
        people.filter(p => p.revenue > 0 && p.perDollar < 2).forEach(p => leaks.push({ kind: 'staff', amount: r2(p.cost - p.revenue / 2), p }));
        checks.filter(c => c.kind === 'cash').forEach(c => leaks.push({ kind: 'cash', amount: c.amount }));
        if (dups.length) leaks.push({ kind: 'duplicate', amount: r2(sum(dups, d => d.amount + d.tip)) });
        if (feeRate != null && feeRate > 0.035) leaks.push({ kind: 'fees', amount: r2((feeRate - 0.029) * cardSales), rate: feeRate });
        leaks.sort((a, b) => b.amount - a.amount);

        return {
            period, moneyIn, moneyOut, left, margin: moneyIn ? left / moneyIn : null,
            tax: r2(Math.max(0, left) * taxRate), taxRate,
            byItem, byChannel, spend, people, payrollTotal, marketing, adCostPerNew, newCustomers,
            leak: leaks[0] ? describeLeak(leaks[0]) : null, checks, notes,
            counts: { sales: S.rows.length, used: sales.length },
        };
    }

    function describeLeak(l) {
        if (l.kind === 'channel') {
            const m = l.m, b = l.best;
            const why = `${m.channel} cost ${money(m.cost)}${m.feeBased ? ` (the ${m.feePct}% it keeps of the list price)` : ''} and brought back ${money(m.revenue)}, or ${money2(m.perDollar)} for every $1.`
                + (m.costPerNew && b ? ` Each new customer cost ${money(m.costPerNew)}, against ${money(b.costPerNew)} through ${b.channel}.` : '');
            const act = m.feeBased
                ? `Stop selling new ${m.channel} offers this month and honor the ones already sold. Put part of that budget into ${b ? b.channel : 'your best paid channel'}, and offer ${m.channel} customers a return-visit price so they rebook at full rate.`
                : `Cut ${m.channel} spend this month, or pause its weakest campaigns, and move that budget to ${b ? b.channel : 'your best channel'}.`;
            return { title: m.channel, amount: l.amount, measure: b ? `more than the same customers would have cost through ${b.channel}` : 'spent beyond what came back', why, action: act };
        }
        if (l.kind === 'staff') {
            const p = l.p;
            return { title: `${p.name}'s schedule`, amount: l.amount, measure: 'of pay not covered at 2x revenue',
                why: `${p.name} brought in ${money(p.revenue)} against a cost of ${money(p.cost)}, or ${money2(p.perDollar)} for every $1. Providers usually need at least $2 back to cover rent, product and overhead.`,
                action: `Fill ${p.name}'s open appointment slots first this month (rebooking calls, a waitlist), or trim paid hours that have no bookings.` };
        }
        if (l.kind === 'cash') return { title: 'Missing cash', amount: l.amount, measure: 'of cash sales not deposited',
            why: 'Cash rung up in the sales system did not all reach the bank.', action: 'Count the cash drawer against the sales system\'s cash report at every close, with two people signing off, and deposit daily.' };
        if (l.kind === 'duplicate') return { title: 'Double charges', amount: l.amount, measure: 'charged twice',
            why: 'The same invoice was rung up twice and both charges were deposited.', action: 'Refund the affected customers now, then turn on duplicate-sale warnings in the sales system.' };
        return { title: 'Card processing fees', amount: l.amount, measure: 'above a standard 2.9% rate',
            why: `Card fees are running at ${(l.rate * 100).toFixed(1)}% of card sales.`, action: 'Ask your processor for a rate review, or get a quote from a flat-rate processor and move if it is lower.' };
    }

    const money = v => (v < 0 ? '-' : '') + '$' + Math.round(Math.abs(v)).toLocaleString('en-US');
    const money2 = v => '$' + Number(v).toFixed(2);

    // Which export a file is, from its headers: the kind whose required columns are all there
    // and whose fields are best covered. Returns null when nothing fits.
    function classify(headers) {
        let best = null;
        for (const kind of Object.keys(FIELDS)) {
            const map = detectColumns(headers, kind);
            if (missing(map, kind).length) continue;
            const score = Object.values(map).filter(Boolean).length / Object.keys(FIELDS[kind]).length;
            if (!best || score > best.score) best = { kind, map, score };
        }
        return best;
    }

    // "2026-09" for the month the period starts in.
    function periodKey(period) {
        if (!period) return null;
        const m = /^(\d{4})-(\d{2})/.exec(period.from) || /^(\d{1,2})\/\d{1,2}\/(\d{4})/.exec(period.from);
        if (!m) return null;
        return m[1].length === 4 ? `${m[1]}-${m[2]}` : `${m[2]}-${m[1].padStart(2, '0')}`;
    }

    const api = { num, parseCSV, detectColumns, missing, classify, periodKey, bucketOf, analyze, FIELDS, money, money2 };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.BizDash = api;
})(typeof self !== 'undefined' ? self : this);
