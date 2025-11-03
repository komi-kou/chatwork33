# Chatworkリマインダー (Vercel + GitHub Actions版)

Vercel + GitHub Actionsを使用した、完全無料のChatwork定期リマインダーツールです。

## 🚀 特徴

- **完全無料**: Vercel無料枠 + GitHub Actions無料枠で運用可能
- **高信頼性**: GitHub Actionsによる確実なスケジュール実行
- **Web UI**: Vercelでホストされる管理画面
- **柔軟な設定**: 毎日/毎週/毎月のスケジュール対応

## 📋 セットアップ手順

### 1. GitHubリポジトリの作成

1. このプロジェクトをGitHubにプッシュ
```bash
git init
git add .
git commit -m "Initial commit"
git remote add origin https://github.com/YOUR_USERNAME/chatwork-reminder.git
git push -u origin main
```

### 2. GitHub Personal Access Tokenの作成

1. GitHub → Settings → Developer settings → Personal access tokens
2. "Generate new token (classic)"をクリック
3. 以下の権限を付与:
   - `repo` (Full control)
   - `workflow` (Update GitHub Action workflows)
4. トークンを安全に保存

### 3. Chatwork APIトークンの取得

1. [Chatwork](https://www.chatwork.com/)にログイン
2. 右上メニュー → サービス連携
3. API Tokenセクションでトークンを発行

### 4. Vercelへのデプロイ

1. [Vercel](https://vercel.com)にログイン
2. "Import Project"からGitHubリポジトリを選択
3. 環境変数を設定:
   ```
   CHATWORK_API_TOKEN=あなたのChatwork APIトークン
   GITHUB_TOKEN=あなたのGitHub Personal Access Token
   GITHUB_OWNER=あなたのGitHubユーザー名
   GITHUB_REPO=chatwork-reminder
   ```
4. "Deploy"をクリック

### 5. GitHub Secretsの設定

GitHubリポジトリ → Settings → Secrets and variables → Actions
以下のSecretを追加:
- `CHATWORK_API_TOKEN`: Chatwork APIトークン

## 🎯 使い方

1. VercelでデプロイされたURLにアクセス
2. リマインダーを作成:
   - リマインダー名を入力
   - ルームIDを指定（ルーム一覧から選択可能）
   - メッセージ内容を入力
   - スケジュールを設定（毎日/毎週/毎月）
   - 時刻を指定（日本時間）
3. 「リマインダーを作成」をクリック

リマインダーを作成すると、自動的にGitHub Actionsワークフローが生成され、指定時刻に実行されます。

## 🔧 アーキテクチャ

```
┌─────────────┐     ┌──────────────────┐
│   Vercel    │────▶│ GitHub API       │
│  (Next.js)  │     │ (reminders.json) │
└─────────────┘     └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ GitHub Actions   │
                    │ (定期実行)        │
                    └────────┬─────────┘
                             │
                             ▼
                    ┌──────────────────┐
                    │ Chatwork API     │
                    └──────────────────┘
```

## 📁 ファイル構成

```
chatwork-reminder/
├── pages/
│   ├── index.js          # メインUI
│   └── api/              # API Routes
│       ├── reminders/    # リマインダーCRUD
│       ├── rooms.js      # ルーム一覧取得
│       └── test.js       # テスト送信
├── lib/
│   ├── github.js         # GitHub API連携
│   └── chatwork.js       # Chatwork API連携
├── styles/               # スタイルシート
├── .github/
│   └── workflows/        # 自動生成されるワークフロー
└── data/
    └── reminders.json    # リマインダー設定（GitHub管理）
```

## ⚠️ 注意事項

- GitHub Actionsのcron式はUTC時間で動作するため、自動的にJSTからUTCに変換されます
- 無料枠: GitHub Actions 2000分/月（十分余裕があります）
- APIトークンは必ず環境変数で管理してください

## 🔒 セキュリティ

- APIトークンはVercelとGitHub Secretsで安全に管理
- リポジトリはプライベートにすることを推奨
- Personal Access Tokenは最小限の権限のみ付与

## 📝 ローカル開発

```bash
# 依存関係のインストール
npm install

# 環境変数の設定
cp .env.local.example .env.local
# .env.localを編集

# 開発サーバーの起動
npm run dev
```

## 🆘 トラブルシューティング

### リマインダーが実行されない
1. GitHub Actions タブで実行状況を確認
2. GitHub Secretsが正しく設定されているか確認
3. ワークフローファイルが生成されているか確認

### APIエラーが発生する
1. Vercelの環境変数を確認
2. GitHub Personal Access Tokenの権限を確認
3. Chatwork APIトークンが有効か確認