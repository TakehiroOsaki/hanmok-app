// ===== db.js: IndexedDB管理 =====
const DB_NAME = 'HanmokDB';
const DB_VERSION = 1;
let db = null;

const STORES = {
  EIGYO: 'eigyo_tanto',
  SHOHIN: 'shohin_mst',
  TOKUISAKI: 'tokuisaki_mst',
  TANKA: 'shohin_tanka_mst',
  HANMOK: 'hanmok_data',
  CONFIG: 'config'
};

function openDB() {
  return new Promise((resolve, reject) => {
    if (db) { resolve(db); return; }
    const req = indexedDB.open(DB_NAME, DB_VERSION);
    req.onupgradeneeded = e => {
      const d = e.target.result;
      // 営業担当者
      if (!d.objectStoreNames.contains(STORES.EIGYO)) {
        d.createObjectStore(STORES.EIGYO, { keyPath: 'eigyo_cd' });
      }
      // 商品マスタ
      if (!d.objectStoreNames.contains(STORES.SHOHIN)) {
        d.createObjectStore(STORES.SHOHIN, { keyPath: ['shohin_kbn', 'shohin_cd'] });
      }
      // 得意先マスタ
      if (!d.objectStoreNames.contains(STORES.TOKUISAKI)) {
        d.createObjectStore(STORES.TOKUISAKI, { keyPath: 'tokuisaki_cd' });
      }
      // 商品単価マスタ
      if (!d.objectStoreNames.contains(STORES.TANKA)) {
        d.createObjectStore(STORES.TANKA, { keyPath: ['shohin_kbn', 'shohin_cd', 'tokuisaki_cd'] });
      }
      // 販売目標データ
      if (!d.objectStoreNames.contains(STORES.HANMOK)) {
        d.createObjectStore(STORES.HANMOK, { keyPath: ['eigyo_cd', 'shohin_kbn', 'shohin_cd', 'tokuisaki_cd', 'tsuki'] });
      }
      // 設定
      if (!d.objectStoreNames.contains(STORES.CONFIG)) {
        d.createObjectStore(STORES.CONFIG, { keyPath: 'key' });
      }
    };
    req.onsuccess = e => { db = e.target.result; resolve(db); };
    req.onerror = e => reject(e.target.error);
  });
}

function dbGet(storeName, key) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).get(key);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  }));
}

function dbPut(storeName, value) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).put(value);
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  }));
}

function dbGetAll(storeName) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readonly');
    const req = tx.objectStore(storeName).getAll();
    req.onsuccess = e => resolve(e.target.result);
    req.onerror = e => reject(e.target.error);
  }));
}

function dbClear(storeName) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).clear();
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}

function dbBulkPut(storeName, records) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readwrite');
    const store = tx.objectStore(storeName);
    let i = 0;
    function putNext() {
      if (i >= records.length) { resolve(records.length); return; }
      const req = store.put(records[i++]);
      req.onsuccess = putNext;
      req.onerror = e => reject(e.target.error);
    }
    putNext();
  }));
}

function dbDelete(storeName, key) {
  return openDB().then(d => new Promise((resolve, reject) => {
    const tx = d.transaction(storeName, 'readwrite');
    const req = tx.objectStore(storeName).delete(key);
    req.onsuccess = () => resolve();
    req.onerror = e => reject(e.target.error);
  }));
}

// 設定値の保存・取得
async function setConfig(key, value) {
  await dbPut(STORES.CONFIG, { key, value });
}
async function getConfig(key) {
  const r = await dbGet(STORES.CONFIG, key);
  return r ? r.value : null;
}

// 代替商品の連番を取得・インクリメント
async function getNextDaigaeSeq(eigyoCd) {
  const all = await dbGetAll(STORES.SHOHIN);
  const prefix = 'ZDAIGAE' + String(eigyoCd).padStart(3, '0');
  let maxSeq = 0;
  for (const s of all) {
    if (s.shohin_cd && s.shohin_cd.startsWith(prefix)) {
      const seq = parseInt(s.shohin_cd.slice(prefix.length)) || 0;
      if (seq > maxSeq) maxSeq = seq;
    }
  }
  return maxSeq + 1;
}
