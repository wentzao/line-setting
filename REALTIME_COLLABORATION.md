# 即時協作功能說明

## ✅ 已完成的功能

### 1. 全域游標追蹤
- **問題**：之前只在 canvas 上追蹤游標
- **解決**：現在追蹤整個頁面的游標移動
- **實作**：使用 `document.addEventListener('mousemove')` 和 `position: fixed` 的游標元素

### 2. 區域即時同步
當任何使用者進行以下操作時，會即時廣播給其他使用者：

#### 廣播時機：
- ✅ 新增區域（按鈕或拖曳繪製）
- ✅ 刪除區域
- ✅ 拖曳區域位置
- ✅ 調整區域大小
- ✅ 修改 Action 類型
- ✅ 修改 Action 參數（URI、text、data 等）

#### 接收處理：
- ✅ 接收到區域更新時重繪畫布
- ✅ 若選中的區域被刪除，自動取消選擇
- ✅ 更新 JSON 預覽
- ✅ 顯示通知訊息

### 3. Metadata 即時同步
當任何使用者進行以下操作時，會即時廣播給其他使用者：

#### 廣播時機：
- ✅ 修改 Chat Bar 文字
- ✅ 上傳圖片
- ✅ 修改尺寸（雖然固定為 2500x1686）

#### 接收處理：
- ✅ 更新 Chat Bar 輸入框和字數計數
- ✅ 重新渲染圖片背景
- ✅ 更新 Tab 名稱
- ✅ 更新 JSON 預覽
- ✅ 顯示通知訊息

### 4. 使用者狀態管理
- ✅ 進入專案時自動加入 Socket.IO 房間
- ✅ 離開專案時自動退出房間
- ✅ 顯示使用者加入/離開通知
- ✅ 使用者離開時移除其游標

### 5. 視覺化通知
- ✅ 右上角顯示浮動通知
- ✅ 滑入/滑出動畫效果
- ✅ 3 秒後自動消失
- ✅ 區分不同類型（info、success 等）

---

## 🎨 UI 元素

### 遠端游標
- 彩色箭頭游標（每個使用者有不同顏色）
- 顯示使用者名稱標籤
- 跟隨滑鼠移動（50ms 節流）
- 固定定位，覆蓋整個頁面

### 通知訊息
- 位置：右上角固定
- 樣式：藍色背景（info）或綠色背景（success）
- 動畫：從右側滑入，3 秒後滑出
- 類型：
  - "使用者名稱 加入協作"
  - "使用者名稱 離開專案"
  - "其他使用者更新了區域"
  - "其他使用者更新了設定"

---

## 🔧 技術實作

### Socket.IO 事件

#### Client → Server
```javascript
// 加入專案房間
socket.emit('join_project', {
    project_id: projectId,
    user_id: myUserId,
    user_name: myUserName,
    color: myColor
});

// 離開專案房間
socket.emit('leave_project', { 
    project_id: currentProjectId 
});

// 廣播游標移動
socket.emit('cursor:move', {
    project_id: currentProjectId,
    x: x,
    y: y,
    user_id: myUserId,
    user_name: myUserName,
    color: myColor
});

// 廣播區域更新
socket.emit('richmenu:update_areas', {
    project_id: currentProjectId,
    rich_menu_id: richMenuId,
    areas: areas,
    sender: myUserId
});

// 廣播 metadata 更新
socket.emit('richmenu:update_metadata', {
    project_id: currentProjectId,
    rich_menu_id: richMenuId,
    metadata: metadata,
    sender: myUserId
});
```

#### Server → Client
```javascript
// 使用者加入
socket.on('user:joined', (data) => {
    // data: { user_id, user_name, color }
});

// 使用者離開
socket.on('user:left', (data) => {
    // data: { user_id, user_name }
});

// 接收游標移動
socket.on('cursor:move', (data) => {
    // data: { x, y, user_id, user_name, color }
});

// 接收區域更新
socket.on('richmenu:update_areas', (data) => {
    // data: { rich_menu_id, areas, sender }
});

// 接收 metadata 更新
socket.on('richmenu:update_metadata', (data) => {
    // data: { rich_menu_id, metadata, sender }
});
```

### 關鍵函式

#### 廣播函式
- `broadcastCursorMove(x, y)` - 廣播游標位置
- `broadcastAreasUpdate(richMenuId, areas)` - 廣播區域更新
- `broadcastMetadataUpdate(richMenuId, metadata)` - 廣播 metadata 更新

#### 接收處理
- `drawRemoteCursor(data)` - 繪製/更新遠端游標
- `socket.on('richmenu:update_areas')` - 處理區域更新
- `socket.on('richmenu:update_metadata')` - 處理 metadata 更新

#### 房間管理
- `joinProject(projectId)` - 加入專案房間
- `leaveProject()` - 離開專案房間

### 全域狀態
- `window.editorState` - 暴露給 Socket.IO 事件處理器
- `remoteCursors` - 儲存所有遠端游標元素

---

## 🧪 測試方法

### 測試步驟

1. **開啟兩個瀏覽器視窗**（或使用無痕模式）

2. **同時登入相同的專案**
   - 視窗 A 和視窗 B 都選擇相同的帳號和專案
   - 應該會看到 "使用者XXX 加入協作" 的通知

3. **測試游標同步**
   - 在視窗 A 移動滑鼠
   - 在視窗 B 應該能看到視窗 A 的游標（帶有使用者名稱）
   - 游標應該在整個頁面都可見，不只是 canvas

4. **測試區域繪製**
   - 在視窗 A 拖曳繪製新區域
   - 視窗 B 應該立即看到新區域出現
   - 應該顯示 "其他使用者更新了區域" 通知

5. **測試區域編輯**
   - 在視窗 A 拖曳移動區域
   - 在視窗 A 調整區域大小
   - 視窗 B 應該即時看到變化

6. **測試 Action 設定**
   - 在視窗 A 選擇一個區域
   - 修改 Action 類型（如改為 uri）
   - 輸入 URL
   - 視窗 B 應該看到區域更新（打開 JSON 預覽確認）

7. **測試 Chat Bar**
   - 在視窗 A 輸入 Chat Bar 文字
   - 視窗 B 的輸入框應該即時更新
   - 字數計數應該同步

8. **測試圖片上傳**
   - 在視窗 A 上傳圖片
   - 視窗 B 應該即時看到背景圖片更新

9. **測試刪除區域**
   - 在視窗 A 選擇區域並刪除
   - 視窗 B 應該即時看到區域消失
   - 如果視窗 B 正好選中該區域，應該自動取消選擇

10. **測試離開專案**
    - 在視窗 A 點擊返回按鈕
    - 視窗 B 應該看到 "使用者XXX 離開專案" 通知
    - 視窗 A 的游標應該從視窗 B 消失

### 預期結果
✅ 所有操作都應該在 100-200ms 內同步到其他使用者
✅ 游標移動應該流暢（50ms 節流）
✅ 不應該造成畫面閃爍或卡頓
✅ 通知訊息應該清晰且不干擾操作
✅ 沒有 JavaScript 錯誤

---

## 🎯 使用場景

### 適用情境
- 👥 團隊協作設計 Rich Menu
- 🎓 教學示範操作流程
- 👀 即時查看他人的設計進度
- 🤝 遠端會議時共同調整設計

### 注意事項
- ⚠️ 多人同時編輯同一個區域可能會相互覆蓋（後寫入優先）
- ⚠️ 大量快速操作可能會產生較多網路流量
- ⚠️ 建議團隊成員分工編輯不同的區域
- ⚠️ 重要變更建議使用「儲存」按鈕確保資料持久化

---

## 🚀 效能優化

### 已實作的優化
- ✅ 游標移動使用 50ms 節流
- ✅ 只廣播當前編輯的 Rich Menu
- ✅ 接收端過濾自己發送的訊息（避免迴圈）
- ✅ 使用 Canvas overlay 只重繪變更部分

### 未來可優化
- 🔄 使用 operational transformation 解決衝突
- 🔄 批次傳送多個小變更
- 🔄 離線快取和衝突解決
- 🔄 顯示其他使用者正在編輯的區域（鎖定機制）

---

## 📝 程式碼位置

### 主要檔案
- `static/ui.js` - 所有協作邏輯
  - 行 5-190：Socket.IO 初始化和事件處理
  - 行 2046-2077：區域新增/刪除時的廣播
  - 行 2287-2310：區域拖曳/調整時的廣播
  - 行 2492-2528：Action 修改時的廣播
  - 行 1804-1842：Metadata 修改時的廣播

- `static/style.css` - 通知動畫
  - 行 10-30：slideIn 和 slideOut 動畫

- `app.py` - Socket.IO 後端（已有完整實作）

### 關鍵變數
- `myUserId` - 當前使用者 ID
- `myUserName` - 當前使用者名稱
- `myColor` - 當前使用者游標顏色
- `currentProjectId` - 當前專案 ID
- `remoteCursors` - 遠端游標元素字典
- `window.editorState` - 全域編輯器狀態

