/* LabReady Pro study worksheets: lot-to-lot, method comparison, AMR / calibration verification.
 * Calculations live in stats.js. Drafts are kept in this browser (localStorage) until cleared.
 */
(function () {
    'use strict';
    const S = window.LRStats;
    const STORE = 'labready.worksheets.v1';
    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const f = S.fmt, sg = S.signed;

    // ---------------------------------------------------------------- worksheet definitions

    const COMMON_TOP = [
        ['analyte', 'Analyte', 'e.g. Glucose'],
        ['units', 'Units', 'e.g. mg/dL'],
        ['system', 'Instrument / test system', 'e.g. Cobas Pure 1 (c303)']
    ];
    const COMMON_BOTTOM = [
        ['performed_by', 'Performed by', ''],
        ['date', 'Date performed', '', 'date']
    ];

    const KINDS = {
        lot: {
            tab: 'Lot-to-lot',
            title: 'New reagent lot verification',
            intro: 'Run the same patient samples on the current and the new reagent lot, then paste the results. Use samples that span the measuring range, including near your medical decision levels.',
            fields: COMMON_TOP.concat([
                ['lot_current', 'Current lot number', ''],
                ['lot_new', 'New lot number', ''],
                ['qc_note', 'QC on the new lot', 'e.g. All levels within range on the new lot', 'text', true]
            ], COMMON_BOTTOM),
            dataHint: 'One sample per line: sample number, current-lot result, new-lot result. Paste straight from Excel or type with commas. The sample number is optional.',
            columns: ['Sample', 'Current lot', 'New lot'],
            extraCriteria: [
                ['minPassPct', 'Samples that must be within the limit (%)', '100'],
                ['meanBiasPct', 'Largest mean difference allowed (%, optional)', '']
            ],
            example: {
                fields: { analyte: 'Glucose', units: 'mg/dL', system: 'Cobas Pure 1 (c303)', lot_current: 'EXAMPLE-A', lot_new: 'EXAMPLE-B', qc_note: 'Example data only' },
                criteria: { abs: '4', pct: '5', minPassPct: '100', meanBiasPct: '' },
                data: 'Sample\tCurrent lot\tNew lot\nS1\t52\t53\nS2\t78\t80\nS3\t96\t99\nS4\t124\t127\nS5\t168\t172\nS6\t231\t238\nS7\t305\t313\nS8\t402\t414'
            }
        },
        method: {
            tab: 'Method comparison',
            title: 'Method comparison (correlation)',
            intro: 'Run the same samples on the comparative method (the one in use, or the reference) and the new method, then paste the results. Spread the samples across the measuring range.',
            fields: COMMON_TOP.concat([
                ['method_x', 'Comparative method (x)', 'e.g. ARCHITECT c4000'],
                ['method_y', 'New method (y)', 'e.g. Cobas Pure c303']
            ], COMMON_BOTTOM),
            dataHint: 'One sample per line: sample number, comparative-method result (x), new-method result (y). The sample number is optional.',
            columns: ['Sample', 'Comparative (x)', 'New (y)'],
            extraCriteria: [
                ['levels', 'Medical decision levels (comma-separated)', 'e.g. 70, 126, 200'],
                ['model', 'Regression used for bias', '', 'select', [['deming', 'Deming'], ['ols', 'Ordinary least squares']]]
            ],
            example: {
                fields: { analyte: 'Creatinine', units: 'mg/dL', system: 'Cobas Pure 1 (c303)', method_x: 'Current analyser', method_y: 'New analyser' },
                criteria: { abs: '0.1', pct: '7.5', levels: '1.0, 4.0', model: 'deming' },
                data: 'Sample\tx\ty\n' + [0.42, 0.58, 0.66, 0.74, 0.81, 0.89, 0.95, 1.02, 1.1, 1.24, 1.38, 1.55, 1.8, 2.12, 2.6, 3.15, 3.9, 4.8, 6.2, 8.4]
                    .map((x, i) => 'S' + (i + 1) + '\t' + x + '\t' + (x * 1.035 + 0.02 + ((i * 7) % 5 - 2) * 0.012).toFixed(2)).join('\n')
            }
        },
        amr: {
            tab: 'AMR / calibration verification',
            title: 'AMR and calibration verification',
            intro: 'Run material with known values at the low end, middle and high end of the measuring range (at least three levels), in replicate if your procedure asks for it, then paste the results.',
            fields: COMMON_TOP.concat([
                ['material', 'Material and lot', 'e.g. Linearity set, lot 12345']
            ], COMMON_BOTTOM),
            dataHint: 'One level per line: level name, assigned value, then each replicate result. The level name is optional.',
            columns: ['Level', 'Assigned', 'Results'],
            extraCriteria: [],
            example: {
                fields: { analyte: 'Calcium', units: 'mg/dL', system: 'Cobas Pure 1 (c303)', material: 'Example linearity set' },
                criteria: { abs: '0.2', pct: '3' },
                data: 'Level\tAssigned\tRep 1\tRep 2\nL1\t2.0\t2.1\t2.0\nL2\t6.0\t6.1\t5.9\nL3\t10.0\t10.2\t10.1\nL4\t14.0\t14.2\t14.3\nL5\t18.0\t18.1\t18.4'
            }
        }
    };

    // ---------------------------------------------------------------- state

    function loadAll() { try { return JSON.parse(localStorage.getItem(STORE) || '{}') || {}; } catch (e) { return {}; } }
    function saveAll(all) {
        if (linked) { scheduleSave(); return; }
        try { localStorage.setItem(STORE, JSON.stringify(all)); } catch (e) { /* private window: drafts not kept */ }
    }
    const blank = () => ({ fields: {}, criteria: {}, data: '', review: {} });
    let all = loadAll();
    let kind = null;
    const cur = () => (all[kind] = Object.assign(blank(), all[kind] || {}));

    // ---------------------------------------------------------------- saved to the app (?study=<id>)
    // Opened from the app's Studies tab, the worksheet saves to the lab (demo lab or Supabase) instead of this browser.

    const studyId = new URLSearchParams(location.search).get('study');
    let linked = null;           // { backend, record, labName, member }
    const R = window.LabReadyRecords;
    const SIGNERS = R.SIGNERS, ROLE_NAMES = R.ROLE_NAMES;
    let saver = null;
    function setSaveState(text, bad) {
        const el = $('#saveState');
        if (el) { el.textContent = text; el.classList.toggle('bad', !!bad); }
    }
    const scheduleSave = () => saver && saver.schedule();

    // ---------------------------------------------------------------- render

    function input(id, label, value, placeholder, type, full) {
        return '<div' + (full ? ' class="full"' : '') + '><label class="lbl" for="' + id + '">' + esc(label) + '</label>' +
            '<input type="' + (type || 'text') + '" id="' + id + '" value="' + esc(value || '') + '" placeholder="' + esc(placeholder || '') + '"></div>';
    }

    function render() {
        const K = KINDS[kind], d = cur();
        $$('.ws-tabs button').forEach(b => b.classList.toggle('active', b.dataset.kind === kind));
        $('#ws').innerHTML =
            '<div class="card"><h2>' + esc(K.title) + '</h2><p class="hint">' + esc(K.intro) + '</p>' +
            '<div class="field-grid">' + K.fields.map(([id, label, ph, type, full]) => input('f_' + id, label, d.fields[id], ph, type, full)).join('') + '</div></div>' +

            '<div class="card"><h2>Acceptance criteria</h2><p class="hint">Enter the limits from your laboratory\'s procedure. LabReady doesn\'t set them. A result passes when its difference is within the larger of the two limits, so a small absolute limit can cover the low end.</p>' +
            '<div class="field-grid">' +
            input('c_abs', 'Allowable difference, ± units', d.criteria.abs, 'e.g. 4') +
            input('c_pct', 'Allowable difference, ± %', d.criteria.pct, 'e.g. 5') +
            K.extraCriteria.map(([id, label, ph, type, opts]) => type === 'select'
                ? '<div><label class="lbl" for="c_' + id + '">' + esc(label) + '</label><select id="c_' + id + '">' +
                  opts.map(([v, t]) => '<option value="' + v + '"' + ((d.criteria[id] || opts[0][0]) === v ? ' selected' : '') + '>' + t + '</option>').join('') + '</select></div>'
                : input('c_' + id, label, d.criteria[id] != null ? d.criteria[id] : (id === 'minPassPct' ? '100' : ''), ph)).join('') +
            '</div></div>' +

            '<div class="card no-print"><div class="card-head"><h2>Data</h2><span><button class="btn ghost small" type="button" id="exampleBtn">Load example</button> ' +
            '<button class="btn ghost small" type="button" id="clearBtn">Clear worksheet</button></span></div>' +
            '<p class="hint">' + esc(K.dataHint) + ' Use sample numbers only, never patient names or record numbers.</p>' +
            '<textarea id="data" rows="9" spellcheck="false" placeholder="' + esc(K.columns.join('\t')) + '">' + esc(d.data) + '</textarea>' +
            '<div id="skipped"></div></div>' +

            '<div class="card" id="results"></div>' +

            '<div class="card"><h2>Review</h2><div class="field-grid">' +
            '<div><label class="lbl" for="r_decision">Decision</label><select id="r_decision"><option value=""></option>' +
            ['Accepted', 'Accepted with conditions (see comments)', 'Not accepted: investigate'].map(o => '<option' + (d.review.decision === o ? ' selected' : '') + '>' + o + '</option>').join('') + '</select></div>' +
            (linked ? '' : input('r_by', 'Reviewed by (director or designee)', d.review.by)) +
            '<div class="full"><label class="lbl" for="r_comments">Comments / corrective action</label><textarea id="r_comments" rows="3">' + esc(d.review.comments || '') + '</textarea></div>' +
            (linked ? '' : input('r_date', 'Review date', d.review.date, '', 'date')) +
            '</div>' + (linked ? signBlock() : '') +
            '<div class="sig print-only"><div>Performed by (signature / date)</div><div>' + (linked && linked.record.signoff ? 'Director / designee (signature)' : 'Reviewed by (signature / date)') + '</div></div></div>' +

            '<div class="actions no-print"><button class="btn primary" type="button" id="printBtn">Print record</button>' +
            '<button class="btn ghost" type="button" id="csvBtn">Download results (CSV)</button>' +
            (linked ? '<span class="saved-note" id="saveState">' + (linked.record.signoff ? 'Signed off and locked.' : 'Saved to ' + esc(linked.labName) + '.') + '</span>'
                : '<span class="saved-note">Drafts save in this browser as you type.</span>') + '</div>';

        if (linked) {
            const locked = !!linked.record.signoff;
            if (locked) $$('#ws input, #ws select, #ws textarea').forEach(el => { el.disabled = true; });
            $('#exampleBtn').hidden = locked;
            $('#clearBtn').hidden = true;
            const sb = $('#signBtn'), ub = $('#unsignBtn');
            if (sb) sb.onclick = async () => {
                collect(); compute();
                if (!cur().review.decision) { alert('Choose a decision before signing off.'); $('#r_decision').focus(); return; }
                await saver.settled();
                try { linked.record = await linked.backend.sign(linked.record.id, JSON.parse(JSON.stringify(cur())), last ? last.res.verdict.state : 'incomplete'); }
                catch (e) { alert(e.message); return; }
                saver.cancel();
                render();
            };
            if (ub) ub.onclick = async () => {
                if (!confirm('Remove the sign-off? The study unlocks for changes and will need signing again.')) return;
                try { linked.record = await linked.backend.unsign(linked.record.id); } catch (e) { alert(e.message); return; }
                render();
            };
        }

        $$('#ws input, #ws select, #ws textarea').forEach(el => el.addEventListener('input', () => { collect(); if (el.id === 'data' || el.id.startsWith('c_')) compute(); }));
        $('#exampleBtn').onclick = () => {
            const d0 = cur();
            if ((d0.data.trim() || Object.values(d0.fields).some(Boolean)) && !confirm('Replace what\'s on this worksheet with the example?')) return;
            const ex = KINDS[kind].example;
            all[kind] = Object.assign(blank(), { fields: Object.assign({}, d0.fields, ex.fields), criteria: Object.assign({}, ex.criteria), data: ex.data });
            saveAll(all); render();
        };
        $('#clearBtn').onclick = () => {
            if (!confirm('Clear this worksheet? This can\'t be undone.')) return;
            all[kind] = blank(); saveAll(all); render();
        };
        $('#printBtn').onclick = () => window.print();
        $('#csvBtn').onclick = downloadCsv;
        compute();
    }

    function signBlock() {
        const so = linked.record.signoff, me = linked.member, can = SIGNERS.includes(me.role);
        if (so) {
            return '<div class="signoff-box signed"><b>✓ Signed off by ' + esc(so.name) + '</b><span>' + esc(ROLE_NAMES[so.role] || so.role || '') + ' · ' +
                new Date(so.at).toLocaleString([], { dateStyle: 'medium', timeStyle: 'short' }) + '</span>' +
                (can ? '<button class="linkish no-print" type="button" id="unsignBtn">Remove sign-off</button>' : '') + '</div>';
        }
        return '<div class="signoff-box no-print">' + (can
            ? '<button class="btn" type="button" id="signBtn">Sign off as ' + esc(me.display_name) + '</button><span>Your name, role and the time are recorded, and the study locks.</span>'
            : '<span>A supervisor, director or admin signs off studies.</span>') + '</div>';
    }

    function collect() {
        if (linked && linked.record.signoff) return;
        const K = KINDS[kind], d = cur();
        K.fields.forEach(([id]) => { d.fields[id] = $('#f_' + id).value; });
        ['abs', 'pct'].concat(K.extraCriteria.map(c => c[0])).forEach(id => { d.criteria[id] = $('#c_' + id).value; });
        d.data = $('#data').value;
        d.review = linked
            ? { decision: $('#r_decision').value, comments: $('#r_comments').value }
            : { decision: $('#r_decision').value, by: $('#r_by').value, comments: $('#r_comments').value, date: $('#r_date').value };
        saveAll(all);
    }

    function criteria() {
        const c = cur().criteria;
        const limit = { abs: S.num(c.abs), pct: S.num(c.pct) };
        return {
            limit: S.hasLimit(limit) ? limit : null,
            minPassPct: S.num(c.minPassPct) != null ? S.num(c.minPassPct) : 100,
            meanBiasPct: S.num(c.meanBiasPct),
            levels: String(c.levels || '').split(/[,;\s]+/).map(S.num).filter(v => v != null),
            model: c.model || 'deming'
        };
    }

    let last = null;
    function compute() {
        const d = cur(), units = d.fields.units ? ' ' + d.fields.units : '';
        const parsed = kind === 'amr' ? S.parseLevels(d.data) : S.parsePairs(d.data);
        $('#skipped').innerHTML = parsed.skipped.length
            ? '<p class="skip-note">Skipped ' + parsed.skipped.length + ' line' + (parsed.skipped.length > 1 ? 's' : '') + ': ' +
              parsed.skipped.slice(0, 4).map(s => 'line ' + s.line + ' (' + esc(s.reason) + ')').join('; ') + (parsed.skipped.length > 4 ? '…' : '') + '</p>'
            : '';
        const c = criteria();
        const res = kind === 'lot' ? S.lotToLot(parsed.rows, c) : kind === 'method' ? S.methodComparison(parsed.rows, c) : S.amr(parsed.rows, c);
        last = { rows: parsed.rows, res };
        const el = $('#results');
        if (!parsed.rows.length) { el.innerHTML = '<h2>Results</h2><p class="muted">Paste your data above, or load the example to see how it works.</p>'; return; }

        const v = res.verdict;
        let html = '<h2>Results</h2><div class="verdict ' + v.state + '">' +
            '<span class="v-icon" aria-hidden="true">' + (v.state === 'pass' ? '✓' : v.state === 'fail' ? '!' : '…') + '</span><div><b>' +
            (v.state === 'pass' ? 'Meets criteria' : v.state === 'fail' ? 'Does not meet criteria' : 'Not yet judged') + '</b><span>' + esc(v.text) + '</span></div></div>';
        if (res.checks.length) html += '<ul class="checks">' + res.checks.map(ch => '<li class="' + (ch.ok ? 'ok' : 'bad') + '">' + (ch.ok ? '✓ ' : '✗ ') + esc(ch.label) + '</li>').join('') + '</ul>';

        if (kind === 'lot') {
            const s = res.summary;
            html += stats([['Samples', s.n], ['Mean difference', sg(s.meanDiff, 3) + units], ['Mean difference %', sg(s.meanPct, 2) + '%'],
                ['SD of differences', f(s.sdDiff, 3) + units], ['95% CI of mean difference', s.n > 1 ? f(s.ciLow, 3) + ' to ' + f(s.ciHigh, 3) : '—'], ['Largest difference', f(s.maxAbsPct, 2) + '%']]) +
                figure('Difference plot: new lot minus current lot, as a percentage of the current-lot result', 'chartA') +
                table(['Sample', 'Current lot', 'New lot', 'Difference', 'Difference %', 'Allowed ±', 'Result'],
                    res.items.map(i => [i.id, f(i.x), f(i.y), sg(i.diff, 3), i.pct == null ? '—' : sg(i.pct, 2) + '%', i.allowed == null ? '—' : f(i.allowed, 3), okCell(i.ok)]));
        } else if (kind === 'method') {
            const s = res.summary, o = s.ols, dm = s.deming;
            html += (s.n >= 3 ? stats([['Samples', s.n], ['Range of x', f(s.xMin) + ' to ' + f(s.xMax) + units], ['Correlation r', f(o.r, 4)],
                ['Deming', 'y = ' + f(dm.slope, 4) + 'x ' + (dm.intercept < 0 ? '− ' : '+ ') + f(Math.abs(dm.intercept), 4)],
                ['Least squares', 'y = ' + f(o.slope, 4) + 'x ' + (o.intercept < 0 ? '− ' : '+ ') + f(Math.abs(o.intercept), 4)],
                ['Mean difference (y − x)', sg(s.meanDiff, 3) + units + ' (' + sg(s.meanPct, 2) + '%)'], ['S y|x', f(o.syx, 4)]]) : '') +
                (res.notes.length ? '<div class="callout warn no-break">' + res.notes.map(n => '<p>' + esc(n) + '</p>').join('') + '</div>' : '') +
                (res.levels.length ? table(['Decision level', 'Predicted new-method result', 'Bias', 'Bias %', 'Allowed ±', 'Result'],
                    res.levels.map(l => [f(l.level), f(l.predicted, 3), sg(l.bias, 3), l.biasPct == null ? '—' : sg(l.biasPct, 2) + '%', l.allowed == null ? '—' : f(l.allowed, 3), okCell(l.ok)]), 'Bias at decision levels (' + (s.model === 'ols' ? 'least squares' : 'Deming') + ')') : '') +
                figure('Scatter plot: new method against comparative method', 'chartA') + figure('Difference plot: new minus comparative', 'chartB') +
                table(['Sample', 'Comparative (x)', 'New (y)', 'Difference', 'Difference %'],
                    res.items.map(i => [i.id, f(i.x), f(i.y), sg(i.diff, 3), i.pct == null ? '—' : sg(i.pct, 2) + '%']));
        } else {
            html += (res.fit ? stats([['Levels', res.items.length], ['Verified range', res.verified ? f(res.verified.low) + ' to ' + f(res.verified.high) + units : 'Not verified'],
                ['Slope (mean result vs assigned)', f(res.fit.slope, 4)], ['Intercept', f(res.fit.intercept, 4)], ['Correlation r', f(res.fit.r, 5)]]) : '') +
                figure('Deviation of each level\'s mean result from its assigned value, with the allowable limits', 'chartA') +
                table(['Level', 'Assigned', 'Results', 'Mean', 'Deviation', 'Recovery', 'Allowed ±', 'Result'],
                    res.items.map(i => [i.id, f(i.assigned), i.reps.map(r => f(r)).join(', '), f(i.mean, 3), sg(i.dev, 3), f(i.recovery, 1) + '%', i.allowed == null ? '—' : f(i.allowed, 3), okCell(i.ok)]));
        }
        el.innerHTML = html;
        drawCharts(res, parsed.rows, c);
    }

    const okCell = ok => ok == null ? '<span class="muted">—</span>' : ok ? '<span class="ok">Pass</span>' : '<span class="bad">Fail</span>';
    const stats = pairs => '<div class="stat-grid">' + pairs.map(([k, v]) => '<div><span>' + esc(k) + '</span><b>' + esc(v) + '</b></div>').join('') + '</div>';
    const figure = (caption, id) => '<figure class="chart no-break"><figcaption>' + esc(caption) + '</figcaption><div class="chart-legend" id="' + id + 'Legend"></div><div class="chart-box" id="' + id + '"></div></figure>';
    function table(head, rows, caption) {
        return '<div class="table-wrap"><table class="doc">' + (caption ? '<caption>' + esc(caption) + '</caption>' : '') +
            '<thead><tr>' + head.map(h => '<th>' + esc(h) + '</th>').join('') + '</tr></thead><tbody>' +
            rows.map(r => '<tr>' + r.map((c, i) => '<td' + (i ? ' class="num"' : '') + '>' + (String(c).startsWith('<span') ? c : esc(c)) + '</td>').join('') + '</tr>').join('') +
            '</tbody></table></div>';
    }

    // ---------------------------------------------------------------- charts (inline SVG)

    function niceTicks(lo, hi, count) {
        if (!(hi > lo)) { hi = lo + 1; lo = lo - 1; }
        const raw = (hi - lo) / count, mag = Math.pow(10, Math.floor(Math.log10(raw)));
        const step = [1, 2, 2.5, 5, 10].map(m => m * mag).find(s => s >= raw) || 10 * mag;
        const start = Math.floor(lo / step) * step, ticks = [];
        for (let v = start; v <= hi + step * 1e-9; v += step) ticks.push(+v.toPrecision(12));
        if (ticks[ticks.length - 1] < hi) ticks.push(+(ticks[ticks.length - 1] + step).toPrecision(12));
        return ticks;
    }

    /* spec: { xLabel, yLabel, points:[{x,y,tip}], lines:[{x1,y1,x2,y2,cls}], band:[[x,yLow,yHigh]...], zeroY, legend:[{cls,label}] } */
    function chart(id, spec) {
        const box = $('#' + id);
        if (!box) return;
        const W = 640, H = 340, m = { l: 62, r: 16, t: 12, b: 46 };
        const xs = spec.points.map(p => p.x), ys = spec.points.map(p => p.y);
        (spec.band || []).forEach(b => { ys.push(b[1], b[2]); });
        (spec.lines || []).forEach(l => { ys.push(l.y1, l.y2); });
        if (spec.zeroY) ys.push(0);
        let x0 = Math.min(...xs), x1 = Math.max(...xs), y0 = Math.min(...ys), y1 = Math.max(...ys);
        const padX = (x1 - x0) * 0.05 || 1, padY = (y1 - y0) * 0.06 || 1;
        const xt = niceTicks(spec.xFromZero ? Math.min(0, x0) : x0 - padX, x1 + padX, 6), yt = niceTicks(spec.yFromZero ? Math.min(0, y0) : y0 - padY, y1 + padY, 5);
        x0 = xt[0]; x1 = xt[xt.length - 1]; y0 = yt[0]; y1 = yt[yt.length - 1];
        const X = v => m.l + (v - x0) / (x1 - x0) * (W - m.l - m.r), Y = v => H - m.b - (v - y0) / (y1 - y0) * (H - m.t - m.b);
        const clipX = v => Math.max(x0, Math.min(x1, v));
        let svg = '<svg viewBox="0 0 ' + W + ' ' + H + '" role="img" aria-label="' + esc(spec.aria || '') + '"><defs><clipPath id="' + id + 'Clip"><rect x="' + m.l + '" y="' + m.t + '" width="' + (W - m.l - m.r) + '" height="' + (H - m.t - m.b) + '"/></clipPath></defs>';
        yt.forEach(v => { svg += '<line class="grid" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(v) + '" y2="' + Y(v) + '"/><text class="tick" x="' + (m.l - 8) + '" y="' + (Y(v) + 4) + '" text-anchor="end">' + f(v) + '</text>'; });
        xt.forEach(v => { svg += '<text class="tick" x="' + X(v) + '" y="' + (H - m.b + 18) + '" text-anchor="middle">' + f(v) + '</text>'; });
        svg += '<line class="axis" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + (H - m.b) + '" y2="' + (H - m.b) + '"/>';
        svg += '<text class="axis-label" x="' + ((m.l + W - m.r) / 2) + '" y="' + (H - 6) + '" text-anchor="middle">' + esc(spec.xLabel) + '</text>';
        svg += '<text class="axis-label" transform="translate(14 ' + ((m.t + H - m.b) / 2) + ') rotate(-90)" text-anchor="middle">' + esc(spec.yLabel) + '</text>';
        svg += '<g clip-path="url(#' + id + 'Clip)">';
        if (spec.band && spec.band.length) {
            const up = spec.band.map(b => X(b[0]) + ',' + Y(b[2])), dn = spec.band.slice().reverse().map(b => X(b[0]) + ',' + Y(b[1]));
            svg += '<polygon class="band" points="' + up.concat(dn).join(' ') + '"/>';
        }
        if (spec.zeroY && y0 < 0 && y1 > 0) svg += '<line class="ref" x1="' + m.l + '" x2="' + (W - m.r) + '" y1="' + Y(0) + '" y2="' + Y(0) + '"/>';
        (spec.lines || []).forEach(l => { svg += '<line class="' + l.cls + '" x1="' + X(clipX(l.x1)) + '" y1="' + Y(l.y1 + (clipX(l.x1) - l.x1) * l.slope) + '" x2="' + X(clipX(l.x2)) + '" y2="' + Y(l.y2 + (clipX(l.x2) - l.x2) * l.slope) + '"/>'; });
        spec.points.forEach(p => { svg += '<circle class="pt" cx="' + X(p.x) + '" cy="' + Y(p.y) + '" r="4.5"/>'; });
        svg += '</g></svg><div class="tip" hidden></div>';
        box.innerHTML = svg;
        $('#' + id + 'Legend').innerHTML = (spec.legend || []).map(l => '<span><i class="sw ' + l.cls + '"></i>' + esc(l.label) + '</span>').join('');

        // Hover: nearest point within reach, so small dots don't need pixel-perfect aim.
        const el = $('svg', box), tip = $('.tip', box);
        const pts = spec.points.map(p => ({ p, cx: X(p.x), cy: Y(p.y) }));
        const move = e => {
            const r = el.getBoundingClientRect(), sx = (e.clientX - r.left) * W / r.width, sy = (e.clientY - r.top) * H / r.height;
            let best = null, bd = 28 * 28;
            pts.forEach(q => { const dd = (q.cx - sx) ** 2 + (q.cy - sy) ** 2; if (dd < bd) { bd = dd; best = q; } });
            $$('.pt.on', el).forEach(c => c.classList.remove('on'));
            if (!best) { tip.hidden = true; return; }
            el.querySelectorAll('.pt')[pts.indexOf(best)].classList.add('on');
            tip.innerHTML = best.p.tip;
            tip.hidden = false;
            const left = best.cx / W * r.width, top = best.cy / H * r.height;
            tip.style.left = Math.min(Math.max(left, 70), r.width - 70) + 'px';
            tip.style.top = (top - 12) + 'px';
        };
        el.addEventListener('pointermove', move);
        el.addEventListener('pointerleave', () => { tip.hidden = true; $$('.pt.on', el).forEach(c => c.classList.remove('on')); });
    }

    function bandAround(lo, hi, centre, limit, asPct) {
        if (!limit) return null;
        const out = [];
        for (let k = 0; k <= 60; k++) {
            const x = lo + (hi - lo) * k / 60, a = S.allowed(limit, x), c = centre(x);
            if (asPct) { if (x === 0) continue; out.push([x, c - a / Math.abs(x) * 100, c + a / Math.abs(x) * 100]); }
            else out.push([x, c - a, c + a]);
        }
        return out;
    }

    function drawCharts(res, rows, c) {
        const units = cur().fields.units ? ' (' + cur().fields.units + ')' : '';
        const band = { cls: 'band', label: 'Allowable difference' };
        if (kind === 'lot') {
            const items = res.items.filter(i => i.pct != null);
            if (!items.length) return;
            const lo = Math.min(...items.map(i => i.x)), hi = Math.max(...items.map(i => i.x));
            const b = bandAround(Math.max(lo - (hi - lo) * 0.1, lo / 2), hi + (hi - lo) * 0.1, () => 0, c.limit, true);
            chart('chartA', {
                aria: 'Difference plot of new lot against current lot',
                xLabel: 'Current-lot result' + units, yLabel: 'Difference (%)', zeroY: true,
                points: items.map(i => ({ x: i.x, y: i.pct, tip: '<b>' + esc(i.id) + '</b>Current ' + f(i.x) + ', new ' + f(i.y) + '<br>' + sg(i.diff, 3) + ' (' + sg(i.pct, 2) + '%)' })),
                band: b, legend: [{ cls: 'pt', label: 'Samples' }].concat(b ? [band] : []).concat([{ cls: 'ref', label: 'No difference' }])
            });
        } else if (kind === 'method') {
            const s = res.summary;
            if (s.n < 3) return;
            const fit = s.model === 'ols' ? s.ols : s.deming, lo = s.xMin, hi = s.xMax, pad = (hi - lo) * 0.1;
            chart('chartA', {
                aria: 'Scatter plot of new method against comparative method',
                xLabel: 'Comparative method (x)' + units, yLabel: 'New method (y)' + units,
                points: res.items.map(i => ({ x: i.x, y: i.y, tip: '<b>' + esc(i.id) + '</b>x ' + f(i.x) + ', y ' + f(i.y) + '<br>y − x ' + sg(i.diff, 3) })),
                lines: [{ cls: 'ref', x1: lo - pad, y1: lo - pad, x2: hi + pad, y2: hi + pad, slope: 1 },
                    { cls: 'fit', x1: lo - pad, y1: fit.intercept + fit.slope * (lo - pad), x2: hi + pad, y2: fit.intercept + fit.slope * (hi + pad), slope: fit.slope }],
                legend: [{ cls: 'pt', label: 'Samples' }, { cls: 'fit', label: (s.model === 'ols' ? 'Least-squares' : 'Deming') + ' fit' }, { cls: 'ref', label: 'Line of identity (y = x)' }]
            });
            const b = bandAround(lo - pad, hi + pad, () => 0, c.limit, false);
            chart('chartB', {
                aria: 'Difference plot of new minus comparative method',
                xLabel: 'Comparative method (x)' + units, yLabel: 'New − comparative' + units, zeroY: true,
                points: res.items.map(i => ({ x: i.x, y: i.diff, tip: '<b>' + esc(i.id) + '</b>x ' + f(i.x) + ', y ' + f(i.y) + '<br>y − x ' + sg(i.diff, 3) + (i.pct != null ? ' (' + sg(i.pct, 2) + '%)' : '') })),
                band: b, legend: [{ cls: 'pt', label: 'Samples' }].concat(b ? [band] : []).concat([{ cls: 'ref', label: 'No difference' }])
            });
        } else {
            if (!res.items.length) return;
            const lo = res.items[0].assigned, hi = res.items[res.items.length - 1].assigned, pad = (hi - lo) * 0.06 || 1;
            const b = bandAround(lo - pad, hi + pad, () => 0, c.limit, false);
            chart('chartA', {
                aria: 'Deviation from assigned value at each level',
                xLabel: 'Assigned value' + units, yLabel: 'Mean result − assigned' + units, zeroY: true,
                points: res.items.map(i => ({ x: i.assigned, y: i.dev, tip: '<b>' + esc(i.id) + '</b>Assigned ' + f(i.assigned) + ', mean ' + f(i.mean, 3) + '<br>' + sg(i.dev, 3) + ' · recovery ' + f(i.recovery, 1) + '%' })),
                band: b,
                legend: [{ cls: 'pt', label: 'Level means' }].concat(b ? [band] : []).concat([{ cls: 'ref', label: 'Assigned value (no deviation)' }])
            });
        }
    }

    // ---------------------------------------------------------------- CSV

    function downloadCsv() {
        if (!last || !last.rows.length) { alert('There are no results to download yet.'); return; }
        const d = cur(), K = KINDS[kind], r = last.res;
        const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const lines = [[K.title], ...K.fields.map(([id, label]) => [label, d.fields[id] || '']),
            ['Allowable difference ± units', d.criteria.abs || ''], ['Allowable difference ± %', d.criteria.pct || ''], ['Verdict', r.verdict.text], []];
        if (kind === 'lot') {
            lines.push(['Sample', 'Current lot', 'New lot', 'Difference', 'Difference %', 'Allowed ±', 'Result']);
            r.items.forEach(i => lines.push([i.id, i.x, i.y, f(i.diff, 4), i.pct == null ? '' : f(i.pct, 3), i.allowed == null ? '' : f(i.allowed, 4), i.ok == null ? '' : i.ok ? 'Pass' : 'Fail']));
        } else if (kind === 'method') {
            const s = r.summary;
            if (s.ols) lines.push(['Deming slope', f(s.deming.slope, 5)], ['Deming intercept', f(s.deming.intercept, 5)], ['OLS slope', f(s.ols.slope, 5)], ['OLS intercept', f(s.ols.intercept, 5)], ['r', f(s.ols.r, 5)], []);
            r.levels.forEach(l => lines.push(['Decision level ' + f(l.level), 'bias ' + f(l.bias, 4), l.biasPct == null ? '' : f(l.biasPct, 3) + '%', l.ok == null ? '' : l.ok ? 'Pass' : 'Fail']));
            lines.push([], ['Sample', 'x', 'y', 'Difference', 'Difference %']);
            r.items.forEach(i => lines.push([i.id, i.x, i.y, f(i.diff, 4), i.pct == null ? '' : f(i.pct, 3)]));
        } else {
            lines.push(['Level', 'Assigned', 'Results', 'Mean', 'Deviation', 'Recovery %', 'Allowed ±', 'Result']);
            r.items.forEach(i => lines.push([i.id, i.assigned, i.reps.join(' / '), f(i.mean, 4), f(i.dev, 4), f(i.recovery, 2), i.allowed == null ? '' : f(i.allowed, 4), i.ok == null ? '' : i.ok ? 'Pass' : 'Fail']));
        }
        const blob = new Blob(['﻿' + lines.map(l => l.map(q).join(',')).join('\r\n')], { type: 'text/csv' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = ('labready-' + kind + '-' + (d.fields.analyte || 'worksheet') + '-' + (d.fields.date || new Date().toISOString().slice(0, 10))).replace(/[^\w.-]+/g, '-').toLowerCase() + '.csv';
        document.body.appendChild(a); a.click(); a.remove();
        setTimeout(() => URL.revokeObjectURL(a.href), 1000);
    }

    // ---------------------------------------------------------------- boot

    function route() {
        const k = location.hash.replace('#', '');
        kind = KINDS[k] ? k : 'lot';
        render();
    }
    async function openStudy() {
        const backend = R.backend();
        const back = '<a href="../app/#/studies">Back to studies</a>';
        let got;
        try { got = await backend.open(studyId); } catch (e) {
            $('#ws').innerHTML = '<div class="card"><h2>Couldn\'t open this study</h2><p>' + esc(e.message) + '</p><p>' + back + '</p></div>'; return;
        }
        if (got && got.signedOut) {
            $('#ws').innerHTML = '<div class="card"><h2>Sign in to open this study</h2><p>This study is saved to your lab. <a href="../app/">Sign in to LabReady Pro</a>, then open it from the Studies tab.</p></div>'; return;
        }
        if (!got) {
            $('#ws').innerHTML = '<div class="card"><h2>Study not found</h2><p>It may have been deleted, or it belongs to a lab you\'re not a member of.</p><p>' + back + '</p></div>'; return;
        }
        linked = Object.assign({ backend }, got);
        saver = R.autosaver(backend, () => linked.record, r => { linked.record = r; },
            () => ({ content: JSON.parse(JSON.stringify(cur())), verdict: last ? last.res.verdict.state : 'incomplete' }), setSaveState, linked.labName);
        kind = linked.record.kind;
        all = { [kind]: Object.assign(blank(), linked.record.content || {}) };
        $('#tabs').hidden = true;
        $('.page-head').innerHTML = '<span class="tag">Study · ' + esc(linked.labName) + (backend.mode === 'demo' ? ' (demo)' : '') + '</span>' +
            '<h1>' + esc(KINDS[kind].title) + '</h1><p>' + back + '</p>';
        render();
    }

    if (studyId) {
        openStudy();
    } else {
        $('#tabs').innerHTML = Object.keys(KINDS).map(k => '<button type="button" data-kind="' + k + '">' + esc(KINDS[k].tab) + '</button>').join('');
        $$('#tabs button').forEach(b => b.onclick = () => { if (location.hash !== '#' + b.dataset.kind) location.hash = b.dataset.kind; else route(); });
        window.addEventListener('hashchange', route);
        route();
    }
})();
