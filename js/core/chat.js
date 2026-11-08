let socket = null;

function initChatSocket() {
    if (typeof io === 'undefined') return;

    socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnectionAttempts: 5
    });

    socket.on('connect', () => updateServerStatusUI(true));
    socket.on('disconnect', () => updateServerStatusUI(false));

    socket.on('chat:init', (messages) => {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = '';
        messages.forEach(msg => appendChatMessage(msg));
        scrollChatToBottom();
    });

    socket.on('chat:new_message', (msg) => {
        appendChatMessage(msg);
        scrollChatToBottom();
    });

    socket.on('chat:error', (err) => alert(err));
}

function handleChatButtonClick() {
    const profile = getSavedProfile();
    if (!profile) {
        openAuthModal();
    } else {
        toggleChatWidget();
    }
}

function toggleChatWidget() {
    const profile = getSavedProfile();
    if (!profile) {
        openAuthModal();
        return;
    }
    const drawer = document.getElementById('chat-drawer');
    if (drawer) {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open')) scrollChatToBottom();
    }
}

function sendChatMessage() {
    const input = document.getElementById('chat-input');
    const profile = getSavedProfile();

    if (!profile) {
        openAuthModal();
        return;
    }
    if (!input || !socket) return;

    const text = input.value.trim();
    if (!text) return;
    if (text.length > 150) {
        alert('Максимальная длина сообщения — 150 символов');
        return;
    }

    socket.emit('chat:message', {
        userId: profile.id,
        username: profile.username,
        role: profile.role,
        text: text
    });

    input.value = '';
}

function appendChatMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container) return;

    const msgEl = document.createElement('div');
    const isAdmin = msg.role === 'admin';
    msgEl.className = `chat-msg ${isAdmin ? 'admin-msg' : ''}`;

    const timeStr = new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    msgEl.innerHTML = `
        <div class="chat-msg-header">
            <span class="chat-author ${isAdmin ? 'admin-badge' : ''}">${escapeHTML(msg.username)}</span>
            <span class="chat-time">${timeStr}</span>
        </div>
        <div class="chat-msg-text">${escapeHTML(msg.text)}</div>
    `;

    container.appendChild(msgEl);
    while (container.children.length > 500) {
        container.removeChild(container.firstChild);
    }
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

function updateAuthUserHeaderUI() {
    const profile = getSavedProfile();
    const nameEl = document.getElementById('header-user-name');
    const xpEl = document.getElementById('header-user-xp');
    const authBtn = document.getElementById('header-auth-btn');

    if (profile) {
        nameEl.textContent = profile.username;
        xpEl.textContent = profile.role === 'admin' ? 'Администратор' : 'Участник';
        authBtn.textContent = 'Профиль';
    } else {
        nameEl.textContent = 'Гость';
        xpEl.textContent = '0 XP';
        authBtn.textContent = 'Войти';
    }
}

function handleHeaderAuthClick() {
    const profile = getSavedProfile();
    if (profile) {
        openAccountModal();
    } else {
        openAuthModal();
    }
}

function openAuthModal() {
    document.getElementById('auth-modal').classList.remove('hidden');
}

function closeAuthModal() {
    document.getElementById('auth-modal').classList.add('hidden');
}

async function submitModalLogin() {
    const u = document.getElementById('modal-auth-login').value;
    const p = document.getElementById('modal-auth-pass').value;
    const res = await loginWithCredentials(u, p);
    if (res.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

async function submitModalRegister() {
    const u = document.getElementById('modal-auth-login').value;
    const p = document.getElementById('modal-auth-pass').value;
    const res = await registerUser(u, p);
    if (res.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

function openAccountModal() {
    const profile = getSavedProfile();
    if (!profile) return openAuthModal();

    document.getElementById('acc-modal-username').textContent = profile.username;
    document.getElementById('acc-modal-role').textContent = profile.role;

    const adminSection = document.getElementById('admin-hash-section');
    if (profile.role === 'admin' || window.location.hash === '#admin-login' || window.location.hash === '#admin') {
        adminSection.classList.remove('hidden');
    } else {
        adminSection.classList.add('hidden');
    }

    document.getElementById('account-modal').classList.remove('hidden');
}

function closeAccountModal() {
    document.getElementById('account-modal').classList.add('hidden');
}

async function submitAdminKeyLogin() {
    const key = document.getElementById('modal-admin-key-input').value;
    const res = await loginWithAdminKey(key);
    if (res.success) {
        alert('Успешный вход суперадминистратора!');
        closeAccountModal();
        updateAuthUserHeaderUI();
    } else alert(res.error);
}

function handleLogout() {
    localStorage.removeItem(PROFILE_KEY);
    closeAccountModal();
    updateAuthUserHeaderUI();
    const drawer = document.getElementById('chat-drawer');
    if (drawer) drawer.classList.remove('open');
}