/**
 * FoxyQuiz i18n Internationalization & System Language Detector Module
 */

// Автоматическое определение языка системы пользователя
function detectSystemLanguage() {
    const sysLang = (navigator.language || navigator.userLanguage || 'en').toLowerCase().slice(0, 2);
    const supportedLangs = ['ru', 'it', 'en'];
    return supportedLangs.includes(sysLang) ? sysLang : 'en'; // fallback на 'en'
}

const i18n = {
    ru: {
        // Заголовки и Настройки
        title: "Настройки Тестирования",
        lang: "Язык интерфейса и тестов:",
        subject: "Предмет / База знаний:",
        count: "Количество вопросов в сессии:",
        timer: "Таймер (в минутах, 0 = без таймера):",
        back: "Разрешить возврат к предыдущему вопросу",
        hints: "Показывать подсказки",
        start: "Начать тест",
        reset: "Дополнительные настройки",
        statsTitle: "Дополнительные настройки",
        fontsizeLabel: "Размер шрифта интерфейса:",
        exportStats: "💾 Сохранить статистику (.JSON)",
        importStats: "📥 Загрузить статистику из файла",
        resetStatsPage: "🗑️ Сбросить статистику на сервере",
        backToMenu: "← Вернуться в главное меню",
        statsImportSuccess: "Статистика успешно импортирована!",
        statsImportError: "Ошибка при чтении файла статистики (.JSON).",
        loading: "Загрузка",
        changelogTitle: "История обновлений",
        changelogBack: "← Назад к настройкам",
        noSubjects: "-- Нет предметов --",
        loadingSubjects: "Загрузка...",
        
        // Сервер и Статус
        serverOnline: "🟢 Сервер Онлайн",
        serverOffline: "🔴 Офлайн-режим",
        serverUrlLabel: "Адрес сервера синхронизации:",
        serverUrlSaved: "Адрес сервера сохранен: ",

        // Тестирование
        qNum: "Вопрос",
        yourAns: "(Ваш ответ)",
        hintBtn: "💡 Показать подсказку",
        hideHintBtn: "🙈 Скрыть подсказку",
        prev: "Назад",
        next: "Далее",
        exitBtn: "Прервать",
        finish: "Завершить тест",
        confirmReset: "Вы уверены, что хотите сбросить всю статистику ответов?",
        statsResetSuccess: "Статистика успешно сброшена.",
        secLang: "Дополнительный язык (дублирование):",
        secLangOff: "Отключено",

        // Модальное окно импорта
        import_modal_title: "Импорт сохранения",
        import_modal_desc: "У вас уже есть локальный прогресс. Выберите действие:",
        import_action_merge: "Объединить",
        import_action_overwrite: "Перезаписать",
        import_action_cancel: "Отмена",

        // Результаты
        resultsTitle: "Результаты тестов",
        reviewTitle: "Подробный разбор вопросов",
        correctCount: "Правильных ответов",
        skippedCount: "пропущено",
        wrongCount: "ошибок",
        strengths: "Сильные стороны",
        improvements: "Области для улучшения",
        restart: "Пройти еще раз",
        greatProgress: "Отличный прогресс! Продолжайте в том же духе.",
        answeredBefore: "Отвечено ранее: {n} раз",
        exitConfirm: "Вы уверены, что хотите завершить тест досрочно? Прогресс отвеченных вопросов сохранится.",
        timeUp: "Время вышло!",
        selectSubjectMsg: "Выберите предмет!",
        noQuestionsMsg: "В выбранном предмете нет доступных вопросов!",
        showAnswers: "Показать ответы",
        hideAnswers: "Скрыть ответы",

        // Авторизация и Профиль
        authTitle: "Вход в аккаунт",
        authSubtitle: "Логин: только латинские буквы (3–20 символов)",
        authLoginBtn: "Войти",
        authRegisterBtn: "Зарегистрироваться",
        authCancelBtn: "Отмена",
        authLogoutBtn: "Выйти из аккаунта",
        authCloseBtn: "Закрыть",
        authAdminKeyTitle: "🔑 Вход по ключу суперадминистратора:",
        authHeaderLogin: "Войти",
        authHeaderProfile: "Профиль",
        loginPlaceholder: "Логин (латиница)",
        passPlaceholder: "Пароль",

        // Вкладки Профиля
        profileTitle: "Профиль и Магазин",
        tabInfo: "Профиль",
        tabAvatars: "Аватары",
        tabLeague: "Лига",
        tabAdmin: "👑 Админ",
        userLabel: "Пользователь:",
        keyLabel: "Ключ профиля:",
        xpLabel: "Накопленный опыт:",
        roleLabel: "Роль:",
        roleAdmin: "Администратор",
        roleUser: "Участник",
        guestName: "Гость",
        notAuth: "Не авторизован",

        // Еженедельная Лига
        leagueTitle: "🏆 Еженедельная лига (Воскресенье 22:00 Europe/Rome)",
        leagueRewards: "🥇 1 место: 100 XP | 🥈 2 место: 60 XP | 🥉 3 место: 30 XP",
        leagueResetLabel: "Сброс через:",
        leagueLoading: "Загрузка данных Лиги...",
        leagueOffline: "Лига доступна только при подключении к серверу",
        leagueEmpty: "Пока нет участников в Лиге на этой неделе",
        leagueError: "Ошибка загрузки лидеров Лиги",
        leagueHeaderPlayer: "Игрок",

        // Панель Администратора
        adminUsersTitle: "Панель управления пользователями",
        adminSaveXP: "Сохранить XP",
        adminDeleteUser: "Удалить",
        adminDeleteConfirm: "Вы уверены, что хотите полностью удалить пользователя \"{u}\"?",
        adminNoRights: "Требуются права администратора",
        adminUserDeleted: "Пользователь удален.",
        adminXpUpdated: "XP пользователя успешно обновлен!",

        // Магазин Аваторов
        avatarFree: "Бесплатно",
        avatarSelect: "Установить",
        avatarSelected: "Выбрано",
        avatarSuccess: "Аватар успешно обновлен!",

        // Чат
        chatHeader: "Онлайн Чат",
        onlineChatBtn: "💬 Чат онлайн",
        chatPlaceholder: "Сообщение (до 150 симв.)...",
        chatMaxLenAlert: "Максимальная длина сообщения — 150 символов",
        chatDeleteConfirm: "Вы уверены, что хотите удалить это сообщение?",

        // Уровни оценки
        feedbackLevels: [
            "Иногда лучше сделать наугад — статистика была бы выше! 😉",
            "Нужно доработать темы, но главное — не сдаваться! 💪",
            "Разведка боем проведена! Теперь пора приступать к теории. 📚",
            "Фундамент заложен, осталось достроить знания! 🧱",
            "Почти у цели! Ещё немного практики, и порог будет пройден. 🎯",
            "Ровно половина! Стакан однозначно наполовину полнен. 🥤",
            "Твёрдый зачёт! Но ты явно способен на большее. 👍",
            "Отличный результат! Большинство тем под полным контролем. 🚀",
            "Уверенная победа! Ты прекрасно разбираешься в материале. 🔥",
            "Почти идеалити! Всего один шаг до абсолютного мастерства. ⭐",
            "Гениально! Абсолютные 100% — безупречный результат! 🎉"
        ]
    },
    it: {
        // Settings & General
        title: "Impostazioni Test",
        lang: "Lingua interfaccia:",
        subject: "Materia:",
        count: "Numero di domande:",
        timer: "Timer (in minuti, 0 = off):",
        back: "Consenti di tornare indietro",
        hints: "Mostra suggerimenti",
        start: "Inizia Test",
        reset: "Impostazioni avanzate",
        statsTitle: "Impostazioni avanzate",
        fontsizeLabel: "Dimensione testo interfaccia:",
        exportStats: "💾 Salva statistiche (.JSON)",
        importStats: "📥 Carica statistiche da file",
        resetStatsPage: "🗑️ Azzera cronologia sul server",
        backToMenu: "← Torna al menu principale",
        statsImportSuccess: "Statistiche importate con successo!",
        statsImportError: "Errore durante la lettura del file di statistiche (.JSON).",
        loading: "Caricamento",
        changelogTitle: "Cronologia aggiornamenti",
        changelogBack: "← Torna alle impostazioni",
        noSubjects: "-- Nessuna materia --",
        loadingSubjects: "Caricamento...",
        
        // Server Status
        serverOnline: "🟢 Server Online",
        serverOffline: "🔴 Modalità Offline",
        serverUrlLabel: "Indirizzo del server:",
        serverUrlSaved: "Indirizzo del server salvato: ",

        // Quiz
        qNum: "Domanda",
        yourAns: "(La tua risposta)",
        hintBtn: "💡 Mostra suggerimento",
        hideHintBtn: "🙈 Nascondi suggerimento",
        prev: "Indietro",
        next: "Avanti",
        exitBtn: "Interrompi",
        finish: "Concludi Test",
        confirmReset: "Sei sicuro di voler azzerare tutte le statistiche delle risposte?",
        statsResetSuccess: "Statistiche azzerate con successo.",
        secLang: "Lingua secondaria (sottotitoli):",
        secLangOff: "Disattivato",

        // Import Modal
        import_modal_title: "Importa salvataggio",
        import_modal_desc: "Esistono già dati salvati localmente. Scegli un'azione:",
        import_action_merge: "Unisci",
        import_action_overwrite: "Sovrascrivi",
        import_action_cancel: "Annulla",

        // Results
        resultsTitle: "Risultati del Test",
        reviewTitle: "Analisi dettagliata delle domande",
        correctCount: "Risposte esatte",
        skippedCount: "risposte saltate",
        wrongCount: "risposte sbagliate",
        strengths: "Punti di forza",
        improvements: "Aspetti da migliorare",
        restart: "Fai un altro quiz",
        greatProgress: "Ottimi progressi! Continua così.",
        answeredBefore: "Risposto in precedenza: {n} volte",
        exitConfirm: "Sei sicuro di voler interrompere il test? I progressi verranno salvati.",
        timeUp: "Tempo scaduto!",
        selectSubjectMsg: "Seleziona una materia!",
        noQuestionsMsg: "Nessuna domanda disponibile nella materia selezionata!",
        showAnswers: "Mostra risposte",
        hideAnswers: "Nascondi risposte",

        // Auth & Profile
        authTitle: "Accesso al Profilo",
        authSubtitle: "Username: solo lettere latine (3–20 caratteri)",
        authLoginBtn: "Accedi",
        authRegisterBtn: "Registrati",
        authCancelBtn: "Annulla",
        authLogoutBtn: "Esci dal profilo",
        authCloseBtn: "Chiudi",
        authAdminKeyTitle: "🔑 Accedi con chiave SuperAdmin:",
        authHeaderLogin: "Accedi",
        authHeaderProfile: "Profilo",
        loginPlaceholder: "Username (latino)",
        passPlaceholder: "Password",

        // Profile Tabs
        profileTitle: "Profilo e Negozio",
        tabInfo: "Profilo",
        tabAvatars: "Avatar",
        tabLeague: "Lega",
        tabAdmin: "👑 Admin",
        userLabel: "Utente:",
        keyLabel: "Chiave profilo:",
        xpLabel: "Punti XP totali:",
        roleLabel: "Ruolo:",
        roleAdmin: "Amministratore",
        roleUser: "Partecipante",
        guestName: "Ospite",
        notAuth: "Non autorizzato",

        // Weekly League
        leagueTitle: "🏆 Lega Settimanale (Domenica 22:00 Europe/Rome)",
        leagueRewards: "🥇 1° posto: 100 XP | 🥈 2° posto: 60 XP | 🥉 3° posto: 30 XP",
        leagueResetLabel: "Reset tra:",
        leagueLoading: "Caricamento classifica Lega...",
        leagueOffline: "La Lega è disponibile solo online",
        leagueEmpty: "Nessun partecipante nella Lega questa settimana",
        leagueError: "Errore nel caricamento della classifica",
        leagueHeaderPlayer: "Giocatore",

        // Admin Panel
        adminUsersTitle: "Pannello gestione utenti",
        adminSaveXP: "Salva XP",
        adminDeleteUser: "Elimina",
        adminDeleteConfirm: "Sei sicuro di voler eliminare definitivamente l'utente \"{u}\"?",
        adminNoRights: "Richiesti permessi da amministratore",
        adminUserDeleted: "Utente eliminato con successo.",
        adminXpUpdated: "XP dell'utente aggiornato con successo!",

        // Avatar Shop
        avatarFree: "Gratis",
        avatarSelect: "Seleziona",
        avatarSelected: "Selezionato",
        avatarSuccess: "Avatar aggiornato con successo!",

        // Chat
        chatHeader: "Chat Online",
        onlineChatBtn: "💬 Chat online",
        chatPlaceholder: "Messaggio (max 150 car.)...",
        chatMaxLenAlert: "Lunghezza massima del messaggio: 150 caratteri",
        chatDeleteConfirm: "Sei sicuro di voler eliminare questo messaggio?",

        // Levels
        feedbackLevels: [
            "A volte tirare a indovinare dà risultati migliori! 😉",
            "Bisogna ripassare gli argomenti, l'importante è non arrendersi! 💪",
            "Ricognizione fatta! Ora sotto con la teoria. 📚",
            "Le fondamenta ci sono, ora costruiamo la conoscenza! 🧱",
            "Quasi alla meta! Ancora un po' di pratica e ci sei. 🎯",
            "Esattamente a metà! Il bicchiere è decisamente mezzo pieno. 🥤",
            "Buon risultato! Ma puoi fare ancora di più. 👍",
            "Ottimo punteggio! La maggior parte degli argomenti è chiara. 🚀",
            "Vittoria schiacciante! Conosci la materia davvero bene. 🔥",
            "Quasi perfetto! Manca un solo passo al massimo dei voti. ⭐",
            "Geniale! 100% esatto — risultato impeccabile! 🎉"
        ]
    },
    en: {
        // Settings & General
        title: "Test Settings",
        lang: "Language:",
        subject: "Subject:",
        count: "Questions:",
        timer: "Timer (mins, 0 = off):",
        back: "Allow going back to previous question",
        hints: "Show hints",
        start: "Start Quiz",
        reset: "Advanced Settings",
        statsTitle: "Advanced Settings",
        fontsizeLabel: "Interface font size:",
        exportStats: "💾 Save Statistics (.JSON)",
        importStats: "📥 Load Statistics from File",
        resetStatsPage: "🗑️ Reset Server Statistics",
        backToMenu: "← Back to Main Menu",
        statsImportSuccess: "Statistics imported successfully!",
        statsImportError: "Error reading statistics file (.JSON).",
        loading: "Loading",
        changelogTitle: "Changelog & Updates",
        changelogBack: "← Back to settings",
        noSubjects: "-- No subjects --",
        loadingSubjects: "Loading...",

        // Server Status
        serverOnline: "🟢 Server Online",
        serverOffline: "🔴 Offline Mode",
        serverUrlLabel: "Sync server URL:",
        serverUrlSaved: "Server URL saved: ",

        // Quiz
        qNum: "Question",
        yourAns: "(Your answer)",
        hintBtn: "💡 Show hint",
        hideHintBtn: "🙈 Hide hint",
        prev: "Back",
        next: "Next",
        exitBtn: "Quit",
        finish: "Submit Quiz",
        confirmReset: "Are you sure you want to reset all answer statistics?",
        statsResetSuccess: "Statistics reset successfully.",
        secLang: "Secondary language (bilingual):",
        secLangOff: "Disabled",

        // Import Modal
        import_modal_title: "Import Save Data",
        import_modal_desc: "Local data already exists. Choose an action:",
        import_action_merge: "Merge",
        import_action_overwrite: "Overwrite",
        import_action_cancel: "Cancel",

        // Results
        resultsTitle: "Test Results",
        reviewTitle: "Detailed Question Review",
        correctCount: "Correct answers",
        skippedCount: "skipped answers",
        wrongCount: "wrong answers",
        strengths: "Strengths",
        improvements: "Areas for Improvement",
        restart: "Take another quiz",
        greatProgress: "Great progress! Keep it up.",
        answeredBefore: "Answered previously: {n} times",
        exitConfirm: "Are you sure you want to exit early? Your progress will be saved.",
        timeUp: "Time is up!",
        selectSubjectMsg: "Please select a subject!",
        noQuestionsMsg: "No questions available in the selected subject!",
        showAnswers: "Show answers",
        hideAnswers: "Hide answers",

        // Auth & Profile
        authTitle: "Account Login",
        authSubtitle: "Username: latin characters only (3–20 chars)",
        authLoginBtn: "Log In",
        authRegisterBtn: "Register",
        authCancelBtn: "Cancel",
        authLogoutBtn: "Log Out",
        authCloseBtn: "Close",
        authAdminKeyTitle: "🔑 Enter SuperAdmin Key:",
        authHeaderLogin: "Log In",
        authHeaderProfile: "Profile",
        loginPlaceholder: "Username (latin)",
        passPlaceholder: "Password",

        // Profile Tabs
        profileTitle: "Profile & Shop",
        tabInfo: "Profile",
        tabAvatars: "Avatars",
        tabLeague: "League",
        tabAdmin: "👑 Admin",
        userLabel: "User:",
        keyLabel: "Profile Key:",
        xpLabel: "Total XP:",
        roleLabel: "Role:",
        roleAdmin: "Administrator",
        roleUser: "Member",
        guestName: "Guest",
        notAuth: "Not authenticated",

        // Weekly League
        leagueTitle: "🏆 Weekly League (Sunday 22:00 Europe/Rome)",
        leagueRewards: "🥇 1st place: 100 XP | 🥈 2nd place: 60 XP | 🥉 3rd place: 30 XP",
        leagueResetLabel: "Reset in:",
        leagueLoading: "Loading League leaderboard...",
        leagueOffline: "League is available online only",
        leagueEmpty: "No participants in the League this week yet",
        leagueError: "Error loading League leaderboard",
        leagueHeaderPlayer: "Player",

        // Admin Panel
        adminUsersTitle: "User Management Panel",
        adminSaveXP: "Save XP",
        adminDeleteUser: "Delete",
        adminDeleteConfirm: "Are you sure you want to completely delete user \"{u}\"?",
        adminNoRights: "Administrator privileges required",
        adminUserDeleted: "User deleted successfully.",
        adminXpUpdated: "User XP updated successfully!",

        // Avatar Shop
        avatarFree: "Free",
        avatarSelect: "Equip",
        avatarSelected: "Equipped",
        avatarSuccess: "Avatar updated successfully!",

        // Chat
        chatHeader: "Online Chat",
        onlineChatBtn: "💬 Online Chat",
        chatPlaceholder: "Message (up to 150 chars)...",
        chatMaxLenAlert: "Maximum message length is 150 characters",
        chatDeleteConfirm: "Are you sure you want to delete this message?",

        // Levels
        feedbackLevels: [
            "Sometimes guessing yields better statistical odds! 😉",
            "Topics need work, but the main thing is not to give up! 💪",
            "Reconnaissance complete! Time to jump into the theory. 📚",
            "The foundation is set, now let's build the knowledge! 🧱",
            "Almost there! A bit more practice and you'll pass easily. 🎯",
            "Halfway point! The glass is definitely half full. 🥤",
            "Solid pass! But you're clearly capable of even more. 👍",
            "Great score! Most of the topics are well under control. 🚀",
            "Impressive victory! You really know your stuff inside out. 🔥",
            "Almost flawless! Just one tiny step from perfection. ⭐",
            "Brilliant! Pure 100% — absolutely perfect result! 🎉"
        ]
    }
};

let currentLang = detectSystemLanguage();

function setLanguage(lang) {
    currentLang = lang;
    const t = i18n[lang] || i18n['en'];
    
    // Прямой маппинг элементов по ID
    const elementsMap = {
        'ui-title': t.title,
        'ui-lang-label': t.lang,
        'ui-sec-lang-label': t.secLang,
        'ui-subject-label': t.subject,
        'ui-count-label': t.count,
        'ui-timer-label': t.timer,
        'ui-back-label': t.back,
        'ui-hints-label': t.hints,
        'ui-start-btn': t.start,
        'ui-reset-btn': t.reset,
        'ui-stats-title': t.statsTitle,
        'ui-fontsize-label': t.fontsizeLabel,
        'ui-export-stats-btn': t.exportStats,
        'ui-import-stats-btn': t.importStats,
        'ui-reset-stats-page-btn': t.resetStatsPage,
        'ui-back-to-menu-btn': t.backToMenu,
        'ui-q-num': t.qNum,
        'ui-restart-btn': t.restart,
        'ui-results-title': t.resultsTitle,
        'ui-review-title': t.reviewTitle,
        'ui-changelog-title': t.changelogTitle,
        'ui-changelog-back': t.changelogBack,
        'exit-btn': t.exitBtn,
        'tab-btn-info': t.tabInfo,
        'tab-btn-avatars': t.tabAvatars,
        'tab-btn-league': t.tabLeague,
        'tab-btn-admin': t.tabAdmin,
        'chat-drawer-title': t.chatHeader,
        'btn-top-chat': t.onlineChatBtn
    };

    for (let id in elementsMap) {
        const el = document.getElementById(id);
        if (el && elementsMap[id]) el.textContent = elementsMap[id];
    }

    // Автоматическое обновление всех элементов с data-i18n
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        if (t[key]) {
            el.textContent = t[key];
        }
    });

    // Автоматическое обновление плейсхолдеров с data-i18n-placeholder
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        if (t[key]) {
            el.setAttribute('placeholder', t[key]);
        }
    });

    if (typeof updateSecondaryLangDropdown === 'function') {
        updateSecondaryLangDropdown(lang);
    }

    if (typeof updateAuthUserHeaderUI === 'function') {
        updateAuthUserHeaderUI();
    }

    if (typeof updateServerStatusUI === 'function' && typeof isServerOnline !== 'undefined') {
        updateServerStatusUI(isServerOnline);
    }
}