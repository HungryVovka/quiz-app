/**
 * Адаптивный отбор вопросов на основе истории ошибок (Weighted Random Selection)
 */
function selectAdaptiveQuestions(pool, requestedCount) {
    if (!pool || pool.length === 0) return [];

    const stats = getStoredStats();

    // Рассчитываем вес каждого вопроса
    const weightedPool = pool.map(q => {
        const qStat = stats[q.id] || { attempts: 0, correct: 0 };
        let weight = 1.0;

        if (qStat.attempts === 0) {
            weight = 2.5; // Высокий приоритет для новых вопросов
        } else {
            const errorRate = 1 - (qStat.correct / qStat.attempts);
            // Чем больше ошибок, тем выше шанс выпадения вопроса
            weight = 1.0 + (errorRate * 3.5); 
        }

        return { question: q, weight };
    });

    const selected = [];
    const copyPool = [...weightedPool];
    const countToPick = Math.min(requestedCount, copyPool.length);

    for (let i = 0; i < countToPick; i++) {
        const totalWeight = copyPool.reduce((sum, item) => sum + item.weight, 0);
        let random = Math.random() * totalWeight;

        for (let j = 0; j < copyPool.length; j++) {
            random -= copyPool[j].weight;
            if (random <= 0) {
                selected.push(copyPool[j].question);
                copyPool.splice(j, 1);
                break;
            }
        }
    }

    return selected;
}