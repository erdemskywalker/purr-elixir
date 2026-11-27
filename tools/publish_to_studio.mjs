#!/usr/bin/env node
/**
 * App Factory -> Skyhan Gaming Studio Direct API Publisher
 * Publishes/updates any App Factory app (metadata, icon, privacy-policy.html, support.html)
 * directly to https://gaming.skyhancloud.com via POST /api/projects/publish (or /legal).
 *
 * Usage:
 *   node tools/publish_to_studio.mjs --app apps/002-purr-elixir --token skh_...
 *   node tools/publish_to_studio.mjs --app apps/001-orchard-logic --legal-only --token skh_...
 *   node tools/publish_to_studio.mjs --app apps/002-purr-elixir --dry-run
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

function loadDotEnv() {
  const __dirname = path.dirname(fileURLToPath(import.meta.url));
  const envPath = path.resolve(__dirname, '../.env');
  if (!fs.existsSync(envPath)) return;
  const lines = fs.readFileSync(envPath, 'utf8').split(/\r?\n/);
  for (const raw of lines) {
    const line = raw.trim();
    if (!line || line.startsWith('#')) continue;
    const eq = line.indexOf('=');
    if (eq === -1) continue;
    const key = line.slice(0, eq).trim();
    const val = line.slice(eq + 1).trim().replace(/^["']|["']$/g, '');
    if (key && !(key in process.env)) {
      process.env[key] = val;
    }
  }
}

loadDotEnv();

function parseArgs(argv) {
  const args = {
    app: null,
    slug: null,
    url: process.env.STUDIO_API_URL || 'https://gaming.skyhancloud.com',
    token: process.env.STUDIO_API_TOKEN || '',
    category: 'indie-oyunlar',
    ageRating: '4+',
    email: 'erdem@skyhancloud.com',
    legalOnly: false,
    noIcon: false,
    dryRun: false,
  };

  for (let i = 2; i < argv.length; i++) {
    const a = argv[i];
    if (a === '--app' && argv[i + 1]) args.app = argv[++i];
    else if (a === '--slug' && argv[i + 1]) args.slug = argv[++i];
    else if (a === '--url' && argv[i + 1]) args.url = argv[++i];
    else if (a === '--token' && argv[i + 1]) args.token = argv[++i];
    else if (a === '--category' && argv[i + 1]) args.category = argv[++i];
    else if (a === '--age' && argv[i + 1]) args.ageRating = argv[++i];
    else if (a === '--email' && argv[i + 1]) args.email = argv[++i];
    else if (a === '--legal-only') args.legalOnly = true;
    else if (a === '--no-icon') args.noIcon = true;
    else if (a === '--dry-run') args.dryRun = true;
    else if (a === '--help' || a === '-h') {
      console.log(`Usage:
  node tools/publish_to_studio.mjs --app <apps/xxx> [--url https://gaming.skyhancloud.com] [--token <skh_...>] [--slug <slug>] [--legal-only] [--no-icon] [--dry-run]

Environment variables:
  STUDIO_API_URL    Base URL (default: https://gaming.skyhancloud.com)
  STUDIO_API_TOKEN  Bearer token created in /admin/api-tokens`);
      process.exit(0);
    }
  }
  return args;
}

function readJsonIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return JSON.parse(fs.readFileSync(filePath, 'utf8'));
}

function readTextIfExists(filePath) {
  if (!fs.existsSync(filePath)) return null;
  return fs.readFileSync(filePath, 'utf8');
}

function slugify(str) {
  return String(str || '')
    .toLowerCase()
    .replace(/[^a-z0-9]+/g, '-')
    .replace(/^-+|-+$/g, '');
}

function extractPlistKey(plistText, keyName) {
  if (!plistText) return null;
  const re = new RegExp(`<key>${keyName}<\\/key>\\s*<string>([^<]+)<\\/string>`, 'i');
  const m = plistText.match(re);
  return m ? m[1].trim() : null;
}

function extractAsoField(asoText, headingPatterns) {
  if (!asoText) return null;
  for (const pat of headingPatterns) {
    const m = asoText.match(pat);
    if (m && m[1]) {
      const val = m[1].trim().replace(/^`|`$/g, '').trim();
      if (val) return val;
    }
  }
  return null;
}

async function main() {
  const opts = parseArgs(process.argv);
  if (!opts.app) {
    console.error('Error: --app <path> is required (e.g. --app apps/002-purr-elixir)');
    process.exit(1);
  }

  const appDir = path.resolve(opts.app);
  if (!fs.existsSync(appDir)) {
    console.error(`Error: App directory not found: ${appDir}`);
    process.exit(1);
  }

  const capCfg = readJsonIfExists(path.join(appDir, 'capacitor.config.json')) || {};
  const pkgJson = readJsonIfExists(path.join(appDir, 'package.json')) || {};
  const plistText = readTextIfExists(path.join(appDir, 'ios/App/App/Info.plist'));
  const asoTr = readTextIfExists(path.join(appDir, 'store-assets/aso-tr.md'));
  const asoEn = readTextIfExists(path.join(appDir, 'store-assets/aso-en.md'));
  const privacyHtml = readTextIfExists(path.join(appDir, 'store-assets/privacy-policy.html'));
  const supportHtml = readTextIfExists(path.join(appDir, 'store-assets/support.html'));
  const iconPath = path.join(appDir, 'store-assets/app-icon-1024.png');

  const title = capCfg.appName || pkgJson.name || path.basename(appDir);
  const slug = opts.slug || slugify(title);
  const bundleId = capCfg.appId || null;
  const admobAppId = extractPlistKey(plistText, 'GADApplicationIdentifier');
  const version = pkgJson.version || '1.0.0';

  const subtitle =
    extractAsoField(asoTr, [/\*\*Subtitle[^:]*:\*\*\s*(.+)/i, /Subtitle[^:\n]*:\s*`?([^\n`]+)`?/i]) ||
    extractAsoField(asoEn, [/\*\*Subtitle[^:]*:\*\*\s*(.+)/i, /Subtitle[^:\n]*:\s*`?([^\n`]+)`?/i]) ||
    pkgJson.description ||
    `${title} — Independent iOS App`;

  const promo =
    extractAsoField(asoTr, [/\*\*Promotional Text[^:]*:\*\*\s*(.+)/i, /##\s*Promotional Text[^\n]*\n+([^\n#]+)/i]) ||
    extractAsoField(asoEn, [/\*\*Promotional Text[^:]*:\*\*\s*(.+)/i, /##\s*Promotional Text[^\n]*\n+([^\n#]+)/i]) ||
    pkgJson.description ||
    subtitle;

  const endpoint = opts.legalOnly ? '/api/projects/legal' : '/api/projects/publish';
  const targetUrl = opts.url.replace(/\/+$/, '') + endpoint;

  let payload;
  if (opts.legalOnly) {
    payload = {
      slug,
      bundle_id: bundleId,
      admob_app_id: admobAppId,
      support_email: opts.email,
      ...(privacyHtml ? { privacy_policy_html: privacyHtml } : {}),
      ...(supportHtml ? { support_html: supportHtml } : {}),
    };
  } else {
    payload = {
      slug,
      title,
      tagline: subtitle,
      category_slug: opts.category,
      item_type: 'game',
      age_rating: opts.ageRating,
      age_advisory: `Her yaş grubuna (${opts.ageRating}) uygundur. %100 çevrimdışı yerel SQLite depolama ve Apple ATT / Google AdMob uyumu sunar.`,
      bundle_id: bundleId,
      admob_app_id: admobAppId,
      support_email: opts.email,
      platforms: 'iOS (Capacitor WKWebView), Web / PWA',
      tech_stack: 'Vanilla HTML5, Modern CSS3, Vanilla ES6+ JS, SQLite, Capacitor iOS, AdMob',
      version,
      developer: 'Erdem Skywalker',
      short_description: promo,
      description: `## ${title}\n\n${promo}\n\n- **Bundle ID:** \`${bundleId || 'N/A'}\`\n- **Sürüm:** v${version}\n- **Mimari:** %100 Çevrimdışı Yerel SQLite & Native iOS Capacitor`,
      pwa_supported: true,
      offline_capable: true,
      is_featured: true,
      status: 'published',
      ...(privacyHtml ? { privacy_policy_html: privacyHtml } : {}),
      ...(supportHtml ? { support_html: supportHtml } : {}),
    };

    if (!opts.noIcon && fs.existsSync(iconPath)) {
      const buf = fs.readFileSync(iconPath);
      payload.icon_base64 = `data:image/png;base64,${buf.toString('base64')}`;
    }
  }

  console.log('==============================================================');
  console.log('Skyhan Gaming Studio Direct API Publisher');
  console.log('==============================================================');
  console.log(`Target URL   : ${targetUrl}`);
  console.log(`App Folder   : ${appDir}`);
  console.log(`Title / Slug : ${title} -> ${slug}`);
  console.log(`Bundle ID    : ${bundleId || '-'}`);
  console.log(`AdMob App ID : ${admobAppId || '-'}`);
  console.log(`Privacy HTML : ${privacyHtml ? `${privacyHtml.length} bytes` : 'missing'}`);
  console.log(`Support HTML : ${supportHtml ? `${supportHtml.length} bytes` : 'missing'}`);
  console.log(`Icon Base64  : ${payload.icon_base64 ? `${payload.icon_base64.length} chars` : 'skipped'}`);

  if (opts.dryRun) {
    console.log('\n[DRY RUN] Payload built successfully; no HTTP request was sent.');
    process.exit(0);
  }

  if (!opts.token) {
    console.error('\nError: Missing API token. Pass --token <skh_...> or set STUDIO_API_TOKEN env var.');
    console.error('Create a token at https://gaming.skyhancloud.com/admin/api-tokens');
    process.exit(1);
  }

  const res = await fetch(targetUrl, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
      Authorization: `Bearer ${opts.token}`,
      'X-API-Key': opts.token,
    },
    body: JSON.stringify(payload),
  });

  const text = await res.text();
  let json;
  try {
    json = JSON.parse(text);
  } catch {
    console.error(`\nHTTP ${res.status} (non-JSON response):\n${text.slice(0, 600)}`);
    process.exit(1);
  }

  if (!res.ok || !json.ok) {
    console.error(`\nPublish failed (HTTP ${res.status}):`, JSON.stringify(json, null, 2));
    process.exit(1);
  }

  console.log('\n✅ Published successfully!');
  if (json.action) console.log(`Action       : ${json.action}`);
  if (json.urls) {
    console.log('\nLive App Store Connect URLs:');
    console.log(`  Project Page   : ${json.urls.project}`);
    console.log(`  Privacy Policy : ${json.urls.privacy}`);
    console.log(`  Support URL    : ${json.urls.support}`);
    console.log(`  app-ads.txt    : ${json.urls.app_ads_txt}`);
  }
}

main().catch((err) => {
  console.error('Fatal error:', err);
  process.exit(1);
});
