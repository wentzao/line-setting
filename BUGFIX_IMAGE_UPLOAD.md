# Bug 修复：图片上传和显示问题

## 问题描述

用户反馈：
- ❓ 圖片好像沒有辦法上傳
- ❓ 還是圖片上傳其實有成功？但是無法顯示出來？

## 问题分析

经过仔细检查代码，发现了**两个独立的图片存储系统没有正确连接**：

### 系统架构

```
┌─────────────────┐          ┌─────────────────┐
│   前端 Canvas   │          │  LINE API       │
│   (需要 dataUrl)│          │  (需要 Blob)    │
└────────┬────────┘          └────────┬────────┘
         │                            │
         │                            │
    ┌────▼────────────────────────────▼────┐
    │        應用程式內存                    │
    │  (project.richMenus[].image.dataUrl) │
    └────┬─────────────────────────────────┘
         │
         │   ❌ 缺少這個連接！
         │
    ┌────▼────────────────────────────────┐
    │          後端資料庫                   │
    │  (image_path, thumbnail_path)       │
    │  存儲在 uploads/ 目錄                │
    └─────────────────────────────────────┘
```

### 根本原因

1. **上傳到 LINE**：
   - `uploadCurrentRichMenu()` 函數會上傳圖片到 LINE API
   - 使用 `uploadRichMenuImage(token, richMenuId, blob)` 
   - ✅ 這個功能正常工作

2. **保存到後端** ❌：
   - `saveProject()` 只保存 metadata（名稱、區域、動作等）
   - **從不調用** `/api/richmenus/<id>/upload` 端點
   - 圖片只存在於瀏覽器內存中（dataUrl）

3. **加載項目時** ❌：
   - `getProject()` 從後端獲取 `image_path`
   - 但沒有將其轉換為 `dataUrl`
   - Canvas 需要 `dataUrl` 才能顯示圖片
   - 結果：圖片無法顯示

## 修復方案

### 1. 保存時上傳圖片到後端

修改 `static/db.js`：

```javascript
async function updateRichMenuInBackend(richMenu) {
    // 更新 metadata
    await fetch(`${API_BASE}/richmenus/${richMenu.id}`, { ... });
    
    // 如果有圖片且圖片是新上傳的，則上傳圖片到後端
    if (richMenu.image && richMenu.image.dataUrl && !richMenu.image.path) {
        await uploadImageToBackend(richMenu.id, richMenu.image);
    }
}

// 新增函數：上傳圖片到後端
async function uploadImageToBackend(richMenuId, imageData) {
    const blob = dataUrlToBlob(imageData.dataUrl);
    const formData = new FormData();
    formData.append('image', blob, imageData.name || 'richmenu.jpg');
    
    const response = await fetch(`${API_BASE}/richmenus/${richMenuId}/upload`, {
        method: 'POST',
        body: formData
    });
    
    // 更新 path 資訊
    const data = await response.json();
    imageData.path = data.data.image_path;
    imageData.thumbnail = data.data.thumbnail_path;
}
```

### 2. 加載時將圖片轉換為 dataUrl

修改 `static/db.js` 的 `getProject()` 函數：

```javascript
window.getProject = async function getProject(projectId) {
    const response = await fetch(`${API_BASE}/projects/${projectId}`);
    const project = data.data;
    
    // 處理 Rich Menus 並加載圖片
    const richMenus = await Promise.all(project.rich_menus.map(async (rm) => {
        let imageData = null;
        
        // 如果有圖片路徑，從後端加載並轉換為 dataUrl
        if (rm.image_path) {
            const imageUrl = `/api/uploads/${rm.image_path}`;
            const imgResponse = await fetch(imageUrl);
            const blob = await imgResponse.blob();
            const dataUrl = await blobToDataUrl(blob);
            
            imageData = {
                name: rm.image_path,
                type: blob.type,
                dataUrl: dataUrl,  // ← Canvas 需要這個！
                width: dimensions.width,
                height: dimensions.height,
                path: rm.image_path,
                thumbnail: rm.thumbnail_path
            };
        }
        
        return { ...rm, image: imageData };
    }));
    
    return { ...project, richMenus };
};
```

## 修復的文件

| 文件 | 改動內容 |
|------|---------|
| `static/db.js` | 新增 `uploadImageToBackend()` 函數 |
| `static/db.js` | 新增 `dataUrlToBlob()` 輔助函數 |
| `static/db.js` | 新增 `blobToDataUrl()` 輔助函數 |
| `static/db.js` | 新增 `getImageDimensionsFromDataUrl()` 函數 |
| `static/db.js` | 修改 `updateRichMenuInBackend()` 支持圖片上傳 |
| `static/db.js` | 修改 `saveProject()` 支持新建時上傳圖片 |
| `static/db.js` | 修改 `getProject()` 加載圖片並轉換為 dataUrl |

## 數據流程

### 完整的圖片生命周期

```
1. 用戶選擇圖片
   ↓
   [onImageSelected] 讀取為 dataUrl
   ↓
   存入 currentRM.image.dataUrl
   ↓
   [drawBackground] 在 Canvas 顯示 ✅

2. 用戶保存項目（自動保存）
   ↓
   [saveProject] 調用
   ↓
   [updateRichMenuInBackend] 檢查是否有新圖片
   ↓
   [uploadImageToBackend] 上傳到後端
   ↓
   後端保存到 uploads/ 並生成縮圖
   ↓
   資料庫記錄 image_path ✅

3. 用戶重新打開項目
   ↓
   [getProject] 從資料庫獲取 image_path
   ↓
   [fetch] 從 /api/uploads/{filename} 下載圖片
   ↓
   [blobToDataUrl] 轉換為 dataUrl
   ↓
   存入 richMenu.image.dataUrl
   ↓
   [drawBackground] 在 Canvas 顯示 ✅

4. 用戶發布到 LINE
   ↓
   [uploadCurrentRichMenu] 從 dataUrl 創建 Blob
   ↓
   [uploadRichMenuImage] 上傳到 LINE API
   ↓
   LINE 顯示 Rich Menu ✅
```

## 後端支持

後端已經有完整的圖片上傳 API：

```python
# api_routes.py
@api_bp.route('/richmenus/<int:rich_menu_id>/upload', methods=['POST'])
def upload_richmenu_image(rich_menu_id):
    """上傳圖片（保存原圖 + 生成縮圖）"""
    file = request.files['image']
    
    # 驗證尺寸
    valid_sizes = [(2500, 1686), (2500, 843), (1200, 810)]
    
    # 保存原圖
    filepath = os.path.join(config.UPLOAD_FOLDER, filename)
    
    # 生成縮圖
    thumbnail = image.copy()
    thumbnail.thumbnail((400, 266), Image.Resampling.LANCZOS)
    
    # 更新資料庫
    db.update_rich_menu(rich_menu_id, 
                       image_path=filename, 
                       thumbnail_path=thumb_filename)
    
    return jsonify({'ok': True, 'data': {...}})
```

這個 API 一直存在，只是前端從未調用！

## 為什麼之前會漏掉？

1. **關注點分離過度**：
   - 「上傳到 LINE」和「保存到後端」被當作兩個完全獨立的操作
   - 開發者可能認為只需要在「發布」時上傳圖片

2. **測試不充分**：
   - 如果只在同一個會話中測試，圖片在內存中（dataUrl），不會發現問題
   - 只有重新打開項目時，才會發現圖片無法顯示

3. **數據格式不一致**：
   - 保存時：`image: { dataUrl, name, type, width, height }`
   - 加載時：`image: { path, thumbnail }`
   - 兩種格式不兼容，導致 Canvas 無法顯示

## 測試方案

### 測試 1：上傳並立即查看
1. 創建新項目
2. 添加 Rich Menu
3. 上傳圖片
4. ✅ 確認圖片顯示在 Canvas 上
5. 保存項目
6. ✅ 打開瀏覽器開發工具，確認有調用 `/api/richmenus/{id}/upload`
7. ✅ 確認後端返回成功

### 測試 2：重新打開項目
1. 關閉編輯器
2. 重新打開剛才的項目
3. ✅ 確認圖片顯示在 Canvas 上
4. ✅ 確認圖片可以正常編輯區域

### 測試 3：檢查後端文件
1. 查看 `uploads/` 目錄
2. ✅ 確認有 `rm_{id}_{filename}` 文件
3. ✅ 確認有 `thumb_rm_{id}_{filename}` 縮圖文件

### 測試 4：發布到 LINE
1. 打開有圖片的項目
2. 點擊「發布到 LINE」
3. ✅ 確認上傳成功
4. ✅ 在 LINE 中查看 Rich Menu

## 向後兼容性

✅ **完全兼容**

- 舊項目如果沒有圖片，不會受影響
- 舊項目如果有圖片但 `dataUrl` 已丟失，會嘗試從 `path` 重新加載
- 新項目會自動保存圖片到後端

## 性能考慮

### 可能的性能問題

1. **圖片大小**：
   - Rich Menu 圖片通常是 2500x1686 或更大
   - 轉換為 dataUrl 會增加約 33% 的大小（Base64 編碼）
   - 可能影響內存使用

2. **加載時間**：
   - 每次打開項目都需要下載所有圖片
   - 多個 Rich Menu 會導致多次請求

### 優化建議（未來）

1. **使用 Blob URL 而非 dataUrl**：
   ```javascript
   const blobUrl = URL.createObjectURL(blob);
   // 記得在不需要時釋放：URL.revokeObjectURL(blobUrl)
   ```

2. **實現圖片快取**：
   ```javascript
   const imageCache = new Map(); // path -> dataUrl
   ```

3. **懶加載**：
   - 只加載當前 tab 的圖片
   - 切換 tab 時才加載其他圖片

## 修復狀態

- ✅ 圖片保存到後端
- ✅ 圖片從後端加載並顯示
- ✅ dataUrl 格式轉換
- ✅ 向後兼容
- ✅ 文檔完整

---

**修復日期**: 2024-10-21  
**修復內容**: 連接前端和後端的圖片存儲系統  
**影響範圍**: 所有使用圖片的 Rich Menu  
**測試狀態**: ⏳ 待用戶測試

