# config.py - Configuration for Flask Rich Menu Editor

import os

# 基本設定
SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
PORT = int(os.environ.get('PORT', 1153))
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# 資料庫設定
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

# 檔案上傳設定（LINE Flex 影片上限為 200 MB，另留 multipart 邊界空間）
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 205 * 1024 * 1024

# Cloudflare R2 影片儲存設定
# R2_PUBLIC_BASE_URL 必須是可由 LINE 直接讀取的 HTTPS 自訂網域或 r2.dev 網址。
R2_ACCOUNT_ID = os.environ.get('R2_ACCOUNT_ID', '').strip()
R2_ACCESS_KEY_ID = os.environ.get('R2_ACCESS_KEY_ID', '').strip()
R2_SECRET_ACCESS_KEY = os.environ.get('R2_SECRET_ACCESS_KEY', '').strip()
R2_BUCKET_NAME = os.environ.get('R2_BUCKET_NAME', '').strip()
R2_PUBLIC_BASE_URL = os.environ.get('R2_PUBLIC_BASE_URL', '').strip().rstrip('/')
R2_KEY_PREFIX = os.environ.get('R2_KEY_PREFIX', 'line-richmenu').strip().strip('/')
# R2 bucket 沒有硬容量上限；此值只用來呈現每月免費/預算參考線。
R2_DISPLAY_QUOTA_GB = float(os.environ.get('R2_DISPLAY_QUOTA_GB', '10'))

# IP 白名單（只允許這些 IP 存取）
ALLOWED_IPS = [
    '220.133.28.115',  # 允許的 IP 1
    '114.33.21.210',   # 允許的 IP 2
    '127.0.0.1',       # localhost for testing
    '::1',             # IPv6 localhost
    '192.168.50.1',
    '125.228.120.214'
]

# LINE Login API 端點（預留）
LINE_LOGIN_VERIFY_API = os.environ.get('LINE_LOGIN_VERIFY_API', '')

# LINE API 基礎 URL
LINE_API_BASE = 'https://api.line.me'
LINE_API_DATA_BASE = 'https://api-data.line.me'

# Socket.IO 設定
SOCKETIO_MESSAGE_QUEUE = None
SOCKETIO_CORS_ALLOWED_ORIGINS = '*'

# 確保上傳資料夾存在
os.makedirs(UPLOAD_FOLDER, exist_ok=True)

