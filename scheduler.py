# scheduler.py - 排程引擎（定時上傳 Rich Menu）

import os
import json
import logging
import requests
from datetime import datetime
from io import BytesIO

import db
import config

logger = logging.getLogger('scheduler')
logger.setLevel(logging.INFO)
if not logger.handlers:
    _handler = logging.StreamHandler()
    _handler.setFormatter(logging.Formatter('%(asctime)s %(name)s %(levelname)s: %(message)s', datefmt='%Y-%m-%d %H:%M:%S'))
    logger.addHandler(_handler)

def init_scheduler(app):
    """初始化排程器，使用 eventlet green thread 每 60 秒檢查一次"""
    import eventlet
    def _loop():
        while True:
            try:
                check_and_run_jobs()
            except Exception as e:
                logger.error(f'❌ 排程迴圈錯誤: {e}')
            eventlet.sleep(60)
    eventlet.spawn(_loop)
    logger.info('✓ 排程器已啟動（每 60 秒檢查一次，eventlet green thread）')

def check_and_run_jobs():
    """檢查並執行到期的排程任務"""
    logger.info('🔍 排程檢查中...')
    try:
        import pytz
        tz = pytz.timezone('Asia/Taipei')
        now = datetime.now(tz)
    except ImportError:
        # 若沒有 pytz，使用 UTC+8 手動偏移
        from datetime import timedelta, timezone
        tz = timezone(timedelta(hours=8))
        now = datetime.now(tz)
    
    today_str = now.strftime('%Y-%m-%d')
    current_time_str = now.strftime('%H:%M')
    weekday = now.weekday()       # Monday=0
    day_of_month = now.day
    
    try:
        due_jobs = db.list_due_scheduled_jobs(today_str, current_time_str, weekday, day_of_month)
        
        if not due_jobs:
            return
        
        logger.info(f'📅 [{today_str} {current_time_str}] 發現 {len(due_jobs)} 個到期排程')
        
        for job in due_jobs:
            # 檢查是否今天已經執行過（避免重複執行）
            if job.get('last_run_at'):
                last_run_date = job['last_run_at'][:10]
                if last_run_date == today_str:
                    continue
            
            try:
                _execute_job(job)
                db.update_scheduled_job(job['id'],
                    last_run_at=now.isoformat(),
                    last_run_status='success',
                    last_run_message='上傳完成'
                )
                logger.info(f'  ✅ 排程 #{job["id"]} 執行成功')
            except Exception as e:
                error_msg = str(e)[:200]
                db.update_scheduled_job(job['id'],
                    last_run_at=now.isoformat(),
                    last_run_status='error',
                    last_run_message=error_msg
                )
                logger.error(f'  ❌ 排程 #{job["id"]} 執行失敗: {error_msg}')
            
            # 如果是 once 類型，執行後自動停用
            if job['repeat_type'] == 'once':
                db.update_scheduled_job(job['id'], enabled=0)
                
    except Exception as e:
        logger.error(f'❌ 排程檢查錯誤: {e}')

def execute_single_job(job_id):
    """手動觸發單一排程（供 API 呼叫）"""
    job = db.get_scheduled_job(job_id)
    if not job:
        raise ValueError(f'找不到排程 #{job_id}')
    
    try:
        _execute_job(job)
        now = datetime.utcnow().isoformat()
        db.update_scheduled_job(job_id,
            last_run_at=now,
            last_run_status='success',
            last_run_message='手動觸發成功'
        )
        return {'status': 'success', 'message': '上傳完成'}
    except Exception as e:
        now = datetime.utcnow().isoformat()
        error_msg = str(e)[:200]
        db.update_scheduled_job(job_id,
            last_run_at=now,
            last_run_status='error',
            last_run_message=error_msg
        )
        raise

def _execute_job(job):
    """執行排程上傳任務（伺服器端重現 uploadAllRichMenus 邏輯）"""
    logger.info(f'🚀 開始執行排程 #{job["id"]} (project_id={job["project_id"]}, scope={job.get("scope")}, repeat={job.get("repeat_type")})')
    
    project = db.get_project(job['project_id'])
    if not project:
        raise ValueError(f'找不到專案 #{job["project_id"]}')
    
    account = db.get_account(project['account_id'])
    if not account:
        raise ValueError('找不到帳號')
    
    logger.info(f'  📋 專案: {project.get("name", "?")} | 帳號 ID: {account["id"]}')
    
    token = account['channel_access_token']
    
    rich_menus = project['rich_menus']
    if not rich_menus:
        raise ValueError('專案中沒有 Rich Menu')
    
    scope = job.get('scope', 'all')
    
    if scope == 'single':
        tab_index = job.get('current_tab_index', 0)
        if tab_index < len(rich_menus):
            menus_to_upload = [rich_menus[tab_index]]
        else:
            raise ValueError(f'指定的 Tab 索引 {tab_index} 超出範圍')
    else:
        menus_to_upload = rich_menus
    
    uploaded_menu_ids = {}  # alias -> richMenuId 映射，用於後續設定預設
    logger.info(f'  📦 準備上傳 {len(menus_to_upload)} 個 Rich Menu')
    
    for i, rm in enumerate(menus_to_upload):
        rm_name = rm.get('name') or rm.get('metadata', {}).get('name', f'Rich Menu {i+1}')
        
        # 取得圖片
        image_path = rm.get('image_path')
        if not image_path:
            raise ValueError(f'「{rm_name}」缺少圖片')
        
        full_image_path = os.path.join(config.UPLOAD_FOLDER, image_path)
        if not os.path.exists(full_image_path):
            raise ValueError(f'「{rm_name}」的圖片檔案不存在: {image_path}')
        
        # 組裝 LINE API metadata
        metadata = rm.get('metadata', {})
        line_metadata = _build_line_metadata(rm_name, metadata)
        
        # 1. 刪除 LINE 端同名 Rich Menu
        logger.info(f'    ({i+1}/{len(menus_to_upload)}) 刪除同名: {rm_name}')
        _delete_same_name_menus(token, line_metadata['name'])
        
        # 2. 建立 Rich Menu
        logger.info(f'    ({i+1}/{len(menus_to_upload)}) 建立 Rich Menu: {rm_name}')
        rich_menu_id = _create_rich_menu(token, line_metadata)
        
        # 3. 上傳圖片
        logger.info(f'    ({i+1}/{len(menus_to_upload)}) 上傳圖片: {image_path}')
        _upload_image(token, rich_menu_id, full_image_path)
        
        # 4. 同步 alias
        alias = rm.get('alias', '').strip()
        if alias:
            _sync_alias(token, alias, rich_menu_id)
        
        # 5. 更新資料庫中的 rich_menu_id
        if isinstance(rm.get('id'), int):
            db.update_rich_menu(rm['id'], rich_menu_id=rich_menu_id)
        
        uploaded_menu_ids[i] = rich_menu_id
        logger.info(f'    ✅ 已上傳 Rich Menu: {rm_name} -> {rich_menu_id}')
    
    # 設定預設選單
    default_idx = job.get('default_menu_index', -1)
    if default_idx >= 0 and default_idx in uploaded_menu_ids:
        default_rm_id = uploaded_menu_ids[default_idx]
        _set_default_richmenu(token, default_rm_id)
    
    # 綁定使用者（若 publish_target 為 users）
    publish_target = job.get('publish_target', 'all')
    user_ids = job.get('user_ids') or []
    
    if publish_target == 'all' and default_idx < 0:
        # 未指定預設選單但目標是所有人，設定第一個為預設
        if 0 in uploaded_menu_ids:
            _set_default_richmenu(token, uploaded_menu_ids[0])
    elif publish_target == 'users' and user_ids:
        # 綁定特定使用者（使用第一個上傳的 Rich Menu）
        if 0 in uploaded_menu_ids:
            for uid in user_ids:
                _link_richmenu_to_user(token, uid, uploaded_menu_ids[0])


# === LINE API 伺服器端直接呼叫 ===

LINE_BASE = config.LINE_API_BASE
LINE_DATA_BASE = config.LINE_API_DATA_BASE

def _build_line_metadata(name, metadata):
    """組裝 LINE Rich Menu metadata"""
    areas = metadata.get('areas', [])
    line_areas = []
    
    for area in areas:
        action = area.get('action', {})
        if not action or action.get('type') == 'none':
            continue
        
        line_area = {
            'bounds': area.get('bounds', {'x': 0, 'y': 0, 'width': 100, 'height': 100}),
            'action': action
        }
        line_areas.append(line_area)
    
    # 確保至少有一個 area
    if not line_areas:
        line_areas = [{
            'bounds': {'x': 0, 'y': 0, 'width': 2500, 'height': 1686},
            'action': {'type': 'message', 'text': 'menu'}
        }]
    
    return {
        'size': metadata.get('size', {'width': 2500, 'height': 1686}),
        'selected': metadata.get('selected', True),
        'name': name,
        'chatBarText': metadata.get('chatBarText', name),
        'areas': line_areas
    }

def _delete_same_name_menus(token, name):
    """刪除 LINE 端同名 Rich Menu"""
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{LINE_BASE}/v2/bot/richmenu/list', headers=headers, timeout=30)
    if r.status_code != 200:
        return
    
    data = r.json()
    for menu in data.get('richmenus', []):
        if menu.get('name') == name:
            requests.delete(
                f'{LINE_BASE}/v2/bot/richmenu/{menu["richMenuId"]}',
                headers=headers, timeout=30
            )

def _create_rich_menu(token, metadata):
    """建立 Rich Menu，回傳 richMenuId"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    r = requests.post(
        f'{LINE_BASE}/v2/bot/richmenu',
        headers=headers,
        json=metadata,
        timeout=30
    )
    if r.status_code != 200:
        raise ValueError(f'建立 Rich Menu 失敗 ({r.status_code}): {r.text[:200]}')
    return r.json()['richMenuId']

def _upload_image(token, rich_menu_id, image_path):
    """上傳圖片到 Rich Menu（自動壓縮為 JPEG，確保不超過 LINE 限制）"""
    from PIL import Image
    
    MAX_BYTES = 4_500_000  # 與前端 uploadAllRichMenus 一致
    
    img = Image.open(image_path)
    # 轉為 RGB（去除 alpha channel，JPEG 不支援）
    if img.mode in ('RGBA', 'LA', 'P'):
        img = img.convert('RGB')
    
    # 嘗試不同品質，直到檔案大小低於限制
    quality = 90
    while quality >= 60:
        buf = BytesIO()
        img.save(buf, format='JPEG', quality=quality, optimize=True)
        if buf.tell() <= MAX_BYTES:
            break
        quality -= 10
    
    image_data = buf.getvalue()
    
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'image/jpeg'
    }
    r = requests.post(
        f'{LINE_DATA_BASE}/v2/bot/richmenu/{rich_menu_id}/content',
        headers=headers,
        data=image_data,
        timeout=60
    )
    if r.status_code != 200:
        raise ValueError(f'上傳圖片失敗 ({r.status_code}): {r.text[:200]}')

def _sync_alias(token, alias_id, rich_menu_id):
    """同步 alias（先嘗試更新，失敗則建立）"""
    headers = {
        'Authorization': f'Bearer {token}',
        'Content-Type': 'application/json'
    }
    # 嘗試更新
    r = requests.post(
        f'{LINE_BASE}/v2/bot/richmenu/alias/{alias_id}',
        headers=headers,
        json={'richMenuId': rich_menu_id},
        timeout=30
    )
    if r.status_code == 404 or r.status_code == 400:
        # 嘗試建立
        r = requests.post(
            f'{LINE_BASE}/v2/bot/richmenu/alias',
            headers=headers,
            json={'richMenuAliasId': alias_id, 'richMenuId': rich_menu_id},
            timeout=30
        )

def _set_default_richmenu(token, rich_menu_id):
    """設定預設 Rich Menu"""
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(
        f'{LINE_BASE}/v2/bot/user/all/richmenu/{rich_menu_id}',
        headers=headers,
        timeout=30
    )
    if r.status_code != 200:
        raise ValueError(f'設為預設失敗 ({r.status_code}): {r.text[:200]}')

def _link_richmenu_to_user(token, user_id, rich_menu_id):
    """綁定 Rich Menu 到使用者"""
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.post(
        f'{LINE_BASE}/v2/bot/user/{user_id}/richmenu/{rich_menu_id}',
        headers=headers,
        timeout=30
    )
    if r.status_code != 200:
        logger.warning(f'    ⚠️ 綁定使用者 {user_id} 失敗: {r.status_code}')
