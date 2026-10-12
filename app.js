// ============================================================
//  MCscanner — by Real_Studio
//  Сканирование Minecraft-серверов через бесплатные API
//  Периодичность: еженедельно, по выходным (сб–вс)
// ============================================================

const APP_NAME = 'MCscanner';
const APP_AUTHOR = 'Real_Studio';
const SERVERS_JSON_PATH = './servers.json';

// Ключ в localStorage для отслеживания последнего сканирования
const LAST_SCAN_KEY = 'mcscanner_last_scan';
// Раз в 7 дней — пересканируем автоматически
const RESCAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// Задержка между запросами к API (в миллисекундах)
// Увеличена до 2000 мс, чтобы избежать ошибки 429
const API_DELAY_MS = 2000;

// Бесплатные API без ключей
const API_ENDPOINTS = [
    {
        name: 'mcsrvstat.us',
        url: (host, port) =>
            `https://api.mcsrvstat.us/3/${host}${port && port !== 25565 ? ':' + port : ''}`,
        headers: {
            // mcsrvstat.us требует непустой User-Agent, иначе 403
            'User-Agent': `${APP_NAME}/1.0 (by ${APP_AUTHOR})`
        },
        parse: (data) => {
            if (!data || data.online === false || data.online === undefined) {
                return { online: false };
            }
            return {
                online: true,
                players: data.players ? (data.players.online ?? 0) : 0,
                maxPlayers: data.players ? (data.players.max ?? 0) : 0,
                version: data.version || '—',
                motd: data.motd && data.motd.clean ? data.motd.clean.join(' ') : ''
            };
        }
    },
    {
        name: 'mcstatus.io',
        url: (host, port) =>
            `https://api.mcstatus.io/v2/status/java/${host}${port ? ':' + port : ''}`,
        headers: {},
        parse: (data) => {
            if (!data || data.online === false) return { online: false };
            return {
                online: true,
                players: data.players ? (data.players.online ?? 0) : 0,
                maxPlayers: data.players ? (data.players.max ?? 0) : 0,
                version: data.version ? (data.version.name_raw || data.version.name_clean || '—') : '—',
                motd: data.motd ? (data.motd.clean || '') : ''
            };
        }
    },
    {
        name: 'mcapi.us',
        // Документация: https://mcapi.us/server/status?ip=...&port=...
        // CORS включён, JSONP не поддерживается
        url: (host, port) =>
            `https://mcapi.us/server/status?ip=${encodeURIComponent(host)}${port && port !== 25565 ? '&port=' + port : ''}`,
        headers: {
            'Accept': 'application/json'
        },
        parse: (data) => {
            // mcapi.us возвращает status: "success" при успехе
            if (!data || data.status !== 'success' || data.online === false) {
                return { online: false };
            }
            return {
                online: true,
                players: data.players ? (data.players.now ?? 0) : 0,
                maxPlayers: data.players ? (data.players.max ?? 0) : 0,
                version: data.server ? (data.server.name || '—') : '—',
                motd: data.motd || ''
            };
        }
    }
];

// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let allServers = [];
let serverStatuses = {};
let isRefreshing = false;

// ============================================================
//  УТИЛИТЫ
// ============================================================
const serverKey = (srv) => `${srv.address}:${srv.port}`;

function escapeHtml(str) {
    const div = document.createElement('div');
    div.textContent = str == null ? '' : String(str);
    return div.innerHTML;
}

function stripMinecraftColors(str) {
    if (!str) return '';
    return str.replace(/§[0-9a-fk-orx]/gi, '').trim();
}

function isWeekend() {
    const day = new Date().getDay();
    return day === 0 || day === 6;
}

function shouldAutoScan() {
    const last = Number(localStorage.getItem(LAST_SCAN_KEY) || 0);
    const now = Date.now();
    const weekPassed = (now - last) >= RESCAN_INTERVAL_MS;

    if (weekPassed) return true;

    if (isWeekend()) {
        const lastDate = new Date(last).toDateString();
        const today = new Date().toDateString();
        if (lastDate !== today) return true;
    }
    return false;
}

function markScanned() {
    localStorage.setItem(LAST_SCAN_KEY, String(Date.now()));
}

/**
 * Запрашивает статус сервера последовательно через несколько API.
 * Возвращает объект { online, players, maxPlayers, version, motd, source }
 */
async function fetchServerStatus(address, port) {
    const errors = [];

    for (const api of API_ENDPOINTS) {
        try {
            const url = api.url(address, port);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json', ...api.headers },
                signal: AbortSignal.timeout(10000)
            });

            if (!response.ok) {
                // Если получили 429, ждём и пробуем следующий API
                if (response.status === 429) {
                    console.warn(`[${APP_NAME}] ${api.name} вернул 429. Ждём 3 секунды...`);
                    await new Promise(r => setTimeout(r, 3000));
                }
                errors.push(`${api.name}: HTTP ${response.status}`);
                continue;
            }

            const data = await response.json();
            const parsed = api.parse(data);

            if (parsed.online === false) {
                return { online: false, source: api.name };
            }
            return { ...parsed, source: api.name };

        } catch (err) {
            errors.push(`${api.name}: ${err.message}`);
        }
    }

    console.warn(`[${APP_NAME}] Не удалось проверить ${address}:${port}`, errors);
    return { online: false, error: errors.join('; ') };
}

// ============================================================
//  ПРОГРЕСС
// ============================================================
function updateProgress(current, total) {
    const container = document.getElementById('progressContainer');
    const fill = document.getElementById('progressBarFill');
    const text = document.getElementById('progressText');

    if (!container || !fill || !text) return;

    if (current === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const percent = Math.round((current / total) * 100);
    fill.style.width = percent + '%';
    text.textContent = `${current} / ${total}`;
}

// ============================================================
//  ЗАГРУЗКА JSON
// ============================================================
async function loadServersFromJson() {
    try {
        const response = await fetch(SERVERS_JSON_PATH, { cache: 'no-cache' });

        if (!response.ok) {
            throw new Error(`HTTP ${response.status} — не удалось загрузить ${SERVERS_JSON_PATH}`);
        }

        const data = await response.json();

        if (!Array.isArray(data)) {
            throw new Error('JSON должен содержать массив серверов');
        }

        allServers = data;
        serverStatuses = {};

        allServers.forEach(srv => {
            serverStatuses[serverKey(srv)] = {
                status: 'checking',
                data: null
            };
        });

        hideError();
        renderServers();
        updateStats();

        // Запускаем сканирование
        checkAllServers();

    } catch (err) {
        console.error(`[${APP_NAME}]`, err);
        showError(
            `Ошибка загрузки servers.json: ${err.message}. ` +
            `Убедитесь, что файл лежит рядом с index.html и сайт открыт через http(s), ` +
            `а не через file://.`
        );

        document.getElementById('serverGrid').innerHTML = `
            <div class="empty-state">
                ❌ Не удалось загрузить список серверов.<br><br>
                Проверьте, что файл <code>servers.json</code> находится в той же папке, что и <code>index.html</code>.<br>
                И что страница открыта по адресу <code>http://</code> или <code>https://</code>, а не <code>file://</code>.<br><br>
                <small style="color:#555">${escapeHtml(err.message)}</small>
            </div>`;
    }
}

// ============================================================
//  ПРОВЕРКА СЕРВЕРОВ
// ============================================================
async function checkAllServers() {
    if (isRefreshing) return;
    isRefreshing = true;

    const total = allServers.length;
    let current = 0;

    updateProgress(0, total);

    for (const srv of allServers) {
        await checkSingleServer(srv);
        current++;
        updateProgress(current, total);
        // Задержка между запросами, чтобы не получить 429
        await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
    }

    isRefreshing = false;
    markScanned();
    updateLastUpdate();
    updateProgress(0, total); // Скрываем прогресс
}

async function checkSingleServer(srv) {
    const key = serverKey(srv);
    serverStatuses[key] = { status: 'checking', data: null };
    updateCard(key);

    const result = await fetchServerStatus(srv.address, srv.port);

    serverStatuses[key] = {
        status: result.online ? 'online' : 'offline',
        data: result
    };

    updateCard(key);
    updateStats();
}

async function refreshAll() {
    if (isRefreshing) return;

    const btn = document.getElementById('refreshBtn');
    btn.disabled = true;
    btn.textContent = '⏳ Сканирование...';

    allServers.forEach(srv => {
        serverStatuses[serverKey(srv)] = { status: 'checking', data: null };
    });
    renderServers();
    updateStats();

    await checkAllServers();

    btn.disabled = false;
    btn.textContent = '🔄 Обновить всё';
}

// ============================================================
//  ФИЛЬТРАЦИЯ
// ============================================================
function getFilteredServers() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;

    return allServers.filter(srv => {
        const st = serverStatuses[serverKey(srv)] || {};

        if (filter === 'online' && st.status !== 'online') return false;
        if (filter === 'offline' && st.status !== 'offline') return false;

        if (query) {
            const haystack = [
                srv.address,
                String(srv.port),
                srv.motd || '',
                srv.version || ''
            ].join(' ').toLowerCase();
            if (!haystack.includes(query)) return false;
        }

        return true;
    });
}

// ============================================================
//  ОТРИСОВКА
// ============================================================
function renderServers() {
    const grid = document.getElementById('serverGrid');
    const filtered = getFilteredServers();

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет серверов, соответствующих фильтру.</div>';
        return;
    }

    const order = { online: 0, checking: 1, offline: 2 };
    filtered.sort((a, b) => {
        const sa = serverStatuses[serverKey(a)]?.status || 'offline';
        const sb = serverStatuses[serverKey(b)]?.status || 'offline';
        return (order[sa] ?? 3) - (order[sb] ?? 3);
    });

    grid.innerHTML = filtered.map(srv => cardHtml(srv)).join('');
    bindCardClicks(grid);
}

function cardHtml(srv) {
    const key = serverKey(srv);
    const st = serverStatuses[key] || { status: 'checking', data: null };
    const status = st.status;
    const data = st.data || {};

    const statusLabels = {
        online: 'Онлайн',
        offline: 'Офлайн',
        checking: 'Сканируется'
    };

    let titleSource = srv.motd || '';
    if (status === 'online' && data.motd) {
        titleSource = data.motd;
    }
    const title = stripMinecraftColors(titleSource.split('\n')[0]) || 'Без названия';

    let motdText = '';
    if (status === 'online' && data.motd) {
        motdText = data.motd;
    } else {
        motdText = stripMinecraftColors(srv.motd || '') || '—';
    }

    const players = (status === 'online' && data.players != null)
        ? data.players : (srv.players_online ?? '—');
    const maxPlayers = (status === 'online' && data.maxPlayers != null)
        ? data.maxPlayers : (srv.players_max ?? '—');
    const version = (status === 'online' && data.version)
        ? data.version : (srv.version || '—');

    return `
        <div class="server-card ${status}" data-key="${escapeHtml(key)}">
            <div class="card-header">
                <div class="server-name">${escapeHtml(title)}</div>
                <div class="status-badge ${status}">
                    ${status === 'checking' ? '<span class="loading-spinner"></span>' : ''}
                    ${statusLabels[status] || status}
                </div>
            </div>
            <div class="server-address">${escapeHtml(srv.address)}:${srv.port}</div>
            <div class="server-motd">${escapeHtml(motdText)}</div>
            <div class="card-footer">
                <div class="player-count">
                    👥 <span class="count">${escapeHtml(String(players))}</span> / ${escapeHtml(String(maxPlayers))}
                </div>
                <div class="version-tag" title="${escapeHtml(String(version))}">${escapeHtml(String(version))}</div>
            </div>
        </div>
    `;
}

function updateCard(key) {
    const card = document.querySelector(`.server-card[data-key="${CSS.escape(key)}"]`);
    if (!card) return;

    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;

    const temp = document.createElement('div');
    temp.innerHTML = cardHtml(srv);
    const newCard = temp.firstElementChild;

    card.replaceWith(newCard);

    newCard.addEventListener('click', () => {
        const s = allServers.find(ss => serverKey(ss) === key);
        if (s) checkSingleServer(s);
    });
}

function bindCardClicks(container) {
    container.querySelectorAll('.server-card').forEach(card => {
        card.addEventListener('click', () => {
            const key = card.getAttribute('data-key');
            const srv = allServers.find(s => serverKey(s) === key);
            if (srv) checkSingleServer(srv);
        });
    });
}

// ============================================================
//  СТАТИСТИКА
// ============================================================
function updateStats() {
    let online = 0, offline = 0, players = 0;

    allServers.forEach(srv => {
        const st = serverStatuses[serverKey(srv)];
        if (!st) return;
        if (st.status === 'online') {
            online++;
            players += (st.data?.players ?? 0);
        } else if (st.status === 'offline') {
            offline++;
        }
    });

    document.getElementById('totalCount').textContent = allServers.length;
    document.getElementById('onlineCount').textContent = online;
    document.getElementById('offlineCount').textContent = offline;
    document.getElementById('playersTotal').textContent = players;
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;

    const last = Number(localStorage.getItem(LAST_SCAN_KEY) || Date.now());
    const date = new Date(last);
    const time = date.toLocaleTimeString('ru-RU');
    const dateStr = date.toLocaleDateString('ru-RU');

    el.textContent = `Последнее сканирование: ${dateStr} в ${time}`;
}

// ============================================================
//  ОШИБКИ
// ============================================================
function showError(msg) {
    const banner = document.getElementById('errorBanner');
    banner.textContent = '⚠ ' + msg;
    banner.classList.add('show');
}

function hideError() {
    document.getElementById('errorBanner').classList.remove('show');
}

// ============================================================
//  СОБЫТИЯ
// ============================================================
document.getElementById('searchInput').addEventListener('input', renderServers);
document.getElementById('filterSelect').addEventListener('change', renderServers);
document.getElementById('refreshBtn').addEventListener('click', refreshAll);

// ============================================================
//  СТАРТ
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();

console.log(`[${APP_NAME}] Запущено. Автор: ${APP_AUTHOR}.`);
console.log(`[${APP_NAME}] Сегодня ${isWeekend() ? 'выходной — приоритетное сканирование' : 'будний день'}.`);

if (shouldAutoScan()) {
    console.log(`[${APP_NAME}] Запуск еженедельного сканирования...`);
}
loadServersFromJson();
