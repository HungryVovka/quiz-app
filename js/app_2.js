function shuffleQuestionOptions(originalQ) {
    if (!originalQ || !Array.isArray(originalQ.options)) return originalQ;

    // Глубокая копия вопроса
    const q = JSON.parse(JSON.stringify(originalQ));
    
    // Поддержка расшифровки ответа (из storage_2.js)
    const realCorrectAns = (typeof decodeAns === 'function') ? decodeAns(q.ans) : q.ans;

    // Связываем тексты, пояснения и флаг правильного ответа
    const combined = q.options.map((optText, idx) => ({
        text: optText,
        explanation: (q.explanations && q.explanations[idx]) ? q.explanations[idx] : null,
        isCorrect: idx === realCorrectAns
    }));

    // Тасование Фишера — Йетса
    for (let i = combined.length - 1; i > 0; i--) {
        const j = Math.floor(Math.random() * (i + 1));
        [combined[i], combined[j]] = [combined[j], combined[i]];
    }

    // Собираем обратно
    q.options = combined.map(item => item.text);
    if (q.explanations) {
        q.explanations = combined.map(item => item.explanation);
    }
    
    // Записываем новый пересчитанный индекс правильного ответа
    const newAnsIndex = combined.findIndex(item => item.isCorrect);
    q.ans = newAnsIndex !== -1 ? newAnsIndex : 0;

    return q;
}

// Открытие экрана чейнджлога
function openChangelog() {
    const setupScreen = document.getElementById('setup-screen');
    const changelogScreen = document.getElementById('changelog-screen');
    const container = document.getElementById('changelog-container');

    // Получаем текущий язык (по умолчанию ru)
    const lang = typeof currentLang !== 'undefined' ? currentLang : 'ru';
    const logs = CHANGELOG_DATA[lang] || CHANGELOG_DATA['en'];

    // Заполняем контентом
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

    // Плавный сдвиг экрана
    setupScreen.classList.add('hidden');
    changelogScreen.classList.remove('hidden');
    changelogScreen.classList.remove('slide-in');
    void changelogScreen.offsetWidth; // Перезапуск CSS-анимации
    changelogScreen.classList.add('slide-in');
}

// Возврат к настройкам
function closeChangelog() {
    const setupScreen = document.getElementById('setup-screen');
    const changelogScreen = document.getElementById('changelog-screen');

    changelogScreen.classList.add('hidden');
    setupScreen.classList.remove('hidden');
    setupScreen.classList.remove('slide-in');
    void setupScreen.offsetWidth;
    setupScreen.classList.add('slide-in');
}

// Автоматически обновляет текст на кнопке под футером актуальной версией
function updateVersionBadge() {
    const badge = document.querySelector('.version-tag');
    if (badge && CHANGELOG_DATA && CHANGELOG_DATA.ru[0]) {
        badge.textContent = CHANGELOG_DATA.ru[0].version; // Берёт самую первую (верхнюю) версию
    }
}

// Вызовите её при загрузке страницы:
window.addEventListener('DOMContentLoaded', updateVersionBadge);