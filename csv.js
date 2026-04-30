// ===== csv.js: CSV読み書き（Shift-JIS対応） =====

function decodeShiftJIS(buffer) {
  const bytes = new Uint8Array(buffer);
  const decoded = Encoding.convert(bytes, { to: 'UNICODE', from: 'SJIS' });
  return Encoding.codeToString(decoded);
}

function encodeShiftJIS(str) {
  const unicode = Encoding.stringToCode(str);
  const sjis = Encoding.convert(unicode, { to: 'SJIS', from: 'UNICODE' });
  return new Uint8Array(sjis);
}

function parseCSV(text) {
  const rows = [];
  const t = text.replace(/^\uFEFF/,'').replace(/\r\n/g,'\n').replace(/\r/g,'\n');
  for (const line of t.split('\n')) {
    if (line.trim() === '') continue;
    const cols = [];
    let inQ = false, cur = '';
    for (let i = 0; i < line.length; i++) {
      const c = line[i];
      if (c === '"') {
        if (inQ && line[i+1] === '"') { cur += '"'; i++; }
        else inQ = !inQ;
      } else if (c === ',' && !inQ) { cols.push(cur); cur = ''; }
      else cur += c;
    }
    cols.push(cur);
    rows.push(cols);
  }
  return rows;
}

function buildCSV(rows) {
  return rows.map(row =>
    row.map(v => {
      const s = String(v == null ? '' : v);
      return (s.includes(',') || s.includes('"') || s.includes('\n'))
        ? '"' + s.replace(/"/g,'""') + '"' : s;
    }).join(',')
  ).join('\r\n');
}

// 商品マスタ: 商品区分,商品コード,商品名,販売単価
function parseShohinCSV(text) {
  return parseCSV(text).map(r => ({
    shohin_kbn:   String(r[0]||'').trim(),
    shohin_cd:    String(r[1]||'').trim(),
    shohin_name:  String(r[2]||'').trim(),
    hanbai_tanka: parseFloat(r[3])||0
  })).filter(r => r.shohin_kbn && r.shohin_cd);
}

// 得意先マスタ: 得意先コード,得意先名
function parseTokuisakiCSV(text) {
  return parseCSV(text).map(r => ({
    tokuisaki_cd:   String(r[0]||'').trim(),
    tokuisaki_name: String(r[1]||'').trim()
  })).filter(r => r.tokuisaki_cd);
}

// 販売目標データ: 営業担当者コード,商品区分,商品コード,得意先コード,年,月,販売目標数
function parseHanmokCSV(text) {
  return parseCSV(text).map(r => ({
    eigyo_cd:         String(r[0]||'').trim(),
    shohin_kbn:       String(r[1]||'').trim(),
    shohin_cd:        String(r[2]||'').trim(),
    tokuisaki_cd:     String(r[3]||'').trim(),
    nen:              String(r[4]||'').trim(),
    tsuki:            String(r[5]||'').trim().padStart(2,'0'),
    hanbai_mokuhyo_su: parseInt(r[6])||0
  })).filter(r => r.eigyo_cd && r.shohin_cd && r.tokuisaki_cd && r.nen && r.tsuki);
}

// 販売実績データ: 営業担当者コード,商品区分,商品コード,得意先コード,年,月,販売実績数
function parseHanjskCSV(text) {
  return parseCSV(text).map(r => ({
    eigyo_cd:        String(r[0]||'').trim(),
    shohin_kbn:      String(r[1]||'').trim(),
    shohin_cd:       String(r[2]||'').trim(),
    tokuisaki_cd:    String(r[3]||'').trim(),
    nen:             String(r[4]||'').trim(),
    tsuki:           String(r[5]||'').trim().padStart(2,'0'),
    hanbai_jisseki_su: parseInt(r[6])||0
  })).filter(r => r.eigyo_cd && r.shohin_cd && r.tokuisaki_cd && r.nen && r.tsuki);
}

// CSVビルド
function buildShohinCSV(records) {
  return buildCSV(records.map(r => [r.shohin_kbn, r.shohin_cd, r.shohin_name, Number(r.hanbai_tanka||0).toFixed(2)]));
}
function buildTokuisakiCSV(records) {
  return buildCSV(records.map(r => [r.tokuisaki_cd, r.tokuisaki_name]));
}
function buildHanmokCSV(records) {
  return buildCSV(records.map(r => [r.eigyo_cd, r.shohin_kbn, r.shohin_cd, r.tokuisaki_cd, r.nen, r.tsuki, r.hanbai_mokuhyo_su]));
}
