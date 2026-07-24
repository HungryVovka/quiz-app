const STORAGE_KEY = 'quiz_user_stats';

// Получение всей статистики из localStorage
function getStoredStats() {
    const raw = localStorage.getItem(STORAGE_KEY);
    return raw ? JSON.parse(raw) : {};
}

// Сохранение обновленной статистики
function saveStoredStats(stats) {
    localStorage.setItem(STORAGE_KEY, JSON.stringify(stats));
}

// Получение количества попыток для конкретного вопроса
function getQuestionAttempts(qId) {
    const stats = getStoredStats();
    return stats[qId] ? stats[qId].attempts : 0;
}

// Простая зашифровка индекса ответа (Base64 + сдвиг)
function encodeAns(index) {
    return btoa((index + 7).toString());
}

// Расшифровка индекса ответа
function decodeAns(encodedStr) {
    if (typeof encodedStr === 'number') return encodedStr;
    try {
        return parseInt(atob(encodedStr), 10) - 7;
    } catch(e) {
        return 0;
    }
}

function resetStats() {
    if (confirm("Вы уверены, что хотите сбросить всю статистику ответов?")) {
        localStorage.removeItem(STORAGE_KEY);
        alert("Статистика успешно сброшена.");
    }
}