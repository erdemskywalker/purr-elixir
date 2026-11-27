#!/usr/bin/env node
/**
 * App Store Marketing Screenshot Framer (Official Apple 6.7" 1290x2796 & 6.5" 1242x2688)
 * Renders high-impact EN & TR promotional screenshots framing real app PNG captures.
 *
 * Usage:
 *   node tools/screenshot_framer.mjs --app apps/001-my-app [--config store-assets/screenshots-config.json]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';
import { chromium } from 'playwright';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getArg(name, fallback = null) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 && process.argv[idx + 1] ? process.argv[idx + 1] : fallback;
}

const appArg = getArg('app');
if (!appArg) {
  console.error('Usage: node tools/screenshot_framer.mjs --app <path> [--config <json>]');
  process.exit(1);
}

const appDir = path.isAbsolute(appArg) ? appArg : path.resolve(ROOT, appArg);
const configPath = path.resolve(appDir, getArg('config', 'store-assets/screenshots-config.json'));

if (!fs.existsSync(configPath)) {
  console.error(`Config file not found: ${configPath}`);
  process.exit(1);
}

const config = JSON.parse(fs.readFileSync(configPath, 'utf8'));
const SIZES = [
  { key: '6.7', width: 1290, height: 2796 },
  { key: '6.5', width: 1242, height: 2688 }
];

function escapeHtml(s) {
  return String(s ?? '')
    .replace(/&/g, '&amp;')
    .replace(/</g, '&lt;')
    .replace(/>/g, '&gt;');
}

function buildFrameHtml({ width, height, accent, bgStart, bgEnd, badge, headline, subheadline, screenshotDataUri }) {
  const scale = width / 1290;
  return `<!DOCTYPE html>
<html>
<head>
<meta charset="UTF-8" />
<style>
  * { box-sizing: border-box; margin: 0; padding: 0; }
  body {
    width: ${width}px;
    height: ${height}px;
    overflow: hidden;
    font-family: -apple-system, BlinkMacSystemFont, "SF Pro Display", "Segoe UI", Roboto, sans-serif;
    background: linear-gradient(160deg, ${bgStart || '#0f172a'} 0%, ${bgEnd || accent || '#007aff'} 100%);
    color: #ffffff;
    display: flex;
    flex-direction: column;
    align-items: center;
    padding: ${Math.round(130 * scale)}px ${Math.round(80 * scale)}px 0;
    position: relative;
  }
  .glow {
    position: absolute;
    width: ${Math.round(900 * scale)}px;
    height: ${Math.round(900 * scale)}px;
    border-radius: 50%;
    background: radial-gradient(circle, rgba(255,255,255,0.22) 0%, transparent 70%);
    top: -180px;
    pointer-events: none;
  }
  .badge {
    display: inline-flex;
    padding: ${Math.round(14 * scale)}px ${Math.round(30 * scale)}px;
    border-radius: 999px;
    background: rgba(255,255,255,0.16);
    border: 1px solid rgba(255,255,255,0.28);
    font-size: ${Math.round(30 * scale)}px;
    font-weight: 700;
    letter-spacing: 0.04em;
    text-transform: uppercase;
    margin-bottom: ${Math.round(34 * scale)}px;
    backdrop-filter: blur(10px);
  }
  .headline {
    font-size: ${Math.round(84 * scale)}px;
    font-weight: 800;
    line-height: 1.08;
    letter-spacing: -0.03em;
    text-align: center;
    white-space: pre-line;
    max-width: ${Math.round(1080 * scale)}px;
    margin-bottom: ${Math.round(28 * scale)}px;
  }
  .sub {
    font-size: ${Math.round(40 * scale)}px;
    font-weight: 500;
    line-height: 1.3;
    color: rgba(255,255,255,0.86);
    text-align: center;
    max-width: ${Math.round(980 * scale)}px;
    margin-bottom: ${Math.round(70 * scale)}px;
  }
  .bezel {
    width: ${Math.round(980 * scale)}px;
    border-radius: ${Math.round(110 * scale)}px;
    padding: ${Math.round(24 * scale)}px;
    background: linear-gradient(145deg, #2d3138, #111317);
    box-shadow: 0 50px 120px rgba(0, 0, 0, 0.55), 0 0 0 3px rgba(255,255,255,0.16);
    overflow: hidden;
  }
  .bezel img {
    width: 100%;
    display: block;
    border-radius: ${Math.round(88 * scale)}px;
  }
</style>
</head>
<body>
  <div class="glow"></div>
  ${badge ? `<div class="badge">${escapeHtml(badge)}</div>` : ''}
  <h1 class="headline">${escapeHtml(headline)}</h1>
  ${subheadline ? `<p class="sub">${escapeHtml(subheadline)}</p>` : ''}
  <div class="bezel">
    <img src="${screenshotDataUri}" alt="App preview" />
  </div>
</body>
</html>`;
}

const browser = await chromium.launch({ headless: true });
const generated = [];

try {
  for (const lang of config.languages || ['en', 'tr']) {
    const outDir = path.join(appDir, 'store-assets/screenshots', lang);
    fs.mkdirSync(outDir, { recursive: true });

    const slides = config.slides || [];
    for (let i = 0; i < slides.length; i++) {
      const slide = slides[i];
      const rawPath = path.resolve(appDir, slide.sourcePng[lang] || slide.sourcePng.en || slide.sourcePng);
      if (!fs.existsSync(rawPath)) {
        throw new Error(`Missing source screenshot: ${rawPath}`);
      }
      const dataUri = `data:image/png;base64,${fs.readFileSync(rawPath).toString('base64')}`;

      for (const size of SIZES) {
        const page = await browser.newPage({ viewport: { width: size.width, height: size.height }, deviceScaleFactor: 1 });
        const html = buildFrameHtml({
          width: size.width,
          height: size.height,
          accent: config.accent,
          bgStart: slide.bgStart || config.bgStart,
          bgEnd: slide.bgEnd || config.bgEnd,
          badge: slide.badge?.[lang] || slide.badge?.en || '',
          headline: slide.headline?.[lang] || slide.headline?.en || '',
          subheadline: slide.subheadline?.[lang] || slide.subheadline?.en || '',
          screenshotDataUri: dataUri
        });
        await page.setContent(html, { waitUntil: 'load' });
        const outFile = path.join(outDir, `${String(i + 1).padStart(2, '0')}_${slide.id}_${size.key}inch.png`);
        await page.screenshot({ path: outFile });
        await page.close();
        generated.push(outFile);
      }
    }
  }
} finally {
  await browser.close();
}

console.log(JSON.stringify({ ok: true, count: generated.length, files: generated }, null, 2));
