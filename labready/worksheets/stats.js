/* LabReady Pro worksheet calculations. No DOM here, so the maths can be unit-tested
 * (stats.test.mjs). Every acceptance limit comes from the lab; nothing is built in.
 *
 * A limit is { abs, pct }: a result passes if |difference| <= the larger of
 * abs (in the analyte's units) and pct % of the reference value. Either may be blank.
 */
(function (root) {
    'use strict';

    const num = v => {
        if (typeof v === 'number') return Number.isFinite(v) ? v : null;
        const s = String(v == null ? '' : v).trim().replace(/,(?=\d{3}\b)/g, '');
        if (!/^[-+]?(\d+\.?\d*|\.\d+)(e[-+]?\d+)?$/i.test(s)) return null;
        return Number(s);
    };

    const sum = a => a.reduce((t, x) => t + x, 0);
    const mean = a => a.length ? sum(a) / a.length : NaN;
    function sd(a) {
        if (a.length < 2) return NaN;
        const m = mean(a);
        return Math.sqrt(sum(a.map(x => (x - m) ** 2)) / (a.length - 1));
    }

    // Two-sided 95% t critical values for df 1..30; beyond that a Cornish-Fisher step from z.
    const T95 = [12.706, 4.303, 3.182, 2.776, 2.571, 2.447, 2.365, 2.306, 2.262, 2.228, 2.201, 2.179, 2.160, 2.145, 2.131,
        2.120, 2.110, 2.101, 2.093, 2.086, 2.080, 2.074, 2.069, 2.064, 2.060, 2.056, 2.052, 2.048, 2.045, 2.042];
    function t95(df) {
        if (!(df >= 1)) return NaN;
        if (df <= 30) return T95[Math.floor(df) - 1];
        const z = 1.959964;
        return z + (z ** 3 + z) / (4 * df) + (5 * z ** 5 + 16 * z ** 3 + 3 * z) / (96 * df * df);
    }

    function hasLimit(limit) { return !!limit && ((limit.abs != null && limit.abs >= 0) || (limit.pct != null && limit.pct >= 0)); }
    function allowed(limit, ref) {
        const a = limit && limit.abs != null ? limit.abs : 0;
        const p = limit && limit.pct != null ? Math.abs(ref) * limit.pct / 100 : 0;
        return Math.max(a, p);
    }
    const within = (diff, limit, ref) => Math.abs(diff) <= allowed(limit, ref) + 1e-12;

    // Splits pasted text (Excel/Sheets tabs, CSV, semicolons or spaces) into rows of trimmed cells.
    function splitRows(text) {
        return String(text || '').replace(/^﻿/, '').split(/\r?\n/)
            .map(line => line.trim()).filter(Boolean)
            .map(line => (/\t/.test(line) ? line.split('\t') : /;/.test(line) ? line.split(';') : /,/.test(line) ? line.split(',') : line.split(/\s+/))
                .map(c => c.trim()));
    }

    /* Parses paired data: [id,] x, y. Returns { rows: [{id, x, y}], skipped: [{line, text, reason}] }.
     * A first line with no numbers is treated as a header. */
    function parsePairs(text) {
        const rows = [], skipped = [];
        splitRows(text).forEach((cells, i) => {
            const nums = cells.map(num);
            let id, x, y;
            if (cells.length >= 3 && nums[1] != null && nums[2] != null) { id = cells[0]; x = nums[1]; y = nums[2]; }
            else if (cells.length === 2 && nums[0] != null && nums[1] != null) { x = nums[0]; y = nums[1]; }
            else {
                if (!(i === 0 && nums.every(n => n == null))) skipped.push({ line: i + 1, text: cells.join('  '), reason: 'needs two numbers' });
                return;
            }
            rows.push({ id: id || String(rows.length + 1), x, y });
        });
        return { rows, skipped };
    }

    /* Parses AMR levels: [name,] assigned, rep1 [, rep2, rep3 …]. A non-numeric first cell is the level name. */
    function parseLevels(text) {
        const rows = [], skipped = [];
        splitRows(text).forEach((cells, i) => {
            let name = null, rest = cells;
            if (num(cells[0]) == null) { name = cells[0]; rest = cells.slice(1); }
            const vals = rest.filter(c => c !== '').map(num);
            if (vals.length < 2 || vals.some(v => v == null)) {
                if (!(i === 0 && cells.every(c => num(c) == null))) skipped.push({ line: i + 1, text: cells.join('  '), reason: 'needs an assigned value and at least one result' });
                return;
            }
            rows.push({ id: name || 'Level ' + (rows.length + 1), assigned: vals[0], reps: vals.slice(1) });
        });
        return { rows, skipped };
    }

    function ols(xs, ys) {
        const n = xs.length, mx = mean(xs), my = mean(ys);
        let sxx = 0, syy = 0, sxy = 0;
        for (let i = 0; i < n; i++) { sxx += (xs[i] - mx) ** 2; syy += (ys[i] - my) ** 2; sxy += (xs[i] - mx) * (ys[i] - my); }
        const slope = sxy / sxx, intercept = my - slope * mx;
        const r = sxy / Math.sqrt(sxx * syy);
        const resid = xs.map((x, i) => ys[i] - (intercept + slope * x));
        const syx = n > 2 ? Math.sqrt(sum(resid.map(e => e * e)) / (n - 2)) : NaN;
        return { slope, intercept, r, syx, sxx, syy, sxy, mx, my };
    }

    // Deming regression with equal error variances in both methods (lambda = 1).
    function deming(xs, ys) {
        const o = ols(xs, ys);
        if (o.sxy === 0) return { slope: NaN, intercept: NaN };
        const slope = (o.syy - o.sxx + Math.sqrt((o.syy - o.sxx) ** 2 + 4 * o.sxy ** 2)) / (2 * o.sxy);
        return { slope, intercept: o.my - slope * o.mx };
    }

    /* Lot-to-lot: x = current lot, y = new lot.
     * criteria: { limit, minPassPct, meanBiasPct } — minPassPct: share of samples that must be within limit;
     * meanBiasPct (optional): the mean % difference must not exceed it. */
    function lotToLot(rows, criteria) {
        criteria = criteria || {};
        const items = rows.map(r => {
            const diff = r.y - r.x;
            const pct = r.x !== 0 ? diff / r.x * 100 : null;
            return Object.assign({}, r, { diff, pct, allowed: hasLimit(criteria.limit) ? allowed(criteria.limit, r.x) : null,
                ok: hasLimit(criteria.limit) ? within(diff, criteria.limit, r.x) : null });
        });
        const diffs = items.map(i => i.diff), pcts = items.filter(i => i.pct != null).map(i => i.pct);
        const n = items.length, md = mean(diffs), s = sd(diffs);
        const half = n > 1 ? t95(n - 1) * s / Math.sqrt(n) : NaN;
        const summary = {
            n, meanDiff: md, sdDiff: s, ciLow: md - half, ciHigh: md + half,
            meanPct: mean(pcts), maxAbsPct: pcts.length ? Math.max(...pcts.map(Math.abs)) : NaN,
            passCount: items.filter(i => i.ok).length
        };
        summary.passPct = n ? summary.passCount / n * 100 : NaN;
        const checks = [];
        if (hasLimit(criteria.limit)) {
            const need = criteria.minPassPct != null ? criteria.minPassPct : 100;
            checks.push({ label: summary.passCount + ' of ' + n + ' samples within the allowable difference (need ' + need + '%)', ok: summary.passPct >= need - 1e-9 });
        }
        if (criteria.meanBiasPct != null) {
            checks.push({ label: 'Mean difference ' + fmt(summary.meanPct, 2) + '% (limit ±' + criteria.meanBiasPct + '%)', ok: Math.abs(summary.meanPct) <= criteria.meanBiasPct + 1e-9 });
        }
        return { items, summary, checks, verdict: verdict(checks, n, 2) };
    }

    /* Method comparison: x = comparative (current) method, y = candidate (new) method.
     * criteria: { limit, levels: [decision levels], model: 'deming' | 'ols' } — bias at each decision level is
     * predicted from the chosen regression and judged against limit. */
    function methodComparison(rows, criteria) {
        criteria = criteria || {};
        const xs = rows.map(r => r.x), ys = rows.map(r => r.y);
        const n = rows.length;
        const o = n >= 3 ? ols(xs, ys) : null;
        const d = n >= 3 ? deming(xs, ys) : null;
        const model = criteria.model === 'ols' ? 'ols' : 'deming';
        const fit = model === 'ols' ? o : d;
        const items = rows.map(r => Object.assign({}, r, { diff: r.y - r.x, pct: r.x !== 0 ? (r.y - r.x) / r.x * 100 : null }));
        const levels = (criteria.levels || []).filter(v => v != null && Number.isFinite(v)).map(level => {
            const predicted = fit ? fit.intercept + fit.slope * level : NaN;
            const bias = predicted - level;
            return {
                level, predicted, bias, biasPct: level !== 0 ? bias / level * 100 : null,
                allowed: hasLimit(criteria.limit) ? allowed(criteria.limit, level) : null,
                ok: hasLimit(criteria.limit) && fit ? within(bias, criteria.limit, level) : null
            };
        });
        const summary = {
            n, xMin: Math.min(...xs), xMax: Math.max(...xs),
            ols: o, deming: d, model,
            meanDiff: mean(items.map(i => i.diff)), sdDiff: sd(items.map(i => i.diff)),
            meanPct: mean(items.filter(i => i.pct != null).map(i => i.pct))
        };
        const checks = levels.filter(l => l.ok != null).map(l => ({
            label: 'Bias at ' + fmt(l.level) + ': ' + signed(l.bias, 3) + (l.biasPct != null ? ' (' + signed(l.biasPct, 1) + '%)' : '') + ', allowed ±' + fmt(l.allowed, 3),
            ok: l.ok
        }));
        const notes = [];
        if (o && o.r < 0.975) notes.push('r is below 0.975, so the data range is narrow for its scatter and the ordinary least-squares slope will be pulled towards zero. Deming regression is the better estimate here; widening the range of samples helps most.');
        if (n && levels.some(l => l.level < summary.xMin || l.level > summary.xMax)) notes.push('At least one decision level lies outside the range of the samples, so its bias is an extrapolation. Add samples near that level.');
        if (n && n < 20) notes.push('Fewer than 20 samples. Many labs use 20–40 spread across the measuring range; check your procedure.');
        return { items, levels, summary, checks, notes, verdict: verdict(checks, n, 3) };
    }

    /* AMR / calibration verification. Each level: assigned value and replicate results.
     * criteria: { limit } applied to (mean result - assigned) at each level. */
    function amr(rows, criteria) {
        criteria = criteria || {};
        const items = rows.slice().sort((a, b) => a.assigned - b.assigned).map(r => {
            const m = mean(r.reps), dev = m - r.assigned;
            return Object.assign({}, r, {
                mean: m, dev, devPct: r.assigned !== 0 ? dev / r.assigned * 100 : null,
                recovery: r.assigned !== 0 ? m / r.assigned * 100 : null,
                allowed: hasLimit(criteria.limit) ? allowed(criteria.limit, r.assigned) : null,
                ok: hasLimit(criteria.limit) ? within(dev, criteria.limit, r.assigned) : null
            });
        });
        const fit = items.length >= 3 ? ols(items.map(i => i.assigned), items.map(i => i.mean)) : null;
        const checks = items.filter(i => i.ok != null).map(i => ({
            label: i.id + ' (' + fmt(i.assigned) + '): mean ' + fmt(i.mean, 3) + ', deviation ' + signed(i.dev, 3) + ', allowed ±' + fmt(i.allowed, 3),
            ok: i.ok
        }));
        // The range counts as verified only when every level passes.
        let verified = null;
        if (items.length && items.every(i => i.ok === true)) verified = { low: items[0].assigned, high: items[items.length - 1].assigned };
        return { items, fit, checks, verified, verdict: verdict(checks, items.length, 3) };
    }

    function verdict(checks, n, minN) {
        if (n < minN) return { state: 'incomplete', text: 'Enter at least ' + minN + ' rows of data.' };
        if (!checks.length) return { state: 'incomplete', text: 'Enter your lab\'s acceptance criteria to judge the results.' };
        return checks.every(c => c.ok)
            ? { state: 'pass', text: 'Meets the acceptance criteria entered.' }
            : { state: 'fail', text: 'Does not meet the acceptance criteria entered. Investigate before putting this into use.' };
    }

    function fmt(v, dp) {
        if (v == null || !Number.isFinite(v)) return '—';
        if (dp == null) return String(+v.toPrecision(10));
        const a = Math.abs(v);
        const places = a >= 1000 ? Math.min(dp, 1) : a >= 100 ? Math.min(dp, 2) : dp;
        return v.toFixed(places);
    }
    const signed = (v, dp) => (v > 0 ? '+' : '') + fmt(v, dp);

    const api = { num, mean, sd, t95, allowed, within, hasLimit, splitRows, parsePairs, parseLevels, ols, deming, lotToLot, methodComparison, amr, fmt, signed };
    if (typeof module === 'object' && module.exports) module.exports = api;
    else root.LRStats = api;
})(this);
