# CRITIC REPORT — 001: Orchard Logic

**Değerlendirici:** Ajan 4 — Kıdemli Apple Tasarım Direktörü & App Store İnceleme Uzmanı (`design-critic`)  
**Uygulama:** `/home/erdemskywalker/app-factory/apps/001-orchard-logic`  
**Rubrik:** `rubric.json` v1 · **Geçme Eşiği:** `>= 85 / 100` VE `0 Hard Blocker`

---

## Tur 1 / 3 Değerlendirmesi

- **Genel Puan:** **80 / 100**
- **Hard Blocker Sayısı:** **0**
- **Karar:** **KALDI (`pass: false`)** — Güçlü mimari temel, sıfır taşma ve iPhone SE'de bile tek ekrana sığan 10×10 tahta etkileyici; ancak Dark Mode Segmented Control kontrast hatası, 10×10 bölge renk ayrımı zayıflığı, `%` gibi okunan kural ikonu, kayık Play navbar başlığı ve kesilen House Ad / Seviye metinleri çözülmeden Apple Design Award seviyesine (`>= 85`) geçilemez.

### 1. Rubrik Puan Tablosu

| Kategori | Puan | Maks. | Temel Bulgular |
| :--- | :---: | :---: | :--- |
| **Apple HIG & Native iOS Hissi** (`apple_hig`) | **19** | 25 | 44pt hedefler ve safe-area temiz; ancak Dark Mode aktif Segmented Control yüzeyi zeminle aynı/daha koyu (CR 1.03–1.17), `levels`/`stats` üstünde ~119px boş navbar alanı var, `play` başlığı Dynamic Island ekseninin soluna kayık, `Par/Hedef` kelimeleri monospace. |
| **Görsel Estetik, Özgünlük & Hiyerarşi** (`visual_polish`) | **19** | 25 | Warm Ivory / Deep Espresso + Cherry Coral kimliği çok özgün (Apple 4.3 güvenli); ancak 10×10 Dark Mode'da 3 bordo/erik ve 3 kahve/zeytin bölge birbirine karışıyor, Light Mode'da 3 pembe bölge (`reg-0/6/8`) fazla yakın, `No Touching` ikonu `%` (yüzde) işareti gibi okunuyor, Dark Mode `6×6`/`8×8` rozetleri neredeyse aynı sarı. |
| **Kullanılabilirlik & Responsive Sağlamlık** (`usability_responsive`) | **16** | 20 | iPhone SE (`375×667`) 10×10 ve 4×4 oyun ekranları sıfır scroll ile mükemmel sığıyor; ancak Seviye kartlarında (`Seviye 4`, `Level 9`) ve House Ad başlık/alt başlıklarında (hem SE TR hem Pro Max EN) `...` kırpılması var. |
| **AdMob Yerleşimi & No-Fill Zarafeti** (`admob_compliance`) | **12** | 15 | `play` ekranında 16px güvenli boşluk ve Dev Blueprint (`#play-banner`) kusursuz; ancak House Ad ikonu sıcak tema içinde çiğ `#007AFF` mavi duruyor, House Ad metni kesiliyor, `home` Pro Max'te `#home-inline` alttan 10px'lik garip şerit olarak taşıyor ve `levels`/`stats` reklam yuvaları fold altında görünmüyor. |
| **Apple App Review Güvenliği** (`apple_review_safety`) | **14** | 15 | %100 gerçek WASM SQLite (sıfır mock veri), 30 benzersiz çözümlü kampanya + 14 günlük bulmaca, sıfır konsol/i18n/Lorem hatası, ATT+UMP kancaları hazır; `stats` ekranına kısa çevrimdışı yerel veri/gizlilik bilgi notu eklenmesi Guideline 5.1 şeffaflığını pekiştirir. |
| **TOPLAM** | **80** | **100** | **Eşik: 85/100 + 0 Hard Blocker → Tur 2 Cilalama Gerekli** |

### 2. Hard Blocker Denetimi

| Hard Blocker Kontrolü | Durum | Kanıt |
| :--- | :---: | :--- |
| Yatay taşma, üst üste binen metin veya Dynamic Island / Home Indicator kesilmesi | **TEMİZ (0)** | Tüm 20 PNG görsel olarak incelendi; `overflowX: false`, safe-area boşlukları sağlam. |
| Light / Dark Mode'da okunmayan düşük kontrastlı yazı | **TEMİZ (0)** | Tüm metin çiftleri WCAG AA >= 4.5:1 (Dark segmented hatası metin değil, non-text buton yüzeyi kontrastıdır). |
| Prod no-fill'de ham gri boş kutu, bozuk görsel, Lorem Ipsum / Coming Soon | **TEMİZ (0)** | Tüm prod ekranlarında yerelleştirilmiş House Ad kartları ve CLS=0 sabit yükseklik aktif. |
| Çevrilmemiş ham i18n anahtarı, `undefined` veya `NaN` | **TEMİZ (0)** | `missingI18n: []`, boş istatistikler temiz `—` tire gösteriyor. |
| Reklam yuvasının ana aksiyon butonuna veya Tab Bar'a binmesi | **TEMİZ (0)** | `play` toolbar ile `#play-banner` arası 16px güvenli mesafe doğrulandı. |
| Frontend kodunda sahte/mock veri kullanımı | **TEMİZ (0)** | `src/data/repository.js` ve 4 ekran denetlendi; tüm veriler gerçek `wasm-sqlite` sorgularından akıyor. |

### 3. İncelenen 20 Ekran Görüntüsü Özeti

- **`home` (`promax-light-prod`, `promax-dark-prod`, `promax-light-devad`, `se-light-tr`):** Günlük Hasat hero kartı, kampanya ilerleme kartı ve Türkçe iPhone SE uyumu çok temiz. Ancak `How to Play` → `No Touching` ikonu birebir `%` (yüzde) işareti gibi algılanıyor; Pro Max `home` ekranının en altında `#home-inline` reklam yuvasının yalnız üst ~10px kenarı Tab Bar üstünden garip biçimde çıkıntı yapıyor (`home__promax-light-devad.png` çizgili şerit).
- **`levels` (`promax-light-prod`, `promax-dark-prod`, `promax-light-devad`, `se-light-tr`):** 2 sütunlu ızgara ve filtreler düzenli. Ancak Dark Mode'da `All` aktif segment yüzeyi (`#2B2622`) zemin çubuğuyla (`#2B2926`) neredeyse aynı (CR 1.03) olduğu için seçili olduğu belli olmuyor; üstte boş navbar sebebiyle ~119px (Pro Max) / ~80px (SE) ölü boşluk var; `Level 9` (`Intermediate · Winding Hed...`) ve SE TR `Seviye 4` (`Başlangıç · Bahçe Patik...`) satırları gereksiz aşama tekrarı yüzünden `...` ile kesiliyor; `Par`/`Hedef` kelimeleri monospace fontta; Dark Mode'da `6×6` ve `8×8` rozetleri neredeyse aynı sarı.
- **`stats` (`promax-light-prod`, `promax-dark-prod`, `promax-light-devad`, `se-light-tr`):** 4'lü Bento ızgarası ve iOS switch'ler şık, TR metinler SE'de temiz. Ancak üstte ~119px boş navbar alanı `Appearance` segment kontrolünü Tab Bar kenarında yazı ortasından bölüyor; Dark Mode'da `Dark` aktif segmenti (`#2B2622`) çevre çubuğundan (`#35322E`) daha koyu kalarak çökük görünüyor.
- **`play` 10×10 (`promax-light-prod`, `promax-dark-prod`, `promax-light-devad`, `se-light-tr`):** iPhone SE 375×667'de 10×10 tahta + navbar + durum şeridi + 4'lü araç çubuğu + 16px güvenli boşluk + alt banner'ın tek ekrana sıfır scroll ile sığması mükemmel! Ancak:
  1. Dark Mode 10×10 tahtada `reg-0` (`#4C2225`), `reg-6` (`#4B2239`), `reg-8` (`#4A1D2B`) üçlüsü ve `reg-4` (`#4E2F17`), `reg-9` (`#4A3313`), `reg-2` (`#473D18`) üçlüsü bulanık/birbirine çok yakın görünüyor; Light Mode'da `reg-0/6/8` üçü de yakın soluk pembe.
  2. Navbar başlığı (`Level 11 · 10×10`) sağdaki `00:00 + ?` bloğu daha geniş olduğu için Dynamic Island merkezinden ~18px sola kayık.
  3. Alt House Ad kartında hem SE TR'de başlık+alt başlık (`Bağımsız iOS Araçlarımızı ...`), hem Pro Max EN'de alt başlık (`...crafted for daily ...`) kesiliyor; ayrıca varsayılan `#007AFF` mavi kare ikon sıcak Orchard Craft paletiyle çatışıyor.
- **`play-tutorial-4x4` (`promax-light-prod`, `promax-dark-prod`, `promax-light-devad`, `se-light-tr`):** Çilek SVG illüstrasyonu, `×` işaretleri ve öğretici şerit net, SE'de tek ekrana sığıyor. Pro Max'te durum şeridi ile öğretici ipucu arasında ~80px boşluk oluşuyor ve başlık yine sola kayık.

### 4. Öncelikli Düzeltme Listesi (`actionable_fixes`)

| Önem | Ekran | Sorun | Somut Düzeltme Talimatı (CSS / JS) |
| :---: | :--- | :--- | :--- |
| **HIGH** | `levels`, `stats` (Dark Mode) | `.af-segmented-btn.is-active` Dark Mode'da `#2B2622` zemin kullanıyor; `#141210` üzerinde track ile CR 1.03, `#1F1C19` kart içinde ise track'ten (`#35322E`) daha koyu kalıp seçili düğme kayboluyor. | `src/theme.css` içinde Dark Mode bloğuna (`@media (prefers-color-scheme: dark)` ve `:root[data-theme="dark"]`) açık `.af-segmented` (`background: rgba(247, 244, 239, 0.08);`) ve `.af-segmented-btn.is-active` (`background: #423A34; color: #F7F4EF; border: 0.5px solid rgba(255, 250, 244, 0.14); box-shadow: 0 2px 6px rgba(0, 0, 0, 0.35);`) kuralı ekle. |
| **HIGH** | `play` (10×10 Dark & Light) | 10 renk bölgesinden Dark Mode'da 3 bordo/erik (`reg-0/6/8`) ve 3 kahve/zeytin (`reg-2/4/9`), Light Mode'da 3 pembe (`reg-0/6/8`) birbirinden zor ayrılıyor; 10×10 görsel netliği düşürüyor. | `src/theme.css` içindeki `--reg-0..9` renklerini 360° renk çemberine belirgin yay: Dark Mode'da `--reg-0: #602424` (kızıl), `--reg-1: #37255E` (mor), `--reg-2: #344415` (zeytin-limon), `--reg-3: #18472A` (zümrüt), `--reg-4: #5E3614` (yanık turuncu), `--reg-5: #183661` (kobalt), `--reg-6: #5C3A2E` (sıcak şeftali-kil) veya `#4E2A45`, `--reg-7: #13494A` (turkuaz), `--reg-8: #5A1E3D` (yakut-mürdüm), `--reg-9: #4A3E12` (kehribar-altın) ve `--board-border`/`--board-region-border: #D6CBC0`, `--x-auto: #C4BBB0` yap; Light Mode'da `--reg-0: #FFD8D8`, `--reg-4: #FFE0BC`, `--reg-6: #FAD7E8`, `--reg-8: #E5CBE0` (soğuk orkide-vişne), `--reg-9: #EDD49A` (bal kehribarı) ile tüm bölgeleri ayrıştır ve tümünde `×` kontrastını `>= 4.5:1` koru. |
| **HIGH** | `play`, `play-tutorial-4x4` (Prod & SE TR) | House Ad kartı hem iPhone SE TR'de başlık+alt başlık (`Bağımsız iOS Araçlarımızı ...`) hem Pro Max EN'de alt başlık kesiyor; ayrıca `#007AFF` mavi ikon sıcak Orchard Craft temasıyla çatışıyor. | `src/theme.css` içinde `.af-ad-slot--house` override'ı ekle: `.af-ad-slot--house .af-ad-house-icon { width: 36px; height: 36px; flex-basis: 36px; background: linear-gradient(135deg, #257A48, #185A34) !important; }`, `.af-ad-slot--house { padding: 8px 10px; gap: 10px; }`, `.af-ad-house-title { font-size: 13px; white-space: normal; line-height: 1.22; }`, `.af-ad-house-sub { font-size: 11.5px; white-space: normal; line-height: 1.25; display: -webkit-box; -webkit-line-clamp: 2; -webkit-box-orient: vertical; }`. SE 667px dikey bütçesinin hâlâ scroll'suz sığdığını doğrula. |
| **MEDIUM** | `home` (Light & Dark) | `How to Play` → `No Touching` kural ikonu (`UI_ICONS.ruleDiag`) iki nokta + çapraz çizgi nedeniyle `%` (yüzde) işareti gibi okunuyor. | `src/fruits.js` içindeki `UI_ICONS.ruleDiag` SVG'sini `%` çağrışımı yapmayan, iki çapraz bitişik hücre + net yasak/çarpı işareti (ör. `2×2` diyagonal kare ve ortada çapraz yasak çizgisi veya köşegen temas çarpısı) ile değiştir. |
| **MEDIUM** | `play`, `play-tutorial-4x4` (Pro Max & SE) | `.af-navbar-inner` asimetrik `auto minmax(0,1fr) auto` ızgarası yüzünden `Level 11 · 10×10` ve `Level 1 · 4×4` başlıkları Dynamic Island merkezinden ~18px sola kayıyor. | `src/theme.css` içinde `.af-screen[data-screen="play"] .af-navbar-inner` için `>= 391px` ekranlarda `.af-navbar-title` başlığını optik merkeze hizala (ör. `.af-screen[data-screen="play"] .af-navbar-inner { position: relative; }` + `@media (min-width: 391px) { .af-screen[data-screen="play"] .af-navbar-title { position: absolute; left: 50%; transform: translateX(-50%); max-width: 170px; pointer-events: none; } }`), SE (`<= 390px`) için çakışmasız `auto minmax(0,1fr) auto` düzenini koru. |
| **MEDIUM** | `levels` (SE TR, Pro Max Light & Dark) | `Level 9` (`Intermediate · Winding Hed...`) ve `Seviye 4` (`Başlangıç · Bahçe Patik...`) satırları kesiliyor; `Par`/`Hedef` kelimeleri monospace fontta; Dark Mode `6×6` ve `8×8` rozetleri neredeyse aynı sarı. | (1) `src/screens/levels.js` satır 95-97'de kart alt başlığını `const subtitle = titleText || tierLabel(lvl.tier);` yaparak tekrarlayan aşama önekini kaldır (boyut rozeti zaten aşamayı renk kodluyor). (2) `src/theme.css`'te `.ol-level-time` için `font-family: var(--font-family); font-variant-numeric: tabular-nums;` kullan. (3) `src/theme.css` Dark Mode'da `.ol-size-badge--warmup` için sıcak turuncu (`background: rgba(251, 146, 60, 0.18); color: #FB923C;`) tanımla ki `8×8` sarı rozetten (`#FACC15`) net ayrılsın. |
| **MEDIUM** | `levels`, `stats`, `home` (Pro Max & SE) | `levels` ve `stats` ekranlarında buton içermeyen boş `.af-navbar-inner` 48px ölü dikey boşluk yaratıyor (Pro Max'te ~119px, SE'de ~80px); bu yüzden `stats`'ta `Appearance` segment kontrolü Tab Bar kenarında yazı ortasından kesiliyor, `home` Pro Max'te `#home-inline` alttan 10px şerit olarak görünüyor. | `src/theme.css` içinde: (1) `.af-screen[data-screen="levels"] .af-navbar:not(.is-scrolled) .af-navbar-inner, .af-screen[data-screen="stats"] .af-navbar:not(.is-scrolled) .af-navbar-inner { height: 10px; transition: height var(--duration-fast) ease; }` ekleyerek native iOS Large Title üst boşluğunu sıkılaştır (kaydırınca `.is-scrolled` ile 48px inline başlık normal açılır). (2) `home` ekranında `#home-inline` için `.af-screen[data-screen="home"] .af-ad-slot { margin-top: 24px; }` veya üst boşluk dengesiyle Pro Max ilk görünümde 10px'lik yarım şerit çıkıntısını ortadan kaldır. |
| **LOW** | `stats`, `play-tutorial-4x4` | (1) `stats` ekranında Apple 5.1 yerel/çevrimdışı veri şeffaflık dipnotu yok. (2) `play-tutorial-4x4` Pro Max'te durum şeridi ile `.ol-tutorial-tip` arasında ~80px boşluk kalıyor. | (1) `src/screens/stats.js` içinde `Appearance & Language` grubunun hemen altına sade bir yerel veri/gizlilik bilgi satırı (`en.json`/`tr.json` çevirili, `12px`, `--label-secondary`) ekle. (2) `src/screens/play.js` içinde `.ol-tutorial-tip` öğesini `.ol-board-stage` dışına, doğrudan `.ol-status-bar` altına (`margin-top: 8px; margin-bottom: 0;`) taşıyarak üst durum bandıyla bütünleştir. |

---

## Tur 2 / 3 Değerlendirmesi

- **Genel Puan:** **94 / 100** *(Tur 1'e göre +14 puan artış)*
- **Hard Blocker Sayısı:** **0**
- **Karar:** **GEÇTİ (`pass: true`)** — Tur 1'de bildirilen 8 bulgunun tamamı (`3 HIGH`, `4 MEDIUM`, `1 LOW`) güncel 20 ekran görüntüsünde birebir doğrulanarak eksiksiz giderilmiştir. Hiçbir regresyon gözlenmemiştir; uygulama Apple HIG, görsel özgünlük, iPhone SE Türkçe dayanıklılığı ve AdMob / App Review güvenliği açısından yayın kalitesindedir.

### 1. Tur 1 → Tur 2 Düzeltme Doğrulama Matrisi

| Tur 1 Bulgusu | Önem | Tur 2 Görsel Doğrulama Sonucu |
| :--- | :---: | :--- |
| Dark Mode Segmented Control aktif düğme görünmezliği (`levels`, `stats`) | **HIGH** | **ÇÖZÜLDÜ ✓** — `levels__promax-dark-prod.png` (`All`) ve `stats__promax-dark-prod.png` (`Dark`) ekranlarında `#423A34` yükseltilmiş zemin + ince kenar çizgisi ile net ve yerel iOS hissi veriyor. |
| 10×10 tahtada Dark (`reg-0/6/8`, `reg-2/4/9`) ve Light (`reg-0/6/8`) bölge renk karışması | **HIGH** | **ÇÖZÜLDÜ ✓** — `play__promax-dark-prod.png` ve `play__promax-light-prod.png` ekranlarında tüm 10 bölge tek bakışta ayrışıyor; yumuşatılan `#D6CBC0` koyu sınırlar çok daha zarif. |
| House Ad metin kırpılması (`SE TR` & `Pro Max EN`) + çiğ `#007AFF` mavi ikon | **HIGH** | **ÇÖZÜLDÜ ✓** — `play__se-light-tr.png`, `play-tutorial-4x4__se-light-tr.png` ve `play__promax-*-prod.png` ekranlarında botanik yeşil ikon temayla bütünleşmiş; EN ve TR başlık/alt başlıklar eksiksiz, `...` kırpılması yok ve SE 667px'e scroll'suz sığıyor. |
| `No Touching` kural ikonunun `%` (yüzde) işareti gibi okunması (`home`) | **MEDIUM** | **ÇÖZÜLDÜ ✓** — `home__promax-light-prod.png` ve `home__promax-dark-prod.png` ekranlarında çapraz iki kare + ortada net `×` sembolü ile kural anında anlaşılıyor. |
| `play` navbar başlığının Dynamic Island merkezinden sola kayması | **MEDIUM** | **ÇÖZÜLDÜ ✓** — `play__promax-*-prod.png`, `play__promax-light-devad.png` ve `play-tutorial-4x4__promax-*` ekranlarında `Level 11 · 10×10` ve `Level 1 · 4×4` Dynamic Island ekseninde optik olarak tam ortalı; SE TR'de çakışmasız. |
| Seviye kartlarında `...` kesilmesi, monospace `Par/Hedef`, Dark `6×6`/`8×8` rozet benzerliği | **MEDIUM** | **ÇÖZÜLDÜ ✓** — `Level 9` (`Winding Hedge`) ve `Seviye 4` (`Bahçe Patikası`) kırpılmasız; `Par`/`Hedef` SF Pro + tabular rakamlarla temiz; Dark Mode'da `6×6` sıcak turuncu (`#FB923C`) ile `8×8` altından (`#FACC15`) net ayrılıyor. |
| `levels`/`stats` boş navbar ölü alanı + `home` altta 10px reklam kenarı çıkıntısı | **MEDIUM** | **ÇÖZÜLDÜ ✓** — `levels` ve `stats` Large Title hizası gerçek iOS oranında; `stats` Pro Max'te `Appearance` segment kontrolü artık Tab Bar altında bölünmeden tam görünüyor; `home` Pro Max'te 10px'lik garip kenar çıkıntısı tamamen yok. |
| `stats` Apple 5.1 yerel veri/gizlilik dipnotu + `4×4` öğretici ipucu kopukluğu | **LOW** | **ÇÖZÜLDÜ ✓** — `src/screens/stats.js` (`stats.privacy_note`) eklendi; `play-tutorial-4x4` ekranlarında öğretici şerit durum çubuğunun hemen altında bütüncül duruyor. |

### 2. Rubrik Puan Tablosu (Tur 2)

| Kategori | Tur 1 | Tur 2 | Maks. | Tur 2 Değerlendirme Notu |
| :--- | :---: | :---: | :---: | :--- |
| **Apple HIG & Native iOS Hissi** (`apple_hig`) | 19 | **23** | 25 | Large Title üst boşluğu, Dark Mode Segmented Control, optik ortalı Play başlığı, SF Pro tabular rakamlar ve 44pt hedefler native iOS düzeyinde. |
| **Görsel Estetik, Özgünlük & Hiyerarşi** (`visual_polish`) | 19 | **23** | 25 | Warm Ivory / Deep Espresso + Cherry Coral + 10 yüksek ayrımlı meyve bölgesi çok özgün; yeni diyagonal ikon ve temiz ekran kadrajı ile bağımsız Apple Design Award çizgisinde. |
| **Kullanılabilirlik & Responsive Sağlamlık** (`usability_responsive`) | 16 | **19** | 20 | Tüm 20 ekran görüntüsünde sıfır taşma, sıfır kart/reklam metin kesilmesi; 10×10 ve 4×4 oyun sahneleri iPhone SE (`375×667`) TR'de scroll'suz ve rahat oynanabilir. |
| **AdMob Yerleşimi & No-Fill Zarafeti** (`admob_compliance`) | 12 | **14** | 15 | Dev Blueprint net, Prod House Ad botanik ikonla temaya uyumlu ve metin kırpılmasız, araç çubuğundan 16px güvenli boşluk tam; küçük not olarak `#levels-inline` 30 kartın altında oldukça derinde kalıyor. |
| **Apple App Review Güvenliği** (`apple_review_safety`) | 14 | **15** | 15 | %100 gerçek WASM SQLite (sıfır mock veri), 30 kampanya + 14 günlük benzersiz çözümlü bulmaca, sıfır konsol/i18n/Lorem hatası, ATT+UMP kancaları ve yerel veri gizlilik notu tam. |
| **TOPLAM** | **80** | **94** | **100** | **Eşik: >= 85/100 ve 0 Hard Blocker → ONAYLANDI (PASS)** |

### 3. Hard Blocker Denetimi (Tur 2)

- **Hard Blocker Sayısı:** **0**
- Yatay taşma, üst üste binen metin, notch / Dynamic Island / Home Indicator kesilmesi: **Yok (`overflowX: false`, 20/20 PNG temiz)**
- Düşük kontrastlı okunmayan yazı: **Yok (tüm metinler WCAG AA >= 4.5:1)**
- Prod no-fill'de ham gri kutu, bozuk görsel, Lorem Ipsum / Coming Soon: **Yok**
- Ham i18n anahtarı, `undefined` veya `NaN`: **Yok (`missingI18n: []`)**
- Reklam yuvasının buton/Tab Bar üstüne binmesi: **Yok (`16px` güvenli boşluk korundu)**
- Sahte/mock veri kullanımı: **Yok (`dbMode: "wasm-sqlite"`, `e2eResult.ok: true`)**

### 4. Opsiyonel Gelecek İyileştirme Notları (Engelleyici Değil)

| Önem | Ekran | Gözlem | Öneri |
| :---: | :--- | :--- | :--- |
| **LOW** | `play` (`promax-dark-prod`) | Dark Mode `reg-6` (`#5C3A2E` şeftali-kil) ile `reg-4` (`#5E3614` yanık turuncu) yan yana geldikleri seviyelerde sıcak toprak tonunda birbirine biraz yaklaşabilir. | İleride istenirse Dark `--reg-6` hafif gül-ahududu (`#632945`) tonuna çekilerek sıcak turuncudan daha da uzaklaştırılabilir. |
| **LOW** | `levels` (`promax-light-devad`) | `#levels-inline` reklam yuvası 30 kartın en altında kaldığı için düşük görünürlük alıyor. | İleride dilenirse ilk 6 veya 10 karttan sonra (ızgaralar arasına) en az `16px` üst/alt boşlukla konumlandırılarak görünürlük artırılabilir. |
