// db.js - 後端 API 呼叫（取代 IndexedDB）

const API_BASE = '/api';

// === Accounts API ===

window.saveAccount = async function saveAccount(account) {
    try {
        const response = await fetch(`${API_BASE}/accounts`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: account.accountId,  // accountId 作為名稱
                channel_access_token: account.channelAccessToken
            })
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message || '新增帳號失敗');
        }
        return data.data;
    } catch (e) {
        console.error('saveAccount error:', e);
        throw e;
    }
};

window.getAccount = async function getAccount(accountId) {
    try {
        // accountId 是帳號名稱（字串）
        // 先取得所有帳號列表，找到對應的數字 ID
        const response = await fetch(`${API_BASE}/accounts`);
        const result = await response.json();

        if (!result.ok) {
            console.error('getAccount: 無法取得帳號列表');
            return null;
        }

        // 用名稱查找帳號
        const account = result.data.find(a => a.name === accountId);

        if (!account) {
            console.error(`getAccount: 找不到帳號「${accountId}」`);
            return null;
        }

        // 取得完整帳號資訊（含 Token）
        const detailResponse = await fetch(`${API_BASE}/accounts/${account.id}`);
        const detailData = await detailResponse.json();

        if (!detailData.ok) {
            console.error(`getAccount: 無法取得帳號詳細資訊`);
            return null;
        }

        // 轉換為前端格式
        return {
            accountId: detailData.data.name,
            channelAccessToken: detailData.data.channel_access_token,
            createdAt: detailData.data.created_at
        };
    } catch (e) {
        console.error('getAccount error:', e);
        return null;
    }
};

window.listAccounts = async function listAccounts() {
    try {
        const response = await fetch(`${API_BASE}/accounts`);
        const data = await response.json();

        if (!data.ok) {
            throw new Error(data.message || '列出帳號失敗');
        }

        // 轉換為前端格式，保留 ID 以便其他函數使用
        return data.data.map(acc => ({
            id: acc.id,  // 保留數字 ID
            accountId: acc.name,
            name: acc.name,  // 新增 name 欄位以便查找
            createdAt: acc.created_at
        }));
    } catch (e) {
        console.error('listAccounts error:', e);
        return [];
    }
};

window.updateAccountToken = async function updateAccountToken(accountName, newToken) {
    try {
        // accountName 是帳號名稱（字串），需要找到對應的數字 ID
        const response = await fetch(`${API_BASE}/accounts`);
        const result = await response.json();

        if (!result.ok) {
            throw new Error('無法取得帳號列表');
        }

        // 找到對應的帳號
        const account = result.data.find(a => a.name === accountName);

        if (!account) {
            throw new Error(`找不到帳號「${accountName}」`);
        }

        // 更新 Token
        const updateResponse = await fetch(`${API_BASE}/accounts/${account.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: accountName,
                channel_access_token: newToken
            })
        });

        const data = await updateResponse.json();
        if (!data.ok) {
            throw new Error(data.message || '更新 Token 失敗');
        }

        return data.data;
    } catch (e) {
        console.error('updateAccountToken error:', e);
        throw e;
    }
};

window.deleteAccount = async function deleteAccount(accountId) {
    try {
        // 先找到對應的 ID
        const accounts = await fetch(`${API_BASE}/accounts`).then(r => r.json());
        const account = accounts.data.find(a => a.name === accountId);

        if (!account) return;

        await fetch(`${API_BASE}/accounts/${account.id}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('deleteAccount error:', e);
        throw e;
    }
};

// === Projects API ===

window.saveProject = async function saveProject(project) {
    try {
        // 先取得 account_id
        const accounts = await fetch(`${API_BASE}/accounts`).then(r => r.json());
        const account = accounts.data.find(a => a.name === project.accountId);

        if (!account) {
            throw new Error('找不到對應的帳號');
        }

        if (project.id) {
            // 更新現有專案
            const response = await fetch(`${API_BASE}/projects/${project.id}`, {
                method: 'PUT',
                headers: {
                    'Content-Type': 'application/json'
                },
                body: JSON.stringify({
                    name: project.name,
                    description: project.description
                })
            });

            const data = await response.json();
            if (!data.ok) {
                throw new Error(data.message || '更新專案失敗');
            }

            // 取得資料庫中的所有 Rich Menu ID
            const projectData = await getProject(project.projectId || project.id);
            const dbRichMenuIds = new Set(
                projectData.richMenus
                    .filter(rm => typeof rm.id === 'number')
                    .map(rm => rm.id)
            );

            // 取得目前前端陣列中的 Rich Menu ID（僅包含數字 ID）
            const currentRichMenuIds = new Set(
                (project.richMenus || [])
                    .filter(rm => typeof rm.id === 'number')
                    .map(rm => rm.id)
            );

            // 找出需要刪除的 Rich Menu ID（在資料庫中但不在目前陣列中）
            const idsToDelete = [...dbRichMenuIds].filter(id => !currentRichMenuIds.has(id));

            // 刪除不在目前陣列中的 Rich Menu
            for (const idToDelete of idsToDelete) {
                try {
                    await fetch(`${API_BASE}/richmenus/${idToDelete}`, {
                        method: 'DELETE'
                    });
                    console.log(`已刪除 Rich Menu ID: ${idToDelete}`);
                } catch (e) {
                    console.error(`刪除 Rich Menu ${idToDelete} 失敗:`, e);
                }
            }

            // 處理 Rich Menus（更新或新增）
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
                            headers: {
                                'Content-Type': 'application/json'
                            },
                            body: JSON.stringify({
                                name: rm.name,
                                alias: rm.alias,
                                metadata: rm.metadata
                            })
                        });

                        const createData = await createResponse.json();
                        if (createData.ok) {
                            rm.id = createData.data.id;  // 更新為真實 ID

                            // 如果有圖片，上傳到後端
                            if (rm.image && rm.image.dataUrl) {
                                await uploadImageToBackend(rm.id, rm.image);
                            }
                        }
                    }
                }
            }
        } else {
            // 新建專案
            const response = await fetch(`${API_BASE}/projects`, {
                method: 'POST',
                headers: {
                    'Content-Type': 'application/json'
                },
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
                        headers: {
                            'Content-Type': 'application/json'
                        },
                        body: JSON.stringify({
                            name: rm.name,
                            alias: rm.alias || '',
                            metadata: rm.metadata
                        })
                    });

                    const createData = await createResponse.json();
                    if (createData.ok) {
                        rm.id = createData.data.id;

                        // 如果有圖片，上傳到後端
                        if (rm.image && rm.image.dataUrl) {
                            await uploadImageToBackend(rm.id, rm.image);
                        }
                    }
                }
            }
        }

        return project;
    } catch (e) {
        console.error('saveProject error:', e);
        throw e;
    }
};

async function updateRichMenuInBackend(richMenu) {
    try {
        // 更新 metadata
        const response = await fetch(`${API_BASE}/richmenus/${richMenu.id}`, {
            method: 'PUT',
            headers: {
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({
                name: richMenu.name,
                alias: richMenu.alias,
                rich_menu_id: richMenu.richMenuId,
                metadata: richMenu.metadata
            })
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message || '更新 Rich Menu 失敗');
        }

        // 如果有圖片且圖片是新上傳的（有 dataUrl），則上傳圖片到後端
        if (richMenu.image && richMenu.image.dataUrl && !richMenu.image.path) {
            await uploadImageToBackend(richMenu.id, richMenu.image);
        }
    } catch (e) {
        console.error('updateRichMenuInBackend error:', e);
        throw e;
    }
}

// 上傳圖片到後端
async function uploadImageToBackend(richMenuId, imageData) {
    try {
        // 將 dataUrl 轉換為 Blob
        const blob = dataUrlToBlob(imageData.dataUrl);

        // 創建 FormData
        const formData = new FormData();
        formData.append('image', blob, imageData.name || 'richmenu.jpg');

        // 上傳到後端
        const response = await fetch(`${API_BASE}/richmenus/${richMenuId}/upload`, {
            method: 'POST',
            body: formData
        });

        const data = await response.json();
        if (!data.ok) {
            throw new Error(data.message || '上傳圖片失敗');
        }

        // 更新 imageData 的 path 和 thumbnail
        imageData.path = data.data.image_path;
        imageData.thumbnail = data.data.thumbnail_path;

        console.log('圖片上傳成功:', data.data);
    } catch (e) {
        console.error('uploadImageToBackend error:', e);
        throw e;
    }
}

// 將 dataUrl 轉換為 Blob
function dataUrlToBlob(dataUrl) {
    const parts = dataUrl.split(',');
    const mime = parts[0].match(/:(.*?);/)[1];
    const bstr = atob(parts[1]);
    let n = bstr.length;
    const u8arr = new Uint8Array(n);
    while (n--) {
        u8arr[n] = bstr.charCodeAt(n);
    }
    return new Blob([u8arr], { type: mime });
}

window.getProject = async function getProject(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}`);
        const data = await response.json();

        if (!data.ok) return null;

        // 轉換為前端格式
        const project = data.data;

        // 處理 Rich Menus 並加載圖片
        const richMenus = await Promise.all(project.rich_menus.map(async (rm) => {
            let imageData = null;

            // 如果有圖片路徑，從後端加載圖片並轉換為 dataUrl
            if (rm.image_path) {
                try {
                    const imageUrl = `/api/uploads/${rm.image_path}`;
                    const imgResponse = await fetch(imageUrl);
                    if (imgResponse.ok) {
                        const blob = await imgResponse.blob();
                        const dataUrl = await blobToDataUrl(blob);

                        // 獲取圖片尺寸
                        const dimensions = await getImageDimensionsFromDataUrl(dataUrl);

                        imageData = {
                            name: rm.image_path,
                            type: blob.type,
                            dataUrl: dataUrl,
                            width: dimensions.width,
                            height: dimensions.height,
                            path: rm.image_path,
                            thumbnail: rm.thumbnail_path
                        };
                    }
                } catch (err) {
                    console.error('加載圖片失敗:', rm.image_path, err);
                }
            }

            return {
                id: rm.id,
                richMenuId: rm.rich_menu_id,
                name: rm.name,
                alias: rm.alias,
                image: imageData,
                metadata: rm.metadata
            };
        }));

        return {
            id: project.id,  // 保留數字 ID 供 saveProject 使用
            projectId: String(project.id),  // 字串 ID 供顯示使用
            accountId: await getAccountNameById(project.account_id),
            name: project.name,
            description: project.description,
            richMenus: richMenus,
            createdAt: project.created_at,
            updatedAt: project.updated_at
        };
    } catch (e) {
        console.error('getProject error:', e);
        return null;
    }
};

// 輔助函數：將 Blob 轉換為 DataUrl
function blobToDataUrl(blob) {
    return new Promise((resolve, reject) => {
        const reader = new FileReader();
        reader.onload = () => resolve(reader.result);
        reader.onerror = reject;
        reader.readAsDataURL(blob);
    });
}

// 輔助函數：從 DataUrl 獲取圖片尺寸
function getImageDimensionsFromDataUrl(dataUrl) {
    return new Promise((resolve) => {
        const img = new Image();
        img.onload = () => resolve({ width: img.width, height: img.height });
        img.src = dataUrl;
    });
}

async function getAccountNameById(accountId) {
    try {
        const response = await fetch(`${API_BASE}/accounts/${accountId}`);
        const data = await response.json();
        return data.ok ? data.data.name : String(accountId);
    } catch (e) {
        return String(accountId);
    }
}

window.listProjectsByAccount = async function listProjectsByAccount(accountId) {
    try {
        // 先找到對應的 account ID
        const accounts = await fetch(`${API_BASE}/accounts`).then(r => r.json());
        const account = accounts.data.find(a => a.name === accountId);

        if (!account) return [];

        const response = await fetch(`${API_BASE}/accounts/${account.id}/projects`);
        const data = await response.json();

        if (!data.ok) return [];

        // 轉換為前端格式
        return data.data.map(p => ({
            id: p.id,  // 保留數字 ID
            projectId: String(p.id),  // 字串 ID 供顯示使用
            accountId: accountId,
            name: p.name,
            description: p.description,
            richMenus: new Array(p.rich_menu_count || 0),  // 使用後端返回的數量
            richMenuCount: p.rich_menu_count || 0,  // 額外提供數字方便使用
            createdAt: p.created_at,
            updatedAt: p.updated_at
        }));
    } catch (e) {
        console.error('listProjectsByAccount error:', e);
        return [];
    }
};

window.findProjectByName = async function findProjectByName(accountId, name) {
    try {
        const projects = await listProjectsByAccount(accountId);
        return projects.find(p => p.name === name) || null;
    } catch (e) {
        console.error('findProjectByName error:', e);
        return null;
    }
};

window.deleteProject = async function deleteProject(projectId) {
    try {
        await fetch(`${API_BASE}/projects/${projectId}`, {
            method: 'DELETE'
        });
    } catch (e) {
        console.error('deleteProject error:', e);
        throw e;
    }
};

window.initDatabase = async function initDatabase() {
    // 後端已處理資料庫初始化，前端不需要做任何事
    console.log('使用後端資料庫');
};

console.log('Database module loaded (Flask API version).');

// === Flex Message API ===

window.createFlexMessage = async function createFlexMessage(name, jsonContent) {
    try {
        const response = await fetch(`${API_BASE}/flex-messages`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, json_content: jsonContent })
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.message || '建立 Flex Message 失敗');
        return data.data;
    } catch (e) {
        console.error('createFlexMessage error:', e);
        throw e;
    }
};

window.getFlexMessage = async function getFlexMessage(id) {
    try {
        const response = await fetch(`${API_BASE}/flex-messages/${id}`);
        const data = await response.json();
        if (!data.ok) return null;
        return data.data;
    } catch (e) {
        console.error('getFlexMessage error:', e);
        return null;
    }
};

window.listFlexMessages = async function listFlexMessages() {
    try {
        const response = await fetch(`${API_BASE}/flex-messages`);
        const data = await response.json();
        if (!data.ok) throw new Error(data.message || '無法取得列表');
        return data.data;
    } catch (e) {
        console.error('listFlexMessages error:', e);
        return [];
    }
};

window.updateFlexMessage = async function updateFlexMessage(id, name, jsonContent) {
    try {
        const response = await fetch(`${API_BASE}/flex-messages/${id}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ name, json_content: jsonContent })
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.message || '更新 Flex Message 失敗');
        return true;
    } catch (e) {
        console.error('updateFlexMessage error:', e);
        throw e;
    }
};

window.deleteFlexMessage = async function deleteFlexMessage(id) {
    try {
        const response = await fetch(`${API_BASE}/flex-messages/${id}`, {
            method: 'DELETE'
        });
        const data = await response.json();
        if (!data.ok) throw new Error(data.message || '刪除 Flex Message 失敗');
        return true;
    } catch (e) {
        console.error('deleteFlexMessage error:', e);
        throw e;
    }
};

// === Scheduled Jobs API ===

window.listScheduledJobs = async function listScheduledJobs(projectId) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}/schedules`);
        return await response.json();
    } catch (e) {
        console.error('listScheduledJobs error:', e);
        return { ok: false, message: e.message };
    }
};

window.createScheduledJob = async function createScheduledJob(projectId, data) {
    try {
        const response = await fetch(`${API_BASE}/projects/${projectId}/schedules`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (e) {
        console.error('createScheduledJob error:', e);
        return { ok: false, message: e.message };
    }
};

window.updateScheduledJob = async function updateScheduledJob(jobId, data) {
    try {
        const response = await fetch(`${API_BASE}/schedules/${jobId}`, {
            method: 'PUT',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(data)
        });
        return await response.json();
    } catch (e) {
        console.error('updateScheduledJob error:', e);
        return { ok: false, message: e.message };
    }
};

window.deleteScheduledJob = async function deleteScheduledJob(jobId) {
    try {
        const response = await fetch(`${API_BASE}/schedules/${jobId}`, {
            method: 'DELETE'
        });
        return await response.json();
    } catch (e) {
        console.error('deleteScheduledJob error:', e);
        return { ok: false, message: e.message };
    }
};

