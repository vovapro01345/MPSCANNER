// ============================================================
//  MCscanner — by Real_Studio — v4.0
//  Свой движок сканирования + cross-verification + Geo + i18n
// ============================================================

const APP_NAME = 'MCscanner';
const APP_AUTHOR = 'Real_Studio';
const TG_LINK = 'https://t.me/Real_Studio_Game';
const SERVERS_JSON_PATH = './servers.json';

const LS = {
    lastScan: 'mcscanner_last_scan',
    favorites: 'mcscanner_favorites',
    lastSeen: 'mcscanner_lastseen',
    theme: 'mcscanner_theme',
    accent: 'mcscanner_accent',
    lang: 'mcscanner_lang',
    names: 'mcscanner_names',
    history: 'mcscanner_history',
    notif: 'mcscanner_notif',
    logs: 'mcscanner_logs',
    geo: 'mcscanner_geo',
    view: 'mcscanner_view',
    lastServerList: 'mcscanner_last_servers_list',
    expandedIPs: 'mcscanner_expanded_ips',
    deadIPs: 'mcscanner_dead_ips'
};

const SCANNER_CONFIG = {
    delayMs: 1500,
    cacheTTL: 5 * 60 * 1000,
    probeTimeoutMs: 12000,
    retryMax: 1,
    retryBackoffMs: [2000],
    autoScanIntervalMs: 7 * 24 * 60 * 60 * 1000
};

const HISTORY_MAX = 30;
const LOGS_MAX = 300;
const PAGE_SIZE = 40;

// ============================================================
//  i18n
// ============================================================
const I18N = {
    ru: {
        subtitle: 'Собственный сканер Minecraft-серверов',
        infoStrong: 'Свой движок сканирования',
        infoText: 'параллельные пробы, cross-verification, медиана значений, retry с backoff.',
        infoSmall: 'Задержка 1.5 сек · 2–3 пробы на сервер · работает офлайн (PWA)',
        spProgress: '⏳ Прогресс:', spAgree: '🎯 Согласие проб:', spLatency: '📡 Средний отклик:',
        spVerified: '✅ Проверено:', spConflicts: '⚠️ Конфликты:',
        scanning: '⏳ Сканирование...',
        presetAll: '📋 Все', presetOnlinePlayers: '🔥 Онлайн + игроки', presetNew: '🆕 Новые',
        presetAnomalies: '⚠️ Аномалии', presetDead: '💀 Мёртвые IP', presetFav: '⭐ Избранные',
        searchPh: 'Поиск... (/)',
        filterAll: 'Все серверы', filterOnline: 'Только онлайн', filterOffline: 'Только офлайн',
        filterFav: '⭐ Избранные', filterIcon: '🖼️ С иконкой', filterPlayers: '👥 С игроками',
        filterDiscord: '💬 С Discord', filterConf: '🎯 С высокой уверенностью', filterConflict: '⚠️ Спорные',
        tagAny: '🏷️ Любой тег', verAny: '🌐 Любая версия', countryAny: '🌍 Любая страна',
        sortStatus: 'Сортировка: по статусу', sortConf: '🎯 По уверенности', sortUptime: '📈 По uptime',
        sortFill: '🔥 По заполненности', sortPlayersDesc: 'Игроков: больше → меньше',
        sortPlayersAsc: 'Игроков: меньше → больше', sortNameAsc: 'Название: A → Z',
        sortNameDesc: 'Название: Z → A', sortVersion: 'По версии',
        btnRefresh: '🔄 Обновить всё', btnStop: '⏹ Стоп', btnShare: '🔗 Поделиться',
        btnCopyOnline: '📋 Онлайн', btnDiff: '🔀 Дифф', btnRename: '✏️ Имена',
        btnJson: '💾 JSON', btnCsv: '📊 CSV', btnHistory: '📜 История', btnCompare: '🔀 Сравнить',
        btnLog: '📋 Лог', btnProbes: '📡 Пробы', btnGeo: '🌍 Гео', btnCache: '🗑️ Кэш',
        statTotal: 'Всего', statOnline: 'Онлайн', statOffline: 'Офлайн',
        statPlayers: 'Игроков', statConf: 'Ср. уверенность', statDead: 'Мёртвых IP',
        loading: 'Загрузка серверов...', loadMore: '⬇️ Показать ещё', createdBy: 'создан',
        newBadge: '🆕 новый', deadBadge: '💀 мёртвый IP', liveOnline: 'Онлайн', liveOffline: 'Офлайн',
        liveChecking: 'Скан', wasOnline: '📅 Был онлайн:',
        uptime: 'Uptime:', uptimeScans: 'из', scansWord: 'сканов',
        playersWord: 'Игроков', versionWord: 'Версия', motdWord: 'MOTD', statusWord: 'Статус',
        addressWord: 'Адрес', nameWord: 'Название', uptimeWord: 'Uptime', iconWord: 'Иконка',
        refresh: 'Обновить', byCountry: 'Страна', byHost: 'Хостинг',
        diffTitle: '🔀 Диффы между загрузками', diffAdded: '➕ Новых', diffRemoved: '➖ Пропало',
        diffSame: '✅ Общих', diffEmpty: 'Нет данных для сравнения (это первая загрузка)',
        diffNoChange: 'Никаких изменений с прошлой загрузки',
        geoTitle: '🌍 Геолокация IP', geoLoading: 'Загружаю гео для', geoHosts: 'хостов...',
        geoEmpty: 'Нет данных. Нажмите «Гео» ещё раз или обновите',
        copyOnlineEmpty: '❌ Нет онлайн серверов',
        copyOnlineDone: '📋 Скопировано:',
        helpShortcuts: 'Горячие клавиши', helpFromFile: 'Горячие клавиши',
        historyEmpty: 'История пуста', logEmpty: 'Лог пуст',
        compareEmpty: 'Нужно минимум 2 сканирования',
        anomaliesTitle: '⚠️ Аномальные сервера',
        anomaliesEmpty: 'Аномалий не найдено 🎉',
        deadIPsTitle: '💀 Мёртвые IP',
        deadIPsEmpty: 'Мёртвых IP не обнаружено'
    },
    en: {
        subtitle: 'Custom Minecraft server scanner',
        infoStrong: 'Custom scan engine',
        infoText: 'parallel probes, cross-verification, median, retry with backoff.',
        infoSmall: 'Delay 1.5s · 2–3 probes per server · works offline (PWA)',
        spProgress: '⏳ Progress:', spAgree: '🎯 Probes agreement:', spLatency: '📡 Avg latency:',
        spVerified: '✅ Verified:', spConflicts: '⚠️ Conflicts:',
        scanning: '⏳ Scanning...',
        presetAll: '📋 All', presetOnlinePlayers: '🔥 Online + players', presetNew: '🆕 New',
        presetAnomalies: '⚠️ Anomalies', presetDead: '💀 Dead IPs', presetFav: '⭐ Favorites',
        searchPh: 'Search... (/)',
        filterAll: 'All servers', filterOnline: 'Online only', filterOffline: 'Offline only',
        filterFav: '⭐ Favorites', filterIcon: '🖼️ With icon', filterPlayers: '👥 With players',
        filterDiscord: '💬 With Discord', filterConf: '🎯 High confidence', filterConflict: '⚠️ Conflicts',
        tagAny: '🏷️ Any tag', verAny: '🌐 Any version', countryAny: '🌍 Any country',
        sortStatus: 'Sort: by status', sortConf: '🎯 By confidence', sortUptime: '📈 By uptime',
        sortFill: '🔥 By fill', sortPlayersDesc: 'Players: high → low',
        sortPlayersAsc: 'Players: low → high', sortNameAsc: 'Name: A → Z',
        sortNameDesc: 'Name: Z → A', sortVersion: 'By version',
        btnRefresh: '🔄 Refresh all', btnStop: '⏹ Stop', btnShare: '🔗 Share',
        btnCopyOnline: '📋 Online', btnDiff: '🔀 Diff', btnRename: '✏️ Rename',
        btnJson: '💾 JSON', btnCsv: '📊 CSV', btnHistory: '📜 History', btnCompare: '🔀 Compare',
        btnLog: '📋 Log', btnProbes: '📡 Probes', btnGeo: '🌍 Geo', btnCache: '🗑️ Cache',
        statTotal: 'Total', statOnline: 'Online', statOffline: 'Offline',
        statPlayers: 'Players', statConf: 'Avg confidence', statDead: 'Dead IPs',
        loading: 'Loading servers...', loadMore: '⬇️ Show more', createdBy: 'created by',
        newBadge: '🆕 new', deadBadge: '💀 dead IP', liveOnline: 'Online', liveOffline: 'Offline',
        liveChecking: 'Scan', wasOnline: '📅 Was online:',
        uptime: 'Uptime:', uptimeScans: 'of', scansWord: 'scans',
        playersWord: 'Players', versionWord: 'Version', motdWord: 'MOTD', statusWord: 'Status',
        addressWord: 'Address', nameWord: 'Name', uptimeWord: 'Uptime', iconWord: 'Icon',
        refresh: 'Refresh', byCountry: 'Country', byHost: 'Host',
        diffTitle: '🔀 Diff between loads', diffAdded: '➕ Added', diffRemoved: '➖ Removed',
        diffSame: '✅ Same', diffEmpty: 'No data to compare (first load)',
        diffNoChange: 'No changes since last load',
        geoTitle: '🌍 IP Geolocation', geoLoading: 'Loading geo for', geoHosts: 'hosts...',
        geoEmpty: 'No data. Click «Geo» again or refresh',
        copyOnlineEmpty: '❌ No online servers',
        copyOnlineDone: '📋 Copied:',
        helpShortcuts: 'Hotkeys', helpFromFile: 'Hotkeys',
        historyEmpty: 'History is empty', logEmpty: 'Log is empty',
        compareEmpty: 'At least 2 scans required',
        anomaliesTitle: '⚠️ Anomalous servers',
        anomaliesEmpty: 'No anomalies found 🎉',
        deadIPsTitle: '💀 Dead IPs',
        deadIPsEmpty: 'No dead IPs detected'
    }
};

let currentLang = localStorage.getItem(LS.lang) || 'ru';
function t(key) { return (I18N[currentLang] || I18N.ru)[key] || key; }

function applyLang() {
    document.querySelectorAll('[data-i18n]').forEach(el => {
        const key = el.getAttribute('data-i18n');
        const txt = t(key);
        if (txt && !el.querySelector('[data-i18n]')) el.textContent = txt;
    });
    document.querySelectorAll('[data-i18n-placeholder]').forEach(el => {
        const key = el.getAttribute('data-i18n-placeholder');
        const txt = t(key);
        if (txt) el.placeholder = txt;
    });
    const langBtn = document.getElementById('langToggle');
    if (langBtn) langBtn.textContent = currentLang === 'ru' ? '🇷🇺' : '🇬🇧';
    document.documentElement.lang = currentLang;
}

function toggleLang() {
    currentLang = currentLang === 'ru' ? 'en' : 'ru';
    localStorage.setItem(LS.lang, currentLang);
    applyLang();
    renderServers();
}

// ============================================================
//  ПРОБЫ
// ============================================================
const PROBES = [
    {
        id: 'mcsrvstat', name: 'mcsrvstat.us', role: 'primary',
        url: (h, p) => `https://api.mcsrvstat.us/3/${h}${p && p !== 25565 ? ':' + p : ''}`,
        headers: { 'User-Agent': `${APP_NAME}/4.0 (by ${APP_AUTHOR})` },
        parse: (d) => {
            if (!d || d.online === false || d.online === undefined) return { online: false };
            return {
                online: true, players: d.players?.online ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.version || '—',
                motd: d.motd?.clean ? d.motd.clean.join(' ') : '',
                icon: d.icon || null, playerList: d.players?.list || null
            };
        }
    },
    {
        id: 'mcstatus', name: 'mcstatus.io', role: 'secondary',
        url: (h, p) => `https://api.mcstatus.io/v2/status/java/${h}${p ? ':' + p : ''}`,
        headers: {},
        parse: (d) => {
            if (!d || d.online === false) return { online: false };
            return {
                online: true, players: d.players?.online ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.version ? (d.version.name_raw || d.version.name_clean || '—') : '—',
                motd: d.motd?.clean || '', icon: d.icon || null,
                playerList: d.players?.list || null
            };
        }
    },
    {
        id: 'mcapi', name: 'mcapi.us', role: 'tiebreaker',
        url: (h, p) => `https://mcapi.us/server/status?ip=${encodeURIComponent(h)}${p && p !== 25565 ? '&port=' + p : ''}`,
        headers: {},
        parse: (d) => {
            if (!d || d.status !== 'success' || d.online === false) return { online: false };
            return {
                online: true, players: d.players?.now ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.server?.name || '—', motd: d.motd || '',
                icon: d.favicon || null, playerList: d.players?.sample || null
            };
        }
    },
    {
        id: 'bedrock', name: 'mcsrvstat.us (bedrock)', role: 'bedrock',
        url: (h) => `https://api.mcsrvstat.us/bedrock/3/${h}:19132`,
        headers: { 'User-Agent': `${APP_NAME}/4.0 (by ${APP_AUTHOR})` },
        parse: (d) => {
            if (!d || d.online === false) return { online: false };
            return {
                online: true, players: d.players?.online ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.version || '—',
                motd: d.motd?.clean ? d.motd.clean.join(' ') : '',
                icon: null, playerList: null
            };
        }
    }
];

// ============================================================
//  ЯДРО СКАНЕРА
// ============================================================
class ServerScanner {
    constructor(config) {
        this.config = { ...SCANNER_CONFIG, ...config };
        this.cache = new Map();
        this.probeStats = new Map();
        this.events = {};
        this.aborted = false;
        this.running = false;
        this.deadIPs = new Set(lsGet(LS.deadIPs, []));
        PROBES.forEach(p => this.probeStats.set(p.id, { ok: 0, fail: 0, totalMs: 0 }));
    }
    on(evt, cb) { (this.events[evt] ||= []).push(cb); return this; }
    emit(evt, data) { (this.events[evt] || []).forEach(cb => { try { cb(data); } catch {} }); }

    async queryProbe(probe, address, port) {
        const t0 = performance.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.probeTimeoutMs);
        try {
            const url = probe.url(address, port);
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', ...probe.headers },
                signal: controller.signal, cache: 'no-store'
            });
            clearTimeout(timer);
            const ms = Math.round(performance.now() - t0);
            if (!res.ok) return { probeId: probe.id, probeName: probe.name, ok: false, error: `HTTP ${res.status}`, ms };
            const data = await res.json();
            const parsed = probe.parse(data);
            return { probeId: probe.id, probeName: probe.name, ok: true, data: parsed, ms };
        } catch (err) {
            clearTimeout(timer);
            return {
                probeId: probe.id, probeName: probe.name, ok: false,
                error: err.name === 'AbortError' ? 'timeout' : err.message,
                ms: Math.round(performance.now() - t0)
            };
        }
    }

    async probeWithRetry(probe, address, port) {
        let lastResult;
        for (let attempt = 0; attempt <= this.config.retryMax; attempt++) {
            const result = await this.queryProbe(probe, address, port);
            this.recordProbeStats(probe.id, result);
            if (result.ok) return result;
            lastResult = result;
            if (attempt < this.config.retryMax) {
                const backoff = this.config.retryBackoffMs[attempt] || 2000;
                await new Promise(r => setTimeout(r, backoff));
            }
        }
        return lastResult;
    }

    recordProbeStats(probeId, result) {
        const s = this.probeStats.get(probeId) || { ok: 0, fail: 0, totalMs: 0 };
        if (result.ok) s.ok++; else s.fail++;
        s.totalMs += result.ms;
        this.probeStats.set(probeId, s);
    }

    crossVerify(results) {
        const successful = results.filter(r => r.ok && r.data);
        const failed = results.filter(r => !r.ok);
        if (successful.length === 0) {
            return {
                online: false, confidence: 0, verified: false, conflict: false,
                probes: results.map(r => this.probeInfo(r)), reason: 'no_probe_succeeded'
            };
        }
        const onlineVotes = successful.filter(r => r.data.online).length;
        const offlineVotes = successful.length - onlineVotes;
        const decision = onlineVotes > offlineVotes ? true : offlineVotes > onlineVotes ? false : successful[0].data.online;
        const agreeing = successful.filter(r => !!r.data.online === decision);
        const disagreeing = successful.filter(r => !!r.data.online !== decision);
        const confidence = Math.round((agreeing.length / successful.length) * 100);
        const conflict = disagreeing.length > 0;
        const verified = successful.length >= 2 && agreeing.length >= 2;
        if (!decision) {
            return {
                online: false, confidence, verified, conflict,
                probes: results.map(r => this.probeInfo(r, decision)),
                agreeCount: agreeing.length, totalCount: successful.length
            };
        }
        const onlineData = agreeing.filter(r => r.data.online).map(r => r.data);
        const players = this.median(onlineData.map(d => d.players).filter(n => typeof n === 'number'));
        const maxPlayers = this.median(onlineData.map(d => d.maxPlayers).filter(n => typeof n === 'number'));
        const icon = onlineData.find(d => d.icon)?.icon || null;
        const version = onlineData.find(d => d.version && d.version !== '—')?.version || '—';
        const motd = onlineData.find(d => d.motd)?.motd || '';
        const playerList = onlineData.find(d => Array.isArray(d.playerList) && d.playerList.length > 0)?.playerList || null;
        return {
            online: true, players, maxPlayers, version, motd, icon, playerList,
            confidence, verified, conflict,
            probes: results.map(r => this.probeInfo(r, decision)),
            agreeCount: agreeing.length, totalCount: successful.length, failedCount: failed.length
        };
    }

    probeInfo(result, decision) {
        if (!result.ok) {
            return { id: result.probeId, name: result.probeName, status: 'failed', error: result.error, ms: result.ms };
        }
        const agrees = typeof decision === 'boolean' && (!!result.data.online === decision);
        return {
            id: result.probeId, name: result.probeName,
            status: typeof decision === 'boolean' ? (agrees ? 'agree' : 'disagree') : 'ok',
            online: result.data.online, ms: result.ms
        };
    }

    median(arr) {
        if (arr.length === 0) return null;
        const sorted = [...arr].sort((a, b) => a - b);
        const mid = Math.floor(sorted.length / 2);
        return sorted.length % 2 ? sorted[mid] : Math.round((sorted[mid - 1] + sorted[mid]) / 2);
    }

    async scanServer(server) {
        const key = `${server.address}:${server.port}`;
        const cached = this.cache.get(key);
        if (cached && (Date.now() - cached.t) < this.config.cacheTTL) {
            const result = { ...cached.result, fromCache: true };
            this.emit('server:scanned', { server, result });
            return result;
        }
        this.emit('server:scanning', { server });

        const primary = PROBES.find(p => p.role === 'primary');
        const secondary = PROBES.find(p => p.role === 'secondary');
        const tiebreaker = PROBES.find(p => p.role === 'tiebreaker');

        const [r1, r2] = await Promise.all([
            this.probeWithRetry(primary, server.address, server.port),
            this.probeWithRetry(secondary, server.address, server.port)
        ]);
        let allResults = [r1, r2];
        const bothOk = r1.ok && r2.ok;
        const agree = bothOk && !!r1.data.online === !!r2.data.online;
        if ((!bothOk || !agree) && tiebreaker) {
            const r3 = await this.probeWithRetry(tiebreaker, server.address, server.port);
            allResults.push(r3);
        }
        const verified = this.crossVerify(allResults);
        const result = { ...verified, scannedAt: Date.now() };
        this.cache.set(key, { t: Date.now(), result });
        this.emit('server:scanned', { server, result });
        return result;
    }

    async scanAll(servers) {
        if (this.running) return;
        this.running = true;
        this.aborted = false;
        const total = servers.length;
        let done = 0;
        this.emit('scan:start', { total });
        for (const server of servers) {
            if (this.aborted) break;
            try { await this.scanServer(server); }
            catch (err) { this.emit('server:error', { server, error: err.message }); }
            done++;
            this.emit('scan:progress', { done, total, server });
            if (done < total && !this.aborted) {
                await new Promise(r => setTimeout(r, this.config.delayMs));
            }
        }
        this.running = false;
        this.emit('scan:end', { done, total, aborted: this.aborted });
    }

    abort() { this.aborted = true; }
    clearCache() { this.cache.clear(); }
    getProbeStats() { return Object.fromEntries(this.probeStats); }
}

// ============================================================
//  СОСТОЯНИЕ
// ============================================================
let allServers = [];
let serverResults = {};
let scanner = null;
let currentFiltered = [];
let displayedCount = 0;
let renameMode = false;
let bedrockSupport = {};
let scanMetrics = { agreeSum: 0, agreeCount: 0, latencySum: 0, latencyCount: 0, conflicts: 0, verified: 0 };
let viewMode = localStorage.getItem(LS.view) || 'grid';
let currentPreset = 'all';
let newServersSet = new Set();
let serverDiff = null;
let geoCache = lsGet(LS.geo, {});
let expandedIPs = new Set(lsGet(LS.expandedIPs, []));

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
    if ((now - last) >= SCANNER_CONFIG.autoScanIntervalMs) return true;
    if (isWeekend()) {
        const ld = new Date(last).toDateString();
        const td = new Date().toDateString();
        if (ld !== td) return true;
    }
    return false;
}
function markScanned() { localStorage.setItem(LS.lastScan, String(Date.now())); }

function lsGet(key, fallback) {
    try { return JSON.parse(localStorage.getItem(key) || JSON.stringify(fallback)); }
    catch { return fallback; }
}
function lsSet(key, value) { localStorage.setItem(key, JSON.stringify(value)); }

const getFavorites = () => lsGet(LS.favorites, []);
const isFavorite = (k) => getFavorites().includes(k);
function toggleFavorite(k) {
    const f = getFavorites();
    const i = f.indexOf(k);
    if (i >= 0) f.splice(i, 1); else f.push(k);
    lsSet(LS.favorites, f);
    return isFavorite(k);
}

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
    if (min < 1) return currentLang === 'ru' ? 'только что' : 'just now';
    if (min < 60) return currentLang === 'ru' ? `${min} мин назад` : `${min}m ago`;
    const h = Math.floor(min / 60);
    if (h < 24) return currentLang === 'ru' ? `${h} ч назад` : `${h}h ago`;
    const days = Math.floor(h / 24);
    if (days < 30) return currentLang === 'ru' ? `${days} дн назад` : `${days}d ago`;
    return new Date(ts).toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
}

const getCustomNames = () => lsGet(LS.names, {});
function setCustomName(k, name) {
    const m = getCustomNames();
    if (name) m[k] = name; else delete m[k];
    lsSet(LS.names, m);
}
function getCustomName(k) { return getCustomNames()[k] || null; }

function notifEnabled() { return lsGet(LS.notif, false) === true; }
async function toggleNotifications() {
    if (notifEnabled()) {
        lsSet(LS.notif, false);
        showToast('🔔 ' + (currentLang === 'ru' ? 'Уведомления выключены' : 'Notifications off'));
        updateNotifBtn(); return;
    }
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { lsSet(LS.notif, true); showToast('🔔 On'); }
    updateNotifBtn();
}
function updateNotifBtn() {
    const btn = document.getElementById('notifToggle');
    if (!btn) return;
    btn.classList.toggle('active', notifEnabled());
    btn.textContent = notifEnabled() ? '🔔' : '🔕';
}
function notify(title, body) {
    if (!notifEnabled()) return;
    if (!('Notification' in window) || Notification.permission !== 'granted') return;
    try { new Notification(title, { body }); } catch {}
}

function applyTheme() {
    let theme = localStorage.getItem(LS.theme);
    if (!theme) theme = matchMedia('(prefers-color-scheme: light)').matches ? 'light' : 'dark';
    document.body.classList.toggle('light', theme === 'light');
    document.getElementById('themeToggle').textContent = theme === 'light' ? '☀️' : '🌙';
}
function toggleTheme() {
    const cur = document.body.classList.contains('light') ? 'light' : 'dark';
    localStorage.setItem(LS.theme, cur === 'light' ? 'dark' : 'light');
    applyTheme();
}

function applyAccent() {
    const colors = ['blue', 'green', 'orange', 'pink', 'purple'];
    colors.forEach(c => document.body.classList.remove('accent-' + c));
    const accent = localStorage.getItem(LS.accent) || 'blue';
    if (accent !== 'blue') document.body.classList.add('accent-' + accent);
    document.querySelectorAll('.accent-swatch').forEach(s => {
        s.classList.toggle('active', s.dataset.color === accent);
    });
}
function setAccent(color) {
    localStorage.setItem(LS.accent, color);
    applyAccent();
}

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

const TAG_KEYWORDS = {
    survival: ['survival', 'выживание', 'smp'],
    pvp: ['pvp', 'crystal pvp', 'кристал'],
    anarchy: ['anarchy', 'анархия', 'hvh'],
    skyblock: ['skyblock', 'скайблок', 'sky block'],
    creative: ['creative', 'креатив'],
    modded: ['modded', 'forge', 'fabric', 'neoforge', 'atm', 'cobblemon', 'create', 'gregtech'],
    vanilla: ['vanilla', 'ванилла', 'ванильный'],
    hardcore: ['hardcore', 'хардкор'],
    rpg: ['rpg', 'ролевая'],
    minigames: ['minigames', 'мини-игры', 'bedwars', 'skywars'],
    towny: ['towny', 'город'],
    factions: ['factions', 'кланы'],
    prison: ['prison', 'тюрьма'],
    bedrock: ['bedrock', 'бедрок', 'crossplay', 'cross-play']
};
function extractTags(motd, version) {
    const text = ((motd || '') + ' ' + (version || '')).toLowerCase();
    const tags = [];
    for (const [tag, kws] of Object.entries(TAG_KEYWORDS)) {
        if (kws.some(k => text.includes(k))) tags.push(tag);
    }
    return tags;
}

function extractDiscord(motd) {
    if (!motd) return null;
    const m = motd.match(/discord(?:\.gg|\.com\/invite|app\.com\/invite)\/([a-zA-Z0-9]+)/i);
    if (m) return `https://discord.gg/${m[1]}`;
    const m2 = motd.match(/discord\s*[:=]\s*(https?:\/\/\S+)/i);
    return m2 ? m2[1] : null;
}

const getLogs = () => lsGet(LS.logs, []);
function addLog(level, msg) {
    const logs = getLogs();
    logs.unshift({ t: Date.now(), level, msg: String(msg).slice(0, 300) });
    if (logs.length > LOGS_MAX) logs.length = LOGS_MAX;
    lsSet(LS.logs, logs);
}

const getHistory = () => lsGet(LS.history, []);
function saveHistory() {
    const snapshot = {
        t: Date.now(),
        total: allServers.length,
        online: allServers.filter(s => serverResults[serverKey(s)]?.online === true).length,
        servers: allServers.map(s => {
            const r = serverResults[serverKey(s)];
            return { k: serverKey(s), online: r?.online === true, players: r?.players ?? 0, confidence: r?.confidence ?? 0 };
        })
    };
    const h = getHistory();
    h.unshift(snapshot);
    if (h.length > HISTORY_MAX) h.length = HISTORY_MAX;
    lsSet(LS.history, h);
}

function getUptime(key) {
    const h = getHistory();
    if (h.length === 0) return null;
    let online = 0, total = 0;
    h.forEach(snap => {
        const s = snap.servers.find(x => x.k === key);
        if (s) { total++; if (s.online) online++; }
    });
    return total > 0 ? { percent: Math.round((online / total) * 100), online, total } : null;
}

// ---- Sparkline ----
function sparkline(key) {
    const h = getHistory().slice(0, 20).reverse();
    if (h.length < 2) return '';
    const points = h.map(snap => {
        const s = snap.servers.find(x => x.k === key);
        return s ? (s.online ? 1 : 0) : 0.5;
    });
    const w = 60, hh = 14;
    const step = w / Math.max(1, points.length - 1);
    let path = '';
    points.forEach((p, i) => {
        const x = i * step;
        const y = hh - 2 - p * (hh - 4);
        path += (i === 0 ? 'M' : 'L') + x.toFixed(1) + ',' + y.toFixed(1);
    });
    return `<svg class="sparkline" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}" aria-hidden="true">
        <path d="${path}" stroke="var(--accent)" stroke-width="1.5" fill="none"/>
    </svg>`;
}

// ---- Dead IPs ----
function computeDeadIPs() {
    const byIP = {};
    allServers.forEach(srv => {
        if (!byIP[srv.address]) byIP[srv.address] = { total: 0, online: 0 };
        byIP[srv.address].total++;
        const r = serverResults[serverKey(srv)];
        if (r?.online === true) byIP[srv.address].online++;
    });
    const dead = new Set();
    Object.entries(byIP).forEach(([ip, s]) => {
        if (s.total >= 3 && s.online === 0) dead.add(ip);
    });
    return { byIP, dead };
}
function getDeadIPsCount() {
    const { dead } = computeDeadIPs();
    return dead.size;
}

// ---- Diff ----
function computeServersDiff(currentServers) {
    const prev = lsGet(LS.lastServerList, null);
    const cur = currentServers.map(s => `${s.address}:${s.port}`);
    const curSet = new Set(cur);
    const result = { added: [], removed: [], same: 0 };
    if (prev && Array.isArray(prev)) {
        const prevSet = new Set(prev);
        result.added = cur.filter(k => !prevSet.has(k));
        result.removed = prev.filter(k => !curSet.has(k));
        result.same = cur.filter(k => prevSet.has(k)).length;
    }
    lsSet(LS.lastServerList, cur);
    return prev ? result : null;
}

// ---- Geo ----
async function fetchGeoForIPs(ips) {
    const result = { ...geoCache };
    const toFetch = ips.filter(ip => !result[ip]);
    if (toFetch.length === 0) return result;

    for (const ip of toFetch) {
        try {
            const res = await fetch(`https://ipwho.is/${ip}`);
            if (!res.ok) { result[ip] = { error: true }; continue; }
            const d = await res.json();
            if (d.success) {
                result[ip] = {
                    country: d.country || '',
                    countryCode: d.country_code || '',
                    city: d.city || '',
                    isp: d.connection?.isp || d.connection?.org || ''
                };
            } else {
                result[ip] = { error: true };
            }
        } catch { result[ip] = { error: true }; }
        await new Promise(r => setTimeout(r, 1100)); // rate limit ipwho.is
    }
    geoCache = result;
    lsSet(LS.geo, result);
    return result;
}

function countryFlag(code) {
    if (!code || code.length !== 2) return '';
    return String.fromCodePoint(...[...code.toUpperCase()].map(c => 0x1F1E6 + c.charCodeAt(0) - 65));
}

// ============================================================
//  URL PRESETS
// ============================================================
function readUrlParams() {
    const p = new URLSearchParams(location.search);
    const set = (id, val) => {
        const el = document.getElementById(id);
        if (el && val) el.value = val;
    };
    set('searchInput', p.get('q'));
    set('filterSelect', p.get('filter'));
    set('tagFilter', p.get('tag'));
    set('versionFilter', p.get('ver'));
    set('sortSelect', p.get('sort'));
    set('countryFilter', p.get('country'));
    if (p.get('pmin')) set('playersMin', p.get('pmin'));
    if (p.get('pmax')) set('playersMax', p.get('pmax'));
    if (p.get('view')) { viewMode = p.get('view'); }
}
function writeUrlParams() {
    const p = new URLSearchParams();
    const v = (id) => document.getElementById(id)?.value;
    if (v('searchInput')) p.set('q', v('searchInput'));
    if (v('filterSelect') && v('filterSelect') !== 'all') p.set('filter', v('filterSelect'));
    if (v('tagFilter')) p.set('tag', v('tagFilter'));
    if (v('versionFilter')) p.set('ver', v('versionFilter'));
    if (v('sortSelect') && v('sortSelect') !== 'status') p.set('sort', v('sortSelect'));
    if (v('countryFilter')) p.set('country', v('countryFilter'));
    if (v('playersMin') && v('playersMin') !== '0') p.set('pmin', v('playersMin'));
    if (v('playersMax') && v('playersMax') !== '10000') p.set('pmax', v('playersMax'));
    if (viewMode !== 'grid') p.set('view', viewMode);

    const newUrl = p.toString() ? `?${p}` : location.pathname;
    history.replaceState(null, '', newUrl);
}
function copyShareUrl() {
    navigator.clipboard.writeText(location.href).then(() => {
        showToast('🔗 ' + (currentLang === 'ru' ? 'Ссылка скопирована' : 'Link copied'));
    }).catch(() => showToast('❌'));
}

// ============================================================
//  SCANNER SETUP
// ============================================================
function createScanner() {
    const s = new ServerScanner();
    s.on('scan:start', ({ total }) => {
        addLog('ok', `Scan start: ${total} servers`);
        resetMetrics();
    });
    s.on('server:scanning', ({ server }) => {
        const key = serverKey(server);
        serverResults[key] = { ...(serverResults[key] || {}), _scanning: true };
        updateCard(key);
    });
    s.on('server:scanned', ({ server, result }) => {
        const key = serverKey(server);
        const prev = serverResults[key];
        serverResults[key] = result;
        if (typeof result.confidence === 'number') {
            scanMetrics.agreeSum += result.confidence;
            scanMetrics.agreeCount++;
        }
        if (result.probes) {
            result.probes.forEach(p => {
                if (typeof p.ms === 'number') {
                    scanMetrics.latencySum += p.ms;
                    scanMetrics.latencyCount++;
                }
            });
        }
        if (result.conflict) scanMetrics.conflicts++;
        if (result.verified) scanMetrics.verified++;
        if (prev && prev.online === true && result.online === false && isFavorite(key)) {
            notify('⚠️ Server down', key);
        }
        updateLastSeen(key, result.online);
        if (bedrockSupport[key] === undefined) {
            const bedrockProbe = PROBES.find(p => p.role === 'bedrock');
            scanner.queryProbe(bedrockProbe, server.address).then(bres => {
                bedrockSupport[key] = bres.ok && bres.data?.online === true;
                updateCard(key);
            });
        }
        updateCard(key);
        updateStats();
        updateScannerPanel();
    });
    return s;
}
function resetMetrics() {
    scanMetrics = { agreeSum: 0, agreeCount: 0, latencySum: 0, latencyCount: 0, conflicts: 0, verified: 0 };
}

function updateProgress(cur, total, name) {
    const c = document.getElementById('progressContainer');
    const f = document.getElementById('progressBarFill');
    const t = document.getElementById('progressText');
    const n = document.getElementById('progressCurrent');
    if (!c) return;
    if (cur === 0) { c.style.display = 'none'; return; }
    c.style.display = 'block';
    f.style.width = Math.round((cur / total) * 100) + '%';
    t.textContent = `${cur} / ${total}`;
    if (n && name) n.textContent = '→ ' + name;
}
function updateScannerPanel() {
    const panel = document.getElementById('scannerPanel');
    if (!panel) return;
    if (!scanner?.running && scanMetrics.agreeCount === 0) { panel.style.display = 'none'; return; }
    panel.style.display = 'grid';
    const avgAgree = scanMetrics.agreeCount > 0 ? Math.round(scanMetrics.agreeSum / scanMetrics.agreeCount) : 0;
    const avgLatency = scanMetrics.latencyCount > 0 ? Math.round(scanMetrics.latencySum / scanMetrics.latencyCount) : 0;
    const el = (id) => document.getElementById(id);
    if (el('spAgreement')) el('spAgreement').textContent = avgAgree + '%';
    if (el('spLatency')) el('spLatency').textContent = avgLatency + ' ms';
    if (el('spVerified')) el('spVerified').textContent = scanMetrics.verified;
    if (el('spConflicts')) el('spConflicts').textContent = scanMetrics.conflicts;
}

// ============================================================
//  LOAD
// ============================================================
async function loadServersFromJson() {
    try {
        const response = await fetch(SERVERS_JSON_PATH, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        if (!Array.isArray(data)) throw new Error('JSON must be array');

        allServers = data;
        serverResults = {};
        allServers.forEach(srv => {
            serverResults[serverKey(srv)] = { _scanning: true, online: null };
        });

        // Diff
        serverDiff = computeServersDiff(allServers);
        newServersSet = new Set(serverDiff?.added || []);

        hideError();
        renderServers();
        updateStats();

        // Если есть diff — показать тост
        if (serverDiff && (serverDiff.added.length > 0 || serverDiff.removed.length > 0)) {
            showToast(`🔀 +${serverDiff.added.length} / -${serverDiff.removed.length}`);
        }

        scanner = createScanner();
        startScan();
    } catch (err) {
        addLog('err', 'load: ' + err.message);
        showError(`Error loading servers.json: ${err.message}`);
        document.getElementById('serverGrid').innerHTML = `
            <div class="empty-state">❌ ${escapeHtml(err.message)}</div>`;
    }
}

async function startScan() {
    if (!scanner || scanner.running) return;
    const refreshBtn = document.getElementById('refreshBtn');
    const stopBtn = document.getElementById('stopBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = t('scanning');
    stopBtn.style.display = 'inline-block';
    document.getElementById('scannerPanel').style.display = 'grid';

    await scanner.scanAll(allServers);

    refreshBtn.disabled = false;
    refreshBtn.textContent = t('btnRefresh');
    stopBtn.style.display = 'none';
    markScanned();
    updateLastUpdate();
    updateProgress(0, 0);
    renderServers();
    updateStats();
    updateScannerPanel();
    saveHistory();
    playBeep();
    showToast(`✅ ${allServers.length} servers`);
    gtag('event', 'scan_complete', { total: allServers.length });
}

function updateCard(key) {
    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;
    if (viewMode === 'grid' || viewMode === 'grouped') {
        const card = document.querySelector(`.server-card[data-key="${CSS.escape(key)}"]`);
        if (!card) return;
        const temp = document.createElement('div');
        temp.innerHTML = cardHtml(srv);
        const newCard = temp.firstElementChild;
        card.replaceWith(newCard);
        bindSingleCardEvents(newCard);
    } else if (viewMode === 'table') {
        const row = document.querySelector(`tr[data-key="${CSS.escape(key)}"]`);
        if (!row) return;
        const temp = document.createElement('tbody');
        temp.innerHTML = tableRowHtml(srv);
        const newRow = temp.firstElementChild;
        row.replaceWith(newRow);
        bindTableRowEvents(newRow);
    }
}

// ============================================================
//  FILTER / SORT
// ============================================================
function getFilteredAndSorted() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const verFilter = document.getElementById('versionFilter').value;
    const countryFilter = document.getElementById('countryFilter').value;
    const sort = document.getElementById('sortSelect').value;
    const pMin = Number(document.getElementById('playersMin').value) || 0;
    const pMax = Number(document.getElementById('playersMax').value) || 10000;

    let result = allServers.filter(srv => {
        const key = serverKey(srv);
        const r = serverResults[key] || {};
        const online = r.online === true;
        const scanning = r._scanning && r.online == null;

        if (filter === 'online' && !online) return false;
        if (filter === 'offline' && (online || scanning)) return false;
        if (filter === 'favorites' && !isFavorite(key)) return false;
        if (filter === 'with-icon' && !r.icon) return false;
        if (filter === 'has-players' && !(r.players > 0)) return false;
        if (filter === 'discord' && !extractDiscord(r.motd || srv.motd)) return false;
        if (filter === 'confident' && !(r.confidence >= 90 && r.verified)) return false;
        if (filter === 'conflicts' && !r.conflict) return false;

        // Player range
        if (online) {
            const pl = r.players ?? 0;
            if (pl < pMin || pl > pMax) return false;
        }

        // Geo country
        if (countryFilter) {
            const geo = geoCache[srv.address];
            if (!geo || geo.countryCode !== countryFilter) return false;
        }

        if (tagFilter) {
            const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
            if (!tags.includes(tagFilter)) return false;
        }
        if (verFilter) {
            const v = String(r.version || srv.version || '');
            if (!v.includes(verFilter)) return false;
        }
        if (q) {
            const hay = [srv.address, String(srv.port), srv.motd || '', srv.version || '',
                        getCustomName(key) || '', r.motd || '', r.version || '']
                .join(' ').toLowerCase();
            if (!hay.includes(q)) return false;
        }
        return true;
    });

    const statusOrder = { online: 0, scanning: 1, offline: 2 };
    result.sort((a, b) => {
        const ra = serverResults[serverKey(a)] || {};
        const rb = serverResults[serverKey(b)] || {};
        const favA = isFavorite(serverKey(a)) ? 0 : 1;
        const favB = isFavorite(serverKey(b)) ? 0 : 1;
        if (favA !== favB) return favA - favB;
        const sa = ra.online == null ? 'scanning' : (ra.online ? 'online' : 'offline');
        const sb = rb.online == null ? 'scanning' : (rb.online ? 'online' : 'offline');
        const fill = (r) => {
            if (r.players == null || !r.maxPlayers) return -1;
            return r.players / r.maxPlayers;
        };
        switch (sort) {
            case 'confidence-desc': return (rb.confidence ?? -1) - (ra.confidence ?? -1);
            case 'uptime-desc': {
                const ua = getUptime(serverKey(a))?.percent ?? -1;
                const ub = getUptime(serverKey(b))?.percent ?? -1;
                return ub - ua;
            }
            case 'fill-desc': return fill(rb) - fill(ra);
            case 'players-desc': return (rb.players ?? -1) - (ra.players ?? -1);
            case 'players-asc': return (ra.players ?? 999999) - (rb.players ?? 999999);
            case 'name-asc': return getTitle(a).toLowerCase().localeCompare(getTitle(b).toLowerCase());
            case 'name-desc': return getTitle(b).toLowerCase().localeCompare(getTitle(a).toLowerCase());
            case 'version': {
                const va = (ra.version || a.version || '').toLowerCase();
                const vb = (rb.version || b.version || '').toLowerCase();
                return va.localeCompare(vb);
            }
            default:
                return (statusOrder[sa] ?? 3) - (statusOrder[sb] ?? 3);
        }
    });

    return result;
}

function getTitle(srv) {
    const key = serverKey(srv);
    const custom = getCustomName(key);
    if (custom) return custom;
    const r = serverResults[key] || {};
    let src = srv.motd || '';
    if (r.motd) src = r.motd;
    return stripMinecraftColors(src.split('\n')[0]) || (currentLang === 'ru' ? 'Без названия' : 'Untitled');
}

// ============================================================
//  RENDER
// ============================================================
function renderServers(resetPagination = true) {
    const grid = document.getElementById('serverGrid');
    currentFiltered = getFilteredAndSorted();
    if (resetPagination) displayedCount = PAGE_SIZE;

    const visible = currentFiltered.slice(0, displayedCount);

    if (visible.length === 0) {
        grid.innerHTML = `<div class="empty-state">${t('loading')}</div>`;
        document.getElementById('loadMoreWrap').style.display = 'none';
        return;
    }

    if (viewMode === 'table') {
        renderTable(visible);
    } else if (viewMode === 'grouped') {
        renderGrouped(visible);
    } else {
        renderGrid(visible);
    }

    const wrap = document.getElementById('loadMoreWrap');
    if (currentFiltered.length > displayedCount) {
        wrap.style.display = 'block';
        document.getElementById('loadMoreCount').textContent = `(${currentFiltered.length - displayedCount})`;
    } else {
        wrap.style.display = 'none';
    }
}

function renderGrid(servers) {
    const grid = document.getElementById('serverGrid');
    grid.className = 'server-grid';
    grid.innerHTML = servers.map(cardHtml).join('');
    bindCardEvents(grid);
}

function renderGrouped(servers) {
    const grid = document.getElementById('serverGrid');
    grid.className = 'server-grid';
    const groups = {};
    servers.forEach(srv => {
        if (!groups[srv.address]) groups[srv.address] = [];
        groups[srv.address].push(srv);
    });
    const { dead, byIP } = computeDeadIPs();

    let html = '';
    Object.entries(groups).sort((a, b) => {
        const [ipA] = a, [ipB] = b;
        return ipA.localeCompare(ipB, undefined, { numeric: true });
    }).forEach(([ip, list]) => {
        const stats = byIP[ip] || { total: list.length, online: 0 };
        const isDead = dead.has(ip);
        const expanded = expandedIPs.has(ip);
        const geo = geoCache[ip];
        const flag = geo && !geo.error ? countryFlag(geo.countryCode) : '';
        const geoText = geo && !geo.error ? ` ${flag} ${geo.city || geo.country || ''}` : '';

        html += `
            <div class="ip-group ${expanded ? 'expanded' : ''}" data-ip="${escapeHtml(ip)}">
                <div class="ip-group-header">
                    <span class="ip-group-arrow">▶</span>
                    <span class="ip-group-ip">${escapeHtml(ip)}${geoText ? `<span style="color:var(--text-mute);font-weight:400;font-size:0.8rem;">${escapeHtml(geoText)}</span>` : ''}</span>
                    <div class="ip-group-stats">
                        <span>📦 ${stats.total}</span>
                        <span class="ok">✅ ${stats.online}</span>
                        <span class="bad">❌ ${stats.total - stats.online}</span>
                        ${isDead ? `<span class="dead-badge">💀 ${t('deadBadge')}</span>` : ''}
                    </div>
                </div>
                <div class="ip-group-body">
                    ${list.map(cardHtml).join('')}
                </div>
            </div>
        `;
    });
    grid.innerHTML = html;

    // Toggle expand
    grid.querySelectorAll('.ip-group-header').forEach(h => {
        h.addEventListener('click', () => {
            const g = h.parentElement;
            const ip = g.getAttribute('data-ip');
            if (g.classList.toggle('expanded')) expandedIPs.add(ip);
            else expandedIPs.delete(ip);
            lsSet(LS.expandedIPs, [...expandedIPs]);
        });
    });
    grid.querySelectorAll('.server-card').forEach(bindSingleCardEvents);
}

function renderTable(servers) {
    const grid = document.getElementById('serverGrid');
    grid.className = '';
    let html = `
        <div class="server-table-wrap">
        <table class="server-table">
            <thead><tr>
                <th>${t('iconWord')}</th>
                <th>${t('addressWord')}</th>
                <th>${t('statusWord')}</th>
                <th>${t('playersWord')}</th>
                <th>${t('versionWord')}</th>
                <th>${t('nameWord')}</th>
                <th>${t('uptimeWord')}</th>
                <th>⭐</th>
            </tr></thead>
            <tbody>
    `;
    html += servers.map(tableRowHtml).join('');
    html += '</tbody></table></div>';
    grid.innerHTML = html;
    grid.querySelectorAll('tbody tr').forEach(bindTableRowEvents);
}

function tableRowHtml(srv) {
    const key = serverKey(srv);
    const r = serverResults[key] || {};
    const scanning = r.online == null || r._scanning;
    const online = r.online === true;
    const offline = r.online === false;
    const status = scanning ? 'checking' : (online ? 'online' : 'offline');
    const statusText = { online: t('liveOnline'), offline: t('liveOffline'), checking: t('liveChecking') }[status];
    const fav = isFavorite(key);
    const title = getTitle(srv);
    const players = r.players ?? (online ? 0 : '—');
    const maxPlayers = r.maxPlayers ?? (online ? 0 : '—');
    const version = r.version || srv.version || '—';
    const uptime = getUptime(key);
    const uptimeText = uptime ? `${uptime.percent}% (${uptime.online}/${uptime.total})` : '—';
    const geo = geoCache[srv.address];
    const flag = geo && !geo.error ? countryFlag(geo.countryCode) : '';

    let iconHtml = '⛏';
    if (online && r.icon) {
        iconHtml = `<img class="tbl-icon" src="${escapeHtml(r.icon)}" loading="lazy" onerror="this.outerHTML='⛏'">`;
    } else {
        iconHtml = `<span style="font-size:1.2rem;">⛏</span>`;
    }

    return `
        <tr data-key="${escapeHtml(key)}" class="row-${status}">
            <td>${iconHtml}</td>
            <td class="tbl-addr">${flag ? flag + ' ' : ''}${escapeHtml(srv.address)}:${srv.port}</td>
            <td><span class="tbl-badge ${status}">${statusText}</span></td>
            <td class="tbl-players">${escapeHtml(String(players))} / ${escapeHtml(String(maxPlayers))}</td>
            <td>${escapeHtml(String(version))}</td>
            <td class="tbl-name">${escapeHtml(title)}</td>
            <td>${escapeHtml(uptimeText)}</td>
            <td style="cursor:pointer;color:${fav ? '#fbbf24' : 'var(--text-mute)'};font-size:1.1rem;" class="tbl-fav">${fav ? '★' : '☆'}</td>
        </tr>
    `;
}

function bindTableRowEvents(row) {
    const key = row.getAttribute('data-key');
    if (!key) return;
    row.addEventListener('click', (e) => {
        const favCell = e.target.closest('.tbl-fav');
        if (favCell) {
            e.stopPropagation();
            const nowFav = toggleFavorite(key);
            favCell.textContent = nowFav ? '★' : '☆';
            favCell.style.color = nowFav ? '#fbbf24' : 'var(--text-mute)';
            showToast(nowFav ? '⭐' : '☆');
            return;
        }
        const srv = allServers.find(s => serverKey(s) === key);
        if (srv) {
            navigator.clipboard.writeText(key).then(() => showToast('📋 ' + key)).catch(() => {});
        }
    });
}

function cardHtml(srv) {
    const key = serverKey(srv);
    const r = serverResults[key] || {};
    const scanning = r.online == null || r._scanning;
    const online = r.online === true;
    const offline = r.online === false;
    const status = scanning ? 'checking' : (online ? 'online' : 'offline');
    const conflictClass = r.conflict ? ' conflict' : '';
    const isNew = newServersSet.has(key) ? ' is-new' : '';
    const { dead } = computeDeadIPs();
    const deadClass = dead.has(srv.address) ? ' is-dead-ip' : '';

    const fav = isFavorite(key);
    const customName = getCustomName(key);
    const title = getTitle(srv);
    const isCustom = !!customName;

    const statusLabels = { online: t('liveOnline'), offline: t('liveOffline'), checking: t('liveChecking') };

    let motdText = r.motd || stripMinecraftColors(srv.motd || '') || '—';
    const players = r.players ?? (online ? (srv.players_online ?? 0) : '—');
    const maxPlayers = r.maxPlayers ?? (online ? (srv.players_max ?? 0) : '—');
    const version = r.version || srv.version || '—';

    let playerBar = '';
    if (online && typeof players === 'number' && typeof maxPlayers === 'number' && maxPlayers > 0) {
        const p = Math.min(100, Math.round((players / maxPlayers) * 100));
        playerBar = `<div class="player-bar"><div class="player-bar-fill" style="width:${p}%"></div></div>`;
    }

    let iconHtml = '<span class="icon-placeholder">⛏</span>';
    if (online && r.icon) {
        iconHtml = `<img src="${escapeHtml(r.icon)}" alt="" loading="lazy" onerror="this.parentElement.innerHTML='<span class=\\'icon-placeholder\\'>⛏</span>'">`;
    }

    let probesHtml = '';
    if (Array.isArray(r.probes) && r.probes.length > 0) {
        probesHtml = `<div class="probe-chips">${r.probes.map(p => {
            const cls = p.status === 'agree' ? 'agree' : p.status === 'disagree' ? 'disagree' : p.status === 'failed' ? 'failed' : '';
            const tip = `${p.name}: ${p.status === 'failed' ? 'error ' + (p.error || '') : (p.online ? 'online' : 'offline')} (${p.ms} ms)`;
            return `<div class="probe-chip ${cls}" title="${escapeHtml(tip)}"></div>`;
        }).join('')}</div>`;
    } else if (scanning) {
        probesHtml = `<div class="probe-chips"><div class="probe-chip checking"></div><div class="probe-chip checking"></div></div>`;
    }

    let confHtml = '';
    if (typeof r.confidence === 'number' && !scanning) {
        const cls = r.confidence >= 90 ? 'high' : r.confidence >= 60 ? 'medium' : 'low';
        confHtml = `
            <div class="confidence-bar" title="Confidence: ${r.confidence}%">
                <div class="bar"><div class="fill ${cls}" style="width:${r.confidence}%"></div></div>
                <span>${r.confidence}%</span>
            </div>`;
    }

    const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
    const discord = extractDiscord(r.motd || srv.motd);
    const hasBedrock = bedrockSupport[key] === true;

    let tagsHtml = '';
    if (tags.length > 0 || discord || hasBedrock || isNew) {
        const els = tags.map(tag => `<span class="tag">${tag}</span>`);
        if (discord) els.push(`<span class="tag discord">💬 Discord</span>`);
        if (hasBedrock) els.push(`<span class="tag bedrock">Bedrock</span>`);
        if (isNew) els.push(`<span class="tag new">${t('newBadge')}</span>`);
        tagsHtml = `<div class="tags">${els.join('')}</div>`;
    }

    // Uptime
    const uptime = getUptime(key);
    let uptimeHtml = '';
    if (uptime) {
        uptimeHtml = `
            <div class="uptime-row" title="${uptime.online} ${t('uptimeScans')} ${uptime.total} ${t('scansWord')}">
                <span>${t('uptime')} ${uptime.percent}%</span>
                <div class="bar-wrap"><div class="bar-fill" style="width:${uptime.percent}%"></div></div>
                ${sparkline(key)}
            </div>`;
    }

    let lastSeenHtml = '';
    if (offline && !scanning) {
        const ts = getLastSeen(key);
        if (ts) lastSeenHtml = `<div class="last-seen">${t('wasOnline')} ${formatLastSeen(ts)}</div>`;
    }

    const hasPlayerList = online && Array.isArray(r.playerList) && r.playerList.length > 0;
    const pcClass = hasPlayerList ? 'player-count clickable' : 'player-count';

    // Geo flag
    const geo = geoCache[srv.address];
    const geoFlag = geo && !geo.error ? `<span class="geo-flag" title="${escapeHtml((geo.city || '') + (geo.country ? ', ' + geo.country : '') + (geo.isp ? ' · ' + geo.isp : ''))}">${countryFlag(geo.countryCode)}</span>` : '';

    return `
        <div class="server-card ${status}${conflictClass}${isNew}${deadClass} ${fav ? 'is-favorite' : ''}" data-key="${escapeHtml(key)}">
            <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${escapeHtml(key)}" title="Fav">${fav ? '★' : '☆'}</button>
            <div class="card-main">
                <div class="server-icon">${iconHtml}</div>
                <div class="card-content">
                    <div class="card-header">
                        <div class="server-name ${isCustom ? 'custom' : ''}" data-name="${escapeHtml(key)}">${escapeHtml(title)}</div>
                        <div>
                            <div class="status-badge ${status}">
                                ${scanning ? '<span class="loading-spinner"></span>' : ''}
                                ${statusLabels[status] || status}
                            </div>
                            ${probesHtml}
                        </div>
                    </div>
                    <div class="server-address" data-address="${escapeHtml(key)}" title="Click to copy, Shift+click for QR">
                        ${geoFlag}${escapeHtml(srv.address)}:${srv.port}
                        <span class="copy-hint">📋</span>
                    </div>
                    <div class="server-motd">${escapeHtml(motdText)}</div>
                    ${tagsHtml}
                    ${uptimeHtml}
                    ${lastSeenHtml}
                    <div class="card-footer">
                        <div class="${pcClass}" data-players="${escapeHtml(key)}">
                            👥 <span class="count">${escapeHtml(String(players))}</span> / ${escapeHtml(String(maxPlayers))}
                            ${playerBar}
                        </div>
                        <div class="version-tag" title="${escapeHtml(String(version))}">${escapeHtml(String(version))}</div>
                    </div>
                    ${confHtml}
                </div>
            </div>
        </div>
    `;
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
        showToast(nowFav ? '⭐' : '☆');
    });

    const addr = card.querySelector('.server-address');
    if (addr) addr.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = addr.getAttribute('data-address');
        if (e.shiftKey) { openQrModal(key); return; }
        try {
            await navigator.clipboard.writeText(key);
            addr.classList.add('copied');
            showToast('📋 ' + key);
            setTimeout(() => addr.classList.remove('copied'), 1200);
        } catch {}
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
            const cur = getCustomName(key) || '';
            const newName = prompt('New name for ' + key + ':', cur);
            if (newName !== null) {
                setCustomName(key, newName.trim() || null);
                renderServers(false);
            }
        }
    });
}

function bindCardEvents(container) {
    container.querySelectorAll('.server-card').forEach(bindSingleCardEvents);
}

// ============================================================
//  PRESETS
// ============================================================
function applyPreset(name) {
    currentPreset = name;
    document.querySelectorAll('.preset-btn').forEach(b => {
        b.classList.toggle('active', b.dataset.preset === name);
    });

    const $ = (id) => document.getElementById(id);
    // Reset
    $('filterSelect').value = 'all';
    $('tagFilter').value = '';
    $('versionFilter').value = '';
    $('countryFilter').value = '';
    $('playersMin').value = '0';
    $('playersMax').value = '10000';
    $('searchInput').value = '';

    switch (name) {
        case 'online-players':
            $('filterSelect').value = 'has-players';
            break;
        case 'new':
            $('filterSelect').value = 'all';
            // Показывать только новые — через специальный фильтр ниже
            showOnlyNew = true;
            break;
        case 'anomalies':
            openAnomaliesModal();
            $('filterSelect').value = 'all';
            break;
        case 'dead-ips':
            openDeadIPsModal();
            $('filterSelect').value = 'all';
            break;
        case 'favorites':
            $('filterSelect').value = 'favorites';
            break;
    }
    showOnlyNew = (name === 'new');
    renderServers();
    writeUrlParams();
}

let showOnlyNew = false;

// ============================================================
//  MODALS
// ============================================================
function openModal(title, html) {
    document.getElementById('modalTitle').textContent = title;
    document.getElementById('modalBody').innerHTML = html;
    document.getElementById('modalBackdrop').classList.add('show');
}
function closeModal() { document.getElementById('modalBackdrop').classList.remove('show'); }

function openPlayerModal(key) {
    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;
    const r = serverResults[key] || {};
    const list = r.playerList || [];
    let html;
    if (list.length === 0) html = '<div class="modal-empty">—</div>';
    else html = list.map(p => {
        const name = typeof p === 'string' ? p : (p.name || p.name_clean || 'unknown');
        const uuid = typeof p === 'object' ? (p.id || p.uuid || '') : '';
        return `<div class="player-item"><span>${escapeHtml(name)}</span>${uuid ? `<span style="color:var(--text-mute);font-size:0.7rem;margin-left:auto;">${escapeHtml(uuid)}</span>` : ''}</div>`;
    }).join('');
    openModal(`👥 ${srv.address}:${srv.port}`, html);
}

function openQrModal(key) {
    const srv = allServers.find(s => serverKey(s) === key);
    if (!srv) return;
    const qrUrl = `https://api.qrserver.com/v1/create-qr-code/?size=220x220&data=${encodeURIComponent(key)}`;
    openModal(`QR — ${srv.address}:${srv.port}`,
        `<div class="qr-wrap"><img src="${qrUrl}" alt="QR" width="220" height="220"><p style="margin-top:14px;font-family:monospace;color:var(--text-dim);">${escapeHtml(key)}</p></div>`);
}

function openLogModal() {
    const logs = getLogs();
    let html;
    if (logs.length === 0) html = `<div class="modal-empty">${t('logEmpty')}</div>`;
    else html = logs.slice(0, 100).map(l => {
        const time = new Date(l.t).toLocaleTimeString();
        return `<div class="log-item ${l.level}"><span class="time">${time}</span><span>${escapeHtml(l.msg)}</span></div>`;
    }).join('');
    openModal('📋 ' + t('btnLog'), html);
}

function openHistoryModal() {
    const h = getHistory();
    let html;
    if (h.length === 0) html = `<div class="modal-empty">${t('historyEmpty')}</div>`;
    else html = h.map(snap => {
        const date = new Date(snap.t).toLocaleString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
        return `<div class="history-item"><span>${date}</span><span style="margin-left:auto;color:var(--accent);">${snap.online} / ${snap.total}</span></div>`;
    }).join('');
    openModal('📜 ' + t('btnHistory'), html);
}

function openCompareModal() {
    const h = getHistory();
    if (h.length < 2) { openModal('🔀', `<div class="modal-empty">${t('compareEmpty')}</div>`); return; }
    const cur = h[0], prev = h[1];
    const prevMap = {};
    prev.servers.forEach(s => prevMap[s.k] = s);
    const changes = [];
    cur.servers.forEach(s => {
        const p = prevMap[s.k];
        if (!p) return;
        if (p.online !== s.online) changes.push({ k: s.k, text: s.online ? '⬆️ online' : '⬇️ offline', level: s.online ? 'ok' : 'err' });
        else if (s.online && Math.abs(s.players - p.players) >= 3) {
            const diff = s.players - p.players;
            changes.push({ k: s.k, text: `${diff > 0 ? '📈' : '📉'} ${p.players} → ${s.players}`, level: 'warn' });
        }
    });
    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">${new Date(prev.t).toLocaleString()} → ${new Date(cur.t).toLocaleString()}</div>`;
    if (changes.length === 0) html += '<div class="modal-empty">—</div>';
    else html += changes.map(c => `<div class="log-item ${c.level}"><span style="flex:1;font-family:monospace;font-size:0.78rem;">${escapeHtml(c.k)}</span><span>${escapeHtml(c.text)}</span></div>`).join('');
    openModal('🔀 ' + t('btnCompare'), html);
}

function openDiffModal() {
    let html = '';
    if (!serverDiff) {
        html = `<div class="modal-empty">${t('diffEmpty')}</div>`;
    } else {
        html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">
            <b>${t('diffAdded')}:</b> ${serverDiff.added.length} · 
            <b>${t('diffRemoved')}:</b> ${serverDiff.removed.length} · 
            <b>${t('diffSame')}:</b> ${serverDiff.same}
        </div>`;
        if (serverDiff.added.length === 0 && serverDiff.removed.length === 0) {
            html += `<div class="modal-empty">${t('diffNoChange')}</div>`;
        } else {
            serverDiff.added.forEach(k => {
                html += `<div class="diff-row added">➕ ${escapeHtml(k)}</div>`;
            });
            serverDiff.removed.forEach(k => {
                html += `<div class="diff-row removed">➖ ${escapeHtml(k)}</div>`;
            });
        }
    }
    openModal(t('diffTitle'), html);
}

function openProbeStatsModal() {
    const stats = scanner?.getProbeStats() || {};
    const probeList = PROBES.filter(p => p.role !== 'bedrock');
    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">${t('btnProbes')}</div>`;
    html += probeList.map(p => {
        const s = stats[p.id] || { ok: 0, fail: 0, totalMs: 0 };
        const total = s.ok + s.fail;
        const avgMs = total > 0 ? Math.round(s.totalMs / total) : 0;
        const rate = total > 0 ? Math.round((s.ok / total) * 100) : 0;
        return `<div class="probe-row">
            <span class="probe-name">${escapeHtml(p.name)}</span>
            <span class="probe-stat">✅ <b>${s.ok}</b></span>
            <span class="probe-stat">❌ <b>${s.fail}</b></span>
            <span class="probe-stat">⚡ <b>${avgMs} ms</b></span>
            <span class="probe-stat" style="margin-left:auto;color:var(--accent);"><b>${rate}%</b></span>
        </div>`;
    }).join('');
    openModal('📡 ' + t('btnProbes'), html);
}

function openGeoModal() {
    const ips = [...new Set(allServers.map(s => s.address))];
    const hasData = ips.filter(ip => geoCache[ip] && !geoCache[ip].error).length;
    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">
        ${hasData} / ${ips.length} ${t('geoHosts')}</div>`;
    ips.sort().forEach(ip => {
        const g = geoCache[ip];
        if (g && !g.error) {
            const flag = countryFlag(g.countryCode);
            html += `<div class="geo-row">
                <span class="ip">${escapeHtml(ip)}</span>
                <span>${flag} ${escapeHtml(g.country)}</span>
                <span style="color:var(--text-mute);">${escapeHtml(g.city || '')}</span>
                <span style="margin-left:auto;color:var(--text-dim);font-size:0.75rem;">${escapeHtml(g.isp || '')}</span>
            </div>`;
        } else if (g && g.error) {
            html += `<div class="geo-row"><span class="ip">${escapeHtml(ip)}</span><span style="color:var(--text-mute);">—</span></div>`;
        } else {
            html += `<div class="geo-row"><span class="ip">${escapeHtml(ip)}</span><span style="color:var(--text-mute);">—</span></div>`;
        }
    });
    openModal('🌍 ' + t('geoTitle'), html);
}

async function loadGeo() {
    const ips = [...new Set(allServers.map(s => s.address))];
    const missing = ips.filter(ip => !geoCache[ip]);
    if (missing.length === 0) {
        openGeoModal();
        updateCountryFilter();
        return;
    }
    showToast(`🌍 ${t('geoLoading')} ${missing.length} ${t('geoHosts')}`);
    await fetchGeoForIPs(ips);
    updateCountryFilter();
    openGeoModal();
    renderServers(false);
    showToast('🌍 OK');
}

function updateCountryFilter() {
    const sel = document.getElementById('countryFilter');
    if (!sel) return;
    const countries = new Map();
    Object.values(geoCache).forEach(g => {
        if (g && !g.error && g.countryCode) {
            countries.set(g.countryCode, g.country || g.countryCode);
        }
    });
    const cur = sel.value;
    sel.innerHTML = `<option value="">${t('countryAny')}</option>`;
    [...countries.entries()].sort((a,b) => a[1].localeCompare(b[1])).forEach(([code, name]) => {
        const opt = document.createElement('option');
        opt.value = code;
        opt.textContent = countryFlag(code) + ' ' + name;
        sel.appendChild(opt);
    });
    sel.value = cur;
}

function openAnomaliesModal() {
    const anomalies = allServers.filter(srv => {
        const r = serverResults[serverKey(srv)];
        if (!r || r.online !== true) return false;
        if (r.players != null && r.maxPlayers != null && r.players > r.maxPlayers) return true;
        if (r.players != null && r.players < 0) return true;
        return false;
    });
    let html;
    if (anomalies.length === 0) html = `<div class="modal-empty">${t('anomaliesEmpty')}</div>`;
    else html = anomalies.map(srv => {
        const r = serverResults[serverKey(srv)];
        return `<div class="diff-row players">⚠️ ${escapeHtml(serverKey(srv))} — ${r.players} / ${r.maxPlayers}</div>`;
    }).join('');
    openModal(t('anomaliesTitle'), html);
}

function openDeadIPsModal() {
    const { dead, byIP } = computeDeadIPs();
    let html;
    if (dead.size === 0) html = `<div class="modal-empty">${t('deadIPsEmpty')}</div>`;
    else html = [...dead].sort().map(ip => {
        const s = byIP[ip];
        return `<div class="diff-row down">💀 ${escapeHtml(ip)} — 0 / ${s.total}</div>`;
    }).join('');
    openModal(t('deadIPsTitle'), html);
}

async function copyOnlineList() {
    const online = currentFiltered.filter(srv => serverResults[serverKey(srv)]?.online === true);
    if (online.length === 0) { showToast(t('copyOnlineEmpty')); return; }
    const list = online.map(srv => `${srv.address}:${srv.port}`).join('\n');
    try {
        await navigator.clipboard.writeText(list);
        showToast(`${t('copyOnlineDone')} ${online.length}`);
    } catch { showToast('❌'); }
}

function openHelpModal() {
    const shortcuts = [
        ['/', currentLang === 'ru' ? 'Фокус на поиск' : 'Focus search'],
        ['Esc', currentLang === 'ru' ? 'Закрыть модалку' : 'Close modal'],
        ['R', currentLang === 'ru' ? 'Перезапустить сканирование' : 'Rescan'],
        ['T', currentLang === 'ru' ? 'Тема' : 'Theme'],
        ['E', currentLang === 'ru' ? 'Экспорт JSON' : 'Export JSON'],
        ['C', currentLang === 'ru' ? 'Экспорт CSV' : 'Export CSV'],
        ['H', currentLang === 'ru' ? 'История' : 'History'],
        ['L', currentLang === 'ru' ? 'Лог' : 'Log'],
        ['P', currentLang === 'ru' ? 'Пробы' : 'Probes'],
        ['G', currentLang === 'ru' ? 'Гео' : 'Geo'],
        ['D', currentLang === 'ru' ? 'Дифф' : 'Diff'],
        ['Shift+Click address', 'QR'],
        ['Click address', 'Copy'],
        ['Click players', currentLang === 'ru' ? 'Список игроков' : 'Player list']
    ];
    const html = shortcuts.map(([k, d]) =>
        `<div class="shortcut-row"><span>${escapeHtml(d)}</span><span class="kbd">${escapeHtml(k)}</span></div>`
    ).join('');
    openModal('❓ ' + t('helpShortcuts'), html);
}

// ============================================================
//  STATS
// ============================================================
function updateStats() {
    let online = 0, offline = 0, players = 0, confSum = 0, confCount = 0;
    allServers.forEach(srv => {
        const r = serverResults[serverKey(srv)];
        if (!r) return;
        if (r.online === true) {
            online++;
            players += (r.players ?? 0);
            if (typeof r.confidence === 'number') { confSum += r.confidence; confCount++; }
        } else if (r.online === false) {
            offline++;
            if (typeof r.confidence === 'number') { confSum += r.confidence; confCount++; }
        }
    });
    const total = allServers.length;
    document.getElementById('totalCount').textContent = total;
    document.getElementById('onlineCount').textContent = online;
    document.getElementById('offlineCount').textContent = offline;
    document.getElementById('playersTotal').textContent = players;
    document.getElementById('avgConfidence').textContent = confCount > 0 ? Math.round(confSum / confCount) + '%' : '—';
    document.getElementById('deadIpsCount').textContent = getDeadIPsCount();
}

function updateLastUpdate() {
    const el = document.getElementById('lastUpdate');
    if (!el) return;
    const last = Number(localStorage.getItem(LS.lastScan) || Date.now());
    const d = new Date(last);
    el.textContent = (currentLang === 'ru' ? 'Последнее сканирование: ' : 'Last scan: ') +
        d.toLocaleDateString(currentLang === 'ru' ? 'ru-RU' : 'en-US') + ' ' +
        d.toLocaleTimeString(currentLang === 'ru' ? 'ru-RU' : 'en-US');
}

// ============================================================
//  EXPORT
// ============================================================
function buildExportData() {
    return allServers.map(srv => {
        const key = serverKey(srv);
        const r = serverResults[key] || {};
        const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
        const geo = geoCache[srv.address] || {};
        return {
            address: srv.address, port: srv.port,
            online: r.online === true,
            confidence: r.confidence ?? null,
            verified: r.verified ?? false,
            conflict: r.conflict ?? false,
            favorite: isFavorite(key),
            customName: getCustomName(key),
            players: r.players ?? null,
            maxPlayers: r.maxPlayers ?? null,
            version: r.version || srv.version || null,
            motd: r.motd || srv.motd || null,
            tags,
            discord: extractDiscord(r.motd || srv.motd),
            bedrock: bedrockSupport[key] === true,
            hasIcon: !!r.icon,
            country: geo.country || null,
            countryCode: geo.countryCode || null,
            city: geo.city || null,
            isp: geo.isp || null,
            uptime: getUptime(key)?.percent ?? null,
            probes: r.probes || [],
            lastSeen: getLastSeen(key),
            scannedAt: new Date().toISOString()
        };
    });
}

function exportJson() {
    downloadFile(JSON.stringify(buildExportData(), null, 2), `mcscanner-${dateStr()}.json`, 'application/json');
    showToast('💾 JSON');
}
function exportCsv() {
    const data = buildExportData();
    const cols = ['address','port','online','confidence','verified','conflict','favorite','customName','players','maxPlayers','version','motd','tags','discord','bedrock','country','city','isp','uptime','lastSeen'];
    const header = cols.join(',');
    const rows = data.map(row => cols.map(c => {
        let v = row[c];
        if (Array.isArray(v)) v = v.join('|');
        if (v == null) v = '';
        v = String(v).replace(/"/g, '""').replace(/\n/g, ' ');
        return `"${v}"`;
    }).join(','));
    const csv = '\uFEFF' + [header, ...rows].join('\n');
    downloadFile(csv, `mcscanner-${dateStr()}.csv`, 'text/csv');
    showToast('📊 CSV');
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
//  TOAST / ERRORS
// ============================================================
function showError(msg) {
    const b = document.getElementById('errorBanner');
    b.textContent = '⚠ ' + msg;
    b.classList.add('show');
}
function hideError() { document.getElementById('errorBanner').classList.remove('show'); }
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
    toastTimer = setTimeout(() => toast.classList.remove('show'), 2400);
}

// ============================================================
//  SW / PWA
// ============================================================
async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try { await navigator.serviceWorker.register('./sw.js'); addLog('ok', 'SW'); }
    catch (err) { addLog('warn', 'SW: ' + err.message); }
}
async function clearAllCaches() {
    if (scanner) scanner.clearCache();
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
    }
    showToast('🗑️ Cache cleared');
}

let deferredPrompt = null;
window.addEventListener('beforeinstallprompt', (e) => {
    e.preventDefault();
    deferredPrompt = e;
    document.getElementById('installBtn').style.display = 'flex';
});
document.getElementById('installBtn').addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    document.getElementById('installBtn').style.display = 'none';
});

// ============================================================
//  EVENTS
// ============================================================
['searchInput','filterSelect','tagFilter','versionFilter','countryFilter','sortSelect','playersMin','playersMax'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = (id === 'searchInput' || id === 'playersMin' || id === 'playersMax') ? 'input' : 'change';
    el.addEventListener(evt, () => {
        renderServers(true);
        writeUrlParams();
    });
});

document.querySelectorAll('.preset-btn').forEach(btn => {
    btn.addEventListener('click', () => applyPreset(btn.dataset.preset));
});

document.querySelectorAll('.view-btn').forEach(btn => {
    btn.addEventListener('click', () => {
        viewMode = btn.dataset.view;
        localStorage.setItem(LS.view, viewMode);
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b === btn));
        renderServers();
    });
});

document.getElementById('refreshBtn').addEventListener('click', () => { scanner?.clearCache(); startScan(); });
document.getElementById('stopBtn').addEventListener('click', () => {
    if (scanner) { scanner.abort(); showToast('⏹'); }
});
document.getElementById('shareBtn').addEventListener('click', copyShareUrl);
document.getElementById('copyOnlineBtn').addEventListener('click', copyOnlineList);
document.getElementById('diffBtn').addEventListener('click', openDiffModal);
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
document.getElementById('historyBtn').addEventListener('click', openHistoryModal);
document.getElementById('compareBtn').addEventListener('click', openCompareModal);
document.getElementById('logBtn').addEventListener('click', openLogModal);
document.getElementById('probeStatsBtn').addEventListener('click', openProbeStatsModal);
document.getElementById('geoBtn').addEventListener('click', loadGeo);
document.getElementById('clearCacheBtn').addEventListener('click', clearAllCaches);
document.getElementById('themeToggle').addEventListener('click', toggleTheme);
document.getElementById('notifToggle').addEventListener('click', toggleNotifications);
document.getElementById('helpBtn').addEventListener('click', openHelpModal);
document.getElementById('langToggle').addEventListener('click', toggleLang);
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
    e.currentTarget.textContent = renameMode ? '✏️ On' : t('btnRename');
    showToast(renameMode ? '✏️ On' : '✏️ Off');
});

// Accent picker
document.getElementById('accentBtn').addEventListener('click', (e) => {
    e.stopPropagation();
    document.getElementById('accentPicker').classList.toggle('show');
});
document.querySelectorAll('.accent-swatch').forEach(s => {
    s.addEventListener('click', () => {
        setAccent(s.dataset.color);
        document.getElementById('accentPicker').classList.remove('show');
    });
});
document.addEventListener('click', (e) => {
    if (!e.target.closest('#accentPicker') && !e.target.closest('#accentBtn')) {
        document.getElementById('accentPicker').classList.remove('show');
    }
});

// Keyboard
document.addEventListener('keydown', (e) => {
    const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
    if (e.key === 'Escape') {
        if (document.getElementById('modalBackdrop').classList.contains('show')) closeModal();
        else if (inInput) document.activeElement.blur();
        return;
    }
    if (inInput) return;
    switch (e.key.toLowerCase()) {
        case '/': e.preventDefault(); document.getElementById('searchInput').focus(); break;
        case 'r': scanner?.clearCache(); startScan(); break;
        case 't': toggleTheme(); break;
        case 'e': exportJson(); break;
        case 'c': exportCsv(); break;
        case 'h': openHistoryModal(); break;
        case 'l': openLogModal(); break;
        case 'p': openProbeStatsModal(); break;
        case 'g': loadGeo(); break;
        case 'd': openDiffModal(); break;
        case '?': openHelpModal(); break;
    }
});

// ============================================================
//  INIT
// ============================================================
document.getElementById('year').textContent = new Date().getFullYear();
applyTheme();
applyAccent();
applyLang();
updateNotifBtn();
registerSW();
readUrlParams();

// Установить активную view-кнопку
document.querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewMode);
});

addLog('ok', `${APP_NAME} v4.0`);
console.log(`[${APP_NAME}] Started. Author: ${APP_AUTHOR}. TG: ${TG_LINK}`);

loadServersFromJson();
