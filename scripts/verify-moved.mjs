#!/usr/bin/env node
// verify-moved.mjs — exit code ではなく「Issueが動いたか」で合否を出す
//   node verify-moved.mjs --issue N --since <ISO> [--kinds plan,local,noop] [--notify --what 説明 --run-url U]
//
// ■ 基準時刻は「引き金になったコメント／起票」の時刻（ラン開始ではない）
//   実測 2026-09-11（cs-theme #554）: 前のランが返事済みなのに、次のランが「ラン開始以降に返事なし」で赤になった。
//   引き金の時刻を基準にすれば、答え済みは答え済みと数えられる。
// ■ 種類を見る
//   implement の「作業を始めました」は返事だが完了ではない。--kinds done,local のように、
//   そのジョブが必ず出すべき種類だけを数える。
import { MARK, arg, flag, listComments, kindOf } from './lib.mjs';
import { send } from './replies.mjs';

const issue = arg('--issue');
const since = arg('--since', '');
const kinds = (arg('--kinds', '') || '').split(',').map((s) => s.trim()).filter(Boolean);
const what = arg('--what', '自動処理');
if (!issue) { console.error('--issue が要ります'); process.exit(2); }

const hits = listComments(issue).filter((c) =>
  c.body.includes(MARK) && (!since || c.createdAt > since) && (!kinds.length || kinds.includes(kindOf(c.body))));

console.log(`基準 ${since || '（なし）'} 以降の返事（${kinds.join('/') || '全種'}）: ${hits.length}件`);
if (hits.length) { console.log('✅ 返事が出ている: ' + hits.map((c) => c.url).join(' ')); process.exit(0); }

console.log(`::error::${what}が返事を出さずに終わった（Issue #${issue}）`);
if (flag('--notify')) send('stopped', issue, { what, runUrl: arg('--run-url', '') });
process.exit(1);
