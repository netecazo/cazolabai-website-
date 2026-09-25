/* LabReady Pro app: competency tracking for clinical laboratories.
 * Two interchangeable backends share one interface:
 *   Demo — a seeded sample lab kept in this browser (localStorage)
 *   Live — Supabase with row-level security (see ../supabase-app-schema.sql)
 */
(function () {
    'use strict';

    // ---------------------------------------------------------------- constants

    const CFG = window.LABREADY_CONFIG || {};
    const LIVE_AVAILABLE = !!(CFG.supabaseUrl && CFG.supabaseAnonKey && window.supabase);
    const MODE_KEY = 'labready.app.mode';
    const DEMO_KEY = 'labready.app.demo.v1';

    const ELEMENTS = [
        { title: 'Direct observation of routine testing', sub: 'Including patient identification, specimen handling, processing and testing',
          hint: 'Observed running patient samples: ID check, specimen acceptability (HIL), loading, result review.' },
        { title: 'Monitoring recording and reporting of results', sub: 'Including critical values',
          hint: 'Reviewed 10 reported results and 2 critical value notifications for read-back and documentation.' },
        { title: 'Review of worksheets, QC, PT and maintenance records', sub: 'Intermediate results and records',
          hint: 'Reviewed 1 month of QC records, 1 QC failure investigation and maintenance logs.' },
        { title: 'Direct observation of maintenance and function checks', sub: 'Instrument maintenance',
          hint: 'Observed daily maintenance and startup function checks.' },
        { title: 'Testing previously analysed, blind or PT samples', sub: 'Performance on known samples',
          hint: '3 previously analysed samples within the lab\'s acceptable difference.' },
        { title: 'Assessment of problem-solving skills', sub: 'Cases, quizzes, troubleshooting',
          hint: 'LabReady Module 2 case (QC failure) and quiz score ___%.' }
    ];

    const KINDS = {
        'initial': 'Initial training',
        '6-month': '6-month (first year)',
        '12-month': '12-month (first year)',
        'annual': 'Annual',
        'retraining': 'Retraining'
    };
    const ROLES = { admin: 'Admin', supervisor: 'Supervisor', assessor: 'Assessor', director: 'Director' };
    const RESULTS = ['Satisfactory', 'Unsatisfactory', 'N/A'];
    const SIGNERS = [
        ['assessor', 'Assessor'],
        ['supervisor', 'Technical supervisor / consultant'],
        ['director', 'Laboratory director or designee']
    ];

    // ---------------------------------------------------------------- utilities

    const $ = (sel, root) => (root || document).querySelector(sel);
    const $$ = (sel, root) => Array.from((root || document).querySelectorAll(sel));
    const esc = s => String(s == null ? '' : s).replace(/[&<>"']/g, c => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c]));
    const clone = o => JSON.parse(JSON.stringify(o));
    const uid = () => (window.crypto && crypto.randomUUID) ? crypto.randomUUID() : 'id-' + Date.now().toString(36) + Math.random().toString(36).slice(2);

    function isoOf(d) {
        return d.getFullYear() + '-' + String(d.getMonth() + 1).padStart(2, '0') + '-' + String(d.getDate()).padStart(2, '0');
    }
    function parseIso(iso) { const [y, m, d] = iso.split('-').map(Number); return new Date(y, m - 1, d); }
    function todayIso() { return isoOf(new Date()); }
    function addDays(iso, n) { const d = parseIso(iso); d.setDate(d.getDate() + n); return isoOf(d); }
    function addMonths(iso, n) {
        const d = parseIso(iso);
        const target = new Date(d.getFullYear(), d.getMonth() + n, 1);
        const last = new Date(target.getFullYear(), target.getMonth() + 1, 0).getDate();
        target.setDate(Math.min(d.getDate(), last));
        return isoOf(target);
    }
    function daysUntil(iso) { return Math.round((parseIso(iso) - parseIso(todayIso())) / 86400000); }
    function fmtDate(iso) {
        if (!iso) return '';
        return parseIso(iso.slice(0, 10)).toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' });
    }
    function fmtStamp(ts) {
        if (!ts) return '';
        const d = new Date(ts);
        return d.toLocaleDateString(undefined, { day: 'numeric', month: 'short', year: 'numeric' }) + ' ' +
            d.toLocaleTimeString(undefined, { hour: '2-digit', minute: '2-digit' });
    }

    function toast(msg, bad) {
        const t = $('#toast');
        t.textContent = msg;
        t.classList.toggle('bad', !!bad);
        t.classList.add('show');
        clearTimeout(toast._t);
        toast._t = setTimeout(() => t.classList.remove('show'), 3200);
    }

    function download(filename, text, type) {
        const blob = new Blob([text], { type: type || 'text/plain' });
        const a = document.createElement('a');
        a.href = URL.createObjectURL(blob);
        a.download = filename;
        document.body.appendChild(a);
        a.click();
        setTimeout(() => { URL.revokeObjectURL(a.href); a.remove(); }, 0);
    }

    function emptyElements() { return ELEMENTS.map(() => ({ evidence: '', date: '', assessor: '', result: '' })); }

    function elementsDone(c) { return (c.elements || []).filter(e => e && e.result).length; }

    function compStatus(c) {
        if (c.completed_at) {
            return c.overall === 'not_competent'
                ? { key: 'not-competent', label: 'Not competent' }
                : { key: 'complete', label: 'Complete' };
        }
        const d = daysUntil(c.due_date);
        if (d < 0) return { key: 'overdue', label: 'Overdue ' + (-d) + ' d' };
        if (d <= 30) return { key: 'due', label: d === 0 ? 'Due today' : 'Due in ' + d + ' d' };
        return { key: 'scheduled', label: 'Scheduled' };
    }

    function progressBar(c) {
        const done = (c.elements || []).map(e => !!(e && e.result));
        return '<span class="progress" title="' + elementsDone(c) + ' of 6 methods recorded">' +
            ELEMENTS.map((_, i) => '<i class="' + (done[i] ? 'on' : '') + '"></i>').join('') + '</span>';
    }

    // Next assessment in the CLIA cycle: semiannual in the first year, annual after.
    function nextAssessment(c, staff) {
        const hire = staff && staff.hire_date;
        if (c.overall === 'not_competent') return { kind: 'retraining', due_date: addDays(todayIso(), 30) };
        if (c.kind === 'initial') return { kind: '6-month', due_date: hire ? addMonths(hire, 6) : addMonths(c.due_date, 6) };
        if (c.kind === '6-month') return { kind: '12-month', due_date: hire ? addMonths(hire, 12) : addMonths(c.due_date, 6) };
        if (c.kind === '12-month' || c.kind === 'annual') return { kind: 'annual', due_date: addMonths(c.due_date, 12) };
        return null;
    }

    // ---------------------------------------------------------------- demo backend

    function seedDemo() {
        const t = todayIso();
        const lab = { id: uid(), name: 'Demo Community Hospital · Core Lab Chemistry', created_at: new Date().toISOString() };
        const sys = [
            { name: 'General chemistry', instrument: 'Roche Cobas Pure c303 (Cobas Pure 1)', section: 'Chemistry' },
            { name: 'Immunoassay', instrument: 'Roche Cobas Pure e402 (Cobas Pure 1)', section: 'Chemistry' },
            { name: 'Backup chemistry', instrument: 'Abbott ARCHITECT c4000', section: 'Chemistry' }
        ].map(s => Object.assign({ id: uid(), lab_id: lab.id, active: true, created_at: lab.created_at }, s));

        const people = [
            ['Maria Alvarez', 'MLS(ASCP)', -2900], ['James Chen', 'MLS(ASCP)', -2100], ['Ruth Okafor', 'MLT(ASCP)', -150],
            ['Sanjay Patel', 'MLS(ASCP)', -4100], ['Dana Nguyen', 'MLS(ASCP)', -1600], ['Adam Kowalski', 'MLT(ASCP)', -900],
            ['Tanya Brooks', 'MLS(ASCP)', -3300], ['Leila Haddad', 'Lead MLS(ASCP)', -5200]
        ];
        const staff = people.map(([name, position, hireOffset]) => ({
            id: uid(), lab_id: lab.id, name, position, email: '', hire_date: addDays(t, hireOffset), active: true, created_at: lab.created_at
        }));

        const comps = [];
        const signed = (who, daysAgo) => ({ name: who, at: new Date(Date.now() - daysAgo * 86400000).toISOString(), user_id: 'demo-user' });
        const fullElements = daysAgo => ELEMENTS.map(e => ({ evidence: e.hint.replace('___', '92'), date: addDays(t, -daysAgo), assessor: 'LH', result: 'Satisfactory' }));
        const partial = n => ELEMENTS.map((e, i) => i < n ? { evidence: e.hint.replace('___', '88'), date: addDays(t, -5 + i), assessor: 'LH', result: 'Satisfactory' } : { evidence: '', date: '', assessor: '', result: '' });
        const add = (s, sy, kind, dueOffset, extra) => comps.push(Object.assign({
            id: uid(), lab_id: lab.id, staff_id: s.id, test_system_id: sy.id, kind, due_date: addDays(t, dueOffset),
            elements: emptyElements(), overall: null, remediation: '', signoffs: {}, completed_at: null,
            created_at: lab.created_at, updated_at: lab.created_at
        }, extra || {}));

        // Open annual assessments spread across overdue, due soon and scheduled.
        const dueOffsets = [-9, 27, 0, -3, 12, 64, 140, 18]; // index 2 is the new hire, handled below
        staff.forEach((s, i) => {
            if (s.name === 'Ruth Okafor') return;
            add(s, sys[0], 'annual', dueOffsets[i], i % 3 === 1 ? { elements: partial(3 + (i % 2)) } : null);
            add(s, sys[1], 'annual', dueOffsets[i] + 21, null);
            // Last year's annual, completed a week before it was due.
            const doneAgo = 365 - dueOffsets[i] + 7;
            add(s, sys[0], 'annual', dueOffsets[i] - 365, {
                elements: fullElements(doneAgo + 1), overall: 'competent',
                signoffs: { assessor: signed('Leila Haddad', doneAgo + 1), supervisor: signed('Demo Supervisor', doneAgo), director: signed('Dr P. Rao', doneAgo - 5) },
                completed_at: signed('', doneAgo).at
            });
        });
        // New hire: initial complete, 6-month due soon, 12-month scheduled.
        const ruth = staff.find(s => s.name === 'Ruth Okafor');
        add(ruth, sys[0], 'initial', -120, {
            elements: fullElements(125), overall: 'competent',
            signoffs: { assessor: signed('Leila Haddad', 124), supervisor: signed('Demo Supervisor', 123) },
            completed_at: signed('', 123).at
        });
        add(ruth, sys[0], '6-month', daysUntil(addMonths(ruth.hire_date, 6)), { elements: partial(2) });
        add(ruth, sys[0], '12-month', daysUntil(addMonths(ruth.hire_date, 12)));
        add(ruth, sys[1], 'initial', 10);


        return {
            labs: [lab],
            members: [
                { user_id: 'demo-user', role: 'admin', display_name: 'Demo Supervisor', email: 'you@yourlab.org' },
                { user_id: 'demo-lh', role: 'assessor', display_name: 'Leila Haddad', email: 'lead@yourlab.org' },
                { user_id: 'demo-pr', role: 'director', display_name: 'Dr P. Rao', email: 'director@yourlab.org' }
            ],
            staff, test_systems: sys, competencies: comps
        };
    }

    const Demo = {
        mode: 'demo',
        db: null,
        lab: null,
        load() {
            try { this.db = JSON.parse(localStorage.getItem(DEMO_KEY) || 'null'); } catch (e) { this.db = null; }
            if (!this.db || !this.db.labs) { this.db = seedDemo(); this.persist(); }
            this.lab = this.db.labs[0];
        },
        persist() { try { localStorage.setItem(DEMO_KEY, JSON.stringify(this.db)); } catch (e) { /* in-memory only */ } },
        reset() { this.db = seedDemo(); this.lab = this.db.labs[0]; this.persist(); },
        async session() {
            this.load();
            const me = this.db.members[0];
            return { user: { id: me.user_id, email: me.email }, lab: this.lab, member: me };
        },
        async list(table) { return clone(this.db[table]); },
        async insert(table, row) {
            const now = new Date().toISOString();
            const r = Object.assign({ id: uid(), lab_id: this.lab.id, created_at: now }, row);
            if (table === 'competencies') Object.assign(r, { updated_at: now, signoffs: r.signoffs || {}, elements: r.elements || emptyElements() });
            if (table === 'staff' || table === 'test_systems') r.active = r.active !== false;
            this.db[table].push(r);
            this.persist();
            return clone(r);
        },
        async insertMany(table, rows) {
            const out = [];
            for (const r of rows) out.push(await this.insert(table, r));
            return out;
        },
        async update(table, id, patch) {
            const r = this.db[table].find(x => x.id === id);
            if (!r) throw new Error('Record not found');
            Object.assign(r, patch);
            if (table === 'competencies') r.updated_at = new Date().toISOString();
            this.persist();
            return clone(r);
        },
        async remove(table, id) {
            this.db[table] = this.db[table].filter(x => x.id !== id);
            if (table === 'staff') this.db.competencies = this.db.competencies.filter(c => c.staff_id !== id);
            if (table === 'test_systems') this.db.competencies = this.db.competencies.filter(c => c.test_system_id !== id);
            this.persist();
        },
        async updateLab(patch) { Object.assign(this.lab, patch); this.persist(); return clone(this.lab); },
        async members() { return clone(this.db.members); },
        async addMember(email, role, name) {
            this.db.members.push({ user_id: uid(), role, display_name: name || email, email });
            this.persist();
        },
        async setMyName(name) { this.db.members[0].display_name = name; this.persist(); }
    };

    // ---------------------------------------------------------------- live backend (Supabase)

    const Live = {
        mode: 'live',
        client: null,
        lab: null,
        init() {
            if (!this.client) this.client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
        },
        check(res) { if (res.error) throw new Error(res.error.message); return res.data; },
        async user() { const { data } = await this.client.auth.getSession(); return data.session ? data.session.user : null; },
        async signIn(email, password) { this.check(await this.client.auth.signInWithPassword({ email, password })); },
        async signUp(email, password) {
            const data = this.check(await this.client.auth.signUp({ email, password, options: { emailRedirectTo: location.href.split('#')[0] } }));
            return !data.session; // true when email confirmation is required
        },
        async resetPassword(email) {
            this.check(await this.client.auth.resetPasswordForEmail(email, { redirectTo: location.href.split('#')[0] }));
        },
        async signOut() { await this.client.auth.signOut(); },
        async memberships(userId) {
            return this.check(await this.client.from('lab_members')
                .select('lab_id, role, display_name, labs(id, name, created_at)').eq('user_id', userId));
        },
        async createLab(name, displayName) {
            return this.check(await this.client.rpc('create_lab', { p_name: name, p_display_name: displayName }));
        },
        async session(preferredLabId) {
            const user = await this.user();
            if (!user) return null;
            const ms = await this.memberships(user.id);
            if (!ms.length) return { user, lab: null, member: null, memberships: [] };
            const m = ms.find(x => x.lab_id === preferredLabId) || ms[0];
            this.lab = m.labs;
            return { user, lab: m.labs, member: { user_id: user.id, role: m.role, display_name: m.display_name, email: user.email }, memberships: ms };
        },
        async list(table) {
            return this.check(await this.client.from(table).select('*').eq('lab_id', this.lab.id));
        },
        async insert(table, row) {
            return this.check(await this.client.from(table).insert(Object.assign({ lab_id: this.lab.id }, row)).select().single());
        },
        async insertMany(table, rows) {
            if (!rows.length) return [];
            return this.check(await this.client.from(table).insert(rows.map(r => Object.assign({ lab_id: this.lab.id }, r))).select());
        },
        async update(table, id, patch) {
            return this.check(await this.client.from(table).update(patch).eq('id', id).select().single());
        },
        async remove(table, id) { this.check(await this.client.from(table).delete().eq('id', id)); },
        async updateLab(patch) { return this.check(await this.client.from('labs').update(patch).eq('id', this.lab.id).select().single()); },
        async members() {
            return this.check(await this.client.from('lab_members').select('user_id, role, display_name').eq('lab_id', this.lab.id));
        },
        async addMember(email, role, name) {
            this.check(await this.client.rpc('add_lab_member', { p_lab: this.lab.id, p_email: email, p_role: role, p_display_name: name }));
        },
        async setMyName(name) {
            this.check(await this.client.rpc('set_my_display_name', { p_lab: this.lab.id, p_name: name }));
        }
    };

    // ---------------------------------------------------------------- state

    const S = { backend: null, user: null, lab: null, member: null, memberships: [], staff: [], systems: [], comps: [], dirty: false };

    const staffById = id => S.staff.find(s => s.id === id);
    const systemById = id => S.systems.find(s => s.id === id);
    const canAdmin = () => S.member && S.member.role === 'admin';

    async function loadData() {
        const [staff, systems, comps] = await Promise.all([
            S.backend.list('staff'), S.backend.list('test_systems'), S.backend.list('competencies')
        ]);
        S.staff = staff.sort((a, b) => a.name.localeCompare(b.name));
        S.systems = systems.sort((a, b) => a.name.localeCompare(b.name));
        S.comps = comps.map(c => Object.assign(c, { elements: (c.elements && c.elements.length === 6) ? c.elements : emptyElements(), signoffs: c.signoffs || {} }));
    }

    function getMode() { try { return localStorage.getItem(MODE_KEY); } catch (e) { return null; } }
    function setMode(m) { try { m ? localStorage.setItem(MODE_KEY, m) : localStorage.removeItem(MODE_KEY); } catch (e) { /* ignore */ } }

    async function startSession() {
        const mode = getMode();
        S.backend = null; S.user = null; S.lab = null; S.member = null; S.memberships = [];
        if (mode === 'demo') {
            S.backend = Demo;
            Object.assign(S, await Demo.session());
            await loadData();
        } else if (LIVE_AVAILABLE) {
            Live.init();
            const sess = await Live.session(getLabPref());
            if (sess) {
                S.backend = Live;
                Object.assign(S, sess);
                if (S.lab) await loadData();
            }
        }
        renderChrome();
    }

    function getLabPref() { try { return localStorage.getItem('labready.app.lab'); } catch (e) { return null; } }
    function setLabPref(id) { try { localStorage.setItem('labready.app.lab', id); } catch (e) { /* ignore */ } }

    function renderChrome() {
        const inApp = !!(S.backend && S.lab);
        $('#tabs').hidden = !inApp;
        $('#demoBanner').hidden = !(S.backend && S.backend.mode === 'demo');
        const who = S.member ? esc(S.member.display_name || S.user.email) + ' · ' + esc(ROLES[S.member.role] || S.member.role) : '';
        $('#navRight').innerHTML = S.backend
            ? '<span class="who">' + who + '</span><button class="btn ghost" type="button" id="signOutBtn">' + (S.backend.mode === 'demo' ? 'Exit demo' : 'Sign out') + '</button>'
            : '<a class="back" href="../">← LabReady Pro</a>';
        const so = $('#signOutBtn');
        if (so) so.onclick = signOut;
    }

    async function signOut() {
        if (S.dirty && !confirm('You have unsaved changes. Leave anyway?')) return;
        S.dirty = false;
        if (S.backend && S.backend.mode === 'live') await Live.signOut();
        setMode(null);
        await startSession();
        location.hash = '#/';
        render();
    }

    // ---------------------------------------------------------------- router

    window.addEventListener('beforeunload', e => { if (S.dirty) { e.preventDefault(); e.returnValue = ''; } });

    let lastHash = location.hash;
    window.addEventListener('hashchange', () => {
        if (S.dirty && !confirm('You have unsaved changes to this competency. Leave without saving?')) {
            history.replaceState(null, '', lastHash);
            return;
        }
        S.dirty = false;
        lastHash = location.hash;
        render();
    });

    function render() {
        const parts = location.hash.replace(/^#\/?/, '').split('/');
        const route = parts[0] || 'dashboard';
        const view = $('#view');
        $$('#tabs a').forEach(a => a.classList.toggle('active', a.dataset.tab === route || (route === 'competency' && a.dataset.tab === 'dashboard')));

        if (!S.backend) return viewAuth(view);
        if (!S.lab) return viewOnboarding(view);

        const routes = {
            dashboard: () => viewDashboard(view),
            staff: () => parts[1] ? viewStaffDetail(view, parts[1]) : viewStaff(view),
            systems: () => viewSystems(view),
            schedule: () => viewSchedule(view, parts[1]),
            competency: () => viewCompetency(view, parts[1]),
            settings: () => viewSettings(view)
        };
        (routes[route] || routes.dashboard)();
        window.scrollTo(0, 0);
    }

    function head(title, sub, actions) {
        return '<div class="view-head"><div><h1>' + esc(title) + '</h1>' + (sub ? '<p>' + sub + '</p>' : '') + '</div>' +
            (actions ? '<div class="actions">' + actions + '</div>' : '') + '</div>';
    }

    async function run(fn, okMsg) {
        try {
            const r = await fn();
            if (okMsg) toast(okMsg);
            return r;
        } catch (e) {
            console.error(e);
            toast(e.message || 'Something went wrong', true);
            throw e;
        }
    }

    // ---------------------------------------------------------------- auth + onboarding

    function viewAuth(view) {
        const demoCard = '<div class="card"><h1>Explore the demo lab</h1><p class="muted" style="margin-bottom:1rem">A sample chemistry department with eight staff, three test systems and competencies at every stage. Nothing you do leaves this browser.</p>' +
            '<button class="btn primary" type="button" id="demoBtn">Open the demo lab</button></div>';
        if (!LIVE_AVAILABLE) {
            view.innerHTML = '<div class="auth-wrap">' + demoCard +
                '<p class="muted" style="font-size:0.85rem;text-align:center">Live lab accounts open to founding labs soon. <a href="../#pilot">Request a pilot</a>.</p></div>';
        } else {
            view.innerHTML = '<div class="auth-wrap"><div class="card">' +
                '<h1 id="authTitle">Sign in to LabReady Pro</h1><p class="muted" id="authSub" style="margin-bottom:1rem">For laboratory supervisors, assessors and directors.</p>' +
                '<form class="stack" id="authForm">' +
                '<div><label class="lbl" for="authEmail">Work email</label><input type="text" id="authEmail" autocomplete="email" required></div>' +
                '<div id="pwWrap"><label class="lbl" for="authPw">Password</label><input type="password" id="authPw" autocomplete="current-password" minlength="8"></div>' +
                '<p class="error" id="authErr" hidden></p>' +
                '<button class="btn" type="submit" id="authSubmit">Sign in</button>' +
                '</form>' +
                '<p style="margin-top:0.9rem;display:flex;justify-content:space-between;gap:1rem;flex-wrap:wrap">' +
                '<button class="linkish" type="button" id="toSignUp">Create an account</button>' +
                '<button class="linkish" type="button" id="toReset">Forgot password?</button></p>' +
                '</div><p class="or">or</p>' + demoCard + '</div>';

            let mode = 'signin';
            const setAuthMode = m => {
                mode = m;
                $('#authTitle').textContent = { signin: 'Sign in to LabReady Pro', signup: 'Create your account', reset: 'Reset your password' }[m];
                $('#authSubmit').textContent = { signin: 'Sign in', signup: 'Create account', reset: 'Send reset link' }[m];
                $('#pwWrap').hidden = m === 'reset';
                $('#authPw').autocomplete = m === 'signup' ? 'new-password' : 'current-password';
                $('#toSignUp').textContent = m === 'signin' ? 'Create an account' : 'I already have an account';
                $('#authErr').hidden = true;
            };
            $('#toSignUp').onclick = () => setAuthMode(mode === 'signin' ? 'signup' : 'signin');
            $('#toReset').onclick = () => setAuthMode('reset');
            $('#authForm').onsubmit = async e => {
                e.preventDefault();
                const email = $('#authEmail').value.trim();
                const pw = $('#authPw').value;
                const err = $('#authErr');
                err.hidden = true;
                if (mode !== 'reset' && pw.length < 8) { err.textContent = 'Password must be at least 8 characters.'; err.hidden = false; return; }
                $('#authSubmit').disabled = true;
                try {
                    if (mode === 'reset') { await Live.resetPassword(email); toast('Check your email for a reset link.'); setAuthMode('signin'); }
                    else if (mode === 'signup') {
                        const needsConfirm = await Live.signUp(email, pw);
                        if (needsConfirm) { toast('Check your email to confirm your account, then sign in.'); setAuthMode('signin'); }
                        else { setMode('live'); await startSession(); render(); }
                    } else { await Live.signIn(email, pw); setMode('live'); await startSession(); render(); }
                } catch (ex) { err.textContent = ex.message; err.hidden = false; }
                $('#authSubmit').disabled = false;
            };
        }
        $('#demoBtn').onclick = async () => { setMode('demo'); await startSession(); location.hash = '#/dashboard'; render(); };
    }

    function viewOnboarding(view) {
        view.innerHTML = '<div class="auth-wrap"><div class="card"><h1>Set up your laboratory</h1>' +
            '<p class="muted" style="margin-bottom:1rem">You\'ll be the lab\'s admin. You can add colleagues afterwards in Settings.</p>' +
            '<form class="stack" id="labForm">' +
            '<div><label class="lbl" for="labName">Laboratory / department name</label><input type="text" id="labName" required placeholder="e.g. St Mary\'s Core Lab · Chemistry"></div>' +
            '<div><label class="lbl" for="myName">Your name as it should appear on sign-offs</label><input type="text" id="myName" required></div>' +
            '<button class="btn primary" type="submit">Create laboratory</button></form></div></div>';
        $('#labForm').onsubmit = async e => {
            e.preventDefault();
            const id = await run(() => Live.createLab($('#labName').value.trim(), $('#myName').value.trim()), 'Laboratory created');
            setLabPref(id);
            await startSession();
            location.hash = '#/systems';
            render();
        };
    }

    // ---------------------------------------------------------------- dashboard

    const dashFilter = { status: 'open', system: '', q: '' };

    function viewDashboard(view) {
        const open = S.comps.filter(c => !c.completed_at);
        const overdue = open.filter(c => compStatus(c).key === 'overdue').length;
        const due = open.filter(c => compStatus(c).key === 'due').length;
        const yearAgo = Date.now() - 365 * 86400000;
        const doneYear = S.comps.filter(c => c.completed_at && new Date(c.completed_at).getTime() >= yearAgo).length;
        const activeStaff = S.staff.filter(s => s.active).length;

        if (!S.staff.length || !S.systems.length) {
            view.innerHTML = head(S.lab.name, 'Competency status') +
                '<div class="empty"><p style="margin-bottom:1rem">Start by adding your test systems and staff, then schedule their competencies.</p>' +
                '<a class="btn" href="#/systems">Add test systems</a> <a class="btn ghost" href="#/staff">Add staff</a></div>';
            return;
        }

        view.innerHTML = head(S.lab.name, 'Competency status across your laboratory',
            '<button class="btn ghost" type="button" id="csvBtn">Export CSV</button><a class="btn" href="#/schedule">Schedule competencies</a>') +
            '<div class="stats">' +
            '<div class="stat-tile overdue"><b>' + overdue + '</b><span>Overdue</span></div>' +
            '<div class="stat-tile due"><b>' + due + '</b><span>Due in 30 days</span></div>' +
            '<div class="stat-tile complete"><b>' + doneYear + '</b><span>Completed in last 12 months</span></div>' +
            '<div class="stat-tile"><b>' + activeStaff + '</b><span>Active testing staff</span></div>' +
            '</div>' +
            '<div class="filters no-print">' +
            '<select id="fStatus"><option value="open">Open (not signed off)</option><option value="attention">Overdue + due in 30 days</option><option value="complete">Completed</option><option value="all">All</option></select>' +
            '<select id="fSystem"><option value="">All test systems</option>' + S.systems.map(s => '<option value="' + s.id + '">' + esc(s.name) + '</option>').join('') + '</select>' +
            '<input type="text" id="fQ" placeholder="Search staff">' +
            '</div><div id="dashList"></div>';

        $('#fStatus').value = dashFilter.status;
        $('#fSystem').value = dashFilter.system;
        $('#fQ').value = dashFilter.q;
        const update = () => {
            dashFilter.status = $('#fStatus').value;
            dashFilter.system = $('#fSystem').value;
            dashFilter.q = $('#fQ').value.trim().toLowerCase();
            renderCompList($('#dashList'), filteredComps(), true);
        };
        $('#fStatus').onchange = update; $('#fSystem').onchange = update; $('#fQ').oninput = update;
        $('#csvBtn').onclick = () => exportCsv(filteredComps());
        update();
    }

    function filteredComps() {
        return S.comps.filter(c => {
            const st = compStatus(c).key;
            if (dashFilter.status === 'open' && c.completed_at) return false;
            if (dashFilter.status === 'attention' && st !== 'overdue' && st !== 'due') return false;
            if (dashFilter.status === 'complete' && !c.completed_at) return false;
            if (dashFilter.system && c.test_system_id !== dashFilter.system) return false;
            if (dashFilter.q) { const s = staffById(c.staff_id); if (!s || s.name.toLowerCase().indexOf(dashFilter.q) < 0) return false; }
            return true;
        }).sort((a, b) => dashFilter.status === 'complete'
            ? String(b.completed_at).localeCompare(String(a.completed_at))
            : a.due_date.localeCompare(b.due_date));
    }

    function renderCompList(el, comps, showStaff) {
        if (!comps.length) { el.innerHTML = '<div class="empty">Nothing here.</div>'; return; }
        el.innerHTML = '<div class="list-wrap"><table class="list"><thead><tr>' +
            (showStaff ? '<th>Staff</th>' : '') + '<th>Test system</th><th class="hide-sm">Type</th><th>Due</th><th class="hide-sm">Methods</th><th>Status</th>' +
            '</tr></thead><tbody>' + comps.map(c => {
                const s = staffById(c.staff_id), sy = systemById(c.test_system_id), st = compStatus(c);
                return '<tr class="clickable" data-id="' + c.id + '">' +
                    (showStaff ? '<td><b>' + esc(s ? s.name : '—') + '</b></td>' : '') +
                    '<td>' + esc(sy ? sy.name : '—') + '<br><span class="muted" style="font-size:0.8rem">' + esc(sy ? sy.instrument : '') + '</span></td>' +
                    '<td class="hide-sm">' + esc(KINDS[c.kind] || c.kind) + '</td>' +
                    '<td class="num">' + fmtDate(c.due_date) + '</td>' +
                    '<td class="hide-sm">' + progressBar(c) + '</td>' +
                    '<td><span class="pill ' + st.key + '">' + st.label + '</span></td></tr>';
            }).join('') + '</tbody></table></div>';
        $$('tr.clickable', el).forEach(tr => tr.onclick = () => { location.hash = '#/competency/' + tr.dataset.id; });
    }

    function exportCsv(comps) {
        const q = v => '"' + String(v == null ? '' : v).replace(/"/g, '""') + '"';
        const rows = [['Staff', 'Position', 'Test system', 'Instrument', 'Type', 'Due date', 'Status', 'Methods recorded', 'Completed', 'Supervisor sign-off']];
        comps.forEach(c => {
            const s = staffById(c.staff_id) || {}, sy = systemById(c.test_system_id) || {};
            rows.push([s.name, s.position, sy.name, sy.instrument, KINDS[c.kind] || c.kind, c.due_date, compStatus(c).label,
                elementsDone(c) + '/6', c.completed_at ? c.completed_at.slice(0, 10) : '',
                c.signoffs && c.signoffs.supervisor ? c.signoffs.supervisor.name : '']);
        });
        download('labready-competencies-' + todayIso() + '.csv', rows.map(r => r.map(q).join(',')).join('\r\n'), 'text/csv');
    }

    // ---------------------------------------------------------------- staff

    function viewStaff(view) {
        view.innerHTML = head('Staff', 'Everyone whose competency you track. They don\'t need a login.') +
            '<form class="form-card no-print" id="staffForm"><h2>Add a staff member</h2><div class="form-row">' +
            '<div><label class="lbl" for="sName">Name</label><input type="text" id="sName" required></div>' +
            '<div><label class="lbl" for="sPos">Position / credential</label><input type="text" id="sPos" placeholder="e.g. MLS(ASCP)"></div>' +
            '<div><label class="lbl" for="sHire">Hire date</label><input type="date" id="sHire"></div>' +
            '<div><label class="lbl" for="sEmail">Email (optional)</label><input type="text" id="sEmail"></div>' +
            '<button class="btn" type="submit">Add</button></div></form>' +
            '<div id="staffList"></div>';

        $('#staffForm').onsubmit = async e => {
            e.preventDefault();
            const row = { name: $('#sName').value.trim(), position: $('#sPos').value.trim(), hire_date: $('#sHire').value || null, email: $('#sEmail').value.trim() };
            if (!row.name) return;
            const r = await run(() => S.backend.insert('staff', row), row.name + ' added');
            S.staff.push(r);
            S.staff.sort((a, b) => a.name.localeCompare(b.name));
            viewStaff(view);
        };

        if (!S.staff.length) { $('#staffList').innerHTML = '<div class="empty">No staff yet.</div>'; return; }
        $('#staffList').innerHTML = '<div class="list-wrap"><table class="list"><thead><tr><th>Name</th><th class="hide-sm">Position</th><th class="hide-sm">Hire date</th><th>Open</th><th>Next due</th><th></th></tr></thead><tbody>' +
            S.staff.map(s => {
                const open = S.comps.filter(c => c.staff_id === s.id && !c.completed_at).sort((a, b) => a.due_date.localeCompare(b.due_date));
                const next = open[0];
                const st = next ? compStatus(next) : null;
                return '<tr class="clickable" data-id="' + s.id + '"><td><b>' + esc(s.name) + '</b>' + (s.active ? '' : ' <span class="muted">(inactive)</span>') + '</td>' +
                    '<td class="hide-sm">' + esc(s.position) + '</td><td class="hide-sm num">' + fmtDate(s.hire_date) + '</td>' +
                    '<td class="num">' + open.length + '</td>' +
                    '<td>' + (next ? '<span class="pill ' + st.key + '">' + fmtDate(next.due_date) + '</span>' : '<span class="muted">—</span>') + '</td>' +
                    '<td class="row-actions"><span class="muted">›</span></td></tr>';
            }).join('') + '</tbody></table></div>';
        $$('#staffList tr.clickable').forEach(tr => tr.onclick = () => { location.hash = '#/staff/' + tr.dataset.id; });
    }

    function viewStaffDetail(view, id) {
        const s = staffById(id);
        if (!s) { view.innerHTML = head('Not found') + '<a class="btn ghost" href="#/staff">Back to staff</a>'; return; }
        const comps = S.comps.filter(c => c.staff_id === id).sort((a, b) => b.due_date.localeCompare(a.due_date));
        view.innerHTML = head(s.name, esc(s.position || '') + (s.hire_date ? ' · hired ' + fmtDate(s.hire_date) : ''),
            '<a class="btn" href="#/schedule/' + s.id + '">Schedule competency</a>') +
            '<form class="form-card no-print" id="editStaff"><h2>Details</h2><div class="form-row">' +
            '<div><label class="lbl" for="eName">Name</label><input type="text" id="eName" value="' + esc(s.name) + '" required></div>' +
            '<div><label class="lbl" for="ePos">Position</label><input type="text" id="ePos" value="' + esc(s.position) + '"></div>' +
            '<div><label class="lbl" for="eHire">Hire date</label><input type="date" id="eHire" value="' + esc(s.hire_date || '') + '"></div>' +
            '<div><label class="lbl" for="eEmail">Email</label><input type="text" id="eEmail" value="' + esc(s.email) + '"></div>' +
            '</div><div class="actions" style="margin:1rem 0 0"><button class="btn" type="submit">Save</button>' +
            '<button class="btn ghost" type="button" id="toggleActive">' + (s.active ? 'Mark inactive' : 'Mark active') + '</button>' +
            '<button class="btn danger" type="button" id="delStaff">Delete</button></div></form>' +
            '<h2 style="font-size:1.1rem;margin-bottom:0.6rem">Competency history</h2><div id="staffComps"></div>';

        renderCompList($('#staffComps'), comps, false);
        $('#editStaff').onsubmit = async e => {
            e.preventDefault();
            const patch = { name: $('#eName').value.trim(), position: $('#ePos').value.trim(), hire_date: $('#eHire').value || null, email: $('#eEmail').value.trim() };
            Object.assign(s, await run(() => S.backend.update('staff', id, patch), 'Saved'));
            viewStaffDetail(view, id);
        };
        $('#toggleActive').onclick = async () => {
            Object.assign(s, await run(() => S.backend.update('staff', id, { active: !s.active }), s.active ? 'Marked inactive' : 'Marked active'));
            viewStaffDetail(view, id);
        };
        $('#delStaff').onclick = async () => {
            if (!confirm('Delete ' + s.name + ' and all ' + comps.length + ' of their competency records? This can\'t be undone. To keep records, mark them inactive instead.')) return;
            await run(() => S.backend.remove('staff', id), 'Deleted');
            S.staff = S.staff.filter(x => x.id !== id);
            S.comps = S.comps.filter(c => c.staff_id !== id);
            location.hash = '#/staff';
        };
    }

    // ---------------------------------------------------------------- test systems

    function viewSystems(view) {
        view.innerHTML = head('Test systems', 'Competency is assessed for each test system a person performs.') +
            '<form class="form-card no-print" id="sysForm"><h2>Add a test system</h2><div class="form-row">' +
            '<div><label class="lbl" for="tName">Name</label><input type="text" id="tName" required placeholder="e.g. General chemistry"></div>' +
            '<div><label class="lbl" for="tInst">Instrument</label><input type="text" id="tInst" placeholder="e.g. Cobas Pure c303 (Cobas Pure 1)"></div>' +
            '<div><label class="lbl" for="tSec">Section</label><input type="text" id="tSec" placeholder="e.g. Chemistry"></div>' +
            '<button class="btn" type="submit">Add</button></div></form><div id="sysList"></div>';

        $('#sysForm').onsubmit = async e => {
            e.preventDefault();
            const row = { name: $('#tName').value.trim(), instrument: $('#tInst').value.trim(), section: $('#tSec').value.trim() };
            if (!row.name) return;
            const r = await run(() => S.backend.insert('test_systems', row), row.name + ' added');
            S.systems.push(r);
            S.systems.sort((a, b) => a.name.localeCompare(b.name));
            viewSystems(view);
        };

        if (!S.systems.length) { $('#sysList').innerHTML = '<div class="empty">No test systems yet.</div>'; return; }
        $('#sysList').innerHTML = '<div class="list-wrap"><table class="list"><thead><tr><th>Name</th><th>Instrument</th><th class="hide-sm">Section</th><th>Open</th><th></th></tr></thead><tbody>' +
            S.systems.map(s => '<tr><td><b>' + esc(s.name) + '</b>' + (s.active ? '' : ' <span class="muted">(inactive)</span>') + '</td><td>' + esc(s.instrument) + '</td>' +
                '<td class="hide-sm">' + esc(s.section) + '</td><td class="num">' + S.comps.filter(c => c.test_system_id === s.id && !c.completed_at).length + '</td>' +
                '<td class="row-actions"><button class="btn ghost small" type="button" data-toggle="' + s.id + '">' + (s.active ? 'Deactivate' : 'Activate') + '</button>' +
                '<button class="btn danger small" type="button" data-del="' + s.id + '">Delete</button></td></tr>').join('') +
            '</tbody></table></div>';

        $$('[data-toggle]').forEach(b => b.onclick = async () => {
            const s = systemById(b.dataset.toggle);
            Object.assign(s, await run(() => S.backend.update('test_systems', s.id, { active: !s.active })));
            viewSystems(view);
        });
        $$('[data-del]').forEach(b => b.onclick = async () => {
            const s = systemById(b.dataset.del);
            const n = S.comps.filter(c => c.test_system_id === s.id).length;
            if (!confirm('Delete ' + s.name + (n ? ' and its ' + n + ' competency records' : '') + '? This can\'t be undone. To keep records, deactivate it instead.')) return;
            await run(() => S.backend.remove('test_systems', s.id), 'Deleted');
            S.systems = S.systems.filter(x => x.id !== s.id);
            S.comps = S.comps.filter(c => c.test_system_id !== s.id);
            viewSystems(view);
        });
    }

    // ---------------------------------------------------------------- scheduling

    function viewSchedule(view, preselectStaff) {
        const activeStaff = S.staff.filter(s => s.active);
        const activeSys = S.systems.filter(s => s.active);
        if (!activeStaff.length || !activeSys.length) {
            view.innerHTML = head('Schedule competencies') + '<div class="empty">Add at least one staff member and one test system first.<br><br>' +
                '<a class="btn ghost" href="#/staff">Staff</a> <a class="btn ghost" href="#/systems">Test systems</a></div>';
            return;
        }
        view.innerHTML = head('Schedule competencies', 'Create assessments for several people and test systems at once.') +
            '<form class="form-card" id="schedForm">' +
            '<h2>1. Who</h2><div class="checks-grid">' + activeStaff.map(s =>
                '<label><input type="checkbox" name="st" value="' + s.id + '"' + (s.id === preselectStaff ? ' checked' : '') + '> ' + esc(s.name) + '</label>').join('') + '</div>' +
            '<p style="margin:0.4rem 0 1rem"><button class="linkish" type="button" id="allStaff">Select all</button></p>' +
            '<h2>2. Which test systems</h2><div class="checks-grid">' + activeSys.map(s =>
                '<label><input type="checkbox" name="sy" value="' + s.id + '"> ' + esc(s.name) + '</label>').join('') + '</div>' +
            '<h2 style="margin-top:1.2rem">3. What and when</h2><div class="form-row">' +
            '<div><label class="lbl" for="kind">Assessment</label><select id="kind">' +
            '<option value="series">New-hire series (initial, 6-month, 12-month)</option>' +
            Object.keys(KINDS).map(k => '<option value="' + k + '"' + (k === 'annual' ? ' selected' : '') + '>' + KINDS[k] + '</option>').join('') + '</select></div>' +
            '<div id="dueWrap"><label class="lbl" for="due">Due date</label><input type="date" id="due" value="' + addDays(todayIso(), 30) + '"></div>' +
            '</div><p class="muted" id="seriesNote" style="font-size:0.85rem;margin-top:0.6rem" hidden>Uses each person\'s hire date: initial due 30 days after hire, then 6 and 12 months after hire. People without a hire date are skipped.</p>' +
            '<p class="muted" id="schedCount" style="margin-top:0.8rem"></p>' +
            '<div class="actions" style="margin-bottom:0"><button class="btn primary" type="submit">Create assessments</button></div></form>';

        const count = () => {
            const st = $$('input[name=st]:checked').length, sy = $$('input[name=sy]:checked').length;
            const per = $('#kind').value === 'series' ? 3 : 1;
            $('#schedCount').textContent = st && sy ? 'This will create up to ' + (st * sy * per) + ' assessment' + (st * sy * per === 1 ? '' : 's') + '. Existing identical ones are skipped.' : '';
        };
        $('#kind').onchange = () => { const s = $('#kind').value === 'series'; $('#dueWrap').hidden = s; $('#seriesNote').hidden = !s; count(); };
        $('#allStaff').onclick = () => { $$('input[name=st]').forEach(i => i.checked = true); count(); };
        $$('#schedForm input[type=checkbox]').forEach(i => i.onchange = count);
        count();

        $('#schedForm').onsubmit = async e => {
            e.preventDefault();
            const staffIds = $$('input[name=st]:checked').map(i => i.value);
            const sysIds = $$('input[name=sy]:checked').map(i => i.value);
            const kind = $('#kind').value;
            if (!staffIds.length || !sysIds.length) { toast('Pick at least one person and one test system.', true); return; }
            const rows = [];
            let skippedNoHire = 0;
            staffIds.forEach(sid => sysIds.forEach(tid => {
                if (kind === 'series') {
                    const hire = staffById(sid).hire_date;
                    if (!hire) { skippedNoHire++; return; }
                    rows.push({ staff_id: sid, test_system_id: tid, kind: 'initial', due_date: addDays(hire, 30) });
                    rows.push({ staff_id: sid, test_system_id: tid, kind: '6-month', due_date: addMonths(hire, 6) });
                    rows.push({ staff_id: sid, test_system_id: tid, kind: '12-month', due_date: addMonths(hire, 12) });
                } else {
                    const due = $('#due').value;
                    if (!due) return;
                    rows.push({ staff_id: sid, test_system_id: tid, kind, due_date: due });
                }
            }));
            const fresh = rows.filter(r => !S.comps.some(c => c.staff_id === r.staff_id && c.test_system_id === r.test_system_id && c.kind === r.kind && c.due_date === r.due_date))
                .map(r => Object.assign(r, { elements: emptyElements(), signoffs: {} }));
            if (!fresh.length) { toast(skippedNoHire ? 'Nothing created: add hire dates first.' : 'Those assessments already exist.', true); return; }
            const created = await run(() => S.backend.insertMany('competencies', fresh));
            S.comps.push(...created.map(c => Object.assign(c, { elements: c.elements && c.elements.length === 6 ? c.elements : emptyElements(), signoffs: c.signoffs || {} })));
            toast(created.length + ' assessment' + (created.length === 1 ? '' : 's') + ' scheduled' + (skippedNoHire ? ' · ' + skippedNoHire + ' skipped (no hire date)' : ''));
            location.hash = '#/dashboard';
        };
    }

    // ---------------------------------------------------------------- competency record

    function viewCompetency(view, id) {
        const c0 = S.comps.find(c => c.id === id);
        if (!c0) { view.innerHTML = head('Not found') + '<a class="btn ghost" href="#/dashboard">Back to dashboard</a>'; return; }
        const c = clone(c0); // working copy
        const s = staffById(c.staff_id) || {}, sy = systemById(c.test_system_id) || {};
        const locked = !!c.completed_at;
        const dis = locked ? ' disabled' : '';
        const st = compStatus(c);

        view.innerHTML = head(s.name || 'Competency', esc(KINDS[c.kind] || c.kind) + ' · ' + esc(sy.name || '') + ' · <span class="pill ' + st.key + '">' + st.label + '</span>',
            '<button class="btn ghost" type="button" id="printBtn">Print record</button>' +
            (locked ? '' : '<button class="btn ghost" type="button" id="fillHints">Fill suggested evidence</button>')) +
            '<div class="print-only"><h1 style="font-size:16pt">Competency Assessment Record</h1><p>' + esc(S.lab.name) + '</p></div>' +
            '<div class="form-card"><div class="record-head">' +
            '<div><span>Employee</span><b>' + esc(s.name) + '</b></div>' +
            '<div><span>Position</span><b>' + esc(s.position || '—') + '</b></div>' +
            '<div><span>Hire date</span><b>' + (fmtDate(s.hire_date) || '—') + '</b></div>' +
            '<div><span>Test system</span><b>' + esc(sy.name) + '</b></div>' +
            '<div><span>Instrument</span><b>' + esc(sy.instrument || '—') + '</b></div>' +
            '<div><span>Assessment</span><b>' + esc(KINDS[c.kind] || c.kind) + '</b></div>' +
            '<div><span>Due date</span>' + (locked ? '<b>' + fmtDate(c.due_date) + '</b>' : '<input type="date" id="dueDate" value="' + esc(c.due_date) + '">') + '</div>' +
            '</div></div>' +
            '<div class="form-card"><h2>Six assessment methods</h2><p class="muted" style="font-size:0.85rem;margin-bottom:0.4rem">Record evidence for each method, or N/A with a reason.</p>' +
            ELEMENTS.map((el, i) => {
                const e = c.elements[i] || {};
                return '<div class="element"><div><h3>' + (i + 1) + '. ' + esc(el.title) + '</h3><p>' + esc(el.sub) + '</p></div><div class="el-fields">' +
                    '<div class="full"><label class="lbl" for="ev' + i + '">Evidence reviewed / observed</label><textarea id="ev' + i + '" rows="2" placeholder="' + esc(el.hint) + '"' + dis + '>' + esc(e.evidence) + '</textarea></div>' +
                    '<div><label class="lbl" for="dt' + i + '">Date</label><input type="date" id="dt' + i + '" value="' + esc(e.date) + '"' + dis + '></div>' +
                    '<div><label class="lbl" for="as' + i + '">Assessor</label><input type="text" id="as' + i + '" value="' + esc(e.assessor) + '" placeholder="Initials"' + dis + '></div>' +
                    '<div><label class="lbl" for="rs' + i + '">Result</label><select id="rs' + i + '"' + dis + '><option value=""></option>' +
                    RESULTS.map(r => '<option' + (e.result === r ? ' selected' : '') + '>' + r + '</option>').join('') + '</select></div>' +
                    '</div></div>';
            }).join('') + '</div>' +
            '<div class="form-card"><h2>Outcome</h2><div class="form-row">' +
            '<div><label class="lbl" for="overall">Overall result</label><select id="overall"' + dis + '><option value=""></option>' +
            '<option value="competent"' + (c.overall === 'competent' ? ' selected' : '') + '>Competent: may test independently</option>' +
            '<option value="not_competent"' + (c.overall === 'not_competent' ? ' selected' : '') + '>Not yet competent: remediation required</option></select></div></div>' +
            '<div style="margin-top:0.8rem"><label class="lbl" for="remed">Remediation plan (if any)</label><textarea id="remed" rows="2"' + dis + '>' + esc(c.remediation) + '</textarea></div></div>' +
            '<div class="form-card"><h2>Sign-off</h2><div class="signoffs">' +
            SIGNERS.map(([key, label]) => {
                const so = c.signoffs[key];
                return '<div class="signoff"><h3>' + label + '</h3>' + (so
                    ? '<div class="signed">✓ ' + esc(so.name) + '<small>' + fmtStamp(so.at) + '</small></div>' + (locked ? '' : '<button class="linkish no-print" type="button" data-unsign="' + key + '">Remove</button>')
                    : (locked ? '<span class="muted">Not signed</span>' : '<button class="btn small no-print" type="button" data-sign="' + key + '">Sign as ' + esc(S.member.display_name || S.user.email) + '</button>')) + '</div>';
            }).join('') + '</div>' +
            '<p class="muted" style="font-size:0.82rem;margin-top:0.8rem">The record is complete once every method has a result, an overall result is chosen and the technical supervisor has signed. Director sign-off follows your lab\'s policy.</p></div>' +
            '<div class="sticky-save no-print" id="saveBar">' +
            (locked
                ? '<span class="muted">Completed ' + fmtStamp(c.completed_at) + '.</span>' +
                  (nextAssessment(c, s) ? '<button class="btn primary" type="button" id="nextBtn">Schedule next (' + esc(KINDS[nextAssessment(c, s).kind]) + ')</button>' : '') +
                  '<button class="btn ghost" type="button" id="reopenBtn">Reopen</button>'
                : '<button class="btn" type="button" id="saveBtn">Save</button><span class="muted" id="saveState">' + elementsDone(c) + ' of 6 methods recorded</span>') +
            '<span style="flex:1"></span><button class="btn danger small" type="button" id="delComp">Delete</button></div>';

        const collect = () => {
            if (locked) return;
            c.due_date = $('#dueDate').value || c.due_date;
            c.elements = ELEMENTS.map((_, i) => ({ evidence: $('#ev' + i).value, date: $('#dt' + i).value, assessor: $('#as' + i).value.trim(), result: $('#rs' + i).value }));
            c.overall = $('#overall').value || null;
            c.remediation = $('#remed').value;
        };
        const persist = async (patch, msg) => {
            const saved = await run(() => S.backend.update('competencies', id, patch), msg);
            Object.assign(c0, saved, { elements: saved.elements && saved.elements.length === 6 ? saved.elements : c.elements, signoffs: saved.signoffs || {} });
            S.dirty = false;
            viewCompetency(view, id);
        };
        const fields = () => ({ due_date: c.due_date, elements: c.elements, overall: c.overall, remediation: c.remediation });

        if (!locked) {
            $$('.form-card input, .form-card select, .form-card textarea', view).forEach(el => el.addEventListener('input', () => {
                S.dirty = true;
                collect();
                $('#saveState').textContent = 'Unsaved changes · ' + elementsDone(c) + ' of 6 methods recorded';
            }));
            $('#saveBtn').onclick = () => { collect(); persist(fields(), 'Saved'); };
            $('#fillHints').onclick = () => {
                ELEMENTS.forEach((el, i) => { if (!$('#ev' + i).value) $('#ev' + i).value = el.hint; });
                S.dirty = true; collect();
                $('#saveState').textContent = 'Unsaved changes · edit the suggestions to match what was actually assessed';
            };
        }

        $$('[data-sign]', view).forEach(b => b.onclick = async () => {
            collect();
            const key = b.dataset.sign;
            if (key === 'assessor' && elementsDone(c) < 6) { toast('Record a result for all six methods before the assessor signs.', true); return; }
            if (key === 'supervisor' && (elementsDone(c) < 6 || !c.overall)) { toast('All six methods and an overall result are needed before supervisor sign-off.', true); return; }
            const signoffs = Object.assign({}, c.signoffs, { [key]: { name: S.member.display_name || S.user.email, at: new Date().toISOString(), user_id: S.user.id } });
            const patch = Object.assign(fields(), { signoffs });
            if (key === 'supervisor') patch.completed_at = new Date().toISOString();
            await persist(patch, key === 'supervisor' ? 'Signed off: record complete' : 'Signed');
        });
        $$('[data-unsign]', view).forEach(b => b.onclick = async () => {
            collect();
            const signoffs = Object.assign({}, c.signoffs);
            delete signoffs[b.dataset.unsign];
            await persist(Object.assign(fields(), { signoffs }), 'Signature removed');
        });

        $('#printBtn').onclick = () => window.print();
        $('#delComp').onclick = async () => {
            if (!confirm('Delete this competency record? This can\'t be undone.')) return;
            await run(() => S.backend.remove('competencies', id), 'Deleted');
            S.comps = S.comps.filter(x => x.id !== id);
            S.dirty = false;
            location.hash = '#/dashboard';
        };
        if (locked) {
            $('#reopenBtn').onclick = async () => {
                if (!confirm('Reopen this record? The supervisor sign-off will be removed and it will need signing again.')) return;
                const signoffs = Object.assign({}, c.signoffs);
                delete signoffs.supervisor;
                await persist({ completed_at: null, signoffs }, 'Reopened');
            };
            const nb = $('#nextBtn');
            if (nb) nb.onclick = async () => {
                const n = nextAssessment(c, s);
                const dup = S.comps.find(x => x.staff_id === c.staff_id && x.test_system_id === c.test_system_id && x.kind === n.kind && !x.completed_at);
                if (dup) { toast('An open ' + KINDS[n.kind] + ' assessment already exists.'); location.hash = '#/competency/' + dup.id; return; }
                const created = await run(() => S.backend.insert('competencies', { staff_id: c.staff_id, test_system_id: c.test_system_id, kind: n.kind, due_date: n.due_date, elements: emptyElements(), signoffs: {} }),
                    KINDS[n.kind] + ' scheduled for ' + fmtDate(n.due_date));
                S.comps.push(Object.assign(created, { elements: emptyElements(), signoffs: created.signoffs || {} }));
                location.hash = '#/competency/' + created.id;
            };
        }
    }

    // ---------------------------------------------------------------- settings

    async function viewSettings(view) {
        const demo = S.backend.mode === 'demo';
        view.innerHTML = head('Settings', esc(S.lab.name)) +
            '<form class="form-card" id="labForm"><h2>Laboratory</h2><div class="form-row">' +
            '<div><label class="lbl" for="labName">Name</label><input type="text" id="labName" value="' + esc(S.lab.name) + '"' + (canAdmin() ? '' : ' disabled') + '></div>' +
            (canAdmin() ? '<button class="btn" type="submit">Save</button>' : '') + '</div>' +
            (S.memberships && S.memberships.length > 1 ? '<div style="margin-top:1rem"><label class="lbl" for="labSwitch">Switch laboratory</label><select id="labSwitch">' +
                S.memberships.map(m => '<option value="' + m.lab_id + '"' + (m.lab_id === S.lab.id ? ' selected' : '') + '>' + esc(m.labs.name) + '</option>').join('') + '</select></div>' : '') +
            '</form>' +
            '<form class="form-card" id="meForm"><h2>Your signature name</h2><div class="form-row">' +
            '<div><label class="lbl" for="meName">Shown on sign-offs</label><input type="text" id="meName" value="' + esc(S.member.display_name) + '"></div>' +
            '<button class="btn" type="submit">Save</button></div></form>' +
            '<div class="form-card"><h2>People who can sign in</h2><div id="members" class="muted">Loading…</div>' +
            (canAdmin() ? '<form id="memberForm" style="margin-top:1rem"><p class="muted" style="font-size:0.85rem;margin-bottom:0.6rem">' +
                (demo ? 'In the demo this just adds a name to the list.' : 'Ask your colleague to create a LabReady account first, then add them by email.') + '</p><div class="form-row">' +
                '<div><label class="lbl" for="mEmail">Email</label><input type="text" id="mEmail" required></div>' +
                '<div><label class="lbl" for="mName">Name</label><input type="text" id="mName"></div>' +
                '<div><label class="lbl" for="mRole">Role</label><select id="mRole">' + Object.keys(ROLES).map(r => '<option value="' + r + '"' + (r === 'assessor' ? ' selected' : '') + '>' + ROLES[r] + '</option>').join('') + '</select></div>' +
                '<button class="btn" type="submit">Add</button></div></form>' : '') + '</div>' +
            '<div class="form-card"><h2>Your data</h2><p class="muted" style="font-size:0.88rem;margin-bottom:0.8rem">Download everything for this laboratory as a backup.</p>' +
            '<div class="actions" style="margin:0"><button class="btn ghost" type="button" id="exportJson">Download backup (JSON)</button>' +
            (demo ? '<button class="btn danger" type="button" id="resetDemo">Reset demo data</button>' : '') + '</div></div>';

        $('#labForm').onsubmit = async e => {
            e.preventDefault();
            const name = $('#labName').value.trim();
            if (!name) return;
            S.lab = Object.assign(S.lab, await run(() => S.backend.updateLab({ name }), 'Saved'));
        };
        const sw = $('#labSwitch');
        if (sw) sw.onchange = async () => { setLabPref(sw.value); await startSession(); location.hash = '#/dashboard'; render(); };
        $('#meForm').onsubmit = async e => {
            e.preventDefault();
            const name = $('#meName').value.trim();
            if (!name) return;
            await run(() => S.backend.setMyName(name), 'Saved');
            S.member.display_name = name;
            renderChrome();
        };
        const mf = $('#memberForm');
        if (mf) mf.onsubmit = async e => {
            e.preventDefault();
            await run(() => S.backend.addMember($('#mEmail').value.trim(), $('#mRole').value, $('#mName').value.trim()), 'Added');
            viewSettings(view);
        };
        $('#exportJson').onclick = () => download('labready-backup-' + todayIso() + '.json',
            JSON.stringify({ exported_at: new Date().toISOString(), lab: S.lab, staff: S.staff, test_systems: S.systems, competencies: S.comps }, null, 2), 'application/json');
        const rd = $('#resetDemo');
        if (rd) rd.onclick = async () => {
            if (!confirm('Reset the demo lab to its starting sample data?')) return;
            Demo.reset();
            await startSession();
            toast('Demo reset');
            location.hash = '#/dashboard';
            render();
        };

        try {
            const ms = await S.backend.members();
            $('#members').innerHTML = '<div class="list-wrap" style="margin:0"><table class="list"><thead><tr><th>Name</th><th>Role</th></tr></thead><tbody>' +
                ms.map(m => '<tr><td>' + esc(m.display_name || m.email || 'Member') + (m.user_id === S.user.id ? ' <span class="muted">(you)</span>' : '') + '</td><td>' + esc(ROLES[m.role] || m.role) + '</td></tr>').join('') +
                '</tbody></table></div>';
        } catch (e) { $('#members').textContent = 'Couldn\'t load members: ' + e.message; }
    }

    // ---------------------------------------------------------------- boot

    (async function boot() {
        try { await startSession(); }
        catch (e) { console.error(e); toast('Couldn\'t connect: ' + e.message, true); S.backend = null; renderChrome(); }
        if (LIVE_AVAILABLE) {
            Live.init();
            Live.client.auth.onAuthStateChange(async (event) => {
                if (event === 'SIGNED_OUT' && S.backend && S.backend.mode === 'live') { S.backend = null; renderChrome(); render(); }
                if (event === 'PASSWORD_RECOVERY') {
                    const pw = prompt('Enter a new password (at least 8 characters):');
                    if (pw && pw.length >= 8) await run(async () => { const r = await Live.client.auth.updateUser({ password: pw }); if (r.error) throw r.error; }, 'Password updated');
                }
            });
        }
        render();
    })();
})();
