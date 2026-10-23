/* 頁面：首頁個案庫、個案總覽、文本版、教學手冊 */
(function () {
  'use strict';
  const { h, fmt } = App;
  const Pages = (App.Pages = {});

  /* ---------- 首頁 ---------- */
  Pages.home = function (root) {
    const cases = window.CASE_REGISTRY || [];
    const ready = cases.find((c) => c.status === 'ready');
    root.append(
      h(
        'section',
        { class: 'hero' },
        h(
          'div',
          { class: 'hero-copy' },
          h('p', { class: 'kicker' }, '資安個案研究室'),
          h('h1', { class: 'hero-title' }, '從真實事件，', h('br'), '練一次資安決策'),
          h('p', { class: 'lead' }, '每一個個案都改編自公開的資安事件，依企業個案的寫法重新編撰：背景、徵兆、事件經過，最後停在一個必須做決定的時刻。Allan 顧問帶你讀懂案情，AI 小助手阿拉蕾陪你闖關討論。'),
          h(
            'div',
            { class: 'btn-row' },
            ready ? h('button', { type: 'button', class: 'btn btn-primary btn-lg', onclick: () => App.go(ready.id) }, '開始第一個個案') : null,
            h('a', { class: 'btn btn-ghost btn-lg', href: '#library-list', onclick: (e) => { e.preventDefault(); document.getElementById('library-list').scrollIntoView({ behavior: App.reduceMotion ? 'auto' : 'smooth' }); } }, '瀏覽個案庫')
          )
        ),
        h(
          'div',
          { class: 'hero-cast' },
          h('div', { class: 'hero-allan' }, App.charImg('allan', 'full')),
          h('div', { class: 'hero-arale' }, App.charImg('arale', 'hello')),
          h('div', { class: 'hero-say say-allan' }, '我是 Allan 顧問，帶你從管理、技術、法律三個角度看事件。'),
          h('div', { class: 'hero-say say-arale' }, '我是阿拉蕾！遊戲和提示交給我！')
        )
      ),
      h(
        'section',
        { class: 'how' },
        h('h2', null, '一個個案，三段體驗'),
        h(
          'ol',
          { class: 'how-steps' },
          h('li', null, h('strong', null, '動畫閱讀'), h('span', null, '場景、旁白與角色對話，一步步讀完案情；也可以切換成文本版閱讀。')),
          h('li', null, h('strong', null, '互動討論'), h('span', null, '徵兆偵探、攻擊鏈拼圖、法條連連看，再進入四大面向的討論題。')),
          h('li', null, h('strong', null, '決策模擬'), h('span', null, '扮演個案中的決策者，在時間壓力下做選擇，看見每個決定的代價。'))
        )
      ),
      h(
        'section',
        { class: 'library', id: 'library-list' },
        h('div', { class: 'section-head' }, h('h2', null, '個案庫'), h('p', { class: 'muted' }, '目前 ' + cases.length + ' 個個案，' + cases.filter((c) => c.status === 'ready').length + ' 個已完成改編。')),
        h('div', { class: 'case-grid' }, cases.map(caseCard))
      ),
      h(
        'section',
        { class: 'source-note' },
        h('h2', null, '個案來源'),
        h('p', null, '個案素材取自國家資通安全研究院《資安案例彙編—精選案例》及公開報導，改編時已虛構公司與人物名稱，並重新撰寫情節與分析，引用時均註明出處。'),
        h('p', null, h('a', { href: 'https://www.nics.nat.gov.tw/cybersecurity_resources/publications/Compilation_of_Cases/Selected_Cases/', target: '_blank', rel: 'noopener' }, '國家資通安全研究院｜精選案例'))
      )
    );
  };

  function caseCard(c) {
    const ready = c.status === 'ready';
    const p = ready ? App.progress.get(c.id) : {};
    return h(
      'article',
      { class: 'case-card' + (ready ? '' : ' planned') },
      h('div', { class: 'case-card-top' }, h('span', { class: 'case-code mono' }, c.id), h('span', { class: 'pill pill-' + (ready ? 'teal' : 'muted') }, ready ? '可研討' : '改編中')),
      h('h3', null, ready ? c.title : c.origin),
      ready ? h('p', { class: 'muted' }, '原始案例：' + c.origin) : h('p', { class: 'muted' }, '類別：' + c.category),
      h('ul', { class: 'tags' }, c.tags.map((t) => h('li', null, t))),
      ready
        ? h('div', { class: 'case-card-foot' }, h('span', { class: 'muted' }, '約 ' + c.minutes + ' 分鐘' + (p.read ? '・已讀完' : '')), h('button', { type: 'button', class: 'btn btn-primary btn-sm', onclick: () => App.go(c.id) }, '進入個案'))
        : h('div', { class: 'case-card-foot' }, h('span', { class: 'muted' }, '即將推出'))
    );
  }

  /* ---------- 個案總覽 ---------- */
  Pages.overview = function (root, data) {
    const m = data.meta;
    const p = App.progress.get(m.id);
    const states = App.missionState(m.id);
    const doneCount = states.filter((s) => s.done).length;
    const mode = (key, title, desc, img, state, primary) =>
      h(
        'button',
        { type: 'button', class: 'mode-card' + (primary ? ' primary' : ''), onclick: () => App.go(m.id + '-' + key) },
        h('span', { class: 'mode-img' }, img),
        h('span', { class: 'mode-text' }, h('strong', null, title), h('span', null, desc), state ? h('span', { class: 'mode-state' }, state) : null)
      );
    root.append(
      h(
        'section',
        { class: 'case-head' },
        h('div', { class: 'case-meta' }, h('span', { class: 'case-code mono' }, '案號 ' + m.id), h('span', { class: 'pill pill-navy' }, m.category), h('span', { class: 'muted' }, '研討時間約 ' + m.minutes + ' 分鐘')),
        h('h1', { class: 'case-title' }, m.title),
        h('p', { class: 'lead' }, m.subtitle),
        h('ul', { class: 'tags' }, m.tags.map((t) => h('li', null, t)))
      ),
      h(
        'section',
        { class: 'modes' },
        mode('read', '動畫閱讀', '場景、旁白與角色對話，一步步讀完案情。', App.charImg('arale', 'tablet'), p.read ? '已讀完' : null, true),
        mode('discuss', '討論互動', '六個任務：偵探、拼圖、連連看、討論題、決策模擬、董事會決議。', App.charImg('arale', 'present'), doneCount ? '已完成 ' + doneCount + ' / 6' : null, true),
        mode('text', '文本版', '完整的個案本文與附件，適合列印或課前閱讀。', App.charImg('allan', 'stand')),
        mode('teach', '教學手冊', '教學目標、課堂流程、參考答案與遊戲解答。', App.charImg('allan', 'think'))
      ),
      h(
        'section',
        { class: 'overview-talk' },
        App.talk('allan', 'smile', '這個個案停在董事會前夜：系統三天就救回來了，暗網上的倒數卻才剛開始。你會怎麼建議總經理？'),
        App.talk('arale', 'cheer', '建議先看「動畫閱讀」，再到「討論互動」闖關！', { flip: true })
      ),
      h(
        'section',
        { class: 'overview-grid' },
        h('div', { class: 'panel' }, h('h2', null, '學習目標'), h('ul', { class: 'check-list' }, data.teaching.objectives.map((o) => h('li', null, o)))),
        h('div', { class: 'panel' }, h('h2', null, '個案人物'), castList(data))
      ),
      sourceBlock(data, true)
    );
  };

  function castList(data) {
    return h(
      'dl',
      { class: 'cast-list' },
      data.cast.map((c) => h('div', { class: 'cast-row' }, h('dt', null, c.name, h('span', { class: 'muted' }, '　' + c.role)), h('dd', null, c.note)))
    );
  }

  /* 創意規劃與個案內容產生方式 */
  function credits(data) {
    const c = data.meta.credits;
    if (!c) return null;
    return h(
      'dl',
      { class: 'credits' },
      h('div', null, h('dt', null, '創意規劃'), h('dd', null, c.planner + '（', h('a', { href: c.url, target: '_blank', rel: 'noopener' }, c.url.replace(/^https?:\/\//, '')), '），' + c.date)),
      h('div', null, h('dt', null, '個案內容'), h('dd', null, c.content))
    );
  }

  function sourceBlock(data, withCredits) {
    const s = data.meta.source;
    return h(
      'section',
      { class: 'source-note' },
      h('h2', null, '來源與聲明'),
      withCredits ? credits(data) : null,
      h('p', null, s.text),
      h('ul', { class: 'link-list' }, s.links.map((l) => h('li', null, h('a', { href: l.url, target: '_blank', rel: 'noopener' }, l.label)))),
      h('p', { class: 'muted' }, data.meta.disclaimer)
    );
  }

  /* ---------- 文本版 ---------- */
  Pages.text = function (root, data) {
    const m = data.meta;
    const doc = h('article', { class: 'doc' });
    doc.append(
      h(
        'header',
        { class: 'doc-head' },
        h('p', { class: 'kicker' }, '企業個案・案號 ' + m.id),
        h('h1', null, m.title),
        h('p', { class: 'lead' }, m.subtitle),
        credits(data)
      ),
      h('aside', { class: 'doc-note' }, m.disclaimer),
      h('h2', null, '個案人物'),
      castList(data)
    );
    data.chapters.forEach((ch) => {
      doc.append(h('h2', null, h('span', { class: 'doc-kicker' }, ch.kicker), ch.title));
      ch.scenes.forEach((sc) => sc.narration.forEach((p) => doc.append(App.renderParagraph(p))));
    });
    doc.append(h('h2', { class: 'doc-break' }, '附件'));
    Object.keys(data.exhibits).forEach((k) => {
      if (data.exhibits[k].readerOnly) return;
      doc.append(App.renderExhibit(data, k, { cls: 'doc-exhibit' }));
    });
    doc.append(h('h2', { class: 'doc-break' }, '討論問題'));
    const counters = {};
    doc.append(
      h(
        'ol',
        { class: 'doc-questions' },
        data.questions.map((q) => {
          counters[q.dim] = (counters[q.dim] || 0) + 1;
          return h('li', null, h('span', { class: 'pill pill-' + data.dimensions[q.dim].color }, data.dimensions[q.dim].short + ' ' + counters[q.dim]), q.q);
        })
      ),
      sourceBlock(data)
    );
    root.append(doc);
  };

  /* ---------- 教學手冊 ---------- */
  Pages.teach = function (root, data) {
    const m = data.meta;
    const t = data.teaching;
    const doc = h('article', { class: 'doc teach' });
    doc.append(
      h('header', { class: 'doc-head' }, h('p', { class: 'kicker' }, '教學手冊・案號 ' + m.id), h('h1', null, m.title), h('p', { class: 'lead' }, '供講師與帶領人使用，包含參考答案與遊戲解答。'), credits(data)),
      h('h2', null, '個案摘要'),
      h('p', null, t.summary),
      h('h2', null, '教學目標'),
      h('ul', { class: 'check-list' }, t.objectives.map((o) => h('li', null, o))),
      h('h2', null, '適用課程與對象'),
      h('p', null, t.courses),
      h('p', { class: 'muted' }, '適用對象：' + m.audience),
      h('h2', null, '課前準備'),
      h('ul', null, t.prep.map((x) => h('li', null, x))),
      h('h2', null, '課堂進行建議（90 分鐘）'),
      h(
        'div',
        { class: 'scroll-x' },
        h('table', { class: 'data-table' }, h('thead', null, h('tr', null, h('th', null, '時間'), h('th', null, '段落'), h('th', null, '進行方式'))), h('tbody', null, t.plan.map((r) => h('tr', null, h('td', { class: 'mono nowrap' }, r[0]), h('td', { class: 'nowrap' }, r[1]), h('td', null, r[2])))))
      ),
      h('h2', null, '板書規劃'),
      h('ul', null, t.board.map((x) => h('li', null, x))),
      h('h2', null, '管理意涵'),
      h('div', { class: 'impl-grid' }, data.implications.map((im) => h('article', { class: 'impl' }, h('h3', null, im.title), h('p', null, im.body))))
    );

    doc.append(h('h2', { class: 'doc-break' }, '討論問題與參考答案'));
    ['mgmt', 'tech', 'law', 'resp', 'final'].forEach((d) => {
      const qs = data.questions.filter((q) => q.dim === d);
      doc.append(h('h3', { class: 'dim-head' }, h('span', { class: 'pill pill-' + data.dimensions[d].color }, data.dimensions[d].label)));
      qs.forEach((q, i) => {
        doc.append(
          h(
            'section',
            { class: 'teach-q' },
            h('p', { class: 'teach-q-text' }, h('span', { class: 'mono' }, data.dimensions[d].short + ' ' + (i + 1) + '　'), q.q),
            h('div', { class: 'teach-a' }, q.answer.map((a) => h('p', { html: fmt(a) }))),
            h('p', { class: 'ctrl' }, '關鍵重點：' + q.keypoints.join('、')),
            q.controls ? h('p', { class: 'ctrl' }, 'ISO 27001:2022：' + q.controls.join('、')) : null
          )
        );
      });
    });

    const g = data.games;
    doc.append(
      h('h2', { class: 'doc-break' }, '遊戲解答'),
      h('h3', null, g.signs.title),
      h(
        'div',
        { class: 'scroll-x' },
        h('table', { class: 'data-table' }, h('thead', null, h('tr', null, h('th', null, '時間'), h('th', null, '紀錄'), h('th', null, '判斷'), h('th', null, '說明'))), h('tbody', null, g.signs.items.map((it) => h('tr', { class: it.sign ? 'row-sign' : '' }, h('td', { class: 'mono nowrap' }, it.t), h('td', null, it.msg), h('td', { class: 'nowrap' }, it.sign ? '攻擊徵兆' : '正常'), h('td', null, it.why)))))
      ),
      h('h3', null, g.killchain.title),
      h('ol', { class: 'chain-key' }, g.killchain.steps.map((st) => h('li', null, h('strong', null, st.stage + '：'), st.act, h('span', { class: 'muted' }, '（ATT&CK ' + st.attack + '；防線：' + st.defend + '）')))),
      h('h3', null, g.law.title),
      h('ul', null, g.law.pairs.map((pr) => {
        const law = g.law.laws.find((x) => x.id === pr.law);
        return h('li', null, pr.act + ' → ', h('strong', null, law.label + ' ' + law.name));
      })),
      h('h3', null, g.decision.title + '：Allan 建議路線'),
      h('ol', null, g.decision.rounds.map((r) => h('li', null, h('strong', null, r.title + '：'), r.options.find((o) => o.best).text))),
      h('h2', { class: 'doc-break' }, '參考法規與標準'),
      t.references.map((grp) => [h('h3', null, grp.group), h('ul', null, grp.items.map((x) => h('li', null, x)))]),
      h('h2', null, '後續發展（可於課堂結尾補充）'),
      h('ul', null, t.epilogue.map((x) => h('li', null, x))),
      h('p', { class: 'muted' }, '法規與標準內容以撰寫時的公開資訊為準，實務應用請查證最新條文與主管機關規定。'),
      sourceBlock(data)
    );
    root.append(doc);
  };

  /* ---------- 改編中或找不到 ---------- */
  Pages.missing = function (root, id) {
    const entry = App.registryEntry(id);
    root.append(
      h(
        'section',
        { class: 'missing' },
        App.charImg('arale', entry ? 'explain' : 'confused', 'missing-face'),
        h('h1', null, entry ? '這個個案還在改編中' : '找不到這個個案'),
        entry ? h('p', null, '原始案例：' + entry.origin) : h('p', null, '請回到個案庫選擇其他個案。'),
        h('button', { type: 'button', class: 'btn btn-primary', onclick: () => App.go('') }, '回個案庫')
      )
    );
  };
})();
