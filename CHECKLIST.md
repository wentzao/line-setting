# 部署前檢查清單 ✅

使用此清單確保所有功能正常運作。

## 📦 檔案結構檢查

- [x] `app.py` - Flask 主程式
- [x] `config.py` - 配置檔
- [x] `db.py` - 資料庫操作
- [x] `api_routes.py` - REST API
- [x] `line_proxy.py` - LINE API 代理
- [x] `auth.py` - 認證中介層
- [x] `requirements.txt` - Python 依賴
- [x] `static/` 資料夾
  - [x] `app.js`
  - [x] `db.js`
  - [x] `line-api.js`
  - [x] `ui.js`
  - [x] `state.js`
  - [x] `style.css`
- [x] `templates/` 資料夾
  - [x] `index.html`
- [x] `uploads/` 資料夾
  - [x] `.gitkeep`
- [x] 文件檔案
  - [x] `README.md`
  - [x] `DEPLOYMENT.md`
  - [x] `FEATURES.md`
  - [x] `SUMMARY.md`
  - [x] `CHECKLIST.md`
- [x] 配置檔案
  - [x] `nginx_line-setting.conf`
  - [x] `richmenu-editor.service`
  - [x] `.gitignore`
- [x] 腳本
  - [x] `start.sh`
  - [x] `test_basic.py`

## 🔧 本機測試

### 環境設定
- [ ] Python 3.8+ 已安裝
- [ ] 虛擬環境已建立 (`python3 -m venv venv`)
- [ ] 依賴已安裝 (`pip install -r requirements.txt`)
- [ ] 資料庫已初始化 (`python db.py`)

### 功能測試
- [ ] 應用可啟動 (`python app.py`)
- [ ] 首頁可存取 (`http://localhost:1153`)
- [ ] Socket.IO 連線成功（瀏覽器 Console 無錯誤）
- [ ] 可新增帳號
- [ ] 可建立專案
- [ ] 可上傳圖片
- [ ] 可建立區域
- [ ] 可設定動作
- [ ] JSON 預覽正確
- [ ] 多分頁測試游標同步

### API 測試
- [ ] GET `/api/accounts` 回應正確
- [ ] POST `/api/accounts` 可新增帳號
- [ ] GET `/api/projects` 回應正確
- [ ] POST `/api/projects` 可建立專案
- [ ] POST `/api/richmenus/:id/upload` 可上傳圖片

### Socket.IO 測試
- [ ] 開兩個瀏覽器分頁
- [ ] 進入相同專案
- [ ] 移動滑鼠看到對方游標
- [ ] 編輯區域對方看到更新

## 🚀 伺服器部署

### 前置準備
- [ ] 伺服器已準備好（Linux）
- [ ] Python 3.8+ 已安裝
- [ ] NGINX 已安裝
- [ ] SSL 證書已配置
- [ ] 網域已指向伺服器
- [ ] Port 1153 可用

### 檔案上傳
- [ ] 整個 `flask/` 資料夾已上傳到伺服器
- [ ] 檔案權限正確
- [ ] 虛擬環境已建立
- [ ] 依賴已安裝
- [ ] 資料庫已初始化

### Systemd 服務
- [ ] 服務檔案已修改（路徑、使用者）
- [ ] 服務檔案已複製到 `/etc/systemd/system/`
- [ ] systemd 已重新載入
- [ ] 服務已啟用（開機自動啟動）
- [ ] 服務已啟動
- [ ] 服務狀態正常（`systemctl status richmenu-editor`）
- [ ] 日誌無錯誤（`journalctl -u richmenu-editor`）

### NGINX 配置
- [ ] NGINX 配置檔已修改（如需要）
- [ ] 配置檔已複製到 `/etc/nginx/sites-available/`
- [ ] 符號連結已建立（`sites-enabled`）
- [ ] NGINX 配置測試通過（`nginx -t`）
- [ ] NGINX 已重新載入
- [ ] NGINX 狀態正常

### 防火牆
- [ ] Port 1153 已開放
- [ ] Port 80 已開放
- [ ] Port 443 已開放
- [ ] 防火牆規則已重新載入

### 驗證部署
- [ ] 訪問 `https://line-setting.wentzao.com` 顯示首頁
- [ ] HTTPS 正常運作（無證書警告）
- [ ] Socket.IO 連線成功
- [ ] 可新增帳號
- [ ] 可建立專案
- [ ] 可上傳圖片
- [ ] 多人協作功能正常

## 🔐 安全性檢查

### IP 白名單
- [ ] `config.py` 中 `ALLOWED_IPS` 已設定
- [ ] 包含 `114.33.21.210`
- [ ] 如需啟用，`app.py` 中已取消 `@check_ip_whitelist` 註解
- [ ] 從非白名單 IP 存取被拒絕（403）

### 資料加密
- [ ] `.encryption_key` 檔案已生成
- [ ] `.encryption_key` 未提交到版本控制
- [ ] Channel Access Token 在資料庫中已加密

### LINE Login（如已啟用）
- [ ] `config.py` 中 `LINE_LOGIN_VERIFY_API` 已設定
- [ ] 驗證 API 正常運作
- [ ] 前端傳送 `X-Line-User-Id` header
- [ ] 非員工無法存取

### HTTPS
- [ ] SSL 證書有效
- [ ] 強制 HTTPS（HTTP 拒絕連線）
- [ ] HSTS header 已設定（可選）

## 💾 備份設定

- [ ] 備份腳本已建立
- [ ] 備份腳本可執行
- [ ] Crontab 已設定
- [ ] 測試手動備份
- [ ] 備份資料夾權限正確

## 📊 監控設定（可選）

- [ ] Monit 已安裝並配置
- [ ] 日誌輪替已設定
- [ ] 磁碟空間監控
- [ ] CPU/記憶體監控

## 📖 文件確認

- [ ] README.md 已閱讀
- [ ] DEPLOYMENT.md 已閱讀
- [ ] FEATURES.md 已閱讀
- [ ] IP 白名單設定已記錄
- [ ] 緊急聯絡資訊已準備

## 🧪 最終測試

### 基本功能
- [ ] 可新增帳號並驗證 Token
- [ ] 可建立專案（唯一性檢查）
- [ ] 可編輯 Rich Menu
- [ ] 可上傳圖片（尺寸驗證）
- [ ] 可建立區域
- [ ] 可設定動作
- [ ] JSON 預覽正確

### 上傳與發布
- [ ] 可上傳單一 Rich Menu 到 LINE
- [ ] 可批次上傳專案內所有 Rich Menu
- [ ] 可設為預設選單
- [ ] 可綁定特定使用者
- [ ] Alias 同步正常

### 多人協作
- [ ] 兩個使用者可同時進入專案
- [ ] 游標同步顯示
- [ ] 編輯同步（待完整實作）
- [ ] 斷線重連正常

### 效能測試
- [ ] 頁面載入速度正常（< 3 秒）
- [ ] 圖片上傳速度正常
- [ ] Socket.IO 延遲可接受（< 100ms）
- [ ] 多使用者同時操作無明顯延遲

### 錯誤處理
- [ ] 無效 Token 顯示錯誤訊息
- [ ] 圖片尺寸錯誤顯示提示
- [ ] 網路錯誤顯示友善訊息
- [ ] 資料庫錯誤不會導致崩潰

## ✅ 完成確認

- [ ] 所有檢查項目已完成
- [ ] 測試帳號可正常使用
- [ ] 文件已交付給使用者
- [ ] 緊急聯絡方式已建立
- [ ] 備份計畫已執行
- [ ] 監控已上線

---

**部署人員簽名**: _______________  
**部署日期**: _______________  
**系統版本**: 1.0.0

## 📞 緊急聯絡

如遇到問題，請按照以下順序排查：

1. 查看應用日誌：`sudo journalctl -u richmenu-editor -f`
2. 查看 NGINX 日誌：`sudo tail -f /var/log/nginx/error.log`
3. 檢查服務狀態：`sudo systemctl status richmenu-editor`
4. 檢查資料庫：`sqlite3 database.db ".tables"`
5. 查閱 `DEPLOYMENT.md` 故障排除章節

**系統管理員**: [您的名字]  
**Email**: [您的 Email]  
**電話**: [您的電話]

