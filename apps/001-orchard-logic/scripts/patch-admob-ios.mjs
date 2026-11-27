#!/usr/bin/env node
/**
 * Patches an upstream bug in @capacitor-community/admob@6.2.0 for iOS:
 * AdMobPlugin.swift implements @objc func prepareRewardInterstitialAd & showRewardInterstitialAd
 * (lines 170-183) but omits them from the CAPBridgedPlugin `pluginMethods` array, which causes
 * Capacitor 6 on iOS not to expose Rewarded Interstitial methods to WKWebView.
 *
 * Runs automatically via npm `postinstall` and `sync:ios` so macOS builds always include them.
 */

import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(
  __dirname,
  '../node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift'
);

if (!fs.existsSync(target)) {
  console.log('[patch-admob-ios] AdMobPlugin.swift not present yet — skipping.');
  process.exit(0);
}

let src = fs.readFileSync(target, 'utf8');
if (src.includes('name: "prepareRewardInterstitialAd"')) {
  console.log('[patch-admob-ios] Rewarded Interstitial methods already bridged in AdMobPlugin.swift.');
  process.exit(0);
}

const anchor = 'CAPPluginMethod(name: "showRewardVideoAd", returnType: CAPPluginReturnPromise)';
if (!src.includes(anchor)) {
  console.warn('[patch-admob-ios] Could not find anchor in AdMobPlugin.swift — check plugin version.');
  process.exit(0);
}

const patched = src.replace(
  anchor,
  `${anchor},\n        CAPPluginMethod(name: "prepareRewardInterstitialAd", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: "showRewardInterstitialAd", returnType: CAPPluginReturnPromise)`
);

fs.writeFileSync(target, patched, 'utf8');
console.log('[patch-admob-ios] Patched AdMobPlugin.swift with prepareRewardInterstitialAd & showRewardInterstitialAd.');
