// Run: node --test labready/worksheets/stats.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import { createRequire } from 'node:module';
const S = createRequire(import.meta.url)('./stats.js');
const close = (a, b, tol = 1e-6) => assert.ok(Math.abs(a - b) <= tol, `${a} vs ${b}`);

test('number parsing', () => {
    assert.equal(S.num('4.25'), 4.25);
    assert.equal(S.num(' -0.5 '), -0.5);
    assert.equal(S.num('1,234.5'), 1234.5);
    assert.equal(S.num('<5'), null);
    assert.equal(S.num(''), null);
    assert.equal(S.num('abc'), null);
});

test('t critical values', () => {
    close(S.t95(1), 12.706); close(S.t95(10), 2.228); close(S.t95(30), 2.042);
    close(S.t95(40), 2.021, 0.002); close(S.t95(120), 1.980, 0.002);
});

test('allowable difference takes the larger of absolute and percent', () => {
    close(S.allowed({ abs: 0.2, pct: 5 }, 2), 0.2);
    close(S.allowed({ abs: 0.2, pct: 5 }, 10), 0.5);
    close(S.allowed({ pct: 10 }, -50), 5);
    assert.equal(S.within(0.5, { abs: 0.2, pct: 5 }, 10), true);
    assert.equal(S.within(0.51, { abs: 0.2, pct: 5 }, 10), false);
});

test('ordinary least squares matches a textbook example', () => {
    const o = S.ols([1, 2, 3, 4, 5], [2, 4, 5, 4, 5]);
    close(o.slope, 0.6); close(o.intercept, 2.2); close(o.r, 0.7745967, 1e-6);
});

test('Deming (lambda 1) equals the orthogonal fit from the covariance matrix', () => {
    const xs = [3.1, 4.8, 6.2, 7.9, 10.4, 12.2, 15.1, 18.7, 21.3, 25.0];
    const ys = [3.4, 4.6, 6.9, 8.1, 10.9, 12.0, 16.2, 19.1, 22.8, 25.9];
    const d = S.deming(xs, ys);
    const n = xs.length, mx = S.mean(xs), my = S.mean(ys);
    let a = 0, b = 0, c = 0;
    xs.forEach((x, i) => { a += (x - mx) ** 2; c += (ys[i] - my) ** 2; b += (x - mx) * (ys[i] - my); });
    // Largest eigenvector of [[a,b],[b,c]]
    const lambda = (a + c) / 2 + Math.sqrt(((a - c) / 2) ** 2 + b * b);
    close(d.slope, (lambda - a) / b, 1e-9);
    close(d.intercept, my - d.slope * mx, 1e-9);
    // Perfect proportional data gives the exact line
    const e = S.deming([1, 2, 3, 4], [2, 4, 6, 8]);
    close(e.slope, 2); close(e.intercept, 0);
});

test('parsePairs handles headers, IDs, tabs, commas and bad rows', () => {
    const p = S.parsePairs('Sample\tCurrent\tNew\nS1\t4.1\t4.2\nS2\t5.0\t5.3\n3.3,3.4\nbad row here\nS9\t<1\t2');
    assert.equal(p.rows.length, 3);
    assert.deepEqual(p.rows[0], { id: 'S1', x: 4.1, y: 4.2 });
    assert.equal(p.rows[2].id, '3');
    assert.equal(p.skipped.length, 2);
});

test('parseLevels reads names, assigned values and replicates', () => {
    const p = S.parseLevels('Level\tAssigned\tRep1\tRep2\nL1\t10\t9.8\t10.1\nL2 50 49 51 50\n200\t198');
    assert.equal(p.rows.length, 3);
    assert.deepEqual(p.rows[1], { id: 'L2', assigned: 50, reps: [49, 51, 50] });
    assert.equal(p.rows[2].id, 'Level 3');
});

test('lot-to-lot summary and verdict', () => {
    const rows = [{ x: 100, y: 102 }, { x: 50, y: 49 }, { x: 200, y: 212 }, { x: 10, y: 10.2 }, { x: 80, y: 81 }];
    const r = S.lotToLot(rows, { limit: { abs: 1, pct: 5 }, minPassPct: 100 });
    assert.equal(r.summary.passCount, 4); // 200 -> 212 is 6%
    assert.equal(r.verdict.state, 'fail');
    const r2 = S.lotToLot(rows, { limit: { abs: 1, pct: 5 }, minPassPct: 80 });
    assert.equal(r2.verdict.state, 'pass');
    close(r2.summary.meanDiff, (2 - 1 + 12 + 0.2 + 1) / 5);
    const none = S.lotToLot(rows, {});
    assert.equal(none.verdict.state, 'incomplete');
    const withMean = S.lotToLot(rows, { limit: { pct: 10 }, meanBiasPct: 1 });
    assert.equal(withMean.verdict.state, 'fail'); // mean % diff is about 1.6%
});

test('method comparison predicts bias at decision levels', () => {
    const xs = Array.from({ length: 20 }, (_, i) => 5 + i * 10);
    const rows = xs.map(x => ({ x, y: 1.05 * x + 2 }));
    const r = S.methodComparison(rows, { levels: [50, 150], limit: { pct: 10 }, model: 'deming' });
    close(r.summary.deming.slope, 1.05); close(r.summary.ols.intercept, 2);
    close(r.levels[0].bias, 0.05 * 50 + 2); // 4.5 = 9% of 50
    assert.equal(r.levels[0].ok, true);
    close(r.levels[1].biasPct, (0.05 * 150 + 2) / 150 * 100);
    assert.equal(r.verdict.state, 'pass');
    const strict = S.methodComparison(rows, { levels: [50], limit: { pct: 5 } });
    assert.equal(strict.verdict.state, 'fail');
    const out = S.methodComparison(rows, { levels: [1000], limit: { pct: 10 } });
    assert.ok(out.notes.some(n => /outside the range/.test(n)));
});

test('AMR recovery, pass/fail and verified range', () => {
    const rows = [{ id: 'H', assigned: 400, reps: [396, 404] }, { id: 'L', assigned: 5, reps: [5.2, 5.0] }, { id: 'M', assigned: 100, reps: [103, 101] }];
    const r = S.amr(rows, { limit: { abs: 0.5, pct: 3 } });
    assert.deepEqual(r.items.map(i => i.id), ['L', 'M', 'H']);
    close(r.items[1].recovery, 102);
    assert.equal(r.verdict.state, 'pass');
    assert.deepEqual(r.verified, { low: 5, high: 400 });
    const bad = S.amr(rows, { limit: { pct: 1 } });
    assert.equal(bad.verdict.state, 'fail');
    assert.equal(bad.verified, null);
});
