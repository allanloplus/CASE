/* 討論區：任務地圖、四大面向討論題、董事會決議與研討筆記 */
(function () {
  'use strict';
  const { h, fmt } = App;

  const MISSIONS = [
    { key: 'signs', title: '徵兆偵探', desc: '從 12 筆系統紀錄中，找出駭客留下的腳印。', face: ['arale', 'think'] },
    { key: 'killchain', title: '攻擊鏈拼圖', desc: '把七個攻擊步驟依序排好，看見每一關的防線。', face: ['arale', 'cheer'] },
    { key: 'law', title: '法條連連看', desc: '八個行為，對應刑法、個資法與重大訊息規範。', face: ['allan', 'point'] },
    { key: 'questions', title: '四大面向討論', desc: '管理、技術、法律、企業因應，寫下想法再對照參考答案。', face: ['allan', 'think'] },
    { key: 'decision', title: '72 小時決策模擬', desc: '扮演總經理許文翰，在董事會前做出四個關鍵決定。', face: ['allan', 'trouble'] },
    { key: 'final', title: '董事會決議', desc: '收斂成三項決議，整理管理意涵與你的研討筆記。', face: ['allan', 'laugh'] }
  ];
  App.MISSIONS = MISSIONS;
  const DIMS = ['mgmt', 'tech', 'law', 'resp'];

  function revealedSet(id) {
    return App.store.get('qrevealed:' + id, {});
  }
  function questionsDone(id) {
    const r = revealedSet(id);
    const data = window.CASE_LIBRARY[id];
    return DIMS.every((d) => data.questions.some((q) => q.dim === d && r[q.id]));
  }

  App.missionState = function (id) {
    const p = App.progress.get(id);
    const data = window.CASE_LIBRARY[id];
    const revealed = revealedSet(id);
    const qCount = data.questions.filter((q) => q.dim !== 'final' && revealed[q.id]).length;
    const qTotal = data.questions.filter((q) => q.dim !== 'final').length;
    return MISSIONS.map((m) => {
      if (m.key === 'questions') return { ...m, done: questionsDone(id), note: qCount + ' / ' + qTotal + ' 題', started: qCount > 0 };
      if (m.key === 'final') return { ...m, done: !!revealed['final-1'] };
      return { ...m, done: p[m.key] != null, score: p[m.key] };
    });
  };

  /* ---------- 任務地圖 ---------- */
  App.DiscussHub = function (root, data) {
    const id = data.meta.id;
    const states = App.missionState(id);
    const doneCount = states.filter((s) => s.done).length;

    root.append(
      h(
        'section',
        { class: 'hub-head' },
        h('div', null, h('p', { class: 'kicker' }, '個案研討・' + data.meta.id), h('h1', null, '討論區'), h('p', { class: 'lead' }, '建議依序完成六個任務。每個任務都可以重玩，進度會保存在這台裝置上。')),
        h('div', { class: 'hub-progress' }, h('span', { class: 'hub-count' }, h('b', null, doneCount), ' / ' + MISSIONS.length), h('span', { class: 'muted' }, '任務完成'))
      ),
      h(
        'div',
        { class: 'hub-talk' },
        App.talk('allan', 'smile', doneCount === 0 ? '歡迎來到討論區！先當偵探找徵兆，再一路推進到董事會決議。每一題都沒有唯一解，重點是你的推理過程。' : doneCount === MISSIONS.length ? '六個任務全部完成，表現得很好！可以到「董事會決議」複製你的研討筆記。' : '已經完成 ' + doneCount + ' 個任務，繼續加油！'),
        App.talk('arale', doneCount === MISSIONS.length ? 'thumb' : 'cheer', doneCount === MISSIONS.length ? '全部亮燈！阿拉蕾幫你頒發研討完成章！' : '每完成一關就會亮起星星，阿拉蕾會在旁邊給提示喔！', { flip: true })
      ),
      h(
        'ol',
        { class: 'mission-map' },
        states.map((m, i) =>
          h(
            'li',
            { class: 'mission' + (m.done ? ' done' : '') },
            h(
              'button',
              { type: 'button', class: 'mission-btn', onclick: () => App.go(id + '-' + m.key) },
              h('span', { class: 'mission-no' }, '任務 ' + (i + 1)),
              h('span', { class: 'mission-face' }, App.charImg(m.face[0], m.face[1])),
              h('strong', { class: 'mission-title' }, m.title),
              h('span', { class: 'mission-desc' }, m.desc),
              h(
                'span',
                { class: 'mission-state' },
                m.done ? (m.score ? App.Games.stars(m.score) : h('span', { class: 'tag-ok' }, '完成')) : h('span', { class: 'muted' }, m.started ? '進行中' : '未開始'),
                m.note ? h('span', { class: 'muted' }, m.note) : null
              )
            )
          )
        )
      )
    );
  };

  /* ---------- 任務頁外框 ---------- */
  App.MissionPage = function (root, data, key) {
    const id = data.meta.id;
    const i = MISSIONS.findIndex((m) => m.key === key);
    const m = MISSIONS[i];
    const body = h('div', { class: 'mission-body' });
    const nextM = MISSIONS[i + 1];
    root.append(
      h(
        'section',
        { class: 'mission-page' },
        h(
          'div',
          { class: 'mission-head' },
          h(
            'div',
            { class: 'mission-tools' },
            h('button', { type: 'button', class: 'btn btn-ghost btn-sm', onclick: () => App.go(id + '-discuss') }, '← 任務地圖'),
            App.Voice.available(id) ? App.Voice.toggleButton() : null
          ),
          h('p', { class: 'kicker' }, '任務 ' + (i + 1) + ' / ' + MISSIONS.length),
          h('h1', null, m.title)
        ),
        body,
        h(
          'div',
          { class: 'mission-foot' },
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => App.go(id + '-discuss') }, '回任務地圖'),
          nextM ? h('button', { type: 'button', class: 'btn btn-primary', onclick: () => App.go(id + '-' + nextM.key) }, '下一個任務：' + nextM.title) : null
        )
      )
    );
    const done = (score) => {
      const prev = App.progress.get(id)[key];
      if (prev == null || score > prev) App.progress.mark(id, key, score);
    };
    if (key === 'questions') App.QuestionsView(body, data);
    else if (key === 'final') App.FinalView(body, data);
    else App.Games[key](body, data, done);
  };

  /* ---------- 單一討論題卡片 ---------- */
  function questionCard(data, q, label) {
    const id = data.meta.id;
    const notes = App.store.get('notes:' + id, {});
    const revealed = revealedSet(id);
    const checks = App.store.get('checks:' + id, {});
    const dim = data.dimensions[q.dim];

    const hintTalk = App.talk('arale', 'think', q.hint, { flip: true });
    const hintBox = h('div', { class: 'q-hint', hidden: true }, hintTalk);
    const ta = h('textarea', { id: 'note-' + q.id, class: 'q-note', rows: '4', placeholder: '寫下你的想法……（自動儲存在這台裝置）' });
    ta.value = notes[q.id] || '';
    let saveTimer;
    ta.addEventListener('input', () => {
      clearTimeout(saveTimer);
      saveTimer = setTimeout(() => {
        const all = App.store.get('notes:' + id, {});
        all[q.id] = ta.value;
        App.store.set('notes:' + id, all);
      }, 300);
    });
    const ansBox = h('div', { class: 'q-answer', hidden: !revealed[q.id] });
    const btnHint = h('button', { type: 'button', class: 'btn btn-ghost btn-sm', 'aria-expanded': 'false', onclick: () => {
      hintBox.hidden = !hintBox.hidden;
      btnHint.setAttribute('aria-expanded', String(!hintBox.hidden));
      if (!hintBox.hidden && App.Voice.on()) App.Voice.sayTalk(hintTalk);
      else App.Voice.stop();
    } }, '阿拉蕾提示');
    const btnAns = h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: reveal }, revealed[q.id] ? '收起參考答案' : '看 Allan 的參考答案');

    function paintAnswer() {
      const myChecks = checks[q.id] || {};
      const meter = h('span', { class: 'cover-num' });
      const updateMeter = () => {
        const n = Object.values(App.store.get('checks:' + id, {})[q.id] || {}).filter(Boolean).length;
        meter.textContent = n + ' / ' + q.keypoints.length;
      };
      ansBox.replaceChildren(
        h(
          'div',
          { class: 'q-answer-head' },
          App.charImg('allan', 'point', 'q-answer-face'),
          h('p', null, h('strong', null, 'Allan 顧問的參考答案'), h('span', { class: 'muted' }, '　參考答案不是唯一解，重點在推理是否周延。'))
        ),
        h('div', { class: 'q-answer-body' }, q.answer.map((a) => h('p', { html: fmt(a) }))),
        q.controls ? h('p', { class: 'ctrl' }, 'ISO 27001:2022 對應控制措施：', q.controls.join('、')) : null,
        h(
          'fieldset',
          { class: 'keypoints' },
          h('legend', null, '自我檢核：你的答案提到了哪些重點？', meter),
          q.keypoints.map((kp, i) => {
            const cb = h('input', { type: 'checkbox', id: 'kp-' + q.id + '-' + i });
            cb.checked = !!myChecks[i];
            cb.addEventListener('change', () => {
              const all = App.store.get('checks:' + id, {});
              all[q.id] = all[q.id] || {};
              all[q.id][i] = cb.checked;
              App.store.set('checks:' + id, all);
              updateMeter();
            });
            return h('label', { class: 'kp', for: 'kp-' + q.id + '-' + i }, cb, h('span', null, kp));
          })
        )
      );
      updateMeter();
    }

    function reveal() {
      const r = revealedSet(id);
      if (ansBox.hidden) {
        r[q.id] = true;
        App.store.set('qrevealed:' + id, r);
        paintAnswer();
        ansBox.hidden = false;
        btnAns.textContent = '收起參考答案';
      } else {
        ansBox.hidden = true;
        btnAns.textContent = '看 Allan 的參考答案';
      }
    }
    if (revealed[q.id]) paintAnswer();

    return h(
      'article',
      { class: 'q-card q-' + dim.color, id: 'q-' + q.id },
      h('p', { class: 'q-label' }, h('span', { class: 'pill pill-' + dim.color }, dim.label), h('span', { class: 'mono' }, label)),
      h('h3', { class: 'q-text' }, q.q),
      hintBox,
      h('label', { class: 'sr-only', for: 'note-' + q.id }, '我的想法'),
      ta,
      h('div', { class: 'btn-row' }, btnHint, btnAns),
      ansBox
    );
  }
  App.questionCard = questionCard;

  /* ---------- 四大面向討論 ---------- */
  App.QuestionsView = function (root, data) {
    const id = data.meta.id;
    let current = App.store.get('qtab:' + id, 'mgmt');
    const tabs = h('div', { class: 'tabs', role: 'tablist', 'aria-label': '討論面向' });
    const panel = h('div', { class: 'tab-panel', role: 'tabpanel' });
    const intro = {
      mgmt: ['allan', 'think', '管理面看的是「制度與權責」：誰該負責、流程有沒有缺口、治理層級夠不夠。'],
      tech: ['arale', 'explain', '技術面要想清楚：每一個攻擊步驟，有哪道防線可以擋下或發現它？'],
      law: ['allan', 'point', '法律面有兩個角度：駭客的刑事責任，以及企業自己作為個資保管者的責任。'],
      resp: ['arale', 'think', '企業因應最考驗判斷力：付不付錢、說不說、怎麼說？']
    };
    function paint() {
      tabs.replaceChildren(
        ...DIMS.map((d) =>
          h(
            'button',
            { type: 'button', role: 'tab', class: 'tab tab-' + data.dimensions[d].color, 'aria-selected': String(d === current), onclick: () => { current = d; App.store.set('qtab:' + id, d); paint(); } },
            data.dimensions[d].label
          )
        )
      );
      const qs = data.questions.filter((q) => q.dim === current);
      const [who, face, text] = intro[current];
      panel.replaceChildren(App.talk(who, face, text, { flip: who === 'arale' }), ...qs.map((q, i) => questionCard(data, q, data.dimensions[current].short + ' ' + (i + 1))));
    }
    root.append(h('p', { class: 'game-intro' }, '每個面向 3 題。先寫下自己的想法，再打開參考答案，用「自我檢核」看看自己涵蓋了多少重點。四個面向各完成至少一題，就算完成任務。'), tabs, panel);
    paint();
  };

  /* ---------- 董事會決議＋管理意涵＋研討筆記 ---------- */
  App.FinalView = function (root, data) {
    const id = data.meta.id;
    const finalQ = data.questions.find((q) => q.dim === 'final');
    const notesOut = h('textarea', { id: 'notes-export', class: 'notes-export', rows: '10', readonly: true, hidden: true, 'aria-label': '研討筆記全文' });

    function compileNotes() {
      const notes = App.store.get('notes:' + id, {});
      const lines = ['《' + data.meta.title + '》研討筆記', ''];
      const counters = {};
      data.questions.forEach((q) => {
        counters[q.dim] = (counters[q.dim] || 0) + 1;
        const note = (notes[q.id] || '').trim();
        lines.push('【' + data.dimensions[q.dim].short + ' ' + counters[q.dim] + '】' + q.q);
        lines.push(note ? '我的想法：' + note : '我的想法：（未填寫）');
        lines.push('');
      });
      return lines.join('\n');
    }

    const states = App.missionState(id).filter((m) => m.key !== 'final');
    const allDone = states.every((m) => m.done);

    root.append(
      h('p', { class: 'game-intro' }, '最後一關：把前面的討論收斂成董事會上的三項決議，並回顧本個案的管理意涵。'),
      questionCard(data, finalQ, '綜合'),
      h(
        'section',
        { class: 'implications' },
        h('h2', null, '管理意涵'),
        h('div', { class: 'impl-grid' }, data.implications.map((im) => h('article', { class: 'impl' }, h('h3', null, im.title), h('p', null, im.body))))
      ),
      h(
        'section',
        { class: 'notes-box' },
        h('h2', null, '我的研討筆記'),
        h('p', { class: 'muted' }, '把你在各題寫下的想法整理成一份文字，可以貼到課堂作業或分組報告。'),
        h(
          'div',
          { class: 'btn-row' },
          h('button', { type: 'button', class: 'btn btn-primary', onclick: () => {
            const text = compileNotes();
            App.copyText(text, notesOut).then((ok) => App.toast(ok ? '已複製研討筆記' : '請手動選取下方文字複製'));
          } }, '複製研討筆記'),
          h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => {
            notesOut.value = compileNotes();
            notesOut.hidden = !notesOut.hidden;
          } }, '顯示全文')
        ),
        notesOut
      ),
      h(
        'section',
        { class: 'badge-box' + (allDone ? ' earned' : '') },
        h('div', { class: 'badge-chars' }, App.charImg('allan', allDone ? 'laugh' : 'smile'), App.charImg('arale', allDone ? 'thumb' : 'think')),
        allDone
          ? h('div', null, h('p', { class: 'kicker' }, '研討完成'), h('p', { class: 'result-big' }, data.meta.id + '　' + data.meta.title), h('p', null, '你已完成全部任務。歡迎帶著你的三項決議，和同學、同事交流不同的決策路線。'))
          : h('div', null, h('p', { class: 'kicker' }, '研討完成章'), h('p', null, '完成前五個任務後，這裡會亮起研討完成章。目前完成 ' + states.filter((m) => m.done).length + ' / ' + states.length + '。'))
      )
    );
  };
})();
