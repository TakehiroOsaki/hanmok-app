<!DOCTYPE html>
<html lang="ja">
<head>
<meta charset="UTF-8">
<meta name="viewport" content="width=device-width, initial-scale=1.0, maximum-scale=1.0, user-scalable=no">
<meta name="apple-mobile-web-app-capable" content="yes">
<meta name="apple-mobile-web-app-status-bar-style" content="black-translucent">
<meta name="apple-mobile-web-app-title" content="販売目標管理">
<link rel="manifest" href="manifest.json">
<title>営業販売目標管理</title>
<script src="https://cdnjs.cloudflare.com/ajax/libs/encoding-japanese/2.0.0/encoding.min.js"></script>
<style>
  :root {
    --primary: #1a3a5c;
    --primary-light: #2a5a8c;
    --accent: #e85d26;
    --accent-light: #f07a4a;
    --bg: #f0f4f8;
    --bg-card: #ffffff;
    --text: #1a2533;
    --text-sub: #5a6a7a;
    --border: #d0dae6;
    --disabled: #b0bec8;
    --disabled-bg: #e8edf2;
    --success: #2e7d52;
    --error: #c0392b;
    --header-h: 60px;
    --shadow: 0 2px 12px rgba(26,58,92,0.10);
    --radius: 10px;
  }
  * { box-sizing: border-box; margin: 0; padding: 0; -webkit-tap-highlight-color: transparent; }
  html, body { height: 100%; font-family: 'Hiragino Kaku Gothic ProN', 'Hiragino Sans', Meiryo, sans-serif; background: var(--bg); color: var(--text); font-size: 15px; }
  #app { height: 100%; display: flex; flex-direction: column; }

  /* ヘッダー */
  .header {
    background: var(--primary);
    color: #fff;
    height: var(--header-h);
    display: flex;
    align-items: center;
    padding: 0 16px;
    gap: 12px;
    flex-shrink: 0;
    box-shadow: 0 2px 8px rgba(0,0,0,0.2);
    position: relative;
    z-index: 100;
  }
  .header-back {
    background: none; border: none; color: #fff; font-size: 22px; cursor: pointer; padding: 6px; border-radius: 6px;
    display: flex; align-items: center;
  }
  .header-back:active { background: rgba(255,255,255,0.15); }
  .header-title { font-size: 17px; font-weight: 700; flex: 1; letter-spacing: 0.03em; }
  .header-sub { font-size: 12px; color: rgba(255,255,255,0.7); }

  /* 画面切替 */
  .screen { display: none; flex: 1; overflow: hidden; flex-direction: column; }
  .screen.active { display: flex; }
  .screen-body { flex: 1; overflow-y: auto; padding: 16px; }

  /* メインメニュー */
  .menu-top {
    background: linear-gradient(135deg, var(--primary) 0%, var(--primary-light) 100%);
    color: #fff;
    padding: 28px 20px 24px;
    flex-shrink: 0;
  }
  .menu-top-title { font-size: 22px; font-weight: 800; letter-spacing: 0.04em; margin-bottom: 4px; }
  .menu-top-user { font-size: 13px; color: rgba(255,255,255,0.8); }
  .menu-top-user span { color: #fff; font-weight: 600; }
  .menu-list { display: flex; flex-direction: column; gap: 10px; padding: 16px; }
  .menu-item {
    background: var(--bg-card);
    border-radius: var(--radius);
    padding: 18px 16px;
    display: flex;
    align-items: center;
    gap: 14px;
    box-shadow: var(--shadow);
    cursor: pointer;
    border: 1.5px solid transparent;
    transition: border-color 0.15s, transform 0.1s;
    user-select: none;
  }
  .menu-item:active { transform: scale(0.98); border-color: var(--primary-light); }
  .menu-item.disabled { opacity: 0.45; pointer-events: none; }
  .menu-icon {
    width: 46px; height: 46px; border-radius: 12px;
    background: var(--primary); color: #fff;
    display: flex; align-items: center; justify-content: center;
    font-size: 22px; flex-shrink: 0;
  }
  .menu-item:nth-child(2) .menu-icon { background: #2e7d52; }
  .menu-item:nth-child(3) .menu-icon { background: #1565c0; }
  .menu-item:nth-child(4) .menu-icon { background: #6a1b9a; }
  .menu-item:nth-child(5) .menu-icon { background: var(--accent); }
  .menu-item-text { flex: 1; }
  .menu-item-label { font-size: 16px; font-weight: 700; }
  .menu-item-desc { font-size: 12px; color: var(--text-sub); margin-top: 2px; }
  .menu-arrow { color: var(--disabled); font-size: 18px; }

  /* カード */
  .card { background: var(--bg-card); border-radius: var(--radius); box-shadow: var(--shadow); padding: 16px; margin-bottom: 12px; }
  .card-title { font-size: 13px; font-weight: 700; color: var(--text-sub); margin-bottom: 12px; text-transform: uppercase; letter-spacing: 0.08em; }

  /* フォーム */
  .form-row { margin-bottom: 14px; }
  .form-label { font-size: 13px; font-weight: 600; color: var(--text-sub); margin-bottom: 5px; display: block; }
  .form-input {
    width: 100%; padding: 11px 13px; border: 1.5px solid var(--border); border-radius: 8px;
    font-size: 15px; font-family: inherit; color: var(--text); background: #fff;
    transition: border-color 0.15s;
    -webkit-appearance: none;
  }
  .form-input:focus { outline: none; border-color: var(--primary-light); }
  .form-input[readonly] { background: var(--disabled-bg); color: var(--text-sub); }
  select.form-input { background-image: url("data:image/svg+xml,%3Csvg xmlns='http://www.w3.org/2000/svg' width='12' height='8' viewBox='0 0 12 8'%3E%3Cpath d='M1 1l5 5 5-5' stroke='%235a6a7a' stroke-width='1.5' fill='none' stroke-linecap='round'/%3E%3C/svg%3E"); background-repeat: no-repeat; background-position: right 12px center; padding-right: 32px; }

  /* ボタン */
  .btn-row { display: flex; gap: 10px; margin-top: 8px; }
  .btn {
    flex: 1; padding: 13px; border: none; border-radius: 8px;
    font-size: 15px; font-weight: 700; font-family: inherit;
    cursor: pointer; transition: opacity 0.15s, transform 0.1s;
    letter-spacing: 0.03em;
  }
  .btn:active { transform: scale(0.97); opacity: 0.85; }
  .btn-primary { background: var(--primary); color: #fff; }
  .btn-accent { background: var(--accent); color: #fff; }
  .btn-secondary { background: var(--border); color: var(--text); }
  .btn-danger { background: var(--error); color: #fff; }
  .btn:disabled { opacity: 0.4; pointer-events: none; }

  /* トースト */
  #toast {
    position: fixed; bottom: 30px; left: 50%; transform: translateX(-50%) translateY(20px);
    background: rgba(26,42,51,0.92); color: #fff; padding: 12px 22px;
    border-radius: 24px; font-size: 14px; font-weight: 600;
    opacity: 0; transition: opacity 0.3s, transform 0.3s;
    z-index: 9999; pointer-events: none; white-space: nowrap;
    max-width: 90vw; text-align: center;
  }
  #toast.show { opacity: 1; transform: translateX(-50%) translateY(0); }
  #toast.error { background: rgba(192,57,43,0.95); }
  #toast.success { background: rgba(46,125,82,0.95); }

  /* モーダル */
  .modal-overlay {
    position: fixed; inset: 0; background: rgba(0,0,0,0.45); z-index: 500;
    display: flex; align-items: center; justify-content: center; padding: 20px;
  }
  .modal-overlay.hidden { display: none; }
  .modal {
    background: #fff; border-radius: 14px; width: 100%; max-width: 400px;
    box-shadow: 0 8px 40px rgba(0,0,0,0.25); overflow: hidden;
  }
  .modal-header { background: var(--primary); color: #fff; padding: 16px 18px; font-size: 16px; font-weight: 700; }
  .modal-body { padding: 18px; }
  .modal-footer { padding: 0 18px 16px; display: flex; gap: 10px; }

  /* ローディング */
  .loading-overlay {
    position: fixed; inset: 0; background: rgba(255,255,255,0.85); z-index: 800;
    display: flex; flex-direction: column; align-items: center; justify-content: center; gap: 16px;
  }
  .loading-overlay.hidden { display: none; }
  .spinner {
    width: 44px; height: 44px; border: 4px solid var(--border);
    border-top-color: var(--primary); border-radius: 50%;
    animation: spin 0.8s linear infinite;
  }
  @keyframes spin { to { transform: rotate(360deg); } }
  .loading-text { font-size: 14px; color: var(--text-sub); font-weight: 600; }

  /* 販売目標確認テーブル */
  .table-container {
    flex: 1; overflow: auto; position: relative;
    border-radius: var(--radius);
    box-shadow: var(--shadow);
    background: #fff;
  }
  .hanmok-table { border-collapse: collapse; width: max-content; min-width: 100%; }
  .hanmok-table th, .hanmok-table td {
    border: 1px solid var(--border);
    padding: 0; text-align: right; font-size: 13px; white-space: nowrap;
  }
  .hanmok-table th { background: var(--primary); color: #fff; font-weight: 700; padding: 8px 10px; position: sticky; top: 0; z-index: 10; }
  .hanmok-table th.col-tokuisaki { left: 0; z-index: 20; min-width: 120px; text-align: left; }
  .hanmok-table td.col-tokuisaki {
    position: sticky; left: 0; background: #f5f8fc; z-index: 5;
    font-weight: 600; text-align: left; padding: 8px 10px; min-width: 120px;
    border-right: 2px solid var(--primary);
  }
  .hanmok-table td.cell-data {
    padding: 0; cursor: pointer; min-width: 68px;
  }
  .hanmok-table td.cell-data .cell-inner {
    padding: 8px 10px; display: block; text-align: right;
  }
  .hanmok-table td.cell-data:not(.past):hover .cell-inner { background: #e8f0fe; }
  .hanmok-table td.cell-data.past { background: var(--disabled-bg); color: var(--disabled); cursor: default; }
  .hanmok-table td.cell-total { background: #eef3f8; font-weight: 700; padding: 8px 10px; }
  .hanmok-table tr.row-total td { background: #dce8f4; font-weight: 800; padding: 8px 10px; }
  .hanmok-table tr.row-total td.col-tokuisaki { background: #c8daea; }
  .month-header-year { font-size: 10px; opacity: 0.75; display: block; }

  /* 販売目標確認 コントロール */
  .hanmok-controls {
    background: #fff; padding: 12px 14px; border-bottom: 1px solid var(--border);
    display: flex; flex-wrap: wrap; gap: 10px; align-items: center; flex-shrink: 0;
  }
  .hanmok-controls select { flex: 1; min-width: 180px; }
  .radio-group { display: flex; gap: 0; border: 1.5px solid var(--border); border-radius: 8px; overflow: hidden; }
  .radio-group label {
    padding: 8px 14px; font-size: 13px; font-weight: 600; cursor: pointer;
    color: var(--text-sub); background: #fff; transition: background 0.15s, color 0.15s;
  }
  .radio-group input[type=radio] { display: none; }
  .radio-group input[type=radio]:checked + label { background: var(--primary); color: #fff; }

  /* 代替商品 得意先追加ボタン */
  .add-tokuisaki-btn {
    background: var(--success); color: #fff; border: none; border-radius: 8px;
    padding: 10px 14px; font-size: 13px; font-weight: 700; cursor: pointer;
    display: flex; align-items: center; gap: 6px;
  }
  .add-tokuisaki-btn:active { opacity: 0.8; }

  /* インポート結果 */
  .import-result { list-style: none; }
  .import-result li {
    padding: 10px 12px; border-radius: 7px; margin-bottom: 7px;
    font-size: 13px; font-weight: 600; display: flex; align-items: center; gap: 8px;
  }
  .import-result li.ok { background: #e8f5e9; color: var(--success); }
  .import-result li.err { background: #fce8e6; color: var(--error); }
  .import-result li.skip { background: #fff8e1; color: #b07800; }

  /* Dropbox認証 */
  .dropbox-status { display: flex; align-items: center; gap: 8px; padding: 10px 12px; border-radius: 8px; font-size: 13px; font-weight: 600; margin-bottom: 12px; }
  .dropbox-status.connected { background: #e8f5e9; color: var(--success); }
  .dropbox-status.disconnected { background: #fce8e6; color: var(--error); }

  /* セル内直接入力 */
  .cell-input {
    width: 100%; min-width: 64px; height: 100%;
    padding: 7px 8px;
    border: none; border-bottom: 2px solid transparent;
    background: transparent;
    font-size: 13px; font-family: inherit;
    text-align: right; color: var(--text);
    -webkit-appearance: none;
    outline: none;
    display: block;
    box-sizing: border-box;
  }
  .cell-input:focus {
    border-bottom-color: var(--primary-light);
    background: #e8f0fe;
  }
  /* number inputのスピナーを非表示 */
  .cell-input::-webkit-outer-spin-button,
  .cell-input::-webkit-inner-spin-button { -webkit-appearance: none; margin: 0; }
  .cell-input[type=number] { -moz-appearance: textfield; }

  /* 数値入力 右寄せ */
  input[type=number] { text-align: right; }

  /* レスポンシブ */
  @media (min-width: 768px) {
    .menu-list { max-width: 600px; margin: 0 auto; }
    .screen-body { max-width: 700px; margin: 0 auto; }
  }
</style>
</head>
<body>
<div id="app">

  <!-- ローディング -->
  <div class="loading-overlay hidden" id="loadingOverlay">
    <div class="spinner"></div>
    <div class="loading-text" id="loadingText">処理中...</div>
  </div>

  <!-- トースト -->
  <div id="toast"></div>

  <!-- モーダル（共通） -->
  <div class="modal-overlay hidden" id="modalOverlay">
    <div class="modal">
      <div class="modal-header" id="modalTitle">確認</div>
      <div class="modal-body" id="modalBody"></div>
      <div class="modal-footer" id="modalFooter"></div>
    </div>
  </div>

  <!-- ===== 画面1: メインメニュー ===== -->
  <div class="screen active" id="screenMenu">
    <div class="menu-top">
      <div class="menu-top-title">営業販売目標管理</div>
      <div class="menu-top-user" id="menuUserLabel">担当者未登録</div>
    </div>
    <div class="menu-list">
      <div class="menu-item" onclick="showScreen('screenEigyo')">
        <div class="menu-icon">👤</div>
        <div class="menu-item-text">
          <div class="menu-item-label">営業担当者登録</div>
          <div class="menu-item-desc">担当者コードと名前を登録</div>
        </div>
        <div class="menu-arrow">›</div>
      </div>
      <div class="menu-item disabled" id="menuImport" onclick="showScreen('screenImport')">
        <div class="menu-icon">📥</div>
        <div class="menu-item-text">
          <div class="menu-item-label">データインポート</div>
          <div class="menu-item-desc">Dropboxよりデータを取込</div>
        </div>
        <div class="menu-arrow">›</div>
      </div>
      <div class="menu-item disabled" id="menuHanmok" onclick="showScreen('screenHanmok')">
        <div class="menu-icon">📊</div>
        <div class="menu-item-text">
          <div class="menu-item-label">販売目標確認</div>
          <div class="menu-item-desc">目標値の確認・補正</div>
        </div>
        <div class="menu-arrow">›</div>
      </div>
      <div class="menu-item disabled" id="menuDaigae" onclick="showScreen('screenDaigae')">
        <div class="menu-icon">🔄</div>
        <div class="menu-item-text">
          <div class="menu-item-label">代替商品登録</div>
          <div class="menu-item-desc">代替商品の追加登録</div>
        </div>
        <div class="menu-arrow">›</div>
      </div>
      <div class="menu-item disabled" id="menuExport" onclick="showScreen('screenExport')">
        <div class="menu-icon">📤</div>
        <div class="menu-item-text">
          <div class="menu-item-label">データエクスポート</div>
          <div class="menu-item-desc">Dropboxへデータを出力</div>
        </div>
        <div class="menu-arrow">›</div>
      </div>
    </div>
  </div>

  <!-- ===== 画面2: 営業担当者登録 ===== -->
  <div class="screen" id="screenEigyo">
    <div class="header">
      <button class="header-back" onclick="showScreen('screenMenu')">‹</button>
      <div class="header-title">営業担当者登録</div>
    </div>
    <div class="screen-body">
      <div class="card">
        <div class="card-title">担当者情報</div>
        <div class="form-row">
          <label class="form-label">営業担当者コード（数字3桁）</label>
          <input type="text" class="form-input" id="eigyoCd" maxlength="3" inputmode="numeric" placeholder="例：001">
        </div>
        <div class="form-row">
          <label class="form-label">営業担当者名（20文字以内）</label>
          <input type="text" class="form-input" id="eigyoName" maxlength="20" placeholder="例：山田 太郎">
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="showScreen('screenMenu')">キャンセル</button>
          <button class="btn btn-primary" onclick="saveEigyo()">登録</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 画面3: データインポート ===== -->
  <div class="screen" id="screenImport">
    <div class="header">
      <button class="header-back" onclick="showScreen('screenMenu')">‹</button>
      <div class="header-title">データインポート</div>
    </div>
    <div class="screen-body">
      <div class="card">
        <div class="dropbox-status disconnected" id="dropboxStatusImport">
          <span>⚠</span><span id="dropboxStatusTextImport">Dropbox未接続</span>
        </div>
        <div class="card-title">取込ファイル</div>
        <p style="font-size:13px;color:var(--text-sub);margin-bottom:12px;">
          Dropbox内の <strong id="importFolderName">/担当者コード/</strong> フォルダより以下を取り込みます。<br>
          ※既存データはすべて削除されます。
        </p>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 shohin.csv　— 商品マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 tokuis.csv　— 得意先マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 stanka.csv　— 商品単価マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 hanmok.csv　— 販売目標データ</li>
        </ul>
        <div id="importResultArea" style="display:none;">
          <div class="card-title">取込結果</div>
          <ul class="import-result" id="importResultList"></ul>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="showScreen('screenMenu')">戻る</button>
          <button class="btn btn-accent" id="importExecBtn" onclick="execImport()">実行</button>
        </div>
      </div>
      <div class="card" id="dropboxAuthCard">
        <div class="card-title">Dropbox認証</div>
        <p style="font-size:13px;color:var(--text-sub);margin-bottom:12px;">初回はDropboxとの連携が必要です。</p>
        <button class="btn btn-primary" onclick="dropboxAuth()">Dropboxと連携する</button>
      </div>
    </div>
  </div>

  <!-- ===== 画面4: 販売目標確認 ===== -->
  <div class="screen" id="screenHanmok">
    <div class="header">
      <button class="header-back" onclick="showScreen('screenMenu')">‹</button>
      <div class="header-title">販売目標確認</div>
    </div>
    <div class="hanmok-controls">
      <select class="form-input" id="hanmokShohinSel" onchange="renderHanmokTable()" style="flex:1;min-width:160px;max-width:320px;"></select>
      <div class="radio-group">
        <input type="radio" name="hyoji" id="hyojiSu" value="0" checked onchange="renderHanmokTable()">
        <label for="hyojiSu">数量</label>
        <input type="radio" name="hyoji" id="hyojiGk" value="1" onchange="renderHanmokTable()">
        <label for="hyojiGk">金額</label>
      </div>
      <button class="add-tokuisaki-btn" id="addTokuisakiBtn" style="display:none;" onclick="showAddTokuisakiModal()">＋ 得意先追加</button>
    </div>
    <div class="table-container" id="hanmokTableContainer">
      <div style="padding:40px;text-align:center;color:var(--text-sub);font-size:14px;">商品を選択してください</div>
    </div>
  </div>


  <!-- ===== 画面6: 代替商品登録 ===== -->
  <div class="screen" id="screenDaigae">
    <div class="header">
      <button class="header-back" onclick="showScreen('screenMenu')">‹</button>
      <div class="header-title">代替商品登録</div>
    </div>
    <div class="screen-body">
      <div class="card">
        <div class="card-title">代替商品情報</div>
        <div class="form-row">
          <label class="form-label">商品コード（自動採番）</label>
          <input type="text" class="form-input" id="daigaeCd" readonly>
        </div>
        <div class="form-row">
          <label class="form-label">商品名（30文字以内）</label>
          <input type="text" class="form-input" id="daigaeName" maxlength="30" placeholder="代替商品名を入力">
        </div>
        <div class="form-row">
          <label class="form-label">販売単価</label>
          <input type="number" class="form-input" id="daigaeTanka" min="0" step="0.01" inputmode="decimal" placeholder="0.00">
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="showScreen('screenMenu')">戻る</button>
          <button class="btn btn-primary" onclick="saveDaigae()">OK</button>
        </div>
      </div>
    </div>
  </div>

  <!-- ===== 画面7: データエクスポート ===== -->
  <div class="screen" id="screenExport">
    <div class="header">
      <button class="header-back" onclick="showScreen('screenMenu')">‹</button>
      <div class="header-title">データエクスポート</div>
    </div>
    <div class="screen-body">
      <div class="card">
        <div class="dropbox-status disconnected" id="dropboxStatusExport">
          <span>⚠</span><span id="dropboxStatusTextExport">Dropbox未接続</span>
        </div>
        <div class="card-title">出力ファイル</div>
        <p style="font-size:13px;color:var(--text-sub);margin-bottom:12px;">
          Dropbox内の <strong id="exportFolderName">/担当者コード/</strong> フォルダへ出力します。<br>
          ※既存ファイルは上書きされます。
        </p>
        <ul style="list-style:none;display:flex;flex-direction:column;gap:6px;margin-bottom:16px;">
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 shohin.csv　— 商品マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 tokuis.csv　— 得意先マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 stanka.csv　— 商品単価マスタ</li>
          <li style="padding:9px 12px;background:var(--bg);border-radius:7px;font-size:13px;">📄 hanmok.csv　— 販売目標データ</li>
        </ul>
        <div id="exportResultArea" style="display:none;">
          <div class="card-title">出力結果</div>
          <ul class="import-result" id="exportResultList"></ul>
        </div>
        <div class="btn-row">
          <button class="btn btn-secondary" onclick="showScreen('screenMenu')">戻る</button>
          <button class="btn btn-accent" onclick="execExport()">OK</button>
        </div>
      </div>
    </div>
  </div>

</div><!-- #app -->

<script src="db.js"></script>
<script src="dropbox.js"></script>
<script src="csv.js"></script>
<script src="app.js"></script>
</body>
</html>
