# LINE Rich Menu Editor - 多人即時協作版

Flask + Socket.IO + SQLite 實現的多人即時協作 Rich Menu 編輯器。

## 功能特色

✨ **多人即時協作**
- Socket.IO 實現即時同步編輯
- 可見其他使用者的游標位置
- 自動廣播 Rich Menu 編輯變更

🔒 **安全性**
- IP 白名單保護（可設定允許的 IP）
- Channel Access Token 加密儲存
- 預留 LINE Login 驗證接口

💾 **資料持久化**
- SQLite 資料庫儲存所有資料
- 支援圖片保存與縮圖生成
- 自動資料庫備份

🌐 **部署友善**
- 支援 NGINX 反向代理
- Systemd 服務管理
- eventlet 高效能非同步處理

## 快速開始

### 1. 安裝依賴

```bash
cd flask
python3 -m venv venv
source venv/bin/activate  # Windows: venv\Scripts\activate
pip install -r requirements.txt
```

### 2. 初始化資料庫

```bash
python db.py
```

### 3. 設定環境變數（可選）

```bash
export SECRET_KEY="wentzao3887"
export PORT=1153
export DEBUG=False
export ALLOWED_IPS="114.33.21.210,127.0.0.1"
```

### 4. 啟動應用

**方式一：使用 Gunicorn（推薦）**

```bash
gunicorn -k eventlet -w 1 -b 127.0.0.1:1153 app:app
```

或使用提供的啟動腳本：

```bash
bash run.sh
```

**方式二：直接啟動（開發模式）**

```bash
python app.py
```

應用將在 `http://localhost:1153` 啟動。

## 部署到生產環境

### 方法一：使用 Systemd

1. 建立服務檔案：

```bash
sudo nano /etc/systemd/system/richmenu-editor.service
```

2. 貼上以下內容（修改路徑）：

```ini
[Unit]
Description=LINE Rich Menu Editor
After=network.target

[Service]
Type=simple
User=your-user
WorkingDirectory=/path/to/flask
Environment="PATH=/path/to/flask/venv/bin"
Environment="SECRET_KEY=your-secret-key-here"
Environment="PORT=1153"
ExecStart=/path/to/flask/venv/bin/python app.py
Restart=always
RestartSec=10

[Install]
WantedBy=multi-user.target
```

3. 啟動服務：

```bash
sudo systemctl daemon-reload
sudo systemctl enable richmenu-editor
sudo systemctl start richmenu-editor
sudo systemctl status richmenu-editor
```

4. 查看日誌：

```bash
sudo journalctl -u richmenu-editor -f
```

### 方法二：NGINX 反向代理

1. 複製 NGINX 配置：

```bash
sudo cp nginx_line-setting.conf /etc/nginx/sites-available/
sudo ln -s /etc/nginx/sites-available/nginx_line-setting.conf /etc/nginx/sites-enabled/
```

2. 測試配置：

```bash
sudo nginx -t
```

3. 重新載入 NGINX：

```bash
sudo systemctl reload nginx
```

現在可以透過 `https://line-setting.wentzao.com` 存取應用。

## 配置說明

### IP 白名單

在 `config.py` 中修改 `ALLOWED_IPS`：

```python
ALLOWED_IPS = [
    '114.33.21.210',
    '192.168.1.100',
    '127.0.0.1',
]
```

若要啟用 IP 白名單驗證，在 `app.py` 中取消註解：

```python
@app.route('/')
@check_ip_whitelist  # 取消註解這行
def index():
    return render_template('index.html')
```

### LINE Login 驗證（預留）

1. 設定驗證 API 端點：

```python
# config.py
LINE_LOGIN_VERIFY_API = "https://your-company-api.com/verify_employee"
```

2. 在前端登入後取得 `userId`，每次 API 請求帶上 header：

```javascript
fetch('/api/accounts', {
    headers: {
        'X-Line-User-Id': 'Uxxxxxxxxxxxxx'
    }
})
```

## 資料庫管理

### 備份資料庫

```bash
cp database.db database_backup_$(date +%Y%m%d).db
```

### 查看資料庫

```bash
sqlite3 database.db
.tables
.schema accounts
SELECT * FROM accounts;
.exit
```

### 重置資料庫

```bash
rm database.db
python db.py
```

## 故障排除

### Socket.IO 連線失敗

1. 檢查 NGINX 配置是否正確設定 WebSocket 升級
2. 確認防火牆允許 port 1153
3. 查看瀏覽器 Console 的錯誤訊息

### 圖片上傳失敗

1. 檢查 `uploads/` 資料夾權限
2. 確認 NGINX `client_max_body_size` 設定足夠大
3. 驗證圖片尺寸是否符合 LINE 規範（2500x1686 或 2500x843）

### 資料庫鎖定

若出現 "database is locked" 錯誤：

```bash
# 檢查是否有其他程序在使用資料庫
lsof database.db

# 重啟應用
sudo systemctl restart richmenu-editor
```

## 開發建議

### 本機開發

```bash
# 啟用 DEBUG 模式
export DEBUG=True
python app.py
```

### 監控連線使用者

在 `app.py` 中查看 `online_users` 變數，或透過 Socket.IO admin UI。

### 自訂 Socket.IO 事件

在 `app.py` 中加入新的事件處理器：

```python
@socketio.on('custom_event')
def handle_custom_event(data):
    # 處理邏輯
    emit('custom_response', {'result': 'ok'}, room=data['project_id'])
```

## 安全注意事項

⚠️ **重要**：
- 絕對不要將 `.encryption_key` 檔案提交到版本控制
- 定期更換 `SECRET_KEY`
- 在生產環境中務必啟用 IP 白名單或 LINE Login 驗證
- 定期備份 `database.db` 與 `uploads/` 資料夾
- 使用 HTTPS（透過 NGINX SSL）

## 系統需求

- Python 3.8+
- SQLite 3
- NGINX（用於反向代理）
- 至少 512MB RAM
- 建議 1GB 可用硬碟空間（用於圖片儲存）

## 授權

本專案遵循 MIT 授權條款。


現有排程我想要顯示在上方，像個卡片一樣，當使用者點擊時，會載入這個排程的設定，供使用者修改，下方的按鈕就會變成是"更新排程"(會根據有無更新內容來讓按鈕可案或不可按)
然後要有一個新增排程的卡片，點擊後會另外排一個新的排程

然後上方的排程卡片列表，被選擇的那個會有一個#02a568的外框

但同時，請維持目前的所有功能，因為目前的程式運作良好，只要更改介面就好