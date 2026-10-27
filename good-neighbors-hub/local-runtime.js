/* Local runtime for Good Neighbors Hub Inventory.
   On claude.ai the page gets its database, photo storage and file saving from the viewer
   (window.claude.use). Here this file provides the same calls, keeping everything in this
   browser: records in localStorage, photos in IndexedDB. */
(() => {
  const KEY = "gnh-inventory-v1";
  const clone = v => v === undefined ? undefined : JSON.parse(JSON.stringify(v));
  let data = load();
  function load(){ try { return JSON.parse(localStorage.getItem(KEY)) || {}; } catch { return {}; } }
  function persist(){
    try { localStorage.setItem(KEY, JSON.stringify(data)); }
    catch (e) { console.error(e); window.dispatchEvent(new CustomEvent("gnh-storage-error")); }
  }

  /* ---------- records ---------- */
  const listeners = new Set();
  const coll = name => (data[name] ||= {});
  const snapDoc = (id, d) => ({ id, exists: d !== undefined, data: () => clone(d), metadata: { fromCache: false, hasPendingWrites: false } });
  function run(name, order, lim){
    let rows = Object.entries(coll(name)).map(([id, d]) => ({ id, d }));
    if (order) rows.sort((a, b) => { const x = a.d[order.f], y = b.d[order.f]; return (x > y ? 1 : x < y ? -1 : 0) * (order.dir === "desc" ? -1 : 1); });
    if (lim) rows = rows.slice(0, lim);
    const docs = rows.map(r => snapDoc(r.id, r.d));
    return { docs, size: docs.length, empty: !docs.length, docChanges: () => [], metadata: { fromCache: false, hasPendingWrites: false } };
  }
  function notify(name){ for (const l of listeners) if (!name || l.name === name) queueMicrotask(l.fire); }
  function changed(name){ persist(); notify(name); }
  function query(name, order, lim){
    return {
      where(){ throw { code: "invalid_argument", message: "Filtering is not available in the local version." }; },
      orderBy: (f, dir = "asc") => query(name, { f, dir }, lim),
      limit: n => query(name, order, n),
      get: async () => run(name, order, lim),
      onSnapshot(next){ const l = { name, fire: () => next(run(name, order, lim)) }; listeners.add(l); queueMicrotask(l.fire); return () => listeners.delete(l); },
    };
  }
  function docRef(name, id){
    return { id, path: name + "/" + id,
      get: async () => snapDoc(id, coll(name)[id]),
      set: async d => { coll(name)[id] = clone(d); changed(name); },
      update: async d => { if (!coll(name)[id]) throw { code: "invalid_argument", message: "That record no longer exists." }; Object.assign(coll(name)[id], clone(d)); changed(name); },
      delete: async () => { delete coll(name)[id]; changed(name); } };
  }
  const db = {
    collection: name => Object.assign(query(name), { path: name, doc: id => docRef(name, id || Date.now().toString(36) + Math.random().toString(36).slice(2, 7)) }),
    doc: path => { const [c, i] = path.split("/"); return docRef(c, i); },
  };
  // another tab of the app changed the inventory
  window.addEventListener("storage", e => { if (e.key === KEY) { data = load(); notify(); } });

  /* ---------- photos ---------- */
  const photos = new Map();
  let idb = null;
  const idbReq = r => new Promise((res, rej) => { r.onsuccess = () => res(r.result); r.onerror = () => rej(r.error); });
  const store = mode => idb.transaction("photos", mode).objectStore("photos");
  const photosReady = (async () => {
    try {
      const open = indexedDB.open("gnh-inventory", 1);
      open.onupgradeneeded = () => open.result.createObjectStore("photos");
      idb = await idbReq(open);
      const s = store("readonly"), [keys, vals] = await Promise.all([idbReq(s.getAllKeys()), idbReq(s.getAll())]);
      keys.forEach((k, i) => photos.set(k, vals[i]));
    } catch (e) { console.warn("Photo storage unavailable", e); idb = null; }
  })();
  async function shrink(blob){
    const url = URL.createObjectURL(blob);
    try {
      const img = await new Promise((res, rej) => { const i = new Image(); i.onload = () => res(i); i.onerror = rej; i.src = url; });
      const s = Math.min(1, 1000 / Math.max(img.naturalWidth, img.naturalHeight));
      const cv = document.createElement("canvas"); cv.width = Math.round(img.naturalWidth * s); cv.height = Math.round(img.naturalHeight * s);
      cv.getContext("2d").drawImage(img, 0, 0, cv.width, cv.height);
      return cv.toDataURL("image/jpeg", 0.82);
    } finally { URL.revokeObjectURL(url); }
  }
  const assets = {
    async upload(blob){
      if (!idb) throw { code: "store_unavailable", message: "This browser isn't letting the app store photos." };
      let dataUrl; try { dataUrl = await shrink(blob); } catch { throw { code: "unsupported_type", message: "That file isn't an image this browser can read." }; }
      const id = "p" + Date.now().toString(36) + Math.random().toString(36).slice(2, 7);
      await idbReq(store("readwrite").put(dataUrl, id)); photos.set(id, dataUrl);
      return { id, url: dataUrl, sizeBytes: dataUrl.length, contentType: "image/jpeg" };
    },
    url: id => photos.get(id) || "",
    async list(){ return { assets: [...photos.keys()].map(id => ({ id, url: photos.get(id) })), usage: {} }; },
    async delete(id){ if (idb) await idbReq(store("readwrite").delete(id)); photos.delete(id); return { deleted: true }; },
  };

  /* ---------- saving files ---------- */
  const downloads = {
    async save({ filename, data: body }){
      const blob = body instanceof Blob ? body : new Blob([body]);
      const a = document.createElement("a"); a.href = URL.createObjectURL(blob); a.download = filename;
      document.body.appendChild(a); a.click(); a.remove(); setTimeout(() => URL.revokeObjectURL(a.href), 4000);
      return { status: "saved" };
    },
  };

  /* ---------- backup and restore ---------- */
  async function exportAll(){
    await photosReady;
    return { app: "good-neighbors-hub-inventory", version: 1, exportedAt: new Date().toISOString(), data: clone(data), photos: Object.fromEntries(photos) };
  }
  async function importAll(backup){
    if (backup?.app !== "good-neighbors-hub-inventory" || typeof backup.data !== "object") throw { code: "invalid_argument", message: "That file isn't a Good Neighbors Hub backup." };
    await photosReady;
    data = clone(backup.data) || {}; persist();
    if (idb) {
      await idbReq(store("readwrite").clear()); photos.clear();
      for (const [id, url] of Object.entries(backup.photos || {})) { await idbReq(store("readwrite").put(url, id)); photos.set(id, url); }
    }
    notify();
  }

  window.claude = {
    local: true,
    async use(name){
      if (name === "db") return db;
      if (name === "assets") { await photosReady; return idb ? assets : null; }
      if (name === "downloads") return downloads;
      return null;
    },
  };
  window.gnhLocal = { exportAll, importAll };

  // works offline and installs as an app when served from http://localhost
  if ("serviceWorker" in navigator && location.protocol.startsWith("http")) navigator.serviceWorker.register("sw.js").catch(() => {});
})();
