/**
 * Адаптивный отбор вопросов на основе истории ошибок (Weighted Random Selection)
 * @param {Array} pool - Массив всех вопросов выбранного предмета
 * @param {number} requestedCount - Запрашиваемое количество вопросов в тесте
 * @returns {Array} Отфильтрованный и перемешанный массив вопросов
 */
function selectAdaptiveQuestions(pool, requestedCount) {
    if (!pool || pool.length === 0) return [];

    // Безопасное получение статистики из локального хранилища
    const stats = (typeof getStoredStats === 'function') ? getStoredStats() : {};

    // 1. Рассчитываем вес каждого вопроса в зависимости от истории ответов
    const weightedPool = pool.map(q => {
        const qStat = stats[q.id] || { attempts: 0, correct: 0 };
        const attempts = Number(qStat.attempts) || 0;
        const correct = Number(qStat.correct) || 0;

        let weight = 1.0;

        if (attempts === 0) {
            // Новый вопрос — повышенный приоритет для быстрого прохождения базы
            weight = 2.5; 
        } else {
            // Защита от аномалий: гарантируем, что доля ошибок строго от 0.0 до 1.0
            const rawErrorRate = 1 - (correct / attempts);
            const errorRate = Math.max(0, Math.min(1, rawErrorRate));
            
            // Чем больше ошибок, тем выше вес (от 1.0 для 0% ошибок до 4.5 для 100% ошибок)
            weight = 1.0 + (errorRate * 3.5); 
        }

        return { question: q, weight };
    });

    const selected = [];
    const copyPool = [...weightedPool];
    const countToPick = Math.min(requestedCount, copyPool.length);

    // 2. Взвешенная случайная выборка ("Рулетка") без повторений
    for (let i = 0; i < countToPick; i++) {
        const totalWeight = copyPool.reduce((sum, item) => sum + item.weight, 0);

        // Крайний случай: если суммарный вес равен 0, забираем первый попавшийся
        if (totalWeight <= 0) {
            selected.push(copyPool.shift().question);
            continue;
        }

        let random = Math.random() * totalWeight;

        for (let j = 0; j < copyPool.length; j++) {
            random -= copyPool[j].weight;
            if (random <= 0) {
                selected.push(copyPool[j].question);
                copyPool.splice(j, 1); // Извлекаем элемент, чтобы избежать дублей
                break;
            }
        }
    }

    return selected;
}