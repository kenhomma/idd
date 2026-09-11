# この仕事の進め方の名前と、まわりの動き

> 作成 2026-09-11（JST）。出典は末尾。日付は各社の発表日（UTC基準の記事はそのまま）。
> 構成案本体は [IDD-HARNESS-DESIGN.md](./IDD-HARNESS-DESIGN.md)。

## 1. 何を名づけるのか（3層ある）

やろうとしていることは1つの名前に収まらない。**3層に分けて、それぞれに名前を付ける**のが収まりがいい。

| 層 | 中身 | 推す名前 | なぜ |
|---|---|---|---|
| L1 仕組み（技術） | Issue を画面に、Actions を実行基盤に、AI エージェントが働く | **Agentic IssueOps** | 「IssueOps」は GitHub が2023年に定義済みの語（Issue＝UI、フォーム＝入力、Actions＝裏方、結果はコメントで返す）。そこにエージェントが乗った形なので、新語を作らずに正確に言える |
| L2 組織の形 | 代表者1人のエージェントが全員分の依頼をさばく | **代表エージェント方式**（Representative Agent） | 課金席1つ・データは代表者の手元・全員はGitHubだけ、を一語で言える。市販ツールは「開発者が自分のエージェントに割り当てる」形で、ここが違う |
| L3 仕事の進め方 | 依頼→対応案→承認→実装→確認→反映 を全部 Issue 上で | **Issue駆動のAI開発（IDD）** | 既存語「Issue駆動開発」を継承。非エンジニアにも「Issueに書くだけ」で通じる。Qiita に "Issue-Driven AI Development" の用例あり |

**推奨**: 社内外の説明は **「Issue駆動のAI開発（IDD）」**、仕組みの正式名は **Agentic IssueOps**、リポ名は `idd`。

### 検討した別案

| 案 | 良い所 | 弱い所 |
|---|---|---|
| AIコンシェルジュ運用 / 窓口AI | 非エンジニアに直感的 | 「答えるだけ」に聞こえる。実装まで行くことが伝わらない |
| Delegated Agent Development | 「委任」を正確に言える | 英語のみ。日本語の現場で定着しにくい |
| Request-to-PR / Issue-to-PR | 流れが一目 | PR という語が非エンジニアに通じない |
| Agentic DevOps（JBS の用例） | 既にある | DevOps は運用側の語。依頼者の体験が含まれない |

### 使わないほうがいい語

- **vibe coding** — 提唱者の Karpathy 自身が2026年に「agentic engineering」へ言い換えた。「雑に作る」の含みが付いている
- **citizen development（市民開発）** — 非エンジニアが**自分で作る**話。ここは非エンジニアが**依頼し、AIが作り、人が承認する**話なので違う
- **自動化** — 承認ゲートが2つ（着手OK・反映OK）あるのが肝。「自動」と言うと、その肝が消える

## 2. 三つの価値の言い方

挙げていただいた3点を、そのまま標語にする。

| 価値 | 標語 | 中身 |
|---|---|---|
| AI活用のベストプラクティスを全員が享受 | **プロンプトを配らず、仕組みを配る** | 良い使い方は skill・ルール・検査に閉じ込める。誰が依頼しても同じ品質で返る。個人の腕に依存しない |
| APIアカウントが最小で済む | **1席で全員** | 課金席は代表者の1つ。GitHub 側は private リポでも協力者は無料で無制限。人数が増えても費用が増えない |
| データソースが安全 | **データは動かさない。判断だけ動かす** | CI にはデータの認証情報を置かない。実データが要る仕事は `要ローカル` で代表者の手元へ。依頼者のアカウントにも権限を配らない |

> 注記: Anthropic の公式文書は、組織横断でトークンを共有するなら「OAuth（サブスク）ではなく API キー」を推奨している。
> 「1席で全員」は現状の運用として成立しているが、**規約上の位置づけは監視しておく**（構成案 §9 (c)）。

## 3. まわりの動き（事例）

| いつ | 誰が | 何 | うちとの違い |
|---|---|---|---|
| 2023 | GitHub | **IssueOps** を定義（Issue をUI、フォームを入力、Actions を裏方、結果はコメント） | エージェント無し。うちはこの型にAIを乗せた |
| 2025〜 | GitHub | **Copilot coding agent**: Issue を Copilot に割り当てると Actions のサンドボックスで実装し PR を出す | 対応案の承認ゲートが無く、いきなり PR。開発者向けの語彙 |
| 2026-02-04 | GitHub | **Agent HQ**: Claude・Codex・Copilot を GitHub 内で使い分け。Issue の Assignee にエージェントを指定。Copilot Pro+ / Enterprise が必要 | **最も近い市販形**。ただし席ごとに Copilot 課金、プランゲート無し、日本語の平易文面の層が無い |
| 2026（進行中） | GitHub | **GitHub Agentic Workflows（gh-aw）**: Markdown＋frontmatter で書いたエージェント処理を Actions にコンパイル。Copilot / Claude / Codex / Gemini 対応。エージェントは読み取り専用で、書き込みは「safe outputs」として別ジョブが適用 | 設計思想が近い（**エージェントに直接書かせない**）。うちの「返事ラッパー」「Issueが動いたかで合否」は同じ発想。まだ実験段階と自ら明記 |
| 2026 | Anthropic | **Claude Code GitHub Action v1**（公式）: `@claude` 応答・イベント起動・skill 呼び出し・プラグイン導入。Pro/Max/Team/Enterprise のサブスクトークンで動く。org 展開・OIDC 連携の手順あり | うちの土台そのもの。公式が「Issue を PR に」を主用途に挙げている |
| 2026 | Anthropic | **Claude Code on the web**（研究プレビュー）・**Code Review** | ブラウザ／スマホから起動。依頼者が Claude のアカウントを持つ前提なので「1席で全員」にはならない |
| 2026-03-24 | Linear | **Linear Agent** 公開ベータ。Issue をエージェントに委任、トリアージ規則で自動委任（Business/Enterprise） | PM ツール側から同じことをやる動き。非エンジニアの入口を Issue にする点は同じ |
| 2025〜2026 | Cognition / Google / OpenAI / Cursor | **Devin・Jules・Codex cloud・Background Agents**: チケットを渡すと PR が返る「バックグラウンド・エージェント」 | 全部「開発者が自分のエージェントに投げる」形。依頼者側の体験設計は無い。課金はエージェント時間や席ごと |
| 2026-03-18 | Ben Balter（GitHub） | 「**Agentic workflows**」: PR が人とAIの協業の接点。人の役割はテックリードに寄る | 開発者中心。非エンジニアの参加は扱っていない |
| 2026-07-24 | JBS（日本） | 「**Agentic DevOps**」: Issue にバグ報告＋ラベルで自動修正・テスト・PR | ラベル起動・PR まで自動。承認ゲートと依頼者向け文面は無い |
| 2026-06〜07 | Insight Edge（日本） | 「**非エンジニアのためのGitHub管理**」: PM・デザイナーが `/pm merge` 等の命令で要件書・モックを GitHub に入れる。許可ディレクトリの二重検査 | **非エンジニアが自分で Claude Code を使う**形（各自に席が要る）。安全策（許可リスト・二重検査）は参考になる |

### まとめると

- 「Issue を渡すと PR が返る」は**2026年時点で商品化されている**（Copilot / Agent HQ / Linear / Devin ほか）。
- 商品が揃って**いない**のは次の5つで、ここがうちの設計の中身になる:
  1. **コードの前に対応案**を出し、人が着手OKを出す（承認ゲート）
  2. **依頼者の言葉**で返す（対訳表・状況行・1,200字）
  3. **1席で全員**（依頼者は GitHub だけ）
  4. **データは動かさない**（`要ローカル` の引き継ぎ）
  5. **返事が出たかを機械が確かめる**（緑で終わっても返事が無い、を検知）

## 4. 用語の潮流（名づけの背景）

| 語 | 誰が・いつ | 意味 | うちとの関係 |
|---|---|---|---|
| IssueOps | GitHub, 2023 | Issue と Actions で運用を自動化 | 直接の親 |
| Agentic workflows / Agent HQ | GitHub, 2026 | エージェントが Actions 上で働き、PR を返す。Agent HQ を「mission control」と呼ぶ | 技術の土台 |
| vibe coding → agentic engineering | Karpathy, 2025 → 2026 | 「雰囲気で作る」から「エージェントを工学する」へ。"vibe は床を上げ、agentic engineering は天井を上げる" | 「床を上げる」側の話をしている。ただし語は使わない（§1） |
| harness engineering / context engineering | 2025〜 | モデルの周りの足場（ツール・検査・文脈）を作る技術 | エンジンそのものが harness |
| spec-driven development | GitHub Spec Kit, 2025 | 仕様を先に書いてから実装 | 「対応案の承認」はその軽量版 |
| human-in-the-loop | 一般 | 人の承認を挟む | 着手OK・反映OK・クローズの3点 |
| citizen developer | Gartner ほか | 非エンジニアが自分で作る（2026年に技術製品の80%がIT部門外で作られる、との予測） | 隣接だが別（§1） |

## 5. うちの位置づけ（これからの変化に対して）

- **Agent HQ が安いプランにも開放されたら**、「1席で全員」の優位は薄れる。残るのは 承認ゲート・依頼者の言葉・要ローカル・返事の検証 の4つ。**エンジンはこの4つを資産として持ち、実行基盤（Actions か Agent HQ か）は差し替え可能にしておく。**
- **gh-aw が安定したら**、エンジンの `issue.yml` を gh-aw の Markdown で書き直せる可能性がある。safe outputs の考え方はいまから取り込む（返事ラッパー）。
- **Linear のような PM ツールを入口にする案**も出る。Issue の代わりに Linear の課題を窓口にしても、L2・L3 の名前と設計はそのまま使える。

## 6. 出典

- GitHub Blog「IssueOps: Automate CI/CD (and more!) with GitHub Issues and Actions」 https://github.blog/engineering/issueops-automate-ci-cd-and-more-with-github-issues-and-actions/
- GitHub Blog「Pick your agent: Use Claude and Codex on Agent HQ」(2026-02-05, 日本語) https://github.blog/jp/2026-02-05-pick-your-agent-use-claude-and-codex-on-agent-hq/
- GitHub Changelog「Claude and Codex are now available in public preview on GitHub」(2026-02-04) https://github.blog/changelog/2026-02-04-claude-and-codex-are-now-available-in-public-preview-on-github/
- GitHub Blog「Assigning and completing issues with coding agent in GitHub Copilot」 https://github.blog/ai-and-ml/github-copilot/assigning-and-completing-issues-with-coding-agent-in-github-copilot/
- GitHub Docs「Anthropic Claude (coding agent)」 https://docs.github.com/en/copilot/concepts/agents/anthropic-claude
- github/gh-aw「GitHub Agentic Workflows」 https://github.com/github/gh-aw
- Claude Code Docs「GitHub Actions」 https://code.claude.com/docs/en/github-actions
- anthropics/claude-code-action https://github.com/anthropics/claude-code-action
- Linear Changelog「Introducing Linear Agent」(2026-03-24) https://linear.app/changelog/2026-03-24-introducing-linear-agent
- Linear Docs「Assign and delegate issues」 https://linear.app/docs/assigning-issues
- Ben Balter「Agentic workflows and the future of software development」(2026-03-18) https://ben.balter.com/2026/03/18/agentic-workflows/
- The New Stack「From vibes to engineering: How AI agents outgrew their own terminology」 https://thenewstack.io/vibe-coding-agentic-engineering/
- JBS Tech Blog「Claude Codeを活用してAgentic DevOps…」(2026-07-24) https://blog.jbs.co.jp/entry/2026/07/24/140419
- Insight Edge Tech Blog「非エンジニアのためのGitHub管理」 https://techblog.insightedge.jp/entry/gitless-content-ops-ai-agent
- Qiita「Issue-Driven AI Development（イシュー駆動AI開発）」 https://qiita.com/kiyotaman/items/87a5a9ddc88db64f78ac
- Qiita「GitHub Agent HQでClaudeとCodexを使い分ける」 https://qiita.com/YushiYamamoto/items/0108a78c2ed6bbb9fa56
- SSOJet「8 Cloud Coding Agents That Open PRs While You Sleep」 https://ssojet.com/blog/best-cloud-coding-agents
- Firecrawl「Best AI Coding Agents in 2026」 https://www.firecrawl.dev/blog/best-ai-coding-agents
