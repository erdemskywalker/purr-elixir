# DESIGN BLUEPRINT — 002: Purr Elixir ("Sunlit Lavender & Porcelain Apothecary")

**Rol:** Ajan 1 — UI & Apple HIG Tasarım Sistemi Mimarı (`ui-architect`)  
**Stil Dosyası:** [`src/theme.css`](./src/theme.css)  
**Hedef Cihazlar:** iPhone SE (`375×667`, `safeTop: 20`, `safeBottom: 0`) & iPhone 16 Pro Max (`430×932`, `safeTop: 59`, `safeBottom: 34`)  
**Varsayılan Görünüm:** Light Mode Default (**Sunlit Lavender & Porcelain**), Dark Mode tam destekli (**Twilight Crystal**)  
**Diller:** English (`en`) + Türkçe (`tr`)

---

## 1. Apple Guideline 4.3 Özgünlük & Kardeş Uygulama Ayrışması

Önceki kardeş uygulamaların `src/theme.css` dosyaları (`001-orchard-logic` ve `_smoke-test`) ile sistem varsayılanı (`core-engine/css/hig-tokens.css`) denetlenmiştir:

| Özellik | `_smoke-test` | `001-orchard-logic` (Fruitopia) | **`002-purr-elixir` (Purr Elixir)** |
| :--- | :--- | :--- | :--- |
| **Ana Vurgu (`--accent`)** | Soğuk Teal (`#0D9488` / `#2DD4BF`) | Kiraz Mercan (`#D9383E` / `#FF646B`) | **Kraliyet Lavanta Moru (`#7C3AED` Light / `#A78BFA` Dark)** |
| **Light Zemin & Kart** | Soğuk iOS Grisi (`#F2F2F7`) | Sıcak Fildişi-Krem (`#FBF3E4`) + Ceviz Çerçeve | **Güneşli Lavanta-Gökyüzü Gradyanı (`#F3EEFF` → `#ECF6FF`) + Porselen 3D Kartlar (`#FFFFFF`, `#DDD4F4` dudak)** |
| **Dark Zemin & Kart** | Saf Siyah (`#000000`) / `#1C1C1E` | Derin Espresso (`#141210`) / `#221D19` | **Alacakaranlık Kristali (`#151126`) / `#211B3A`** |
| **İmza Görsel Öğe** | Liste / İstatistik Kartı | 10×10 Suluboya Meyve Izgarası | **Parlayan Cam İksir Şişeleri (Menisküs + Baloncuk + Dökme Yayı + Kedi Kulaklı Tıpa) + Canlı Konuşan Kedi Barı** |
| **CSS Ön Eki** | `.smoke-*` | `.ol-*` | **`.pe-*`** |

### Matematiksel WCAG AA Kontrast Doğrulaması (Tümü `>= 4.5:1`)
- **Light Mode (Varsayılan — Sunlit Porcelain):**
  - `--label-primary` (`#1E1633`) → `#F3EEFF` üzerinde **15.18:1**, `#FFFFFF` üzerinde **17.24:1**
  - `--label-secondary` (`#5B5175`) → `#F3EEFF` üzerinde **6.42:1**, `#FFFFFF` üzerinde **7.30:1**
  - `--label-tertiary` (`#63587F`) → `#F3EEFF` üzerinde **5.72:1**, `#FFFFFF` üzerinde **6.50:1**
  - `--accent-contrast` (`#FFFFFF`) → `--accent` (`#7C3AED`) üzerinde **5.70:1**
  - `--accent-ink` (`#6D28D9`) → `#F3EEFF` üzerinde **6.25:1**, `--accent-soft` / `#FFFFFF` üzerinde **5.93:1**, `--accent-soft` / `#F3EEFF` üzerinde **5.27:1**
  - `--accent-mint-btn` (`#0F766E`) → `#FFFFFF` ile **5.47:1**; `--accent-mint-ink` (`#0F766E`) `#F3EEFF` üzerinde **4.82:1**, `--accent-mint-soft` üzerinde **4.74:1** *(Saf `#0D9488` yalnızca dekoratif/ikon dolgusu olarak `--accent-mint` değişkeninde kullanılır; metin ve buton zeminlerinde kesinlikle `#0F766E` kullanılır.)*
  - `--color-gold` (`#9A4406`) → `#FFFFFF` üzerinde **6.56:1**, `#F3EEFF` üzerinde **5.77:1**, `--color-gold-soft` üzerinde **5.78:1**
  - `--color-success` (`#15803D`) → **5.02:1**, `--color-danger` (`#C81E45`) → **5.63:1**
  - Kampanya Hero (`#6D28D9`–`#5B21B6`) beyaz metinle **7.10:1 – 8.98:1**; Daily Brew Kartı (`#0F766E`–`#0E6B63`) beyaz metinle **5.47:1 – 6.36:1**
- **Dark Mode (Twilight Crystal):**
  - `--label-primary` (`#F6F3FF`) → `#151126` üzerinde **16.83:1**, `#211B3A` üzerinde **14.96:1**
  - `--label-secondary` (`#C6BFE0`) → `#151126` üzerinde **10.46:1**, `#211B3A` üzerinde **9.30:1**
  - `--label-tertiary` (`#A69CC8`) → `#211B3A` üzerinde **6.40:1**
  - `--accent-contrast` (`#151126`) → `--accent` (`#A78BFA`) üzerinde **6.77:1**
  - `--accent-ink` (`#C4B5FD`) → `#211B3A` üzerinde **8.87:1**, `--accent-soft` üzerinde **6.54:1**
  - `--accent-mint-contrast` (`#0B2624`) → `--accent-mint-btn` (`#2DD4BF`) üzerinde **8.57:1**; `--accent-mint-ink` (`#5EEAD4`) → `#211B3A` üzerinde **11.07:1**
  - `--color-gold` (`#FBBF24`) → **9.81:1**, `--color-success` (`#4ADE80`) → **9.40:1**, `--color-danger` (`#FB7185`) → **6.08:1**
- **Renk Körlüğü Sembolleri (`.pe-layer-symbol`):** Her 10 iksir renginin (`0..9`) üzerinde koyu yarı saydam kapsül (`rgba(18, 12, 34, 0.42)`) + saf beyaz (`#FFFFFF`) glif ve metin gölgesi kullanılarak Güneş Mangosu (`#F59E0B`) dahil tüm katmanlarda yüksek kontrast garanti edilir.

---

## 2. Navigasyon Arketipi

**3 Sekmeli iOS Alt Tab Bar + Tam Odaklı Push Oyun Ekranı (`hideTabBar: true`) + Modal Sheet'ler**

```
#af-app
├── .af-viewport
│   ├── [Tab 1] home   (Dükkan / Play)        — Buzlu Safe-Area Şeridi, Tab Bar GÖRÜNÜR
│   ├── [Tab 2] levels (Bölümler / Levels)    — Large Title, Tab Bar GÖRÜNÜR
│   ├── [Tab 3] stats  (Kediler / Cats)       — Large Title, Tab Bar GÖRÜNÜR
│   └── [Push]  play   (İksir Tezgahı Sahnesi)— Inline 2-Satırlı Başlık, hideTabBar: true, ZERO SCROLL
│       ├── Modal Sheet: Victory & Customer Cat Delivery (REKLAMSIZ — 0 AdSlot!)
│       ├── Modal Sheet: Rewarded Opt-In (+1 Boş Şişe veya +1 Akıllı BFS İpucu)
│       ├── Modal Sheet: Rules & 10-Elixir Apothecary Guide
│       ├── Modal Sheet: Cat Companion Detail / Active Switcher
│       └── Alert Dialog: Restart Level / Reset All Progress
└── .af-tabbar (3 sekme: Dükkan | Bölümler | Kediler — play ekranında gizlenir)
```

**Üst Güvenli Alan (iPhone Safe-Area) Sözleşmesi:**
- `capacitor.config.json`: `contentInset: "never"`, `scrollEnabled: false`, `backgroundColor: "#F3EEFF"`, `StatusBar: { overlaysWebView: true, style: "LIGHT" }`.
- `home`: `.af-navbar` `min-height: var(--safe-top)` buzlu cam şerit olarak üstte kalır (`.af-navbar-inner { display: none }`), böylece kullanıcı aşağı kaydırdığında Dynamic Island / Çentik / Saat ile sıfır çakışma olur.
- `levels`, `stats`, `play`: `.af-navbar` `padding-top: var(--safe-top)` ile güvenli alan bırakır.

---

## 3. Ekran Bazlı Bileşen Hiyerarşisi & Durumlar

### Ekran 1: `home` (Dükkan / Play Tab)
- **Navbar:** Buzlu safe-area üst şeridi (`var(--safe-top)`).
- **Bileşen Hiyerarşisi (`.af-scroll-body`, 8pt ritmi):**
  1. **Marka Başlığı (`.pe-brand-header`):** Sol tarafta 3D Purr Elixir amblemi (`.pe-brand-emblem`, `52×52px`) + `Purr Elixir` başlığı ve kısa alt başlık; sağda Müzik aç/kapa (`.pe-icon-pill.is-on`) ve Kurallar (`?`, `.pe-icon-pill`) — her ikisi kesin `44×44px`.
  2. **Canlı Aktif Kedi Karşılama Şeridi (`.pe-home-cat-card`):** Sol tarafta animasyonlu aktif kedi portresi (`.pe-home-cat-avatar`, `48×48px`), sağda aktif kedi adı + selamlama balonu. Dokununca tatlı miyav/mırlama sesi ve yeni replik verir.
  3. **Kompakt 4'lü Canlı HUD Şeridi (`.pe-hud-strip`):** `★ Yıldız` · `✓ Bölüm` · `🐾 Kedi` · `🔥 Seri` (her biri `minmax(0, 1fr)`, `tabular-nums`).
  4. **3D Ana Kampanya Kartı (`.pe-campaign-hero`):**
     - Üst: Kicker (`KAMPANYA`) + zorluk/bölüm rozeti (`.pe-hero-pill`, örn. `6 Renk`).
     - Orta: Sol tarafta sıradaki bölümün gerçek iksir renklerinden oluşan **Canlı Mini İksir Rafı (`.pe-mini-rack`, 3–4 `.pe-mini-vial`)**; sağda bölüm başlığı (`Bölüm 12 · Simyacı`), tamamlanma oranı (`11 / 60`) ve `.pe-progress-track`.
     - Alt: 3D beyaz porselen buton (`.pe-btn-3d.pe-btn-3d--hero.pe-btn-3d--block`, `min-height: 48px`): `"Devam Et"` veya `"Bölüm 1'e Başla"`.
  5. **Günlük Özel Sipariş Kartı (`.pe-daily-card`):** Mint-teal 3D kart; sol tarafta tarih + seri rozeti (`🔥 3 Gün`), sağda `"Hazırla"` / `"Tamam ✓"` 3D butonu (`.pe-btn-3d--daily-cta`, `min-height: 44px`).
  6. **Ziyaretçi Kediler Şeridi (`.pe-cats-strip-card`):** 6 kedilik kompakt ray (`.pe-cats-rail`, 6 sütun, her biri `>= 44×62px`). Açık kediler canlı renkte, aktif kedi mor halkalı (`.is-active-cat`), kilitli kediler grileştirilmiş + `Lv 3 / Lv 8 / Lv 15 / Lv 25 / Lv 40` etiketiyle; tıklayınca aktif kedi değiştirilir veya kedi detay sheet'i açılır.
  7. **Inline Reklam Yuvası:** `data-ad-slot="home-inline"` (`data-ad-type="inline"`, `min-height: 92px`, üst karttan `16px` uzakta).
- **Durumlar:**
  - *Yükleme:* `.pe-skeleton` sabit yükseklikli kartlar (`CLS = 0`).
  - *Boş / İlk Açılış:* Mochi varsayılan açık asistan olarak karşılar, HUD `0 / 60`, `1 / 6 Kedi`, `0 Gün`; Kampanya kartı `Bölüm 1 · Başlangıç` ile açılır.
  - *Tüm 60 Bölüm Tamamlandı:* Kampanya kartı `"Büyük Usta Tamamlandı ★"` durumuna geçer ve `"Sonsuz Simya Oyna"` veya `"Tekrar Oyna"` sunar.
  - *Hata:* SQLite başlatılamazsa `.af-empty-state` + `"Yeniden Dene"` (`44px`) butonu.

### Ekran 2: `levels` (Bölümler & Sonsuz Mod / Levels Tab)
- **Navbar:** Large Title (`Bölümler` / `Levels`), kaydırınca inline başlığa geçer.
- **Bileşen Hiyerarşisi:**
  1. **Sonsuz Simya Portal Kartı (`.pe-endless-portal`):** Mor-kehribar kart; üstte rekor rozeti (`Rekor: 14 Bölüm`), altta 3 hızlı başlatma 3D butonu (`.pe-endless-modes` → `.pe-endless-btn`, `min-height: 46px`):
     - `Kolay` (`5 Renk`) · `Orta` (`7 Renk`) · `Usta` (`9 Renk`)
  2. **Zorluk Filtre Şeridi (`.pe-filter-scroll`):** Yatay kaydırılabilir, sıfır kırpılmalı hap filtreler (`.pe-filter-pill`, `min-height: 44px`):
     - TR: `Tümü` | `Kolay` | `Orta` | `Usta` | `Büyük Usta`
     - EN: `All` | `Easy` | `Medium` | `Master` | `Grandmaster`
  3. **Özet Şeridi (`.pe-campaign-summary`):** Seçili filtredeki ilerleme (`12 / 60 Çözüldü` · `★ 34 / 180`).
  4. **60 Bölüm Madalyon Izgarası (`.pe-levels-grid`, 3 sütun):**
     - Her hücre `<button class="pe-level-tile">` (`min-height: 104px`, `375px` ekranda `107px` genişlik):
       - Bölüm numarası (`.pe-level-num`), renk sayısı (`6 Renk`), 1–3 yıldız (`.pe-stars`), en iyi hamle (`14 Hamle` veya `Par 16`).
       - Kedi açma kilometre taşı bölümlerinde (`3, 8, 15, 25, 40`) üst sağda altın `.pe-level-cat-tag` (`🐾 Tarçın` vb.).
       - Sıradaki aktif bölüm `.is-current` mor çerçevesiyle vurgulanır.
  5. **Inline Reklam Yuvası:** Madalyon ızgarasının altında `16px` boşlukla `data-ad-slot="levels-inline"` (`data-ad-type="inline"`).
- **Durumlar:**
  - *Yükleme:* 9 adet `104px` `.pe-skeleton` madalyon.
  - *Boş Filtre:* `.af-empty-state` + `"Tümünü Göster"` butonu.
  - *Hata:* `.af-empty-state` + `"Yeniden Yükle"` butonu.

### Ekran 3: `stats` (Kediler & İstatistik / Cats & Stats Tab)
- **Navbar:** Large Title (`Kediler` / `Cats`).
- **Bileşen Hiyerarşisi:**
  1. **Bölüm Başlığı (`ZİYARETÇİ KEDİLER`) + 6 Kedi Koleksiyon Izgarası (`.pe-cats-grid`, 2 sütun):**
     - Her `.pe-cat-card`: `60×60px` animasyonlu kedi SVG portresi, ad + unvan, favori iksir renk rozeti (`.pe-cat-fav`) ve `44px` durum/seçim butonu (`Aktif ✓` / `Asistan Seç` / `Bölüm N'de Açılır`).
  2. **Bölüm Başlığı (`ATÖLYE İSTATİSTİKLERİ`) + 4'lü Bento Özeti (`.pe-bento-grid`, 2×2):**
     - Çözülen Bölüm (`X / 60`)
     - Günlük Seri (`N Gün`)
     - Mühürlenen Şişe (`N Şişe`)
     - Sonsuz Mod Rekoru (`N` veya `—`)
  3. **Bölüm Başlığı (`OYUN VE ERİŞİLEBİLİRLİK`) + `.af-list-group`:**
     - `Atölye Müziği` (`.af-switch`)
     - `Dökme & Miyav Sesleri` (`.af-switch`)
     - `Dokunsal Titreşim` (`.af-switch`)
     - `Kedi Konuşma Balonları` (`.af-switch`)
     - `Renk Körlüğü Sembolleri` (`.af-switch` — açıkken `[data-colorblind="true"]` ile tüm şişe katmanlarında net semboller açılır)
  4. **Bölüm Başlığı (`GÖRÜNÜM VE DİL`) + `.af-list-group`:**
     - `.pe-setting-stack`: `Görünüm` etiketi üstte, tam genişlik `.af-segmented` altta (`Açık` [Varsayılan] / `Koyu` / `Sistem`).
     - `.pe-setting-stack`: `Dil` etiketi üstte, tam genişlik `.af-segmented` altta (`English` / `Türkçe`).
  5. **Yerel Gizlilik Bildirimi (`.pe-privacy-note`) + Onaylı İlerleme Sıfırlama (`.af-btn.af-btn-destructive.af-btn-block`):** Tüm verinin cihaz içi SQLite'ta saklandığını belirtir; sıfırlama butonu native `.af-alert` onayı açar.
  6. **Banner Reklam Yuvası:** Sıfırlama butonundan en az `16px` aşağıda `data-ad-slot="stats-banner"` (`data-ad-type="banner"`).
- **Durumlar:**
  - *Boş (Yeni Oyuncu):* `0 / 60`, `0 Gün`, `0 Şişe`, `—` (asla `NaN` veya `undefined` render edilmez).
  - *Hata:* Yazma hatasında `.af-toast` bildirimi ve güvenli geri dönüş.

### Ekran 4: `play` (Tam Odak İksir Tezgahı — Push, `hideTabBar: true`)
- **Navbar (`.af-navbar.is-inline-title`, `grid-template-columns: auto minmax(0, 1fr) auto`):**
  - Sol: `< Geri` (`.af-nav-btn`, `>= 44×44px`).
  - Orta: 2 satırlı başlık (`.pe-play-title-main`: `Bölüm 12 · 6 Renk`, `.pe-play-title-sub`: `Hamle 4 · Par 14`).
  - Sağ: Müzik ikonu (`44×44px`) + Kurallar `?` (`44×44px`).
- **Dikey Bütçe (iPhone SE `375×667`, `safeTop = 20px`, `safeBottom = 0px` — SIFIR Kaydırma / SIFIR Taşma):**

| Katman | Sınıf | Yükseklik (SE) | Yükseklik (Pro Max) | Notlar |
| :--- | :--- | :---: | :---: | :--- |
| Safe Top + Navbar | `.af-navbar` | `68px` (`20+48`) | `107px` (`59+48`) | 2 satırlı inline başlık + `< Geri` + Müzik/`?` |
| Üst Boşluk | `.af-scroll-body` top | `6px` | `6px` | Temiz nefes alanı |
| Konuşan Kedi Barı | `.pe-cat-stage` | **`56px`** (sabit) | **`56px`** (sabit) | `48px` canlı kedi SVG + porselen balon + kombo rozeti (`CLS = 0`) |
| Bar Altı Boşluk | `.pe-cat-stage` margin | `8px` | `8px` | Seçili şişe yükselme payı |
| Kristal İksir Rafı | `.pe-shelf-stage` | **`373px`** (`flex: 1`) | **`557px`** (`flex: 1`) | 1 satır (`4–5`) veya 2 satır (`6–14`) otomatik ölçekli raf |
| 4'lü 3D Araç Çubuğu | `.pe-toolbar` | `60px` (`54+6`) | `60px` (`54+6`) | `Geri Al` · `+1 Şişe` · `İpucu` · `Yeniden` (kazanınca `.pe-post-win-bar`) |
| Güvenli Reklam Boşluğu | `.pe-play-ad-zone` top | **`16px`** | **`16px`** | Yanlış tıklama koruması (kesin minimum `16px`!) |
| Alt Sabit Banner | `data-ad-slot="play-banner"` | `78px` | `78px` | `CLS = 0` sabit yükseklik |
| Alt Güvenli Boşluk | `.af-scroll-body` bottom | `6px` | `40px` (`6+34`) | Pro Max Home Indicator koruması |
| **TOPLAM** | | **`667px`** | **`932px`** | **%100 Ekrana Tam Oturan Sıfır Kaydırmalı Sahne!** |

- **1–14 Şişe Otomatik Raf Ölçekleme Sözleşmesi (`app-ui-dev` için kesin DOM kuralları):**
  - `.pe-shelf-stage` üzerine dinamik veri öznitelikleri eklenir:
    - `4–5` şişe → `data-rows="1"` (`56×184px` SE, `60×196px` Pro Max)
    - `6–10` şişe → `data-rows="2"` (iki dengeli `.pe-shelf-row`, en fazla 5/satır; `52×138px` SE, `58×162px` Pro Max)
    - `11–12` şişe (Büyük Usta 10 renk + 2 boş) → `data-rows="2" data-max-cols="6"` (`48×132px` SE, `52×152px` Pro Max — SE'de `6×48 + 5×7 = 323px <= 351px`, dikey `2×132 + 20 + 36 = 320px <= 373px`!)
    - `13–14` şişe (Büyük Usta + 2 Ödüllü Ekstra Şişe) → `data-rows="2" data-max-cols="7"` (`45×128px` SE, `46×144px` Pro Max — SE'de `7×45 + 6×4 = 339px <= 351px`, her şişe hala `>= 44×44pt` dokunma hedefinde!)
  - Her şişe `<button type="button" class="pe-bottle" data-bottle-index="<i">" aria-label="...">` yapısında üretilir:
    - İç hiyerarşi: `.pe-cork` (kedi kulaklı SVG tıpa) → `.pe-bottle-rim` → `.pe-bottle-neck` → `.pe-bottle-body` → `.pe-bottle-liquid` → 0..4 adet `.pe-layer[data-elixir="0..9"]` (en üstteki `.is-top-layer`, içinde `<span class="pe-layer-symbol">` sembolü).
  - Dökme sırasında kaynak şişeye `.is-pouring` + `--pour-tx/--pour-ty/--pour-rot`, hedef şişeye `.is-receiving`, `.pe-shelf-stage` içine `.pe-pour-stream` SVG sıvı akış yayı eklenir.
  - Bölüm kazanıldığında `.pe-toolbar` anında `.is-hidden` ile gizlenir/kilitlenir; yerine `.pe-post-win-bar` (`Tekrar` · `Paylaş` · `Sonraki Bölüm`) gelir ve **reklamsız Zafer & Müşteri Kedi Teslimatı Sheet'i** açılır!
- **Modal Sheet'ler (`play` ekranından açılan — açıldığında `router.openSheet()` otomatik `adManager.hideNativeBanner()` çağırır):**
  - **Zafer & Müşteri Kedi Teslimatı Sheet'i (`.pe-victory-sheet`):** **0 reklam (kesinlikle reklamsız!)** — 1–3 zıplayan altın yıldız, `.pe-delivery-card` (ziyaretçi kedi SVG + teslim teşekkür repliği), yeni kedi açıldıysa `.pe-cat-unlock-banner`, 3'lü Hamle/Par/Kombo özeti, `"Sonraki Bölüm"` (`.pe-btn-3d--violet`) + `"Tekrar"` & `"Paylaş"` butonları.
  - **Ödüllü Geçiş Onay Sheet'i (`.pe-reward-sheet`):** `+1 Boş Şişe` veya 2 ücretsiz BFS ipucu bittiğinde `+1 Akıllı İpucu` için şeffaf onay (`"Reklam İzle · +1 Boş Şişe"` / `"Vazgeç"`).
  - **Kurallar & 10 İksir Rehberi Sheet'i:** 3 adımlı görsel sıralama kuralı + 10 iksirin renk ve renk körlüğü sembol kataloğu (`.pe-elixir-legend`).

---

## 4. Kesin `AdSlot` Haritası & 16px Güvenli Mesafe Sözleşmesi

Tüm reklam yuvaları `core-engine/js/ad-manager.js` üzerinden Dual-Mode (`dev` kesikli şablon + `prod-nofill` Apple-safe House Ad, `CLS = 0`) çalışır:

| Ekran / Yüzey | `data-ad-slot` | `data-ad-type` | Sabit Min Yükseklik | Konum & Güvenli Boşluk Kuralı |
| :--- | :--- | :---: | :---: | :--- |
| `home` (Dükkan) | `home-inline` | `inline` | `92px` | Ziyaretçi Kediler şeridinin altında; üst karttan `margin-top: 16px`, Tab Bar'dan `>= 24px` uzakta. |
| `levels` (Bölümler) | `levels-inline` | `inline` | `92px` | 60'lı bölüm madalyon ızgarasının altında; son satırdan `margin-top: 16px` uzakta. |
| `stats` (Kediler) | `stats-banner` | `banner` | `78px` | "İlerlemeyi Sıfırla" butonunun altında; butondan en az `margin-top: 16px` uzakta. |
| `play` (İksir Tezgahı) | `play-banner` | `banner` | `78px` | `.pe-play-ad-zone` içinde, 4'lü araç çubuğundan **`padding-top: 16px`** kesin güvenli boşlukla ayrılmış; altta `6px + var(--safe-bottom)`. |
| `play` → Zafer Sheet | *(YOK — 0 Reklam)* | — | — | `SPEC.md` gereği Zafer kutlama ekranında **0 reklam** bulunur; bölüm geçiş reklamı (`Interstitial`) yalnızca "Sonraki Bölüm" aksiyonunda kademeli tempoyla (`Bölüm 1–5`: 3'te 1; `Bölüm 6+`: her geçişte min 45 sn korumayla) gösterilir. |

**Kırmızı Çizgiler:**
- Hiçbir `AdSlot` bir CTA butonuna veya oyun aracına `16px`'den yakın konumlandırılmaz.
- Hiçbir `AdSlot` Tab Bar, Dynamic Island, Saat veya Home Indicator altına girmez.
- Modal Sheet açıldığında `adManager.hideNativeBanner()`, kapandığında `adManager.resumeNativeBanner()` otomatik çalışır.
- Prod no-fill / çevrimdışı modda asla boş gri kutu gösterilmez; her yuva yerelleştirilmiş House Ad kartı render eder (`.af-ad-house-cta` kesin `min-height: 44px`).

---

## 5. Dokunma Hedefleri (44×44pt) & iPhone SE (375×667) Türkçe Sığma Kuralları

1. **Kesin 44×44pt Minimum Dokunma Hedefleri:**
   - Tüm `.af-btn`, `.pe-btn-3d` (`min-height: 46px`), `.af-nav-btn` (`44×44px`), `.pe-icon-pill` (`44×44px`), `.af-tab-item` (`54px`), `.pe-cat-avatar-btn` (`48×48px`), `.pe-cat-chip` (`>= 44×62px`), `.pe-filter-pill` (`44px`), `.pe-endless-btn` (`46px`), `.pe-level-tile` (`104px`), `.pe-cat-action-btn` (`44px`), `.pe-tool-btn` (`54px`), `.af-segmented-btn` (`44px`), `.af-switch` (`51×44px`), `.af-ad-house-cta` (`min-height: 44px`) ve **en kalabalık 14 şişeli Büyük Usta rafındaki `.pe-bottle` (`45×128px`)** Apple HIG `44×44pt` standardını eksiksiz sağlar.
2. **Türkçe Uzun Metin & Yatay Taşma Sıfır Tolerans Kuralları (`375px`):**
   - **Tab Bar (3 sekme):** `Dükkan` · `Bölümler` · `Kediler` (EN: `Shop` · `Levels` · `Cats` — maks 8 karakter, sıfır kırpılma).
   - **Oyun Araç Çubuğu (4 buton, SE'de her biri ~81px):** `Geri Al` · `+1 Şişe` · `İpucu` (sayı/AD köşe rozetinde `.pe-tool-badge`) · `Yeniden`.
   - **Bölüm Filtreleri (5 hap):** `.pe-filter-scroll` yatay kaydırılabilir `flex: 0 0 auto; white-space: nowrap` yapısıyla `"Büyük Usta"` dahil sıfır satır kırılması ve sıfır sıkışma.
   - **Ayarlar Segmented Kontrolleri:** `Görünüm` (`Açık` / `Koyu` / `Sistem`) ve `Dil` (`English` / `Türkçe`) `.pe-setting-stack` ile tam genişlik satırda yer alır.
   - **Oyun Navbar Başlığı:** `grid-template-columns: auto minmax(0, 1fr) auto` ve 2 satırlı kompakt düzen (`Bölüm 48 · 10 Renk` / `Hamle 12 · Par 28`) sayesinde iPhone SE `375px` genişlikte `< Geri` ve sağdaki 2 ikon arasında sıfır çakışma ve sıfır taşma ile okunur.
   - **Konuşma Balonları:** `.pe-speech-bubble` sabit `52px` yükseklik ve `-webkit-line-clamp: 2` ile Türkçe esprili kedi replikleri ne kadar dinamik olursa olsun **sıfır düzen kayması (`CLS = 0`)** sağlar.
   - **Tüm Grid Sütunları:** İstisnasız `minmax(0, 1fr)` kullanır; sayısal değerler `font-variant-numeric: tabular-nums` ile titreme olmadan güncellenir.
