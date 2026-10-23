/* 互動遊戲：徵兆偵探、攻擊鏈拼圖、法條連連看、72 小時決策模擬 */
(function () {
  'use strict';
  const { h, fmt } = App;
  const Games = (App.Games = {});

  function stars(n, total) {
    total = total || 3;
    let s = '';
    for (let i = 0; i < total; i++) s += i < n ? '★' : '☆';
    return h('span', { class: 'stars', 'aria-label': n + ' 顆星' }, s);
  }
  Games.stars = stars;

  function speaker() {
    const holder = h('div', { class: 'game-speaker', 'aria-live': 'polite' });
    return {
      el: holder,
      say(who, face, text) {
        holder.replaceChildren(App.talk(who, face, text, { flip: who === 'arale' }));
      }
    };
  }

  /* ---------- 徵兆偵探 ---------- */
  Games.signs = function (root, data, done) {
    const g = data.games.signs;
    const key = 'signs:' + data.meta.id;
    let answers = App.store.get(key, {});
    const talk = speaker();
    const status = h('p', { class: 'game-status' });
    const list = h('ol', { class: 'sign-list' });
    const summary = h('div', { class: 'game-summary' });

    const totalSigns = g.items.filter((i) => i.sign).length;

    function update() {
      const keys = Object.keys(answers);
      const right = keys.filter((k) => answers[k] === g.items[k].sign).length;
      status.replaceChildren(
        h('span', null, '已判斷 ', h('b', null, keys.length), ' / ', g.items.length),
        h('span', null, '答對 ', h('b', null, right))
      );
      if (keys.length === g.items.length) {
        const found = g.items.filter((it, i) => it.sign && answers[i] === true).length;
        const score = right >= 11 ? 3 : right >= 9 ? 2 : 1;
        summary.replaceChildren(
          h(
            'div',
            { class: 'result-card' },
            h('p', { class: 'kicker' }, '偵探報告'),
            h('p', { class: 'result-big' }, '找到 ', h('b', null, found), ' / ' + totalSigns + ' 個攻擊徵兆'),
            stars(score),
            App.talk('allan', score === 3 ? 'laugh' : 'point', score === 3 ? '眼力很好！在真實世界裡，關鍵是讓這些告警「有人負責看、看了有人處理」。' : '這些徵兆都留下了紀錄。想一想：如果是你的公司，哪一筆告警會寄到「沒人看的信箱」？'),
            h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: reset }, '重新挑戰'))
          )
        );
        done(score);
      } else summary.replaceChildren();
    }

    function row(it, i) {
      const li = h('li', { class: 'sign-item' });
      const paint = () => {
        const a = answers[i];
        li.replaceChildren(
          h('div', { class: 'sign-meta' }, h('span', { class: 'mono' }, it.t), h('span', { class: 'chip' }, it.src)),
          h('p', { class: 'sign-msg mono' }, it.msg)
        );
        if (a === undefined) {
          li.className = 'sign-item';
          li.appendChild(
            h(
              'div',
              { class: 'sign-actions' },
              h('button', { type: 'button', class: 'btn btn-alert', onclick: () => pick(true) }, '可疑徵兆'),
              h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => pick(false) }, '正常活動')
            )
          );
        } else {
          const ok = a === it.sign;
          li.className = 'sign-item answered ' + (ok ? 'is-right' : 'is-wrong') + (it.sign ? ' is-sign' : ' is-normal');
          li.appendChild(
            h(
              'div',
              { class: 'sign-why' },
              h('p', { class: 'verdict' }, (ok ? '答對了：' : '再想想：') + (it.sign ? '這是攻擊徵兆' : '這是正常活動')),
              h('p', null, it.why),
              it.ctrl ? h('p', { class: 'ctrl' }, 'ISO 27001:2022　' + it.ctrl) : null
            )
          );
        }
      };
      function pick(v) {
        answers[i] = v;
        App.store.set(key, answers);
        paint();
        const ok = v === it.sign;
        if (ok && it.sign) talk.say('arale', 'cheer', '抓到了！這一筆真的有問題！');
        else if (ok) talk.say('arale', 'thumb', '沒錯，這是日常維運，不用緊張。');
        else if (it.sign) talk.say('arale', 'surprise', '啊，這筆其實是警訊！看看 Allan 的說明。');
        else talk.say('arale', 'confused', '這筆其實是正常的……太緊張也會造成告警疲勞喔。');
        update();
      }
      paint();
      return li;
    }

    function reset() {
      answers = {};
      App.store.set(key, answers);
      list.replaceChildren(...g.items.map(row));
      talk.say('arale', 'think', '重新開始！慢慢看時間、來源和內容。');
      update();
    }

    talk.say('arale', 'explain', '這些是資訊處當時收到的紀錄。哪些是駭客留下的腳印？點選「可疑」或「正常」！');
    list.replaceChildren(...g.items.map(row));
    root.append(h('p', { class: 'game-intro' }, g.intro), talk.el, status, list, summary);
    update();
  };

  /* ---------- 攻擊鏈拼圖 ---------- */
  Games.killchain = function (root, data, done) {
    const g = data.games.killchain;
    const talk = speaker();
    const slots = h('ol', { class: 'chain-slots' });
    const pool = h('div', { class: 'chain-pool' });
    const summary = h('div', { class: 'game-summary' });
    let placed = 0;
    let mistakes = 0;

    function build() {
      placed = 0;
      mistakes = 0;
      slots.replaceChildren(...g.steps.map((_, i) => h('li', { class: 'chain-slot empty' }, h('span', { class: 'slot-no' }, i + 1), h('span', { class: 'muted' }, '等待放入'))));
      pool.replaceChildren(
        ...App.shuffle(g.steps.map((st, i) => ({ st, i }))).map(({ st, i }) =>
          h('button', { type: 'button', class: 'chain-card', 'data-i': i, onclick: (e) => pick(e.currentTarget, i) }, h('strong', null, st.stage), h('span', null, st.act))
        )
      );
      summary.replaceChildren();
      talk.say('arale', 'explain', '駭客一步一步走進來。從第 1 步開始，依序點選卡片吧！');
    }

    function pick(btn, i) {
      if (i === placed) {
        const st = g.steps[i];
        const slot = slots.children[i];
        slot.className = 'chain-slot filled';
        slot.replaceChildren(
          h('span', { class: 'slot-no' }, i + 1),
          h('div', { class: 'slot-body' }, h('strong', null, st.stage), h('span', null, st.act), h('span', { class: 'slot-attack mono' }, 'ATT&CK ' + st.attack), h('span', { class: 'slot-defend' }, '防線：' + st.defend))
        );
        btn.remove();
        placed += 1;
        if (placed === g.steps.length) finish();
        else talk.say('arale', 'cheer', '答對！下一步是什麼呢？');
      } else {
        mistakes += 1;
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
        talk.say('arale', 'confused', '還不是這一張。提示：' + g.hints[placed]);
      }
    }

    function finish() {
      const score = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      talk.say('arale', 'laugh', '完成了！七個階段全部排好！');
      summary.replaceChildren(
        h(
          'div',
          { class: 'result-card' },
          h('p', { class: 'kicker' }, '拼圖完成'),
          h('p', { class: 'result-big' }, '排錯 ', h('b', null, mistakes), ' 次'),
          stars(score),
          App.talk('allan', 'point', '攻擊者潛伏了兩週，七個階段都是攔截的機會。對照每一關的「防線」，想想你的組織缺了哪一道。'),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: build }, '再排一次'))
        )
      );
      done(score);
    }

    root.append(h('p', { class: 'game-intro' }, g.intro), talk.el, h('div', { class: 'chain-board' }, slots, pool), summary);
    build();
  };

  /* ---------- 法條連連看 ---------- */
  Games.law = function (root, data, done) {
    const g = data.games.law;
    const talk = speaker();
    const card = h('div', { class: 'law-card' });
    const grid = h('div', { class: 'law-grid' });
    const summary = h('div', { class: 'game-summary' });
    let idx = 0;
    let mistakes = 0;
    let matched = {};

    function build() {
      idx = 0;
      mistakes = 0;
      matched = {};
      summary.replaceChildren();
      grid.replaceChildren(
        ...g.laws.map((law) =>
          h('button', { type: 'button', class: 'law-chip', 'data-id': law.id, onclick: (e) => pick(e.currentTarget, law) }, h('strong', null, law.label), h('span', null, law.name))
        )
      );
      showAct();
    }

    function showAct() {
      const p = g.pairs[idx];
      card.replaceChildren(h('p', { class: 'kicker' }, '行為 ' + (idx + 1) + ' / ' + g.pairs.length), h('p', { class: 'law-act' }, p.act));
      talk.say('arale', 'think', '這個行為對應哪一條？從下面選一個！');
    }

    function pick(btn, law) {
      const p = g.pairs[idx];
      if (!p || matched[law.id]) return;
      if (law.id === p.law) {
        matched[law.id] = true;
        btn.classList.add('matched');
        btn.disabled = true;
        card.replaceChildren(
          h('p', { class: 'kicker' }, '行為 ' + (idx + 1) + ' / ' + g.pairs.length),
          h('p', { class: 'law-act' }, p.act),
          h('p', { class: 'law-answer' }, '→ ' + law.label + '　' + law.name),
          App.talk('allan', 'point', p.why, { autoplay: true }),
          h(
            'div',
            { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn btn-primary', onclick: nextAct }, idx === g.pairs.length - 1 ? '看結果' : '下一題')
          )
        );
        talk.say('arale', 'thumb', '配對成功！');
      } else {
        mistakes += 1;
        btn.classList.remove('shake');
        void btn.offsetWidth;
        btn.classList.add('shake');
        talk.say('arale', 'confused', law.label + '（' + law.name + '）好像不是這一題的重點，再想想看！');
      }
    }

    function nextAct() {
      idx += 1;
      if (idx < g.pairs.length) showAct();
      else finish();
    }

    function finish() {
      const score = mistakes === 0 ? 3 : mistakes <= 3 ? 2 : 1;
      card.replaceChildren(h('p', { class: 'kicker' }, '全部配對完成'), h('p', { class: 'law-act' }, '八個行為、八條規範，你都對上了。'));
      talk.say('arale', 'laugh', '法律關卡通過！');
      summary.replaceChildren(
        h(
          'div',
          { class: 'result-card' },
          h('p', { class: 'result-big' }, '選錯 ', h('b', null, mistakes), ' 次'),
          stars(score),
          App.talk('allan', 'smile', '刑法管的是駭客，個資法與重大訊息規範管的是企業自己。被害人同時也可能是責任人，這是本案法律面最值得思考的地方。'),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: build }, '再玩一次'))
        )
      );
      done(score);
    }

    root.append(h('p', { class: 'game-intro' }, g.intro), talk.el, card, grid, summary);
    build();
  };

  /* ---------- 72 小時決策模擬 ---------- */
  Games.decision = function (root, data, done) {
    const g = data.games.decision;
    const meterEls = {};
    let values = {};
    let round = 0;
    let picks = [];
    const meters = h(
      'div',
      { class: 'meters' },
      g.meters.map((m) => {
        const fill = h('i');
        const num = h('span', { class: 'meter-num mono' });
        meterEls[m.id] = { fill, num };
        return h('div', { class: 'meter meter-' + m.id }, h('span', { class: 'meter-label' }, m.label), h('span', { class: 'meter-track' }, fill), num);
      })
    );
    const stageEl = h('div', { class: 'decision-stage' });

    function paintMeters(delta) {
      g.meters.forEach((m) => {
        const v = values[m.id];
        meterEls[m.id].fill.style.width = v + '%';
        meterEls[m.id].num.textContent = v;
        const d = delta && delta[m.id];
        const wrap = meterEls[m.id].fill.closest('.meter');
        wrap.classList.remove('up', 'down');
        if (d) {
          void wrap.offsetWidth;
          wrap.classList.add(d > 0 ? 'up' : 'down');
        }
      });
    }

    function start() {
      values = {};
      g.meters.forEach((m) => (values[m.id] = m.start));
      round = 0;
      picks = [];
      paintMeters();
      showRound();
    }

    function showRound() {
      const r = g.rounds[round];
      stageEl.replaceChildren(
        h(
          'div',
          { class: 'round-card' },
          h('p', { class: 'kicker' }, '第 ' + (round + 1) + ' 關 / 共 ' + g.rounds.length + ' 關　' + r.title),
          App.talk(r.face[0], r.face[1], r.situation, { flip: r.face[0] === 'arale', autoplay: true }),
          h(
            'div',
            { class: 'options' },
            r.options.map((o, i) => h('button', { type: 'button', class: 'option', onclick: () => choose(i) }, h('span', { class: 'option-key mono' }, String.fromCharCode(65 + i)), h('span', null, o.text)))
          )
        )
      );
    }

    function choose(i) {
      const r = g.rounds[round];
      const o = r.options[i];
      picks.push(i);
      const delta = o.fx;
      Object.entries(delta).forEach(([k, d]) => (values[k] = Math.max(0, Math.min(100, values[k] + d))));
      paintMeters(delta);
      const chips = Object.entries(delta)
        .filter(([, d]) => d)
        .map(([k, d]) => h('span', { class: 'delta ' + (d > 0 ? 'pos' : 'neg') }, g.meters.find((m) => m.id === k).label + ' ' + (d > 0 ? '+' : '') + d));
      stageEl.replaceChildren(
        h(
          'div',
          { class: 'round-card result' },
          h('p', { class: 'kicker' }, '你的選擇：' + String.fromCharCode(65 + i) + '　' + o.text),
          h('div', { class: 'deltas' }, chips),
          h('p', { class: 'outcome' }, o.result),
          App.talk('allan', o.best ? 'laugh' : 'think', o.allan, { autoplay: true }),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-primary', onclick: nextRound }, round === g.rounds.length - 1 ? '看最終結果' : '下一關'))
        )
      );
    }

    function nextRound() {
      round += 1;
      if (round < g.rounds.length) showRound();
      else finish();
    }

    function finish() {
      const bestCount = picks.filter((p, i) => g.rounds[i].options[p].best).length;
      const score = bestCount === g.rounds.length ? 3 : bestCount >= 2 ? 2 : 1;
      let profile;
      if (values.trust >= 60 && values.legal >= 60) profile = ['坦誠合規型決策者', '你選擇正面面對：不付贖金、直接通知、即時更正揭露。短期痛，長期換回信任。'];
      else if (values.trust < 40 && values.legal < 40) profile = ['風險累積型決策者', '你的選擇在短期內避開了衝擊，但信任與法遵風險持續累積，下一次危機會更難處理。'];
      else profile = ['務實權衡型決策者', '你在成本、營運與信任之間做了取捨。回頭看看哪一關的選擇，讓指標掉得最多。'];
      stageEl.replaceChildren(
        h(
          'div',
          { class: 'round-card final' },
          h('p', { class: 'kicker' }, '董事會結束'),
          h('p', { class: 'result-big' }, profile[0]),
          stars(score),
          h('p', null, profile[1]),
          h(
            'ol',
            { class: 'path' },
            g.rounds.map((r, i) => {
              const o = r.options[picks[i]];
              const best = r.options.find((x) => x.best);
              return h('li', { class: o.best ? 'is-best' : '' }, h('strong', null, r.title + '：'), o.text, o.best ? h('span', { class: 'tag-ok' }, '與 Allan 建議相同') : h('span', { class: 'tag-alt' }, 'Allan 建議：' + best.text));
            })
          ),
          App.talk('allan', 'smile', '真實的決策沒有標準答案，但有比較好的「決策過程」：先保護受害者、遵守揭露義務、留下紀錄，再談成本。'),
          h('div', { class: 'btn-row' }, h('button', { type: 'button', class: 'btn btn-ghost', onclick: start }, '重新模擬'))
        )
      );
      done(score);
    }

    root.append(h('p', { class: 'game-intro' }, g.intro), meters, stageEl);
    start();
  };
})();
