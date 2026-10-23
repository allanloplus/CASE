/* 啟動與路由 */
(function () {
  'use strict';
  const { h } = App;
  const app = document.getElementById('app');
  const nav = document.getElementById('topnav');

  let cleanups = [];
  App.onCleanup = (fn) => cleanups.push(fn);
  function runCleanups() {
    cleanups.forEach((fn) => {
      try {
        fn();
      } catch (e) {
        /* 略過 */
      }
    });
    cleanups = [];
  }

  const CASE_TABS = [
    ['', '總覽'],
    ['read', '動畫閱讀'],
    ['discuss', '討論互動'],
    ['text', '文本版'],
    ['teach', '教學手冊']
  ];
  const MISSION_VIEWS = ['signs', 'killchain', 'law', 'questions', 'decision', 'final'];

  function renderNav(route) {
    if (!route || route.page === 'home') {
      nav.replaceChildren(h('a', { href: '#library-list', class: 'navlink', onclick: (e) => {
        e.preventDefault();
        const el = document.getElementById('library-list');
        if (el) el.scrollIntoView({ behavior: App.reduceMotion ? 'auto' : 'smooth' });
      } }, '個案庫'));
      return;
    }
    const active = route.page === 'overview' ? '' : MISSION_VIEWS.indexOf(route.page) >= 0 ? 'discuss' : route.page;
    nav.replaceChildren(
      h('span', { class: 'nav-case mono' }, route.caseId),
      ...CASE_TABS.map(([key, label]) =>
        h('button', { type: 'button', class: 'navlink', 'aria-current': key === active ? 'page' : null, onclick: () => App.go(route.caseId + (key ? '-' + key : '')) }, label)
      )
    );
  }

  let lastKey = null;
  let seq = 0;
  App.render = function (force) {
    let route = App.parseRoute(location.hash);
    if (!route) {
      if (lastKey !== null) return;
      route = { page: 'home', key: '' };
    }
    if (!force && route.key === lastKey) return;
    lastKey = route.key;
    const mySeq = ++seq;
    runCleanups();
    renderNav(route);
    app.dataset.page = route.page;
    window.scrollTo(0, 0);

    if (route.page === 'home') {
      document.title = 'CASE 資安個案研究室';
      app.replaceChildren();
      App.Pages.home(app);
      return;
    }
    const entry = App.registryEntry(route.caseId);
    if (!entry || entry.status !== 'ready') {
      app.replaceChildren();
      App.Pages.missing(app, route.caseId);
      return;
    }
    app.replaceChildren(h('p', { class: 'boot' }, '載入個案中…'));
    App.loadCase(route.caseId).then(
      (data) => {
        if (mySeq !== seq) return;
        app.replaceChildren();
        if (route.page === 'overview') App.Pages.overview(app, data);
        else if (route.page === 'read') App.Reader(app, data);
        else if (route.page === 'discuss') App.DiscussHub(app, data);
        else if (route.page === 'text') App.Pages.text(app, data);
        else if (route.page === 'teach') App.Pages.teach(app, data);
        else App.MissionPage(app, data, route.page);
        document.title = data.meta.id + '｜' + data.meta.title + '｜CASE 資安個案研究室';
      },
      () => {
        if (mySeq !== seq) return;
        app.replaceChildren();
        App.Pages.missing(app, route.caseId);
      }
    );
  };

  window.addEventListener('hashchange', () => App.render());
  document.querySelector('.brand').addEventListener('click', (e) => {
    e.preventDefault();
    App.go('');
  });
  App.render(true);
})();
