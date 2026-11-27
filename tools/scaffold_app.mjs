#!/usr/bin/env node
/**
 * App Factory Scaffolder
 * Usage:
 *   node tools/scaffold_app.mjs --id 001 --slug habit-pulse --name "Habit Pulse" --bundle com.erdem.habitpulse [--backend php]
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');

function parseArgs(argv) {
  const args = {};
  for (let i = 2; i < argv.length; i++) {
    const token = argv[i];
    if (token.startsWith('--')) {
      const key = token.slice(2);
      const next = argv[i + 1];
      if (!next || next.startsWith('--')) {
        args[key] = true;
      } else {
        args[key] = next;
        i++;
      }
    }
  }
  return args;
}

function writeFileSafe(filePath, content) {
  fs.mkdirSync(path.dirname(filePath), { recursive: true });
  fs.writeFileSync(filePath, content, 'utf8');
}

const args = parseArgs(process.argv);
const id = String(args.id || '001').padStart(3, '0');
const slug = String(args.slug || '').trim().toLowerCase().replace(/[^a-z0-9-]+/g, '-');
const appName = String(args.name || '').trim();
const bundleId = String(args.bundle || `com.erdem.${slug.replace(/-/g, '')}`);
const includePhpBackend = args.backend === 'php';

if (!slug || !appName) {
  console.error('Usage: node tools/scaffold_app.mjs --id 001 --slug my-app --name "My App" --bundle com.erdem.myapp [--backend php]');
  process.exit(1);
}

const appDirName = `${id}-${slug}`;
const appDir = path.join(ROOT, 'apps', appDirName);

if (fs.existsSync(appDir) && !args.force) {
  console.error(`Error: ${appDir} already exists. Use --force to overwrite.`);
  process.exit(1);
}

// 1. Directory Tree
const dirs = [
  'database/migrations',
  'src/data',
  'src/locales',
  'src/screens',
  'tests',
  'artifacts/screenshots',
  'store-assets/icons',
  'store-assets/screenshots/en',
  'store-assets/screenshots/tr'
];
dirs.forEach((d) => fs.mkdirSync(path.join(appDir, d), { recursive: true }));
writeFileSafe(path.join(appDir, 'database/migrations/.gitkeep'), '');

// 2. Capacitor Config & App Package.json (for Mac Xcode `npx cap sync ios`)
writeFileSafe(
  path.join(appDir, 'capacitor.config.json'),
  JSON.stringify(
    {
      appId: bundleId,
      appName,
      webDir: 'www',
      bundledWebRuntime: false,
      ios: {
        contentInset: 'always',
        allowsLinkPreview: false,
        scrollEnabled: true
      },
      plugins: {
        SplashScreen: {
          launchAutoHide: true,
          backgroundColor: '#FFFFFF',
          showSpinner: false
        },
        StatusBar: {
          overlaysWebView: true
        }
      }
    },
    null,
    2
  ) + '\n'
);

writeFileSafe(
  path.join(appDir, 'package.json'),
  JSON.stringify(
    {
      name: slug,
      version: '1.0.0',
      private: true,
      description: `${appName} — Built with Erdem App Factory`,
      scripts: {
        'prepare:www': 'node ../../tools/bundle_www.mjs --app .',
        'sync:ios': 'npm run prepare:www && npx cap sync ios',
        'open:ios': 'npx cap open ios'
      },
      dependencies: {
        '@capacitor/core': '^6.2.0',
        '@capacitor/ios': '^6.2.0',
        '@capacitor/android': '^6.2.0',
        '@capacitor/haptics': '^6.0.2',
        '@capacitor/status-bar': '^6.0.2',
        '@capacitor/share': '^6.0.3',
        '@capacitor/clipboard': '^6.0.2',
        '@capacitor/splash-screen': '^6.0.3',
        '@capacitor-community/admob': '^6.2.0',
        '@capacitor-community/sqlite': '^6.0.2'
      },
      devDependencies: {
        '@capacitor/cli': '^6.2.0'
      }
    },
    null,
    2
  ) + '\n'
);

// 3. Real SQLite Database Skeleton (tables.sql, seed.sql, install.sql)
writeFileSafe(
  path.join(appDir, 'database/tables.sql'),
  `-- ${appName} — SQLite Schema (Tables)
CREATE TABLE IF NOT EXISTS app_settings (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS items (
  id INTEGER PRIMARY KEY AUTOINCREMENT,
  title TEXT NOT NULL,
  subtitle TEXT NOT NULL DEFAULT '',
  category TEXT NOT NULL DEFAULT 'general',
  is_completed INTEGER NOT NULL DEFAULT 0,
  created_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE INDEX IF NOT EXISTS idx_items_category ON items(category);
`
);

writeFileSafe(
  path.join(appDir, 'database/seed.sql'),
  `-- ${appName} — Initial Real Seed Data (Zero Mock Data in Frontend)
INSERT OR IGNORE INTO app_settings (key, value) VALUES
  ('onboarding_done', '1'),
  ('app_version', '1.0.0');
`
);

writeFileSafe(
  path.join(appDir, 'database/install.sql'),
  `-- ${appName} — Full Clean Install Script
-- Run tables.sql followed by seed.sql
.read tables.sql
.read seed.sql
`
);

// 4. Frontend Starter Files (Mounted onto shared core-engine)
writeFileSafe(
  path.join(appDir, 'src/index.html'),
  `<!DOCTYPE html>
<html lang="en">
<head>
  <meta charset="UTF-8" />
  <meta name="viewport" content="width=device-width, initial-scale=1.0, viewport-fit=cover, maximum-scale=1.0, user-scalable=no" />
  <meta name="apple-mobile-web-app-capable" content="yes" />
  <meta name="apple-mobile-web-app-status-bar-style" content="default" />
  <title>${appName}</title>
  <link rel="stylesheet" href="../../../core-engine/css/reset-ios.css" />
  <link rel="stylesheet" href="../../../core-engine/css/hig-tokens.css" />
  <link rel="stylesheet" href="../../../core-engine/css/hig-components.css" />
  <link rel="stylesheet" href="../../../core-engine/css/ad-slot.css" />
  <link rel="stylesheet" href="./theme.css" />
</head>
<body>
  <div id="af-app"></div>
  <script type="module" src="./app.js"></script>
</body>
</html>
`
);

writeFileSafe(
  path.join(appDir, 'src/theme.css'),
  `/* ${appName} — Unique Visual Identity Tokens (Override per app to prevent Apple 4.3 clone risk) */
:root {
  --accent: #007aff;
  --accent-soft: rgba(0, 122, 255, 0.14);
  --accent-contrast: #ffffff;
}

@media (prefers-color-scheme: dark) {
  :root:not([data-theme="light"]) {
    --accent: #0a84ff;
    --accent-soft: rgba(10, 132, 255, 0.22);
  }
}

:root[data-theme="dark"] {
  --accent: #0a84ff;
  --accent-soft: rgba(10, 132, 255, 0.22);
}
`
);

writeFileSafe(
  path.join(appDir, 'src/locales/en.json'),
  JSON.stringify(
    {
      'app.name': appName,
      'tab.home': 'Home',
      'tab.settings': 'Settings',
      'home.title': appName,
      'settings.title': 'Settings'
    },
    null,
    2
  ) + '\n'
);

writeFileSafe(
  path.join(appDir, 'src/locales/tr.json'),
  JSON.stringify(
    {
      'app.name': appName,
      'tab.home': 'Ana Sayfa',
      'tab.settings': 'Ayarlar',
      'home.title': appName,
      'settings.title': 'Ayarlar'
    },
    null,
    2
  ) + '\n'
);

// 5. Apple Info.plist AdMob + ATT + SKAdNetwork Patch
writeFileSafe(
  path.join(appDir, 'store-assets/ios-info-plist-patch.xml'),
  `<!-- Merge into ios/App/App/Info.plist inside <dict> -->
<key>GADApplicationIdentifier</key>
<string>ca-app-pub-XXXXXXXXXXXXXXXX~YYYYYYYYYY</string>

<key>NSUserTrackingUsageDescription</key>
<string>This identifier will be used to deliver more relevant ads and keep the app free.</string>

<key>SKAdNetworkItems</key>
<array>
  <dict><key>SKAdNetworkIdentifier</key><string>cstr6suwn9.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>4fzdc2evr5.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>2fnua5tdw4.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>ydx93a7ass.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>p78axxw29g.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>v72qych5uu.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>ludvb6z3bs.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>cp8zw746q7.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>3sh42y64q3.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>c6k4g5qg8m.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>s39g8k73mm.skadnetwork</string></dict>
  <dict><key>SKAdNetworkIdentifier</key><string>3qy4746246.skadnetwork</string></dict>
</array>
`
);

// 6. Mac Xcode Release Checklist
writeFileSafe(
  path.join(appDir, 'MAC_RELEASE_CHECKLIST.md'),
  `# ${appName} — Mac / Xcode Yayın Kontrol Listesi (2 Dakika)

- **Bundle ID:** \`${bundleId}\`
- **Klasör:** \`apps/${appDirName}\`

## Adım Adım Xcode Yayını
1. Mac'te monorepo'yu çek (\`git pull\`) ve uygulama klasörüne gir:
   \`\`\`bash
   cd apps/${appDirName}
   npm install
   npx cap add ios   # İlk seferde
   npm run sync:ios
   npx cap open ios
   \`\`\`
2. **Info.plist Güncellemesi:** \`store-assets/ios-info-plist-patch.xml\` içindeki gerçek AdMob App ID'ni (\`GADApplicationIdentifier\`), ATT açıklamasını ve \`SKAdNetworkItems\` dizisini Xcode'da \`App/App/Info.plist\` içine ekle.
3. **App Icon:** \`store-assets/icons/\` içinden seçtiğin 1024×1024 düz kare ikonu Xcode → \`Assets.xcassets/AppIcon\` (Single Size iOS) alanına sürükle.
4. **Signing & Capabilities:** Team hesabını seç, Bundle Identifier'ın \`${bundleId}\` olduğunu doğrula.
5. **Test & Archive:** Bir iPhone simülatöründe açıp AdMob Test/House Ad akışını 10 saniye kontrol et → **Product → Archive → Distribute App → App Store Connect**.
6. **App Store Connect Metinleri:**
   - İngilizce metinler: \`store-assets/aso-en.md\`
   - Türkçe metinler: \`store-assets/aso-tr.md\`
   - Ekran görüntüleri (6.7" & 6.5"): \`store-assets/screenshots/\`
   - Gizlilik etiketleri: \`store-assets/privacy-label.md\`
   - İnceleme notları: \`store-assets/apple-review-notes.md\`
`
);

// 7. Optional Modular PHP POST API Skeleton (Erdem's standard architecture)
if (includePhpBackend) {
  writeFileSafe(
    path.join(appDir, 'backend/api.php'),
    `<?php
declare(strict_types=1);
header('Content-Type: application/json; charset=utf-8');

if ($_SERVER['REQUEST_METHOD'] !== 'POST') {
    http_response_code(405);
    echo json_encode(['success' => false, 'message' => 'POST method required']);
    exit;
}

require_once __DIR__ . '/core/Database.php';
require_once __DIR__ . '/core/Middleware.php';

$raw = file_get_contents('php://input');
$body = json_decode($raw ?: '{}', true);
$module = preg_replace('/[^a-zA-Z0-9_]/', '', (string)($body['module'] ?? ''));
$action = preg_replace('/[^a-zA-Z0-9_]/', '', (string)($body['action'] ?? ''));
$payload = is_array($body['payload'] ?? null) ? $body['payload'] : [];

Middleware::runGlobal($module, $action, $payload);

$moduleFile = __DIR__ . "/modules/{$module}.php";
if (!$module || !is_file($moduleFile)) {
    http_response_code(404);
    echo json_encode(['success' => false, 'message' => 'Module not found']);
    exit;
}

require_once $moduleFile;
`
  );
  writeFileSafe(
    path.join(appDir, 'backend/core/Middleware.php'),
    `<?php
declare(strict_types=1);

class Middleware {
    public static function runGlobal(string $module, string $action, array $payload): void {
        if ($module === '' || $action === '') {
            http_response_code(400);
            echo json_encode(['success' => false, 'message' => 'Missing module or action']);
            exit;
        }
    }
}
`
  );
  writeFileSafe(
    path.join(appDir, 'backend/core/Database.php'),
    `<?php
declare(strict_types=1);

class Database {
    private static ?PDO $pdo = null;
    public static function connect(): PDO {
        if (self::$pdo === null) {
            $dsn = getenv('DB_DSN') ?: 'mysql:host=127.0.0.1;dbname=${slug.replace(/-/g, '_')};charset=utf8mb4';
            $user = getenv('DB_USER') ?: 'root';
            $pass = getenv('DB_PASS') ?: '';
            self::$pdo = new PDO($dsn, $user, $pass, [
                PDO::ATTR_ERRMODE => PDO::ERRMODE_EXCEPTION,
                PDO::ATTR_DEFAULT_FETCH_MODE => PDO::FETCH_ASSOC
            ]);
        }
        return self::$pdo;
    }
}
`
  );
  writeFileSafe(path.join(appDir, 'backend/modules/.gitkeep'), '');
}

console.log(JSON.stringify({ ok: true, appDir, appDirName, bundleId, includePhpBackend }, null, 2));
