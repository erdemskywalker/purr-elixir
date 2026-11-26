# Purr Elixir — macOS / Capacitor / Xcode & App Store Yayın Rehberi (`v1.0.0`)

- **Uygulama Adı (EN):** `Purr Elixir: Cat Potion Sort`
- **Uygulama Adı (TR):** `Purr Elixir: Kedili İksir`
- **Bundle ID:** `com.erdem.purrelixir` (`TARGETED_DEVICE_FAMILY = 1` → sadece iPhone, Dikey/Portrait kilitli, iOS `14.0+`)
- **Veritabanı (SQLite):** `purr_elixir_db` (`schemaVersion = 2`, 120 BFS/A* doğrulanmış bölüm + Sonsuz Simya + 6 etkileşimli kedi)
- **Kalite Skorları:** Görsel Kritik **`96 / 100 PASS`** (`CRITIC_REPORT.md`) · Bağımsız Eğlence Denetimi **`97 / 100 PASS`** (`PLAYTEST_REPORT.md`) · Apple Compliance **`17 / 17`**

---

## 1. Şimdiden Otomatik Hazırlananlar (`ios/` Projesi Dahil)

- **Native Xcode Projesi (`ios/`):** `npx cap add ios` tamamlandı; iPhone Portrait kilidi, `iOS 14.0+`, `Version 1.0.0`, `en`/`tr` dil desteği, `ITSAppUsesNonExemptEncryption = false`, ATT açıklaması ve 49 resmi Google `SKAdNetworkItems` hazır işlendi.
- **1024×1024 Opak 3D App Icon:** Güneşli lavanta-pastel 3D Mochi & kristal iksir ikonu (`store-assets/app-icon-1024.png`) doğrudan `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` içine yerleştirildi.
- **Markalı Açılış Ekranı (Splash):** Varsayılan mavi Capacitor logosu kaldırıldı; yerine `#F3EEFF` lavanta-porselen 2732×2732 Purr Elixir açılış görseli yerleştirildi.
- **Üst Bar & Güvenli Alan Garantisi:** `capacitor.config.json` içinde `contentInset: "never"`, `scrollEnabled: false`, `StatusBar.overlaysWebView: true` + `style: "LIGHT"` ayarlandı; 3 iPhone profilinde (`59pt Dynamic Island`, `47pt Notch`, `20pt SE`) 12–14 şişeli raflar dahil piksel bazlı doğrulandı.
- **AdMob Ödüllü Geçiş Swift Yaması:** `scripts/patch-admob-ios.mjs` (`postinstall` & `sync:ios`) ile `@capacitor-community/admob@6.2.0`'daki eksik `prepareRewardInterstitialAd` / `showRewardInterstitialAd` Swift köprüleri otomatik eklenir.

---

## 2. Üretim AdMob Kimlikleri (TAMAMLANDI — Kodlara & `Info.plist`'e İşlendi)

Tüm 4 gerçek Google AdMob iOS kimliği doğrudan üretim kodlarına ve native `ios/App/App/Info.plist` dosyasına işlendi:

| Reklam Türü | AdMob Birimi | Tanımlı Kimlik | SDK Metodu (`@capacitor-community/admob` v6) |
| :--- | :--- | :--- | :--- |
| **iOS Uygulama ID** | `Purr Elixir` | `ca-app-pub-6869171029580230~5060350326` | `ios/App/App/Info.plist` → `GADApplicationIdentifier` |
| **Banner** | `banners` | `ca-app-pub-6869171029580230/5718825879` | `AdMob.showBanner` (`ADAPTIVE_BANNER`, tab bar varken `margin: 56`, oyun ekranında `margin: 0`, modal/zafer ekranında otomatik `hideBanner/resumeBanner`) |
| **Geçiş Reklamı** | `gecis` | `ca-app-pub-6869171029580230/9466499196` | `AdMob.prepareInterstitial` + `showInterstitial` (`1–5`: 3 bölümde 1; `6+`/Günlük/Sonsuz: her geçişte, hızlı 4–5 renkli raflarda 45 sn tempo korumasıyla) |
| **Ödüllü Geçiş** | `odullu_gecis` | `ca-app-pub-6869171029580230/2246484722` | `AdMob.prepareRewardInterstitialAd` + `showRewardInterstitialAd` (`+1 Boş Şişe` & `+1 Akıllı İpucu` onaylı opt-in akışı; Swift köprüsü `postinstall` ile otomatik yamalanır) |

> **AdMob Politika Hatırlatması (Fiziksel iPhone'da Test):** Kodlar canlı üretim kimlikleriyle (`isTesting: false`) hazırdır. Kendi fiziksel iPhone'unda test ederken **AdMob Konsolu → Ayarlar → Test cihazları** bölümüne cihazını ekle ve canlı reklamlara kendin tıklama (Simülatörde AdMob otomatik test reklamı gösterir).

---

## 3. macOS'ta Capacitor & Xcode Komutları

```bash
cd app-factory/apps/002-purr-elixir
npm install            # Paketleri kurar + AdMob Ödüllü Geçiş Swift yamasını otomatik uygular
npm run sync:ios       # www/ paketini üretir, ios/'a kopyalar ve pod install çalıştırır
npx cap open ios       # ios/App/App.xcworkspace dosyasını Xcode'da açar
```

> **Not:** `npx cap add ios` çalıştırmana gerek yok (`ios/` hazır geliyor). İlk seferde gerekirse `cd ios/App && pod install --repo-update && cd ../..`.

Xcode (`App.xcworkspace`) içinde:
1. **App → Signing & Capabilities** → Apple Developer **Team** hesabını seç (`com.erdem.purrelixir`, `1.0.0`, Build `1`).
2. Hedefi **Any iOS Device (arm64)** seç → **Product → Archive → Distribute App → App Store Connect → Upload**.

---

## 4. App Store Connect Hazır Dosyaları

| Alan | Dosya |
| :--- | :--- |
| **App Icon (1024×1024)** | `store-assets/app-icon-1024.png` (3 alternatif: `store-assets/icons/`) |
| **EN / TR ASO Metinleri** | `store-assets/aso-en.md`, `store-assets/aso-tr.md` |
| **6.7" & 6.5" Ekran Görüntüleri (20 PNG)** | `store-assets/screenshots/en/`, `store-assets/screenshots/tr/` |
| **Gizlilik Etiketi (App Privacy)** | `store-assets/privacy-label.md` |
| **Apple İnceleme Notları** | `store-assets/apple-review-notes.md` |
| **Privacy Policy & Support HTML** | `store-assets/privacy-policy.html`, `store-assets/support.html` |
| **Canlı Privacy Policy URL** | `https://gaming.skyhancloud.com/purr-elixir/privacy` |
| **Canlı Support URL** | `https://gaming.skyhancloud.com/purr-elixir/support` |
| **Canlı `app-ads.txt` URL** | `https://gaming.skyhancloud.com/app-ads.txt` |

> **Direct API ile Güncelleme:** `node tools/publish_to_studio.mjs --app apps/002-purr-elixir --url https://gaming.skyhancloud.com --token <TOKEN>`
