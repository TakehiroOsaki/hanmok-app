// ===== csv.js: CSV読み書き（Shift-JIS対応） =====

// ArrayBuffer → UTF-8文字列（Shift-JIS変換）
function decodeShiftJIS(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoded = Encoding.convert(bytes, { to: 'UNICODE', from: 'SJIS' });
  return Encoding.codeToString(decoded);
}

// UTF-8文字列 → Shift-JIS Uint8Array
function encodeShiftJIS(str) {
  const unicode = Encoding.stringToCode(str);
  const sjis = Encoding.convert(unicode, { to: 'SJIS', from: 'UNICODE' });
  return new Uint8Array(sjis);
}

// CSV文字列 → 行配列（ダブルクォート対応）
function parseCSV(text) {
  const rows = [];
  // BOMを除去
  const t = text.replace(/^\uFEFF/, '').replace(/\r\n/g, '\n').replace(/\r/g, '\n');
  const lines = t.split('\n');
  for (const line of lines) {
    if (line.trim() === '') continue;
    const cols = [];
    let inQ = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) {
        cols.push(cur); cur = '';
      } else {
        cur += c;
      }
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

// 行配列 → CSV文字列
function buildCSV(rows) {
  return rows.map(row =>
    row.map(v => {
      const s = String(v == null ? '' : v);
      if (s.includes(',') || s.includes('"') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    }).join(',')
  ).join('\r\n');
}

// ===== 商品マスタCSVパース =====
// 商品区分,商品コード,商品名,販売単価
function parseShohinCSV(text) {
  const rows = parseCSV(text);
  return rows.map(r => ({
    shohin_kbn: String(r[0] || '').trim(),
    shohin_cd:  String(r[1] || '').trim(),
    shohin_name: String(r[2] || '').trim(),
    hanbai_tanka: parseFloat(r[3]) || 0
  })).filter(r => r.shohin_kbn && r.shohin_cd);
}

// ===== 得意先マスタCSVパース =====
// 得意先コード,得意先名
function parseTokuisakiCSV(text) {
  const rows = parseCSV(text);
  return rows.map(r => ({
    tokuisaki_cd: String(r[0] || '').trim(),
    tokuisaki_name: String(r[1] || '').trim()
  })).filter(r => r.tokuisaki_cd);
}

// ===== 商品単価マスタCSVパース =====
// 商品区分,商品コード,得意先コード,販売単価
function parseTankaCSV(text) {
  const rows = parseCSV(text);
  return rows.map(r => ({
    shohin_kbn: String(r[0] || '').trim(),
    shohin_cd:  String(r[1] || '').trim(),
    tokuisaki_cd: String(r[2] || '').trim(),
    hanbai_tanka: parseFloat(r[3]) || 0
  })).filter(r => r.shohin_kbn && r.shohin_cd && r.tokuisaki_cd);
}

// ===== 販売目標データCSVパース =====
// 営業担当者コード,商品区分,商品コード,得意先コード,月,販売目標数,販売単価,販売目標額
function parseHanmokCSV(text) {
  const rows = parseCSV(text);
  return rows.map(r => ({
    eigyo_cd:        String(r[0] || '').trim(),
    shohin_kbn:      String(r[1] || '').trim(),
    shohin_cd:       String(r[2] || '').trim(),
    tokuisaki_cd:    String(r[3] || '').trim(),
    tsuki:           String(r[4] || '').trim().padStart(2, '0'),
    hanbai_mokuhyo_su: parseInt(r[5]) || 0,
    hanbai_tanka:    parseFloat(r[6]) || 0,
    hanbai_mokuhyo_gk: parseInt(r[7]) || 0
  })).filter(r => r.eigyo_cd && r.shohin_cd && r.tokuisaki_cd && r.tsuki);
}

// ===== CSVビルド関数群 =====
function buildShohinCSV(records) {
  const rows = records.map(r => [
    r.shohin_kbn, r.shohin_cd, r.shohin_name, formatNum(r.hanbai_tanka, 2)
  ]);
  return buildCSV(rows);
}

function buildTokuisakiCSV(records) {
  const rows = records.map(r => [r.tokuisaki_cd, r.tokuisaki_name]);
  return buildCSV(rows);
}

function buildTankaCSV(records) {
  const rows = records.map(r => [
    r.shohin_kbn, r.shohin_cd, r.tokuisaki_cd, formatNum(r.hanbai_tanka, 2)
  ]);
  return buildCSV(rows);
}

function buildHanmokCSV(records) {
  const rows = records.map(r => [
    r.eigyo_cd, r.shohin_kbn, r.shohin_cd, r.tokuisaki_cd,
    r.tsuki, r.hanbai_mokuhyo_su,
    formatNum(r.hanbai_tanka, 2), r.hanbai_mokuhyo_gk
  ]);
  return buildCSV(rows);
}

function formatNum(v, decimals) {
  if (decimals === 0) return String(Math.floor(v || 0));
  return Number(v || 0).toFixed(decimals);
}
