# Azure App Service 部署筆記

> 適用於本專案（Node.js + Express + SQLite）的雲端部署方案，涵蓋基本部署、正式網域設定與資料持久化備援建議。

## 1. 環境需求

- [Azure CLI](https://learn.microsoft.com/cli/azure/install-azure-cli) 2.58+。
- 有效的 Azure 訂閱，具備建立 Resource Group / App Service 的權限。
- 專案根目錄含 `package.json`（已由專案提供）且 `npm start` 能啟動伺服器。

```powershell
az login
az account set --subscription <SUBSCRIPTION_ID>
```

## 2. 基本部署流程（Node.js 版）

> `az webapp up` 會自動建立 Resource Group、App Service Plan 與 Web App。以下示例建立 Linux App Service，Runtime 為 Node 20 LTS。

```powershell
# 變數（請自訂名稱，僅限小寫英數與連字號）
$appName = "gf-aid-prod"
$resourceGroup = "rg-gf-aid"
$location = "eastus"

# 建立或更新 Web App
az webapp up \
  --name $appName \
  --resource-group $resourceGroup \
  --location $location \
  --os-type linux \
  --runtime "node|20-lts" \
  --sku B1
```

> ⚠️ Free (F1) 方案目前僅支援 Windows Runtime，且 Node.js 版本受限；若要使用 F1，請改用 `--os-type windows --runtime "node|20-lts"`，不過 Linux 方案在實務上更穩定，建議使用最小的 B1 方案。

部署成功後，CLI 會回傳預設網域 `https://<appName>.azurewebsites.net`。可先用此網址確認站台是否正常。

### 2.1 設定環境變數

App Service 預設會把持久化儲存掛載在：
- Linux：`/home/site/data`
- Windows：`D:\home\data`

本專案已支援 `DATA_DIR` 變數，可將 SQLite 文件寫到持久化區。

```powershell
az webapp config appsettings set \
  --name $appName \
  --resource-group $resourceGroup \
  --settings DATA_DIR="/home/site/data" PORT="5001"
```

> `PORT` 需與 Express 監聽的 Port 相同，預設為 5001。App Service 會自行將外部 Port 映射到 80/443。

### 2.2 靜態檔案

`server/index.js` 會以 Express 靜態服務提供 `simple.html` 與資料夾內容，因此部署後可直接瀏覽：

```
https://<appName>.azurewebsites.net/simple.html
```

若要改用官方網域，可在 Azure Portal 中設定 **Custom Domains**，並於 DNS 加入 CNAME 記錄指向 `<appName>.azurewebsites.net`。

## 3. 資料持久化與備援

### 3.1 App Service 持久化儲存

- `DATA_DIR=/home/site/data` 會讓 SQLite 建於 App Service 的持久化磁碟（`/home/data` 為實際路徑）。
- 檔案會在重啟與重新部署期間保留，但不等於備份；請搭配以下策略。

### 3.2 Azure App Service 備份

可使用 App Service 的備份功能（需 Standard 以上方案）或自動化指令：

```powershell
az webapp config backup create \
  --resource-group $resourceGroup \
  --webapp-name $appName \
  --backup-name "nightly-$(Get-Date -Format yyyyMMdd)" \
  --container-url "https://<storage-account>.blob.core.windows.net/<container>?<SAS_TOKEN>"
```

> 建議排程在 Azure Automation / Logic Apps 定期呼叫上述指令，至少每日一次。

### 3.3 外部資料庫（進階）

若擔心單一 SQLite 檔案不足：

1. **Azure Cosmos DB for PostgreSQL / Azure Database for PostgreSQL**：將 `requests` 與 `volunteers` 資料表遷移到雲端資料庫，提供更佳的擴充性與備份機制。
2. **Azure Storage Table / Cosmos DB Core (NoSQL)**：若後續打算改成事件型資料，可改寫 API 將資料存到 NoSQL。

若要採用雲端資料庫，可先撰寫遷移腳本，把 `data/requests.sqlite` 內容匯出，再匯入至目標資料庫。

## 4. CI/CD 與藍綠部署（選配）

- 建議使用 GitHub Actions 或 Azure DevOps Pipeline，每次 push 到 `main` 時佈署到 **Staging Slot**，驗證後再 Swap 到 Production。
- App Service **Deployment Slots** 需要 Standard（S1）以上方案。

## 5. 部署後檢查清單

- [ ] `https://<appName>.azurewebsites.net/simple.html` 能正確載入與呼叫 API。
- [ ] 在新環境中建立一筆需求，重整後資料仍在（確認 SQLite 寫入成功）。
- [ ] 執行 `npm run test:requests` 對遠端環境（調整腳本中的 base URL）驗證 CRUD 流程。
- [ ] 如需 Production DNS，已完成 CNAME 指向並設定 SSL（可使用 App Service Managed Certificate）。

## 6. 常見問題

- **部署後顯示「Cannot GET /」**：確認 `npm start` 是否提供靜態檔案；必要時在 `server/index.js` 尾端加入 `app.get('/', ...)` 導向 `simple.html`。
- **外部 API 被 CORS 阻擋**：後端已提供 WRA 水位代理，若要新增其他代理可在 `server/index.js` 追加。
- **資料庫檔案遺失**：確認 `DATA_DIR` 是否指向 App Service 持久化路徑；如仍遺失，可從備份或 Blob 還原。

---

如需協助改寫 API 以使用雲端資料庫或加上多站備援，請再告知需求。