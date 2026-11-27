#!/usr/bin/env node
/**
 * Static Apple HIG / App Review / Zero-Mock-Data Compliance Auditor
 * Usage: node tools/verify_apple_compliance.mjs --app apps/001-my-app
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

const appArg = getArg('app');
if (!appArg) {
  console.error('Usage: node tools/verify_apple_compliance.mjs --app <path>');
  process.exit(1);
}

const appDir = path.isAbsolute(appArg) ? appArg : path.resolve(ROOT, appArg);
const errors = [];
const warnings = [];
const passed = [];

function check(condition, okMsg, failMsg, isWarning = false) {
  if (condition) {
    passed.push(okMsg);
  } else if (isWarning) {
    warnings.push(failMsg);
  } else {
    errors.push(failMsg);
  }
}

function walkFiles(dir, exts) {
  const out = [];
  if (!fs.existsSync(dir)) return out;
  for (const entry of fs.readdirSync(dir, { withFileTypes: true })) {
    const full = path.join(dir, entry.name);
    if (entry.isDirectory()) out.push(...walkFiles(full, exts));
    else if (!exts || exts.some((e) => entry.name.endsWith(e))) out.push(full);
  }
  return out;
}

// 1. Database SQL structure check (Zero-Mock Rule)
const tablesSqlPath = path.join(appDir, 'database/tables.sql');
const seedSqlPath = path.join(appDir, 'database/seed.sql');
const installSqlPath = path.join(appDir, 'database/install.sql');
check(fs.existsSync(tablesSqlPath), 'database/tables.sql exists', 'Missing database/tables.sql');
check(fs.existsSync(seedSqlPath), 'database/seed.sql exists', 'Missing database/seed.sql');
check(fs.existsSync(installSqlPath), 'database/install.sql exists', 'Missing database/install.sql');

if (fs.existsSync(tablesSqlPath)) {
  const sql = fs.readFileSync(tablesSqlPath, 'utf8');
  check(/CREATE\s+TABLE/i.test(sql), 'tables.sql defines real CREATE TABLE schema', 'tables.sql has no CREATE TABLE statements');
}

// 2. Zero Mock Data / Lorem Ipsum Scan in src/
const srcFiles = walkFiles(path.join(appDir, 'src'), ['.js', '.html', '.css', '.json']);
const bannedPatterns = [
  { re: /\b(?:MOCK_DATA|FAKE_DATA|DUMMY_DATA|mockItems|fakeItems|dummyItems)\b/, label: 'Mock data identifier' },
  { re: /\blorem\s+ipsum\b/i, label: 'Lorem ipsum placeholder text' },
  { re: /\bcoming\s+soon\b/i, label: 'Incomplete "Coming Soon" text (Apple Guideline 2.1 risk)' }
];

for (const file of srcFiles) {
  const content = fs.readFileSync(file, 'utf8');
  for (const pat of bannedPatterns) {
    if (pat.re.test(content)) {
      errors.push(`${pat.label} found in ${path.relative(appDir, file)}`);
    }
  }
}
if (!errors.some((e) => e.includes('Mock data') || e.includes('Lorem'))) {
  passed.push('No banned mock data or placeholder patterns in src/');
}

// 3. Bilingual EN + TR Locale Parity Check
const enPath = path.join(appDir, 'src/locales/en.json');
const trPath = path.join(appDir, 'src/locales/tr.json');
check(fs.existsSync(enPath), 'src/locales/en.json exists', 'Missing src/locales/en.json');
check(fs.existsSync(trPath), 'src/locales/tr.json exists', 'Missing src/locales/tr.json');

if (fs.existsSync(enPath) && fs.existsSync(trPath)) {
  const en = JSON.parse(fs.readFileSync(enPath, 'utf8'));
  const tr = JSON.parse(fs.readFileSync(trPath, 'utf8'));
  const enKeys = Object.keys(en);
  const trKeys = Object.keys(tr);
  const missingInTr = enKeys.filter((k) => !(k in tr));
  const missingInEn = trKeys.filter((k) => !(k in en));
  check(
    missingInTr.length === 0 && missingInEn.length === 0,
    `EN/TR locale parity verified (${enKeys.length} keys)`,
    `Locale mismatch — missing in TR: [${missingInTr.join(', ')}], missing in EN: [${missingInEn.join(', ')}]`
  );
}

// 4. Capacitor Config (Apple 4.2 Offline Bundle Rule)
const capPath = path.join(appDir, 'capacitor.config.json');
check(fs.existsSync(capPath), 'capacitor.config.json exists', 'Missing capacitor.config.json');
if (fs.existsSync(capPath)) {
  const cap = JSON.parse(fs.readFileSync(capPath, 'utf8'));
  check(Boolean(cap.appId && cap.appId.includes('.')), `Valid Bundle ID: ${cap.appId}`, 'Invalid or missing capacitor.config.json appId');
  check(!cap.server?.url, 'Offline bundled webDir confirmed (no remote server.url — Apple 4.2 safe)', 'capacitor.config.json sets server.url (Apple 4.2 webview rejection risk)');
}

// 5. AdSlot Presence Check
const jsHtmlFiles = walkFiles(path.join(appDir, 'src'), ['.js', '.html']);
const hasAdSlot = jsHtmlFiles.some((f) => fs.readFileSync(f, 'utf8').includes('data-ad-slot'));
check(hasAdSlot, 'AdSlot placement found in app screens', 'No data-ad-slot found in src/ (AdMob slot missing)', true);

// 6. Apple 4.3 Accent Uniqueness vs Previous 3 Apps
const themePath = path.join(appDir, 'src/theme.css');
if (fs.existsSync(themePath)) {
  const accentMatch = fs.readFileSync(themePath, 'utf8').match(/--accent:\s*(#[0-9a-fA-F]{3,8})/);
  const myAccent = accentMatch ? accentMatch[1].toLowerCase() : null;
  check(Boolean(myAccent), `App defines custom --accent (${myAccent})`, 'src/theme.css does not define --accent');

  const appsRoot = path.join(ROOT, 'apps');
  if (myAccent && fs.existsSync(appsRoot)) {
    const siblings = fs.readdirSync(appsRoot).filter((d) => d !== path.basename(appDir) && !d.startsWith('_')).sort().slice(-3);
    for (const sib of siblings) {
      const sibTheme = path.join(appsRoot, sib, 'src/theme.css');
      if (fs.existsSync(sibTheme)) {
        const m = fs.readFileSync(sibTheme, 'utf8').match(/--accent:\s*(#[0-9a-fA-F]{3,8})/);
        if (m && m[1].toLowerCase() === myAccent) {
          warnings.push(`Apple 4.3 caution: --accent ${myAccent} matches recent sibling app ${sib}`);
        }
      }
    }
  }
}

// 7. iOS Info.plist AdMob + ATT + SKAdNetwork Patch
const plistPath = path.join(appDir, 'store-assets/ios-info-plist-patch.xml');
check(fs.existsSync(plistPath), 'store-assets/ios-info-plist-patch.xml exists', 'Missing store-assets/ios-info-plist-patch.xml');
if (fs.existsSync(plistPath)) {
  const xml = fs.readFileSync(plistPath, 'utf8');
  check(xml.includes('GADApplicationIdentifier'), 'Info.plist includes GADApplicationIdentifier', 'Missing GADApplicationIdentifier in ios-info-plist-patch.xml');
  check(xml.includes('NSUserTrackingUsageDescription'), 'Info.plist includes ATT NSUserTrackingUsageDescription', 'Missing NSUserTrackingUsageDescription in ios-info-plist-patch.xml');
  check(xml.includes('SKAdNetworkItems'), 'Info.plist includes SKAdNetworkItems', 'Missing SKAdNetworkItems in ios-info-plist-patch.xml');
}

const report = {
  ok: errors.length === 0,
  appDir,
  passedCount: passed.length,
  warningCount: warnings.length,
  errorCount: errors.length,
  passed,
  warnings,
  errors
};

console.log(JSON.stringify(report, null, 2));
process.exit(report.ok ? 0 : 1);
