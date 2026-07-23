// ui.js - DOM manipulation and UI logic (Flask + Socket.IO 版本)

const mainContent = document.querySelector('main');

// === Socket.IO 初始化 ===
let socket = null;
let currentProjectId = null;
let currentRichMenuId = null;  // 新增：追蹤當前編輯的 Rich Menu ID
let myUserId = generateUserId();
let myUserName = '使用者' + Math.floor(Math.random() * 1000);
let myColor = generateRandomColor();
let remoteCursors = {};  // {userId: {richMenuId, element, color, name}}
let activeEditors = {};  // 新增：追蹤其他用戶正在編輯的 Rich Menu {userId: {richMenuId, userName, color}}

function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

function generateRandomColor() {
    const colors = ['#02a568', '#1a73e8', '#e8710a', '#9334e6', '#d93025', '#0d9488'];
    return colors[Math.floor(Math.random() * colors.length)];
}

function initSocketIO() {
    if (socket) return;

    socket = io({
        transports: ['websocket', 'polling']
    });

    socket.on('connect', () => {
        console.log('✓ Socket.IO 已連線');
    });

    socket.on('disconnect', () => {
        console.log('✗ Socket.IO 已斷線');
    });

    // 使用者加入/離開
    socket.on('user:joined', (data) => {
        console.log(`${data.user_name} 加入專案`);
        showNotification(`${data.user_name} 加入協作`, 'info');
    });

    socket.on('user:left', (data) => {
        console.log(`${data.user_name} 離開專案`);
        // 移除游標
        if (remoteCursors[data.user_id]) {
            remoteCursors[data.user_id].element.remove();
            delete remoteCursors[data.user_id];
        }

        // 移除該用戶的 Tab 編輯狀態
        if (activeEditors[data.user_id]) {
            delete activeEditors[data.user_id];
            updateTabIndicators();
        }
    });

    // Rich Menu 同步
    socket.on('richmenu:update_areas', (data) => {
        if (data.sender === myUserId) return;
        console.log('收到區域更新', data);

        if (!window.editorState) return;
        const state = window.editorState;
        const targetRM = getRichMenuById(state, data.rich_menu_id);
        if (!targetRM) return;

        // 不可丟棄非目前分頁的同步資料，否則稍後 autosave 會寫回舊版本。
        targetRM.metadata.areas = data.areas;

        if (isCurrentRichMenu(state, targetRM)) {
            // 重繪畫布
            drawOverlay(state);

            // 如果當前選中的區域已被刪除，取消選擇
            if (state.selectedAreaIndex >= targetRM.metadata.areas.length) {
                state.selectedAreaIndex = -1;
                updateActionPanel(state);
            }

            // 更新 JSON 預覽
            renderJsonPreview(state);

            showNotification('其他使用者更新了區域', 'info');
        }
    });

    socket.on('richmenu:update_metadata', async (data) => {
        if (data.sender === myUserId) return;
        console.log('收到 metadata 更新', data);

        if (!window.editorState) return;
        const state = window.editorState;
        const targetRM = getRichMenuById(state, data.rich_menu_id);
        if (!targetRM) return;
        const isActive = isCurrentRichMenu(state, targetRM);

        if (data.metadata.name !== undefined) {
            targetRM.metadata.name = data.metadata.name;
        }
        if (data.metadata.chatBarText !== undefined) {
            targetRM.metadata.chatBarText = data.metadata.chatBarText;
            if (isActive) {
                // 更新 chat bar 輸入框
                const chatEl = document.getElementById('rm-chatbar');
                if (chatEl && chatEl.value !== data.metadata.chatBarText) {
                    chatEl.value = data.metadata.chatBarText;
                    // 更新字數計數
                    const counterEl = document.getElementById('chatbar-counter');
                    if (counterEl) {
                        counterEl.textContent = `${data.metadata.chatBarText.length}/14`;
                    }
                }
            }
        }
        if (data.metadata.size) {
            targetRM.metadata.size = data.metadata.size;
        }
        if (data.metadata.selected !== undefined) {
            targetRM.metadata.selected = data.metadata.selected;
        }

        if (data.metadata.imagePath) {
            targetRM.image = {
                name: data.metadata.imageName || data.metadata.imagePath,
                type: /\.jpe?g$/i.test(data.metadata.imagePath) ? 'image/jpeg' : 'image/png',
                dataUrl: `${API_BASE}/uploads/${encodeURIComponent(data.metadata.imagePath)}?v=${Date.now()}`,
                width: targetRM.metadata.size.width,
                height: targetRM.metadata.size.height,
                path: data.metadata.imagePath,
                thumbnail: data.metadata.thumbnailPath
            };
            if (isActive) await setupCanvas(state);
            showNotification('其他使用者更新了圖片', 'info');
        } else if (data.metadata.image) {
            targetRM.image = data.metadata.image;
            if (isActive) await setupCanvas(state);
            showNotification('其他使用者更新了設定', 'info');
        }

        renderTabs(state);
        if (isActive) renderJsonPreview(state);
    });

    // 游標移動同步
    socket.on('cursor:move', (data) => {
        if (data.user_id === myUserId) return;

        // 檢查是否在同一個 Rich Menu
        if (!window.editorState) return;
        const state = window.editorState;
        const currentRM = getCurrentRichMenu(state);

        if (!currentRM || currentRM.id !== data.rich_menu_id) {
            // 不同 Rich Menu，隱藏游標
            if (remoteCursors[data.user_id]) {
                remoteCursors[data.user_id].element.style.display = 'none';
            }
            return;
        }

        // 轉換相對座標為絕對座標
        const canvas = document.getElementById('richmenu-canvas-overlay');
        if (!canvas) return;

        const rect = canvas.getBoundingClientRect();
        const absoluteX = rect.left + (data.relative_x * rect.width);
        const absoluteY = rect.top + (data.relative_y * rect.height);

        drawRemoteCursor({
            ...data,
            x: absoluteX,
            y: absoluteY
        });
    });

    // 游標離開事件
    socket.on('cursor:leave', (data) => {
        if (data.user_id === myUserId) return;

        const cursor = remoteCursors[data.user_id];
        if (cursor && cursor.element) {
            // 淡化消失動畫
            cursor.element.style.transition = 'opacity 0.3s ease';
            cursor.element.style.opacity = '0';

            // 300ms 後完全隱藏
            setTimeout(() => {
                cursor.element.style.display = 'none';
                cursor.element.style.opacity = '1'; // 重置以便下次顯示
            }, 300);
        }
    });

    // Tab 切換事件（其他用戶切換 Tab）
    socket.on('tab:switch', (data) => {
        if (data.user_id === myUserId) return;

        console.log('收到 tab:switch 事件', {
            user_id: data.user_id,
            user_name: data.user_name,
            rich_menu_id: data.rich_menu_id,
            color: data.color
        });

        // 更新活躍編輯者列表
        activeEditors[data.user_id] = {
            richMenuId: data.rich_menu_id,
            userName: data.user_name,
            color: data.color
        };

        console.log('activeEditors 已更新', activeEditors);

        // 更新 Tab 指示器
        updateTabIndicators();

        // 檢查是否在不同的 Tab
        if (window.editorState) {
            const state = window.editorState;
            const currentRM = getCurrentRichMenu(state);

            // 如果對方切換到不同的 Tab，顯示通知
            if (currentRM && currentRM.id !== data.rich_menu_id) {
                // 找到對方正在編輯的 Tab 名稱
                const targetRM = state.project.richMenus.find(rm => rm.id === data.rich_menu_id);
                const tabName = targetRM ? (targetRM.metadata.name || targetRM.name || 'Rich Menu') : 'Rich Menu';

                showNotification(
                    `${data.user_name} 正在編輯「${tabName}」`,
                    'info'
                );
            }
        }
    });

    // 接收初始標籤狀態（當加入專案時）
    socket.on('tabs:initial_state', (data) => {
        console.log('收到 tabs:initial_state 事件', data);

        // 更新所有現有用戶的標籤狀態
        if (data.active_tabs && Array.isArray(data.active_tabs)) {
            data.active_tabs.forEach(tab => {
                if (tab.user_id && tab.rich_menu_id) {
                    activeEditors[tab.user_id] = {
                        richMenuId: tab.rich_menu_id,
                        userName: tab.user_name,
                        color: tab.color
                    };
                }
            });

            console.log('初始 activeEditors 已設定', activeEditors);

            // 更新 Tab 指示器
            updateTabIndicators();
        }
    });
}

function joinProject(projectId) {
    if (!socket) initSocketIO();

    if (currentProjectId) {
        socket.emit('leave_project', { project_id: currentProjectId });
    }

    currentProjectId = projectId;
    socket.emit('join_project', {
        project_id: projectId,
        user_id: myUserId,
        user_name: myUserName,
        color: myColor
    });
}

function leaveProject() {
    if (currentProjectId && socket) {
        socket.emit('leave_project', { project_id: currentProjectId });
        currentProjectId = null;
    }
}

function broadcastAreasUpdate(richMenuId, areas) {
    if (!socket || !currentProjectId) return;
    socket.emit('richmenu:update_areas', {
        project_id: currentProjectId,
        rich_menu_id: richMenuId,
        areas: areas,
        sender: myUserId
    });
}

function broadcastMetadataUpdate(richMenuId, metadata) {
    if (!socket || !currentProjectId) return;
    socket.emit('richmenu:update_metadata', {
        project_id: currentProjectId,
        rich_menu_id: richMenuId,
        metadata: metadata,
        sender: myUserId
    });
}

function broadcastCursorMove(relativeX, relativeY) {
    if (!socket || !currentProjectId || !currentRichMenuId) return;
    socket.emit('cursor:move', {
        project_id: currentProjectId,
        rich_menu_id: currentRichMenuId,  // 新增
        relative_x: relativeX,  // 改為相對座標 (0-1)
        relative_y: relativeY,  // 改為相對座標 (0-1)
        user_id: myUserId,
        user_name: myUserName,
        color: myColor
    });
}

function drawRemoteCursor(data) {
    // 使用整個 main content 作為游標容器
    const container = document.querySelector('main') || document.body;
    if (!container) return;

    let cursor = remoteCursors[data.user_id];

    if (!cursor) {
        // 建立新游標
        const el = document.createElement('div');
        el.className = 'remote-cursor';
        el.style.cssText = `
            position: fixed;
            pointer-events: none;
            z-index: 10000;
            transition: all 0.1s ease;
        `;
        el.innerHTML = `
            <svg width="20" height="20" viewBox="0 0 20 20" style="filter: drop-shadow(0 1px 2px rgba(0,0,0,0.3));">
                <path d="M0 0 L0 16 L5 11 L8 20 L10 19 L7 10 L14 10 Z" fill="${data.color}" />
            </svg>
            <div style="
                position: absolute;
                top: 20px;
                left: 5px;
                background: ${data.color};
                color: white;
                padding: 2px 6px;
                border-radius: 4px;
                font-size: 11px;
                white-space: nowrap;
                box-shadow: 0 1px 3px rgba(0,0,0,0.2);
            ">${data.user_name}</div>
        `;
        document.body.appendChild(el);
        cursor = { element: el, color: data.color, name: data.user_name };
        remoteCursors[data.user_id] = cursor;
    }

    // 確保游標可見（修正離開後重新進入的問題）
    cursor.element.style.display = '';
    cursor.element.style.opacity = '1';
    cursor.element.style.transition = 'all 0.1s ease'; // 重置為平滑移動

    // 更新位置（使用固定定位的絕對座標）
    cursor.element.style.left = data.x + 'px';
    cursor.element.style.top = data.y + 'px';
}

function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    // 根據類型選擇背景顏色
    let backgroundColor;
    if (type === 'info') {
        backgroundColor = '#1a73e8';  // 藍色
    } else if (type === 'error') {
        backgroundColor = '#d93025';  // 紅色
    } else {
        backgroundColor = '#02a568';  // 綠色 (success)
    }

    // 建立視覺化通知
    const notification = document.createElement('div');
    notification.className = `notification notification-${type}`;
    notification.style.cssText = `
        position: fixed;
        top: 20px;
        right: 20px;
        padding: 12px 20px;
        background: ${backgroundColor};
        color: white;
        border-radius: 6px;
        box-shadow: 0 2px 8px rgba(0,0,0,0.2);
        z-index: 10001;
        font-size: 14px;
        max-width: 300px;
        opacity: 0;
        transition: opacity 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    // 淡入效果（使用 requestAnimationFrame 確保 transition 生效）
    requestAnimationFrame(() => {
        notification.style.opacity = '1';
    });

    // 3 秒後淡出並移除
    setTimeout(() => {
        notification.style.opacity = '0';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}

/**
 * 更新 Tab 編輯狀態指示器
 */
function updateTabIndicators() {
    if (!window.editorState) {
        console.log('updateTabIndicators: editorState 不存在');
        return;
    }

    const state = window.editorState;
    const tabsContainer = document.querySelector('#richmenu-tabs');  // 修正：從 .rich-menu-tabs 改為 #richmenu-tabs
    if (!tabsContainer) {
        console.log('updateTabIndicators: 找不到 #richmenu-tabs 容器');
        return;
    }

    console.log('updateTabIndicators: 開始更新指示器', {
        richMenusCount: state.project.richMenus.length,
        activeEditors: Object.keys(activeEditors).length
    });

    // 遍歷所有 Rich Menu
    state.project.richMenus.forEach((rm, index) => {
        const tabEl = tabsContainer.querySelector(`[data-tab-index="${index}"]`);
        if (!tabEl) {
            console.log(`updateTabIndicators: 找不到 tab[${index}]`);
            return;
        }

        // 移除現有的指示器
        const existingIndicator = tabEl.querySelector('.tab-editor-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // 找出正在編輯此 Rich Menu 的用戶
        const editors = Object.values(activeEditors)
            .filter(editor => editor.richMenuId === rm.id);

        if (editors.length > 0) {
            console.log(`updateTabIndicators: 在 tab[${index}] 創建指示器`, {
                richMenuId: rm.id,
                editors: editors.map(e => e.userName)
            });

            // 創建指示器
            const indicator = document.createElement('span');
            indicator.className = 'tab-editor-indicator';
            indicator.style.cssText = `
                display: inline-block;
                width: 8px;
                height: 8px;
                border-radius: 50%;
                background: ${editors[0].color};
                margin-right: 6px;
                animation: pulse 2s infinite;
                box-shadow: 0 0 4px ${editors[0].color};
            `;

            // 加入 tooltip 顯示用戶名
            indicator.title = editors.map(e => e.userName).join(', ') + ' 正在編輯';

            // 插入到 Tab 文字前面
            tabEl.insertBefore(indicator, tabEl.firstChild);
        }
    });
}

// 添加 CSS 動畫
if (!document.getElementById('tab-indicator-animation-style')) {
    const style = document.createElement('style');
    style.id = 'tab-indicator-animation-style';
    style.textContent = `
        @keyframes pulse {
            0%, 100% {
                opacity: 1;
                transform: scale(1);
            }
            50% {
                opacity: 0.6;
                transform: scale(1.1);
            }
        }
    `;
    document.head.appendChild(style);
}

// 節流函式
function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

// 初始化 Socket.IO
document.addEventListener('DOMContentLoaded', () => {
    initSocketIO();

    // 移除全域游標追蹤，改為在 Canvas 上追蹤（在 setupCanvas 中設定）
});

// === 原有的 UI 邏輯 ===

function renderAccountSelectionScreen() {
    const html = `
        <div id="account-selection" class="container">
            <div class="page-header">
                <div class="page-header-left">
                    <h2 class="page-title">選擇 LINE 官方帳號</h2>
                </div>
                <div class="page-header-right">
                    <!-- 預留空間，保持高度一致 -->
                </div>
            </div>

            <div class="cards-grid" id="accounts-grid">
                <!-- 帳號卡片將由 JavaScript 動態生成 -->
                </div>

            <div class="add-card" id="add-account-card">
                <div class="add-card-content">
                    <div class="add-icon">+</div>
                    <h3>新增帳號</h3>
                    <p>新增一個新的 LINE 官方帳號</p>
                </div>
            </div>
        </div>

        <!-- 新增帳號模態框 -->
        <div id="add-account-modal" class="modal-backdrop" aria-hidden="true">
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="add-account-modal-title">
                <div class="modal-header">
                    <h3 id="add-account-modal-title">新增 LINE 官方帳號</h3>
                    <button class="modal-close" id="close-add-account-modal">&times;</button>
                </div>
                <div class="modal-body">
                <div class="form-group">
                        <label for="account-name">帳號名稱</label>
                        <input type="text" id="account-name" placeholder="請輸入帳號識別名稱">
                        <small>此名稱僅供本機顯示使用</small>
                </div>
                <div class="form-group">
                    <label for="channel-access-token">Channel Access Token</label>
                    <input type="password" id="channel-access-token" placeholder="請輸入您的 Channel Access Token">
                    <small>您的 Token 將會安全地儲存在本地瀏覽器中，不會上傳到任何伺服器。<br>
                        <a href="https://developers.line.biz/console/" target="_blank" rel="noopener">到 LINE Developers Console 建立頻道並產生 Token</a> ・
                        <a href="https://developers.line.biz/zh-hant/docs/messaging-api/channel-access-tokens/" target="_blank" rel="noopener">操作說明：取得 Channel Access Token</a>
                    </small>
                </div>
                <div id="error-message" class="error"></div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-add-account" class="btn secondary">取消</button>
                    <button id="add-account-btn" class="btn">驗證並新增帳號</button>
                </div>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;

    // After render, wire events and populate existing accounts
    wireAddAccountButton();
    wireAccountCards();
    refreshAccountCards();
}

async function wireAddAccountButton() {
    const button = document.getElementById('add-account-btn');
    const tokenInput = document.getElementById('channel-access-token');
    const nameInput = document.getElementById('account-name');
    const errorEl = document.getElementById('error-message');

    if (!button) return;

    button.addEventListener('click', async () => {
        errorEl.textContent = '';
        const token = tokenInput.value.trim();
        const accountName = nameInput.value.trim();

        if (!accountName) {
            errorEl.textContent = '請輸入帳號名稱';
            return;
        }
        if (!token) {
            errorEl.textContent = '請先輸入 Channel Access Token';
            return;
        }

        // Check if account name already exists
        const exists = await getAccount(accountName);
        if (exists) {
            errorEl.textContent = '此帳號名稱已存在，請使用其他名稱';
            return;
        }

        button.disabled = true;
        button.textContent = '驗證中...';
        try {
            const result = await validateChannelAccessToken(token);
            if (!result.ok) {
                errorEl.textContent = `驗證失敗：${result.message || result.status || '未知錯誤'}`;
                return;
            }

            const accountRecord = { accountId: accountName, channelAccessToken: token };
            await saveAccount(accountRecord);
            tokenInput.value = '';
            nameInput.value = '';
            await refreshAccountCards();
            closeAddAccountModal();
        } catch (e) {
            errorEl.textContent = e.message || '發生未知錯誤';
        } finally {
            button.disabled = false;
            button.textContent = '驗證並新增帳號';
        }
    });
}

async function refreshAccountCards() {
    const grid = document.getElementById('accounts-grid');
    if (!grid) return;

    const accounts = await listAccounts();
    grid.innerHTML = '';

    if (!accounts || accounts.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">📱</div>
            <h3>尚無帳號</h3>
            <p>點擊下方「新增帳號」按鈕來新增您的第一個 LINE 官方帳號</p>
        `;
        grid.appendChild(emptyState);
        return;
    }

    accounts.forEach(acc => {
        const card = document.createElement('div');
        card.className = 'account-card';
        card.dataset.accountId = acc.accountId;
        card.innerHTML = `
            <div class="card-header">
                <div class="account-icon">📱</div>
                <h3>${escapeHtml(acc.accountId)}</h3>
            </div>
            <div class="card-body">
                <p>LINE 官方帳號</p>
            </div>
        `;
        grid.appendChild(card);
    });
}

function wireAccountCards() {
    // 新增帳號卡片點擊事件
    const addCard = document.getElementById('add-account-card');
    if (addCard) {
        addCard.addEventListener('click', () => {
            openAddAccountModal();
        });
    }

    // 帳號卡片點擊事件（使用事件委託）
    const grid = document.getElementById('accounts-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.account-card');
            if (card && card.dataset.accountId) {
                const accountId = card.dataset.accountId;
                setSelectedAccountId(accountId);
                renderProjectSelectionScreen();
            }
        });
    }

    // 模態框事件
    wireAddAccountModal();
}

function wireAddAccountModal() {
    const modal = document.getElementById('add-account-modal');
    const addCard = document.getElementById('add-account-card');
    const closeBtn = document.getElementById('close-add-account-modal');
    const cancelBtn = document.getElementById('cancel-add-account');

    if (addCard) {
        addCard.addEventListener('click', () => {
            openAddAccountModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeAddAccountModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeAddAccountModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddAccountModal();
            }
        });
    }
}

function openAddAccountModal() {
    const modal = document.getElementById('add-account-modal');
    if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        // 清空表單
        document.getElementById('account-name').value = '';
        document.getElementById('channel-access-token').value = '';
        document.getElementById('error-message').textContent = '';
    }
}

function closeAddAccountModal() {
    const modal = document.getElementById('add-account-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// === Account Settings Modal ===

async function openAccountSettingsModal() {
    const modal = document.getElementById('account-settings-modal');
    if (!modal) return;

    const selectedAccountId = getSelectedAccountId();
    if (!selectedAccountId) return;

    // 載入當前帳號資訊
    const account = await getAccount(selectedAccountId);

    // 填入表單
    document.getElementById('settings-account-name').value = selectedAccountId;
    document.getElementById('settings-channel-token').value = account ? account.channelAccessToken : '';
    document.getElementById('settings-error').textContent = '';
    document.getElementById('settings-success').textContent = '';

    // 顯示模態框
    modal.classList.add('show');
    modal.setAttribute('aria-hidden', 'false');
}

function closeAccountSettingsModal() {
    const modal = document.getElementById('account-settings-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function wireAccountSettingsModal() {
    // 關閉按鈕
    const closeBtn = document.getElementById('close-account-settings-modal');
    if (closeBtn) {
        closeBtn.addEventListener('click', closeAccountSettingsModal);
    }

    // 取消按鈕
    const cancelBtn = document.getElementById('cancel-account-settings');
    if (cancelBtn) {
        cancelBtn.addEventListener('click', closeAccountSettingsModal);
    }

    // Token 可見性切換
    const toggleBtn = document.getElementById('toggle-token-visibility');
    const tokenInput = document.getElementById('settings-channel-token');
    if (toggleBtn && tokenInput) {
        toggleBtn.addEventListener('click', () => {
            if (tokenInput.type === 'password') {
                tokenInput.type = 'text';
                toggleBtn.textContent = '🙈';
                toggleBtn.title = '隱藏';
            } else {
                tokenInput.type = 'password';
                toggleBtn.textContent = '👁️';
                toggleBtn.title = '顯示';
            }
        });
    }

    // 儲存按鈕
    const saveBtn = document.getElementById('save-account-settings-btn');
    if (saveBtn) {
        saveBtn.addEventListener('click', async () => {
            const errorEl = document.getElementById('settings-error');
            const successEl = document.getElementById('settings-success');
            const tokenInput = document.getElementById('settings-channel-token');

            errorEl.textContent = '';
            successEl.textContent = '';

            const newToken = tokenInput.value.trim();
            if (!newToken) {
                errorEl.textContent = '請輸入 Channel Access Token';
                return;
            }

            saveBtn.disabled = true;
            saveBtn.textContent = '驗證中...';

            try {
                // 驗證新的 Token
                const result = await validateChannelAccessToken(newToken);
                if (!result.ok) {
                    errorEl.textContent = `驗證失敗：${result.message || result.status || '未知錯誤'}`;
                    return;
                }

                // 更新帳號 Token
                const selectedAccountId = getSelectedAccountId();
                await updateAccountToken(selectedAccountId, newToken);

                successEl.textContent = '✓ Token 已成功更新';

                // 2秒後自動關閉
                setTimeout(() => {
                    closeAccountSettingsModal();
                }, 2000);

            } catch (e) {
                errorEl.textContent = e.message || '發生未知錯誤';
            } finally {
                saveBtn.disabled = false;
                saveBtn.textContent = '儲存變更';
            }
        });
    }

    // 點擊背景關閉
    const modal = document.getElementById('account-settings-modal');
    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAccountSettingsModal();
            }
        });
    }
}


function renderProjectSelectionScreen() {
    const selectedAccountId = getSelectedAccountId();

    const html = `
        <div id="project-selection" class="container">
            <div class="page-header project-selection-header">
                <div class="header-row-top">
                <button id="back-to-accounts" class="btn secondary">← 返回</button>
                </div>
                <div class="header-row-bottom">
                <span class="page-subtitle">帳號：<strong>${escapeHtml(selectedAccountId || '')}</strong></span>
                    <button id="account-settings-btn" class="btn-icon" title="帳號設定">⚙️</button>
                </div>
            </div>

            <div class="cards-grid" id="projects-grid">
                <!-- 專案卡片將由 JavaScript 動態生成 -->
                </div>

            <div class="add-card" id="add-project-card">
                <div class="add-card-content">
                    <div class="add-icon">+</div>
                    <h3>新增專案</h3>
                    <p>建立一個新的 Rich Menu 專案</p>
                </div>
            </div>
        </div>

        <!-- 新增專案模態框 -->
        <div id="add-project-modal" class="modal-backdrop" aria-hidden="true">
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="add-project-modal-title">
                <div class="modal-header">
                    <h3 id="add-project-modal-title">新增專案</h3>
                    <button class="modal-close" id="close-add-project-modal">&times;</button>
                </div>
                <div class="modal-body">
                <div class="form-group">
                    <label for="project-name">專案名稱</label>
                    <input type="text" id="project-name" placeholder="請輸入專案名稱 (1–64 字)">
                    <small>同一帳號內專案名稱必須唯一；允許中英文、數字、空白與 - _</small>
                </div>
                <div id="project-error" class="error"></div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-add-project" class="btn secondary">取消</button>
                <button id="create-project-btn" class="btn">建立專案</button>
                </div>
            </div>
        </div>

        <!-- 帳號設定模態框 -->
        <div id="account-settings-modal" class="modal-backdrop" aria-hidden="true">
            <div class="modal" role="dialog" aria-modal="true" aria-labelledby="account-settings-modal-title">
                <div class="modal-header">
                    <h3 id="account-settings-modal-title">帳號設定</h3>
                    <button class="modal-close" id="close-account-settings-modal">&times;</button>
                </div>
                <div class="modal-body">
                    <div class="form-group">
                        <label for="settings-account-name">帳號名稱</label>
                        <input type="text" id="settings-account-name" disabled>
                        <small>帳號名稱無法修改</small>
                    </div>
                    <div class="form-group">
                        <label for="settings-channel-token">Channel Access Token</label>
                        <div class="token-input-group">
                            <input type="password" id="settings-channel-token" placeholder="請輸入您的 Channel Access Token">
                            <button type="button" id="toggle-token-visibility" class="btn-icon" title="顯示/隱藏">👁️</button>
                        </div>
                        <small>您的 Token 將會安全地儲存。<br>
                            <a href="https://developers.line.biz/console/" target="_blank" rel="noopener">到 LINE Developers Console 管理您的 Token</a>
                        </small>
                    </div>
                    <div id="settings-error" class="error"></div>
                    <div id="settings-success" class="success"></div>
                </div>
                <div class="modal-footer">
                    <button id="cancel-account-settings" class="btn secondary">取消</button>
                    <button id="save-account-settings-btn" class="btn">儲存變更</button>
                </div>
            </div>
        </div>
    `;
    mainContent.innerHTML = html;

    // Wire events
    document.getElementById('back-to-accounts').addEventListener('click', () => {
        renderAccountSelectionScreen();
    });
    document.getElementById('account-settings-btn').addEventListener('click', () => {
        openAccountSettingsModal();
    });
    document.getElementById('create-project-btn').addEventListener('click', onCreateProjectClick);
    wireProjectCards();
    wireAccountSettingsModal();
    refreshProjectCards();
}

function validateProjectNameInput(name) {
    if (!name) return '請輸入專案名稱';
    if (name.length < 1 || name.length > 64) return '專案名稱長度需為 1–64 字';
    const ok = /^[\w\u4e00-\u9fa5\s\-_.]+$/.test(name);
    if (!ok) return '名稱僅允許中英文、數字、空白與 - _ .';
    return '';
}

async function onCreateProjectClick() {
    const selectedAccountId = getSelectedAccountId();
    const nameInput = document.getElementById('project-name');
    const errEl = document.getElementById('project-error');
    errEl.textContent = '';

    const name = (nameInput.value || '').trim();
    const v = validateProjectNameInput(name);
    if (v) {
        errEl.textContent = v;
        return;
    }
    // Uniqueness per account
    const duplicated = await findProjectByName(selectedAccountId, name);
    if (duplicated) {
        errEl.textContent = '此帳號已存在相同專案名稱，請更換名稱';
        return;
    }

    const projectId = `${selectedAccountId}__${Date.now()}`;
    const project = {
        projectId,
        accountId: selectedAccountId,
        name,
        description: '', // 不再使用描述欄位
        richMenus: [],
        createdAt: new Date().toISOString(),
        updatedAt: new Date().toISOString()
    };
    await saveProject(project);
    nameInput.value = '';
    await refreshProjectCards();
    closeAddProjectModal();
}

async function refreshProjectCards() {
    const selectedAccountId = getSelectedAccountId();
    const grid = document.getElementById('projects-grid');
    if (!grid) return;

    const projects = await listProjectsByAccount(selectedAccountId);
    grid.innerHTML = '';

    if (!projects || projects.length === 0) {
        const emptyState = document.createElement('div');
        emptyState.className = 'empty-state';
        emptyState.innerHTML = `
            <div class="empty-icon">📁</div>
            <h3>尚無專案</h3>
            <p>點擊下方「新增專案」按鈕來建立您的第一個 Rich Menu 專案</p>
        `;
        grid.appendChild(emptyState);
        return;
    }

    projects.forEach(project => {
        const card = document.createElement('div');
        card.className = 'project-card';
        card.dataset.projectId = project.projectId;
        // 優先使用 richMenuCount，其次是 richMenus.length
        const richMenuCount = project.richMenuCount ?? (project.richMenus ? project.richMenus.length : 0);
        const lastUpdated = project.updatedAt ? new Date(project.updatedAt).toLocaleDateString('zh-TW') : '未知';

        card.innerHTML = `
            <div class="card-header">
                <div class="project-icon">📁</div>
                <h3>${escapeHtml(project.name)}</h3>
            </div>
            <div class="card-body">
                <div class="project-stats">
                    <span class="stat">Rich Menu: ${richMenuCount}</span>
                    <span class="stat">更新: ${lastUpdated}</span>
                </div>
            </div>
        `;
        grid.appendChild(card);
    });
}

function wireProjectCards() {
    // 新增專案卡片點擊事件
    const addCard = document.getElementById('add-project-card');
    if (addCard) {
        addCard.addEventListener('click', () => {
            openAddProjectModal();
        });
    }

    // 專案卡片點擊事件（使用事件委託）
    const grid = document.getElementById('projects-grid');
    if (grid) {
        grid.addEventListener('click', (e) => {
            const card = e.target.closest('.project-card');
            if (card && card.dataset.projectId) {
                const projectId = card.dataset.projectId;
                setSelectedProjectId(projectId);
                renderEditor(projectId);
            }
        });
    }

    // 模態框事件
    wireAddProjectModal();
}

function wireAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    const addCard = document.getElementById('add-project-card');
    const closeBtn = document.getElementById('close-add-project-modal');
    const cancelBtn = document.getElementById('cancel-add-project');

    if (addCard) {
        addCard.addEventListener('click', () => {
            openAddProjectModal();
        });
    }

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeAddProjectModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeAddProjectModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddProjectModal();
            }
        });
    }
}

function openAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        // 清空表單
        document.getElementById('project-name').value = '';
        document.getElementById('project-error').textContent = '';
    }
}

function closeAddProjectModal() {
    const modal = document.getElementById('add-project-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

// Rich Menu Modal Functions
function openAddRichMenuModal(state) {
    const modal = document.getElementById('add-richmenu-modal');
    if (modal) {
        modal.classList.add('show');
        modal.setAttribute('aria-hidden', 'false');
        // 清空表單
        document.getElementById('richmenu-alias').value = '';
        document.getElementById('add-richmenu-error').textContent = '';
    }
}

function closeAddRichMenuModal() {
    const modal = document.getElementById('add-richmenu-modal');
    if (modal) {
        modal.classList.remove('show');
        modal.setAttribute('aria-hidden', 'true');
    }
}

function wireAddRichMenuModal(state) {
    const modal = document.getElementById('add-richmenu-modal');
    const closeBtn = document.getElementById('close-add-richmenu-modal');
    const cancelBtn = document.getElementById('cancel-add-richmenu');
    const createBtn = document.getElementById('create-richmenu-btn');
    const aliasInput = document.getElementById('richmenu-alias');

    if (closeBtn) {
        closeBtn.addEventListener('click', () => {
            closeAddRichMenuModal();
        });
    }

    if (cancelBtn) {
        cancelBtn.addEventListener('click', () => {
            closeAddRichMenuModal();
        });
    }

    if (modal) {
        modal.addEventListener('click', (e) => {
            if (e.target === modal) {
                closeAddRichMenuModal();
            }
        });
    }

    if (createBtn) {
        createBtn.addEventListener('click', async () => {
            const errorEl = document.getElementById('add-richmenu-error');

            const alias = (aliasInput.value || '').trim();
            const name = alias; // 顯示名稱移除，名稱即採用別名

            // 驗證輸入
            const validationError = validateRichMenuInput(alias, state.project.richMenus);
            if (validationError) {
                errorEl.textContent = validationError;
                return;
            }

            try {
                // 建立新的 Rich Menu
                const newRM = {
                    id: `rm_${Date.now()}`,
                    name: name || `Rich Menu ${state.project.richMenus.length + 1}`,
                    alias: alias,
                    image: null,
                    metadata: {
                        size: { width: 2500, height: 1686 },
                        selected: true,
                        name: name || `Rich Menu ${state.project.richMenus.length + 1}`,
                        chatBarText: '', // 預設為空，後續在編輯時設定
                        areas: []
                    }
                };

                state.project.richMenus.push(newRM);
                state.currentTabIndex = state.project.richMenus.length - 1;

                // 更新 UI
                renderTabs(state);
                void loadCurrentTab(state);

                // 自動儲存
                if (state.scheduleAutosave) state.scheduleAutosave(newRM);

                // 關閉 modal
                closeAddRichMenuModal();

            } catch (e) {
                errorEl.textContent = e.message || '建立 Rich Menu 失敗';
            }
        });
    }
}

// Rich Menu Validation
function validateRichMenuInput(alias, existingRichMenus) {
    if (!alias || alias.trim().length === 0) {
        return '請輸入別名';
    }
    if (alias.length > 50) {
        return '別名長度不能超過 50 字元';
    }

    // 檢查別名是否重複
    const trimmedAlias = alias.trim();
    const duplicateAlias = existingRichMenus.find(rm => rm.alias && rm.alias.trim() === trimmedAlias);
    if (duplicateAlias) {
        return '此別名已存在，請使用不同的別名';
    }

    return '';
}


async function renderEditor(projectId) {
    const project = await getProject(projectId);

    // Initialize project structure for multiple Rich Menus
    if (!project.richMenus || project.richMenus.length === 0) {
        project.richMenus = [{
            id: `rm_${Date.now()}`,
            name: 'Rich Menu 1',
            alias: '',
            image: null,
            metadata: {
                size: { width: 2500, height: 1686 },
                selected: false,
                name: '',
                chatBarText: '',
                areas: []
            }
        }];
        await saveProject(project);
    }

    // Remove old editor property if exists
    if (project.editor) {
        delete project.editor;
        await saveProjectDetails(project);
    }

    const html = `
        <div id="editor" class="container">
            <div class="page-header">
                <div class="page-header-left">
                    <button id="back-to-projects" class="btn secondary" title="返回">← 返回</button>
                    <h2 class="page-title">專案：<strong>${escapeHtml(project.name)}</strong></h2>
            </div>

            <!-- Rich Menu Tabs -->
            <div class="tabs-container">
                <div class="tabs" id="richmenu-tabs"></div>
                    </div>

                <span id="save-status" class="save-status" aria-live="polite"></span>
            </div>

            <div class="editor-grid">
                <!-- 畫布 -->
                <div class="panel canvas-panel">
                    <h3>畫布</h3>
                    <div class="canvas-wrapper">
                        <div class="canvas-container"></div>
                    </div>
                    <div class="canvas-tools">
                        <label for="image-file" class="btn small secondary" style="cursor: pointer; margin: 0;">上傳圖片</label>
                        <input id="image-file" type="file" accept="image/png, image/jpeg" style="display: none;" />
                        <button id="add-area" class="btn small">新增區域</button>
                        <button id="delete-area" class="btn small secondary">刪除區域</button>
                    </div>
                </div>

                <!-- Chat Bar 文字 - 獨立 panel -->
                <div class="panel chatbar-panel">
                    <h3>Chat Bar 文字</h3>
                    <div class="form-group">
                        <input id="rm-chatbar" type="text" placeholder="1–14 字" maxlength="14" />
                        <small id="chatbar-counter" class="char-counter">0/14</small>
                    </div>
                </div>

                <!-- 動作設定 -->
                <div class="panel actions-panel">
                    <h3 id="actions-panel-title">動作設定</h3>
                    <div id="area-editor"></div>
                    <div class="form-group">
                        <label for="action-type">動作類型</label>
                        <select id="action-type">
                            <option value="none">無</option>
                            <option value="uri">開啟連結 (uri)</option>
                            <option value="message">傳送訊息 (message)</option>
                            <option value="postback">Postback (postback)</option>
                            <option value="flex">回傳 Flex Message</option>
                            <option value="richmenuswitch">切換選單 (richmenuswitch)</option>
                        </select>
                    </div>
                    <div id="action-fields"></div>
                </div>
            </div>

            <!-- Editor bottom sticky footer -->
            <div class="editor-footer">
                <div class="footer-actions">
                    <button id="open-richmenu-settings" class="btn small secondary">設定</button>
                    <button id="open-json-preview" class="btn small secondary">JSON 預覽</button>
                    <button id="open-upload-modal" class="btn">上傳發布</button>
                </div>
            </div>

            <!-- 設定 Modal - 多 Tab 模式 -->
            <div id="richmenu-settings-modal" class="modal-backdrop" aria-hidden="true">
                <div class="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="settings-modal-title">
                    <div class="modal-header">
                        <h3 id="settings-modal-title">設定</h3>
                        <button class="modal-close" id="close-settings-modal" aria-label="關閉">&times;</button>
                    </div>

                    <!-- Settings Tabs -->
                    <div class="settings-tabs-container">
                        <div class="settings-tabs" id="settings-tabs"></div>
                    </div>

                    <div class="modal-body" id="settings-modal-body">
                        <!-- Tab content will be rendered here dynamically -->
                    </div>

                    <div class="modal-footer">
                        <div id="settings-status" role="status" aria-live="polite"></div>
                        <button id="close-settings" class="btn secondary">關閉</button>
                    </div>
                </div>
            </div>

            <!-- JSON 預覽 Modal -->
            <div id="json-preview-modal" class="modal-backdrop" aria-hidden="true">
                <div class="modal" role="dialog" aria-modal="true" aria-labelledby="json-modal-title">
                    <div class="modal-header">
                        <h3 id="json-modal-title">JSON 預覽</h3>
                        <button class="modal-close" id="close-json-modal" aria-label="關閉">&times;</button>
                    </div>
                    <div class="modal-body">
                        <textarea id="json-preview" rows="20" readonly style="width:100%; font-family: monospace; font-size: 0.85rem;"></textarea>
                    </div>
                    <div class="modal-footer">
                        <button id="copy-json" class="btn">複製 JSON</button>
                        <button id="close-json" class="btn secondary">關閉</button>
                    </div>
                </div>
            </div>

            <!-- 新增 Rich Menu Modal -->
            <div id="add-richmenu-modal" class="modal-backdrop" aria-hidden="true">
                <div class="modal" role="dialog" aria-modal="true" aria-labelledby="add-richmenu-modal-title">
                    <div class="modal-header">
                        <h3 id="add-richmenu-modal-title">新增 Rich Menu</h3>
                        <button class="modal-close" id="close-add-richmenu-modal" aria-label="關閉">&times;</button>
                    </div>
                    <div class="modal-body">
                        <div class="form-group">
                            <label for="richmenu-alias">別名 (Alias)</label>
                            <input type="text" id="richmenu-alias" placeholder="請輸入 Rich Menu 別名" maxlength="50">
                            <small>別名用於選單切換功能，建議使用有意義的名稱。長度限制：1-50 字元</small>
                        </div>

                        <div id="add-richmenu-error" class="error"></div>
                    </div>
                    <div class="modal-footer">
                        <button id="cancel-add-richmenu" class="btn secondary">取消</button>
                        <button id="create-richmenu-btn" class="btn">建立 Rich Menu</button>
                    </div>
                </div>
            </div>

            <div id="upload-modal" class="modal-backdrop" aria-hidden="true">
                <div class="modal modal-large" role="dialog" aria-modal="true" aria-labelledby="upload-modal-title">
                    <div class="modal-header">
                        <h3 id="upload-modal-title">上傳與發佈</h3>
                        <button class="modal-close" id="close-upload-modal-x" aria-label="關閉">&times;</button>
                    </div>

                    <!-- Upload Modal Tabs -->
                    <div class="upload-tabs-container">
                        <button class="upload-tab active" data-upload-tab="single">單次上傳</button>
                        <button class="upload-tab" data-upload-tab="schedule">排程上傳</button>
                    </div>

                    <!-- 單次上傳 Tab -->
                    <div class="upload-tab-panel active" data-upload-panel="single">
                        <div class="modal-body">
                            <div class="form-group">
                                <label>上傳範圍</label>
                                <div>
                                    <label><input type="radio" name="upload-scope" value="single" checked> 僅上傳目前這個 Rich Menu</label>
                                </div>
                                <div>
                                    <label><input type="radio" name="upload-scope" value="all"> 上傳專案內所有 Rich Menu</label>
                                </div>
                            </div>
                            <div id="publish-target-group" class="form-group">
                                <label>發佈目標</label>
                                <div>
                                    <label><input type="radio" name="publish-target" value="all" checked> 傳給所有人（設為預設）</label>
                                </div>
                                <div>
                                    <label><input type="radio" name="publish-target" value="users"> 傳給特定使用者</label>
                                </div>
                            </div>
                            <div id="users-input-group" class="form-group" style="display:none;">
                                <label for="user-ids">使用者 ID（每行一個）</label>
                                <textarea id="user-ids" rows="5" placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"></textarea>
                                <div class="inline" style="margin-top:6px;">
                                    <button id="unlink-users" class="btn small secondary">移除這些使用者的綁定</button>
                                </div>
                            </div>
                            <div class="form-group">
                                <label for="default-menu-select">上傳後設為預設選單</label>
                                <select id="default-menu-select">
                                    <option value="">不設定預設</option>
                                </select>
                                <small class="grid-note">預設選單會自動顯示給所有未個別綁定的使用者</small>
                            </div>
                            <div class="form-group">
                                <small>上傳前會自動刪除 LINE 端相同名稱的 Rich Menu。</small>
                            </div>
                            <div id="upload-status" class="error"></div>
                        </div>
                        <div class="modal-footer">
                            <button id="cancel-upload" class="btn secondary">取消</button>
                            <button id="confirm-upload" class="btn">開始上傳</button>
                        </div>
                    </div>

                    <!-- 排程上傳 Tab -->
                    <!-- 排程上傳 Tab -->
                    <div class="upload-tab-panel" data-upload-panel="schedule">
                        <div class="modal-body">
                            <!-- Toast Notification -->
                            <div id="schedule-toast" class="schedule-toast"></div>

                            <!-- Cards Section -->
                            <h4 style="margin-top:0;">排程列表</h4>
                            <div id="schedule-list" class="schedule-cards-row">
                                <!-- Cards injected by JS -->
                            </div>

                            <hr style="margin: 1.5rem 0; border: none; border-top: 1px solid #e5e7eb;" />

                            <!-- Placeholder -->
                            <div id="schedule-placeholder" class="schedule-placeholder">
                                <p>請選擇上方排程以編輯，或點擊「新增排程」開始設定。</p>
                            </div>

                            <!-- Form Section -->
                            <div id="schedule-editor" class="schedule-form-section" style="display:none;">
                                <h4 id="schedule-form-title">新增排程</h4>
                                <div class="form-group">
                                    <label>上傳範圍</label>
                                    <div>
                                        <label><input type="radio" name="sched-scope" value="single" checked> 僅上傳目前這個 Rich Menu</label>
                                    </div>
                                    <div>
                                        <label><input type="radio" name="sched-scope" value="all"> 上傳專案內所有 Rich Menu</label>
                                    </div>
                                </div>
                                <div class="form-group">
                                    <label>發佈目標</label>
                                    <div>
                                        <label><input type="radio" name="sched-target" value="all" checked> 傳給所有人（設為預設）</label>
                                    </div>
                                    <div>
                                        <label><input type="radio" name="sched-target" value="users"> 傳給特定使用者</label>
                                    </div>
                                </div>
                                <div id="sched-users-group" class="form-group" style="display:none;">
                                    <label for="sched-user-ids">使用者 ID（每行一個）</label>
                                    <textarea id="sched-user-ids" rows="5" placeholder="Uxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxxx\nUyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyyy"></textarea>
                                </div>
                                <div class="form-group">
                                    <label for="sched-default-menu">上傳後設為預設選單</label>
                                    <select id="sched-default-menu">
                                        <option value="-1">不設定預設</option>
                                    </select>
                                    <small class="grid-note">預設選單會自動顯示給所有未個別綁定的使用者</small>
                                </div>
                                <div class="form-group">
                                    <small>上傳前會自動刪除 LINE 端相同名稱的 Rich Menu。</small>
                                </div>
                                <hr style="margin: 1rem 0; border: none; border-top: 1px solid #e5e7eb;" />
                                <div class="form-group">
                                    <label>重複頻率</label>
                                    <div class="sched-repeat-options">
                                        <label><input type="radio" name="sched-repeat" value="daily" checked> 每天</label>
                                        <label><input type="radio" name="sched-repeat" value="weekly"> 每週</label>
                                        <label><input type="radio" name="sched-repeat" value="monthly"> 每月</label>
                                    </div>
                                </div>
                                <div id="sched-weekday-group" class="form-group" style="display:none;">
                                    <label for="sched-weekday">星期幾</label>
                                    <select id="sched-weekday">
                                        <option value="0">星期一</option>
                                        <option value="1">星期二</option>
                                        <option value="2">星期三</option>
                                        <option value="3">星期四</option>
                                        <option value="4">星期五</option>
                                        <option value="5">星期六</option>
                                        <option value="6">星期日</option>
                                    </select>
                                </div>
                                <div id="sched-day-group" class="form-group" style="display:none;">
                                    <label for="sched-day">每月幾號</label>
                                    <select id="sched-day">
                                        ${Array.from({ length: 31 }, (_, i) => `<option value="${i + 1}">${i + 1}</option>`).join('')}
                                    </select>
                                </div>
                                <div class="form-group">
                                    <label for="sched-time">執行時間</label>
                                    <input type="time" id="sched-time" value="00:00" />
                                </div>
                                <div class="form-row">
                                    <div class="form-group" style="flex:1;">
                                        <label for="sched-start-date">開始日期</label>
                                        <input type="date" id="sched-start-date" />
                                    </div>
                                    <div class="form-group" style="flex:1;">
                                        <label for="sched-end-date">結束日期</label>
                                        <input type="date" id="sched-end-date" />
                                    </div>
                                </div>
                                <div id="sched-error" class="error"></div>
                                <div class="schedule-form-actions">
                                    <button id="save-schedule-btn" class="btn" style="width:100%;">新增排程</button>
                                </div>
                            </div>
                        </div>
                        <div class="modal-footer">
                            <button id="close-schedule-tab" class="btn secondary">關閉</button>
                        </div>
                    </div>
                </div>
            </div>
         </div>
    `;
    mainContent.innerHTML = html;

    // Initialize state for multi-tab editing
    const state = {
        projectId,
        project,
        currentTabIndex: 0,
        selectedAreaIndex: -1,
        scale: 1,
    };

    // 將 state 暴露到全域，供 Socket.IO 事件處理器使用
    window.editorState = state;

    // 設定當前編輯的 Rich Menu ID（用於游標追蹤）
    currentRichMenuId = state.project.richMenus[state.currentTabIndex].id;

    renderTabs(state);
    await loadCurrentTab(state);
    wireTabControls(state);
    wireMetadataInputs(state);
    wireAreaButtons(state);
    wireActionPanel(state);
    renderJsonPreview(state);

    document.getElementById('image-file').addEventListener('change', (e) => onImageSelected(e, state));

    // Wire upload modal
    const publishBtn = document.getElementById('open-upload-modal');
    const modal = document.getElementById('upload-modal');
    const scopeRadios = Array.from(document.querySelectorAll('input[name="upload-scope"]'));
    const usersGroup = document.getElementById('users-input-group');
    const publishGroup = document.getElementById('publish-target-group');
    const cancelBtn = document.getElementById('cancel-upload');
    const confirmBtn = document.getElementById('confirm-upload');

    const setModalVisible = (show) => {
        if (show) {
            modal.classList.add('show');
            modal.setAttribute('aria-hidden', 'false');
        } else {
            modal.classList.remove('show');
            modal.setAttribute('aria-hidden', 'true');
        }
    };

    publishBtn.addEventListener('click', () => {
        setModalVisible(true);
        publishGroup.style.display = '';
        usersGroup.style.display = (document.querySelector('input[name="publish-target"]:checked').value === 'users') ? '' : 'none';

        // Populate default menu selector with all Rich Menus in the project
        const defaultMenuSelect = document.getElementById('default-menu-select');
        defaultMenuSelect.innerHTML = '<option value="">不設定預設</option>';
        if (state.project && state.project.richMenus) {
            state.project.richMenus.forEach((rm, index) => {
                const name = rm.metadata?.name || rm.alias || `Rich Menu ${index + 1}`;
                const option = document.createElement('option');
                option.value = index;
                option.textContent = name;
                defaultMenuSelect.appendChild(option);
            });
        }
    });
    cancelBtn.addEventListener('click', () => setModalVisible(false));
    document.getElementById('close-upload-modal-x').addEventListener('click', () => setModalVisible(false));
    modal.addEventListener('click', (e) => { if (e.target === modal) setModalVisible(false); });

    Array.from(document.querySelectorAll('input[name="publish-target"]')).forEach(r => {
        r.addEventListener('change', () => {
            usersGroup.style.display = (document.querySelector('input[name="publish-target"]:checked').value === 'users') ? '' : 'none';
        });
    });

    // Toggle only users textarea by publish target; publish options always visible
    scopeRadios.forEach(r => {
        r.addEventListener('change', () => {
            publishGroup.style.display = '';
            usersGroup.style.display = (document.querySelector('input[name="publish-target"]:checked').value === 'users') ? '' : 'none';
        });
    });

    // Unlink selected users (no upload), calling DELETE user richmenu
    document.getElementById('unlink-users').addEventListener('click', async () => {
        try {
            const account = await getAccount(state.project.accountId);
            if (!account || !account.channelAccessToken) throw new Error('請先設定帳號 Token');
            const userIds = (document.getElementById('user-ids').value || '')
                .split(/\r?\n/).map(s => s.trim()).filter(Boolean);
            if (userIds.length === 0) throw new Error('請輸入至少一個使用者 ID');
            for (const uid of userIds) {
                const res = await unlinkRichMenuFromUser(account.channelAccessToken, uid);
                if (!res.ok) throw new Error(`解除使用者 ${uid} 綁定失敗：${res.message || res.status}`);
            }
            alert('已解除指定使用者的綁定');
        } catch (e) {
            alert(e.message || '解除綁定失敗');
        }
    });

    confirmBtn.addEventListener('click', async () => {
        const statusEl = document.getElementById('upload-status');
        statusEl.textContent = '';
        confirmBtn.disabled = true;
        confirmBtn.textContent = '上傳中...';
        try {
            const scope = document.querySelector('input[name="upload-scope"]:checked').value;
            if (scope === 'all') {
                await uploadAllRichMenus(state, (msg) => statusEl.textContent = msg);

                // Get default menu selection
                const defaultMenuSelect = document.getElementById('default-menu-select');
                const defaultMenuIndex = defaultMenuSelect.value;

                // Set default Rich Menu if selected
                if (defaultMenuIndex !== '') {
                    const account = await getAccount(state.project.accountId);
                    const token = account.channelAccessToken;
                    const selectedRM = state.project.richMenus[parseInt(defaultMenuIndex)];
                    const richMenuId = selectedRM && selectedRM.richMenuId;

                    if (richMenuId) {
                        statusEl.textContent = '正在設定預設選單...';
                        const setDef = await setDefaultRichMenu(token, richMenuId);
                        if (!setDef.ok) throw new Error(`設為預設失敗：${setDef.message || setDef.status}`);
                        statusEl.textContent = '預設選單設定完成';
                    } else {
                        throw new Error('選擇的 Rich Menu 尚未上傳成功');
                    }
                }

                // After bulk upload, apply publish choice
                const target = document.querySelector('input[name="publish-target"]:checked').value;
                const userIds = target === 'users' ? (document.getElementById('user-ids').value || '')
                    .split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];
                const account = await getAccount(state.project.accountId);
                const token = account.channelAccessToken;

                if (target === 'users' && userIds.length > 0) {
                    // Bind to specific users (use current tab's menu if not using default selector)
                    const currentRM = getCurrentRichMenu(state);
                    const richMenuId = currentRM && currentRM.richMenuId;
                    if (richMenuId) {
                        for (const uid of userIds) {
                            const link = await linkRichMenuToUser(token, uid, richMenuId);
                            if (!link.ok) throw new Error(`綁定使用者 ${uid} 失敗：${link.message || link.status}`);
                        }
                    }
                }
            } else {
                await uploadCurrentRichMenu(state);
            }
            setModalVisible(false);
            alert('上傳完成');
        } catch (e) {
            statusEl.textContent = e.message || '上傳失敗';
        } finally {
            confirmBtn.disabled = false;
            confirmBtn.textContent = '開始上傳';
        }
    });

    // === Upload Modal Tab Switching ===
    const uploadTabs = document.querySelectorAll('.upload-tab[data-upload-tab]');
    const uploadPanels = document.querySelectorAll('.upload-tab-panel[data-upload-panel]');
    uploadTabs.forEach(tab => {
        tab.addEventListener('click', () => {
            uploadTabs.forEach(t => t.classList.remove('active'));
            uploadPanels.forEach(p => p.classList.remove('active'));
            tab.classList.add('active');
            const panelName = tab.getAttribute('data-upload-tab');
            const panel = document.querySelector(`.upload-tab-panel[data-upload-panel="${panelName}"]`);
            if (panel) panel.classList.add('active');

            // When switching to schedule tab, refresh the schedule list
            if (panelName === 'schedule') {
                refreshScheduleList(state);
                // Also populate the default menu selector for schedule tab
                const schedMenuSelect = document.getElementById('sched-default-menu');
                schedMenuSelect.innerHTML = '<option value="-1">不設定預設</option>';
                if (state.project && state.project.richMenus) {
                    state.project.richMenus.forEach((rm, index) => {
                        const name = rm.metadata?.name || rm.alias || `Rich Menu ${index + 1}`;
                        const option = document.createElement('option');
                        option.value = index;
                        option.textContent = name;
                        schedMenuSelect.appendChild(option);
                    });
                }
            }
        });
    });

    // === Schedule Tab: Target toggle ===
    const schedTargetRadios = document.querySelectorAll('input[name="sched-target"]');
    const schedUsersGroup = document.getElementById('sched-users-group');
    schedTargetRadios.forEach(r => {
        r.addEventListener('change', () => {
            schedUsersGroup.style.display =
                (document.querySelector('input[name="sched-target"]:checked').value === 'users') ? '' : 'none';
        });
    });

    // === Schedule Tab: Repeat type toggle ===
    const schedRepeatRadios = document.querySelectorAll('input[name="sched-repeat"]');
    const schedWeekdayGroup = document.getElementById('sched-weekday-group');
    const schedDayGroup = document.getElementById('sched-day-group');
    schedRepeatRadios.forEach(r => {
        r.addEventListener('change', () => {
            const val = document.querySelector('input[name="sched-repeat"]:checked').value;
            schedWeekdayGroup.style.display = (val === 'weekly') ? '' : 'none';
            schedDayGroup.style.display = (val === 'monthly') ? '' : 'none';
        });
    });

    // Set default date values to today
    const today = new Date().toISOString().split('T')[0];
    const schedStartDate = document.getElementById('sched-start-date');
    const schedEndDate = document.getElementById('sched-end-date');
    if (schedStartDate) schedStartDate.value = today;
    if (schedEndDate) {
        const nextMonth = new Date();
        nextMonth.setMonth(nextMonth.getMonth() + 1);
        schedEndDate.value = nextMonth.toISOString().split('T')[0];
    }

    // === Schedule Form Interactions ===
    const schedInputs = document.querySelectorAll(
        'input[name^="sched-"], input[id^="sched-"], select[id^="sched-"], textarea[id^="sched-"]'
    );
    schedInputs.forEach(input => {
        input.addEventListener('input', checkScheduleDirty);
        input.addEventListener('change', checkScheduleDirty);
    });

    // === Save Schedule (Create or Update) ===
    document.getElementById('save-schedule-btn').addEventListener('click', async () => {
        const btn = document.getElementById('save-schedule-btn');
        if (btn.disabled) return;

        const errorEl = document.getElementById('sched-error');
        errorEl.textContent = '';
        btn.disabled = true;

        try {
            const data = getScheduleFormData();

            if (!data.startDate || !data.endDate) throw new Error('請選擇開始與結束日期');
            if (data.startDate > data.endDate) throw new Error('結束日期不能早於開始日期');
            if (data.target === 'users' && !data.userIds.trim()) throw new Error('請輸入使用者 ID');

            const apiPayload = {
                scope: data.scope,
                current_tab_index: state.currentTabIndex,
                publish_target: data.target,
                user_ids: data.target === 'users' ? data.userIds.split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [],
                default_menu_index: parseInt(data.defaultMenu),
                start_date: data.startDate,
                end_date: data.endDate,
                run_time: data.time,
                repeat_type: data.repeat,
                repeat_weekday: (data.repeat === 'weekly') ? parseInt(data.weekday) : null,
                repeat_day: (data.repeat === 'monthly') ? parseInt(data.day) : null
            };

            if (currentEditingScheduleId) {
                // Update
                const result = await updateScheduledJob(currentEditingScheduleId, apiPayload);
                if (!result.ok) throw new Error(result.message);
                showScheduleToast('排程更新成功', 'success');
                originalScheduleData = getScheduleFormData();
                checkScheduleDirty();
                refreshScheduleList(state);
            } else {
                // Create
                const result = await createScheduledJob(state.project.id, apiPayload);
                if (!result.ok) throw new Error(result.message);
                showScheduleToast('排程建立成功', 'success');

                // Select newly created job
                const newJobId = result.data.id;
                const listResult = await listScheduledJobs(state.project.id);
                if (listResult.ok && listResult.data) {
                    const newJob = listResult.data.find(j => j.id === newJobId);
                    if (newJob) {
                        currentEditingScheduleId = newJobId;
                        isCreatingSchedule = false;
                        setScheduleFormData(newJob);
                        originalScheduleData = getScheduleFormData();
                        updateScheduleFormState();
                        refreshScheduleList(state);
                    } else {
                        resetScheduleForm();
                    }
                } else {
                    resetScheduleForm();
                }
            }
        } catch (e) {
            errorEl.textContent = e.message || '操作失敗';
            // Re-enable button if dirty or error
            if (!currentEditingScheduleId || (currentEditingScheduleId && originalScheduleData && JSON.stringify(getScheduleFormData()) !== JSON.stringify(originalScheduleData))) {
                btn.disabled = false;
            }
        }
    });

    // Close schedule tab button
    document.getElementById('close-schedule-tab').addEventListener('click', () => setModalVisible(false));

    const backBtn = document.getElementById('back-to-projects');
    backBtn.addEventListener('click', async () => {
        if (state.flushAutosave) await state.flushAutosave();
        leaveProject();  // 離開 Socket.IO 房間
        renderProjectSelectionScreen();
    });

    // 加入專案房間
    joinProject(projectId);

    // 廣播當前標籤狀態（確保其他用戶知道我們在哪個標籤）
    // 使用 setTimeout 確保 joinProject 完成後再廣播
    setTimeout(() => {
        const currentRM = state.project.richMenus[state.currentTabIndex];
        if (socket && currentProjectId && currentRM) {
            console.log('廣播初始標籤狀態', currentRM.id);
            socket.emit('tab:switch', {
                project_id: currentProjectId,
                rich_menu_id: currentRM.id,
                user_id: myUserId,
                user_name: myUserName,
                color: myColor
            });
        }
    }, 100);  // 100ms 延遲確保加入房間的操作完成

    // Autosave setup
    const saveStatusEl = document.getElementById('save-status');
    let autosaveTimer = null;
    let saveQueue = Promise.resolve();
    const dirtyRichMenus = new Map();
    const AUTOSAVE_DELAY = 800;

    const updateSaveStatus = ({ state, message }) => {
        if (!saveStatusEl) return;
        if (state === 'saving') {
            saveStatusEl.innerHTML = `<span class="spinner" aria-hidden="true"></span><span>儲存中...</span>`;
        } else if (state === 'saved') {
            saveStatusEl.innerHTML = `<span class="status-dot success-dot" aria-hidden="true"></span><span>已儲存</span>`;
        } else if (state === 'error') {
            saveStatusEl.innerHTML = `<span class="status-dot error-dot" aria-hidden="true"></span><span>${escapeHtml(message || '儲存失敗')}</span>`;
        } else {
            saveStatusEl.textContent = '';
        }
    };

    const setSaving = () => updateSaveStatus({ state: 'saving' });
    const setSaved = () => updateSaveStatus({ state: 'saved' });
    const setSaveError = (err) => updateSaveStatus({ state: 'error', message: err && (err.message || String(err)) });

    async function performAutosave() {
        if (autosaveTimer) {
            clearTimeout(autosaveTimer);
            autosaveTimer = null;
        }

        const pendingMenus = Array.from(dirtyRichMenus.values());
        dirtyRichMenus.clear();
        if (pendingMenus.length === 0) return;

        saveQueue = saveQueue
            .catch(() => undefined)
            .then(async () => {
                for (const richMenu of pendingMenus) {
                    if (!state.project.richMenus.includes(richMenu)) continue;
                    await saveRichMenu(state.project, richMenu);
                    if (isCurrentRichMenu(state, richMenu)) {
                        currentRichMenuId = richMenu.id;
                    }
                }
            });

        try {
            await saveQueue;
            if (dirtyRichMenus.size === 0) setSaved();
        } catch (e) {
            setSaveError(e);
            pendingMenus.forEach(richMenu => {
                if (state.project.richMenus.includes(richMenu)) {
                    dirtyRichMenus.set(String(richMenu.id), richMenu);
                }
            });
        }
    }

    state.scheduleAutosave = function scheduleAutosave(richMenu = getCurrentRichMenu(state)) {
        if (!richMenu) return;
        dirtyRichMenus.set(String(richMenu.id), richMenu);
        if (autosaveTimer) clearTimeout(autosaveTimer);
        setSaving();
        autosaveTimer = setTimeout(performAutosave, AUTOSAVE_DELAY);
    };

    state.flushAutosave = performAutosave;
    state.setSaving = setSaving;
    state.setSaved = setSaved;
    state.setSaveError = setSaveError;
}

function renderTabs(state) {
    const tabsEl = document.getElementById('richmenu-tabs');
    tabsEl.innerHTML = '';

    state.project.richMenus.forEach((rm, index) => {
        const tab = document.createElement('button');
        tab.type = 'button';
        tab.className = `tab ${index === state.currentTabIndex ? 'active' : ''}`;
        tab.dataset.tabIndex = index; // 加入 data 屬性以便 updateTabIndicators 找到
        tab.setAttribute('aria-current', index === state.currentTabIndex ? 'page' : 'false');
        tab.textContent = rm.metadata.name || rm.name || `Rich Menu ${index + 1}`;
        tab.addEventListener('click', (e) => {
            e.preventDefault(); // 防止頁面跳動
            if (index === state.currentTabIndex) return; // 已經是當前 tab，不需要切換
            state.currentTabIndex = index;
            renderTabs(state);
            void loadCurrentTab(state);
        });
        tabsEl.appendChild(tab);
    });

    // 更新 Tab 指示器（顯示其他用戶正在編輯的 Tab）
    updateTabIndicators();

    // Add-tab should be after all tabs
    const addBtn = document.createElement('button');
    addBtn.id = 'add-tab';
    addBtn.className = 'btn small';
    addBtn.innerHTML = '<span style="font-size: 1.1rem;">+</span>';
    addBtn.addEventListener('click', (e) => {
        e.preventDefault(); // 防止頁面跳動
        openAddRichMenuModal(state);
    });
    tabsEl.appendChild(addBtn);
}

async function loadCurrentTab(state) {
    const currentRM = state.project.richMenus[state.currentTabIndex];
    if (!currentRM) return;

    // 更新當前編輯的 Rich Menu ID（用於游標追蹤）
    currentRichMenuId = currentRM.id;

    // 廣播 Tab 切換事件
    if (socket && currentProjectId) {
        socket.emit('tab:switch', {
            project_id: currentProjectId,
            rich_menu_id: currentRM.id,
            user_id: myUserId,
            user_name: myUserName,
            color: myColor
        });
    }

    // 保存當前滾動位置（頁面和編輯區）
    const pageScrollTop = window.pageYOffset || document.documentElement.scrollTop;
    const pageScrollLeft = window.pageXOffset || document.documentElement.scrollLeft;
    const editorGrid = document.querySelector('.editor-grid');
    const editorScrollTop = editorGrid ? editorGrid.scrollTop : 0;
    const editorScrollLeft = editorGrid ? editorGrid.scrollLeft : 0;

    // Force metadata size to 2500x1686
    if (!currentRM.metadata) currentRM.metadata = {};
    const s = currentRM.metadata.size || { width: 2500, height: 1686 };
    if (s.width !== 2500 || s.height !== 1686) {
        currentRM.metadata.size = { width: 2500, height: 1686 };
    }

    // Load metadata into form
    document.getElementById('rm-chatbar').value = currentRM.metadata.chatBarText || '';

    // Update character counter
    const chatbarCounterEl = document.getElementById('chatbar-counter');
    if (chatbarCounterEl) {
        const len = (currentRM.metadata.chatBarText || '').length;
        const maxLen = 14;
        chatbarCounterEl.textContent = `${len}/${maxLen}`;
        chatbarCounterEl.classList.remove('warning', 'error');
        if (len > maxLen) {
            chatbarCounterEl.classList.add('error');
        } else if (len >= maxLen - 2) {
            chatbarCounterEl.classList.add('warning');
        }
    }

    const idEl = document.getElementById('rm-id');
    if (idEl) idEl.value = currentRM.richMenuId || '';
    const aliasEl = document.getElementById('rm-alias-settings');
    if (aliasEl) aliasEl.value = currentRM.alias || '';

    // Image is now uploaded via button in canvas tools, no status display needed

    // Reset area selection and action type
    state.selectedAreaIndex = -1;

    // 更新動作設定面板（包含禁用狀態）
    updateActionPanel(state);

    // Re-render everything for current tab
    await setupCanvas(state);
    renderJsonPreview(state);

    // 恢復滾動位置（使用 requestAnimationFrame 確保 DOM 已更新）
    requestAnimationFrame(() => {
        // 恢復頁面滾動位置
        window.scrollTo(pageScrollLeft, pageScrollTop);

        // 恢復編輯區滾動位置
        if (editorGrid) {
            editorGrid.scrollTop = editorScrollTop;
            editorGrid.scrollLeft = editorScrollLeft;
        }
    });
}

function wireTabControls(state) {
    // add-tab is bound in renderTabs

    // Rich Menu 設定 Modal
    const settingsModal = document.getElementById('richmenu-settings-modal');
    const openSettingsBtn = document.getElementById('open-richmenu-settings');
    const closeSettingsBtn = document.getElementById('close-settings');
    const closeSettingsX = document.getElementById('close-settings-modal');

    let currentSettingsTab = 0; // 0 = 專案設定, 1+ = Rich Menu 設定
    let settingsPreviousFocus = null;

    const renderSettingsTabs = () => {
        const tabsContainer = document.getElementById('settings-tabs');
        const options = state.project.richMenus.map((rm, index) => `
            <option value="${index + 1}" ${currentSettingsTab === index + 1 ? 'selected' : ''}>
                ${escapeHtml(rm.alias || rm.name || `選單 ${index + 1}`)}
            </option>
        `).join('');

        tabsContainer.innerHTML = `
            <button type="button" id="settings-project-tab"
                class="settings-tab${currentSettingsTab === 0 ? ' active' : ''}"
                aria-pressed="${currentSettingsTab === 0}">
                專案設定
            </button>
            <div class="settings-menu-picker${currentSettingsTab > 0 ? ' active' : ''}">
                <label for="settings-richmenu-select">Rich Menu</label>
                <select id="settings-richmenu-select" aria-label="選擇要設定的 Rich Menu">
                    <option value="" disabled ${currentSettingsTab === 0 ? 'selected' : ''}>選擇 Rich Menu</option>
                    ${options}
                </select>
            </div>
        `;

        document.getElementById('settings-project-tab').addEventListener('click', () => {
            currentSettingsTab = 0;
            renderSettingsTabs();
            renderSettingsContent();
        });

        document.getElementById('settings-richmenu-select').addEventListener('change', (event) => {
            currentSettingsTab = Number(event.target.value);
            renderSettingsTabs();
            renderSettingsContent();
        });
    };

    const renderSettingsContent = () => {
        const bodyContainer = document.getElementById('settings-modal-body');
        document.getElementById('settings-status').textContent = '';
        document.getElementById('settings-status').className = '';

        if (currentSettingsTab === 0) {
            // 專案設定
            bodyContainer.innerHTML = `
                <section class="settings-section" aria-labelledby="project-basic-title">
                    <div class="settings-section-heading">
                        <div>
                            <h4 id="project-basic-title">基本資料</h4>
                            <p>這些資訊只用於此編輯器，不會更動 LINE 上的內容。</p>
                        </div>
                    </div>
                    <div class="form-group compact">
                        <label for="project-name-settings">專案名稱</label>
                        <input id="project-name-settings" type="text" value="${escapeHtml(state.project.name)}" placeholder="請輸入專案名稱" />
                    </div>
                    <div class="settings-actions">
                        <button id="save-project-name" class="btn">儲存名稱</button>
                    </div>
                </section>

                <section class="settings-section danger-zone" aria-labelledby="project-danger-title">
                    <div class="settings-section-heading">
                        <div>
                            <h4 id="project-danger-title">危險操作</h4>
                            <p>只會刪除編輯器內的專案與 Rich Menu，不會刪除 LINE 伺服器上的選單。</p>
                        </div>
                    </div>
                    <div class="danger-action-row">
                        <div>
                            <strong>刪除整個專案</strong>
                            <span>此操作無法復原，專案中的所有本機設定都會消失。</span>
                        </div>
                        <button id="delete-project" class="btn danger">刪除專案</button>
                    </div>
                </section>
            `;

            // 儲存專案名稱
            document.getElementById('save-project-name').addEventListener('click', async () => {
                const newName = document.getElementById('project-name-settings').value.trim();
                if (!newName) {
                    alert('專案名稱不能為空');
                    return;
                }

                state.project.name = newName;
                await saveProjectDetails(state.project);

                // 更新頁面標題
                const pageTitle = document.querySelector('.page-title');
                if (pageTitle) {
                    pageTitle.innerHTML = `專案：<strong>${escapeHtml(newName)}</strong>`;
                }

                const statusEl = document.getElementById('settings-status');
                statusEl.textContent = '已儲存專案名稱';
                statusEl.className = 'success';
            });

            // 刪除專案
            document.getElementById('delete-project').addEventListener('click', async () => {
                if (!confirm(`確定要刪除專案「${state.project.name}」嗎？此操作無法復原！`)) return;
                if (!confirm('再次確認：所有 Rich Menu 將被刪除（不影響 LINE 伺服器）')) return;

                try {
                    await deleteProject(state.project.projectId);
                    // 返回專案列表
                    renderProjectSelectionScreen();
                } catch (e) {
                    alert('刪除專案失敗：' + e.message);
                }
            });
        } else {
            // Rich Menu 設定
            const rmIndex = currentSettingsTab - 1;
            const currentRM = state.project.richMenus[rmIndex];
            const isRemoteLinked = Boolean(currentRM.richMenuId);

            bodyContainer.innerHTML = `
                <div class="settings-summary">
                    <div>
                        <span class="settings-eyebrow">目前選單</span>
                        <h4>${escapeHtml(currentRM.metadata.name || currentRM.name || `Rich Menu ${rmIndex + 1}`)}</h4>
                    </div>
                    <span class="status-pill ${isRemoteLinked ? 'connected' : 'local-only'}">
                        ${isRemoteLinked ? '已連結 LINE' : '尚未上傳'}
                    </span>
                </div>

                <section class="settings-section" aria-labelledby="menu-basic-title">
                    <div class="settings-section-heading">
                        <div>
                            <h4 id="menu-basic-title">基本資料</h4>
                            <p>Alias 同時是畫面名稱，也是 Rich Menu 切換時使用的識別名稱。</p>
                        </div>
                    </div>
                    <div class="form-group compact">
                        <label for="rm-alias-settings">Alias（別名）</label>
                        <input id="rm-alias-settings" type="text" value="${escapeHtml(currentRM.alias || '')}" placeholder="例如：menu_main" />
                    </div>
                </section>

                <section class="settings-section" aria-labelledby="line-status-title">
                    <div class="settings-section-heading">
                        <div>
                            <h4 id="line-status-title">LINE 發佈狀態</h4>
                            <p>同步只會讀取 LINE 狀態；取消預設會影響這個官方帳號的所有使用者。</p>
                        </div>
                    </div>
                    <div class="form-group compact">
                        <label for="rm-id">richMenuId</label>
                        <div class="input-with-action">
                            <input id="rm-id" type="text" readonly value="${escapeHtml(currentRM.richMenuId || '')}" placeholder="尚未連結 LINE" />
                            <button id="copy-rm-id" type="button" class="btn small secondary" ${isRemoteLinked ? '' : 'disabled'}>複製</button>
                        </div>
                    </div>
                    <div class="settings-actions split">
                        <button id="fetch-rm-id" class="btn small">同步 LINE 狀態</button>
                        <button id="unset-default" class="btn small secondary">取消帳號預設選單</button>
                    </div>
                </section>

                <section class="settings-section danger-zone" aria-labelledby="menu-danger-title">
                    <div class="settings-section-heading">
                        <div>
                            <h4 id="menu-danger-title">危險操作</h4>
                            <p>請先確認要刪除的是 LINE 上的版本，還是編輯器內的版本。</p>
                        </div>
                    </div>
                    <div class="danger-action-row">
                        <div>
                            <strong>從 LINE 伺服器刪除</strong>
                            <span>保留本機設計，但清除目前的 richMenuId。</span>
                        </div>
                        <button id="delete-remote" class="btn danger secondary-danger" ${isRemoteLinked ? '' : 'disabled'}>刪除 LINE 版本</button>
                    </div>
                    <div class="danger-action-row">
                        <div>
                            <strong>從專案移除</strong>
                            <span>刪除本機設計，不會影響 LINE 伺服器上的版本。</span>
                        </div>
                        <button id="delete-tab" class="btn danger">從專案移除</button>
                    </div>
                </section>
            `;

            // Alias 輸入自動保存
            document.getElementById('rm-alias-settings').addEventListener('input', (e) => {
                currentRM.alias = e.target.value;

                // 更新 tab 名稱和 metadata.name
                const autoName = currentRM.alias || `Rich Menu ${rmIndex + 1}`;
                currentRM.name = autoName;
                currentRM.metadata.name = autoName;

                renderTabs(state);
                renderSettingsTabs();
                if (state.scheduleAutosave) state.scheduleAutosave(currentRM);
            });

            document.getElementById('copy-rm-id').addEventListener('click', async () => {
                if (!currentRM.richMenuId) return;
                try {
                    await navigator.clipboard.writeText(currentRM.richMenuId);
                    const statusEl = document.getElementById('settings-status');
                    statusEl.textContent = '已複製 richMenuId';
                    statusEl.className = 'success';
                } catch (error) {
                    const statusEl = document.getElementById('settings-status');
                    statusEl.textContent = '複製失敗，請手動選取';
                    statusEl.className = 'error';
                }
            });

            // 取得 richMenuId
            document.getElementById('fetch-rm-id').addEventListener('click', async () => {
                const statusEl = document.getElementById('settings-status');
                try {
                    statusEl.textContent = '查詢中...';
                    statusEl.className = '';
                    const account = await getAccount(state.project.accountId);
                    if (!account || !account.channelAccessToken) throw new Error('請先設定帳號 Token');
                    if (!currentRM.metadata || !currentRM.metadata.name) throw new Error('請先填寫名稱，並確保已上傳建立');
                    const listed = await listRichMenus(account.channelAccessToken);
                    if (!listed.ok) throw new Error(listed.message || `列出 Rich Menu 失敗 ${listed.status}`);
                    const matches = (listed.data.richmenus || []).filter(m => m.name === currentRM.metadata.name);
                    if (matches.length === 0) throw new Error('LINE 上找不到同名選單，請先上傳或確認 Alias');
                    if (matches.length > 1) throw new Error('LINE 上有多個同名選單，無法安全判斷；請先清理重複名稱');
                    const found = matches[0];
                    currentRM.richMenuId = found.richMenuId;
                    document.getElementById('rm-id').value = currentRM.richMenuId;
                    await saveRichMenu(state.project, currentRM);
                    renderSettingsContent();
                    statusEl.textContent = '已同步 LINE 狀態';
                    statusEl.className = 'success';
                } catch (e) {
                    statusEl.textContent = e.message || '同步 LINE 狀態失敗';
                    statusEl.className = 'error';
                }
            });

            // 取消預設
            document.getElementById('unset-default').addEventListener('click', async () => {
                const statusEl = document.getElementById('settings-status');
                try {
                    if (!confirm('確定要取消此官方帳號目前的預設 Rich Menu 嗎？這會影響所有未個別綁定選單的使用者。')) return;
                    statusEl.textContent = '處理中...';
                    statusEl.className = '';
                    const account = await getAccount(state.project.accountId);
                    if (!account || !account.channelAccessToken) throw new Error('請先設定帳號 Token');
                    const res = await unsetDefaultRichMenu(account.channelAccessToken);
                    if (!res.ok) throw new Error(res.message || `取消預設失敗 ${res.status}`);
                    statusEl.textContent = '已取消帳號預設選單';
                    statusEl.className = 'success';
                } catch (e) {
                    statusEl.textContent = e.message || '取消預設失敗';
                    statusEl.className = 'error';
                }
            });

            // 刪除遠端
            document.getElementById('delete-remote').addEventListener('click', async () => {
                const statusEl = document.getElementById('settings-status');
                try {
                    if (!currentRM.richMenuId) throw new Error('此選單尚未連結 LINE');
                    if (!confirm(`確定要從 LINE 伺服器刪除 ${currentRM.metadata.name} 嗎？本機設計會保留。`)) return;
                    statusEl.textContent = '刪除中...';
                    statusEl.className = '';
                    const account = await getAccount(state.project.accountId);
                    if (!account || !account.channelAccessToken) throw new Error('請先設定帳號 Token');
                    const del = await deleteRichMenu(account.channelAccessToken, currentRM.richMenuId);
                    if (!del.ok) throw new Error(del.message || `刪除失敗 ${del.status}`);
                    currentRM.richMenuId = '';
                    document.getElementById('rm-id').value = '';
                    await saveRichMenu(state.project, currentRM);
                    renderSettingsContent();
                    statusEl.textContent = '已刪除 LINE 版本，本機設計仍保留';
                    statusEl.className = 'success';
                } catch (e) {
                    statusEl.textContent = e.message || '刪除遠端失敗';
                    statusEl.className = 'error';
                }
            });

            // 移除 Rich Menu
            document.getElementById('delete-tab').addEventListener('click', async () => {
                if (state.project.richMenus.length <= 1) {
                    alert('至少需要保留一個 Rich Menu');
                    return;
                }
                if (confirm(`確定要從專案中移除「${currentRM.metadata.name}」嗎？LINE 上的版本不會被刪除。`)) {
                    try {
                        await deleteRichMenuRecord(currentRM.id);
                    } catch (error) {
                        const statusEl = document.getElementById('settings-status');
                        statusEl.textContent = error.message || '移除 Rich Menu 失敗';
                        statusEl.className = 'error';
                        return;
                    }
                    state.project.richMenus.splice(rmIndex, 1);
                    state.currentTabIndex = Math.min(state.currentTabIndex, state.project.richMenus.length - 1);
                    renderTabs(state);
                    void loadCurrentTab(state);

                    // 重新渲染設定 tabs
                    currentSettingsTab = 0;
                    renderSettingsTabs();
                    renderSettingsContent();
                }
            });
        }
    };

    const setSettingsModalVisible = (show) => {
        if (show) {
            settingsPreviousFocus = document.activeElement;
            currentSettingsTab = state.currentTabIndex + 1;
            renderSettingsTabs();
            renderSettingsContent();
            settingsModal.classList.add('show');
            settingsModal.setAttribute('aria-hidden', 'false');
            requestAnimationFrame(() => {
                const firstControl = document.getElementById('settings-richmenu-select') ||
                    settingsModal.querySelector('input:not([disabled]), select:not([disabled]), button:not([disabled])');
                if (firstControl) firstControl.focus();
            });
        } else {
            settingsModal.classList.remove('show');
            settingsModal.setAttribute('aria-hidden', 'true');
            if (settingsPreviousFocus && typeof settingsPreviousFocus.focus === 'function') {
                settingsPreviousFocus.focus();
            }
            settingsPreviousFocus = null;
        }
    };

    openSettingsBtn.addEventListener('click', () => setSettingsModalVisible(true));

    closeSettingsBtn.addEventListener('click', () => setSettingsModalVisible(false));
    closeSettingsX.addEventListener('click', () => setSettingsModalVisible(false));
    settingsModal.addEventListener('click', (e) => {
        if (e.target === settingsModal) setSettingsModalVisible(false);
    });
    settingsModal.addEventListener('keydown', (e) => {
        if (e.key === 'Escape') {
            e.preventDefault();
            setSettingsModalVisible(false);
            return;
        }
        if (e.key !== 'Tab') return;

        const focusable = Array.from(settingsModal.querySelectorAll(
            'button:not([disabled]), input:not([disabled]), select:not([disabled]), textarea:not([disabled]), [tabindex]:not([tabindex="-1"])'
        )).filter(el => el.offsetParent !== null);
        if (focusable.length === 0) return;

        const first = focusable[0];
        const last = focusable[focusable.length - 1];
        if (e.shiftKey && document.activeElement === first) {
            e.preventDefault();
            last.focus();
        } else if (!e.shiftKey && document.activeElement === last) {
            e.preventDefault();
            first.focus();
        }
    });

    // JSON 預覽 Modal
    const jsonModal = document.getElementById('json-preview-modal');
    const openJsonBtn = document.getElementById('open-json-preview');
    const closeJsonBtn = document.getElementById('close-json');
    const closeJsonX = document.getElementById('close-json-modal');
    const copyJsonBtn = document.getElementById('copy-json');

    const setJsonModalVisible = (show) => {
        if (show) {
            // 更新 JSON 預覽內容
            renderJsonPreview(state);
            jsonModal.classList.add('show');
            jsonModal.setAttribute('aria-hidden', 'false');
        } else {
            jsonModal.classList.remove('show');
            jsonModal.setAttribute('aria-hidden', 'true');
        }
    };

    openJsonBtn.addEventListener('click', () => setJsonModalVisible(true));
    closeJsonBtn.addEventListener('click', () => setJsonModalVisible(false));
    closeJsonX.addEventListener('click', () => setJsonModalVisible(false));
    jsonModal.addEventListener('click', (e) => {
        if (e.target === jsonModal) setJsonModalVisible(false);
    });

    // 複製 JSON
    copyJsonBtn.addEventListener('click', () => {
        const jsonText = document.getElementById('json-preview').value;
        navigator.clipboard.writeText(jsonText).then(() => {
            const originalText = copyJsonBtn.textContent;
            copyJsonBtn.textContent = '已複製！';
            setTimeout(() => {
                copyJsonBtn.textContent = originalText;
            }, 2000);
        }).catch(() => {
            alert('複製失敗，請手動複製');
        });
    });

    // Rich Menu Modal Wiring
    wireAddRichMenuModal(state);
}

function getCurrentRichMenu(state) {
    return state.project.richMenus[state.currentTabIndex];
}

function richMenuIdsMatch(left, right) {
    return left !== null && left !== undefined &&
        right !== null && right !== undefined &&
        String(left) === String(right);
}

function getRichMenuById(state, richMenuId) {
    if (!state || !state.project || !Array.isArray(state.project.richMenus)) return null;
    return state.project.richMenus.find(rm => richMenuIdsMatch(rm.id, richMenuId)) || null;
}

function isCurrentRichMenu(state, richMenu) {
    return Boolean(getCurrentRichMenu(state) === richMenu);
}

function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

function wireMetadataInputs(state) {
    const chatEl = document.getElementById('rm-chatbar');
    const counterEl = document.getElementById('chatbar-counter');

    const updateCharCounter = () => {
        const len = chatEl.value.length;
        const maxLen = 14;
        if (counterEl) {
            counterEl.textContent = `${len}/${maxLen}`;
            // 根據長度設定提示樣式
            counterEl.classList.remove('warning', 'error');
            if (len > maxLen) {
                counterEl.classList.add('error');
            } else if (len >= maxLen - 2) {
                counterEl.classList.add('warning');
            }
        }
    };

    const sync = () => {
        const currentRM = getCurrentRichMenu(state);
        if (!currentRM) return;
        const autoName = currentRM.alias || `Rich Menu ${state.currentTabIndex + 1}`;

        // Fixed size for this editor: 2500x1686
        currentRM.metadata.size = { width: 2500, height: 1686 };
        currentRM.metadata.name = autoName;
        currentRM.metadata.chatBarText = chatEl.value;
        // All Rich Menus are now always expanded (selected: true)
        currentRM.metadata.selected = true;

        // Update tab name with alias or fallback
        currentRM.name = autoName;
        renderTabs(state);
        renderJsonPreview(state);

        // If size changed, re-render canvas to fit
        setupCanvas(state);

        // Update character counter
        updateCharCounter();

        // autosave
        if (state.scheduleAutosave) state.scheduleAutosave();

        // 廣播 metadata 更新
        broadcastMetadataUpdate(currentRM.id, {
            name: currentRM.metadata.name,
            chatBarText: currentRM.metadata.chatBarText,
            size: currentRM.metadata.size,
            selected: currentRM.metadata.selected
        });
    };

    chatEl.addEventListener('input', sync);

    // Initialize counter on first load
    updateCharCounter();
}

async function onImageSelected(e, state) {
    const file = e.target.files && e.target.files[0];
    if (!file) return;

    // Capture current Rich Menu immediately to prevent race condition when switching tabs
    const currentRM = getCurrentRichMenu(state);
    if (!currentRM) return;

    if (!/image\/(png|jpeg)/.test(file.type)) {
        alert('只接受 PNG 或 JPEG');
        e.target.value = '';
        return;
    }
    const dataUrl = await readFileAsDataUrl(file);
    const dim = await getImageDimensions(dataUrl);

    if (!currentRM.metadata || !currentRM.metadata.size) {
        currentRM.metadata = { size: { width: 2500, height: 1686 } };
    }
    const { width: expectW, height: expectH } = currentRM.metadata.size;
    // Accept 1200x810 (will upscale on upload) or exact 2500x1686
    const acceptW = 1200, acceptH = 810;
    const ok = (dim.width === expectW && dim.height === expectH) || (dim.width === acceptW && dim.height === acceptH);
    if (!ok) {
        alert(`圖片需為 1200x810 或 ${expectW}x${expectH}，目前是 ${dim.width}x${dim.height}`);
        e.target.value = '';
        return;
    }

    if (state.flushAutosave) await state.flushAutosave();

    const previousImage = currentRM.image;
    currentRM.image = { name: file.name, type: file.type, dataUrl, width: dim.width, height: dim.height };
    if (isCurrentRichMenu(state, currentRM)) {
        await setupCanvas(state);
        renderJsonPreview(state);
    }
    if (state.setSaving) state.setSaving();

    try {
        if (typeof currentRM.id === 'number') {
            await uploadImageToBackend(currentRM.id, currentRM.image);
            await saveRichMenu(state.project, currentRM);
        } else {
            await saveRichMenu(state.project, currentRM);
        }
        console.log('圖片已上傳到服務器');
        if (state.setSaved) state.setSaved();

        // 廣播圖片更新（使用圖片路徑而不是 dataUrl）
        broadcastMetadataUpdate(currentRM.id, {
            imagePath: currentRM.image.path,
            thumbnailPath: currentRM.image.thumbnail,
            imageName: currentRM.image.name,
            name: currentRM.metadata.name,
            chatBarText: currentRM.metadata.chatBarText,
            size: currentRM.metadata.size
        });
    } catch (error) {
        console.error('上傳圖片失敗:', error);
        currentRM.image = previousImage;
        if (isCurrentRichMenu(state, currentRM)) {
            await setupCanvas(state);
            renderJsonPreview(state);
        }
        if (state.setSaveError) state.setSaveError(error);
        alert(`上傳圖片失敗: ${error.message}`);
    } finally {
        e.target.value = '';
    }
}

function readFileAsDataUrl(file) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(file);
    });
}

function getImageDimensions(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
    });
}

// Update the canvas HTML structure to use two layered canvases
function setupCanvasHTML() {
    const canvasContainer = document.querySelector('.canvas-container');
    if (!canvasContainer) return;
    canvasContainer.innerHTML = `
        <div id="richmenu-canvas-stage" style="position: relative; display: inline-block; width: 100%;">
            <canvas id="richmenu-canvas-bg" style="position: relative; top: 0; left: 0; z-index: 1; display: block; width: 100%;"></canvas>
            <canvas id="richmenu-canvas-overlay" style="position: absolute; top: 0; left: 0; z-index: 2; pointer-events: all; display: block; width: 100%;"></canvas>
        </div>
    `;
}

async function setupCanvas(state) {
    const renderToken = (state.canvasRenderToken || 0) + 1;
    state.canvasRenderToken = renderToken;

    // Ensure canvas HTML structure exists
    setupCanvasHTML();

    const bgCanvas = document.getElementById('richmenu-canvas-bg');
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');

    if (!bgCanvas || !overlayCanvas) {
        console.error('Canvas elements not found');
        return;
    }

    // Measure from wrapper to ensure full width
    const wrapper = overlayCanvas.closest('.canvas-wrapper');
    const stage = document.getElementById('richmenu-canvas-stage');
    const currentRM = getCurrentRichMenu(state);
    if (!currentRM || !currentRM.metadata || !currentRM.metadata.size) return;

    const paddingPx = 16; // .canvas-wrapper has 0.5rem (~8px) left+right
    const maxWidth = (wrapper ? wrapper.clientWidth : 0) - paddingPx;
    const cw = Math.max(100, Math.round(maxWidth * 0.75)); // Scale down to 75% for better overview
    const ch = Math.round(cw * (currentRM.metadata.size.height / currentRM.metadata.size.width));

    // Size stage so wrapper encloses canvases
    if (stage) {
        stage.style.width = cw + 'px';
        stage.style.height = ch + 'px';
    }

    // Setup both canvases with high DPI support
    const dpr = window.devicePixelRatio || 1;
    [bgCanvas, overlayCanvas].forEach(canvas => {
        // Set physical dimensions
        canvas.width = cw * dpr;
        canvas.height = ch * dpr;
        // Set logical (display) dimensions
        canvas.style.width = cw + 'px';
        canvas.style.height = ch + 'px';
    });

    state.scale = cw / currentRM.metadata.size.width;

    // Hook overlay changes to dirty state if available
    state.markDirty = () => {
        const saveBtn = document.getElementById('save-project');
        const dirtyDot = document.getElementById('dirty-dot');
        if (saveBtn) saveBtn.classList.add('dirty');
        if (dirtyDot) dirtyDot.style.display = '';
    };

    // Draw static background once
    await drawBackground(state, bgCanvas, currentRM);

    if (renderToken !== state.canvasRenderToken ||
        bgCanvas !== document.getElementById('richmenu-canvas-bg') ||
        !isCurrentRichMenu(state, currentRM)) {
        return;
    }

    // Draw interactive overlay
    drawOverlay(state);

    // Enable interactions on overlay canvas
    enableAreaInteractions(overlayCanvas, state);
}

async function drawBackground(state, bgCanvas, currentRM) {
    const ctx = bgCanvas.getContext('2d');

    // Clear background
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and scale

    // Use logical dimensions for clearing
    const logicalWidth = bgCanvas.width / dpr;
    const logicalHeight = bgCanvas.height / dpr;
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    if (currentRM.image && currentRM.image.dataUrl) {
        try {
            await drawImageOnCanvas(ctx, currentRM.image.dataUrl, logicalWidth, logicalHeight);
        } catch (error) {
            console.error('背景圖載入失敗:', error);
            ctx.fillStyle = '#fff7ed';
            ctx.fillRect(0, 0, logicalWidth, logicalHeight);
            ctx.fillStyle = '#9a3412';
            ctx.font = '14px sans-serif';
            ctx.fillText('背景圖載入失敗，請重新上傳或稍後再試', 20, 32);
            if (isCurrentRichMenu(state, currentRM) && state.setSaveError) {
                state.setSaveError(new Error('背景圖載入失敗'));
            }
        }
    } else {
        // Draw a subtle grid pattern for empty canvas
        ctx.fillStyle = '#fafafa';
        ctx.fillRect(0, 0, logicalWidth, logicalHeight);

        // Add grid lines
        ctx.strokeStyle = '#e0e0e0';
        ctx.lineWidth = 1;
        const gridSize = 50;
        for (let x = 0; x < logicalWidth; x += gridSize) {
            ctx.beginPath();
            ctx.moveTo(x, 0);
            ctx.lineTo(x, logicalHeight);
            ctx.stroke();
        }
        for (let y = 0; y < logicalHeight; y += gridSize) {
            ctx.beginPath();
            ctx.moveTo(0, y);
            ctx.lineTo(logicalWidth, y);
            ctx.stroke();
        }
    }
}

function drawOverlay(state) {
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');

    // Clear overlay
    const dpr = window.devicePixelRatio || 1;
    ctx.setTransform(dpr, 0, 0, dpr, 0, 0); // Reset and scale

    const logicalWidth = overlayCanvas.width / dpr;
    const logicalHeight = overlayCanvas.height / dpr;
    ctx.clearRect(0, 0, logicalWidth, logicalHeight);

    drawAreas(state);
    drawResizeHandles(state);
}

function drawAreas(state) {
    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');
    const currentRM = getCurrentRichMenu(state);
    const areas = currentRM.metadata.areas || [];

    areas.forEach((area, idx) => {
        const { x, y, width, height } = area.bounds;
        const sx = x * state.scale, sy = y * state.scale, sw = width * state.scale, sh = height * state.scale;

        if (idx === state.selectedAreaIndex) {
            // Selected area - with shadow and thicker border
            ctx.save();

            // Draw shadow first
            ctx.shadowColor = 'rgba(0, 0, 0, 0.3)';
            ctx.shadowBlur = 8;
            ctx.shadowOffsetX = 2;
            ctx.shadowOffsetY = 2;

            ctx.strokeStyle = '#02a568';
            ctx.lineWidth = 3;
            ctx.strokeRect(sx, sy, sw, sh);

            ctx.restore();

            // Fill with transparency
            ctx.fillStyle = 'rgba(2,165,104,0.15)';
            ctx.fillRect(sx, sy, sw, sh);
        } else {
            // Normal area - with subtle shadow
            ctx.save();

            // Draw shadow
            ctx.shadowColor = 'rgba(0, 0, 0, 0.2)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.strokeStyle = '#1a73e8';
            ctx.lineWidth = 2;
            ctx.strokeRect(sx, sy, sw, sh);

            ctx.restore();

            ctx.fillStyle = 'rgba(26,115,232,0.08)';
            ctx.fillRect(sx, sy, sw, sh);
        }

        // Draw area number with background
        ctx.save();
        ctx.fillStyle = idx === state.selectedAreaIndex ? '#02a568' : '#1a73e8';
        ctx.font = 'bold 12px Arial';
        const text = `#${idx + 1}`;
        const textWidth = ctx.measureText(text).width;

        // Text background
        ctx.fillStyle = 'rgba(255, 255, 255, 0.9)';
        ctx.fillRect(sx + 2, sy + 2, textWidth + 4, 16);

        // Text
        ctx.fillStyle = idx === state.selectedAreaIndex ? '#02a568' : '#1a73e8';
        ctx.fillText(text, sx + 4, sy + 14);
        ctx.restore();
    });
}

function drawImageOnCanvas(ctx, dataUrl, w, h) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            ctx.drawImage(img, 0, 0, w, h);
            resolve();
        };
        img.onerror = () => reject(new Error('無法讀取圖片'));
        img.src = dataUrl;
    });
}

// renderAreaList removed - users select areas directly on canvas

function wireAreaButtons(state) {
    document.getElementById('add-area').addEventListener('click', () => {
        const currentRM = getCurrentRichMenu(state);
        const defaultW = Math.floor(currentRM.metadata.size.width / 5);
        const defaultH = Math.floor(currentRM.metadata.size.height / 5);
        const area = {
            bounds: { x: 0, y: 0, width: defaultW, height: defaultH },
            action: { type: 'uri', uri: '' }
        };
        currentRM.metadata.areas.push(area);
        state.selectedAreaIndex = currentRM.metadata.areas.length - 1;
        setupCanvas(state);
        updateActionPanel(state);
        renderJsonPreview(state);
        if (state.scheduleAutosave) state.scheduleAutosave();

        // 廣播區域更新
        broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
    });

    document.getElementById('delete-area').addEventListener('click', () => {
        if (state.selectedAreaIndex < 0) return;
        const currentRM = getCurrentRichMenu(state);
        currentRM.metadata.areas.splice(state.selectedAreaIndex, 1);
        state.selectedAreaIndex = -1;
        setupCanvas(state);
        updateActionPanel(state);
        renderJsonPreview(state);
        if (state.scheduleAutosave) state.scheduleAutosave();

        // 廣播區域更新
        broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
    });
}

function enableAreaInteractions(canvas, state) {
    let mode = 'select'; // 'select', 'creating', 'dragging', 'resizing'
    let dragStart = null;
    let dragOffset = { x: 0, y: 0 };
    let resizeHandle = null; // 'nw', 'ne', 'sw', 'se', 'n', 's', 'e', 'w'

    // 設定游標追蹤（節流）
    const throttledCursorBroadcast = throttle((e) => {
        const rect = canvas.getBoundingClientRect();
        if (rect.width === 0 || rect.height === 0) return;

        const relativeX = (e.clientX - rect.left) / rect.width;
        const relativeY = (e.clientY - rect.top) / rect.height;

        // 確保相對座標在 0-1 範圍內
        if (relativeX >= 0 && relativeX <= 1 && relativeY >= 0 && relativeY <= 1) {
            broadcastCursorMove(relativeX, relativeY);
        }
    }, 50);

    // Update cursor based on hover
    canvas.onmousemove = (e) => {
        throttledCursorBroadcast(e);
        if (mode === 'creating') {
            // Draw preview rectangle while creating - only redraw overlay
            const pos = getCanvasPos(e, canvas);
            drawOverlay(state); // Redraw existing areas

            const ctx = canvas.getContext('2d');
            const x = Math.min(dragStart.x, pos.x);
            const y = Math.min(dragStart.y, pos.y);
            const w = Math.abs(pos.x - dragStart.x);
            const h = Math.abs(pos.y - dragStart.y);

            // Draw preview with shadow
            ctx.save();
            ctx.shadowColor = 'rgba(2, 165, 104, 0.3)';
            ctx.shadowBlur = 4;
            ctx.shadowOffsetX = 1;
            ctx.shadowOffsetY = 1;

            ctx.strokeStyle = '#02a568';
            ctx.lineWidth = 2;
            ctx.setLineDash([5, 5]);
            ctx.strokeRect(x, y, w, h);

            ctx.restore();

            ctx.fillStyle = 'rgba(2,165,104,0.1)';
            ctx.fillRect(x, y, w, h);
            ctx.setLineDash([]);
            return;
        }

        if (mode === 'dragging' && state.selectedAreaIndex >= 0) {
            const pos = getCanvasPos(e, canvas);
            const currentRM = getCurrentRichMenu(state);
            const area = currentRM.metadata.areas[state.selectedAreaIndex];

            // Move area keeping size, clamp to canvas
            let nx = Math.round((pos.x - dragOffset.x) / state.scale);
            let ny = Math.round((pos.y - dragOffset.y) / state.scale);
            nx = Math.max(0, Math.min(nx, currentRM.metadata.size.width - area.bounds.width));
            ny = Math.max(0, Math.min(ny, currentRM.metadata.size.height - area.bounds.height));
            area.bounds.x = nx;
            area.bounds.y = ny;

            drawOverlay(state); // Only redraw overlay
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();
            return;
        }

        if (mode === 'resizing' && state.selectedAreaIndex >= 0 && resizeHandle) {
            const pos = getCanvasPos(e, canvas);
            const currentRM = getCurrentRichMenu(state);
            const area = currentRM.metadata.areas[state.selectedAreaIndex];
            const bounds = area.bounds;

            // Convert to canvas coordinates for easier calculation
            let newBounds = { ...bounds };
            const canvasX = pos.x / state.scale;
            const canvasY = pos.y / state.scale;

            switch (resizeHandle) {
                case 'nw':
                    newBounds.width = bounds.x + bounds.width - canvasX;
                    newBounds.height = bounds.y + bounds.height - canvasY;
                    newBounds.x = canvasX;
                    newBounds.y = canvasY;
                    break;
                case 'ne':
                    newBounds.width = canvasX - bounds.x;
                    newBounds.height = bounds.y + bounds.height - canvasY;
                    newBounds.y = canvasY;
                    break;
                case 'sw':
                    newBounds.width = bounds.x + bounds.width - canvasX;
                    newBounds.height = canvasY - bounds.y;
                    newBounds.x = canvasX;
                    break;
                case 'se':
                    newBounds.width = canvasX - bounds.x;
                    newBounds.height = canvasY - bounds.y;
                    break;
                case 'n':
                    newBounds.height = bounds.y + bounds.height - canvasY;
                    newBounds.y = canvasY;
                    break;
                case 's':
                    newBounds.height = canvasY - bounds.y;
                    break;
                case 'w':
                    newBounds.width = bounds.x + bounds.width - canvasX;
                    newBounds.x = canvasX;
                    break;
                case 'e':
                    newBounds.width = canvasX - bounds.x;
                    break;
            }

            // Clamp to minimum size and canvas bounds
            newBounds.width = Math.max(20, newBounds.width);
            newBounds.height = Math.max(20, newBounds.height);
            newBounds.x = Math.max(0, Math.min(newBounds.x, currentRM.metadata.size.width - newBounds.width));
            newBounds.y = Math.max(0, Math.min(newBounds.y, currentRM.metadata.size.height - newBounds.height));

            // Ensure right and bottom edges don't exceed canvas
            if (newBounds.x + newBounds.width > currentRM.metadata.size.width) {
                newBounds.width = currentRM.metadata.size.width - newBounds.x;
            }
            if (newBounds.y + newBounds.height > currentRM.metadata.size.height) {
                newBounds.height = currentRM.metadata.size.height - newBounds.y;
            }

            // Round to integers to avoid fractional bounds
            newBounds.x = Math.round(newBounds.x);
            newBounds.y = Math.round(newBounds.y);
            newBounds.width = Math.round(newBounds.width);
            newBounds.height = Math.round(newBounds.height);

            area.bounds = newBounds;
            if (state.markDirty) state.markDirty();
            drawOverlay(state); // Only redraw overlay
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();
            return;
        }

        // Update cursor based on what's under mouse
        const pos = getCanvasPos(e, canvas);
        const hitIndex = hitTestArea(pos, state);
        const handle = getResizeHandle(pos, state);

        if (handle) {
            canvas.style.cursor = getResizeCursor(handle);
        } else if (hitIndex >= 0) {
            canvas.style.cursor = 'move';
        } else {
            canvas.style.cursor = 'crosshair';
        }
    };

    canvas.onmousedown = (e) => {
        const pos = getCanvasPos(e, canvas);

        // Check for resize handle first
        const handle = getResizeHandle(pos, state);
        if (handle && state.selectedAreaIndex >= 0) {
            mode = 'resizing';
            resizeHandle = handle;
            return;
        }

        // Check for area hit
        const hitIndex = hitTestArea(pos, state);
        if (hitIndex >= 0) {
            // Select and start dragging
            state.selectedAreaIndex = hitIndex;
            mode = 'dragging';
            const currentRM = getCurrentRichMenu(state);
            const area = currentRM.metadata.areas[hitIndex];
            dragOffset.x = pos.x - area.bounds.x * state.scale;
            dragOffset.y = pos.y - area.bounds.y * state.scale;

            drawOverlay(state);
            updateActionPanel(state);
            return;
        }

        // Start creating new area
        mode = 'creating';
        dragStart = pos;
        state.selectedAreaIndex = -1;
        updateActionPanel(state);
    };

    canvas.onmouseup = (e) => {
        if (mode === 'creating' && dragStart) {
            const pos = getCanvasPos(e, canvas);
            const x = Math.min(dragStart.x, pos.x);
            const y = Math.min(dragStart.y, pos.y);
            const w = Math.abs(pos.x - dragStart.x);
            const h = Math.abs(pos.y - dragStart.y);

            // Only create if area is large enough
            if (w > 10 && h > 10) {
                const currentRM = getCurrentRichMenu(state);
                const area = {
                    bounds: {
                        x: Math.round(x / state.scale),
                        y: Math.round(y / state.scale),
                        width: Math.round(w / state.scale),
                        height: Math.round(h / state.scale)
                    },
                    action: { type: 'uri', uri: '' }
                };

                // Clamp to canvas bounds
                area.bounds.x = Math.max(0, Math.min(area.bounds.x, currentRM.metadata.size.width - area.bounds.width));
                area.bounds.y = Math.max(0, Math.min(area.bounds.y, currentRM.metadata.size.height - area.bounds.height));

                currentRM.metadata.areas.push(area);
                state.selectedAreaIndex = currentRM.metadata.areas.length - 1;

                updateActionPanel(state);
                renderJsonPreview(state);
                if (state.scheduleAutosave) state.scheduleAutosave();

                // 廣播新增的區域
                broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
            }

            drawOverlay(state);
        }

        // 如果完成拖曳或調整大小，廣播更新
        if (mode === 'dragging' || mode === 'resizing') {
            const currentRM = getCurrentRichMenu(state);
            broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
        }

        mode = 'select';
        dragStart = null;
        resizeHandle = null;
    };

    // === 觸控事件支援 ===
    canvas.ontouchstart = (e) => {
        if (e.cancelable) e.preventDefault(); // 防止滾動

        // 模擬 mousedown 事件物件結構
        const touch = e.touches[0];
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => { }
        };

        canvas.onmousedown(mockEvent);
    };

    canvas.ontouchmove = (e) => {
        if (e.cancelable) e.preventDefault();

        const touch = e.touches[0];
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => { }
        };

        canvas.onmousemove(mockEvent);
    };

    canvas.ontouchend = (e) => {
        if (e.cancelable) e.preventDefault();

        const touch = e.changedTouches[0];
        const mockEvent = {
            clientX: touch.clientX,
            clientY: touch.clientY,
            preventDefault: () => { }
        };

        canvas.onmouseup(mockEvent);
    };

    // Prevent context menu
    canvas.oncontextmenu = (e) => {
        e.preventDefault();
        return false;
    };

    // 滑鼠離開 Canvas 時廣播離開事件
    canvas.onmouseleave = () => {
        if (!socket || !currentProjectId || !currentRichMenuId) return;
        socket.emit('cursor:leave', {
            project_id: currentProjectId,
            rich_menu_id: currentRichMenuId,
            user_id: myUserId
        });
    };
}

// Update redrawCanvas to use the new dual-canvas approach
function redrawCanvas(state) {
    void setupCanvas(state);
}

function drawResizeHandles(state) {
    if (state.selectedAreaIndex < 0) return;

    const overlayCanvas = document.getElementById('richmenu-canvas-overlay');
    const ctx = overlayCanvas.getContext('2d');
    const currentRM = getCurrentRichMenu(state);
    const area = currentRM.metadata.areas[state.selectedAreaIndex];
    const { x, y, width, height } = area.bounds;

    const sx = x * state.scale;
    const sy = y * state.scale;
    const sw = width * state.scale;
    const sh = height * state.scale;

    const handleSize = 8;
    const handles = [
        { x: sx - handleSize / 2, y: sy - handleSize / 2 }, // nw
        { x: sx + sw / 2 - handleSize / 2, y: sy - handleSize / 2 }, // n
        { x: sx + sw - handleSize / 2, y: sy - handleSize / 2 }, // ne
        { x: sx + sw - handleSize / 2, y: sy + sh / 2 - handleSize / 2 }, // e
        { x: sx + sw - handleSize / 2, y: sy + sh - handleSize / 2 }, // se
        { x: sx + sw / 2 - handleSize / 2, y: sy + sh - handleSize / 2 }, // s
        { x: sx - handleSize / 2, y: sy + sh - handleSize / 2 }, // sw
        { x: sx - handleSize / 2, y: sy + sh / 2 - handleSize / 2 }, // w
    ];

    handles.forEach(handle => {
        ctx.save();

        // Draw handle shadow
        ctx.shadowColor = 'rgba(0, 0, 0, 0.4)';
        ctx.shadowBlur = 3;
        ctx.shadowOffsetX = 1;
        ctx.shadowOffsetY = 1;

        ctx.fillStyle = '#02a568';
        ctx.fillRect(handle.x, handle.y, handleSize, handleSize);

        ctx.restore();

        // Draw handle border
        ctx.strokeStyle = '#fff';
        ctx.lineWidth = 1;
        ctx.strokeRect(handle.x, handle.y, handleSize, handleSize);
    });
}

function getResizeHandle(pos, state) {
    if (state.selectedAreaIndex < 0) return null;

    const currentRM = getCurrentRichMenu(state);
    const area = currentRM.metadata.areas[state.selectedAreaIndex];
    const { x, y, width, height } = area.bounds;

    const sx = x * state.scale;
    const sy = y * state.scale;
    const sw = width * state.scale;
    const sh = height * state.scale;

    const handleSize = 8;
    const tolerance = handleSize / 2;

    const handles = [
        { name: 'nw', x: sx, y: sy },
        { name: 'n', x: sx + sw / 2, y: sy },
        { name: 'ne', x: sx + sw, y: sy },
        { name: 'e', x: sx + sw, y: sy + sh / 2 },
        { name: 'se', x: sx + sw, y: sy + sh },
        { name: 's', x: sx + sw / 2, y: sy + sh },
        { name: 'sw', x: sx, y: sy + sh },
        { name: 'w', x: sx, y: sy + sh / 2 },
    ];

    for (const handle of handles) {
        if (Math.abs(pos.x - handle.x) <= tolerance && Math.abs(pos.y - handle.y) <= tolerance) {
            return handle.name;
        }
    }

    return null;
}

function getResizeCursor(handle) {
    const cursors = {
        'nw': 'nw-resize',
        'n': 'n-resize',
        'ne': 'ne-resize',
        'e': 'e-resize',
        'se': 'se-resize',
        's': 's-resize',
        'sw': 'sw-resize',
        'w': 'w-resize'
    };
    return cursors[handle] || 'default';
}

function wireActionPanel(state) {
    const typeEl = document.getElementById('action-type');
    if (!typeEl) return;
    typeEl.addEventListener('change', () => {
        const idx = state.selectedAreaIndex;
        if (idx < 0) return;
        const val = typeEl.value;
        const currentRM = getCurrentRichMenu(state);
        const area = currentRM.metadata.areas[idx];
        if (val === 'none') {
            delete area.action;
        } else {
            area.action = { type: val };
            // 若是 richmenuswitch，初始化 data 與 richMenuAliasId 為空字串
            // renderActionFields 會在使用者選擇 alias 時自動同步 data
            if (val === 'richmenuswitch') {
                area.action.richMenuAliasId = '';
                area.action.data = '';
            } else if (val === 'flex') {
                area.action.data = '';
                area.action.displayText = 'Flex Message';
            }
        }
        renderActionFields(state);
        renderJsonPreview(state);
        if (state.scheduleAutosave) state.scheduleAutosave();

        // 廣播區域更新（action type 改變）
        broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
    });
    renderActionFields(state);
}

function updateActionPanel(state) {
    const typeEl = document.getElementById('action-type');
    const titleEl = document.getElementById('actions-panel-title');
    const actionsPanel = document.querySelector('.actions-panel');

    if (!typeEl) return;

    if (state.selectedAreaIndex < 0) {
        // 沒有選擇區域時，禁用動作設定
        typeEl.value = 'none';
        typeEl.disabled = true;
        if (titleEl) titleEl.textContent = '動作設定（請先選擇區域）';
        if (actionsPanel) actionsPanel.classList.add('disabled');
        renderActionFields(state);
        return;
    }

    // 有選擇區域時，啟用動作設定
    typeEl.disabled = false;
    if (actionsPanel) actionsPanel.classList.remove('disabled');

    // 更新標題顯示區域編號
    if (titleEl) {
        titleEl.textContent = `動作設定 - #${state.selectedAreaIndex + 1} 區域`;
    }

    const currentRM = getCurrentRichMenu(state);
    const area = currentRM.metadata.areas[state.selectedAreaIndex];
    const t = area && area.action ? area.action.type : 'none';
    typeEl.value = t || 'none';
    renderActionFields(state);
}

function renderActionFields(state) {
    const fields = document.getElementById('action-fields');
    if (!fields) return;
    fields.innerHTML = '';
    const idx = state.selectedAreaIndex;
    if (idx < 0) return;
    const currentRM = getCurrentRichMenu(state);
    const area = currentRM.metadata.areas[idx];
    const type = area.action && area.action.type;
    if (!type || type === 'none') return;

    const addField = (label, id, value = '') => {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lab = document.createElement('label');
        lab.textContent = label;
        const input = document.createElement('input');
        input.id = id;
        input.type = 'text';
        input.value = value || '';
        input.addEventListener('input', () => {
            area.action[id] = input.value;
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();

            // 廣播區域更新（action 改變）
            const currentRM = getCurrentRichMenu(state);
            broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
        });
        group.appendChild(lab);
        group.appendChild(input);
        fields.appendChild(group);
    };

    const addSelect = (label, id, options, value = '') => {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lab = document.createElement('label');
        lab.textContent = label;
        const select = document.createElement('select');
        select.id = id;
        options.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.value === value) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener('change', () => {
            area.action[id] = select.value;
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();

            // 廣播區域更新（action 改變）
            const currentRM = getCurrentRichMenu(state);
            broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
        });
        group.appendChild(lab);
        group.appendChild(select);
        fields.appendChild(group);
    };

    const addTextarea = (label, id, value = '', maxLength = 300) => {
        const group = document.createElement('div');
        group.className = 'form-group';
        const lab = document.createElement('label');
        lab.textContent = label;

        const textarea = document.createElement('textarea');
        textarea.id = id;
        textarea.value = value || '';
        textarea.rows = 3;
        textarea.maxLength = maxLength;
        textarea.style.resize = 'vertical';
        textarea.style.minHeight = '60px';

        // 建立字數提示元素
        const charCount = document.createElement('div');
        charCount.className = 'char-count';
        charCount.style.fontSize = '0.85em';
        charCount.style.color = '#666';
        charCount.style.marginTop = '4px';
        charCount.style.textAlign = 'right';
        const updateCharCount = () => {
            const current = textarea.value.length;
            charCount.textContent = `${current}/${maxLength} 字`;
            if (current > maxLength * 0.9) {
                charCount.style.color = '#ff6b6b';
            } else {
                charCount.style.color = '#666';
            }
        };
        updateCharCount();

        textarea.addEventListener('input', () => {
            area.action[id] = textarea.value;
            updateCharCount();
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();

            // 廣播區域更新（action 改變）
            const currentRM = getCurrentRichMenu(state);
            broadcastAreasUpdate(currentRM.id, currentRM.metadata.areas);
        });

        group.appendChild(lab);
        group.appendChild(textarea);
        group.appendChild(charCount);
        fields.appendChild(group);
    };

    if (type === 'uri') {
        addField('URL 或電話號碼', 'uri', area.action.uri);
    } else if (type === 'message') {
        addField('文字訊息', 'text', area.action.text);
    } else if (type === 'postback') {
        addField('資料 payload', 'data', area.action.data);
        addTextarea('文字顯示（選填）', 'displayText', area.action.displayText, 300);
    } else if (type === 'richmenuswitch') {
        // Show dropdown of aliases from current project
        const aliasOptions = [{ value: '', text: '請選擇 Rich Menu' }];
        state.project.richMenus.forEach((rm, idx) => {
            if (rm.alias) {
                aliasOptions.push({ value: rm.alias, text: `${rm.alias} (${rm.name})` });
            } else {
                aliasOptions.push({ value: `tab_${idx}`, text: `${rm.name} (無 alias)` });
            }
        });

        // 修改 addSelect 以自動同步 data 欄位
        const group = document.createElement('div');
        group.className = 'form-group';
        const lab = document.createElement('label');
        lab.textContent = '切換到 Rich Menu';
        const select = document.createElement('select');
        select.id = 'richMenuAliasId';
        aliasOptions.forEach(opt => {
            const option = document.createElement('option');
            option.value = opt.value;
            option.textContent = opt.text;
            if (opt.value === (area.action.richMenuAliasId || '')) option.selected = true;
            select.appendChild(option);
        });
        select.addEventListener('change', () => {
            const selectedAlias = select.value;
            area.action.richMenuAliasId = selectedAlias;
            // 自動同步 data 欄位：LINE API 要求 data 必須填入且內容為目標 alias
            area.action.data = selectedAlias;
            renderJsonPreview(state);
            if (state.scheduleAutosave) state.scheduleAutosave();
        });
        group.appendChild(lab);
        group.appendChild(select);
        fields.appendChild(group);

        // 初始化時也確保 data 與 richMenuAliasId 同步
        if (area.action.richMenuAliasId && area.action.data !== area.action.richMenuAliasId) {
            area.action.data = area.action.richMenuAliasId;
        }

        // data 欄位不再顯示，已自動處理
    } else if (type === 'flex') {
        const wrapper = document.createElement('div');

        // Ensure Modal exists
        createFlexEditorModal();

        // Flex container for Select + Edit Button
        const controls = document.createElement('div');
        controls.style.display = 'flex';
        controls.style.gap = '8px';
        controls.style.alignItems = 'flex-end';
        controls.className = 'form-group';

        // 1. Selector
        const selContainer = document.createElement('div');
        selContainer.style.flex = '1';
        const selLabel = document.createElement('label');
        selLabel.textContent = '選擇 Flex Message';
        const select = document.createElement('select');
        select.style.marginBottom = '0'; // Override default margin for alignment

        // Edit Button
        const editBtn = document.createElement('button');
        editBtn.className = 'btn secondary small';
        editBtn.innerHTML = '✏️'; // Pencil icon
        editBtn.title = '編輯此 Flex Message';
        editBtn.style.display = 'none';
        editBtn.style.minHeight = '35px'; // Fix height mismatch
        editBtn.style.padding = '0 10px';
        editBtn.style.marginBottom = '1px';

        const refreshList = async () => {
            select.innerHTML = '';
            const defaultOpt = document.createElement('option');
            defaultOpt.value = '';
            defaultOpt.text = '-- 請選擇 --';
            select.appendChild(defaultOpt);

            const msgs = await listFlexMessages();
            msgs.forEach(acc => {
                const opt = document.createElement('option');
                opt.value = acc.id;
                opt.textContent = `${acc.name}`;
                if (area.action.flexMessageId == acc.id) opt.selected = true;
                select.appendChild(opt);
            });

            // Add "Create New" option
            const newOpt = document.createElement('option');
            newOpt.value = 'NEW';
            newOpt.text = '+ 新增 Flex Message...';
            newOpt.style.fontWeight = 'bold';
            newOpt.style.color = '#02a568';
            select.appendChild(newOpt);

            // Update UI state based on current selection
            const currentId = select.value;
            if (currentId && currentId !== 'NEW') {
                editBtn.style.display = 'inline-block';
            } else {
                editBtn.style.display = 'none';
            }
        };

        select.addEventListener('change', () => {
            const val = select.value;
            // If user selected "Create New", open modal immediately
            if (val === 'NEW') {
                // Reset selection to avoid showing "NEW" selected
                select.value = area.action.flexMessageId || '';
                openFlexEditorModal(null, async (newId) => {
                    await refreshList();
                    // Select the new one
                    if (newId) {
                        // Find option with newId
                        const opts = Array.from(select.options);
                        if (opts.find(o => o.value == newId)) {
                            select.value = newId;
                            // Trigger logic for selecting existing
                            select.dispatchEvent(new Event('change'));
                        }
                    }
                });
                return;
            }

            if (val) {
                area.action.flexMessageId = val;
                area.action.data = `action=flex&id=${val}`;
                // area.action.displayText = area.action.displayText || 'Flex Message';
                renderJsonPreview(state);
                if (state.scheduleAutosave) state.scheduleAutosave();
                editBtn.style.display = 'inline-block';
            } else {
                // Cleared
                area.action.flexMessageId = '';
                area.action.data = '';
                editBtn.style.display = 'none';
            }
        });

        // Edit Button Click
        editBtn.addEventListener('click', () => {
            const fid = area.action.flexMessageId;
            if (fid) {
                openFlexEditorModal(fid, async hidingFleID => {
                    await refreshList(); // Refresh list in case name changed or deleted

                    // Re-select if still exists (hidingFleID is null if deleted)
                    if (hidingFleID) {
                        const opts = Array.from(select.options);
                        if (opts.find(o => o.value == hidingFleID)) {
                            select.value = hidingFleID;
                        }
                    } else {
                        // Deleted
                        area.action.flexMessageId = '';
                        area.action.data = '';
                        select.value = '';
                        editBtn.style.display = 'none';
                    }
                    renderJsonPreview(state);
                });
            }
        });

        // Init list
        refreshList();

        selContainer.appendChild(selLabel);
        selContainer.appendChild(select);
        controls.appendChild(selContainer);
        controls.appendChild(editBtn);
        wrapper.appendChild(controls);

        fields.appendChild(wrapper);

        // displayText field (Optional)
        // displayText field (Optional)
        addTextarea('文字顯示 (聊天室顯示文字，留空則不顯示)', 'displayText', area.action.displayText, 300);
    }
}

// === Flex Message Editor Modal ===
function createFlexEditorModal() {
    if (document.getElementById('flex-editor-modal')) return;

    const modalHtml = `
    <div id="flex-editor-modal" class="modal-backdrop" aria-hidden="true" style="z-index: 10000;">
        <div class="modal modal-large" role="dialog" aria-modal="true">
            <div class="modal-header">
                <h3 id="flex-modal-title">Flex Message 設定</h3>
                <button class="modal-close" id="close-flex-modal">&times;</button>
            </div>
            <div class="modal-body">
                <div class="form-group">
                    <label>名稱 (識別用)</label>
                    <input type="text" id="flex-name" placeholder="例如：課程介紹卡片">
                </div>
                <div class="form-group">
                    <label>Flex Message JSON (此處填寫 JSON 內容 object)</label>
                    <textarea id="flex-json" rows="15" style="font-family: monospace; font-size: 12px;" placeholder='{ "type": "bubble", ... }'></textarea>
                    <div style="text-align: right; margin-top: 5px;">
                       <a href="https://developers.line.biz/flex-simulator/" target="_blank" style="font-size: 0.9em; color: #02a568;">開啟 LINE Flex Simulator ↗</a>
                    </div>
                </div>
            </div>
            <div class="modal-footer" style="display: flex; justify-content: space-between;">
                <button id="delete-flex-btn" class="btn danger" style="display: none;">刪除</button>
                <div style="display: flex; gap: 10px;">
                    <button id="cancel-flex-btn" class="btn secondary">取消</button>
                    <button id="save-flex-btn" class="btn primary">儲存</button>
                </div>
            </div>
        </div>
    </div>
    `;
    document.body.insertAdjacentHTML('beforeend', modalHtml);

    // Close handlers
    const modal = document.getElementById('flex-editor-modal');
    const close = () => modal.classList.remove('show');
    document.getElementById('close-flex-modal').addEventListener('click', close);
    document.getElementById('cancel-flex-btn').addEventListener('click', close);
}

async function openFlexEditorModal(flexId, onSaveCallback) {
    const modal = document.getElementById('flex-editor-modal');
    const title = document.getElementById('flex-modal-title');
    const nameInput = document.getElementById('flex-name');
    const jsonInput = document.getElementById('flex-json');
    const deleteBtn = document.getElementById('delete-flex-btn');
    const saveBtn = document.getElementById('save-flex-btn');

    // Reset
    nameInput.value = '';
    jsonInput.value = '';
    deleteBtn.style.display = 'none';

    if (flexId) {
        title.textContent = '編輯 Flex Message';
        deleteBtn.style.display = 'block';
        // Load data
        const data = await getFlexMessage(flexId);
        if (data) {
            nameInput.value = data.name;
            jsonInput.value = JSON.stringify(data.json_content, null, 2);
        }
    } else {
        title.textContent = '新增 Flex Message';
    }

    modal.classList.add('show');

    // Remove old listeners to prevent duplication (simple clone replacement)
    const newSaveBtn = saveBtn.cloneNode(true);
    saveBtn.parentNode.replaceChild(newSaveBtn, saveBtn);

    const newDeleteBtn = deleteBtn.cloneNode(true);
    deleteBtn.parentNode.replaceChild(newDeleteBtn, deleteBtn);

    newSaveBtn.addEventListener('click', async () => {
        const name = nameInput.value.trim();
        const jsonStr = jsonInput.value.trim();

        if (!name) return alert('請輸入名稱');
        if (!jsonStr) return alert('請輸入 JSON');

        let parsed;
        try {
            parsed = JSON.parse(jsonStr);
        } catch (e) {
            return alert('JSON 格式錯誤');
        }

        try {
            let resultId = flexId;
            if (flexId) {
                await updateFlexMessage(flexId, name, parsed);
            } else {
                const res = await createFlexMessage(name, parsed);
                resultId = res.id;
            }
            modal.classList.remove('show');
            if (onSaveCallback) onSaveCallback(resultId);
        } catch (e) {
            alert('儲存失敗: ' + e.message);
        }
    });

    if (flexId) {
        newDeleteBtn.addEventListener('click', async () => {
            if (!confirm('確定要刪除此 Flex Message 嗎？此動作無法復原。')) return;
            try {
                await deleteFlexMessage(flexId);
                modal.classList.remove('show');
                if (onSaveCallback) onSaveCallback(null); // null indicates deletion
            } catch (e) {
                alert('刪除失敗: ' + e.message);
            }
        });
    }
}



function renderJsonPreview(state) {
    const currentRM = getCurrentRichMenu(state);
    // Build LINE API metadata object
    const metadata = {
        size: currentRM.metadata.size,
        selected: currentRM.metadata.selected,
        name: currentRM.metadata.name,
        chatBarText: currentRM.metadata.chatBarText,
        areas: (currentRM.metadata.areas || []).map(a => ({
            bounds: a.bounds,
            action: normalizeAction(a.action)
        }))
    };

    const jsonEl = document.getElementById('json-preview');
    jsonEl.value = JSON.stringify(metadata, null, 2);
}

function normalizeAction(action) {
    if (!action || !action.type || action.type === 'none') return undefined;
    const t = action.type;
    if (t === 'uri') return { type: 'uri', uri: action.uri || '' };
    if (t === 'message') return { type: 'message', text: action.text || '' };
    if (t === 'postback') return { type: 'postback', data: action.data || '', displayText: action.displayText || undefined };
    if (t === 'flex') return { type: 'postback', data: action.data || '', displayText: action.displayText || undefined };
    if (t === 'richmenuswitch') return { type: 'richmenuswitch', richMenuAliasId: action.richMenuAliasId || '', data: action.data || undefined };
    return undefined;
}

async function saveDraft(state) {
    if (state.flushAutosave) await state.flushAutosave();
    alert('專案已保存');
}

const getCanvasPos = (evt, canvas) => {
    const rect = canvas.getBoundingClientRect();
    // Use style width (logical) if available, otherwise rect width
    const logicalWidth = parseFloat(canvas.style.width) || rect.width;
    const logicalHeight = parseFloat(canvas.style.height) || rect.height;

    return {
        x: (evt.clientX - rect.left) * (logicalWidth / rect.width),
        y: (evt.clientY - rect.top) * (logicalHeight / rect.height)
    };
};

// 觸控事件輔助函式
const getTouchPos = (evt, canvas) => {
    const rect = canvas.getBoundingClientRect();
    const touch = evt.touches[0] || evt.changedTouches[0];
    const logicalWidth = parseFloat(canvas.style.width) || rect.width;
    const logicalHeight = parseFloat(canvas.style.height) || rect.height;

    return {
        x: (touch.clientX - rect.left) * (logicalWidth / rect.width),
        y: (touch.clientY - rect.top) * (logicalHeight / rect.height)
    };
};

function hitTestArea(pos, state) {
    const currentRM = getCurrentRichMenu(state);
    const areas = currentRM.metadata.areas || [];
    for (let i = areas.length - 1; i >= 0; i--) {
        const a = areas[i];
        const x = a.bounds.x * state.scale;
        const y = a.bounds.y * state.scale;
        const w = a.bounds.width * state.scale;
        const h = a.bounds.height * state.scale;
        if (pos.x >= x && pos.x <= x + w && pos.y >= y && pos.y <= y + h) {
            return i;
        }
    }
    return -1;
}

function buildCurrentRichMenuMetadata(state) {
    return buildRichMenuMetadata(getCurrentRichMenu(state));
}

function buildRichMenuMetadata(currentRM) {
    return {
        size: currentRM.metadata.size,
        selected: currentRM.metadata.selected,
        name: currentRM.metadata.name,
        chatBarText: currentRM.metadata.chatBarText,
        areas: (currentRM.metadata.areas || []).map(a => ({
            bounds: a.bounds,
            action: normalizeAction(a.action)
        }))
    };
}

function dataUrlToBlob(dataUrl) {
    const [meta, b64] = dataUrl.split(',');
    const mime = (meta.match(/data:(.*?);base64/) || [])[1] || 'image/png';
    const binary = atob(b64);
    const len = binary.length;
    const bytes = new Uint8Array(len);
    for (let i = 0; i < len; i++) bytes[i] = binary.charCodeAt(i);
    return new Blob([bytes], { type: mime });
}

// Add: preflight validation for actions and bounds
function validateRichMenuMetadata(metadata) {
    if (!metadata) throw new Error('內部錯誤：metadata 缺失');
    if (!metadata.name || !metadata.chatBarText) throw new Error('請填寫名稱與 Chat Bar 文字');

    // Validate chatBarText length (LINE API limit: 14 characters)
    if (metadata.chatBarText.length > 14) {
        throw new Error(`Chat Bar 文字過長（${metadata.chatBarText.length}/14 字），請刪減至 14 字以內`);
    }

    const size = metadata.size || { width: 0, height: 0 };
    const issues = [];

    (metadata.areas || []).forEach((area, index) => {
        const b = area && area.bounds ? area.bounds : { x: 0, y: 0, width: 0, height: 0 };
        // Bounds checks
        if (b.x < 0 || b.y < 0 || b.width <= 0 || b.height <= 0) {
            issues.push(`areas[${index}].bounds 非法`);
        }
        if (b.x + b.width > size.width || b.y + b.height > size.height) {
            issues.push(`areas[${index}].bounds 超出畫布`);
        }

        const act = area && area.action ? area.action : undefined;
        if (!act) {
            issues.push(`areas[${index}].action 必須指定`);
            return;
        }
        if (!act.type || act.type === 'none') {
            issues.push(`areas[${index}].action.type 必須指定`);
            return;
        }

        // Required fields per action type
        if (act.type === 'uri') {
            if (!act.uri || (!/^https?:\/\//i.test(act.uri) && !/^tel:/i.test(act.uri))) {
                issues.push(`areas[${index}].action.uri 必須為有效的 URL 或電話號碼 (tel:)`);
            }
        } else if (act.type === 'message') {
            if (!act.text || act.text.trim() === '') {
                issues.push(`areas[${index}].action.text 必須指定`);
            }
        } else if (act.type === 'postback') {
            if (!act.data || act.data.trim() === '') {
                issues.push(`areas[${index}].action.data 必須指定`);
            }
        } else if (act.type === 'richmenuswitch') {
            if (!act.richMenuAliasId || act.richMenuAliasId.trim() === '') {
                issues.push(`areas[${index}].action.richMenuAliasId 必須指定`);
            }
            // act.data is optional for richmenuswitch
        } else if (act.type === 'flex') {
            if (!act.data || act.data.trim() === '') {
                issues.push(`areas[${index}].action: 請選擇或建立一個 Flex Message`);
            }
        }
    });

    if (issues.length > 0) {
        throw new Error(issues.join('\n'));
    }
}

async function uploadCurrentRichMenu(state) {
    const currentRM = getCurrentRichMenu(state);
    if (!currentRM) throw new Error('找不到目前的 Rich Menu');
    if (!currentRM.image || !currentRM.image.dataUrl) throw new Error('請先上傳符合尺寸的圖片');

    const accountId = state.project.accountId;
    const account = await getAccount(accountId);
    if (!account || !account.channelAccessToken) throw new Error('找不到帳號的 Channel Access Token');
    const token = account.channelAccessToken;

    const target = document.querySelector('input[name="publish-target"]:checked').value;
    const userIds = target === 'users' ? (document.getElementById('user-ids').value || '')
        .split(/\r?\n/).map(s => s.trim()).filter(Boolean) : [];

    const metadata = buildCurrentRichMenuMetadata(state);
    // Preflight validations
    validateRichMenuMetadata(metadata);

    // Delete existing rich menus with the same name
    const listed = await listRichMenus(token);
    if (!listed.ok) throw new Error(`列出 Rich Menu 失敗：${listed.message || listed.status}`);
    const sameNameMenus = (listed.data.richmenus || []).filter(m => m.name === metadata.name);
    for (const m of sameNameMenus) {
        const del = await deleteRichMenu(token, m.richMenuId);
        if (!del.ok) throw new Error(`刪除同名 Rich Menu 失敗：${del.message || del.status}`);
    }

    // Create metadata
    const created = await createRichMenu(token, metadata);
    if (!created.ok) throw new Error(`建立 Rich Menu 失敗：${created.message || created.status}`);
    const richMenuId = created.data.richMenuId;

    // Prepare upload image: ensure 2500x1686 and compress to JPEG to reduce size
    const targetW = metadata.size.width;
    const targetH = metadata.size.height;
    let quality = 0.9;
    let uploadDataUrl = await resizeImageDataUrl(currentRM.image.dataUrl, targetW, targetH, 'image/jpeg', quality);
    let blob = dataUrlToBlob(uploadDataUrl);
    // Target max ~4.5MB to be safe under common proxy limits
    const MAX_BYTES = 4_500_000;
    while (blob.size > MAX_BYTES && quality > 0.6) {
        quality -= 0.1;
        uploadDataUrl = await resizeImageDataUrl(currentRM.image.dataUrl, targetW, targetH, 'image/jpeg', Math.max(quality, 0.6));
        blob = dataUrlToBlob(uploadDataUrl);
    }
    const uploaded = await uploadRichMenuImage(token, richMenuId, blob);
    if (!uploaded.ok) throw new Error(`上傳圖片失敗：${uploaded.message || uploaded.status}`);

    // Sync alias to latest richMenuId if alias is provided
    if (currentRM.alias && currentRM.alias.trim() !== '') {
        // Try update first; if fails with 404, create
        let aliasRes = await updateAlias(token, currentRM.alias.trim(), richMenuId);
        if (!aliasRes.ok && aliasRes.status === 404) {
            aliasRes = await createAlias(token, currentRM.alias.trim(), richMenuId);
        }
        if (!aliasRes.ok) throw new Error(`同步 alias 失敗：${aliasRes.message || aliasRes.status}`);
    }

    // Persist the created richMenuId into current tab data for later operations
    currentRM.richMenuId = richMenuId;
    await saveRichMenu(state.project, currentRM);

    // Bind
    if (target === 'all') {
        const setDef = await setDefaultRichMenu(token, richMenuId);
        if (!setDef.ok) throw new Error(`設為預設失敗：${setDef.message || setDef.status}`);
    } else if (userIds.length > 0) {
        for (const uid of userIds) {
            const link = await linkRichMenuToUser(token, uid, richMenuId);
            if (!link.ok) throw new Error(`綁定使用者 ${uid} 失敗：${link.message || link.status}`);
        }
    }
}

async function uploadAllRichMenus(state, onProgress) {
    const project = state.project;
    if (!project || !Array.isArray(project.richMenus) || project.richMenus.length === 0) {
        throw new Error('此專案沒有任何 Rich Menu');
    }
    const account = await getAccount(project.accountId);
    if (!account || !account.channelAccessToken) throw new Error('找不到帳號的 Channel Access Token');
    const token = account.channelAccessToken;

    for (let i = 0; i < project.richMenus.length; i++) {
        const currentRM = project.richMenus[i];
        const nameLabel = currentRM?.metadata?.name || `Rich Menu ${i + 1}`;
        if (onProgress) onProgress(`(${i + 1}/${project.richMenus.length}) 準備上傳：${nameLabel}`);

        if (!currentRM.image || !currentRM.image.dataUrl) {
            throw new Error(`「${nameLabel}」缺少圖片，請先上傳圖片`);
        }

        const metadata = buildRichMenuMetadata(currentRM);
        validateRichMenuMetadata(metadata);

        // Remove duplicates by name before create
        const listed = await listRichMenus(token);
        if (!listed.ok) throw new Error(`列出 Rich Menu 失敗：${listed.message || listed.status}`);
        const sameNameMenus = (listed.data.richmenus || []).filter(m => m.name === metadata.name);
        for (const m of sameNameMenus) {
            const del = await deleteRichMenu(token, m.richMenuId);
            if (!del.ok) throw new Error(`刪除同名 Rich Menu 失敗：${del.message || del.status}`);
        }

        if (onProgress) onProgress(`(${i + 1}/${project.richMenus.length}) 建立 metadata：${nameLabel}`);
        const created = await createRichMenu(token, metadata);
        if (!created.ok) throw new Error(`建立 Rich Menu 失敗：${created.message || created.status}`);
        const richMenuId = created.data.richMenuId;

        // Prepare and upload image
        const targetW = metadata.size.width;
        const targetH = metadata.size.height;
        let quality = 0.9;
        let uploadDataUrl = await resizeImageDataUrl(currentRM.image.dataUrl, targetW, targetH, 'image/jpeg', quality);
        let blob = dataUrlToBlob(uploadDataUrl);
        const MAX_BYTES = 4_500_000;
        while (blob.size > MAX_BYTES && quality > 0.6) {
            quality -= 0.1;
            uploadDataUrl = await resizeImageDataUrl(currentRM.image.dataUrl, targetW, targetH, 'image/jpeg', Math.max(quality, 0.6));
            blob = dataUrlToBlob(uploadDataUrl);
        }

        if (onProgress) onProgress(`(${i + 1}/${project.richMenus.length}) 上傳圖片：${nameLabel}`);
        const uploaded = await uploadRichMenuImage(token, richMenuId, blob);
        if (!uploaded.ok) throw new Error(`上傳圖片失敗：${uploaded.message || uploaded.status}`);

        // Alias sync if needed
        if (currentRM.alias && currentRM.alias.trim() !== '') {
            if (onProgress) onProgress(`(${i + 1}/${project.richMenus.length}) 同步 alias：${currentRM.alias}`);
            let aliasRes = await updateAlias(token, currentRM.alias.trim(), richMenuId);
            if (!aliasRes.ok && aliasRes.status === 404) {
                aliasRes = await createAlias(token, currentRM.alias.trim(), richMenuId);
            }
            if (!aliasRes.ok) throw new Error(`同步 alias 失敗：${aliasRes.message || aliasRes.status}`);
        }

        currentRM.richMenuId = richMenuId;
        await saveRichMenu(state.project, currentRM);
    }

    if (onProgress) onProgress('全部上傳完成');
}

async function resizeImageDataUrl(dataUrl, targetW, targetH, mime = 'image/jpeg', quality = 0.9) {
    return new Promise((resolve, reject) => {
        const img = new Image();
        img.onload = () => {
            try {
                const canvas = document.createElement('canvas');
                canvas.width = targetW;
                canvas.height = targetH;
                const ctx = canvas.getContext('2d');
                ctx.imageSmoothingEnabled = true;
                ctx.imageSmoothingQuality = 'high';
                ctx.drawImage(img, 0, 0, targetW, targetH);
                const out = canvas.toDataURL(mime, quality);
                resolve(out);
            } catch (err) {
                reject(err);
            }
        };
        img.onerror = reject;
        img.src = dataUrl;
    });
}

// === Schedule List Management ===

const REPEAT_TYPE_LABELS = {
    daily: '每天',
    weekly: '每週',
    monthly: '每月',
    once: '僅一次'
};

const WEEKDAY_LABELS = ['一', '二', '三', '四', '五', '六', '日'];

let currentEditingScheduleId = null;
let originalScheduleData = null;
let isCreatingSchedule = false;

// Helper: Get form data
function getScheduleFormData() {
    const scope = document.querySelector('input[name="sched-scope"]:checked')?.value || 'single';
    const target = document.querySelector('input[name="sched-target"]:checked')?.value || 'all';
    const userIds = document.getElementById('sched-user-ids').value;
    const defaultMenu = document.getElementById('sched-default-menu').value;
    const repeat = document.querySelector('input[name="sched-repeat"]:checked')?.value || 'daily';
    const weekday = document.getElementById('sched-weekday').value;
    const day = document.getElementById('sched-day').value;
    const time = document.getElementById('sched-time').value;
    const startDate = document.getElementById('sched-start-date').value;
    const endDate = document.getElementById('sched-end-date').value;

    return {
        scope, target, userIds, defaultMenu, repeat, weekday, day, time, startDate, endDate
    };
}

// Helper: Set form data
function setScheduleFormData(job) {
    const scopeRadio = document.querySelector(`input[name="sched-scope"][value="${job.scope}"]`);
    if (scopeRadio) scopeRadio.checked = true;

    const targetRadio = document.querySelector(`input[name="sched-target"][value="${job.publish_target}"]`);
    if (targetRadio) {
        targetRadio.checked = true;
        targetRadio.dispatchEvent(new Event('change'));
    }

    if (job.user_ids) {
        document.getElementById('sched-user-ids').value = job.user_ids.join('\n');
    }

    document.getElementById('sched-default-menu').value = job.default_menu_index;

    const repeatRadio = document.querySelector(`input[name="sched-repeat"][value="${job.repeat_type}"]`);
    if (repeatRadio) {
        repeatRadio.checked = true;
        repeatRadio.dispatchEvent(new Event('change'));
    }

    if (job.repeat_weekday !== null) document.getElementById('sched-weekday').value = job.repeat_weekday;
    if (job.repeat_day !== null) document.getElementById('sched-day').value = job.repeat_day;

    document.getElementById('sched-time').value = job.run_time;
    document.getElementById('sched-start-date').value = job.start_date;
    document.getElementById('sched-end-date').value = job.end_date;
}

// Helper: Reset form (Enter Create Mode)
function resetScheduleForm() {
    currentEditingScheduleId = null;
    originalScheduleData = null;
    isCreatingSchedule = true;

    document.querySelector('input[name="sched-scope"][value="single"]').checked = true;
    const targetRadio = document.querySelector('input[name="sched-target"][value="all"]');
    targetRadio.checked = true;
    targetRadio.dispatchEvent(new Event('change'));

    document.getElementById('sched-user-ids').value = '';
    document.getElementById('sched-default-menu').value = '-1';

    const repeatRadio = document.querySelector('input[name="sched-repeat"][value="daily"]');
    repeatRadio.checked = true;
    repeatRadio.dispatchEvent(new Event('change'));

    document.getElementById('sched-weekday').value = '0';
    document.getElementById('sched-day').value = '1';
    document.getElementById('sched-time').value = '00:00';

    const today = new Date().toISOString().split('T')[0];
    document.getElementById('sched-start-date').value = today;

    const nextMonth = new Date();
    nextMonth.setMonth(nextMonth.getMonth() + 1);
    document.getElementById('sched-end-date').value = nextMonth.toISOString().split('T')[0];

    updateScheduleFormState();
    refreshScheduleList(window.editorState); // Using window.editorState as fallback or passed state
}

// Helper: Reset to Placeholder (No Selection)
function resetToPlaceholder() {
    currentEditingScheduleId = null;
    originalScheduleData = null;
    isCreatingSchedule = false;
    refreshScheduleList(window.editorState);
}

// Helper: Update Form State
function updateScheduleFormState() {
    const titleEl = document.getElementById('schedule-form-title');
    const btnEl = document.getElementById('save-schedule-btn');

    if (currentEditingScheduleId) {
        titleEl.textContent = '編輯排程';
        btnEl.textContent = '更新排程';
        checkScheduleDirty();
    } else {
        titleEl.textContent = '新增排程';
        btnEl.textContent = '新增排程';
        // Force enable for new
        btnEl.classList.remove('disabled');
        btnEl.disabled = false;
    }
}

// Helper: Check Dirty
function checkScheduleDirty() {
    if (!currentEditingScheduleId || !originalScheduleData) return;

    const currentData = getScheduleFormData();
    const isDirty = JSON.stringify(currentData) !== JSON.stringify(originalScheduleData);

    const btnEl = document.getElementById('save-schedule-btn');
    if (isDirty) {
        btnEl.classList.remove('disabled');
        btnEl.disabled = false;
    } else {
        btnEl.classList.add('disabled');
        btnEl.disabled = true;
    }
}

// Helper: Toast
function showScheduleToast(message, type = 'success') {
    const toast = document.getElementById('schedule-toast');
    if (toast) {
        toast.textContent = message;
        toast.className = `schedule-toast show ${type}`;
        setTimeout(() => {
            toast.classList.remove('show');
        }, 3000);
    }
}

async function refreshScheduleList(state) {
    const listEl = document.getElementById('schedule-list');
    const boxEditor = document.getElementById('schedule-editor');
    const boxPlaceholder = document.getElementById('schedule-placeholder');

    if (!listEl || !state.project) return;

    // Visibility Logic
    if (!currentEditingScheduleId && !isCreatingSchedule) {
        if (boxEditor) boxEditor.style.display = 'none';
        if (boxPlaceholder) boxPlaceholder.style.display = 'flex';
    } else {
        if (boxEditor) boxEditor.style.display = 'block';
        if (boxPlaceholder) boxPlaceholder.style.display = 'none';
    }

    try {
        const result = await listScheduledJobs(state.project.id);
        if (!result.ok) {
            listEl.innerHTML = '<p class="schedule-empty">載入失敗</p>';
            return;
        }

        const jobs = result.data || [];
        listEl.innerHTML = '';

        jobs.forEach(job => {
            listEl.appendChild(renderScheduleCard(job, state));
        });

        // Add "Add New" Card at the END
        const addCard = document.createElement('div');
        addCard.className = `schedule-card add-new-card ${isCreatingSchedule ? 'selected' : ''}`;
        addCard.innerHTML = '<div class="add-icon">+</div><div>新增排程</div>';
        addCard.addEventListener('click', () => {
            resetScheduleForm();
        });
        listEl.appendChild(addCard);

    } catch (e) {
        console.error(e);
        listEl.innerHTML = '<p class="schedule-empty">載入失敗</p>';
    }
}

function renderScheduleCard(job, state) {
    const card = document.createElement('div');
    const isSelected = currentEditingScheduleId === job.id;
    card.className = `schedule-card${job.enabled ? '' : ' disabled'}${isSelected ? ' selected' : ''}`;

    const repeatLabel = REPEAT_TYPE_LABELS[job.repeat_type] || job.repeat_type;
    let freqDetail = '';
    if (job.repeat_type === 'weekly' && job.repeat_weekday !== null) {
        freqDetail = ` 星期${WEEKDAY_LABELS[job.repeat_weekday] || job.repeat_weekday}`;
    } else if (job.repeat_type === 'monthly' && job.repeat_day !== null) {
        freqDetail = ` ${job.repeat_day}號`;
    }

    const scopeLabel = job.scope === 'all' ? '全部' : '單一';
    const targetLabel = job.publish_target === 'all' ? '所有人' : '特定';

    let statusHtml = '';
    if (job.last_run_at) {
        const statusClass = job.last_run_status === 'success' ? 'success' : 'error';
        const statusIcon = job.last_run_status === 'success' ? '✅' : '❌';
        const runDate = job.last_run_at.substring(5, 16).replace('T', ' '); // MM-DD HH:MM
        statusHtml = `<div class="schedule-status ${statusClass}">${statusIcon} ${runDate} ${job.last_run_message || ''}</div>`;
    }

    card.innerHTML = `
        <div class="schedule-card-header">
            <span class="schedule-card-date">📅 ${job.end_date} 止</span>
            <span class="schedule-card-freq">${repeatLabel}${freqDetail} ${job.run_time}</span>
        </div>
        <div class="schedule-card-info">${scopeLabel} | ${targetLabel}</div>
        ${statusHtml}
        <div class="schedule-card-actions">
            <label class="schedule-toggle-label">
                <input type="checkbox" class="schedule-toggle" ${job.enabled ? 'checked' : ''} />
                <span>${job.enabled ? '啟用' : '停用'}</span>
            </label>
            <button class="btn small danger schedule-delete-btn">刪除</button>
        </div>
    `;

    // Click to load settings
    card.addEventListener('click', (e) => {
        // Prevent if clicking actions
        if (e.target.closest('.schedule-card-actions')) return;

        currentEditingScheduleId = job.id;
        isCreatingSchedule = false;
        setScheduleFormData(job);
        originalScheduleData = getScheduleFormData();
        updateScheduleFormState();
        refreshScheduleList(state); // Re-render to update selection
    });

    // Toggle enable/disable
    const toggle = card.querySelector('.schedule-toggle');
    toggle.addEventListener('change', async (e) => {
        e.stopPropagation(); // Prevent card click
        try {
            await updateScheduledJob(job.id, { enabled: toggle.checked ? 1 : 0 });
            showScheduleToast(toggle.checked ? '排程已啟用' : '排程已停用', 'success');
            // Update UI
            if (!toggle.checked) card.classList.add('disabled');
            else card.classList.remove('disabled');
        } catch (e) {
            alert('更新排程狀態失敗');
            toggle.checked = !toggle.checked;
        }
    });

    // Delete button
    const deleteBtn = card.querySelector('.schedule-delete-btn');
    deleteBtn.addEventListener('click', async (e) => {
        e.stopPropagation(); // Prevent card click
        if (!confirm('確定要刪除此排程？')) return;
        try {
            await deleteScheduledJob(job.id);
            showScheduleToast('排程已刪除', 'success');
            if (currentEditingScheduleId === job.id) {
                resetToPlaceholder();
            } else {
                refreshScheduleList(state);
            }
        } catch (e) {
            alert('刪除失敗');
        }
    });

    return card;
}
