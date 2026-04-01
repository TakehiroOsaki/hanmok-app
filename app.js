// ===== app.js: メインロジック =====

// ---- 年度・月定義 ----
const TSUKI_LIST = ['03','04','05','06','07','08','09','10','11','12','01','02'];
const TSUKI_LABELS = {
  '03':'3月','04':'4月','05':'5月','06':'6月','07':'7月','08':'8月',
  '09':'9月','10':'10月','11':'11月','12':'12月','01':'1月','02':'2月'
};

// ---- グローバル状態 ----
let currentEigyo = null;   // { eigyo_cd, eigyo_name }
let editContext = null;    // 編集中レコードの情報

// ---- 初期化 ----
document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  // 営業担当者を読み込む
  const cd = await getConfig('eigyo_cd');
  if (cd) {
    const e = await dbGet(STORES.EIGYO, cd);
    if (e) setCurrentEigyo(e);
  }
  updateDropboxStatus();
  // 認証コールバック後の復帰
  if (isDropboxConnected()) {
    updateDropboxStatus();
  }
});

function setCurrentEigyo(e) {
  currentEigyo = e;
  document.getElementById('menuUserLabel').innerHTML =
    `担当者：<span>${e.eigyo_name}（${e.eigyo_cd}）</span>`;
  // メニュー項目を有効化
  ['menuImport','menuHanmok','menuDaigae','menuExport'].forEach(id => {
    document.getElementById(id).classList.remove('disabled');
  });
  // フォルダ名表示
  document.getElementById('importFolderName').textContent = `/${e.eigyo_cd}/`;
  document.getElementById('exportFolderName').textContent = `/${e.eigyo_cd}/`;
}

// ---- 画面遷移 ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  // 画面別初期化
  if (id === 'screenEigyo') initEigyoScreen();
  if (id === 'screenHanmok') initHanmokScreen();
  if (id === 'screenDaigae') initDaigaeScreen();
  if (id === 'screenImport' || id === 'screenExport') updateDropboxStatus();
}

// ---- Dropboxステータス更新 ----
function updateDropboxStatus() {
  const connected = isDropboxConnected();
  ['Import','Export'].forEach(t => {
    const el = document.getElementById(`dropboxStatus${t}`);
    const txt = document.getElementById(`dropboxStatusText${t}`);
    if (connected) {
      el.className = 'dropbox-status connected';
      el.querySelector('span').textContent = '✓';
      txt.textContent = 'Dropbox接続済み';
      document.getElementById('dropboxAuthCard') && (document.getElementById('dropboxAuthCard').style.display = 'none');
    } else {
      el.className = 'dropbox-status disconnected';
      el.querySelector('span').textContent = '⚠';
      txt.textContent = 'Dropbox未接続';
    }
  });
  const authCard = document.getElementById('dropboxAuthCard');
  if (authCard) authCard.style.display = connected ? 'none' : 'block';
}

// ---- トースト ----
let toastTimer = null;
function showToast(msg, type = '') {
  const el = document.getElementById('toast');
  el.textContent = msg;
  el.className = 'show ' + type;
  clearTimeout(toastTimer);
  toastTimer = setTimeout(() => { el.className = ''; }, 2800);
}

// ---- ローディング ----
function showLoading(text = '処理中...') {
  document.getElementById('loadingText').textContent = text;
  document.getElementById('loadingOverlay').classList.remove('hidden');
}
function hideLoading() {
  document.getElementById('loadingOverlay').classList.add('hidden');
}

// ---- モーダル ----
function showModal(title, body, buttons) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls || 'btn-secondary');
    btn.textContent = b.label;
    btn.onclick = () => { hideModal(); b.action && b.action(); };
    footer.appendChild(btn);
  });
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function hideModal() {
  document.getElementById('modalOverlay').classList.add('hidden');
}

// =============================================
// 営業担当者登録
// =============================================
function initEigyoScreen() {
  if (currentEigyo) {
    document.getElementById('eigyoCd').value = currentEigyo.eigyo_cd;
    document.getElementById('eigyoName').value = currentEigyo.eigyo_name;
  } else {
    document.getElementById('eigyoCd').value = '';
    document.getElementById('eigyoName').value = '';
  }
}

async function saveEigyo() {
  const cd = document.getElementById('eigyoCd').value.trim();
  const name = document.getElementById('eigyoName').value.trim();
  if (!/^\d{1,3}$/.test(cd)) { showToast('担当者コードは数字3桁で入力してください', 'error'); return; }
  if (!name) { showToast('担当者名を入力してください', 'error'); return; }
  const padCd = String(parseInt(cd)).padStart(3, '0');
  const rec = { eigyo_cd: padCd, eigyo_name: name };
  await dbPut(STORES.EIGYO, rec);
  await setConfig('eigyo_cd', padCd);
  setCurrentEigyo(rec);
  showToast('担当者を登録しました', 'success');
  showScreen('screenMenu');
}

// =============================================
// データインポート
// =============================================
async function execImport() {
  if (!isDropboxConnected()) { showToast('Dropboxに接続してください', 'error'); return; }
  if (!currentEigyo) { showToast('営業担当者を登録してください', 'error'); return; }

  showModal('確認', '既存データをすべて削除してインポートします。<br>よろしいですか？', [
    { label: 'キャンセル' },
    { label: '実行', cls: 'btn-accent', action: doImport }
  ]);
}

async function doImport() {
  showLoading('インポート中...');
  const folder = '/' + currentEigyo.eigyo_cd;
  const files = [
    { name: 'shohin.csv', label: '商品マスタ', store: STORES.SHOHIN, parser: parseShohinCSV },
    { name: 'tokuis.csv', label: '得意先マスタ', store: STORES.TOKUISAKI, parser: parseTokuisakiCSV },
    { name: 'stanka.csv', label: '商品単価マスタ', store: STORES.TANKA, parser: parseTankaCSV },
    { name: 'hanmok.csv', label: '販売目標データ', store: STORES.HANMOK, parser: parseHanmokCSV }
  ];

  const resultArea = document.getElementById('importResultArea');
  const resultList = document.getElementById('importResultList');
  resultList.innerHTML = '';
  resultArea.style.display = 'block';

  for (const f of files) {
    try {
      const buf = await dropboxDownload(`${folder}/${f.name}`);
      const text = decodeShiftJIS(buf);
      const records = f.parser(text);
      await dbClear(f.store);
      await dbBulkPut(f.store, records);
      addImportResult(resultList, f.label, `${records.length}件`, 'ok');
    } catch (e) {
      addImportResult(resultList, f.label, `エラー: ${e.message}`, 'err');
    }
  }
  hideLoading();
  showToast('インポート完了', 'success');
}

function addImportResult(list, label, msg, cls) {
  const li = document.createElement('li');
  li.className = cls;
  li.innerHTML = `<span>${cls === 'ok' ? '✓' : '✗'}</span><span>${label}：${msg}</span>`;
  list.appendChild(li);
}

// =============================================
// 販売目標確認
// =============================================
async function initHanmokScreen() {
  const sel = document.getElementById('hanmokShohinSel');
  sel.innerHTML = '<option value="">-- 商品を選択 --</option>';
  const shohinList = await dbGetAll(STORES.SHOHIN);
  shohinList.sort((a,b) => a.shohin_kbn.localeCompare(b.shohin_kbn) || a.shohin_cd.localeCompare(b.shohin_cd));
  for (const s of shohinList) {
    const opt = document.createElement('option');
    opt.value = JSON.stringify({ kbn: s.shohin_kbn, cd: s.shohin_cd });
    opt.textContent = `[${s.shohin_kbn === '1' ? '差込' : '代替'}] ${s.shohin_name}`;
    sel.appendChild(opt);
  }
  document.getElementById('hanmokTableContainer').innerHTML =
    '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">商品を選択してください</div>';
  document.getElementById('addTokuisakiBtn').style.display = 'none';
}

async function renderHanmokTable() {
  const sel = document.getElementById('hanmokShohinSel');
  const val = sel.value;
  if (!val) return;
  const { kbn, cd } = JSON.parse(val);
  const hyoji = document.querySelector('input[name="hyoji"]:checked').value;
  const isGk = hyoji === '1'; // 金額表示モード

  // 代替商品なら「得意先追加」ボタンを表示
  document.getElementById('addTokuisakiBtn').style.display = kbn === '2' ? 'flex' : 'none';

  // データ取得
  const allHanmok = await dbGetAll(STORES.HANMOK);
  const tokuisakiMap = {};
  (await dbGetAll(STORES.TOKUISAKI)).forEach(t => { tokuisakiMap[t.tokuisaki_cd] = t.tokuisaki_name; });

  const filtered = allHanmok.filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd &&
    h.shohin_kbn === kbn && h.shohin_cd === cd
  );

  // 得意先一覧
  const tokuiSet = [...new Set(filtered.map(h => h.tokuisaki_cd))].sort();

  if (tokuiSet.length === 0) {
    document.getElementById('hanmokTableContainer').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">データがありません</div>';
    return;
  }

  // 現在年月
  const now = new Date();
  const nendo = getNendo(now);

  // 単価マップを事前取得（tokuisaki_cd → tanka）
  const tankaAll = await dbGetAll(STORES.TANKA);
  const shohin = await dbGet(STORES.SHOHIN, [kbn, cd]);
  function getTanka(tcd) {
    const t = tankaAll.find(r => r.shohin_kbn === kbn && r.shohin_cd === cd && r.tokuisaki_cd === tcd);
    return t ? t.hanbai_tanka : (shohin ? shohin.hanbai_tanka : 0);
  }

  // テーブル構築
  const table = document.createElement('table');
  table.className = 'hanmok-table';

  // ヘッダー行
  const thead = document.createElement('thead');
  const trHead = document.createElement('tr');
  const thT = document.createElement('th');
  thT.className = 'col-tokuisaki';
  thT.textContent = '得意先';
  trHead.appendChild(thT);
  for (const ts of TSUKI_LIST) {
    const th = document.createElement('th');
    const yr = getActualYear(ts, nendo);
    th.innerHTML = `<span class="month-header-year">${yr}年</span>${TSUKI_LABELS[ts]}`;
    trHead.appendChild(th);
  }
  const thTotal = document.createElement('th');
  thTotal.textContent = '合計';
  trHead.appendChild(thTotal);
  thead.appendChild(trHead);
  table.appendChild(thead);

  // データ行
  const tbody = document.createElement('tbody');

  // 合計更新用関数（行合計・列合計・総合計を再計算）
  function recalcTotals() {
    const rows = tbody.querySelectorAll('tr.data-row');
    const colSums = Object.fromEntries(TSUKI_LIST.map(t => [t, 0]));
    let grand = 0;

    rows.forEach(tr => {
      let rowSum = 0;
      TSUKI_LIST.forEach(ts => {
        const cell = tr.querySelector(`[data-tsuki="${ts}"]`);
        if (!cell) return;
        const inp = cell.querySelector('input.cell-input');
        const v = inp ? (parseInt(inp.value) || 0) : (parseInt(cell.dataset.gk) || 0);
        colSums[ts] += v;
        rowSum += v;
      });
      const rowTotalTd = tr.querySelector('.cell-row-total');
      if (rowTotalTd) rowTotalTd.textContent = rowSum.toLocaleString();
      grand += rowSum;
    });

    // 列合計行を更新
    const totalRow = tbody.querySelector('tr.row-total');
    if (totalRow) {
      TSUKI_LIST.forEach(ts => {
        const td = totalRow.querySelector(`[data-tsuki="${ts}"]`);
        if (td) td.textContent = (colSums[ts] || 0).toLocaleString();
      });
      const grandTd = totalRow.querySelector('.cell-grand-total');
      if (grandTd) grandTd.textContent = grand.toLocaleString();
    }
  }

  for (const tcd of tokuiSet) {
    const tanka = getTanka(tcd);
    const tr = document.createElement('tr');
    tr.className = 'data-row';

    const tdName = document.createElement('td');
    tdName.className = 'col-tokuisaki';
    tdName.textContent = tokuisakiMap[tcd] || tcd;
    tr.appendChild(tdName);

    let rowTotal = 0;
    for (const ts of TSUKI_LIST) {
      const rec = filtered.find(h => h.tokuisaki_cd === tcd && h.tsuki === ts);
      const su = rec ? rec.hanbai_mokuhyo_su : 0;
      const gk = rec ? rec.hanbai_mokuhyo_gk : 0;
      const past = isPastMonth(ts, now, nendo);

      const td = document.createElement('td');
      td.className = 'cell-data';
      td.dataset.tsuki = ts;
      td.dataset.gk = gk; // 金額モード用

      if (isGk) {
        // 金額表示：テキストのみ
        td.classList.add('past'); // 編集不可スタイル流用
        const span = document.createElement('span');
        span.className = 'cell-inner';
        span.textContent = gk.toLocaleString();
        td.appendChild(span);
        rowTotal += gk;
      } else if (past) {
        // 過去月：テキストのみ
        td.classList.add('past');
        const span = document.createElement('span');
        span.className = 'cell-inner';
        span.textContent = su.toLocaleString();
        td.appendChild(span);
        rowTotal += su;
      } else {
        // 数量・編集可：inputを直接配置
        const inp = document.createElement('input');
        inp.type = 'number';
        inp.className = 'cell-input';
        inp.value = su;
        inp.min = 0;
        inp.inputMode = 'numeric';
        inp.dataset.tcd = tcd;
        inp.dataset.ts = ts;
        inp.dataset.tanka = tanka;

        // フォーカス時：全選択
        inp.addEventListener('focus', () => inp.select());

        // 入力確定時（focusout）：DB保存 & 金額再計算 & 合計更新
        inp.addEventListener('change', async () => {
          const newSu = parseInt(inp.value) || 0;
          inp.value = newSu;
          const newGk = Math.floor(newSu * tanka / 10) * 10;
          td.dataset.gk = newGk;
          await dbPut(STORES.HANMOK, {
            eigyo_cd: currentEigyo.eigyo_cd,
            shohin_kbn: kbn,
            shohin_cd: cd,
            tokuisaki_cd: tcd,
            tsuki: ts,
            hanbai_mokuhyo_su: newSu,
            hanbai_tanka: tanka,
            hanbai_mokuhyo_gk: newGk
          });
          recalcTotals();
        });

        td.appendChild(inp);
        rowTotal += su;
      }
      tr.appendChild(td);
    }

    const tdRow = document.createElement('td');
    tdRow.className = 'cell-total cell-row-total';
    tdRow.textContent = rowTotal.toLocaleString();
    tr.appendChild(tdRow);
    tbody.appendChild(tr);
  }

  // 列合計行
  const colTotals = Object.fromEntries(TSUKI_LIST.map(ts => {
    const v = filtered
      .filter(h => h.tsuki === ts)
      .reduce((s, h) => s + (isGk ? h.hanbai_mokuhyo_gk : h.hanbai_mokuhyo_su), 0);
    return [ts, v];
  }));
  const grandTotal = Object.values(colTotals).reduce((a, b) => a + b, 0);

  const trTotal = document.createElement('tr');
  trTotal.className = 'row-total';
  const tdTotalLabel = document.createElement('td');
  tdTotalLabel.className = 'col-tokuisaki';
  tdTotalLabel.textContent = '合計';
  trTotal.appendChild(tdTotalLabel);
  for (const ts of TSUKI_LIST) {
    const td = document.createElement('td');
    td.className = 'cell-total';
    td.dataset.tsuki = ts;
    td.textContent = (colTotals[ts] || 0).toLocaleString();
    trTotal.appendChild(td);
  }
  const tdGrand = document.createElement('td');
  tdGrand.className = 'cell-total cell-grand-total';
  tdGrand.textContent = grandTotal.toLocaleString();
  trTotal.appendChild(tdGrand);
  tbody.appendChild(trTotal);

  table.appendChild(tbody);
  const container = document.getElementById('hanmokTableContainer');
  container.innerHTML = '';
  container.appendChild(table);
}

// 年度計算（3月始まり）
function getNendo(date) {
  const y = date.getFullYear();
  const m = date.getMonth() + 1;
  return m >= 3 ? y : y - 1;
}

// 月コードから実際の年を返す
function getActualYear(tsuki, nendo) {
  const t = parseInt(tsuki);
  return t >= 3 ? nendo : nendo + 1;
}

// 過去月判定
function isPastMonth(tsuki, now, nendo) {
  const t = parseInt(tsuki);
  const targetYear = getActualYear(tsuki, nendo);
  const targetMonth = t;
  const curYear = now.getFullYear();
  const curMonth = now.getMonth() + 1;
  if (targetYear < curYear) return true;
  if (targetYear === curYear && targetMonth < curMonth) return true;
  return false;
}


// =============================================
// 代替商品×得意先追加（販売目標確認画面）
// =============================================
async function showAddTokuisakiModal() {
  const sel = document.getElementById('hanmokShohinSel');
  const { kbn, cd } = JSON.parse(sel.value);
  const allTokuisaki = await dbGetAll(STORES.TOKUISAKI);
  allTokuisaki.sort((a,b) => a.tokuisaki_cd.localeCompare(b.tokuisaki_cd));

  // すでに登録済みの得意先を除外
  const allHanmok = await dbGetAll(STORES.HANMOK);
  const existSet = new Set(
    allHanmok.filter(h => h.eigyo_cd === currentEigyo.eigyo_cd && h.shohin_kbn === kbn && h.shohin_cd === cd)
             .map(h => h.tokuisaki_cd)
  );

  const opts = allTokuisaki.filter(t => !existSet.has(t.tokuisaki_cd));
  if (opts.length === 0) { showToast('追加できる得意先がありません', 'error'); return; }

  const selHtml = `<select class="form-input" id="modalTokuisakiSel">
    ${opts.map(t => `<option value="${t.tokuisaki_cd}">${t.tokuisaki_name}（${t.tokuisaki_cd}）</option>`).join('')}
  </select>`;
  showModal('得意先追加', `<div class="form-row"><label class="form-label">得意先を選択</label>${selHtml}</div>`, [
    { label: 'キャンセル' },
    { label: '追加', cls: 'btn-primary', action: () => addTokuisakiToHanmok(kbn, cd) }
  ]);
}

async function addTokuisakiToHanmok(shohinKbn, shohinCd) {
  const tokuisakiCd = document.getElementById('modalTokuisakiSel').value;
  if (!tokuisakiCd) return;

  // 全月分のレコードを0で追加
  const now = new Date();
  const nendo = getNendo(now);
  let tanka = 0;
  const tankaRec = await dbGet(STORES.TANKA, [shohinKbn, shohinCd, tokuisakiCd]);
  if (tankaRec) tanka = tankaRec.hanbai_tanka;
  else {
    const shohin = await dbGet(STORES.SHOHIN, [shohinKbn, shohinCd]);
    if (shohin) tanka = shohin.hanbai_tanka;
  }

  for (const ts of TSUKI_LIST) {
    await dbPut(STORES.HANMOK, {
      eigyo_cd: currentEigyo.eigyo_cd,
      shohin_kbn: shohinKbn,
      shohin_cd: shohinCd,
      tokuisaki_cd: tokuisakiCd,
      tsuki: ts,
      hanbai_mokuhyo_su: 0,
      hanbai_tanka: tanka,
      hanbai_mokuhyo_gk: 0
    });
  }
  showToast('得意先を追加しました', 'success');
  renderHanmokTable();
}

// =============================================
// 代替商品登録
// =============================================
async function initDaigaeScreen() {
  if (!currentEigyo) return;
  const seq = await getNextDaigaeSeq(currentEigyo.eigyo_cd);
  const cd = 'ZDAIGAE' + String(currentEigyo.eigyo_cd).padStart(3,'0') + String(seq).padStart(5,'0');
  document.getElementById('daigaeCd').value = cd;
  document.getElementById('daigaeName').value = '';
  document.getElementById('daigaeTanka').value = '';
}

async function saveDaigae() {
  const cd = document.getElementById('daigaeCd').value;
  const name = document.getElementById('daigaeName').value.trim();
  const tanka = parseFloat(document.getElementById('daigaeTanka').value) || 0;
  if (!name) { showToast('商品名を入力してください', 'error'); return; }
  if (tanka < 0) { showToast('販売単価を入力してください', 'error'); return; }

  await dbPut(STORES.SHOHIN, {
    shohin_kbn: '2',
    shohin_cd: cd,
    shohin_name: name,
    hanbai_tanka: tanka
  });
  showToast('代替商品を登録しました', 'success');
  showScreen('screenMenu');
}

// =============================================
// データエクスポート
// =============================================
async function execExport() {
  if (!isDropboxConnected()) { showToast('Dropboxに接続してください', 'error'); return; }
  if (!currentEigyo) { showToast('営業担当者を登録してください', 'error'); return; }

  showModal('確認', 'Dropboxの既存ファイルを上書きしてエクスポートします。<br>よろしいですか？', [
    { label: 'キャンセル' },
    { label: 'OK', cls: 'btn-accent', action: doExport }
  ]);
}

async function doExport() {
  showLoading('エクスポート中...');
  const folder = '/' + currentEigyo.eigyo_cd;

  const resultArea = document.getElementById('exportResultArea');
  const resultList = document.getElementById('exportResultList');
  resultList.innerHTML = '';
  resultArea.style.display = 'block';

  const tasks = [
    {
      name: 'shohin.csv', label: '商品マスタ',
      getData: () => dbGetAll(STORES.SHOHIN),
      build: buildShohinCSV
    },
    {
      name: 'tokuis.csv', label: '得意先マスタ',
      getData: () => dbGetAll(STORES.TOKUISAKI),
      build: buildTokuisakiCSV
    },
    {
      name: 'stanka.csv', label: '商品単価マスタ',
      getData: () => dbGetAll(STORES.TANKA),
      build: buildTankaCSV
    },
    {
      name: 'hanmok.csv', label: '販売目標データ',
      getData: () => dbGetAll(STORES.HANMOK),
      build: buildHanmokCSV
    }
  ];

  for (const t of tasks) {
    try {
      const records = await t.getData();
      const csvText = t.build(records);
      const bytes = encodeShiftJIS(csvText);
      await dropboxUpload(`${folder}/${t.name}`, bytes);
      addImportResult(resultList, t.label, `${records.length}件`, 'ok');
    } catch (e) {
      addImportResult(resultList, t.label, `エラー: ${e.message}`, 'err');
    }
  }
  hideLoading();
  showToast('エクスポート完了', 'success');
}

// Service Worker登録
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(() => {});
}

// 古いService Workerキャッシュを強制クリア
if ('serviceWorker' in navigator && 'caches' in window) {
  caches.keys().then(keys => {
    keys.filter(k => k !== 'hanmok-v3').forEach(k => caches.delete(k));
  });
}
