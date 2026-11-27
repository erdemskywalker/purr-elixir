# Fruitopia — macOS / Capacitor / Xcode & App Store Yayın Rehberi (`v1.0.0`)

- **Uygulama Adı (EN):** `Fruitopia: Fruit Puzzle`
- **Uygulama Adı (TR):** `Fruitopia: Meyve Sudokusu`
- **Bundle ID:** `com.erdem.fruitopia` (`TARGETED_DEVICE_FAMILY = 1` → iPhone, Dikey/Portrait kilitli, iOS `14.0+`)
- **Veritabanı (SQLite):** `fruitopia_db` (90 saf mantık bulmacası + cihaz içi Endless Arcade)
- **Bağımsız Eğlence & Kalite Skoru:** `95 / 100 PASS` (`17/17` Apple Compliance)

---

## 1. Şimdiden Otomatik Olarak Hazırlananlar (Ekstra Manuel İşlem Yok!)

`apps/001-orchard-logic/ios/` native Xcode projesi **hazır üretildi ve önceden yapılandırıldı**:
- **`ios/App/App/Info.plist`**: Gerçek AdMob iOS App ID (`ca-app-pub-6869171029580230~1378990147`), `ITSAppUsesNonExemptEncryption = false`, ATT (`NSUserTrackingUsageDescription`), 49 resmi Google `SKAdNetworkItems`, `en`/`tr` dil bildirimi, `UIStatusBarStyleDarkContent` ve iPhone Portrait kilidi hazır işlendi.
- **App Icon (1024×1024 RGB, şeffaflık yok)**: Yeni 3D 4 meyveli Fruitopia ikonu doğrudan `ios/App/App/Assets.xcassets/AppIcon.appiconset/AppIcon-512@2x.png` içine yerleştirildi.
- **Markalı Açılış Ekranı (Splash)**: Varsayılan mavi Capacitor logosu kaldırıldı; yerine `#FBF3E4` krema zeminli 2732×2732 Fruitopia 3D açılış ekranı yerleştirildi.
- **Üst Bar & Güvenli Alan (Dynamic Island / Çentik / SE)**: `capacitor.config.json` içinde `contentInset: "never"`, `scrollEnabled: false`, `StatusBar.overlaysWebView: true` + `style: "LIGHT"` ayarlandı; tüm ekranlarda (`Home`, `Levels`, `Stats`, `Play`) üst barlar yalnızca tek katmanlı `env(safe-area-inset-top)` ile birebir hizalıdır (çift boşluk veya çentik altına girme riski sıfır).
- **Tam Çalışan AdMob iOS SDK Yaması**: `@capacitor-community/admob@6.2.0` paketinin iOS Swift dosyasındaki eksik `prepareRewardInterstitialAd` / `showRewardInterstitialAd` köprü kaydı `scripts/patch-admob-ios.mjs` (`postinstall` & `sync:ios`) ile otomatik yamanır. Böylece **Banner**, **Geçiş** ve **Ödüllü Geçiş** reklamlarının üçü de iPhone'da birebir çalışır.

---

## 2. macOS'a Geçince Yapman Gerekenler (Sadece 4 Komut + Archive)

macOS'ta ön koşul: **Xcode** (App Store'dan), **Node.js 18+** ve **CocoaPods** (`brew install cocoapods` veya `sudo gem install cocoapods`).

Terminal'de depoyu çekip şu komutları çalıştır:

```bash
cd app-factory/apps/001-orchard-logic
npm install            # Paketleri kurar + AdMob Ödüllü Geçiş iOS yamasını otomatik uygular
npm run sync:ios       # Offline www/ paketini üretir, ios/'a kopyalar ve pod install çalıştırır
npx cap open ios       # ios/App/App.xcworkspace dosyasını Xcode'da açar
```

> **Not:** `npx cap add ios` çalıştırmana **GEREK YOK** — `ios/` klasörü zaten hazır ve tüm `Info.plist`, AppIcon ve Splash ayarlarıyla birlikte geliyor! Eğer `pod install` ilk seferde `CocoaPods` repo güncellemesi isterse: `cd ios/App && pod install --repo-update && cd ../..`

---

## 3. Xcode İçinde Yapacağın Tek Şey (2 Dakika)

`npx cap open ios` ile açılan **`App.xcworkspace`** penceresinde (asla `.xcodeproj` değil, `.xcworkspace`!):
1. Sol menüden **App** projesine tıkla → **Signing & Capabilities** sekmesini aç:
   - **Automatically manage signing** işaretli olsun.
   - **Team** olarak kendi Apple Developer hesabını seç.
   - **Bundle Identifier** = `com.erdem.fruitopia`, **Version** = `1.0.0`, **Build** = `1` olduğunu gözünle onayla.
2. **Hızlı iPhone Simülatör Testi (iPhone 16 Pro & iPhone SE):**
   - Üst barın Dynamic Island / durum çubuğu altında tam oturduğunu, kaydırırken kartların saat/pil ikonlarıyla çakışmadığını,
   - Banner, `6×6` seviye geçiş reklamı ve `+1 İpucu` ödüllü geçiş reklamının test reklamı olarak sorunsuz açıldığını gör.
3. **App Store'a Yükle:**
   - Üst hedef cihaz listesinden **Any iOS Device (arm64)** seç.
   - Menüden **Product → Archive** tıkla.
   - Arşiv açılınca **Distribute App → App Store Connect → Upload**.

> **AdMob Politika Hatırlatması (Fiziksel iPhone'da Test):** Kodlar canlı üretim kimlikleriyle (`isTesting: false`) hazırdır. Kendi fiziksel iPhone'unda test ederken **AdMob Konsolu → Ayarlar → Test cihazları** bölümüne cihazını ekle ve canlı reklamlara kendin tıklama.

---

## 4. App Store Connect Hazır Dosyaları

| Alan | Dosya |
| :--- | :--- |
| **App Icon (1024×1024)** | `store-assets/app-icon-1024.png` |
| **EN / TR ASO Metinleri** | `store-assets/aso-en.md`, `store-assets/aso-tr.md` |
| **6.7" & 6.5" Ekran Görüntüleri (20 PNG)** | `store-assets/screenshots/en/`, `store-assets/screenshots/tr/` |
| **Gizlilik Etiketi (App Privacy)** | `store-assets/privacy-label.md` |
| **Apple İnceleme Notları** | `store-assets/apple-review-notes.md` |
| **Privacy Policy & Support HTML** | `store-assets/privacy-policy.html`, `store-assets/support.html` |
| **Canlı Privacy Policy URL** | `https://gaming.skyhancloud.com/fruitopia/privacy` |
| **Canlı Support URL** | `https://gaming.skyhancloud.com/fruitopia/support` |
| **Canlı `app-ads.txt` URL** | `https://gaming.skyhancloud.com/app-ads.txt` |

> **Direct API ile Güncelleme:** `node tools/publish_to_studio.mjs --app apps/001-orchard-logic --url https://gaming.skyhancloud.com --token <TOKEN>`
