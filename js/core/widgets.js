let widgetCache = {};
let currentChartInstance = null;

/**
 * Вспомогательная функция для безопасной загрузки JSON
 */
async function fetchWidgetFile(path) {
    try {
        const response = await fetch(path);
        if (response.ok) {
            return await response.json();
        }
    } catch (e) {
        console.warn(`Не удалось загрузить файл виджетов: ${path}`, e);
    }
    return null;
}

/**
 * Стандартизация ключа предмета.
 * - "ru/physics/physics_1.json" -> "physics"
 * - "data/ru/c_lang/c_lang_2.json" -> "c_lang"
 * - "c_lang_1.json" -> "c_lang"
 */
function getCleanSubjectKey(key) {
    if (!key) return '';

    // Нормализуем слэши для всех ОС
    const normalized = key.replace(/\\/g, '/');
    const parts = normalized.split('/').filter(Boolean);

    // Папки, которые нужно пропустить при поиске предмета в пути
    const systemFolders = new Set(['data', 'ru', 'en', 'it', 'de', 'fr', 'widgets']);

    // 1. Ищем папку предмета в пути
    for (let i = parts.length - 2; i >= 0; i--) {
        const folder = parts[i].toLowerCase();
        if (!systemFolders.has(folder)) {
            return folder;
        }
    }

    // 2. Если путей нет — очищаем имя файла
    let fileName = parts[parts.length - 1].toLowerCase();
    fileName = fileName.replace(/\.(json|js)$/i, '');
    fileName = fileName.replace(/^widgets_/, '');

    return fileName.replace(/[-_.]\d+$/, '');
}

/**
 * Подгрузка виджетов для выбранного предмета из зарегистрированного массива REGISTERED_WIDGET_FILES
 */
async function loadSubjectWidgets(fileKey) {
    if (!fileKey) return;
    
    const cleanName = getCleanSubjectKey(fileKey);
    if (!cleanName) return;

    if (!widgetCache[cleanName]) {
        widgetCache[cleanName] = {};
    }

    // Получаем имя конкретного JSON-файла без расширения (например, "c_2" или "c_lang_2")
    const normalized = fileKey.replace(/\\/g, '/');
    const rawFileName = normalized.split('/').pop().replace(/\.(json|js)$/i, '');

    // Если список файлов в конфиге объявлен — используем его
    const registeredList = (typeof REGISTERED_WIDGET_FILES !== 'undefined' && Array.isArray(REGISTERED_WIDGET_FILES))
        ? REGISTERED_WIDGET_FILES
        : [];

    // Находим все файлы виджетов, относящиеся к текущему предмету (например: widgets_c_lang.json, widgets_c_lang_2.json)
    const targetWidgetFiles = registeredList.filter(wFile => {
        const cleanWName = wFile.replace(/\.(json|js)$/i, '').toLowerCase();
        return cleanWName === `widgets_${cleanName}` || 
               cleanWName.startsWith(`widgets_${cleanName}_`) ||
               cleanWName === `widgets_${rawFileName}`;
    });

    // Загружаем каждый найденный файл виджетов
    for (const wFile of targetWidgetFiles) {
        const basePath = `./data/widgets/${wFile}`;
        const data = await fetchWidgetFile(basePath);
        if (data) {
            Object.assign(widgetCache[cleanName], data);
        }
    }
}

/**
 * Отрисовка виджета под вопросом
 */
function renderWidget(widgetId, subjectKey = '', containerId = 'widget-container') {
    const container = document.getElementById(containerId);
    if (!container) return;

    // Уничтожаем старый график, если он был
    if (currentChartInstance) {
        currentChartInstance.destroy();
        currentChartInstance = null;
    }

    const targetKey = subjectKey || window.currentSubjectKey || '';
    const cleanName = getCleanSubjectKey(targetKey);
    const subjectWidgets = widgetCache[cleanName] || {};
    const widget = widgetId ? subjectWidgets[widgetId] : null;

    if (!widgetId || !widget) {
        container.style.display = 'none';
        container.innerHTML = '';
        return;
    }

    container.style.display = 'flex';

    if (widget.type === 'svg') {
        container.innerHTML = widget.svgContent || '';
    } else if (widget.type === 'html') {
        container.innerHTML = widget.htmlContent || '';
        
        // Подсветка кода (Prism.js)
        if (typeof Prism !== 'undefined') {
            Prism.highlightAllUnder(container);
        }
    } else if (widget.type === 'chart' && typeof Chart !== 'undefined') {
        container.innerHTML = `<canvas id="${containerId}-canvas"></canvas>`;
        const ctx = document.getElementById(`${containerId}-canvas`).getContext('2d');
        currentChartInstance = new Chart(ctx, widget.chartConfig);
    } else {
        container.style.display = 'none';
        container.innerHTML = '';
    }
}