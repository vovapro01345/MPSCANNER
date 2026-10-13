// ============================================================
//  MCscanner — by Real_Studio — v5.0
//  Pool scan · Discord · Clone detection · Real-MC check
//  API health · Mobile gestures · Saved presets · Daily stats
//  + Партнёр: Real_Speak (https://realspeak.ddns.net/)
// ============================================================

const APP_NAME = 'MCscanner';
const APP_AUTHOR = 'Real_Studio';
const TG_LINK = 'https://t.me/Real_Studio_Game';
const SERVERS_JSON_PATH = './servers.json';
const OWNER_UUID = 'ab536313-1bed-468c-98d9-871c2f86b21d';
const PARTNER_LINK = 'https://realspeak.ddns.net/';
const PARTNER_INVITE = 'https://realspeak.ddns.net/?invite=P3UQA6HY';

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
    view: 'mcscanner_view',
    lastServerList: 'mcscanner_last_servers_list',
    expandedIPs: 'mcscanner_expanded_ips',
    deadIPs: 'mcscanner_dead_ips',
    discord: 'mcscanner_discord_webhook',
    presets: 'mcscanner_saved_presets',
    daily: 'mcscanner_daily_stats'
};

const SCANNER_CONFIG = {
    delayMs: 800,
    poolSize: 3,
    cacheTTL: 5 * 60 * 1000,
    probeTimeoutMs: 12000,
    retryMax: 1,
    retryBackoffMs: [2000],
    autoScanIntervalMs: 7 * 24 * 60 * 60 * 1000,
    apiErrorThreshold: 5
};

const HISTORY_MAX = 30;
const LOGS_MAX = 300;
const PAGE_SIZE = 40;
const DAILY_KEEP_DAYS = 7;

// ============================================================
//  i18n
// ============================================================
const I18N = {
    ru: {
        subtitle: 'Собственный сканер Minecraft-серверов',
        infoStrong: 'Свой движок сканирования',
        infoText: 'параллельные пробы, cross-verification, медиана значений, retry с backoff.',
        infoSmall: 'Пул 3 сервера · 2–3 пробы на сервер · офлайн PWA',
        scanning: '⏳ Сканирование...',
        searchPh: 'Поиск... (/)',
        filterAll: 'Все серверы', filterOnline: 'Только онлайн', filterOffline: 'Только офлайн',
        filterFav: '⭐ Избранные', filterIcon: '🖼️ С иконкой', filterPlayers: '👥 С игроками',
        filterDiscord: '💬 С Discord', filterConf: '🎯 С высокой уверенностью', filterConflict: '⚠️ Спорные',
        filterNotMC: '⚠️ Не Minecraft', filterClones: '👥 Клоны',
        loading: 'Загрузка серверов...', createdBy: 'создан',
        importDone: '✅ Импортировано', importError: '❌ Ошибка импорта',
        importWrongFormat: '❌ Файл должен содержать массив серверов',
        btnRefresh: '🔄 Обновить всё', btnStop: '⏹ Стоп', btnShare: '🔗 Поделиться',
        btnCopyOnline: '📋 Онлайн', btnDiff: '🔀 Дифф', btnRename: '✏️ Имена',
        btnJson: '💾 JSON', btnCsv: '📊 CSV', btnHistory: '📜 История', btnCompare: '🔀 Сравнить',
        btnLog: '📋 Лог', btnProbes: '📡 Пробы', btnCache: '🗑️ Кэш',
        presetAll: '📋 Все', presetOnlinePlayers: '🔥 Онлайн + игроки', presetNew: '🆕 Новые',
        presetAnomalies: '⚠️ Аномалии', presetDead: '💀 Мёртвые IP', presetFav: '⭐ Избранные',
        liveOnline: 'Онлайн', liveOffline: 'Офлайн', liveChecking: 'Скан',
        wasOnline: '📅 Был онлайн:', uptime: 'Uptime:',
        newBadge: '🆕 новый', deadBadge: '💀 мёртвый IP', cloneBadge: 'клон',
        discordTitle: '💬 Discord уведомления',
        discordDesc: 'Webhook URL — при падении избранных серверов бот отправит сообщение в канал.',
        discordPlaceholder: 'https://discord.com/api/webhooks/...',
        discordSave: 'Сохранить', discordTest: 'Тест', discordClear: 'Очистить',
        discordSaved: '✅ Сохранено', discordCleared: '🗑️ Очищено',
        discordTestMsg: '🧪 Тест MCscanner',
        discordError: '❌ Ошибка: проверь URL',
        presetsTitle: '📚 Сохранённые подборки',
        presetsDesc: 'Сохрани текущие фильтры под именем — потом открывай в один клик.',
        presetsName: 'Название подборки',
        presetsSave: 'Сохранить текущие фильтры',
        presetsEmpty: 'Пока нет сохранённых подборок',
        presetsSaved: '✅ Сохранено',
        presetsDeleted: '🗑️ Удалено',
        dailyFound: 'Найдено', dailyFell: 'Упало', dailyRose: 'Поднялось',
        dailyNew: 'Новых', dailyTotal: 'Всего',
        apiWarn: '⚠️ Один или несколько API-проб недоступны',
        swipeFav: '⭐ В избранное', swipeCopy: '📋 Скопировано'
    },
    en: {
        subtitle: 'Custom Minecraft server scanner',
        infoStrong: 'Custom scan engine',
        infoText: 'parallel probes, cross-verification, median, retry with backoff.',
        infoSmall: 'Pool of 3 · 2–3 probes per server · offline PWA',
        scanning: '⏳ Scanning...',
        searchPh: 'Search... (/)',
        filterAll: 'All servers', filterOnline: 'Online only', filterOffline: 'Offline only',
        filterFav: '⭐ Favorites', filterIcon: '🖼️ With icon', filterPlayers: '👥 With players',
        filterDiscord: '💬 With Discord', filterConf: '🎯 High confidence', filterConflict: '⚠️ Conflicts',
        filterNotMC: '⚠️ Not Minecraft', filterClones: '👥 Clones',
        loading: 'Loading...', createdBy: 'created by',
        importDone: '✅ Imported', importError: '❌ Import error',
        importWrongFormat: '❌ File must contain array of servers',
        btnRefresh: '🔄 Refresh', btnStop: '⏹ Stop', btnShare: '🔗 Share',
        btnCopyOnline: '📋 Online', btnDiff: '🔀 Diff', btnRename: '✏️ Rename',
        btnJson: '💾 JSON', btnCsv: '📊 CSV', btnHistory: '📜 History', btnCompare: '🔀 Compare',
        btnLog: '📋 Log', btnProbes: '📡 Probes', btnCache: '🗑️ Cache',
        presetAll: '📋 All', presetOnlinePlayers: '🔥 Online + players', presetNew: '🆕 New',
        presetAnomalies: '⚠️ Anomalies', presetDead: '💀 Dead IPs', presetFav: '⭐ Favorites',
        liveOnline: 'Online', liveOffline: 'Offline', liveChecking: 'Scan',
        wasOnline: '📅 Was online:', uptime: 'Uptime:',
        newBadge: '🆕 new', deadBadge: '💀 dead IP', cloneBadge: 'clone',
        discordTitle: '💬 Discord notifications',
        discordDesc: 'Webhook URL — bot posts to channel when favorites go down.',
        discordPlaceholder: 'https://discord.com/api/webhooks/...',
        discordSave: 'Save', discordTest: 'Test', discordClear: 'Clear',
        discordSaved: '✅ Saved', discordCleared: '🗑️ Cleared',
        discordTestMsg: '🧪 MCscanner test',
        discordError: '❌ Error: check URL',
        presetsTitle: '📚 Saved presets',
        presetsDesc: 'Save current filters as a preset.',
        presetsName: 'Preset name',
        presetsSave: 'Save current filters',
        presetsEmpty: 'No presets yet',
        presetsSaved: '✅ Saved',
        presetsDeleted: '🗑️ Deleted',
        dailyFound: 'Found', dailyFell: 'Fell', dailyRose: 'Rose',
        dailyNew: 'New', dailyTotal: 'Total',
        apiWarn: '⚠️ One or more API probes unavailable',
        swipeFav: '⭐ Added to favorites', swipeCopy: '📋 Copied'
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
//  API PROBES
// ============================================================
const PROBES = [
    {
        id: 'mcsrvstat', name: 'mcsrvstat.us', role: 'primary',
        url: (h, p) => `https://api.mcsrvstat.us/3/${h}${p && p !== 25565 ? ':' + p : ''}`,
        headers: { 'User-Agent': `${APP_NAME}/5.0 (by ${APP_AUTHOR})` },
        parse: (d) => {
            if (!d || d.online === false || d.online === undefined) return { online: false };
            return {
                online: true, players: d.players?.online ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.version || '—', software: d.software || null,
                protocol: d.protocol || null,
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
                software: d.software || null, protocol: d.version?.protocol || null,
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
                version: d.server?.name || '—', software: null,
                protocol: d.server?.protocol || null,
                motd: d.motd || '', icon: d.favicon || null,
                playerList: d.players?.sample || null
            };
        }
    },
    {
        id: 'bedrock', name: 'mcsrvstat.us (bedrock)', role: 'bedrock',
        url: (h) => `https://api.mcsrvstat.us/bedrock/3/${h}:19132`,
        headers: { 'User-Agent': `${APP_NAME}/5.0 (by ${APP_AUTHOR})` },
        parse: (d) => {
            if (!d || d.online === false) return { online: false };
            return {
                online: true, players: d.players?.online ?? 0, maxPlayers: d.players?.max ?? 0,
                version: d.version || '—', software: null, protocol: null,
                motd: d.motd?.clean ? d.motd.clean.join(' ') : '',
                icon: null, playerList: null
            };
        }
    }
];

// ============================================================
//  API HEALTH
// ============================================================
class ApiHealth {
    constructor(threshold = 5) {
        this.threshold = threshold;
        this.stats = new Map();
    }
    record(probeId, ok, statusCode) {
        let s = this.stats.get(probeId);
        if (!s) s = { consecutiveErrors: 0, totalOk: 0, totalFail: 0, lastError: null };
        if (ok) { s.consecutiveErrors = 0; s.totalOk++; }
        else { s.consecutiveErrors++; s.totalFail++; s.lastError = statusCode || 'network'; }
        this.stats.set(probeId, s);
        return s;
    }
    isDegraded(probeId) {
        const s = this.stats.get(probeId);
        return s && s.consecutiveErrors >= this.threshold;
    }
    getDegradedProbes() {
        const out = [];
        this.stats.forEach((s, id) => {
            if (s.consecutiveErrors >= this.threshold) out.push({ id, ...s });
        });
        return out;
    }
    reset(probeId) { this.stats.delete(probeId); }
    getAll() { return Object.fromEntries(this.stats); }
}

const apiHealth = new ApiHealth(SCANNER_CONFIG.apiErrorThreshold);

// ============================================================
//  REAL MINECRAFT DETECTOR
// ============================================================
const MC_SOFTWARE_PATTERNS = [
    /paper/i, /spigot/i, /bukkit/i, /purpur/i, /bungee/i, /velocity/i,
    /waterfall/i, /forge/i, /fabric/i, /neoforge/i, /vanilla/i, /sponge/i,
    /craftbukkit/i, /glowstone/i, /cuberite/i, /folia/i, /leaves/i
];

function isRealMinecraft(result) {
    if (!result || !result.online) return { real: null, reason: 'offline' };
    const version = String(result.version || '');
    if (version !== '—' && version.length > 1) {
        if (MC_SOFTWARE_PATTERNS.some(re => re.test(version))) return { real: true, reason: 'software-in-version' };
        if (/^\d+\.\d+(\.\d+)?$/.test(version)) return { real: true, reason: 'version-number' };
        if (/1\.\d+/.test(version)) return { real: true, reason: 'version-major' };
    }
    if (result.protocol != null && typeof result.protocol === 'number') {
        if (result.protocol > 0 && result.protocol < 10000) return { real: true, reason: 'protocol' };
    }
    const motd = String(result.motd || '').toLowerCase();
    if (/minecraft|smp|survival|pvp|skyblock|anarchy|1\.\d+/.test(motd)) return { real: true, reason: 'motd-marker' };
    if (result.software && MC_SOFTWARE_PATTERNS.some(re => re.test(result.software))) return { real: true, reason: 'software-field' };
    return { real: false, reason: 'unknown' };
}

// ============================================================
//  CLONE DETECTION
// ============================================================
function normalizeMotd(s) {
    return String(s || '')
        .toLowerCase()
        .replace(/§[0-9a-fk-orx]/gi, '')
        .replace(/[^\wа-яё\s]/gi, ' ')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 100);
}
function iconHash(icon) {
    if (!icon) return '';
    return String(icon).slice(30, 90) + '|' + String(icon).length;
}
function computeCloneGroups() {
    const bySig = {};
    allServers.forEach(srv => {
        const key = serverKey(srv);
        const r = serverResults[key];
        if (!r || !r.online) return;
        const sig = normalizeMotd(r.motd || srv.motd) + '||' + iconHash(r.icon);
        if (!bySig[sig]) bySig[sig] = [];
        bySig[sig].push(key);
    });
    const groups = {};
    const inClone = new Set();
    Object.values(bySig).forEach(keys => {
        if (keys.length >= 2) {
            groups[keys[0]] = keys;
            keys.forEach(k => inClone.add(k));
        }
    });
    return { groups, inClone };
}

// ============================================================
//  DISCORD WEBHOOK
// ============================================================
function getDiscordWebhook() { return localStorage.getItem(LS.discord) || ''; }
function setDiscordWebhook(url) {
    if (url) localStorage.setItem(LS.discord, url);
    else localStorage.removeItem(LS.discord);
}
function discordEnabled() { return !!getDiscordWebhook(); }

async function sendDiscordWebhook(content, embed) {
    const url = getDiscordWebhook();
    if (!url) return false;
    try {
        const body = embed ? { content, embeds: [embed] } : { content };
        const res = await fetch(url, {
            method: 'POST',
            headers: { 'Content-Type': 'application/json' },
            body: JSON.stringify(body)
        });
        return res.ok;
    } catch { return false; }
}

// ============================================================
//  SAVED PRESETS
// ============================================================
const getSavedPresets = () => lsGet(LS.presets, {});
function savePreset(name) {
    if (!name) return;
    const params = {
        q: document.getElementById('searchInput')?.value || '',
        filter: document.getElementById('filterSelect')?.value || 'all',
        tag: document.getElementById('tagFilter')?.value || '',
        ver: document.getElementById('versionFilter')?.value || '',
        sort: document.getElementById('sortSelect')?.value || 'status',
        pmin: document.getElementById('playersMin')?.value || '0',
        pmax: document.getElementById('playersMax')?.value || '10000',
        view: viewMode
    };
    const p = getSavedPresets();
    p[name] = params;
    lsSet(LS.presets, p);
    renderSavedPresets();
}
function applyPresetByName(name) {
    const p = getSavedPresets();
    const params = p[name];
    if (!params) return;
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.value = val || ''; };
    set('searchInput', params.q);
    set('filterSelect', params.filter || 'all');
    set('tagFilter', params.tag);
    set('versionFilter', params.ver);
    set('sortSelect', params.sort || 'status');
    set('playersMin', params.pmin || '0');
    set('playersMax', params.pmax || '10000');
    if (params.view) {
        viewMode = params.view;
        document.querySelectorAll('.view-btn').forEach(b => b.classList.toggle('active', b.dataset.view === viewMode));
    }
    renderServers();
    writeUrlParams();
    showToast('📚 ' + name);
}
function deletePreset(name) {
    const p = getSavedPresets();
    delete p[name];
    lsSet(LS.presets, p);
    renderSavedPresets();
}
function renderSavedPresets() {
    const el = document.getElementById('savedPresets');
    if (!el) return;
    const presets = getSavedPresets();
    const names = Object.keys(presets);
    if (names.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = names.map(name =>
        `<div class="sp-chip" data-name="${escapeHtml(name)}">
            📚 ${escapeHtml(name)}
            <span class="del" data-del="${escapeHtml(name)}">×</span>
        </div>`
    ).join('');
    el.querySelectorAll('.sp-chip').forEach(chip => {
        chip.addEventListener('click', (e) => {
            if (e.target.classList.contains('del')) {
                deletePreset(e.target.getAttribute('data-del'));
                return;
            }
            applyPresetByName(chip.getAttribute('data-name'));
        });
    });
}

// ============================================================
//  DAILY STATS
// ============================================================
const getDailyStats = () => lsGet(LS.daily, []);
function recordDailyStat({ found, fell, rose, total }) {
    const stats = getDailyStats();
    const today = new Date().toISOString().slice(0, 10);
    const last = stats[stats.length - 1];
    if (last && last.date === today) {
        last.found += found;
        last.fell += fell;
        last.rose += rose;
        last.total = total;
    } else {
        stats.push({ date: today, found, fell, rose, total });
    }
    while (stats.length > DAILY_KEEP_DAYS) stats.shift();
    lsSet(LS.daily, stats);
    renderDailyStats();
}
function renderDailyStats() {
    const el = document.getElementById('dailyStats');
    if (!el) return;
    const stats = getDailyStats();
    const today = stats[stats.length - 1];
    if (!today) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    el.innerHTML = `
        <div class="ds-item good">🆕 ${t('dailyNew')}: <b>${today.found}</b></div>
        <div class="ds-item bad">⬇️ ${t('dailyFell')}: <b>${today.fell}</b></div>
        <div class="ds-item good">⬆️ ${t('dailyRose')}: <b>${today.rose}</b></div>
        <div class="ds-item">📦 ${t('dailyTotal')}: <b>${today.total}</b></div>
    `;
}

// ============================================================
//  SERVER SCANNER
// ============================================================
class ServerScanner {
    constructor(config) {
        this.config = { ...SCANNER_CONFIG, ...config };
        this.cache = new Map();
        this.probeStats = new Map();
        this.events = {};
        this.aborted = false;
        this.running = false;
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
            if (!res.ok) {
                apiHealth.record(probe.id, false, res.status);
                return { probeId: probe.id, probeName: probe.name, ok: false, error: `HTTP ${res.status}`, ms };
            }
            apiHealth.record(probe.id, true);
            const data = await res.json();
            const parsed = probe.parse(data);
            return { probeId: probe.id, probeName: probe.name, ok: true, data: parsed, ms };
        } catch (err) {
            clearTimeout(timer);
            apiHealth.record(probe.id, false, err.name);
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
        const software = onlineData.find(d => d.software)?.software || null;
        const protocol = onlineData.find(d => d.protocol != null)?.protocol ?? null;
        const motd = onlineData.find(d => d.motd)?.motd || '';
        const playerList = onlineData.find(d => Array.isArray(d.playerList) && d.playerList.length > 0)?.playerList || null;
        const mcCheck = isRealMinecraft({ online: true, version, protocol, motd, software });
        return {
            online: true, players, maxPlayers, version, software, protocol, motd, icon, playerList,
            confidence, verified, conflict,
            realMc: mcCheck.real, realMcReason: mcCheck.reason,
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

    async scanAllPooled(servers) {
        if (this.running) return;
        this.running = true;
        this.aborted = false;
        const total = servers.length;
        let done = 0;
        const poolSize = Math.max(1, this.config.poolSize);

        this.emit('scan:start', { total, poolSize });

        let cursor = 0;
        const self = this;
        async function worker() {
            while (cursor < servers.length && !self.aborted) {
                const i = cursor++;
                const server = servers[i];
                try { await self.scanServer(server); }
                catch (err) { self.emit('server:error', { server, error: err.message }); }
                done++;
                self.emit('scan:progress', { done, total, server });
                if (done < total && !self.aborted) {
                    await new Promise(r => setTimeout(r, self.config.delayMs));
                }
            }
        }
        const workers = Array(poolSize).fill(0).map(() => worker());
        await Promise.all(workers);

        this.running = false;
        this.emit('scan:end', { done, total, aborted: this.aborted });
    }

    abort() { this.aborted = true; }
    clearCache() { this.cache.clear(); }
    getProbeStats() { return Object.fromEntries(this.probeStats); }
}

// ============================================================
//  STATE
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
let expandedIPs = new Set(lsGet(LS.expandedIPs, []));
let cloneGroups = { groups: {}, inClone: new Set() };

// ============================================================
//  UTILS
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
    if (notifEnabled()) { lsSet(LS.notif, false); showToast('🔔 off'); updateNotifBtn(); return; }
    if (!('Notification' in window)) return;
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { lsSet(LS.notif, true); showToast('🔔 on'); }
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
    const el = document.getElementById('themeToggle');
    if (el) el.textContent = theme === 'light' ? '☀️' : '🌙';
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
function setAccent(color) { localStorage.setItem(LS.accent, color); applyAccent(); }

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
    return `<svg class="sparkline" width="${w}" height="${hh}" viewBox="0 0 ${w} ${hh}">
        <path d="${path}" stroke="var(--accent)" stroke-width="1.5" fill="none"/>
    </svg>`;
}
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
function getDeadIPsCount() { return computeDeadIPs().dead.size; }
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

// ============================================================
//  IMPORT
// ============================================================
function normalizeServer(s) {
    return {
        address: String(s.address || s.ip || s.host || '').trim(),
        port: Number(s.port) || 25565,
        online: s.online ?? null,
        motd: s.motd || '',
        players_online: s.players_online ?? s.players ?? 0,
        players_max: s.players_max ?? s.max_players ?? s.maxPlayers ?? 20,
        version: s.version || '—'
    };
}
async function importJsonFile(file) {
    if (!file) return;
    if (file.size > 10 * 1024 * 1024) { showToast('❌ >10 МБ'); return; }
    try {
        const text = await file.text();
        let data;
        try { data = JSON.parse(text); } catch { showToast(t('importError') + ': JSON'); return; }
        let servers = null, meta = null;
        if (Array.isArray(data)) servers = data;
        else if (data && Array.isArray(data.servers)) { servers = data.servers; meta = data._meta; }
        if (!servers || servers.length === 0) { showToast(t('importWrongFormat')); return; }
        const normalized = servers.map(normalizeServer).filter(s => s.address);
        if (normalized.length === 0) { showToast(t('importWrongFormat')); return; }
        const diff = computeServersDiff(normalized);
        allServers = normalized;
        serverResults = {};
        allServers.forEach(srv => { serverResults[serverKey(srv)] = { _scanning: true, online: null }; });
        newServersSet = new Set(diff?.added || []);
        serverDiff = diff;
        displayedCount = PAGE_SIZE;
        renderServers();
        updateStats();
        addLog('ok', `Import: ${normalized.length}`);
        showToast(`${t('importDone')}: ${normalized.length}`);
        if (diff && (diff.added.length || diff.removed.length)) {
            setTimeout(() => showToast(`🔀 +${diff.added.length} / -${diff.removed.length}`), 600);
        }
        scanner = createScanner();
        startScan();
    } catch (err) {
        addLog('err', 'Import: ' + err.message);
        showToast(t('importError') + ': ' + err.message);
    }
}
function setupDragAndDrop() {
    const overlay = document.getElementById('dropOverlay');
    if (!overlay) return;
    let dragCounter = 0;
    window.addEventListener('dragenter', e => {
        e.preventDefault(); dragCounter++;
        if (e.dataTransfer.types.includes('Files')) overlay.classList.add('show');
    });
    window.addEventListener('dragover', e => { e.preventDefault(); e.dataTransfer.dropEffect = 'copy'; });
    window.addEventListener('dragleave', e => {
        e.preventDefault(); dragCounter--;
        if (dragCounter <= 0) { dragCounter = 0; overlay.classList.remove('show'); }
    });
    window.addEventListener('drop', e => {
        e.preventDefault(); dragCounter = 0; overlay.classList.remove('show');
        const file = e.dataTransfer.files?.[0];
        if (file) importJsonFile(file);
    });
    document.getElementById('importBtn')?.addEventListener('click', () => document.getElementById('fileInput')?.click());
    document.getElementById('fileInput')?.addEventListener('change', e => {
        const file = e.target.files?.[0];
        if (file) importJsonFile(file);
        e.target.value = '';
    });
}

// ============================================================
//  URL
// ============================================================
function readUrlParams() {
    const p = new URLSearchParams(location.search);
    const set = (id, val) => { const el = document.getElementById(id); if (el && val) el.value = val; };
    set('searchInput', p.get('q')); set('filterSelect', p.get('filter')); set('tagFilter', p.get('tag'));
    set('versionFilter', p.get('ver')); set('sortSelect', p.get('sort'));
    if (p.get('pmin')) set('playersMin', p.get('pmin'));
    if (p.get('pmax')) set('playersMax', p.get('pmax'));
    if (p.get('view')) viewMode = p.get('view');
}
function writeUrlParams() {
    const p = new URLSearchParams();
    const v = (id) => document.getElementById(id)?.value;
    if (v('searchInput')) p.set('q', v('searchInput'));
    if (v('filterSelect') && v('filterSelect') !== 'all') p.set('filter', v('filterSelect'));
    if (v('tagFilter')) p.set('tag', v('tagFilter'));
    if (v('versionFilter')) p.set('ver', v('versionFilter'));
    if (v('sortSelect') && v('sortSelect') !== 'status') p.set('sort', v('sortSelect'));
    if (v('playersMin') && v('playersMin') !== '0') p.set('pmin', v('playersMin'));
    if (v('playersMax') && v('playersMax') !== '10000') p.set('pmax', v('playersMax'));
    if (viewMode !== 'grid') p.set('view', viewMode);
    const newUrl = p.toString() ? `?${p}` : location.pathname;
    history.replaceState(null, '', newUrl);
}
function copyShareUrl() {
    navigator.clipboard.writeText(location.href).then(() => showToast('🔗 OK')).catch(() => showToast('❌'));
}

// ============================================================
//  SCANNER SETUP
// ============================================================
function createScanner() {
    const s = new ServerScanner();
    s.on('scan:start', () => { addLog('ok', 'Scan start'); resetMetrics(); });
    s.on('server:scanning', ({ server }) => {
        const key = serverKey(server);
        serverResults[key] = { ...(serverResults[key] || {}), _scanning: true };
        updateCard(key);
    });
    s.on('server:scanned', ({ server, result }) => {
        const key = serverKey(server);
        const prev = serverResults[key];
        serverResults[key] = result;
        if (typeof result.confidence === 'number') { scanMetrics.agreeSum += result.confidence; scanMetrics.agreeCount++; }
        if (result.probes) result.probes.forEach(p => {
            if (typeof p.ms === 'number') { scanMetrics.latencySum += p.ms; scanMetrics.latencyCount++; }
        });
        if (result.conflict) scanMetrics.conflicts++;
        if (result.verified) scanMetrics.verified++;

        if (prev && prev.online === true && result.online === false) {
            if (isFavorite(key)) {
                notify('⚠️ Server down', key);
                if (discordEnabled()) {
                    sendDiscordWebhook('', {
                        title: '⚠️ Server down',
                        description: `**${key}** упал`,
                        color: 0xef4444,
                        timestamp: new Date().toISOString()
                    });
                }
            }
        }
        if (prev && prev.online === false && result.online === true) {
            if (isFavorite(key) && discordEnabled()) {
                sendDiscordWebhook('', {
                    title: '✅ Server up',
                    description: `**${key}** снова онлайн`,
                    color: 0x22c55e,
                    timestamp: new Date().toISOString()
                });
            }
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
        checkApiHealth();
    });
    return s;
}
function resetMetrics() {
    scanMetrics = { agreeSum: 0, agreeCount: 0, latencySum: 0, latencyCount: 0, conflicts: 0, verified: 0 };
}
function updateProgress(cur, total, name) {
    const c = document.getElementById('progressContainer');
    const f = document.getElementById('progressBarFill');
    const tEl = document.getElementById('progressText');
    const n = document.getElementById('progressCurrent');
    if (!c) return;
    if (cur === 0) { c.style.display = 'none'; return; }
    c.style.display = 'block';
    f.style.width = Math.round((cur / total) * 100) + '%';
    tEl.textContent = `${cur} / ${total}`;
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
function checkApiHealth() {
    const el = document.getElementById('apiWarning');
    if (!el) return;
    const degraded = apiHealth.getDegradedProbes();
    if (degraded.length === 0) { el.style.display = 'none'; return; }
    el.style.display = 'flex';
    const text = document.getElementById('apiWarningText');
    if (text) text.textContent = `${t('apiWarn')}: ${degraded.map(d => d.id).join(', ')}`;
}

// ============================================================
//  LOAD
// ============================================================
async function loadServersFromJson() {
    try {
        const response = await fetch(SERVERS_JSON_PATH, { cache: 'no-cache' });
        if (!response.ok) throw new Error(`HTTP ${response.status}`);
        const data = await response.json();
        let servers;
        if (Array.isArray(data)) servers = data;
        else if (data && Array.isArray(data.servers)) servers = data.servers;
        else throw new Error('JSON must be array or {servers:[]}');
        const normalized = servers.map(normalizeServer).filter(s => s.address);
        allServers = normalized;
        serverResults = {};
        allServers.forEach(srv => { serverResults[serverKey(srv)] = { _scanning: true, online: null }; });
        serverDiff = computeServersDiff(allServers);
        newServersSet = new Set(serverDiff?.added || []);
        hideError();
        renderServers();
        updateStats();
        scanner = createScanner();
        startScan();
    } catch (err) {
        addLog('err', 'load: ' + err.message);
        showError(`Error: ${err.message}. Перетащите servers.json в окно.`);
        const grid = document.getElementById('serverGrid');
        if (grid) grid.innerHTML = `
            <div class="empty-state">❌ <code>servers.json</code> не найден.<br><br>Перетащите файл в окно.</div>`;
    }
}
async function startScan() {
    if (!scanner || scanner.running) return;
    const refreshBtn = document.getElementById('refreshBtn');
    const stopBtn = document.getElementById('stopBtn');
    if (refreshBtn) { refreshBtn.disabled = true; refreshBtn.textContent = t('scanning'); }
    if (stopBtn) stopBtn.style.display = 'inline-block';
    const panel = document.getElementById('scannerPanel');
    if (panel) panel.style.display = 'grid';

    const beforeOnline = new Set();
    allServers.forEach(srv => {
        if (serverResults[serverKey(srv)]?.online === true) beforeOnline.add(serverKey(srv));
    });

    await scanner.scanAllPooled(allServers);

    if (refreshBtn) { refreshBtn.disabled = false; refreshBtn.textContent = t('btnRefresh'); }
    if (stopBtn) stopBtn.style.display = 'none';
    markScanned();
    updateLastUpdate();
    updateProgress(0, 0);
    cloneGroups = computeCloneGroups();
    renderServers();
    updateStats();
    updateScannerPanel();
    saveHistory();

    let found = 0, fell = 0, rose = 0, onlineNow = 0;
    allServers.forEach(srv => {
        const key = serverKey(srv);
        const was = beforeOnline.has(key);
        const now = serverResults[key]?.online === true;
        if (now) onlineNow++;
        if (!was && now) rose++;
        if (was && !now) fell++;
    });
    if (serverDiff) found = serverDiff.added.length;
    recordDailyStat({ found, fell, rose, total: allServers.length });

    playBeep();
    showToast(`✅ ${allServers.length} servers · pool ${SCANNER_CONFIG.poolSize}`);
    if (typeof gtag === 'function') gtag('event', 'scan_complete', { total: allServers.length });
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
    const q = document.getElementById('searchInput')?.value.toLowerCase().trim() || '';
    const filter = document.getElementById('filterSelect')?.value || 'all';
    const tagFilter = document.getElementById('tagFilter')?.value || '';
    const verFilter = document.getElementById('versionFilter')?.value || '';
    const sort = document.getElementById('sortSelect')?.value || 'status';
    const pMin = Number(document.getElementById('playersMin')?.value) || 0;
    const pMax = Number(document.getElementById('playersMax')?.value) || 10000;

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
        if (filter === 'not-mc' && r.realMc !== false) return false;
        if (filter === 'clones' && !cloneGroups.inClone.has(key)) return false;

        if (online) {
            const pl = r.players ?? 0;
            if (pl < pMin || pl > pMax) return false;
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
                        getCustomName(key) || '', r.motd || '', r.version || ''].join(' ').toLowerCase();
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
        const fill = (r) => (r.players == null || !r.maxPlayers) ? -1 : r.players / r.maxPlayers;
        switch (sort) {
            case 'confidence-desc': return (rb.confidence ?? -1) - (ra.confidence ?? -1);
            case 'uptime-desc': return (getUptime(serverKey(b))?.percent ?? -1) - (getUptime(serverKey(a))?.percent ?? -1);
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
            default: return (statusOrder[sa] ?? 3) - (statusOrder[sb] ?? 3);
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
    if (!grid) return;
    currentFiltered = getFilteredAndSorted();
    if (resetPagination) displayedCount = PAGE_SIZE;
    const visible = currentFiltered.slice(0, displayedCount);
    if (visible.length === 0) {
        grid.innerHTML = `<div class="empty-state">${t('loading')}</div>`;
        const w = document.getElementById('loadMoreWrap');
        if (w) w.style.display = 'none';
        return;
    }
    if (viewMode === 'table') renderTable(visible);
    else if (viewMode === 'grouped') renderGrouped(visible);
    else renderGrid(visible);

    const wrap = document.getElementById('loadMoreWrap');
    if (wrap) {
        if (currentFiltered.length > displayedCount) {
            wrap.style.display = 'block';
            const c = document.getElementById('loadMoreCount');
            if (c) c.textContent = `(${currentFiltered.length - displayedCount})`;
        } else wrap.style.display = 'none';
    }
}

function renderGrid(servers) {
    const grid = document.getElementById('serverGrid');
    grid.className = 'server-grid';
    grid.innerHTML = servers.map(cardHtml).join('');
    bindCardEvents(grid);
    setupSwipeGestures();
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
    Object.entries(groups).sort((a, b) => a[0].localeCompare(b[0], undefined, { numeric: true })).forEach(([ip, list]) => {
        const stats = byIP[ip] || { total: list.length, online: 0 };
        const isDead = dead.has(ip);
        const expanded = expandedIPs.has(ip);
        html += `
            <div class="ip-group ${expanded ? 'expanded' : ''}" data-ip="${escapeHtml(ip)}">
                <div class="ip-group-header">
                    <span class="ip-group-arrow">▶</span>
                    <span class="ip-group-ip">${escapeHtml(ip)}</span>
                    <div class="ip-group-stats">
                        <span>📦 ${stats.total}</span>
                        <span class="ok">✅ ${stats.online}</span>
                        <span class="bad">❌ ${stats.total - stats.online}</span>
                        ${isDead ? `<span class="dead-badge">💀 ${t('deadBadge')}</span>` : ''}
                    </div>
                </div>
                <div class="ip-group-body">${list.map(cardHtml).join('')}</div>
            </div>`;
    });
    grid.innerHTML = html;
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
    setupSwipeGestures();
}
function renderTable(servers) {
    const grid = document.getElementById('serverGrid');
    grid.className = '';
    let html = `<div class="server-table-wrap"><table class="server-table"><thead><tr>
        <th>Иконка</th><th>Адрес</th><th>Статус</th><th>Игроки</th>
        <th>Версия</th><th>Название</th><th>Uptime</th><th>⭐</th>
    </tr></thead><tbody>`;
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
    const status = scanning ? 'checking' : (online ? 'online' : 'offline');
    const statusText = { online: t('liveOnline'), offline: t('liveOffline'), checking: t('liveChecking') }[status];
    const fav = isFavorite(key);
    const title = getTitle(srv);
    const players = r.players ?? (online ? 0 : '—');
    const maxPlayers = r.maxPlayers ?? (online ? 0 : '—');
    const version = r.version || srv.version || '—';
    const uptime = getUptime(key);
    const uptimeText = uptime ? `${uptime.percent}% (${uptime.online}/${uptime.total})` : '—';
    let iconHtml = '⛏';
    if (online && r.icon) iconHtml = `<img class="tbl-icon" src="${escapeHtml(r.icon)}" loading="lazy" onerror="this.outerHTML='⛏'">`;
    return `<tr data-key="${escapeHtml(key)}" class="row-${status}">
        <td>${iconHtml}</td>
        <td class="tbl-addr">${escapeHtml(srv.address)}:${srv.port}</td>
        <td><span class="tbl-badge ${status}">${statusText}</span></td>
        <td class="tbl-players">${escapeHtml(String(players))} / ${escapeHtml(String(maxPlayers))}</td>
        <td>${escapeHtml(String(version))}</td>
        <td class="tbl-name">${escapeHtml(title)}</td>
        <td>${escapeHtml(uptimeText)}</td>
        <td style="cursor:pointer;color:${fav ? '#fbbf24' : 'var(--text-mute)'};font-size:1.1rem;" class="tbl-fav">${fav ? '★' : '☆'}</td>
    </tr>`;
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
            return;
        }
        navigator.clipboard.writeText(key).then(() => showToast('📋 ' + key)).catch(() => {});
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
    const isClone = cloneGroups.inClone.has(key) ? ' is-clone' : '';
    const notMc = r.realMc === false ? ' not-mc' : '';
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
        confHtml = `<div class="confidence-bar" title="Confidence: ${r.confidence}%">
            <div class="bar"><div class="fill ${cls}" style="width:${r.confidence}%"></div></div>
            <span>${r.confidence}%</span></div>`;
    }
    const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
    const discord = extractDiscord(r.motd || srv.motd);
    const hasBedrock = bedrockSupport[key] === true;
    let tagsHtml = '';
    if (tags.length > 0 || discord || hasBedrock || isNew || isClone) {
        const els = tags.map(tag => `<span class="tag">${tag}</span>`);
        if (discord) els.push(`<span class="tag discord">💬 Discord</span>`);
        if (hasBedrock) els.push(`<span class="tag bedrock">Bedrock</span>`);
        if (isNew) els.push(`<span class="tag new">${t('newBadge')}</span>`);
        if (isClone) els.push(`<span class="tag new" title="${t('cloneBadge')}">👥 ${t('cloneBadge')}</span>`);
        tagsHtml = `<div class="tags">${els.join('')}</div>`;
    }
    const uptime = getUptime(key);
    let uptimeHtml = '';
    if (uptime) {
        uptimeHtml = `<div class="uptime-row">
            <span>${t('uptime')} ${uptime.percent}%</span>
            <div class="bar-wrap"><div class="bar-fill" style="width:${uptime.percent}%"></div></div>
            ${sparkline(key)}</div>`;
    }
    let lastSeenHtml = '';
    if (offline && !scanning) {
        const ts = getLastSeen(key);
        if (ts) lastSeenHtml = `<div class="last-seen">${t('wasOnline')} ${formatLastSeen(ts)}</div>`;
    }
    const hasPlayerList = online && Array.isArray(r.playerList) && r.playerList.length > 0;
    const pcClass = hasPlayerList ? 'player-count clickable' : 'player-count';

    return `<div class="server-card ${status}${conflictClass}${isNew}${isClone}${notMc}${deadClass} ${fav ? 'is-favorite' : ''}" data-key="${escapeHtml(key)}">
        <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${escapeHtml(key)}">${fav ? '★' : '☆'}</button>
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
                <div class="server-address" data-address="${escapeHtml(key)}">
                    ${escapeHtml(srv.address)}:${srv.port}
                    <span class="copy-hint">📋</span>
                </div>
                <div class="server-motd">${escapeHtml(motdText)}</div>
                ${tagsHtml}${uptimeHtml}${lastSeenHtml}
                <div class="card-footer">
                    <div class="${pcClass}" data-players="${escapeHtml(key)}">
                        👥 <span class="count">${escapeHtml(String(players))}</span> / ${escapeHtml(String(maxPlayers))}
                        ${playerBar}
                    </div>
                    <div class="version-tag">${escapeHtml(String(version))}</div>
                </div>
                ${confHtml}
            </div>
        </div>
    </div>`;
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
//  MOBILE SWIPE
// ============================================================
function setupSwipeGestures() {
    if (!('ontouchstart' in window)) return;
    document.querySelectorAll('.server-card').forEach(card => {
        let startX = 0, startY = 0, moved = false;
        card.addEventListener('touchstart', (e) => {
            startX = e.touches[0].clientX;
            startY = e.touches[0].clientY;
            moved = false;
            card.classList.add('swiping');
        }, { passive: true });
        card.addEventListener('touchmove', (e) => {
            const dx = e.touches[0].clientX - startX;
            const dy = e.touches[0].clientY - startY;
            if (Math.abs(dy) > Math.abs(dx)) return;
            if (Math.abs(dx) < 20) return;
            moved = true;
            card.classList.remove('swipe-left', 'swipe-right');
            if (dx > 0) card.classList.add('swipe-right');
            else card.classList.add('swipe-left');
        }, { passive: true });
        card.addEventListener('touchend', (e) => {
            card.classList.remove('swiping');
            const dx = e.changedTouches[0].clientX - startX;
            card.classList.remove('swipe-left', 'swipe-right');
            if (!moved) return;
            const key = card.getAttribute('data-key');
            if (Math.abs(dx) < 80) return;
            if (dx < 0) {
                if (!isFavorite(key)) {
                    toggleFavorite(key);
                    showToast(t('swipeFav'));
                    setTimeout(() => updateCard(key), 100);
                }
            } else {
                navigator.clipboard.writeText(key).then(() => showToast(t('swipeCopy')));
            }
        });
    });
}

// ============================================================
//  MOBILE NAV
// ============================================================
function setupMobileNav() {
    const nav = document.getElementById('mobileNav');
    if (!nav) return;
    nav.querySelectorAll('button').forEach(btn => {
        btn.addEventListener('click', () => {
            const action = btn.dataset.action;
            nav.querySelectorAll('button').forEach(b => b.classList.remove('active'));
            btn.classList.add('active');
            switch (action) {
                case 'refresh': scanner?.clearCache(); startScan(); break;
                case 'filters': document.getElementById('mobileFiltersBackdrop')?.classList.add('show'); break;
                case 'import': document.getElementById('fileInput')?.click(); break;
                case 'favorites':
                    const fs = document.getElementById('filterSelect');
                    if (fs) fs.value = 'favorites';
                    renderServers(); writeUrlParams();
                    break;
                case 'menu': openHelpModal(); break;
            }
        });
    });
    document.getElementById('mobileFiltersClose')?.addEventListener('click', () => {
        document.getElementById('mobileFiltersBackdrop')?.classList.remove('show');
    });
    document.getElementById('mobileFiltersBackdrop')?.addEventListener('click', (e) => {
        if (e.target.id === 'mobileFiltersBackdrop') e.currentTarget.classList.remove('show');
    });
    document.getElementById('mfApply')?.addEventListener('click', () => {
        const set = (a, b) => { const el = document.getElementById(a); if (el) el.value = document.getElementById(b)?.value || ''; };
        set('searchInput', 'mfSearch');
        set('filterSelect', 'mfFilter');
        set('sortSelect', 'mfSort');
        renderServers(); writeUrlParams();
        document.getElementById('mobileFiltersBackdrop')?.classList.remove('show');
    });
}

// ============================================================
//  MODALS
// ============================================================
function openModal(title, html) {
    const tEl = document.getElementById('modalTitle');
    const bEl = document.getElementById('modalBody');
    const bd = document.getElementById('modalBackdrop');
    if (tEl) tEl.textContent = title;
    if (bEl) bEl.innerHTML = html;
    if (bd) bd.classList.add('show');
}
function closeModal() { document.getElementById('modalBackdrop')?.classList.remove('show'); }

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
    openModal('QR', `<div class="qr-wrap"><img src="${qrUrl}" alt="QR" width="220" height="220"><p style="margin-top:14px;font-family:monospace;color:var(--text-dim);">${escapeHtml(key)}</p></div>`);
}
function openLogModal() {
    const logs = getLogs();
    let html;
    if (logs.length === 0) html = `<div class="modal-empty">—</div>`;
    else html = logs.slice(0, 100).map(l => {
        const time = new Date(l.t).toLocaleTimeString();
        return `<div class="log-item ${l.level}"><span class="time">${time}</span><span>${escapeHtml(l.msg)}</span></div>`;
    }).join('');
    openModal('📋 Log', html);
}
function openHistoryModal() {
    const h = getHistory();
    let html;
    if (h.length === 0) html = `<div class="modal-empty">—</div>`;
    else html = h.map(snap => {
        const date = new Date(snap.t).toLocaleString();
        return `<div class="history-item"><span>${date}</span><span style="margin-left:auto;color:var(--accent);">${snap.online} / ${snap.total}</span></div>`;
    }).join('');
    openModal('📜 History', html);
}
function openCompareModal() {
    const h = getHistory();
    if (h.length < 2) { openModal('🔀', '<div class="modal-empty">Need 2+ scans</div>'); return; }
    const cur = h[0], prev = h[1];
    const prevMap = {};
    prev.servers.forEach(s => prevMap[s.k] = s);
    const changes = [];
    cur.servers.forEach(s => {
        const p = prevMap[s.k];
        if (!p) return;
        if (p.online !== s.online) changes.push({ k: s.k, text: s.online ? '⬆️' : '⬇️', level: s.online ? 'ok' : 'err' });
        else if (s.online && Math.abs(s.players - p.players) >= 3) {
            const diff = s.players - p.players;
            changes.push({ k: s.k, text: `${diff > 0 ? '📈' : '📉'} ${p.players} → ${s.players}`, level: 'warn' });
        }
    });
    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">${new Date(prev.t).toLocaleString()} → ${new Date(cur.t).toLocaleString()}</div>`;
    if (changes.length === 0) html += '<div class="modal-empty">—</div>';
    else html += changes.map(c => `<div class="log-item ${c.level}"><span style="flex:1;font-family:monospace;font-size:0.78rem;">${escapeHtml(c.k)}</span><span>${escapeHtml(c.text)}</span></div>`).join('');
    openModal('🔀 Compare', html);
}
function openDiffModal() {
    let html = '';
    if (!serverDiff) html = `<div class="modal-empty">First load</div>`;
    else {
        html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">
            ➕ ${serverDiff.added.length} · ➖ ${serverDiff.removed.length} · ✅ ${serverDiff.same}
        </div>`;
        if (serverDiff.added.length === 0 && serverDiff.removed.length === 0) html += `<div class="modal-empty">No changes</div>`;
        else {
            serverDiff.added.forEach(k => html += `<div class="diff-row added">➕ ${escapeHtml(k)}</div>`);
            serverDiff.removed.forEach(k => html += `<div class="diff-row removed">➖ ${escapeHtml(k)}</div>`);
        }
    }
    openModal('🔀 Diff', html);
}
function openProbeStatsModal() {
    const stats = scanner?.getProbeStats() || {};
    const probeList = PROBES.filter(p => p.role !== 'bedrock');
    let html = '';
    html += probeList.map(p => {
        const s = stats[p.id] || { ok: 0, fail: 0, totalMs: 0 };
        const total = s.ok + s.fail;
        const avgMs = total > 0 ? Math.round(s.totalMs / total) : 0;
        const rate = total > 0 ? Math.round((s.ok / total) * 100) : 0;
        const degraded = apiHealth.isDegraded(p.id) ? ' ⚠️' : '';
        return `<div class="probe-row">
            <span class="probe-name">${escapeHtml(p.name)}${degraded}</span>
            <span class="probe-stat">✅ <b>${s.ok}</b></span>
            <span class="probe-stat">❌ <b>${s.fail}</b></span>
            <span class="probe-stat">⚡ <b>${avgMs} ms</b></span>
            <span class="probe-stat" style="margin-left:auto;color:var(--accent);"><b>${rate}%</b></span>
        </div>`;
    }).join('');
    openModal('📡 Probes', html);
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
    if (anomalies.length === 0) html = '<div class="modal-empty">🎉</div>';
    else html = anomalies.map(srv => {
        const r = serverResults[serverKey(srv)];
        return `<div class="diff-row players">⚠️ ${escapeHtml(serverKey(srv))} — ${r.players} / ${r.maxPlayers}</div>`;
    }).join('');
    openModal('⚠️ Anomalies', html);
}
function openDeadIPsModal() {
    const { dead, byIP } = computeDeadIPs();
    let html;
    if (dead.size === 0) html = '<div class="modal-empty">🎉</div>';
    else html = [...dead].sort().map(ip => {
        const s = byIP[ip];
        return `<div class="diff-row down">💀 ${escapeHtml(ip)} — 0 / ${s.total}</div>`;
    }).join('');
    openModal('💀 Dead IPs', html);
}
function openClonesModal() {
    const groups = Object.values(cloneGroups.groups);
    let html;
    if (groups.length === 0) html = '<div class="modal-empty">Клонов не найдено</div>';
    else html = groups.map((keys, i) => {
        const srv = allServers.find(s => serverKey(s) === keys[0]);
        const title = srv ? stripMinecraftColors((serverResults[serverKey(srv)]?.motd || srv.motd || '').split('\n')[0]) : '—';
        return `<div style="margin-bottom:12px;">
            <div style="font-weight:700;color:var(--accent);margin-bottom:4px;">👥 Группа ${i + 1} · ${keys.length} серверов</div>
            <div style="font-size:0.78rem;color:var(--text-mute);margin-bottom:6px;">${escapeHtml(title.slice(0, 80))}</div>
            ${keys.map(k => `<div class="diff-row">${escapeHtml(k)}</div>`).join('')}
        </div>`;
    }).join('');
    openModal('👥 Клоны', html);
}
function openDiscordModal() {
    const cur = getDiscordWebhook();
    const html = `
        <div class="discord-form">
            <p style="color:var(--text-dim);font-size:0.85rem;line-height:1.5;">${t('discordDesc')}</p>
            <input type="text" id="discordUrl" placeholder="${t('discordPlaceholder')}" value="${escapeHtml(cur)}">
            <div style="display:flex;gap:8px;flex-wrap:wrap;">
                <button class="primary" id="discordSave">${t('discordSave')}</button>
                <button class="secondary" id="discordTest">${t('discordTest')}</button>
                <button class="secondary" id="discordClear">${t('discordClear')}</button>
            </div>
        </div>`;
    openModal(t('discordTitle'), html);
    document.getElementById('discordSave')?.addEventListener('click', () => {
        const url = document.getElementById('discordUrl').value.trim();
        setDiscordWebhook(url);
        showToast(t('discordSaved'));
        closeModal();
    });
    document.getElementById('discordTest')?.addEventListener('click', async () => {
        const url = document.getElementById('discordUrl').value.trim();
        const old = getDiscordWebhook();
        setDiscordWebhook(url);
        const ok = await sendDiscordWebhook(t('discordTestMsg'));
        setDiscordWebhook(old);
        showToast(ok ? '✅ OK' : t('discordError'));
    });
    document.getElementById('discordClear')?.addEventListener('click', () => {
        setDiscordWebhook('');
        showToast(t('discordCleared'));
        closeModal();
    });
}
function openPresetsModal() {
    const presets = getSavedPresets();
    const names = Object.keys(presets);
    let html = `<p style="color:var(--text-dim);font-size:0.85rem;line-height:1.5;margin-bottom:12px;">${t('presetsDesc')}</p>`;
    html += `<div style="display:flex;gap:8px;margin-bottom:14px;">
        <input type="text" id="newPresetName" placeholder="${t('presetsName')}" style="flex:1;padding:9px 12px;border-radius:8px;border:1px solid var(--card-border);background:var(--bg);color:var(--text);font-family:inherit;">
        <button class="primary" id="savePresetBtn" style="padding:9px 16px;border-radius:8px;border:none;background:var(--accent-2);color:#fff;cursor:pointer;font-family:inherit;font-weight:600;">${t('presetsSave')}</button>
    </div>`;
    if (names.length === 0) html += `<div class="modal-empty">${t('presetsEmpty')}</div>`;
    else html += names.map(n => `<div class="diff-row"><span style="flex:1;">📚 ${escapeHtml(n)}</span>
        <button data-preset-apply="${escapeHtml(n)}" style="background:var(--accent-2);color:#fff;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;">→</button>
        <button data-preset-del="${escapeHtml(n)}" style="background:var(--danger);color:#fff;border:none;padding:3px 10px;border-radius:6px;cursor:pointer;font-size:0.75rem;">×</button>
    </div>`).join('');
    openModal(t('presetsTitle'), html);
    document.getElementById('savePresetBtn')?.addEventListener('click', () => {
        const name = document.getElementById('newPresetName').value.trim();
        if (!name) return;
        savePreset(name);
        showToast(t('presetsSaved'));
        closeModal();
    });
    document.querySelectorAll('[data-preset-apply]').forEach(b => {
        b.addEventListener('click', () => {
            applyPresetByName(b.getAttribute('data-preset-apply'));
            closeModal();
        });
    });
    document.querySelectorAll('[data-preset-del]').forEach(b => {
        b.addEventListener('click', () => {
            deletePreset(b.getAttribute('data-preset-del'));
            showToast(t('presetsDeleted'));
            closeModal();
        });
    });
}
async function copyOnlineList() {
    const online = currentFiltered.filter(srv => serverResults[serverKey(srv)]?.online === true);
    if (online.length === 0) { showToast('❌ Нет онлайн'); return; }
    const list = online.map(srv => `${srv.address}:${srv.port}`).join('\n');
    try {
        await navigator.clipboard.writeText(list);
        showToast(`📋 ${online.length} серверов`);
    } catch { showToast('❌'); }
}
function openHelpModal() {
    const shortcuts = [
        ['/', 'Фокус на поиск'],
        ['Esc', 'Закрыть модалку'],
        ['R', 'Перезапустить сканирование'],
        ['T', 'Тема'],
        ['E', 'Экспорт JSON'],
        ['C', 'Экспорт CSV'],
        ['H', 'История'],
        ['L', 'Лог'],
        ['P', 'Пробы'],
        ['D', 'Дифф'],
        ['I', 'Импорт JSON'],
        ['Shift+Click', 'QR'],
        ['Click', 'Copy']
    ];
    const html = shortcuts.map(([k, d]) =>
        `<div class="shortcut-row"><span>${escapeHtml(d)}</span><span class="kbd">${escapeHtml(k)}</span></div>`
    ).join('') + `<div style="margin-top:14px;padding:10px 12px;background:var(--tag-bg);border-radius:8px;font-size:0.82rem;color:var(--text-dim);">
        💡 <b>Импорт JSON:</b> перетащите файл servers.json в окно браузера
    </div>
    <div style="margin-top:10px;padding:10px 12px;background:var(--tag-bg);border-radius:8px;font-size:0.82rem;color:var(--text-dim);">
        🤝 Партнёр: <a href="${PARTNER_LINK}" target="_blank" rel="noopener" style="color:#38bdf8;font-weight:700;">Real_Speak</a>
    </div>`;
    openModal('❓ Help', html);
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
    const set = (id, val) => { const el = document.getElementById(id); if (el) el.textContent = val; };
    set('totalCount', total);
    set('onlineCount', online);
    set('offlineCount', offline);
    set('playersTotal', players);
    set('avgConfidence', confCount > 0 ? Math.round(confSum / confCount) + '%' : '—');
    set('deadIpsCount', getDeadIPsCount());
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
        return {
            address: srv.address, port: srv.port,
            online: r.online === true,
            confidence: r.confidence ?? null,
            verified: r.verified ?? false,
            conflict: r.conflict ?? false,
            realMc: r.realMc ?? null,
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
            uptime: getUptime(key)?.percent ?? null,
            probes: r.probes || [],
            lastSeen: getLastSeen(key),
            scannedAt: new Date().toISOString()
        };
    });
}
function buildScannerFormat() {
    return allServers
        .filter(srv => serverResults[serverKey(srv)]?.online === true)
        .map(srv => {
            const key = serverKey(srv);
            const r = serverResults[key] || {};
            return {
                address: srv.address,
                port: srv.port,
                online: true,
                motd: r.motd || srv.motd || '',
                players_online: r.players ?? 0,
                players_max: r.maxPlayers ?? 20,
                version: r.version || srv.version || '—'
            };
        });
}
function exportJson() {
    downloadFile(JSON.stringify(buildExportData(), null, 2), `mcscanner-${dateStr()}.json`, 'application/json');
    showToast('💾 JSON');
}
function exportScannerFormat() {
    const data = buildScannerFormat();
    downloadFile(JSON.stringify(data, null, 2), `servers-online-${dateStr()}.json`, 'application/json');
    showToast(`💾 ${data.length} online`);
}
function exportCsv() {
    const data = buildExportData();
    const cols = ['address','port','online','confidence','verified','conflict','realMc','favorite','customName','players','maxPlayers','version','motd','tags','discord','bedrock','uptime','lastSeen'];
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
    if (!b) return;
    b.textContent = '⚠ ' + msg;
    b.classList.add('show');
}
function hideError() { document.getElementById('errorBanner')?.classList.remove('show'); }
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
    try {
        const reg = await navigator.serviceWorker.register('./sw.js', { updateViaCache: 'none' });
        setInterval(() => reg.update().catch(() => {}), 60_000);
        reg.addEventListener('updatefound', () => {
            const nw = reg.installing;
            if (!nw) return;
            nw.addEventListener('statechange', () => {
                if (nw.state === 'activated' && navigator.serviceWorker.controller) {
                    location.reload();
                }
            });
        });
        addLog('ok', 'SW registered');
    } catch (err) {
        addLog('warn', 'SW: ' + err.message);
    }
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
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'flex';
});
document.getElementById('installBtn')?.addEventListener('click', async () => {
    if (!deferredPrompt) return;
    deferredPrompt.prompt();
    await deferredPrompt.userChoice;
    deferredPrompt = null;
    const btn = document.getElementById('installBtn');
    if (btn) btn.style.display = 'none';
});

// ============================================================
//  CORNER PLAYER
// ============================================================
document.querySelector('.corner-player')?.addEventListener('click', () => {
    try {
        const ctx = new (window.AudioContext || window.webkitAudioContext)();
        const osc = ctx.createOscillator(), gain = ctx.createGain();
        osc.connect(gain); gain.connect(ctx.destination);
        osc.frequency.setValueAtTime(600, ctx.currentTime);
        osc.frequency.exponentialRampToValueAtTime(1200, ctx.currentTime + 0.08);
        osc.type = 'square';
        gain.gain.setValueAtTime(0.03, ctx.currentTime);
        gain.gain.exponentialRampToValueAtTime(0.001, ctx.currentTime + 0.15);
        osc.start(); osc.stop(ctx.currentTime + 0.15);
        setTimeout(() => ctx.close(), 200);
    } catch {}
});

// ============================================================
//  EVENTS
// ============================================================
function setupEvents() {
    ['searchInput','filterSelect','tagFilter','versionFilter','sortSelect','playersMin','playersMax'].forEach(id => {
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
            writeUrlParams();
        });
    });

    document.getElementById('refreshBtn')?.addEventListener('click', () => { scanner?.clearCache(); startScan(); });
    document.getElementById('stopBtn')?.addEventListener('click', () => { if (scanner) { scanner.abort(); showToast('⏹'); } });
    document.getElementById('shareBtn')?.addEventListener('click', copyShareUrl);
    document.getElementById('copyOnlineBtn')?.addEventListener('click', copyOnlineList);
    document.getElementById('diffBtn')?.addEventListener('click', openDiffModal);
    document.getElementById('exportBtn')?.addEventListener('click', exportJson);
    document.getElementById('exportScannerBtn')?.addEventListener('click', exportScannerFormat);
    document.getElementById('exportCsvBtn')?.addEventListener('click', exportCsv);
    document.getElementById('historyBtn')?.addEventListener('click', openHistoryModal);
    document.getElementById('compareBtn')?.addEventListener('click', openCompareModal);
    document.getElementById('logBtn')?.addEventListener('click', openLogModal);
    document.getElementById('probeStatsBtn')?.addEventListener('click', openProbeStatsModal);
    document.getElementById('clearCacheBtn')?.addEventListener('click', clearAllCaches);
    document.getElementById('themeToggle')?.addEventListener('click', toggleTheme);
    document.getElementById('notifToggle')?.addEventListener('click', toggleNotifications);
    document.getElementById('helpBtn')?.addEventListener('click', openHelpModal);
    document.getElementById('langToggle')?.addEventListener('click', toggleLang);
    document.getElementById('modalClose')?.addEventListener('click', closeModal);
    document.getElementById('modalBackdrop')?.addEventListener('click', (e) => {
        if (e.target.id === 'modalBackdrop') closeModal();
    });
    document.getElementById('loadMoreBtn')?.addEventListener('click', () => {
        displayedCount += PAGE_SIZE;
        renderServers(false);
    });
    document.getElementById('renameModeBtn')?.addEventListener('click', (e) => {
        renameMode = !renameMode;
        e.currentTarget.classList.toggle('active', renameMode);
        showToast(renameMode ? '✏️ on' : '✏️ off');
    });
    document.getElementById('discordBtn')?.addEventListener('click', openDiscordModal);
    document.getElementById('presetsBtn')?.addEventListener('click', openPresetsModal);

    document.getElementById('accentBtn')?.addEventListener('click', (e) => {
        e.stopPropagation();
        document.getElementById('accentPicker')?.classList.toggle('show');
    });
    document.querySelectorAll('.accent-swatch').forEach(s => {
        s.addEventListener('click', () => {
            setAccent(s.dataset.color);
            document.getElementById('accentPicker')?.classList.remove('show');
        });
    });
    document.addEventListener('click', (e) => {
        if (!e.target.closest('#accentPicker') && !e.target.closest('#accentBtn')) {
            document.getElementById('accentPicker')?.classList.remove('show');
        }
    });

    document.addEventListener('keydown', (e) => {
        const inInput = ['INPUT', 'TEXTAREA', 'SELECT'].includes(document.activeElement.tagName);
        if (e.key === 'Escape') {
            if (document.getElementById('modalBackdrop')?.classList.contains('show')) closeModal();
            else if (inInput) document.activeElement.blur();
            return;
        }
        if (inInput) return;
        switch (e.key.toLowerCase()) {
            case '/': e.preventDefault(); document.getElementById('searchInput')?.focus(); break;
            case 'r': scanner?.clearCache(); startScan(); break;
            case 't': toggleTheme(); break;
            case 'e': exportJson(); break;
            case 'c': exportCsv(); break;
            case 'h': openHistoryModal(); break;
            case 'l': openLogModal(); break;
            case 'p': openProbeStatsModal(); break;
            case 'd': openDiffModal(); break;
            case 'i': document.getElementById('fileInput')?.click(); break;
            case '?': openHelpModal(); break;
        }
    });
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
    if ($('filterSelect')) $('filterSelect').value = 'all';
    if ($('tagFilter')) $('tagFilter').value = '';
    if ($('versionFilter')) $('versionFilter').value = '';
    if ($('playersMin')) $('playersMin').value = '0';
    if ($('playersMax')) $('playersMax').value = '10000';
    if ($('searchInput')) $('searchInput').value = '';

    switch (name) {
        case 'online-players': if ($('filterSelect')) $('filterSelect').value = 'has-players'; break;
        case 'anomalies': openAnomaliesModal(); break;
        case 'dead-ips': openDeadIPsModal(); break;
        case 'favorites': if ($('filterSelect')) $('filterSelect').value = 'favorites'; break;
        case 'clones': openClonesModal(); break;
    }
    renderServers();
    writeUrlParams();
}

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
setupDragAndDrop();
setupMobileNav();
setupEvents();
renderSavedPresets();
renderDailyStats();

document.querySelectorAll('.view-btn').forEach(b => {
    b.classList.toggle('active', b.dataset.view === viewMode);
});

addLog('ok', `${APP_NAME} v5.0`);
console.log(`[${APP_NAME}] v5.0 started. Author: ${APP_AUTHOR}. Partner: Real_Speak`);
console.log(`Owner UUID: ${OWNER_UUID}`);
console.log(`Telegram: ${TG_LINK}`);

loadServersFromJson();
