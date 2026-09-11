#!/usr/bin/env node
// shots.mjs — 確認用ページの画面写真を撮って、最新の返事（対応案／直しました）に貼る
//   node shots.mjs --issue N --url U [--widths 375,1440] [--branch idd-previews]
//
// ■ なぜ要るか（2026-09-11 オーナー指示）
//   「プレビューがないとサイズ感とかレイアウトとかよいのか誰も判断できない。静的なものならブラウザのスクショでもよい」
// ■ どう撮るか
//   ヘッドレス Chrome（GitHub の ubuntu ランナーに入っている google-chrome。macOS では Google Chrome.app）で
//   スマホ幅と PC 幅の2枚。画像は idd-previews ブランチに置き、raw.githubusercontent.com の URL で貼る（public リポ前提）。
import { existsSync, readFileSync, writeFileSync, mkdtempSync } from 'node:fs';
import { tmpdir } from 'node:os';
import { join } from 'node:path';
import { sh, gh, ghJson, repo, arg } from './lib.mjs';
import { appendShots } from './replies.mjs';

const issue = arg('--issue');
const url = arg('--url');
const widths = (arg('--widths', '375,1440')).split(',').map(Number);
const branch = arg('--branch', 'idd-previews');
if (!issue || !url) { console.error('--issue と --url が要ります'); process.exit(2); }

const CANDIDATES = ['google-chrome', 'google-chrome-stable', 'chromium-browser', 'chromium',
  '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'];
function findChrome() {
  for (const c of CANDIDATES) {
    if (c.startsWith('/')) { if (existsSync(c)) return c; continue; }
    try { sh('which', [c]); return c; } catch {}
  }
  return null;
}
const chrome = findChrome();
if (!chrome) { console.log('Chrome が見つからないので画面写真は撮らない'); process.exit(0); }

const dir = mkdtempSync(join(tmpdir(), 'idd-shots-'));
const files = [];
// ⚠ Chrome はウィンドウ幅を約500px未満にできない。375px をそのまま指定すると、レイアウトは 500px で
//   組まれて右が切れた画像になる（実測 2026-09-11・#4）。狭い幅は iframe に入れて撮り、右の余白を切り落とす。
// iframe を中央に置いて「中央を切り出す」。sips は中央しか切れず、convert も中央指定なら同じ結果になる
function crop(file, w, h) {
  for (const [cmd, args] of [
    ['convert', [file, '-gravity', 'center', '-crop', `${w}x${h}+0+0`, '+repage', file]],
    ['magick', [file, '-gravity', 'center', '-crop', `${w}x${h}+0+0`, '+repage', file]],
    ['sips', ['--cropToHeightWidth', String(h), String(w), file]],
  ]) {
    try { sh('which', [cmd], { stdio: ['ignore', 'ignore', 'ignore'] }); sh(cmd, args, { stdio: ['ignore', 'ignore', 'ignore'] }); return true; } catch {}
  }
  return false;
}
for (const w of widths) {
  const h = w < 600 ? 1400 : 1000;
  const f = join(dir, `${w}.png`);
  const common = ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox', '--virtual-time-budget=6000'];
  if (w < 500) {
    const wrap = join(dir, `wrap-${w}.html`);
    writeFileSync(wrap, `<!doctype html><meta charset="utf-8"><body style="margin:0;background:#fff"><iframe src="${url}" width="${w}" height="${h}" style="border:0;display:block;margin:0 auto"></iframe>`);
    sh(chrome, [...common, `--window-size=${w + 144},${h}`, `--screenshot=${f}`, `file://${wrap}`], { stdio: ['ignore', 'ignore', 'ignore'] });
    if (!crop(f, w, h)) console.log(`（${w}px: 切り落としの道具が無いので右に余白が残る）`);
  } else {
    sh(chrome, [...common, `--window-size=${w},${h}`, `--screenshot=${f}`, url], { stdio: ['ignore', 'ignore', 'ignore'] });
  }
  files.push({ width: w, file: f });
}

if (process.argv.includes('--dry')) { console.log(files.map((x) => x.file).join('\n')); process.exit(0); }

// 置き場のブランチが無ければ main から作る（画像だけの履歴。PR には混ざらない）
const R = repo();
let exists = true;
try { ghJson(['api', `repos/${R}/git/ref/heads/${branch}`], { stdio: ['ignore', 'pipe', 'ignore'] }); } catch { exists = false; }
if (!exists) {
  const sha = ghJson(['api', `repos/${R}/git/ref/heads/main`]).object.sha;
  gh(['api', '-X', 'POST', `repos/${R}/git/refs`, '-f', `ref=refs/heads/${branch}`, '-f', `sha=${sha}`]);
}
const ts = new Date().toISOString().replace(/[-:]/g, '').slice(0, 15);
const shots = [];
for (const s of files) {
  const path = `issue-${issue}/${ts}-${s.width}.png`;
  gh(['api', '-X', 'PUT', `repos/${R}/contents/${path}`, '--input', '-'],
    { input: JSON.stringify({ message: `shots: issue-${issue} ${s.width}px`, content: readFileSync(s.file).toString('base64'), branch }) });
  shots.push({ width: s.width, url: `https://raw.githubusercontent.com/${R}/${branch}/${path}` });
}
const at = appendShots(issue, shots);
console.log(`画面写真 ${shots.length}枚を貼った: ${at || '（貼り先が無い）'}`);
