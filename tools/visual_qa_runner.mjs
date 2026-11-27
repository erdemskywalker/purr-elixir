#!/usr/bin/env node
/**
 * App Factory Visual QA & Multi-Device Screenshot Runner (Playwright + Real WASM SQLite)
 * Usage:
 *   node tools/visual_qa_runner.mjs --app apps/001-my-app --mode all|qa|screenshots [--screens home,settings]
 */

import fs from 'node:fs';
import http from 'node:http';
import path from 'node:path';
import { fileURLToPath, pathToFileURL } from 'node:url';
import { chromium } from 'playwright';

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
  '.svg': 'image/svg+xml',
  '.ico': 'image/x-icon'
};

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

function startStaticServer(rootDir) {
  return new Promise((resolve) => {
    const server = http.createServer((req, res) => {
      const urlPath = decodeURIComponent((req.url || '/').split('?')[0]);
      const safePath = path.normalize(urlPath).replace(/^(\.\.[/\\])+/, '');
      let filePath = path.join(rootDir, safePath);
      if (fs.existsSync(filePath) && fs.statSync(filePath).isDirectory()) {
        filePath = path.join(filePath, 'index.html');
      }
      if (!fs.existsSync(filePath)) {
        res.writeHead(404);
        res.end('Not found');
        return;
      }
      const ext = path.extname(filePath).toLowerCase();
      res.writeHead(200, { 'Content-Type': MIME_TYPES[ext] || 'application/octet-stream' });
      fs.createReadStream(filePath).pipe(res);
    });
    server.listen(0, '127.0.0.1', () => {
      const addr = server.address();
      resolve({ server, port: addr.port, baseUrl: `http://127.0.0.1:${addr.port}` });
    });
  });
}

const appArg = getArg('app');
const mode = getArg('mode', 'all');
const screensArg = getArg('screens', null);

if (!appArg) {
  console.error('Usage: node tools/visual_qa_runner.mjs --app <path> [--mode all|qa|screenshots] [--screens home,settings]');
  process.exit(1);
}

const appDir = path.isAbsolute(appArg) ? appArg : path.resolve(ROOT, appArg);
const relAppPath = path.relative(ROOT, appDir).split(path.sep).join('/');
const screenshotsDir = path.join(appDir, 'artifacts/screenshots');
fs.mkdirSync(screenshotsDir, { recursive: true });

const MATRIX = [
  { id: 'promax-light-prod', width: 430, height: 932, dpr: 2, theme: 'light', adMode: 'prod-nofill', lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'promax-dark-prod',  width: 430, height: 932, dpr: 2, theme: 'dark',  adMode: 'prod-nofill', lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'promax-light-devad',width: 430, height: 932, dpr: 2, theme: 'light', adMode: 'dev',         lang: 'en', simSafeTop: 59, simSafeBottom: 34, simChrome: 1 },
  { id: 'se-light-tr',       width: 375, height: 667, dpr: 2, theme: 'light', adMode: 'prod-nofill', lang: 'tr', simSafeTop: 20, simSafeBottom: 0,  simChrome: 0 }
];

const { server, baseUrl } = await startStaticServer(ROOT);
const browser = await chromium.launch({ headless: true });

const report = {
  ok: true,
  appDir,
  mode,
  consoleErrors: [],
  pageErrors: [],
  failedRequests: [],
  checks: [],
  e2eResult: null,
  screenshots: []
};

try {
  // Discover screens automatically from booted AppFactory.router if --screens not provided
  const appUrl = `${baseUrl}/${relAppPath}/src/index.html`;

  async function inspectVariant(screenName, variant) {
    const context = await browser.newContext({
      viewport: { width: variant.width, height: variant.height },
      deviceScaleFactor: variant.dpr,
      colorScheme: variant.theme,
      isMobile: true,
      hasTouch: true
    });
    const page = await context.newPage();

    const localConsoleErrors = [];
    const localPageErrors = [];
    const localFailedReqs = [];

    page.on('console', (msg) => {
      if (msg.type() === 'error') localConsoleErrors.push(msg.text());
    });
    page.on('pageerror', (err) => localPageErrors.push(err.message));
    page.on('response', (res) => {
      if (res.status() >= 400 && !res.url().includes('favicon.ico')) {
        localFailedReqs.push(`${res.status()} ${res.url()}`);
      }
    });

    const qs = new URLSearchParams({
      theme: variant.theme,
      adMode: variant.adMode,
      lang: variant.lang,
      simSafeTop: String(variant.simSafeTop),
      simSafeBottom: String(variant.simSafeBottom),
      simChrome: String(variant.simChrome),
      ephemeralDb: '1'
    });
    if (screenName) qs.set('route', screenName);

    await page.goto(`${appUrl}?${qs.toString()}`, { waitUntil: 'networkidle' });
    await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready), { timeout: 12000 });
    await page.waitForTimeout(250);

    const diagnostics = await page.evaluate(() => {
      const af = window.AppFactory;
      const overflowX = document.documentElement.scrollWidth > window.innerWidth + 1;
      const missingI18n = af?.i18n ? Array.from(af.i18n.missingKeys) : [];
      const routes = af?.router ? Array.from(af.router.routes.keys()) : [];
      const activeScreen = document.querySelector('.af-screen')?.getAttribute('data-screen') || 'home';
      const dbMode = af?.db?.mode || 'none';

      // Check touch targets for visible interactive buttons
      const tinyButtons = [];
      document.querySelectorAll('.af-btn, .af-nav-btn, .af-tab-item').forEach((btn) => {
        const rect = btn.getBoundingClientRect();
        if (rect.width > 0 && rect.height > 0 && (rect.height < 42 || rect.width < 42)) {
          tinyButtons.push({ text: btn.textContent?.trim().slice(0, 24), w: Math.round(rect.width), h: Math.round(rect.height) });
        }
      });

      const adSlots = Array.from(document.querySelectorAll('[data-ad-slot]')).map((el) => {
        const rect = el.getBoundingClientRect();
        return {
          id: el.getAttribute('data-ad-slot'),
          classes: el.className,
          width: Math.round(rect.width),
          height: Math.round(rect.height)
        };
      });

      return { overflowX, missingI18n, routes, activeScreen, dbMode, tinyButtons, adSlots };
    });

    let screenshotPath = null;
    if (mode === 'all' || mode === 'screenshots') {
      const fileName = `${diagnostics.activeScreen}__${variant.id}.png`;
      screenshotPath = path.join(screenshotsDir, fileName);
      await page.screenshot({ path: screenshotPath, fullPage: false });
      report.screenshots.push(screenshotPath);
    }

    report.consoleErrors.push(...localConsoleErrors);
    report.pageErrors.push(...localPageErrors);
    report.failedRequests.push(...localFailedReqs);
    report.checks.push({
      screen: diagnostics.activeScreen,
      variant: variant.id,
      dbMode: diagnostics.dbMode,
      overflowX: diagnostics.overflowX,
      missingI18n: diagnostics.missingI18n,
      tinyButtons: diagnostics.tinyButtons,
      adSlots: diagnostics.adSlots
    });

    if (diagnostics.overflowX || diagnostics.missingI18n.length > 0 || localConsoleErrors.length > 0 || localPageErrors.length > 0 || localFailedReqs.length > 0) {
      report.ok = false;
    }

    await context.close();
    return diagnostics;
  }

  // First boot to discover all registered screens if not specified
  const initialDiag = await inspectVariant(screensArg ? screensArg.split(',')[0] : null, MATRIX[0]);
  const screens = screensArg
    ? screensArg.split(',').map((s) => s.trim()).filter(Boolean)
    : initialDiag.routes.length > 0
      ? initialDiag.routes
      : [initialDiag.activeScreen];

  for (let sIdx = 0; sIdx < screens.length; sIdx++) {
    const scr = screens[sIdx];
    for (let vIdx = 0; vIdx < MATRIX.length; vIdx++) {
      if (sIdx === 0 && vIdx === 0) continue; // already captured
      await inspectVariant(scr, MATRIX[vIdx]);
    }
  }

  // Run app-specific Playwright E2E spec if present
  const e2ePath = path.join(appDir, 'tests/e2e.spec.mjs');
  if ((mode === 'all' || mode === 'qa') && fs.existsSync(e2ePath)) {
    const e2eMod = await import(pathToFileURL(e2ePath).href);
    if (typeof e2eMod.runE2E === 'function') {
      const ctx = await browser.newContext({
        viewport: { width: 430, height: 932 },
        isMobile: true,
        hasTouch: true
      });
      const page = await ctx.newPage();
      try {
        report.e2eResult = await e2eMod.runE2E({ page, appUrl });
        if (report.e2eResult && report.e2eResult.ok === false) report.ok = false;
      } catch (err) {
        report.ok = false;
        report.e2eResult = { ok: false, error: err.message };
      } finally {
        await ctx.close();
      }
    }
  }
} finally {
  await browser.close();
  server.close();
}

const reportPath = path.join(appDir, 'artifacts/qa-report.json');
fs.writeFileSync(reportPath, JSON.stringify(report, null, 2), 'utf8');
console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
