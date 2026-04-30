// ===== db.js: IndexedDB管理 =====
const DB_NAME = 'HanmokDB';
const DB_VERSION = 2;
let db = null;

const STORES = {
  EIGYO:     'eigyo_tanto',
  SHOHIN:    'shohin_mst',
  TOKUISAKI: 'tokuisaki_mst',
  HANMOK:    'hanmok_data',
  HANJSK:    'hanjsk_data',
  CONFIG:    'config'
};

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      if (!d.objectStoreNames.contains(STORES.EIGYO))
        d.createObjectStore(STORES.EIGYO, { keyPath: 'eigyo_cd' });
      if (!d.objectStoreNames.contains(STORES.SHOHIN))
        d.createObjectStore(STORES.SHOHIN, { keyPath: ['shohin_kbn', 'shohin_cd'] });
      if (!d.objectStoreNames.contains(STORES.TOKUISAKI))
        d.createObjectStore(STORES.TOKUISAKI, { keyPath: 'tokuisaki_cd' });
      if (!d.objectStoreNames.contains(STORES.HANMOK))
        d.createObjectStore(STORES.HANMOK, { keyPath: ['eigyo_cd','shohin_kbn','shohin_cd','tokuisaki_cd','nen','tsuki'] });
      if (!d.objectStoreNames.contains(STORES.HANJSK))
        d.createObjectStore(STORES.HANJSK, { keyPath: ['eigyo_cd','shohin_kbn','shohin_cd','tokuisaki_cd','nen','tsuki'] });
      if (!d.objectStoreNames.contains(STORES.CONFIG))
        d.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror  = e => reject(e.target.error);
  });
}

function dbGet(storeName, key) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const req = d.transaction(storeName,'readonly').objectStore(storeName).get(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  }));
}

function dbPut(storeName, value) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const req = d.transaction(storeName,'readwrite').objectStore(storeName).put(value);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  }));
}

function dbGetAll(storeName) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const req = d.transaction(storeName,'readonly').objectStore(storeName).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror   = e => reject(e.target.error);
  }));
}

function dbClear(storeName) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const req = d.transaction(storeName,'readwrite').objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror   = e => reject(e.target.error);
  }));
}

function dbBulkPut(storeName, records) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName,'readwrite');
    const store = tx.objectStore(storeName);
    let i = 0;
    function putNext() {
      if (i >= records.length) { resolve(records.length); return; }
      const req = store.put(records[i++]);
      req.onsuccess = putNext;
      req.onerror   = e => reject(e.target.error);
    }
    putNext();
  }));
}

async function setConfig(key, value) { await dbPut(STORES.CONFIG, { key, value }); }
async function getConfig(key) {
  const r = await dbGet(STORES.CONFIG, key);
  return r ? r.value : null;
}
