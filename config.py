# config.py - Configuration for Flask Rich Menu Editor

import os

# 基本設定
SECRET_KEY = os.environ.get('SECRET_KEY') or 'dev-secret-key-change-in-production'
PORT = int(os.environ.get('PORT', 1153))
DEBUG = os.environ.get('DEBUG', 'False').lower() == 'true'

# 資料庫設定
DATABASE_PATH = os.path.join(os.path.dirname(__file__), 'database.db')

# 圖片上傳設定
UPLOAD_FOLDER = os.path.join(os.path.dirname(__file__), 'uploads')
ALLOWED_EXTENSIONS = {'png', 'jpg', 'jpeg'}
MAX_CONTENT_LENGTH = 10 * 1024 * 1024  # 10MB

# IP 白名單（只允許這些 IP 存取）
ALLOWED_IPS = [
    '220.133.28.115',  # 允許的 IP 1
    '114.33.21.210',   # 允許的 IP 2
    '127.0.0.1',       # localhost for testing
    '::1',             # IPv6 localhost
    '192.168.50.1'
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

