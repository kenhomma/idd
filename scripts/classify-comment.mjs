#!/usr/bin/env node
// classify-comment.mjs — コメントが「承認・完了の語だけ」か「依頼・注文・報告」かを判定する
//   BODY 環境変数を読む（本文をシェルに展開しないため）。GITHUB_OUTPUT があれば kind= を書く
import { appendFileSync } from 'node:fs';
import { isApprovalOnly } from './lib.mjs';

const kind = isApprovalOnly(process.env.BODY || '') ? 'approval' : 'request';
if (process.env.GITHUB_OUTPUT) appendFileSync(process.env.GITHUB_OUTPUT, `kind=${kind}\n`);
console.log(`kind=${kind}`);
