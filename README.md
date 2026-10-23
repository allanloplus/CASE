# CASE 資安個案研究室

以真實資安事件改編的企業個案，搭配 **Allan 顧問** 與 **AI 小助手阿拉蕾**，用動畫閱讀、互動遊戲與決策模擬進行個案研討。

純靜態網站（HTML／CSS／JavaScript），不需要建置工具，可直接部署到 GitHub Pages 或任何靜態主機。

## 目前個案

| 案號 | 個案 | 狀態 |
|---|---|---|
| S111001 | 倒數十天：築遠建設的勒索軟體風暴 | 已完成 |
| S111005 | 起飛之前：晟馳科技的營業秘密保衛戰 | 已完成 |
| S115001 | 總經理先看到新聞：PHP2Shell 情資應變的 48 小時 | 已完成 |
| S111002～S111004 | 國家資通安全研究院精選案例 | 改編中 |

## 每個個案的四種模式

- **動畫閱讀**：場景＋案情旁白＋角色對話，逐步讀完個案（`#S111001-read`）
- **討論互動**：六個任務（`#S111001-discuss`）
  1. 徵兆偵探：判斷 12 筆系統紀錄是否為攻擊徵兆
  2. 攻擊鏈拼圖：依序排出 7 個攻擊階段，對照 MITRE ATT&CK 與防線
  3. 法條連連看：行為對應刑法、個資法、證交所重大訊息規範
  4. 四大面向討論：管理、技術、法律、企業因應各 3 題，寫想法、看參考答案、自我檢核
  5. 72 小時決策模擬：扮演總經理做四個決定，觀察營運／信任／法遵／財務指標
  6. 董事會決議：綜合題、管理意涵、複製研討筆記

  S115001 沿用同樣六個任務，題材改為情資應變：情資分診（12 則情資值不值得行動）、應變流程拼圖（7 個步驟對照 ISO 27001 控制措施）、條文對對碰、四大面向討論、48 小時決策模擬（扮演資安長），以及 15:00 總經理說明。
- **文本版**：完整個案本文、附件與討論問題（`#S111001-text`）
- **教學手冊**：教學目標、90 分鐘課堂流程、參考答案、遊戲解答（`#S111001-teach`）

學員的作答、筆記與進度存在各自瀏覽器的 localStorage，不會上傳。

## 本機預覽

```bash
python3 -m http.server 8000
# 開啟 http://localhost:8000
```

## 目錄結構

```
index.html              網站入口
assets/css/style.css    樣式（含深色模式）
assets/js/
  core.js               共用工具、角色、儲存、路由
  exhibits.js           附件繪製（組織圖、日誌、攻擊路徑、重大訊息、暗網示意…）
  reader.js             動畫閱讀
  games.js              互動遊戲
  discuss.js            討論區與討論題
  pages.js              首頁、總覽、文本版、教學手冊
  main.js               啟動與頁面切換
assets/img/allan/       Allan 顧問表情與姿勢
assets/img/arale/       阿拉蕾表情與姿勢
assets/src/             角色設定原圖
tools/make_sprites.py   由設定原圖切出角色貼圖
cases/registry.js       個案清單
cases/S111001/case.js   個案內容（本文、對話、附件、題目、答案、遊戲、教學手冊）
cases/S111005/case.js   營業秘密與內部威脅個案
cases/S115001/case.js   PHP2Shell 情資應變個案
```

## 新增一個個案

1. 複製 `cases/S111001/case.js` 為 `cases/<案號>/case.js`，依相同結構改寫內容。
   - `chapters[].scenes[].lines` 的格式是 `[角色, 表情, 台詞]`
   - Allan 表情：`smile` `laugh` `think` `trouble` `surprise` `point` `wink` `shock`
   - 阿拉蕾表情：`laugh` `think` `surprise` `confused` `explain` `cry` `thumb` `cheer`
   - 場景背景 `bg`：`night` `office` `server` `alert` `meeting` `darkweb` `city`
   - 附件類型 `type`：`org` `logs` `ransom` `network` `notice` `leak` `table` `timeline` `chat` `profile` `flow` `cctv` `clauses`
2. 在 `cases/registry.js` 把該案的 `status` 改為 `'ready'`，並補上 `title`、`minutes`。
3. 遊戲與討論區的文字預設沿用 S111001 的情境；題材不同時可覆寫（範例見 `cases/S115001/case.js`）：
   - `games.<遊戲>.labels`：按鈕、判斷結果、提示與結語，例如徵兆偵探改成「值得行動／不宜照做」
   - `ui.missions`：六個任務的名稱與說明
   - `ui.overview`、`ui.hub.welcome`、`ui.dimIntro`、`ui.finalIntro`、`ui.readerFinale`、`ui.discussDesc`：總覽、討論區與閱讀完成頁的對話與說明
   - 附件類型另有 `chat`（通訊軟體對話）；`notice` 可用 `label` 改標題列文字，`org` 可用 `link` 改兩個單位之間的關係說明
   - `profile`（單一公司概況）、`flow`（資料與設備流向）、`cctv`（監視器畫面示意）、`clauses`（契約條文摘錄，可標示有利／弱點條文），範例見 `cases/S111005/case.js`
4. 案號格式為 `S` 加 6 位數字（路由只接受這個格式）。

## 更新角色圖

更換 `assets/src/` 的設定圖後，調整 `tools/make_sprites.py` 裡的裁切座標並執行：

```bash
python3 tools/make_sprites.py
```

## 製作

- 創意規劃：Allan Lo 顧問（[www.123hi.org](http://www.123hi.org)），2026 年 10 月
- 個案內容：由 AI 改編原始案例生成

## 來源與授權提醒

個案素材取自國家資通安全研究院《資安案例彙編—精選案例》與公開報導，改編時已虛構公司與人物，並註明出處。依該院著作權聲明，以該院名義發表之著作得在合理範圍內利用並註明出處；若要大量轉載原文或商業使用，建議先取得授權。
