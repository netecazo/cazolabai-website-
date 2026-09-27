/* LabReady Pro: open, save and sign a saved record (a study or a QC investigation) from a page
 * outside the app, such as the worksheets or the QC assistant opened with ?study=<id> / ?record=<id>.
 *
 *   const backend = LabReadyRecords.backend();       // demo lab or Supabase, following the app's mode
 *   const got = await backend.open(id);             // null | { signedOut: true } | { record, labName, member }
 *   record = await backend.save(id, content, verdict);
 *   record = await backend.sign(id, content, verdict);   // the database stamps name, role and time
 *   record = await backend.unsign(id);
 *
 * Records live in the `studies` table (see supabase-app-schema.sql). Live mode needs
 * app/config.js and the Supabase bundle on the page.
 */
(function () {
    'use strict';

    const SIGNERS = ['admin', 'supervisor', 'director'];
    const ROLE_NAMES = { admin: 'Admin', supervisor: 'Supervisor', assessor: 'Assessor', director: 'Director' };

    // Same rules as private.studies_guard, so the demo behaves like the live system.
    const Demo = {
        mode: 'demo',
        key: 'labready.app.demo.v2',
        db() { try { return JSON.parse(localStorage.getItem(this.key) || 'null'); } catch (e) { return null; } },
        async open(id) {
            const db = this.db();
            const rec = db && (db.studies || []).find(x => x.id === id);
            if (!rec) return null;
            return { record: rec, labName: db.labs[0].name, member: db.members[0] };
        },
        async write(id, apply) {
            const db = this.db();
            const rec = db && (db.studies || []).find(x => x.id === id);
            if (!rec) throw new Error('This record no longer exists.');
            apply(rec, db.members[0]);
            rec.updated_at = new Date().toISOString();
            localStorage.setItem(this.key, JSON.stringify(db));
            return JSON.parse(JSON.stringify(rec));
        },
        save(id, content, verdict) {
            return this.write(id, rec => {
                if (rec.signoff) throw new Error('This record is signed off and locked. Remove the sign-off to make changes.');
                rec.content = content; rec.verdict = verdict;
            });
        },
        sign(id, content, verdict) {
            return this.write(id, (rec, me) => {
                if (!SIGNERS.includes(me.role)) throw new Error('Only a supervisor, director or admin can sign off.');
                if (!(content.review || {}).decision) throw new Error('Choose a decision before signing off.');
                rec.content = content; rec.verdict = verdict;
                rec.signoff = { name: me.display_name, role: me.role, user_id: me.user_id, at: new Date().toISOString() };
            });
        },
        unsign(id) {
            return this.write(id, (rec, me) => {
                if (!SIGNERS.includes(me.role)) throw new Error('Only a supervisor, director or admin can remove a sign-off.');
                rec.signoff = null;
            });
        }
    };

    const Live = {
        mode: 'live',
        client: null,
        check(res) { if (res.error) throw new Error(res.error.message); return res.data; },
        async open(id) {
            const CFG = window.LABREADY_CONFIG || {};
            if (!(CFG.supabaseUrl && window.supabase)) throw new Error('This site isn\'t connected to its database.');
            this.client = window.supabase.createClient(CFG.supabaseUrl, CFG.supabaseAnonKey);
            const { data } = await this.client.auth.getSession();
            if (!data.session) return { signedOut: true };
            const user = data.session.user;
            const rec = this.check(await this.client.from('studies').select('*').eq('id', id).maybeSingle());
            if (!rec) return null;
            const lab = this.check(await this.client.from('labs').select('name').eq('id', rec.lab_id).single());
            const m = this.check(await this.client.from('lab_members').select('role, display_name').eq('lab_id', rec.lab_id).eq('user_id', user.id).single());
            return { record: rec, labName: lab.name, member: { user_id: user.id, role: m.role, display_name: m.display_name || user.email } };
        },
        async update(id, patch) { return this.check(await this.client.from('studies').update(patch).eq('id', id).select().single()); },
        save(id, content, verdict) { return this.update(id, { content, verdict }); },
        // The database re-stamps the name, role and time; the value sent is only a placeholder.
        sign(id, content, verdict) { return this.update(id, { content, verdict, signoff: { pending: true } }); },
        unsign(id) { return this.update(id, { signoff: null }); }
    };

    function backend() {
        let mode = null;
        try { mode = localStorage.getItem('labready.app.mode'); } catch (e) { /* ignore */ }
        return mode === 'live' ? Live : Demo;
    }

    /* Debounced auto-save. getPayload() returns { content, verdict }; onState(text, bad) shows progress. */
    function autosaver(backendRef, getRecord, setRecord, getPayload, onState, labName) {
        let timer = null, chain = Promise.resolve();
        const now = () => new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
        function flush() {
            clearTimeout(timer); timer = null;
            const { content, verdict } = getPayload();
            chain = chain.then(async () => {
                onState('Saving…');
                try { setRecord(await backendRef.save(getRecord().id, content, verdict)); onState('Saved to ' + labName + ' · ' + now()); }
                catch (e) { onState('Not saved: ' + e.message, true); }
            });
            return chain;
        }
        function schedule() {
            if (getRecord().signoff) return;
            onState('Unsaved changes…');
            clearTimeout(timer);
            timer = setTimeout(flush, 800);
        }
        window.addEventListener('beforeunload', e => {
            if (timer && !getRecord().signoff) { flush(); e.preventDefault(); e.returnValue = ''; }
        });
        return { schedule, flush, pending: () => !!timer, cancel() { clearTimeout(timer); timer = null; }, settled: () => chain };
    }

    window.LabReadyRecords = { backend, autosaver, SIGNERS, ROLE_NAMES, Demo, Live };
})();
