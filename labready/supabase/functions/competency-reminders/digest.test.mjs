// Run: node --test labready/supabase/functions/competency-reminders/digest.test.mjs
import { test } from 'node:test';
import assert from 'node:assert/strict';
import { buildDigests } from './digest.js';

const base = () => ({
    today: '2026-09-28',
    appUrl: 'https://example.org/labready/app/',
    labs: [{ id: 'A', name: 'Lab A' }, { id: 'B', name: 'Lab B' }],
    members: [
        { lab_id: 'A', role: 'admin', email: 'admin@a.org' },
        { lab_id: 'A', role: 'supervisor', email: 'sup@a.org', email_reminders: false },
        { lab_id: 'A', role: 'assessor', email: 'assessor@a.org' },
        { lab_id: 'B', role: 'supervisor', email: 'sup@b.org' }
    ],
    staff: [
        { id: 's1', lab_id: 'A', name: 'Maria <script>', active: true },
        { id: 's2', lab_id: 'A', name: 'James', active: true },
        { id: 's3', lab_id: 'A', name: 'Gone', active: false },
        { id: 's4', lab_id: 'B', name: 'Bea', active: true }
    ],
    systems: [{ id: 't1', lab_id: 'A', name: 'Chem', instrument: 'c303' }, { id: 't2', lab_id: 'B', name: 'Chem B' }],
    competencies: [
        { id: 'c1', lab_id: 'A', staff_id: 's1', test_system_id: 't1', kind: 'annual', due_date: '2026-09-20', completed_at: null },   // overdue 8
        { id: 'c2', lab_id: 'A', staff_id: 's2', test_system_id: 't1', kind: '6-month', due_date: '2026-10-10', completed_at: null },  // due 12
        { id: 'c3', lab_id: 'A', staff_id: 's2', test_system_id: 't1', kind: 'annual', due_date: '2026-12-31', completed_at: null },   // beyond horizon
        { id: 'c4', lab_id: 'A', staff_id: 's2', test_system_id: 't1', kind: 'annual', due_date: '2026-09-01', completed_at: '2026-08-30' }, // done
        { id: 'c5', lab_id: 'A', staff_id: 's3', test_system_id: 't1', kind: 'annual', due_date: '2026-09-01', completed_at: null },   // inactive staff
        { id: 'c6', lab_id: 'B', staff_id: 's4', test_system_id: 't2', kind: 'annual', due_date: '2027-03-01', completed_at: null }    // nothing due
    ]
});

test('sends one digest per lab with something due, to opted-in admins and supervisors only', () => {
    const d = buildDigests(base());
    assert.equal(d.length, 1, 'Lab B has nothing due inside 30 days');
    assert.deepEqual(d[0].to, ['admin@a.org']);
    assert.equal(d[0].overdue, 1);
    assert.equal(d[0].dueSoon, 1);
    assert.equal(d[0].subject, 'LabReady: 1 overdue, 1 due in the next 30 days · Lab A');
});

test('excludes completed, out-of-horizon and inactive-staff records, and orders overdue first', () => {
    const [d] = buildDigests(base());
    assert.match(d.text, /OVERDUE\nMaria <script> · Chem · Annual · Sep 20, 2026 \(overdue 8 d\)/);
    assert.match(d.text, /DUE IN THE NEXT 30 DAYS\nJames · Chem · 6-month · Oct 10, 2026 \(due in 12 d\)/);
    assert.doesNotMatch(d.text, /Gone|Dec 31|Sep 1,/);
});

test('escapes names in the HTML version', () => {
    const [d] = buildDigests(base());
    assert.ok(d.html.includes('Maria &lt;script&gt;'));
    assert.ok(!d.html.includes('<script>'));
});

test('no recipients means no email, even with overdue work', () => {
    const input = base();
    input.members = input.members.filter(m => m.role === 'assessor');
    assert.equal(buildDigests(input).length, 0);
});

test('due today is labelled correctly', () => {
    const input = base();
    input.competencies = [{ id: 'x', lab_id: 'A', staff_id: 's2', test_system_id: 't1', kind: 'initial', due_date: '2026-09-28', completed_at: null }];
    const [d] = buildDigests(input);
    assert.match(d.text, /Initial training · Sep 28, 2026 \(due today\)/);
    assert.equal(d.subject, 'LabReady: 1 due in the next 30 days · Lab A');
});
