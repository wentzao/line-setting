# scheduler.py - 排程引擎（定時上傳 Rich Menu）

import os
import json
import logging
import requests
from datetime import datetime, timedelta, timezone
from io import BytesIO

import db
import config

logger = logging.getLogger('scheduler')
logger.setLevel(logging.INFO)

# APScheduler
from apscheduler.schedulers.background import BackgroundScheduler
from apscheduler.triggers.interval import IntervalTrigger

scheduler = None

def init_scheduler(app):
    """初始化排程器，每 15 秒檢查一次，將排程誤差控制在 15 秒內。"""
    global scheduler
    scheduler = BackgroundScheduler(daemon=True)
    scheduler.add_job(
        func=check_and_run_jobs,
        trigger=IntervalTrigger(seconds=15),
        id='scheduled_upload_checker',
        name='Check and run scheduled uploads',
        replace_existing=True
    )
    scheduler.start()
    logger.info('✓ 排程器已啟動（每 15 秒檢查一次）')


def _taipei_now():
    """統一使用帶時區的台北時間，避免手動與自動執行紀錄相差 8 小時。"""
    return datetime.now(timezone(timedelta(hours=8)))

def check_and_run_jobs():
    """檢查並執行到期的排程任務"""
    now = _taipei_now()
    
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
            
            succeeded = False
            try:
                result = _execute_job(job)
                cleanup_warnings = result.get('cleanup_warnings', [])
                switch_warnings = result.get('switch_warnings', [])
                success_message = '上傳完成'
                if cleanup_warnings:
                    success_message += f'；{len(cleanup_warnings)} 個舊版本待清理'
                if switch_warnings:
                    success_message += f'；{len(switch_warnings)} 個切換目標不存在'
                db.update_scheduled_job(job['id'],
                    last_run_at=now.isoformat(),
                    last_run_status='success',
                    last_run_message=success_message
                )
                succeeded = True
                logger.info(f'  ✅ 排程 #{job["id"]} 執行成功')
            except Exception as e:
                error_msg = str(e)[:200]
                db.update_scheduled_job(job['id'],
                    last_run_at=now.isoformat(),
                    last_run_status='error',
                    last_run_message=error_msg
                )
                logger.error(f'  ❌ 排程 #{job["id"]} 執行失敗: {error_msg}')
            
            # 僅一次排程只有在成功後才停用；失敗時保留供修正後重試。
            if job['repeat_type'] == 'once' and succeeded:
                db.update_scheduled_job(job['id'], enabled=0)
                
    except Exception as e:
        logger.error(f'❌ 排程檢查錯誤: {e}')

def execute_single_job(job_id):
    """手動觸發單一排程（供 API 呼叫）"""
    job = db.get_scheduled_job(job_id)
    if not job:
        raise ValueError(f'找不到排程 #{job_id}')
    
    try:
        result = _execute_job(job)
        now = _taipei_now().isoformat()
        cleanup_warnings = result.get('cleanup_warnings', [])
        switch_warnings = result.get('switch_warnings', [])
        message = '手動觸發成功'
        if cleanup_warnings:
            message += f'；{len(cleanup_warnings)} 個舊版本待清理'
        if switch_warnings:
            message += f'；{len(switch_warnings)} 個切換目標不存在'
        db.update_scheduled_job(job_id,
            last_run_at=now,
            last_run_status='success',
            last_run_message=message
        )
        return {
            'status': 'success',
            'message': message,
            'cleanup_warnings': cleanup_warnings,
            'switch_warnings': switch_warnings
        }
    except Exception as e:
        now = _taipei_now().isoformat()
        error_msg = str(e)[:200]
        db.update_scheduled_job(job_id,
            last_run_at=now,
            last_run_status='error',
            last_run_message=error_msg
        )
        raise

def _execute_job(job):
    """執行排程上傳任務（伺服器端重現安全版 uploadAllRichMenus 邏輯）"""
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
        if 0 <= tab_index < len(rich_menus):
            indexed_menus = [(tab_index, rich_menus[tab_index])]
        else:
            raise ValueError(f'指定的 Tab 索引 {tab_index} 超出範圍')
    else:
        indexed_menus = list(enumerate(rich_menus))

    # 先在本機完成所有驗證，任何錯誤都不能碰到 LINE 上的現有選單。
    prepared_menus = []
    for project_index, rm in indexed_menus:
        rm_name = rm.get('name') or rm.get('metadata', {}).get(
            'name', f'Rich Menu {project_index + 1}'
        )
        image_path = rm.get('image_path')
        if not image_path:
            raise ValueError(f'「{rm_name}」缺少圖片')

        full_image_path = os.path.join(config.UPLOAD_FOLDER, image_path)
        if not os.path.exists(full_image_path):
            raise ValueError(f'「{rm_name}」的圖片檔案不存在: {image_path}')

        metadata = rm.get('metadata', {})
        line_metadata = _build_line_metadata(rm_name, metadata)
        _validate_line_metadata(line_metadata)
        prepared_menus.append({
            'project_index': project_index,
            'record': rm,
            'name': rm_name,
            'alias': rm.get('alias', '').strip(),
            'metadata': line_metadata,
            'image_path': full_image_path
        })

    remote_menus = _list_remote_menus(token)
    remote_aliases = _list_remote_aliases(token)
    aliases_being_published = {
        item['alias'] for item in prepared_menus if item['alias']
    }
    switch_warnings = _find_missing_switch_targets(
        prepared_menus,
        remote_aliases,
        aliases_being_published
    )
    if switch_warnings:
        logger.warning(
            '  ⚠️ 部分切換目標不存在，選單仍會發佈：'
            + '、'.join(switch_warnings)
        )

    old_menu_ids = {}
    for item in prepared_menus:
        project_index = item['project_index']
        old_ids = {
            menu['richMenuId']
            for menu in remote_menus
            if menu.get('name') == item['metadata']['name']
        }
        stored_id = item['record'].get('rich_menu_id')
        if stored_id:
            old_ids.add(stored_id)
        old_menu_ids[project_index] = old_ids

    uploaded_menu_ids = {}
    logger.info(f'  📦 準備上傳 {len(prepared_menus)} 個 Rich Menu')

    # 先建立並上傳所有新版本。此階段不改 Alias、預設選單，也不刪舊版。
    try:
        for position, item in enumerate(prepared_menus, start=1):
            logger.info(
                f'    ({position}/{len(prepared_menus)}) '
                f'建立 Rich Menu: {item["name"]}'
            )
            rich_menu_id = _create_rich_menu(token, item['metadata'])
            uploaded_menu_ids[item['project_index']] = rich_menu_id

            logger.info(
                f'    ({position}/{len(prepared_menus)}) '
                f'上傳圖片: {os.path.basename(item["image_path"])}'
            )
            _upload_image(token, rich_menu_id, item['image_path'])
    except Exception:
        # 尚未切換任何引用，可以安全清掉這次建立的未完成版本。
        for rich_menu_id in uploaded_menu_ids.values():
            _delete_rich_menu_best_effort(token, rich_menu_id)
        raise

    # 新版本全部有圖片後，才切換 Alias。
    for item in prepared_menus:
        alias = item['alias']
        if alias:
            _sync_alias(
                token,
                alias,
                uploaded_menu_ids[item['project_index']]
            )

    # Alias 切換完成後才設定預設或綁定使用者。
    default_idx = job.get('default_menu_index', -1)
    publish_target = job.get('publish_target', 'all')
    user_ids = job.get('user_ids') or []

    if default_idx >= 0:
        default_rm_id = uploaded_menu_ids.get(default_idx)
        if not default_rm_id and 0 <= default_idx < len(rich_menus):
            default_rm_id = rich_menus[default_idx].get('rich_menu_id')
        if not default_rm_id:
            raise ValueError('指定的預設 Rich Menu 尚未上傳')
        _set_default_richmenu(token, default_rm_id)
    elif publish_target == 'all':
        first_index = prepared_menus[0]['project_index']
        _set_default_richmenu(token, uploaded_menu_ids[first_index])
    elif publish_target == 'users' and user_ids:
        first_index = prepared_menus[0]['project_index']
        for uid in user_ids:
            _link_richmenu_to_user(
                token, uid, uploaded_menu_ids[first_index]
            )

    # 遠端切換完成後才保存新 ID，最後清掉同名舊版本。
    for item in prepared_menus:
        rm = item['record']
        new_id = uploaded_menu_ids[item['project_index']]
        if isinstance(rm.get('id'), int):
            db.update_rich_menu(rm['id'], rich_menu_id=new_id)
        logger.info(f'    ✅ 已上傳 Rich Menu: {item["name"]} -> {new_id}')

    cleanup_warnings = []
    for project_index, ids in old_menu_ids.items():
        new_id = uploaded_menu_ids[project_index]
        for old_id in ids:
            if old_id == new_id:
                continue
            try:
                _delete_rich_menu(token, old_id)
            except Exception as exc:
                cleanup_warnings.append(str(exc))
                logger.warning(f'    ⚠️ 舊版清理失敗: {exc}')

    return {
        'cleanup_warnings': cleanup_warnings,
        'switch_warnings': switch_warnings
    }


# === LINE API 伺服器端直接呼叫 ===

LINE_BASE = config.LINE_API_BASE
LINE_DATA_BASE = config.LINE_API_DATA_BASE

def _build_line_metadata(name, metadata):
    """組裝 LINE Rich Menu metadata"""
    areas = metadata.get('areas', [])
    line_areas = []
    
    for area in areas:
        action = _normalize_action(area.get('action'))
        if not action:
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


def _normalize_action(action):
    """轉成 LINE Rich Menu API 接受的動作格式，與前端 normalizeAction 一致。"""
    if not action or not action.get('type') or action.get('type') == 'none':
        return None

    action_type = action['type']
    if action_type == 'uri':
        return {'type': 'uri', 'uri': action.get('uri', '')}
    if action_type == 'message':
        return {'type': 'message', 'text': action.get('text', '')}
    if action_type in ('postback', 'flex'):
        normalized = {
            'type': 'postback',
            'data': action.get('data', '')
        }
        if action.get('displayText'):
            normalized['displayText'] = action['displayText']
        return normalized
    if action_type == 'richmenuswitch':
        normalized = {
            'type': 'richmenuswitch',
            'richMenuAliasId': action.get('richMenuAliasId', '')
        }
        if action.get('data'):
            normalized['data'] = action['data']
        return normalized

    raise ValueError(f'不支援的動作類型：{action_type}')


def _validate_line_metadata(metadata):
    """在碰觸 LINE 現有資料前完成必要欄位驗證。"""
    if not metadata.get('name') or not metadata.get('chatBarText'):
        raise ValueError('Rich Menu 名稱與 Chat Bar 文字不能為空')
    if len(metadata['chatBarText']) > 14:
        raise ValueError('Chat Bar 文字不能超過 14 字')

    size = metadata.get('size') or {}
    width = size.get('width', 0)
    height = size.get('height', 0)
    issues = []

    for index, area in enumerate(metadata.get('areas') or []):
        bounds = area.get('bounds') or {}
        x = bounds.get('x', 0)
        y = bounds.get('y', 0)
        area_width = bounds.get('width', 0)
        area_height = bounds.get('height', 0)
        if x < 0 or y < 0 or area_width <= 0 or area_height <= 0:
            issues.append(f'areas[{index}].bounds 非法')
        elif x + area_width > width or y + area_height > height:
            issues.append(f'areas[{index}].bounds 超出畫布')

        action = area.get('action') or {}
        action_type = action.get('type')
        if action_type == 'uri' and not action.get('uri'):
            issues.append(f'areas[{index}].action.uri 必須指定')
        elif action_type == 'message' and not action.get('text'):
            issues.append(f'areas[{index}].action.text 必須指定')
        elif action_type == 'postback' and not action.get('data'):
            issues.append(f'areas[{index}].action.data 必須指定')
        elif action_type == 'richmenuswitch' and not action.get('richMenuAliasId'):
            issues.append(f'areas[{index}].action.richMenuAliasId 必須指定')

    if issues:
        raise ValueError('\n'.join(issues))


def _find_missing_switch_targets(prepared_menus, remote_aliases, aliases_being_published):
    """找出不存在的切換 Alias；回報警告，但不讓整次部署失敗。"""
    available_aliases = set(remote_aliases) | set(aliases_being_published)
    missing = []
    for item in prepared_menus:
        for area in item['metadata'].get('areas', []):
            action = area.get('action') or {}
            if action.get('type') != 'richmenuswitch':
                continue
            alias_id = action.get('richMenuAliasId')
            if alias_id and alias_id not in available_aliases:
                missing.append(f'{item["name"]} → {alias_id}')
    return missing


def _list_remote_menus(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(f'{LINE_BASE}/v2/bot/richmenu/list', headers=headers, timeout=30)
    if r.status_code != 200:
        raise ValueError(f'列出 Rich Menu 失敗 ({r.status_code}): {r.text[:200]}')
    return r.json().get('richmenus', [])


def _list_remote_aliases(token):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.get(
        f'{LINE_BASE}/v2/bot/richmenu/alias/list',
        headers=headers,
        timeout=30
    )
    if r.status_code != 200:
        raise ValueError(f'列出 Alias 失敗 ({r.status_code}): {r.text[:200]}')
    return {
        alias['richMenuAliasId']: alias['richMenuId']
        for alias in r.json().get('aliases', [])
    }


def _delete_rich_menu(token, rich_menu_id):
    headers = {'Authorization': f'Bearer {token}'}
    r = requests.delete(
        f'{LINE_BASE}/v2/bot/richmenu/{rich_menu_id}',
        headers=headers,
        timeout=30
    )
    if r.status_code not in (200, 404):
        raise ValueError(
            f'刪除舊 Rich Menu 失敗 ({r.status_code}): {r.text[:200]}'
        )


def _delete_rich_menu_best_effort(token, rich_menu_id):
    try:
        _delete_rich_menu(token, rich_menu_id)
    except Exception as exc:
        logger.warning(f'    ⚠️ 清理未完成新版本失敗: {exc}')

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
    if r.status_code == 404:
        # 嘗試建立
        r = requests.post(
            f'{LINE_BASE}/v2/bot/richmenu/alias',
            headers=headers,
            json={'richMenuAliasId': alias_id, 'richMenuId': rich_menu_id},
            timeout=30
        )
    if r.status_code != 200:
        raise ValueError(
            f'同步 Alias「{alias_id}」失敗 ({r.status_code}): {r.text[:200]}'
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
        raise ValueError(
            f'綁定使用者 {user_id} 失敗 ({r.status_code}): {r.text[:200]}'
        )
