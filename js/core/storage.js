/**
 * FoxyQuiz Storage & Server API Core Module
 */
let SERVER_URL = window.location.origin.startsWith('http') 
    ? window.location.origin 
    : (localStorage.getItem('foxy_server_url') || 'http://localhost:3000');

const STORAGE_KEY = 'quiz_user_stats';
const PROFILE_KEY = 'foxy_profile_data';
let isServerOnline = false;

function getServerURL() {
    return SERVER_URL;
}

function saveServerURL() {
    const input = document.getElementById('server-url-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        SERVER_URL = val.replace(/\/$/, '');
        localStorage.setItem('foxy_server_url', SERVER_URL);
        
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
        const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};
        alert((t.serverUrlSaved || "Адрес сервера сохранен: ") + SERVER_URL);
        checkServerConnection();
    }
}

function getStoredStats() {
    try {
        const raw = localStorage.getItem(STORAGE_KEY);
        if (!raw || raw === 'undefined' || raw === 'null') return {};
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Ошибка чтения статистики из localStorage, сброс:', e);
        localStorage.removeItem(STORAGE_KEY);
        return {};
    }
}

// Сохранение аналитики вопросов (без перезаписи профиля пользователя)
function saveStoredStats(newStats) {
    if (!newStats || typeof newStats !== 'object') return;
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    const profile = getSavedProfile();
    if (profile && (profile.profileKey || profile.id) && isServerOnline) {
        const key = profile.profileKey || profile.id;
        fetch(`${SERVER_URL}/api/stats/${key}`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(newStats)
        }).catch(() => {});
    }
}

function getSavedProfile() {
    try {
        const raw = localStorage.getItem(PROFILE_KEY) || localStorage.getItem('foxy_quiz_user');
        if (!raw || raw === 'undefined' || raw === 'null') return null;
        return JSON.parse(raw);
    } catch (e) {
        console.warn('Ошибка чтения профиля из localStorage, сброс:', e);
        localStorage.removeItem(PROFILE_KEY);
        localStorage.removeItem('foxy_quiz_user');
        return null;
    }
}

function saveProfile(profileData) {
    if (!profileData) return;
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    localStorage.setItem('foxy_quiz_user', JSON.stringify(profileData));
}

function getCurrentUser() {
    return getSavedProfile();
}

async function checkServerConnection() {
    try {
        const controller = new AbortController();
        const timeoutId = setTimeout(() => controller.abort(), 3000);
        
        const response = await fetch(`${SERVER_URL}/api/health`, { signal: controller.signal });
        clearTimeout(timeoutId);

        if (response.ok) {
            updateServerStatusUI(true);
            return true;
        } else {
            updateServerStatusUI(false);
            return false;
        }
    } catch (e) {
        updateServerStatusUI(false);
        return false;
    }
}

function updateServerStatusUI(online) {
    isServerOnline = online;
    const badge = document.getElementById('server-status-badge');
    if (badge) {
        badge.className = `server-badge ${online ? 'online' : 'offline'}`;
        const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
        const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};
        badge.textContent = online ? (t.serverOnline || '🟢 Сервер Онлайн') : (t.serverOffline || '🔴 Офлайн-режим');
    }
}

// --- НАЧИСЛЕНИЕ СТРОГО 1 XP ЗА КАЖДЫЙ ВЕРНЫЙ ОТВЕТ ---
function addXPToCurrentUser(amount = 1) {
    const user = getSavedProfile();
    if (!user) return 0;
    
    user.xp = (user.xp || 0) + amount;
    user.weeklyXP = (user.weeklyXP || 0) + amount;
    user.weeklyCorrectCount = (user.weeklyCorrectCount || 0) + amount;
    
    saveProfile(user);
    
    if (isServerOnline && (user.profileKey || user.id)) {
        fetch(`${SERVER_URL}/api/user/add-xp`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: user.id || user.profileKey, amount })
        })
        .then(res => res.json())
        .then(data => {
            if (data && data.success && data.user) {
                saveProfile(data.user);
                updateAuthUserHeaderUI();
            }
        })
        .catch(() => {});
    }
    
    updateAuthUserHeaderUI();
    return user.xp;
}

function calculateTotalXP() {
    const user = getSavedProfile();
    if (user && typeof user.xp === 'number') {
        return user.xp;
    }
    const stats = getStoredStats();
    let totalCorrect = 0;
    Object.keys(stats).forEach(key => {
        if (stats[key] && typeof stats[key].correct === 'number') {
            totalCorrect += stats[key].correct;
        }
    });
    return totalCorrect;
}

// --- АВТОРИЗАЦИЯ И РЕГИСТРАЦИЯ ---
async function loginWithCredentials(username, password) {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/login`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            saveProfile(data.user);
            await syncServerStatsOnLogin(data.user.profileKey || data.user.id);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка входа' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен.' };
    }
}

async function registerUser(username, password) {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/register`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ username, password })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            saveProfile(data.user);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка регистрации' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен.' };
    }
}

async function loginWithAdminKey(key) {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/admin-key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ key: key.trim() })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            saveProfile(data.user);
            await syncServerStatsOnLogin(data.user.profileKey || data.user.id);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка ключа' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен.' };
    }
}

async function syncServerStatsOnLogin(key) {
    if (!key) return;
    try {
        const res = await fetch(`${SERVER_URL}/api/stats/${key}`);
        if (res.ok) {
            const serverStats = await res.json();
            const localStats = getStoredStats();
            const merged = { ...serverStats, ...localStats };
            localStorage.setItem(STORAGE_KEY, JSON.stringify(merged));
        }
    } catch (e) {}
}

// --- ЕЖЕНЕДЕЛЬНАЯ ЛИГА (Воскресенье 22:00 Europe/Rome) ---
async function fetchLeagueLeaderboard() {
    try {
        const response = await fetch(`${SERVER_URL}/api/league/top`);
        if (response.ok) {
            const leaderboard = await response.json();
            return { success: true, leaderboard };
        }
        return { success: false, error: 'Ошибка загрузки Лиги' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен' };
    }
}

function getNextLeagueResetTime() {
    const now = new Date();
    const nowItaly = new Date(now.toLocaleString("en-US", { timeZone: "Europe/Rome" }));
    const result = new Date(nowItaly);
    
    const day = result.getDay();
    const diff = (7 - day) % 7;
    result.setDate(result.getDate() + diff);
    result.setHours(22, 0, 0, 0);

    if (nowItaly >= result) {
        result.setDate(result.getDate() + 7);
    }
    return result;
}

// --- ФУНКЦИОНАЛ АДМИНИСТРАТОРА ---
async function fetchAdminUsers() {
    const admin = getSavedProfile();
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (!admin || admin.role !== 'admin') return { success: false, error: t.adminNoRights || 'Нет прав администратора' };

    try {
        const res = await fetch(`${SERVER_URL}/api/admin/users`, {
            headers: { 'Authorization': `Bearer ${admin.token || admin.id}` }
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Ошибка подключения к серверу' };
    }
}

async function updateAdminUserXP(userId, newXP) {
    const admin = getSavedProfile();
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (!admin || admin.role !== 'admin') return { success: false, error: t.adminNoRights || 'Нет прав' };

    try {
        const res = await fetch(`${SERVER_URL}/api/admin/user/xp`, {
            method: 'POST',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${admin.token || admin.id}`
            },
            body: JSON.stringify({ userId, xp: Number(newXP) })
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Ошибка связи с сервером' };
    }
}

async function deleteAdminUser(userId) {
    const admin = getSavedProfile();
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (!admin || admin.role !== 'admin') return { success: false, error: t.adminNoRights || 'Нет прав' };

    try {
        const res = await fetch(`${SERVER_URL}/api/admin/user/delete`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${admin.token || admin.id}`
            },
            body: JSON.stringify({ userId })
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Ошибка удаления пользователя' };
    }
}

async function deleteAdminChatMessage(messageId) {
    const admin = getSavedProfile();
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (!admin || admin.role !== 'admin') return { success: false, error: t.adminNoRights || 'Нет прав' };

    try {
        const res = await fetch(`${SERVER_URL}/api/admin/chat/delete-message`, {
            method: 'DELETE',
            headers: {
                'Content-Type': 'application/json',
                'Authorization': `Bearer ${admin.token || admin.id}`
            },
            body: JSON.stringify({ messageId })
        });
        return await res.json();
    } catch (e) {
        return { success: false, error: 'Ошибка удаления сообщения' };
    }
}

// --- ХЕДЕР И ВСПЛЫВАЮЩИЕ ОКНА ---
function updateAuthUserHeaderUI() {
    const userNameEl = document.getElementById('header-user-name');
    const userXpEl = document.getElementById('header-user-xp');
    const authBtn = document.getElementById('header-auth-btn');

    const currentUser = getSavedProfile();
    const currentXP = calculateTotalXP();

    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (currentUser && currentUser.username) {
        if (userNameEl) userNameEl.textContent = currentUser.username;
        if (userXpEl) userXpEl.textContent = `${currentXP} XP`;
        if (authBtn) authBtn.textContent = t.authHeaderProfile || 'Профиль';
    } else {
        if (userNameEl) userNameEl.textContent = t.guestName || 'Гость';
        if (userXpEl) userXpEl.textContent = `${currentXP} XP`;
        if (authBtn) authBtn.textContent = t.authHeaderLogin || 'Войти';
    }
}

function handleHeaderAuthClick() {
    const currentUser = getSavedProfile();
    if (currentUser && currentUser.username) {
        openAccountModal();
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.remove('hidden');
}

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function openAccountModal() {
    const modal = document.getElementById('account-modal');
    const accUserEl = document.getElementById('acc-modal-username');
    const accRoleEl = document.getElementById('acc-modal-role');
    const accXpEl = document.getElementById('acc-modal-xp');
    const adminSec = document.getElementById('admin-hash-section');

    const currentUser = getSavedProfile();
    const currentXP = calculateTotalXP();

    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : {};

    if (currentUser) {
        if (accUserEl) accUserEl.textContent = currentUser.username || (t.guestName || 'Гость');
        if (accRoleEl) accRoleEl.textContent = currentUser.role === 'admin' ? (t.roleAdmin || 'Администратор') : (currentUser.role || (t.roleUser || 'Участник'));
        if (accXpEl) accXpEl.textContent = `${currentXP} XP`;
    } else {
        if (accUserEl) accUserEl.textContent = t.guestName || 'Гость';
        if (accRoleEl) accRoleEl.textContent = t.notAuth || 'Не авторизован';
        if (accXpEl) accXpEl.textContent = `${currentXP} XP`;
    }

    if (adminSec) {
        if ((currentUser && currentUser.role === 'admin') || window.location.hash === '#admin-login' || window.location.hash === '#admin') {
            adminSec.classList.remove('hidden');
        } else {
            adminSec.classList.add('hidden');
        }
    }
    if (modal) modal.classList.remove('hidden');
}

function closeAccountModal() {
    const modal = document.getElementById('account-modal');
    if (modal) modal.classList.add('hidden');
}

async function submitModalLogin() {
    const u = document.getElementById('modal-auth-login').value;
    const p = document.getElementById('modal-auth-pass').value;
    if (!u || !p) return alert('Заполните логин и пароль');

    const res = await loginWithCredentials(u, p);
    if (res.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

async function submitModalRegister() {
    const u = document.getElementById('modal-auth-login').value;
    const p = document.getElementById('modal-auth-pass').value;
    if (!u || !p) return alert('Заполните логин и пароль');

    const res = await registerUser(u, p);
    if (res.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

async function submitAdminKeyLogin() {
    const key = document.getElementById('modal-admin-key-input').value;
    if (!key) return alert('Введите ключ');

    const res = await loginWithAdminKey(key);
    if (res.success) {
        closeAccountModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

function handleLogout() {
    localStorage.removeItem(PROFILE_KEY);
    localStorage.removeItem('foxy_quiz_user');
    closeAccountModal();
    updateAuthUserHeaderUI();
}

window.addEventListener('DOMContentLoaded', () => {
    checkServerConnection();
    setInterval(checkServerConnection, 10000);
    updateAuthUserHeaderUI();
});