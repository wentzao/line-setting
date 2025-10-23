# 修復：圖片上傳實時同步問題

## 問題描述

當一個用戶上傳圖片時，其他正在協作的用戶無法看到新上傳的圖片。

## 原因分析

1. **dataUrl 過大**：原本的實現試圖通過 Socket.IO 廣播完整的圖片 dataUrl（base64 編碼），一張 2500x1686 的圖片的 dataUrl 通常有 2-5 MB 大小

2. **Socket.IO 消息限制**：Socket.IO 默認的消息大小限制通常為 1MB，大型圖片的 dataUrl 會被拒絕或截斷

3. **網絡效率**：即使能夠傳輸，通過 WebSocket 傳輸數 MB 的 base64 數據也會導致延遲和性能問題

## 解決方案

### 修改內容

#### 1. 修改上傳流程（`static/ui.js` - `onImageSelected` 函數）

**之前的做法**：
```javascript
// 直接廣播完整的 image 對象（包含 dataUrl）
broadcastMetadataUpdate(currentRM.id, {
    image: currentRM.image,  // 包含完整的 dataUrl (2-5MB)
    name: currentRM.metadata.name,
    chatBarText: currentRM.metadata.chatBarText,
    size: currentRM.metadata.size
});
```

**現在的做法**：
```javascript
// 1. 先上傳圖片到服務器
await uploadImageToBackend(currentRM.id, currentRM.image);

// 2. 廣播圖片路徑（只有幾十字節）
broadcastMetadataUpdate(currentRM.id, {
    imagePath: currentRM.image.path,           // 例如："rm_1_image.jpg"
    thumbnailPath: currentRM.image.thumbnail,  // 例如："thumb_rm_1_image.jpg"
    imageName: currentRM.image.name,
    name: currentRM.metadata.name,
    chatBarText: currentRM.metadata.chatBarText,
    size: currentRM.metadata.size
});
```

#### 2. 修改接收邏輯（`static/ui.js` - `richmenu:update_metadata` 事件處理器）

**新增圖片路徑處理**：
```javascript
// 處理圖片更新（從服務器加載）
if (data.metadata.imagePath) {
    // 從服務器加載圖片
    const imageUrl = `${API_BASE}/uploads/${data.metadata.imagePath}`;
    const response = await fetch(imageUrl);
    const blob = await response.blob();
    
    // 轉換為 dataUrl 供本地使用
    const reader = new FileReader();
    reader.onloadend = async () => {
        const dataUrl = reader.result;
        const dim = await getImageDimensions(dataUrl);
        
        currentRM.image = {
            name: data.metadata.imageName || data.metadata.imagePath,
            type: blob.type,
            dataUrl: dataUrl,
            width: dim.width,
            height: dim.height,
            path: data.metadata.imagePath,
            thumbnail: data.metadata.thumbnailPath
        };
        
        // 重繪背景
        await setupCanvas(state);
        renderTabs(state);
        renderJsonPreview(state);
        
        showNotification('其他使用者更新了圖片', 'info');
    };
    reader.readAsDataURL(blob);
}
```

#### 3. 增強通知系統

新增 `error` 類型的通知（紅色背景）：
```javascript
function showNotification(message, type = 'info') {
    let backgroundColor;
    if (type === 'info') {
        backgroundColor = '#1a73e8';  // 藍色
    } else if (type === 'error') {
        backgroundColor = '#d93025';  // 紅色
    } else {
        backgroundColor = '#02a568';  // 綠色 (success)
    }
    // ...
}
```

## 技術優勢

### 1. **大幅減少網絡傳輸**
- **之前**：每次圖片上傳廣播 2-5 MB 的 dataUrl
- **現在**：只廣播 100 字節左右的文件路徑
- **效率提升**：約 20,000 - 50,000 倍

### 2. **避免 Socket.IO 限制**
- 圖片路徑遠小於 Socket.IO 的消息大小限制
- 避免消息被截斷或拒絕

### 3. **提高可靠性**
- 圖片存儲在服務器上，持久化保存
- 新加入的用戶也能看到之前上傳的圖片
- 避免依賴瀏覽器內存（dataUrl）

### 4. **向後兼容**
- 保留了對舊格式的支持（`data.metadata.image`）
- 漸進式升級，不會破壞現有功能

## 測試步驟

### 1. 開啟兩個瀏覽器視窗
- 視窗 A 和視窗 B 都登入同一個專案

### 2. 在視窗 A 上傳圖片
- 選擇符合尺寸的圖片（2500x1686 或 1200x810）
- 點擊上傳

### 3. 驗證視窗 B
- ✅ 應該在 1-2 秒內看到新圖片出現
- ✅ 應該顯示通知："其他使用者更新了圖片"
- ✅ Canvas 背景應該更新為新圖片
- ✅ 控制台應該顯示 "收到 metadata 更新" 和 "圖片已上傳到服務器"

### 4. 檢查服務器端
- 圖片應該保存在 `uploads/` 目錄
- 檔名格式：`rm_{rich_menu_id}_{original_name}.jpg`
- 縮圖格式：`thumb_rm_{rich_menu_id}_{original_name}.jpg`

### 5. 測試錯誤處理
- 上傳錯誤尺寸的圖片：應該顯示錯誤提示
- 網絡中斷時上傳：應該顯示紅色錯誤通知

## 相關文件

- `static/ui.js` - 主要修改文件
- `static/db.js` - 包含 `uploadImageToBackend` API 調用
- `api_routes.py` - 後端圖片上傳 API
- `REALTIME_COLLABORATION.md` - 實時協作功能文檔

## 注意事項

1. **服務器存儲空間**：圖片會持久化保存在服務器上，注意定期清理不需要的圖片

2. **網絡延遲**：其他用戶看到圖片的延遲取決於：
   - 上傳者上傳到服務器的速度
   - Socket.IO 廣播延遲（通常 < 100ms）
   - 接收者從服務器下載的速度

3. **並發上傳**：如果多個用戶同時上傳圖片到同一個 Rich Menu，後上傳的會覆蓋先上傳的

## 版本信息

- 修復日期：2025-10-23
- 涉及版本：所有支持實時協作的版本
- 優先級：高（核心功能缺陷）

