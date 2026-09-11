# idd — Issue駆動のAI開発（IDD）ハーネス

GitHub の Issue を窓口にして、Claude Code を使えない人でも **依頼 → 対応案 → 注文 → 確認 → 反映** を
GitHub の画面だけで回すための、再利用ワークフロー・プロンプト・返事ラッパー・検査の置き場。
代表者1人の Claude が全員分の依頼をさばく（1席で全員・データは動かさない）。

- デモページ（本番）: https://kenhomma.github.io/idd/
- 依頼のしかた: [CONTRIBUTING.md](CONTRIBUTING.md)（3分）
- 構成案: [docs/IDD-HARNESS-DESIGN.md](docs/IDD-HARNESS-DESIGN.md) ／ 名前と周辺の動き: [docs/LANDSCAPE-AND-NAMING.md](docs/LANDSCAPE-AND-NAMING.md)

## 何がどこにあるか

```
.github/workflows/
  issue.yml        エンジン本体（workflow_call）: ack / plan / guard / feedback / implement / mention
  pr-open.yml      反映OK → 反映の申請（PR）
  after-merge.yml  マージ → Issue に「反映されました」
  watch.yml        返事の出ていない依頼の催促
  pages.yml        demo/ を GitHub Pages へ（main と issue-* の確認用ページ）
  idd.yml / idd-watch.yml   このリポ自身がエンジンを使う呼び出し
scripts/
  reply.mjs        Issue に返事を書く唯一の入口（状況行と印を付け、ラベルを動かす）
  verify-moved.mjs 「引き金の時刻以降に返事が増えたか」で合否
  watch.mjs / pr-open.mjs / released.mjs / build-site.mjs / setup.mjs / smoke.mjs
prompts/           plan.md / feedback.md / implement.md（エージェントへの指示）
templates/caller/  他のプロジェクトに置く呼び出し（idd.yml / idd-watch.yml）
demo/              練習用の静的ページ
docs/ops/ISSUE-FLOW.md   このリポ固有の運用（触ってよい範囲・要ローカル）
vocab/glossary.md  用語対訳
```

## 他のプロジェクトに入れる（15分）

0. GitHub App「Claude」を対象リポに導入する（https://github.com/apps/claude ）
1. Secret `CLAUDE_CODE_OAUTH_TOKEN`（`claude setup-token` で発行。`printf '%s' '<token>' | gh secret set CLAUDE_CODE_OAUTH_TOKEN -R owner/repo`）
2. Variables `IDD_APPROVERS`（着手OKを付けられる人）／ `IDD_MEMBERS`（反映OKを付けられる人・任意）
3. `templates/caller/idd.yml` と `idd-watch.yml` を `.github/workflows/` に置き、確認用ページの出し方を書き換える
4. `.github/ISSUE_TEMPLATE/`・`CONTRIBUTING.md`・`docs/ops/ISSUE-FLOW.md` を写して埋める
5. `node scripts/setup.mjs --repo owner/repo` でラベルを作り、足りないものを見る
6. `main` を Ruleset で守る（PR必須・更新は管理者のみ）
7. **`node scripts/smoke.mjs --repo owner/repo` で1件通す。** 通るまで展開しない

## 状態

- 2026-09-11: 構成案 v0 → 実装開始（Phase 1・このリポで検証中）
