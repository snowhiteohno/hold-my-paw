const { chromium } = require('playwright');
const assert = require('node:assert/strict');
const fs = require('node:fs');
(async () => {
  const { LEVELS } = await import('../src/levels.ts');
  const best = Object.fromEntries(LEVELS.map((level, i) => [i, { stars: 3, lights: level.lights.length, time: 100 }]));
  const browser = await chromium.launch();
  try {
    fs.mkdirSync('artifacts', { recursive: true });
    for (const width of [1440, 390, 320]) {
      const page = await browser.newPage({ viewport: { width, height: 1000 }, hasTouch: width < 600, reducedMotion: 'reduce' });
      const errors = []; page.on('pageerror', e => errors.push(e.message));
      await page.addInitScript(save => localStorage.setItem('hold-my-paw-v1', JSON.stringify(save)), { unlocked: 3, best });
      await page.goto(process.env.GAME_URL || 'http://localhost:4175');
      await page.getByRole('button', { name: 'Visit the secret picnic' }).click();
      await page.getByRole('heading', { name: 'A little picnic, at last.' }).waitFor();
      assert.equal(await page.getByRole('button', { name: 'Save our picnic postcard' }).count(), 0);
      await page.getByRole('button', { name: 'Choose strawberry mochi' }).click();
      await page.getByRole('button', { name: 'Give Boba a snack' }).click();
      assert((await page.getByRole('status').innerText()).includes('That treat is for Mochi'));
      await page.screenshot({ path: `artifacts/picnic-${width}.png`, fullPage: true });
      const pairs = [['Mochi', 'strawberry mochi'], ['Pippin', 'berry skewer'], ['Boba', 'leaf sandwich'], ['Puff', 'sunflower biscuit']];
      for (const [friend, snack] of pairs) {
        const choice = page.getByRole('button', { name: `Choose ${snack}` });
        await choice.focus(); await page.keyboard.press('Enter');
        const target = page.getByRole('button', { name: `Give ${friend} a snack` });
        if (width < 600) await target.tap(); else await target.click();
        assert(await target.isDisabled());
      }
      await page.getByRole('heading', { name: 'A full heart. A full picnic.' }).waitFor();
      const [download] = await Promise.all([page.waitForEvent('download'), page.getByRole('button', { name: 'Save our picnic postcard' }).click()]);
      assert.equal(download.suggestedFilename(), 'hold-my-paw-secret-picnic.png');
      await download.saveAs(`artifacts/picnic-postcard-${width}.png`);
      assert(await page.evaluate(() => document.documentElement.scrollWidth <= innerWidth));
      await page.getByRole('button', { name: 'Back to the meadow' }).click();
      await page.getByRole('button', { name: 'One more adventure?' }).click();
      await page.getByRole('dialog', { name: 'Chapter 1 introduction', exact: true }).waitFor();
      assert.deepEqual(errors, []);
      await page.close();
    }
    const locked = await browser.newPage();
    await locked.addInitScript(() => localStorage.setItem('hold-my-paw-v1', JSON.stringify({ unlocked: 3, best: {} })));
    await locked.goto(process.env.GAME_URL || 'http://localhost:4175');
    assert.equal(await locked.getByRole('button', { name: 'Visit the secret picnic' }).count(), 0);
    assert(await locked.getByRole('button', { name: 'Save our adventure postcard' }).isVisible());
    console.log('PASS picnic unlock, wrong snack, four treats, keyboard access, postcard download, mobile layout, normal replay');
  } finally { await browser.close(); }
})().catch(e => { console.error(e); process.exitCode = 1; });
