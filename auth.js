// ============================================================
//  CAP 221 â€” Comptes Ã©tudiants (backend sans dÃ©pendance)
//  Fichiers : data/users.json  { email: { name, salt, hash, favorites, createdAt } }
//  SÃ©curitÃ© : scrypt (Node natif) + session token httpOnly cookie
// ============================================================
const crypto = require('node:crypto');
const fs = require('node:fs');
const path = require('node:path');

const dataDir = path.join(__dirname, 'data');
const usersFile = path.join(dataDir, 'users.json');
const sessions = new Map(); // token -> { email, expiresAt }
const SESSION_TTL = 30 * 24 * 3600 * 1000; // 30 jours

function ensureDataDir() {
    if (!fs.existsSync(dataDir)) fs.mkdirSync(dataDir, { recursive: true });
}

function readUsers() {
    try {
        return JSON.parse(fs.readFileSync(usersFile, 'utf8'));
    } catch {
        return {};
    }
}

function writeUsers(users) {
    ensureDataDir();
    fs.writeFileSync(usersFile, JSON.stringify(users, null, 2));
}

function hashPassword(password, salt) {
    return crypto.scryptSync(password, salt, 64).toString('hex');
}

function validEmail(email) {
    return typeof email === 'string' && /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 160;
}

function validPassword(password) {
    return typeof password === 'string' && password.length >= 8 && password.length <= 128;
}

function parseCookies(request) {
    const header = request.headers.cookie || '';
    const out = {};
    header.split(';').forEach(part => {
        const idx = part.indexOf('=');
        if (idx > 0) out[part.slice(0, idx).trim()] = decodeURIComponent(part.slice(idx + 1).trim());
    });
    return out;
}

function createSession(email) {
    const token = crypto.randomBytes(32).toString('hex');
    sessions.set(token, { email, expiresAt: Date.now() + SESSION_TTL });
    return token;
}

function getSessionUser(request) {
    const token = parseCookies(request).cap221_session;
    if (!token) return null;
    const session = sessions.get(token);
    if (!session || session.expiresAt < Date.now()) { sessions.delete(token); return null; }
    const users = readUsers();
    const user = users[session.email];
    if (!user) return null;
    return { email: session.email, name: user.name, favorites: user.favorites || { jobs: [], univs: [] } };
}

function setSessionCookie(response, token) {
    response.setHeader('Set-Cookie',
        `cap221_session=${token}; HttpOnly; Path=/; Max-Age=${SESSION_TTL / 1000}; SameSite=Lax${process.env.NODE_ENV === 'production' ? '; Secure' : ''}`);
}

function clearSessionCookie(response) {
    response.setHeader('Set-Cookie', 'cap221_session=; HttpOnly; Path=/; Max-Age=0; SameSite=Lax');
}

function publicUser(user) {
    return { email: user.email, name: user.name, favorites: user.favorites || { jobs: [], univs: [] } };
}

function handleSignup(request, response, body) {
    const { name, email, password } = body;
    if (!validEmail(email)) return send400(response, 'Email invalide.');
    if (!validPassword(password)) return send400(response, 'Mot de passe : au moins 8 caractÃ¨res.');
    if (typeof name !== 'string' || name.trim().length < 2 || name.trim().length > 60) return send400(response, 'Nom invalide.');
    const users = readUsers();
    const key = email.trim().toLowerCase();
    if (users[key]) return sendJson(response, 409, { error: 'Un compte existe dÃ©jÃ  avec cet email.' });
    const salt = crypto.randomBytes(16).toString('hex');
    users[key] = {
        name: name.trim(),
        salt,
        hash: hashPassword(password, salt),
        favorites: { jobs: [], univs: [] },
        createdAt: new Date().toISOString()
    };
    writeUsers(users);
    setSessionCookie(response, createSession(key));
    return sendJson(response, 201, { user: publicUser(users[key]) });
}

function handleLogin(request, response, body) {
    const { email, password } = body;
    if (!validEmail(email) || typeof password !== 'string') return send400(response, 'Email ou mot de passe invalide.');
    const users = readUsers();
    const user = users[email.trim().toLowerCase()];
    if (!user) return sendJson(response, 401, { error: 'Email ou mot de passe incorrect.' });
    const candidate = hashPassword(password, user.salt);
    const ok = candidate.length === user.hash.length &&
        crypto.timingSafeEqual(Buffer.from(candidate), Buffer.from(user.hash));
    if (!ok) return sendJson(response, 401, { error: 'Email ou mot de passe incorrect.' });
    setSessionCookie(response, createSession(email.trim().toLowerCase()));
    return sendJson(response, 200, { user: publicUser(user) });
}

function handleLogout(request, response) {
    const token = parseCookies(request).cap221_session;
    if (token) sessions.delete(token);
    clearSessionCookie(response);
    return sendJson(response, 200, { ok: true });
}

function handleFavorites(request, response, body, user) {
    if (!user) return sendJson(response, 401, { error: 'Non connectÃ©' });
    const favs = body && typeof body.favorites === 'object' && body.favorites ? body.favorites : null;
    if (!favs || !Array.isArray(favs.jobs) || !Array.isArray(favs.univs)) {
        return send400(response, 'Format de favoris invalide.');
    }
    const clean = {
        jobs: favs.jobs.filter(j => j && typeof j.id === 'string').slice(0, 200),
        univs: favs.univs.filter(u => u && typeof u.id === 'string').slice(0, 200)
    };
    const users = readUsers();
    const account = users[user.email];
    if (!account) return sendJson(response, 401, { error: 'Non connectÃ©' });
    account.favorites = clean;
    writeUsers(users);
    return sendJson(response, 200, { ok: true });
}

function send400(response, message) {
    return sendJson(response, 400, { error: message });
}

function handleAuthRoute(request, response, pathname, body) {
    switch (pathname) {
        case '/api/auth/signup': return handleSignup(request, response, body);
        case '/api/auth/login': return handleLogin(request, response, body);
        case '/api/auth/logout': return handleLogout(request, response);
        case '/api/auth/me': {
            const user = getSessionUser(request);
            if (!user) return sendJson(response, 401, { error: 'Non connectÃ©' });
            return sendJson(response, 200, { user });
        }
        case '/api/auth/favorites': {
            const user = getSessionUser(request);
            if (request.method === 'GET') {
                if (!user) return sendJson(response, 401, { error: 'Non connectÃ©' });
                return sendJson(response, 200, { favorites: user.favorites });
            }
            return handleFavorites(request, response, body, user);
        }
        default: return sendJson(response, 404, { error: 'Route inconnue' });
    }
}

module.exports = { handleAuthRoute, getSessionUser };


function sendJson(response, status, body) {
    response.writeHead(status, { 'Content-Type': 'application/json; charset=utf-8', 'Cache-Control': 'no-store' });
    response.end(JSON.stringify(body));
}
