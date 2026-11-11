/**
 * FoxyQuiz Online Chat Core Module & Administration Moderation
 */
let socket = null;

function initChatSocket() {
    if (typeof io === 'undefined') return;

    socket = io(SERVER_URL, {
        transports: ['websocket', 'polling'],
        reconnection: true
    });

    socket.on('connect', () => updateServerStatusUI(true));
    socket.on('disconnect', () => updateServerStatusUI(false));

    socket.on('chat_history', (messages) => {
        const container = document.getElementById('chat-messages');
        if (!container) return;
        container.innerHTML = '';
        if (Array.isArray(messages)) {
            messages.forEach(msg => appendChatMessage(msg));
        }
        scrollChatToBottom();
    });

    socket.on('chat_message', (msg) => {
        appendChatMessage(msg);
        scrollChatToBottom();
    });

    // Обработка удаления сообщения в реальном времени со стороны сервера
    socket.on('delete_message', (data) => {
        const msgId = typeof data === 'object' ? (data.messageId || data.id) : data;
        removeMessageFromDOM(msgId);
    });

    socket.on('chat_message_deleted', (data) => {
        const msgId = typeof data === 'object' ? (data.messageId || data.id) : data;
        removeMessageFromDOM(msgId);
    });
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
    const drawer = document.getElementById('chat-drawer');
    if (drawer) {
        drawer.classList.toggle('open');
        if (drawer.classList.contains('open')) {
            if (!socket) initChatSocket();
            scrollChatToBottom();
        }
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

    socket.emit('send_message', {
        userId: profile.id || profile.profileKey,
        username: profile.username,
        avatar: profile.avatar || 'assets/icon.png',
        role: profile.role || 'user',
        text: text
    });

    input.value = '';
}

function appendChatMessage(msg) {
    const container = document.getElementById('chat-messages');
    if (!container || !msg) return;

    const msgId = msg.id || msg._id || msg.messageId;
    if (msgId && document.getElementById(`chat-msg-${msgId}`)) {
        return; // Сообщение уже отрисовано
    }

    const currentUser = typeof getSavedProfile === 'function' ? getSavedProfile() : null;
    const isAdmin = currentUser && currentUser.role === 'admin';

    const msgEl = document.createElement('div');
    msgEl.className = 'chat-message-item' + (msg.role === 'admin' ? ' admin-msg' : '');
    if (msgId) {
        msgEl.id = `chat-msg-${msgId}`;
        msgEl.dataset.msgId = msgId;
    }

    const timeStr = msg.timestamp 
        ? (msg.timestamp.includes('T') ? new Date(msg.timestamp).toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }) : msg.timestamp) 
        : new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });

    const adminDeleteBtnHtml = (isAdmin && msgId) 
        ? `<button type="button" class="chat-delete-msg-btn" title="Удалить сообщение" onclick="removeChatMessage('${msgId}')" style="background:none; border:none; color:#ef4444; cursor:pointer; font-size:0.85em; margin-left:6px;">🗑️</button>` 
        : '';

    msgEl.innerHTML = `
        <img src="${msg.avatar || 'assets/icon.png'}" class="chat-avatar" alt="User">
        <div class="chat-msg-body">
            <div class="chat-msg-header">
                <span class="chat-user-name ${msg.role === 'admin' ? 'admin-badge' : ''}">${escapeHTML(msg.username || 'Гость')}</span>
                <div style="display: flex; align-items: center;">
                    <span class="chat-time">${timeStr}</span>
                    ${adminDeleteBtnHtml}
                </div>
            </div>
            <div class="chat-text">${escapeHTML(msg.text || '')}</div>
        </div>
    `;

    container.appendChild(msgEl);

    // Ограничиваем количество сообщений в DOM
    while (container.children.length > 500) {
        container.removeChild(container.firstChild);
    }
}

async function removeChatMessage(msgId) {
    if (!msgId) return;
    if (!confirm('Вы уверены, что хотите удалить это сообщение?')) return;

    if (typeof deleteAdminChatMessage === 'function') {
        const res = await deleteAdminChatMessage(msgId);
        if (res && res.success) {
            removeMessageFromDOM(msgId);
            if (socket) {
                socket.emit('delete_message', { messageId: msgId });
            }
        } else {
            // Если REST API не ответил, пробуем отправить удаление через WebSocket
            if (socket) {
                socket.emit('delete_message', { messageId: msgId });
            }
            removeMessageFromDOM(msgId);
        }
    } else {
        if (socket) {
            socket.emit('delete_message', { messageId: msgId });
        }
        removeMessageFromDOM(msgId);
    }
}

function removeMessageFromDOM(msgId) {
    if (!msgId) return;
    const el = document.getElementById(`chat-msg-${msgId}`);
    if (el) {
        el.remove();
    }
}

function scrollChatToBottom() {
    const container = document.getElementById('chat-messages');
    if (container) container.scrollTop = container.scrollHeight;
}

function escapeHTML(str) {
    return String(str).replace(/[&<>"']/g, m => ({ '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#039;' }[m]));
}

window.addEventListener('DOMContentLoaded', () => {
    initChatSocket();
});