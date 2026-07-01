# db.py - SQLite Database Operations

import sqlite3
import json
from datetime import datetime
from cryptography.fernet import Fernet
import os
import config

# 加密金鑰（用於加密 Channel Access Token）
ENCRYPTION_KEY = os.environ.get('ENCRYPTION_KEY')
if not ENCRYPTION_KEY:
    # 生成並保存加密金鑰
    key_file = os.path.join(os.path.dirname(__file__), '.encryption_key')
    if os.path.exists(key_file):
        with open(key_file, 'rb') as f:
            ENCRYPTION_KEY = f.read()
    else:
        ENCRYPTION_KEY = Fernet.generate_key()
        with open(key_file, 'wb') as f:
            f.write(ENCRYPTION_KEY)
else:
    ENCRYPTION_KEY = ENCRYPTION_KEY.encode()

cipher = Fernet(ENCRYPTION_KEY)

def get_db():
    """取得資料庫連線"""
    conn = sqlite3.connect(config.DATABASE_PATH)
    conn.row_factory = sqlite3.Row  # 讓結果可以用字典方式存取
    return conn

def init_db():
    """初始化資料庫表結構"""
    conn = get_db()
    cursor = conn.cursor()
    
    # accounts 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS accounts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL UNIQUE,
            channel_access_token TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # projects 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS projects (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
            UNIQUE (account_id, name)
        )
    ''')
    
    # rich_menus 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS rich_menus (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            rich_menu_id TEXT,
            name TEXT NOT NULL,
            alias TEXT,
            chat_bar_text TEXT,
            size_width INTEGER NOT NULL DEFAULT 2500,
            size_height INTEGER NOT NULL DEFAULT 1686,
            selected BOOLEAN NOT NULL DEFAULT 1,
            areas TEXT,
            image_path TEXT,
            thumbnail_path TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
    ''')
    
    # aliases 表（用於 LINE API alias 管理）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS aliases (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            account_id INTEGER NOT NULL,
            alias_id TEXT NOT NULL,
            rich_menu_id TEXT NOT NULL,
            created_at TEXT NOT NULL,
            FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
            UNIQUE (account_id, alias_id)
        )
    ''')
    
    # images 表（圖片元數據）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS images (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            rich_menu_id INTEGER NOT NULL,
            original_path TEXT NOT NULL,
            thumbnail_path TEXT,
            content_type TEXT NOT NULL,
            size_bytes INTEGER NOT NULL,
            FOREIGN KEY (rich_menu_id) REFERENCES rich_menus (id) ON DELETE CASCADE
        )
    ''')
    
    # flex_messages 表
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS flex_messages (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            name TEXT NOT NULL,
            json_content TEXT NOT NULL,
            created_at TEXT NOT NULL
        )
    ''')
    
    # scheduled_jobs 表（定時排程上傳）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS scheduled_jobs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            project_id INTEGER NOT NULL,
            scope TEXT NOT NULL DEFAULT 'all',
            current_tab_index INTEGER DEFAULT 0,
            publish_target TEXT NOT NULL DEFAULT 'all',
            user_ids TEXT,
            default_menu_index INTEGER DEFAULT -1,
            start_date TEXT NOT NULL,
            end_date TEXT NOT NULL,
            run_time TEXT NOT NULL DEFAULT '00:00',
            repeat_type TEXT NOT NULL DEFAULT 'daily',
            repeat_weekday INTEGER,
            repeat_day INTEGER,
            enabled INTEGER NOT NULL DEFAULT 1,
            last_run_at TEXT,
            last_run_status TEXT,
            last_run_message TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (project_id) REFERENCES projects (id) ON DELETE CASCADE
        )
    ''')

    # broadcast_events 表（LINE Biz 後台手動群發續傳事件）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS broadcast_events (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            bot_id TEXT NOT NULL,
            name TEXT NOT NULL,
            description TEXT,
            status TEXT NOT NULL DEFAULT 'active',
            selected_filters TEXT,
            message_plan TEXT,
            created_by TEXT,
            created_at TEXT NOT NULL,
            updated_at TEXT NOT NULL
        )
    ''')

    # broadcast_event_contacts 表（事件的目標聯絡人快照與進度）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS broadcast_event_contacts (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            contact_id TEXT NOT NULL,
            display_name TEXT,
            profile_name TEXT,
            nickname TEXT,
            tags TEXT,
            position INTEGER NOT NULL DEFAULT 0,
            status TEXT NOT NULL DEFAULT 'pending',
            sent_count INTEGER NOT NULL DEFAULT 0,
            failed_count INTEGER NOT NULL DEFAULT 0,
            last_error TEXT,
            last_actor TEXT,
            last_sent_at TEXT,
            updated_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES broadcast_events (id) ON DELETE CASCADE,
            UNIQUE (event_id, contact_id)
        )
    ''')

    # broadcast_event_logs 表（每次送出或失敗的細節）
    cursor.execute('''
        CREATE TABLE IF NOT EXISTS broadcast_event_logs (
            id INTEGER PRIMARY KEY AUTOINCREMENT,
            event_id INTEGER NOT NULL,
            contact_id TEXT,
            message_index INTEGER,
            message_type TEXT,
            status TEXT NOT NULL,
            actor TEXT,
            error TEXT,
            created_at TEXT NOT NULL,
            FOREIGN KEY (event_id) REFERENCES broadcast_events (id) ON DELETE CASCADE
        )
    ''')

    cursor.execute('CREATE INDEX IF NOT EXISTS idx_broadcast_events_bot_id ON broadcast_events (bot_id, updated_at)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_broadcast_contacts_event_status ON broadcast_event_contacts (event_id, status)')
    cursor.execute('CREATE INDEX IF NOT EXISTS idx_broadcast_logs_event ON broadcast_event_logs (event_id, created_at)')
    
    conn.commit()
    conn.close()
    print('✓ 資料庫初始化完成')

def encrypt_token(token):
    """加密 Channel Access Token"""
    return cipher.encrypt(token.encode()).decode()

def decrypt_token(encrypted_token):
    """解密 Channel Access Token"""
    return cipher.decrypt(encrypted_token.encode()).decode()

# === Accounts API ===

def create_account(name, channel_access_token):
    """新增帳號"""
    conn = get_db()
    cursor = conn.cursor()
    encrypted_token = encrypt_token(channel_access_token)
    created_at = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO accounts (name, channel_access_token, created_at)
        VALUES (?, ?, ?)
    ''', (name, encrypted_token, created_at))
    
    conn.commit()
    account_id = cursor.lastrowid
    conn.close()
    return account_id

def get_account(account_id):
    """取得帳號（含解密 Token）"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM accounts WHERE id = ?', (account_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row['id'],
            'name': row['name'],
            'channel_access_token': decrypt_token(row['channel_access_token']),
            'created_at': row['created_at']
        }
    return None

def get_account_by_name(name):
    """透過名稱取得帳號"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM accounts WHERE name = ?', (name,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row['id'],
            'name': row['name'],
            'channel_access_token': decrypt_token(row['channel_access_token']),
            'created_at': row['created_at']
        }
    return None

def list_accounts():
    """列出所有帳號（不含 Token）"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT id, name, created_at FROM accounts ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def update_account(account_id, name, channel_access_token):
    """更新帳號"""
    conn = get_db()
    cursor = conn.cursor()
    encrypted_token = encrypt_token(channel_access_token)
    
    cursor.execute('''
        UPDATE accounts
        SET name = ?, channel_access_token = ?
        WHERE id = ?
    ''', (name, encrypted_token, account_id))
    
    conn.commit()
    conn.close()

def delete_account(account_id):
    """刪除帳號"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM accounts WHERE id = ?', (account_id,))
    conn.commit()
    conn.close()

# === Projects API ===

def create_project(account_id, name, description=''):
    """新增專案"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO projects (account_id, name, description, created_at, updated_at)
        VALUES (?, ?, ?, ?, ?)
    ''', (account_id, name, description, now, now))
    
    conn.commit()
    project_id = cursor.lastrowid
    conn.close()
    return project_id

def get_project(project_id):
    """取得專案（含所有 Rich Menu）"""
    conn = get_db()
    cursor = conn.cursor()
    
    # 取得專案基本資訊
    cursor.execute('SELECT * FROM projects WHERE id = ?', (project_id,))
    project_row = cursor.fetchone()
    
    if not project_row:
        conn.close()
        return None
    
    # 取得該專案的所有 Rich Menu
    cursor.execute('''
        SELECT * FROM rich_menus WHERE project_id = ? ORDER BY created_at ASC
    ''', (project_id,))
    rich_menu_rows = cursor.fetchall()
    
    conn.close()
    
    rich_menus = []
    for rm in rich_menu_rows:
        rich_menus.append({
            'id': rm['id'],
            'rich_menu_id': rm['rich_menu_id'],
            'name': rm['name'],
            'alias': rm['alias'],
            'metadata': {
                'size': {'width': rm['size_width'], 'height': rm['size_height']},
                'selected': bool(rm['selected']),
                'name': rm['name'],
                'chatBarText': rm['chat_bar_text'] or '',
                'areas': json.loads(rm['areas']) if rm['areas'] else []
            },
            'image_path': rm['image_path'],
            'thumbnail_path': rm['thumbnail_path'],
            'created_at': rm['created_at'],
            'updated_at': rm['updated_at']
        })
    
    return {
        'id': project_row['id'],
        'account_id': project_row['account_id'],
        'name': project_row['name'],
        'description': project_row['description'],
        'rich_menus': rich_menus,
        'created_at': project_row['created_at'],
        'updated_at': project_row['updated_at']
    }

def list_projects_by_account(account_id):
    """列出該帳號的所有專案"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id, name, description, created_at, updated_at,
               (SELECT COUNT(*) FROM rich_menus WHERE project_id = projects.id) as rich_menu_count
        FROM projects
        WHERE account_id = ?
        ORDER BY updated_at DESC
    ''', (account_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [dict(row) for row in rows]

def update_project(project_id, name=None, description=None):
    """更新專案"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    if name is not None:
        cursor.execute('''
            UPDATE projects SET name = ?, updated_at = ? WHERE id = ?
        ''', (name, now, project_id))
    
    if description is not None:
        cursor.execute('''
            UPDATE projects SET description = ?, updated_at = ? WHERE id = ?
        ''', (description, now, project_id))
    
    conn.commit()
    conn.close()

def delete_project(project_id):
    """刪除專案"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM projects WHERE id = ?', (project_id,))
    conn.commit()
    conn.close()

def check_project_name_exists(account_id, name):
    """檢查專案名稱是否已存在"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT id FROM projects WHERE account_id = ? AND name = ?
    ''', (account_id, name))
    exists = cursor.fetchone() is not None
    conn.close()
    return exists

# === Rich Menus API ===

def create_rich_menu(project_id, name, alias='', metadata=None):
    """新增 Rich Menu"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    if metadata is None:
        metadata = {
            'size': {'width': 2500, 'height': 1686},
            'selected': True,
            'name': name,
            'chatBarText': '',
            'areas': []
        }
    
    cursor.execute('''
        INSERT INTO rich_menus (
            project_id, name, alias, chat_bar_text,
            size_width, size_height, selected, areas,
            created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    ''', (
        project_id, name, alias, metadata.get('chatBarText', ''),
        metadata['size']['width'], metadata['size']['height'],
        metadata.get('selected', True),
        json.dumps(metadata.get('areas', [])),
        now, now
    ))
    
    conn.commit()
    rm_id = cursor.lastrowid
    conn.close()
    return rm_id

def get_rich_menu(rich_menu_id):
    """取得 Rich Menu"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM rich_menus WHERE id = ?', (rich_menu_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row['id'],
            'project_id': row['project_id'],
            'rich_menu_id': row['rich_menu_id'],
            'name': row['name'],
            'alias': row['alias'],
            'metadata': {
                'size': {'width': row['size_width'], 'height': row['size_height']},
                'selected': bool(row['selected']),
                'name': row['name'],
                'chatBarText': row['chat_bar_text'] or '',
                'areas': json.loads(row['areas']) if row['areas'] else []
            },
            'image_path': row['image_path'],
            'thumbnail_path': row['thumbnail_path'],
            'created_at': row['created_at'],
            'updated_at': row['updated_at']
        }
    return None

def update_rich_menu(db_id, **kwargs):
    """更新 Rich Menu
    
    Args:
        db_id: 資料庫中的 Rich Menu ID (數字)
        **kwargs: 要更新的欄位，可包含 'rich_menu_id' (LINE 的 Rich Menu ID 字串)
    """
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    allowed_fields = ['name', 'alias', 'chat_bar_text', 'rich_menu_id', 
                      'size_width', 'size_height', 'selected', 'areas',
                      'image_path', 'thumbnail_path']
    
    updates = []
    values = []
    
    for key, value in kwargs.items():
        if key in allowed_fields:
            if key == 'areas' and isinstance(value, (list, dict)):
                value = json.dumps(value)
            updates.append(f'{key} = ?')
            values.append(value)
    
    if updates:
        updates.append('updated_at = ?')
        values.append(now)
        values.append(db_id)
        
        sql = f'UPDATE rich_menus SET {", ".join(updates)} WHERE id = ?'
        cursor.execute(sql, values)
        conn.commit()
    
    conn.close()

def delete_rich_menu(rich_menu_id):
    """刪除 Rich Menu"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM rich_menus WHERE id = ?', (rich_menu_id,))
    conn.commit()
    conn.close()

# === Aliases API ===

def create_alias(account_id, alias_id, rich_menu_id):
    """新增 alias"""
    conn = get_db()
    cursor = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    
    cursor.execute('''
        INSERT INTO aliases (account_id, alias_id, rich_menu_id, created_at)
        VALUES (?, ?, ?, ?)
    ''', (account_id, alias_id, rich_menu_id, created_at))
    
    conn.commit()
    conn.close()

def get_alias(account_id, alias_id):
    """取得 alias"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM aliases WHERE account_id = ? AND alias_id = ?
    ''', (account_id, alias_id))
    row = cursor.fetchone()
    conn.close()
    return dict(row) if row else None

def list_aliases_by_account(account_id):
    """列出該帳號的所有 alias"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM aliases WHERE account_id = ? ORDER BY created_at DESC
    ''', (account_id,))
    rows = cursor.fetchall()
    conn.close()
    return [dict(row) for row in rows]

def update_alias(account_id, alias_id, new_rich_menu_id):
    """更新 alias 指向的 richMenuId"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        UPDATE aliases SET rich_menu_id = ? WHERE account_id = ? AND alias_id = ?
    ''', (new_rich_menu_id, account_id, alias_id))
    conn.commit()
    conn.close()

def delete_alias(account_id, alias_id):
    """刪除 alias"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        DELETE FROM aliases WHERE account_id = ? AND alias_id = ?
    ''', (account_id, alias_id))
    conn.commit()
    conn.close()

# === Flex Messages API ===

def create_flex_message(name, json_content):
    """新增 Flex Message"""
    conn = get_db()
    cursor = conn.cursor()
    created_at = datetime.utcnow().isoformat()
    
    # Ensure json_content is string
    if isinstance(json_content, dict):
        json_content = json.dumps(json_content)
        
    cursor.execute('''
        INSERT INTO flex_messages (name, json_content, created_at)
        VALUES (?, ?, ?)
    ''', (name, json_content, created_at))
    
    conn.commit()
    msg_id = cursor.lastrowid
    conn.close()
    return msg_id

def get_flex_message(flex_id):
    """取得 Flex Message"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM flex_messages WHERE id = ?', (flex_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return {
            'id': row['id'],
            'name': row['name'],
            'json_content': json.loads(row['json_content']),
            'created_at': row['created_at']
        }
    return None

def list_flex_messages():
    """列出所有 Flex Messages"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM flex_messages ORDER BY created_at DESC')
    rows = cursor.fetchall()
    conn.close()
    
    return [{
        'id': row['id'],
        'name': row['name'],
        'json_content': json.loads(row['json_content']),
        'created_at': row['created_at']
    } for row in rows]


def update_flex_message(flex_id, name=None, json_content=None):
    """更新 Flex Message"""
    conn = get_db()
    cursor = conn.cursor()
    
    updates = []
    values = []
    
    if name is not None:
        updates.append('name = ?')
        values.append(name)
    
    if json_content is not None:
        if isinstance(json_content, dict):
            json_content = json.dumps(json_content)
        updates.append('json_content = ?')
        values.append(json_content)
        
    if updates:
        values.append(flex_id)
        sql = f'UPDATE flex_messages SET {", ".join(updates)} WHERE id = ?'
        cursor.execute(sql, values)
        conn.commit()
    
    conn.close()

def delete_flex_message(flex_id):
    """刪除 Flex Message"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM flex_messages WHERE id = ?', (flex_id,))
    conn.commit()
    conn.close()


# === Scheduled Jobs API ===

def create_scheduled_job(project_id, scope='all', current_tab_index=0,
                         publish_target='all', user_ids=None,
                         default_menu_index=-1, start_date='', end_date='',
                         run_time='00:00', repeat_type='daily',
                         repeat_weekday=None, repeat_day=None):
    """新增排程任務"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    user_ids_json = json.dumps(user_ids) if user_ids else None
    
    cursor.execute('''
        INSERT INTO scheduled_jobs (
            project_id, scope, current_tab_index, publish_target, user_ids,
            default_menu_index, start_date, end_date, run_time,
            repeat_type, repeat_weekday, repeat_day,
            enabled, created_at, updated_at
        ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, 1, ?, ?)
    ''', (
        project_id, scope, current_tab_index, publish_target, user_ids_json,
        default_menu_index, start_date, end_date, run_time,
        repeat_type, repeat_weekday, repeat_day,
        now, now
    ))
    
    conn.commit()
    job_id = cursor.lastrowid
    conn.close()
    return job_id

def get_scheduled_job(job_id):
    """取得排程任務"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('SELECT * FROM scheduled_jobs WHERE id = ?', (job_id,))
    row = cursor.fetchone()
    conn.close()
    
    if row:
        return _row_to_scheduled_job(row)
    return None

def list_scheduled_jobs_by_project(project_id):
    """列出該專案的所有排程任務"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('''
        SELECT * FROM scheduled_jobs WHERE project_id = ? ORDER BY created_at DESC
    ''', (project_id,))
    rows = cursor.fetchall()
    conn.close()
    
    return [_row_to_scheduled_job(row) for row in rows]

def list_due_scheduled_jobs(today_str, current_time_str, weekday, day_of_month):
    """取得當前應執行的排程任務
    
    Args:
        today_str: 'YYYY-MM-DD'
        current_time_str: 'HH:MM'
        weekday: 0-6 (Monday=0)
        day_of_month: 1-31
    """
    conn = get_db()
    cursor = conn.cursor()
    
    # 取得所有啟用中且在日期區間內、時間匹配的排程
    cursor.execute('''
        SELECT * FROM scheduled_jobs
        WHERE enabled = 1
          AND start_date <= ?
          AND end_date >= ?
          AND run_time = ?
    ''', (today_str, today_str, current_time_str))
    
    rows = cursor.fetchall()
    conn.close()
    
    result = []
    for row in rows:
        job = _row_to_scheduled_job(row)
        repeat_type = job['repeat_type']
        
        if repeat_type == 'daily':
            result.append(job)
        elif repeat_type == 'weekly' and job.get('repeat_weekday') == weekday:
            result.append(job)
        elif repeat_type == 'monthly' and job.get('repeat_day') == day_of_month:
            result.append(job)
        elif repeat_type == 'once':
            # 僅一次：開始日期 == 今天
            if job['start_date'] == today_str:
                result.append(job)
    
    return result

def update_scheduled_job(job_id, **kwargs):
    """更新排程任務"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    
    allowed_fields = [
        'scope', 'current_tab_index', 'publish_target', 'user_ids',
        'default_menu_index', 'start_date', 'end_date', 'run_time',
        'repeat_type', 'repeat_weekday', 'repeat_day', 'enabled',
        'last_run_at', 'last_run_status', 'last_run_message'
    ]
    
    updates = []
    values = []
    
    for key, value in kwargs.items():
        if key in allowed_fields:
            if key == 'user_ids' and isinstance(value, list):
                value = json.dumps(value)
            updates.append(f'{key} = ?')
            values.append(value)
    
    if updates:
        updates.append('updated_at = ?')
        values.append(now)
        values.append(job_id)
        
        sql = f'UPDATE scheduled_jobs SET {", ".join(updates)} WHERE id = ?'
        cursor.execute(sql, values)
        conn.commit()
    
    conn.close()

def delete_scheduled_job(job_id):
    """刪除排程任務"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM scheduled_jobs WHERE id = ?', (job_id,))
    conn.commit()
    conn.close()

def _row_to_scheduled_job(row):
    """將資料庫 row 轉換為排程任務 dict"""
    user_ids = None
    if row['user_ids']:
        try:
            user_ids = json.loads(row['user_ids'])
        except (json.JSONDecodeError, TypeError):
            user_ids = None
    
    return {
        'id': row['id'],
        'project_id': row['project_id'],
        'scope': row['scope'],
        'current_tab_index': row['current_tab_index'],
        'publish_target': row['publish_target'],
        'user_ids': user_ids,
        'default_menu_index': row['default_menu_index'],
        'start_date': row['start_date'],
        'end_date': row['end_date'],
        'run_time': row['run_time'],
        'repeat_type': row['repeat_type'],
        'repeat_weekday': row['repeat_weekday'],
        'repeat_day': row['repeat_day'],
        'enabled': bool(row['enabled']),
        'last_run_at': row['last_run_at'],
        'last_run_status': row['last_run_status'],
        'last_run_message': row['last_run_message'],
        'created_at': row['created_at'],
        'updated_at': row['updated_at']
    }


# === Broadcast Events API ===

def _json_dumps(value):
    return json.dumps(value, ensure_ascii=False) if value is not None else None

def _json_loads(value, fallback=None):
    if value in (None, ''):
        return fallback
    try:
        return json.loads(value)
    except (json.JSONDecodeError, TypeError):
        return fallback

def create_broadcast_event(bot_id, name, description='', selected_filters=None,
                           message_plan=None, contacts=None, created_by=''):
    """建立可續傳的群發事件，並可同步寫入目標聯絡人快照"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    cursor.execute('''
        INSERT INTO broadcast_events (
            bot_id, name, description, status, selected_filters,
            message_plan, created_by, created_at, updated_at
        ) VALUES (?, ?, ?, 'active', ?, ?, ?, ?, ?)
    ''', (
        bot_id, name, description, _json_dumps(selected_filters or {}),
        _json_dumps(message_plan or []), created_by, now, now
    ))
    event_id = cursor.lastrowid

    if contacts:
        _upsert_broadcast_contacts(cursor, event_id, contacts, now)

    conn.commit()
    conn.close()
    return event_id

def list_broadcast_events(bot_id=None, limit=50):
    """列出群發事件，包含每個事件的進度摘要"""
    conn = get_db()
    cursor = conn.cursor()
    params = []
    where = ''
    if bot_id:
        where = 'WHERE e.bot_id = ?'
        params.append(bot_id)

    params.append(limit)
    cursor.execute(f'''
        SELECT
            e.*,
            COUNT(c.id) AS total_contacts,
            SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END) AS sent_contacts,
            SUM(CASE WHEN c.status = 'failed' THEN 1 ELSE 0 END) AS failed_contacts,
            SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) AS pending_contacts
        FROM broadcast_events e
        LEFT JOIN broadcast_event_contacts c ON c.event_id = e.id
        {where}
        GROUP BY e.id
        ORDER BY e.updated_at DESC
        LIMIT ?
    ''', params)
    rows = cursor.fetchall()
    conn.close()
    return [_row_to_broadcast_event(row, include_details=False) for row in rows]

def get_broadcast_event(event_id):
    """取得單一群發事件，包含聯絡人快照與最近紀錄"""
    conn = get_db()
    cursor = conn.cursor()

    cursor.execute('''
        SELECT
            e.*,
            COUNT(c.id) AS total_contacts,
            SUM(CASE WHEN c.status = 'sent' THEN 1 ELSE 0 END) AS sent_contacts,
            SUM(CASE WHEN c.status = 'failed' THEN 1 ELSE 0 END) AS failed_contacts,
            SUM(CASE WHEN c.status = 'pending' THEN 1 ELSE 0 END) AS pending_contacts
        FROM broadcast_events e
        LEFT JOIN broadcast_event_contacts c ON c.event_id = e.id
        WHERE e.id = ?
        GROUP BY e.id
    ''', (event_id,))
    event_row = cursor.fetchone()
    if not event_row:
        conn.close()
        return None

    cursor.execute('''
        SELECT * FROM broadcast_event_contacts
        WHERE event_id = ?
        ORDER BY position ASC, id ASC
    ''', (event_id,))
    contact_rows = cursor.fetchall()

    cursor.execute('''
        SELECT * FROM broadcast_event_logs
        WHERE event_id = ?
        ORDER BY created_at DESC, id DESC
        LIMIT 100
    ''', (event_id,))
    log_rows = cursor.fetchall()
    conn.close()

    event = _row_to_broadcast_event(event_row, include_details=True)
    event['contacts'] = [_row_to_broadcast_contact(row) for row in contact_rows]
    event['logs'] = [dict(row) for row in log_rows]
    return event

def update_broadcast_event(event_id, **kwargs):
    """更新群發事件 metadata 或狀態"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    allowed_fields = ['name', 'description', 'status', 'selected_filters', 'message_plan']
    updates = []
    values = []

    for key, value in kwargs.items():
        if key in allowed_fields:
            if key in ['selected_filters', 'message_plan'] and not isinstance(value, str):
                value = _json_dumps(value)
            updates.append(f'{key} = ?')
            values.append(value)

    if updates:
        updates.append('updated_at = ?')
        values.append(now)
        values.append(event_id)
        cursor.execute(f'UPDATE broadcast_events SET {", ".join(updates)} WHERE id = ?', values)
        conn.commit()

    conn.close()

def replace_broadcast_event_contacts(event_id, contacts):
    """以目前篩選結果取代事件聯絡人快照，保留已送狀態"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()
    _upsert_broadcast_contacts(cursor, event_id, contacts, now)
    cursor.execute('UPDATE broadcast_events SET updated_at = ? WHERE id = ?', (now, event_id))
    conn.commit()
    conn.close()

def record_broadcast_deliveries(event_id, deliveries, actor=''):
    """批次寫入發送結果，並同步更新每位聯絡人的狀態"""
    conn = get_db()
    cursor = conn.cursor()
    now = datetime.utcnow().isoformat()

    for item in deliveries:
        contact_id = item.get('contact_id')
        status = item.get('status', 'sent')
        message_index = item.get('message_index')
        message_type = item.get('message_type')
        error = item.get('error')
        item_actor = item.get('actor') or actor

        cursor.execute('''
            INSERT INTO broadcast_event_logs (
                event_id, contact_id, message_index, message_type,
                status, actor, error, created_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, ?)
        ''', (event_id, contact_id, message_index, message_type, status, item_actor, error, now))

        if contact_id:
            if status == 'sent':
                cursor.execute('''
                    UPDATE broadcast_event_contacts
                    SET status = 'sent',
                        sent_count = sent_count + 1,
                        last_error = NULL,
                        last_actor = ?,
                        last_sent_at = ?,
                        updated_at = ?
                    WHERE event_id = ? AND contact_id = ?
                ''', (item_actor, now, now, event_id, contact_id))
            elif status == 'failed':
                cursor.execute('''
                    UPDATE broadcast_event_contacts
                    SET status = 'failed',
                        failed_count = failed_count + 1,
                        last_error = ?,
                        last_actor = ?,
                        updated_at = ?
                    WHERE event_id = ? AND contact_id = ?
                ''', (error, item_actor, now, event_id, contact_id))
            elif status == 'pending':
                cursor.execute('''
                    UPDATE broadcast_event_contacts
                    SET status = 'pending',
                        last_error = NULL,
                        last_actor = ?,
                        updated_at = ?
                    WHERE event_id = ? AND contact_id = ?
                ''', (item_actor, now, event_id, contact_id))

    cursor.execute('UPDATE broadcast_events SET updated_at = ? WHERE id = ?', (now, event_id))
    conn.commit()
    conn.close()

def delete_broadcast_event(event_id):
    """刪除群發事件"""
    conn = get_db()
    cursor = conn.cursor()
    cursor.execute('DELETE FROM broadcast_events WHERE id = ?', (event_id,))
    conn.commit()
    conn.close()

def _upsert_broadcast_contacts(cursor, event_id, contacts, now):
    for index, contact in enumerate(contacts):
        contact_id = contact.get('contact_id') or contact.get('contactId')
        if not contact_id:
            continue
        display_name = contact.get('display_name') or contact.get('displayName') or ''
        profile_name = contact.get('profile_name') or contact.get('profileName') or ''
        nickname = contact.get('nickname') or ''
        tags = contact.get('tags') or []
        position = contact.get('position', index)

        cursor.execute('''
            INSERT INTO broadcast_event_contacts (
                event_id, contact_id, display_name, profile_name,
                nickname, tags, position, status, updated_at
            ) VALUES (?, ?, ?, ?, ?, ?, ?, 'pending', ?)
            ON CONFLICT(event_id, contact_id) DO UPDATE SET
                display_name = excluded.display_name,
                profile_name = excluded.profile_name,
                nickname = excluded.nickname,
                tags = excluded.tags,
                position = excluded.position,
                updated_at = excluded.updated_at
        ''', (
            event_id, contact_id, display_name, profile_name, nickname,
            _json_dumps(tags), position, now
        ))

def _row_to_broadcast_event(row, include_details=False):
    total_contacts = row['total_contacts'] if 'total_contacts' in row.keys() else 0
    sent_contacts = row['sent_contacts'] if 'sent_contacts' in row.keys() else 0
    failed_contacts = row['failed_contacts'] if 'failed_contacts' in row.keys() else 0
    pending_contacts = row['pending_contacts'] if 'pending_contacts' in row.keys() else 0
    total_contacts = total_contacts or 0
    sent_contacts = sent_contacts or 0
    failed_contacts = failed_contacts or 0
    pending_contacts = pending_contacts or 0
    progress = round((sent_contacts / total_contacts) * 100, 1) if total_contacts else 0

    event = {
        'id': row['id'],
        'bot_id': row['bot_id'],
        'name': row['name'],
        'description': row['description'],
        'status': row['status'],
        'created_by': row['created_by'],
        'created_at': row['created_at'],
        'updated_at': row['updated_at'],
        'summary': {
            'total_contacts': total_contacts,
            'sent_contacts': sent_contacts,
            'failed_contacts': failed_contacts,
            'pending_contacts': pending_contacts,
            'progress': progress
        }
    }

    if include_details:
        event['selected_filters'] = _json_loads(row['selected_filters'], {})
        event['message_plan'] = _json_loads(row['message_plan'], [])

    return event

def _row_to_broadcast_contact(row):
    return {
        'id': row['id'],
        'event_id': row['event_id'],
        'contact_id': row['contact_id'],
        'display_name': row['display_name'],
        'profile_name': row['profile_name'],
        'nickname': row['nickname'],
        'tags': _json_loads(row['tags'], []),
        'position': row['position'],
        'status': row['status'],
        'sent_count': row['sent_count'],
        'failed_count': row['failed_count'],
        'last_error': row['last_error'],
        'last_actor': row['last_actor'],
        'last_sent_at': row['last_sent_at'],
        'updated_at': row['updated_at']
    }


if __name__ == '__main__':
    init_db()
