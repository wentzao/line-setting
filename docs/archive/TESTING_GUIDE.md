# 测试指南 - 验证 Bug 修复

本指南用于验证以下两个关键 Bug 的修复：
1. ✅ 项目保存时的「重复名称」错误
2. ✅ Rich Menu 保存时的参数冲突错误

## 前置准备

1. **启动应用**：
   ```bash
   gunicorn -k eventlet -w 1 -b 127.0.0.1:1153 app:app
   ```
   或使用：
   ```bash
   bash run.sh
   ```

2. **打开浏览器**：访问 `http://localhost:1153`

3. **打开开发者工具**：按 `F12` 查看控制台

## 测试场景

### ✅ 场景 1: 绑定 LINE 官方账号

**步骤**：
1. 点击「新增帳號」
2. 输入账号名称（如：`測試帳號`）
3. 输入 Channel Access Token
4. 点击「驗證並新增」

**预期结果**：
- ✓ 控制台显示：`✓ Socket.IO 已連線`
- ✓ 账号成功添加到列表
- ✗ 不应该出现 404 或 400 错误

---

### ✅ 场景 2: 创建新项目

**步骤**：
1. 选择已绑定的账号
2. 点击「新建專案」
3. 输入项目名称（如：`測試專案 A`）
4. 输入描述（可选）
5. 点击「建立」

**预期结果**：
- ✓ 项目成功创建
- ✓ 自动进入编辑器页面
- ✓ 自动创建一个默认的 Rich Menu
- ✗ **不应该出现**：`此帳號已存在相同專案名稱` 错误

**控制台检查**：
```javascript
// 应该看到成功的 API 调用
POST /api/projects 200 OK
POST /api/projects/{id}/richmenus 200 OK
```

---

### ✅ 场景 3: 打开已存在的项目（第一次打开，无 Rich Menu）

**步骤**：
1. 返回项目列表（点击「← 返回」）
2. 重新点击刚创建的项目

**预期结果**：
- ✓ 项目成功打开
- ✓ 显示之前创建的 Rich Menu
- ✗ **不应该出现**：`此帳號已存在相同專案名稱` 错误
- ✗ **不应该出现**：`Failed to load resource: 400 (BAD REQUEST)`

**控制台检查**：
```javascript
// 应该看到成功的 GET 请求
GET /api/projects/{id} 200 OK
// 不应该有额外的 POST 请求（因为 Rich Menu 已存在）
```

---

### ✅ 场景 4: 编辑并保存项目（测试参数冲突修复）

**步骤**：
1. 在编辑器中修改 Rich Menu（如添加区域、修改名称）
2. 点击「儲存」或等待自动保存

**预期结果**：
- ✓ 保存成功，显示「✓ 已儲存」
- ✓ 刷新页面后，修改仍然存在
- ✗ **不应该出现**：`此帳號已存在相同專案名稱` 错误
- ✗ **不应该出现**：`update_rich_menu() got multiple values for argument 'rich_menu_id'` 错误

**控制台检查**：
```javascript
// 应该看到 PUT 请求
PUT /api/projects/{id} 200 OK
PUT /api/richmenus/{id} 200 OK
```

**重要**：这个场景特别测试了参数冲突的修复。如果能成功保存，说明 `db.update_rich_menu()` 的参数重命名修复生效了。

---

### ✅ 场景 5: 添加新的 Rich Menu

**步骤**：
1. 在编辑器中点击「+ 新增 Rich Menu」
2. 切换到新的 Rich Menu 标签页
3. 修改名称和内容
4. 点击「儲存」

**预期结果**：
- ✓ 新 Rich Menu 成功创建
- ✓ 临时 ID（如 `rm_1234567890`）被替换为真实 ID（数字）
- ✓ 保存成功

**控制台检查**：
```javascript
// 第一次保存时，应该看到 POST 请求创建新 Rich Menu
POST /api/projects/{id}/richmenus 200 OK
// 后续保存时，应该看到 PUT 请求更新
PUT /api/richmenus/{id} 200 OK
```

---

### ✅ 场景 6: 尝试创建同名项目（应该失败）

**步骤**：
1. 返回项目列表
2. 点击「新建專案」
3. 输入**相同的**项目名称（如：`測試專案 A`）
4. 点击「建立」

**预期结果**：
- ✗ 应该显示错误：`此帳號已存在相同專案名稱`
- ✓ 这是**正确的行为**（保护数据完整性）
- ✓ 项目不会被创建

---

## 常见问题排查

### 问题 1: 仍然出现「此帳號已存在相同專案名稱」错误

**原因**：可能是浏览器缓存了旧的 JavaScript 文件

**解决方案**：
1. 按 `Ctrl+Shift+R`（Windows）或 `Cmd+Shift+R`（Mac）强制刷新
2. 或清除浏览器缓存
3. 或在开发者工具的 Network 标签页勾选「Disable cache」

### 问题 2: 控制台显示 404 错误

**检查**：
- 确认 URL 路径是否正确
- 查看 Network 标签页，找到 404 的具体请求
- 检查是否是静态资源（图片、CSS）的问题

**常见原因**：
- 图片路径不存在（`/api/uploads/{filename}`）
- 这不会影响核心功能

### 问题 3: Socket.IO 连接失败

**症状**：控制台显示 WebSocket 错误

**解决方案**：
1. 确认使用的是 `gunicorn -k eventlet`（而不是普通的 gunicorn）
2. 确认只有一个 worker（`-w 1`）
3. 重启应用

### 问题 4: 数据没有持久化

**检查**：
1. 确认 `database.db` 文件存在
2. 检查文件权限（是否可写）
3. 查看应用日志是否有数据库错误

## 成功标志

如果以下所有场景都通过，说明修复成功：

- ✅ 可以创建新项目
- ✅ 可以打开已存在的项目（不出现重复名称错误）
- ✅ 可以编辑并保存项目
- ✅ 可以添加新的 Rich Menu
- ✅ 数据持久化正常（刷新后仍然存在）
- ✅ 正确拒绝同名项目的创建（数据保护）

## 调试技巧

### 查看项目对象结构

在浏览器控制台执行：

```javascript
// 获取当前项目
const projectId = 1;  // 替换为实际 ID
const project = await getProject(projectId);
console.log('Project:', project);
console.log('Has id?', 'id' in project);
console.log('Has projectId?', 'projectId' in project);
console.log('Rich Menus:', project.richMenus);
```

### 查看 Rich Menu ID 类型

```javascript
project.richMenus.forEach((rm, index) => {
    console.log(`Rich Menu ${index}:`, {
        id: rm.id,
        type: typeof rm.id,
        isTemporary: typeof rm.id === 'string' && rm.id.startsWith('rm_')
    });
});
```

### 监控 API 调用

打开开发者工具的 Network 标签页，过滤 `api`：
- 查看所有 API 请求和响应
- 确认请求方法（GET/POST/PUT/DELETE）
- 检查响应状态码和内容

---

## 报告问题

如果测试失败，请提供以下信息：

1. **错误信息**：控制台的完整错误日志
2. **测试场景**：正在执行哪个场景
3. **Network 记录**：相关的 API 请求和响应
4. **浏览器**：使用的浏览器和版本
5. **项目状态**：项目是新建还是已存在

---

**祝测试顺利！** 🎉

