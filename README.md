# 営業販売目標管理アプリ セットアップ手順

## ファイル構成
```
hanmok-app/
  ├── index.html     ← メイン画面
  ├── app.js         ← メインロジック
  ├── db.js          ← データベース処理
  ├── dropbox.js     ← Dropbox連携
  ├── csv.js         ← CSV読み書き
  ├── sw.js          ← オフライン対応
  └── manifest.json  ← PWA設定
```

---

## STEP 1: Dropbox App Keyの設定（必須）

1. https://www.dropbox.com/developers/apps にアクセス
2. 「Create app」をクリック
3. 「Scoped access」→「Full Dropbox」を選択
4. アプリ名を入力（例：HanmokApp）→「Create app」
5. 表示された「App key」をコピー
6. `dropbox.js` の1行目を編集：
   ```
   const DROPBOX_APP_KEY = 'YOUR_APP_KEY';
                                ↓
   const DROPBOX_APP_KEY = 'xxxxxxxxxxxxxxx'; // ← コピーしたApp key
   ```
7. Dropbox Developersの「OAuth 2 / Redirect URIs」に
   公開URLを追加（例：https://あなたのサイト.pages.dev/）

---

## STEP 2: Cloudflare Pagesへの公開（無料）

1. https://github.com でアカウント作成（無料）
2. 新しいリポジトリを作成（例：hanmok-app）
3. hanmok-appフォルダ内の全ファイルをアップロード
4. https://pages.cloudflare.com にアクセス
5. GitHubと連携 → リポジトリを選択 → デプロイ
6. 発行されたURL（例：https://hanmok-app.pages.dev）をメモ

---

## STEP 3: 営業マンへの配布

1. 発行されたURLをLINE・メールで20名に送付
2. 以下の手順でホーム画面に追加してもらう：
   - iPadでSafariを開く
   - 受け取ったURLにアクセス
   - 画面下の「共有」ボタン（□↑）をタップ
   - 「ホーム画面に追加」をタップ
   - 「追加」をタップ

---

## Dropboxフォルダ構成

```
Dropbox/
  ├── 001/          ← 担当者コード001のフォルダ
  │   ├── shohin.csv
  │   ├── tokuis.csv
  │   ├── stanka.csv
  │   └── hanmok.csv
  ├── 002/
  │   └── ...
  └── ...
```

---

## CSVファイル仕様（すべてShift-JIS）

### shohin.csv（商品マスタ）
`商品区分,商品コード,商品名,販売単価`
- 商品区分：1=差込商品, 2=代替商品

### tokuis.csv（得意先マスタ）
`得意先コード,得意先名`

### stanka.csv（商品単価マスタ）
`商品区分,商品コード,得意先コード,販売単価`

### hanmok.csv（販売目標データ）
`営業担当者コード,商品区分,商品コード,得意先コード,月,販売目標数,販売単価,販売目標額`
- 月：03〜12（当年）、01〜02（翌年）

---

## 注意事項

- 初回利用時はDropbox連携ボタンから認証が必要
- オフライン作業前に必ずインポートを実行すること
- エクスポートはオンライン環境で実行すること
