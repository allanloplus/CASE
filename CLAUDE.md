# CASE 資安個案研究室：專案規範

使用者是 ISMS／PIMS 輔導顧問，也是驗證公司的稽核員（專長資安與企業 MIS 管理）。一律以繁體中文（臺灣用語）溝通與撰寫內容。

## 每個新個案都必須做到

1. **改編方式**：以國家資通安全研究院《資安案例彙編—精選案例》為原始案例，依學術「企業個案」寫法（參考政大企研所個案）改編。
   - 結構：開場兩難場景 → 公司背景 → 發生徵兆 → 事件經過 → 事後處理 → 停在待決策的時刻。
   - 公司、人物一律虛構，並附免責聲明。
   - 內容需含：附件、管理意涵、四大面向討論題（資安管理面、技術面、法律面、企業因應，外加綜合題），每題都要有參考答案、提示與自我檢核重點；並對應 ISO/IEC 27001:2022 控制措施，以及刑法、個資法、證交所規範等法規。
2. **呈現方式**：
   - 動畫閱讀：場景、旁白，加上 Allan 顧問（講師）與 AI 小助手阿拉蕾（活潑串場）的對話。
   - 討論互動：遊戲、互動與引導。
   - 另提供文本版與教學手冊。
3. **語音（必做）**：Allan 顧問與阿拉蕾的對話都要配語音，使用既有課程的聲音，不可更換。
   - 設定來源：`allanloplus/ISO27001_A01` 的 `lesson/build_audio.py`。
   - Allan 顧問：`zh-TW-YunJheNeural`，rate `+6%`
   - 阿拉蕾：`zh-TW-HsiaoYuNeural`，rate `+12%`，pitch `+28Hz`
   - 改完台詞後執行 `python3 tools/build_voice.py <案號>`（不加案號則處理所有 `ready` 個案；需 `pip install edge-tts`），把 `cases/<案號>/voice/` 一併提交。
   - 新的英文縮寫或特殊唸法，加到 `tools/build_voice.py` 的 `SPOKEN`。
   - 配音範圍定義在 `tools/build_voice.py` 的 `NODE_DUMP` 與 `EXTRA_LINES`：動畫閱讀對話、討論題提示、決策模擬的情境與講評、法條解說、閱讀完成台詞。新增會說話的元素時，記得一起加入。
   - 網站以「角色|台詞文字」對應語音檔（`cases/<案號>/voice/voice.js`），播放邏輯在 `assets/js/voice.js`。
4. **製作資訊**：寫在 `case.js` 的 `meta.credits`：
   - 創意規劃：Allan Lo 顧問（http://www.123hi.org），＜製作年月＞
   - 個案內容：由 AI 改編原始案例生成
5. **登錄**：在 `cases/registry.js` 把該案 `status` 改為 `'ready'`。

## 程式結構

- 純靜態網站，沒有建置步驟。個案內容全部寫在 `cases/<案號>/case.js`，格式見 S111001 檔頭說明與 README。
- 遊戲與討論區文字可用 `games.<遊戲>.labels` 與 `ui.*` 依個案覆寫（範例：S115001、S111005）。
- 角色表情：Allan `smile laugh think trouble surprise point wink shock`；阿拉蕾 `laugh think surprise confused explain cry thumb cheer`。
- 場景背景：`night office server alert meeting darkweb city`。
- 個案以字詞錨點路由，例如 `#S111001-read`、`#S111001-discuss`。

## 發布前檢查

- `node --check` 所有 JS。
- 以 headless Chromium（`/opt/node-tools/node_modules/playwright`）跑過閱讀、六個任務與語音：桌機與手機、淺色與深色模式下，都不能有錯誤或水平捲動。
- 預覽 Artifact：https://claude.ai/artifact/Lk9t6MiDx1AgoNwsGPLq1P
  - 發布時用去掉 `<!doctype>`、`<html>`、`<head>`、`<body>` 外框的 `index.html`。
  - 其他檔案以 `files` 一併上傳，包含 `cases/<案號>/voice/` 的語音檔。
