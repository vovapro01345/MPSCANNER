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
const RESCAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;

// ⏱ ЗАДЕРЖКА между запросами (в миллисекундах).
// 3000 мс = 3 секунды. Если ловите 429 — увеличьте до 5000.
const API_DELAY_MS = 3000;

// ============================================================
//  БЕСПЛАТНЫЕ API БЕЗ КЛЮЧЕЙ
// ============================================================
const API_ENDPOINTS = [
    {
        name: 'mcsrvstat.us',
        url: (host, port) =>
            `https://api.mcsrvstat.us/3/${host}${port && port !== 25565 ? ':' + port : ''}`,
        headers: {
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
                motd: data.motd && data.motd.clean ? data.motd.clean.join(' ') : '',
                icon: data.icon || null,
                software: data.software || null,
                eulaBlocked: data.eula_blocked === true
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
                motd: data.motd ? (data.motd.clean || '') : '',
                icon: data.icon || null,
                software: data.software || null,
                eulaBlocked: data.eula_blocked === true
            };
        }
    },
    {
        name: 'mcapi.us',
        url: (host, port) =>
            `https://mcapi.us/server/status?ip=${encodeURIComponent(host)}${port && port !== 25565 ? '&port=' + port : ''}`,
        headers: { 'Accept': 'application/json' },
        parse: (data) => {
            if (!data || data.status !== 'success' || data.online === false) {
                return { online: false };
            }
            return {
                online: true,
                players: data.players ? (data.players.now ?? 0) : 0,
                maxPlayers: data.players ? (data.players.max ?? 0) : 0,
                version: data.server ? (data.server.name || '—') : '—',
                motd: data.motd || '',
                icon: data.favicon || null,
                software: null,
                eulaBlocked: false
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
    if ((now - last) >= RESCAN_INTERVAL_MS) return true;

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
 */
async function fetchServerStatus(address, port) {
    const errors = [];

    for (const api of API_ENDPOINTS) {
        try {
            const url = api.url(address, port);
            const response = await fetch(url, {
                method: 'GET',
                headers: { 'Accept': 'application/json', ...api.headers },
                signal: AbortSignal.timeout(12000)
            });

            if (!response.ok) {
                if (response.status === 429) {
                    console.warn(`[${APP_NAME}] ${api.name} вернул 429. Ждём 5 секунд...`);
                    await new Promise(r => setTimeout(r, 5000));
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
//  TOAST-УВЕДОМЛЕНИЯ
// ============================================================
let toastTimer = null;
function showToast(msg) {
    let toast = document.getElementById('mcscanner-toast');
    if (!toast) {
        toast = document.createElement('div');
        toast.id = 'mcscanner-toast';
        toast.className = 'toast';
        document.body.appendChild(toast);
    }
    toast.textContent = msg;
    toast.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2000);
}

// ============================================================
//  ПРОГРЕСС
// ============================================================
function updateProgress(current, total, currentName) {
    const container = document.getElementById('progressContainer');
    const fill = document.getElementById('progressBarFill');
    const text = document.getElementById('progressText');
    const currentEl = document.getElementById('progressCurrent');

    if (!container || !fill || !text) return;

    if (current === 0) {
        container.style.display = 'none';
        return;
    }

    container.style.display = 'block';
    const percent = Math.round((current / total) * 100);
    fill.style.width = percent + '%';
    text.textContent = `${current} / ${total}`;
    if (currentEl && currentName) {
        currentEl.textContent = `Сейчас: ${currentName}`;
    }
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
        if (!Array.isArray(data)) throw new Error('JSON должен содержать массив серверов');

        allServers = data;
        serverStatuses = {};

        allServers.forEach(srv => {
            serverStatuses[serverKey(srv)] = { status: 'checking', data: null };
        });

        hideError();
        renderServers();
        updateStats();
        checkAllServers();

    } catch (err) {
        console.error(`[${APP_NAME}]`, err);
        showError(
            `Ошибка загрузки servers.json: ${err.message}. ` +
            `Убедитесь, что файл лежит рядом с index.html и сайт открыт через http(s).`
        );
        document.getElementById('serverGrid').innerHTML = `
            <div class="empty-state">
                ❌ Не удалось загрузить список серверов.<br><br>
                Проверьте, что файл <code>servers.json</code> в одной папке с <code>index.html</code>.<br>
                И что страница открыта по <code>http://</code> или <code>https://</code>, а не <code>file://</code>.<br><br>
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
        updateProgress(current, total, `${srv.address}:${srv.port}`);
        await new Promise(resolve => setTimeout(resolve, API_DELAY_MS));
    }

    isRefreshing = false;
    markScanned();
    updateLastUpdate();
    updateProgress(0, total);
    showToast(`✅ Сканирование завершено: ${total} серверов`);
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
//  ФИЛЬТРАЦИЯ И СОРТИРОВКА
// ============================================================
function getFilteredAndSortedServers() {
    const query = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;
    const sort = document.getElementById('sortSelect').value;

    let result = allServers.filter(srv => {
        const st = serverStatuses[serverKey(srv)] || {};

        if (filter === 'online' && st.status !== 'online') return false;
        if (filter === 'offline' && st.status !== 'offline') return false;
        if (filter === 'with-icon' && !(st.data && st.data.icon)) return false;

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

    const statusOrder = { online: 0, checking: 1, offline: 2 };

    result.sort((a, b) => {
        const sa = serverStatuses[serverKey(a)] || {};
        const sb = serverStatuses[serverKey(b)] || {};

        switch (sort) {
            case 'players-desc':
                return (sb.data?.players ?? -1) - (sa.data?.players ?? -1);
            case 'players-asc':
                return (sa.data?.players ?? 999999) - (sb.data?.players ?? 999999);
            case 'name-asc': {
                const na = stripMinecraftColors((sa.data?.motd || a.motd || '')).toLowerCase();
                const nb = stripMinecraftColors((sb.data?.motd || b.motd || '')).toLowerCase();
                return na.localeCompare(nb);
            }
            case 'name-desc': {
                const na = stripMinecraftColors((sa.data?.motd || a.motd || '')).toLowerCase();
                const nb = stripMinecraftColors((sb.data?.motd || b.motd || '')).toLowerCase();
                return nb.localeCompare(na);
            }
            case 'version': {
                const va = (sa.data?.version || a.version || '').toLowerCase();
                const vb = (sb.data?.version || b.version || '').toLowerCase();
                return va.localeCompare(vb);
            }
            case 'status':
            default:
                return (statusOrder[sa.status] ?? 3) - (statusOrder[sb.status] ?? 3);
        }
    });

    return result;
}

// ============================================================
//  ОТРИСОВКА
// ============================================================
function renderServers() {
    const grid = document.getElementById('serverGrid');
    const filtered = getFilteredAndSortedServers();

    if (filtered.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет серверов, соответствующих фильтру.</div>';
        return;
    }

    grid.innerHTML = filtered.map(srv => cardHtml(srv)).join('');
    bindCardEvents(grid);
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

    // Название
    let titleSource = srv.motd || '';
    if (status === 'online' && data.motd) titleSource = data.motd;
    const title = stripMinecraftColors(titleSource.split('\n')[0]) || 'Без названия';

    // MOTD
    let motdText = '';
    if (status === 'online' && data.motd) motdText = data.motd;
    else motdText = stripMinecraftColors(srv.motd || '') || '—';

    // Числовые поля
    const players = (status === 'online' && data.players != null)
        ? data.players : (srv.players_online ?? '—');
    const maxPlayers = (status === 'online' && data.maxPlayers != null)
        ? data.maxPlayers : (srv.players_max ?? '—');
    const version = (status === 'online' && data.version)
        ? data.version : (srv.version || '—');

    // Полоска заполнения
    let playerBar = '';
    if (status === 'online' && typeof players === 'number' && typeof maxPlayers === 'number' && maxPlayers > 0) {
        const percent = Math.min(100, Math.round((players / maxPlayers) * 100));
        playerBar = `<div class="player-bar"><div class="player-bar-fill" style="width:${percent}%"></div></div>`;
    }

    // Иконка сервера
    let iconHtml = '';
    if (status === 'online' && data.icon) {
        iconHtml = `<img src="${escapeHtml(data.icon)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'icon-placeholder\\'>⛏</span>'">`;
    } else {
        iconHtml = '<span class="icon-placeholder">⛏</span>';
    }

    // Источник
    const sourceTag = (status !== 'checking' && data.source)
        ? `<span class="source-tag" title="Источник данных">${escapeHtml(data.source)}</span>`
        : '';

    return `
        <div class="server-card ${status}" data-key="${escapeHtml(key)}">
            <div class="card-main">
                <div class="server-icon">${iconHtml}</div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="server-name">${escapeHtml(title)}</div>
                        <div class="status-badge ${status}">
                            ${status === 'checking' ? '<span class="loading-spinner"></span>' : ''}
                            ${statusLabels[status] || status}
                        </div>
                    </div>
                    <div class="server-address" data-address="${escapeHtml(srv.address + ':' + srv.port)}" title="Нажмите, чтобы скопировать">
                        ${escapeHtml(srv.address)}:${srv.port}
                        <span class="copy-hint">📋</span>
                    </div>
                    <div class="server-motd">${escapeHtml(motdText)}</div>
                    <div class="card-footer">
                        <div class="player-count">
                            👥 <span class="count">${escapeHtml(String(players))}</span> / ${escapeHtml(String(maxPlayers))}
                            ${playerBar}
                        </div>
                        <div class="version-tag" title="${escapeHtml(String(version))}">${escapeHtml(String(version))}</div>
                    </div>
                    ${sourceTag ? `<div style="margin-top:8px;text-align:right;">${sourceTag}</div>` : ''}
                </div>
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
    bindSingleCardEvents(newCard);
}

function bindSingleCardEvents(card) {
    const addr = card.querySelector('.server-address');
    if (addr) {
        addr.addEventListener('click', async (e) => {
            e.stopPropagation();
            const text = addr.getAttribute('data-address');
            try {
                await navigator.clipboard.writeText(text);
                addr.classList.add('copied');
                showToast('📋 Адрес скопирован: ' + text);
                setTimeout(() => addr.classList.remove('copied'), 1200);
            } catch {
                showToast('❌ Не удалось скопировать');
            }
        });
    }
}

function bindCardEvents(container) {
    container.querySelectorAll('.server-card').forEach(bindSingleCardEvents);
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
    el.textContent = `Последнее сканирование: ${date.toLocaleDateString('ru-RU')} в ${date.toLocaleTimeString('ru-RU')}`;
}

// ============================================================
//  ЭКСПОРТ
// ============================================================
function exportResults() {
    const data = allServers.map(srv => {
        const st = serverStatuses[serverKey(srv)] || {};
        const d = st.data || {};
        return {
            address: srv.address,
            port: srv.port,
            status: st.status || 'unknown',
            online: st.status === 'online',
            players: d.players ?? null,
            maxPlayers: d.maxPlayers ?? null,
            version: d.version || srv.version || null,
            motd: d.motd || srv.motd || null,
            hasIcon: !!d.icon,
            source: d.source || null,
            scannedAt: new Date().toISOString()
        };
    });

    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `mcscanner-results-${new Date().toISOString().slice(0, 10)}.json`;
    a.click();
    URL.revokeObjectURL(url);
    showToast('💾 Результаты сохранены');
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
document.getElementById('sortSelect').addEventListener('change', renderServers);
document.getElementById('refreshBtn').addEventListener('click', refreshAll);
document.getElementById('exportBtn').addEventListener('click', exportResults);

// ============================================================
//  СТАРТ
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();

console.log(`[${APP_NAME}] Запущено. Автор: ${APP_AUTHOR}.`);
console.log(`[${APP_NAME}] Задержка между запросами: ${API_DELAY_MS} мс.`);
console.log(`[${APP_NAME}] Сегодня ${isWeekend() ? 'выходной' : 'будний день'}.`);

if (shouldAutoScan()) {
    console.log(`[${APP_NAME}] Запуск еженедельного сканирования...`);
}
loadServersFromJson();
