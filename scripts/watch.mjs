#!/usr/bin/env node
// watch.mjs — 「返事が出ていない依頼」を拾う（検知＋通知）
//   node watch.mjs [--hours 72] [--grace 30] [--notify]
//
// ■ なぜ要るか: 自動応答の経路が何本あっても「動いた」ことを誰も確かめないと黙って止まる。ここがその係。
// ■ 鳴らしすぎない: 猶予（既定30分）を置く。直前が催促なら重ねない。催促に印は付けない。
import { MARK, LABELS, arg, flag, listOpenIssues, listComments, isBot, kindOf } from './lib.mjs';
import { send } from './replies.mjs';

const HOURS = parseInt(arg('--hours', '72'), 10);
const GRACE = parseInt(arg('--grace', '30'), 10);
const IDLE_DAYS = 2;
const now = Date.now();
const since = new Date(now - HOURS * 3600e3).toISOString();
const graceBefore = new Date(now - GRACE * 60e3).toISOString();

const unanswered = [];
const stale = [];
for (const is of listOpenIssues()) {
  const comments = listComments(is.number);
  const lastMark = comments.reduce((a, c, i) => (c.body.includes(MARK) ? i : a), -1);
  const pending = comments
    .map((c, i) => ({ ...c, i }))
    .filter((c) => c.i > lastMark && !isBot(c.login, c.type) && !c.body.includes(MARK)
      && !c.body.includes('@claude') && c.createdAt > since && c.createdAt < graceBefore);
  const openedPending = lastMark < 0 && is.labels.includes(LABELS.request)
    && is.createdAt > since && is.createdAt < graceBefore
    && !comments.some((c) => !isBot(c.login, c.type));
  if (pending.length || openedPending) {
    const last = comments[comments.length - 1];
    unanswered.push({
      n: is.number, title: is.title, url: is.url,
      who: pending.length ? pending[pending.length - 1].login : is.login,
      nudged: !!last && kindOf(last.body) === 'nudge',
    });
  }
  const idleDays = (now - new Date(is.updatedAt).getTime()) / 86400e3;
  const inFlight = [LABELS.planned, LABELS.approved, LABELS.working, LABELS.review];
  if (idleDays > IDLE_DAYS && is.labels.some((l) => inFlight.includes(l))) {
    stale.push({ n: is.number, title: is.title, days: idleDays.toFixed(1), labels: is.labels.join(',') });
  }
}

console.log(`未応答: ${unanswered.length}件`);
for (const u of unanswered) console.log(`- #${u.n} ${u.title}（${u.who}）${u.nudged ? ' 催促済み' : ''} ${u.url}`);
console.log(`滞留（${IDLE_DAYS}日以上動きなし）: ${stale.length}件`);
for (const s of stale) console.log(`- #${s.n} ${s.title} ${s.days}日 [${s.labels}]`);

if (flag('--notify')) {
  for (const u of unanswered.filter((x) => !x.nudged)) {
    send('nudge', u.n);
    console.log(`催促を書いた: #${u.n}`);
  }
}
process.exit(unanswered.length ? 1 : 0);
