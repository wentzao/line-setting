# 功能說明：帳號設定（Channel Access Token 管理）

## 📋 功能概述

在進入某個 LINE 官方帳號後（專案選擇頁面），現在可以透過齒輪圖標 ⚙️ 來管理該帳號的 Channel Access Token。

## ✨ 新增功能

### 1. 齒輪圖標按鈕

**位置**：專案選擇頁面的 `page-header`，位於 `page-subtitle`（顯示帳號名稱）旁邊

**外觀**：
- 齒輪 emoji：⚙️
- 按鈕樣式：透明背景，灰色邊框
- 懸停效果：淺灰色背景，主色邊框
- 點擊效果：輕微縮放動畫

### 2. 帳號設定模態框

點擊齒輪圖標後，會彈出一個模態框，包含：

#### 表單欄位

1. **帳號名稱**
   - 顯示當前帳號名稱
   - 欄位為禁用狀態（無法修改）
   - 說明：「帳號名稱無法修改」

2. **Channel Access Token**
   - 輸入框類型：`password`（預設隱藏）
   - 顯示當前的 Token（如果有）
   - 附帶「顯示/隱藏」按鈕（眼睛圖標 👁️）
   - 點擊眼睛圖標可切換顯示/隱藏 Token
   - 說明：包含 LINE Developers Console 的連結

#### 按鈕

- **取消**：關閉模態框，不儲存變更
- **儲存變更**：驗證並更新 Token

#### 訊息區域

- **錯誤訊息**：紅色背景，顯示驗證失敗等錯誤
- **成功訊息**：綠色背景，顯示「✓ Token 已成功更新」

## 🔄 工作流程

### 查看 Token

```
1. 進入某個 LINE 官方帳號（專案選擇頁面）
   ↓
2. 點擊右上角的齒輪圖標 ⚙️
   ↓
3. 查看 Token 欄位
   - 預設為隱藏狀態（顯示 •••）
   ↓
4. 點擊眼睛圖標 👁️ 顯示完整 Token
   ↓
5. 再次點擊（變成 🙈）隱藏 Token
```

### 更新 Token

```
1. 在帳號設定模態框中
   ↓
2. 修改 Channel Access Token 欄位
   - 輸入新的 Token
   ↓
3. 點擊「儲存變更」按鈕
   ↓
4. 系統驗證 Token
   - 按鈕變成「驗證中...」並禁用
   - 呼叫 LINE API 驗證 Token 有效性
   ↓
5a. 驗證成功：
    - 顯示「✓ Token 已成功更新」
    - 2 秒後自動關閉模態框
   ↓
5b. 驗證失敗：
    - 顯示錯誤訊息
    - 按鈕恢復為「儲存變更」
    - 模態框保持開啟
```

## 🔐 安全性

### Token 加密儲存

1. **前端到後端**：
   - Token 透過 HTTPS 傳輸
   - 使用 JSON 格式傳送

2. **後端儲存**：
   - 使用 Fernet 對稱加密
   - 加密金鑰來自環境變數 `SECRET_KEY`
   - 資料庫只儲存加密後的 Token

3. **後端到前端**：
   - API 回傳時解密
   - 前端顯示時預設為 `password` 類型（隱藏）

### Token 驗證

更新 Token 時：
1. ✅ 呼叫 LINE API (`/v2/bot/richmenu/list`)
2. ✅ 確認 Token 有效
3. ✅ 驗證成功才儲存
4. ❌ 驗證失敗則拒絕更新

## 📁 修改的檔案

### 前端

#### `static/ui.js`

1. **添加齒輪按鈕**（第 435 行）：
   ```html
   <button id="account-settings-btn" class="btn-icon" title="帳號設定">⚙️</button>
   ```

2. **添加帳號設定模態框**（第 473-504 行）：
   - 完整的模態框 HTML
   - 表單欄位
   - Token 可見性切換按鈕

3. **新增函數**（第 425-543 行）：
   - `openAccountSettingsModal()` - 打開模態框並載入帳號資訊
   - `closeAccountSettingsModal()` - 關閉模態框
   - `wireAccountSettingsModal()` - 綁定所有事件（關閉、取消、顯示/隱藏、儲存）

4. **事件綁定**（第 512-514、517 行）：
   ```javascript
   document.getElementById('account-settings-btn').addEventListener('click', () => {
       openAccountSettingsModal();
   });
   wireAccountSettingsModal();
   ```

#### `static/db.js`

**新增函數**（第 77-123 行）：
```javascript
window.updateAccountToken = async function updateAccountToken(accountId, newToken)
```

功能：
- 透過帳號名稱找到對應的數字 ID
- 呼叫後端 PUT API 更新 Token
- 處理錯誤並拋出異常

#### `static/style.css`

**新增樣式**（第 689-742 行）：

1. **`.btn-icon`** - 圖標按鈕樣式：
   - 透明背景
   - 灰色邊框
   - 圓角、過渡效果
   - 懸停和點擊動畫

2. **`.token-input-group`** - Token 輸入框組：
   - Flexbox 佈局
   - 輸入框占滿空間
   - 按鈕固定大小

3. **`.success`** - 成功訊息樣式：
   - 綠色背景和文字
   - 圓角、內距

### 後端

#### `api_routes.py`

**新增端點**（第 85-120 行）：
```python
@api_bp.route('/accounts/<int:account_id>', methods=['PUT'])
def update_account(account_id):
```

功能：
1. 接收 `name` 和 `channel_access_token`
2. 驗證欄位不為空
3. 檢查帳號是否存在
4. 呼叫 LINE API 驗證新 Token
5. 驗證成功後更新資料庫
6. 回傳更新結果

#### `db.py`

**新增函數**（第 184-197 行）：
```python
def update_account(account_id, name, channel_access_token):
```

功能：
- 加密新的 Token
- 更新資料庫中的 `name` 和 `channel_access_token`
- 提交變更

## 🧪 測試指南

### 測試 1：查看現有 Token

1. **前置條件**：
   - 已有一個 LINE 官方帳號

2. **步驟**：
   - ① 選擇一個帳號，進入專案選擇頁面
   - ② 確認 page-header 中顯示齒輪圖標 ⚙️
   - ③ 點擊齒輪圖標
   - ④ 確認模態框彈出
   - ⑤ 確認帳號名稱欄位顯示正確且為禁用狀態
   - ⑥ 確認 Token 欄位為 password 類型（隱藏）
   - ⑦ 點擊眼睛圖標 👁️
   - ⑧ 確認 Token 完整顯示（文字類型）
   - ⑨ 再次點擊（現在是 🙈）
   - ⑩ 確認 Token 再次隱藏

3. **預期結果**：
   - ✅ 所有步驟順利完成
   - ✅ Token 正確顯示
   - ✅ 顯示/隱藏功能正常

### 測試 2：更新有效的 Token

1. **前置條件**：
   - 準備一個新的、有效的 Channel Access Token
   - 可以從 LINE Developers Console 取得

2. **步驟**：
   - ① 打開帳號設定模態框
   - ② 清空 Token 欄位並輸入新的有效 Token
   - ③ 點擊「儲存變更」
   - ④ 觀察按鈕變成「驗證中...」並禁用
   - ⑤ 等待驗證完成
   - ⑥ 確認顯示綠色成功訊息：「✓ Token 已成功更新」
   - ⑦ 確認 2 秒後模態框自動關閉
   - ⑧ 重新打開模態框
   - ⑨ 確認新 Token 已保存

3. **預期結果**：
   - ✅ Token 驗證成功
   - ✅ 成功訊息顯示
   - ✅ 模態框自動關閉
   - ✅ Token 已更新

### 測試 3：更新無效的 Token

1. **前置條件**：
   - 準備一個無效的 Token（例如隨機字串）

2. **步驟**：
   - ① 打開帳號設定模態框
   - ② 輸入無效的 Token
   - ③ 點擊「儲存變更」
   - ④ 等待驗證
   - ⑤ 確認顯示紅色錯誤訊息（例如「驗證失敗：Token 驗證失敗」）
   - ⑥ 確認按鈕恢復為「儲存變更」
   - ⑦ 確認模態框仍然開啟

3. **預期結果**：
   - ✅ 驗證失敗
   - ✅ 錯誤訊息顯示
   - ✅ Token 未被更新
   - ✅ 可以重新輸入

### 測試 4：空 Token 驗證

1. **步驟**：
   - ① 打開帳號設定模態框
   - ② 清空 Token 欄位
   - ③ 點擊「儲存變更」
   - ④ 確認顯示錯誤訊息：「請輸入 Channel Access Token」
   - ⑤ 確認不會觸發 API 請求（按鈕立即恢復）

2. **預期結果**：
   - ✅ 前端驗證生效
   - ✅ 錯誤訊息正確

### 測試 5：取消和關閉

1. **步驟**：
   - ① 打開帳號設定模態框
   - ② 修改 Token 但不儲存
   - ③ 點擊「取消」按鈕
   - ④ 確認模態框關閉
   - ⑤ 重新打開
   - ⑥ 確認 Token 未被修改（顯示原始 Token）
   - ⑦ 再次修改 Token
   - ⑧ 點擊右上角的 × 按鈕
   - ⑨ 確認模態框關閉且未儲存
   - ⑩ 再次打開
   - ⑪ 點擊模態框外的背景
   - ⑫ 確認模態框關閉

2. **預期結果**：
   - ✅ 取消按鈕、× 按鈕、點擊背景都能關閉模態框
   - ✅ 未儲存的變更不會生效

### 測試 6：多帳號切換

1. **前置條件**：
   - 有多個 LINE 官方帳號

2. **步驟**：
   - ① 選擇帳號 A，打開帳號設定
   - ② 確認顯示帳號 A 的名稱和 Token
   - ③ 關閉模態框，返回帳號列表
   - ④ 選擇帳號 B，打開帳號設定
   - ⑤ 確認顯示帳號 B 的名稱和 Token（不是帳號 A 的）

3. **預期結果**：
   - ✅ 每個帳號顯示各自的資訊
   - ✅ 不會混淆

## 🎨 UI/UX 特點

### 視覺設計

1. **齒輪圖標**：
   - 使用 emoji，跨平台一致
   - 大小適中（1.2rem）
   - 清晰的懸停反饋

2. **模態框**：
   - 居中顯示
   - 半透明背景遮罩
   - 流暢的淡入動畫

3. **輸入框組**：
   - Token 輸入框占滿寬度
   - 眼睛按鈕固定在右側
   - 對齊美觀

### 互動設計

1. **即時反饋**：
   - 按鈕禁用時顯示「驗證中...」
   - 成功/失敗即時顯示訊息
   - 成功後自動關閉（2 秒延遲）

2. **錯誤處理**：
   - 前端驗證：空 Token 檢查
   - 後端驗證：LINE API 驗證
   - 清晰的錯誤訊息

3. **便利功能**：
   - Token 預設隱藏（安全性）
   - 一鍵顯示/隱藏
   - 點擊背景關閉模態框

## 🔧 技術實現

### 前端架構

```
UI 層 (ui.js)
    ↓
    openAccountSettingsModal()
    - 呼叫 getAccount(accountId)
    - 填充表單欄位
    - 顯示模態框
    
    wireAccountSettingsModal()
    - 綁定關閉事件
    - 綁定取消事件
    - 綁定顯示/隱藏事件
    - 綁定儲存事件
        ↓
        validateChannelAccessToken(newToken)  // line-api.js
        ↓
        updateAccountToken(accountId, newToken)  // db.js
            ↓
            PUT /api/accounts/:id
```

### 後端架構

```
Flask Route (api_routes.py)
    ↓
    PUT /accounts/<int:account_id>
    - 驗證請求資料
    - 呼叫 LINE API 驗證 Token
    - 呼叫 db.update_account()
        ↓
        db.py
        - 加密 Token (encrypt_token)
        - UPDATE accounts SET ...
        - 提交到 SQLite
```

### 資料流

```
使用者輸入
    ↓
前端表單
    ↓
LINE API 驗證 (line-api.js)
    ↓
後端 API (api_routes.py)
    ↓
再次 LINE API 驗證（後端）
    ↓
加密並儲存 (db.py)
    ↓
SQLite 資料庫
```

## 📊 API 端點

### PUT `/api/accounts/:id`

**請求**：
```json
{
  "name": "我的帳號",
  "channel_access_token": "新的 Token"
}
```

**回應（成功）**：
```json
{
  "ok": true,
  "data": {
    "id": 1,
    "name": "我的帳號"
  }
}
```

**回應（失敗）**：
```json
{
  "ok": false,
  "message": "Token 驗證失敗，請檢查是否正確"
}
```

## 🚀 部署

### 重啟應用

修改完成後，需要重啟 Flask 應用：

```bash
# 停止現有進程
# Ctrl + C 或 kill PID

# 重新啟動
gunicorn -k eventlet -w 1 -b 127.0.0.1:1153 app:app
```

### 瀏覽器快取

前端代碼修改後，需要強制刷新瀏覽器：

- **Windows**: `Ctrl + Shift + R`
- **Mac**: `Cmd + Shift + R`

## 💡 使用場景

### 場景 1：Token 即將過期

LINE Channel Access Token 可能有有效期限，需要定期更新：

1. 到 LINE Developers Console 產生新 Token
2. 在應用中打開帳號設定
3. 貼上新 Token
4. 儲存並驗證
5. 完成更新，繼續使用

### 場景 2：Token 被撤銷

如果 Token 被不慎洩露或需要撤銷：

1. 在 LINE Developers Console 撤銷舊 Token
2. 產生新 Token
3. 立即在應用中更新
4. 驗證新 Token 有效

### 場景 3：遷移到新 Channel

如果需要將專案遷移到新的 LINE Channel：

1. 準備新 Channel 的 Token
2. 在應用中更新 Token
3. 舊的 Rich Menu 資料保留
4. 重新發布到新 Channel

## ⚠️ 注意事項

### 安全性

1. **不要分享 Token**：
   - Channel Access Token 具有完整的 API 權限
   - 不要截圖或分享包含 Token 的畫面

2. **定期更新**：
   - 定期更換 Token 提升安全性
   - 如有洩露疑慮，立即更換

3. **環境變數**：
   - 確保後端的 `SECRET_KEY` 安全
   - 不要將加密金鑰提交到版本控制

### 相容性

1. **瀏覽器支援**：
   - 現代瀏覽器（Chrome, Firefox, Safari, Edge）
   - 需要支援 ES6+ 和 Fetch API

2. **後端版本**：
   - Python 3.7+
   - Flask 2.0+
   - 需要安裝 `cryptography` 套件

## 📝 未來改進

### 可能的功能擴充

1. **Token 有效期顯示**：
   - 顯示 Token 的剩餘有效時間
   - 到期前提醒更新

2. **Token 測試**：
   - 不儲存的情況下測試 Token
   - 顯示 Bot 資訊（名稱、頭像）

3. **多 Token 管理**：
   - 儲存多個備用 Token
   - 自動切換失效的 Token

4. **操作日誌**：
   - 記錄 Token 更新時間
   - 顯示更新歷史

---

**功能完成日期**：2024-10-21  
**版本**：1.0  
**狀態**：✅ 已完成並測試

