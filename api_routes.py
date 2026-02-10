# api_routes.py - REST API 路由（取代前端 IndexedDB）

from flask import Blueprint, request, jsonify, send_file
from werkzeug.utils import secure_filename
import os
import json
from PIL import Image
from io import BytesIO
import base64

import db
import config
from auth import check_ip_whitelist

api_bp = Blueprint('api', __name__, url_prefix='/api')

# 簡化的裝飾器應用（可選擇性啟用 IP 白名單）
def apply_auth(f):
    """應用驗證裝飾器"""
    # 啟用 IP 白名單檢查
    return check_ip_whitelist(f)

# === Accounts API ===

@api_bp.route('/accounts', methods=['GET'])
@apply_auth
def list_accounts():
    """列出所有帳號"""
    try:
        accounts = db.list_accounts()
        return jsonify({'ok': True, 'data': accounts})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/accounts', methods=['POST'])
@apply_auth
def create_account():
    """新增帳號（需驗證 Token）"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        token = data.get('channel_access_token', '').strip()
        
        if not name or not token:
            return jsonify({'ok': False, 'message': '名稱和 Token 不能為空'}), 400
        
        # 檢查名稱是否已存在
        existing = db.get_account_by_name(name)
        if existing:
            return jsonify({'ok': False, 'message': '此帳號名稱已存在'}), 400
        
        # 驗證 Token（呼叫 LINE API）
        import requests
        try:
            response = requests.get(
                f'{config.LINE_API_BASE}/v2/bot/richmenu/list',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10
            )
            if response.status_code != 200:
                return jsonify({'ok': False, 'message': 'Token 驗證失敗，請檢查是否正確'}), 400
        except Exception as e:
            return jsonify({'ok': False, 'message': f'驗證失敗: {str(e)}'}), 400
        
        # 建立帳號
        account_id = db.create_account(name, token)
        return jsonify({'ok': True, 'data': {'id': account_id, 'name': name}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/accounts/<int:account_id>', methods=['GET'])
@apply_auth
def get_account(account_id):
    """取得帳號（含 Token）"""
    try:
        account = db.get_account(account_id)
        if not account:
            return jsonify({'ok': False, 'message': '找不到帳號'}), 404
        return jsonify({'ok': True, 'data': account})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/accounts/<int:account_id>', methods=['PUT'])
@apply_auth
def update_account(account_id):
    """更新帳號（主要用於更新 Token）"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        token = data.get('channel_access_token', '').strip()
        
        if not name or not token:
            return jsonify({'ok': False, 'message': '名稱和 Token 不能為空'}), 400
        
        # 檢查帳號是否存在
        account = db.get_account(account_id)
        if not account:
            return jsonify({'ok': False, 'message': '找不到帳號'}), 404
        
        # 驗證新的 Token（呼叫 LINE API）
        import requests
        try:
            response = requests.get(
                f'{config.LINE_API_BASE}/v2/bot/richmenu/list',
                headers={'Authorization': f'Bearer {token}'},
                timeout=10
            )
            if response.status_code != 200:
                return jsonify({'ok': False, 'message': 'Token 驗證失敗，請檢查是否正確'}), 400
        except Exception as e:
            return jsonify({'ok': False, 'message': f'驗證失敗: {str(e)}'}), 400
        
        # 更新帳號
        db.update_account(account_id, name, token)
        return jsonify({'ok': True, 'data': {'id': account_id, 'name': name}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/accounts/<int:account_id>', methods=['DELETE'])
@apply_auth
def delete_account(account_id):
    """刪除帳號"""
    try:
        db.delete_account(account_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

# === Projects API ===

@api_bp.route('/accounts/<int:account_id>/projects', methods=['GET'])
@apply_auth
def list_projects(account_id):
    """列出該帳號的所有專案"""
    try:
        projects = db.list_projects_by_account(account_id)
        return jsonify({'ok': True, 'data': projects})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/projects', methods=['POST'])
@apply_auth
def create_project():
    """新建專案（唯一性檢查）"""
    try:
        data = request.get_json()
        account_id = data.get('account_id')
        name = data.get('name', '').strip()
        description = data.get('description', '')
        
        if not account_id or not name:
            return jsonify({'ok': False, 'message': '帳號 ID 和專案名稱不能為空'}), 400
        
        # 檢查唯一性
        if db.check_project_name_exists(account_id, name):
            return jsonify({'ok': False, 'message': '此帳號已存在相同專案名稱'}), 400
        
        project_id = db.create_project(account_id, name, description)
        return jsonify({'ok': True, 'data': {'id': project_id}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/projects/<int:project_id>', methods=['GET'])
@apply_auth
def get_project(project_id):
    """取得專案詳情（含所有 Rich Menu）"""
    try:
        project = db.get_project(project_id)
        if not project:
            return jsonify({'ok': False, 'message': '找不到專案'}), 404
        return jsonify({'ok': True, 'data': project})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/projects/<int:project_id>', methods=['PUT'])
@apply_auth
def update_project(project_id):
    """更新專案"""
    try:
        data = request.get_json()
        db.update_project(project_id, name=data.get('name'), description=data.get('description'))
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/projects/<int:project_id>', methods=['DELETE'])
@apply_auth
def delete_project(project_id):
    """刪除專案"""
    try:
        db.delete_project(project_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

# === Rich Menus API ===

@api_bp.route('/projects/<int:project_id>/richmenus', methods=['POST'])
@apply_auth
def create_richmenu(project_id):
    """新增 Rich Menu"""
    try:
        data = request.get_json()
        name = data.get('name', '').strip()
        alias = data.get('alias', '').strip()
        metadata = data.get('metadata')
        
        if not name:
            return jsonify({'ok': False, 'message': 'Rich Menu 名稱不能為空'}), 400
        
        rm_id = db.create_rich_menu(project_id, name, alias, metadata)
        return jsonify({'ok': True, 'data': {'id': rm_id}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/richmenus/<int:rich_menu_id>', methods=['GET'])
@apply_auth
def get_richmenu(rich_menu_id):
    """取得 Rich Menu"""
    try:
        rm = db.get_rich_menu(rich_menu_id)
        if not rm:
            return jsonify({'ok': False, 'message': '找不到 Rich Menu'}), 404
        return jsonify({'ok': True, 'data': rm})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/richmenus/<int:rich_menu_id>', methods=['PUT'])
@apply_auth
def update_richmenu(rich_menu_id):
    """更新 Rich Menu metadata"""
    try:
        data = request.get_json()
        
        # 將前端格式轉換為資料庫格式
        update_data = {}
        if 'name' in data:
            update_data['name'] = data['name']
        if 'alias' in data:
            update_data['alias'] = data['alias']
        # LINE Rich Menu ID (字串，如 "richmenu-xxx")
        if 'rich_menu_id' in data:
            update_data['rich_menu_id'] = data['rich_menu_id']
        
        if 'metadata' in data:
            meta = data['metadata']
            if 'chatBarText' in meta:
                update_data['chat_bar_text'] = meta['chatBarText']
            if 'size' in meta:
                update_data['size_width'] = meta['size']['width']
                update_data['size_height'] = meta['size']['height']
            if 'selected' in meta:
                update_data['selected'] = meta['selected']
            if 'areas' in meta:
                update_data['areas'] = meta['areas']
        
        db.update_rich_menu(rich_menu_id, **update_data)
        return jsonify({'ok': True})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/richmenus/<int:rich_menu_id>', methods=['DELETE'])
@apply_auth
def delete_richmenu(rich_menu_id):
    """刪除 Rich Menu"""
    try:
        db.delete_rich_menu(rich_menu_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/richmenus/<int:rich_menu_id>/upload', methods=['POST'])
@apply_auth
def upload_richmenu_image(rich_menu_id):
    """上傳圖片（保存原圖 + 生成縮圖）"""
    try:
        if 'image' not in request.files:
            return jsonify({'ok': False, 'message': '沒有上傳圖片'}), 400
        
        file = request.files['image']
        if file.filename == '':
            return jsonify({'ok': False, 'message': '檔案名稱為空'}), 400
        
        # 檢查檔案類型
        if not allowed_file(file.filename):
            return jsonify({'ok': False, 'message': '只接受 PNG 或 JPEG 格式'}), 400
        
        # 讀取圖片
        image_data = file.read()
        image = Image.open(BytesIO(image_data))
        
        # 驗證尺寸（2500x1686 或 2500x843 或 1200x810）
        valid_sizes = [(2500, 1686), (2500, 843), (1200, 810)]
        if image.size not in valid_sizes:
            return jsonify({
                'ok': False,
                'message': f'圖片尺寸必須為 2500x1686、2500x843 或 1200x810，目前是 {image.size[0]}x{image.size[1]}'
            }), 400
        
        # 保存原圖
        filename = secure_filename(f'rm_{rich_menu_id}_{file.filename}')
        filepath = os.path.join(config.UPLOAD_FOLDER, filename)
        with open(filepath, 'wb') as f:
            f.write(image_data)
        
        # 生成縮圖（400x266 or 400x225）
        thumb_width = 400
        thumb_height = int(thumb_width * image.size[1] / image.size[0])
        thumbnail = image.copy()
        thumbnail.thumbnail((thumb_width, thumb_height), Image.Resampling.LANCZOS)
        
        thumb_filename = f'thumb_{filename}'
        thumb_filepath = os.path.join(config.UPLOAD_FOLDER, thumb_filename)
        thumbnail.save(thumb_filepath)
        
        # 更新資料庫
        db.update_rich_menu(rich_menu_id, image_path=filename, thumbnail_path=thumb_filename)
        
        return jsonify({
            'ok': True,
            'data': {
                'image_path': filename,
                'thumbnail_path': thumb_filename
            }
        })
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/uploads/<filename>', methods=['GET'])
def get_upload(filename):
    """取得上傳的圖片"""
    try:
        filepath = os.path.join(config.UPLOAD_FOLDER, secure_filename(filename))
        if not os.path.exists(filepath):
            return jsonify({'ok': False, 'message': '檔案不存在'}), 404
        return send_file(filepath)
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

# === Aliases API ===

@api_bp.route('/accounts/<int:account_id>/aliases', methods=['GET'])
@apply_auth
def list_aliases(account_id):
    """列出 alias"""
    try:
        aliases = db.list_aliases_by_account(account_id)
        return jsonify({'ok': True, 'data': aliases})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/aliases', methods=['POST'])
@apply_auth
def create_alias():
    """建立 alias（唯一性檢查）"""
    try:
        data = request.get_json()
        account_id = data.get('account_id')
        alias_id = data.get('alias_id', '').strip()
        rich_menu_id = data.get('rich_menu_id', '').strip()
        
        if not account_id or not alias_id or not rich_menu_id:
            return jsonify({'ok': False, 'message': '缺少必要欄位'}), 400
        
        # 檢查唯一性
        existing = db.get_alias(account_id, alias_id)
        if existing:
            return jsonify({'ok': False, 'message': 'Alias 已存在'}), 400
        
        db.create_alias(account_id, alias_id, rich_menu_id)
        return jsonify({'ok': True})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/aliases/<int:account_id>/<alias_id>', methods=['DELETE'])
@apply_auth
def delete_alias(account_id, alias_id):
    """刪除 alias"""
    try:
        db.delete_alias(account_id, alias_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

# === Flex Messages API ===

@api_bp.route('/flex-messages', methods=['GET'])
@apply_auth
def list_flex_messages():
    """列出所有 Flex Messages"""
    try:
        msgs = db.list_flex_messages()
        return jsonify({'ok': True, 'data': msgs})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/flex-messages', methods=['POST'])
@apply_auth
def create_flex_message():
    """新增 Flex Message"""
    try:
        data = request.get_json()
        name = data.get('name', 'Flex Message').strip()
        json_content = data.get('json_content')
        
        if not json_content:
            return jsonify({'ok': False, 'message': 'Flex Message 內容不能為空'}), 400
        
        # 簡單驗證 JSON
        if isinstance(json_content, str):
            try:
                json_content = json.loads(json_content)
            except:
                return jsonify({'ok': False, 'message': '無效的 JSON 格式'}), 400
        
        msg_id = db.create_flex_message(name, json_content)
        return jsonify({'ok': True, 'data': {'id': msg_id, 'name': name}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/flex-messages/<int:flex_id>', methods=['GET'])
@apply_auth
def get_flex_message(flex_id):
    """取得 Flex Message (內部用)"""
    try:
        msg = db.get_flex_message(flex_id)
        if not msg:
            return jsonify({'ok': False, 'message': '找不到 Flex Message'}), 404
        return jsonify({'ok': True, 'data': msg})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/flex-messages/<int:flex_id>', methods=['PUT'])
@apply_auth
def update_flex_message(flex_id):
    """更新 Flex Message"""
    try:
        data = request.get_json()
        name = data.get('name')
        json_content = data.get('json_content')
        
        # 簡單驗證 JSON
        if json_content is not None and isinstance(json_content, str):
            try:
                json_content = json.loads(json_content)
            except:
                return jsonify({'ok': False, 'message': '無效的 JSON 格式'}), 400
        
        db.update_flex_message(flex_id, name, json_content)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/flex-messages/<int:flex_id>', methods=['DELETE'])
@apply_auth
def delete_flex_message(flex_id):
    """刪除 Flex Message"""
    try:
        db.delete_flex_message(flex_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/public/flex-messages/<int:flex_id>', methods=['GET'])
@apply_auth
def get_flex_message_public(flex_id):
    """取得 Flex Message (給外部 Bot 呼叫用)"""
    try:
        msg = db.get_flex_message(flex_id)
        if not msg:
            return jsonify({'ok': False, 'message': 'Not Found'}), 404
        
        # Return both name and contents
        return jsonify({
            'name': msg['name'],
            'contents': msg['json_content']
        })
    except Exception as e:
        return jsonify({'error': str(e)}), 500

# === Scheduled Jobs API ===

@api_bp.route('/projects/<int:project_id>/schedules', methods=['GET'])
@apply_auth
def list_schedules(project_id):
    """列出該專案的所有排程"""
    try:
        jobs = db.list_scheduled_jobs_by_project(project_id)
        return jsonify({'ok': True, 'data': jobs})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/projects/<int:project_id>/schedules', methods=['POST'])
@apply_auth
def create_schedule(project_id):
    """建立排程（含完整上傳設定快照）"""
    try:
        data = request.get_json()
        
        start_date = data.get('start_date', '').strip()
        end_date = data.get('end_date', '').strip()
        run_time = data.get('run_time', '00:00').strip()
        repeat_type = data.get('repeat_type', 'daily').strip()
        
        if not start_date or not end_date:
            return jsonify({'ok': False, 'message': '開始日期和結束日期不能為空'}), 400
        
        if start_date > end_date and repeat_type != 'once':
            return jsonify({'ok': False, 'message': '開始日期不能晚於結束日期'}), 400
        
        job_id = db.create_scheduled_job(
            project_id=project_id,
            scope=data.get('scope', 'all'),
            current_tab_index=data.get('current_tab_index', 0),
            publish_target=data.get('publish_target', 'all'),
            user_ids=data.get('user_ids'),
            default_menu_index=data.get('default_menu_index', -1),
            start_date=start_date,
            end_date=end_date,
            run_time=run_time,
            repeat_type=repeat_type,
            repeat_weekday=data.get('repeat_weekday'),
            repeat_day=data.get('repeat_day')
        )
        return jsonify({'ok': True, 'data': {'id': job_id}})
    
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/schedules/<int:job_id>', methods=['PUT'])
@apply_auth
def update_schedule(job_id):
    """更新排程"""
    try:
        data = request.get_json()
        db.update_scheduled_job(job_id, **data)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/schedules/<int:job_id>', methods=['DELETE'])
@apply_auth
def delete_schedule(job_id):
    """刪除排程"""
    try:
        db.delete_scheduled_job(job_id)
        return jsonify({'ok': True})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

@api_bp.route('/schedules/<int:job_id>/run-now', methods=['POST'])
@apply_auth
def run_schedule_now(job_id):
    """手動觸發排程執行（debug 用）"""
    try:
        from scheduler import execute_single_job
        result = execute_single_job(job_id)
        return jsonify({'ok': True, 'data': result})
    except Exception as e:
        return jsonify({'ok': False, 'message': str(e)}), 500

def allowed_file(filename):
    """檢查檔案副檔名是否允許"""
    return '.' in filename and \
           filename.rsplit('.', 1)[1].lower() in config.ALLOWED_EXTENSIONS

