let SERVER_URL = localStorage.getItem('foxy_server_url') || 'http://localhost:3000';

const STORAGE_KEY = 'quiz_user_stats';
const UNSYNCED_KEY = 'quiz_unsynced_stats';
const PROFILE_KEY = 'foxy_profile_data';
let isServerOnline = false;

function saveServerURL() {
    const input = document.getElementById('server-url-input');
    if (!input) return;
    const val = input.value.trim();
    if (val) {
        SERVER_URL = val.replace(/\/$/, '');
        localStorage.setItem('foxy_server_url', SERVER_URL);
        alert("Адрес сервера сохранен: " + SERVER_URL);
        syncStatsWithServer();
    }
}

function getStoredStats() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
}

function saveStoredStats(newStats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(newStats));
    markStatsAsUnsynced(newStats);
    syncStatsWithServer();
}

function markStatsAsUnsynced(stats) {
    const unsynced = getUnsyncedStats();
    const merged = mergeStatsObjects(unsynced, stats);
    localStorage.setItem(UNSYNCED_KEY, JSON.stringify(merged));
}

function getUnsyncedStats() {
    const raw = localStorage.getItem(UNSYNCED_KEY);
    return raw ? JSON.parse(raw) : {};
}

function clearUnsyncedStats() {
    localStorage.removeItem(UNSYNCED_KEY);
}

function getSavedProfile() {
    const raw = localStorage.getItem(PROFILE_KEY) || localStorage.getItem('foxy_quiz_user');
    return raw ? JSON.parse(raw) : null;
}

function saveProfile(profileData) {
    localStorage.setItem(PROFILE_KEY, JSON.stringify(profileData));
    localStorage.setItem('foxy_quiz_user', JSON.stringify(profileData));
}

function getCurrentUser() {
    return getSavedProfile();
}

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
            syncStatsWithServer();
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка входа' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен. Работа в офлайн-режиме.' };
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
            syncStatsWithServer();
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка регистрации' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен.' };
    }
}

async function loginWithProfileKey(key) {
    try {
        const response = await fetch(`${SERVER_URL}/api/auth/key`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ profileKey: key.trim() })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            saveProfile(data.user);
            syncStatsWithServer();
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка ключа' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен.' };
    }
}

async function loginWithAdminKey(key) {
    return loginWithProfileKey(key);
}

async function autoLoginWithSavedKey() {
    const profile = getSavedProfile();
    if (!profile || !profile.profileKey) return null;
    try {
        const res = await loginWithProfileKey(profile.profileKey);
        if (res.success) return res.user;
    } catch (e) {}
    return profile;
}

async function buyOrEquipAvatar(avatarUrl, action = 'buy') {
    const profile = getSavedProfile();
    if (!profile || !profile.id) return { success: false, error: 'Авторизуйтесь для смены аватарки' };

    try {
        const response = await fetch(`${SERVER_URL}/api/profile/avatar`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id, avatarUrl, action })
        });

        const data = await response.json();
        if (response.ok && data.success) {
            saveProfile(data.user);
            return { success: true, user: data.user };
        }
        return { success: false, error: data.error || 'Ошибка обновления аватарки' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен' };
    }
}

async function fetchLeagueLeaderboard() {
    try {
        const response = await fetch(`${SERVER_URL}/api/league`);
        const data = await response.json();
        if (response.ok && data.success) {
            return { success: true, leaderboard: data.leaderboard };
        }
        return { success: false, error: 'Не удалось загрузить данные лиги' };
    } catch (e) {
        return { success: false, error: 'Сервер недоступен' };
    }
}

function mergeStatsObjects(base, incoming) {
    const merged = { ...base };
    merged.totalQuizzes = (base.totalQuizzes || 0) + (incoming.totalQuizzes || 0);
    merged.correctAnswers = (base.correctAnswers || 0) + (incoming.correctAnswers || 0);

    for (const [qId, qStat] of Object.entries(incoming)) {
        if (typeof qStat === 'object' && qStat.attempts !== undefined) {
            if (!merged[qId]) {
                merged[qId] = { ...qStat };
            } else {
                merged[qId].attempts = (merged[qId].attempts || 0) + (qStat.attempts || 0);
                merged[qId].correct = (merged[qId].correct || 0) + (qStat.correct || 0);
            }
        }
    }
    return merged;
}

async function syncStatsWithServer() {
    const profile = getSavedProfile();
    if (!profile || !profile.id) return;

    const unsyncedStats = getUnsyncedStats();
    try {
        const response = await fetch(`${SERVER_URL}/api/stats/sync`, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify({ userId: profile.id, localStats: unsyncedStats })
        });

        if (response.ok) {
            const result = await response.json();
            if (result.success) {
                clearUnsyncedStats();
                localStorage.setItem(STORAGE_KEY, JSON.stringify(result.syncedStats));
                if (result.user) {
                    saveProfile(result.user);
                }
                updateServerStatusUI(true);
            }
        }
    } catch (e) {
        updateServerStatusUI(false);
    }
}

function updateServerStatusUI(online) {
    isServerOnline = online;
    const badge = document.getElementById('server-status-badge');
    if (badge) {
        badge.className = `server-badge ${online ? 'online' : 'offline'}`;
        badge.textContent = online ? '🟢 Сервер Онлайн' : '🔴 Офлайн-режим';
    }
}

async function resetStats() {
    if (!isServerOnline) {
        alert("Сброс статистики на сервере доступен только в Онлайн-режиме!");
        return;
    }
    const profile = getSavedProfile();
    if (!profile) return alert("Авторизуйтесь для сброса статистики.");

    if (confirm("Вы уверены, что хотите сбросить статистику на сервере?")) {
        try {
            const res = await fetch(`${SERVER_URL}/api/stats/${profile.id}`, { method: 'DELETE' });
            if (res.ok) {
                localStorage.removeItem(STORAGE_KEY);
                clearUnsyncedStats();
                alert("Статистика сброшена.");
            }
        } catch (e) {
            alert("Ошибка связи с сервером.");
        }
    }
}

function exportStatsJSON() {
    const stats = getStoredStats();
    const dateStr = new Date().toISOString().slice(0, 10);
    const dataStr = "data:text/json;charset=utf-8," + encodeURIComponent(JSON.stringify(stats, null, 2));
    const downloadAnchor = document.createElement('a');
    downloadAnchor.setAttribute("href", dataStr);
    downloadAnchor.setAttribute("download", `foxy_quiz_stats_${dateStr}.json`);
    document.body.appendChild(downloadAnchor);
    downloadAnchor.click();
    downloadAnchor.remove();
}

function importStatsJSON(event) {
    const file = event.target.files[0];
    if (!file) return;

    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const importedData = JSON.parse(e.target.result);
            saveStoredStats(importedData);
            alert("Статистика импортирована!");
        } catch (err) {
            alert("Ошибка импорта JSON файла.");
        } finally {
            event.target.value = '';
        }
    };
    reader.readAsText(file);
}