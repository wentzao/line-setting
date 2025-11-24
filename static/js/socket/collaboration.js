// socket/collaboration.js - Real-time collaboration with Socket.IO

import { generateUserId, generateRandomColor, getCurrentRichMenu } from '../utils/helpers.js';
import { getImageDimensions } from '../utils/image.js';

// Private module variables
let socket = null;
let currentProjectId = null;
let myUserId = generateUserId();
let myUserName = '使用者' + Math.floor(Math.random() * 1000);
let myColor = generateRandomColor();
let remoteCursors = {};

/**
 * Initialize Socket.IO connection and event listeners
 */
export function initSocketIO() {
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

    // User join/leave events
    socket.on('user:joined', (data) => {
        console.log(`${data.user_name} 加入專案`);
        showNotification(`${data.user_name} 加入協作`, 'info');
    });

    socket.on('user:left', (data) => {
        console.log(`${data.user_name} 離開專案`);
        if (remoteCursors[data.user_id]) {
            remoteCursors[data.user_id].element.remove();
            delete remoteCursors[data.user_id];
        }
    });

    // Rich Menu area updates
    socket.on('richmenu:update_areas', (data) => {
        if (data.sender === myUserId) return;
        if (!window.editorState) return;

        const state = window.editorState;
        const currentRM = getCurrentRichMenu(state);

        if (currentRM && currentRM.id === data.rich_menu_id) {
            currentRM.metadata.areas = data.areas;
            if (window.drawOverlay) window.drawOverlay(state);
            if (window.renderJsonPreview) window.renderJsonPreview(state);
            if (window.updateActionPanel) window.updateActionPanel(state);
            showNotification('其他使用者更新了區域', 'info');
        }
    });

    // Rich Menu metadata updates
    socket.on('richmenu:update_metadata', async (data) => {
        if (data.sender === myUserId) return;
        if (!window.editorState) return;

        const state = window.editorState;
        const currentRM = getCurrentRichMenu(state);

        if (currentRM && currentRM.id === data.rich_menu_id) {
            if (data.metadata.name !== undefined) currentRM.metadata.name = data.metadata.name;
            if (data.metadata.chatBarText !== undefined) currentRM.metadata.chatBarText = data.metadata.chatBarText;
            if (data.metadata.size) currentRM.metadata.size = data.metadata.size;
            if (data.metadata.selected !== undefined) currentRM.metadata.selected = data.metadata.selected;

            if (window.renderTabs) window.renderTabs(state);
            if (window.renderJsonPreview) window.renderJsonPreview(state);
            showNotification('其他使用者更新了設定', 'info');
        }
    });

    // Cursor movement sync
    socket.on('cursor:move', (data) => {
        if (data.user_id === myUserId) return;
        drawRemoteCursor(data);
    });
}

/**
 * Join a project room
 * @param {string} projectId - Project ID to join
 */
export function joinProject(projectId) {
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

/**
 * Leave current project room
 */
export function leaveProject() {
    if (currentProjectId && socket) {
        socket.emit('leave_project', { project_id: currentProjectId });
        currentProjectId = null;
    }
}

/**
 * Broadcast areas update to other users
 * @param {string} richMenuId - Rich Menu ID
 * @param {Array} areas - Areas array
 */
export function broadcastAreasUpdate(richMenuId, areas) {
    if (!socket || !currentProjectId) return;
    socket.emit('richmenu:update_areas', {
        project_id: currentProjectId,
        rich_menu_id: richMenuId,
        areas: areas,
        sender: myUserId
    });
}

/**
 * Broadcast metadata update to other users
 * @param {string} richMenuId - Rich Menu ID
 * @param {Object} metadata - Metadata object
 */
export function broadcastMetadataUpdate(richMenuId, metadata) {
    if (!socket || !currentProjectId) return;
    socket.emit('richmenu:update_metadata', {
        project_id: currentProjectId,
        rich_menu_id: richMenuId,
        metadata: metadata,
        sender: myUserId
    });
}

/**
 * Broadcast cursor movement
 * @param {number} x - X coordinate
 * @param {number} y - Y coordinate
 */
export function broadcastCursorMove(x, y) {
    if (!socket || !currentProjectId) return;
    socket.emit('cursor:move', {
        project_id: currentProjectId,
        x: x,
        y: y,
        user_id: myUserId,
        user_name: myUserName,
        color: myColor
    });
}

/**
 * Draw remote user's cursor
 * @param {Object} data - Cursor data {user_id, x, y, user_name, color}
 */
function drawRemoteCursor(data) {
    let cursor = remoteCursors[data.user_id];

    if (!cursor) {
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

    cursor.element.style.left = data.x + 'px';
    cursor.element.style.top = data.y + 'px';
}

/**
 * Show notification to user
 * @param {string} message - Notification message
 * @param {string} type - Type: 'info', 'error', 'success'
 */
export function showNotification(message, type = 'info') {
    console.log(`[${type.toUpperCase()}] ${message}`);

    let backgroundColor;
    if (type === 'info') backgroundColor = '#1a73e8';
    else if (type === 'error') backgroundColor = '#d93025';
    else backgroundColor = '#02a568';

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
        animation: slideIn 0.3s ease;
    `;
    notification.textContent = message;
    document.body.appendChild(notification);

    setTimeout(() => {
        notification.style.animation = 'slideOut 0.3s ease';
        setTimeout(() => notification.remove(), 300);
    }, 3000);
}
