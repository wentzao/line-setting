# line_proxy.py - LINE API 代理路由

from flask import Blueprint, request, Response
import requests
import config
from auth import check_ip_whitelist

line_proxy_bp = Blueprint('line_proxy', __name__, url_prefix='/proxy')

LINE_BASE = config.LINE_API_BASE
LINE_DATA_BASE = config.LINE_API_DATA_BASE

def proxy_request(upstream_url, method='GET', data=None, headers=None, is_data_api=False):
    """
    通用的代理請求函式
    
    Args:
        upstream_url: 上游 LINE API 的完整 URL
        method: HTTP 方法
        data: 請求資料（bytes 或 dict）
        headers: 額外的 headers
        is_data_api: 是否為 api-data.line.me（圖片上傳）
    """
    # 準備 headers
    auth = request.headers.get('Authorization')
    if not auth:
        return {'message': 'Missing Authorization header'}, 400
    
    request_headers = {'Authorization': auth}
    
    # 合併額外的 headers
    if headers:
        request_headers.update(headers)
    
    # 如果沒有指定 Content-Type，根據資料類型自動判斷
    if 'Content-Type' not in request_headers:
        if isinstance(data, dict):
            request_headers['Content-Type'] = 'application/json'
        elif data:
            request_headers['Content-Type'] = request.headers.get('Content-Type', 'application/octet-stream')
    
    try:
        # 發送請求到 LINE API
        if method == 'GET':
            response = requests.get(upstream_url, headers=request_headers, timeout=30)
        elif method == 'POST':
            if isinstance(data, dict):
                import json
                response = requests.post(upstream_url, headers=request_headers, json=data, timeout=30)
            else:
                response = requests.post(upstream_url, headers=request_headers, data=data, timeout=30)
        elif method == 'DELETE':
            response = requests.delete(upstream_url, headers=request_headers, timeout=30)
        else:
            return {'message': f'Unsupported method: {method}'}, 400
        
        # 回傳回應
        content_type = response.headers.get('content-type', 'application/json')
        return Response(
            response.content,
            status=response.status_code,
            content_type=content_type
        )
    
    except requests.exceptions.Timeout:
        return {'message': 'Request timeout'}, 504
    except requests.exceptions.RequestException as e:
        return {'message': f'Upstream request failed: {str(e)}'}, 502

# === Rich Menu 相關 API ===

@line_proxy_bp.route('/v2/bot/richmenu/list', methods=['GET', 'OPTIONS'])
@check_ip_whitelist
def list_richmenus():
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(f'{LINE_BASE}/v2/bot/richmenu/list', method='GET')

@line_proxy_bp.route('/v2/bot/richmenu', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def create_richmenu():
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/richmenu',
        method='POST',
        data=request.get_json()
    )

@line_proxy_bp.route('/v2/bot/richmenu/<rich_menu_id>/content', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def upload_richmenu_content(rich_menu_id):
    if request.method == 'OPTIONS':
        return '', 200
    
    # 圖片上傳需要使用 api-data.line.me
    content_type = request.headers.get('Content-Type', 'image/png')
    return proxy_request(
        f'{LINE_DATA_BASE}/v2/bot/richmenu/{rich_menu_id}/content',
        method='POST',
        data=request.get_data(),
        headers={'Content-Type': content_type},
        is_data_api=True
    )

@line_proxy_bp.route('/v2/bot/richmenu/<rich_menu_id>', methods=['DELETE', 'OPTIONS'])
@check_ip_whitelist
def delete_richmenu(rich_menu_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/richmenu/{rich_menu_id}',
        method='DELETE'
    )

# === 使用者綁定相關 API ===

@line_proxy_bp.route('/v2/bot/user/all/richmenu/<rich_menu_id>', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def set_default_richmenu(rich_menu_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/user/all/richmenu/{rich_menu_id}',
        method='POST'
    )

@line_proxy_bp.route('/v2/bot/user/all/richmenu', methods=['DELETE', 'OPTIONS'])
@check_ip_whitelist
def unset_default_richmenu():
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/user/all/richmenu',
        method='DELETE'
    )

@line_proxy_bp.route('/v2/bot/user/<user_id>/richmenu/<rich_menu_id>', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def link_richmenu_to_user(user_id, rich_menu_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/user/{user_id}/richmenu/{rich_menu_id}',
        method='POST'
    )

@line_proxy_bp.route('/v2/bot/user/<user_id>/richmenu', methods=['DELETE', 'OPTIONS'])
@check_ip_whitelist
def unlink_richmenu_from_user(user_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/user/{user_id}/richmenu',
        method='DELETE'
    )

# === Alias 相關 API ===

@line_proxy_bp.route('/v2/bot/richmenu/alias', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def create_alias():
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/richmenu/alias',
        method='POST',
        data=request.get_json()
    )

@line_proxy_bp.route('/v2/bot/richmenu/alias/<alias_id>', methods=['POST', 'OPTIONS'])
@check_ip_whitelist
def update_alias(alias_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/richmenu/alias/{alias_id}',
        method='POST',
        data=request.get_json()
    )

@line_proxy_bp.route('/v2/bot/richmenu/alias/<alias_id>', methods=['DELETE', 'OPTIONS'])
@check_ip_whitelist
def delete_alias(alias_id):
    if request.method == 'OPTIONS':
        return '', 200
    return proxy_request(
        f'{LINE_BASE}/v2/bot/richmenu/alias/{alias_id}',
        method='DELETE'
    )

