// line-api.js - LINE API interaction logic (Flask版本)

// 改為相對路徑，同源無 CORS 問題
const PROXY_BASE = '/proxy';

window.validateChannelAccessToken = async function validateChannelAccessToken(channelAccessToken) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        if (res.ok) {
            return { ok: true };
        }
        const errText = await res.text();
        return { ok: false, status: res.status, message: safeParseLineError(errText) };
    } catch (e) {
        return { ok: false, message: e.message || 'Network error' };
    }
};

window.listRichMenus = async function listRichMenus(channelAccessToken) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/list`, {
            method: 'GET',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        const text = await res.text();
        if (!res.ok) return { ok: false, status: res.status, message: safeParseLineError(text) };
        const data = JSON.parse(text);
        return { ok: true, data };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.createRichMenu = async function createRichMenu(channelAccessToken, metadata) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify(metadata)
        });
        const text = await res.text();
        if (!res.ok) return { ok: false, status: res.status, message: safeParseLineError(text) };
        const data = JSON.parse(text);
        return { ok: true, data };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.uploadRichMenuImage = async function uploadRichMenuImage(channelAccessToken, richMenuId, file) {
    try {
        // Flask 代理只需一個端點
        const url = `${PROXY_BASE}/v2/bot/richmenu/${encodeURIComponent(richMenuId)}/content`;
        const res = await fetch(url, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`,
                'Content-Type': file.type || 'image/png'
            },
            body: file
        });
        
        if (res.ok) return { ok: true };
        
        const text = await res.text();
        return { ok: false, status: res.status, message: safeParseLineError(text) };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.setDefaultRichMenu = async function setDefaultRichMenu(channelAccessToken, richMenuId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/user/all/richmenu/${encodeURIComponent(richMenuId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        if (!res.ok) {
            const text = await res.text();
            return { ok: false, status: res.status, message: safeParseLineError(text) };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.deleteRichMenu = async function deleteRichMenu(channelAccessToken, richMenuId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/${encodeURIComponent(richMenuId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        if (!res.ok) {
            const text = await res.text();
            return { ok: false, status: res.status, message: safeParseLineError(text) };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.linkRichMenuToUser = async function linkRichMenuToUser(channelAccessToken, userId, richMenuId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/user/${encodeURIComponent(userId)}/richmenu/${encodeURIComponent(richMenuId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        if (!res.ok) {
            const text = await res.text();
            return { ok: false, status: res.status, message: safeParseLineError(text) };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.unsetDefaultRichMenu = async function unsetDefaultRichMenu(channelAccessToken) {
	try {
		const res = await fetch(`${PROXY_BASE}/v2/bot/user/all/richmenu`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${channelAccessToken}`
			}
		});
		if (!res.ok) {
			const text = await res.text();
			return { ok: false, status: res.status, message: safeParseLineError(text) };
		}
		return { ok: true };
	} catch (e) {
		return { ok: false, message: e.message };
	}
};

window.unlinkRichMenuFromUser = async function unlinkRichMenuFromUser(channelAccessToken, userId) {
	try {
		const res = await fetch(`${PROXY_BASE}/v2/bot/user/${encodeURIComponent(userId)}/richmenu`, {
			method: 'DELETE',
			headers: {
				'Authorization': `Bearer ${channelAccessToken}`
			}
		});
		if (!res.ok) {
			const text = await res.text();
			return { ok: false, status: res.status, message: safeParseLineError(text) };
		}
		return { ok: true };
	} catch (e) {
		return { ok: false, message: e.message };
	}
};

// Alias APIs
window.createAlias = async function createAlias(channelAccessToken, aliasId, richMenuId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/alias`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ richMenuAliasId: aliasId, richMenuId })
        });
        const text = await res.text();
        if (!res.ok) return { ok: false, status: res.status, message: safeParseLineError(text) };
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.updateAlias = async function updateAlias(channelAccessToken, aliasId, richMenuId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/alias/${encodeURIComponent(aliasId)}`, {
            method: 'POST',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`,
                'Content-Type': 'application/json'
            },
            body: JSON.stringify({ richMenuId })
        });
        const text = await res.text();
        if (!res.ok) return { ok: false, status: res.status, message: safeParseLineError(text) };
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

window.deleteAlias = async function deleteAlias(channelAccessToken, aliasId) {
    try {
        const res = await fetch(`${PROXY_BASE}/v2/bot/richmenu/alias/${encodeURIComponent(aliasId)}`, {
            method: 'DELETE',
            headers: {
                'Authorization': `Bearer ${channelAccessToken}`
            }
        });
        if (!res.ok) {
            const text = await res.text();
            return { ok: false, status: res.status, message: safeParseLineError(text) };
        }
        return { ok: true };
    } catch (e) {
        return { ok: false, message: e.message };
    }
};

function safeParseLineError(text) {
    try {
        const data = JSON.parse(text);
        if (data && data.message) return data.message;
        return text;
    } catch (_) {
        return text;
    }
}

console.log('LINE API module loaded (Flask version).');

