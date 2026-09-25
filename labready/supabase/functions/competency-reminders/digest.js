// Builds the weekly competency reminder emails. Pure function, no I/O,
// so it runs the same in the Supabase Edge Function (Deno) and in tests (Node).

const KINDS = {
    'initial': 'Initial training',
    '6-month': '6-month',
    '12-month': '12-month',
    'annual': 'Annual',
    'retraining': 'Retraining'
};

const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));

function daysBetween(fromIso, toIso) {
    return Math.round((Date.parse(toIso + 'T00:00:00Z') - Date.parse(fromIso + 'T00:00:00Z')) / 86400000);
}

function fmt(iso) {
    const d = new Date(iso + 'T00:00:00Z');
    return d.toLocaleDateString('en-US', { day: 'numeric', month: 'short', year: 'numeric', timeZone: 'UTC' });
}

/**
 * @param {object} input
 * @param {string} input.today           YYYY-MM-DD
 * @param {number} [input.horizonDays]   default 30
 * @param {string} input.appUrl          link to the app
 * @param {Array}  input.labs            {id, name}
 * @param {Array}  input.members         {lab_id, role, email, display_name, email_reminders}
 * @param {Array}  input.staff           {id, lab_id, name, active}
 * @param {Array}  input.systems         {id, lab_id, name, instrument}
 * @param {Array}  input.competencies    {id, lab_id, staff_id, test_system_id, kind, due_date, completed_at}
 * @returns {Array<{labId, labName, to, subject, text, html, overdue, dueSoon}>}
 */
export function buildDigests(input) {
    const horizon = input.horizonDays == null ? 30 : input.horizonDays;
    const out = [];

    for (const lab of input.labs) {
        const to = input.members
            .filter(m => m.lab_id === lab.id && (m.role === 'admin' || m.role === 'supervisor') && m.email_reminders !== false && m.email)
            .map(m => m.email);
        if (!to.length) continue;

        const staff = new Map(input.staff.filter(s => s.lab_id === lab.id).map(s => [s.id, s]));
        const systems = new Map(input.systems.filter(s => s.lab_id === lab.id).map(s => [s.id, s]));

        const items = input.competencies
            .filter(c => c.lab_id === lab.id && !c.completed_at)
            .filter(c => { const st = staff.get(c.staff_id); return st && st.active !== false; })
            .map(c => ({ c, days: daysBetween(input.today, c.due_date), st: staff.get(c.staff_id), sy: systems.get(c.test_system_id) }))
            .filter(x => x.days <= horizon)
            .sort((a, b) => a.days - b.days || a.st.name.localeCompare(b.st.name));

        if (!items.length) continue;

        const overdue = items.filter(x => x.days < 0);
        const dueSoon = items.filter(x => x.days >= 0);
        const when = x => x.days < 0 ? `overdue ${-x.days} d` : x.days === 0 ? 'due today' : `due in ${x.days} d`;
        const line = x => `${x.st.name} · ${x.sy ? x.sy.name : 'Test system'} · ${KINDS[x.c.kind] || x.c.kind} · ${fmt(x.c.due_date)} (${when(x)})`;

        const parts = [];
        if (overdue.length) parts.push(`${overdue.length} overdue`);
        if (dueSoon.length) parts.push(`${dueSoon.length} due in the next ${horizon} days`);
        const subject = `LabReady: ${parts.join(', ')} · ${lab.name}`;

        const text = [
            `Competency status for ${lab.name}, week of ${fmt(input.today)}.`,
            '',
            ...(overdue.length ? ['OVERDUE', ...overdue.map(line), ''] : []),
            ...(dueSoon.length ? [`DUE IN THE NEXT ${horizon} DAYS`, ...dueSoon.map(line), ''] : []),
            `Open LabReady Pro: ${input.appUrl}`,
            '',
            'You get this because you are an admin or supervisor for this lab. Turn it off in LabReady Pro > Settings.'
        ].join('\n');

        const row = x => `<tr><td style="padding:6px 8px;border-bottom:1px solid #dde6ec"><b>${esc(x.st.name)}</b></td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #dde6ec">${esc(x.sy ? x.sy.name : '')}<br><span style="color:#5f7482;font-size:12px">${esc(x.sy ? x.sy.instrument : '')}</span></td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #dde6ec">${esc(KINDS[x.c.kind] || x.c.kind)}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #dde6ec;white-space:nowrap">${esc(fmt(x.c.due_date))}</td>` +
            `<td style="padding:6px 8px;border-bottom:1px solid #dde6ec;white-space:nowrap;color:${x.days < 0 ? '#b91c1c' : '#b45309'};font-weight:700">${esc(when(x))}</td></tr>`;
        const table = (title, rows) => rows.length
            ? `<h3 style="font-size:15px;margin:20px 0 6px">${esc(title)}</h3><table style="border-collapse:collapse;width:100%;font-size:14px">${rows.map(row).join('')}</table>`
            : '';

        const html = `<div style="font-family:-apple-system,Segoe UI,Roboto,sans-serif;color:#0b1f2e;max-width:640px">` +
            `<p style="font-size:15px">Competency status for <b>${esc(lab.name)}</b>, week of ${esc(fmt(input.today))}.</p>` +
            table('Overdue', overdue) + table(`Due in the next ${horizon} days`, dueSoon) +
            `<p style="margin:24px 0"><a href="${esc(input.appUrl)}" style="background:#0e7490;color:#fff;padding:10px 18px;border-radius:8px;text-decoration:none;font-weight:700">Open LabReady Pro</a></p>` +
            `<p style="color:#5f7482;font-size:12px">You get this because you are an admin or supervisor for this lab. Turn it off in LabReady Pro &gt; Settings.</p></div>`;

        out.push({ labId: lab.id, labName: lab.name, to, subject, text, html, overdue: overdue.length, dueSoon: dueSoon.length });
    }
    return out;
}
