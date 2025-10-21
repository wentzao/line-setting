// app.js - Main application logic

document.addEventListener('DOMContentLoaded', () => {
    console.log('DOM fully loaded and parsed');
    // Initialize the application
    initializeApp();
});

async function initializeApp() {
    console.log('Initializing app...');
    try {
        await initDatabase();
    } catch (e) {
        console.error('資料庫初始化失敗', e);
        alert('資料庫初始化失敗，請確認瀏覽器是否支援 IndexedDB');
    }
    // For now, we always show the account selection screen on startup.
    renderAccountSelectionScreen();
} 