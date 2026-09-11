#!/usr/bin/env node
// tsuushi.mjs — 「1件通す」（通し確認）を自動でやる。テスト用の依頼を立て、
//   受け取り→対応案→注文→改訂→着手OK→直しました→確認用ページ まで待って、各段階の秒数と合否を出す。
//   英語では smoke test と呼ぶが、現場の2人にも Issue のタイトルが見えるので日本語にした（2026-09-11 オーナー決定）。
//   node tsuushi.mjs [--repo owner/name] [--full] [--keep]
//     --full : 着手OK を付けて 実装→「直しました」→確認URL の追記→URLが200 まで確かめる（承認者で実行すること）
//     --keep : 終わってもIssueを閉じない
//   通るまで他のリポへ展開しない（規約）。
import { LABELS, MARK, arg, flag, gh, ghJson, listComments, kindOf, sh } from './lib.mjs';

const R = arg('--repo') || process.env.IDD_REPO || ghJson(['repo', 'view', '--json', 'nameWithOwner']).nameWithOwner;
process.env.IDD_REPO = R;
const FULL = flag('--full');
const KEEP = flag('--keep');
const t0 = Date.now();
const log = (s) => console.log(`[${((Date.now() - t0) / 1000).toFixed(0).padStart(4)}s] ${s}`);
const sleep = (ms) => new Promise((r) => setTimeout(r, ms));
const results = [];

async function waitFor(label, pred, timeoutSec, every = 10) {
  const start = Date.now();
  while (Date.now() - start < timeoutSec * 1000) {
    const hit = pred();
    if (hit) { const sec = ((Date.now() - start) / 1000).toFixed(0); results.push([label, `✅ ${sec}s`]); log(`${label}: OK (${sec}s) ${typeof hit === 'string' ? hit : ''}`); return hit; }
    await sleep(every * 1000);
  }
  results.push([label, `❌ ${timeoutSec}s 待っても来ない`]);
  log(`${label}: タイムアウト`);
  return null;
}
const has = (n, kind, after) => () => {
  const c = listComments(n).find((x) => kindOf(x.body) === kind && (!after || x.createdAt > after));
  return c ? c.url : null;
};

// 1. 起票
// ⚠ **毎回ちがう依頼にする。** 固定の依頼（「見出しを『こんにちは』に」）にしていたら、
//   前回の通し確認で本番がそうなっており、エージェントが正しく「直す箇所がない」と答えて
//   作業中の版を作らなかった（実測 2026-09-11・#11）。エンジンは正しいのに確認が通らない。
//   刻んだ時刻を含む依頼にして、必ず実際の変更が要る形にする。
const STAMP = new Date().toISOString().replace(/[-:T]/g, '').slice(0, 14);
const body = ['どのページ: https://kenhomma.github.io/idd/', '',
  `お知らせの一番上に「通し確認 ${STAMP} を実施しました」という項目を1つ足してください。`, '',
  '（これは通し確認の依頼です。自動で閉じます）'].join('\n');
const issueUrl = gh(['issue', 'create', '-R', R, '--title', `[通し確認] お知らせに1件足したい（${STAMP}）`, '--label', LABELS.request, '--body', body]).trim();
const n = parseInt(issueUrl.split('/').pop(), 10);
log(`起票 #${n} ${issueUrl}`);

// 2. 受け取り → 対応案
await waitFor('受け取り（ack）', has(n, 'ack'), 120);
const plan = await waitFor('対応案（plan）', has(n, 'plan'), 8 * 60);
if (plan) {
  const purl = await waitFor('対応案の確認用ページ（見る場所）', () => {
    const c = listComments(n).find((x) => ['plan', 'revise'].includes(kindOf(x.body)));
    return c?.body.match(/\*\*見る場所\*\*:\s*(https?:\/\/\S+)/)?.[1] || null;
  }, 6 * 60);
  if (purl) await waitFor('対応案の画面写真', () => (listComments(n).some((x) => ['plan', 'revise'].includes(kindOf(x.body)) && x.body.includes('**画面写真**')) ? 'ok' : null), 4 * 60);
}

// 3. 注文 → 改訂案 or 対応不要 など
if (plan) {
  const at = new Date().toISOString();
  gh(['issue', 'comment', String(n), '-R', R, '--body', '「実施しました」ではなく「実施中です」にしてください。']);
  log('注文を書いた');
  await waitFor('受け取り（ack・2回目）', has(n, 'ack', at), 120);
  await waitFor('注文への返事（revise/done/noop/local）', () => {
    const c = listComments(n).find((x) => x.createdAt > at && ['revise', 'done', 'noop', 'local'].includes(kindOf(x.body)));
    return c ? `${kindOf(c.body)} ${c.url}` : null;
  }, 8 * 60);
}

// 4. --full: 着手OK → 直しました → 確認URL
if (FULL && plan) {
  const at = new Date().toISOString();
  gh(['issue', 'edit', String(n), '-R', R, '--add-label', LABELS.approved]);
  log('着手OK を付けた');
  await waitFor('作業開始（working）', has(n, 'working', at), 3 * 60);
  const done = await waitFor('直しました（done）', has(n, 'done', at), 15 * 60);
  if (done) {
    const url = await waitFor('確認URLの追記', () => {
      const c = listComments(n).find((x) => kindOf(x.body) === 'done' && x.createdAt > at);
      return c?.body.match(/\*\*見る場所\*\*:\s*(https?:\/\/\S+)/)?.[1] || null;
    }, 6 * 60);
    if (url) {
      await waitFor('確認URLが 200', () => {
        try { return sh('curl', ['-s', '-o', '/dev/null', '-w', '%{http_code}', url]).trim() === '200' ? url : null; } catch { return null; }
      }, 4 * 60, 15);
    }
  }
}

// 5. まとめ
console.log('\n| 段階 | 結果 |\n|---|---|');
for (const [k, v] of results) console.log(`| ${k} | ${v} |`);
const failed = results.some(([, v]) => v.startsWith('❌'));

if (!KEEP) {
  gh(['issue', 'comment', String(n), '-R', R, '--body', `通し確認${failed ? 'は途中で止まりました' : 'が終わりました'}。このIssueは自動で閉じます。<!--idd:tsuushi-->`]);
  gh(['issue', 'close', String(n), '-R', R]);
  try { sh('git', ['push', 'origin', '--delete', `issue-${n}`]); log(`ブランチ issue-${n} を消した`); } catch {}
  log(`#${n} を閉じた`);
}
process.exit(failed ? 1 : 0);
