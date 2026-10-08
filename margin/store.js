/* Saved businesses and their months, kept in this browser (IndexedDB). Nothing leaves the device.
 * Falls back to memory when storage is blocked (private windows), so the app still works for the session. */
(function (root) {
    'use strict';
    const DB = 'margin', VER = 1;
    let dbp = null;
    const mem = { businesses: new Map(), reports: new Map() };

    function open() {
        if (dbp) return dbp;
        dbp = new Promise(resolve => {
            let req;
            try { req = indexedDB.open(DB, VER); } catch (e) { resolve(null); return; }
            req.onupgradeneeded = () => {
                const db = req.result;
                db.createObjectStore('businesses', { keyPath: 'id' });
                db.createObjectStore('reports', { keyPath: 'id' }).createIndex('business', 'businessId');
            };
            req.onsuccess = () => resolve(req.result);
            req.onerror = () => resolve(null);
            req.onblocked = () => resolve(null);
        });
        return dbp;
    }
    const done = r => new Promise((ok, no) => { r.onsuccess = () => ok(r.result); r.onerror = () => no(r.error); });

    async function all(store, index, key) {
        const db = await open();
        if (!db) return [...mem[store].values()].filter(x => !index || x.businessId === key);
        const os = db.transaction(store).objectStore(store);
        return done(index ? os.index(index).getAll(key) : os.getAll());
    }
    async function put(store, value) {
        const db = await open();
        if (!db) { mem[store].set(value.id, value); return value; }
        await done(db.transaction(store, 'readwrite').objectStore(store).put(value));
        return value;
    }
    async function del(store, id) {
        const db = await open();
        if (!db) { mem[store].delete(id); return; }
        await done(db.transaction(store, 'readwrite').objectStore(store).delete(id));
    }

    const uid = () => Date.now().toString(36) + Math.random().toString(36).slice(2, 8);

    root.MarginStore = {
        uid,
        businesses: () => all('businesses').then(a => a.sort((x, y) => x.createdAt - y.createdAt)),
        saveBusiness: b => put('businesses', b),
        reports: businessId => all('reports', 'business', businessId).then(a => a.sort((x, y) => (x.period || '').localeCompare(y.period || ''))),
        saveReport: r => put('reports', r),
        deleteReport: id => del('reports', id),
        async deleteBusiness(id) {
            for (const r of await all('reports', 'business', id)) await del('reports', r.id);
            await del('businesses', id);
        },
        async persistent() { const db = await open(); return !!db; },
    };
})(self);
