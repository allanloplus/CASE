/* 附件繪製：動畫閱讀與文本版共用 */
(function () {
  'use strict';
  const { h, fmt } = App;

  const renderers = {
    org(ex) {
      const [parent, child] = ex.companies;
      return h(
        'div',
        { class: 'ex-org' },
        h(
          'div',
          { class: 'org-row' },
          company(parent),
          h('div', { class: 'org-link', 'aria-hidden': 'true' }, h('span', null, '持股 62%'), h('i')),
          company(child)
        ),
        h('div', { class: 'org-down', 'aria-hidden': 'true' }, h('i'), h('i')),
        h(
          'div',
          { class: 'org-shared' },
          h('strong', null, ex.shared.name),
          h('span', { class: 'muted' }, ex.shared.detail),
          h('ul', { class: 'chips' }, ex.shared.services.map((s) => h('li', null, s)))
        ),
        h(
          'dl',
          { class: 'kv' },
          ex.stats.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])
        )
      );
      function company(c) {
        return h(
          'div',
          { class: 'org-co' },
          h('span', { class: 'pill pill-' + (c.badge === '上市' ? 'navy' : 'teal') }, c.badge),
          h('strong', null, c.name),
          h('span', { class: 'muted' }, c.detail)
        );
      }
    },

    logs(ex, data) {
      const items = data.games[ex.useGame].items;
      return h(
        'div',
        { class: 'ex-logs' },
        h(
          'div',
          { class: 'scroll-x' },
          h(
            'table',
            { class: 'log-table' },
            h('thead', null, h('tr', null, h('th', null, '時間'), h('th', null, '來源'), h('th', null, '紀錄'))),
            h(
              'tbody',
              null,
              items.map((it) => h('tr', null, h('td', { class: 'mono' }, it.t), h('td', null, it.src), h('td', null, it.msg)))
            )
          )
        ),
        ex.note ? h('p', { class: 'ex-note' }, ex.note) : null
      );
    },

    ransom() {
      return h(
        'div',
        { class: 'ex-ransom', role: 'img', 'aria-label': '勒索訊息示意畫面' },
        h('p', { class: 'ransom-brand' }, 'LockBit 2.0'),
        h('p', { class: 'ransom-title' }, 'Your files are stolen and encrypted'),
        h('p', null, '你的檔案已被加密，資料已被竊取。'),
        h('p', null, '若不在期限內聯繫並支付贖金，資料將公開在我們的網站上。'),
        h('p', { class: 'ransom-files mono' }, 'ERP_DB.mdf.lockbit\n青峰A7_施工圖.dwg.lockbit\n客戶合約_2021Q3.pdf.lockbit'),
        h('p', { class: 'ransom-tag' }, '教學示意畫面')
      );
    },

    network() {
      const node = (x, y, w, title, sub, kind) =>
        `<g class="net-node ${kind || ''}"><rect x="${x}" y="${y}" width="${w}" height="54" rx="8"/>` +
        `<text x="${x + w / 2}" y="${y + 23}" class="t1">${title}</text>` +
        `<text x="${x + w / 2}" y="${y + 41}" class="t2">${sub}</text></g>`;
      const edge = (d, kind, label, lx, ly) =>
        `<path d="${d}" class="net-edge ${kind}" marker-end="url(#arrow-${kind})"/>` +
        (label ? `<text x="${lx}" y="${ly}" class="net-label ${kind}">${label}</text>` : '');
      const svg =
        `<svg viewBox="0 0 720 410" role="img" aria-labelledby="net-title net-desc">` +
        `<title id="net-title">攻擊路徑示意</title>` +
        `<desc id="net-desc">攻擊者從境外以廠商帳號登入 VPN，經會議室電腦取得網域管理員權限，從檔案伺服器外傳資料，再以 GPO 加密兩家公司的電腦與線上備份；與網域隔離的不可變更備份與異地磁帶倖存。</desc>` +
        `<defs>` +
        ['attack', 'exfil'].map((k) => `<marker id="arrow-${k}" viewBox="0 0 10 10" refX="9" refY="5" markerWidth="7" markerHeight="7" orient="auto-start-reverse"><path d="M0,0 L10,5 L0,10 z" class="arrow-${k}"/></marker>`).join('') +
        `</defs>` +
        `<rect x="196" y="12" width="516" height="388" rx="14" class="net-zone"/>` +
        `<text x="210" y="392" class="net-zone-label">集團內部網路（兩家公司共用同一個 AD 網域）</text>` +
        node(10, 36, 150, '境外攻擊者', '荷蘭 IP', 'bad') +
        node(214, 36, 150, 'SSL VPN', 'vpn_vendor02', 'hit') +
        node(404, 36, 150, '會議室電腦', 'MTG-PC07', 'hit') +
        node(404, 160, 150, '網域控制站', '新增 svc_backup2', 'hit') +
        node(214, 160, 150, '檔案伺服器', 'FS01', 'hit') +
        node(10, 160, 150, '國外雲端儲存', '外傳約 140GB', 'bad') +
        node(574, 112, 128, '築遠建設', '電腦與伺服器', 'hit') +
        node(574, 212, 128, '築遠營造', '電腦與伺服器', 'hit') +
        node(404, 300, 150, '線上備份 NAS', '加入網域・被加密', 'hit') +
        node(10, 262, 150, '不可變更備份', '與網域隔離・倖存', 'safe') +
        node(10, 330, 150, '異地磁帶', '10/8 送出・倖存', 'safe') +
        edge('M160,63 L210,63', 'attack', '① 登入', 165, 54) +
        edge('M364,63 L400,63', 'attack', '②', 376, 54) +
        edge('M479,90 L479,156', 'attack', '', 0, 0) +
        `<text x="471" y="128" class="net-label attack end">③ 竊取帳密・提權</text>` +
        edge('M404,187 L368,187', 'attack', '', 0, 0) +
        edge('M214,187 L164,187', 'exfil', '④ 外傳', 168, 178) +
        edge('M554,176 L570,146', 'attack', '', 0, 0) +
        edge('M554,198 L570,232', 'attack', '⑤ GPO', 578, 194) +
        edge('M479,214 L479,296', 'attack', '⑥ 加密', 487, 262) +
        `</svg>`;
      return h('div', { class: 'ex-network scroll-x', html: svg });
    },

    notice(ex) {
      return h(
        'div',
        { class: 'ex-notice' },
        h(
          'div',
          { class: 'notice-head' },
          h('span', null, '重大訊息'),
          h('span', { class: 'mono' }, ex.time)
        ),
        h('p', { class: 'notice-co' }, ex.company),
        h('p', { class: 'notice-subject' }, h('span', { class: 'muted' }, '主旨　'), ex.subject),
        h(
          'ol',
          { class: 'notice-items' },
          ex.items.map(([k, v]) => h('li', null, h('span', { class: 'notice-k' }, k + '：'), h('span', null, v)))
        )
      );
    },

    leak(ex) {
      const cd = h('span', { class: 'leak-count mono' });
      const startTotal = ((ex.countdown.d * 24 + ex.countdown.h) * 60 + ex.countdown.m) * 60;
      const started = Date.now();
      const tick = () => {
        const left = Math.max(0, startTotal - Math.floor((Date.now() - started) / 1000));
        const d = Math.floor(left / 86400);
        const hh = Math.floor((left % 86400) / 3600);
        const mm = Math.floor((left % 3600) / 60);
        const ss = left % 60;
        cd.textContent = `${pad(d)}天 ${pad(hh)}時 ${pad(mm)}分 ${pad(ss)}秒`;
      };
      const pad = (n) => String(n).padStart(2, '0');
      tick();
      if (!App.reduceMotion) {
        const timer = setInterval(() => {
          if (!cd.isConnected) clearInterval(timer);
          else tick();
        }, 1000);
      }
      return h(
        'div',
        { class: 'ex-leak' },
        h('div', { class: 'leak-bar mono' }, h('span', null, 'LOCKBIT 2.0'), h('span', null, 'LEAKED DATA')),
        h(
          'div',
          { class: 'leak-card' },
          h('p', { class: 'leak-victim' }, ex.victim),
          h('p', { class: 'leak-size mono' }, '資料量 ' + ex.size),
          h('p', { class: 'leak-label' }, '公開倒數'),
          cd,
          h('p', { class: 'leak-label' }, '已公開樣本'),
          h('ul', { class: 'leak-files mono' }, ex.samples.map((f) => h('li', null, f)))
        ),
        h('p', { class: 'leak-tag' }, '教學示意，非真實網站畫面')
      );
    },

    table(ex) {
      return h(
        'div',
        { class: 'scroll-x' },
        h(
          'table',
          { class: 'data-table' },
          h('thead', null, h('tr', null, ex.head.map((c) => h('th', null, c)))),
          h('tbody', null, ex.rows.map((r) => h('tr', null, r.map((c) => h('td', null, c)))))
        )
      );
    },

    /* 單一公司概況：名稱、標籤、重點與數據 */
    profile(ex) {
      return h(
        'div',
        { class: 'ex-profile' },
        h('div', { class: 'org-co' }, ex.badge ? h('span', { class: 'pill pill-navy' }, ex.badge) : null, h('strong', null, ex.name), ex.detail ? h('span', { class: 'muted' }, ex.detail) : null),
        ex.chips ? h('ul', { class: 'chips' }, ex.chips.map((c) => h('li', null, c))) : null,
        h('dl', { class: 'kv' }, ex.stats.map(([k, v]) => [h('dt', null, k), h('dd', null, v)])),
        ex.note ? h('p', { class: 'ex-note' }, ex.note) : null
      );
    },

    /* 流向示意：每一列是一條路徑，kind 決定色彩（src 來源、hit 異常、out 外送管道、bad 管控之外、ctrl 控制措施）；plain 的列不畫箭頭 */
    flow(ex) {
      return h(
        'div',
        { class: 'ex-flow' },
        ex.lanes.map((lane) =>
          h(
            'div',
            { class: 'flow-lane' },
            h('p', { class: 'flow-title' }, lane.title),
            h('ol', { class: 'flow-steps' + (lane.plain ? ' plain' : '') }, lane.steps.map((st) => h('li', { class: 'flow-step k-' + (st.kind || 'src') }, h('strong', null, st.t), st.s ? h('span', null, st.s) : null)))
          )
        ),
        ex.legend ? h('ul', { class: 'flow-legend' }, ex.legend.map(([kind, label]) => h('li', { class: 'k-' + kind }, label))) : null,
        ex.note ? h('p', { class: 'ex-note' }, ex.note) : null
      );
    },

    /* 監視器畫面示意 */
    cctv(ex) {
      const svg =
        `<svg viewBox="0 0 320 150" aria-hidden="true">` +
        `<path d="M0 132 H320" class="cctv-floor"/>` +
        `<rect x="216" y="20" width="70" height="112" class="cctv-door"/>` +
        `<circle cx="96" cy="44" r="11" class="cctv-fig"/>` +
        `<path d="M86 58 h20 l8 40 h-8 l-4 34 h-7 l-2 -30 l-2 30 h-7 l-2 -34 h-6 z" class="cctv-fig"/>` +
        `<path d="M110 74 L132 86" class="cctv-arm"/>` +
        `<rect x="132" y="80" width="74" height="30" class="cctv-cart"/>` +
        `<rect x="138" y="62" width="62" height="18" class="cctv-box"/>` +
        `<rect x="150" y="50" width="20" height="12" class="cctv-box"/>` +
        `<rect x="172" y="50" width="20" height="12" class="cctv-box"/>` +
        `<circle cx="144" cy="118" r="7" class="cctv-wheel"/><circle cx="194" cy="118" r="7" class="cctv-wheel"/>` +
        `<rect x="76" y="26" width="46" height="110" class="cctv-tag"/>` +
        `<rect x="132" y="44" width="76" height="70" class="cctv-tag"/>` +
        `</svg>`;
      return h(
        'div',
        { class: 'ex-cctv', role: 'img', 'aria-label': ex.alt || '監視器畫面示意' },
        h('div', { class: 'cctv-top mono' }, h('span', { class: 'cctv-rec' }, 'REC'), h('span', null, ex.cam)),
        h('div', { class: 'cctv-view', html: svg }),
        h('div', { class: 'cctv-bottom mono' }, h('span', null, ex.time)),
        h('ul', { class: 'cctv-notes' }, ex.notes.map((n) => h('li', null, n))),
        h('p', { class: 'ransom-tag' }, '教學示意畫面')
      );
    },

    /* 契約或規章條文摘錄 */
    clauses(ex) {
      return h(
        'div',
        { class: 'ex-clauses' },
        h('div', { class: 'notice-head' }, h('span', null, ex.doc), ex.signed ? h('span', { class: 'mono' }, ex.signed) : null),
        h('ol', { class: 'clause-list' }, ex.items.map(([k, v, flag]) => h('li', { class: flag ? 'flag-' + flag : null }, h('strong', null, k), h('p', { html: fmt(v) })))),
        ex.note ? h('p', { class: 'ex-note' }, ex.note) : null
      );
    },

    timeline(ex) {
      return h(
        'ol',
        { class: 'ex-timeline' },
        ex.items.map(([t, what, kind]) =>
          h('li', { class: 'tl-' + (kind || 'context') }, h('span', { class: 'tl-time mono' }, t), h('span', { class: 'tl-what' }, what))
        )
      );
    }
  };

  App.renderExhibit = function (data, id, opts) {
    const ex = data.exhibits[id];
    if (!ex) return null;
    opts = opts || {};
    const body = renderers[ex.type](ex, data);
    return h(
      'figure',
      { class: 'exhibit exhibit-' + ex.type + (opts.cls ? ' ' + opts.cls : '') },
      h('figcaption', null, h('span', { class: 'ex-no' }, ex.no), h('span', { class: 'ex-title' }, ex.title)),
      body
    );
  };

  App.renderParagraph = function (p) {
    if (typeof p === 'string') return h('p', { html: fmt(p) });
    if (p.list) return h('ol', { class: 'case-list' }, p.list.map((li) => h('li', { html: fmt(li) })));
    return null;
  };
})();
