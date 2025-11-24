/**
 * 更新 Tab 編輯狀態指示器
 * 在每個 Tab 上顯示哪些用戶正在編輯
 */
function updateTabIndicators() {
    if (!window.editorState) return;

    const state = window.editorState;
    const tabsContainer = document.querySelector('.rich-menu-tabs');
    if (!tabsContainer) return;

    // 遍歷所有 Rich Menu
    state.project.richMenus.forEach((rm, index) => {
        const tabEl = tabsContainer.querySelector(`[data-tab-index="${index}"]`);
        if (!tabEl) return;

        // 移除現有的指示器
        const existingIndicator = tabEl.querySelector('.tab-editor-indicator');
        if (existingIndicator) {
            existingIndicator.remove();
        }

        // 找出正在編輯此 Rich Menu 的用戶
        const editors = Object.values(activeEditors)
            .filter(editor => editor.richMenuId === rm.id);

        if (editors.length > 0) {
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

// CSS 動畫（如果還沒有的話）
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
