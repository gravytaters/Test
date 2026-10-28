/* Shared runtime for Good Neighbors Hub Inventory.
   Gives the page the same calls as local-runtime.js, but the inventory lives in the Hub's Supabase
   database. Every request carries the Hub passcode, which the database checks; open copies of the
   app hear about each other's changes over Supabase Realtime and reload what changed. */
(() => {
  const cfg = window.GNH_CONFIG || {};
  if (cfg.mode !== "shared") return;
  const PASS_KEY = "gnh.passcode", NAME_KEY = "gnh.name";
  const store = { get: k => { try { return localStorage.getItem(k) || ""; } catch { return ""; } },
                  set: (k, v) => { try { v ? localStorage.setItem(k, v) : localStorage.removeItem(k); } catch {} } };
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  const sb = window.supabase.createClient(cfg.supabaseUrl, cfg.supabaseKey, { auth: { persistSession: false, autoRefreshToken: false } });
  let pass = store.get(PASS_KEY);
  let data = { items: {}, folders: {}, activity: {} };
  const OFFLINE = { code: "unavailable", message: "Can't reach the Hub's inventory. Check your internet connection." };

  async function call(fn, args = {}, passcode = pass){
    let r;
    try { r = await sb.rpc(fn, { p: passcode, ...args }); } catch { throw OFFLINE; }
    if (r.error) throw OFFLINE;
    const d = r.data || {};
    if (d.error === "bad_passcode" || d.error === "too_many_attempts") {
      if (passcode === pass) lockOut();
      throw { code: "not_granted", message: d.error };
    }
    if (d.error) throw { code: "invalid_argument", message: d.error };
    return d;
  }

  /* ---------- records ---------- */
  const listeners = new Set();
  const coll = name => (data[name] ||= {});
  const snapDoc = (id, d) => ({ id, exists: d !== undefined && d !== null, data: () => clone(d ?? undefined), metadata: { fromCache: false, hasPendingWrites: false } });
  function run(name, order, lim){
    let rows = Object.entries(coll(name)).map(([id, d]) => ({ id, d }));
    if (order) rows.sort((a, b) => { const x = a.d[order.f], y = b.d[order.f]; return (x > y ? 1 : x < y ? -1 : 0) * (order.dir === "desc" ? -1 : 1); });
    if (lim) rows = rows.slice(0, lim);
    const docs = rows.map(r => snapDoc(r.id, r.d));
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function notify(name){ for (const l of listeners) if (!name || l.name === name) queueMicrotask(l.fire); }
  function query(name, order, lim){
    return {
      where(){ throw { code: "invalid_argument", message: "Filtering is not available here." }; },
      orderBy: (f, dir = "asc") => query(name, { f, dir }, lim),
      limit: n => query(name, order, n),
      get: async () => run(name, order, lim),
      onSnapshot(next){ const l = { name, fire: () => next(run(name, order, lim)) }; listeners.add(l); queueMicrotask(l.fire); return () => listeners.delete(l); },
    };
  }
  // show the change at once, then save it; if saving fails, reload so the screen matches the database
  async function write(name, apply, fn, args){
    apply(); notify(name);
    try { return await call(fn, args); } catch (e) { refreshSoon(0); throw e; }
  }
  function docRef(name, id){
    return { id, path: name + "/" + id,
      async get(){ if (name in data && coll(name)[id]) return snapDoc(id, coll(name)[id]); const d = await call("gnh_get", { c: name, i: id }); return snapDoc(id, d.data); },
      set: d => write(name, () => { coll(name)[id] = clone(d); }, "gnh_set", { c: name, i: id, d }),
      update: d => write(name, () => { if (coll(name)[id]) Object.assign(coll(name)[id], clone(d)); }, "gnh_update", { c: name, i: id, d }),
      delete: () => write(name, () => { delete coll(name)[id]; }, "gnh_delete", { c: name, i: id }) };
  }
  const db = {
    collection: name => Object.assign(query(name), { path: name, doc: id => docRef(name, id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7)) }),
    doc: path => { const [c, i] = path.split("/"); return docRef(c, i); },
  };

  async function refresh(){
    const d = await call("gnh_load");
    data = { ...data, items: d.items || {}, folders: d.folders || {}, activity: d.activity || {} };
    notify();
  }
  let refreshT = null;
  function refreshSoon(ms = 700){ clearTimeout(refreshT); refreshT = setTimeout(() => refresh().catch(() => {}), ms); }

  /* ---------- live updates ---------- */
  function listen(){
    try {
      sb.channel("gnh-changes", { config: { private: false } })
        .on("broadcast", { event: "changed" }, () => refreshSoon())
        .subscribe();
    } catch (e) { console.warn("Live updates unavailable", e); }
    // backstop in case a live update is missed
    setInterval(() => { if (document.visibilityState === "visible") refreshSoon(0); }, 30000);
    document.addEventListener("visibilitychange", () => { if (document.visibilityState === "visible") refreshSoon(0); });
  }

  /* ---------- photos ---------- */
  const photos = new Map(), pending = new Set();
  async function shrink(blob){
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(1, 900 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/jpeg", 0.8);
    } finally { URL.revokeObjectURL(url); }
  }
  const assets = {
    async upload(blob){
      let dataUrl; try { dataUrl = await shrink(blob); } catch { throw { code: "unsupported_type", message: "That file isn't an image this browser can read." }; }
      const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await call("gnh_photo_put", { i: id, d: dataUrl }); photos.set(id, dataUrl);
      return { id, url: dataUrl, sizeBytes: dataUrl.length, contentType: "image/jpeg" };
    },
    // photos load on first sight; the page redraws when one arrives
    url(id){
      if (photos.has(id)) return photos.get(id);
      if (!pending.has(id)) {
        pending.add(id);
        call("gnh_photo_get", { i: id }).then(d => { if (d.data) { photos.set(id, d.data); window.dispatchEvent(new CustomEvent("gnh-photo")); } })
          .catch(() => {}).finally(() => pending.delete(id));
      }
      return "";
    },
    async list(){ return { assets: [...photos.keys()].map(id => ({ id, url: photos.get(id) })), usage: {} }; },
    async delete(id){ await call("gnh_photo_delete", { i: id }); photos.delete(id); return { deleted: true }; },
  };

  const downloads = {
    async save({ filename, data: body }){
      const blob = body instanceof Blob ? body : new Blob([body]);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { status: "saved" };
    },
  };

  // the name typed at sign-in is what the activity log shows
  const user = {
    id: async () => store.get(NAME_KEY) || null,
    profiles: async ids => Object.fromEntries([].concat(ids).map(i => [i, { id: i, name: i }])),
  };

  /* ---------- passcode screen ---------- */
  const css = document.createElement("style");
  css.textContent = `.gnh-gate{position:fixed;inset:0;z-index:100;background:var(--brand);display:grid;place-items:center;overflow:auto;
    padding:max(16px,env(safe-area-inset-top,0px)) max(16px,env(safe-area-inset-right,0px)) max(16px,env(safe-area-inset-bottom,0px)) max(16px,env(safe-area-inset-left,0px))}
  .gnh-gate form{background:var(--surface);color:var(--fg);border-radius:12px;border-top:6px solid var(--tape);padding:26px 24px;width:min(400px,100%);display:flex;flex-direction:column;gap:14px;box-shadow:0 20px 50px rgba(0,0,0,.3)}
  .gnh-gate img{width:72px;height:72px;border-radius:16px;align-self:center}
  .gnh-gate h2{margin:0;text-align:center;font:800 20px/1.25 var(--f-display)}
  .gnh-gate p{margin:0;color:var(--muted);text-align:center}
  .gnh-gate label{display:flex;flex-direction:column;gap:5px;font-size:12px;font-weight:600;color:var(--muted)}
  .gnh-gate input{border:1px solid var(--line);background:var(--bg);color:var(--fg);border-radius:6px;padding:10px 12px;font:16px var(--f-body)}
  .gnh-gate .err{color:var(--low);font-weight:600;min-height:1.2em}
  .gnh-gate button{justify-content:center;padding:11px 14px;font-size:15px}
  .gnh-gate small{color:var(--muted);text-align:center;font-size:12px}`;
  document.head.appendChild(css);

  function gate(message){
    return new Promise(resolve => {
      const el = document.createElement("div");
      el.className = "gnh-gate"; el.setAttribute("role", "dialog"); el.setAttribute("aria-modal", "true"); el.setAttribute("aria-labelledby", "gateTitle");
      el.innerHTML = `<form novalidate>
        <img src="icons/icon-192.png" alt="">
        <h2 id="gateTitle">Good Neighbors Hub Inventory</h2>
        <p>Enter the Hub passcode to open the shared inventory. You only need to do this once on this device.</p>
        <label>Hub passcode<input id="gatePass" type="password" autocomplete="current-password" autocapitalize="off" spellcheck="false"></label>
        <label>Your first name (optional)<input id="gateName" autocomplete="given-name" maxlength="40" placeholder="Shows next to your changes in the activity log"></label>
        <span class="err" role="alert"></span>
        <button class="btn primary" type="submit">Open inventory</button>
        <small>Pay what you can · No one turned away</small></form>`;
      document.body.appendChild(el);
      const err = el.querySelector(".err"), btn = el.querySelector("button");
      err.textContent = message || "";
      el.querySelector("#gateName").value = store.get(NAME_KEY);
      el.querySelector("#gatePass").focus();
      el.querySelector("form").addEventListener("submit", async e => {
        e.preventDefault(); e.stopPropagation(); // keep the app's own form handling out of it
        const p = el.querySelector("#gatePass").value.trim(); if (!p) { err.textContent = "Enter the Hub passcode."; return; }
        btn.disabled = true; btn.textContent = "Checking…"; err.textContent = "";
        try {
          await call("gnh_check", {}, p);
          pass = p; store.set(PASS_KEY, p); store.set(NAME_KEY, el.querySelector("#gateName").value.trim());
          el.remove(); resolve();
        } catch (x) {
          err.textContent = x.message === "too_many_attempts" ? "Too many wrong tries from this network. Wait 15 minutes, then try again."
            : x.code === "not_granted" ? "That passcode isn't right. Ask the Hub coordinator for the current one." : OFFLINE.message;
        } finally { btn.disabled = false; btn.textContent = "Open inventory"; }
      });
    });
  }
  let lockedOut = false;
  function lockOut(){
    if (lockedOut) return; lockedOut = true;
    pass = ""; store.set(PASS_KEY, "");
    gate("The Hub passcode has changed. Enter the new one.").then(() => location.reload());
  }

  // open the inventory: ask for the passcode if this device doesn't have it, then load everything
  const ready = (async () => {
    if (!pass) await gate();
    for (;;) {
      try { await refresh(); break; }
      catch (e) {
        if (e.code === "not_granted") { await new Promise(() => {}); } // lockOut shows the passcode screen and reloads
        await gate(OFFLINE.message + " Then open it again.");
      }
    }
    listen();
  })();

  /* ---------- backup, restore, passcode ---------- */
  async function exportAll(){
    const d = await call("gnh_export");
    return { app: "good-neighbors-hub-inventory", version: 1, exportedAt: new Date().toISOString(), data: d.data || {}, photos: d.photos || {} };
  }
  async function importAll(backup){
    if (backup?.app !== "good-neighbors-hub-inventory" || typeof backup.data !== "object") throw { code: "invalid_argument", message: "That file isn't a Good Neighbors Hub backup." };
    await call("gnh_replace_all", { d: backup.data, photos: backup.photos || {} });
    photos.clear(); await refresh();
  }
  async function setPasscode(next){
    await call("gnh_set_passcode", { new_passcode: next });
    pass = next; store.set(PASS_KEY, next);
  }
  function lock(){ store.set(PASS_KEY, ""); location.reload(); }

  window.claude = {
    local: true,
    async use(name){
      await ready;
      if (name === "db") return db;
      if (name === "assets") return assets;
      if (name === "downloads") return downloads;
      if (name === "user") return user;
      return null;
    },
  };
  window.gnhLocal = { shared: true, exportAll, importAll, setPasscode, lock };

  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
