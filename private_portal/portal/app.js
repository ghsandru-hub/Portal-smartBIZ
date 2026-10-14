// =============================================================
// smartBIZ Portal — Frontend
// =============================================================

const API_BASE = '/api';

// ---------- API client ----------

async function api(path, options) {
    options = options || {};
    const opts = {
        credentials: 'include',
        headers: Object.assign({ 'Content-Type': 'application/json' }, options.headers || {}),
        method: options.method || 'GET',
    };
    if (options.body !== undefined) {
        opts.body = typeof options.body === 'string' ? options.body : JSON.stringify(options.body);
    }
    let res, data;
    try {
        res = await fetch(API_BASE + path, opts);
        const text = await res.text();
        data = text ? JSON.parse(text) : {};
    } catch (e) {
        throw new Error('Eroare de retea. Verifica conexiunea.');
    }
    if (!res.ok) throw new Error(data.error || ('Eroare ' + res.status));
    return data;
}

// ---------- Constants ----------

const PALETTE = [
    '#2D8B8E', '#1F4788', '#2A5899', '#4A90B5',
    '#d97706', '#16a34a', '#dc2626', '#9333ea',
    '#db2777', '#0891b2', '#65a30d', '#0f766e',
    '#7c3aed', '#ea580c', '#475569', '#0284c7'
];

// 36 inline SVG icons for sections (no network calls)
const ICON_SET = {
    'folder':       '<path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/>',
    'briefcase':    '<path d="M16 20V4a2 2 0 0 0-2-2h-4a2 2 0 0 0-2 2v16"/><rect width="20" height="14" x="2" y="6" rx="2"/>',
    'building':     '<rect x="4" y="2" width="16" height="20" rx="2"/><path d="M9 22v-4h6v4"/><path d="M8 6h.01"/><path d="M16 6h.01"/><path d="M12 6h.01"/><path d="M12 10h.01"/><path d="M12 14h.01"/><path d="M16 10h.01"/><path d="M16 14h.01"/><path d="M8 10h.01"/><path d="M8 14h.01"/>',
    'home':         '<path d="m3 9 9-7 9 7v11a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2z"/><polyline points="9 22 9 12 15 12 15 22"/>',
    'store':        '<path d="m2 7 4.41-4.41A2 2 0 0 1 7.83 2h8.34a2 2 0 0 1 1.42.59L22 7"/><path d="M4 12v8a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2v-8"/><path d="M15 22v-4a2 2 0 0 0-2-2h-2a2 2 0 0 0-2 2v4"/><path d="M2 7h20"/>',
    'plane':        '<path d="M17.8 19.2 16 11l3.5-3.5C21 6 21.5 4 21 3c-1-.5-3 0-4.5 1.5L13 8 4.8 6.2c-.5-.1-.9.1-1.1.5l-.3.5c-.2.5-.1 1 .3 1.3L9 12l-2 3H4l-1 1 3 2 2 3 1-1v-3l3-2 3.5 5.3c.3.4.8.5 1.3.3l.5-.2c.4-.3.6-.7.5-1.2z"/>',
    'truck':        '<path d="M14 18V6a2 2 0 0 0-2-2H4a2 2 0 0 0-2 2v11a1 1 0 0 0 1 1h2"/><path d="M15 18H9"/><path d="M19 18h2a1 1 0 0 0 1-1v-3.65a1 1 0 0 0-.22-.624l-3.48-4.35A1 1 0 0 0 17.52 8H14"/><circle cx="17" cy="18" r="2"/><circle cx="7" cy="18" r="2"/>',
    'package':      '<path d="m7.5 4.27 9 5.15"/><path d="M21 8a2 2 0 0 0-1-1.73l-7-4a2 2 0 0 0-2 0l-7 4A2 2 0 0 0 3 8v8a2 2 0 0 0 1 1.73l7 4a2 2 0 0 0 2 0l7-4A2 2 0 0 0 21 16Z"/><path d="m3.3 7 8.7 5 8.7-5"/><path d="M12 22V12"/>',

    'dollar-sign':  '<line x1="12" x2="12" y1="2" y2="22"/><path d="M17 5H9.5a3.5 3.5 0 0 0 0 7h5a3.5 3.5 0 0 1 0 7H6"/>',
    'credit-card':  '<rect width="20" height="14" x="2" y="5" rx="2"/><line x1="2" x2="22" y1="10" y2="10"/>',
    'receipt':      '<path d="M4 2v20l2-1 2 1 2-1 2 1 2-1 2 1 2-1 2 1V2l-2 1-2-1-2 1-2-1-2 1-2-1-2 1Z"/><path d="M16 8h-6a2 2 0 1 0 0 4h4a2 2 0 1 1 0 4H8"/><path d="M12 17.5v-11"/>',
    'calculator':   '<rect width="16" height="20" x="4" y="2" rx="2"/><line x1="8" x2="16" y1="6" y2="6"/><line x1="16" x2="16" y1="14" y2="18"/><path d="M16 10h.01"/><path d="M12 10h.01"/><path d="M8 10h.01"/><path d="M12 14h.01"/><path d="M8 14h.01"/><path d="M12 18h.01"/><path d="M8 18h.01"/>',
    'trending-up':  '<polyline points="22 7 13.5 15.5 8.5 10.5 2 17"/><polyline points="16 7 22 7 22 13"/>',
    'chart-bar':    '<line x1="12" x2="12" y1="20" y2="10"/><line x1="18" x2="18" y1="20" y2="4"/><line x1="6" x2="6" y1="20" y2="16"/><line x1="3" x2="21" y1="20" y2="20"/>',
    'chart-pie':    '<path d="M21.21 15.89A10 10 0 1 1 8 2.83"/><path d="M22 12A10 10 0 0 0 12 2v10z"/>',
    'wallet':       '<path d="M21 12V7H5a2 2 0 0 1 0-4h14v4"/><path d="M3 5v14a2 2 0 0 0 2 2h16v-5"/><path d="M18 12a2 2 0 0 0 0 4h4v-4Z"/>',

    'file-text':    '<path d="M14.5 2H6a2 2 0 0 0-2 2v16a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V7.5L14.5 2z"/><polyline points="14 2 14 8 20 8"/><line x1="16" x2="8" y1="13" y2="13"/><line x1="16" x2="8" y1="17" y2="17"/><line x1="10" x2="8" y1="9" y2="9"/>',
    'clipboard':    '<rect width="8" height="4" x="8" y="2" rx="1" ry="1"/><path d="M16 4h2a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H6a2 2 0 0 1-2-2V6a2 2 0 0 1 2-2h2"/><path d="M12 11h4"/><path d="M12 16h4"/><path d="M8 11h.01"/><path d="M8 16h.01"/>',
    'archive':      '<rect width="20" height="5" x="2" y="3" rx="1"/><path d="M4 8v11a2 2 0 0 0 2 2h12a2 2 0 0 0 2-2V8"/><path d="M10 12h4"/>',
    'book':         '<path d="M2 3h6a4 4 0 0 1 4 4v14a3 3 0 0 0-3-3H2z"/><path d="M22 3h-6a4 4 0 0 0-4 4v14a3 3 0 0 1 3-3h7z"/>',

    'mail':         '<rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/>',
    'message':      '<path d="M21 15a2 2 0 0 1-2 2H7l-4 4V5a2 2 0 0 1 2-2h14a2 2 0 0 1 2 2z"/>',
    'phone':        '<path d="M22 16.92v3a2 2 0 0 1-2.18 2 19.79 19.79 0 0 1-8.63-3.07 19.5 19.5 0 0 1-6-6 19.79 19.79 0 0 1-3.07-8.67A2 2 0 0 1 4.11 2h3a2 2 0 0 1 2 1.72 12.84 12.84 0 0 0 .7 2.81 2 2 0 0 1-.45 2.11L8.09 9.91a16 16 0 0 0 6 6l1.27-1.27a2 2 0 0 1 2.11-.45 12.84 12.84 0 0 0 2.81.7A2 2 0 0 1 22 16.92z"/>',
    'bell':         '<path d="M6 8a6 6 0 0 1 12 0c0 7 3 9 3 9H3s3-2 3-9"/><path d="M10.3 21a1.94 1.94 0 0 0 3.4 0"/>',

    'calendar':     '<rect width="18" height="18" x="3" y="4" rx="2"/><line x1="16" x2="16" y1="2" y2="6"/><line x1="8" x2="8" y1="2" y2="6"/><line x1="3" x2="21" y1="10" y2="10"/>',
    'clock':        '<circle cx="12" cy="12" r="10"/><polyline points="12 6 12 12 16 14"/>',

    'database':     '<ellipse cx="12" cy="5" rx="9" ry="3"/><path d="M3 5V19A9 3 0 0 0 21 19V5"/><path d="M3 12A9 3 0 0 0 21 12"/>',
    'server':       '<rect width="20" height="8" x="2" y="2" rx="2" ry="2"/><rect width="20" height="8" x="2" y="14" rx="2" ry="2"/><line x1="6" x2="6.01" y1="6" y2="6"/><line x1="6" x2="6.01" y1="18" y2="18"/>',
    'cloud':        '<path d="M17.5 19a4.5 4.5 0 1 0 0-9h-1.8A7 7 0 1 0 4 16.6"/>',
    'code':         '<polyline points="16 18 22 12 16 6"/><polyline points="8 6 2 12 8 18"/>',
    'terminal':     '<polyline points="4 17 10 11 4 5"/><line x1="12" x2="20" y1="19" y2="19"/>',

    'settings':     '<path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/>',
    'key':          '<circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/>',
    'shield':       '<path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/>',
    'star':         '<polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/>',
    'globe':        '<circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/>',
    'users':        '<path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/>',
};

const ICON_NAMES = Object.keys(ICON_SET);

function iconSvg(name, size) {
    size = size || 16;
    const inner = ICON_SET[name] || ICON_SET['folder'];
    return '<svg xmlns="http://www.w3.org/2000/svg" width="' + size + '" height="' + size + '" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round">' + inner + '</svg>';
}

// ---------- State ----------

const state = {
    view: 'loading',
    user: null,
    theme: localStorage.getItem('lp:theme') || 'dark',
    activeTab: localStorage.getItem('lp:activeTab') || 'apps',
    appsSections: [],
    favSections: [],
    activeAppsSectionId: localStorage.getItem('lp:activeAppsSection') || null,
    activeFavSectionId: localStorage.getItem('lp:activeFavSection') || null,
    search: '',
    modal: null,
    helpOpen: false,
    helpSection: 'intro',
    adminCompanyFilter: '',
    viewingAsUser: null,  // {id, username, originalAdminId}
};

function setState(partial) {
    Object.assign(state, partial);
    persistPreferences();
    render();
}

function persistPreferences() {
    localStorage.setItem('lp:theme', state.theme);
    localStorage.setItem('lp:activeTab', state.activeTab);
    if (state.activeAppsSectionId) localStorage.setItem('lp:activeAppsSection', state.activeAppsSectionId);
    else localStorage.removeItem('lp:activeAppsSection');
    if (state.activeFavSectionId) localStorage.setItem('lp:activeFavSection', state.activeFavSectionId);
    else localStorage.removeItem('lp:activeFavSection');
}

// ---------- Inline UI icons (separate from picker set) ----------

const UI = {
    layers: '<svg xmlns="http://www.w3.org/2000/svg" width="22" height="22" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 2 7 12 12 22 7 12 2"/><polyline points="2 17 12 22 22 17"/><polyline points="2 12 12 17 22 12"/></svg>',
    user: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    userSmall: '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M20 21v-2a4 4 0 0 0-4-4H8a4 4 0 0 0-4 4v2"/><circle cx="12" cy="7" r="4"/></svg>',
    lock: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect x="3" y="11" width="18" height="11" rx="2" ry="2"/><path d="M7 11V7a5 5 0 0 1 10 0v4"/></svg>',
    key: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="7.5" cy="15.5" r="5.5"/><path d="m21 2-9.6 9.6"/><path d="m15.5 7.5 3 3L22 7l-3-3"/></svg>',
    eye: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M2 12s3-7 10-7 10 7 10 7-3 7-10 7-10-7-10-7Z"/><circle cx="12" cy="12" r="3"/></svg>',
    eyeOff: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9.88 9.88a3 3 0 1 0 4.24 4.24"/><path d="M10.73 5.08A10.43 10.43 0 0 1 12 5c7 0 10 7 10 7a13.16 13.16 0 0 1-1.67 2.68"/><path d="M6.61 6.61A13.526 13.526 0 0 0 2 12s3 7 10 7a9.74 9.74 0 0 0 5.39-1.61"/><line x1="2" x2="22" y1="2" y2="22"/></svg>',
    shield: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 22s8-4 8-10V5l-8-3-8 3v7c0 6 8 10 8 10z"/></svg>',
    chevronRight: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="9 18 15 12 9 6"/></svg>',
    sun: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="4"/><path d="M12 2v2"/><path d="M12 20v2"/><path d="m4.93 4.93 1.41 1.41"/><path d="m17.66 17.66 1.41 1.41"/><path d="M2 12h2"/><path d="M20 12h2"/><path d="m6.34 17.66-1.41 1.41"/><path d="m19.07 4.93-1.41 1.41"/></svg>',
    moon: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12 3a6 6 0 0 0 9 9 9 9 0 1 1-9-9Z"/></svg>',
    search: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="11" cy="11" r="8"/><path d="m21 21-4.3-4.3"/></svg>',
    settings: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M12.22 2h-.44a2 2 0 0 0-2 2v.18a2 2 0 0 1-1 1.73l-.43.25a2 2 0 0 1-2 0l-.15-.08a2 2 0 0 0-2.73.73l-.22.38a2 2 0 0 0 .73 2.73l.15.1a2 2 0 0 1 1 1.72v.51a2 2 0 0 1-1 1.74l-.15.09a2 2 0 0 0-.73 2.73l.22.38a2 2 0 0 0 2.73.73l.15-.08a2 2 0 0 1 2 0l.43.25a2 2 0 0 1 1 1.73V20a2 2 0 0 0 2 2h.44a2 2 0 0 0 2-2v-.18a2 2 0 0 1 1-1.73l.43-.25a2 2 0 0 1 2 0l.15.08a2 2 0 0 0 2.73-.73l.22-.39a2 2 0 0 0-.73-2.73l-.15-.08a2 2 0 0 1-1-1.74v-.5a2 2 0 0 1 1-1.74l.15-.09a2 2 0 0 0 .73-2.73l-.22-.38a2 2 0 0 0-2.73-.73l-.15.08a2 2 0 0 1-2 0l-.43-.25a2 2 0 0 1-1-1.73V4a2 2 0 0 0-2-2z"/><circle cx="12" cy="12" r="3"/></svg>',
    logout: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M9 21H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h4"/><polyline points="16 17 21 12 16 7"/><line x1="21" x2="9" y1="12" y2="12"/></svg>',
    plus: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M5 12h14"/><path d="M12 5v14"/></svg>',
    x: '<svg xmlns="http://www.w3.org/2000/svg" width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M18 6 6 18"/><path d="m6 6 12 12"/></svg>',
    edit: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M11 4H4a2 2 0 0 0-2 2v14a2 2 0 0 0 2 2h14a2 2 0 0 0 2-2v-7"/><path d="M18.5 2.5a2.121 2.121 0 0 1 3 3L12 15l-4 1 1-4 9.5-9.5z"/></svg>',
    trash: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 6h18"/><path d="M19 6v14a2 2 0 0 1-2 2H7a2 2 0 0 1-2-2V6"/><path d="M8 6V4a2 2 0 0 1 2-2h4a2 2 0 0 1 2 2v2"/></svg>',
    grid: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    gridLarge: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><rect width="7" height="7" x="3" y="3" rx="1"/><rect width="7" height="7" x="14" y="3" rx="1"/><rect width="7" height="7" x="14" y="14" rx="1"/><rect width="7" height="7" x="3" y="14" rx="1"/></svg>',
    star: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polygon points="12 2 15.09 8.26 22 9.27 17 14.14 18.18 21.02 12 17.77 5.82 21.02 7 14.14 2 9.27 8.91 8.26 12 2"/></svg>',
    users: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M16 21v-2a4 4 0 0 0-4-4H6a4 4 0 0 0-4 4v2"/><circle cx="9" cy="7" r="4"/><path d="M22 21v-2a4 4 0 0 0-3-3.87"/><path d="M16 3.13a4 4 0 0 1 0 7.75"/></svg>',
    folderEmpty: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M20 20a2 2 0 0 0 2-2V8a2 2 0 0 0-2-2h-7.93a2 2 0 0 1-1.66-.9l-.82-1.2A2 2 0 0 0 7.93 3H4a2 2 0 0 0-2 2v13a2 2 0 0 0 2 2Z"/></svg>',
    bookmark: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="m19 21-7-4-7 4V5a2 2 0 0 1 2-2h10a2 2 0 0 1 2 2v16z"/></svg>',
    sparkles: '<svg xmlns="http://www.w3.org/2000/svg" width="32" height="32" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="1.5" stroke-linecap="round" stroke-linejoin="round"><path d="M9.937 15.5A2 2 0 0 0 8.5 14.063l-6.135-1.582a.5.5 0 0 1 0-.962L8.5 9.936A2 2 0 0 0 9.937 8.5l1.582-6.135a.5.5 0 0 1 .963 0L14.063 8.5A2 2 0 0 0 15.5 9.937l6.135 1.581a.5.5 0 0 1 0 .964L15.5 14.063a2 2 0 0 0-1.437 1.437l-1.582 6.135a.5.5 0 0 1-.963 0z"/></svg>',
    link: '<svg xmlns="http://www.w3.org/2000/svg" width="15" height="15" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M10 13a5 5 0 0 0 7.54.54l3-3a5 5 0 0 0-7.07-7.07l-1.72 1.71"/><path d="M14 11a5 5 0 0 0-7.54-.54l-3 3a5 5 0 0 0 7.07 7.07l1.71-1.71"/></svg>',
    globe: '<svg xmlns="http://www.w3.org/2000/svg" width="9" height="9" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 2a14.5 14.5 0 0 0 0 20 14.5 14.5 0 0 0 0-20"/><path d="M2 12h20"/></svg>',
    extLink: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M15 3h6v6"/><path d="M10 14 21 3"/><path d="M18 13v6a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V8a2 2 0 0 1 2-2h6"/></svg>',
    check: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><polyline points="20 6 9 17 4 12"/></svg>',
    alertTriangle: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="m21.73 18-8-14a2 2 0 0 0-3.48 0l-8 14A2 2 0 0 0 4 21h16a2 2 0 0 0 1.73-3Z"/><line x1="12" x2="12" y1="9" y2="13"/><line x1="12" x2="12.01" y1="17" y2="17"/></svg>',
    rotateCcw: '<svg xmlns="http://www.w3.org/2000/svg" width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><path d="M3 12a9 9 0 1 0 9-9 9.75 9.75 0 0 0-6.74 2.74L3 8"/><path d="M3 3v5h5"/></svg>',
    mail: '<svg xmlns="http://www.w3.org/2000/svg" width="11" height="11" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><rect width="20" height="16" x="2" y="4" rx="2"/><path d="m22 7-8.97 5.7a1.94 1.94 0 0 1-2.06 0L2 7"/></svg>',
};

// ---------- Helpers ----------

function escapeHtml(str) {
    if (str == null) return '';
    return String(str).replace(/[&<>"']/g, function(c) {
        return { '&': '&amp;', '<': '&lt;', '>': '&gt;', '"': '&quot;', "'": '&#39;' }[c];
    });
}

function ensureProtocol(url) {
    if (!url) return '';
    const value = String(url).trim();
    // Repară și linkurile salvate înainte ca portalul să accepte protocolul local.
    if (/^(?:https:\/\/)?(?:agentsaga|sagabulk):\/\/start$/i.test(value)) {
        return value.replace(/^https:\/\//i, '').toLowerCase();
    }
    return /^https?:\/\//i.test(value) ? value : 'https://' + value;
}

function stripProto(url) {
    return (url || '').replace(/^https?:\/\//, '');
}

// ---------- Bootstrap ----------

async function bootstrap() {
    document.documentElement.setAttribute('data-theme', state.theme);
    try {
        const me = await api('/me');
        if (me.user) {
            state.user = me.user;
            
            // Reset admin tab if user is not admin (prevents "Acces interzis" flash)
            if (state.activeTab === 'admin' && state.user.role !== 'admin') {
                state.activeTab = 'apps';
                localStorage.setItem('lp:activeTab', 'apps');
            }
            
            await loadData();
            state.view = 'main';
            
            // Force password change if password_changed is false
            if (state.user.password_changed === false || state.user.password_changed === 0) {
                state.modal = { type: 'change-password-required' };
            }
        } else if (me.needs_setup) {
            state.view = 'setup';
        } else {
            state.view = 'login';
        }
    } catch (e) {
        state.view = 'login';
    }
    render();
}

async function loadData() {
    const data = await api('/data');
    state.appsSections = data.appsSections || [];
    state.favSections = data.favSections || [];

    if (!state.activeAppsSectionId || !state.appsSections.find(function(s) { return s.id === state.activeAppsSectionId; })) {
        state.activeAppsSectionId = state.appsSections[0] ? state.appsSections[0].id : null;
    }
    if (!state.activeFavSectionId || !state.favSections.find(function(s) { return s.id === state.activeFavSectionId; })) {
        state.activeFavSectionId = state.favSections[0] ? state.favSections[0].id : null;
    }

    // Load admin users if user is admin
    if (state.user && state.user.role === 'admin') {
        await loadAdminUsers();
    }
}

// ---------- Render ----------

function render() {
    const root = document.getElementById('root');
    if (!root) {
        console.error('Element #root not found!');
        return;
    }
    document.documentElement.setAttribute('data-theme', state.theme);

    if (state.view === 'loading') {
        root.innerHTML = '<div class="loading">INITIALIZING…</div>';
    } else if (state.view === 'setup') {
        renderSetup(root);
    } else if (state.view === 'login') {
        renderLogin(root);
    } else if (state.view === 'main') {
        renderMain(root);
    }
    renderModal();
    bindGlobalKeys();
}

// ---------- Auth Shell ----------

function renderAuthShell(root, content) {
    if (!root) {
        console.error('renderAuthShell: root is null!');
        return;
    }
    root.innerHTML =
        '<div class="auth-shell">' +
            '<div class="auth-grid"></div>' +
            '<div class="auth-glow auth-glow-1"></div>' +
            '<div class="auth-glow auth-glow-2"></div>' +
            '<button class="auth-theme-toggle" data-action="toggle-theme" title="Schimbă tema">' +
                (state.theme === 'dark' ? UI.sun : UI.moon) +
            '</button>' +
            '<button class="auth-theme-toggle" data-action="open-features" title="Funcționalități" style="right: 70px;">' +
                '<svg xmlns="http://www.w3.org/2000/svg" width="20" height="20" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
            '</button>' +
            '<div class="auth-logo">' +
                '<div class="logo-mark">' + UI.layers + '</div>' +
                '<div>' +
                    '<div class="logo-text-main">smartBIZ Portal</div>' +
                    '<div class="logo-text-sub">Portal Business</div>' +
                '</div>' +
            '</div>' +
            '<div class="auth-card">' + content + '</div>' +
        '</div>';
    bindActions(root);
}

function renderSetup(root) {
    renderAuthShell(root,
        '<div class="auth-eyebrow">CONFIGURARE INITIALA</div>' +
        '<h1 class="auth-title">Cont administrator</h1>' +
        '<p class="auth-subtitle">Acest cont va fi singurul cu acces la portal. Notează-ți parola într-un loc sigur.</p>' +
        '<form id="setup-form" novalidate>' +
            '<div class="field">' +
                '<label class="field-label">Utilizator</label>' +
                '<div class="input-wrap">' +
                    '<span class="input-icon">' + UI.user + '</span>' +
                    '<input class="input with-icon" name="username" type="text" placeholder="ex: gheorghe" autofocus required minlength="2" maxlength="100" autocomplete="username">' +
                '</div>' +
            '</div>' +
            '<div class="field">' +
                '<label class="field-label">Parola (minim 8 caractere)</label>' +
                '<div class="input-wrap">' +
                    '<span class="input-icon">' + UI.lock + '</span>' +
                    '<input class="input with-icon" name="password" type="password" placeholder="parola" required minlength="8" autocomplete="new-password">' +
                    '<button type="button" class="input-pwd-toggle" data-action="toggle-pwd">' + UI.eye + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="field">' +
                '<label class="field-label">Confirma parola</label>' +
                '<div class="input-wrap">' +
                    '<span class="input-icon">' + UI.key + '</span>' +
                    '<input class="input with-icon" name="password2" type="password" placeholder="repeta parola" required minlength="8" autocomplete="new-password">' +
                '</div>' +
            '</div>' +
            '<div class="spacer-md"></div>' +
            '<button type="submit" class="btn btn-primary full">' +
                UI.shield + ' Creează cont și intră' +
            '</button>' +
        '</form>'
    );

    document.getElementById('setup-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const u = (fd.get('username') || '').trim();
        const p = fd.get('password') || '';
        const p2 = fd.get('password2') || '';
        const submitBtn = e.target.querySelector('button[type="submit"]');

        if (p !== p2) { showFormError('setup-form', 'Parolele nu coincid.'); return; }
        if (p.length < 8) { showFormError('setup-form', 'Parola trebuie sa aiba minim 8 caractere.'); return; }

        submitBtn.disabled = true;
        try {
            const r = await api('/setup', { method: 'POST', body: { username: u, password: p } });
            state.user = r.user;
            await loadData();
            state.view = 'main';
            render();
        } catch (err) {
            showFormError('setup-form', err.message);
            submitBtn.disabled = false;
        }
    });
}

function renderLogin(root) {
    renderAuthShell(root,
        '<div class="auth-eyebrow">AUTENTIFICARE</div>' +
        '<h1 class="auth-title">Bine ai revenit</h1>' +
        '<p class="auth-subtitle">Introdu credențialele pentru a accesa portalul.</p>' +
        '<form id="login-form" novalidate>' +
            '<div class="field">' +
                '<label class="field-label">Utilizator</label>' +
                '<div class="input-wrap">' +
                    '<span class="input-icon">' + UI.user + '</span>' +
                    '<input class="input with-icon" name="username" type="text" placeholder="utilizator" autofocus required autocomplete="username">' +
                '</div>' +
            '</div>' +
            '<div class="field">' +
                '<label class="field-label">Parola</label>' +
                '<div class="input-wrap">' +
                    '<span class="input-icon">' + UI.lock + '</span>' +
                    '<input class="input with-icon" name="password" type="password" placeholder="parola" required autocomplete="current-password">' +
                    '<button type="button" class="input-pwd-toggle" data-action="toggle-pwd">' + UI.eye + '</button>' +
                '</div>' +
            '</div>' +
            '<div class="spacer-md"></div>' +
            '<button type="submit" class="btn btn-primary full">' +
                UI.chevronRight + ' Intra in portal' +
            '</button>' +
        '</form>'
    );

    document.getElementById('login-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const fd = new FormData(e.target);
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            const r = await api('/login', {
                method: 'POST',
                body: { username: (fd.get('username') || '').trim(), password: fd.get('password') || '' }
            });
            state.user = r.user;
            
            // Reset admin tab if user is not admin (prevents "Acces interzis" flash)
            if (state.activeTab === 'admin' && state.user.role !== 'admin') {
                state.activeTab = 'apps';
                localStorage.setItem('lp:activeTab', 'apps');
            }
            
            await loadData();
            state.view = 'main';
            
            // Force password change if password_changed is false
            if (state.user.password_changed === false || state.user.password_changed === 0) {
                state.modal = { type: 'change-password-required' };
            }
            
            render();
        } catch (err) {
            showFormError('login-form', err.message);
            submitBtn.disabled = false;
        }
    });
}

function showFormError(formId, msg) {
    const form = document.getElementById(formId);
    if (!form) return;
    let alertEl = form.querySelector('.form-error');
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = 'alert error form-error';
        const submit = form.querySelector('button[type="submit"]');
        submit.parentNode.insertBefore(alertEl, submit);
    }
    alertEl.innerHTML = UI.alertTriangle + ' ' + escapeHtml(msg);
}

// ---------- Main View ----------

function renderMain(root) {
    root.innerHTML =
        '<header class="header">' +
            '<div class="header-inner">' +
                '<div class="header-left">' +
                    '<div class="logo-mark small">' + UI.layers + '</div>' +
                    '<div>' +
                        '<div class="logo-text-main" style="font-size: 15px;">smartBIZ Portal</div>' +
                        '<div class="logo-text-sub">' + (state.user && state.user.company && state.user.company.name ? escapeHtml(state.user.company.name) : 'Portal Business') + '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="header-actions">' +
                    '<div class="search-wrap">' +
                        '<span class="input-icon">' + UI.search + '</span>' +
                        '<input class="input search-input" type="search" placeholder="Caută…" value="' + escapeHtml(state.search) + '" id="search-input">' +
                    '</div>' +
                    '<button class="icon-btn" data-action="toggle-theme" title="Tema">' +
                        (state.theme === 'dark' ? UI.sun : UI.moon) +
                    '</button>' +
                    '<button class="icon-btn" data-action="open-features" title="Funcționalități">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M12 16v-4"/><path d="M12 8h.01"/></svg>' +
                    '</button>' +
                    '<button class="icon-btn" data-action="open-help" title="Ajutor">' +
                        '<svg xmlns="http://www.w3.org/2000/svg" width="18" height="18" viewBox="0 0 24 24" fill="none" stroke="currentColor" stroke-width="2" stroke-linecap="round" stroke-linejoin="round"><circle cx="12" cy="12" r="10"/><path d="M9.09 9a3 3 0 0 1 5.83 1c0 2-3 3-3 3"/><path d="M12 17h.01"/></svg>' +
                    '</button>' +
                    '<div style="position: relative;" id="user-menu-wrap">' +
                        '<button class="user-btn" data-action="toggle-user-menu">' +
                            '<div class="avatar">' + escapeHtml(((state.user && state.user.username) || '?').charAt(0).toUpperCase()) + '</div>' +
                        '</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
            '<div class="tabs">' +
                '<button class="tab ' + (state.activeTab === 'apps' ? 'active' : '') + '" data-tab="apps">' +
                    UI.grid + ' Aplicatii' +
                '</button>' +
                '<button class="tab ' + (state.activeTab === 'favorites' ? 'active' : '') + '" data-tab="favorites">' +
                    UI.star + ' Favorite' +
                '</button>' +
                (state.user && state.user.role === 'admin' ?
                    '<button class="tab ' + (state.activeTab === 'admin' ? 'active' : '') + '" data-tab="admin">' +
                        UI.users + ' Admin' +
                    '</button>'
                : '') +
            '</div>' +
        '</header>' +
        (state.viewingAsUser ?
            '<div style="background: linear-gradient(135deg, #f59e0b 0%, #f97316 100%); color: white; padding: 12px 20px; text-align: center; font-weight: 600; box-shadow: 0 2px 8px rgba(0,0,0,0.1);">' +
                '👁️ Vizualizezi portalul ca: <strong style="text-decoration: underline;">' + escapeHtml(state.viewingAsUser.username) + '</strong> ' +
                '<button onclick="handleReturnToAdmin()" style="background: white; color: #f97316; border: none; padding: 6px 16px; border-radius: 4px; font-weight: 600; cursor: pointer; margin-left: 12px; font-size: 13px;">↩ Înapoi la Admin</button>' +
            '</div>'
        : '') +
        '<div class="content-wrapper">' +
            '<main class="main ' + (state.helpOpen ? 'with-help' : '') + '">' +
                (state.activeTab === 'apps' ? renderAppsTab() : state.activeTab === 'favorites' ? renderFavoritesTab() : renderAdminTab()) +
            '</main>' +
            renderHelpSidebar() +
        '</div>';

    const searchInput = document.getElementById('search-input');
    if (searchInput) {
        searchInput.addEventListener('input', function(e) {
            state.search = e.target.value;
            updateContent();
        });
    }

    const tabs = document.querySelectorAll('[data-tab]');
    tabs.forEach(function(b) {
        b.addEventListener('click', function() { setState({ activeTab: b.dataset.tab }); });
    });

    bindActions(root);
}

function updateContent() {
    const main = document.querySelector('.main');
    if (!main) return;
    main.innerHTML = state.activeTab === 'apps' ? renderAppsTab() : state.activeTab === 'favorites' ? renderFavoritesTab() : renderAdminTab();
    bindActions(main);
}

// ---------- Sidebar (shared between tabs) ----------

function renderSidebar(tab, sections, activeId, countKey) {
    const newAction = tab === 'apps' ? 'new-apps-section' : 'new-fav-section';

    let body;
    if (sections.length === 0) {
        body =
            '<div class="empty-sidebar">' +
                UI.folderEmpty +
                '<div class="empty-sidebar-text">Nicio secțiune încă.</div>' +
                '<button class="btn btn-primary sm" data-action="' + newAction + '">' + UI.plus + ' Prima secțiune</button>' +
            '</div>';
    } else {
        body = '<div class="section-list">' +
            sections.map(function(sec) {
                const count = (sec[countKey] || []).length;
                const iconName = sec.icon || 'folder';
                return '<div class="section-item ' + (sec.id === activeId ? 'active' : '') + '" ' +
                            'style="--section-color: ' + sec.color + '" ' +
                            'data-section-id="' + escapeHtml(sec.id) + '" ' +
                            'data-tab="' + tab + '">' +
                    '<div class="section-icon" style="color: ' + sec.color + '">' + iconSvg(iconName, 17) + '</div>' +
                    '<div class="section-name">' + escapeHtml(sec.name) + '</div>' +
                    '<div class="section-count">' + count + '</div>' +
                    '<div class="section-actions">' +
                        '<button data-action="edit-' + (tab === 'apps' ? 'apps' : 'fav') + '-section" data-id="' + escapeHtml(sec.id) + '" title="Editează">' + UI.edit + '</button>' +
                        '<button class="danger" data-action="delete-' + (tab === 'apps' ? 'apps' : 'fav') + '-section" data-id="' + escapeHtml(sec.id) + '" data-name="' + escapeHtml(sec.name) + '" data-count="' + count + '" title="Șterge">' + UI.trash + '</button>' +
                    '</div>' +
                '</div>';
            }).join('') +
        '</div>';
    }

    return '<aside class="sidebar">' +
        '<div class="sidebar-header">' +
            '<div class="sidebar-header-label">SECTIUNI · ' + sections.length + '</div>' +
            '<button class="sidebar-add" data-action="' + newAction + '" title="Adaugă secțiune">' + UI.plus + '</button>' +
        '</div>' +
        body +
    '</aside>';
}

// ---------- Apps Tab ----------

function renderAppsTab() {
    const activeSection = state.appsSections.find(function(s) { return s.id === state.activeAppsSectionId; });

    return '<div class="layout">' +
        renderSidebar('apps', state.appsSections, state.activeAppsSectionId, 'apps') +
        '<section>' +
            (!activeSection ?
                renderEmptyState('apps', state.appsSections.length === 0) :
                renderAppsSection(activeSection)
            ) +
        '</section>' +
    '</div>';
}

function renderAppsSection(section) {
    const q = state.search.toLowerCase().trim();
    const apps = section.apps || [];
    const filtered = q ? apps.filter(function(a) {
        return a.name.toLowerCase().indexOf(q) !== -1 ||
               (a.description || '').toLowerCase().indexOf(q) !== -1 ||
               (a.access_user || '').toLowerCase().indexOf(q) !== -1 ||
               (a.url || '').toLowerCase().indexOf(q) !== -1;
    }) : apps;

    let body;
    if (apps.length === 0) {
        body =
            '<div class="empty">' +
                UI.gridLarge +
                '<div class="empty-title">Nicio aplicație în această secțiune</div>' +
                '<div class="empty-desc">Adaugă prima aplicație pentru a o accesa dintr-un click.</div>' +
                '<button class="btn btn-primary sm" data-action="new-app" data-section-id="' + escapeHtml(section.id) + '">' +
                    UI.plus + ' Adaugă aplicație' +
                '</button>' +
            '</div>';
    } else if (filtered.length === 0) {
        body = '<div class="no-results">Niciun rezultat pentru „' + escapeHtml(state.search) + '".</div>';
    } else {
        body = '<div class="apps-grid">' +
            filtered.map(function(app) { return renderAppCard(app, section.id); }).join('') +
        '</div>';
    }

    return renderContentHeader(section, apps.length, q ? filtered.length : null, 'aplicație', 'aplicații', '<button class="btn btn-primary sm" data-action="new-app" data-section-id="' + escapeHtml(section.id) + '">' + UI.plus + ' <span class="hidden-xs">Adaugă</span></button>') + body;
}

function renderContentHeader(section, total, filteredCount, sing, plur, actionButton) {
    const iconName = section.icon || 'folder';
    let subtitle = total + ' ' + (total === 1 ? sing : plur);
    if (filteredCount !== null) subtitle += ' · ' + filteredCount + ' găsite';

    return '<div class="content-header" style="--section-color: ' + section.color + '">' +
            '<div class="content-header-info">' +
                '<div class="content-icon" style="background: color-mix(in srgb, ' + section.color + ' 18%, transparent); border: 1px solid color-mix(in srgb, ' + section.color + ' 38%, transparent); color: ' + section.color + '">' +
                    iconSvg(iconName, 20) +
                '</div>' +
                '<div class="content-header-text">' +
                    '<div class="content-title">' + escapeHtml(section.name) + '</div>' +
                    '<div class="content-subtitle">' + subtitle + '</div>' +
                '</div>' +
            '</div>' +
            actionButton +
        '</div>';
}

function renderAppCard(app, sectionId) {
    const url = ensureProtocol(app.url);
    const browserTarget = /^(?:agentsaga|sagabulk):\/\/start$/i.test(url) ? '' : ' target="_blank" rel="noopener noreferrer"';
    const initial = (app.name || '?').charAt(0).toUpperCase();
    return '<div class="app-card" style="--app-color: ' + app.color + '">' +
        '<a href="' + escapeHtml(url) + '"' + browserTarget + '>' +
            '<div class="app-name">' + escapeHtml(app.name) + '</div>' +
            '<div class="app-card-top">' +
                '<div class="app-icon" style="background: color-mix(in srgb, ' + app.color + ' 20%, transparent); border: 1px solid color-mix(in srgb, ' + app.color + ' 35%, transparent); color: ' + app.color + '">' +
                    escapeHtml(initial) +
                '</div>' +
                '<div class="app-content">' +
                    (app.description ? '<div class="app-desc">' + escapeHtml(app.description) + '</div>' : '') +
                '</div>' +
            '</div>' +
            '<div class="app-meta">' +
                '<div class="app-url">' + UI.globe + '<span class="app-url-text">' + escapeHtml(stripProto(url)) + '</span></div>' +
                (app.access_user ? '<div class="app-user">' + UI.userSmall + '<span>' + escapeHtml(app.access_user) + '</span></div>' : '') +
            '</div>' +
        '</a>' +
        '<div class="card-actions">' +
            '<button class="card-action-btn" data-action="edit-app" data-id="' + escapeHtml(app.id) + '" data-section-id="' + escapeHtml(sectionId) + '" title="Editează">' + UI.edit + '</button>' +
            '<button class="card-action-btn danger" data-action="delete-app" data-id="' + escapeHtml(app.id) + '" data-name="' + escapeHtml(app.name) + '" title="Șterge">' + UI.trash + '</button>' +
        '</div>' +
    '</div>';
}

// ---------- Favorites Tab ----------

function renderFavoritesTab() {
    const activeSection = state.favSections.find(function(s) { return s.id === state.activeFavSectionId; });

    return '<div class="layout">' +
        renderSidebar('favorites', state.favSections, state.activeFavSectionId, 'favorites') +
        '<section>' +
            (!activeSection ?
                renderEmptyState('favorites', state.favSections.length === 0) :
                renderFavoritesSection(activeSection)
            ) +
        '</section>' +
    '</div>';
}

function renderFavoritesSection(section) {
    const q = state.search.toLowerCase().trim();
    const favs = section.favorites || [];
    const filtered = q ? favs.filter(function(f) {
        return f.label.toLowerCase().indexOf(q) !== -1 || (f.url || '').toLowerCase().indexOf(q) !== -1;
    }) : favs;

    let body;
    if (favs.length === 0) {
        body =
            '<div class="empty">' +
                UI.bookmark +
                '<div class="empty-title">Niciun favorit în această secțiune</div>' +
                '<div class="empty-desc">Salvează linkurile pe care le folosești des pentru acces rapid.</div>' +
                '<button class="btn btn-primary sm" data-action="new-favorite" data-section-id="' + escapeHtml(section.id) + '">' +
                    UI.plus + ' Adaugă favorit' +
                '</button>' +
            '</div>';
    } else if (filtered.length === 0) {
        body = '<div class="no-results">Niciun rezultat pentru „' + escapeHtml(state.search) + '".</div>';
    } else {
        body = '<div class="favs-grid">' +
            filtered.map(function(f) { return renderFavButton(f, section.id); }).join('') +
        '</div>';
    }

    return renderContentHeader(section, favs.length, q ? filtered.length : null, 'favorit', 'favorite', '<button class="btn btn-primary sm" data-action="new-favorite" data-section-id="' + escapeHtml(section.id) + '">' + UI.plus + ' <span class="hidden-xs">Adaugă</span></button>') + body;
}

function renderFavButton(f, sectionId) {
    const url = ensureProtocol(f.url);
    const browserTarget = /^(?:agentsaga|sagabulk):\/\/start$/i.test(url) ? '' : ' target="_blank" rel="noopener noreferrer"';
    const initial = (f.label || '?').charAt(0).toUpperCase();
    const domain = url.replace(/^https?:\/\//, '').replace(/\/.*$/, '');
    return '<div class="fav-btn" style="--fav-color: ' + f.color + '">' +
        '<a href="' + escapeHtml(url) + '"' + browserTarget + '>' +
            '<div class="fav-label">' + escapeHtml(f.label) + '</div>' +
            '<div class="fav-bottom">' +
                '<div class="fav-icon" style="background: color-mix(in srgb, ' + f.color + ' 20%, transparent); color: ' + f.color + '">' +
                    escapeHtml(initial) +
                '</div>' +
                '<div class="fav-subtitle">' + escapeHtml(domain) + '</div>' +
            '</div>' +
        '</a>' +
        '<div class="card-actions">' +
            '<button data-action="edit-favorite" data-id="' + escapeHtml(f.id) + '" data-section-id="' + escapeHtml(sectionId) + '" title="Editează">' + UI.edit + '</button>' +
            '<button class="danger" data-action="delete-favorite" data-id="' + escapeHtml(f.id) + '" data-name="' + escapeHtml(f.label) + '" title="Șterge">' + UI.trash + '</button>' +
        '</div>' +
    '</div>';
}

// ---------- Empty States ----------

function renderEmptyState(tab, isFirst) {
    const action = tab === 'apps' ? 'new-apps-section' : 'new-fav-section';
    return '<div class="empty">' +
        UI.sparkles +
        '<div class="empty-title">Începe prin a crea o secțiune</div>' +
        '<div class="empty-desc">Organizează ' + (tab === 'apps' ? 'aplicațiile' : 'favoritele') + ' pe categorii — financiar, HR, raportare, etc.</div>' +
        (isFirst ? '<button class="btn btn-primary sm" data-action="' + action + '">' + UI.plus + ' Creează prima secțiune</button>' : '') +
    '</div>';
}

// ---------- Action Binding ----------

function bindActions(scope) {
    scope.querySelectorAll('[data-action]').forEach(function(el) {
        // Use 'change' event for select elements, 'click' for others
        const eventType = el.tagName === 'SELECT' ? 'change' : 'click';
        el.addEventListener(eventType, function(e) { handleAction(el.dataset.action, el, e); });
    });
    scope.querySelectorAll('.section-item').forEach(function(el) {
        el.addEventListener('click', function(e) {
            if (e.target.closest('button')) return;
            const tab = el.dataset.tab;
            if (tab === 'apps') setState({ activeAppsSectionId: el.dataset.sectionId });
            else setState({ activeFavSectionId: el.dataset.sectionId });
        });
    });
}

function handleAction(action, el, evt) {
    if (action === 'toggle-theme') { setState({ theme: state.theme === 'dark' ? 'light' : 'dark' }); return; }
    if (action === 'toggle-user-menu') { if (evt) evt.stopPropagation(); toggleUserMenu(); return; }
    if (action === 'toggle-pwd') { togglePwd(el); return; }
    if (action === 'toggle-password') {
        const targetId = el.dataset.target;
        const input = document.getElementById(targetId);
        if (input) {
            const isPwd = input.type === 'password';
            input.type = isPwd ? 'text' : 'password';
            el.innerHTML = isPwd ? UI.eyeOff : UI.eye;
        }
        return;
    }
    if (action === 'logout') { handleLogout(); return; }
    if (action === 'close-modal') {
        // Modalele editabile se închid numai prin controale explicite.
        // Fundalul poate primi click la finalul unei selecții de text prin tragere.
        if (el.classList.contains('modal-backdrop')) return;
        setState({ modal: null });
        return;
    }
    if (action === 'open-settings') { setState({ modal: { type: 'settings' } }); return; }
    if (action === 'open-help') { setState({ helpOpen: !state.helpOpen }); return; }
    if (action === 'help-section') { setState({ helpSection: el.dataset.section }); return; }
    if (action === 'open-features') { window.open('/assets/features.html', '_blank'); return; }
    if (action === 'open-reset') { setState({ modal: { type: 'reset' } }); return; }

    // Section CRUD - apps tab
    if (action === 'new-apps-section') {
        setState({ modal: { type: 'section', data: { tab: 'apps', name: '', color: PALETTE[0], icon: 'folder' } } });
        return;
    }
    if (action === 'edit-apps-section') {
        const sec = state.appsSections.find(function(s) { return s.id === el.dataset.id; });
        if (sec) setState({ modal: { type: 'section', data: { tab: 'apps', id: sec.id, name: sec.name, color: sec.color, icon: sec.icon || 'folder' } } });
        return;
    }
    if (action === 'delete-apps-section') {
        setState({ modal: { type: 'confirm', data: { kind: 'apps-section', id: el.dataset.id, name: el.dataset.name, count: parseInt(el.dataset.count || '0', 10) } } });
        return;
    }

    // Section CRUD - favorites tab
    if (action === 'new-fav-section') {
        setState({ modal: { type: 'section', data: { tab: 'favorites', name: '', color: PALETTE[4], icon: 'star' } } });
        return;
    }
    if (action === 'edit-fav-section') {
        const sec = state.favSections.find(function(s) { return s.id === el.dataset.id; });
        if (sec) setState({ modal: { type: 'section', data: { tab: 'favorites', id: sec.id, name: sec.name, color: sec.color, icon: sec.icon || 'folder' } } });
        return;
    }
    if (action === 'delete-fav-section') {
        setState({ modal: { type: 'confirm', data: { kind: 'fav-section', id: el.dataset.id, name: el.dataset.name, count: parseInt(el.dataset.count || '0', 10) } } });
        return;
    }

    // Apps CRUD
    if (action === 'new-app') {
        const sec = state.appsSections.find(function(s) { return s.id === el.dataset.sectionId; });
        setState({ modal: { type: 'app', data: { sectionId: el.dataset.sectionId, name: '', url: '', description: '', access_user: '', color: sec ? sec.color : PALETTE[0] } } });
        return;
    }
    if (action === 'edit-app') {
        const sId = el.dataset.sectionId;
        const sec = state.appsSections.find(function(s) { return s.id === sId; });
        const app = sec && sec.apps && sec.apps.find(function(a) { return a.id === el.dataset.id; });
        if (app) setState({ modal: { type: 'app', data: Object.assign({}, app, { sectionId: sId }) } });
        return;
    }
    if (action === 'delete-app') {
        setState({ modal: { type: 'confirm', data: { kind: 'app', id: el.dataset.id, name: el.dataset.name } } });
        return;
    }

    // Favorites CRUD
    if (action === 'new-favorite') {
        const sec = state.favSections.find(function(s) { return s.id === el.dataset.sectionId; });
        setState({ modal: { type: 'favorite', data: { sectionId: el.dataset.sectionId, label: '', url: '', color: sec ? sec.color : '#d97706' } } });
        return;
    }
    if (action === 'edit-favorite') {
        const sId = el.dataset.sectionId;
        const sec = state.favSections.find(function(s) { return s.id === sId; });
        const fav = sec && sec.favorites && sec.favorites.find(function(f) { return f.id === el.dataset.id; });
        if (fav) setState({ modal: { type: 'favorite', data: Object.assign({}, fav, { sectionId: sId }) } });
        return;
    }
    if (action === 'delete-favorite') {
        setState({ modal: { type: 'confirm', data: { kind: 'favorite', id: el.dataset.id, name: el.dataset.name } } });
        return;
    }

    // Admin actions
    if (action === 'admin-refresh') { loadAdminUsers(); return; }
    if (action === 'admin-filter-company') {
        setState({ adminCompanyFilter: el.value });
        return;
    }
    if (action === 'admin-view-as') {
        handleAdminViewAs(el.dataset.userId, el.dataset.username);
        return;
    }
    if (action === 'admin-add-user') {
        setState({ modal: { type: 'admin-add-user' } });
        return;
    }
    if (action === 'admin-edit-user') {
        setState({ modal: { type: 'admin-edit-user', data: { userId: el.dataset.userId } } });
        return;
    }
    if (action === 'admin-delete-user') {
        handleAdminDeleteUser(el.dataset.userId);
        return;
    }
    if (action === 'admin-save-user') { handleAdminSaveUser(); return; }
    if (action === 'admin-update-user') { handleAdminUpdateUser(); return; }
    if (action === 'admin-export') { handleAdminExport(); return; }
    if (action === 'admin-import') { handleAdminImport(); return; }
    if (action === 'admin-do-export') { handleAdminDoExport(); return; }
    if (action === 'admin-do-import') { handleAdminDoImport(); return; }
    if (action === 'change-password-do') { handleChangePassword(); return; }
    if (action === 'admin-reset-password') { handleAdminResetPassword(el.dataset.userId, el.dataset.username); return; }
    if (action === 'admin-send-email') {
        setState({ 
            modal: { 
                type: 'send-email', 
                data: { 
                    userId: el.dataset.userId,
                    username: el.dataset.username
                } 
            } 
        });
        return;
    }
    if (action === 'admin-do-reset-password') { handleAdminDoResetPassword(); return; }
    if (action === 'send-email-confirm') {
        handleSendEmailConfirm(el.dataset.userId);
        return;
    }
    if (action === 'open-change-password') { setState({ modal: { type: 'change-password-settings' } }); return; }
}

function toggleUserMenu() {
    const wrap = document.getElementById('user-menu-wrap');
    const existing = document.getElementById('user-dropdown');
    if (existing) { existing.remove(); return; }
    const dd = document.createElement('div');
    dd.id = 'user-dropdown';
    dd.className = 'user-dropdown';
    dd.innerHTML =
        '<div class="user-dropdown-header">' +
            '<div class="label">CONECTAT CA</div>' +
            '<div class="value">' + escapeHtml((state.user && state.user.username) || '') + '</div>' +
        '</div>' +
        '<button class="dropdown-item" data-action="open-settings">' + UI.settings + ' Setări</button>' +
        '<button class="dropdown-item" data-action="open-change-password">' + UI.lock + ' Schimbă parola</button>' +
        '<button class="dropdown-item danger" data-action="logout">' + UI.logout + ' Deconectare</button>';
    wrap.appendChild(dd);
    bindActions(dd);
    setTimeout(function() {
        document.addEventListener('click', function closeDropdown(e) {
            if (!dd.contains(e.target) && !e.target.closest('[data-action="toggle-user-menu"]')) {
                dd.remove();
                document.removeEventListener('click', closeDropdown);
            }
        });
    }, 0);
}

function togglePwd(btn) {
    const input = btn.parentElement.querySelector('input[type="password"], input[type="text"]');
    if (!input || input.name === 'username') return;
    const isPwd = input.type === 'password';
    input.type = isPwd ? 'text' : 'password';
    btn.innerHTML = isPwd ? UI.eyeOff : UI.eye;
}

async function handleLogout() {
    try { await api('/logout', { method: 'POST' }); } catch (e) {}
    state.user = null;
    state.appsSections = [];
    state.favSections = [];
    state.view = 'login';
    state.modal = null;
    render();
}

// ---------- Modals ----------

function renderModal() {
    document.documentElement.classList.toggle('modal-open', Boolean(state.modal));
    const root = document.getElementById('modal-root');
    if (!root) return; // Safety: modal-root doesn't exist
    if (!state.modal) { root.innerHTML = ''; return; }
    if (state.modal.type === 'section') renderSectionModal(root);
    else if (state.modal.type === 'app') renderAppModal(root);
    else if (state.modal.type === 'favorite') renderFavoriteModal(root);
    else if (state.modal.type === 'confirm') renderConfirmModal(root);
    else if (state.modal.type === 'settings') renderSettingsModal(root);
    else if (state.modal.type === 'reset') renderResetModal(root);
    else if (state.modal.type === 'admin-add-user') modalAdminAddUser(root);
    else if (state.modal.type === 'admin-edit-user') modalAdminEditUser(root, state.modal.data.userId);
    else if (state.modal.type === 'admin-export') modalAdminExport(root);
    else if (state.modal.type === 'admin-import') modalAdminImport(root);
    else if (state.modal.type === 'change-password-required') modalChangePasswordRequired(root);
    else if (state.modal.type === 'change-password-settings') modalChangePasswordSettings(root);
    else if (state.modal.type === 'admin-reset-password') modalAdminResetPassword(root);
    else if (state.modal.type === 'send-email') modalSendEmail(root);
    
    // Bind actions for admin modals (they use data-action attributes)
    if (state.modal && (state.modal.type === 'admin-add-user' || state.modal.type === 'admin-edit-user' || state.modal.type === 'admin-export' || state.modal.type === 'admin-import')) {
        bindActions(root);
    }
}

function paletteHtml(active) {
    return '<div class="palette" data-color="' + active + '">' +
        PALETTE.map(function(c) {
            return '<button type="button" class="palette-swatch ' + (c === active ? 'active' : '') + '" style="background: ' + c + '" data-color="' + c + '"></button>';
        }).join('') +
    '</div>';
}

function iconGridHtml(active) {
    return '<div class="icon-grid" data-icon="' + active + '">' +
        ICON_NAMES.map(function(name) {
            return '<button type="button" class="icon-swatch ' + (name === active ? 'active' : '') + '" data-icon="' + name + '" title="' + name + '">' + iconSvg(name, 18) + '</button>';
        }).join('') +
    '</div>';
}

function bindPalette(modal) {
    const palette = modal.querySelector('.palette');
    if (!palette) return;
    palette.querySelectorAll('.palette-swatch').forEach(function(s) {
        s.addEventListener('click', function() {
            palette.dataset.color = s.dataset.color;
            palette.querySelectorAll('.palette-swatch').forEach(function(x) { x.classList.remove('active'); });
            s.classList.add('active');
        });
    });
}

function bindIconGrid(modal) {
    const grid = modal.querySelector('.icon-grid');
    if (!grid) return;
    grid.querySelectorAll('.icon-swatch').forEach(function(s) {
        s.addEventListener('click', function() {
            grid.dataset.icon = s.dataset.icon;
            grid.querySelectorAll('.icon-swatch').forEach(function(x) { x.classList.remove('active'); });
            s.classList.add('active');
        });
    });
}

function showModalError(msg) {
    const body = document.querySelector('.modal-body');
    if (!body) return;
    let alertEl = body.querySelector('.modal-error');
    if (!alertEl) {
        alertEl = document.createElement('div');
        alertEl.className = 'alert error modal-error';
        const actions = body.querySelector('.modal-actions');
        if (actions) actions.parentNode.insertBefore(alertEl, actions);
        else body.appendChild(alertEl);
    }
    alertEl.innerHTML = UI.alertTriangle + ' ' + escapeHtml(msg);
}

function bindModalCommon(modalEl) {
    modalEl.querySelectorAll('.modal-close, [data-close]').forEach(function(b) {
        b.addEventListener('click', function(e) {
            e.stopPropagation();
            setState({ modal: null });
        });
    });
}

function renderSectionModal(root) {
    const d = state.modal.data;
    const tabLabel = d.tab === 'apps' ? 'aplicații' : 'favorite';
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">' + (d.id ? 'Editează secțiune' : 'Secțiune nouă') + '</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="section-form" novalidate>' +
                        '<div class="field-hint">Pentru tab-ul: <strong>' + tabLabel + '</strong></div>' +
                        '<div class="field">' +
                            '<label class="field-label">Nume secțiune</label>' +
                            '<input class="input" name="name" type="text" value="' + escapeHtml(d.name) + '" placeholder="ex: Financiar" autofocus required maxlength="100">' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Pictograma</label>' +
                            iconGridHtml(d.icon) +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Culoare</label>' +
                            paletteHtml(d.color) +
                        '</div>' +
                        '<div class="modal-actions">' +
                            '<button type="button" class="btn btn-secondary" data-close>Anulează</button>' +
                            '<button type="submit" class="btn btn-primary">' + UI.check + ' ' + (d.id ? 'Salvează' : 'Creează') + '</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
        '</div>';

    bindModalCommon(root);
    bindPalette(root);
    bindIconGrid(root);

    document.getElementById('section-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const color = root.querySelector('.palette').dataset.color;
        const icon = root.querySelector('.icon-grid').dataset.icon;
        if (!name) { showModalError('Numele este obligatoriu.'); return; }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            if (d.id) await api('/sections/' + d.id, { method: 'PUT', body: { name: name, color: color, icon: icon } });
            else await api('/sections', { method: 'POST', body: { name: name, color: color, icon: icon, tab: d.tab } });
            await loadData();
            setState({ modal: null });
        } catch (err) {
            showModalError(err.message);
            submitBtn.disabled = false;
        }
    });
}

function renderAppModal(root) {
    const d = state.modal.data;
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">' + (d.id ? 'Editează aplicație' : 'Aplicație nouă') + '</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="app-form" novalidate>' +
                        '<div class="field">' +
                            '<label class="field-label">Nume aplicație</label>' +
                            '<input class="input" name="name" type="text" value="' + escapeHtml(d.name) + '" placeholder="ex: smartBIZ Helpdesk" autofocus required maxlength="100">' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">URL</label>' +
                            '<div class="input-wrap">' +
                                '<span class="input-icon">' + UI.link + '</span>' +
                                '<input class="input with-icon" name="url" type="text" value="' + escapeHtml(d.url) + '" placeholder="https://..." required maxlength="500">' +
                            '</div>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Utilizator de accesare (opțional)</label>' +
                            '<div class="input-wrap">' +
                                '<span class="input-icon">' + UI.user + '</span>' +
                                '<input class="input with-icon" name="access_user" type="text" value="' + escapeHtml(d.access_user || '') + '" placeholder="ex: gh.sandru@aiall.ro" maxlength="200" autocomplete="off">' +
                            '</div>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Descriere (opțional)</label>' +
                            '<input class="input" name="description" type="text" value="' + escapeHtml(d.description || '') + '" placeholder="Scurtă descriere" maxlength="500">' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Culoare</label>' +
                            paletteHtml(d.color) +
                        '</div>' +
                        '<div class="modal-actions">' +
                            '<button type="button" class="btn btn-secondary" data-close>Anulează</button>' +
                            '<button type="submit" class="btn btn-primary">' + UI.check + ' ' + (d.id ? 'Salvează' : 'Adaugă') + '</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
        '</div>';

    bindModalCommon(root);
    bindPalette(root);

    document.getElementById('app-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const name = e.target.name.value.trim();
        const url = ensureProtocol(e.target.url.value.trim());
        const description = e.target.description.value.trim();
        const accessUser = e.target.access_user.value.trim();
        const color = root.querySelector('.palette').dataset.color;
        if (!name || !url) { showModalError('Nume și URL sunt obligatorii.'); return; }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            const body = { name: name, url: url, description: description, access_user: accessUser, color: color };
            if (d.id) {
                await api('/apps/' + d.id, { method: 'PUT', body: body });
            } else {
                body.section_id = d.sectionId;
                await api('/apps', { method: 'POST', body: body });
            }
            await loadData();
            setState({ modal: null });
        } catch (err) {
            showModalError(err.message);
            submitBtn.disabled = false;
        }
    });
}

function renderFavoriteModal(root) {
    const d = state.modal.data;
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">' + (d.id ? 'Editează favorit' : 'Favorit nou') + '</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<form id="fav-form" novalidate>' +
                        '<div class="field">' +
                            '<label class="field-label">Etichetă</label>' +
                            '<input class="input" name="label" type="text" value="' + escapeHtml(d.label) + '" placeholder="ex: ANAF" autofocus required maxlength="100">' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">URL</label>' +
                            '<div class="input-wrap">' +
                                '<span class="input-icon">' + UI.link + '</span>' +
                                '<input class="input with-icon" name="url" type="text" value="' + escapeHtml(d.url) + '" placeholder="https://..." required maxlength="500">' +
                            '</div>' +
                        '</div>' +
                        '<div class="field">' +
                            '<label class="field-label">Culoare</label>' +
                            paletteHtml(d.color) +
                        '</div>' +
                        '<div class="modal-actions">' +
                            '<button type="button" class="btn btn-secondary" data-close>Anulează</button>' +
                            '<button type="submit" class="btn btn-primary">' + UI.check + ' ' + (d.id ? 'Salvează' : 'Adaugă') + '</button>' +
                        '</div>' +
                    '</form>' +
                '</div>' +
            '</div>' +
        '</div>';

    bindModalCommon(root);
    bindPalette(root);

    document.getElementById('fav-form').addEventListener('submit', async function(e) {
        e.preventDefault();
        const label = e.target.label.value.trim();
        const url = ensureProtocol(e.target.url.value.trim());
        const color = root.querySelector('.palette').dataset.color;
        if (!label || !url) { showModalError('Eticheta și URL sunt obligatorii.'); return; }
        const submitBtn = e.target.querySelector('button[type="submit"]');
        submitBtn.disabled = true;
        try {
            const body = { label: label, url: url, color: color };
            if (d.id) await api('/favorites/' + d.id, { method: 'PUT', body: body });
            else { body.section_id = d.sectionId; await api('/favorites', { method: 'POST', body: body }); }
            await loadData();
            setState({ modal: null });
        } catch (err) {
            showModalError(err.message);
            submitBtn.disabled = false;
        }
    });
}

function renderConfirmModal(root) {
    const d = state.modal.data;
    let warning = '';
    if ((d.kind === 'apps-section' || d.kind === 'fav-section') && d.count > 0) {
        const word = d.kind === 'apps-section'
            ? (d.count === 1 ? 'aplicație' : 'aplicații')
            : (d.count === 1 ? 'favorit' : 'favorite');
        warning = '<div class="alert warning">' + UI.alertTriangle + ' Vor fi șterse și ' + d.count + ' ' + word + '.</div>';
    }
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">Confirmă ștergerea</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p style="font-size: 14px; margin-bottom: 0.5rem;">Ești sigur că vrei să ștergi <strong>' + escapeHtml(d.name) + '</strong>?</p>' +
                    warning +
                    '<p style="font-size: 12px; color: var(--text-dim); margin: 0.75rem 0 1.25rem 0;">Această acțiune nu poate fi anulată.</p>' +
                    '<div class="modal-actions">' +
                        '<button class="btn btn-secondary" data-close>Anulează</button>' +
                        '<button class="btn btn-danger" id="confirm-delete-btn">' + UI.trash + ' Șterge</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    bindModalCommon(root);

    document.getElementById('confirm-delete-btn').addEventListener('click', async function() {
        this.disabled = true;
        try {
            if (d.kind === 'apps-section' || d.kind === 'fav-section') await api('/sections/' + d.id, { method: 'DELETE' });
            else if (d.kind === 'app') await api('/apps/' + d.id, { method: 'DELETE' });
            else if (d.kind === 'favorite') await api('/favorites/' + d.id, { method: 'DELETE' });
            await loadData();
            setState({ modal: null });
        } catch (err) {
            showModalError(err.message);
            this.disabled = false;
        }
    });
}

function renderSettingsModal(root) {
    const totalApps = state.appsSections.reduce(function(s, sec) { return s + (sec.apps ? sec.apps.length : 0); }, 0);
    const totalFavs = state.favSections.reduce(function(s, sec) { return s + (sec.favorites ? sec.favorites.length : 0); }, 0);
    const totalSecs = state.appsSections.length + state.favSections.length;

    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">Setări</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="stats-card">' +
                        '<div class="stat-label">CONT</div>' +
                        '<div style="font-size: 14px; margin-top: 0.25rem;">' + escapeHtml((state.user && state.user.username) || '') + '</div>' +
                    '</div>' +
                    '<div class="spacer-sm"></div>' +
                    '<div class="stats-card">' +
                        '<div class="stat-label">STATISTICI</div>' +
                        '<div class="stats-grid">' +
                            '<div><div class="stat-value" style="color: var(--primary)">' + totalSecs + '</div><div class="stat-label">SECTIUNI</div></div>' +
                            '<div><div class="stat-value" style="color: var(--accent)">' + totalApps + '</div><div class="stat-label">APLICATII</div></div>' +
                            '<div><div class="stat-value" style="color: var(--amber)">' + totalFavs + '</div><div class="stat-label">FAVORITE</div></div>' +
                        '</div>' +
                    '</div>' +
                    '<div class="divider"></div>' +
                    '<div class="danger-zone-label">ZONA PERICULOASA</div>' +
                    '<button class="btn btn-danger full" data-action="open-reset">' + UI.rotateCcw + ' Reset complet portal</button>' +
                    '<div class="danger-zone-note">Pentru reset complet (cont + date), urmează instrucțiunile din modalul de reset.</div>' +
                '</div>' +
            '</div>' +
        '</div>';

    bindModalCommon(root);
    bindActions(root);
}

function renderResetModal(root) {
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal">' +
                '<div class="modal-header">' +
                    '<h3 class="modal-title">Reset portal</h3>' +
                    '<button class="modal-close">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p style="font-size: 14px; margin-bottom: 0.75rem;">Resetarea completă (incluzând contul) se face manual de pe server:</p>' +
                    '<ol class="reset-list">' +
                        '<li>Conectează-te la cPanel → File Manager</li>' +
                        '<li>Navighează la directorul <code>private/</code></li>' +
                        '<li>Șterge fișierul <code>portal.db</code></li>' +
                        '<li>La următoarea accesare a portalului, vei putea crea un cont nou</li>' +
                    '</ol>' +
                    '<div class="spacer-md"></div>' +
                    '<div class="modal-actions">' +
                        '<button class="btn btn-secondary" data-close>Am înțeles</button>' +
                    '</div>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
}



// ---------- Help Sidebar ----------

function renderHelpSidebar() {
    if (!state.helpOpen) return '';
    
    const sections = {
        intro: { title: 'Introducere', icon: '🚀' },
        login: { title: 'Autentificare', icon: '🔐' },
        apps: { title: 'Aplicații', icon: '📱' },
        favorites: { title: 'Favorite', icon: '⭐' },
        admin: { title: 'Admin', icon: '🏢' },
        settings: { title: 'Setări', icon: '⚙️' },
        security: { title: 'Securitate', icon: '🔒' },
        support: { title: 'Suport', icon: '🆘' }
    };
    
    return (
        '<div class="help-sidebar">' +
            '<div class="help-header">' +
                '<h3>📚 Ghid de utilizare</h3>' +
                '<button class="icon-btn" data-action="open-help">' + UI.x + '</button>' +
            '</div>' +
            '<div class="help-menu">' +
                Object.keys(sections).map(function(key) {
                    return (
                        '<button class="help-menu-item ' + (state.helpSection === key ? 'active' : '') + '" ' +
                            'data-action="help-section" data-section="' + key + '">' +
                            sections[key].icon + ' ' + sections[key].title +
                        '</button>'
                    );
                }).join('') +
            '</div>' +
            '<div class="help-content">' +
                renderHelpContent(state.helpSection) +
            '</div>' +
        '</div>'
    );
}

function renderHelpContent(section) {
    const contents = {
        intro: '<div class="help-desc">Portal centralizat pentru gestionarea aplicațiilor și link-urilor tale favorite, organizat pe companii și utilizatori.</div><h2>🚀 Bine ai venit!</h2><p>Platformă centralizată pentru aplicații.</p><div class="help-feature-grid"><div class="help-feature"><strong>📱 Aplicații</strong><p>Organizează tool-uri</p></div><div class="help-feature"><strong>⭐ Favorite</strong><p>Link-uri rapide</p></div><div class="help-feature"><strong>🏢 Multi-companie</strong><p>Workspace izolat</p></div><div class="help-feature"><strong>🔐 Securitate</strong><p>Autentificare sigură</p></div></div><div class="help-tip"><strong>💡 Sfat:</strong> Navighează prin meniu.</div>',
        login: '<div class="help-desc">Accesează portalul cu credențialele tale. Fiecare utilizator are propriul workspace cu aplicații și favorite personale.</div><h2>🔐 Autentificare</h2><div class="help-step"><span class="help-step-num">1</span><div><strong>Accesează</strong><br><code>https://sbcportal.aiall.ro</code></div></div><div class="help-step"><span class="help-step-num">2</span><div><strong>Credențiale</strong><br>Username și parolă</div></div><div class="help-step"><span class="help-step-num">3</span><div><strong>Intră în portal</strong></div></div>',
        apps: '<div class="help-desc">Organizează aplicațiile tale în secțiuni tematice. Fiecare aplicație are nume, URL, descriere și culoare personalizată.</div><h2>📱 Aplicații</h2><h3>Secțiune nouă</h3><div class="help-step"><span class="help-step-num">1</span><div><strong>[+ Secțiune]</strong></div></div><div class="help-step"><span class="help-step-num">2</span><div>Nume, Culoare, Icon</div></div><div class="help-step"><span class="help-step-num">3</span><div><strong>Creează</strong></div></div><h3>Aplicație</h3><div class="help-step"><span class="help-step-num">1</span><div>Selectează secțiunea</div></div><div class="help-step"><span class="help-step-num">2</span><div><strong>[+ Aplicație]</strong></div></div><div class="help-step"><span class="help-step-num">3</span><div>Detalii (Nume, URL)</div></div>',
        favorites: '<div class="help-desc">Link-uri rapide către resurse externe (Google Drive, SharePoint, etc). Accesează orice URL cu un click.</div><h2>⭐ Favorite</h2><p>Link-uri rapide.</p><div class="help-step"><span class="help-step-num">1</span><div>Creează secțiune</div></div><div class="help-step"><span class="help-step-num">2</span><div>Label, URL, Culoare</div></div><div class="help-tip"><strong>💡:</strong> Google Drive, SharePoint</div>',
        admin: '<div class="help-desc">Gestionează utilizatorii companiei tale. Administratorii pot adăuga useri, exporta/importa aplicații și seta configurări.</div><h2>🏢 Admin</h2><h3>User nou</h3><div class="help-step"><span class="help-step-num">1</span><div><strong>[+ Adaugă]</strong></div></div><div class="help-step"><span class="help-step-num">2</span><div>Completează</div></div><div class="help-step"><span class="help-step-num">3</span><div><strong>Adaugă</strong></div></div><h3>Export/Import</h3><p>Exportă aplicații și favorite într-un fișier JSON, apoi importă-le la alți utilizatori pentru a distribui configurări standard.</p><div class="help-warning"><strong>⚠️:</strong> Max 2 admini/companie</div>',
        settings: '<div class="help-desc">Personalizează tema (dark/light) și gestionează contul tău. Schimbă parola din meniul utilizator.</div><h2>⚙️ Setări</h2><p>🌙/☀️ Temă</p><p>👤 Username → Setări</p><p><strong>Taste:</strong></p><ul><li><strong>Esc</strong> — Închide</li><li><strong>Ctrl+Shift+R</strong> — Refresh</li></ul>',
        security: '<div class="help-desc">Datele tale sunt protejate cu algoritmi moderni de criptare. Sesiunile expiră automat după 7 zile de inactivitate.</div><h2>🔒 Securitate</h2><ul><li>✅ Date private</li><li>✅ Argon2id</li><li>✅ Sesiuni 7 zile</li></ul>',
        support: '<div class="help-desc">Întâmpini probleme? Consultă soluțiile rapide sau contactează echipa de suport pentru asistență.</div><h2>🆘 Suport</h2><details><summary>Nu se încarcă</summary><p>Refresh</p></details><details><summary>Parolă uitată</summary><p>Contactează admin</p></details><p><br>📧 <strong>gh.sandru@aiall.ro</strong></p>'
    };
    return contents[section] || contents.intro;
}

// ---------- Password Change Modals ----------

function modalChangePasswordRequired(root) {
    root.innerHTML =
        '<div class="modal-backdrop">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>⚠️ Schimbă parola</h3>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p style="margin-bottom: 1rem; color: var(--text-secondary);">Trebuie să îți schimbi parola înainte de a continua.</p>' +
                    '<div class="form-group">' +
                        '<label>Parola curentă</label>' +
                        '<input type="password" id="current-pwd" class="input" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Parola nouă (minim 8 caractere)</label>' +
                        '<input type="password" id="new-pwd" class="input" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Confirmă parola nouă</label>' +
                        '<input type="password" id="confirm-pwd" class="input" required>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-primary" data-action="change-password-do">Schimbă parola</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
    bindActions(root);
}

function modalChangePasswordSettings(root) {
    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Schimbă parola</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>Parola curentă</label>' +
                        '<input type="password" id="current-pwd" class="input" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Parola nouă (minim 8 caractere)</label>' +
                        '<input type="password" id="new-pwd" class="input" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Confirmă parola nouă</label>' +
                        '<input type="password" id="confirm-pwd" class="input" required>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="change-password-do">Schimbă parola</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
    bindActions(root);
}

async function handleChangePassword() {
    const currentPwd = document.getElementById('current-pwd').value;
    const newPwd = document.getElementById('new-pwd').value;
    const confirmPwd = document.getElementById('confirm-pwd').value;
    
    if (!currentPwd || !newPwd || !confirmPwd) {
        alert('Completează toate câmpurile');
        return;
    }
    
    if (newPwd.length < 8) {
        alert('Parola nouă trebuie să aibă minim 8 caractere');
        return;
    }
    
    if (newPwd !== confirmPwd) {
        alert('Parolele nu se potrivesc');
        return;
    }
    
    try {
        await api('/change-password', {
            method: 'POST',
            body: JSON.stringify({
                current_password: currentPwd,
                new_password: newPwd
            })
        });
        
        alert('Parola a fost schimbată cu succes!');
        setState({ modal: null });
        
        // Reload user data to update password_changed flag
        try {
            const me = await api('/me');
            if (me.user) {
                state.user = me.user;
                
                // Reload admin users if user is admin
                if (state.user.role === 'admin') {
                    await loadAdminUsers();
                } else {
                    updateContent();
                }
            }
        } catch (e) {
            // Silent fail - password was changed successfully anyway
        }
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

function modalAdminResetPassword(root) {
    const userId = state.modal.data.userId;
    const username = state.modal.data.username;
    
    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Reset parolă</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p style="margin-bottom: 1rem;">Resetează parola pentru <strong>' + escapeHtml(username) + '</strong></p>' +
                    '<div style="padding:15px;background:var(--bg-secondary);border-radius:6px;margin:15px 0;">' +
                        '<p style="margin:0;"><strong>🔑 Parolă temporară:</strong> <code style="background:var(--bg);padding:4px 8px;border-radius:4px;font-family:monospace;">SchimbaParola</code></p>' +
                    '</div>' +
                    '<div class="help-warning" style="margin-top: 1rem;">' +
                        '<strong>⚠️ Important:</strong> Utilizatorul va fi forțat să își schimbe parola la următoarea autentificare.' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="admin-do-reset-password">Resetează parola</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
    bindActions(root);
}

async function handleAdminResetPassword(userId, username) {
    setState({ modal: { type: 'admin-reset-password', data: { userId, username } } });
}

async function handleAdminDoResetPassword() {
    const userId = state.modal.data.userId;
    
    try {
        await api('/admin/reset-password', {
            method: 'POST',
            body: JSON.stringify({
                user_id: userId,
                new_password: 'SchimbaParola' // Backend will use this anyway
            })
        });
        
        alert('Parola a fost resetată la "SchimbaParola"! Utilizatorul va fi forțat să o schimbe la următoarea autentificare.');
        setState({ modal: null });
        await loadAdminUsers();
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

// ---------- Admin Panel ----------

let adminUsers = [];

async function loadAdminUsers() {
    try {
        const data = await api('/admin/users');
        adminUsers = data.users || [];
        updateContent();
    } catch (e) {
        alert('Eroare la incarcarea utilizatorilor: ' + e.message);
    }
}

function renderAdminTab() {
    // Loading state - data not yet loaded or role not set
    if (!state.user || !state.user.role) {
        return '<div class="empty-state"><h3>Se încarcă...</h3></div>';
    }
    
    // Access denied - user is not admin
    if (state.user.role !== 'admin') {
        return '<div class="empty-state"><h3>Acces interzis</h3></div>';
    }
    
    // Reload admin users if not loaded yet
    if (adminUsers.length === 0) {
        loadAdminUsers(); // Trigger async load
        return '<div class="empty-state"><h3>Se încarcă utilizatori...</h3></div>';
    }

    const isSuperAdmin = state.user.id === 1;
    const companyName = isSuperAdmin 
        ? 'Toate companiile (Super Admin)' 
        : (state.user.company && state.user.company.name ? state.user.company.name : 'Fără companie');
    
    return (
        '<div class="admin-panel">' +
            '<div class="admin-header">' +
                '<h2>Administrare utilizatori</h2>' +
                '<div class="admin-subtitle">' + escapeHtml(companyName) + '</div>' +
            '</div>' +
            '<div class="admin-actions">' +
                '<button class="btn btn-primary" data-action="admin-add-user">' +
                    UI.plus + ' Adaugă utilizator' +
                '</button>' +
                '<button class="btn btn-secondary" data-action="admin-refresh">' +
                    UI.rotateCcw + ' Reîmprospătează' +
                '</button>' +
                '<button class="btn btn-secondary" data-action="admin-export">' +
                    '📥 Export' +
                '</button>' +
                '<button class="btn btn-secondary" data-action="admin-import">' +
                    '📤 Import' +
                '</button>' +




            '</div>' +
            '<div style="margin: 20px 0; display: flex; gap: 10px; align-items: center;">' +
                '<label style="font-weight: 600;">Filtrează după companie:</label>' +
                '<select class="input" id="admin-company-filter" style="max-width: 300px;" data-action="admin-filter-company">' +
                    '<option value="">Toate companiile</option>' +
                    (function() {
                        var companies = {};
                        adminUsers.forEach(function(u) {
                            if (u.company_name && u.company_cui) {
                                companies[u.company_cui] = u.company_name;
                            }
                        });
                        return Object.keys(companies).map(function(cui) {
                            var selected = state.adminCompanyFilter === cui ? ' selected' : '';
                            return '<option value="' + escapeHtml(cui) + '"' + selected + '>' + escapeHtml(companies[cui]) + '</option>';
                        }).join('');
                    })() +
                '</select>' +
            '</div>' +
            '<div class="admin-users-table">' +
                (adminUsers.length === 0 ?
                    '<div class="empty-state">' +
                        '<p>Niciun utilizator găsit</p>' +
                    '</div>'
                :
                    '<table>' +
                        '<thead>' +
                            '<tr>' +
                                '<th>Username</th>' +
                                '<th>Prenume</th>' +
                                '<th>Nume</th>' +
                                '<th>Email</th>' +
                                '<th>Rol</th>' +
                                '<th>Companie</th>' +
                                '<th>Creat</th>' +
                                '<th></th>' +
                            '</tr>' +
                        '</thead>' +
                        '<tbody>' +
                            adminUsers.filter(function(u) {
                                // Apply company filter if set
                                if (state.adminCompanyFilter && state.adminCompanyFilter !== '') {
                                    return u.company_cui === state.adminCompanyFilter;
                                }
                                return true;
                            }).map(function(u) {
                                const isSelf = u.id === state.user.id;
                                const createdDate = new Date(u.created_at * 1000).toLocaleDateString('ro-RO');
                                return (
                                    '<tr>' +
                                        '<td><strong>' + escapeHtml(u.username) + '</strong></td>' +
                                        '<td>' + (u.first_name ? escapeHtml(u.first_name) : '<em style="color:#999">-</em>') + '</td>' +
                                        '<td>' + (u.last_name ? escapeHtml(u.last_name) : '<em style="color:#999">-</em>') + '</td>' +
                                        '<td>' + (u.email ? escapeHtml(u.email) : '<em style="color:#999">Fără email</em>') + '</td>' +
                                        '<td><span class="role-badge role-' + escapeHtml(u.role) + '">' + escapeHtml(u.role) + '</span></td>' +
                                        '<td>' + (u.company_name ? escapeHtml(u.company_name) : '<em>Fără companie</em>') + '</td>' +
                                        '<td>' + createdDate + '</td>' +
                                        '<td class="actions">' +
                                            (!isSelf ?
                                                '<button class="icon-btn" data-action="admin-view-as" data-user-id="' + u.id + '" data-username="' + escapeHtml(u.username) + '" title="View as user" style="color: #2563eb;">' +
                                                    '👁️' +
                                                '</button>' +
                                                '<button class="icon-btn" data-action="admin-edit-user" data-user-id="' + u.id + '" title="Editează">' +
                                                    UI.edit +
                                                '</button>' +
                                                '<button class="icon-btn" data-action="admin-reset-password" data-user-id="' + u.id + '" data-username="' + escapeHtml(u.username) + '" title="Reset parolă">' +
                                                    UI.lock +
                                                '</button>' +
                                                '<button class="icon-btn" data-action="admin-send-email" data-user-id="' + u.id + '" data-username="' + escapeHtml(u.username) + '" title="Trimite email">' +
                                                    UI.mail +
                                                '</button>' +
                                                '<button class="icon-btn" data-action="admin-delete-user" data-user-id="' + u.id + '" title="Șterge">' +
                                                    UI.trash +
                                                '</button>'
                                            : '') +
                                        '</td>' +
                                    '</tr>'
                                );
                            }).join('') +
                        '</tbody>' +
                    '</table>'
                ) +
            '</div>' +
        '</div>'
    );
}

function modalAdminAddUser(root) {
    const user = state.user;
    const defaultCui = user && user.company ? user.company.cui : '';
    const defaultName = user && user.company ? user.company.name : '';

    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Adaugă utilizator nou</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>Username</label>' +
                        '<input class="input" type="text" id="admin-username" placeholder="ex: ion.popescu" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Prenume</label>' +
                        '<input class="input" type="text" id="admin-first-name" placeholder="ex: Ion">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Nume</label>' +
                        '<input class="input" type="text" id="admin-last-name" placeholder="ex: Popescu">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Email</label>' +
                        '<input class="input" type="email" id="admin-email" placeholder="ex: ion.popescu@company.ro" required>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Parolă (minim 8 caractere)</label>' +
                        '<div class="input-with-action">' +
                            '<input class="input" type="password" id="admin-password" placeholder="••••••••" required>' +
                            '<button class="input-action-btn" data-action="toggle-password" data-target="admin-password">' + UI.eye + '</button>' +
                        '</div>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Rol</label>' +
                        '<select class="input" id="admin-role">' +
                            '<option value="user">User</option>' +
                            '<option value="admin">Admin</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>CUI Companie</label>' +
                        '<input class="input" type="text" id="admin-cui" placeholder="ex: 48025522" value="' + escapeHtml(defaultCui) + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Nume Companie</label>' +
                        '<input class="input" type="text" id="admin-company-name" placeholder="ex: AiALL S.R.L." value="' + escapeHtml(defaultName) + '">' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="admin-save-user">Adaugă</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
}

function modalAdminEditUser(root, userId) {
    const user = adminUsers.find(function(u) { return u.id === parseInt(userId); });
    if (!user) {
        setState({ modal: null });
        return;
    }

    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Editează utilizator: ' + escapeHtml(user.username) + '</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<input type="hidden" id="admin-edit-id" value="' + user.id + '">' +
                    '<div class="form-group">' +
                        '<label>Username</label>' +
                        '<input class="input" type="text" id="admin-edit-username" value="' + escapeHtml(user.username) + '" disabled style="background: #f5f5f5; cursor: not-allowed; opacity: 0.7;">' +
                        '<small style="color: #666; font-size: 12px; margin-top: 4px; display: block;">Username-ul nu poate fi modificat</small>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Email</label>' +
                        '<input class="input" type="email" id="admin-edit-email" placeholder="ex: user@company.ro" value="' + escapeHtml(user.email || '') + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Prenume</label>' +
                        '<input class="input" type="text" id="admin-edit-first-name" placeholder="ex: Ion" value="' + escapeHtml(user.first_name || '') + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Nume</label>' +
                        '<input class="input" type="text" id="admin-edit-last-name" placeholder="ex: Popescu" value="' + escapeHtml(user.last_name || '') + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Rol</label>' +
                        '<select class="input" id="admin-edit-role">' +
                            '<option value="user"' + (user.role === 'user' ? ' selected' : '') + '>User</option>' +
                            '<option value="admin"' + (user.role === 'admin' ? ' selected' : '') + '>Admin</option>' +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>CUI Companie</label>' +
                        '<input class="input" type="text" id="admin-edit-cui" placeholder="ex: 48025522" value="' + escapeHtml(user.company_cui || '') + '">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Nume Companie</label>' +
                        '<input class="input" type="text" id="admin-edit-company-name" placeholder="ex: AiALL S.R.L." value="' + escapeHtml(user.company_name || '') + '">' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="admin-update-user">Salvează</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
}

async function handleAdminSaveUser() {
    const username = document.getElementById('admin-username').value.trim();
    const email = document.getElementById('admin-email').value.trim();
    const firstName = document.getElementById('admin-first-name').value.trim();
    const lastName = document.getElementById('admin-last-name').value.trim();
    const password = document.getElementById('admin-password').value;
    const role = document.getElementById('admin-role').value;
    const cui = document.getElementById('admin-cui').value.trim();
    const companyName = document.getElementById('admin-company-name').value.trim();

    if (!username || username.length < 2) {
        alert('Username invalid (minim 2 caractere)');
        return;
    }
    if (!email || !email.includes('@')) {
        alert('Email invalid');
        return;
    }
    if (!password || password.length < 8) {
        alert('Parola trebuie sa aiba minim 8 caractere');
        return;
    }

    try {
        await api('/admin/users', {
            method: 'POST',
            body: { username, email, first_name: firstName, last_name: lastName, password, role, company_cui: cui, company_name: companyName }
        });
        setState({ modal: null });
        await loadAdminUsers();
        alert('Utilizator creat cu succes!');
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

async function handleAdminUpdateUser() {
    const userId = document.getElementById('admin-edit-id').value;
    const email = document.getElementById('admin-edit-email').value.trim();
    const firstName = document.getElementById('admin-edit-first-name').value.trim();
    const lastName = document.getElementById('admin-edit-last-name').value.trim();
    const role = document.getElementById('admin-edit-role').value;
    const cui = document.getElementById('admin-edit-cui').value.trim();
    const companyName = document.getElementById('admin-edit-company-name').value.trim();

    if (!email || !email.includes('@')) {
        alert('Email invalid');
        return;
    }

    try {
        await api('/admin/users/' + userId, {
            method: 'PUT',
            body: { email, first_name: firstName, last_name: lastName, role, company_cui: cui, company_name: companyName }
        });
        setState({ modal: null });
        await loadAdminUsers();
        alert('Utilizator actualizat!');
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

async function handleAdminDeleteUser(userId) {
    const user = adminUsers.find(function(u) { return u.id === parseInt(userId); });
    if (!user) return;

    if (!confirm('Sigur vrei să ștergi utilizatorul "' + user.username + '"? Această acțiune nu poate fi anulată.')) {
        return;
    }

    try {
        await api('/admin/users/' + userId, { method: 'DELETE' });
        await loadAdminUsers();
        alert('Utilizator șters cu succes!');
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

async function handleAdminViewAs(userId, username) {
    if (!confirm('Vrei să vezi portalul ca și utilizatorul "' + username + '"?\n\nVei putea reveni la contul tău de admin oricând.')) {
        return;
    }

    try {
        const response = await api('/admin/view-as/' + userId, { method: 'POST' });
        // Store original admin info
        setState({ 
            viewingAsUser: { 
                id: parseInt(userId), 
                username: username,
                originalAdminId: state.user.id 
            } 
        });
        // Reload to refresh as the new user
        window.location.reload();
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

async function handleReturnToAdmin() {
    if (!confirm('Vrei să revii la contul tău de admin?')) {
        return;
    }

    try {
        await api('/admin/return-from-view-as', { method: 'POST' });
        setState({ viewingAsUser: null });
        window.location.reload();
    } catch (e) {
        alert('Eroare: ' + e.message);
    }
}

// ---------- Admin Export/Import ----------

function handleAdminExport() {
    setState({ modal: { type: 'admin-export' } });
}

function handleAdminImport() {
    setState({ modal: { type: 'admin-import' } });
}

function modalAdminExport(root) {
    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Export aplicații și favorite</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<p>Selectează ce vrei să exporți:</p>' +
                    '<div class="form-group">' +
                        '<label style="display: block; margin-bottom: 0.5rem;">' +
                            '<input type="checkbox" id="export-apps" checked style="margin-right: 0.5rem;"> Aplicații' +
                        '</label>' +
                        '<label style="display: block;">' +
                            '<input type="checkbox" id="export-favs" checked style="margin-right: 0.5rem;"> Favorite' +
                        '</label>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="admin-do-export">📥 Descarcă JSON</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
}

async function handleAdminDoExport() {
    const includeApps = document.getElementById('export-apps').checked;
    const includeFavs = document.getElementById('export-favs').checked;
    
    if (!includeApps && !includeFavs) {
        alert('Selectează cel puțin o opțiune');
        return;
    }
    
    const data = { apps: [], favorites: [] };
    
    if (includeApps) {
        state.appsSections.forEach(function(sec) {
            sec.apps.forEach(function(app) {
                data.apps.push({
                    section: sec.name,
                    section_color: sec.color,
                    section_icon: sec.icon,
                    name: app.name,
                    url: app.url,
                    description: app.description,
                    color: app.color
                });
            });
        });
    }
    
    if (includeFavs) {
        state.favSections.forEach(function(sec) {
            sec.favorites.forEach(function(fav) {
                data.favorites.push({
                    section: sec.name,
                    section_color: sec.color,
                    label: fav.label,
                    url: fav.url,
                    color: fav.color
                });
            });
        });
    }
    
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = 'portal-export-' + Date.now() + '.json';
    a.click();
    URL.revokeObjectURL(url);
    
    setState({ modal: null });
    alert('Export descărcat cu succes!');
}

function modalAdminImport(root) {
    // Get unique companies
    const companies = {};
    adminUsers.forEach(function(u) {
        if (u.company_cui && u.company_name) {
            companies[u.company_cui] = u.company_name;
        }
    });
    
    const companiesHtml = Object.keys(companies).map(function(cui) {
        return '<option value="' + cui + '">' + escapeHtml(companies[cui]) + ' (CUI: ' + cui + ')</option>';
    }).join('');
    
    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h3>Import aplicații și favorite</h3>' +
                    '<button class="icon-btn" data-action="close-modal">' + UI.x + '</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div class="form-group">' +
                        '<label>Fișier JSON</label>' +
                        '<input type="file" id="import-file" accept=".json" class="input">' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Selectează compania</label>' +
                        '<select id="import-company" class="input">' +
                            '<option value="">-- Selectează companie --</option>' +
                            companiesHtml +
                        '</select>' +
                    '</div>' +
                    '<div class="form-group">' +
                        '<label>Selectează utilizatorul</label>' +
                        '<select id="import-user" class="input" disabled>' +
                            '<option value="">-- Mai întâi selectează compania --</option>' +
                        '</select>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-action="close-modal">Anulează</button>' +
                    '<button class="btn btn-primary" data-action="admin-do-import">📤 Importă</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    bindModalCommon(root);
    
    // Bind company change event
    const companySelect = document.getElementById('import-company');
    const userSelect = document.getElementById('import-user');
    
    companySelect.addEventListener('change', function() {
        const companyCui = this.value;
        
        if (!companyCui) {
            userSelect.disabled = true;
            userSelect.innerHTML = '<option value="">-- Mai întâi selectează compania --</option>';
            return;
        }
        
        const users = adminUsers.filter(function(u) {
            return u.role !== 'admin' && u.company_cui === companyCui;
        });
        
        userSelect.disabled = false;
        userSelect.innerHTML = '<option value="">-- Selectează user --</option>' +
            users.map(function(u) {
                return '<option value="' + u.id + '">' + escapeHtml(u.username) + '</option>';
            }).join('');
    });
}

// Email notification modal and functions
function modalSendEmail(root) {
    const userId = state.modal.data.userId;
    const username = state.modal.data.username;
    
    root.innerHTML =
        '<div class="modal-backdrop" data-action="close-modal">' +
            '<div class="modal-card-resizable" onclick="event.stopPropagation()">' +
                '<div class="modal-header">' +
                    '<h2>📧 Trimite email către ' + escapeHtml(username) + '</h2>' +
                    '<button class="modal-close" data-close>'+UI.x+'</button>' +
                '</div>' +
                '<div class="modal-body">' +
                    '<div id="email-preview-loading" style="text-align:center;padding:40px;">' +
                        '<p>Se încarcă preview email...</p>' +
                    '</div>' +
                    '<div id="email-preview-content" style="display:none;">' +
                        '<div style="margin-bottom:15px;padding:10px;background:var(--bg-secondary);border-radius:4px;">' +
                            '<p style="margin:5px 0;"><strong>Către:</strong> <span id="email-to"></span></p>' +
                            '<p style="margin:5px 0;"><strong>Subiect:</strong> <span id="email-subject"></span></p>' +
                        '</div>' +
                        '<div style="border:1px solid var(--border);border-radius:4px;padding:20px;background:var(--bg);overflow:auto;" id="email-html-preview">' +
                        '</div>' +
                    '</div>' +
                '</div>' +
                '<div class="modal-footer">' +
                    '<button class="btn btn-secondary" data-close>Anulează</button>' +
                    '<button class="btn btn-primary" data-action="send-email-confirm" data-user-id="'+userId+'" id="send-email-btn" style="display:none;">📧 Trimite email</button>' +
                '</div>' +
            '</div>' +
        '</div>';
    
    bindModalCommon(root);
    bindActions(root);
    loadEmailPreview(userId);
}

async function loadEmailPreview(userId) {
    try {
        const result = await api('/admin/send-email', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, preview: true })
        });
        
        document.getElementById('email-to').textContent = result.to;
        document.getElementById('email-subject').textContent = result.subject;
        document.getElementById('email-html-preview').innerHTML = result.html;
        document.getElementById('email-preview-loading').style.display = 'none';
        document.getElementById('email-preview-content').style.display = 'block';
        document.getElementById('send-email-btn').style.display = 'inline-block';
    } catch (e) {
        document.getElementById('email-preview-loading').innerHTML = 
            '<p style="color:var(--danger);">Eroare: ' + escapeHtml(e.message) + '</p>';
    }
}

async function handleSendEmailConfirm(userId) {
    const btn = document.getElementById('send-email-btn');
    if (!btn) return;
    
    btn.disabled = true;
    btn.textContent = 'Se trimite...';
    
    try {
        const result = await api('/admin/send-email', {
            method: 'POST',
            body: JSON.stringify({ user_id: userId, preview: false })
        });
        
        const sentTo = (state.modal && state.modal.data) ? state.modal.data.username : '';
        const sentEmail = result.to || '';
        alert('\u2705 Email trimis cu succes!\n\nDestinatar: ' + sentTo + '\nAdres\u0103: ' + sentEmail);
        setState({ modal: null });
    } catch (e) {
        alert('Eroare la trimiterea emailului: ' + e.message);
        btn.disabled = false;
        btn.textContent = 'Trimite email';
    }
}

async function handleAdminDoImport() {
    const fileInput = document.getElementById('import-file');
    const userId = document.getElementById('import-user').value;
    
    if (!fileInput.files[0]) {
        alert('Selectează un fișier JSON');
        return;
    }
    
    if (!userId) {
        alert('Selectează un utilizator');
        return;
    }
    
    const reader = new FileReader();
    reader.onload = async function(e) {
        try {
            const data = JSON.parse(e.target.result);
            
            await api('/admin/import', {
                method: 'POST',
                body: { user_id: parseInt(userId), data: data }
            });
            
            setState({ modal: null });
            alert('Import realizat cu succes!');
        } catch (err) {
            alert('Eroare la import: ' + err.message);
        }
    };
    reader.readAsText(fileInput.files[0]);
}

// ---------- Global keyboard ----------

let _escBound = false;
function bindGlobalKeys() {
    if (_escBound) return;
    _escBound = true;
    document.addEventListener('keydown', function(e) {
        if (e.key === 'Escape' && state.modal) setState({ modal: null });
    });
}

// ---------- Start ----------

if (document.readyState === 'loading') {
    document.addEventListener('DOMContentLoaded', bootstrap);
} else {
    bootstrap();
}
