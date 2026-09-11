#!/usr/bin/env node
// build-site.mjs — demo/ を GitHub Pages 用に組む
//   ルート = main の demo/、/preview/issue-<n>/ = 各 issue-* ブランチの demo/
//   HTML 内の __IDD_BRANCH__ をブランチ名に置き換える（どの版を見ているかを画面で確かめられる）
import { mkdirSync, rmSync, writeFileSync, readdirSync, readFileSync, statSync } from 'node:fs';
import { join } from 'node:path';
import { sh } from './lib.mjs';

const OUT = '_site';
rmSync(OUT, { recursive: true, force: true });
mkdirSync(OUT, { recursive: true });
sh('git', ['fetch', '--no-tags', '--prune', 'origin', '+refs/heads/*:refs/remotes/origin/*']);

function extract(ref, dir) {
  mkdirSync(dir, { recursive: true });
  // ref は origin/main か origin/issue-<数字> に限る（シェルに渡すため）
  if (!/^origin\/(main|issue-\d+)$/.test(ref)) throw new Error(`不正な ref: ${ref}`);
  sh('sh', ['-c', `git archive --format=tar ${ref} demo | tar -x --strip-components=1 -C ${dir}`]);
}
function stamp(dir, name) {
  for (const f of readdirSync(dir)) {
    const p = join(dir, f);
    if (statSync(p).isDirectory()) { stamp(p, name); continue; }
    if (!/\.html?$/.test(f)) continue;
    writeFileSync(p, readFileSync(p, 'utf8').replaceAll('__IDD_BRANCH__', name));
  }
}

extract('origin/main', OUT);
stamp(OUT, 'main');
const branches = sh('git', ['branch', '-r', '--list', 'origin/issue-*', '--format=%(refname:short)'])
  .split('\n').map((s) => s.trim()).filter((s) => /^origin\/issue-\d+$/.test(s));
const rows = [];
for (const b of branches) {
  const name = b.replace(/^origin\//, '');
  const dir = join(OUT, 'preview', name);
  try { extract(b, dir); stamp(dir, name); rows.push(name); console.log(`preview: ${name}`); }
  catch (e) { console.log(`skip ${name}: ${e.message.split('\n')[0]}`); }
}
mkdirSync(join(OUT, 'preview'), { recursive: true });
writeFileSync(join(OUT, 'preview', 'index.html'), `<!doctype html><meta charset="utf-8"><title>確認用ページ一覧</title>
<body style="font-family:system-ui;padding:24px"><h1>確認用ページ一覧</h1><ul>${rows.map((r) => `<li><a href="./${r}/">${r}</a></li>`).join('') || '<li>いまは無し</li>'}</ul></body>`);
writeFileSync(join(OUT, '.nojekyll'), '');
console.log(`built: ${OUT} (${rows.length} previews)`);
