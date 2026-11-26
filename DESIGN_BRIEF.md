# DESIGN BRIEF — 002: Purr Elixir ("Sunlit Lavender Apothecary")

## 1. Marka & Görsel Kimlik (Apple Guideline 4.3 — Kardeş Uygulamalardan %100 Farklı)
- **Kardeş Uygulama Kontrolü (`001-orchard-logic` / Fruitopia):** Sıcak fildişi-krem (`#FBF3E4`), kiraz mercan (`#D9383E`), koyu ceviz ahşap tahta çerçevesi.
- **Purr Elixir Özgün Kimliği:** **"Sunlit Lavender & Porcelain Apothecary"** — Aydınlık, ferah, kristal berraklığında lavanta-porselen kedi iksir atölyesi!
- **Varsayılan Tema:** **Açık Mod (Light Mode Default)** — Dark Mode opsiyonel olarak "Twilight Crystal" (`#151126`) şeklinde tam desteklenir.

## 2. Renk Sistemi (WCAG AA+ Doğrulanmış)
- **Light Mode (Varsayılan — Sunlit Porcelain):**
  - Ana Arka Plan (`--bg-grouped`): `#F3EEFF` → `#ECF6FF` yumuşak güneşli lavanta-gökyüzü gradyanı
  - Kart Yüzeyi (`--bg-card`): `#FFFFFF` (porselen parlaklık + `#DDD4F4` 3D alt dudak gölgesi)
  - Cam Navbar/Tabbar (`--bg-glass`): `rgba(245, 241, 255, 0.88)` + `backdrop-filter: blur(22px)`
  - Ana Vurgu (`--accent`): **`#7C3AED`** (Royal Lavender Violet — beyaz metinle `5.70:1` kontrast!)
  - İkincil Vurgu (`--accent-mint`): **`#0D9488`** (Mint Alchemy Teal)
  - Altın Yıldız/Ödül (`--color-gold`): `#B45309` (metin), `#F59E0B` (ikon dolgu)
  - Ana Metin (`--label-primary`): `#1E1633` (derin patlıcan-mürekkep, `15.4:1` kontrast)
  - İkincil Metin (`--label-secondary`): `#5B5175` (`6.8:1` kontrast)
- **Dark Mode (Twilight Crystal):**
  - Ana Arka Plan (`--bg-grouped`): `#151126`
  - Kart Yüzeyi (`--bg-card`): `#211B3A`
  - Ana Vurgu (`--accent`): `#A78BFA` (koyu metinle `6.9:1` kontrast)
  - İkincil Vurgu (`--accent-mint`): `#2DD4BF`

## 3. Tipografi & Dokunsal 3D Oyun Hissi
- **Başlık & Oyun Fontu:** `ui-rounded, "SF Pro Rounded", "Nunito", -apple-system, sans-serif` (sevimli yuvarlatılmış porselen/oyun estetiği)
- **Butonlar:** 3D dokunsal itme düğmeleri (`box-shadow: 0 4px 0 <lip>`, `:active` anında `translateY(3px)`), tüm tıklanabilir elemanlar kesin `>= 44×44pt`.
- **İksir Şişeleri (Signature Craft):**
  - İnce cam kenar parlaması (`rgba(255,255,255,0.85)` sol dikey ışık çizgisi), hafif oval tabanlı kristal tüp formu.
  - Sıvı katmanlarının üst yüzeyinde hafif parlak menisküs eğrisi + hareketli mikro-baloncuklar.
  - Şişe 4/4 tek renkle dolduğunda üstüne sevimli **kedi kulaklı porselen/kristal tıpa** animasyonla iner ve etrafa parıltılı yıldız konfeti saçılır!
  - Seçili şişe `translateY(-14px) scale(1.04)` ile yükselir, altına yumuşak mor parıltı gölgesi düşer; dökme sırasında hedef şişenin üstüne doğru eğilir ve iki şişe arasında parlak sıvı akış yayı görünür!

## 4. Konuşan Kedi Barı & Ekran Bütçesi (iPhone SE `375×667` + Pro Max `430×932`)
- **Üst Güvenli Alan Kuralı (Kesin):** `capacitor.config.json` içinde `contentInset: "never"`, `scrollEnabled: false`, `StatusBar: { overlaysWebView: true, style: "LIGHT" }`.
  - `Home`: Buzlu `var(--safe-top)` üst şeridi (kaydırırken saat/Dynamic Island çakışması sıfır).
  - `Play`: Navbar `padding-top: var(--safe-top)` + `48px` → Konuşan Kedi Barı (`56px` kompakt yatay şerit: solda `46px` canlı kedi SVG, sağda temiz porselen konuşma balonu) → İksir Rafı (`flex: 1`, 6–12 şişeyi otomatik 2 satırda 100% ekrana sığdırır) → 4'lü 3D Araç Çubuğu (`56px`) → `16px` güvenli boşluk → Alt Sabit `play-banner` (`78px`) + `var(--safe-bottom)`.
  - **Sıfır Kaydırma Hedefi:** 12 şişelik Büyük Usta bölümleri bile iPhone SE (`375×667`) dahil tek ekrana kaydırmasız, ferah ve parmakla hatasız seçilebilir şekilde sığar!
