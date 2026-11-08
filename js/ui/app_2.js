function shuffleQuestionOptions(originalQ) {
    if (!originalQ || !Array.isArray(originalQ.options)) return originalQ;

    const q = JSON.parse(JSON.stringify(originalQ));
    const realCorrectAns = (typeof decodeAns === 'function') ? decodeAns(q.ans) : q.ans;

    const combined = q.options.map((optText, idx) => ({
        text: optText,
        explanation: (q.explanations && q.explanations[idx]) ? q.explanations[idx] : null,
        isCorrect: idx === realCorrectAns,
        originalIndex: idx
    }));

    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    q.options = combined.map(item => item.text);
    if (q.explanations) {
        q.explanations = combined.map(item => item.explanation);
    }

    q.shuffledIndices = combined.map(item => item.originalIndex);
    const newAnsIndex = combined.findIndex(item => item.isCorrect);
    q.ans = newAnsIndex !== -1 ? newAnsIndex : 0;

    return q;
}

function attachSecondaryData(q, secQMap) {
    if (!q || !secQMap || !secQMap[q.id]) return;

    const secQ = secQMap[q.id];
    const secOptions = [];
    const secExplanations = [];

    if (Array.isArray(q.shuffledIndices) && Array.isArray(secQ.options)) {
        q.shuffledIndices.forEach(origIdx => {
            secOptions.push(secQ.options[origIdx] || '');
            if (secQ.explanations && secQ.explanations[origIdx]) {
                secExplanations.push(secQ.explanations[origIdx]);
            } else {
                secExplanations.push(null);
            }
        });
    }

    q.secondary = {
        q: secQ.q || '',
        options: secOptions,
        explanations: secExplanations,
        exp: secQ.exp || '',
        hint: secQ.hint || ''
    };
}

const ALL_APP_LANGS = [
    { code: 'ru', label: 'Русский (RU)' },
    { code: 'it', label: 'Italiano (IT)' },
    { code: 'en', label: 'English (EN)' }
];

function toggleSecLangDropdown(e) {
    if (e) e.stopPropagation();
    const subjDropdown = document.getElementById('custom-subject-dropdown');
    const langDropdown = document.getElementById('custom-lang-dropdown');
    if (subjDropdown) subjDropdown.classList.remove('open');
    if (langDropdown) langDropdown.classList.remove('open');

    const dropdown = document.getElementById('custom-sec-lang-dropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

function updateSecondaryLangDropdown(primaryLang) {
    const optionsContainer = document.getElementById('custom-sec-lang-options');
    const selectedEl = document.getElementById('custom-sec-lang-selected');
    const hiddenInput = document.getElementById('setting-sec-lang');
    if (!optionsContainer || !hiddenInput) return;

    const t = i18n[primaryLang] || i18n['en'];
    const disabledLabel = t.secLangOff || 'Отключено';

    let currentSecVal = hiddenInput.value;
    if (currentSecVal === primaryLang) {
        currentSecVal = 'none';
        hiddenInput.value = 'none';
    }

    optionsContainer.innerHTML = '';

    const noneItem = document.createElement('div');
    noneItem.className = 'custom-option' + (currentSecVal === 'none' ? ' selected' : '');
    noneItem.textContent = disabledLabel;
    noneItem.onclick = (e) => {
        e.stopPropagation();
        hiddenInput.value = 'none';
        selectedEl.textContent = disabledLabel;
        optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
        noneItem.classList.add('selected');
        toggleSecLangDropdown();
    };
    optionsContainer.appendChild(noneItem);

    ALL_APP_LANGS.filter(l => l.code !== primaryLang).forEach(l => {
        const item = document.createElement('div');
        item.className = 'custom-option' + (currentSecVal === l.code ? ' selected' : '');
        item.textContent = l.label;
        item.onclick = (e) => {
            e.stopPropagation();
            hiddenInput.value = l.code;
            selectedEl.textContent = l.label;
            optionsContainer.querySelectorAll('.custom-option').forEach(el => el.classList.remove('selected'));
            item.classList.add('selected');
            toggleSecLangDropdown();
        };
        optionsContainer.appendChild(item);
    });

    if (currentSecVal === 'none') {
        selectedEl.textContent = disabledLabel;
    } else {
        const found = ALL_APP_LANGS.find(l => l.code === currentSecVal);
        selectedEl.textContent = found ? found.label : disabledLabel;
    }
}

function openChangelog() {
    const setupScreen = document.getElementById('setup-screen');
    const changelogScreen = document.getElementById('changelog-screen');
    const container = document.getElementById('changelog-container');

    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const logs = CHANGELOG_DATA[lang] || CHANGELOG_DATA['en'];

    container.innerHTML = logs.map(item => `
        <div class="changelog-card">
            <div class="changelog-header">
                <span class="changelog-version-title">${item.version} — ${item.title}</span>
                <span class="changelog-date">${item.date}</span>
            </div>
            <div class="changelog-body">
                ${item.content}
            </div>
        </div>
    `).join('');

    setupScreen.classList.add('hidden');
    changelogScreen.classList.remove('hidden');
    changelogScreen.classList.remove('slide-in');
    void changelogScreen.offsetWidth;
    changelogScreen.classList.add('slide-in');
}

function closeChangelog() {
    const setupScreen = document.getElementById('setup-screen');
    const changelogScreen = document.getElementById('changelog-screen');

    changelogScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.remove('slide-in');
    void setupScreen.offsetWidth;
    setupScreen.classList.add('slide-in');
}

function updateVersionBadge() {
    const badge = document.querySelector('.version-tag');
    if (badge && CHANGELOG_DATA && CHANGELOG_DATA.ru[0]) {
        badge.textContent = CHANGELOG_DATA.ru[0].version;
    }
}

window.addEventListener('DOMContentLoaded', updateVersionBadge);

const FoxMascot = {
    inactivityTimer: null,
    reactionResetTimer: null,
    INACTIVITY_LIMIT: 2 * 60 * 1000,
    STORAGE_KEY: 'fox_quiz_reaction_state',

    init() {
        this.injectFoxSVG();
        this.checkPersistedReaction();
        this.resetInactivityTimer();
    },

    injectFoxSVG() {
        const quizScreen = document.getElementById('quiz-screen');
        if (!quizScreen || document.getElementById('fox-mascot')) return;

        const wrapper = document.createElement('div');
        wrapper.id = 'fox-mascot';
        wrapper.className = 'fox-mascot-wrapper is-idle';

        wrapper.innerHTML = `
            <svg viewBox="0 0 110 70" width="110" height="70">
                <g class="fox-zzz">
                    <text x="72" y="18" font-size="10" class="zzz-1">z</text>
                    <text x="82" y="11" font-size="12" class="zzz-2">Z</text>
                    <text x="92" y="4"  font-size="14" class="zzz-3">Z</text>
                </g>
                <g class="fox-tail-group">
                    <path d="M 22 36 C 12 48, 8 63, 18 67 C 28 64, 28 48, 22 36 Z" fill="#e65100"/>
                    <path d="M 15 58 C 13 63, 18 67, 23 65 C 25 61, 22 58, 15 58 Z" fill="#ffffff"/>
                </g>
                <path d="M 18 36 Q 48 28 78 36 L 80 43 L 16 43 Z" fill="#f57c00"/>
                <ellipse cx="76" cy="43" rx="5" ry="3" fill="#e65100"/>
                <ellipse cx="63" cy="43" rx="5" ry="3" fill="#e65100"/>
                <g class="fox-head">
                    <polygon points="63,20 70,8 75,20" fill="#e65100"/>
                    <polygon points="65,19 70,11 73,19" fill="#263238"/>
                    <polygon points="77,20 84,8 89,20" fill="#e65100"/>
                    <polygon points="79,19 84,11 87,19" fill="#263238"/>
                    <polygon points="60,22 92,22 76,38" fill="#f57c00"/>
                    <polygon points="64,22 76,36 60,22" fill="#ffffff"/>
                    <polygon points="88,22 76,36 92,22" fill="#ffffff"/>
                    <circle cx="76" cy="36" r="2.5" fill="#263238"/>
                    <g class="fox-eye-open">
                        <circle cx="69" cy="25" r="2" fill="#263238"/>
                        <circle cx="83" cy="25" r="2" fill="#263238"/>
                    </g>
                    <path class="fox-eye-sleep" d="M 67 25 Q 69 27 71 25 M 81 25 Q 83 27 85 25" stroke="#263238" stroke-width="1.5" fill="none"/>
                </g>
            </svg>
        `;

        quizScreen.appendChild(wrapper);
    },

    setState(stateName) {
        const fox = document.getElementById('fox-mascot');
        if (!fox) return;

        fox.classList.remove('is-idle', 'is-correct', 'is-incorrect', 'is-sleeping');
        fox.classList.add(`is-${stateName}`);
    },

    resetInactivityTimer() {
        clearTimeout(this.inactivityTimer);

        const fox = document.getElementById('fox-mascot');
        if (fox && fox.classList.contains('is-sleeping')) {
            this.setState('idle');
        }

        this.inactivityTimer = setTimeout(() => {
            this.setState('sleeping');
        }, this.INACTIVITY_LIMIT);
    },

    triggerReaction(isCorrect) {
        clearTimeout(this.reactionResetTimer);
        const reaction = isCorrect ? 'correct' : 'incorrect';
        this.setState(reaction);

        const stateData = {
            reaction: reaction,
            timestamp: Date.now()
        };
        sessionStorage.setItem(this.STORAGE_KEY, JSON.stringify(stateData));

        this.reactionResetTimer = setTimeout(() => {
            sessionStorage.removeItem(this.STORAGE_KEY);
            this.setState('idle');
            this.resetInactivityTimer();
        }, 3000);
    },

    checkPersistedReaction() {
        const raw = sessionStorage.getItem(this.STORAGE_KEY);
        if (!raw) {
            this.setState('idle');
            return;
        }

        try {
            const data = JSON.parse(raw);
            const elapsed = Date.now() - data.timestamp;
            const remaining = 3000 - elapsed;

            if (remaining > 0 && (data.reaction === 'correct' || data.reaction === 'incorrect')) {
                this.setState(data.reaction);
                this.reactionResetTimer = setTimeout(() => {
                    sessionStorage.removeItem(this.STORAGE_KEY);
                    this.setState('idle');
                    this.resetInactivityTimer();
                }, remaining);
            } else {
                sessionStorage.removeItem(this.STORAGE_KEY);
                this.setState('idle');
            }
        } catch (e) {
            sessionStorage.removeItem(this.STORAGE_KEY);
            this.setState('idle');
        }
    }
};

window.addEventListener('DOMContentLoaded', () => {
    FoxMascot.init();
});

if (typeof window.handleAnswerSelect === 'function') {
    const originalHandleAnswerSelect = window.handleAnswerSelect;
    window.handleAnswerSelect = function(card, container, idx, correctAns) {
        originalHandleAnswerSelect.apply(this, arguments);
        const isCorrect = (idx === correctAns);
        FoxMascot.triggerReaction(isCorrect);
    };
}

if (typeof window.renderQuestion === 'function') {
    const originalRenderQuestion = window.renderQuestion;
    window.renderQuestion = function() {
        originalRenderQuestion.apply(this, arguments);
        FoxMascot.resetInactivityTimer();
    };
}

function openStatsScreen() {
    const setupScreen = document.getElementById('setup-screen');
    const statsScreen = document.getElementById('stats-settings-screen');

    setupScreen.classList.add('hidden');
    statsScreen.classList.remove('hidden');
    statsScreen.classList.remove('slide-in');
    void statsScreen.offsetWidth;
    statsScreen.classList.add('slide-in');

    applyFontScale(currentFontPercent);
}

function closeStatsScreen() {
    const setupScreen = document.getElementById('setup-screen');
    const statsScreen = document.getElementById('stats-settings-screen');

    statsScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.remove('slide-in');
    void setupScreen.offsetWidth;
    setupScreen.classList.add('slide-in');
}

const BASE_FONT_SIZE_PX = 15;
const MIN_FONT_PERCENT = 50;
const MAX_FONT_PERCENT = 200;

let currentFontPercent = parseInt(localStorage.getItem('foxy_quiz_font_percent')) || 100;

function applyFontScale(percent) {
    currentFontPercent = Math.min(MAX_FONT_PERCENT, Math.max(MIN_FONT_PERCENT, percent));
    const calculatedPx = (BASE_FONT_SIZE_PX * currentFontPercent) / 100;
    
    document.documentElement.style.setProperty('--user-font-size', `${calculatedPx.toFixed(1)}px`);
    document.body.style.fontSize = `${calculatedPx.toFixed(1)}px`;
    
    localStorage.setItem('foxy_quiz_font_percent', currentFontPercent.toString());
    
    const valInput = document.getElementById('setting-fontsize-val');
    if (valInput) {
        valInput.value = `${currentFontPercent}%`;
    }
}

function changeFontScale(stepPercent) {
    applyFontScale(currentFontPercent + stepPercent);
}

window.addEventListener('DOMContentLoaded', () => {
    applyFontScale(currentFontPercent);
});

function showLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        const titleEl = document.getElementById('loading-title');
        if (titleEl && typeof i18n !== 'undefined') {
            const t = i18n[currentLang] || i18n['ru'];
            titleEl.textContent = t.loading || "Загрузка";
        }
        overlay.classList.remove('fade-out');
    }
}

function hideLoadingOverlay() {
    const overlay = document.getElementById('loading-overlay');
    if (overlay) {
        overlay.classList.add('fade-out');
    }
}

async function onLanguageChange(lang) {
    showLoadingOverlay();

    setLanguage(lang);
    
    const selectedText = document.getElementById('custom-subject-selected');
    const optionsContainer = document.getElementById('custom-subject-options');
    const hiddenInput = document.getElementById('setting-subject');

    selectedText.textContent = "Загрузка...";
    optionsContainer.innerHTML = '';
    hiddenInput.value = '';

    const rawMap = {};
    const fetchPromises = REGISTERED_JSON_FILES.map(async (fileName) => {
        const filePath = `./data/${lang}/${fileName}`;
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                const data = await response.json();
                if (data && data.subject) rawMap[fileName] = data;
            }
        } catch (e) {}
    });

    await Promise.all(fetchPromises);
    loadedSubjectsMap = aggregateSubjectsMap(rawMap);

    const availableKeys = Object.keys(loadedSubjectsMap);

    if (availableKeys.length === 0) {
        selectedText.textContent = "-- Нет предметов --";
    } else {
        const firstKey = availableKeys[0];
        hiddenInput.value = firstKey;
        selectedText.textContent = loadedSubjectsMap[firstKey].subject;

        availableKeys.forEach((fileKey, idx) => {
            const item = document.createElement('div');
            item.className = 'custom-option' + (idx === 0 ? ' selected' : '');
            item.textContent = loadedSubjectsMap[fileKey].subject;

            item.onclick = (e) => {
                e.stopPropagation();
                hiddenInput.value = fileKey;
                selectedText.textContent = loadedSubjectsMap[fileKey].subject;

                document.querySelectorAll('#custom-subject-options .custom-option').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');

                toggleSubjectDropdown();
            };

            optionsContainer.appendChild(item);
        });
    }

    requestAnimationFrame(() => {
        setTimeout(() => {
            hideLoadingOverlay();
        }, 200);
    });
}

function calculateTotalXP() {
    const stats = typeof getStoredStats === 'function' ? getStoredStats() : {};
    let totalCorrect = 0;
    
    Object.keys(stats).forEach(key => {
        if (stats[key] && typeof stats[key].correct === 'number') {
            totalCorrect += stats[key].correct;
        }
    });

    const currentUser = (typeof getSavedProfile === 'function')
        ? getSavedProfile()
        : JSON.parse(localStorage.getItem('foxy_profile_data') || localStorage.getItem('foxy_quiz_user') || 'null');

    const calculatedXP = totalCorrect * 10;

    if (currentUser && typeof currentUser.xp === 'number') {
        return Math.max(currentUser.xp, calculatedXP);
    }

    return calculatedXP;
}

function updateAuthUserHeaderUI() {
    const userNameEl = document.getElementById('header-user-name');
    const userXpEl = document.getElementById('header-user-xp');
    const authBtn = document.getElementById('header-auth-btn');

    const currentUser = (typeof getSavedProfile === 'function')
        ? getSavedProfile()
        : JSON.parse(localStorage.getItem('foxy_profile_data') || localStorage.getItem('foxy_quiz_user') || 'null');

    const currentXP = calculateTotalXP();

    if (currentUser && currentUser.username) {
        if (userNameEl) userNameEl.textContent = currentUser.username;
        if (userXpEl) userXpEl.textContent = `${currentXP} XP`;
        if (authBtn) authBtn.textContent = 'Профиль';
    } else {
        if (userNameEl) userNameEl.textContent = 'Гость';
        if (userXpEl) userXpEl.textContent = `${currentXP} XP`;
        if (authBtn) authBtn.textContent = 'Войти';
    }
}

function openAccountModal() {
    const modal = document.getElementById('account-modal');
    const accUserEl = document.getElementById('acc-modal-username');
    const accRoleEl = document.getElementById('acc-modal-role');
    const accXpEl = document.getElementById('acc-modal-xp');
    const adminSec = document.getElementById('admin-hash-section');

    const currentUser = (typeof getSavedProfile === 'function')
        ? getSavedProfile()
        : JSON.parse(localStorage.getItem('foxy_profile_data') || localStorage.getItem('foxy_quiz_user') || 'null');

    const currentXP = calculateTotalXP();

    if (currentUser) {
        if (accUserEl) accUserEl.textContent = currentUser.username || 'Гость';
        if (accRoleEl) accRoleEl.textContent = currentUser.role || 'Участник';
        if (accXpEl) accXpEl.textContent = `${currentXP} XP`;
    } else {
        if (accUserEl) accUserEl.textContent = 'Гость';
        if (accRoleEl) accRoleEl.textContent = 'Не авторизован';
        if (accXpEl) accXpEl.textContent = `${currentXP} XP`;
    }

    if (adminSec) {
        if (window.location.hash === '#admin-login' || window.location.hash === '#admin') {
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

function closeAuthModal() {
    const modal = document.getElementById('auth-modal');
    if (modal) modal.classList.add('hidden');
}

function handleHeaderAuthClick() {
    const currentUser = (typeof getSavedProfile === 'function')
        ? getSavedProfile()
        : JSON.parse(localStorage.getItem('foxy_profile_data') || localStorage.getItem('foxy_quiz_user') || 'null');

    if (currentUser && currentUser.username) {
        openAccountModal();
    } else {
        const authModal = document.getElementById('auth-modal');
        if (authModal) authModal.classList.remove('hidden');
    }
}

async function submitModalLogin() {
    const loginInput = document.getElementById('modal-auth-login');
    const passInput = document.getElementById('modal-auth-pass');
    
    if (!loginInput || !passInput) return;
    
    const username = loginInput.value.trim();
    const password = passInput.value.trim();
    
    if (!username || !password) {
        alert('Заполните логин и пароль');
        return;
    }
    
    const result = await loginWithCredentials(username, password);
    if (result.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
        loginInput.value = '';
        passInput.value = '';
    } else {
        alert(result.error || 'Ошибка входа');
    }
}

async function submitModalRegister() {
    const loginInput = document.getElementById('modal-auth-login');
    const passInput = document.getElementById('modal-auth-pass');
    
    if (!loginInput || !passInput) return;
    
    const username = loginInput.value.trim();
    const password = passInput.value.trim();
    
    if (!username || !password) {
        alert('Заполните все поля');
        return;
    }
    
    const result = await registerUser(username, password);
    if (result.success) {
        closeAuthModal();
        updateAuthUserHeaderUI();
        loginInput.value = '';
        passInput.value = '';
    } else {
        alert(result.error || 'Ошибка регистрации');
    }
}

async function submitAdminKeyLogin() {
    const keyInput = document.getElementById('modal-admin-key-input');
    if (!keyInput) return;
    
    const key = keyInput.value.trim();
    if (!key) {
        alert('Введите ключ');
        return;
    }
    
    const result = await loginWithAdminKey(key);
    if (result.success) {
        closeAccountModal();
        updateAuthUserHeaderUI();
        keyInput.value = '';
    } else {
        alert(result.error || 'Ошибка ключа');
    }
}

function handleLogout() {
    localStorage.removeItem('foxy_profile_data');
    localStorage.removeItem('foxy_quiz_user');
    closeAccountModal();
    updateAuthUserHeaderUI();
}

// Безопасный загрузчик базы предметов без потери относительных путей
async function onLanguageChange(lang) {
    showLoadingOverlay();

    setLanguage(lang);
    
    const selectedText = document.getElementById('custom-subject-selected');
    const optionsContainer = document.getElementById('custom-subject-options');
    const hiddenInput = document.getElementById('setting-subject');

    selectedText.textContent = "Загрузка...";
    optionsContainer.innerHTML = '';
    hiddenInput.value = '';

    const rawMap = {};

    // Загрузка вопросов из GitHub-репозитория с проверкой статуса
    const fetchPromises = REGISTERED_JSON_FILES.map(async (fileName) => {
        // Относительный путь для вызова из GitHub Pages
        const filePath = `./data/${lang}/${fileName}`;
        try {
            const response = await fetch(filePath);
            if (response.ok) {
                const data = await response.json();
                if (data && data.subject) {
                    rawMap[fileName] = data;
                }
            }
        } catch (e) {
            console.warn(`Файл не найден: ${filePath}`);
        }
    });

    await Promise.all(fetchPromises);
    loadedSubjectsMap = aggregateSubjectsMap(rawMap);

    const availableKeys = Object.keys(loadedSubjectsMap);

    if (availableKeys.length === 0) {
        selectedText.textContent = "-- Нет предметов --";
    } else {
        const firstKey = availableKeys[0];
        hiddenInput.value = firstKey;
        selectedText.textContent = loadedSubjectsMap[firstKey].subject;

        availableKeys.forEach((fileKey, idx) => {
            const item = document.createElement('div');
            item.className = 'custom-option' + (idx === 0 ? ' selected' : '');
            item.textContent = loadedSubjectsMap[fileKey].subject;

            item.onclick = (e) => {
                e.stopPropagation();
                hiddenInput.value = fileKey;
                selectedText.textContent = loadedSubjectsMap[fileKey].subject;

                document.querySelectorAll('#custom-subject-options .custom-option').forEach(el => {
                    el.classList.remove('selected');
                });
                item.classList.add('selected');

                toggleSubjectDropdown();
            };

            optionsContainer.appendChild(item);
        });
    }

    requestAnimationFrame(() => {
        setTimeout(() => {
            hideLoadingOverlay();
        }, 200);
    });
}