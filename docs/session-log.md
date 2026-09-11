# session-log

### 2026-09-11 (session: 通し確認が全段階で通った・用語と見た目の是正)
- 現状/できたこと:
  - PR #7 / #9 / #10 が反映され、本番 https://kenhomma.github.io/idd/ に両方の変更が出た（見出し「こんにちは！」・今週の数字 48px）
  - 通し確認 #11（JST 16:20〜16:30）: 受け取り 12s / 対応案 44s / 受け取り2回目 11s / 注文への返事 44s / 作業開始 11s / 直しました 78s / 確認URL追記 33s / URL 200。**エンジンの9段階すべて ✅**
  - 唯一の ❌ は「対応案の確認用ページ」。エンジンではなく**確認の側の作り方**の問題で、
    固定文言の依頼が前回の結果で既に本番に入っており、エージェントが正しく「直す箇所がない」と答えたため版が作られなかった
  - オーナー指摘2件を是正: 状況の行から引用記法（`>`）を外す／`smoke` を「通し確認」に改名（`scripts/tsuushi.mjs`・Issue は `[通し確認]`）。投稿済み13件のコメントも書き換えた
- 決定事項（なぜそうしたか）:
  - **道具の名前も平易な日本語にする。** Issue のタイトルに出るので現場にも見える（`vocab/glossary.md` に明文化）
  - **引用記法を囲みに使わない。** 引用していないのに引用の見た目になる。太字の行＋区切り線（`---`）
  - main の Ruleset から `update`（更新の制限）を外した。**「管理者だけが更新できる」ではなく「誰も更新できない」の意味**で、
    マージが「Cannot update this protected ref」で止まっていた。「帰属のない変更に承認を求める」も外した
    （コミットの共同作者 `Claude … <noreply@anthropic.com>` が GitHub アカウントでないため毎回引っかかる）
- 未完了/進行中:
  - PR #12（反映済みの後始末・通し確認の依頼を毎回ちがう内容にする）が**マージ待ち**
  - 反映後にもう一度 通し確認 を回して、対応案の段階のプレビューと画面写真まで含めて全段階 ✅ を取る
- 次の一手:
  - PR #12 反映 → 通し確認 → 全段階 ✅ なら `v1` タグ → ymy-marketing へ展開
- ブロッカー:
  - main へのマージと、リポジトリの安全設定の変更は、この環境からは実行できない（管理者が GitHub で行う）

### 2026-09-11 (session: 通し確認が通った・プレビュー常設)
- 現状/できたこと:
  - 通し確認 #6 がフルで通った（JST 15:18〜15:23）: 受け取り 11s → 対応案 44s → 注文への改訂 87s → 着手OK → 作業開始 23s → 直しました 34s → 確認URL追記 45s → URL 200。起票から確認用ページまで 4分22秒
  - 反映OK → PR #7 作成（Actions の PR 作成許可を有効化してから）。マージは管理者（人）の作業として残してある
  - 本間さんの実依頼 #4（今週の数字を大きく）: CI 停止 → 代表者側で対応案 → 「aで」の返事を D（対応不要）にしてしまう誤り → 代表者側で (a) の版 issue-4 を作り、確認用ページ＋画面写真付きの改訂案を投稿
  - 直した地雷: plan に Write 権限が無く黙って終了（#3）／閉じた Issue に反応（#1）／Actions の PR 作成が既定で禁止（#6）／選択への回答を「対応不要」と返した（#4）
- 決定事項（なぜそうしたか）:
  - **プレビューは常に付ける**（オーナー指示）: 対応案の段階で作業中の版を作り、確認用ページのURLと画面写真（375/1440・ヘッドレス Chrome・idd-previews ブランチに保存）を対応案に貼る
  - 返事の種類に noted（受領）を追加。noop は「本当に直すことが無い」時だけ。選択への回答は revise
  - main へのマージは人（管理者）。エージェント（このセッション含む）は PR まで
- 未完了/進行中:
  - PR #9（エンジン v0.2: プレビュー常設・選択への返事・#8 の通知）は**管理者のマージ待ち**。マージ後に 通し確認をもう一度回す
  - PR #7（通し確認 #6 の見出し変更）もマージ待ち。マージすると after-merge → 「反映されました」の経路が検証できる
  - #4 は承認者の「着手OK」待ち（確認用ページ https://kenhomma.github.io/idd/preview/issue-4/ ）
- 次の一手:
  - #9 マージ → `node scripts/tsuushi.mjs --repo kenhomma/idd --full` → 対応案にプレビューと画面写真が付くことを確認 → `v1` タグ
- ブロッカー:
  - main へのマージはこのセッションからは行えない（自動モードの分類器が止める）。管理者が GitHub 上で行う

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
  - Secret `CLAUDE_CODE_OAUTH_TOKEN` 未設定（ユーザー作業）。設定後に `node scripts/tsuushi.mjs --full` で plan→注文→着手OK→直しました→確認URL を通す
  - Claude GitHub App の導入状況は未確認（run ログで判断する）
  - Issue #1 は開けたまま（Secret 設定後に `gh run rerun` で plan を再実行して確かめる）
- 次の一手:
  - Secret 設定 → 通し確認 --full → 通らない箇所を直す → 通ったら `v1` タグ → ymy-marketing へ展開
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
  - 判断が出たら Phase 1: `issue.yml`（workflow_call）・`reply.mjs`・`verify-moved.mjs`・`tsuushi.mjs`・`demo/` を書き、このリポの Issue で全経路を通す
  - 最初に潰す未検証: 自前プラグインを Actions から読めるか／再利用ワークフローから `vars` と `github.event` を読めるか
- ブロッカー:
  - 無し（判断待ちのみ）
