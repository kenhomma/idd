#!/usr/bin/env node
// pr-open.mjs — 「反映OK」ラベルで PR を作る（依頼者が見てOKを出してから、初めて反映の列に並ぶ）
//   node pr-open.mjs --issue N --sender X [--members a,b] [--base main]
//   ISSUE_TITLE 環境変数にタイトル
import { LABELS, arg, csv, repo, sh, gh, ghJson, listComments, kindOf, approvers, mentions } from './lib.mjs';
import { send } from './replies.mjs';

const issue = arg('--issue');
const sender = arg('--sender');
const members = csv(arg('--members', ''));
const base = arg('--base', 'main');
const title = process.env.ISSUE_TITLE || `Issue #${issue}`;
if (!issue || !sender) { console.error('--issue と --sender が要ります'); process.exit(2); }

// 1. 付けた人を見る（ラベルは誰でも付けられるので）
let ok;
if (members.length) ok = members.includes(sender);
else {
  const p = ghJson(['api', `repos/${repo()}/collaborators/${sender}/permission`]).permission;
  ok = ['write', 'admin', 'maintain'].includes(p);
}
if (!ok) {
  send('guard-merge', issue, { sender, members: members.length ? mentions(members) : '' });
  console.log(`権限なし: ${sender}`); process.exit(0);
}

// 2. 作業中の版があるか
const br = `issue-${issue}`;
if (!sh('git', ['ls-remote', '--heads', 'origin', br]).trim()) {
  send('pr-missing', issue);
  console.log(`ブランチ無し: ${br}`); process.exit(0);
}

// 3. 確認URL（「直しました」の見る場所）を PR にも載せる
const done = [...listComments(issue)].reverse().find((c) => kindOf(c.body) === 'done');
const previewUrl = done?.body.match(/\*\*見る場所\*\*:\s*(https?:\/\/\S+)/)?.[1] || '';

// 4. PR（あれば再利用）。⚠ 本文に Closes/Fixes/Resolves #n を書かない（マージした瞬間に閉じる）
const existing = ghJson(['pr', 'list', '-R', repo(), '--head', br, '--state', 'open', '--json', 'number,url']);
let prUrl = existing[0]?.url;
if (!prUrl) {
  const body = [
    '依頼者の確認が済んだので反映の申請を出します（`反映OK` ラベル）。', '',
    '## 確認URL', '', previewUrl || '（確認URLが見つかりませんでした）', '',
    `Refs #${issue}`, '',
    '🤖 Generated with [Claude Code](https://claude.com/claude-code)',
  ].join('\n');
  try {
    prUrl = gh(['pr', 'create', '-R', repo(), '--base', base, '--head', br, '--title', `${title} (#${issue})`, '--body-file', '-'], { input: body }).trim().split('\n').pop();
  } catch (e) {
    // 典型: 「GitHub Actions is not permitted to create or approve pull requests」
    //   → リポジトリ設定 Actions → Workflow permissions →「Allow GitHub Actions to create and approve pull requests」
    const reason = (e.stderr || e.message || '').split('\n').find((l) => l.includes('pull request')) || e.message.split('\n')[0];
    send('pr-failed', issue, { reason, runUrl: process.env.RUN_URL || '' });
    console.error(`PR 作成に失敗: ${reason}`);
    process.exit(1);
  }
}

// 5. Issue に知らせる
send('pr', issue, { body: [`反映の申請: ${prUrl}`, previewUrl ? `確認用ページ: ${previewUrl}` : ''].join('\n') });
console.log(`PR: ${prUrl}`);
