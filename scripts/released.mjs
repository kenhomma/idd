#!/usr/bin/env node
// released.mjs — PR がマージされたら、対応する Issue に「反映されました」を書く
//   node released.mjs --pr N [--url 本番URL]
//   PR本文の `Refs #番号` で Issue を探す。無ければ何もしない（手で出したPRは対象外）
import { arg, ghJson, repo } from './lib.mjs';
import { send } from './replies.mjs';

const pr = arg('--pr');
const url = arg('--url', '');
if (!pr) { console.error('--pr が要ります'); process.exit(2); }
const p = ghJson(['pr', 'view', pr, '-R', repo(), '--json', 'body,url,mergedAt']);
if (!p.mergedAt) { console.log('マージされていない'); process.exit(0); }
const m = (p.body || '').match(/(?:Refs|refs|関連)[:：]?\s*#(\d+)/);
if (!m) { console.log('Refs #番号 が無いので対象外'); process.exit(0); }
send('released', m[1], { url, body: `反映の申請: ${p.url}` });
console.log(`Issue #${m[1]} に反映済みを書いた`);
