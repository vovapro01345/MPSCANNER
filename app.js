// ============================================================
//  MCscanner — by Real_Studio — v2.0
//  + История, PWA, уведомления, теги, QR, сравнение, лог,
//  + кастомные имена, CSV, Bedrock, клавиши, кэш, GA
// ============================================================

const APP_NAME = 'MCscanner';
const APP_AUTHOR = 'Real_Studio';
const SERVERS_JSON_PATH = './servers.json';

const LS = {
    lastScan: 'mcscanner_last_scan',
    favorites: 'mcscanner_favorites',
    lastSeen: 'mcscanner_lastseen',
    theme: 'mcscanner_theme',
    names: 'mcscanner_names',
    history: 'mcscanner_history',
    notif: 'mcscanner_notif',
    progress: 'mcscanner_progress',
    knownStatus: 'mcscanner_known_status',
    logs: 'mcscanner_logs'
};

const API_DELAY_MS = 1500;
const OFFLINE_CACHE_MS = 10 * 60 * 1000;
const RESCAN_INTERVAL_MS = 7 * 24 * 60 * 60 * 1000;
const HISTORY_MAX = 30;
const LOGS_MAX = 300;
const PAGE_SIZE = 40;

// ============================================================
//  API ENDPOINTS
// ============================================================
const API_ENDPOINTS = [
    {
        name: 'mcsrvstat.us',
        url: (h, p) => `https://api.mcsrvstat.us/3/${h}${p && p !== 25565 ? ':' + p : ''}`,
        headers: { 'User-Agent': `${APP_NAME}/2.0 (by ${APP_AUTHOR})` },
        parse: (d) => {
            if (!d || d.online === false || d.online === undefined) return { online: false };
            return {
                online: true,
                players: d.players?.online ?? 0,
                maxPlayers: d.players?.max ?? 0,
                version: d.version || '—',
                motd: d.motd?.clean ? d.motd.clean.join(' ') : '',
                icon: d.icon || null,
                playerList: d.players?.list || null
            };
        }
    },
    {
        name: 'mcstatus.io',
        url: (h, p) => `https://api.mcstatus.io/v2/status/java/${h}${p ? ':' + p : ''}`,
        headers: {},
        parse: (d) => {
            if (!d || d.online === false) return { online: false };
            return {
                online: true,
                players: d.players?.online ?? 0,
                maxPlayers: d.players?.max ?? 0,
                version: d.version ? (d.version.name_raw || d.version.name_clean || '—') : '—',
                motd: d.motd?.clean || '',
                icon: d.icon || null,
                playerList: d.players?.list || null
            };
        }
    },
    {
        name: 'mcapi.us',
        url: (h, p) => `https://mcapi.us/server/status?ip=${encodeURIComponent(h)}${p && p !== 25565 ? '&port=' + p : ''}`,
        headers: {},
        parse: (d) => {
            if (!d || d.status !== 'success' || d.online === false) return { online: false };
            return {
                online: true,
                players: d.players?.now ?? 0,
                maxPlayers: d.players?.max ?? 0,
                version: d.server?.name || '—',
                motd: d.motd || '',
                icon: d.favicon || null,
                playerList: d.players?.sample || null
            };
        }
    }
];

// Bedrock — отдельный endpoint на mcsrvstat.us
const BEDROCK_API = {
    name: 'mcsrvstat.us (bedrock)',
    url: (h, p) => `https://api.mcsrvstat.us/bedrock/3/${h}${p && p !== 19132 ? ':' + p : ''}`,
    headers: { 'User-Agent': `${APP_NAME}/2.0 (by ${APP_AUTHOR})` },
    parse: (d) => {
        if (!d || d.online === false) return { online: false };
        return {
            online: true,
            players: d.players?.online ?? 0,
            maxPlayers: d.players?.max ?? 0,
            version: d.version || '—',
            motd: d.motd?.clean ? d.motd.clean.join(' ') : '',
            icon: null,
            playerList: null
        };
    }
};

// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let allServers = [];
let serverStatuses = {};
let lastCheckTimes = {};
let isRefreshing = false;
let currentFiltered = [];
let displayedCount = 0;
let renameMode = false;
let bedrockMap = {}; // key -> boolean, поддерживает ли Bedrock

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
    return str ? str.replace(/§[0-9a-fk-orx]/gi, '').trim() : '';
}
function isWeekend() {
    const d = new Date().getDay();
    return d === 0 || d === 6;
}
function shouldAutoScan() {
    const last = Number(localStorage.getItem(LS.lastScan) || 0);
    const now = Date.now();
    if ((now - last) >= RESCAN_INTERVAL_MS) return true;
    if (isWeekend()) {
        const ld = new Date(last).toDateString();
        const td = new Date().toDateString();
        if (ld !== td) return true;
    }
    return false;
}
function markScanned() { localStorage.setItem(LS.lastScan, String(Date.now())); }

// ---- Storage helpers ----
function lsGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

// ---- Favorites ----
const getFavorites = () => lsGet(LS.favorites, []);
const isFavorite = (k) => getFavorites().includes(k);
function toggleFavorite(k) {
    const f = getFavorites();
    const i = f.indexOf(k);
    if (i >= 0) f.splice(i, 1); else f.push(k);
    lsSet(LS.favorites, f);
    return isFavorite(k);
}

// ---- Last seen ----
const getLastSeenMap = () => lsGet(LS.lastSeen, {});
function updateLastSeen(k, online) {
    if (!online) return;
    const m = getLastSeenMap();
    m[k] = Date.now();
    lsSet(LS.lastSeen, m);
}
function getLastSeen(k) { return getLastSeenMap()[k] || null; }
function formatLastSeen(ts) {
    if (!ts) return null;
    const d = Date.now() - ts, min = Math.floor(d / 60000);
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч назад`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days} дн назад`;
    return new Date(ts).toLocaleDateString('ru-RU');
}

// ---- Custom names ----
const getCustomNames = () => lsGet(LS.names, {});
function setCustomName(k, name) {
    const m = getCustomNames();
    if (name) m[k] = name; else delete m[k];
    lsSet(LS.names, m);
}
function getCustomName(k) { return getCustomNames()[k] || null; }

// ---- Notifications ----
function notifEnabled() { return lsGet(LS.notif, false) === true; }
async function toggleNotifications() {
    if (notifEnabled()) {
        lsSet(LS.notif, false);
        showToast('🔔 Уведомления выключены');
        updateNotifBtn();
        return;
    }
    if (!('Notification' in window)) {
        showToast('❌ Уведомления не поддерживаются');
        return;
    }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') {
        lsSet(LS.notif, true);
        showToast('🔔 Уведомления включены');
    } else {
        showToast('❌ Разрешение не получено');
    }
    updateNotifBtn();
}
function updateNotifBtn() {
    const btn = document.getElementById('notifToggle');
    btn.classList.toggle('active', notifEnabled());
    btn.textContent = notifEnabled() ? '🔔' : '🔕';
    btn.title = notifEnabled() ? 'Уведомления вкл.' : 'Уведомления выкл.';
}
function notify(title, body) {
    if (!notifEnabled()) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body, icon: './manifest.json' }); } catch {}
}

// ---- Theme ----
function applyTheme() {
    let theme = localStorage.getItem(LS.theme);
    if (!theme) {
        theme = window.matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    }
    document.body.classList.toggle('light', theme === 'light');
    document.getElementById('themeToggle').textContent = theme === 'light' ? '☀️' : '🌙';
}
function toggleTheme() {
    const cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS.theme, cur === 'light' ? 'dark' : 'light');
    applyTheme();
    gtag('event', 'theme_toggle');
}

// ---- Sound ----
function playBeep() {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.value = 880; osc.type = 'sine';
        gain.gain.setValueAtTime(0.06, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.2);
        osc.start(); osc.stop(ctx.currentTime + 0.2);
        setTimeout(() => ctx.close(), 300);
    } catch {}
}

// ---- Tags (парсинг MOTD) ----
const TAG_KEYWORDS = {
    survival: ['survival', 'выживание', 'smp'],
    pvp: ['pvp', 'crystal pvp', 'анархия', 'кристал'],
    anarchy: ['anarchy', 'анархия', 'hvh'],
    skyblock: ['skyblock', 'скайблок', 'sky block'],
    creative: ['creative', 'креатив'],
    modded: ['modded', 'forge', 'fabric', 'neoforge', 'atm', 'cobblemon', 'create', 'gregtech'],
    vanilla: ['vanilla', 'ванилла', 'ванильный'],
    hardcore: ['hardcore', 'хардкор'],
    rpg: ['rpg', 'ролевая', 'roleplay'],
    minigames: ['minigames', 'мини-игры', 'mini games', 'bedwars', 'skywars'],
    towny: ['towny', 'город'],
    factions: ['factions', 'кланы', 'faction'],
    prison: ['prison', 'тюрьма'],
    bedrock: ['bedrock', 'бедрок', 'crossplay', 'cross-play']
};
function extractTags(motd, version) {
    const text = ((motd || '') + ' ' + (version || '')).toLowerCase();
    const tags = [];
    for (const [tag, keywords] of Object.entries(TAG_KEYWORDS)) {
        if (keywords.some(k => text.includes(k))) tags.push(tag);
    }
    return tags;
}

// ---- Discord extract ----
function extractDiscord(motd) {
    if (!motd) return null;
    const m = motd.match(/discord(?:\.gg|\.com\/invite|app\.com\/invite)\/([a-zA-Z0-9]+)/i);
    if (m) return `https://discord.gg/${m[1]}`;
    const m2 = motd.match(/discord\s*[:=]\s*(https?:\/\/\S+)/i);
    return m2 ? m2[1] : null;
}

// ---- Logs ----
const getLogs = () => lsGet(LS.logs, []);
function addLog(level, msg) {
    const logs = getLogs();
    logs.unshift({ t: Date.now(), level, msg: String(msg).slice(0, 300) });
    if (logs.length > LOGS_MAX) logs.length = LOGS_MAX;
    lsSet(LS.logs, logs);
}

// ---- History ----
const getHistory = () => lsGet(LS.history, []);
function saveHistory() {
    const snapshot = {
        t: Date.now(),
        total: allServers.length,
        online: allServers.filter(s => serverStatuses[serverKey(s)]?.status === 'online').length,
        servers: allServers.map(s => {
            const st = serverStatuses[serverKey(s)];
            return {
                k: serverKey(s),
                online: st?.status === 'online',
                players: st?.data?.players ?? 0
            };
        })
    };
    const h = getHistory();
    h.unshift(snapshot);
    if (h.length > HISTORY_MAX) h.length = HISTORY_MAX;
    lsSet(LS.history, h);
}

// ---- Progress save/resume ----
function saveProgress(idx) {
    if (isRefreshing) lsSet(LS.progress, { idx, t: Date.now() });
}
function clearProgress() { localStorage.removeItem(LS.progress); }
function loadProgress() {
    const p = lsGet(LS.progress, null);
    if (!p || (Date.now() - p.t) > 30 * 60 * 1000) return null;
    return p;
}

// ---- Known status (для уведомлений о падении) ----
const getKnownStatus = () => lsGet(LS.knownStatus, {});
function updateKnownStatus(key, online) {
    const m = getKnownStatus();
    const prev = m[key];
    m[key] = online;
    lsSet(LS.knownStatus, m);
    return prev;
}

// ============================================================
//  API FETCH
// ============================================================
async function fetchServerStatus(address, port) {
    const errors = [];
    for (const api of API_ENDPOINTS) {
        try {
            const url = api.url(address, port);
            const t0 = performance.now();
            const response = await fetch(url, {
                headers: { 'Accept': 'application/json', ...api.headers },
                signal: AbortSignal.timeout(12000)
            });
            const dt = Math.round(performance.now() - t0);

            if (!response.ok) {
                addLog('warn', `${api.name} ${response.status} (${dt}ms) → ${address}:${port}`);
                errors.push(`${api.name}: ${response.status}`);
                continue;
            }

            const data = await response.json();
            const parsed = api.parse(data);
            addLog('ok', `${api.name} (${dt}ms) → ${address}:${port}`);

            if (parsed.online === false) return { online: false, source: api.name };
            return { ...parsed, source: api.name };
        } catch (err) {
            addLog('err', `${api.name} → ${err.message} (${address}:${port})`);
            errors.push(`${api.name}: ${err.message}`);
        }
    }
    return { online: false, error: errors.join('; ') };
}

async function fetchBedrockStatus(address) {
    try {
        const url = BEDROCK_API.url(address, 19132);
        const response = await fetch(url, {
            headers: { 'Accept': 'application/json', ...BEDROCK_API.headers },
            signal: AbortSignal.timeout(10000)
        });
        if (!response.ok) return false;
        const data = await response.json();
        return BEDROCK_API.parse(data).online === true;
    } catch { return false; }
}

// ============================================================
//  PROGRESS BAR
// ============================================================
function updateProgress(cur, total, name) {
    const c = document.getElementById('progressContainer');
    const f = document.getElementById('progressBarFill');
    const t = document.getElementById('progressText');
    const n = document.getElementById('progressCurrent');
    if (cur === 0) { c.style.display = 'none'; return; }
    c.style.display = 'block';
    f.style.width = Math.round((cur / total) * 100) + '%';
    t.textContent = `${cur} / ${total}`;
    if (n && name) n.textContent = `Сейчас: ${name}`;
}

// ============================================================
//  LOAD
// ============================================================
async function loadServersFromJson() {
    try {
        const response = await fetch(SERVERS_JSON_PATH, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('JSON должен быть массивом');

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
        addLog('err', 'loadServers: ' + err.message);
        showError(`Ошибка загрузки servers.json: ${err.message}`);
        document.getElementById('serverGrid').innerHTML = `
            <div class="empty-state">
                ❌ Не удалось загрузить список.<br><br>
                Проверьте, что файл <code>servers.json</code> в одной папке с <code>index.html</code><br>
                и сайт открыт через <code>http(s)://</code>, а не <code>file://</code>.<br><br>
                <small style="color:#555">${escapeHtml(err.message)}</small>
            </div>`;
    }
}

// ============================================================
//  SCAN
// ============================================================
async function checkAllServers() {
    if (isRefreshing) return;
    isRefreshing = true;

    const total = allServers.length;
    let current = 0;

    updateProgress(0, total);

    for (let i = 0; i < allServers.length; i++) {
        const srv = allServers[i];
        const key = serverKey(srv);
        const lastCheck = lastCheckTimes[key] || 0;
        const cached = serverStatuses[key];

        if (cached?.status === 'offline' && (Date.now() - lastCheck) < OFFLINE_CACHE_MS) {
            current++;
            updateProgress(current, total, `${srv.address}:${srv.port} (кэш)`);
            continue;
        }

        await checkSingleServer(srv);
        current++;
        saveProgress(i);
        updateProgress(current, total, `${srv.address}:${srv.port}`);
        await new Promise(r => setTimeout(r, API_DELAY_MS));
    }

    isRefreshing = false;
    markScanned();
    clearProgress();
    updateLastUpdate();
    updateProgress(0, total);
    renderServers();
    updateStats();
    saveHistory();
    playBeep();
    showToast(`✅ Сканирование завершено: ${total} серверов`);
    gtag('event', 'scan_complete', { total_servers: total });
}

async function checkSingleServer(srv) {
    const key = serverKey(srv);
    serverStatuses[key] = { status: 'checking', data: null };
    updateCard(key);

    const prevOnline = getKnownStatus()[key];
    const result = await fetchServerStatus(srv.address, srv.port);

    serverStatuses[key] = {
        status: result.online ? 'online' : 'offline',
        data: result
    };
    lastCheckTimes[key] = Date.now();
    updateLastSeen(key, result.online);

    // Уведомление о падении любимого сервера
    if (prevOnline === true && result.online === false && isFavorite(key)) {
        notify('⚠️ Сервер упал', `${srv.address}:${srv.port}`);
    }
    updateKnownStatus(key, result.online);

    // Проверка Bedrock (асинхронно, не блокируем)
    if (!bedrockMap[key]) {
        fetchBedrockStatus(srv.address).then(has => {
            bedrockMap[key] = has;
            if (has) updateCard(key);
        });
    }

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
    lastCheckTimes = {};
    renderServers();
    updateStats();
    gtag('event', 'scan_start', { manual: true });

    await checkAllServers();

    btn.disabled = false;
    btn.textContent = '🔄 Обновить всё';
}

// ============================================================
//  FILTER + SORT
// ============================================================
function getFilteredAndSortedServers() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const verFilter = document.getElementById('versionFilter').value;
    const sort = document.getElementById('sortSelect').value;

    let result = allServers.filter(srv => {
        const key = serverKey(srv);
        const st = serverStatuses[key] || {};
        const data = st.data || {};

        if (filter === 'online' && st.status !== 'online') return false;
        if (filter === 'offline' && st.status !== 'offline') return false;
        if (filter === 'favorites' && !isFavorite(key)) return false;
        if (filter === 'with-icon' && !data.icon) return false;
        if (filter === 'has-players' && !(data.players > 0)) return false;
        if (filter === 'discord' && !extractDiscord(data.motd || srv.motd)) return false;
        if (filter === 'cracked' || filter === 'premium') {
            // Точное определение невозможно, используем эвристику по MOTD
            const motd = (data.motd || srv.motd || '').toLowerCase();
            const looksCracked = /cracked|пират|no.?premium|offline.?mode|non.?premium/.test(motd);
            if (filter === 'cracked' && !looksCracked) return false;
            if (filter === 'premium' && looksCracked) return false;
        }
        if (tagFilter) {
            const tags = extractTags(data.motd || srv.motd, data.version || srv.version);
            if (!tags.includes(tagFilter)) return false;
        }
        if (verFilter) {
            const v = String(data.version || srv.version || '');
            if (!v.includes(verFilter)) return false;
        }
        if (q) {
            const hay = [srv.address, String(srv.port), srv.motd || '', srv.version || '',
                        getCustomName(key) || '', data.motd || '', data.version || '']
                .join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    const statusOrder = { online: 0, checking: 1, offline: 2 };

    result.sort((a, b) => {
        const sa = serverStatuses[serverKey(a)] || {};
        const sb = serverStatuses[serverKey(b)] || {};

        const favA = isFavorite(serverKey(a)) ? 0 : 1;
        const favB = isFavorite(serverKey(b)) ? 0 : 1;
        if (favA !== favB) return favA - favB;

        const fill = (s) => {
            if (s.data?.players == null || !s.data?.maxPlayers) return -1;
            return s.data.players / s.data.maxPlayers;
        };

        switch (sort) {
            case 'fill-desc': return fill(sb) - fill(sa);
            case 'players-desc': return (sb.data?.players ?? -1) - (sa.data?.players ?? -1);
            case 'players-asc': return (sa.data?.players ?? 999999) - (sb.data?.players ?? 999999);
            case 'name-asc': {
                const na = getServerTitle(a).toLowerCase();
                const nb = getServerTitle(b).toLowerCase();
                return na.localeCompare(nb);
            }
            case 'name-desc': {
                const na = getServerTitle(a).toLowerCase();
                const nb = getServerTitle(b).toLowerCase();
                return nb.localeCompare(na);
            }
            case 'version': {
                const va = (sa.data?.version || a.version || '').toLowerCase();
                const vb = (sb.data?.version || b.version || '').toLowerCase();
                return va.localeCompare(vb);
            }
            default:
                return (statusOrder[sa.status] ?? 3) - (statusOrder[sb.status] ?? 3);
        }
    });

    return result;
}

function getServerTitle(srv) {
    const key = serverKey(srv);
    const custom = getCustomName(key);
    if (custom) return custom;
    const st = serverStatuses[key] || {};
    const data = st.data || {};
    let src = srv.motd || '';
    if (data.motd) src = data.motd;
    return stripMinecraftColors(src.split('\n')[0]) || 'Без названия';
}

// ============================================================
//  RENDER
// ============================================================
function renderServers(resetPagination = true) {
    const grid = document.getElementById('serverGrid');
    currentFiltered = getFilteredAndSortedServers();
    if (resetPagination) displayedCount = PAGE_SIZE;

    const visible = currentFiltered.slice(0, displayedCount);

    if (visible.length === 0) {
        grid.innerHTML = '<div class="empty-state">Нет серверов, соответствующих фильтру.</div>';
        document.getElementById('loadMoreWrap').style.display = 'none';
        return;
    }

    grid.innerHTML = visible.map(cardHtml).join('');
    bindCardEvents(grid);

    const wrap = document.getElementById('loadMoreWrap');
    if (currentFiltered.length > displayedCount) {
        wrap.style.display = 'block';
        const remaining = currentFiltered.length - displayedCount;
        document.getElementById('loadMoreCount').textContent = `(${remaining})`;
    } else {
        wrap.style.display = 'none';
    }
}

function cardHtml(srv) {
    const key = serverKey(srv);
    const st = serverStatuses[key] || { status: 'checking', data: null };
    const status = st.status;
    const data = st.data || {};
    const fav = isFavorite(key);
    const customName = getCustomName(key);

    const statusLabels = { online: 'Онлайн', offline: 'Офлайн', checking: 'Скан' };

    const title = getServerTitle(srv);
    const isCustom = !!customName;

    let motdText = (status === 'online' && data.motd)
        ? data.motd
        : (stripMinecraftColors(srv.motd || '') || '—');

    const players = (status === 'online' && data.players != null) ? data.players : (srv.players_online ?? '—');
    const maxPlayers = (status === 'online' && data.maxPlayers != null) ? data.maxPlayers : (srv.players_max ?? '—');
    const version = (status === 'online' && data.version) ? data.version : (srv.version || '—');

    let playerBar = '';
    if (status === 'online' && typeof players === 'number' && typeof maxPlayers === 'number' && maxPlayers > 0) {
        const p = Math.min(100, Math.round((players / maxPlayers) * 100));
        playerBar = `<div class="player-bar"><div class="player-bar-fill" style="width:${p}%"></div></div>`;
    }

    let iconHtml = '<span class="icon-placeholder">⛏</span>';
    if (status === 'online' && data.icon) {
        iconHtml = `<img src="${escapeHtml(data.icon)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'icon-placeholder\\'>⛏</span>'">`;
    }

    // Теги
    const tags = extractTags(data.motd || srv.motd, data.version || srv.version);
    const discord = extractDiscord(data.motd || srv.motd);
    const hasBedrock = bedrockMap[key] === true;

    let tagsHtml = '';
    if (tags.length > 0 || discord || hasBedrock) {
        const tagEls = tags.map(t => `<span class="tag">${t}</span>`);
        if (discord) tagEls.push(`<span class="tag discord">💬 Discord</span>`);
        if (hasBedrock) tagEls.push(`<span class="tag bedrock">Bedrock</span>`);
        tagsHtml = `<div class="tags">${tagEls.join('')}</div>`;
    }

    const sourceTag = (status !== 'checking' && data.source)
        ? `<span class="source-tag">${escapeHtml(data.source)}</span>` : '';

    let lastSeenHtml = '';
    if (status === 'offline') {
        const ts = getLastSeen(key);
        if (ts) lastSeenHtml = `<div class="last-seen">📅 Был онлайн: ${formatLastSeen(ts)}</div>`;
    }

    const hasPlayerList = status === 'online' && Array.isArray(data.playerList) && data.playerList.length > 0;
    const pcClass = hasPlayerList ? 'player-count clickable' : 'player-count';
    const pcTitle = hasPlayerList ? 'Нажмите, чтобы увидеть список' : '';

    return `
        <div class="server-card ${status} ${fav ? 'is-favorite' : ''}" data-key="${escapeHtml(key)}">
            <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${escapeHtml(key)}" title="Избранное">${fav ? '★' : '☆'}</button>
            <div class="card-main">
                <div class="server-icon">${iconHtml}</div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="server-name ${isCustom ? 'custom' : ''}" data-name="${escapeHtml(key)}" title="${renameMode ? 'Кликните, чтобы переименовать' : ''}">${escapeHtml(title)}</div>
                        <div class="status-badge ${status}">
                            ${status === 'checking' ? '<span class="loading-spinner"></span>' : ''}
                            ${statusLabels[status] || status}
                        </div>
                    </div>
                    <div class="server-address" data-address="${escapeHtml(key)}" data-qr="${escapeHtml(key)}" title="Клик — копировать, Shift+клик — QR">
                        ${escapeHtml(srv.address)}:${srv.port}
                        <span class="copy-hint">📋</span>
                    </div>
                    <div class="server-motd">${escapeHtml(motdText)}</div>
                    ${tagsHtml}
                    ${lastSeenHtml}
                    <div class="card-footer">
                        <div class="${pcClass}" data-players="${escapeHtml(key)}" title="${pcTitle}">
                            👥 <span class="count">${escapeHtml(String(players))}</span> / ${escapeHtml(String(maxPlayers))}
                            ${playerBar}
                        </div>
                        <div class="version-tag" title="${escapeHtml(String(version))}">${escapeHtml(String(version))}</div>
                    </div>
                    ${sourceTag ? `<div style="margin-top:6px;text-align:right;">${sourceTag}</div>` : ''}
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
    const favBtn = card.querySelector('.fav-btn');
    if (favBtn) favBtn.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = favBtn.getAttribute('data-fav');
        const nowFav = toggleFavorite(key);
        favBtn.classList.toggle('active', nowFav);
        favBtn.textContent = nowFav ? '★' : '☆';
        card.classList.toggle('is-favorite', nowFav);
        showToast(nowFav ? '⭐ Добавлено в избранное' : 'Убрано из избранного');
    });

    const addr = card.querySelector('.server-address');
    if (addr) addr.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = addr.getAttribute('data-address');
        if (e.shiftKey) {
            openQrModal(key);
            return;
        }
        try {
            await navigator.clipboard.writeText(key);
            addr.classList.add('copied');
            showToast('📋 Скопировано: ' + key);
            setTimeout(() => addr.classList.remove('copied'), 1200);
        } catch { showToast('❌ Не удалось скопировать'); }
    });

    const pc = card.querySelector('.player-count.clickable');
    if (pc) pc.addEventListener('click', (e) => {
        e.stopPropagation();
        openPlayerModal(pc.getAttribute('data-players'));
    });

    const nameEl = card.querySelector('.server-name');
    if (nameEl) nameEl.addEventListener('click', (e) => {
        e.stopPropagation();
        const key = nameEl.getAttribute('data-name');
        if (renameMode) {
            const current = getCustomName(key) || '';
            const newName = prompt(`Новое имя для ${key}:`, current);
            if (newName !== null) {
                setCustomName(key, newName.trim() || null);
                renderServers(false);
                showToast(newName.trim() ? '✏️ Имя сохранено' : 'Имя сброшено');
            }
        }
    });
}

function bindCardEvents(container) {
    container.querySelectorAll('.server-card').forEach(bindSingleCardEvents);
}

// ============================================================
//  MODALS
// ============================================================
function openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalBackdrop').classList.add('show');
}
function closeModal() {
    document.getElementById('modalBackdrop').classList.remove('show');
}

function openPlayerModal(key) {
    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;
    const data = serverStatuses[key]?.data || {};
    const list = data.playerList || [];

    let html;
    if (list.length === 0) {
        html = '<div class="modal-empty">Список игроков недоступен</div>';
    } else {
        html = list.map(p => {
            const name = typeof p === 'string' ? p : (p.name || p.name_clean || 'unknown');
            const uuid = typeof p === 'object' ? (p.id || p.uuid || '') : '';
            return `<div class="player-item"><span>${escapeHtml(name)}</span>${uuid ? `<span style="color:var(--text-mute);font-size:0.7rem;margin-left:auto;">${escapeHtml(uuid)}</span>` : ''}</div>`;
        }).join('');
    }
    openModal(`Игроки — ${srv.address}:${srv.port}`, html);
}

function openQrModal(key) {
    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(key)}`;
    openModal(`QR-код — ${srv.address}:${srv.port}`,
        `<div class="qr-wrap"><img src="${qrUrl}" alt="QR" width="220" height="220"><p style="margin-top:14px;font-family:monospace;color:var(--text-dim);">${escapeHtml(key)}</p></div>`);
}

function openLogModal() {
    const logs = getLogs();
    let html;
    if (logs.length === 0) {
        html = '<div class="modal-empty">Лог пуст</div>';
    } else {
        html = logs.slice(0, 100).map(l => {
            const time = new Date(l.t).toLocaleTimeString('ru-RU');
            return `<div class="log-item ${l.level}"><span class="time">${time}</span><span>${escapeHtml(l.msg)}</span></div>`;
        }).join('');
    }
    openModal('📋 Лог сканирования', html);
}

function openHistoryModal() {
    const h = getHistory();
    let html;
    if (h.length === 0) {
        html = '<div class="modal-empty">История пуста</div>';
    } else {
        html = h.map(snap => {
            const date = new Date(snap.t).toLocaleString('ru-RU');
            return `<div class="history-item"><span>${date}</span><span style="margin-left:auto;color:var(--accent);">${snap.online} / ${snap.total}</span></div>`;
        }).join('');
    }
    openModal('📜 История сканирований', html);
}

function openCompareModal() {
    const h = getHistory();
    if (h.length < 2) {
        openModal('🔀 Сравнение', '<div class="modal-empty">Нужно минимум 2 сканирования</div>');
        return;
    }
    const cur = h[0], prev = h[1];
    const prevMap = {};
    prev.servers.forEach(s => prevMap[s.k] = s);

    const changes = [];
    cur.servers.forEach(s => {
        const p = prevMap[s.k];
        if (!p) return;
        if (p.online !== s.online) {
            changes.push({
                k: s.k,
                text: s.online ? '⬆️ Стал онлайн' : '⬇️ Упал',
                level: s.online ? 'ok' : 'err'
            });
        } else if (s.online && p.players !== s.players) {
            const diff = s.players - p.players;
            if (Math.abs(diff) >= 3) {
                changes.push({
                    k: s.k,
                    text: `${diff > 0 ? '📈' : '📉'} ${p.players} → ${s.players} (${diff > 0 ? '+' : ''}${diff})`,
                    level: 'warn'
                });
            }
        }
    });

    const from = new Date(prev.t).toLocaleString('ru-RU');
    const to = new Date(cur.t).toLocaleString('ru-RU');

    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">Сравнение: <b>${from}</b> → <b>${to}</b></div>`;
    if (changes.length === 0) {
        html += '<div class="modal-empty">Ничего значимого не изменилось</div>';
    } else {
        html += changes.map(c =>
            `<div class="log-item ${c.level}"><span style="flex:1;font-family:monospace;font-size:0.78rem;">${escapeHtml(c.k)}</span><span>${escapeHtml(c.text)}</span></div>`
        ).join('');
    }
    openModal('🔀 Сравнение сканирований', html);
}

function openHelpModal() {
    const shortcuts = [
        ['/', 'Фокус на поиск'],
        ['Esc', 'Закрыть модальное окно / очистить поиск'],
        ['R', 'Перезапустить сканирование'],
        ['T', 'Переключить тему'],
        ['E', 'Экспорт JSON'],
        ['C', 'Экспорт CSV'],
        ['H', 'История'],
        ['L', 'Лог сканирования'],
        ['?', 'Эта справка'],
        ['Shift+клик по адресу', 'Показать QR-код'],
        ['Клик по адресу', 'Скопировать адрес'],
        ['Клик по числу игроков', 'Список игроков'],
        ['Клик по имени (в режиме ✏️)', 'Переименовать']
    ];
    const html = shortcuts.map(([k, d]) =>
        `<div class="shortcut-row"><span>${escapeHtml(d)}</span><span class="kbd">${escapeHtml(k)}</span></div>`
    ).join('');
    openModal('❓ Горячие клавиши', html);
}

// ============================================================
//  STATS
// ============================================================
function updateStats() {
    let online = 0, offline = 0, players = 0;
    allServers.forEach(srv => {
        const st = serverStatuses[serverKey(srv)];
        if (!st) return;
        if (st.status === 'online') { online++; players += (st.data?.players ?? 0); }
        else if (st.status === 'offline') offline++;
    });
    const total = allServers.length;
    const pct = total > 0 ? Math.round((online / total) * 100) : 0;

    document.getElementById('totalCount').textContent = total;
    document.getElementById('onlineCount').textContent = online;
    document.getElementById('offlineCount').textContent = offline;
    document.getElementById('playersTotal').textContent = players;
    document.getElementById('onlinePercent').textContent = pct + '%';
}
function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    const last = Number(localStorage.getItem(LS.lastScan) || Date.now());
    const d = new Date(last);
    el.textContent = `Последнее сканирование: ${d.toLocaleDateString('ru-RU')} в ${d.toLocaleTimeString('ru-RU')}`;
}

// ============================================================
//  EXPORT
// ============================================================
function buildExportData() {
    return allServers.map(srv => {
        const key = serverKey(srv);
        const st = serverStatuses[key] || {};
        const d = st.data || {};
        const tags = extractTags(d.motd || srv.motd, d.version || srv.version);
        return {
            address: srv.address,
            port: srv.port,
            status: st.status || 'unknown',
            online: st.status === 'online',
            favorite: isFavorite(key),
            customName: getCustomName(key),
            players: d.players ?? null,
            maxPlayers: d.maxPlayers ?? null,
            version: d.version || srv.version || null,
            motd: d.motd || srv.motd || null,
            tags,
            discord: extractDiscord(d.motd || srv.motd),
            bedrock: bedrockMap[key] === true,
            hasIcon: !!d.icon,
            source: d.source || null,
            lastSeen: getLastSeen(key),
            scannedAt: new Date().toISOString()
        };
    });
}

function exportJson() {
    const data = buildExportData();
    downloadFile(JSON.stringify(data, null, 2), `mcscanner-${dateStr()}.json`, 'application/json');
    showToast('💾 JSON сохранён');
    gtag('event', 'export', { format: 'json' });
}

function exportCsv() {
    const data = buildExportData();
    const cols = ['address','port','status','online','favorite','customName','players','maxPlayers','version','motd','tags','discord','bedrock','source'];
    const header = cols.join(',');
    const rows = data.map(row => cols.map(c => {
        let v = row[c];
        if (Array.isArray(v)) v = v.join('|');
        if (v == null) v = '';
        v = String(v).replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${v}"`;
    }).join(','));
    const csv = '\uFEFF' + [header, ...rows].join('\n'); // BOM для Excel
    downloadFile(csv, `mcscanner-${dateStr()}.csv`, 'text/csv');
    showToast('📊 CSV сохранён');
    gtag('event', 'export', { format: 'csv' });
}

function downloadFile(content, name, mime) {
    const blob = new Blob([content], { type: mime + ';charset=utf-8' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url; a.download = name; a.click();
    URL.revokeObjectURL(url);
}
function dateStr() { return new Date().toISOString().slice(0, 10); }

// ============================================================
//  ERRORS / TOAST
// ============================================================
function showError(msg) {
    const b = document.getElementById('errorBanner');
    b.textContent = '⚠ ' + msg;
    b.classList.add('show');
}
function hideError() {
    document.getElementById('errorBanner').classList.remove('show');
}
let toastTimer = null;
function showToast(msg) {
    let t = document.getElementById('mcscanner-toast');
    if (!t) {
        t = document.createElement('div');
        t.id = 'mcscanner-toast';
        t.className = 'toast';
        document.body.appendChild(t);
    }
    t.textContent = msg;
    t.classList.add('show');
    clearTimeout(toastTimer);
    toastTimer = setTimeout(() => t.classList.remove('show'), 2200);
}

// ============================================================
//  SERVICE WORKER
// ============================================================
async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try {
        await navigator.serviceWorker.register('./sw.js');
        addLog('ok', 'Service Worker зарегистрирован');
    } catch (err) {
        addLog('warn', 'SW: ' + err.message);
    }
}

async function clearApiCache() {
    if (!('caches' in window)) { showToast('Кэш недоступен'); return; }
    const keys = await caches.keys();
    for (const k of keys) {
        if (k.includes('api')) await caches.delete(k);
    }
    showToast('🗑️ Кэш API очищен');
    gtag('event', 'cache_clear');
}

// ============================================================
//  PWA INSTALL
// ============================================================
let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'flex';
});
document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    const { outcome } = await deferredPrompt.userChoice;
    addLog('ok', 'PWA install: ' + outcome);
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
});

// ============================================================
//  EVENTS
// ============================================================
document.getElementById('searchInput').addEventListener('input', () => renderServers(true));
document.getElementById('filterSelect').addEventListener('change', () => renderServers(true));
document.getElementById('tagFilter').addEventListener('change', () => renderServers(true));
document.getElementById('versionFilter').addEventListener('change', () => renderServers(true));
document.getElementById('sortSelect').addEventListener('change', () => renderServers(true));
document.getElementById('refreshBtn').addEventListener('click', refreshAll);
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
document.getElementById('historyBtn').addEventListener('click', openHistoryModal);
document.getElementById('compareBtn').addEventListener('click', openCompareModal);
document.getElementById('logBtn').addEventListener('click', openLogModal);
document.getElementById('clearCacheBtn').addEventListener('click', clearApiCache);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('notifToggle').addEventListener('click', toggleNotifications);
document.getElementById('helpBtn').addEventListener('click', openHelpModal);
document.getElementById('modalClose').addEventListener('click', closeModal);
document.getElementById('modalBackdrop').addEventListener('click', (e) => {
    if (e.target.id === 'modalBackdrop') closeModal();
});
document.getElementById('loadMoreBtn').addEventListener('click', () => {
    displayedCount += PAGE_SIZE;
    renderServers(false);
});

document.getElementById('renameModeBtn').addEventListener('click', (e) => {
    renameMode = !renameMode;
    e.currentTarget.classList.toggle('active', renameMode);
    e.currentTarget.textContent = renameMode ? '✏️ Режим вкл' : '✏️ Имена';
    showToast(renameMode ? '✏️ Клик по имени — переименовать' : 'Режим имён выключен');
});

// Keyboard shortcuts
document.addEventListener('keydown', (e) => {
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (e.key === 'Escape') {
        if (document.getElementById('modalBackdrop').classList.contains('show')) {
            closeModal();
        } else if (inInput) {
            document.activeElement.blur();
        }
        return;
    }
    if (inInput) return;

    switch (e.key.toLowerCase()) {
        case '/': e.preventDefault(); document.getElementById('searchInput').focus(); break;
        case 'r': refreshAll(); break;
        case 't': toggleTheme(); break;
        case 'e': exportJson(); break;
        case 'c': exportCsv(); break;
        case 'h': openHistoryModal(); break;
        case 'l': openLogModal(); break;
        case '?': openHelpModal(); break;
    }
});

// ============================================================
//  INIT
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();
applyTheme();
updateNotifBtn();
registerSW();

addLog('ok', `${APP_NAME} v2.0 запущен`);
console.log(`[${APP_NAME}] Запущено. Автор: ${APP_AUTHOR}.`);
console.log(`[${APP_NAME}] Сегодня ${isWeekend() ? 'выходной' : 'будний день'}.`);

const resume = loadProgress();
if (resume) {
    console.log(`[${APP_NAME}] Найдено прерванное сканирование (${resume.idx} серверов).`);
    showToast('▶️ Продолжаем прерванное сканирование');
}

if (shouldAutoScan()) console.log(`[${APP_NAME}] Запуск еженедельного сканирования...`);

loadServersFromJson();
