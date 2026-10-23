/*
 * 列出個案中需要配音的台詞（JSON），供 tools/build_voice.py 使用。
 * 用法：node tools/case_lines.js S111001
 *
 * 配音範圍：
 *   - 動畫閱讀的所有對話（chapters[].scenes[].lines）
 *   - 討論題的阿拉蕾提示（questions[].hint）
 *   - 72 小時決策模擬的情境與 Allan 講評
 *   - 法條連連看的 Allan 解說
 */
'use strict';
const fs = require('fs');
const path = require('path');
const vm = require('vm');

const id = process.argv[2];
if (!/^S\d{6}$/.test(id || '')) {
  console.error('用法：node tools/case_lines.js <案號>');
  process.exit(1);
}
const file = path.join(__dirname, '..', 'cases', id, 'case.js');
const sandbox = { window: {} };
vm.runInNewContext(fs.readFileSync(file, 'utf8'), sandbox, { filename: file });
const data = sandbox.window.CASE_LIBRARY[id];

const lines = [];
const add = (who, text, where) => lines.push({ who, text, where });

data.chapters.forEach((ch) =>
  ch.scenes.forEach((sc, si) => sc.lines.forEach(([who, , text], li) => add(who, text, `${ch.id}-${si + 1}-${li + 1}`)))
);
data.questions.forEach((q) => q.hint && add('arale', q.hint, `hint-${q.id}`));
const g = data.games || {};
if (g.decision) {
  g.decision.rounds.forEach((r, ri) => {
    add(r.face[0], r.situation, `decision-${ri + 1}`);
    r.options.forEach((o, oi) => add('allan', o.allan, `decision-${ri + 1}-${'ABC'[oi]}`));
  });
}
if (g.law) g.law.pairs.forEach((p, pi) => add('allan', p.why, `law-${pi + 1}`));

process.stdout.write(JSON.stringify(lines));
