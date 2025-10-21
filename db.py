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

if __name__ == '__main__':
    init_db()

