// ===== app.js =====

const SHOHIN_KBN_LABEL = { '1':'差込商品','2':'戦略商品','3':'努力目標','4':'備品' };
const TSUKI_LIST  = ['03','04','05','06','07','08','09','10','11','12','01','02'];
const TSUKI_LABEL = { '03':'3月','04':'4月','05':'5月','06':'6月','07':'7月','08':'8月','09':'9月','10':'10月','11':'11月','12':'12月','01':'1月','02':'2月' };

let currentEigyo = null;

// ---- 初期化 ----
document.addEventListener('DOMContentLoaded', async () => {
  await openDB();
  const cd = await getConfig('eigyo_cd');
  if (cd) {
    const e = await dbGet(STORES.EIGYO, cd);
    if (e) setCurrentEigyo(e);
  }
  updateDropboxStatus();
});

function setCurrentEigyo(e) {
  currentEigyo = e;
  document.getElementById('menuUserLabel').innerHTML = `担当者：<span>${e.eigyo_name}（${e.eigyo_cd}）</span>`;
  ['menuImport','menuHanmok','menuShukei','menuTokuiShukei','menuExport'].forEach(id => {
    document.getElementById(id).classList.remove('disabled');
  });
  document.getElementById('importFolderName').textContent = `/${e.eigyo_cd}/`;
  document.getElementById('exportFolderName').textContent = `/${e.eigyo_cd}/`;
}

// ---- 画面遷移 ----
function showScreen(id) {
  document.querySelectorAll('.screen').forEach(s => s.classList.remove('active'));
  document.getElementById(id).classList.add('active');
  if (id === 'screenEigyo')       initEigyoScreen();
  if (id === 'screenHanmok')      initHanmokScreen();
  if (id === 'screenShukei')      initShukeiScreen();
  if (id === 'screenTokuiShukei') initTokuiShukeiScreen();
  if (id === 'screenImport' || id === 'screenExport') updateDropboxStatus();
}

// ---- Dropboxステータス ----
function updateDropboxStatus() {
  const ok = isDropboxConnected();
  ['Import','Export'].forEach(t => {
    const el  = document.getElementById(`dropboxStatus${t}`);
    const txt = document.getElementById(`dropboxStatusText${t}`);
    el.className = 'dropbox-status ' + (ok ? 'connected' : 'disconnected');
    el.querySelector('span').textContent = ok ? '✓' : '⚠';
    txt.textContent = ok ? 'Dropbox接続済み' : 'Dropbox未接続';
  });
  const ac = document.getElementById('dropboxAuthCard');
  if (ac) ac.style.display = ok ? 'none' : 'block';
}

// ---- トースト ----
let _toastTimer = null;
function showToast(msg, type='') {
  const el = document.getElementById('toast');
  el.textContent = msg; el.className = 'show ' + type;
  clearTimeout(_toastTimer);
  _toastTimer = setTimeout(() => { el.className=''; }, 2800);
}

// ---- ローディング ----
function showLoading(t='処理中...') { document.getElementById('loadingText').textContent=t; document.getElementById('loadingOverlay').classList.remove('hidden'); }
function hideLoading() { document.getElementById('loadingOverlay').classList.add('hidden'); }

// ---- モーダル ----
function showModal(title, body, buttons) {
  document.getElementById('modalTitle').textContent = title;
  document.getElementById('modalBody').innerHTML = body;
  const footer = document.getElementById('modalFooter');
  footer.innerHTML = '';
  buttons.forEach(b => {
    const btn = document.createElement('button');
    btn.className = 'btn ' + (b.cls||'btn-secondary');
    btn.textContent = b.label;
    btn.onclick = () => { hideModal(); b.action && b.action(); };
    footer.appendChild(btn);
  });
  document.getElementById('modalOverlay').classList.remove('hidden');
}
function hideModal() { document.getElementById('modalOverlay').classList.add('hidden'); }

// ---- 年度ユーティリティ ----
function getNendo(date) {
  const y = date.getFullYear(), m = date.getMonth()+1;
  return m >= 3 ? y : y-1;
}
function getActualYear(tsuki, nendo) {
  return parseInt(tsuki) >= 3 ? nendo : nendo+1;
}
function isPastMonth(tsuki, now, nendo) {
  const ty = getActualYear(tsuki, nendo), tm = parseInt(tsuki);
  const cy = now.getFullYear(), cm = now.getMonth()+1;
  return ty < cy || (ty === cy && tm < cm);
}
// 年度リストを生成（DBから取得した年の一覧）
async function buildNendoList() {
  const all = await dbGetAll(STORES.HANMOK);
  const nenSet = new Set(all.map(h => {
    // nen=年、tsuki=月 → 3月以上なら当年が年度開始
    return parseInt(h.tsuki) >= 3 ? parseInt(h.nen) : parseInt(h.nen)-1;
  }));
  return [...nenSet].sort((a,b) => b-a); // 降順
}

// =============================================
// 営業担当者登録
// =============================================
function initEigyoScreen() {
  document.getElementById('eigyoCd').value  = currentEigyo ? currentEigyo.eigyo_cd   : '';
  document.getElementById('eigyoName').value = currentEigyo ? currentEigyo.eigyo_name : '';
}
async function saveEigyo() {
  const cd   = document.getElementById('eigyoCd').value.trim();
  const name = document.getElementById('eigyoName').value.trim();
  if (!/^\d{1,3}$/.test(cd)) { showToast('担当者コードは数字3桁で入力してください','error'); return; }
  if (!name) { showToast('担当者名を入力してください','error'); return; }
  const padCd = cd.padStart(3,'0');
  const rec = { eigyo_cd: padCd, eigyo_name: name };
  await dbPut(STORES.EIGYO, rec);
  await setConfig('eigyo_cd', padCd);
  setCurrentEigyo(rec);
  showToast('担当者を登録しました','success');
  showScreen('screenMenu');
}

// =============================================
// データインポート
// =============================================
async function execImport() {
  if (!isDropboxConnected()) { showToast('Dropboxに接続してください','error'); return; }
  if (!currentEigyo)         { showToast('営業担当者を登録してください','error'); return; }
  showModal('確認','既存データをすべて削除してインポートします。<br>よろしいですか？',[
    { label:'キャンセル' },
    { label:'実行', cls:'btn-accent', action: doImport }
  ]);
}
async function doImport() {
  showLoading('インポート中...');
  const folder = '/' + currentEigyo.eigyo_cd;
  const files = [
    { name:'shohin.csv',  label:'商品マスタ',     store:STORES.SHOHIN,    parser:parseShohinCSV  },
    { name:'tokuis.csv',  label:'得意先マスタ',   store:STORES.TOKUISAKI, parser:parseTokuisakiCSV },
    { name:'hanmok.csv',  label:'販売目標データ', store:STORES.HANMOK,    parser:parseHanmokCSV  },
    { name:'hanjsk.csv',  label:'販売実績データ', store:STORES.HANJSK,    parser:parseHanjskCSV  }
  ];
  const resultArea = document.getElementById('importResultArea');
  const resultList = document.getElementById('importResultList');
  resultList.innerHTML = ''; resultArea.style.display = 'block';
  for (const f of files) {
    try {
      const buf  = await dropboxDownload(`${folder}/${f.name}`);
      const text = decodeShiftJIS(buf);
      const recs = f.parser(text);
      await dbClear(f.store);
      await dbBulkPut(f.store, recs);
      addResult(resultList, f.label, `${recs.length}件`, 'ok');
    } catch(e) {
      addResult(resultList, f.label, `エラー: ${e.message}`, 'err');
    }
  }
  hideLoading();
  showToast('インポート完了','success');
}
function addResult(list, label, msg, cls) {
  const li = document.createElement('li');
  li.className = cls;
  li.innerHTML = `<span>${cls==='ok'?'✓':'✗'}</span><span>${label}：${msg}</span>`;
  list.appendChild(li);
}

// =============================================
// 販売目標確認
// =============================================
async function initHanmokScreen() {
  // 年度セレクト
  const nendoSel = document.getElementById('hanmokNendoSel');
  nendoSel.innerHTML = '';
  const nendos = await buildNendoList();
  const curNendo = getNendo(new Date());
  if (nendos.length === 0) nendos.push(curNendo);
  nendos.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = `${n}年度`;
    if (n === curNendo) opt.selected = true;
    nendoSel.appendChild(opt);
  });

  // 商品セレクト
  const shohinSel = document.getElementById('hanmokShohinSel');
  shohinSel.innerHTML = '<option value="">-- 商品を選択 --</option>';
  const shohinList = await dbGetAll(STORES.SHOHIN);
  shohinList.sort((a,b) => a.shohin_kbn.localeCompare(b.shohin_kbn)||a.shohin_cd.localeCompare(b.shohin_cd));
  for (const s of shohinList) {
    const opt = document.createElement('option');
    opt.value = JSON.stringify({ kbn:s.shohin_kbn, cd:s.shohin_cd });
    opt.textContent = `[${SHOHIN_KBN_LABEL[s.shohin_kbn]||s.shohin_kbn}] ${s.shohin_name}`;
    shohinSel.appendChild(opt);
  }
  document.getElementById('hanmokTableContainer').innerHTML =
    '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">商品を選択してください</div>';
}

async function renderHanmokTable() {
  const val = document.getElementById('hanmokShohinSel').value;
  if (!val) return;
  const { kbn, cd } = JSON.parse(val);
  const nendo  = parseInt(document.getElementById('hanmokNendoSel').value);
  const isGk   = document.querySelector('input[name="hyoji"]:checked').value === '1';
  const now    = new Date();

  // マスタ取得
  const shohin = await dbGet(STORES.SHOHIN, [kbn, cd]);
  const tanka  = shohin ? shohin.hanbai_tanka : 0;
  const tokuisakiMap = {};
  (await dbGetAll(STORES.TOKUISAKI)).forEach(t => { tokuisakiMap[t.tokuisaki_cd] = t.tokuisaki_name; });

  // 対象年月セット（年度＝nendo年3月〜nendo+1年2月）
  const targetNenTsuki = TSUKI_LIST.map(ts => ({
    ts, nen: String(parseInt(ts) >= 3 ? nendo : nendo+1)
  }));

  // データ取得
  const allHanmok = (await dbGetAll(STORES.HANMOK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd && h.shohin_kbn === kbn && h.shohin_cd === cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );
  const allHanjsk = (await dbGetAll(STORES.HANJSK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd && h.shohin_kbn === kbn && h.shohin_cd === cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );

  const tokuiSet = [...new Set(allHanmok.map(h => h.tokuisaki_cd))].sort();
  if (tokuiSet.length === 0) {
    document.getElementById('hanmokTableContainer').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">データがありません</div>';
    return;
  }

  // テーブル構築
  const table = document.createElement('table');
  table.className = 'hanmok-table';

  // ヘッダー
  const thead = document.createElement('thead');
  const trH = document.createElement('tr');
  mkTh(trH, '得意先', 'col-fix');
  mkTh(trH, '', 'col-rowtype');
  targetNenTsuki.forEach(({ ts, nen }) => {
    const th = document.createElement('th');
    th.innerHTML = `<span class="month-year">${nen}年</span>${TSUKI_LABEL[ts]}`;
    trH.appendChild(th);
  });
  mkTh(trH, '合計');
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');

  // 列合計用
  const colMok = {}, colJsk = {};
  targetNenTsuki.forEach(({ ts }) => { colMok[ts]=0; colJsk[ts]=0; });
  let grandMok=0, grandJsk=0;

  for (const tcd of tokuiSet) {
    const tName = tokuisakiMap[tcd] || tcd;
    let rowMok=0, rowJsk=0;

    // 行データ収集
    const moks = {}, jsks = {};
    targetNenTsuki.forEach(({ ts, nen }) => {
      const mRec = allHanmok.find(h => h.tokuisaki_cd===tcd && h.tsuki===ts && h.nen===nen);
      const jRec = allHanjsk.find(h => h.tokuisaki_cd===tcd && h.tsuki===ts && h.nen===nen);
      const mSu  = mRec ? mRec.hanbai_mokuhyo_su : 0;
      const jSu  = jRec ? jRec.hanbai_jisseki_su : 0;
      moks[ts] = { su: mSu, gk: Math.floor(mSu * tanka / 10)*10, nen, rec: mRec };
      jsks[ts] = { su: jSu, gk: Math.floor(jSu * tanka / 10)*10 };
    });

    // 目標行
    const trMok = document.createElement('tr');
    trMok.className = 'tr-mok';
    const tdMokName = document.createElement('td');
    tdMokName.className = 'col-fix';
    tdMokName.rowSpan = 3;
    tdMokName.textContent = tName;
    tdMokName.style.verticalAlign = 'middle';
    trMok.appendChild(tdMokName);
    const tdMokType = document.createElement('td');
    tdMokType.className = 'col-rowtype mok'; tdMokType.textContent = '目標';
    trMok.appendChild(tdMokType);

    // 実績行
    const trJsk = document.createElement('tr');
    trJsk.className = 'tr-jsk';
    const tdJskType = document.createElement('td');
    tdJskType.className = 'col-rowtype jsk'; tdJskType.textContent = '実績';
    trJsk.appendChild(tdJskType);

    // 差異行
    const trSa = document.createElement('tr');
    trSa.className = 'tr-sa tr-sa-last';
    const tdSaType = document.createElement('td');
    tdSaType.className = 'col-rowtype sa'; tdSaType.textContent = '差異';
    trSa.appendChild(tdSaType);

    targetNenTsuki.forEach(({ ts, nen }) => {
      const m   = moks[ts], j = jsks[ts];
      const mVal = isGk ? m.gk : m.su;
      const jVal = isGk ? j.gk : j.su;
      const sa   = jVal - mVal;
      const past = isPastMonth(ts, now, nendo);

      // 目標セル
      const tdM = document.createElement('td');
      tdM.className = 'cell-data tr-mok';
      if (isGk || past) {
        // 金額モードまたは過去月はテキスト表示
        if (past && !isGk) tdM.classList.add('past');
        const sp = document.createElement('span');
        sp.className = 'cell-inner'; sp.textContent = mVal.toLocaleString();
        tdM.appendChild(sp);
      } else {
        // 数量モード・未来月→直接入力
        const inp = document.createElement('input');
        inp.type = 'number'; inp.className = 'cell-input';
        inp.value = m.su; inp.min = 0; inp.inputMode = 'numeric';
        inp.addEventListener('focus', () => inp.select());
        inp.addEventListener('change', async () => {
          const newSu = parseInt(inp.value)||0;
          inp.value = newSu;
          await dbPut(STORES.HANMOK, {
            eigyo_cd: currentEigyo.eigyo_cd,
            shohin_kbn: kbn, shohin_cd: cd,
            tokuisaki_cd: tcd, nen, tsuki: ts,
            hanbai_mokuhyo_su: newSu
          });
          // 差異セルを更新
          const newMVal = newSu;
          const newJVal = isGk ? j.gk : j.su;
          const newSa   = newJVal - newMVal;
          tdSaCell[ts].textContent = newSa.toLocaleString();
          tdSaCell[ts].className   = 'cell-inner' + (newSa < 0 ? ' sa-minus':'');
          recalcHanmokTotals(tbody, targetNenTsuki, isGk, tanka);
        });
        tdM.appendChild(inp);
      }
      trMok.appendChild(tdM);

      // 実績セル
      const tdJ = document.createElement('td');
      tdJ.className = 'cell-data tr-jsk';
      const spJ = document.createElement('span');
      spJ.className = 'cell-inner'; spJ.textContent = jVal.toLocaleString();
      tdJ.appendChild(spJ); trJsk.appendChild(tdJ);

      // 差異セル
      const tdS = document.createElement('td');
      tdS.className = 'cell-data tr-sa';
      const spS = document.createElement('span');
      spS.className = 'cell-inner' + (sa < 0 ? ' sa-minus':'');
      spS.textContent = sa.toLocaleString();
      tdS.appendChild(spS); trSa.appendChild(tdS);

      rowMok += mVal; rowJsk += jVal;
      colMok[ts] += mVal; colJsk[ts] += jVal;
    });

    // 差異セル参照（change時更新用）
    const tdSaCell = {};
    trSa.querySelectorAll('td.cell-data').forEach((td, i) => {
      const ts = targetNenTsuki[i].ts;
      tdSaCell[ts] = td.querySelector('span.cell-inner');
    });

    // 行合計
    const rowSa = rowJsk - rowMok;
    appendTotal(trMok, rowMok, 'tr-mok');
    appendTotal(trJsk, rowJsk, 'tr-jsk');
    const tdSaTotal = appendTotal(trSa, rowSa, 'tr-sa');
    if (rowSa < 0) tdSaTotal.classList.add('sa-minus');

    grandMok += rowMok; grandJsk += rowJsk;
    tbody.appendChild(trMok);
    tbody.appendChild(trJsk);
    tbody.appendChild(trSa);
  }

  // 合計行（3行）
  ['目標','実績','差異'].forEach((label, idx) => {
    const cls = ['tr-mok','tr-jsk','tr-sa'][idx];
    const tr = document.createElement('tr');
    tr.className = 'row-total ' + cls;
    if (idx === 0) {
      const td = document.createElement('td');
      td.className = 'col-fix'; td.textContent = '合計'; td.rowSpan = 3;
      td.style.verticalAlign = 'middle'; td.style.fontWeight = '800';
      tr.appendChild(td);
    }
    const tdType = document.createElement('td');
    tdType.className = `col-rowtype ${['mok','jsk','sa'][idx]}`; tdType.textContent = label;
    tr.appendChild(tdType);
    targetNenTsuki.forEach(({ ts }) => {
      const td = document.createElement('td');
      td.className = 'cell-total';
      td.dataset.col = ts; td.dataset.rowtype = idx;
      // colMok/colJskにはすでにisGkに応じた値（金額 or 数量）が入っているので再計算不要
      const mVal = colMok[ts];
      const jVal = colJsk[ts];
      const val  = idx===0 ? mVal : idx===1 ? jVal : jVal-mVal;
      td.textContent = val.toLocaleString();
      if (idx===2 && val<0) td.classList.add('sa-minus');
      tr.appendChild(td);
    });
    const grandVal = idx===0 ? grandMok : idx===1 ? grandJsk : grandJsk-grandMok;
    const tdG = document.createElement('td');
    tdG.className = 'cell-total'; tdG.textContent = grandVal.toLocaleString();
    if (idx===2 && grandVal<0) tdG.classList.add('sa-minus');
    tr.appendChild(tdG);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  const container = document.getElementById('hanmokTableContainer');
  container.innerHTML = ''; container.appendChild(table);
}

function mkTh(tr, text, cls='') {
  const th = document.createElement('th');
  if (cls) th.className = cls;
  th.textContent = text;
  tr.appendChild(th);
  return th;
}
function appendTotal(tr, val, cls) {
  const td = document.createElement('td');
  td.className = 'cell-total ' + cls;
  td.textContent = val.toLocaleString();
  tr.appendChild(td);
  return td;
}

function recalcHanmokTotals(tbody, targetNenTsuki, isGk, tanka) {
  // 列ごとに目標・実績を再集計して合計行を更新
  targetNenTsuki.forEach(({ ts }) => {
    let sumMok=0, sumJsk=0;
    tbody.querySelectorAll(`td.cell-data[data-tsuki="${ts}"]`).forEach(() => {});
    // 簡易：合計行のtdを直接更新するため全行を走査
    const rows = [...tbody.querySelectorAll('tr.tr-mok:not(.row-total)')];
    rows.forEach(trMok => {
      const cells = [...trMok.querySelectorAll('td.cell-data')];
      const idx = targetNenTsuki.findIndex(nt => nt.ts === ts);
      if (idx < 0) return;
      const inp = cells[idx] && cells[idx].querySelector('input.cell-input');
      const sp  = cells[idx] && cells[idx].querySelector('span.cell-inner');
      const mSu = inp ? (parseInt(inp.value)||0) : (sp ? parseInt(sp.textContent.replace(/,/g,''))||0 : 0);
      sumMok += mSu;
    });
    const rowsJ = [...tbody.querySelectorAll('tr.tr-jsk:not(.row-total)')];
    rowsJ.forEach(trJsk => {
      const cells = [...trJsk.querySelectorAll('td.cell-data')];
      const idx = targetNenTsuki.findIndex(nt => nt.ts === ts);
      if (idx < 0) return;
      const sp = cells[idx] && cells[idx].querySelector('span.cell-inner');
      const jSu = sp ? parseInt(sp.textContent.replace(/,/g,''))||0 : 0;
      sumJsk += jSu;
    });
    // 合計行更新
    tbody.querySelectorAll(`td.cell-total[data-col="${ts}"]`).forEach(td => {
      const rowtype = parseInt(td.dataset.rowtype);
      const val = rowtype===0 ? sumMok : rowtype===1 ? sumJsk : sumJsk-sumMok;
      td.textContent = val.toLocaleString();
      td.classList.toggle('sa-minus', rowtype===2 && val<0);
    });
  });
}

// =============================================
// 商品別集計
// =============================================
async function initShukeiScreen() {
  const nendoSel = document.getElementById('shukeiNendoSel');
  nendoSel.innerHTML = '';
  const nendos = await buildNendoList();
  const curNendo = getNendo(new Date());
  if (nendos.length === 0) nendos.push(curNendo);
  nendos.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = `${n}年度`;
    if (n === curNendo) opt.selected = true;
    nendoSel.appendChild(opt);
  });
  renderShukeiTable();
}

async function renderShukeiTable() {
  const nendo = parseInt(document.getElementById('shukeiNendoSel').value);
  if (!nendo) return;
  const isGk = document.querySelector('input[name="hyojiS"]:checked').value === '1';

  const targetNenTsuki = TSUKI_LIST.map(ts => ({
    ts, nen: String(parseInt(ts) >= 3 ? nendo : nendo+1)
  }));

  const shohinList = await dbGetAll(STORES.SHOHIN);
  shohinList.sort((a,b) => a.shohin_kbn.localeCompare(b.shohin_kbn)||a.shohin_cd.localeCompare(b.shohin_cd));

  const allHanmok = (await dbGetAll(STORES.HANMOK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );
  const allHanjsk = (await dbGetAll(STORES.HANJSK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );

  // 商品別集計
  const shukeiData = [];
  for (const s of shohinList) {
    const moks = {}, jsks = {};
    targetNenTsuki.forEach(({ ts, nen }) => {
      const mRecs = allHanmok.filter(h => h.shohin_kbn===s.shohin_kbn && h.shohin_cd===s.shohin_cd && h.tsuki===ts && h.nen===nen);
      const jRecs = allHanjsk.filter(h => h.shohin_kbn===s.shohin_kbn && h.shohin_cd===s.shohin_cd && h.tsuki===ts && h.nen===nen);
      const mSu = mRecs.reduce((sum,h) => sum+h.hanbai_mokuhyo_su,0);
      const jSu = jRecs.reduce((sum,h) => sum+h.hanbai_jisseki_su,0);
      moks[ts] = { su:mSu, gk:Math.floor(mSu*(s.hanbai_tanka||0)/10)*10 };
      jsks[ts] = { su:jSu, gk:Math.floor(jSu*(s.hanbai_tanka||0)/10)*10 };
    });
    const hasMok = Object.values(moks).some(m => m.su > 0);
    const hasJsk = Object.values(jsks).some(j => j.su > 0);
    if (hasMok || hasJsk) shukeiData.push({ shohin:s, moks, jsks });
  }

  if (shukeiData.length === 0) {
    document.getElementById('shukeiTableContainer').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">データがありません</div>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'hanmok-table';

  // ヘッダー
  const thead = document.createElement('thead');
  const trH = document.createElement('tr');
  mkTh(trH, '商品名', 'col-fix');
  mkTh(trH, '', 'col-rowtype');
  targetNenTsuki.forEach(({ ts, nen }) => {
    const th = document.createElement('th');
    th.innerHTML = `<span class="month-year">${nen}年</span>${TSUKI_LABEL[ts]}`;
    trH.appendChild(th);
  });
  mkTh(trH, '合計');
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const totalMok = {}, totalJsk = {};
  targetNenTsuki.forEach(({ ts }) => { totalMok[ts]=0; totalJsk[ts]=0; });
  let gtMok=0, gtJsk=0;

  for (const { shohin, moks, jsks } of shukeiData) {
    let rowMok=0, rowJsk=0;
    ['目標','実績','差異'].forEach((label, idx) => {
      const cls = ['tr-mok','tr-jsk','tr-sa'][idx];
      const tr = document.createElement('tr');
      tr.className = cls + (idx===2 ? ' tr-sa-last' : '');

      if (idx === 0) {
        const td = document.createElement('td');
        td.className = 'col-fix'; td.rowSpan = 3;
        td.textContent = `[${SHOHIN_KBN_LABEL[shohin.shohin_kbn]||shohin.shohin_kbn}] ${shohin.shohin_name}`;
        td.style.verticalAlign = 'middle'; td.style.fontSize = '12px';
        tr.appendChild(td);
      }
      const tdType = document.createElement('td');
      tdType.className = `col-rowtype ${['mok','jsk','sa'][idx]}`; tdType.textContent = label;
      tr.appendChild(tdType);

      let rowSum = 0;
      targetNenTsuki.forEach(({ ts }) => {
        const m = moks[ts], j = jsks[ts];
        const mVal = isGk ? m.gk : m.su;
        const jVal = isGk ? j.gk : j.su;
        const val  = idx===0 ? mVal : idx===1 ? jVal : jVal-mVal;
        const td = document.createElement('td');
        td.className = 'cell-data ' + cls;
        const sp = document.createElement('span');
        sp.className = 'cell-inner' + (idx===2 && val<0 ? ' sa-minus':'');
        sp.textContent = val.toLocaleString();
        td.appendChild(sp); tr.appendChild(td);
        rowSum += val;
        if (idx===0) { rowMok+=mVal; totalMok[ts]+=mVal; }
        if (idx===1) { rowJsk+=jVal; totalJsk[ts]+=jVal; }
      });

      const tdT = document.createElement('td');
      tdT.className = 'cell-total ' + cls;
      if (idx===0) tdT.textContent = rowMok.toLocaleString();
      else if (idx===1) tdT.textContent = rowJsk.toLocaleString();
      else {
        const sa = rowJsk-rowMok;
        tdT.textContent = sa.toLocaleString();
        if (sa<0) tdT.classList.add('sa-minus');
      }
      tr.appendChild(tdT);
      tbody.appendChild(tr);
    });
    gtMok += rowMok; gtJsk += rowJsk;
  }

  // 総合計行
  ['目標','実績','差異'].forEach((label, idx) => {
    const cls = ['tr-mok','tr-jsk','tr-sa'][idx];
    const tr = document.createElement('tr');
    tr.className = 'row-total ' + cls;
    if (idx===0) {
      const td = document.createElement('td');
      td.className = 'col-fix'; td.textContent='合計'; td.rowSpan=3;
      td.style.verticalAlign='middle'; td.style.fontWeight='800';
      tr.appendChild(td);
    }
    const tdType = document.createElement('td');
    tdType.className = `col-rowtype ${['mok','jsk','sa'][idx]}`; tdType.textContent=label;
    tr.appendChild(tdType);
    targetNenTsuki.forEach(({ ts }) => {
      const mVal = totalMok[ts], jVal = totalJsk[ts];
      const val  = idx===0 ? mVal : idx===1 ? jVal : jVal-mVal;
      const td = document.createElement('td');
      td.className = 'cell-total';
      td.textContent = val.toLocaleString();
      if (idx===2 && val<0) td.classList.add('sa-minus');
      tr.appendChild(td);
    });
    const gv = idx===0?gtMok:idx===1?gtJsk:gtJsk-gtMok;
    const tdG = document.createElement('td');
    tdG.className='cell-total'; tdG.textContent=gv.toLocaleString();
    if (idx===2&&gv<0) tdG.classList.add('sa-minus');
    tr.appendChild(tdG);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  const container = document.getElementById('shukeiTableContainer');
  container.innerHTML = ''; container.appendChild(table);
}

// =============================================
// 得意先別集計
// =============================================
async function initTokuiShukeiScreen() {
  const nendoSel = document.getElementById('tokuiShukeiNendoSel');
  nendoSel.innerHTML = '';
  const nendos = await buildNendoList();
  const curNendo = getNendo(new Date());
  if (nendos.length === 0) nendos.push(curNendo);
  nendos.forEach(n => {
    const opt = document.createElement('option');
    opt.value = n; opt.textContent = `${n}年度`;
    if (n === curNendo) opt.selected = true;
    nendoSel.appendChild(opt);
  });
  renderTokuiShukeiTable();
}

async function renderTokuiShukeiTable() {
  const nendo = parseInt(document.getElementById('tokuiShukeiNendoSel').value);
  if (!nendo) return;
  const isGk = document.querySelector('input[name="hyojiT"]:checked').value === '1';

  const targetNenTsuki = TSUKI_LIST.map(ts => ({
    ts, nen: String(parseInt(ts) >= 3 ? nendo : nendo+1)
  }));

  // マスタ・データ取得
  const tokuisakiList = (await dbGetAll(STORES.TOKUISAKI))
    .sort((a,b) => a.tokuisaki_cd.localeCompare(b.tokuisaki_cd));
  const shohinList = await dbGetAll(STORES.SHOHIN);

  // 単価マップ（商品コード→単価）
  const tankaMap = {};
  shohinList.forEach(s => { tankaMap[`${s.shohin_kbn}_${s.shohin_cd}`] = s.hanbai_tanka || 0; });

  const allHanmok = (await dbGetAll(STORES.HANMOK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );
  const allHanjsk = (await dbGetAll(STORES.HANJSK)).filter(h =>
    h.eigyo_cd === currentEigyo.eigyo_cd &&
    targetNenTsuki.some(nt => nt.nen === h.nen && nt.ts === h.tsuki)
  );

  // 得意先別集計（全商品合計）
  const shukeiData = [];
  for (const t of tokuisakiList) {
    const moks = {}, jsks = {};
    targetNenTsuki.forEach(({ ts, nen }) => {
      const mRecs = allHanmok.filter(h => h.tokuisaki_cd === t.tokuisaki_cd && h.tsuki === ts && h.nen === nen);
      const jRecs = allHanjsk.filter(h => h.tokuisaki_cd === t.tokuisaki_cd && h.tsuki === ts && h.nen === nen);
      // 商品ごとに単価を掛けて金額合計
      const mSu = mRecs.reduce((s,h) => s + h.hanbai_mokuhyo_su, 0);
      const jSu = jRecs.reduce((s,h) => s + h.hanbai_jisseki_su, 0);
      const mGk = mRecs.reduce((s,h) => s + Math.floor(h.hanbai_mokuhyo_su * (tankaMap[`${h.shohin_kbn}_${h.shohin_cd}`]||0) / 10)*10, 0);
      const jGk = jRecs.reduce((s,h) => s + Math.floor(h.hanbai_jisseki_su * (tankaMap[`${h.shohin_kbn}_${h.shohin_cd}`]||0) / 10)*10, 0);
      moks[ts] = { su: mSu, gk: mGk };
      jsks[ts] = { su: jSu, gk: jGk };
    });
    const hasMok = Object.values(moks).some(m => m.su > 0);
    const hasJsk = Object.values(jsks).some(j => j.su > 0);
    if (hasMok || hasJsk) shukeiData.push({ tokuisaki: t, moks, jsks });
  }

  if (shukeiData.length === 0) {
    document.getElementById('tokuiShukeiTableContainer').innerHTML =
      '<div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">データがありません</div>';
    return;
  }

  const table = document.createElement('table');
  table.className = 'hanmok-table';

  // ヘッダー
  const thead = document.createElement('thead');
  const trH = document.createElement('tr');
  mkTh(trH, '得意先名', 'col-fix');
  mkTh(trH, '', 'col-rowtype');
  targetNenTsuki.forEach(({ ts, nen }) => {
    const th = document.createElement('th');
    th.innerHTML = `<span class="month-year">${nen}年</span>${TSUKI_LABEL[ts]}`;
    trH.appendChild(th);
  });
  mkTh(trH, '合計');
  thead.appendChild(trH);
  table.appendChild(thead);

  const tbody = document.createElement('tbody');
  const totalMok = {}, totalJsk = {};
  targetNenTsuki.forEach(({ ts }) => { totalMok[ts]=0; totalJsk[ts]=0; });
  let gtMok=0, gtJsk=0;

  for (const { tokuisaki, moks, jsks } of shukeiData) {
    let rowMok=0, rowJsk=0;
    ['目標','実績','差異'].forEach((label, idx) => {
      const cls = ['tr-mok','tr-jsk','tr-sa'][idx];
      const tr = document.createElement('tr');
      tr.className = cls + (idx===2 ? ' tr-sa-last' : '');

      if (idx === 0) {
        const td = document.createElement('td');
        td.className = 'col-fix'; td.rowSpan = 3;
        td.textContent = tokuisaki.tokuisaki_name;
        td.style.verticalAlign = 'middle'; td.style.fontSize = '12px';
        tr.appendChild(td);
      }
      const tdType = document.createElement('td');
      tdType.className = `col-rowtype ${['mok','jsk','sa'][idx]}`; tdType.textContent = label;
      tr.appendChild(tdType);

      targetNenTsuki.forEach(({ ts }) => {
        const m = moks[ts], j = jsks[ts];
        const mVal = isGk ? m.gk : m.su;
        const jVal = isGk ? j.gk : j.su;
        const val  = idx===0 ? mVal : idx===1 ? jVal : jVal-mVal;
        const td = document.createElement('td');
        td.className = 'cell-data ' + cls;
        const sp = document.createElement('span');
        sp.className = 'cell-inner' + (idx===2 && val<0 ? ' sa-minus':'');
        sp.textContent = val.toLocaleString();
        td.appendChild(sp); tr.appendChild(td);
        if (idx===0) { rowMok+=mVal; totalMok[ts]+=mVal; }
        if (idx===1) { rowJsk+=jVal; totalJsk[ts]+=jVal; }
      });

      const tdT = document.createElement('td');
      tdT.className = 'cell-total ' + cls;
      if (idx===0) tdT.textContent = rowMok.toLocaleString();
      else if (idx===1) tdT.textContent = rowJsk.toLocaleString();
      else {
        const sa = rowJsk-rowMok;
        tdT.textContent = sa.toLocaleString();
        if (sa<0) tdT.classList.add('sa-minus');
      }
      tr.appendChild(tdT);
      tbody.appendChild(tr);
    });
    gtMok += rowMok; gtJsk += rowJsk;
  }

  // 総合計行
  ['目標','実績','差異'].forEach((label, idx) => {
    const cls = ['tr-mok','tr-jsk','tr-sa'][idx];
    const tr = document.createElement('tr');
    tr.className = 'row-total ' + cls;
    if (idx===0) {
      const td = document.createElement('td');
      td.className = 'col-fix'; td.textContent='合計'; td.rowSpan=3;
      td.style.verticalAlign='middle'; td.style.fontWeight='800';
      tr.appendChild(td);
    }
    const tdType = document.createElement('td');
    tdType.className = `col-rowtype ${['mok','jsk','sa'][idx]}`; tdType.textContent=label;
    tr.appendChild(tdType);
    targetNenTsuki.forEach(({ ts }) => {
      const mVal = totalMok[ts], jVal = totalJsk[ts];
      const val  = idx===0 ? mVal : idx===1 ? jVal : jVal-mVal;
      const td = document.createElement('td');
      td.className = 'cell-total';
      td.textContent = val.toLocaleString();
      if (idx===2 && val<0) td.classList.add('sa-minus');
      tr.appendChild(td);
    });
    const gv = idx===0?gtMok:idx===1?gtJsk:gtJsk-gtMok;
    const tdG = document.createElement('td');
    tdG.className='cell-total'; tdG.textContent=gv.toLocaleString();
    if (idx===2&&gv<0) tdG.classList.add('sa-minus');
    tr.appendChild(tdG);
    tbody.appendChild(tr);
  });

  table.appendChild(tbody);
  const container = document.getElementById('tokuiShukeiTableContainer');
  container.innerHTML = ''; container.appendChild(table);
}

// =============================================
// データエクスポート
// =============================================
async function execExport() {
  if (!isDropboxConnected()) { showToast('Dropboxに接続してください','error'); return; }
  if (!currentEigyo)         { showToast('営業担当者を登録してください','error'); return; }
  showModal('確認','Dropboxの既存ファイルを上書きしてエクスポートします。<br>よろしいですか？',[
    { label:'キャンセル' },
    { label:'OK', cls:'btn-accent', action: doExport }
  ]);
}
async function doExport() {
  showLoading('エクスポート中...');
  const folder = '/' + currentEigyo.eigyo_cd;
  const resultArea = document.getElementById('exportResultArea');
  const resultList = document.getElementById('exportResultList');
  resultList.innerHTML = ''; resultArea.style.display = 'block';
  const tasks = [
    { name:'shohin.csv',  label:'商品マスタ',     getData:()=>dbGetAll(STORES.SHOHIN),    build:buildShohinCSV    },
    { name:'tokuis.csv',  label:'得意先マスタ',   getData:()=>dbGetAll(STORES.TOKUISAKI), build:buildTokuisakiCSV },
    { name:'hanmok.csv',  label:'販売目標データ', getData:()=>dbGetAll(STORES.HANMOK),    build:buildHanmokCSV    }
  ];
  for (const t of tasks) {
    try {
      const recs = await t.getData();
      const bytes = encodeShiftJIS(t.build(recs));
      await dropboxUpload(`${folder}/${t.name}`, bytes);
      addResult(resultList, t.label, `${recs.length}件`, 'ok');
    } catch(e) {
      addResult(resultList, t.label, `エラー: ${e.message}`, 'err');
    }
  }
  hideLoading();
  showToast('エクスポート完了','success');
}

// Service Worker
if ('serviceWorker' in navigator) {
  navigator.serviceWorker.register('sw.js').catch(()=>{});
  caches.keys().then(keys => {
    keys.filter(k => k !== 'hanmok-v6').forEach(k => caches.delete(k));
  });
}
