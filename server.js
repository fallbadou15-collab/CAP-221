const http = require('node:http');
const fs = require('node:fs');
const path = require('node:path');
const { URL } = require('node:url');
const { handleAuthRoute } = require('./auth');

const root = __dirname;
const port = Number(process.env.PORT || 10000);
const geminiApiKey = process.env.GEMINI_API_KEY;
const model = process.env.GEMINI_MODEL || 'gemini-2.5-flash';
const requestTimes = new Map();
const maxPromptLength = 12000;
const rateWindowMs = 60 * 1000;
const maxRequestsPerWindow = 20;

const mimeTypes = {
    '.css': 'text/css; charset=utf-8',
    '.html': 'text/html; charset=utf-8',
    '.js': 'text/javascript; charset=utf-8',
    '.json': 'application/json; charset=utf-8',
    '.png': 'image/png',
    '.svg': 'image/svg+xml',
    '.txt': 'text/plain; charset=utf-8',
    '.webmanifest': 'application/manifest+json; charset=utf-8',
    '.xml': 'application/xml; charset=utf-8'
};

function sendJson(response, status, body) {
    const origin = response.req.headers.origin;
    const allowedOrigin = origin === 'http://localhost:5500' || origin === 'http://127.0.0.1:5500'
        ? origin
        : 'null';
    response.writeHead(status, {
        'Content-Type': 'application/json; charset=utf-8',
        'Cache-Control': 'no-store',
        'Access-Control-Allow-Origin': allowedOrigin,
        'Access-Control-Allow-Credentials': 'true',
        'Access-Control-Allow-Headers': 'Content-Type',
        'Access-Control-Allow-Methods': 'POST, OPTIONS'
    });
    response.end(JSON.stringify(body));
}

function getClientAddress(request) {
    return request.headers['x-forwarded-for']?.split(',')[0].trim() || request.socket.remoteAddress || 'unknown';
}

function isRateLimited(address) {
    const now = Date.now();
    const recent = (requestTimes.get(address) || []).filter(time => now - time < rateWindowMs);
    recent.push(now);
    requestTimes.set(address, recent);
    return recent.length > maxRequestsPerWindow;
}

function readRequestBody(request) {
    return new Promise((resolve, reject) => {
        let body = '';
        request.on('data', chunk => {
            body += chunk;
            if (body.length > maxPromptLength * 2) {
                request.destroy();
                reject(new Error('REQUEST_TOO_LARGE'));
            }
        });
        request.on('end', () => resolve(body));
        request.on('error', reject);
    });
}

async function handleAI(request, response) {
    if (request.method === 'OPTIONS') return sendJson(response, 204, {});
    if (request.method !== 'POST') {
        response.setHeader('Allow', 'POST');
        return sendJson(response, 405, { error: 'Method not allowed' });
    }
    if (!geminiApiKey) return sendJson(response, 503, { error: 'AI_NOT_CONFIGURED' });
    if (isRateLimited(getClientAddress(request))) {
        return sendJson(response, 429, { error: 'Too many requests' });
    }

    let payload;
    try {
        payload = JSON.parse(await readRequestBody(request));
    } catch (error) {
        return sendJson(response, 400, { error: 'Invalid JSON body' });
    }
    const prompt = typeof payload.prompt === 'string' ? payload.prompt.trim() : '';
    if (!prompt || prompt.length > maxPromptLength) {
        return sendJson(response, 400, { error: 'Prompt must be between 1 and 12000 characters' });
    }

    const controller = new AbortController();
    const timeout = setTimeout(() => controller.abort(), 20000);
    try {
        const upstream = await fetch(
            `https://generativelanguage.googleapis.com/v1beta/models/${encodeURIComponent(model)}:generateContent?key=${encodeURIComponent(geminiApiKey)}`,
            {
                method: 'POST',
                headers: { 'Content-Type': 'application/json' },
                body: JSON.stringify({ contents: [{ parts: [{ text: prompt }] }] }),
                signal: controller.signal
            }
        );
        const data = await upstream.json().catch(() => ({}));
        if (!upstream.ok) {
            console.error('Gemini request failed:', upstream.status);
            return sendJson(response, upstream.status === 429 ? 429 : 502, { error: 'AI_UPSTREAM_ERROR' });
        }
        const text = data.candidates?.[0]?.content?.parts?.map(part => part.text || '').join('\n').trim();
        if (!text) return sendJson(response, 502, { error: 'EMPTY_AI_RESPONSE' });
        return sendJson(response, 200, { text });
    } catch (error) {
        console.error('AI endpoint failed:', error.name);
        return sendJson(response, error.name === 'AbortError' ? 504 : 502, { error: 'AI_UNAVAILABLE' });
    } finally {
        clearTimeout(timeout);
    }
}

function serveStatic(request, response, pathname) {
    const relativePath = pathname === '/' ? 'index.html' : pathname.slice(1);
    const filePath = path.resolve(root, relativePath);
    if (!filePath.startsWith(root + path.sep)) return response.writeHead(403).end();
    fs.stat(filePath, (statError, stats) => {
        if (statError || !stats.isFile()) return response.writeHead(404).end('Not found');
        response.writeHead(200, {
            'Content-Type': mimeTypes[path.extname(filePath).toLowerCase()] || 'application/octet-stream',
            'X-Content-Type-Options': 'nosniff'
        });
        fs.createReadStream(filePath).pipe(response);
    });
}

const server = http.createServer(async (request, response) => {
    const url = new URL(request.url, `http://${request.headers.host || 'localhost'}`);
    const origin = request.headers.origin;
    if (origin === 'http://localhost:5500' || origin === 'http://127.0.0.1:5500') {
        response.setHeader('Access-Control-Allow-Origin', origin);
        response.setHeader('Access-Control-Allow-Credentials', 'true');
        response.setHeader('Access-Control-Allow-Headers', 'Content-Type');
        response.setHeader('Access-Control-Allow-Methods', 'GET, POST, OPTIONS');
    }
    if (request.method === 'OPTIONS' && url.pathname.startsWith('/api/')) {
        return response.writeHead(204).end();
    }
    if (url.pathname === '/api/health') return sendJson(response, 200, { ok: true });
    if (url.pathname === '/api/ai') return handleAI(request, response);
    if (url.pathname.startsWith('/api/auth/')) {
        let body = {};
        if (request.method === 'POST') {
            try {
                const raw = await readRequestBody(request);
                body = raw ? JSON.parse(raw) : {};
            } catch {
                return sendJson(response, 400, { error: 'Invalid JSON body' });
            }
        }
        return handleAuthRoute(request, response, url.pathname, body);
    }
    if (request.method !== 'GET' && request.method !== 'HEAD') return response.writeHead(405).end();
    return serveStatic(request, response, decodeURIComponent(url.pathname));
});

server.listen(port, '0.0.0.0', () => {
    console.log(`CAP 221 server listening on port ${port}`);
});
