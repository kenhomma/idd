#!/usr/bin/env node
// setup.mjs — プロジェクト側の準備を整えて、足りないものを一覧で出す
//   node setup.mjs [--repo owner/name] [--labels-only]
import { LABEL_DEFS, arg, flag, gh, ghJson } from './lib.mjs';

const R = arg('--repo') || process.env.IDD_REPO || ghJson(['repo', 'view', '--json', 'nameWithOwner']).nameWithOwner;
console.log(`対象: ${R}`);

// 1. ラベル（--force で色と説明を揃える。既存の Issue の付与状態は変わらない）
for (const [name, color, desc] of LABEL_DEFS) {
  gh(['label', 'create', name, '-R', R, '--color', color, '--description', desc, '--force']);
}
console.log(`✅ ラベル ${LABEL_DEFS.length} 本を揃えた`);
if (flag('--labels-only')) process.exit(0);

const check = (ok, label, hint = '') => console.log(`${ok ? '✅' : '❌'} ${label}${ok ? '' : `  ← ${hint}`}`);
const vars = ghJson(['variable', 'list', '-R', R, '--json', 'name,value']);
const v = (n) => vars.find((x) => x.name === n)?.value || '';
check(!!v('IDD_APPROVERS'), `Variable IDD_APPROVERS = ${v('IDD_APPROVERS') || '（無し）'}`, 'gh variable set IDD_APPROVERS -b "kenhomma"');
check(true, `Variable IDD_MEMBERS = ${v('IDD_MEMBERS') || '（無し＝write権限者全員が反映OKを付けられる）'}`);
const secrets = ghJson(['secret', 'list', '-R', R, '--json', 'name']).map((s) => s.name);
check(secrets.includes('CLAUDE_CODE_OAUTH_TOKEN'), 'Secret CLAUDE_CODE_OAUTH_TOKEN', "claude setup-token → printf '%s' '<token>' | gh secret set CLAUDE_CODE_OAUTH_TOKEN -R " + R);
let rulesets = [];
try { rulesets = ghJson(['api', `repos/${R}/rulesets`]).map((r) => r.name); } catch {}
check(rulesets.length > 0, `Ruleset: ${rulesets.join(', ') || '（無し）'}`, 'main を守る Ruleset（PR必須・更新は管理者のみ）');
let pages = '';
try { pages = ghJson(['api', `repos/${R}/pages`]).html_url; } catch {}
check(!!pages, `GitHub Pages: ${pages || '（無効）'}`, 'gh api -X POST repos/' + R + '/pages -f build_type=workflow');
const collab = ghJson(['api', `repos/${R}/collaborators?affiliation=direct&per_page=100`]).map((c) => `${c.login}(${c.role_name})`);
console.log(`👥 共同作業者: ${collab.join(', ') || '（無し）'}`);
const inv = ghJson(['api', `repos/${R}/invitations`]).map((i) => `${i.invitee.login}(${i.permissions})`);
if (inv.length) console.log(`✉️ 招待中（未承諾）: ${inv.join(', ')}`);
console.log('ℹ️ GitHub App「Claude」の導入は API から確認できません。https://github.com/settings/installations で対象リポが含まれているかを見てください');
