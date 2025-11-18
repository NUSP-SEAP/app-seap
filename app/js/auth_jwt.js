
// ==== Config ====
const N8N_BASE = 'https://senado-nusp.cloud';
const WHOAMI_URL = `${N8N_BASE}/webhook/whoami`;
const LOGIN_URL = `${N8N_BASE}/webhook/login`;

// ==== Helpers ====
const clean = v => (typeof v === 'string' && v.startsWith('=')) ? v.slice(1) : v;
function deepClean(obj) {
  if (!obj || typeof obj !== 'object') return obj;
  const out = Array.isArray(obj) ? [] : {};
  for (const k of Object.keys(obj)) {
    const val = obj[k];
    out[k] = (val && typeof val === 'object') ? deepClean(val) : clean(val);
  }
  return out;
}
function parseJwt(token) {
  try {
    const parts = token.split('.');
    if (parts.length < 2) return null;
    const b64 = parts[1].replace(/-/g, '+').replace(/_/g, '/');
    const pad = '='.repeat((4 - (b64.length % 4)) % 4);
    const json = decodeURIComponent(atob(b64 + pad).split('').map(c => '%' + ('00' + c.charCodeAt(0).toString(16)).slice(-2)).join(''));
    return JSON.parse(json);
  } catch { return null; }
}

// ==== Storage ====
function saveToken(t) { try { localStorage.setItem('auth_token', t); } catch (_) { } }
function loadToken() { try { return localStorage.getItem('auth_token'); } catch (_) { return null; } }
function clearToken() { try { localStorage.removeItem('auth_token'); localStorage.removeItem('auth_user'); } catch (_) { } }
function saveUser(me) { try { localStorage.setItem('auth_user', JSON.stringify(me || {})); } catch (_) { } }
function loadUser() { try { return JSON.parse(localStorage.getItem('auth_user') || 'null'); } catch (_) { return null; } }

// ==== Anti-cache headers ====
function buildNoCacheHeaders(h = new Headers()) {
  h.set('Cache-Control', 'no-cache, no-store, must-revalidate');
  h.set('Pragma', 'no-cache');
  h.set('Expires', '0');
  h.set('If-None-Match', '"0"');
  h.set('If-Modified-Since', '0');
  return h;
}

// ==== Fetch autenticado ====
async function authFetch(url, options = {}) {
  const token = loadToken();
  const headers = buildNoCacheHeaders(new Headers(options.headers || {}));
  if (token) headers.set('Authorization', `Bearer ${token}`);
  return fetch(url, { cache: 'reload', ...options, headers, credentials: 'omit' });
}

// ==== WhoAmI (single-flight) ====
let __whoamiPromise = null;
async function whoAmI({ refresh = false, allowCached = true } = {}) {
  const token = loadToken();
  if (!token) return { ok: false, status: 401 };

  if (!refresh && __whoamiPromise) return __whoamiPromise;

  if (allowCached) {
    const cached = loadUser();
    if (cached && cached.ok) return cached;
  }

  __whoamiPromise = (async () => {
    const resp = await authFetch(WHOAMI_URL + `?ts=${Date.now()}`, { method: 'GET' });
    if (resp.status === 401) {
      clearToken();                 // ← limpa auth_token
      saveUser(null);               // ← limpa auth_user
      __whoamiPromise = null;       // ← evita reuso de uma promessa “negativa”
      return { ok: false, status: 401 };
    }
    if (!resp.ok) return { ok: false, status: resp.status, error: await resp.text() };
    const data = deepClean(await resp.json());
    const me = { ok: true, ...data };
    saveUser(me);
    return me;
  })();

  return __whoamiPromise;
}

// ==== Proteger página ====
async function protectPage({ adminOnly = false } = {}) {
  try {
    const me = await whoAmI({ allowCached: false });
    if (!me.ok) {
      clearToken(); saveUser(null);
      window.location.replace('/index.html');  // 1 só volta, sem empilhar histórico
      return;
    }
    const roleRaw = clean((me.role ?? me.user?.role ?? '') + '').trim().toLowerCase();
    const isAdmin = roleRaw === 'administrador' || roleRaw.startsWith('admin');
    if (adminOnly && !isAdmin) { window.location.replace('/home.html'); return; }
    window.__currentUser = me;
  } catch {
    clearToken(); saveUser(null);
    window.location.replace('/index.html');
  }
}

// ==== Login ====
async function doLogin(usuario, senha) {
  const resp = await fetch(LOGIN_URL, {
    method: 'POST',
    headers: buildNoCacheHeaders(new Headers({ 'Content-Type': 'application/json' })),
    body: JSON.stringify({ usuario, senha })
  });
  const text = await resp.text();
  if (!resp.ok) throw new Error(`Falha no login (${resp.status}) ${text || ''}`);
  let data; try { data = JSON.parse(text || '{}'); } catch { throw new Error(`Resposta do login não é JSON: ${text?.slice(0, 200) || '(vazio)'}`); }
  if (!data.token) throw new Error('Token não recebido');

  // Guarda token
  saveToken(data.token);

  // Deriva usuário e role direto do JWT (sem chamar whoami para decidir rota)
  const claims = deepClean(parseJwt(data.token) || {});
  const roleRaw = clean((claims.perfil || claims.role || '') + '').trim().toLowerCase();
  const isAdmin = roleRaw === 'administrador' || roleRaw.startsWith('admin');

  const cachedMe = {
    ok: true,
    user: {
      id: claims.sub || '',
      username: claims.username || '',
      name: claims.nome || claims.name || '',
      email: claims.email || ''
    },
    role: roleRaw || 'operador',
    exp: claims.exp || null
  };
  saveUser(cachedMe);
  window.__currentUser = cachedMe;

  // Redireciona imediatamente
  window.location.href = isAdmin ? '/admin/index.html' : '/home.html';
}

// ==== Logout ====
function doLogout() { clearToken(); saveUser(null); window.location.replace('/index.html'); }

// ==== Header ====
async function renderUserHeader() {
  try {
    const token = loadToken();
    if (!token) return; // não consulta servidor se não houver token
    const current = window.__currentUser || loadUser();
    if (current && current.ok) { paintHeader(current); return; }
    const me = await whoAmI({ allowCached: false });
    if (me && me.ok) paintHeader(me);
  } catch { }
}
function paintHeader(me) {
  const nameEl = document.querySelector('#user-greeting, [data-user-name]');
  const roleEl = document.querySelector('#user-role, [data-user-role]');
  const logoutEl = document.querySelector('#btn-logout, #btnLogout');
  const name = clean(me.user?.name || me.user?.username || '');
  const role = clean(me.role || '');
  if (nameEl) { nameEl.textContent = name; nameEl.style.display = ''; }
  if (roleEl && role) { roleEl.textContent = role; roleEl.style.display = ''; }
  if (logoutEl) { logoutEl.style.display = ''; }
}

window.Auth = { saveToken, loadToken, clearToken, saveUser, loadUser, authFetch, whoAmI, protectPage, doLogin, doLogout, renderUserHeader };
