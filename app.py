# app.py - Flask + Socket.IO 主程式

from flask import Flask, render_template, request
from flask_socketio import SocketIO, emit, join_room, leave_room
import eventlet
eventlet.monkey_patch()

import config
import db
from api_routes import api_bp
from line_proxy import line_proxy_bp
from webhook import webhook_bp
from auth import check_ip_whitelist

# 初始化 Flask
app = Flask(__name__)
app.config['SECRET_KEY'] = config.SECRET_KEY
app.config['MAX_CONTENT_LENGTH'] = config.MAX_CONTENT_LENGTH

# 初始化 Socket.IO（使用 eventlet）
socketio = SocketIO(
    app,
    cors_allowed_origins=config.SOCKETIO_CORS_ALLOWED_ORIGINS,
    async_mode='eventlet'
)

# 註冊 Blueprint
app.register_blueprint(api_bp)
app.register_blueprint(line_proxy_bp)
app.register_blueprint(webhook_bp)

# 全域 CORS（允許前端呼叫）
@app.after_request
def add_cors_headers(response):
    response.headers['Access-Control-Allow-Origin'] = '*'
    response.headers['Access-Control-Allow-Headers'] = 'Origin, X-Requested-With, Content-Type, Accept, Authorization, X-Line-User-Id'
    response.headers['Access-Control-Allow-Methods'] = 'GET, POST, PUT, DELETE, OPTIONS'
    return response

# === 路由 ===

@app.route('/')
@check_ip_whitelist  # 啟用 IP 白名單保護
def index():
    """首頁"""
    return render_template('index.html')

@app.route('/privacy/wentzao-student-system')
def privacy_wentzao_student_system():
    """Chrome Web Store：文藻學生系統隱私權政策（公開頁面）。"""
    return render_template('privacy_wentzao_student_system.html')

@app.route('/privacy/line-broadcast-console')
def privacy_line_broadcast_console():
    """Chrome Web Store：文藻美語群發控制台隱私權政策（公開頁面）。"""
    return render_template('privacy_line_broadcast_console.html')

# === Socket.IO 事件 ===

# 儲存每個房間（專案）的線上使用者
online_users = {}  # {project_id: {sid: {user_id, user_name, color, rich_menu_id}}}

@socketio.on('connect')
def handle_connect():
    """客戶端連線"""
    print(f'Client connected: {request.sid}')
    emit('connected', {'sid': request.sid})

@socketio.on('disconnect')
def handle_disconnect():
    """客戶端斷線"""
    print(f'Client disconnected: {request.sid}')
    
    # 從所有房間移除該使用者
    for project_id in list(online_users.keys()):
        if request.sid in online_users[project_id]:
            user_info = online_users[project_id][request.sid]
            del online_users[project_id][request.sid]
            
            # 廣播使用者離開
            emit('user:left', {
                'user_id': user_info['user_id'],
                'user_name': user_info['user_name']
            }, room=project_id)
            
            # 如果房間已空，清理
            if not online_users[project_id]:
                del online_users[project_id]

@socketio.on('join_project')
def handle_join_project(data):
    """加入專案房間"""
    project_id = str(data.get('project_id'))
    user_id = data.get('user_id', request.sid)
    user_name = data.get('user_name', 'Anonymous')
    color = data.get('color', '#02a568')
    
    # 加入 Socket.IO 房間
    join_room(project_id)
    
    # 記錄使用者資訊
    if project_id not in online_users:
        online_users[project_id] = {}
    online_users[project_id][request.sid] = {
        'user_id': user_id,
        'user_name': user_name,
        'color': color,
        'rich_menu_id': None  # 初始尚未選擇任何標籤
    }
    
    # 廣播使用者加入
    emit('user:joined', {
        'user_id': user_id,
        'user_name': user_name,
        'color': color
    }, room=project_id, skip_sid=request.sid)
    
    # 回傳當前房間的所有使用者及其標籤狀態
    users_list = [
        {**info, 'sid': sid}
        for sid, info in online_users[project_id].items()
        if sid != request.sid
    ]
    emit('users:list', {'users': users_list})
    
    # 發送現有用戶的標籤狀態給新加入的用戶
    active_tabs = [
        {
            'user_id': info['user_id'],
            'user_name': info['user_name'],
            'color': info['color'],
            'rich_menu_id': info['rich_menu_id']
        }
        for sid, info in online_users[project_id].items()
        if sid != request.sid and info.get('rich_menu_id') is not None
    ]
    if active_tabs:
        emit('tabs:initial_state', {'active_tabs': active_tabs})
    
    print(f'User {user_name} joined project {project_id}')

@socketio.on('leave_project')
def handle_leave_project(data):
    """離開專案房間"""
    project_id = str(data.get('project_id'))
    
    # 離開 Socket.IO 房間
    leave_room(project_id)
    
    # 移除使用者記錄
    if project_id in online_users and request.sid in online_users[project_id]:
        user_info = online_users[project_id][request.sid]
        del online_users[project_id][request.sid]
        
        # 廣播使用者離開
        emit('user:left', {
            'user_id': user_info['user_id'],
            'user_name': user_info['user_name']
        }, room=project_id)
        
        # 清理空房間
        if not online_users[project_id]:
            del online_users[project_id]
        
        print(f'User {user_info["user_name"]} left project {project_id}')

# === Rich Menu 編輯同步事件 ===

@socketio.on('richmenu:update_areas')
def handle_richmenu_update_areas(data):
    """Rich Menu 區域更新"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    areas = data.get('areas')
    sender = data.get('sender', request.sid)
    
    # 廣播到房間內其他使用者
    emit('richmenu:update_areas', {
        'rich_menu_id': rich_menu_id,
        'areas': areas,
        'sender': sender
    }, room=project_id, skip_sid=request.sid)

@socketio.on('richmenu:update_metadata')
def handle_richmenu_update_metadata(data):
    """Rich Menu metadata 更新"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    metadata = data.get('metadata')
    sender = data.get('sender', request.sid)
    
    emit('richmenu:update_metadata', {
        'rich_menu_id': rich_menu_id,
        'metadata': metadata,
        'sender': sender
    }, room=project_id, skip_sid=request.sid)

@socketio.on('richmenu:new')
def handle_richmenu_new(data):
    """新增 Rich Menu"""
    project_id = str(data.get('project_id'))
    rich_menu = data.get('rich_menu')
    sender = data.get('sender', request.sid)
    
    emit('richmenu:new', {
        'rich_menu': rich_menu,
        'sender': sender
    }, room=project_id, skip_sid=request.sid)

@socketio.on('richmenu:delete')
def handle_richmenu_delete(data):
    """刪除 Rich Menu"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    sender = data.get('sender', request.sid)
    
    emit('richmenu:delete', {
        'rich_menu_id': rich_menu_id,
        'sender': sender
    }, room=project_id, skip_sid=request.sid)

# === 游標同步事件 ===

@socketio.on('cursor:move')
def handle_cursor_move(data):
    """游標移動"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')  # 新增
    relative_x = data.get('relative_x')  # 改為相對座標
    relative_y = data.get('relative_y')  # 改為相對座標
    user_id = data.get('user_id', request.sid)
    user_name = data.get('user_name', 'Anonymous')
    color = data.get('color', '#02a568')
    
    # 廣播到房間內其他使用者
    emit('cursor:move', {
        'rich_menu_id': rich_menu_id,  # 新增
        'relative_x': relative_x,  # 改為相對座標
        'relative_y': relative_y,  # 改為相對座標
        'user_id': user_id,
        'user_name': user_name,
        'color': color
    }, room=project_id, skip_sid=request.sid)

@socketio.on('cursor:leave')
def handle_cursor_leave(data):
    """游標離開 Canvas"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    user_id = data.get('user_id', request.sid)
    
    emit('cursor:leave', {
        'rich_menu_id': rich_menu_id,
        'user_id': user_id
    }, room=project_id, skip_sid=request.sid)

@socketio.on('tab:switch')
def handle_tab_switch(data):
    """Tab 切換"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    user_id = data.get('user_id', request.sid)
    user_name = data.get('user_name', 'Anonymous')
    color = data.get('color', '#02a568')
    
    # 更新用戶當前的標籤狀態
    if project_id in online_users and request.sid in online_users[project_id]:
        online_users[project_id][request.sid]['rich_menu_id'] = rich_menu_id
    
    emit('tab:switch', {
        'rich_menu_id': rich_menu_id,
        'user_id': user_id,
        'user_name': user_name,
        'color': color
    }, room=project_id, skip_sid=request.sid)

# === 鎖定機制（可選進階功能）===

@socketio.on('richmenu:lock')
def handle_richmenu_lock(data):
    """鎖定 Rich Menu（防止多人同時編輯）"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    user_id = data.get('user_id', request.sid)
    user_name = data.get('user_name', 'Anonymous')
    
    emit('richmenu:locked', {
        'rich_menu_id': rich_menu_id,
        'user_id': user_id,
        'user_name': user_name
    }, room=project_id, skip_sid=request.sid)

@socketio.on('richmenu:unlock')
def handle_richmenu_unlock(data):
    """解鎖 Rich Menu"""
    project_id = str(data.get('project_id'))
    rich_menu_id = data.get('rich_menu_id')
    user_id = data.get('user_id', request.sid)
    
    emit('richmenu:unlocked', {
        'rich_menu_id': rich_menu_id,
        'user_id': user_id
    }, room=project_id, skip_sid=request.sid)

# === 初始化資料庫（在模組載入時執行）===
db.init_db()

# === 初始化排程器 ===
import scheduler as sched_module
sched_module.init_scheduler(app)

# === 啟動應用 ===

if __name__ == '__main__':
    # 直接啟動（開發模式）
    print(f'🚀 LINE Rich Menu Editor 啟動中...')
    print(f'📍 Port: {config.PORT}')
    print(f'🔒 IP 白名單: {", ".join(config.ALLOWED_IPS)}')
    print(f'💾 資料庫: {config.DATABASE_PATH}')
    print(f'📁 上傳資料夾: {config.UPLOAD_FOLDER}')
    
    # 使用 eventlet 啟動
    socketio.run(
        app,
        host='0.0.0.0',
        port=config.PORT,
        debug=config.DEBUG
    )

