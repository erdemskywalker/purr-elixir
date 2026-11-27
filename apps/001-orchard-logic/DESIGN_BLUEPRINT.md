# DESIGN BLUEPRINT — 001: Orchard Logic ("Orchard Craft")

**Rol:** Ajan 1 — UI & Apple HIG Tasarım Sistemi Mimarı (`ui-architect`)  
**Stil Dosyası:** [`src/theme.css`](./src/theme.css)  
**Hedef Cihazlar:** iPhone SE (`375×667`, `safeTop: 20`, `safeBottom: 0`) & iPhone 16 Pro Max (`430×932`, `safeTop: 59`, `safeBottom: 34`)  
**Diller:** English (`en`) + Türkçe (`tr`)  

---

## 1. Apple 4.3 Özgünlük & Görsel Kimlik İmzası

Önceki kardeş uygulamalar kontrol edilmiştir (`apps/_smoke-test/src/theme.css`, sistem varsayılanı `hig-tokens.css`):

| Özellik | Önceki Kardeş (`_smoke-test`) | **001-orchard-logic ("Orchard Craft")** |
| :--- | :--- | :--- |
| **Ana Vurgu (`--accent`)** | Soğuk Teal (`#0d9488` / `#2dd4bf`) | **Kiraz Mercan (`#D9383E` Light / `#FF646B` Dark)** |
| **Light Zemin & Kart** | Soğuk iOS Grisi (`#f2f2f7`) / `#ffffff` | **Sıcak Fildişi Keten (`#FAF7F2`) / Krem Beyaz (`#FFFFFF`)** |
| **Dark Zemin & Kart** | Saf Siyah (`#000000`) / `#1c1c1e` | **Derin Espresso (`#141210`) / Kavrulmuş Ceviz (`#1F1C19`)** |
| **Özgün İmza Öğesi** | Liste/istatistik kartı | **10 Suluboya Meyve Bölgesi (`--reg-0..9`) + Kalın `2px` Bölge Sınırları + Tam Odaklı Push 10×10 Bulmaca Sahnesi** |

### Matematiksel WCAG AA Kontrast Doğrulaması (Tümü >= 4.5:1)
- **Light Mode:**
  - `--label-primary` (`#1C1917`) → `#FAF7F2` üzerinde **16.37:1**, `#FFFFFF` üzerinde **17.49:1**
  - `--label-secondary` (`#635B54`) → `#FAF7F2` üzerinde **6.23:1**, `#FFFFFF` üzerinde **6.66:1**
  - `--label-tertiary` (`#6E655D`) → `#FAF7F2` üzerinde **5.34:1**, `#FFFFFF` üzerinde **5.70:1**
  - `--accent-contrast` (`#FFFFFF`) → `--accent` (`#D9383E`) üzerinde **4.58:1**
  - `--accent-ink` (`#B82329`) → `--accent-soft` üzerinde **5.42:1**, `#FAF7F2` üzerinde **5.94:1** (tinted buton, rozet, nav link ve House Ad CTA'larda kullanılır)
- **Dark Mode:**
  - `--label-primary` (`#F7F4EF`) → `#141210` üzerinde **17.03:1**, `#1F1C19` üzerinde **15.46:1**
  - `--label-secondary` (`#BEB5AA`) → `#141210` üzerinde **9.24:1**, `#1F1C19` üzerinde **8.38:1**
  - `--accent-contrast` (`#141210`) → `--accent` (`#FF646B`) üzerinde **6.48:1**
  - `--accent-ink` (`#FF858A`) → `--accent-soft` üzerinde **5.55:1**
- **10 Bölge Üzerinde `×` ve Sınır Kontrastı:**
  - Light Manuel `×` (`#3A322C`): Tüm 10 bölgede **8.85:1 – 11.43:1**; Bölge Sınırı (`#2E2823`): **10.25:1 – 13.23:1**
  - Dark Manuel `×` (`#EFE7DD`): Tüm 10 bölgede **8.80:1 – 11.42:1**; Auto `×` (`#B5ACA0`): **4.81:1 – 6.24:1**
  - **Algısal Ayrıştırma İyileştirmesi:** 10×10 tahtalarda komşu bölgelerin karışmaması için `reg-8` (Kiraz) soğuk yakut gülü (`#F1D0DC` / `#4A1D2B`), `reg-9` (Ananas) sıcak kehribar balı (`#F4DFB0` / `#4A3313`) olarak `reg-0` (Çilek `#FDE2E2`) ve `reg-2` (Limon `#FEF5C8`)'den net biçimde ayrıştırılmıştır.

---

## 2. Navigasyon Arketipi

**3 Sekmeli iOS Alt Tab Bar + Tam Odaklı Push Oyun Ekranı (`hideTabBar: true`) + Modal Sheet'ler**

```
#af-app
├── .af-viewport
│   ├── [Tab 1] home   (Oyna / Play)           — Large Title, Tab Bar GÖRÜNÜR
│   ├── [Tab 2] levels (Seviyeler / Levels)    — Large Title, Tab Bar GÖRÜNÜR
│   ├── [Tab 3] stats  (İstatistik / Stats)    — Large Title, Tab Bar GÖRÜNÜR
│   └── [Push]  play   (Tam Odak Oyun Sahnesi) — Inline Title, hideTabBar: true
│       ├── Modal Sheet: Victory Celebration (Zafer + Sonraki Seviye + victory-banner AdSlot)
│       ├── Modal Sheet: Rules & 10-Fruit Legend (Kurallar & Meyve Rehberi)
│       ├── Modal Sheet: Rewarded +1 Hint (2 ücretsiz ipucu bittiğinde)
│       └── Alert Dialog: Confirm Board Reset (Temizle onayı)
└── .af-tabbar (3 sekme: Oyna | Seviyeler | İstatistik — play ekranında gizlenir)
```

---

## 3. Ekran Bazlı Bileşen Hiyerarşisi & Durumlar

### Ekran 1: `home` (Oyna / Play Tab)
- **Navbar:** Large Title (`Orchard Logic` / `Orchard Logic`), kaydırınca inline başlığa geçer. Sağ slot boş veya hızlı Kurallar (`?`) ikonu (`44×44px`).
- **Bileşen Hiyerarşisi (8pt ritmi, `.af-scroll-body` içinde):**
  1. **Daily Harvest Hero Kartı (`.ol-daily-hero`):**
     - Üst satır (`.ol-hero-top`): Kicker (`GÜNÜN 10×10 BULMACASI`) + Seri rozeti (`.ol-streak-pill`, örn. `🔥 3 Gün`).
     - Başlık (`.ol-hero-title`): Günün tarihi + boyut (`Günlük Hasat · 10×10`) ve alt açıklama (`.ol-hero-sub`: tamamlanmadıysa `"Her bölgeye tek meyve yerleştir"`, tamamlandıysa `"Bugün 02:18 sürede tamamlandı ✓"`).
     - Birincil CTA (`.ol-hero-cta`, `min-height: 46px`): `"Günün Bulmacasını Oyna"` / `"Çözümü Gör"`.
  2. **Kaldığın Yerden Devam Et Kartı (`.af-card.ol-continue-card`):**
     - Üst satır: Kicker (`KAMPANYA`), aktif/sıradaki seviye başlığı (`Seviye 11 · Usta`), sağda renk kodlu boyut rozeti (`.ol-size-badge--master` → `10×10`).
     - İlerleme çubuğu (`.ol-progress-wrap` → `.ol-progress-track` / `.ol-progress-fill`): `X / 30 Seviye Tamamlandı` + yıldız toplamı (`★ Y / 90`).
     - Birincil buton (`.af-btn.af-btn-primary.af-btn-block`): `"Devam Et"` veya `"Seviye 1'e Başla"`.
  3. **Hızlı Kurallar Kartı (`.af-card` + `.ol-rules-grid`):**
     - 2×2 kompakt görsel kurallar: (1) Satırda 1, (2) Sütunda 1, (3) Renkte 1, (4) Çapraz Temas Yok.
  4. **Inline Reklam Yuvası:** `data-ad-slot="home-inline"` (`data-ad-type="inline"`).
- **Durumlar:**
  - *Yükleme:* `.ol-skeleton` kart blokları (sabit yükseklik, `CLS = 0`).
  - *Boş / İlk Açılış:* Günlük seri `0 Gün`, Kampanya kartı `Seviye 1 · 4×4 (Öğretici)` ile sıcak karşılama sunar.
  - *Tüm 30 Seviye Tamamlandı:* Kampanya kartı `"Tüm Bahçe Tamamlandı ★"` rozetine döner ve `"Seviyeleri Tekrar Oyna"` aksiyonu verir.
  - *Hata:* SQLite başlatılamazsa `.af-empty-state` + `"Yeniden Dene"` (`44px`) butonu gösterilir.

### Ekran 2: `levels` (Seviyeler / Levels Tab)
- **Navbar:** Large Title (`Seviyeler` / `Levels`).
- **Bileşen Hiyerarşisi:**
  1. **Zorluk / Boyut Filtresi (`.ol-filter-bar` + `.af-segmented`):**
     - 4 seçenekli Segmented Control (`min-height: 44px`):
       - EN: `All` | `4–6×` | `8×8` | `10×10`
       - TR: `Tümü` | `4–6×` | `8×8` | `10×10`
       *(iPhone SE 375px'te kesilmeyi önlemek için kısa ve yüksek tarama hızlı etiketler zorunludur.)*
  2. **Kampanya Özet Şeridi (`.ol-campaign-strip`):** Seçili filtredeki tamamlanma sayısı (`6 / 20 Çözüldü · ★ 16`).
  3. **Seviye Kartları Izgarası (`.ol-levels-grid`, 2 sütun):**
     - Her kart bir `<button class="ol-level-card">` (`min-height: 112px`):
       - Üst: `Seviye N` (`.ol-level-num`) + Boyut rozeti (`4×4`, `5×5`, `6×6`, `8×8`, `10×10`).
       - Orta: Aşama adı (`Öğretici`, `Başlangıç`, `Isınma`, `Orta`, `Usta`).
       - Alt (`.ol-level-bottom`): Tamamlandıysa 1–3 altın yıldız (`.ol-stars`) + en iyi süre (`01:48`); devam ediyorsa `.ol-status-pill--progress` (`Devam`); başlanmadıysa `.ol-status-pill--new` (`Yeni`) + hedef süre.
       - Sıradaki önerilen seviye `.is-next` çerçevesiyle vurgulanır.
  4. **Inline Reklam Yuvası:** Izgaranın altında en az `16px` boşlukla `data-ad-slot="levels-inline"` (`data-ad-type="inline"`).
- **Durumlar:**
  - *Yükleme:* 6 adet `.ol-skeleton` kart (`112px` yükseklik).
  - *Boş Filtre:* `.af-empty-state` + `"Tümünü Göster"` butonu.
  - *Hata:* `.af-empty-state` + `"Yeniden Yükle"` butonu.

### Ekran 3: `stats` (İstatistik & Ayarlar / Stats Tab)
- **Navbar:** Large Title (`İstatistik` / `Stats`).
- **Bileşen Hiyerarşisi:**
  1. **4'lü Bento Özet Izgarası (`.ol-bento-grid`, 2×2):**
     - Çözülen Seviye (`X / 30`)
     - Günlük Seri (`N Gün`)
     - En İyi 10×10 Süresi (`02:14` veya `—`)
     - Ortalama Süre (`01:36` veya `—`)
  2. **Bölüm Başlığı (`OYUN TERCİHLERİ`) + `.af-list-group`:**
     - `Otomatik ×` — Meyve konduğunda satır/sütun/bölge/çapraz hücreleri otomatik eler (`.af-switch`).
     - `Kural İhlali Vurgusu` — Çakışan meyveleri anlık kırmızı halka ve açıklamayla gösterir (`.af-switch`).
     - `Dokunsal Titreşim` — Hamle, çakışma ve zaferde iOS Haptic geri bildirimi (`.af-switch`).
  3. **Bölüm Başlığı (`GÖRÜNÜM VE DİL`) + `.af-list-group`:**
     - `.ol-setting-stack`: `Tema` etiketi üstte, altında tam genişlik `.af-segmented` (`Sistem` / `Açık` / `Koyu`).
     - `.ol-setting-stack`: `Dil` etiketi üstte, altında tam genişlik `.af-segmented` (`English` / `Türkçe`).
  4. **Banner Reklam Yuvası:** Ayarlar grubundan en az `16px` aşağıda `data-ad-slot="stats-banner"` (`data-ad-type="banner"`).
- **Durumlar:**
  - *Boş (Henüz çözülen seviye yok):* Sayısal alanlar `0` ve süre alanları `—` (asla `NaN` veya `undefined` gösterilmez!).
  - *Yükleme / Hata:* Güvenli varsayılanlarla açılır; yazma hatasında `.af-toast` bildirimi gösterilir.

### Ekran 4: `play` (Tam Odak Oyun Ekranı — Push, `hideTabBar: true`)
- **Navbar (`.af-navbar.is-inline-title`, özel `auto 1fr auto` ızgara):**
  - Sol: `< Geri` (`.af-nav-btn`, `min-width: 44px; min-height: 44px`).
  - Orta: Inline başlık (`Seviye 11 · 10×10` veya `Günlük · 10×10`), iPhone SE'de `15px`.
  - Sağ: Tabular kronometre rozeti (`.ol-timer-pill`, `00:42`) + Yardım `?` butonu (`.af-nav-btn.ol-help-btn`, `44×44px`).
- **Dikey Bütçe (iPhone SE `375×667`, `safeTop = 20px`, `safeBottom = 0px`, SIFIR Dikey Taşma / SIFIR Scroll):**

| Katman | Sınıf | Yükseklik (SE) | Notlar |
| :--- | :--- | :---: | :--- |
| Safe Top + Navbar | `.af-navbar` | `68px` (`20 + 48`) | Inline başlık, `< Geri`, süre, `?` |
| Üst Boşluk | `.af-scroll-body` padding-top | `6px` | Temiz nefes alanı |
| Durum/Çakışma Şeridi | `.ol-status-bar` | `32px` (sabit) | Kalan meyve sayısı / çakışma nedeni / ipucu notu (`CLS = 0`) |
| Tahta Sahnesi (`10×10`) | `.ol-board-stage` + `.ol-board` | `351px` (`+16px` pad) | `width: min(100%, 402px, calc(100dvh - var(--safe-top) - var(--safe-bottom) - 266px))` |
| 4'lü Araç Çubuğu | `.ol-toolbar` | `54px` | `Geri Al` · `Oto ×` · `İpucu` · `Temizle` (her biri `>= 44×54px`) |
| Güvenli Reklam Boşluğu | `.ol-play-ad-zone` `padding-top` | **`16px`** | Yanlış tıklama koruması (minimum 16px zorunlu!) |
| Alt Banner Reklam | `data-ad-slot="play-banner"` | `78px` | CLS=0 sabit yükseklik |
| Alt Güvenli Boşluk | `.af-scroll-body` padding-bottom | `8px` (`+ safe-bottom`) | Pro Max'te `+34px` Home Indicator koruması |
| **TOPLAM** | | **`629px < 667px`** | **38px ferah pay — iPhone SE'de bile sıfır sıkışma!** |

- **10×10 Bölge Sınır Sözleşmesi (`app-ui-dev` için kesin kural):**
  - `.ol-board` üzerinde inline `--grid-n: <N>;` (4, 5, 6, 8 veya 10) ayarlanır.
  - Her hücre `<button type="button" class="ol-cell" data-region="<0..9>" data-r="<r>" data-c="<c>">` olarak üretilir (`.af-btn` sınıfı **eklenmez**).
  - Çift kalın (`4px`) çizgi oluşmaması için yalnızca şu iki komşu kontrolüyle kalın sınır sınıfları eklenir (dış çerçeveyi `.ol-board`'un `2.5px` dış kenarı sağlar):
    - `r > 0 && region(r, c) !== region(r - 1, c)` → `.ol-edge-top` (`border-top: 2px solid var(--board-region-border)`)
    - `c > 0 && region(r, c) !== region(r, c - 1)` → `.ol-edge-left` (`border-left: 2px solid var(--board-region-border)`)
  - Hücre durumları:
    - Boş: yalnız renk dolgusu
    - Manuel `×`: `.is-x` + `.ol-x-mark` SVG
    - Otomatik `×`: `.is-auto-x` + `.ol-x-mark` SVG
    - Meyve: `.is-fruit` + `.ol-fruit-svg` (`width: 74%; height: 74%`)
    - Çakışma: `.is-conflict` + `.ol-status-bar.is-conflict` (*"Aynı satır" / "Aynı sütun" / "Aynı renk bölgesi" / "Çapraz temas"*)
    - İpucu: `.is-hint` + `.ol-status-bar.is-hint`
- **Öğretici İpucu (Seviye 1–2, `4×4`):**
  - `4×4` tahta zaten daha büyük hücrelere sahip olduğundan, tahta üstünde veya ilk açılışta kısa `.ol-tutorial-tip` şeridi (*"1. tık: × ele · 2. tık: Meyve koy · Sürükle: Hızlı ×"*) gösterilebilir (10×10'da gösterilmez, dikey bütçe korunur).
- **Modal Sheet'ler (`play` içinden açılan):**
  - **Zafer Sheet'i:** 1–3 yıldız (`.ol-victory-stars`), süre/hata/ipucu 3'lü kutu (`.ol-victory-stats`), `"Sonraki Seviye"` (`.af-btn-primary.af-btn-block`), `"Seviyelere Dön"` (`.af-btn-secondary.af-btn-block`), ardından `16px` güvenli boşlukla (`.ol-ad-safe-zone`) `data-ad-slot="victory-banner"` (`data-ad-type="banner"`).
  - **Kurallar & Meyve Rehberi Sheet'i:** 4 görsel kural + 10 meyvenin renkli `.ol-fruit-chip` listesi (`.ol-fruit-legend`).
  - **Ödüllü İpucu Sheet'i:** 2 ücretsiz ipucu tükendiğinde açılır; `"+1 İpucu Al"` aksiyonu ve `"Vazgeç"` butonu içerir.

---

## 4. Kesin `AdSlot` Haritası & 16px Güvenli Mesafe Sözleşmesi

Tüm reklam yuvaları `core-engine/js/ad-manager.js` üzerinden Dual-Mode (`dev` kesikli şablon + `prod-nofill` House Ad, `CLS = 0`) çalışır:

| Ekran / Yüzey | `data-ad-slot` | `data-ad-type` | Sabit Min Yükseklik | Konum & Güvenli Boşluk Kuralı |
| :--- | :--- | :---: | :---: | :--- |
| `home` (Oyna) | `home-inline` | `inline` | `92px` | Hızlı Kurallar kartının altında; üst karttan `margin-top: 16px`, Tab Bar'dan `>= 24px` uzakta. |
| `levels` (Seviyeler) | `levels-inline` | `inline` | `92px` | 30'lu seviye ızgarasının altında; son kart satırından `margin-top: 16px` uzakta. |
| `stats` (İstatistik) | `stats-banner` | `banner` | `78px` | Görünüm & Dil ayar grubunun altında; son gruptan `margin-top: 16px` uzakta. |
| `play` (Oyun Sahnesi) | `play-banner` | `banner` | `78px` | `.ol-play-ad-zone` içinde, 4'lü araç çubuğundan **`padding-top: 16px`** kesin güvenli boşlukla ayrılmış; altta `8px + safe-bottom`. |
| `play` → Zafer Sheet | `victory-banner` | `banner` | `78px` | `.ol-victory-actions` buton grubunun altında `.ol-ad-safe-zone` (`margin-top: 16px`) içinde. |

**Kırmızı Çizgiler:**
- Hiçbir `AdSlot` bir CTA butonuna `16px`'den yakın konumlandırılmaz.
- Hiçbir `AdSlot` Tab Bar, Dynamic Island veya Home Indicator altına girmez.
- Prod no-fill / çevrimdışı modda asla boş gri kutu gösterilmez; her yuva yerelleştirilmiş House Ad kartı render eder (`.af-ad-house-cta` en az `44px` yükseklikle dokunulabilir).

---

## 5. Dokunma Hedefleri (44×44pt) & iPhone SE (375×667) Türkçe Sığma Kuralları

1. **Minimum 44×44pt Dokunma Hedefleri:**
   - Tüm `.af-btn`, `.af-nav-btn`, `.ol-help-btn`, `.af-tab-item` (`54px`), `.ol-tool-btn` (`min-height: 54px`), `.ol-filter-bar .af-segmented-btn` (`min-height: 44px`), `.af-switch` (`51×44px`), `.af-ad-house-cta` (`min-height: 44px`), `.ol-level-card` (`min-height: 112px`) ve `.af-alert-btn` (`44px`) Apple HIG `44×44pt` standardını eksiksiz sağlar.
   - 10×10 oyun tahtası hücreleri (`.ol-cell`) ekran genişliğine göre `34.6px` (SE) – `39.7px` (Pro Max) kare olarak ölçeklenir; bu ergonomiyi telafi etmek için **Drag-to-Mark (sürükleyerek `×`)**, **Auto-`×`** ve **sınırsız Geri Al** mekaniği standarttır.
2. **Türkçe Uzun Metin & Yatay Taşma Sıfır Tolerans Kuralları (`375px`):**
   - **Tab Bar (3 sekme):** `Oyna` · `Seviyeler` · `İstatistik` (max 10 karakter — sıfır kırpılma).
   - **Oyun Araç Çubuğu (4 buton, SE'de her biri ~82px):** `Geri Al` · `Oto ×` · `İpucu` (sayı köşe rozetinde `.ol-hint-count`) · `Temizle`.
   - **Seviye Filtresi (4 segment):** `Tümü` · `4–6×` · `8×8` · `10×10` (`white-space: nowrap`, `font-size: 12px` `<=390px`).
   - **Ayarlar Segmented Satırları:** Tema ve Dil seçicileri başlığın yanına sıkıştırılmaz; `.ol-setting-stack` ile başlık üstte, tam genişlik segmented kontrol altta konumlanır.
   - **Bento & Kural Kartları:** Tüm grid sütunları `minmax(0, 1fr)` kullanır; sayısal veriler `font-variant-numeric: tabular-nums` ile titreme olmadan güncellenir; Türkçe alt açıklamalar `overflow-wrap: break-word` ile güvenli satır kırar.
   - **Oyun Navbar'ı:** `grid-template-columns: auto minmax(0, 1fr) auto` sayesinde `Seviye 11 · 10×10` başlığı `< Geri` ve `00:00 + ?` arasında iPhone SE'de bile taşmadan ve gereksiz üç nokta olmadan okunur.
