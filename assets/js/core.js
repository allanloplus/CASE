/* 共用工具：元素建立、文字格式、儲存、角色、個案載入、路由 */
(function () {
  'use strict';

  const App = (window.App = {});

  App.reduceMotion = window.matchMedia && window.matchMedia('(prefers-reduced-motion: reduce)').matches;

  /* ---------- 元素建立 ---------- */
  function h(tag, attrs, ...children) {
    const el = document.createElement(tag);
    if (attrs) {
      for (const [k, v] of Object.entries(attrs)) {
        if (v == null || v === false) continue;
        if (k === 'class') el.className = v;
        else if (k === 'html') el.innerHTML = v;
        else if (k === 'text') el.textContent = v;
        else if (k.startsWith('on') && typeof v === 'function') el.addEventListener(k.slice(2), v);
        else if (k === 'style' && typeof v === 'object') Object.assign(el.style, v);
        else if (v === true) el.setAttribute(k, '');
        else el.setAttribute(k, v);
      }
    }
    appendAll(el, children);
    return el;
  }
  function appendAll(el, children) {
    for (const c of children) {
      if (c == null || c === false) continue;
      if (Array.isArray(c)) appendAll(el, c);
      else el.appendChild(typeof c === 'string' || typeof c === 'number' ? document.createTextNode(String(c)) : c);
    }
  }
  App.h = h;

  function esc(s) {
    return String(s).replace(/&/g, '&amp;').replace(/</g, '&lt;').replace(/>/g, '&gt;').replace(/"/g, '&quot;');
  }
  /* **粗體** → <strong> */
  App.fmt = function (s) {
    return esc(s).replace(/\*\*(.+?)\*\*/g, '<strong>$1</strong>');
  };
  App.esc = esc;
  App.plain = function (s) {
    return String(s).replace(/\*\*(.+?)\*\*/g, '$1');
  };

  /* ---------- 儲存（失敗時靜默，頁面照常運作） ---------- */
  const PREFIX = 'case-lab:';
  App.store = {
    get(key, fallback) {
      try {
        const v = window.localStorage.getItem(PREFIX + key);
        return v == null ? fallback : JSON.parse(v);
      } catch (e) {
        return fallback;
      }
    },
    set(key, value) {
      try {
        window.localStorage.setItem(PREFIX + key, JSON.stringify(value));
      } catch (e) {
        /* 私密視窗或封鎖儲存時略過 */
      }
    },
    remove(key) {
      try {
        window.localStorage.removeItem(PREFIX + key);
      } catch (e) {
        /* 略過 */
      }
    }
  };

  /* ---------- 角色 ---------- */
  App.cast = {
    allan: {
      name: 'Allan 顧問',
      dir: 'assets/img/allan/',
      faces: { smile: '微笑', laugh: '大笑', think: '思考', trouble: '困擾', surprise: '驚訝', point: '重點', wink: '眨眼', shock: '震驚' },
      poses: { full: '全身', stand: '站姿' },
      fallback: 'smile'
    },
    arale: {
      name: '阿拉蕾',
      dir: 'assets/img/arale/',
      faces: { laugh: '開心', think: '思考', surprise: '驚訝', confused: '疑惑', explain: '說明', cry: '難過', thumb: '按讚', cheer: '加油' },
      poses: { full: '全身', hello: '揮手', tablet: '拿平板', present: '介紹' },
      fallback: 'explain'
    }
  };
  App.charSrc = function (who, face) {
    const c = App.cast[who];
    const name = c.faces[face] || c.poses[face] ? face : c.fallback;
    return c.dir + name + '.webp';
  };
  App.charImg = function (who, face, cls) {
    const c = App.cast[who];
    const label = c.faces[face] || c.poses[face] || '';
    return h('img', {
      class: 'char-img ' + (cls || ''),
      src: App.charSrc(who, face),
      alt: c.name + (label ? '（' + label + '）' : ''),
      loading: 'lazy',
      decoding: 'async'
    });
  };
  App.preloadFaces = function () {
    for (const [who, c] of Object.entries(App.cast)) {
      for (const face of Object.keys(c.faces)) {
        const img = new Image();
        img.src = App.charSrc(who, face);
      }
    }
  };

  /* 角色說話列：頭像＋對話泡泡 */
  App.talk = function (who, face, text, opts) {
    opts = opts || {};
    const c = App.cast[who];
    return h(
      'div',
      { class: 'talk talk-' + who + (opts.flip ? ' talk-flip' : '') + (opts.cls ? ' ' + opts.cls : '') },
      h('div', { class: 'talk-face' }, App.charImg(who, face)),
      h('div', { class: 'talk-bubble' }, h('span', { class: 'talk-name' }, c.name), h('p', { html: App.fmt(text) }))
    );
  };

  /* ---------- 個案載入（依需要動態載入 cases/<id>/case.js） ---------- */
  window.CASE_LIBRARY = window.CASE_LIBRARY || {};
  const loading = {};
  App.loadCase = function (id) {
    if (window.CASE_LIBRARY[id]) return Promise.resolve(window.CASE_LIBRARY[id]);
    if (!loading[id]) {
      loading[id] = new Promise((resolve, reject) => {
        const s = document.createElement('script');
        s.src = 'cases/' + id + '/case.js';
        s.onload = () => (window.CASE_LIBRARY[id] ? resolve(window.CASE_LIBRARY[id]) : reject(new Error('missing')));
        s.onerror = () => {
          delete loading[id];
          reject(new Error('load failed'));
        };
        document.head.appendChild(s);
      });
    }
    return loading[id];
  };
  App.registryEntry = function (id) {
    return (window.CASE_REGISTRY || []).find((c) => c.id === id);
  };

  /* ---------- 進度 ---------- */
  App.progress = {
    get(caseId) {
      return App.store.get('progress:' + caseId, {});
    },
    mark(caseId, key, value) {
      const p = App.progress.get(caseId);
      p[key] = value === undefined ? true : value;
      App.store.set('progress:' + caseId, p);
      return p;
    }
  };

  /* ---------- 路由：#S111001-read 這類單一字詞的錨點 ---------- */
  const VIEWS = ['read', 'discuss', 'signs', 'killchain', 'law', 'questions', 'decision', 'final', 'text', 'teach'];
  App.VIEWS = VIEWS;
  App.parseRoute = function (hash) {
    const t = (hash || '').replace(/^#/, '');
    if (!t) return { page: 'home', key: '' };
    const m = t.match(/^(S\d{6})(?:-([a-z]+))?$/);
    if (!m) return null;
    if (m[2] && VIEWS.indexOf(m[2]) < 0) return null;
    return { page: m[2] || 'overview', caseId: m[1], key: t };
  };
  App.go = function (token) {
    if (location.hash.replace(/^#/, '') === token) App.render(true);
    else location.hash = token;
  };

  /* 複製文字；剪貼簿被拒時改為選取文字讓使用者自行複製 */
  App.copyText = function (text, fallbackEl) {
    const done = () => true;
    const fail = () => {
      if (fallbackEl) {
        fallbackEl.hidden = false;
        fallbackEl.value = text;
        fallbackEl.focus();
        fallbackEl.select();
      }
      return false;
    };
    try {
      if (navigator.clipboard && navigator.clipboard.writeText) {
        return navigator.clipboard.writeText(text).then(done, fail);
      }
    } catch (e) {
      /* 改用備援 */
    }
    return Promise.resolve(fail());
  };

  App.shuffle = function (arr) {
    const a = arr.slice();
    for (let i = a.length - 1; i > 0; i--) {
      const j = Math.floor(Math.random() * (i + 1));
      [a[i], a[j]] = [a[j], a[i]];
    }
    return a;
  };

  App.toast = function (msg) {
    let t = document.querySelector('.toast');
    if (!t) {
      t = h('div', { class: 'toast', role: 'status', 'aria-live': 'polite' });
      document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(App._toastTimer);
    App._toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
  };
})();
