-- Factory Smoke Test App — Real Seed Data (Zero Mock Data)
INSERT OR IGNORE INTO engine_checks (code, title_en, title_tr, detail_en, detail_tr, is_verified) VALUES
  ('sqlite-wasm', 'Real SQLite Engine', 'Gerçek SQLite Motoru', 'Loaded via sql.js WASM from database/tables.sql', 'database/tables.sql dosyasından sql.js WASM ile yüklendi', 1),
  ('ios-hig', 'Apple HIG Shell', 'Apple HIG Kabuğu', 'Large title, frosted tab bar, 44pt targets & safe-area', 'Büyük başlık, buzlu cam tab bar, 44pt hedefler', 1),
  ('dual-admob', 'Dual-Mode AdSlot', 'Çift Modlu AdSlot', 'Dev blueprint slot & Apple-safe prod House Ad (CLS=0)', 'Dev şablon yuvası ve Apple uyumlu House Ad (CLS=0)', 1),
  ('bilingual', 'Bilingual EN + TR', 'Çift Dilli EN + TR', 'Automatic device language detection with parity checks', 'Otomatik cihaz dili ve anahtar eşlik kontrolü', 1);
