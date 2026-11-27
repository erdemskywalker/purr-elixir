export async function runE2E({ page, appUrl }) {
  await page.goto(`${appUrl}?lang=en&theme=light&adMode=prod-nofill&ephemeralDb=1`, { waitUntil: 'networkidle' });
  await page.waitForFunction(() => Boolean(window.AppFactory && window.AppFactory.ready));

  // Verify initial seeded SQLite records
  const initialCount = await page.locator('.af-list-row').count();
  if (initialCount < 4) throw new Error(`Expected >= 4 seeded SQLite rows, got ${initialCount}`);

  // Insert a new real SQLite record through iOS Sheet Modal
  await page.click('#btn-open-add-sheet');
  await page.fill('#smoke-note-input', 'Playwright SQLite Insert Verified');
  await page.click('#smoke-add-form button[type="submit"]');
  await page.waitForTimeout(250);

  const afterInsertCount = await page.locator('.af-list-row').count();
  if (afterInsertCount !== initialCount + 1) {
    throw new Error(`Expected ${initialCount + 1} rows after SQLite insert, got ${afterInsertCount}`);
  }

  // Switch tab to Settings and switch language EN -> TR
  await page.click('[data-tab-route="settings"]');
  await page.waitForTimeout(150);
  await page.click('[data-lang-val="tr"]');
  await page.waitForTimeout(150);

  const titleTr = await page.locator('.af-large-title').textContent();
  if (titleTr?.trim() !== 'Ayarlar') {
    throw new Error(`Expected Turkish settings title "Ayarlar", got "${titleTr}"`);
  }

  return { ok: true, initialCount, afterInsertCount, titleTr };
}
