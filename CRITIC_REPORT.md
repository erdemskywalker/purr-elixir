# Görsel Tasarım & Apple App Review Kritik Raporu — 002: Purr Elixir

**Uygulama:** `002-purr-elixir` (*Purr Elixir — Sunlit Lavender & Porcelain Apothecary*)  
**Rubrik:** `/home/erdemskywalker/app-factory/.agents/skills/app-factory/rubric.json`  
**Geçme Eşiği:** **>= 90 / 100** VE **0 Hard Blocker**

---

## Tur 1 / 3 Değerlendirmesi

**Durum:** ❌ **KALDI (`pass: false`)** — **Toplam Puan: 82 / 100** | **Hard Blocker: 1**  
**İncelenen Ekran Görüntüleri (16 / 16 PNG):**
- `home`: `home__promax-light-prod.png`, `home__promax-dark-prod.png`, `home__promax-light-devad.png`, `home__se-light-tr.png`
- `levels`: `levels__promax-light-prod.png`, `levels__promax-dark-prod.png`, `levels__promax-light-devad.png`, `levels__se-light-tr.png`
- `play`: `play__promax-light-prod.png`, `play__promax-dark-prod.png`, `play__promax-light-devad.png`, `play__se-light-tr.png`
- `stats`: `stats__promax-light-prod.png`, `stats__promax-dark-prod.png`, `stats__promax-light-devad.png`, `stats__se-light-tr.png`

### Rubrik Puan Tablosu (Tur 1)

| Kategori | Puan | Maks | Durum | Özet Gerekçe |
| :--- | :---: | :---: | :---: | :--- |
| **1. Apple HIG & Native iOS Hissi (`apple_hig`)** | **20** | 25 | ⚠️ İyileştirme Gerekli | Dynamic Island/Home Indicator güvenli alanları ve >=44pt dokunma hedefleri temiz; ancak `play` başlığı Dynamic Island'a göre sola kayık, Dark Mode'da hero/daily/endless CTA butonları göz yoran saf `#FFFFFF`, `levels` filtre şeridi full-bleed değil ve `stats` sekmesinde Pro Max'te aşağı kaydırma ipucu yok. |
| **2. Görsel Estetik, Özgünlük & Hiyerarşi (`visual_polish`)** | **20** | 25 | ❌ Hard Blocker | Apple 4.3 ayrışması güçlü (Fruitopia'dan tamamen farklı lavanta-porselen kimlik); ancak kilitli kedi etiketleri Light Mode'da WCAG AA altı (`3.35:1` ve `4.35:1`), Dark Mode'da kilitli Luna kayboluyor, şişe boynu ile gövdesi arasında kapalı çizgi ve aynı renk sıvılar arasında sert şerit kırılması var, bitmap emojiler (`🐾`, `🔥`) vektör dille çakışıyor ve Endless kartı kahverengileşen çamurlu gradyan içeriyor. |
| **3. Kullanılabilirlik & Responsive Sağlamlık (`usability_responsive`)** | **16** | 20 | ⚠️ İyileştirme Gerekli | Yatay taşma yok (`overflowX: false`) ve 12 şişelik raf 3 iPhone profilinde sığıyor; ancak `levels` filtre şeridi SE TR'de `"Büyük"` kelimesinde 16px içeriden bıçak gibi kesiliyor, Pro Max `home` altındaki reklam kartının son ~8px'i fold'da kırpılıyor, `levels` açıklamasında oyuncuya dönük `"BFS"` geliştirici jargonu ve TR `"Bölüm {{id}}'e"` ek uyumsuzluğu var. |
| **4. AdMob Yerleşimi & No-Fill Zarafeti (`admob_compliance`)** | **12** | 15 | ⚠️ İyileştirme Gerekli | Dev blueprint ve Prod House Ad zarif, oyun araç çubuğundan 16px mesafe doğru; ancak `banner` reklam slotları SE TR'de 98px, Pro Max Prod'da 82px, Dev'de 78px olarak yükseklik değiştirerek `CLS=0` kuralını bozuyor (SE'de 5 satırlı şişkin banner) ve Pro Max `home-inline` alt kesikli çizgisi Tab Bar sınırında kesiliyor. |
| **5. Apple App Review Güvenliği (`apple_review_safety`)** | **14** | 15 | ✅ Güçlü | %100 çevrimdışı gerçek SQLite (120 BFS doğrulamalı bölüm, sıfır mock veri, sıfır Lorem Ipsum/raw i18n, sıfır konsol hatası) ve net gizlilik bildirimi mevcut; ancak Gizlilik/Ayarlar bloğu `stats` ekranında fold altında gizli kalıyor ve geliştirici terimi (`BFS`) kullanıcı arayüzüne sızmış. |
| **TOPLAM** | **82** | **100** | ❌ **Tur 2 Gerekli** | **Hedef: >= 90 / 100 ve 0 Hard Blocker** |

---

### Hard Blocker Listesi (Tur 1)

1. **WCAG AA Altı Düşük Kontrastlı Metin & Karanlık Mod Görünürlük Kaybı (`home`, `stats` — Light & Dark Mode):**
   - `home__promax-light-prod.png` & `home__se-light-tr.png`: `.pe-cat-chip.is-locked` tüm elemana `opacity: 0.72` uyguladığı için `Lv 3 / Lv 8 / Lv 15 / Lv 25 / Lv 40` etiketlerinin kontrast oranı matematiksel olarak **`3.35:1`** seviyesine düşüyor (`< 4.5:1` WCAG AA ihlali).
   - `stats__promax-light-prod.png` & `stats__se-light-tr.png`: `.pe-cat-card.is-locked` tüm karta `opacity: 0.84` uyguladığı için `🔒 Level 3..40` / `Bölüm 3..40` kilit butonunun kontrastı **`4.35:1`** seviyesine düşüyor (`< 4.5:1` WCAG AA ihlali).
   - `home__promax-dark-prod.png` & `stats__promax-dark-prod.png`: Koyu füme kürklü **Luna (`Lv 8`)**, `#151126` zemin üzerinde `grayscale(0.85) opacity(0.55)` ile neredeyse tamamen görünmez hale geliyor.

---

### Aksiyon Alınabilir Düzeltme Listesi (`ui-polisher` İçin Tur 2 Görevleri)

| # | Ekran | Önem | Bulgu | Somut CSS / HTML / JS Düzeltme Talimatı |
| :-: | :--- | :---: | :--- | :--- |
| **1** | `home`, `stats` (Light & Dark) | **CRITICAL (Blocker)** | Kilitli kedi chiplerinde (`3.35:1`) ve kilitli kart butonlarında (`4.35:1`) WCAG AA altı kontrast; Dark Mode'da kilitli Luna'nın kaybolması. | `src/theme.css` içinde `.pe-cat-chip.is-locked { opacity: 0.72; }` ve `.pe-cat-card.is-locked { opacity: 0.84; }` satırlarını kaldırıp metinleri tam `opacity: 1` bırak (kilitli hissi `border-style: dashed` ve yalnızca portre SVG filtresiyle ver). Dark Mode'da (`@media (prefers-color-scheme: dark)` ve `:root[data-theme="dark"]`) `.pe-cat-portrait` ile `.pe-cat-chip` zeminini `#2C254B` yap ve kilitli SVG'ye `filter: grayscale(0.75) brightness(1.38) contrast(1.08) opacity(0.82);` uygula. |
| **2** | `play` (Tüm 4 varyant) | **HIGH** | Üst Navbar başlığı (`Level 1 · 3 Colors` / `Bölüm 1 · 3 Renk`) Dynamic Island merkezine göre ~10px sola kayık duruyor. | `src/theme.css` satır ~1475'teki `.af-screen[data-screen="play"] .af-navbar-inner` kuralını `grid-template-columns: minmax(94px, auto) minmax(0, 1fr) minmax(94px, auto);` yap (`@media (max-width: 385px)` içinde `minmax(92px, auto) minmax(0, 1fr) minmax(92px, auto)` ve `.af-navbar-right { gap: 4px; }`). Böylece başlık Dynamic Island'ın tam ortasına hizalanır. |
| **3** | `play`, `stats` (`se-light-tr`, `promax-light-prod`, `promax-light-devad`) | **HIGH** | `data-ad-type="banner"` reklam yuvalarında `CLS = 0` bozuluyor (`78px` Dev vs `82px` Pro Max Prod vs **`98px`** SE TR'de 5 satırlı şişkin banner). | `src/theme.css` satır ~355–388'de çok satırlı başlık/alt başlık kuralını yalnızca `inline`/`native` slotlara sınırla; `banner` slotlarına kesin sabit yükseklik ve tek satır kırpma ver: `.af-ad-slot[data-ad-type="banner"] { height: 78px; min-height: 78px; max-height: 78px; }`, `.af-ad-slot[data-ad-type="banner"].af-ad-slot--house { padding: 6px 10px; }` ve `.af-ad-slot[data-ad-type="banner"] .af-ad-house-title, .af-ad-slot[data-ad-type="banner"] .af-ad-house-sub { white-space: nowrap; overflow: hidden; text-overflow: ellipsis; display: block; -webkit-line-clamp: unset; }`. |
| **4** | `home`, `levels` (`promax-dark-prod`) | **HIGH** | Dark Mode'da `Start Level 1`, `Brew` ve Endless `Easy / Medium / Master` butonları koyu kartlar üstünde göz alan saf beyaz (`#FFFFFF`) bloklar ve pastel light dudaklarla (`#D8CCFA`, `#B8E7E1`) parlıyor. | `src/theme.css` içinde her iki Dark Mode bloğuna (`@media (prefers-color-scheme: dark)` ve `:root[data-theme="dark"]`) şunları ekle: `.pe-btn-3d--hero { background: #A78BFA; color: #151126; box-shadow: 0 4px 0 #6D28D9, 0 8px 18px rgba(0,0,0,0.36); }`, `.pe-btn-3d--daily-cta { background: #2DD4BF; color: #0B2624; box-shadow: 0 4px 0 #0F766E, 0 6px 14px rgba(0,0,0,0.34); }`, `.pe-endless-btn { background: rgba(246, 243, 255, 0.14); border: 1px solid rgba(196, 181, 253, 0.28); color: #F6F3FF; box-shadow: 0 3px 0 rgba(12, 9, 24, 0.55); }` ve `.pe-endless-btn-sub { color: #DDD6FE; }`. |
| **5** | `levels` (`se-light-tr`, `promax-*`) | **HIGH** | Zorluk filtre şeridi (`.pe-filter-scroll`) 16px içeriden kesilerek Pro Max'te `Grandmaster` sağ kenarını, SE TR'de `"Büyük [Usta]"` metnini bıçak gibi kesiyor. | `src/theme.css` satır ~1117'de `.pe-filter-scroll` için tam kenar taşmalı (edge-to-edge) yerel iOS yatay kaydırma uygula: `margin-inline: calc(var(--space-4) * -1); padding: 2px var(--space-4) 8px; gap: 7px;` ve `.pe-filter-pill { padding: 8px 12px; font-size: 12.5px; }`. Pro Max'te 5 hapın tamamı kesintisiz sığar, SE TR'de doğal ekran kenarına akar. |
| **6** | `play` (Tüm 4 varyant) | **MEDIUM** | Şişe boynu ile gövdesi arasında kapalı yatay çerçeve çizgisi var; ayrıca her `.pe-layer` altının çok kararması yüzünden üst üste aynı renk iksirler sert jaluzi şeritleri gibi görünüyor. | `src/theme.css` içinde `.pe-bottle-neck` yüksekliğini `12px`, `z-index: 4`, `margin-bottom: -3px` yaparak (veya `::after` ile boyun genişliği kadar 2px üst sınır boşluğunu maskeleyerek) boyun-gövde birleşimini açık cam akışına çevir. `--elixir-0..9` gradyanlarını daha yumuşak parlak silindirik cam gölgesine çek (sert koyu alt bandı azalt); `src/screens/play.js` içinde alttaki katmanla aynı renkteki katmana `.is-same-below` sınıfı vererek aynı renk havuzunu pürüzsüz birleştir (yalnızca çok ince `rgba(255,255,255,0.16)` ölçü çizgisi bırak). |
| **7** | `home` (`promax-*`, `se-light-tr`) | **MEDIUM** | Pro Max'te `home-inline` kartının son ~8px'i (DevAd alt kesikli kenarı dahil) Tab Bar hizasında kesiliyor; SE TR'de `"Ziyaretçi Kediler"` başlığı harflerin tam ortasından yatay kesiliyor. | `src/theme.css` içinde `home` dikey ritmini ~30px sıkılaştır: `.af-screen[data-screen="home"] .af-scroll-body { padding-top: 6px; }`, `.pe-brand-header { margin-bottom: 10px; }`, `.pe-home-cat-card { padding: 8px 12px; margin-bottom: 10px; }`, `.pe-hud-strip { margin-bottom: 10px; }`, `.pe-campaign-hero { padding: 14px 15px; margin-bottom: 10px; }`, `.pe-campaign-body { margin-bottom: 11px; }`, `.pe-daily-card { padding: 12px 14px; margin-bottom: 10px; }`, `.pe-cats-strip-card { padding: 10px 12px; margin-bottom: 12px; }`, `.af-screen[data-screen="home"] .af-ad-slot { margin-top: 12px; margin-bottom: 8px; }`. |
| **8** | `levels`, `home` (Tüm varyantlar) | **MEDIUM** | Endless kartındaki `#6D28D9 → #9A4406` geçişi çamurlu kahverengi; `.pe-level-cat-tag` (`🐾 Biscuit`) bitmap emoji kullanıyor ve üstteki `★ 0 / 180` satırına 2px mesafede sıkışıyor; kullanıcı arayüzünde `"BFS"` geliştirici jargonu ve TR `"Bölüm {{id}}'e"` ek hatası var. | `src/theme.css`: `--pe-endless-bg` Light `linear-gradient(135deg, #4C1D95 0%, #7C3AED 52%, #DB2777 100%)`, Dark `linear-gradient(135deg, #2D1B5E 0%, #4C2594 55%, #7E1D56 100%)`; `.pe-campaign-summary { margin-bottom: 14px; }`, `.pe-levels-grid { row-gap: 14px; }`, `.pe-level-cat-tag { display: inline-flex; align-items: center; gap: 3px; }`. `src/cats.js`: `UI_ICONS.paw` ve `UI_ICONS.flame` inline vektör SVG ekle, `levels.js` (`🐾`) ve `home.js` (`🔥`) içinde bitmap emojilerin yerine kullan. `src/locales/en.json` & `tr.json`: `"BFS-verified"` / `"BFS doğrulamalı"` jargonu yerine oyuncu dostu `"guaranteed-solvable"` / `"%100 çözülebilir"` yaz (`play.reward_hint_desc` / `play.reward_hint_granted` dahil); TR `"home.campaign_start"` → `"Bölüm {{id}} · Başla"`, `"home.campaign_continue"` → `"Bölüm {{id}} · Devam Et"`. |
| **9** | `stats` (`promax-*`) | **MEDIUM** | Pro Max'te 6 kedi kartı ekranı tam doldurduğu için aşağıdaki İstatistikler, Erişilebilirlik/Ses/Tema/Dil ayarları ve Gizlilik bildirimi için hiçbir kaydırma ipucu (scroll affordance) görünmüyor. | `src/theme.css` içinde `.af-screen[data-screen="stats"] .af-large-title { margin-bottom: 10px; }`, `.pe-cats-grid { gap: 8px; margin-bottom: 12px; }`, `.pe-cat-card { padding: 10px 9px; gap: 4px; }`, `.pe-cat-portrait { width: 50px; height: 50px; border-radius: 15px; }` (`.pe-cat-action-btn { min-height: 44px; }` kesin korunsun). Böylece `APOTHECARY STATISTICS` başlığı ve Bento kartlarının üstü Pro Max'te fold üzerinde doğal olarak belirir. |

---

## Tur 2 / 3 Değerlendirmesi

**Durum:** ✅ **GEÇTİ (`pass: true`)** — **Toplam Puan: 96 / 100** *(+14 puan artış)* | **Hard Blocker: 0**  
**İncelenen Güncel Ekran Görüntüleri (16 / 16 PNG):**
- `home`: `home__promax-light-prod.png`, `home__promax-dark-prod.png`, `home__promax-light-devad.png`, `home__se-light-tr.png`
- `levels`: `levels__promax-light-prod.png`, `levels__promax-dark-prod.png`, `levels__promax-light-devad.png`, `levels__se-light-tr.png`
- `play`: `play__promax-light-prod.png`, `play__promax-dark-prod.png`, `play__promax-light-devad.png`, `play__se-light-tr.png`
- `stats`: `stats__promax-light-prod.png`, `stats__promax-dark-prod.png`, `stats__promax-light-devad.png`, `stats__se-light-tr.png`

### Tur 1 Bulgularının Piksel Bazlı Doğrulama Tablosu

| Tur 1 # | Bulgu | Tur 2 Görsel Doğrulama Sonucu |
| :-: | :--- | :--- |
| **1 (Blocker)** | Kilitli kedi etiketleri (`3.35:1`) ve kilitli kart butonları (`4.35:1`) WCAG AA ihlali + Dark Mode'da kilitli Luna kaybolması | ✅ **GİDERİLDİ** — `opacity` yalnızca portre SVG'ye taşındı, metinler tam opaklıkta (`>= 6.06:1` WCAG AA+), kilitli kartlar zarif kesikli çerçeve aldı; Dark Mode'da Luna (`#2C254B` zemin + parlaklık filtresiyle) hem `home` hem `stats` ekranında net ve canlı görünüyor. |
| **2 (High)** | `play` üst navbar başlığının Dynamic Island'a göre sola kayması | ✅ **GİDERİLDİ** — `Level 1 · 3 Colors` / `Bölüm 1 · 3 Renk` tüm 4 varyantta Dynamic Island'ın tam optik merkezinde hizalı. |
| **3 (High)** | `banner` AdSlot'un SE TR'de `98px`'e şişerek `CLS = 0` kuralını bozması | ✅ **GİDERİLDİ** — `play-banner` ve `stats-banner` tüm 8 kontrolde (Dev, Prod Light/Dark, SE TR) kesin **`78px`** sabit yükseklikte (`CLS = 0`), SE oyun sahnesinde +20px nefes alanı kazanıldı. |
| **4 (High)** | Dark Mode'da Campaign/Daily/Endless CTA butonlarının göz alan saf beyaz (`#FFFFFF`) kalması | ✅ **GİDERİLDİ** — Campaign CTA parlak Twilight Lavender (`#A78BFA`), Daily CTA Mint Teal (`#2DD4BF`), Endless butonları buzlu koyu kristal cam stilinde; sıfır parlama, kusursuz Dark Mode uyumu. |
| **5 (High)** | `levels` filtre şeridinin 16px içeriden kesilerek `Grandmaster` ve `Büyük Usta` haplarını kırpması | ✅ **GİDERİLDİ** — Full-bleed şerit + optimize hap dolgusu sayesinde Pro Max'te 5 EN hapın tamamı, SE'de ise `"Büyük Usta"` dahil 5 TR hapın tamamı metin kesilmeden eksiksiz görünüyor. |
| **6 (Medium)** | Şişe boynu-gövde arası kapalı duvar çizgisi ve aynı renk sıvı katmanlarında sert jaluzi şeritleri | ✅ **GİDERİLDİ** — Şişe boyunları gövdeye kesintisiz açık cam olarak akıyor; aynı renkli üst üste sıvı katmanları pürüzsüz, parlak silindirik iksir havuzları oluşturuyor (yalnızca ince yarı saydam birim çizgisiyle). |
| **7 (Medium)** | Pro Max `home-inline` alt kenarının Tab Bar'da kesilmesi ve SE TR'de `"Ziyaretçi Kediler"` başlığının ortadan bölünmesi | ✅ **GİDERİLDİ** — Pro Max'te `home-inline` kartının tamamı (DevAd alt kesikli kenarı dahil!) Tab Bar üstünde ferah boşlukla tamamen sığıyor; SE TR'de `"Ziyaretçi Kediler"` başlığı ve `1 / 6` etiketi eksiksiz görünüp altındaki kedi chipleri doğal kaydırma ipucu veriyor. |
| **8 (Medium)** | Çamurlu Endless gradyanı, bitmap emojiler (`🐾`, `🔥`), sıkışık kedi ödül etiketi, `"BFS"` jargonu ve TR `'e` ek hatası | ✅ **GİDERİLDİ** — Endless kartı canlı kraliyet moru → çilek yıldızı gradyanına geçti; `🐾` ve `🔥` net vektör SVG ikonlarla değiştirildi; kedi kilometre taşı etiketleri ferahladı; `"BFS"` jargonu yerel metinlerden tamamen temizlendi; TR buton `"Bölüm 1 · Başla"` oldu. |
| **9 (Medium)** | Pro Max `stats` ekranında aşağı kaydırma ipucu olmaması | ✅ **GİDERİLDİ** — `APOTHECARY STATISTICS` başlığı ve `Levels Solved` / `Daily Streak` Bento kartlarının üstü Pro Max'te Tab Bar üzerinde temizce görünerek sezgisel kaydırma ipucu sağlıyor. |

### Rubrik Puan Tablosu (Tur 2)

| Kategori | Puan | Maks | Değişim | Özet Gerekçe |
| :--- | :---: | :---: | :---: | :--- |
| **1. Apple HIG & Native iOS Hissi (`apple_hig`)** | **24** | 25 | +4 | Dynamic Island/Home Indicator güvenli alanları, ortalanmış Play navbar başlığı, >=44pt dokunma hedefleri, uyumlu Twilight Crystal Dark Mode ve doğal iOS scroll ipuçları üst düzey. *(Minör: Pro Max `stats` fold'unda Bento rakamları hafif kırpılıyor.)* |
| **2. Görsel Estetik, Özgünlük & Hiyerarşi (`visual_polish`)** | **24** | 25 | +4 | Fruitopia'dan tamamen ayrışan özgün lavanta-porselen estetik, tüm metinlerde WCAG AA+ kontrast, pürüzsüz açık boyunlu kristal şişeler, %100 tutarlı vektör ikonografi ve parlak Endless gradyanı. *(Minör: Dark Mode boş şişe boyun maskesinde çok yakın incelemede hafif ton farkı.)* |
| **3. Kullanılabilirlik & Responsive Sağlamlık (`usability_responsive`)** | **19** | 20 | +3 | 16/16 kontrolde sıfır yatay taşma, 3 iPhone profilinde 12 şişelik raf sıfır kaydırma, SE 375px'te Türkçe `"Büyük Usta"` ve tüm araç çubuğu etiketleri eksiksiz, geliştirici jargonu sıfır. *(Minör: SE `play` 78px banner'ında Fruitopia başlığı doğal `...` ile kısalıyor.)* |
| **4. AdMob Yerleşimi & No-Fill Zarafeti (`admob_compliance`)** | **14** | 15 | +2 | Tüm `banner` slotları kesin `78px` (`CLS = 0`), Pro Max `home-inline` Dev/Prod tam çerçeveyle fold üstünde, oyun araç çubuğundan kesin `16px` güvenli boşluk, sıfır ham gri kutu. *(Minör: SE TR `inline` kartı 98px vs Pro Max 92px.)* |
| **5. Apple App Review Güvenliği (`apple_review_safety`)** | **15** | 15 | +1 | %100 çevrimdışı gerçek SQLite (120 doğrulanmış bölüm + Sonsuz Mod), sıfır mock veri, sıfır konsol/ağ hatası, sıfır ham i18n/jargon, şeffaf yerel gizlilik bildirimi ve güçlü Guideline 4.2/4.3/5.1 uyumu. |
| **TOPLAM** | **96** | **100** | **+14** | ✅ **GEÇTİ (Eşik: >= 90 / 100 ve 0 Hard Blocker)** |

### Hard Blocker Listesi (Tur 2)
- *(Yok — **0 Hard Blocker**)*

### İsteğe Bağlı Mikro İyileştirme Notları (Blocker Değil)
1. **`play` (`se-light-tr`):** `house-ads/catalog.json` içindeki Türkçe kardeş uygulama başlığı ~24 karakterle biraz daha öz tutulursa 375px SE sabit 78px banner'da `"Meyve Sud..."` üç nokta kısaltması bile oluşmaz (ayrıca Fruitopia yayına alındığında katalog URL'si gerçek App Store bağlantısıyla güncellenmelidir).
2. **`play` (`promax-dark-prod`):** Boş şişelerin boyun-gövde birleşimindeki `.pe-bottle-neck::after` maske rengi koyu cam gradyanıyla birebir eşleştirilerek yakın zoom'daki hafif ton çizgisi tamamen görünmez hale getirilebilir.
