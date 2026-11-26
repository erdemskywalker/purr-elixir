# AGENT PROMPTS — 002: Purr Elixir

Bu belge, **Kapı 1** onaylandığında `tools/build_app_workflow.py` (veya paralel uzman ajan hattı) tarafından çalıştırılacak tüm ajanların `002-purr-elixir` projesine özel sözleşmelerini özetler.

---

## 1. `ui-architect` (Sunlit Lavender Apothecary Tasarım Sistemi)
- **Hedef:** `apps/002-purr-elixir/src/theme.css` ve `DESIGN_BLUEPRINT.md`.
- **Özel Odak:**
  - `#F3EEFF` / `#ECF6FF` aydınlık lavanta-porselen Light Mode default + `#151126` Twilight Crystal Dark Mode, `--accent: #7C3AED` (Fruitopia `#D9383E`'den tamamen farklı).
  - Kristal iksir şişesi CSS katmanları (cam parlaması, 10 canlı iksir gradyanı, seçili yükselme, eğilme/dökme animasyonu, tamamlanınca inen kedi kulaklı tıpa, parıltı patlaması).
  - Kompakt konuşan kedi barı (`56px` sabit yükseklik, CLS = 0) + 1 veya 2 satırlı otomatik sığan şişe rafı (iPhone SE `375×667` ve Pro Max `430×932` üzerinde 12 şişede bile sıfır taşma).
  - Üst bar güvenli alan (`Home` buzlu safe-area şeridi + `Levels/Stats/Play` navbar `var(--safe-top)`).

## 2. `data-sql-dev` (Gerçek SQLite & BFS Doğrulamalı 120 İksir Bölümü)
- **Hedef:** `database/tables.sql`, `database/seed.sql`, `database/install.sql`, `database/generate_verified_levels.mjs`, `src/data/repository.js`.
- **Özel Odak:**
  - Eski `/home/erdemskywalker/Documents/mini/oyun2/tools/` altındaki kanıtlanmış reverse-shuffle + BFS çözücü mantığını geliştirerek **60 kampanya + 60 günlük = 120 adet %100 çözülebilir BFS doğrulamalı bölüm** üret ve idempotent `ON CONFLICT(...) DO UPDATE` ile `database/seed.sql` içine yaz.
  - `elixir_catalog` (10 iksir), `cat_companions` (6 kedi + EN/TR kişilik & açılma seviyesi), `level_progress`, `daily_completions`, `endless_runs`, `player_prefs` CRUD katmanını gerçek SQLite (`db-adapter.js`) üzerine kur. Sıfır mock veri!

## 3. `app-ui-dev` (İksir Motoru, Konuşan Kedi, Ses & 4 Ekran)
- **Hedef:** `src/elixir-engine.js` (Bottle/Pour/Deadlock/BFS Hint/Endless generator), `src/cats.js` (6 animasyonlu kedi SVG + reaksiyonlu EN/TR diyalog bankası), `src/audio.js` (prosedürel aydınlık kafe müzik kutusu + pitch yükselen sıvı dökme + tıpa pop + kombo arpej + tatlı miyav), `src/locales/en.json`, `src/locales/tr.json`, `src/screens/{home,levels,stats,play}.js`, `src/app.js`, `tests/e2e.spec.mjs`.
- **Özel Odak:**
  - Şişe seçme, akıcı dökme animasyonu + sıvı akış yayı, kombo sayacı, sınırsız Geri Al, deadlock algılama, **2 ücretsiz BFS akıllı ipucu** (hem kaynak hem hedef şişeyi vurgular + kedinin ağzından net Türkçe/İngilizce açıklama yazar!), **`+1 Boş Şişe` & `+1 İpucu` Ödüllü Geçiş (`adManager.showRewardedHintAd()`)**, kademeli bölüm geçiş reklamı (`1–5`: 3'te 1; `6+`: her geçişte, 45 sn tempo korumasıyla), zaferde alt araç çubuğu kilidi + reklamsız Zafer Sheet'i + müşteri kedi teslimatı.
  - `capacitor.config.json` (`contentInset: "never"`, `scrollEnabled: false`, `#F3EEFF` zemin) ve `scripts/patch-admob-ios.mjs` baştan hazır.

## 4. `qa-bugfix` (Fonksiyonel QA & iPhone Safe-Area Piksel Denetimi)
- **Hedef:** `verify_apple_compliance.mjs` (`17/17`), `visual_qa_runner.mjs --mode all`, 3 iPhone profilinde (`59pt / 47pt / 20pt`) üst bar ve 12 şişelik raf piksel denetimi, tüm E2E testleri (dökme, undo, BFS ipucu, `+1 Boş Şişe`, bölüm bitirme + kedi açma, EN↔TR, Light↔Dark) %100 yeşil.

## 5. `design-critic` (+ `ui-polisher`) & `playtest-fun-critic` (+ `experience-polisher`)
- **Hedef:**
  - Görsel Kritik (`CRITIC_REPORT.md`): Tüm PNG ekran görüntülerini incele, `>= 90` ve `0` Hard Blocker hedefle.
  - Bağımsız Eğlence Denetçisi (`PLAYTEST_FUN_SCORE.md`): Gerçek tarayıcıda canlı oynayıp akıcılık, dökme tatmini, konuşan kedi keyfi, zorluk eğrisi, reklam dengesi ve iPhone hazırlığını `>= 95` hedefine çıkar!

## 6. `icon-generator`, `store-launch` & Capacitor iOS Paketleme
- **Hedef:**
  - `image-generator` ile 3 adet 1024×1024 parlak 3D kedi + parlayan iksir şişesi ikon konsepti üret, en iyisini seç (8-bit RGB opak PNG) ve uygulama içine + Xcode `AppIcon` içine yerleştir.
  - 2732×2732 markalı `#F3EEFF` lavanta-porselen açılış ekranı, EN+TR ASO, 20 adet çerçeveli 6.7"/6.5" ekran görüntüsü, Privacy Policy, Support HTML, Apple Review Notes, `ios/` Capacitor Xcode projesi ve `MAC_RELEASE_CHECKLIST.md`.
