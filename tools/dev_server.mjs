#!/usr/bin/env node
/**
 * App Factory Local Preview Server
 * Serves the monorepo with exact MIME types (.wasm, .js, .css, .sql, .json)
 * and provides a clickable launcher + iPhone simulator wrapper at http://127.0.0.1:<port>/
 *
 * Usage: node tools/dev_server.mjs [--port 4173]
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

const MIME_TYPES = {
  '.html': 'text/html; charset=utf-8',
  '.js': 'application/javascript; charset=utf-8',
  '.mjs': 'application/javascript; charset=utf-8',
  '.css': 'text/css; charset=utf-8',
  '.json': 'application/json; charset=utf-8',
  '.sql': 'text/plain; charset=utf-8',
  '.wasm': 'application/wasm',
  '.png': 'image/png',
  '.jpg': 'image/jpeg',
  '.jpeg': 'image/jpeg',
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon',
  '.xml': 'application/xml; charset=utf-8'
};

function getPort() {
  const idx = process.argv.indexOf('--port');
  if (idx !== -1 && process.argv[idx + 1]) return Number(process.argv[idx + 1]);
  return Number(process.env.PORT || 4173);
}

function listApps() {
  const appsDir = path.join(ROOT, 'apps');
  if (!fs.existsSync(appsDir)) return [];
  return fs
    .readdirSync(appsDir, { withFileTypes: true })
    .filter((d) => d.isDirectory() && fs.existsSync(path.join(appsDir, d.name, 'src/index.html')))
    .map((d) => {
      let name = d.name;
      const capFile = path.join(appsDir, d.name, 'capacitor.config.json');
      if (fs.existsSync(capFile)) {
        try {
          name = JSON.parse(fs.readFileSync(capFile, 'utf8')).appName || d.name;
        } catch { /* ignore */ }
      }
      return { id: d.name, name };
    })
    .sort((a, b) => a.id.localeCompare(b.id));
}

function renderPhoneWrapper(appId, queryStr) {
  const src = `/apps/${appId}/src/index.html${queryStr ? `?${queryStr}` : '?lang=tr&theme=light&adMode=prod-nofill&simSafeTop=59&simSafeBottom=34&simChrome=1'}`;
  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Factory Preview — ${appId}</title>
  <style>
    * { box-sizing: border-box; }
    body {
      margin: 0;
      min-height: 100vh;
      background: #111216;
      color: #f5f5f7;
      font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif;
      display: flex;
      flex-direction: column;
      align-items: center;
      padding: 16px;
      gap: 14px;
    }
    .bar {
      display: flex;
      flex-wrap: wrap;
      gap: 8px;
      align-items: center;
      justify-content: center;
      background: #1c1d22;
      padding: 10px 14px;
      border-radius: 14px;
      border: 1px solid rgba(255,255,255,0.08);
    }
    .bar a, .bar button {
      color: #fff;
      background: #2c2e36;
      border: 0;
      padding: 7px 12px;
      border-radius: 9px;
      font-size: 13px;
      font-weight: 600;
      cursor: pointer;
      text-decoration: none;
    }
    .bar button.active { background: #d9383e; }
    .phone {
      width: 410px;
      height: 852px;
      max-height: calc(100vh - 96px);
      border-radius: 48px;
      padding: 12px;
      background: linear-gradient(145deg, #3a3d45, #17181d);
      box-shadow: 0 28px 80px rgba(0,0,0,0.6), 0 0 0 2px rgba(255,255,255,0.12);
    }
    iframe {
      width: 100%;
      height: 100%;
      border: 0;
      border-radius: 38px;
      background: #fff;
    }
  </style>
</head>
<body>
  <div class="bar">
    <a href="/">← Tüm Uygulamalar</a>
    <button id="btn-tr" onclick="setParam('lang','tr')">TR</button>
    <button id="btn-en" onclick="setParam('lang','en')">EN</button>
    <button id="btn-light" onclick="setParam('theme','light')">Light</button>
    <button id="btn-dark" onclick="setParam('theme','dark')">Dark</button>
    <button id="btn-prod" onclick="setParam('adMode','prod-nofill')">Prod (House Ad)</button>
    <button id="btn-dev" onclick="setParam('adMode','dev')">Dev (AdMob Slot)</button>
    <a id="btn-direct" href="${src}" target="_blank">Tam Ekran Aç ↗</a>
  </div>
  <div class="phone">
    <iframe id="preview-frame" src="${src}"></iframe>
  </div>
  <script>
    const frame = document.getElementById('preview-frame');
    const direct = document.getElementById('btn-direct');
    function setParam(k, v) {
      const url = new URL(frame.src, location.origin);
      url.searchParams.set(k, v);
      frame.src = url.pathname + url.search;
      direct.href = frame.src;
    }
  </script>
</body>
</html>`;
}

function renderLauncher(port) {
  const apps = listApps();
  const cards = apps
    .map(
      (a) => `
      <div class="card">
        <div>
          <div class="id">${a.id}</div>
          <h2>${a.name}</h2>
        </div>
        <div class="actions">
          <a class="btn primary" href="/preview/${a.id}">iPhone Çerçevesinde Aç</a>
          <a class="btn" href="/apps/${a.id}/src/index.html?lang=tr&adMode=dev">Tam Ekran (Dev AdSlot)</a>
          <a class="btn" href="/apps/${a.id}/src/index.html?lang=tr&adMode=prod-nofill">Tam Ekran (Prod House Ad)</a>
        </div>
      </div>`
    )
    .join('');

  return `<!DOCTYPE html>
<html lang="tr">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0" />
  <title>App Factory Preview Server</title>
  <style>
    body { margin: 0; padding: 32px 20px; background: #111216; color: #f5f5f7; font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; }
    .wrap { max-width: 720px; margin: 0 auto; }
    h1 { margin: 0 0 8px; font-size: 28px; }
    p { margin: 0 0 24px; color: #a1a1aa; }
    .card { background: #1c1d22; border: 1px solid rgba(255,255,255,0.08); border-radius: 16px; padding: 18px 20px; margin-bottom: 14px; display: flex; flex-direction: column; gap: 14px; }
    .id { font-size: 12px; color: #a1a1aa; font-family: monospace; }
    h2 { margin: 2px 0 0; font-size: 20px; }
    .actions { display: flex; flex-wrap: wrap; gap: 10px; }
    .btn { text-decoration: none; color: #fff; background: #2c2e36; padding: 10px 14px; border-radius: 10px; font-size: 14px; font-weight: 600; }
    .btn.primary { background: #d9383e; }
  </style>
</head>
<body>
  <div class="wrap">
    <h1>App Factory Preview</h1>
    <p>Çalışan adres: http://127.0.0.1:${port}</p>
    ${cards}
  </div>
</body>
</html>`;
}

const port = getPort();
const server = http.createServer((req, res) => {
  const parsed = new URL(req.url || '/', `http://127.0.0.1:${port}`);
  const pathname = decodeURIComponent(parsed.pathname);

  if (pathname === '/' || pathname === '/index.html') {
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(renderLauncher(port));
    return;
  }

  if (pathname.startsWith('/preview/')) {
    const appId = pathname.slice('/preview/'.length).replace(/[^a-zA-Z0-9_-]/g, '');
    res.writeHead(200, { 'Content-Type': 'text/html; charset=utf-8', 'Cache-Control': 'no-store' });
    res.end(renderPhoneWrapper(appId, parsed.search.slice(1)));
    return;
  }

  const safePath = path.normalize(pathname).replace(/^(\.\.[/\\])+/, '');
  let filePath = path.join(ROOT, safePath);
  if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
    filePath = path.join(filePath, 'index.html');
  }
  if (!fs.existsSync(filePath)) {
    res.writeHead(404, { 'Content-Type': 'text/plain; charset=utf-8' });
    res.end(`Not found: ${pathname}`);
    return;
  }

  const ext = path.extname(filePath).toLowerCase();
  res.writeHead(200, {
    'Content-Type': MIME_TYPES[ext] || 'application/octet-stream',
    'Cache-Control': 'no-store'
  });
  fs.createReadStream(filePath).pipe(res);
});

server.listen(port, '127.0.0.1', () => {
  console.log(`App Factory Preview Server running at http://127.0.0.1:${port}/`);
  console.log(`Orchard Logic (iPhone Preview): http://127.0.0.1:${port}/preview/001-orchard-logic`);
  console.log(`Orchard Logic (Direct TR):      http://127.0.0.1:${port}/apps/001-orchard-logic/src/index.html?lang=tr`);
});
