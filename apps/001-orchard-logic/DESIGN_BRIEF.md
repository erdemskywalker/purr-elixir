# DESIGN BRIEF — 001: Orchard Logic ("Orchard Craft")

## 1. Görsel Kimlik & Atmosfer
- **Konsept:** **Orchard Craft** — NYT Games & Apple Arcade kalitesinde sıcak, editoryal botanik mantık bulmacası.
- **Light Mode Yüzeyleri:**
  - Zemin (`--bg-grouped`): Sıcak Fildişi Keten `#FAF7F2`
  - Kartlar (`--bg-card`): Saf Krem Beyaz `#FFFFFF`
  - Buzlu Cam Bar (`--bg-glass`): `rgba(250, 247, 242, 0.86)`
  - Ana Metin (`--label-primary`): Derin Mürekkep `#1C1917`
  - İkincil Metin (`--label-secondary`): Sıcak Taş `#635B54`
- **Dark Mode Yüzeyleri:**
  - Zemin (`--bg-grouped`): Derin Espresso `#141210`
  - Kartlar (`--bg-card`): Kavrulmuş Ceviz `#1F1C19`
  - Yükseltilmiş Yüzey (`--bg-elevated`): `#2B2622`
  - Buzlu Cam Bar (`--bg-glass`): `rgba(20, 18, 16, 0.86)`
  - Ana Metin (`--label-primary`): Sıcak Fildişi `#F7F4EF`
- **Ana Vurgu Rengi (`--accent`):**
  - Light: Kiraz Mercan `#D9383E` (WCAG AA >= 4.5:1 beyaz metinle)
  - Dark: Parlak Mercan `#FF646B` (koyu metin veya yumuşak tint ile yüksek kontrast)

## 2. 10 Renkli Bölge Paleti (Light + Dark Dengeli, Göz Yormayan Suluboya Pastel)
Her renk bölgesi hem Light hem Dark modda komşu bölgelerden kolayca ayırt edilebilir, üstündeki SVG meyve ve `×` işareti yüksek kontrastla okunabilir olacak:
| ID | Meyve | Light Bölge Dolgusu | Dark Bölge Dolgusu | Meyve Vurgu Rengi |
| :-: | :--- | :---: | :---: | :---: |
| 0 | Çilek (Strawberry) | `#FDE2E2` | `#4C2225` | `#E11D48` |
| 1 | Üzüm (Grape) | `#EDE4FA` | `#35244F` | `#7C3AED` |
| 2 | Limon (Lemon) | `#FEF5C8` | `#473D18` | `#CA8A04` |
| 3 | Yeşil Elma (Apple) | `#DCF5E0` | `#1C3F27` | `#16A34A` |
| 4 | Portakal (Orange) | `#FFE9D2` | `#4E2F17` | `#EA580C` |
| 5 | Yaban Mersini (Blueberry) | `#DCEBFE` | `#1B3152` | `#2563EB` |
| 6 | Şeftali (Peach) | `#FCE4F0` | `#4B2239` | `#DB2777` |
| 7 | Kivi (Kiwi) | `#D7F5EE` | `#173E38` | `#0D9488` |
| 8 | Kiraz (Cherry) | `#F9DFDF` | `#4A1D2B` | `#BE123C` |
| 9 | Ananas (Pineapple) | `#F7EBC9` | `#443416` | `#B45309` |

## 3. 10×10 Tahta Ergonomisi (iPhone SE 375px & Pro Max 430px)
- Tahta genişliği: `min(100%, 402px)`, tam kare `aspect-ratio: 1 / 1`, yuvarlatılmış dış çerçeve (`border-radius: 16px`, `border: 2.5px solid var(--board-border)`).
- **Bölge Sınırları:** Aynı renkteki iki bitişik hücre arası `0.5px` ince çizgi; **farklı renkteki iki bitişik hücre arası `2px` koyu net çizgi**! Böylece 10 bölge tek bakışta kristal netliğinde ayrışır.
- **Hücre İçeriği:**
  - `×` eleme işareti: Yumuşak mürekkep tonunda net çarpı (otomatik `×` hafif daha soluk, manuel `×` daha belirgin).
  - Meyve: Hücrenin %74'ünü kaplayan, ince beyaz/koyu dış konturlu yüksek netlikte özel inline SVG meyve (10×10'da 35px hücre içinde bile kristal netliğinde).
  - Çakışma: Kırmızı iç halka + hafif sallanma animasyonu.
- **Oyun Ekranı Dikey Bütçesi (iPhone SE 667px):**
  - Navbar (`48px` + `20px` safe top = `68px`)
  - Durum/Çakışma şeridi (`34px`)
  - 10×10 Tahta (`344px × 344px`)
  - 4'lü Araç Çubuğu (`56px`)
  - Güvenli boşluk (`14px`) + Alt Banner `AdSlot` (`78px`)
  - Toplam: `~594px < 667px` → **iPhone SE'de bile sıfır dikey sıkışma, sıfır scroll ihtiyacı!**

## 4. Özgünlük İmzası (Apple 4.3 Koruması)
- Sıcak kağıt/botanik atmosfer (`#FAF7F2` / `#141210`) + kiraz mercan vurgu (`#D9383E`), özel 10'lu meyve SVG kütüphanesi ve tam ekran push 10×10 bulmaca sahnesiyle tamamen özgün, bağımsız bir Apple Arcade / NYT Games kalitesi sunar.
