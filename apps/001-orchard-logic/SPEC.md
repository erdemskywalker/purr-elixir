# SPEC — 001: Orchard Logic (Meyve Bahçesi Sudokusu)

- **Uygulama ID / Slug:** `001-orchard-logic`
- **Uygulama Adı:** Orchard Logic (TR: *Orchard Logic — Meyve Sudokusu*)
- **Bundle ID:** `com.erdem.orchardlogic`
- **Teknoloji:** Capacitor + Vanilla HTML/CSS/JS (`core-engine/`), Offline-First Gerçek SQLite (`@capacitor-community/sqlite` + WASM `sql.js`), Çift Dilli EN + TR
- **Monetizasyon:** AdMob (Dual-Mode `AdSlot`: Dev Blueprint + Prod No-Fill House Ad, Banner + Inline + Opsiyonel Ödüllü İpucu kancası; IAP kapalı)

---

## 1. Oyun Kuralları & Çekirdek Mantık

Bir `N × N` tahta, `N` adet bağlantılı renk bölgesine ayrılır. Oyuncunun amacı her bölgeye **tam olarak 1 meyve** yerleştirmektir:
1. **Satır Kuralı:** Her satırda tam olarak **1 meyve** bulunur.
2. **Sütun Kuralı:** Her sütunda tam olarak **1 meyve** bulunur.
3. **Renk Bölgesi Kuralı:** Her renk bölgesinde tam olarak **1 meyve** bulunur (her rengin kendine özel vektörel SVG meyvesi vardır).
4. **Çapraz / Komşuluk Kuralı:** İki meyve birbirine **1 blok çaprazdan (veya yatay/dikeyden) dokunamaz** (`|r1 - r2| <= 1 && |c1 - c2| <= 1` yasak).

### 10 Renk & Özel SVG Meyve Eşleşmesi (`color_id`: `0..9`)
| ID | Bölge Rengi | Meyve (EN) | Meyve (TR) |
| :-: | :--- | :--- | :--- |
| 0 | Kırmızı (Coral Red) | Strawberry | Çilek |
| 1 | Mor (Plum Violet) | Grape | Üzüm |
| 2 | Sarı (Sun Lemon) | Lemon | Limon |
| 3 | Yeşil (Orchard Green) | Green Apple | Yeşil Elma |
| 4 | Turuncu (Tangerine) | Orange | Portakal |
| 5 | Mavi (Berry Blue) | Blueberry | Yaban Mersini |
| 6 | Pembe (Blossom Peach) | Peach | Şeftali |
| 7 | Zümrüt/Kivi (Kiwi Mint) | Kiwi | Kivi |
| 8 | Bordo/Kiraz (Ruby Cherry) | Cherry | Kiraz |
| 9 | Altın/Kehribar (Golden Amber) | Pineapple | Ananas |

---

## 2. Etkileşim & Oynanış Özellikleri

- **3 Durumlu Akıllı Dokunuş:**
  - `1. tık` → `×` (Eleme işareti)
  - `2. tık` → Bölgenin özel SVG **Meyvesi**
  - `3. tık` → **Boş**
- **Sürükleyerek Hızlı `×` İşaretleme (Drag-to-Mark):** Parmağı boş hücreler üzerinde kaydırarak hızlıca `×` koyma (10×10 tahtalarda iOS oyun hızı için kritik).
- **Otomatik `×` Yardımcısı (Auto-X, Ayarlanabilir):** Bir meyve yerleştirildiğinde aynı satır, aynı sütun, aynı renk bölgesi ve 1 blok çaprazındaki boş hücrelere soluk otomatik `×` koyar (meyve kaldırılırsa kendi koyduğu otomatik `×`'leri geri alır).
- **Anlık Kural İhlali Göstergesi:** İki meyve çakıştığında her ikisi kırmızı nabız/çerçeve ile vurgulanır, haptic uyarı verilir ve tahtanın üstündeki ince durum şeridinde **neden** çakıştığı yazılır (*"Aynı satır" / "Aynı sütun" / "Aynı renk bölgesi" / "Çapraz temas"*).
- **Oyun Araç Çubuğu:**
  - **Geri Al (Undo)** — Sınırsız hamle yığını
  - **Temizle (Reset)** — Onaylı sıfırlama
  - **İpucu (Hint)** — Her seviyede **2 ücretsiz akıllı ipucu** (eksik bir bölgeye doğru meyveyi veya kesin elenecek hücreyi mantık açıklamasıyla gösterir). 2 ücretsiz ipucu bitince **Ödüllü Reklam / Dev Simülasyonu (+1 İpucu)** kancası açılır.
  - **Oto `×` Aç/Kapat** — Tek dokunuşlu hızlı geçiş
- **Zafer Ekranı (Sheet / Kart):** Tüm `N` meyve kurallara uygun yerleştirildiğinde otomatik tamamlanma algılanır; süre, yapılan hata/ipucu sayısına göre 1–3 yıldız hesaplanır, SQLite'a kaydedilir, kutlama animasyonu + **"Sonraki Seviye"** butonu + zafer içi `AdSlot` gösterilir.

---

## 3. Seviye Eğrisi & Oyun Modları (Tamamı Matematiksel Olarak Tek Çözümlü)

Tüm seviyeler gerçek bir backtracking çözücü (`solutionCount === 1`) ile doğrulanıp `database/seed.sql` içine yazılır:
- **Seviye 1–2:** `4 × 4` — Öğretici (Tutorial) — İlk açılışta kısa kural ipucu kartı
- **Seviye 3–4:** `5 × 5` — Başlangıç (Starter)
- **Seviye 5–6:** `6 × 6` — Isınma (Warm-Up)
- **Seviye 7–10:** `8 × 8` — Orta (Intermediate)
- **Seviye 11–30:** **`10 × 10` — Usta Meyve Bahçesi (20 farklı doğrulanmış 10×10 bulmaca!)**
- **Günlük Bulmaca (Daily Harvest 10×10):** Tarihe göre deterministik seçilen günlük 10×10 bulmaca havuzu (14 ek doğrulanmış 10×10 tahta) + **Günlük Seri (Streak)** takibi.

---

## 4. Navigasyon Arketipi & Ekranlar

3 Sekmeli iOS Alt Tab Bar + Tam Odaklı Push Oyun Ekranı:
1. **`home` (Oyna / Play Tab):**
   - Günün 10×10 Bulmacası (Daily Harvest) hero kartı (seri rozeti + durum)
   - "Kaldığın Yerden Devam Et" aktif seviye kartı (ilerleme çubuğu + tahta boyutu rozeti)
   - Hızlı kurallar özeti (4 görsel mini madde)
   - `AdSlot` (`home-inline`, `data-ad-type="inline"`)
2. **`levels` (Seviyeler / Levels Tab):**
   - Zorluk/Boyut filtresi (Segmented Control: `Tümü`, `Öğretici 4-6×`, `8×8`, `10×10`)
   - 30 seviye kartı (boyut etiketi `10×10`, tamamlanma yıldızları, en iyi süre, devam ediyor rozeti)
   - Liste altında `AdSlot` (`levels-inline`, `data-ad-type="inline"`)
3. **`stats` (İstatistik & Ayarlar / Stats Tab):**
   - 4'lü bento özet (Çözülen Seviye, Günlük Seri, En İyi 10×10 Süresi, Ortalama Süre)
   - Oyun Tercihleri (Otomatik `×`, Kural İhlali Vurgusu, Dokunsal Titreşim)
   - Görünüm (Sistem / Açık / Koyu) ve Dil (English / Türkçe)
   - `AdSlot` (`stats-banner`, `data-ad-type="banner"`)
4. **`play` (Tam Odak Oyun Ekranı — Push, Tab Bar Gizli):**
   - Üst iOS Navbar: Geri, Seviye Başlığı (`Seviye 11 · 10×10`), Kronometre + Kural Yardım (`?`) butonu
   - İnce Kural/Çakışma Durum Şeridi (sabit yükseklik — layout kayması sıfır)
   - Kare Responsive Oyun Tahtası (`4×4`–`10×10`, net bölge kalın çizgileri + özel SVG meyveler)
   - 4'lü Dokunsal Araç Çubuğu (`Geri Al`, `Oto ×`, `İpucu (2)`, `Temizle`)
   - Güvenli 16px ayırıcı boşluk + Alt Sabit Banner `AdSlot` (`play-banner`, `data-ad-type="banner"`)

*(Not: `core-engine/js/router.js` içine `hideTabBar: true` desteği eklenerek `play` ekranında Tab Bar temizce gizlenecektir.)*

---

## 5. Gerçek SQLite Veritabanı Şeması (`database/tables.sql`)

```sql
CREATE TABLE IF NOT EXISTS levels (
  id INTEGER PRIMARY KEY,
  slug TEXT UNIQUE NOT NULL,
  tier TEXT NOT NULL,            -- 'tutorial' | 'starter' | 'warmup' | 'intermediate' | 'master' | 'daily'
  grid_size INTEGER NOT NULL,    -- 4, 5, 6, 8, 10
  regions_json TEXT NOT NULL,    -- N*N array of color_id (0..N-1)
  solution_json TEXT NOT NULL,   -- N array of col index per row
  par_seconds INTEGER NOT NULL DEFAULT 120
);

CREATE TABLE IF NOT EXISTS level_progress (
  level_id INTEGER PRIMARY KEY REFERENCES levels(id) ON DELETE CASCADE,
  status TEXT NOT NULL DEFAULT 'not_started', -- 'not_started' | 'in_progress' | 'completed'
  board_state_json TEXT NOT NULL DEFAULT '[]', -- 0=empty, 1=x, 2=fruit, 3=auto_x
  elapsed_seconds INTEGER NOT NULL DEFAULT 0,
  best_seconds INTEGER,
  hints_used INTEGER NOT NULL DEFAULT 0,
  free_hints_left INTEGER NOT NULL DEFAULT 2,
  mistakes_count INTEGER NOT NULL DEFAULT 0,
  stars INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT,
  updated_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS daily_completions (
  day_key TEXT PRIMARY KEY,      -- 'YYYY-MM-DD'
  level_id INTEGER NOT NULL REFERENCES levels(id),
  elapsed_seconds INTEGER NOT NULL,
  hints_used INTEGER NOT NULL DEFAULT 0,
  completed_at TEXT NOT NULL DEFAULT (datetime('now'))
);

CREATE TABLE IF NOT EXISTS player_prefs (
  key TEXT PRIMARY KEY,
  value TEXT NOT NULL
);
```

---

## 6. Apple App Review (4.2 / 4.3 / 2.1 / 5.1) Güvenlik Planı

- **Guideline 4.2:** 30+14 = 44 adet doğrulanmış mantık bulmacası, sürükleyerek `×` işaretleme, geri alma, akıllı ipucu, istatistik ve seri sistemiyle tamamen offline zengin bir yerel oyun deneyimi.
- **Guideline 4.3:** Sıcak fildişi/espresso botanik palet (`#FAF7F2` / `#141210`) ve kiraz-mercan vurgu (`#E5484D`) ile `_smoke-test` (`#0d9488`) ve diğer uygulamalardan tamamen ayrışır.
- **Guideline 2.1 & AdMob:** Tüm 44 seviye gerçek çözücüyle doğrulanır; `AdSlot` canlı no-fill durumunda boş kutu yerine sabit yükseklikli House Ad gösterir; butonlarla en az 16px güvenli boşluk bırakılır.
- **Guideline 5.1:** Tüm veriler cihaz içi SQLite'da saklanır; AdMob ATT izni + Privacy Policy HTML eksiksiz sunulur.
