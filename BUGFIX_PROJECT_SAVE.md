# 项目保存错误修复文档

## 问题描述

用户报告在进入项目时出现以下错误：

1. **404 错误** - 某些资源找不到
2. **400 错误** - `/api/projects` 请求失败
3. **重复专案名称错误** - `此帳號已存在相同專案名稱`

```javascript
db.js:156 saveProject error: Error: 此帳號已存在相同專案名稱
    at saveProject (db.js:148:23)
    at async renderEditor (ui.js:783:9)
```

## 根本原因分析

### 问题 1: ID 类型不一致

**前端 (`static/db.js`)**:
- `getProject()` 返回的对象只包含 `projectId`（字符串）
- 没有 `id` 属性（数字）

**后端期望**:
- `saveProject()` 检查 `project.id` 来判断是更新还是创建
- 如果 `project.id` 不存在，就会尝试**创建新项目**

**结果**:
- 当用户打开已存在的项目时
- 前端调用 `getProject(projectId)` 获取项目数据
- 返回的对象没有 `id` 字段，只有 `projectId`
- 后续调用 `saveProject(project)` 时，因为 `project.id` 为 `undefined`
- `saveProject` 误以为是新建项目，尝试创建同名项目
- 触发数据库唯一性约束 `UNIQUE (account_id, name)`
- 抛出错误：`此帳號已存在相同專案名稱`

### 问题 2: Rich Menu 初始化逻辑

在 `ui.js` 的 `renderEditor()` 函数中：

```javascript
if (!project.richMenus || project.richMenus.length === 0) {
    project.richMenus = [{
        id: `rm_${Date.now()}`,  // 临时 ID
        name: 'Rich Menu 1',
        alias: '',
        image: null,
        metadata: { ... }
    }];
    await saveProject(project);  // 保存初始化的项目
}
```

当项目没有 Rich Menu 时会初始化一个默认的，并调用 `saveProject`。这个逻辑本身是正确的，但由于问题 1 的存在，导致每次都会尝试创建新项目。

### 问题 3: Rich Menu 创建/更新逻辑不完整

`saveProject()` 在更新项目时：

```javascript
if (project.richMenus) {
    for (const rm of project.richMenus) {
        if (rm.id) {
            await updateRichMenuInBackend(rm);  // 只更新，不创建
        }
    }
}
```

只调用了更新 API，没有处理**新增** Rich Menu 的情况（临时 ID 如 `rm_123456`）。

## 修复方案

### 修复 1: 统一 ID 处理

**文件**: `static/db.js`

在 `getProject()` 函数中，同时返回 `id` 和 `projectId`：

```javascript
return {
    id: project.id,              // 保留數字 ID 供 saveProject 使用
    projectId: String(project.id), // 字串 ID 供顯示使用
    accountId: await getAccountNameById(project.account_id),
    name: project.name,
    description: project.description,
    richMenus: project.rich_menus.map(rm => ({ ... })),
    createdAt: project.created_at,
    updatedAt: project.updated_at
};
```

在 `listProjectsByAccount()` 中也做同样的修改。

### 修复 2: 完善 Rich Menu 创建/更新逻辑

**文件**: `static/db.js`

更新 `saveProject()` 函数，支持新增和更新 Rich Menu：

```javascript
if (project.richMenus) {
    for (const rm of project.richMenus) {
        // 檢查 rm.id 是數字還是臨時 ID（如 rm_123456）
        if (typeof rm.id === 'number') {
            // 已存在的 Rich Menu，更新
            await updateRichMenuInBackend(rm);
        } else if (typeof rm.id === 'string' && rm.id.startsWith('rm_')) {
            // 新的 Rich Menu（臨時 ID），創建
            const createResponse = await fetch(`${API_BASE}/projects/${project.id}/richmenus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: rm.name,
                    alias: rm.alias,
                    metadata: rm.metadata
                })
            });
            
            const createData = await createResponse.json();
            if (createData.ok) {
                rm.id = createData.data.id;  // 更新為真實 ID
            }
        }
    }
}
```

### 修复 3: 新建项目时也创建 Rich Menu

在 `saveProject()` 的新建分支中，添加 Rich Menu 创建逻辑：

```javascript
} else {
    // 新建專案
    const response = await fetch(`${API_BASE}/projects`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify({
            account_id: account.id,
            name: project.name,
            description: project.description || ''
        })
    });
    
    const data = await response.json();
    if (!data.ok) {
        throw new Error(data.message || '建立專案失敗');
    }
    
    project.id = data.data.id;
    project.projectId = String(data.data.id);
    
    // 新建專案時創建 Rich Menus
    if (project.richMenus) {
        for (const rm of project.richMenus) {
            const createResponse = await fetch(`${API_BASE}/projects/${project.id}/richmenus`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({
                    name: rm.name,
                    alias: rm.alias || '',
                    metadata: rm.metadata
                })
            });
            
            const createData = await createResponse.json();
            if (createData.ok) {
                rm.id = createData.data.id;
            }
        }
    }
}
```

## 测试验证

### 场景 1: 打开已存在的项目（有 Rich Menu）
1. 用户点击项目列表中的项目
2. 调用 `getProject(projectId)`
3. 返回包含 `id` 和 `richMenus` 的对象
4. `renderEditor()` 检查 `richMenus`，不为空，不调用 `saveProject`
5. ✅ 成功渲染编辑器

### 场景 2: 打开已存在的项目（没有 Rich Menu）
1. 用户点击项目列表中的项目
2. 调用 `getProject(projectId)`，返回包含 `id` 的对象
3. `renderEditor()` 检查 `richMenus` 为空
4. 初始化默认 Rich Menu（临时 ID `rm_123456`）
5. 调用 `saveProject(project)`
6. 因为 `project.id` 存在，进入**更新**分支
7. 检测到临时 ID，调用 `POST /api/projects/{id}/richmenus` 创建
8. ✅ 成功创建并渲染编辑器

### 场景 3: 创建新项目
1. 用户填写表单创建新项目
2. 项目对象没有 `id` 字段
3. 初始化默认 Rich Menu（临时 ID）
4. 调用 `saveProject(project)`
5. 因为 `project.id` 不存在，进入**新建**分支
6. 创建项目，获得真实 `project.id`
7. 创建 Rich Menu，获得真实 `rm.id`
8. ✅ 成功创建项目和 Rich Menu

## 关键改进点总结

1. **统一 ID 管理**: 前端对象同时保留 `id`（数字）和 `projectId`（字符串）
2. **智能判断 Rich Menu 状态**: 通过 ID 类型判断是新增还是更新
3. **完整的 CRUD 支持**: 支持创建、读取、更新 Rich Menu
4. **避免重复创建**: 正确识别已存在的项目，不会触发唯一性约束

## 文件修改清单

- ✅ `static/db.js` - `getProject()` 函数
- ✅ `static/db.js` - `saveProject()` 函数
- ✅ `static/db.js` - `listProjectsByAccount()` 函数

## 相关数据库约束

```sql
CREATE TABLE projects (
    id INTEGER PRIMARY KEY AUTOINCREMENT,
    account_id INTEGER NOT NULL,
    name TEXT NOT NULL,
    description TEXT,
    created_at TEXT NOT NULL,
    updated_at TEXT NOT NULL,
    FOREIGN KEY (account_id) REFERENCES accounts (id) ON DELETE CASCADE,
    UNIQUE (account_id, name)  -- 同一账号下项目名称唯一
)
```

这个约束是正确且必要的，可以防止同一账号创建重名项目。修复后的代码能正确识别更新操作，不会触发此约束。

