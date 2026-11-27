# App Factory — İşletim Anayasası (BLUEPRINT)

## Genel Bakış
Bu monorepo, tek bir fikir girdisinden eksiksiz, gerçek SQLite veritabanlı, Apple HIG uyumlu, AdMob entegreli ve App Store Connect'e yüklenmeye hazır iOS/Android/Web uygulamalarını günlük tempoda üretmek için tasarlanmıştır.

## 2 Kontrol Noktalı Günlük Akış
1. **Kapı 1 (Onay Kapısı):**
   - Kullanıcı günlük uygulama fikrini verir.
   - Ana Orkestratör 3-5 keskin `/grill-me` sorusuyla kapsamı netleştirir.
   - 2-3 farklı Apple HIG tasarım yönü sunar (kullanıcı birini seçer veya referans verir).
   - `apps/<id>-<slug>/SPEC.md`, `DESIGN_BRIEF.md` ve özelleştirilmiş `AGENT_PROMPTS.md` üretilip onay alınır.
2. **Otonom Çoklu Ajan Üretim Hattı (`tools/build_app_workflow.py`):**
   - **Faz 1 (`ui-architect`):** Özgün `theme.css` + `DESIGN_BLUEPRINT.md` (Apple 4.3 klon korumalı).
   - **Faz 2 (Paralel — `data-sql-dev` & `app-ui-dev`):** Gerçek SQLite şeması (`database/*.sql`) + repository + opsiyonel PHP API ve `core-engine` üzerine EN/TR ekranlar + `AdSlot`.
   - **Faz 3 (`qa-bugfix`):** `verify_apple_compliance.mjs` + Playwright gerçek WASM SQLite fonksiyonel & responsive testi + otomatik hata çözümü.
   - **Faz 4 (`design-critic` + `ui-polisher`, Max 3 Tur):** `visual_qa_runner.mjs` ile iPhone 16 Pro Max (Light/Dark/Dev-Ad) & iPhone SE (TR) PNG ekran görüntüleri alınır; kalıcı Critic ajanı görüntüleri görsel olarak 100 puanlık rubrikle değerlendirir (`>=85` ve `0 blocker` şartı).
   - **Faz 4.5 (`playtest-fun-critic` + `experience-polisher`, Max 2 Tur):** Bağımsız Playtester ajanı uygulamayı gerçek tarayıcıda oynayıp/kullanıp eğlence, zorluk eğrisi, kenar durumları, ses/juice ve tekrar oynanabilirliği 100 puanlık rubrikle denetler (`>=85` ve `0 kritik bug` şartı).
   - **Faz 5 (Paralel — `image-generator` & `store-launch`):** 3 adet 1024×1024 düz kare Apple ikon konsepti, EN+TR ASO metinleri, Privacy Policy/Support HTML, `Info.plist` yaması, 6.7"/6.5" çerçeveli mağaza screenshot'ları ve `MAC_RELEASE_CHECKLIST.md`.
3. **Kapı 2 (Final Teslim):**
   - Tüm çalışan kod, SQL dosyaları, Critic puan raporu, ikonlar ve App Store Connect paketi sunulur.

## Komut Referansı
- Yeni uygulama iskelesi oluşturma:
  `node tools/scaffold_app.mjs --id 001 --slug my-app --name "My App" --bundle com.erdem.myapp`
- Statik Apple & Mock-Veri denetimi:
  `node tools/verify_apple_compliance.mjs --app apps/001-my-app`
- Playwright QA + Çoklu Cihaz Görsel Yakalama:
  `node tools/visual_qa_runner.mjs --app apps/001-my-app --mode all`
- 6.7" & 6.5" App Store Pazarlama Ekran Görüntüsü Çerçeveleme:
  `node tools/screenshot_framer.mjs --app apps/001-my-app`
