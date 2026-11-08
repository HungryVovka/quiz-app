/**
 * FoxyQuiz Online Core & Synchronization Layer
 * Подключение к локальному серверу, синхронизация статистики и онлайн-чат.
 */

const ONLINE_CONFIG = {
    DEFAULT_SERVER_URL: 'http://localhost:3000',
    STORAGE_PROFILE_KEY: 'foxy_profile_data',
    STORAGE_SERVER_KEY: 'foxy_server_url',
    STORAGE_OFFLINE_QUEUE: 'foxy_offline_queue',
    MAX_CHAT_MESSAGES: 500,
    MAX_CHAT_LENGTH: 150
};

let socket = null;
let isServerOnline = false;

function getServerURL() {
    return localStorage.getItem(ONLINE_CONFIG.STORAGE_SERVER_KEY) || ONLINE_CONFIG.DEFAULT_SERVER_URL;
}

function saveServerURL() {
    const input = document.getElementById('server-url-input');
    if (!input) return;
    const url = input.value.trim().replace(/\/+$/, '');
    if (url) {
        localStorage.setItem(ONLINE_CONFIG.STORAGE_SERVER_KEY, url);
        alert('Адрес сервера сохранен: ' + url);
        checkServerConnection();
    }
}

async function checkServerConnection() {
    const badge = document.getElementById('server-status-badge');
    const serverUrl = getServerURL();

    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${serverUrl}/api/health`, { 
            method: 'GET',
            signal: controller.signal 
        });
        clearTimeout(timeoutId);

        if (response.ok) {
            isServerOnline = true;
            if (badge) {
                badge.className = 'server-badge online';
                badge.textContent = '🟢 Онлайн-режим';
            }
            flushOfflineQueue();
        } else {
            throw new Error('Server offline');
        }
    } catch (e) {
        isServerOnline = false;
        if (badge) {
            badge.className = 'server-badge offline';
            badge.textContent = '🔴 Офлайн-режим';
        }
    }
}

function getSavedProfile() {
    try {
        const raw = localStorage.getItem(ONLINE_CONFIG.STORAGE_PROFILE_KEY);
        return raw ? JSON.parse(raw) : null;
    } catch (e) {
        return null;
    }
}

function saveProfileLocally(profileData) {
    localStorage.setItem(ONLINE_CONFIG.STORAGE_PROFILE_KEY, JSON.stringify(profileData));
}

async function loginWithCredentials(username, password) {
    const serverUrl = getServerURL();
    try {
        const res = await fetch(`${serverUrl}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            saveProfileLocally(data.user);
            await syncServerStatsOnLogin(data.user.profileKey);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Ошибка входа' };
        }
    } catch (err) {
        return { success: false, error: 'Сервер недоступен. Проверьте адрес сервера в настройках.' };
    }
}

async function registerUser(username, password) {
    const serverUrl = getServerURL();
    try {
        const res = await fetch(`${serverUrl}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            saveProfileLocally(data.user);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Ошибка регистрации' };
        }
    } catch (err) {
        return { success: false, error: 'Сервер недоступен' };
    }
}

async function loginWithAdminKey(adminKey) {
    const serverUrl = getServerURL();
    try {
        const res = await fetch(`${serverUrl}/api/auth/admin-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: adminKey })
        });
        const data = await res.json();
        if (res.ok && data.success) {
            saveProfileLocally(data.user);
            await syncServerStatsOnLogin(data.user.profileKey);
            return { success: true, user: data.user };
        } else {
            return { success: false, error: data.error || 'Неверный админ-ключ' };
        }
    } catch (err) {
        return { success: false, error: 'Сервер недоступен' };
    }
}

async function syncServerStatsOnLogin(profileKey) {
    if (!isServerOnline || !profileKey) return;
    const serverUrl = getServerURL();

    try {
        const res = await fetch(`${serverUrl}/api/stats/${profileKey}`);
        if (res.ok) {
            const serverStats = await res.json();
            const localStats = typeof getStoredStats === 'function' ? getStoredStats() : {};
            
            // Безопасное слияние без удаления локального прогресса
            const merged = typeof mergeStats === 'function' ? mergeStats(serverStats, localStats) : { ...serverStats, ...localStats };
            
            if (typeof saveStoredStats === 'function') {
                saveStoredStats(merged);
            }
            
            await fetch(`${serverUrl}/api/stats/${profileKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(merged)
            });
        }
    } catch (e) {
        console.warn('Ошибка слияния статистики:', e);
    }
}

function flushOfflineQueue() {
    const profile = getSavedProfile();
    if (!profile || !profile.profileKey) return;

    const serverUrl = getServerURL();
    const currentStats = typeof getStoredStats === 'function' ? getStoredStats() : {};

    fetch(`${serverUrl}/api/stats/${profile.profileKey}`, {
        method: 'POST',
        headers: { 'Content-Type': 'application/json' },
        body: JSON.stringify(currentStats)
    }).catch(e => console.warn('Синхронизация отложена'));
}

// Перехват функции записи статистики для отправки на сервер и моментального обновления XP
if (typeof window.saveStoredStats === 'function') {
    const originalSaveStoredStats = window.saveStoredStats;
    window.saveStoredStats = function(stats) {
        originalSaveStoredStats(stats);
        
        const profile = getSavedProfile();
        if (profile && profile.profileKey && isServerOnline) {
            const serverUrl = getServerURL();
            fetch(`${serverUrl}/api/stats/${profile.profileKey}`, {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify(stats)
            })
            .then(res => res.json())
            .then(data => {
                if (data.success && data.user) {
                    saveProfileLocally(data.user); // Сохраняем обновленный XP в localStorage
                    if (typeof updateAuthUserHeaderUI === 'function') {
                        updateAuthUserHeaderUI(); // Перерисовываем UI шапки
                    }
                }
            })
            .catch(() => {});
        } else {
            if (typeof updateAuthUserHeaderUI === 'function') {
                updateAuthUserHeaderUI();
            }
        }
    };
}

// Онлайн Чат (Socket.io)
function initChatSocket() {
    const serverUrl = getServerURL();
    if (typeof io === 'undefined') return;

    socket = io(serverUrl, { autoConnect: true, reconnection: true });

    socket.on('connect', () => checkServerConnection());
    socket.on('disconnect', () => checkServerConnection());

    socket.on('chat_history', (messages) => {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = '';
        messages.forEach(msg => appendChatMessageUI(msg));
        container.scrollTop = container.scrollHeight;
    });

    socket.on('chat_message', (msg) => {
        appendChatMessageUI(msg);
        const container = document.getElementById('chat-messages');
        if (container) {
            while (container.children.length > ONLINE_CONFIG.MAX_CHAT_MESSAGES) {
                container.removeChild(container.firstChild);
            }
            container.scrollTop = container.scrollHeight;
        }
    });
}

function toggleChatWidget() {
    const drawer = document.getElementById('chat-drawer');
    if (drawer) drawer.classList.toggle('open');
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    if (!input || !socket) return;

    let text = input.value.trim();
    if (!text) return;

    if (text.length > ONLINE_CONFIG.MAX_CHAT_LENGTH) {
        text = text.substring(0, ONLINE_CONFIG.MAX_CHAT_LENGTH);
    }

    const profile = getSavedProfile() || { username: 'Гость', avatar: 'assets/icon.png' };

    socket.emit('send_message', {
        username: profile.username || 'Гость',
        avatar: profile.avatar || 'assets/icon.png',
        text: text
    });

    input.value = '';
}

function appendChatMessageUI(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const item = document.createElement('div');
    item.className = 'chat-message-item';

    item.innerHTML = `
        <img src="${msg.avatar || 'assets/icon.png'}" class="chat-avatar" alt="User">
        <div class="chat-msg-body">
            <div class="chat-msg-header">
                <span class="chat-user-name">${escapeHTML(msg.username || 'Гость')}</span>
                <span class="chat-time">${msg.timestamp || ''}</span>
            </div>
            <div class="chat-text">${escapeHTML(msg.text || '')}</div>
        </div>
    `;

    container.appendChild(item);
}

function escapeHTML(str) {
    return str.replace(/[&<>'"]/g, 
        tag => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', "'": '&#39;', '"': '&quot;' }[tag] || tag)
    );
}

async function renderLeagueUI() {
    const tbody = document.getElementById('league-leaderboard-body');
    if (!tbody) return;

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Загрузка лиги...</td></tr>';

    if (!isServerOnline) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Лига доступна при подключении к серверу</td></tr>';
        return;
    }

    try {
        const serverUrl = getServerURL();
        const res = await fetch(`${serverUrl}/api/league/top`);
        if (res.ok) {
            const leaderboard = await res.json();
            tbody.innerHTML = leaderboard.map((player, index) => `
                <tr>
                    <td><strong>#${index + 1}</strong></td>
                    <td style="display: flex; align-items: center; gap: 8px;">
                        <img src="${player.avatar || 'assets/icon.png'}" style="width: 24px; height: 24px; border-radius: 50%;">
                        <span>${escapeHTML(player.username)}</span>
                    </td>
                    <td style="color: var(--correct-text); font-weight: bold;">${player.xp} XP</td>
                </tr>
            `).join('');
        }
    } catch (e) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #ef4444;">Не удалось загрузить лигу</td></tr>';
    }
}

window.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('server-url-input');
    if (urlInput) urlInput.value = getServerURL();

    checkServerConnection();
    setInterval(checkServerConnection, 15000);
});