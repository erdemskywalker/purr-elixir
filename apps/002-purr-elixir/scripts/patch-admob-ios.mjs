#!/usr/bin/env node
/**
 * Patches @capacitor-community/admob@6.2.0 on iOS so prepareRewardInterstitialAd
 * and showRewardInterstitialAd are bridged in CAPBridgedPlugin pluginMethods.
 */
import fs from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const target = path.resolve(
  __dirname,
  '../node_modules/@capacitor-community/admob/ios/Sources/AdMobPlugin/AdMobPlugin.swift'
);

if (!fs.existsSync(target)) process.exit(0);

let src = fs.readFileSync(target, 'utf8');
if (src.includes('name: "prepareRewardInterstitialAd"')) process.exit(0);

const anchor = 'CAPPluginMethod(name: "showRewardVideoAd", returnType: CAPPluginReturnPromise)';
if (!src.includes(anchor)) process.exit(0);

const patched = src.replace(
  anchor,
  `${anchor},\n        CAPPluginMethod(name: "prepareRewardInterstitialAd", returnType: CAPPluginReturnPromise),\n        CAPPluginMethod(name: "showRewardInterstitialAd", returnType: CAPPluginReturnPromise)`
);
fs.writeFileSync(target, patched, 'utf8');
console.log('[patch-admob-ios] Patched AdMobPlugin.swift with Rewarded Interstitial methods.');
