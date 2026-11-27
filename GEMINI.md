# App Factory Workspace Rules (GEMINI.md)

Bu monorepo, Erdem'in **Günde 1 Mobil Uygulama Fabrikası** altyapısıdır. Bu repo içinde çalışan tüm ajanlar aşağıdaki kurallara istisnasız uymak zorundadır:

## 1. Sahte / Mock Veri Kesinlikle Yasaktır
- Frontend JS/HTML dosyalarına asla sahte/hardcoded örnek liste veya dummy veri dizisi gömülmez.
- Tüm uygulama verileri `apps/<app>/database/` altındaki gerçek SQL dosyalarından (`install.sql`, `tables.sql`, `seed.sql`, `migrations/`) beslenir ve `core-engine/js/db-adapter.js` (mobilde `@capacitor-community/sqlite`, web/Playwright önizlemede WASM `sql.js`) üzerinden sorgulanır.
- Bulut/sunucu gerektiren uygulamalarda `apps/<app>/backend/` altında modüler PHP POST API (Main Client + Middleware + Modules + Database Layer) kullanılır.

## 2. Teknoloji & Mimari Disiplini
- **Saf Vanilla HTML/CSS/JS + Capacitor** kullanılır. Gereksiz ağır frontend framework'leri (React, Angular, Vue vb.) eklenmez.
- Tüm uygulamalar ortak `core-engine/` çekirdeğini kullanır ancak her uygulamanın `src/theme.css`, navigasyon arketipi ve görsel kimliği önceki son 3 uygulamadan belirgin biçimde ayrıştırılır (**Apple Guideline 4.3 — Spam/Klon Koruması**).
- Tüm asset'ler tamamen **offline bundle** olarak paketlenir; uzak web sitesi yükleyen wrapper yapı kesinlikle yasaktır (**Apple Guideline 4.2**).

## 3. Apple HIG & AdMob Zorunlu Standartları
- Minimum dokunma hedefi: **44×44px**.
- Safe Area (`env(safe-area-inset-top/bottom)`), Light Mode + Dark Mode ve EN + TR çift dil (`src/locales/en.json`, `tr.json`) her uygulamada eksiksiz desteklenir.
- Tüm reklam alanları `core-engine` `AdSlot` bileşeniyle yerleştirilir:
  - `dev` modunda: kesikli çerçeveli, boyut ve tür etiketli açık reklam yuvası.
  - `prod` no-fill / offline durumunda: boş gri kutu yerine sabit yükseklikte, CLS=0 garantili, `"Sponsored / Önerilen"` etiketli **House Ad** (`house-ads/catalog.json`).
- Geçiş (Interstitial) reklamları asla uygulama açılışında veya geri dönüşte gösterilmez (min 180s frequency cap).

## 4. Kalite Kapısı & Git Disiplini
- Her uygulama `tools/verify_apple_compliance.mjs`, Playwright E2E/QA testi ve **100 puanlık Görsel Tasarım Değerlendirici (`>= 85/100` ve `0 Hard Blocker`)** kapısından geçmeden teslim edilmez.
- Anlamlı commit mesajları (`feat:`, `fix:`, `db:`, `engine:`, `store:`) kullanılır; SQL şema değişiklikleri kodla aynı commit'te takip edilir.
