// ===== dropbox.js: Dropbox API連携 =====
// ★ YOUR_APP_KEY を Dropbox Developers で取得したApp Keyに書き換えてください
const DROPBOX_APP_KEY = 'YOUR_APP_KEY';

// ★ リダイレクトURIを環境に合わせて設定してください
//　 ローカルテスト時：'http://localhost:8080/'
// 　 Cloudflare Pages公開後：'https://あなたのサイト名.pages.dev/'
// 　 ※末尾のスラッシュを必ず付けること
// 　 ※Dropbox Developers の Redirect URIs に同じURLを登録すること
const DROPBOX_REDIRECT_URI = location.origin + '/';

let dropboxToken = null;

// 起動時にトークンを復元
(function initDropbox() {
  // URLハッシュからトークン取得（認証コールバック）
  const hash = location.hash;
  if (hash && hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    if (token) {
      dropboxToken = token;
      sessionStorage.setItem('dbx_token', token);
      // ハッシュをクリア
      history.replaceState(null, '', location.pathname);
    }
  }
  // sessionStorageから復元
  if (!dropboxToken) {
    dropboxToken = sessionStorage.getItem('dbx_token');
  }
})();

function isDropboxConnected() {
  return !!dropboxToken;
}

function dropboxAuth() {
  const url = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;
  location.href = url;
}

function dropboxLogout() {
  dropboxToken = null;
  sessionStorage.removeItem('dbx_token');
}

// ファイルダウンロード（ArrayBuffer）
async function dropboxDownload(path) {
  const res = await fetch('https://content.dropboxapi.com/2/files/download', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dropboxToken,
      'Dropbox-API-Arg': JSON.stringify({ path })
    }
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_summary || `HTTP ${res.status}`);
  }
  return await res.arrayBuffer();
}

// ファイルアップロード
async function dropboxUpload(path, content) {
  // content: Uint8Array or ArrayBuffer
  const body = content instanceof Uint8Array ? content : new Uint8Array(content);
  const res = await fetch('https://content.dropboxapi.com/2/files/upload', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dropboxToken,
      'Dropbox-API-Arg': JSON.stringify({ path, mode: 'overwrite', autorename: false }),
      'Content-Type': 'application/octet-stream'
    },
    body
  });
  if (!res.ok) {
    const err = await res.json().catch(() => ({}));
    throw new Error(err.error_summary || `HTTP ${res.status}`);
  }
  return await res.json();
}

// フォルダ内ファイル一覧
async function dropboxListFolder(folderPath) {
  const res = await fetch('https://api.dropboxapi.com/2/files/list_folder', {
    method: 'POST',
    headers: {
      'Authorization': 'Bearer ' + dropboxToken,
      'Content-Type': 'application/json'
    },
    body: JSON.stringify({ path: folderPath, recursive: false })
  });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return await res.json();
}
