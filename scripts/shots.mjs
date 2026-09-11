#!/usr/bin/env node
// shots.mjs — 確認用ページの画面写真を撮って、最新の返事（対応案／直しました）に貼る
//   node shots.mjs --issue N --url U [--widths 375,1440] [--branch idd-previews]
//
// ■ なぜ要るか（2026-09-11 オーナー指示）
//   「プレビューがないとサイズ感とかレイアウトとかよいのか誰も判断できない。静的なものならブラウザのスクショでもよい」
// ■ どう撮るか
//   ヘッドレス Chrome（GitHub の ubuntu ランナーに入っている google-chrome。macOS では Google Chrome.app）で
//   スマホ幅と PC 幅の2枚。画像は idd-previews ブランチに置き、raw.githubusercontent.com の URL で貼る（public リポ前提）。
import { existsSync, readFileSync, mkdtempSync } from 'node:fs';
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
for (const w of widths) {
  const h = w < 600 ? 1400 : 1000;
  const f = join(dir, `${w}.png`);
  sh(chrome, ['--headless=new', '--disable-gpu', '--hide-scrollbars', '--no-sandbox', '--virtual-time-budget=6000',
    `--window-size=${w},${h}`, `--screenshot=${f}`, url], { stdio: ['ignore', 'ignore', 'ignore'] });
  files.push({ width: w, file: f });
}

// 置き場のブランチが無ければ main から作る（画像だけの履歴。PR には混ざらない）
const R = repo();
let exists = true;
try { ghJson(['api', `repos/${R}/git/ref/heads/${branch}`]); } catch { exists = false; }
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
