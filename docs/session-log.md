# session-log

### 2026-09-11 (session: Phase 1 実装・リポ作成)
- 現状/できたこと:
  - `kenhomma/idd`（public）を作成。エンジン（issue.yml / pr-open.yml / after-merge.yml / watch.yml / pages.yml）、返事ラッパー、検証、プロンプト、デモページ、依頼フォーム、CONTRIBUTING、ISSUE-FLOW を初回コミット
  - 設定: 共同作業者 cshomma / ymyhonma（write・招待中）、Variables IDD_APPROVERS=kenhomma / IDD_MEMBERS=kenhomma,cshomma,ymyhonma、ラベル9本（既定ラベルは削除）、Pages（Actions配信）、main の Ruleset（PR必須・更新は管理者のみ）、delete_branch_on_merge
  - 実測: デモページ https://kenhomma.github.io/idd/ が 375/768/1440 で崩れなし・コンソールエラーなし。Issue #1 で受け取り（ack）が5秒で返り、トークン無しの plan は「止まりました」通知で赤になった（失敗経路が動く）
- 決定事項（なぜそうしたか）:
  - 構成案 §9 の5点はすべて推奨案で確定（オーナー指示）
  - プロンプトは Phase 1 では `prompts/*.md` をエンジン checkout（`.idd/`）から読む方式。プラグイン配布は後回し（未検証を先送り）
  - feedback / implement はエージェントに `Bash(git:*)` と Edit/Write を許す。返事は `reply.mjs` 経由のみ（`gh issue comment` は allowedTools に無い）
- 未完了/進行中:
  - Secret `CLAUDE_CODE_OAUTH_TOKEN` 未設定（ユーザー作業）。設定後に `node scripts/smoke.mjs --full` で plan→注文→着手OK→直しました→確認URL を通す
  - Claude GitHub App の導入状況は未確認（run ログで判断する）
  - Issue #1 は開けたまま（Secret 設定後に `gh run rerun` で plan を再実行して確かめる）
- 次の一手:
  - Secret 設定 → smoke --full → 通らない箇所を直す → 通ったら `v1` タグ → ymy-marketing へ展開
- ブロッカー:
  - Secret はユーザーが入れる（認証情報は Claude が扱わない）

### 2026-09-11 (session: 構成案v0)
- 現状/できたこと:
  - 参照実装（cs-theme / ymy-marketing / skill 雛形）を実測して差分を洗った。skill 雛形は 8/25 時点で、その後 cs-theme で直った地雷が戻っていない
  - 今日 9/11 両リポで `feedback` ジョブが「返事なし」で赤。cs-theme #554 は前のランが返事済みなのに赤（基準時刻の問題）、ymy #71 は報告コメントに対しエージェントが黙って終了（終わり方Dが無い）
  - 構成案 `docs/IDD-HARNESS-DESIGN.md`、命名と事例 `docs/LANDSCAPE-AND-NAMING.md` を書いた
- 決定事項（なぜそうしたか）:
  - まだ無し（構成案の段階）。推奨は「エンジンは public の `kenhomma/idd`、プロンプトは skill、返事はラッパーで印を付ける、検証は引き金コメント基準」
- 未完了/進行中:
  - 構成案 §9 の5点（置き場所・ラベルの言葉・認証・下書きPR・デモ対象）の判断待ち
  - コードは1行も無い。Phase 1 は判断後
- 次の一手:
  - 判断が出たら Phase 1: `issue.yml`（workflow_call）・`reply.mjs`・`verify-moved.mjs`・`smoke.mjs`・`demo/` を書き、このリポの Issue で全経路を通す
  - 最初に潰す未検証: 自前プラグインを Actions から読めるか／再利用ワークフローから `vars` と `github.event` を読めるか
- ブロッカー:
  - 無し（判断待ちのみ）
