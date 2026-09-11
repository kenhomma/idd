#!/usr/bin/env node
// render-prompt.mjs — prompts/*.md の {{NAME}} を環境変数で埋める
//   Issue本文などは環境変数で受ける（シェルに展開しない・外部からのデータなので）
import { readFileSync } from 'node:fs';

const tpl = readFileSync(process.argv[2], 'utf8');
process.stdout.write(tpl.replace(/\{\{([A-Z_]+)\}\}/g, (_, k) => process.env[k] ?? ''));
