// ============================================================
//  MCscanner — by Real_Studio — v3.1
//  Собственный движок сканирования + cross-verification
//  API используются как "пробы" для проверки работы серверов
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
    logs: 'mcscanner_logs'
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
//  ПРОБЫ (API endpoints)
// ============================================================
const PROBES = [
    {
        id: 'mcsrvstat',
        name: 'mcsrvstat.us',
        role: 'primary',
        url: (h, p) => `https://api.mcsrvstat.us/3/${h}${p && p !== 25565 ? ':' + p : ''}`,
        headers: { 'User-Agent': `${APP_NAME}/3.1 (by ${APP_AUTHOR})` },
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
        id: 'mcstatus',
        name: 'mcstatus.io',
        role: 'secondary',
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
        id: 'mcapi',
        name: 'mcapi.us',
        role: 'tiebreaker',
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
    },
    {
        id: 'bedrock',
        name: 'mcsrvstat.us (bedrock)',
        role: 'bedrock',
        url: (h) => `https://api.mcsrvstat.us/bedrock/3/${h}:19132`,
        headers: { 'User-Agent': `${APP_NAME}/3.1 (by ${APP_AUTHOR})` },
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
        PROBES.forEach(p => this.probeStats.set(p.id, { ok: 0, fail: 0, totalMs: 0 }));
    }

    on(evt, cb) {
        (this.events[evt] ||= []).push(cb);
        return this;
    }
    emit(evt, data) {
        (this.events[evt] || []).forEach(cb => { try { cb(data); } catch {} });
    }

    async queryProbe(probe, address, port) {
        const t0 = performance.now();
        const controller = new AbortController();
        const timer = setTimeout(() => controller.abort(), this.config.probeTimeoutMs);

        try {
            const url = probe.url(address, port);
            const res = await fetch(url, {
                headers: { 'Accept': 'application/json', ...probe.headers },
                signal: controller.signal,
                cache: 'no-store'
            });
            clearTimeout(timer);
            const ms = Math.round(performance.now() - t0);

            if (!res.ok) {
                return { probeId: probe.id, probeName: probe.name, ok: false, error: `HTTP ${res.status}`, ms };
            }

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
                probes: results.map(r => this.probeInfo(r)),
                reason: 'no_probe_succeeded'
            };
        }

        const onlineVotes = successful.filter(r => r.data.online).length;
        const offlineVotes = successful.length - onlineVotes;
        const decision = onlineVotes > offlineVotes ? true
            : offlineVotes > onlineVotes ? false
            : successful[0].data.online;

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
            agreeCount: agreeing.length, totalCount: successful.length,
            failedCount: failed.length
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
        const needTiebreaker = !bothOk || !agree;

        if (needTiebreaker && tiebreaker) {
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
    if (min < 1) return 'только что';
    if (min < 60) return `${min} мин назад`;
    const h = Math.floor(min / 60);
    if (h < 24) return `${h} ч назад`;
    const days = Math.floor(h / 24);
    if (days < 30) return `${days} дн назад`;
    return new Date(ts).toLocaleDateString('ru-RU');
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
        showToast('🔔 Уведомления выключены');
        updateNotifBtn();
        return;
    }
    if (!('Notification' in window)) { showToast('❌ Не поддерживается'); return; }
    const perm = await Notification.requestPermission();
    if (perm === 'granted') { lsSet(LS.notif, true); showToast('🔔 Уведомления включены'); }
    else showToast('❌ Разрешение не получено');
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
}

function writeUrlParams() {
    const p = new URLSearchParams();
    const v = (id) => document.getElementById(id)?.value;
    if (v('searchInput')) p.set('q', v('searchInput'));
    if (v('filterSelect') && v('filterSelect') !== 'all') p.set('filter', v('filterSelect'));
    if (v('tagFilter')) p.set('tag', v('tagFilter'));
    if (v('versionFilter')) p.set('ver', v('versionFilter'));
    if (v('sortSelect') && v('sortSelect') !== 'status') p.set('sort', v('sortSelect'));

    const newUrl = p.toString() ? `?${p}` : location.pathname;
    history.replaceState(null, '', newUrl);
}

function copyShareUrl() {
    navigator.clipboard.writeText(location.href).then(() => {
        showToast('🔗 Ссылка скопирована');
    }).catch(() => showToast('❌ Не удалось скопировать'));
}

// ============================================================
//  SCANNER SETUP
// ============================================================
function createScanner() {
    const s = new ServerScanner();

    s.on('scan:start', ({ total }) => {
        addLog('ok', `Сканер запущен: ${total} серверов`);
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
            notify('⚠️ Сервер упал', key);
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

// ============================================================
//  PROGRESS / PANEL
// ============================================================
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
    if (n && name) n.textContent = `Сейчас: ${name}`;
}

function updateScannerPanel() {
    const panel = document.getElementById('scannerPanel');
    if (!panel) return;
    if (!scanner?.running && scanMetrics.agreeCount === 0) {
        panel.style.display = 'none';
        return;
    }
    panel.style.display = 'grid';

    const avgAgree = scanMetrics.agreeCount > 0
        ? Math.round(scanMetrics.agreeSum / scanMetrics.agreeCount) : 0;
    const avgLatency = scanMetrics.latencyCount > 0
        ? Math.round(scanMetrics.latencySum / scanMetrics.latencyCount) : 0;

    const el = (id) => document.getElementById(id);
    if (el('spAgreement')) el('spAgreement').textContent = avgAgree + '%';
    if (el('spLatency')) el('spLatency').textContent = avgLatency + ' мс';
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
        if (!Array.isArray(data)) throw new Error('JSON должен быть массивом');

        allServers = data;
        serverResults = {};
        allServers.forEach(srv => {
            serverResults[serverKey(srv)] = { _scanning: true, online: null };
        });

        hideError();
        renderServers();
        updateStats();

        scanner = createScanner();
        startScan();
    } catch (err) {
        addLog('err', 'loadServers: ' + err.message);
        showError(`Ошибка загрузки servers.json: ${err.message}`);
        document.getElementById('serverGrid').innerHTML = `
            <div class="empty-state">
                ❌ Не удалось загрузить список.<br><br>
                Проверьте, что <code>servers.json</code> в одной папке с <code>index.html</code><br>
                и сайт открыт через <code>http(s)://</code>.<br><br>
                <small style="color:#555">${escapeHtml(err.message)}</small>
            </div>`;
    }
}

async function startScan() {
    if (!scanner || scanner.running) return;

    const refreshBtn = document.getElementById('refreshBtn');
    const stopBtn = document.getElementById('stopBtn');
    refreshBtn.disabled = true;
    refreshBtn.textContent = '⏳ Сканирование...';
    stopBtn.style.display = 'inline-block';

    document.getElementById('scannerPanel').style.display = 'grid';

    await scanner.scanAll(allServers);

    refreshBtn.disabled = false;
    refreshBtn.textContent = '🔄 Обновить всё';
    stopBtn.style.display = 'none';

    markScanned();
    updateLastUpdate();
    updateProgress(0, 0);
    renderServers();
    updateStats();
    updateScannerPanel();
    saveHistory();
    playBeep();
    showToast(`✅ Сканирование завершено: ${allServers.length} серверов`);
    gtag('event', 'scan_complete', {
        total_servers: allServers.length,
        avg_confidence: Math.round(scanMetrics.agreeSum / Math.max(1, scanMetrics.agreeCount)),
        conflicts: scanMetrics.conflicts
    });
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

// ============================================================
//  FILTER / SORT
// ============================================================
function getFilteredAndSorted() {
    const q = document.getElementById('searchInput').value.toLowerCase().trim();
    const filter = document.getElementById('filterSelect').value;
    const tagFilter = document.getElementById('tagFilter').value;
    const verFilter = document.getElementById('versionFilter').value;
    const sort = document.getElementById('sortSelect').value;

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
    return stripMinecraftColors(src.split('\n')[0]) || 'Без названия';
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
        grid.innerHTML = '<div class="empty-state">Нет серверов, соответствующих фильтру.</div>';
        document.getElementById('loadMoreWrap').style.display = 'none';
        return;
    }

    grid.innerHTML = visible.map(cardHtml).join('');
    bindCardEvents(grid);

    const wrap = document.getElementById('loadMoreWrap');
    if (currentFiltered.length > displayedCount) {
        wrap.style.display = 'block';
        document.getElementById('loadMoreCount').textContent = `(${currentFiltered.length - displayedCount})`;
    } else {
        wrap.style.display = 'none';
    }
}

function cardHtml(srv) {
    const key = serverKey(srv);
    const r = serverResults[key] || {};
    const scanning = r.online == null || r._scanning;
    const online = r.online === true;
    const offline = r.online === false;
    const status = scanning ? 'checking' : (online ? 'online' : 'offline');
    const conflictClass = r.conflict ? ' conflict' : '';

    const fav = isFavorite(key);
    const customName = getCustomName(key);
    const title = getTitle(srv);
    const isCustom = !!customName;

    const statusLabels = { online: 'Онлайн', offline: 'Офлайн', checking: 'Скан' };

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
            const cls = p.status === 'agree' ? 'agree'
                : p.status === 'disagree' ? 'disagree'
                : p.status === 'failed' ? 'failed' : '';
            const tip = `${p.name}: ${p.status === 'failed' ? 'ошибка ' + (p.error || '') : (p.online ? 'онлайн' : 'офлайн')} (${p.ms} мс)`;
            return `<div class="probe-chip ${cls}" title="${escapeHtml(tip)}"></div>`;
        }).join('')}</div>`;
    } else if (scanning) {
        probesHtml = `<div class="probe-chips">
            <div class="probe-chip checking"></div>
            <div class="probe-chip checking"></div>
        </div>`;
    }

    let confHtml = '';
    if (typeof r.confidence === 'number' && !scanning) {
        const cls = r.confidence >= 90 ? 'high' : r.confidence >= 60 ? 'medium' : 'low';
        confHtml = `
            <div class="confidence-bar" title="Согласие проб: ${r.confidence}%">
                <div class="bar"><div class="fill ${cls}" style="width:${r.confidence}%"></div></div>
                <span>${r.confidence}%</span>
            </div>`;
    }

    const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
    const discord = extractDiscord(r.motd || srv.motd);
    const hasBedrock = bedrockSupport[key] === true;

    let tagsHtml = '';
    if (tags.length > 0 || discord || hasBedrock) {
        const els = tags.map(t => `<span class="tag">${t}</span>`);
        if (discord) els.push(`<span class="tag discord">💬 Discord</span>`);
        if (hasBedrock) els.push(`<span class="tag bedrock">Bedrock</span>`);
        tagsHtml = `<div class="tags">${els.join('')}</div>`;
    }

    let lastSeenHtml = '';
    if (offline && !scanning) {
        const ts = getLastSeen(key);
        if (ts) lastSeenHtml = `<div class="last-seen">📅 Был онлайн: ${formatLastSeen(ts)}</div>`;
    }

    const hasPlayerList = online && Array.isArray(r.playerList) && r.playerList.length > 0;
    const pcClass = hasPlayerList ? 'player-count clickable' : 'player-count';
    const pcTitle = hasPlayerList ? 'Нажмите, чтобы увидеть список' : '';

    return `
        <div class="server-card ${status}${conflictClass} ${fav ? 'is-favorite' : ''}" data-key="${escapeHtml(key)}">
            <button class="fav-btn ${fav ? 'active' : ''}" data-fav="${escapeHtml(key)}" title="Избранное">${fav ? '★' : '☆'}</button>
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
                    <div class="server-address" data-address="${escapeHtml(key)}" title="Клик — копировать, Shift+клик — QR">
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
        showToast(nowFav ? '⭐ Добавлено в избранное' : 'Убрано из избранного');
    });

    const addr = card.querySelector('.server-address');
    if (addr) addr.addEventListener('click', async (e) => {
        e.stopPropagation();
        const key = addr.getAttribute('data-address');
        if (e.shiftKey) { openQrModal(key); return; }
        try {
            await navigator.clipboard.writeText(key);
            addr.classList.add('copied');
            showToast('📋 Скопировано: ' + key);
            setTimeout(() => addr.classList.remove('copied'), 1200);
        } catch { showToast('❌ Не удалось'); }
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
            const newName = prompt(`Новое имя для ${key}:`, cur);
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
    const r = serverResults[key] || {};
    const list = r.playerList || [];

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
            const t = new Date(l.t).toLocaleTimeString('ru-RU');
            return `<div class="log-item ${l.level}"><span class="time">${t}</span><span>${escapeHtml(l.msg)}</span></div>`;
        }).join('');
    }
    openModal('📋 Лог сканирования', html);
}

function openHistoryModal() {
    const h = getHistory();
    let html;
    if (h.length === 0) html = '<div class="modal-empty">История пуста</div>';
    else html = h.map(snap => {
        const date = new Date(snap.t).toLocaleString('ru-RU');
        return `<div class="history-item"><span>${date}</span><span style="margin-left:auto;color:var(--accent);">${snap.online} / ${snap.total}</span></div>`;
    }).join('');
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
            changes.push({ k: s.k, text: s.online ? '⬆️ Стал онлайн' : '⬇️ Упал', level: s.online ? 'ok' : 'err' });
        } else if (s.online && Math.abs(s.players - p.players) >= 3) {
            const diff = s.players - p.players;
            changes.push({ k: s.k, text: `${diff > 0 ? '📈' : '📉'} ${p.players} → ${s.players}`, level: 'warn' });
        }
    });

    const from = new Date(prev.t).toLocaleString('ru-RU');
    const to = new Date(cur.t).toLocaleString('ru-RU');

    let html = `<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">Сравнение: <b>${from}</b> → <b>${to}</b></div>`;
    if (changes.length === 0) html += '<div class="modal-empty">Ничего значимого не изменилось</div>';
    else html += changes.map(c =>
        `<div class="log-item ${c.level}"><span style="flex:1;font-family:monospace;font-size:0.78rem;">${escapeHtml(c.k)}</span><span>${escapeHtml(c.text)}</span></div>`
    ).join('');
    openModal('🔀 Сравнение сканирований', html);
}

function openProbeStatsModal() {
    const stats = scanner?.getProbeStats() || {};
    const probeList = PROBES.filter(p => p.role !== 'bedrock');
    let html = '<div style="margin-bottom:12px;color:var(--text-dim);font-size:0.85rem;">Статистика проб (API, используемых для проверки работы серверов):</div>';

    html += probeList.map(p => {
        const s = stats[p.id] || { ok: 0, fail: 0, totalMs: 0 };
        const total = s.ok + s.fail;
        const avgMs = total > 0 ? Math.round(s.totalMs / total) : 0;
        const successRate = total > 0 ? Math.round((s.ok / total) * 100) : 0;
        return `<div class="probe-row">
            <span class="probe-name">${escapeHtml(p.name)}</span>
            <span class="probe-stat">✅ <b>${s.ok}</b></span>
            <span class="probe-stat">❌ <b>${s.fail}</b></span>
            <span class="probe-stat">⚡ <b>${avgMs} мс</b></span>
            <span class="probe-stat" style="margin-left:auto;color:var(--accent);"><b>${successRate}%</b></span>
        </div>`;
    }).join('');

    html += `<div style="margin-top:14px;padding:10px 12px;background:var(--tag-bg);border-radius:8px;font-size:0.82rem;color:var(--text-dim);">
        🧠 <b>Свой движок сканирования:</b> каждая проба запускается отдельно с таймаутом ${SCANNER_CONFIG.probeTimeoutMs / 1000} сек
        и ${SCANNER_CONFIG.retryMax} retry при ошибке. Cross-verification сравнивает ответы
        primary + secondary; при расхождении подключается tiebreaker.
    </div>`;

    openModal('📡 Статистика проб', html);
}

function openHelpModal() {
    const shortcuts = [
        ['/', 'Фокус на поиск'],
        ['Esc', 'Закрыть модалку / снять фокус'],
        ['R', 'Перезапустить сканирование'],
        ['T', 'Переключить тему'],
        ['E', 'Экспорт JSON'],
        ['C', 'Экспорт CSV'],
        ['H', 'История'],
        ['L', 'Лог'],
        ['P', 'Статистика проб'],
        ['?', 'Эта справка'],
        ['Shift+клик по адресу', 'QR-код'],
        ['Клик по адресу', 'Копировать'],
        ['Клик по числу игроков', 'Список игроков'],
        ['Клик по имени (режим ✏️)', 'Переименовать']
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
    document.getElementById('avgConfidence').textContent =
        confCount > 0 ? Math.round(confSum / confCount) + '%' : '—';
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
        const r = serverResults[key] || {};
        const tags = extractTags(r.motd || srv.motd, r.version || srv.version);
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
            probes: r.probes || [],
            lastSeen: getLastSeen(key),
            scannedAt: new Date().toISOString()
        };
    });
}

function exportJson() {
    downloadFile(JSON.stringify(buildExportData(), null, 2), `mcscanner-${dateStr()}.json`, 'application/json');
    showToast('💾 JSON сохранён');
    gtag('event', 'export', { format: 'json' });
}

function exportCsv() {
    const data = buildExportData();
    const cols = ['address','port','online','confidence','verified','conflict','favorite','customName','players','maxPlayers','version','motd','tags','discord','bedrock','lastSeen'];
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
function hideError() { document.getElementById('errorBanner').classList.remove('show'); }
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
//  SW / PWA
// ============================================================
async function registerSW() {
    if (!('serviceWorker' in navigator)) return;
    try { await navigator.serviceWorker.register('./sw.js'); addLog('ok', 'SW зарегистрирован'); }
    catch (err) { addLog('warn', 'SW: ' + err.message); }
}
async function clearAllCaches() {
    if (scanner) scanner.clearCache();
    if ('caches' in window) {
        const keys = await caches.keys();
        await Promise.all(keys.map(k => caches.delete(k)));
    }
    showToast('🗑️ Кэш сканера очищен');
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
['searchInput','filterSelect','tagFilter','versionFilter','sortSelect'].forEach(id => {
    const el = document.getElementById(id);
    if (!el) return;
    const evt = id === 'searchInput' ? 'input' : 'change';
    el.addEventListener(evt, () => {
        renderServers(true);
        writeUrlParams();
    });
});

document.getElementById('refreshBtn').addEventListener('click', () => { scanner?.clearCache(); startScan(); });
document.getElementById('stopBtn').addEventListener('click', () => {
    if (scanner) { scanner.abort(); showToast('⏹ Сканирование остановлено'); }
});
document.getElementById('shareBtn').addEventListener('click', copyShareUrl);
document.getElementById('exportBtn').addEventListener('click', exportJson);
document.getElementById('exportCsvBtn').addEventListener('click', exportCsv);
document.getElementById('historyBtn').addEventListener('click', openHistoryModal);
document.getElementById('compareBtn').addEventListener('click', openCompareModal);
document.getElementById('logBtn').addEventListener('click', openLogModal);
document.getElementById('probeStatsBtn').addEventListener('click', openProbeStatsModal);
document.getElementById('clearCacheBtn').addEventListener('click', clearAllCaches);
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
readUrlParams();

addLog('ok', `${APP_NAME} v3.1 — собственный движок сканирования`);
console.log(`[${APP_NAME}] Сканер запущен. Автор: ${APP_AUTHOR}.`);
console.log(`[${APP_NAME}] Конфиг: ${JSON.stringify(SCANNER_CONFIG)}`);

if (shouldAutoScan()) console.log(`[${APP_NAME}] Еженедельное сканирование`);

loadServersFromJson();
