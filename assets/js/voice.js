/* 語音：依「角色|台詞文字」找出 cases/<案號>/voice/ 的語音檔並播放（由 tools/build_voice.py 產生） */
(function () {
  'use strict';
  const { h } = App;
  const Voice = (App.Voice = {});

  /* 共用一個 audio 元素：手機瀏覽器解鎖一次後，後續台詞都能接著播 */
  const el = new Audio();
  el.preload = 'auto';
  let token = 0;
  let cbs = null;
  const listeners = new Set();

  el.addEventListener('loadedmetadata', () => cbs && cbs.onDuration && cbs.onDuration(el.duration));
  el.addEventListener('ended', () => {
    const c = cbs;
    cbs = null;
    if (c && c.onEnd) c.onEnd();
  });
  el.addEventListener('error', () => {
    if (!cbs) return;
    const c = cbs;
    cbs = null;
    if (c.onError) c.onError();
  });

  Voice.caseId = null;

  Voice.map = function (caseId) {
    return (window.CASE_VOICE || {})[caseId || Voice.caseId] || null;
  };
  Voice.available = function (caseId) {
    return !!Voice.map(caseId);
  };
  Voice.url = function (who, text, caseId) {
    const id = caseId || Voice.caseId;
    const m = Voice.map(id);
    const file = m && m[who + '|' + text];
    return file ? 'cases/' + id + '/voice/' + file : null;
  };
  Voice.on = function () {
    return App.store.get('voice', true);
  };
  Voice.subscribe = function (fn) {
    listeners.add(fn);
    return () => listeners.delete(fn);
  };
  Voice.set = function (on) {
    App.store.set('voice', on);
    if (!on) Voice.stop();
    listeners.forEach((fn) => fn(on));
  };

  Voice.play = function (url, callbacks) {
    Voice.stop();
    cbs = callbacks || {};
    const my = ++token;
    el.src = url;
    const p = el.play();
    if (p && p.catch) {
      p.catch(() => {
        if (my !== token || !cbs) return;
        const c = cbs;
        cbs = null;
        if (c.onBlocked) c.onBlocked();
      });
    }
  };
  Voice.stop = function () {
    token += 1;
    const c = cbs;
    cbs = null;
    if (!el.paused) el.pause();
    if (c && c.onStop) c.onStop();
  };

  /* 播放一個說話泡泡（App.talk 產生的元素），播放中加上 talking 狀態 */
  Voice.sayTalk = function (talkEl) {
    const url = talkEl && talkEl.voiceUrl;
    if (!url) return false;
    const done = () => talkEl.classList.remove('talking');
    talkEl.classList.add('talking');
    Voice.play(url, { onEnd: done, onStop: done, onError: done, onBlocked: done });
    return true;
  };

  const ICON =
    '<svg viewBox="0 0 24 24" aria-hidden="true" focusable="false"><path d="M4 9v6h4l5 4V5L8 9H4z" fill="currentColor"/>' +
    '<path class="wave w1" d="M16 9.5a3.5 3.5 0 0 1 0 5" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/>' +
    '<path class="wave w2" d="M18.5 7a7 7 0 0 1 0 10" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round"/></svg>';
  Voice.ICON = ICON;

  /* 語音開關按鈕 */
  Voice.toggleButton = function () {
    const btn = h('button', { type: 'button', class: 'btn btn-ghost voice-toggle', onclick: () => Voice.set(!Voice.on()) });
    const paint = (on) => {
      btn.setAttribute('aria-pressed', String(on));
      btn.innerHTML = ICON + '<span>' + (on ? '語音 開' : '語音 關') + '</span>';
      btn.classList.toggle('is-off', !on);
    };
    paint(Voice.on());
    listeners.add(paint);
    App.onCleanup(() => listeners.delete(paint));
    return btn;
  };

  /* 重播按鈕（放在說話泡泡上） */
  Voice.replayButton = function (onclick) {
    return h('button', { type: 'button', class: 'voice-replay', 'aria-label': '播放語音', title: '播放語音', html: ICON, onclick: (e) => {
      e.stopPropagation();
      onclick();
    } });
  };
})();
