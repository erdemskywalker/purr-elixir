# AGENT PROMPTS — 001: Orchard Logic

Bu dosya, **Kapı 1** onaylandığında `tools/build_app_workflow.py` tarafından orkestre edilecek tüm uzman ajanların bu uygulamaya özel görev özetini ve sözleşmelerini belgeler.

---

## 1. `ui-architect` (UI & Apple HIG Tasarım Sistemi Mimarı)
- **Hedef:** `apps/001-orchard-logic/src/theme.css` ve `DESIGN_BLUEPRINT.md` dosyalarını üret.
- **Özel Odak:**
  - Sıcak fildişi (`#FAF7F2`) / derin espresso (`#141210`) ve kiraz-mercan (`#D9383E` / `#FF646B`) paletini eksiksiz uygula.
  - 10 meyve bölgesi için Light & Dark CSS değişkenlerini (`--reg-0` .. `--reg-9`) ve kalın bölge sınır sınıflarını (`border-top/right/bottom/left` bölge değişiminde `2px solid`) tanımla.
  - 10×10 tahtanın iPhone SE (`375×667`) ekranında bile üst navbar + durum şeridi + tahta + 4'lü araç çubuğu + alt Banner `AdSlot` ile tek ekrana rahatça sığmasını garantile.

## 2. `data-sql-dev` (Gerçek SQLite & Matematiksel Bulmaca Doğrulayıcı)
- **Hedef:** `database/tables.sql`, `database/seed.sql`, `database/install.sql`, `database/generate_verified_levels.mjs` ve `src/data/repository.js` dosyalarını üret.
- **Özel Odak:**
  - 30 kampanya seviyesi (`2× 4×4`, `2× 5×5`, `2× 6×6`, `4× 8×8`, **`20× 10×10`**) + `14× 10×10` günlük bulmaca havuzunu backtracking çözücü ile **`solutionCount === 1` (benzersiz çözüm)** doğrulayarak gerçek `INSERT` ifadeleriyle `database/seed.sql` içine yaz.
  - `src/data/repository.js` üzerinden tüm seviye, ilerleme, tahta durumu kaydetme, yıldız/en iyi süre, günlük seri (streak) ve tercih CRUD sorgularını gerçek SQLite (`db-adapter.js`) ile sağla. Sıfır mock veri!

## 3. `app-ui-dev` (iOS-First Frontend, 10 SVG Meyve & Oyun Motoru)
- **Hedef:** `src/locales/en.json`, `src/locales/tr.json`, `src/fruits.js` (10 özel crisp inline SVG meyve), `src/screens/home.js`, `levels.js`, `stats.js`, `play.js`, `src/app.js`, `tests/e2e.spec.mjs` ve `core-engine/js/router.js` (`hideTabBar: true` desteği).
- **Özel Odak:**
  - 3 durumlu dokunuş (`boş → × → meyve → boş`) + sürükleyerek hızlı `×` işaretleme + Auto-`×` + sınırsız Undo + kural ihlali açıklamalı vurgusu + 2 ücretsiz akıllı ipucu + ödüllü ek ipucu kancası + zafer kutlama sheet'i.
  - `home` (`inline`), `levels` (`inline`), `stats` (`banner`), `play` (`banner`, araç çubuğundan 16px güvenli boşluklu) ekranlarına `AdSlot` yerleştir.
  - Gerçek WASM SQLite üzerinde seviye oynama, kural ihlali tespiti, 4×4 seviye çözüp zafer kaydı, 10×10 seviye açma, dil (EN↔TR) ve tema (Light↔Dark) testlerini içeren `tests/e2e.spec.mjs` yaz.

## 4. `qa-bugfix` (Fonksiyonel QA & Hata Avcısı)
- **Hedef:** `verify_apple_compliance.mjs` ve `visual_qa_runner.mjs --app apps/001-orchard-logic --mode all` (ek olarak `play` ekranında hem 4×4 öğretici hem **10×10 seviye 11** ekran görüntüsü yakalamalı!) %100 yeşil olana kadar tüm konsol, SQLite, 44pt dokunma hedefi, i18n ve taşma hatalarını çöz.

## 5. `design-critic` (+ `ui-polisher`, Max 3 Tur)
- **Hedef:** Yakalanan tüm PNG ekran görüntülerini (`home`, `levels`, `stats`, `play` 10×10 — `Pro Max Light`, `Pro Max Dark`, `Pro Max Dev-Ad`, `iPhone SE TR`) `read_file` ile görsel olarak incele, 100 puanlık rubrikle puanla (`CRITIC_REPORT.md`); `<85` veya tek bir Hard Blocker varsa `ui-polisher` ile max 3 tur otomatik düzelt.

## 6. `icon-generator` & `store-launch` (Paralel App Store Yayın Paketi)
- **Hedef:**
  - `image-generator` ile 3 farklı 1024×1024 düz kare Apple ikon konsepti (sıcak fildişi/botanik veya zengin mercan arka plan üzerinde ikonik meyve + ızgara sembolü) üretip en iyisini `AppIcon-1024.png` seç.
  - `store-assets/` altında `aso-en.md`, `aso-tr.md`, `apple-review-notes.md`, `privacy-label.md`, `privacy-policy.html`, `support.html`, `ios-info-plist-patch.xml`, `screenshots-config.json` + 6.7" & 6.5" EN/TR çerçeveli mağaza ekran görüntüleri ve offline `www/` + `MAC_RELEASE_CHECKLIST.md` üret.
