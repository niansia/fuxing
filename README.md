# 花蓮光復鄉 互助支援平台（前端 + API 原型）

這是一個快速原型，提供災民需求登記、志工報名與需求看板瀏覽。前端仍採用 CDN 方式載入 React + Tailwind，後端新增 Node.js（Express）API 及 SQLite 持久化儲存，方便部署至雲端環境（例如 Azure App Service）。

## 專案結構速覽

- `simple.html`：單檔版面，使用 `<script type="text/babel">` 建立整體 UI（含地圖、需求看板、表單）。
- `server/index.js`：Express 伺服器，提供即時資訊 API + 新增的災情需求 CRUD 介面，並使用 SQLite（better-sqlite3）寫入 `data/requests.sqlite`。
- `scripts/test-requests.js`：啟動臨時伺服器並驗證需求 API 的整合測試腳本。
- `Data/*.csv`、`components/*`：原先拆分的 React 元件、資料來源等，可視需要繼續使用。

## 後端啟動與資料持久化

```powershell
npm install
# 啟動伺服器（預設 http://localhost:5001）
npm start

# 或在不同 Port：
# $env:PORT=8080; npm start
```

- 預設會在專案根目錄建立 `data/requests.sqlite`。
- 可透過環境變數 `DATA_DIR` 自訂資料庫存放位置：

```powershell
$env:DATA_DIR="D:\home\site\data"; npm start
```

> Azure App Service 建議設定 `DATA_DIR` 為 `D:\home\site\data`，該目錄位於持久化儲存區，可跨重啟保留資料。若部署於容器，請將 `DATA_DIR` 指向掛載的 Volume。部署到 Azure 的詳細步驟、正式網域設定與備份策略請參考 [`docs/azure-deployment.md`](docs/azure-deployment.md)。

## 前端預覽 `simple.html`

後端啟動後，可用任一靜態伺服器載入 `simple.html`（避免瀏覽器模組與 CORS 限制）：

```powershell
npx --yes http-server -p 5500 -c-1
# 開啟 http://127.0.0.1:5500/simple.html
```

或使用 VS Code Live Server 套件，右鍵 `simple.html` -> **Open with Live Server**。

前端現在會從 `/api/requests` 讀取資料、新增需求、更新狀態，以及提交志工報名，資料都會寫入 SQLite。

## API 測試

```powershell
# 執行整合測試，會啟動臨時伺服器並驗證 CRUD 流程
npm run test:requests
```

輸出將顯示初始資料筆數、建立後筆數、更新後狀態與志工報名數量，結束時會清除臨時資料庫。

## 主要檔案

- `index.html`：載入 Tailwind、設定 import map，並掛載 `index.jsx`。
- `index.jsx`：建立 React Root 並渲染 `app.jsx`。
- `app.jsx`：應用程式狀態，包含需求清單、新增需求、更新狀態與志工報名邏輯。
- `types.jsx`：列舉常數（需求類型/狀態）與共用小工具。
- `components/RequestForm.jsx`：災民需求表單。
- `components/RequestDashboard.jsx`：需求看板（篩選與排序）。
- `components/RequestCard.jsx`：單筆需求卡片，支援狀態更新與志工報名區塊。
- `components/VolunteerSignup.jsx`：志工報名表單（姓名、電話、備註）。

## 已完成

- 修正原始專案中的掛載與 TS 在 .jsx 的錯誤
- 新增志工報名 MVP（卡片內可直接報名，顯示報名名單）
- 以 CDN 載入 React 18 + Tailwind，零設定即可使用
- 新增 SQLite 持久化後端 API，可直接部署到 Azure（設定 `DATA_DIR`）

## 待辦與擴充建議

- 資料備援：若要支援多區域，可再串接雲端資料庫（Supabase/Firebase/Azure SQL）或架設複寫機制。
- 權限與驗證：災民、志工、指揮中心管理角色。
- 通知：完成狀態更新與志工媒合後，透過簡訊/LINE Notify/Email 通知。
- 地圖與定位：內嵌地圖（OpenStreetMap/Leaflet），支援座標、距離排序。
- 媒合流程：需求可設定「需要人數/物資數量」與進度條，志工/物資提供者報名後自動對帳。
- 多語與無障礙：中文/阿美語/英文切換；WCAG 無障礙最佳化。
- 開放資料/API 串接：
  - 國家級警報（PWS/警政署開放資料）
  - 水情與淹塞湖專區資料來源
  - 行政區與避難收容所開放資料

## 授權

此專案僅做示範與原型用途，實際上線請由專業團隊評估資安、流量與法遵需求。
