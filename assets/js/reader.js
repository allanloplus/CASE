/* 動畫閱讀：場景舞台＋案情旁白＋角色對話 */
(function () {
  'use strict';
  const { h, fmt } = App;

  function buildDecor(bg) {
    const d = h('div', { class: 'backdrop', 'aria-hidden': 'true' });
    if (bg === 'night' || bg === 'city') {
      const sky = h('div', { class: 'skyline' });
      const heights = [38, 62, 48, 80, 55, 92, 44, 70, 58, 86, 40, 66, 52, 74];
      heights.forEach((ht, i) => {
        const b = h('span', { class: 'bldg', style: { height: ht + '%', animationDelay: (i % 5) * 0.7 + 's' } });
        sky.appendChild(b);
      });
      d.appendChild(sky);
      if (bg === 'night') d.appendChild(h('span', { class: 'moon' }));
    } else if (bg === 'server') {
      const racks = h('div', { class: 'racks' });
      for (let i = 0; i < 7; i++) {
        const r = h('span', { class: 'rack' });
        for (let j = 0; j < 6; j++) r.appendChild(h('i', { style: { animationDelay: ((i * 3 + j * 7) % 11) * 0.23 + 's' } }));
        racks.appendChild(r);
      }
      d.appendChild(racks);
    } else if (bg === 'alert') {
      d.appendChild(h('span', { class: 'alarm' }));
    } else if (bg === 'darkweb') {
      d.appendChild(h('span', { class: 'scan' }));
    } else if (bg === 'office' || bg === 'meeting') {
      d.appendChild(h('span', { class: 'windows' }));
    }
    return d;
  }

  App.Reader = function (root, data) {
    const id = data.meta.id;
    const flat = [];
    data.chapters.forEach((ch, ci) => ch.scenes.forEach((sc, si) => flat.push({ ch, ci, sc, si })));
    const totalSteps = flat.reduce((a, f) => a + f.sc.lines.length, 0);

    const saved = App.store.get('reader:' + id, null);
    let s = saved && saved.s < flat.length ? saved.s : 0;
    let l = saved && saved.s < flat.length ? Math.min(saved.l, flat[s].sc.lines.length - 1) : 0;
    let typing = null;
    let auto = false;
    let autoTimer = null;
    let renderedScene = -1;
    let finished = false;

    /* ---- DOM ---- */
    const kicker = h('p', { class: 'kicker' });
    const title = h('h1', { class: 'reader-title' });
    const dots = h('ol', { class: 'chapter-dots', 'aria-label': '章節' });
    data.chapters.forEach((ch, ci) => {
      dots.appendChild(
        h('li', null, h('button', { type: 'button', title: ch.kicker + '　' + ch.title, onclick: () => jumpChapter(ci) }, h('span', { class: 'dot-k' }, ch.kicker), h('span', { class: 'dot-t' }, ch.title)))
      );
    });

    const stage = h('div', { class: 'stage' });
    const backdropHolder = h('div', { class: 'backdrop-holder' });
    const panels = h('div', { class: 'stage-panels' });
    const actorAllan = h('div', { class: 'actor actor-allan' }, App.charImg('allan', 'smile'));
    const actorArale = h('div', { class: 'actor actor-arale' }, App.charImg('arale', 'explain'));
    const bubbleName = h('span', { class: 'bubble-name' });
    const bubbleText = h('p', { class: 'bubble-text' });
    const bubble = h('button', { type: 'button', class: 'bubble', 'aria-live': 'polite', onclick: () => next() }, bubbleName, bubbleText, h('span', { class: 'bubble-more', 'aria-hidden': 'true' }, '▸'));
    const cast = h('div', { class: 'stage-cast' }, actorAllan, bubble, actorArale);
    stage.append(backdropHolder, panels, cast);

    const btnPrev = h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => prev() }, '上一步');
    const btnAuto = h('button', { type: 'button', class: 'btn btn-ghost', 'aria-pressed': 'false', onclick: () => toggleAuto() }, '自動播放');
    const btnNext = h('button', { type: 'button', class: 'btn btn-primary', onclick: () => next() }, '下一步');
    const counter = h('span', { class: 'counter mono' });
    const bar = h('span', { class: 'progress-bar' }, h('i'));
    const controls = h('div', { class: 'reader-controls' }, btnPrev, h('div', { class: 'reader-meter' }, bar, counter), btnAuto, btnNext);

    const head = h('div', { class: 'reader-head' }, h('div', null, kicker, title), dots);
    root.append(h('section', { class: 'reader' }, head, stage, controls, h('p', { class: 'reader-tip muted' }, '提示：點對話框或按「下一步」前進；鍵盤可用 ← → 鍵。')));

    function stepIndex() {
      let n = 0;
      for (let i = 0; i < s; i++) n += flat[i].sc.lines.length;
      return n + l + 1;
    }

    function save() {
      App.store.set('reader:' + id, { s, l });
    }

    function renderScene() {
      const f = flat[s];
      kicker.textContent = f.ch.kicker;
      title.textContent = f.ch.title;
      [...dots.querySelectorAll('button')].forEach((b, i) => {
        b.classList.toggle('done', i < f.ci);
        if (i === f.ci) b.setAttribute('aria-current', 'step');
        else b.removeAttribute('aria-current');
      });
      stage.dataset.bg = f.sc.bg;
      backdropHolder.replaceChildren(buildDecor(f.sc.bg));

      const narr = h('article', { class: 'narration' });
      f.sc.narration.forEach((p, i) => {
        const el = App.renderParagraph(p);
        el.style.animationDelay = i * 0.35 + 's';
        narr.appendChild(el);
      });
      const kids = [narr];
      if (f.sc.exhibit) {
        const ex = App.renderExhibit(data, f.sc.exhibit, { cls: 'stage-exhibit' });
        if (ex) kids.push(ex);
      }
      panels.classList.toggle('has-exhibit', kids.length > 1);
      panels.replaceChildren(...kids);
      renderedScene = s;
    }

    function setActor(el, who, face, speaking) {
      const img = el.querySelector('img');
      const src = App.charSrc(who, face);
      if (img.getAttribute('src') !== src) {
        img.setAttribute('src', src);
        img.alt = App.cast[who].name + '（' + (App.cast[who].faces[face] || '') + '）';
        if (!App.reduceMotion) {
          el.classList.remove('pop');
          void el.offsetWidth;
          el.classList.add('pop');
        }
      }
      el.classList.toggle('speaking', speaking);
    }

    function showLine() {
      if (renderedScene !== s) renderScene();
      const [who, face, text] = flat[s].sc.lines[l];
      setActor(actorAllan, 'allan', who === 'allan' ? face : actorAllan.dataset.face || 'smile', who === 'allan');
      setActor(actorArale, 'arale', who === 'arale' ? face : actorArale.dataset.face || 'explain', who === 'arale');
      if (who === 'allan') actorAllan.dataset.face = face;
      else actorArale.dataset.face = face;
      bubble.classList.toggle('from-allan', who === 'allan');
      bubble.classList.toggle('from-arale', who === 'arale');
      bubbleName.textContent = App.cast[who].name;
      type(text);

      const n = stepIndex();
      counter.textContent = n + ' / ' + totalSteps;
      bar.firstChild.style.width = (n / totalSteps) * 100 + '%';
      btnPrev.disabled = s === 0 && l === 0;
      btnNext.textContent = s === flat.length - 1 && l === flat[s].sc.lines.length - 1 ? '完成閱讀' : '下一步';
      save();
    }

    function type(text) {
      stopTyping();
      if (App.reduceMotion) {
        bubbleText.innerHTML = fmt(text);
        scheduleAuto(text);
        return;
      }
      const chars = Array.from(App.plain(text));
      let i = 0;
      bubbleText.textContent = '';
      bubble.classList.add('typing');
      typing = {
        text,
        timer: setInterval(() => {
          i += 1;
          bubbleText.textContent = chars.slice(0, i).join('');
          if (i >= chars.length) finishTyping();
        }, 34)
      };
    }
    function finishTyping() {
      if (!typing) return;
      const text = typing.text;
      clearInterval(typing.timer);
      typing = null;
      bubbleText.innerHTML = fmt(text);
      bubble.classList.remove('typing');
      scheduleAuto(text);
    }
    function stopTyping() {
      if (typing) clearInterval(typing.timer);
      typing = null;
      bubble.classList.remove('typing');
    }

    function scheduleAuto(text) {
      clearTimeout(autoTimer);
      if (!auto) return;
      let wait = 1400 + Array.from(text).length * 70;
      if (l === 0) {
        const chars = flat[s].sc.narration.reduce((a, p) => a + (typeof p === 'string' ? p.length : p.list.join('').length), 0);
        wait += chars * 45;
      }
      autoTimer = setTimeout(() => next(), wait);
    }

    function toggleAuto() {
      auto = !auto;
      btnAuto.setAttribute('aria-pressed', String(auto));
      btnAuto.textContent = auto ? '暫停播放' : '自動播放';
      if (auto && !typing) scheduleAuto(flat[s].sc.lines[l][2]);
      if (!auto) clearTimeout(autoTimer);
    }

    function next() {
      if (finished) {
        App.go(id + '-discuss');
        return;
      }
      if (typing) {
        finishTyping();
        return;
      }
      clearTimeout(autoTimer);
      if (l < flat[s].sc.lines.length - 1) {
        l += 1;
      } else if (s < flat.length - 1) {
        s += 1;
        l = 0;
        if (stage.getBoundingClientRect().top < 0) stage.scrollIntoView({ block: 'start', behavior: App.reduceMotion ? 'auto' : 'smooth' });
      } else {
        finish();
        return;
      }
      showLine();
    }

    function prev() {
      if (finished) {
        restart(flat.length - 1);
        return;
      }
      stopTyping();
      clearTimeout(autoTimer);
      if (l > 0) l -= 1;
      else if (s > 0) {
        s -= 1;
        l = flat[s].sc.lines.length - 1;
      } else return;
      showLine();
    }

    function jumpChapter(ci) {
      finished = false;
      stopTyping();
      clearTimeout(autoTimer);
      s = flat.findIndex((f) => f.ci === ci);
      l = 0;
      showLine();
    }

    function restart(scene) {
      finished = false;
      s = scene;
      l = scene ? flat[scene].sc.lines.length - 1 : 0;
      renderedScene = -1;
      showLine();
    }

    function finish() {
      finished = true;
      if (auto) toggleAuto();
      App.progress.mark(id, 'read');
      App.store.set('reader:' + id, { s: 0, l: 0 });
      stage.dataset.bg = 'office';
      backdropHolder.replaceChildren(buildDecor('office'));
      panels.classList.remove('has-exhibit');
      panels.replaceChildren(
        h(
          'article',
          { class: 'narration finale' },
          h('p', { class: 'kicker' }, '閱讀完成'),
          h('h2', null, '案情都掌握了，接下來換你做決定'),
          h('p', null, '你已經讀完《' + data.meta.title + '》。' + App.uiText(data, 'readerOutro', '到討論區完成六個任務：找出徵兆、重建攻擊鏈、配對法條、四大面向討論，最後在 72 小時決策模擬中扮演總經理。')),
          h(
            'div',
            { class: 'btn-row' },
            h('button', { type: 'button', class: 'btn btn-primary', onclick: () => App.go(id + '-discuss') }, '前往討論區'),
            h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => App.go(id + '-text') }, '看文本版'),
            h('button', { type: 'button', class: 'btn btn-ghost', onclick: () => restart(0) }, '從頭再看一次')
          )
        )
      );
      renderedScene = -1;
      setActor(actorAllan, 'allan', 'laugh', true);
      setActor(actorArale, 'arale', 'thumb', true);
      bubble.classList.remove('from-allan');
      bubble.classList.add('from-arale');
      bubbleName.textContent = '阿拉蕾';
      bubbleText.textContent = '辛苦了！討論區見，阿拉蕾幫你準備好遊戲了！';
      counter.textContent = totalSteps + ' / ' + totalSteps;
      bar.firstChild.style.width = '100%';
      btnNext.textContent = '前往討論區';
      btnPrev.disabled = false;
    }

    function onKey(e) {
      const tag = (e.target.tagName || '').toLowerCase();
      if (tag === 'input' || tag === 'textarea' || tag === 'select') return;
      if (e.key === 'ArrowRight') {
        e.preventDefault();
        next();
      } else if (e.key === 'ArrowLeft') {
        e.preventDefault();
        prev();
      }
    }
    document.addEventListener('keydown', onKey);
    App.onCleanup(() => {
      document.removeEventListener('keydown', onKey);
      stopTyping();
      clearTimeout(autoTimer);
    });

    App.preloadFaces();
    showLine();
  };
})();
