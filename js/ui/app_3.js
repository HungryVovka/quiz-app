/**
 * FoxyQuiz UI Helper, League Leaderboard, Admin Panel & Avatar Shop Integration Module (app_3.js)
 */

let leagueCountdownInterval = null;

// --- ЕЖЕНЕДЕЛЬНАЯ ЛИГА (Воскресенье 22:00 Europe/Rome) ---
async function renderLeagueUI() {
    const tbody = document.getElementById('league-leaderboard-body');
    if (!tbody) return;

    // Вставляем плашку с таймером и наградами перед таблицей
    let leagueMetaBox = document.getElementById('league-meta-info');
    if (!leagueMetaBox) {
        const leagueTab = document.getElementById('profile-tab-league');
        if (leagueTab) {
            leagueMetaBox = document.createElement('div');
            leagueMetaBox.id = 'league-meta-info';
            leagueMetaBox.style.cssText = 'background: rgba(37, 99, 235, 0.1); border: 1px solid var(--accent); border-radius: 10px; padding: 10px; margin-bottom: 12px; font-size: 0.85em; text-align: center;';
            leagueTab.insertBefore(leagueMetaBox, leagueTab.firstChild);
        }
    }

    startLeagueCountdown();

    tbody.innerHTML = '<tr><td colspan="3" style="text-align:center;">Загрузка данных Лиги...</td></tr>';

    if (typeof isServerOnline !== 'undefined' && !isServerOnline) {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Лига доступна только при подключении к серверу</td></tr>';
        return;
    }

    const res = (typeof fetchLeagueLeaderboard === 'function') ? await fetchLeagueLeaderboard() : { success: false };
    if (res && res.success && Array.isArray(res.leaderboard)) {
        if (res.leaderboard.length === 0) {
            tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: var(--text-muted);">Пока нет участников в Лиге на этой неделе</td></tr>';
            return;
        }

        tbody.innerHTML = res.leaderboard.map((player, index) => {
            let rankBadge = `#${index + 1}`;
            let rewardBadge = '';
            if (index === 0) {
                rankBadge = '🥇 1 место';
                rewardBadge = '<span style="color: #f59e0b; font-weight: bold; margin-left: 6px;">(+100 XP)</span>';
            } else if (index === 1) {
                rankBadge = '🥈 2 место';
                rewardBadge = '<span style="color: #94a3b8; font-weight: bold; margin-left: 6px;">(+60 XP)</span>';
            } else if (index === 2) {
                rankBadge = '🥉 3 место';
                rewardBadge = '<span style="color: #b45309; font-weight: bold; margin-left: 6px;">(+30 XP)</span>';
            }

            const currentUser = (typeof getCurrentUser === 'function') ? getCurrentUser() : null;
            const isCurrent = currentUser && (currentUser.username === player.username);

            return `
                <tr style="${isCurrent ? 'background: rgba(37, 99, 235, 0.15); font-weight: bold;' : ''}">
                    <td><strong>${rankBadge}</strong></td>
                    <td>
                        <div style="display: flex; align-items: center; gap: 8px;">
                            <img src="${player.avatar || 'assets/icon.png'}" style="width: 26px; height: 26px; border-radius: 50%; object-fit: cover;">
                            <span>${escapeHTML(player.username || 'Участник')}</span>
                            ${rewardBadge}
                        </div>
                    </td>
                    <td style="color: var(--correct-text); font-weight: bold;">${player.weeklyXP || player.xp || 0} XP</td>
                </tr>
            `;
        }).join('');
    } else {
        tbody.innerHTML = '<tr><td colspan="3" style="text-align:center; color: #ef4444;">Ошибка загрузки лидеров Лиги</td></tr>';
    }
}

function startLeagueCountdown() {
    if (leagueCountdownInterval) clearInterval(leagueCountdownInterval);

    const updateTimer = () => {
        const box = document.getElementById('league-meta-info');
        if (!box) return;

        const nextReset = (typeof getNextLeagueResetTime === 'function') 
            ? getNextLeagueResetTime() 
            : new Date();

        const now = new Date();
        const diff = nextReset - now;

        if (diff <= 0) {
            box.innerHTML = '🏆 <strong>Итоги недели подводятся...</strong>';
            return;
        }

        const days = Math.floor(diff / (1000 * 60 * 60 * 24));
        const hours = Math.floor((diff / (1000 * 60 * 60)) % 24);
        const minutes = Math.floor((diff / (1000 * 60)) % 60);
        const seconds = Math.floor((diff / 1000) % 60);

        box.innerHTML = `
            <div style="font-weight: 600; margin-bottom: 4px;">🏆 Еженедельная лига (Воскресенье 22:00 Europe/Rome)</div>
            <div style="color: #f59e0b; font-size: 0.95em;">🥇 1 место: <strong>100 XP</strong> | 🥈 2 место: <strong>60 XP</strong> | 🥉 3 место: <strong>30 XP</strong></div>
            <div style="margin-top: 6px; color: var(--text-muted); font-size: 0.9em;">Сброс через: <strong>${days}д ${hours}ч ${minutes}м ${seconds}с</strong></div>
        `;
    };

    updateTimer();
    leagueCountdownInterval = setInterval(updateTimer, 1000);
}

// --- ИНТЕРФЕЙС АДМИНИСТРИРОВАНИЯ ---
async function renderAdminPanelUI() {
    let adminContainer = document.getElementById('profile-tab-admin');
    if (!adminContainer) {
        const modalCard = document.querySelector('#account-modal .auth-modal-card');
        if (!modalCard) return;

        adminContainer = document.createElement('div');
        adminContainer.id = 'profile-tab-admin';
        adminContainer.className = 'profile-tab-content hidden';

        const btnBlock = modalCard.querySelector('.auth-modal-buttons');
        modalCard.insertBefore(adminContainer, btnBlock);
    }

    let adminTabBtn = document.getElementById('tab-btn-admin');
    const user = (typeof getSavedProfile === 'function') ? getSavedProfile() : null;
    const isAdmin = user && user.role === 'admin';

    if (isAdmin && !adminTabBtn) {
        const tabsBar = document.querySelector('.profile-modal-tabs');
        if (tabsBar) {
            adminTabBtn = document.createElement('button');
            adminTabBtn.id = 'tab-btn-admin';
            adminTabBtn.className = 'profile-tab-btn';
            adminTabBtn.style.cssText = 'color: #f59e0b; border-color: #f59e0b;';
            adminTabBtn.textContent = '👑 Админ';
            adminTabBtn.onclick = () => switchProfileTab('admin');
            tabsBar.appendChild(adminTabBtn);
        }
    }

    if (!isAdmin) {
        adminContainer.innerHTML = '<div style="padding: 16px; text-align: center; color: var(--text-muted);">Требуются права администратора</div>';
        return;
    }

    adminContainer.innerHTML = '<div style="padding: 16px; text-align: center;">Загрузка списка пользователей...</div>';

    const res = (typeof fetchAdminUsers === 'function') ? await fetchAdminUsers() : { success: false };

    if (res && res.success && Array.isArray(res.users)) {
        let html = `
            <div style="margin-bottom: 12px; font-size: 0.9em; font-weight: 600; color: #f59e0b;">
                Панель управления пользователями (${res.users.length})
            </div>
            <div style="display: flex; flex-direction: column; gap: 10px; max-height: 260px; overflow-y: auto; padding-right: 4px;">
        `;

        res.users.forEach(u => {
            const uid = u.id || u.profileKey || u._id;
            html += `
                <div style="background: #0d1322; border: 1px solid var(--card-border); border-radius: 10px; padding: 10px; display: flex; flex-direction: column; gap: 8px;">
                    <div style="display: flex; justify-content: space-between; align-items: center;">
                        <div>
                            <strong style="color: var(--text-main);">${escapeHTML(u.username)}</strong>
                            <span style="font-size: 0.75em; color: var(--text-muted); margin-left: 6px;">(${u.role || 'user'})</span>
                        </div>
                        <button type="button" onclick="handleAdminDeleteUser('${uid}', '${escapeHTML(u.username)}')" style="background: #ef4444; border: none; color: white; padding: 4px 10px; border-radius: 6px; cursor: pointer; font-size: 0.78em;">
                            Удалить
                        </button>
                    </div>
                    <div style="display: flex; gap: 6px; align-items: center;">
                        <span style="font-size: 0.82em; color: var(--text-muted);">XP:</span>
                        <input type="number" id="admin-xp-input-${uid}" value="${u.xp || 0}" style="width: 90px; padding: 4px 8px; font-size: 0.85em; text-align: center;">
                        <button type="button" onclick="handleAdminSaveXP('${uid}')" style="background: var(--accent); border: none; color: white; padding: 5px 12px; border-radius: 6px; cursor: pointer; font-size: 0.8em;">
                            Сохранить XP
                        </button>
                    </div>
                </div>
            `;
        });

        html += `</div>`;
        adminContainer.innerHTML = html;
    } else {
        adminContainer.innerHTML = `<div style="padding: 16px; text-align: center; color: #ef4444;">${res.error || 'Ошибка загрузки пользователей'}</div>`;
    }
}

async function handleAdminSaveXP(userId) {
    const input = document.getElementById(`admin-xp-input-${userId}`);
    if (!input) return;
    const newXP = parseInt(input.value, 10);
    if (isNaN(newXP)) return alert('Введите корректное число XP');

    if (typeof updateAdminUserXP === 'function') {
        const res = await updateAdminUserXP(userId, newXP);
        if (res && res.success) {
            alert('XP пользователя успешно обновлен!');
            renderAdminPanelUI();
            if (typeof updateAuthUserHeaderUI === 'function') updateAuthUserHeaderUI();
        } else {
            alert((res && res.error) ? res.error : 'Ошибка обновления XP');
        }
    }
}

async function handleAdminDeleteUser(userId, username) {
    if (!confirm(`Вы уверены, что хотите полностью удалить пользователя "${username}"?`)) return;

    if (typeof deleteAdminUser === 'function') {
        const res = await deleteAdminUser(userId);
        if (res && res.success) {
            alert('Пользователь удален.');
            renderAdminPanelUI();
        } else {
            alert((res && res.error) ? res.error : 'Ошибка удаления пользователя');
        }
    }
}

// --- МАГАЗИН АВАТАРОВ ---
function renderAvatarShopUI() {
    const container = document.getElementById('avatars-shop-container');
    if (!container) return;

    const currentProfile = (typeof getSavedProfile === 'function') ? getSavedProfile() : null;
    const activeAvatar = currentProfile ? (currentProfile.avatar || 'assets/icon.png') : 'assets/icon.png';

    const avatars = [
        { id: 'default', name: 'Лисёнок Фокси', icon: 'assets/icon.png', cost: 0 },
        { id: 'smart_fox', name: 'Учёный Лис', icon: 'assets/icon.png', cost: 50 },
        { id: 'ninja_fox', name: 'Ниндзя Лис', icon: 'assets/icon.png', cost: 100 },
        { id: 'gold_fox', name: 'Золотой Лис', icon: 'assets/icon.png', cost: 200 }
    ];

    container.innerHTML = avatars.map(av => {
        const isActive = activeAvatar === av.icon;
        return `
            <div class="avatar-item ${isActive ? 'active' : ''}">
                <img src="${av.icon}" alt="${av.name}">
                <div class="avatar-item-name">${av.name}</div>
                <div class="avatar-item-cost">${av.cost === 0 ? 'Бесплатно' : av.cost + ' XP'}</div>
                <button type="button" class="btn btn-secondary" style="font-size: 0.78em; padding: 6px 10px; margin-top: 4px;" onclick="selectUserAvatar('${av.icon}')">
                    ${isActive ? 'Выбрано' : 'Установить'}
                </button>
            </div>
        `;
    }).join('');
}

function selectUserAvatar(iconPath) {
    const profile = (typeof getSavedProfile === 'function') ? getSavedProfile() : null;
    if (!profile) return openAuthModal();

    profile.avatar = iconPath;
    if (typeof saveProfile === 'function') saveProfile(profile);

    const headerImg = document.getElementById('header-user-avatar-img');
    if (headerImg) headerImg.src = iconPath;

    renderAvatarShopUI();
    alert('Аватар успешно обновлен!');
}

// Перехватываем и расширяем переключение вкладок профиля
if (typeof window.switchProfileTab === 'function') {
    const originalSwitchProfileTab = window.switchProfileTab;
    window.switchProfileTab = function(tabName) {
        const adminTab = document.getElementById('profile-tab-admin');
        if (adminTab) adminTab.classList.add('hidden');

        originalSwitchProfileTab(tabName);

        if (tabName === 'admin') {
            const tabs = ['info', 'avatars', 'league'];
            tabs.forEach(t => {
                const content = document.getElementById(`profile-tab-${t}`);
                if (content) content.classList.add('hidden');
            });
            document.querySelectorAll('.profile-tab-btn').forEach(btn => btn.classList.remove('active'));

            if (adminTab) adminTab.classList.remove('hidden');
            const btn = document.getElementById('tab-btn-admin');
            if (btn) btn.classList.add('active');

            renderAdminPanelUI();
        }
    };
}

window.addEventListener('DOMContentLoaded', () => {
    const urlInput = document.getElementById('server-url-input');
    if (urlInput && typeof getServerURL === 'function') {
        urlInput.value = getServerURL();
    }
});