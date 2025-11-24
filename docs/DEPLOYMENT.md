# 部署檢查清單與步驟

## 前置準備

- [ ] Linux 伺服器（建議 Ubuntu 20.04+ 或 CentOS 8+）
- [ ] Python 3.8 或更高版本
- [ ] NGINX 已安裝
- [ ] SSL 證書已配置（`/etc/nginx/ssl/fullchain.pem` 與 `privkey.pem`）
- [ ] Port 1153 可用
- [ ] 網域 `line-setting.wentzao.com` 已指向伺服器

## 部署步驟

### 1. 上傳檔案到伺服器

```bash
# 在本機
scp -r flask/ user@your-server:/home/user/richmenu-editor/

# 或使用 rsync
rsync -avz --progress flask/ user@your-server:/home/user/richmenu-editor/flask/
```

### 2. 在伺服器上設定

```bash
# SSH 登入伺服器
ssh user@your-server

# 進入專案目錄
cd /home/user/richmenu-editor/flask

# 建立虛擬環境
python3 -m venv venv

# 啟動虛擬環境
source venv/bin/activate

# 安裝依賴
pip install --upgrade pip
pip install -r requirements.txt

# 初始化資料庫
python db.py
```

### 3. 測試應用

```bash
# 啟動應用（測試模式）
python app.py

# 在另一個終端測試
curl http://localhost:1153

# 確認無誤後按 Ctrl+C 停止
```

### 4. 配置 Systemd 服務

```bash
# 修改服務檔案中的路徑與使用者
nano richmenu-editor.service

# 複製到 systemd 目錄
sudo cp richmenu-editor.service /etc/systemd/system/

# 重新載入 systemd
sudo systemctl daemon-reload

# 啟用服務（開機自動啟動）
sudo systemctl enable richmenu-editor

# 啟動服務
sudo systemctl start richmenu-editor

# 檢查狀態
sudo systemctl status richmenu-editor

# 查看日誌
sudo journalctl -u richmenu-editor -f
```

### 5. 配置 NGINX

```bash
# 複製 NGINX 配置
sudo cp nginx_line-setting.conf /etc/nginx/sites-available/

# 建立符號連結
sudo ln -s /etc/nginx/sites-available/nginx_line-setting.conf /etc/nginx/sites-enabled/

# 測試配置
sudo nginx -t

# 重新載入 NGINX
sudo systemctl reload nginx

# 檢查 NGINX 狀態
sudo systemctl status nginx
```

### 6. 防火牆設定

```bash
# Ubuntu/Debian (UFW)
sudo ufw allow 1153/tcp
sudo ufw allow 'Nginx Full'
sudo ufw reload

# CentOS/RHEL (firewalld)
sudo firewall-cmd --permanent --add-port=1153/tcp
sudo firewall-cmd --permanent --add-service=http
sudo firewall-cmd --permanent --add-service=https
sudo firewall-cmd --reload
```

### 7. 驗證部署

- [ ] 訪問 `https://line-setting.wentzao.com`，應顯示首頁
- [ ] 開啟瀏覽器 Console，確認 Socket.IO 連線成功
- [ ] 新增一個測試帳號
- [ ] 建立測試專案
- [ ] 上傳測試圖片
- [ ] 開啟兩個瀏覽器分頁測試多人協作

## IP 白名單設定

### 啟用 IP 白名單

1. 編輯 `config.py`：

```python
ALLOWED_IPS = [
    '114.33.21.210',
    '127.0.0.1',
]
```

2. 編輯 `app.py`，取消註解：

```python
@app.route('/')
@check_ip_whitelist  # 取消這行的註解
def index():
    return render_template('index.html')
```

3. 重啟服務：

```bash
sudo systemctl restart richmenu-editor
```

### 從 NGINX 取得真實 IP

確保 NGINX 配置包含這些 headers：

```nginx
proxy_set_header X-Real-IP $remote_addr;
proxy_set_header X-Forwarded-For $proxy_add_x_forwarded_for;
```

## LINE Login 整合（預留）

### 1. 設定驗證 API

在 `config.py` 加入：

```python
LINE_LOGIN_VERIFY_API = "https://your-company-api.wentzao.com/verify_employee"
```

### 2. 前端整合

在前端加入 LINE Login SDK 並取得 `userId`，然後在每次 API 請求加上 header：

```javascript
headers: {
    'X-Line-User-Id': lineUserId
}
```

### 3. 後端驗證

在需要驗證的路由加上裝飾器：

```python
from auth import check_line_user_auth

@api_bp.route('/some-protected-route')
@check_line_user_auth
def protected_route():
    # ...
```

## 維護作業

### 日誌查看

```bash
# 即時日誌
sudo journalctl -u richmenu-editor -f

# 查看最近 100 行
sudo journalctl -u richmenu-editor -n 100

# 查看特定時間範圍
sudo journalctl -u richmenu-editor --since "2025-01-01" --until "2025-01-02"
```

### 資料庫備份

建立定時備份腳本 `backup.sh`：

```bash
#!/bin/bash
BACKUP_DIR="/home/user/backups"
DB_PATH="/home/user/richmenu-editor/flask/database.db"
UPLOADS_DIR="/home/user/richmenu-editor/flask/uploads"

mkdir -p $BACKUP_DIR
DATE=$(date +%Y%m%d_%H%M%S)

# 備份資料庫
cp $DB_PATH "$BACKUP_DIR/database_$DATE.db"

# 備份圖片
tar -czf "$BACKUP_DIR/uploads_$DATE.tar.gz" -C $UPLOADS_DIR .

# 刪除 30 天前的備份
find $BACKUP_DIR -name "database_*.db" -mtime +30 -delete
find $BACKUP_DIR -name "uploads_*.tar.gz" -mtime +30 -delete

echo "備份完成: $DATE"
```

加入 crontab（每天凌晨 2 點備份）：

```bash
chmod +x backup.sh
crontab -e

# 加入這行
0 2 * * * /home/user/richmenu-editor/flask/backup.sh >> /home/user/backups/backup.log 2>&1
```

### 更新應用

```bash
# 進入專案目錄
cd /home/user/richmenu-editor/flask

# 啟動虛擬環境
source venv/bin/activate

# 拉取最新程式碼（如果使用 git）
# git pull origin main

# 更新依賴
pip install -r requirements.txt --upgrade

# 重啟服務
sudo systemctl restart richmenu-editor
```

### 監控與告警

使用 `monit` 監控服務：

```bash
# 安裝 monit
sudo apt install monit

# 配置
sudo nano /etc/monit/conf.d/richmenu-editor

# 加入以下內容
check process richmenu-editor matching "app.py"
    start program = "/bin/systemctl start richmenu-editor"
    stop program = "/bin/systemctl stop richmenu-editor"
    if failed host localhost port 1153 protocol http
        request "/"
        with timeout 10 seconds
        for 3 cycles
    then restart
```

## 故障排除

### 服務無法啟動

```bash
# 查看詳細錯誤
sudo journalctl -u richmenu-editor -n 50 --no-pager

# 檢查 Python 路徑
which python3
ls -la /path/to/venv/bin/python

# 手動測試
cd /path/to/flask
source venv/bin/activate
python app.py
```

### Socket.IO 連線失敗

1. 檢查瀏覽器 Console 錯誤
2. 確認 NGINX 配置正確（WebSocket 升級）
3. 測試直連：`http://your-server:1153`
4. 檢查防火牆規則

### 圖片無法顯示

```bash
# 檢查權限
ls -la uploads/
chmod 755 uploads/
chmod 644 uploads/*

# 檢查 NGINX 日誌
sudo tail -f /var/log/nginx/error.log
```

### 資料庫鎖定

```bash
# 檢查誰在使用資料庫
lsof database.db

# 重啟應用
sudo systemctl restart richmenu-editor
```

## 效能優化

### 1. 使用 Redis 作為 Session 儲存

```python
# config.py
SOCKETIO_MESSAGE_QUEUE = 'redis://localhost:6379'
```

### 2. NGINX 快取靜態資源

```nginx
location /static/ {
    alias /path/to/flask/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}
```

### 3. 壓縮回應

```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
```

## 安全加固

- [ ] 定期更新系統套件
- [ ] 使用強密碼或金鑰登入 SSH
- [ ] 禁用 root SSH 登入
- [ ] 設定 fail2ban 防止暴力破解
- [ ] 定期審查存取日誌
- [ ] 啟用 HTTPS Strict Transport Security (HSTS)

```nginx
add_header Strict-Transport-Security "max-age=31536000; includeSubDomains" always;
```

## 聯絡資訊

如有問題，請聯絡系統管理員。

