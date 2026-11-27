# SPEC — 002: Purr Elixir (Kedili İksir Sıralama Bulmacası)

- **Uygulama ID / Slug:** `002-purr-elixir`
- **Uygulama Adı (EN):** `Purr Elixir: Cat Potion Sort`
- **Uygulama Adı (TR):** `Purr Elixir: Kedili İksir`
- **Bundle ID:** `com.erdem.purrelixir`
- **Veritabanı (SQLite):** `purr_elixir_db` (Gerçek `@capacitor-community/sqlite` + WASM `sql.js`, sıfır mock veri)
- **Teknoloji:** Capacitor 6 + Vanilla HTML/CSS/JS (`core-engine/`), Offline-First, Çift Dilli EN + TR, Prosedürel Web Audio Müzik & Dökme Efektleri
- **Monetizasyon:** Google AdMob (Dual-Mode `AdSlot`: Dev Blueprint + Prod No-Fill House Ad; Alt `Banner` + Kademeli Bölüm Geçişi `Interstitial` + Opt-in `Rewarded Interstitial` [`+1 Boş Şişe` & `+1 Akıllı BFS İpucu`]; v1.0.0'da IAP kapalı)

---

## 1. Oyun Konsepti & Çekirdek Mekanik

**Purr Elixir**, aydınlık lavanta-porselen bir kedi iksir atölyesinde geçen, konuşkan ve tepkisel kedilerle etkileşimli **kristal iksir sıralama (Water Sort) bulmaca oyunudur**.

### Sıralama Kuralları
1. Her kristal iksir şişesi maksimum **4 birim** iksir alır (`capacity = 4`).
2. Bir şişeye dokunulduğunda şişe hafifçe yukarı kalkar ve seçilir; ikinci bir şişeye dokunulduğunda:
   - Hedef şişe **boşsa** veya üst rengi **aynıysa** VE yer varsa, üstteki ardışık eşleşen tüm birimler akıcı bir parlayan sıvı yayıyla hedef şişeye dökülür.
   - Tek renkten oluşan (saf) bir şişeyi boş şişeye dökmek gibi anlamsız hamlelere izin verilmez (oyuncu dostu koruma).
   - Seçili şişeye tekrar dokunmak seçimi bırakır; geçersiz bir hedef yerine başka dökülebilir bir şişeye dokunmak seçimi pürüzsüzce ona geçirir.
3. **Şişe Tamamlama (Seal & Celebrate):** Bir şişe 4 birim aynı renkle dolduğunda kedi kulaklı kristal mantar tıpa **"pop!"** sesiyle kapanır, parıltı konfeti patlar ve üstteki kedi sevincini gösterir.
4. **Kazanma:** Tüm renkli iksirler kendi saf şişelerinde toplandığında bölüm tamamlanır.
5. **Kilitlenme (Deadlock) Koruması:** Hiç geçerli hamle kalmadığında motor bunu anında algılar; kedi konuşma balonuyla oyuncuyu bilgilendirir ve tek dokunuşla **Geri Al** veya **+1 Boş Şişe (Ödüllü Geçiş)** seçeneği sunar.

### 10 Parlak, Yüksek Kontrastlı İksir Rengi + Renk Körlüğü Sembolleri (`elixir_id`: `0..9`)
| ID | Slug | EN Adı | TR Adı | Ana Renk | Sembol |
| :-: | :--- | :--- | :--- | :---: | :-: |
| 0 | `berry` | Berry Starlight | Çilek Yıldızı | `#E11D6D` | ★ |
| 1 | `sky` | Sky Sapphire | Gök Safiri | `#0284C7` | 💧 |
| 2 | `sun` | Sun Mango | Güneş Mangosu | `#F59E0B` | ☀ |
| 3 | `mint` | Mint Moon | Nane Ayı | `#0D9488` | ☾ |
| 4 | `lavender` | Lavender Dream | Lavanta Düşü | `#7C3AED` | ✦ |
| 5 | `peach` | Peach Blossom | Şeftali Çiçeği | `#F97316` | ❀ |
| 6 | `emerald` | Clover Elixir | Yonca İksiri | `#16A34A` | ♣ |
| 7 | `rose` | Rose Quartz | Gül Kuvarsı | `#EC4899` | ♥ |
| 8 | `indigo` | Midnight Iris | Gece İrisi | `#4338CA` | ◆ |
| 9 | `honey` | Honey Amber | Bal Kehribarı | `#B45309` | ⬡ |

*(Renk körlüğü sembolleri Ayarlar'dan açılabilir; açıkken her sıvı katmanının ortasında net beyaz mikro-sembol görünür.)*

---

## 2. İmza Mekanik: Canlı Konuşan Kedi & Ziyaretçi Müşteri Kediler

Eski sürümdeki pasif "kedi sevme" yerine **oynanışla organik konuşan ve tepki veren kedi sistemi**:
- **Oyun Ekranı Üst Kedi Tezgahı (Compact Stage Companion Bar):**
  - Seçili aktif kedi (varsayılan: **Mochi**) animasyonlu vektör portresiyle (nefes alma, göz kırpma, kulak oynatma, sevinince zıplama) iksir rafının hemen üstünde yer alır.
  - Yanındaki temiz porselen konuşma balonu **oyuncunun gerçek hamlelerine göre canlı konuşur (EN & TR):**
    - *Bölüm başlangıcı:* Bölüm rengine/zorluğuna özel esprili açılış cümlesi.
    - *Şişe tamamlanınca:* Kedi kulakları dikilir, gözleri parlar (`"Mırr-kemmel! Bir Çilek Yıldızı daha mühürlendi!"`).
    - *Kombo (`×2`, `×3`, `×4+`):* Ardışık verimli hamlelerde yükselen arpej + coşkulu kedi tepkisi.
    - *Geri Al / Yeniden Başlat:* Motive edici kısa yorum.
    - *Kilitlenme veya 12 sn tereddüt:* Nazikçe `+1 Boş Şişe` veya `Akıllı İpucu` önerisi.
    - *Kediye dokunulduğunda:* Küçük şirin miyav/mırlama + rastgele esprili iksir sözü (oyunu bölmeden!).
- **6 Açılabilir Ziyaretçi Müşteri Kedi (Gerçek SQLite `cat_companions` Tablosu):**
  1. **Mochi** — Lavanta Çırak Kedi *(Başlangıçta açık, Favori: Lavanta Düşü)*
  2. **Tarçın (Biscuit)** — Güneşli Tekir *(Bölüm 3'te açılır, Favori: Güneş Mangosu)*
  3. **Gece (Luna)** — Safir Smokin *(Bölüm 8'de açılır, Favori: Gök Safiri)*
  4. **Bulut (Cloud)** — Nane İran Kedisi *(Bölüm 15'te açılır, Favori: Nane Ayı)*
  5. **Lokum (Matcha)** — Üç Renkli Aktar *(Bölüm 25'te açılır, Favori: Yonca İksiri)*
  6. **Pamuk (Cleo)** — Yıldız Kraliyet Kedisi *(Bölüm 40'ta açılır, Favori: Çilek Yıldızı)*
- **Bölüm Bitimi Müşteri Teslimatı:** Bölüm tamamlandığında reklamsız Zafer Sheet'inde o günün/bölümün ziyaretçi kedisi iksirini teslim alıp özel teşekkür repliğini söyler; yeni kedi kilidi açıldıysa özel kutlama rozeti görünür. Oyuncu **Kediler / Dükkan** ekranından istediği açık kediyi **Aktif Konuşan Asistanı** seçebilir (her kedinin kendine özgü diyalog tonu vardır!).

---

## 3. Seviye Eğrisi & Oyun Modları (Tamamı BFS Doğrulamalı, %100 Çözülebilir)

Tüm bölümler gerçek BFS çözücü (`solvable === true`, gerçek `optimal_moves` & `par_moves`) ile doğrulanıp `database/seed.sql` içine yazılır:
- **60 Kampanya Bölümü (`levels` tablosu):**
  - **Bölüm 1–5 (Starter / Kolay):** 3–4 renk + 2 boş şişe (hızlı ısınma, her 3 bölümde 1 geçiş reklamı)
  - **Bölüm 6–15 (Apprentice / Çırak):** 5 renk + 2 boş şişe
  - **Bölüm 16–30 (Alchemist / Simyacı):** 6–7 renk + 2 boş şişe
  - **Bölüm 31–45 (Master / Usta):** 8 renk + 2 boş şişe
  - **Bölüm 46–60 (Grandmaster / Büyük Usta):** 9–10 renk + 2 boş şişe
- **60 Günlük Özel Sipariş (Daily Brew):** Tarihe göre deterministik dönen 60 doğrulanmış 6–7 renkli özel iksir siparişi + **Günlük Seri (Streak)** takibi.
- **Cihaz İçi Sonsuz Mod (Endless Alchemy):** `Kolay (5 Renk)` / `Orta (7 Renk)` / `Usta (9 Renk)` — anında cihaz içinde BFS doğrulamalı benzersiz seviye üretir ve `endless_runs` tablosuna kaydeder.

---

## 4. Navigasyon Arketipi & Ekranlar (iPhone Safe-Area Garantili)

3 Sekmeli iOS Alt Tab Bar + Tam Odaklı Push Oyun Ekranı (`hideTabBar: true`):
1. **`home` (Dükkan / Play Tab):**
   - Buzlu iOS safe-area üst şeridi (Dynamic Island / Çentik altında kaydırırken saat/pil çakışması sıfır)
   - Parlak 3D Purr Elixir logosu + Aktif Kedi selamlama balonu + Ses/Kurallar butonları
   - Kompakt Canlı HUD Şeridi (`★ Yıldızlar · ✓ Bölümler · 🐾 Kediler · 🔥 Seri`)
   - 3D Ana Kampanya Kartı (kaldığın bölüm + canlı mini iksir şişesi önizlemesi + "Oyna" 3D butonu)
   - Günlük Özel Sipariş (Daily Brew) kartı
   - Ziyaretçi Kediler şeridi (açık kediler renkli, kilitliler kaçıncı bölümde açılacağını gösterir; tıklayınca aktif kedi değiştirilir veya detay açılır!)
   - `AdSlot` (`home-inline`, `data-ad-type="inline"`)
2. **`levels` (Bölümler & Sonsuz Mod / Levels Tab):**
   - Mor-altın **Sonsuz Simya (Endless)** portal kartı (`5 / 7 / 9 Renk` hızlı başlatma)
   - Filtre barı (`Tümü`, `Kolay`, `Orta`, `Usta`, `Büyük Usta`) + 60 bölüm madalyon ızgarası (yıldızlar, en iyi hamle, kilitli kedi ödülü rozetleri!)
   - Liste altında `AdSlot` (`levels-inline`, `data-ad-type="inline"`)
3. **`stats` (Kediler & İstatistik / Cats & Stats Tab):**
   - **6 Ziyaretçi Kedi Koleksiyon Kartı** (hangi kedi aktif asistanın olsun seçimi, kişilik & favori iksiri, kilit açma hedefi)
   - 4'lü İstatistik Bento Özeti (Çözülen Bölüm, Günlük Seri, Toplam Mühürlenen Şişe, Sonsuz Mod Rekoru)
   - Oyun & Erişilebilirlik Tercihleri (Müzik, Ses Efektleri, Titreşim, Kedi Konuşma Balonları, Renk Körlüğü Sembolleri, Görünüm: Açık/Koyu/Sistem [Varsayılan: Açık], Dil: EN/TR)
   - Onaylı "İlerlemeyi Sıfırla" + Yerel Gizlilik Bildirimi + `AdSlot` (`stats-banner`, `data-ad-type="banner"`)
4. **`play` (Tam Odak Oyun Ekranı — Push, Tab Bar Gizli):**
   - Üst iOS Navbar (`padding-top: var(--safe-top)`): Geri, 2 satırlı ortalanmış Başlık (`Bölüm 12 · 6 Renk`) + Hamle/Par göstergesi, Müzik + Kurallar (`?`)
   - **Kompakt Konuşan Kedi Barı** (sol: animasyonlu aktif kedi SVG; sağ: tek/çift satır sabit yükseklikli porselen konuşma balonu + kombo rozeti — CLS = 0)
   - **Parlak Kristal İksir Rafı** (4–12 şişeyi iPhone SE `375×667` ve iPhone 16 Pro Max `430×932` ekranlarına sıfır kaydırmayla sığdıran 1 veya 2 satırlı akıllı ızgara; gerçek eğilme + akış yayı animasyonu + kapak kapanma efekti)
   - **4'lü 3D Oyun Araç Çubuğu** (`Geri Al`, `+1 Şişe` [Ödüllü Geçiş], `İpucu (2)` [BFS en kısa yol vurgusu + 0 olunca Ödüllü Geçiş], `Yeniden`) — **Seviye bitince anında kilitlenir/gizlenir, yerine Zafer sonrası eylem barı (`Tekrar / Paylaş / Sonraki`) gelir!**
   - **16px güvenli boşluk + Alt Sabit Banner `AdSlot` (`play-banner`, `data-ad-type="banner"`)**

---

## 5. Reklam & AdMob Akışı (Politika Uyumlu & Tam Çalışır)

- **Alt Banner:** Tüm sekmelerde ve oyun ekranında (`margin: 56` tab bar varken, `margin: 0` oyun ekranında); modal/zafer ekranı açılınca `hideBanner()`, kapanınca `resumeBanner()`.
- **Kademeli Bölüm Geçişi (`Interstitial`):**
  - Kolay başlangıç bölümleri (**Bölüm 1–5**): **Her 3 tamamlamada 1** (`player_prefs.simple_ad_counter` üzerinden SQLite'ta kalıcı).
  - İleri bölümler (**Bölüm 6+**, Günlük & Sonsuz): **Her geçişte 1** (hızlı çözülen 4–5 renkli bölümlerde minimum 45 sn tempo koruması).
  - Zafer kutlama ekranında **0 reklam**.
- **Ödüllü Geçiş (`Rewarded Interstitial` — `prepareRewardInterstitialAd` / `showRewardInterstitialAd`):**
  - **`+1 Boş Şişe`:** Mevcut bölüme anında 1 yeni boş kristal şişe ekler (bölüm başına en fazla 2 kez). Şeffaf onay sheet'i (`"Reklam İzle · +1 Boş Şişe"`).
  - **`+1 Akıllı İpucu`:** Bölüm başına 2 ücretsiz BFS ipucundan sonra açılır (`"Reklam İzle · +1 İpucu"`). Kullanıcı erken kapatırsa ödül verilmez, uygulama donmaz.

---

## 6. Gerçek SQLite Veritabanı Şeması (`database/tables.sql`)

Tüm seed verileri idempotent `ON CONFLICT(...) DO UPDATE` / `INSERT OR IGNORE` kullanır (şema yükseltmelerinde `ON DELETE CASCADE` veri kaybı riski sıfır!):
- `elixir_catalog` (10 iksir rengi, EN/TR isimler, hex, sembol)
- `cat_companions` (6 kedi, EN/TR isim/unvan/kişilik, `unlock_level`, `favorite_elixir_id`)
- `levels` (60 kampanya + 60 günlük = 120 BFS doğrulamalı bölüm, `bottles_json`, `par_moves`, `optimal_moves`, `color_count`, `empty_count`, `tier`)
- `level_progress` (`level_id`, `status`, `bottles_state_json`, `moves_count`, `best_moves`, `extra_flasks_used`, `hints_used`, `free_hints_left`, `stars`, `completed_at`, `updated_at`)
- `daily_completions` (`day_key`, `level_id`, `moves_count`, `hints_used`, `completed_at`)
- `endless_runs` (`id`, `difficulty`, `color_count`, `moves_count`, `bottles_sealed`, `completed_at`)
- `player_prefs` (`key`, `value` — `active_cat_id`, `music_enabled`, `sfx_enabled`, `haptics_enabled`, `cat_talk_enabled`, `colorblind_symbols`, `simple_ad_counter`, `total_bottles_sealed`, `last_played_level_id`)

---

## 7. Apple App Review (4.2 / 4.3 / 2.1 / 5.1) Güvenlik Planı
- **Guideline 4.3 (Farklılaşma):** Fruitopia'nın sıcak krem/kırmızı/ahşap ızgara görünümünden tamamen farklı: **Aydınlık Lavanta-Porselen (`#F3EEFF` / `#7C3AED` / `#0D9488`)**, parlayan cam şişeler, sıvı dökme animasyonu ve konuşan kedi barı.
- **Guideline 4.2:** 120 BFS doğrulamalı bölüm + cihaz içi Sonsuz Mod + 6 etkileşimli kedi + prosedürel Web Audio müzik/dökme sesleri + %100 offline Capacitor `www/` paketi.
- **Guideline 5.1:** %100 cihaz içi SQLite, ATT + UMP + SKAdNetwork, şeffaf Privacy Policy & Support HTML.
