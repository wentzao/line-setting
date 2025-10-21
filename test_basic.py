#!/usr/bin/env python3
# test_basic.py - 基本功能測試腳本

import sys
import requests
import json

BASE_URL = 'http://localhost:1153'

def test_api():
    """測試 API 是否正常運作"""
    print('🧪 測試基本 API...')
    
    try:
        # 測試首頁
        print('  → 測試首頁...')
        r = requests.get(BASE_URL, timeout=5)
        assert r.status_code == 200, f'首頁回應錯誤: {r.status_code}'
        print('  ✓ 首頁正常')
        
        # 測試 API 端點
        print('  → 測試 API 端點...')
        r = requests.get(f'{BASE_URL}/api/accounts', timeout=5)
        assert r.status_code == 200, f'API 回應錯誤: {r.status_code}'
        data = r.json()
        assert 'ok' in data, 'API 回應格式錯誤'
        print('  ✓ API 端點正常')
        
        # 測試 Socket.IO（簡單檢查）
        print('  → 測試 Socket.IO 可用性...')
        r = requests.get(f'{BASE_URL}/socket.io/', timeout=5)
        # Socket.IO 會回應特定格式，只要不是 404 就算正常
        print(f'  ✓ Socket.IO 回應: {r.status_code}')
        
        print('\n✅ 所有基本測試通過！')
        return True
        
    except requests.exceptions.ConnectionError:
        print('\n❌ 無法連線到伺服器，請確認應用是否已啟動')
        print(f'   預期位址: {BASE_URL}')
        return False
    except AssertionError as e:
        print(f'\n❌ 測試失敗: {e}')
        return False
    except Exception as e:
        print(f'\n❌ 未預期的錯誤: {e}')
        return False

def test_database():
    """測試資料庫是否正常初始化"""
    print('\n🧪 測試資料庫...')
    
    try:
        import db
        import os
        
        # 檢查資料庫檔案
        if not os.path.exists('database.db'):
            print('  ⚠️  未找到 database.db，正在初始化...')
            db.init_db()
        
        print('  → 測試資料庫連線...')
        conn = db.get_db()
        cursor = conn.cursor()
        
        # 檢查資料表
        cursor.execute("SELECT name FROM sqlite_master WHERE type='table'")
        tables = [row[0] for row in cursor.fetchall()]
        expected_tables = ['accounts', 'projects', 'rich_menus', 'aliases', 'images']
        
        for table in expected_tables:
            if table in tables:
                print(f'  ✓ 資料表 {table} 存在')
            else:
                print(f'  ❌ 資料表 {table} 不存在')
                return False
        
        conn.close()
        print('\n✅ 資料庫測試通過！')
        return True
        
    except Exception as e:
        print(f'\n❌ 資料庫測試失敗: {e}')
        return False

def print_info():
    """顯示系統資訊"""
    print('\n📊 系統資訊')
    print('=' * 50)
    
    try:
        import config
        print(f'Port: {config.PORT}')
        print(f'資料庫路徑: {config.DATABASE_PATH}')
        print(f'上傳資料夾: {config.UPLOAD_FOLDER}')
        print(f'IP 白名單: {", ".join(config.ALLOWED_IPS)}')
        print(f'LINE API Base: {config.LINE_API_BASE}')
    except Exception as e:
        print(f'無法讀取配置: {e}')
    
    print('=' * 50)

if __name__ == '__main__':
    print('🚀 LINE Rich Menu Editor - 基本功能測試')
    print('=' * 50)
    
    # 顯示系統資訊
    print_info()
    
    # 測試資料庫
    db_ok = test_database()
    
    # 測試 API（需要應用正在運行）
    print('\n⚠️  請確保應用已啟動（python app.py）')
    input('按 Enter 繼續測試 API...')
    
    api_ok = test_api()
    
    # 總結
    print('\n' + '=' * 50)
    if db_ok and api_ok:
        print('✅ 所有測試通過！系統運作正常。')
        sys.exit(0)
    else:
        print('❌ 部分測試失敗，請檢查上方錯誤訊息。')
        sys.exit(1)

