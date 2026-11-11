/**
 * FoxyQuiz Main Application UI Module
 */
let currentSession = [];
let userAnswers = [];
let activeQIndex = 0;
let timerInterval = null;
let loadedSubjectsMap = {}; 

window.onload = function() {
    const initialLang = typeof detectSystemLanguage === 'function' ? detectSystemLanguage() : 'ru';
    
    // Синхронизируем название языка в кастомном селекторе
    const langLabels = {
        'ru': 'Русский (RU)',
        'it': 'Italiano (IT)',
        'en': 'English (EN)'
    };
    
    const labelText = langLabels[initialLang] || 'English (EN)';
    const selectedEl = document.getElementById('custom-lang-selected');
    if (selectedEl) selectedEl.textContent = labelText;

    // Загружаем контент под определяемый язык системных настроек
    if (typeof onLanguageChange === 'function') {
        onLanguageChange(initialLang);
    }
};

function aggregateSubjectsMap(rawMap) {
    const combinedMap = {};
    Object.keys(rawMap).forEach(fileKey => {
        // Извлекаем чистый ключ предмета (например, "physics" из "physics/physics_1.json")
        const basePrefix = (typeof getCleanSubjectKey === 'function') ? getCleanSubjectKey(fileKey) : fileKey.split('/')[0].split('.')[0]; 
        const canonicalKey = basePrefix + '.json';
        const fileData = rawMap[fileKey];

        if (!fileData || !fileData.questions) return;

        if (!combinedMap[canonicalKey]) {
            combinedMap[canonicalKey] = {
                subject: fileData.subject || (basePrefix.charAt(0).toUpperCase() + basePrefix.slice(1)),
                questions: []
            };
        }
        combinedMap[canonicalKey].questions = combinedMap[canonicalKey].questions.concat(fileData.questions);
    });
    return combinedMap;
}

// Переключение списка предметов
function toggleSubjectDropdown(e) {
    if (e) e.stopPropagation();
    const langDropdown = document.getElementById('custom-lang-dropdown');
    if (langDropdown) langDropdown.classList.remove('open'); // Закрываем язык, если открыт

    const dropdown = document.getElementById('custom-subject-dropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

// Переключение списка языков
function toggleLangDropdown(e) {
    if (e) e.stopPropagation();
    const subjDropdown = document.getElementById('custom-subject-dropdown');
    if (subjDropdown) subjDropdown.classList.remove('open'); // Закрываем предметы, если открыты

    const dropdown = document.getElementById('custom-lang-dropdown');
    if (dropdown) dropdown.classList.toggle('open');
}

// Выбор языка из кастомного списка
function selectLanguage(langCode, labelText, el) {
    const selectedEl = document.getElementById('custom-lang-selected');
    if (selectedEl) selectedEl.textContent = labelText;
    
    document.querySelectorAll('#custom-lang-options .custom-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    const dropdown = document.getElementById('custom-lang-dropdown');
    if (dropdown) dropdown.classList.remove('open');

    // Вызываем логику смены языка
    if (typeof onLanguageChange === 'function') {
        onLanguageChange(langCode);
    }
}

// Закрываем выпадающие списки при клике в любую точку экрана
document.addEventListener('click', () => {
    const subjDropdown = document.getElementById('custom-subject-dropdown');
    const langDropdown = document.getElementById('custom-lang-dropdown');
    const secLangDropdown = document.getElementById('custom-sec-lang-dropdown');
    if (subjDropdown) subjDropdown.classList.remove('open');
    if (langDropdown) langDropdown.classList.remove('open');
    if (secLangDropdown) secLangDropdown.classList.remove('open');
});

function startTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    let timeLeft = seconds;
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    const timerDisplay = document.getElementById('timer-display'); 
    
    // Вспомогательная функция для мгновенного форматирования времени
    const updateDisplay = () => {
        if (timerDisplay) {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    };

    // 1. Мгновенно обновляем интерфейс при старте
    updateDisplay();

    // 2. Запускаем интервал
    timerInterval = setInterval(() => {
        timeLeft--;
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            if (timerDisplay) timerDisplay.textContent = "0:00";
            alert(t.timeUp || "Время вышло!");
            finishQuiz();
            return;
        }
        updateDisplay();
    }, 1000);
}

async function startQuiz() {
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    const fileKey = document.getElementById('setting-subject').value;
    if (!fileKey) return alert(t.selectSubjectMsg || 'Выберите предмет!');

    // Запоминаем текущий предмет для поиска виджетов
    if (typeof currentSubjectKey !== 'undefined') {
        currentSubjectKey = fileKey;
    } else {
        window.currentSubjectKey = fileKey;
    }

    // Сбрасываем старый таймер, если он был запущен
    if (timerInterval) clearInterval(timerInterval);

    let requestedCount = parseInt(document.getElementById('setting-count').value, 10) || 10;
    requestedCount = Math.min(100, Math.max(1, requestedCount));
    
    const subjectData = loadedSubjectsMap[fileKey];
    
    if (!subjectData || !subjectData.questions || subjectData.questions.length === 0) {
        return alert(t.noQuestionsMsg || 'В выбранном предмете нет доступных вопросов!');
    }

    // --- ПОДГРУЗКА ВИДЖЕТОВ ПРЕДМЕТА (LAZY LOADING) ---
    if (typeof loadSubjectWidgets === 'function') {
        await loadSubjectWidgets(fileKey);
    }

    const rawSelected = (typeof selectAdaptiveQuestions === 'function') 
        ? selectAdaptiveQuestions(subjectData.questions, requestedCount)
        : subjectData.questions.slice(0, requestedCount);
        
    if (!rawSelected || rawSelected.length === 0) return alert(t.noQuestionsMsg || 'В выбранном предмете нет вопросов!');

    // --- ПОДГРУЗКА ВТОРОГО ЯЗЫКА (ЕСЛИ ВКЛЮЧЁН) ---
    const secLang = document.getElementById('setting-sec-lang') ? document.getElementById('setting-sec-lang').value : 'none';
    const secQuestionMap = {};

    if (secLang && secLang !== 'none' && secLang !== lang && typeof REGISTERED_JSON_FILES !== 'undefined') {
        const fetchPromises = REGISTERED_JSON_FILES.map(async (fileName) => {
            const filePath = `./data/${secLang}/${fileName}`;
            try {
                const response = await fetch(filePath);
                if (response.ok) {
                    const data = await response.json();
                    if (data && data.questions) {
                        data.questions.forEach(q => {
                            secQuestionMap[q.id] = q;
                        });
                    }
                }
            } catch (e) {}
        });
        await Promise.all(fetchPromises);
    }

    // Составляем сессию, тасуем и прикрепляем данные второго языка
    currentSession = rawSelected.map(q => {
        const shuffled = (typeof shuffleQuestionOptions === 'function') ? shuffleQuestionOptions(q) : JSON.parse(JSON.stringify(q));
        if (secLang && secLang !== 'none' && secLang !== lang && typeof attachSecondaryData === 'function') {
            attachSecondaryData(shuffled, secQuestionMap);
        }
        return shuffled;
    });

    userAnswers = new Array(currentSession.length).fill(null);
    activeQIndex = 0;

    // Скрываем подвал и версию приложения при старте теста
    const footer = document.querySelector('.app-footer');
    const versionBar = document.querySelector('.version-bar');
    if (footer) footer.classList.add('hidden');
    if (versionBar) versionBar.classList.add('hidden');

    // --- ОБРАБОТКА И ОГРАНИЧЕНИЕ ТАЙМЕРА ---
    const timerInput = document.getElementById('setting-timer');
    const timerDisplay = document.getElementById('timer-display');
    let timerMins = 0;

    if (timerInput) {
        let rawVal = parseInt(timerInput.value, 10);
        if (!isNaN(rawVal) && rawVal > 0) {
            timerMins = Math.min(180, rawVal);
        } else {
            timerMins = 0;
        }
        timerInput.value = timerMins;
    }

    if (timerMins > 0) {
        startTimer(timerMins * 60);
    } else {
        if (timerInterval) clearInterval(timerInterval);
        if (timerDisplay) timerDisplay.textContent = '--:--';
    }

    document.getElementById('setup-screen').classList.add('hidden');
    document.getElementById('quiz-screen').classList.remove('hidden');

    renderQuestion();
}

function renderQuestion() {
    const q = currentSession[activeQIndex];
    if (!q) return;

    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    const quizScreen = document.getElementById('quiz-screen');
    
    // Перезапуск анимации вылета (Right-to-Left Slide)
    quizScreen.classList.remove('slide-in');
    void quizScreen.offsetWidth; 
    quizScreen.classList.add('slide-in');

    const badge = document.getElementById('attempts-badge');

    // --- 1. СТАТИСТИКА ТЕКУЩЕЙ СЕССИИ (Сверху-справа: ✓ / ✕) ---
    let sessionCorrect = 0;
    let sessionIncorrect = 0;

    userAnswers.forEach((ans, idx) => {
        if (ans !== null && ans !== undefined && currentSession[idx]) {
            if (ans === currentSession[idx].ans) {
                sessionCorrect++;
            } else {
                sessionIncorrect++;
            }
        }
    });

    const correctEl = document.getElementById('q-stat-correct');
    const incorrectEl = document.getElementById('q-stat-incorrect');
    
    if (correctEl) correctEl.textContent = sessionCorrect;
    if (incorrectEl) incorrectEl.textContent = sessionIncorrect;

    // --- 2. ИСТОРИЯ КОНКРЕТНОГО ВОПРОСА (Слева: [Правильных] / [Всего]) ---
    if (badge) {
        const stats = typeof getStoredStats === 'function' ? getStoredStats() : {};
        const qStats = stats[q.id] || { attempts: 0, correct: 0 };
        
        const qAttempts = qStats.attempts || 0;
        const qCorrect = qStats.correct || 0;

        const attemptsTemplate = t.answeredBefore || "Отвечено ранее: {n} раз";
        
        // Зеленая цифра правильных ответов / всего попыток
        const formattedRatio = `<span style="color: var(--correct-text, #34d399); font-weight: bold;">${qCorrect}</span>/${qAttempts}`;

        let formattedText = attemptsTemplate
            .replace(' {n} раз', ` ${formattedRatio}`)
            .replace('{n} раз', formattedRatio)
            .replace('{n}', formattedRatio);

        badge.innerHTML = formattedText;
    }

    const userAns = userAnswers[activeQIndex];
    const isAnswered = userAns !== null;
    const correctAns = q.ans;

    document.getElementById('current-index').textContent = activeQIndex + 1;
    document.getElementById('total-count').textContent = currentSession.length;

    // Текст вопроса (основной + дублирующий)
    const qTextDiv = document.getElementById('question-text');
    let qHtml = q.q;
    if (q.secondary && q.secondary.q) {
        qHtml += `<div class="secondary-text">${q.secondary.q}</div>`;
    }
    qTextDiv.innerHTML = qHtml;

    // --- БЛОК ПОДСКАЗКИ С ДУБЛИРОВАНИЕМ ---
    const showHints = document.getElementById('setting-hints') 
        ? document.getElementById('setting-hints').checked 
        : true;

    const hintBox = document.getElementById('hint-container');
    hintBox.innerHTML = '';

    if (q.hint && showHints) {
        hintBox.classList.remove('hidden');

        const hintBtn = document.createElement('button');
        hintBtn.className = 'hint-btn';
        hintBtn.innerHTML = t.hintBtn || '💡 Показать подсказку';

        const hintTextDiv = document.createElement('div');
        hintTextDiv.className = 'hint-text-box hidden';
        
        let hintContent = q.hint;
        if (q.secondary && q.secondary.hint) {
            hintContent += `<div class="secondary-text">${q.secondary.hint}</div>`;
        }
        hintTextDiv.innerHTML = hintContent;

        hintBtn.onclick = () => {
            const isHidden = hintTextDiv.classList.toggle('hidden');
            hintBtn.innerHTML = isHidden ? (t.hintBtn || '💡 Показать подсказку') : (t.hideHintBtn || "🙈 Скрыть подсказку");
            if (!isHidden) renderRichContent(hintTextDiv);
        };

        hintBox.appendChild(hintBtn);
        hintBox.appendChild(hintTextDiv);
    } else {
        hintBox.classList.add('hidden');
    }

    // --- РЕНДЕР ВАРИАНТОВ ОТВЕТА ---
    const container = document.getElementById('options-container');
    container.innerHTML = '';

    const prefixes = ['A', 'B', 'C', 'D', 'E', 'F'];

    q.options.forEach((optText, idx) => {
        const card = document.createElement('div');
        let cardClass = 'option-card';

        if (isAnswered) {
            cardClass += ' disabled';
            if (idx === correctAns) cardClass += ' correct';
            else if (idx === userAns) cardClass += ' incorrect';
        }

        card.className = cardClass;

        let statusIconHtml = '';
        let userBadgeHtml = (isAnswered && idx === userAns) ? `<span class="user-badge">${t.yourAns || '(Ваш ответ)'}</span>` : '';

        if (isAnswered) {
            if (idx === correctAns) statusIconHtml = `<span class="icon-status correct">✓</span>`;
            else if (idx === userAns) statusIconHtml = `<span class="icon-status incorrect">✕</span>`;
        }

        let secOptHtml = '';
        if (q.secondary && q.secondary.options && q.secondary.options[idx]) {
            secOptHtml = `<div class="secondary-text option-sec-text">${q.secondary.options[idx]}</div>`;
        }

        card.innerHTML = `
            <div class="option-header">
                <div class="option-label">
                    <strong>${prefixes[idx] || (idx+1)}.</strong> 
                    <div>
                        <span>${optText}</span>
                        ${secOptHtml}
                    </div>
                    ${userBadgeHtml}
                </div>
                ${statusIconHtml}
            </div>
        `;

        // Пояснение к ответу
        if (isAnswered && (idx === correctAns || idx === userAns)) {
            const expText = (q.explanations && q.explanations[idx]) ? q.explanations[idx] : q.exp || "";
            const secExpText = (q.secondary && q.secondary.explanations && q.secondary.explanations[idx]) 
                ? q.secondary.explanations[idx] 
                : (q.secondary ? q.secondary.exp || "" : "");

            if (expText || secExpText) {
                const expDiv = document.createElement('div');
                expDiv.className = 'option-explanation';
                let expContent = expText;
                if (secExpText) {
                    expContent += `<div class="secondary-text">${secExpText}</div>`;
                }
                expDiv.innerHTML = expContent;
                card.appendChild(expDiv);
            }
        }

        if (!isAnswered) {
            card.onclick = () => handleAnswerSelect(card, container, idx, correctAns);
        }

        container.appendChild(card);
    });

    renderRichContent(qTextDiv);
    renderRichContent(container);

    // --- ВЫЗОВ РЕНДЕРА ВИДЖЕТА ---
    const targetSubjectKey = (typeof currentSubjectKey !== 'undefined') ? currentSubjectKey : '';
    const targetWidgetId = q.widget_id || q.widget || q.id;
    if (typeof renderWidget === 'function') {
        renderWidget(targetWidgetId, targetSubjectKey, 'widget-container');
    }

    const allowBack = document.getElementById('setting-back') ? document.getElementById('setting-back').checked : true;
    const prevBtn = document.getElementById('prev-btn');
    if (prevBtn) {
        prevBtn.style.display = (allowBack && activeQIndex > 0) ? 'block' : 'none';
        prevBtn.textContent = t.prev || 'Назад';
    }

    const nextBtn = document.getElementById('next-btn');
    if (nextBtn) {
        nextBtn.textContent = (activeQIndex === currentSession.length - 1) ? (t.finish || 'Завершить тест') : (t.next || 'Далее');
    }
}

function handleAnswerSelect(card, container, idx, correctAns) {
    userAnswers[activeQIndex] = idx;
    
    // 1. Блокируем клики по всем вариантам
    const allCards = container.querySelectorAll('.option-card');
    allCards.forEach(c => c.style.pointerEvents = 'none');

    // 2. Анимация реакции карточки
    if (idx === correctAns) {
        card.classList.add('anim-correct');
    } else {
        card.classList.add('anim-incorrect');
    }

    // 3. Переход без перезапуска слайда
    setTimeout(() => {
        renderQuestion();
    }, 300);
}

function navQuestion(dir) {
    activeQIndex += dir;
    if (activeQIndex >= currentSession.length) finishQuiz();
    else renderQuestion();
}

function finishQuiz() {
    // 1. Возвращаем видимость элементов интерфейса (футер и версия)
    const footer = document.querySelector('.app-footer');
    const versionBar = document.querySelector('.version-bar');
    if (footer) footer.classList.remove('hidden');
    if (versionBar) versionBar.classList.remove('hidden');

    // 2. Останавливаем таймер и получаем локализацию
    clearInterval(timerInterval);
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    
    // 3. Подсчет результатов и сохранение статистики
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const topicStats = {};
    const stats = typeof getStoredStats === 'function' ? getStoredStats() : {};

    currentSession.forEach((q, idx) => {
        const userAns = userAnswers[idx];
        const topic = q.topic || "Общие вопросы";

        if (!topicStats[topic]) topicStats[topic] = { total: 0, correct: 0 };
        topicStats[topic].total += 1;

        if (!stats[q.id]) stats[q.id] = { attempts: 0, correct: 0 };

        if (userAns !== null) stats[q.id].attempts += 1;

        if (userAns === null) {
            skippedCount++;
        } else if (userAns === q.ans) {
            correctCount++;
            topicStats[topic].correct += 1;
            stats[q.id].correct += 1;
        } else {
            wrongCount++;
        }
    });

    if (typeof saveStoredStats === 'function') {
        saveStoredStats(stats);
    }

    // --- НАЧИСЛЕНИЕ 1 XP ЗА КАЖДЫЙ ВЕРНЫЙ ОТВЕТ В СЕССИИ ---
    if (correctCount > 0 && typeof addXPToCurrentUser === 'function') {
        addXPToCurrentUser(correctCount);
    }

    // 4. Анализ сильных и слабых сторон по темам
    const strengths = [];
    const improvements = [];

    Object.keys(topicStats).forEach(top => {
        const stat = topicStats[top];
        const ratio = stat.correct / stat.total;
        if (ratio >= 0.7) strengths.push(top);
        else improvements.push(top);
    });

    strengths.sort((a, b) => a.localeCompare(b, lang));
    improvements.sort((a, b) => a.localeCompare(b, lang));

    // 5. Расчет процента и подбор динамического комментария
    const totalQuestions = currentSession.length;
    const scorePercent = totalQuestions > 0 ? Math.round((correctCount / totalQuestions) * 100) : 0;

    let levelIndex = Math.floor(scorePercent / 10);
    if (levelIndex > 10) levelIndex = 10;

    const levelsList = t.feedbackLevels || (i18n && i18n['en'] ? i18n['en'].feedbackLevels : []);
    const dynamicFeedback = levelsList[levelIndex] || t.greatProgress || "Тест завершен!";

    // 6. Расчет динамического цвета для цифры набранных баллов
    const hue = Math.round(scorePercent * 1.2); 
    const scoreColor = `hsl(${hue}, 85%, 45%)`;

    // 7. Переключение с экрана теста на экран результатов
    document.getElementById('quiz-screen').classList.add('hidden');
    
    const resultsScreen = document.getElementById('results-screen');
    resultsScreen.classList.remove('hidden');
    resultsScreen.classList.remove('slide-in');
    void resultsScreen.offsetWidth; // Триггер reflow
    resultsScreen.classList.add('slide-in');

    // 8. Отрисовка общей статистики
    document.getElementById('results-summary').innerHTML = `
        <div class="score-circle-container">
            <div class="score-text-main"><span style="color: ${scoreColor}; font-weight: bold;">${correctCount}</span>/${totalQuestions}</div>
            <div class="score-subtext">${t.correctCount || 'Правильных ответов'} (${scorePercent}%)</div>
            <div class="score-subtext">${skippedCount} ${t.skippedCount || 'пропущено'} • ${wrongCount} ${t.wrongCount || 'ошибок'}</div>
        </div>
        <div class="feedback-header">${dynamicFeedback}</div>
    `;

    // 9. Отрисовка блока с анализом тем
    const reviewContainer = document.getElementById('review-container');
    reviewContainer.innerHTML = `
        ${strengths.length > 0 ? `
            <div class="analysis-section strengths">
                <h3>${t.strengths || 'Сильные стороны'}</h3>
                <ul class="analysis-list">${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        ` : ''}

        ${improvements.length > 0 ? `
            <div class="analysis-section improvements">
                <h3>${t.improvements || 'Области для улучшения'}</h3>
                <ul class="analysis-list">${improvements.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        ` : ''}
    `;

    // 10. Сброс состояния кнопки и контейнера выдвижного разбора ответов
    const answersContainer = document.getElementById('full-answers-container');
    const toggleBtn = document.getElementById('toggle-answers-btn');
    if (answersContainer) answersContainer.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = t.showAnswers || "Показать ответы";

    if (typeof updateAuthUserHeaderUI === 'function') {
        updateAuthUserHeaderUI();
    }
    
    // 11. Генерация компактных карточек со всеми вопросами и ответами
    renderFullQuestionsReview();
}

function renderRichContent(container) {
    if (!container) return;
    if (window.renderMathInElement) {
        window.renderMathInElement(container, {
            delimiters: [{ left: '$$', right: '$$', display: true }, { left: '$', right: '$', display: false }],
            throwOnError: false
        });
    }
    if (window.Prism) window.Prism.highlightAllUnder(container);
}

function restartApp() {
    // 1. Возвращаем видимость футера и строки версии
    const footer = document.querySelector('.app-footer');
    const versionBar = document.querySelector('.version-bar');
    if (footer) footer.classList.remove('hidden');
    if (versionBar) versionBar.classList.remove('hidden');

    // 2. Останавливаем таймер и сбрасываем состояние текущего теста
    if (timerInterval) clearInterval(timerInterval);
    activeQIndex = 0;
    currentSession = [];
    userAnswers = [];

    // 3. Сбрасываем и очищаем выдвижной блок с ответами
    const answersContainer = document.getElementById('full-answers-container');
    const questionsList = document.getElementById('questions-review-list');
    if (answersContainer) answersContainer.classList.add('hidden');
    if (questionsList) questionsList.innerHTML = '';

    // 4. Скрываем рабочие экраны
    document.getElementById('quiz-screen').classList.add('hidden');
    document.getElementById('results-screen').classList.add('hidden');

    // 5. Показываем стартовый экран настройки с анимацией появления
    const setupScreen = document.getElementById('setup-screen');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.remove('slide-in');
    void setupScreen.offsetWidth; // Триггер reflow
    setupScreen.classList.add('slide-in');
}

function exitQuizEarly() {
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    if (confirm(t.exitConfirm || 'Вы уверены, что хотите завершить тест досрочно?')) finishQuiz();
}

function stepInput(inputId, step) {
    const input = document.getElementById(inputId);
    if (!input) return;
    let val = parseInt(input.value, 10) || 0;
    const min = input.min !== "" ? parseInt(input.min, 10) : -Infinity;
    const max = input.max !== "" ? parseInt(input.max, 10) : Infinity;

    val += step;
    if (val >= min && val <= max) {
        input.value = val;
    }
}

// Функция переключения видимости ответов
function toggleReviewAnswers() {
    const container = document.getElementById('full-answers-container');
    const btn = document.getElementById('toggle-answers-btn');
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});

    if (!container || !btn) return;

    const isHidden = container.classList.toggle('hidden');
    btn.textContent = isHidden ? (t.showAnswers || "Показать ответы") : (t.hideAnswers || "Скрыть ответы");

    if (!isHidden) {
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

function renderFullQuestionsReview() {
    const listDiv = document.getElementById('questions-review-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const t = (typeof i18n !== 'undefined' && i18n[lang]) ? i18n[lang] : (i18n ? i18n['en'] : {});
    const prefixes = ['A', 'B', 'C', 'D', 'E', 'F'];

    currentSession.forEach((q, qIdx) => {
        const userAns = userAnswers[qIdx];
        const correctAns = q.ans;
        const isAnswered = userAns !== null;

        const qCard = document.createElement('div');
        qCard.className = 'compact-q-card';

        let optionsHtml = '';
        q.options.forEach((optText, idx) => {
            let cardClass = 'option-card disabled';
            let statusIconHtml = '';
            let userBadgeHtml = '';

            if (idx === correctAns) {
                cardClass += ' correct';
                statusIconHtml = `<span class="icon-status correct">✓</span>`;
            } else if (idx === userAns) {
                cardClass += ' incorrect';
                statusIconHtml = `<span class="icon-status incorrect">✕</span>`;
            }

            if (isAnswered && idx === userAns) {
                userBadgeHtml = `<span class="user-badge">${t.yourAns || '(Ваш ответ)'}</span>`;
            }

            let secOptHtml = '';
            if (q.secondary && q.secondary.options && q.secondary.options[idx]) {
                secOptHtml = `<div class="secondary-text option-sec-text">${q.secondary.options[idx]}</div>`;
            }

            let expHtml = '';
            if (isAnswered && (idx === correctAns || idx === userAns)) {
                const expText = (q.explanations && q.explanations[idx]) ? q.explanations[idx] : q.exp || "";
                const secExpText = (q.secondary && q.secondary.explanations && q.secondary.explanations[idx]) 
                    ? q.secondary.explanations[idx] 
                    : (q.secondary ? q.secondary.exp || "" : "");

                if (expText || secExpText) {
                    let expContent = expText;
                    if (secExpText) {
                        expContent += `<div class="secondary-text">${secExpText}</div>`;
                    }
                    expHtml = `<div class="option-explanation">${expContent}</div>`;
                }
            }

            optionsHtml += `
                <div class="${cardClass}">
                    <div class="option-header">
                        <div class="option-label">
                            <strong>${prefixes[idx] || (idx+1)}.</strong> 
                            <div>
                                <span>${optText}</span>
                                ${secOptHtml}
                            </div>
                            ${userBadgeHtml}
                        </div>
                        ${statusIconHtml}
                    </div>
                    ${expHtml}
                </div>
            `;
        });

        let qTextHtml = q.q;
        if (q.secondary && q.secondary.q) {
            qTextHtml += `<div class="secondary-text">${q.secondary.q}</div>`;
        }

        qCard.innerHTML = `
            <div class="compact-q-header">
                <span class="compact-q-num">${t.qNum || "Вопрос"} ${qIdx + 1}</span>
            </div>
            <div class="rich-content compact-q-text">${qTextHtml}</div>
            
            <div id="review-widget-${qIdx}" class="question-widget-container"></div>

            <div class="options-list compact-options">${optionsHtml}</div>
        `;

        listDiv.appendChild(qCard);

        const targetSubjectKey = (typeof currentSubjectKey !== 'undefined') ? currentSubjectKey : '';
        if (typeof renderWidget === 'function') {
            renderWidget(q.widget_id || q.widget, targetSubjectKey, `review-widget-${qIdx}`);
        }
    });

    renderRichContent(listDiv);
}