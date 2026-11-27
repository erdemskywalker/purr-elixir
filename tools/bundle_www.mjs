#!/usr/bin/env node
/**
 * Bundles an App Factory app + shared core-engine + database/*.sql + house-ads into a
 * 100% self-contained offline `www/` directory for Capacitor iOS/Android (`npx cap sync ios`).
 *
 * Usage: node tools/bundle_www.mjs --app apps/001-my-app
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function getArg(name) {
  const idx = process.argv.indexOf(`--${name}`);
  return idx !== -1 ? process.argv[idx + 1] : null;
}

function copyDir(src, dest) {
  if (!fs.existsSync(src)) return;
  fs.mkdirSync(dest, { recursive: true });
  for (const entry of fs.readdirSync(src, { withFileTypes: true })) {
    const srcPath = path.join(src, entry.name);
    const destPath = path.join(dest, entry.name);
    if (entry.isDirectory()) copyDir(srcPath, destPath);
    else fs.copyFileSync(srcPath, destPath);
  }
}

function rewriteRelativePaths(dir, depthFromWww = 0) {
  const prefix = depthFromWww === 0 ? '.' : Array(depthFromWww).fill('..').join('/');
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) {
      if (entry.name === 'core-engine' || entry.name === 'database' || entry.name === 'house-ads') continue;
      rewriteRelativePaths(full, depthFromWww + 1);
    } else if (/\.(html|js|mjs|css)$/.test(entry.name)) {
      let text = fs.readFileSync(full, 'utf8');
      text = text
        .replace(/(?:\.\.\/)+core-engine\//g, `${prefix}/core-engine/`)
        .replace(/(?:\.\.\/)+house-ads\//g, `${prefix}/house-ads/`)
        .replace(/(?:\.\.\/)+database\//g, `${prefix}/database/`);
      fs.writeFileSync(full, text, 'utf8');
    }
  }
}

const appArg = getArg('app') || '.';
const appDir = path.isAbsolute(appArg) ? appArg : path.resolve(process.cwd(), appArg);
const wwwDir = path.join(appDir, 'www');

fs.rmSync(wwwDir, { recursive: true, force: true });
fs.mkdirSync(wwwDir, { recursive: true });

copyDir(path.join(appDir, 'src'), wwwDir);
copyDir(path.join(ROOT, 'core-engine'), path.join(wwwDir, 'core-engine'));
copyDir(path.join(appDir, 'database'), path.join(wwwDir, 'database'));
fs.mkdirSync(path.join(wwwDir, 'house-ads'), { recursive: true });
if (fs.existsSync(path.join(ROOT, 'house-ads/catalog.json'))) {
  fs.copyFileSync(path.join(ROOT, 'house-ads/catalog.json'), path.join(wwwDir, 'house-ads/catalog.json'));
}

// Rewrite relative paths in app source files and core-engine default paths
rewriteRelativePaths(wwwDir, 0);

// Adjust default paths inside www/core-engine/js/ for standalone bundle
const engineJsDir = path.join(wwwDir, 'core-engine/js');
for (const file of ['db-adapter.js', 'ad-manager.js', 'engine.js']) {
  const fpath = path.join(engineJsDir, file);
  if (fs.existsSync(fpath)) {
    let txt = fs.readFileSync(fpath, 'utf8');
    txt = txt
      .replaceAll('../../../core-engine/vendor', './core-engine/vendor')
      .replaceAll('../../../house-ads/catalog.json', './house-ads/catalog.json')
      .replaceAll('../database/tables.sql', './database/tables.sql')
      .replaceAll('../database/seed.sql', './database/seed.sql');
    fs.writeFileSync(fpath, txt, 'utf8');
  }
}

console.log(JSON.stringify({ ok: true, wwwDir }, null, 2));
