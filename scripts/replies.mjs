// replies.mjs — 依頼者に見える文面は全部ここ。ワークフローもエージェントもこの send() を通す。
//   先頭: 署名＋状況行（いま／次に動く人／あなたがすること／見る場所）
//   末尾: <!--idd:種類--><!--cc-->   ← 印はここで付ける。モデルに付けさせない
//   ack / stopped / nudge には <!--cc--> を付けない（返事ではなく合図。付けると未応答の検知から消える）
import { MARK, LABELS, approvers, mentions, postComment, listComments, editComment, setLabels, kindOf } from './lib.mjs';

export const HEAD = '> 🤖 **Claude（AI）からの返信です**';
export const PENDING_URL = '> **見る場所**: 準備中です。1〜2分後にこのコメントに追記されます';

function status(kind, o) {
  const A = mentions(approvers());
  const AGAIN = '> **あなたがすること**: 内容を読んで、違うところがあればそのままコメントしてください（@claude は不要です）';
  switch (kind) {
    case 'plan': return [`> **いま**: 対応案を出しました　**次に動く人**: 承認者 ${A}（「着手OK」のラベルを付けます）`, AGAIN];
    case 'revise': return [`> **いま**: 対応案を直しました　**次に動く人**: 承認者 ${A}（「着手OK」のラベルを付けます）`, AGAIN];
    case 'working': return ['> **いま**: 作業を始めました　**次に動く人**: Claude（作業中）',
      '> **あなたがすること**: 待っていてください。終わると確認用ページのURLがここに届きます'];
    case 'done': return ['> **いま**: 直しました　**次に動く人**: あなた（確認用ページを見ます）',
      o.url ? `> **見る場所**: ${o.url}` : PENDING_URL,
      '> **あなたがすること**: 見て、よければ「反映OK」のラベルを付けてください。違うところがあれば、そのままコメントしてください'];
    case 'local': return [`> **いま**: この作業は代表者の手元で行います　**次に動く人**: ${A}`,
      '> **あなたがすること**: 待っていてください。終わるとここに報告が届きます'];
    case 'noop': return ['> **いま**: 確認しました。いまは対応が要らないと判断しました　**次に動く人**: —',
      '> **あなたがすること**: 違っていれば、そのままコメントしてください'];
    case 'pr': return [`> **いま**: 反映の申請を出しました　**次に動く人**: 管理者 ${A}（反映します）`,
      '> **あなたがすること**: 待っていてください。反映されるとここに届きます'];
    case 'released': return ['> **いま**: 反映されました　**次に動く人**: あなた（直ったか確認します）',
      `> **見る場所**: ${o.url || '（本番URLが未設定です）'}`,
      '> **あなたがすること**: 直っていればこのIssueを閉じてください。違うところがあれば、そのままコメントしてください'];
    default: return [];
  }
}

const MOVES = {
  plan: { add: [LABELS.planned] },
  revise: { add: [LABELS.planned] },
  working: { add: [LABELS.working], remove: [LABELS.planned] },
  done: { add: [LABELS.review], remove: [LABELS.approved, LABELS.working, LABELS.planned] },
  local: { add: [LABELS.local] },
  guard: { remove: [LABELS.approved] },
  'guard-merge': { remove: [LABELS.mergeOk] },
  'pr-missing': { remove: [LABELS.mergeOk] },
  released: { add: [LABELS.released], remove: [LABELS.mergeOk, LABELS.review] },
};

// 印を付けない種類（返事ではなく合図）
const NO_MARK = new Set(['ack', 'stopped', 'nudge']);

export function compose(kind, o = {}) {
  const A = mentions(approvers());
  let lines;
  switch (kind) {
    case 'ack':
      lines = [HEAD, '', o.event === 'opened'
        ? '受け取りました。数分で対応案をこのIssueに書きます。'
        : '受け取りました。内容を確認して、あらためて返信します。'];
      break;
    case 'stopped':
      lines = ['⚠️ **自動対応が途中で止まりました。**', '',
        `${o.what || '自動処理'}が動きましたが、**返事を出す前に終わっています。** 代表者 ${A} が引き継ぎます。`,
        'お急ぎのときは、このIssueに `@claude` と書いていただければ再度動きます。', '',
        o.runUrl ? `実行ログ: ${o.runUrl}` : ''];
      break;
    case 'nudge':
      lines = [`⏰ このIssueへの書き込みに、まだ返事が出ていません。代表者 ${A} が引き継ぎます。`,
        'お急ぎのときは、このIssueに `@claude` と書いていただければ再度動きます。'];
      break;
    case 'guard':
      lines = [HEAD, '', `@${o.sender} さん、「着手OK」を付けられるのは ${A} です。ラベルは一旦外しました。`,
        '承認したい意図はコメントで残していただければ、承認者が確認します。'];
      break;
    case 'guard-merge':
      lines = [HEAD, '', `@${o.sender} さん、「反映OK」を付けられるのは ${o.members || 'このリポジトリに書き込める人'} です。ラベルは一旦外しました。`];
      break;
    case 'pr-missing':
      lines = [HEAD, '', '作業中の版がまだありません。「直しました」の返事が届いてから「反映OK」を付けてください。ラベルは一旦外しました。'];
      break;
    default:
      lines = [HEAD, ...status(kind, o), '', (o.body || '').trim()];
  }
  const tail = NO_MARK.has(kind) ? `<!--idd:${kind}-->` : `<!--idd:${kind}-->${MARK}`;
  return [...lines, '', tail].join('\n').replace(/\n{3,}/g, '\n\n');
}

export function send(kind, issue, o = {}) {
  const url = postComment(issue, compose(kind, o));
  const mv = MOVES[kind];
  if (mv) setLabels(issue, mv);
  return url;
}

// 「直しました」に確認URLを追記する。別コメントに分けない（依頼者が探さなくて済むように）
export function appendUrl(issue, url) {
  const comments = listComments(issue);
  const target = [...comments].reverse().find((c) => kindOf(c.body) === 'done');
  if (!target) {
    return postComment(issue, compose('done-url', { body: `**見る場所**: ${url}` }));
  }
  if (target.body.includes(url)) return target.url;
  const body = target.body.includes(PENDING_URL)
    ? target.body.replace(PENDING_URL, `> **見る場所**: ${url}`)
    : target.body.replace(MARK, `\n**見る場所**: ${url}\n\n${MARK}`);
  editComment(target.id, body);
  return target.url;
}
