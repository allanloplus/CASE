/* 個案清單：新增個案時，在此登錄一筆，並建立 cases/<案號>/case.js */
window.CASE_REGISTRY = [
  {
    id: 'S115001',
    status: 'ready',
    category: '威脅情資',
    title: '總經理先看到新聞：PHP2Shell 情資應變的 48 小時',
    origin: 'PHP2Shell 重大漏洞外洩與緊急修補，日本首相示警（2026 年 10 月公開報導）',
    tags: ['威脅情資', '漏洞管理', 'PHP2Shell', '資產盤點', '委外管理'],
    minutes: 90
  },
  {
    id: 'S111001',
    status: 'ready',
    category: '資訊保護',
    title: '倒數十天：艾倫建設的勒索軟體風暴',
    origin: '上市公司遭勒索軟體攻擊，海量資料遭洩',
    tags: ['勒索軟體', '雙重勒索', '備份與復原', '重大訊息', '個資外洩'],
    minutes: 90
  },
  {
    id: 'S111002',
    status: 'ready',
    category: '資訊保護',
    title: '補丁之後：艾倫普拉斯科技的 Log4j 供應鏈風暴',
    origin: 'Log4j重大資安漏洞揭露半年後 仍不可大意',
    tags: ['零時差漏洞', 'Log4Shell', '軟體供應鏈', '修補管理', 'SBOM', '委外管理'],
    minutes: 90
  },
  {
    id: 'S111003',
    status: 'ready',
    category: '資訊保護',
    title: '沒收回的那把鑰匙：艾倫普拉斯傳媒的跨年直播危機',
    origin: '離職員工偷刪前東家資料，該當何罪？',
    tags: ['離職管理', '帳號註銷', '妨害電腦使用', '雲端金鑰', '共用帳號'],
    minutes: 90
  },
  {
    id: 'S111004',
    status: 'ready',
    category: '資訊保護',
    title: '畫面不能重拍：曦光傳媒的片庫歸零事件',
    origin: '委外要當心！電視台新聞片庫慘遭協力廠商刪除',
    tags: ['委外管理', '備份與復原', 'RPO／RTO', '變更管理', '資產分級'],
    minutes: 90
  },
  {
    id: 'S111005',
    status: 'ready',
    category: '資訊保護',
    title: '起飛之前：艾倫普拉斯科技的營業秘密保衛戰',
    origin: '揮一揮衣袖 離職時請別帶走公司的營業秘密',
    tags: ['營業秘密', '內部威脅', '合理保密措施', '離職管理', '日誌監控'],
    minutes: 90
  }
];
