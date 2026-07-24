let currentSession = [];
let userAnswers = [];
let activeQIndex = 0;
let timerInterval = null;
let loadedSubjectsMap = {}; 

const REGISTERED_JSON_FILES = [
    "physics.json",
    "physics_1.json",
    "physics_2.json",
    "physics_3.json",
    "physics_4.json"
];

window.onload = function() {
    onLanguageChange('ru');
};

function aggregateSubjectsMap(rawMap) {
    const combinedMap = {};
    Object.keys(rawMap).forEach(fileKey => {
        const cleanName = fileKey.replace(/\.(json|js)$/i, '');
        const basePrefix = cleanName.split(/[_.-]/)[0].toLowerCase(); 
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
    document.getElementById('custom-lang-selected').textContent = labelText;
    
    document.querySelectorAll('#custom-lang-options .custom-option').forEach(opt => {
        opt.classList.remove('selected');
    });
    if (el) el.classList.add('selected');

    const dropdown = document.getElementById('custom-lang-dropdown');
    if (dropdown) dropdown.classList.remove('open');

    // Вызываем оригинальную логику смены языка
    onLanguageChange(langCode);
}

// Закрываем оба выпадающих списка при клике в любую точку экрана
document.addEventListener('click', () => {
    const subjDropdown = document.getElementById('custom-subject-dropdown');
    const langDropdown = document.getElementById('custom-lang-dropdown');
    if (subjDropdown) subjDropdown.classList.remove('open');
    if (langDropdown) langDropdown.classList.remove('open');
});

// Обновленная функция загрузки предметов с заполнением кастомного списка
async function onLanguageChange(lang) {
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
        // Устанавливаем первый предмет по умолчанию
        const firstKey = availableKeys[0];
        hiddenInput.value = firstKey;
        selectedText.textContent = loadedSubjectsMap[firstKey].subject;

        // Генерация анимированных пунктов меню
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

                toggleSubjectDropdown(); // Плавное закрытие
            };

            optionsContainer.appendChild(item);
        });
    }
}

function startTimer(seconds) {
    if (timerInterval) clearInterval(timerInterval);
    let timeLeft = seconds;
    const t = i18n[currentLang] || i18n['en'];
    const timerDisplay = document.getElementById('timer-display'); 
    
    timerInterval = setInterval(() => {
        if (timeLeft <= 0) {
            clearInterval(timerInterval);
            alert(t.timeUp);
            finishQuiz();
            return;
        }
        timeLeft--;
        if (timerDisplay) {
            const mins = Math.floor(timeLeft / 60);
            const secs = timeLeft % 60;
            timerDisplay.textContent = `${mins}:${secs < 10 ? '0' : ''}${secs}`;
        }
    }, 1000);
}

function startQuiz() {
    const t = i18n[currentLang] || i18n['en'];
    const fileKey = document.getElementById('setting-subject').value;
    if (!fileKey) return alert(t.selectSubjectMsg);

    if (timerInterval) clearInterval(timerInterval);

    const requestedCount = parseInt(document.getElementById('setting-count').value, 10) || 10;
    const subjectData = loadedSubjectsMap[fileKey];
    
    if (!subjectData || !subjectData.questions || subjectData.questions.length === 0) {
        return alert(t.noQuestionsMsg);
    }

    const footer = document.querySelector('.app-footer');
    const versionBar = document.querySelector('.version-bar');
    if (footer) footer.classList.add('hidden');
    if (versionBar) versionBar.classList.add('hidden');

    const rawSelected = selectAdaptiveQuestions(subjectData.questions, requestedCount);
    if (!rawSelected || rawSelected.length === 0) return alert(t.noQuestionsMsg);

    currentSession = rawSelected.map(q => shuffleQuestionOptions(q));
    userAnswers = new Array(currentSession.length).fill(null);
    activeQIndex = 0;

    const timerMins = parseInt(document.getElementById('setting-timer').value, 10) || 0;
    if (timerMins > 0) startTimer(timerMins * 60);

    const quizScreen = document.getElementById('quiz-screen');
    document.getElementById('setup-screen').classList.add('hidden');
    quizScreen.classList.remove('hidden');

    renderQuestion();
}

function renderQuestion() {
    const q = currentSession[activeQIndex];
    if (!q) return;

    const t = i18n[currentLang] || i18n['en'];
    const quizScreen = document.getElementById('quiz-screen');
    
    // Перезапуск анимации вылета (Right-to-Left Slide)
    quizScreen.classList.remove('slide-in');
    void quizScreen.offsetWidth; 
    quizScreen.classList.add('slide-in');

    const attempts = getQuestionAttempts(q.id);
    const badge = document.getElementById('attempts-badge');
    if (badge) {
        const attemptsTemplate = t.answeredBefore || "Отвечено ранее: {n} раз";
        badge.textContent = attemptsTemplate.replace('{n}', attempts);
    }

    const userAns = userAnswers[activeQIndex];
    const isAnswered = userAns !== null;
    const correctAns = q.ans;

    document.getElementById('current-index').textContent = activeQIndex + 1;
    document.getElementById('total-count').textContent = currentSession.length;

    const qTextDiv = document.getElementById('question-text');
    qTextDiv.innerHTML = q.q;

    const hintBox = document.getElementById('hint-container');
    hintBox.innerHTML = '';

    if (q.hint) {
        hintBox.classList.remove('hidden');

        const hintBtn = document.createElement('button');
        hintBtn.className = 'hint-btn';
        hintBtn.innerHTML = t.hintBtn;

        const hintTextDiv = document.createElement('div');
        hintTextDiv.className = 'hint-text-box hidden';
        hintTextDiv.innerHTML = q.hint;

        hintBtn.onclick = () => {
            const isHidden = hintTextDiv.classList.toggle('hidden');
            hintBtn.innerHTML = isHidden ? t.hintBtn : (t.hideHintBtn || "🙈 Скрыть подсказку");
            if (!isHidden) renderRichContent(hintTextDiv);
        };

        hintBox.appendChild(hintBtn);
        hintBox.appendChild(hintTextDiv);
    } else {
        hintBox.classList.add('hidden');
    }

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
        let userBadgeHtml = (isAnswered && idx === userAns) ? `<span class="user-badge">${t.yourAns}</span>` : '';

        if (isAnswered) {
            if (idx === correctAns) statusIconHtml = `<span class="icon-status correct">✓</span>`;
            else if (idx === userAns) statusIconHtml = `<span class="icon-status incorrect">✕</span>`;
        }

        card.innerHTML = `
            <div class="option-header">
                <div class="option-label">
                    <strong>${prefixes[idx] || (idx+1)}.</strong> 
                    <span>${optText}</span>
                    ${userBadgeHtml}
                </div>
                ${statusIconHtml}
            </div>
        `;

        if (isAnswered && (idx === correctAns || idx === userAns)) {
            const expText = (q.explanations && q.explanations[idx]) ? q.explanations[idx] : q.exp || "";
            if (expText) {
                const expDiv = document.createElement('div');
                expDiv.className = 'option-explanation';
                expDiv.innerHTML = expText;
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

    const allowBack = document.getElementById('setting-back').checked;
    const prevBtn = document.getElementById('prev-btn');
    prevBtn.style.display = (allowBack && activeQIndex > 0) ? 'block' : 'none';
    prevBtn.textContent = t.prev;

    document.getElementById('next-btn').textContent = (activeQIndex === currentSession.length - 1) ? t.finish : t.next;
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
        renderQuestion(false);
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
    const t = i18n[currentLang] || i18n['en'];
    
    // 3. Подсчет результатов и сохранение статистики
    let correctCount = 0;
    let wrongCount = 0;
    let skippedCount = 0;

    const topicStats = {};
    const stats = getStoredStats();

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

    saveStoredStats(stats);

    // 4. Анализ сильных и слабых сторон по темам
    const strengths = [];
    const improvements = [];

    Object.keys(topicStats).forEach(top => {
        const stat = topicStats[top];
        const ratio = stat.correct / stat.total;
        if (ratio >= 0.7) strengths.push(top);
        else improvements.push(top);
    });

    // 5. Переключение с экрана теста на экран результатов
    document.getElementById('quiz-screen').classList.add('hidden');
    
    const resultsScreen = document.getElementById('results-screen');
    resultsScreen.classList.remove('hidden');
    resultsScreen.classList.remove('slide-in');
    void resultsScreen.offsetWidth; // Триггер reflow для перезапуска анимации
    resultsScreen.classList.add('slide-in');

    // 6. Отрисовка общей статистики (счетчик и прогресс)
    document.getElementById('results-summary').innerHTML = `
        <div class="score-circle-container">
            <div class="score-text-main">${correctCount}/${currentSession.length}</div>
            <div class="score-subtext">${t.correctCount}</div>
            <div class="score-subtext">${skippedCount} ${t.skippedCount} • ${wrongCount} ${t.wrongCount}</div>
        </div>
        <div class="feedback-header">${t.greatProgress}</div>
    `;

    // 7. Отрисовка блока с анализом тем
    const reviewContainer = document.getElementById('review-container');
    reviewContainer.innerHTML = `
        ${strengths.length > 0 ? `
            <div class="analysis-section strengths">
                <h3>${t.strengths}</h3>
                <ul class="analysis-list">${strengths.map(s => `<li>${s}</li>`).join('')}</ul>
            </div>
        ` : ''}

        ${improvements.length > 0 ? `
            <div class="analysis-section improvements">
                <h3>${t.improvements}</h3>
                <ul class="analysis-list">${improvements.map(i => `<li>${i}</li>`).join('')}</ul>
            </div>
        ` : ''}
    `;

    // 8. Сброс состояния кнопки и контейнера выдвижного разбора ответов
    const answersContainer = document.getElementById('full-answers-container');
    const toggleBtn = document.getElementById('toggle-answers-btn');
    if (answersContainer) answersContainer.classList.add('hidden');
    if (toggleBtn) toggleBtn.textContent = t.showAnswers || "Показать ответы";

    // 9. Генерация компактных карточек со всеми вопросами и ответами
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
    void setupScreen.offsetWidth; // Триггер reflow для перезапуска анимации
    setupScreen.classList.add('slide-in');
}

function exitQuizEarly() {
    const t = i18n[currentLang] || i18n['en'];
    if (confirm(t.exitConfirm)) finishQuiz();
}

function stepInput(inputId, step) {
    const input = document.getElementById(inputId);
    let val = parseInt(input.value, 10) || 0;
    const min = parseInt(input.min, 10) ?? -Infinity;
    const max = parseInt(input.max, 10) ?? Infinity;

    val += step;
    if (val >= min && val <= max) {
        input.value = val;
    }
}

// Функция переключения видимости ответов
function toggleReviewAnswers() {
    const container = document.getElementById('full-answers-container');
    const btn = document.getElementById('toggle-answers-btn');
    const t = i18n[currentLang] || i18n['en'];

    if (!container || !btn) return;

    const isHidden = container.classList.toggle('hidden');
    btn.textContent = isHidden ? (t.showAnswers || "Показать ответы") : (t.hideAnswers || "Скрыть ответы");

    if (!isHidden) {
        // Мягкий скролл к блоку ответов при открытии
        container.scrollIntoView({ behavior: 'smooth', block: 'start' });
    }
}

// Отрисовка всех вопросов в стиле теста (но без подсказки и в компактном формате)
function renderFullQuestionsReview() {
    const listDiv = document.getElementById('questions-review-list');
    if (!listDiv) return;
    listDiv.innerHTML = '';

    const t = i18n[currentLang] || i18n['en'];
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
                userBadgeHtml = `<span class="user-badge">${t.yourAns}</span>`;
            }

            let expHtml = '';
            if (isAnswered && (idx === correctAns || idx === userAns)) {
                const expText = (q.explanations && q.explanations[idx]) ? q.explanations[idx] : q.exp || "";
                if (expText) {
                    expHtml = `<div class="option-explanation">${expText}</div>`;
                }
            }

            optionsHtml += `
                <div class="${cardClass}">
                    <div class="option-header">
                        <div class="option-label">
                            <strong>${prefixes[idx] || (idx+1)}.</strong> 
                            <span>${optText}</span>
                            ${userBadgeHtml}
                        </div>
                        ${statusIconHtml}
                    </div>
                    ${expHtml}
                </div>
            `;
        });

        qCard.innerHTML = `
            <div class="compact-q-header">
                <span class="compact-q-num">${t.qNum || "Вопрос"} ${qIdx + 1}</span>
            </div>
            <div class="rich-content compact-q-text">${q.q}</div>
            <div class="options-list compact-options">${optionsHtml}</div>
        `;

        listDiv.appendChild(qCard);
    });

    // Рендерим формулы и код, если они есть в вопросах
    renderRichContent(listDiv);
}