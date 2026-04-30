// ===== dropbox.js =====
const DROPBOX_APP_KEY = 'YOUR_APP_KEY';
const DROPBOX_REDIRECT_URI = location.origin + '/';

let dropboxToken = null;

(function initDropbox() {
  const hash = location.hash;
  if (hash && hash.includes('access_token=')) {
    const params = new URLSearchParams(hash.slice(1));
    const token = params.get('access_token');
    if (token) {
      dropboxToken = token;
      sessionStorage.setItem('dbx_token', token);
      history.replaceState(null, '', location.pathname);
    }
  }
  if (!dropboxToken) dropboxToken = sessionStorage.getItem('dbx_token');
})();

function isDropboxConnected() { return !!dropboxToken; }

function dropboxAuth() {
  const url = `https://www.dropbox.com/oauth2/authorize?client_id=${DROPBOX_APP_KEY}&response_type=token&redirect_uri=${encodeURIComponent(DROPBOX_REDIRECT_URI)}`;
  location.href = url;
}

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

async function dropboxUpload(path, content) {
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
