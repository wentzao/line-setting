# 更新日志 (Changelog)

## [未发布] - 2024-10-21

### 🐛 Bug 修复

#### 修复 Rich Menu 数量显示为 0 的问题

**问题描述**：
- 项目卡片上的 Rich Menu 数量始终显示为 0
- 即使项目中已经有多个 Rich Menu

**根本原因**：
- 后端已经正确计算并返回 `rich_menu_count`（使用子查询优化）
- 前端的 `listProjectsByAccount()` 硬编码 `richMenus: []`，忽略了后端返回的数量
- UI 计算 `richMenus.length` 总是得到 0

**修复方案**：
1. **使用后端数量**：
   - `listProjectsByAccount()` 现在使用 `p.rich_menu_count`
   - 创建正确长度的稀疏数组：`new Array(p.rich_menu_count || 0)`
   - 添加明确的 `richMenuCount` 字段

2. **UI 优先级**：
   - 使用空值合并运算符 `??`
   - 优先使用 `richMenuCount`，回退到 `richMenus.length`

**数据流程**：
```
后端 SQL 子查询 → rich_menu_count → 前端使用 → richMenuCount → UI 显示
```

**影响的文件**：
- `static/db.js` - 第 406-407 行
- `static/ui.js` - 第 551 行

**向后兼容性**：
- ✅ `richMenus.length` 仍然可用
- ✅ 使用 `??` 确保回退机制
- ✅ 无破坏性更改

**详细文档**：
- `BUGFIX_RICHMENU_COUNT.md` - 完整的技术分析

---

#### 修复图片无法保存和显示的问题

**问题描述**：
- 上傳圖片後，重新打開項目時圖片無法顯示
- Canvas 顯示空白或網格背景
- 圖片沒有保存到後端資料庫

**根本原因**：
- 前端和後端的圖片存儲系統沒有連接
- `saveProject()` 只保存 metadata，從不上傳圖片到後端
- `getProject()` 獲取 `image_path` 但不轉換為 Canvas 需要的 `dataUrl`
- 圖片只存在於瀏覽器內存中（當前會話）

**修復方案**：
1. **保存時上傳圖片**：
   - `updateRichMenuInBackend()` 檢查是否有新圖片
   - 調用 `uploadImageToBackend()` 上傳到 `/api/richmenus/{id}/upload`
   - 後端保存原圖和縮圖到 `uploads/` 目錄

2. **加載時轉換圖片**：
   - `getProject()` 從 `/api/uploads/{filename}` 下載圖片
   - 使用 `blobToDataUrl()` 轉換為 dataUrl
   - Canvas 可以正常顯示

3. **新增輔助函數**：
   - `uploadImageToBackend()` - 上傳圖片到後端
   - `blobToDataUrl()` - Blob 轉 dataUrl
   - `dataUrlToBlob()` - dataUrl 轉 Blob
   - `getImageDimensionsFromDataUrl()` - 獲取圖片尺寸

**影響的文件**：
- `static/db.js` - 新增 4 個輔助函數，修改 3 個主要函數

**數據流程**：
```
上傳 → dataUrl (內存) → 保存時上傳到後端 → 存儲在 uploads/
加載 ← dataUrl (轉換) ← 從後端下載      ← 讀取 uploads/
```

**向後兼容性**：
- ✅ 完全兼容，舊項目會嘗試從 `path` 重新加載圖片
- ✅ 沒有圖片的項目不受影響

**詳細文檔**：
- `BUGFIX_IMAGE_UPLOAD.md` - 完整的技術分析和修復說明

---

#### 修复 Rich Menu 保存时的参数冲突错误

**问题描述**：
- 尝试保存 Rich Menu 时出现错误：`update_rich_menu() got multiple values for argument 'rich_menu_id'`
- 无法更新 Rich Menu 的任何信息

**根本原因**：
- Python 函数参数名冲突
- `db.update_rich_menu(rich_menu_id, **kwargs)` 的位置参数 `rich_menu_id` 与 `kwargs` 中可能包含的键名 `'rich_menu_id'` 冲突
- 系统中有两种不同的 ID：
  - 数据库 ID（整数，用于标识记录）
  - LINE Rich Menu ID（字符串，用于 LINE API）

**修复方案**：
- 将函数参数名从 `rich_menu_id` 改为 `db_id`，避免命名冲突
- 添加详细文档说明两种 ID 的区别

**影响的文件**：
- `db.py` - 修改函数签名和文档
- `BUGFIX_PARAMETER_CONFLICT.md` - 详细技术文档

**向后兼容性**：
- ✅ 完全兼容，所有调用代码使用位置参数，无需修改

---

#### 修复项目保存时的「重复名称」错误

**问题描述**：
- 打开已存在的项目时，出现错误：`此帳號已存在相同專案名稱`
- 控制台显示 400 错误：`Failed to load resource: 400 (BAD REQUEST)`
- 无法正常编辑和保存项目

**根本原因**：
- 前端 `getProject()` 返回的对象缺少 `id` 字段
- `saveProject()` 无法识别是更新还是创建操作
- 每次都尝试创建新项目，触发数据库唯一性约束

**修复内容**：
1. ✅ **统一 ID 管理** (`static/db.js`)
   - `getProject()` 现在同时返回 `id`（数字）和 `projectId`（字符串）
   - `listProjectsByAccount()` 也做了相同修改
   - 确保前后端 ID 类型一致

2. ✅ **智能 Rich Menu 管理** (`static/db.js`)
   - `saveProject()` 现在能正确区分新增和更新操作
   - 通过 ID 类型判断：
     - 数字 ID → 调用 `PUT /api/richmenus/{id}` 更新
     - 字符串 ID（如 `rm_123456`）→ 调用 `POST /api/projects/{id}/richmenus` 创建
   - 创建后自动更新为真实 ID

3. ✅ **完整的 CRUD 支持**
   - 新建项目：创建项目 + 创建 Rich Menu
   - 更新项目：更新项目信息 + 智能处理 Rich Menu
   - 避免重复创建和数据冲突

**影响的文件**：
- `static/db.js` - 核心修复
- `BUGFIX_PROJECT_SAVE.md` - 详细技术文档
- `TESTING_GUIDE.md` - 测试指南

**测试场景**：
- ✅ 创建新项目
- ✅ 打开已存在的项目（有 Rich Menu）
- ✅ 打开已存在的项目（无 Rich Menu）
- ✅ 编辑并保存项目
- ✅ 添加新的 Rich Menu
- ✅ 正确拒绝同名项目（数据保护）

---

### 🚀 改进

#### 简化应用启动方式

**新增功能**：
- 支持使用 `gunicorn` 直接启动（替代 `python app.py`）
- 添加 `run.sh` 启动脚本
- 支持环境变量配置端口

**启动命令**：
```bash
# 方式 1: 直接使用 gunicorn
gunicorn -k eventlet -w 1 -b 127.0.0.1:1153 app:app

# 方式 2: 使用启动脚本
bash run.sh

# 方式 3: 自定义端口
PORT=8080 gunicorn -k eventlet -w 1 -b 127.0.0.1:8080 app:app
```

**影响的文件**：
- `requirements.txt` - 添加 `gunicorn==21.2.0`
- `app.py` - 调整数据库初始化时机
- `run.sh` - 新增启动脚本
- `README.md` - 更新文档
- `richmenu-editor.service` - 更新 systemd 配置

---

### 📚 文档

#### 新增文档

1. **BUGFIX_PROJECT_SAVE.md**
   - 详细的问题分析
   - 根本原因说明
   - 修复方案和代码示例
   - 数据流程图

2. **TESTING_GUIDE.md**
   - 6 个完整测试场景
   - 预期结果说明
   - 常见问题排查
   - 调试技巧

3. **CHANGELOG.md**（本文件）
   - 更新历史记录
   - 版本管理

#### 更新文档

- `README.md` - 添加 gunicorn 启动说明
- `richmenu-editor.service` - 更新生产环境配置

---

## 技术细节

### 数据库约束

```sql
CREATE TABLE projects (
    ...
    UNIQUE (account_id, name)  -- 同一账号下项目名称唯一
)
```

此约束确保数据完整性，防止同一账号创建重名项目。修复后的代码能正确识别更新操作，不会触发此约束。

### ID 类型说明

| 上下文 | 字段名 | 类型 | 用途 |
|--------|--------|------|------|
| 数据库 | `id` | INTEGER | 主键 |
| 后端 API | `id` | number | JSON 响应 |
| 前端对象 | `id` | number | 内部逻辑判断 |
| 前端对象 | `projectId` | string | UI 显示 |
| 临时 ID | `id` | string | 新建对象（如 `rm_123456`） |

### Rich Menu 状态判断

```javascript
if (typeof rm.id === 'number') {
    // 已存在的 Rich Menu → 更新
    await updateRichMenuInBackend(rm);
} else if (typeof rm.id === 'string' && rm.id.startsWith('rm_')) {
    // 新的 Rich Menu → 创建
    const response = await fetch(`${API_BASE}/projects/${project.id}/richmenus`, {
        method: 'POST',
        body: JSON.stringify({ ... })
    });
}
```

---

## 向后兼容性

✅ **完全兼容**：
- 数据库结构无变化
- API 端点无变化
- 现有数据可正常使用
- 不需要数据迁移

---

## 下一步计划

### 潜在改进

1. **前端验证增强**
   - 在客户端添加项目名称重复检查
   - 提前提示用户，避免不必要的 API 调用

2. **错误处理优化**
   - 更友好的错误提示信息
   - 区分不同类型的错误（网络错误、验证错误、数据冲突等）

3. **性能优化**
   - 批量操作 API（一次请求保存多个 Rich Menu）
   - 减少不必要的数据库查询

4. **测试覆盖**
   - 添加自动化测试
   - 单元测试和集成测试

### 功能增强

1. **项目重命名**
   - 允许修改项目名称
   - 检查新名称是否冲突

2. **Rich Menu 复制/移动**
   - 在项目间复制 Rich Menu
   - 批量操作支持

3. **版本历史**
   - 保存修改历史
   - 支持回滚到之前的版本

---

## 贡献者

- 初始版本：原作者
- Bug 修复：AI Assistant (2024-10-21)

---

## 许可证

（根据项目实际情况添加）

---

**注意**：本更新尚未发布，请在测试通过后再部署到生产环境。

