// Run: node --test business-dashboard/engine.test.mjs
import test from 'node:test';
import assert from 'node:assert/strict';
import fs from 'node:fs';
import { createRequire } from 'node:module';
const B = createRequire(import.meta.url)('./engine.js');
const here = new URL('.', import.meta.url);
const load = (text, kind) => { const p = B.parseCSV(text); return { rows: p.rows, map: B.detectColumns(p.headers, kind) }; };
const sample = kind => load(fs.readFileSync(new URL(`samples/${kind}.csv`, here), 'utf8'), kind);

test('CSV parsing handles quotes, commas, CRLF and BOM', () => {
    const p = B.parseCSV('﻿name,amount\r\n"Smith, Jo","1,200.50"\r\n"Say ""hi""",(40)\r\n');
    assert.deepEqual(p.headers, ['name', 'amount']);
    assert.equal(p.rows[0].name, 'Smith, Jo');
    assert.equal(B.num(p.rows[0].amount), 1200.5);
    assert.equal(p.rows[1].name, 'Say "hi"');
    assert.equal(B.num(p.rows[1].amount), -40);
});

test('columns are detected from common export headers', () => {
    const m = B.detectColumns(['Order ID', 'Item Name', 'Net Sales', 'Team Member', 'Referral Source', 'Tender Type'], 'sales');
    assert.equal(m.invoice, 'Order ID'); assert.equal(m.item, 'Item Name'); assert.equal(m.amount, 'Net Sales');
    assert.equal(m.staff, 'Team Member'); assert.equal(m.channel, 'Referral Source'); assert.equal(m.payment, 'Tender Type');
    assert.deepEqual(B.missing(B.detectColumns(['Foo', 'Bar'], 'sales'), 'sales'), ['amount']);
});

test('bank lines sort into buckets by category, then description', () => {
    assert.equal(B.bucketOf('', 'OAKRIDGE PLAZA LEASE'), 'Rent');
    assert.equal(B.bucketOf('', 'GUSTO PAYROLL'), 'Payroll');
    assert.equal(B.bucketOf('Owner draw', 'TRANSFER TO SAVINGS'), 'Owner pay');
    assert.equal(B.bucketOf('', 'GOOGLE ADS'), 'Ads');
    assert.equal(B.bucketOf('Insurance', 'HISCOX'), 'Insurance');
    assert.equal(B.bucketOf('', 'MYSTERY VENDOR'), 'Other');
});

test('sample month: totals tie to the raw files', () => {
    const r = B.analyze({ sales: sample('sales'), payroll: sample('payroll'), bank: sample('bank'), ads: sample('ads') });
    assert.equal(r.moneyIn, 135512);           // duplicate and gift cards out, refund netted
    assert.equal(r.moneyOut, 92279);
    assert.equal(r.left, 43233);
    assert.equal(r.tax, 10375.92);             // 24%
    assert.equal(r.payrollTotal, 44132.22);
    assert.equal(r.spend.find(s => s.name === 'Card processing fees').amount, 3657.03);
    assert.equal(r.newCustomers, 199);
    const groupon = r.marketing.find(m => m.channel === 'Groupon');
    assert.equal(groupon.cost, 7370); assert.equal(groupon.perDollar, 0.82); assert.equal(groupon.costPerNew, 335);
    assert.equal(r.leak.title, 'Groupon');
    const titles = r.checks.map(c => c.title);
    for (const t of ['Possible double charge', 'Cash short', 'Payroll ties out', 'Gift cards left out', 'Refunds netted']) assert.ok(titles.includes(t), t);
});

test('a different business with different exports', () => {
    const sales = load([
        'Receipt,Day,Product,Coach,How Heard,Net Sales,Tender',
        'R1,2026-03-02,Monthly membership,Ana,Instagram,99,Card',
        'R2,2026-03-02,Personal training,Ana,Referral,240,Card',
        'R3,2026-03-03,Personal training,Ben,Instagram,240,Card',
        'R4,2026-03-04,Protein shake,,Walk-in,8,Cash',
        'R5,2026-03-05,Gift certificate,,Walk-in,100,Card',
    ].join('\n'), 'sales');
    const bank = load([
        'Posted Date,Payee,Withdrawals,Deposits',
        '2026-03-01,CITY PROPERTIES LEASE,3000,',
        '2026-03-05,STRIPE PAYOUT,,664.80',
        '2026-03-10,META ADS,150,',
        '2026-03-15,ADP PAYROLL,2000,',
        '2026-03-20,EQUIPMENT REPAIR CO,120,',
    ].join('\n'), 'bank');
    const payroll = load('Name,Title,Total Pay\nAna,Coach,1200\nBen,Coach,800', 'payroll');
    const ads = load('Platform,Cost\nInstagram,150', 'ads');
    const r = B.analyze({ sales, bank, payroll, ads }, { taxRate: 0.3 });
    assert.equal(r.moneyIn, 587);              // gift certificate held out
    assert.equal(r.spend.find(s => s.name === 'Rent').amount, 3000);
    assert.equal(r.spend.find(s => s.name === 'Payroll').amount, 2000);
    assert.equal(r.spend.find(s => s.name === 'Maintenance').amount, 120);
    assert.equal(r.spend.find(s => s.name === 'Card processing fees').amount, 14.2);
    assert.equal(r.tax, 0);                    // a loss: nothing to set aside
    const ig = r.marketing.find(m => m.channel === 'Instagram');
    assert.equal(ig.revenue, 339); assert.equal(ig.perDollar, 2.26); assert.equal(ig.newCustomers, null);
    assert.equal(r.people.find(p => p.name === 'Ana').revenue, 339);
    assert.ok(r.notes.some(n => /new-customer column/.test(n)));
    assert.ok(r.notes.some(n => /employer-tax column/.test(n)));
});

test('sales alone is enough', () => {
    const r = B.analyze({ sales: load('amount\n100\n50', 'sales') });
    assert.equal(r.moneyIn, 150); assert.equal(r.moneyOut, 0); assert.equal(r.leak, null);
});
