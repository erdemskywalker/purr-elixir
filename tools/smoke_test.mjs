#!/usr/bin/env node
/**
 * App Factory Full End-to-End Smoke Test
 * Verifies:
 *  1. verify_apple_compliance.mjs (static Apple 4.2/4.3 + zero-mock + EN/TR parity)
 *  2. visual_qa_runner.mjs (real WASM SQLite + E2E CRUD + 8 multi-device PNG captures)
 *  3. screenshot_framer.mjs (6.7" 1290x2796 & 6.5" 1242x2688 EN+TR marketing frames)
 *  4. bundle_www.mjs (self-contained offline Capacitor www/ bundle)
 */

import { execFileSync } from 'node:child_process';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const ROOT = path.resolve(__dirname, '..');
const SMOKE_APP = path.join(ROOT, 'apps/_smoke-test');

const steps = [
  ['1. Static Apple Compliance', 'node', [path.join(ROOT, 'tools/verify_apple_compliance.mjs'), '--app', SMOKE_APP]],
  ['2. Playwright Visual QA + Real SQLite E2E', 'node', [path.join(ROOT, 'tools/visual_qa_runner.mjs'), '--app', SMOKE_APP, '--mode', 'all']],
  ['3. App Store Screenshot Framer (6.7" & 6.5" EN+TR)', 'node', [path.join(ROOT, 'tools/screenshot_framer.mjs'), '--app', SMOKE_APP]],
  ['4. Offline Capacitor www/ Bundler', 'node', [path.join(ROOT, 'tools/bundle_www.mjs'), '--app', SMOKE_APP]]
];

for (const [label, bin, args] of steps) {
  console.log(`\n=== ${label} ===`);
  const out = execFileSync(bin, args, { cwd: ROOT, encoding: 'utf8' });
  console.log(out.trim());
}

console.log('\nALL APP FACTORY SMOKE TESTS PASSED!');
