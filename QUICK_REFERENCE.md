# 快速參考指南 🚀

## 常用命令

### 本機開發

```bash
# 啟動應用
cd flask
source venv/bin/activate
python app.py

# 初始化資料庫
python db.py

# 測試基本功能
python test_basic.py
```

### 伺服器管理

```bash
# 查看服務狀態
sudo systemctl status richmenu-editor

# 啟動服務
sudo systemctl start richmenu-editor

# 停止服務
sudo systemctl stop richmenu-editor

# 重啟服務
sudo systemctl restart richmenu-editor

# 查看即時日誌
sudo journalctl -u richmenu-editor -f

# 查看最近 100 行日誌
sudo journalctl -u richmenu-editor -n 100
```

### NGINX

```bash
# 測試配置
sudo nginx -t

# 重新載入配置
sudo systemctl reload nginx

# 重啟 NGINX
sudo systemctl restart nginx

# 查看錯誤日誌
sudo tail -f /var/log/nginx/error.log
```

### 資料庫

```bash
# 進入 SQLite
sqlite3 database.db

# 常用 SQL 命令
.tables                          # 列出所有資料表
.schema accounts                 # 查看 accounts 表結構
SELECT * FROM accounts;          # 查詢所有帳號
SELECT * FROM projects WHERE account_id = 1;  # 查詢專案
.exit                            # 退出

# 備份資料庫
cp database.db database_backup_$(date +%Y%m%d).db

# 查看資料庫大小
du -h database.db
```

## 檔案路徑

```
應用目錄：/path/to/flask/
資料庫：/path/to/flask/database.db
上傳資料夾：/path/to/flask/uploads/
加密金鑰：/path/to/flask/.encryption_key
日誌：journalctl -u richmenu-editor
NGINX 配置：/etc/nginx/sites-available/nginx_line-setting.conf
Systemd 服務：/etc/systemd/system/richmenu-editor.service
```

## API 端點

### REST API (`/api`)

```
GET    /api/accounts              列出所有帳號
POST   /api/accounts              新增帳號
GET    /api/accounts/:id          取得帳號
DELETE /api/accounts/:id          刪除帳號

GET    /api/accounts/:id/projects 列出專案
POST   /api/projects              建立專案
GET    /api/projects/:id          取得專案
PUT    /api/projects/:id          更新專案
DELETE /api/projects/:id          刪除專案

POST   /api/projects/:id/richmenus    新增 Rich Menu
GET    /api/richmenus/:id             取得 Rich Menu
PUT    /api/richmenus/:id             更新 Rich Menu
DELETE /api/richmenus/:id             刪除 Rich Menu
POST   /api/richmenus/:id/upload      上傳圖片

GET    /api/accounts/:id/aliases  列出 Alias
POST   /api/aliases               建立 Alias
DELETE /api/aliases/:aid/:aliasId 刪除 Alias
```

### LINE API 代理 (`/proxy`)

```
GET    /proxy/v2/bot/richmenu/list
POST   /proxy/v2/bot/richmenu
POST   /proxy/v2/bot/richmenu/:id/content
DELETE /proxy/v2/bot/richmenu/:id

POST   /proxy/v2/bot/user/all/richmenu/:id
DELETE /proxy/v2/bot/user/all/richmenu
POST   /proxy/v2/bot/user/:uid/richmenu/:id
DELETE /proxy/v2/bot/user/:uid/richmenu

POST   /proxy/v2/bot/richmenu/alias
POST   /proxy/v2/bot/richmenu/alias/:id
DELETE /proxy/v2/bot/richmenu/alias/:id
```

## Socket.IO 事件

### 客戶端發送

```javascript
socket.emit('join_project', {
    project_id: 'xxx',
    user_id: 'xxx',
    user_name: 'xxx',
    color: '#02a568'
});

socket.emit('leave_project', {
    project_id: 'xxx'
});

socket.emit('cursor:move', {
    project_id: 'xxx',
    x: 100,
    y: 200,
    user_id: 'xxx',
    user_name: 'xxx',
    color: '#02a568'
});

socket.emit('richmenu:update_areas', {
    project_id: 'xxx',
    rich_menu_id: 'xxx',
    areas: [...],
    sender: 'xxx'
});
```

### 伺服器發送

```javascript
// 使用者加入
socket.on('user:joined', (data) => {
    // data: {user_id, user_name, color}
});

// 使用者離開
socket.on('user:left', (data) => {
    // data: {user_id, user_name}
});

// 游標移動
socket.on('cursor:move', (data) => {
    // data: {x, y, user_id, user_name, color}
});

// Rich Menu 更新
socket.on('richmenu:update_areas', (data) => {
    // data: {rich_menu_id, areas, sender}
});
```

## 環境變數

```bash
# 必要環境變數
export SECRET_KEY="your-secret-key"
export PORT=1153
export DEBUG=False

# 可選環境變數
export ALLOWED_IPS="114.33.21.210,127.0.0.1"
export LINE_LOGIN_VERIFY_API="https://your-api.com/verify"
export ENCRYPTION_KEY="base64-encoded-key"
```

## 常見問題快速修復

### 服務無法啟動
```bash
# 查看詳細錯誤
sudo journalctl -u richmenu-editor -n 50 --no-pager

# 手動測試
cd /path/to/flask
source venv/bin/activate
python app.py
```

### Socket.IO 連線失敗
```bash
# 檢查 NGINX 配置
sudo nginx -t
sudo cat /etc/nginx/sites-enabled/nginx_line-setting.conf

# 檢查防火牆
sudo ufw status
sudo firewall-cmd --list-all

# 測試直連
curl http://localhost:1153
```

### 資料庫鎖定
```bash
# 檢查使用情況
lsof database.db

# 重啟服務
sudo systemctl restart richmenu-editor
```

### 圖片無法顯示
```bash
# 檢查權限
ls -la uploads/
sudo chown -R your-user:your-group uploads/
chmod 755 uploads/
chmod 644 uploads/*
```

### 記憶體不足
```bash
# 查看記憶體使用
free -h
ps aux --sort=-%mem | head

# 重啟服務釋放記憶體
sudo systemctl restart richmenu-editor
```

## 效能調整

### NGINX 快取
```nginx
location /static/ {
    alias /path/to/flask/static/;
    expires 30d;
    add_header Cache-Control "public, immutable";
}

location ~* \.(jpg|jpeg|png|gif|ico|css|js)$ {
    expires 7d;
}
```

### 壓縮
```nginx
gzip on;
gzip_types text/plain text/css application/json application/javascript;
gzip_min_length 1000;
```

### 連線限制
```nginx
limit_conn_zone $binary_remote_addr zone=addr:10m;
limit_conn addr 10;
```

## 監控指標

### 關鍵指標
- 服務運行時間（Uptime）
- 記憶體使用率
- CPU 使用率
- 資料庫大小
- uploads/ 資料夾大小
- 錯誤日誌數量
- Socket.IO 連線數

### 監控命令
```bash
# 服務運行時間
systemctl status richmenu-editor | grep Active

# 記憶體使用
ps aux | grep app.py

# 磁碟使用
df -h
du -sh uploads/
du -h database.db

# 錯誤統計
sudo journalctl -u richmenu-editor --since today | grep -i error | wc -l
```

## 備份 & 恢復

### 備份
```bash
# 備份資料庫
cp database.db backups/database_$(date +%Y%m%d_%H%M%S).db

# 備份圖片
tar -czf backups/uploads_$(date +%Y%m%d_%H%M%S).tar.gz uploads/

# 完整備份
tar -czf backups/full_backup_$(date +%Y%m%d_%H%M%S).tar.gz \
    database.db uploads/ .encryption_key
```

### 恢復
```bash
# 恢復資料庫
sudo systemctl stop richmenu-editor
cp backups/database_YYYYMMDD_HHMMSS.db database.db
sudo systemctl start richmenu-editor

# 恢復圖片
tar -xzf backups/uploads_YYYYMMDD_HHMMSS.tar.gz
```

## 安全檢查清單

- [ ] `.encryption_key` 未提交到版本控制
- [ ] `SECRET_KEY` 已更換為隨機值
- [ ] IP 白名單已啟用
- [ ] HTTPS 已配置
- [ ] 定期備份已設定
- [ ] 日誌定期審查
- [ ] 系統套件定期更新
- [ ] SSH 使用金鑰登入
- [ ] fail2ban 已配置

## 聯絡資訊

**文件版本**: 1.0.0  
**最後更新**: 2025-10-21  
**系統管理員**: [您的名字]  
**支援 Email**: [您的 Email]

