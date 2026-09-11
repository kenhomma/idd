#!/usr/bin/env node
// reply.mjs — Issue に返事を書く唯一の入口（CLI）
//   node reply.mjs <kind> --issue N [--body-file f | --body-env VAR | --stdin] [--url U] [--sender X] [--event opened|comment]
//                         [--what 説明] [--run-url U] [--pr-url U] [--members a,b]
//   kind: ack | plan | revise | working | done | local | noop | guard | guard-merge | pr-missing | pr | released | stopped | nudge | append-url
import { readFileSync } from 'node:fs';
import { arg, flag, isApprovalOnly } from './lib.mjs';
import { send, appendUrl } from './replies.mjs';

const kind = process.argv[2];
const issue = arg('--issue');
if (!kind || !issue) { console.error('usage: reply.mjs <kind> --issue N ...'); process.exit(2); }

const bodyFile = arg('--body-file');
const bodyEnv = arg('--body-env');
const body = bodyFile ? readFileSync(bodyFile, 'utf8')
  : bodyEnv ? (process.env[bodyEnv] || '')
  : flag('--stdin') ? readFileSync(0, 'utf8') : '';

if (kind === 'append-url') {
  const url = arg('--url');
  if (!url) { console.error('--url が要ります'); process.exit(2); }
  console.log(appendUrl(issue, url));
  process.exit(0);
}
if (kind === 'ack' && arg('--event') === 'comment' && isApprovalOnly(body)) {
  console.log('承認・完了の語だけのコメント。受け取りは返さない');
  process.exit(0);
}
if (['plan', 'revise', 'done', 'local', 'noop'].includes(kind) && !body.trim()) {
  console.error(`${kind} には本文（--body-file）が要ります`);
  process.exit(2);
}
const url = send(kind, issue, {
  body, event: arg('--event'), url: arg('--url'), sender: arg('--sender'), what: arg('--what'),
  runUrl: arg('--run-url'), members: arg('--members'),
});
console.log(`投稿しました（${kind}）: ${url}`);
