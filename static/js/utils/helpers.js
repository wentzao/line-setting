// utils/helpers.js - Common utility functions

/**
 * Escape HTML special characters to prevent XSS
 * @param {string} str - String to escape
 * @returns {string} Escaped string
 */
export function escapeHtml(str) {
    if (typeof str !== 'string') return '';
    return str.replace(/[&<>"]+/g, (c) => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;' }[c]));
}

/**
 * Get current active Rich Menu from state
 * @param {Object} state - Editor state
 * @returns {Object} Current Rich Menu object
 */
export function getCurrentRichMenu(state) {
    return state.project.richMenus[state.currentTabIndex];
}

/**
 * Throttle function execution
 * @param {Function} func - Function to throttle
 * @param {number} limit - Minimum time between executions in ms
 * @returns {Function} Throttled function
 */
export function throttle(func, limit) {
    let inThrottle;
    return function (...args) {
        if (!inThrottle) {
            func.apply(this, args);
            inThrottle = true;
            setTimeout(() => inThrottle = false, limit);
        }
    };
}

/**
 * Generate unique user ID
 * @returns {string} Unique user ID
 */
export function generateUserId() {
    return 'user_' + Math.random().toString(36).substr(2, 9) + '_' + Date.now();
}

/**
 * Generate random color from predefined palette
 * @returns {string} Hex color code
 */
export function generateRandomColor() {
    const colors = ['#02a568', '#1a73e8', '#e8710a', '#9334e6', '#d93025', '#0d9488'];
    return colors[Math.floor(Math.random() * colors.length)];
}

/**
 * Normalize action object for LINE Rich Menu API
 * @param {Object} action - Action object
 * @returns {Object|undefined} Normalized action or undefined
 */
export function normalizeAction(action) {
    if (!action || !action.type || action.type === 'none') return undefined;
    const t = action.type;
    if (t === 'uri') return { type: 'uri', uri: action.uri || '' };
    if (t === 'message') return { type: 'message', text: action.text || '' };
    if (t === 'postback') return { type: 'postback', data: action.data || '', displayText: action.displayText || undefined };
    if (t === 'richmenuswitch') return { type: 'richmenuswitch', richMenuAliasId: action.richMenuAliasId || '', data: action.data || undefined };
    return undefined;
}
