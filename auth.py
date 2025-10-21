# auth.py - IP白名單與LINE Login驗證中介層

from functools import wraps
from flask import request, jsonify
import requests
import config

def check_ip_whitelist(f):
    """檢查 IP 白名單的裝飾器"""
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 取得客戶端真實 IP（考慮 NGINX 反向代理）
        client_ip = request.headers.get('X-Real-IP') or \
                   request.headers.get('X-Forwarded-For', '').split(',')[0].strip() or \
                   request.remote_addr
        
        # 檢查是否在白名單中
        if client_ip not in config.ALLOWED_IPS:
            return jsonify({
                'ok': False,
                'message': f'Access denied from IP: {client_ip}. Please contact administrator.'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

def verify_line_user(user_id):
    """
    驗證 LINE 使用者是否為公司員工（預留功能）
    
    Args:
        user_id: LINE 使用者 ID
    
    Returns:
        bool: 是否為有效員工
    """
    if not config.LINE_LOGIN_VERIFY_API:
        # 如果沒有設定驗證 API，預設通過
        return True
    
    try:
        response = requests.post(
            config.LINE_LOGIN_VERIFY_API,
            json={'userId': user_id},
            timeout=5
        )
        
        if response.status_code == 200:
            data = response.json()
            return data.get('is_employee', False)
        
        return False
    
    except Exception as e:
        print(f'LINE Login 驗證失敗: {e}')
        # 驗證失敗時，基於安全考量預設拒絕
        return False

def check_line_user_auth(f):
    """
    檢查 LINE 使用者驗證的裝飾器（預留功能）
    需要客戶端在 header 中提供 X-Line-User-Id
    """
    @wraps(f)
    def decorated_function(*args, **kwargs):
        # 如果沒有設定驗證 API，跳過此檢查
        if not config.LINE_LOGIN_VERIFY_API:
            return f(*args, **kwargs)
        
        user_id = request.headers.get('X-Line-User-Id')
        
        if not user_id:
            return jsonify({
                'ok': False,
                'message': 'Missing LINE user authentication'
            }), 401
        
        if not verify_line_user(user_id):
            return jsonify({
                'ok': False,
                'message': 'LINE user not authorized'
            }), 403
        
        return f(*args, **kwargs)
    return decorated_function

