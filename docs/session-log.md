# session-log

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
