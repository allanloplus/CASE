# CASE 資安個案研究室

以真實資安事件改編的企業個案，搭配 **Allan 顧問** 與 **AI 小助手阿拉蕾**，用動畫閱讀、互動遊戲與決策模擬進行個案研討。

純靜態網站（HTML／CSS／JavaScript），不需要建置工具，可直接部署到 GitHub Pages 或任何靜態主機。

## 目前個案

| 案號 | 個案 | 狀態 |
|---|---|---|
| S111001 | 倒數十天：築遠建設的勒索軟體風暴 | 已完成 |
| S111002～S111005 | 國家資通安全研究院精選案例 | 改編中 |

## 每個個案的四種模式

- **動畫閱讀**：場景＋案情旁白＋角色對話，逐步讀完個案（`#S111001-read`）
- **討論互動**：六個任務（`#S111001-discuss`）
  1. 徵兆偵探：判斷 12 筆系統紀錄是否為攻擊徵兆
  2. 攻擊鏈拼圖：依序排出 7 個攻擊階段，對照 MITRE ATT&CK 與防線
  3. 法條連連看：行為對應刑法、個資法、證交所重大訊息規範
  4. 四大面向討論：管理、技術、法律、企業因應各 3 題，寫想法、看參考答案、自我檢核
  5. 72 小時決策模擬：扮演總經理做四個決定，觀察營運／信任／法遵／財務指標
  6. 董事會決議：綜合題、管理意涵、複製研討筆記
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
  voice.js              語音播放
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
tools/build_voice.py    產生 Allan 與阿拉蕾的對話語音
tools/case_lines.js     列出個案中需要配音的台詞
cases/registry.js       個案清單
cases/S111001/case.js   個案內容（本文、對話、附件、題目、答案、遊戲、教學手冊）
cases/S111001/voice/    對話語音檔與對照表（自動產生）
```

## 新增一個個案

1. 複製 `cases/S111001/case.js` 為 `cases/<案號>/case.js`，依相同結構改寫內容。
   - `chapters[].scenes[].lines` 的格式是 `[角色, 表情, 台詞]`
   - Allan 表情：`smile` `laugh` `think` `trouble` `surprise` `point` `wink` `shock`
   - 阿拉蕾表情：`laugh` `think` `surprise` `confused` `explain` `cry` `thumb` `cheer`
   - 場景背景 `bg`：`night` `office` `server` `alert` `meeting` `darkweb` `city`
2. 執行 `python3 tools/build_voice.py <案號>` 產生對話語音。
3. 在 `cases/registry.js` 把該案的 `status` 改為 `'ready'`，並補上 `title`、`minutes`。

## 語音

Allan 顧問與阿拉蕾的對話都有語音，沿用既有課程的聲音設定（`zh-TW-YunJheNeural`／`zh-TW-HsiaoYuNeural`）：

- 動畫閱讀：每句對話自動播放，字幕速度與語音同步；開啟自動播放時，說完才換下一句；泡泡上的喇叭按鈕可重播。
- 討論區：決策模擬的情境與講評、法條解說、討論題提示也會說話。
- 「語音 開／關」按鈕可隨時切換。瀏覽器擋下自動播放時，點一下喇叭或「下一步」即可開始。

修改台詞後重新產生語音：

```bash
pip install edge-tts      # 另需 ffmpeg
python3 tools/build_voice.py S111001
```

語音檔輸出到 `cases/<案號>/voice/`，網站依台詞文字對應語音；台詞改了而沒重新產生時，該句會安靜不播，不會播錯。

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
