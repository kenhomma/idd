// lib.mjs — 共通部品（依存ゼロ・Node 20+）
//   gh CLI を execFile で呼ぶ（シェルを介さないので日本語・記号の本文をそのまま渡せる）
import { execFileSync } from 'node:child_process';

export const MARK = '<!--cc-->';                 // 「返事をした」の唯一の印（cs-theme と互換）
export const KIND_RE = /<!--idd:([a-z-]+)-->/;   // 返事の種類（検証がこれを見る）
export const BOT_LOGINS = new Set(['claude', 'claude[bot]', 'github-actions', 'github-actions[bot]']);

export const LABELS = {
  request: '依頼', planned: '対応案あり', approved: '着手OK', working: '作業中',
  review: '確認してください', mergeOk: '反映OK', released: '反映済み', local: '要ローカル', waiting: '判断待ち',
};
export const LABEL_DEFS = [
  [LABELS.request, '0E8A16', '起票時に付く。これが付くと対応案が自動で返る'],
  [LABELS.planned, '1D76DB', '対応案を出した。承認者の「着手OK」待ち'],
  [LABELS.approved, '5319E7', '承認者だけが付ける。付けると作業が始まる'],
  [LABELS.working, 'FBCA04', '作業中'],
  [LABELS.review, 'E99695', '直した。確認用ページを見てください'],
  [LABELS.mergeOk, '0052CC', '見てOK。反映の申請が自動で出る'],
  [LABELS.released, '006B75', '本番に反映された。直ったと確認したらクローズ'],
  [LABELS.local, 'BFD4F2', '代表者の手元で行う作業'],
  [LABELS.waiting, 'D93F0B', '代表者の判断・情報待ち'],
];

export function sh(cmd, args, opts = {}) {
  return execFileSync(cmd, args, { encoding: 'utf8', maxBuffer: 64 * 1024 * 1024, ...opts });
}
export function gh(args, opts = {}) { return sh('gh', args, opts); }
export function ghJson(args, opts = {}) { return JSON.parse(gh(args, opts)); }
export function repo() {
  return process.env.IDD_REPO || process.env.GITHUB_REPOSITORY
    || ghJson(['repo', 'view', '--json', 'nameWithOwner']).nameWithOwner;
}
export function arg(name, def) {
  const i = process.argv.indexOf(name);
  return i > 0 && i + 1 < process.argv.length ? process.argv[i + 1] : def;
}
export function flag(name) { return process.argv.includes(name); }
export function csv(s) { return (s || '').split(',').map((x) => x.trim()).filter(Boolean); }
export function approvers() { return csv(process.env.IDD_APPROVERS); }
export function mentions(list) { return list.length ? list.map((l) => '@' + l).join(' ') : '（承認者が未設定です）'; }
export function kindOf(body) { return (body || '').match(KIND_RE)?.[1] || ''; }
export function isBot(login, type) { return type === 'Bot' || BOT_LOGINS.has(login) || /\[bot\]$/.test(login || ''); }

// 承認・完了の語だけのコメントか（「それで進めて。」等）。
// ⚠ shell の tr はバイト単位で日本語が壊れるので、判定はここ（node）だけで行う。
export function normalizeBody(body) { return (body || '').replace(/[\s　。、．，!！.…]/gu, ''); }
const APPROVE_RE = /^(それで進めて|進めて|すすめて|OK|ok|Ok|了解|承知|承認|お願いします|よろしく|ありがとう|ありがとうございます|マージした|確認した|確認しました|問題ない|問題なし|いいです|大丈夫|クローズでOK|クローズして|close|Close|👍)/u;
export function isApprovalOnly(body) {
  const n = normalizeBody(body);
  return APPROVE_RE.test(n) && [...n].length <= 24;
}

export function getIssue(n) {
  const i = ghJson(['api', `repos/${repo()}/issues/${n}`]);
  return {
    number: i.number, title: i.title, body: i.body || '', createdAt: i.created_at, updatedAt: i.updated_at,
    state: i.state, labels: (i.labels || []).map((l) => l.name), login: i.user?.login, isPR: !!i.pull_request, url: i.html_url,
  };
}
export function listOpenIssues() {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const chunk = ghJson(['api', `repos/${repo()}/issues?state=open&per_page=100&page=${page}`]);
    out.push(...chunk.filter((i) => !i.pull_request).map((i) => ({
      number: i.number, title: i.title, createdAt: i.created_at, updatedAt: i.updated_at,
      labels: (i.labels || []).map((l) => l.name), login: i.user?.login, url: i.html_url,
    })));
    if (chunk.length < 100) break;
  }
  return out;
}
// 数値 id が要る（編集に使う）ので REST で取る。gh issue view の id は node id
export function listComments(n) {
  const out = [];
  for (let page = 1; page < 20; page++) {
    const chunk = ghJson(['api', `repos/${repo()}/issues/${n}/comments?per_page=100&page=${page}`]);
    out.push(...chunk.map((c) => ({
      id: c.id, body: c.body || '', createdAt: c.created_at, login: c.user?.login, type: c.user?.type, url: c.html_url,
    })));
    if (chunk.length < 100) break;
  }
  return out;
}
export function postComment(n, body) {
  return gh(['issue', 'comment', String(n), '-R', repo(), '--body-file', '-'], { input: body }).trim();
}
export function editComment(id, body) {
  return gh(['api', '-X', 'PATCH', `repos/${repo()}/issues/comments/${id}`, '--input', '-'], { input: JSON.stringify({ body }) });
}
export function setLabels(n, { add = [], remove = [] } = {}) {
  const args = ['issue', 'edit', String(n), '-R', repo()];
  if (add.length) args.push('--add-label', add.join(','));
  if (remove.length) args.push('--remove-label', remove.join(','));
  if (!add.length && !remove.length) return;
  try { gh(args); } catch (e) { console.error(`ラベル操作に失敗（続行）: ${e.message.split('\n')[0]}`); }
}
