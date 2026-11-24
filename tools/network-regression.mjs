// つながり画面を行き来しても、操作が一度だけ実行されることを確かめる。
// 起動方法・BASE_URL・CHROMIUM_PATH は smoke-test.mjs と同じ。
import assert from 'node:assert/strict';

let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
}

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pageErrors = [];

try {
  for (const [label, options] of [
    ['mobile', pw.devices['iPhone 13']],
    ['desktop', { viewport: { width: 1366, height: 900 } }],
  ]) {
    const context = await browser.newContext({ ...options, locale: 'ja-JP' });
    const page = await context.newPage();
    page.on('pageerror', (error) => pageErrors.push(`[${label}] ${error.message}`));
    await page.goto(`${BASE}#/cosmetics/net`);
    await page.locator('.net-svg [data-node="kirin"]').waitFor();

    const checkSelectAndClear = async (id) => {
      const node = page.locator(`.net-svg [data-node="${id}"]`);
      await node.click();
      assert.equal(await node.getAttribute('aria-pressed'), 'true', `${label}: ${id}を1回押すと選択される`);
      assert.equal(await page.locator('.net-focus').count(), 1, `${label}: 選択の説明が1件出る`);
      await page.locator('[data-clear]').click();
      assert.equal(await node.getAttribute('aria-pressed'), 'false', `${label}: 解除を1回押すと選択が外れる`);
      assert.equal(await page.locator('.net-focus').count(), 0, `${label}: 解除後は選択の説明が消える`);
    };

    await checkSelectAndClear('kirin');
    await page.locator('[data-view="info"]').click();
    await page.locator('.ov').waitFor();
    await page.locator('[data-view="net"]').click();
    await page.locator('.net-svg [data-node="kirin"]').waitFor();
    await checkSelectAndClear('kirin');

    await page.locator('[data-type="deal"]').click();
    assert.equal(await page.locator('[data-type="deal"]').getAttribute('aria-pressed'), 'true');
    assert.equal(await page.locator('[data-type][aria-pressed="true"]').count(), 1, `${label}: 買収の種類だけが選ばれる`);
    assert.equal(await page.locator('.nl:not(.is-hidden):not(.t-deal)').count(), 0, `${label}: 他の種類の線は隠れる`);
    await page.locator('[data-type="deal"]').click();
    assert.equal(await page.locator('[data-type][aria-pressed="false"]').count(), 0, `${label}: 最後の種類を解除すると全種類に戻る`);

    // 再読み込みせず別業界の同じ画面へ移る。古いイベント処理の残存も検出する。
    await page.evaluate(() => { location.hash = '#/semiconductors/net'; });
    await page.locator('.net-svg [data-node="rohm"]').waitFor();
    await checkSelectAndClear('rohm');
    await page.locator('[data-rivals]').click();
    assert.equal(await page.locator('[data-rivals]').getAttribute('aria-pressed'), 'true', `${label}: 競合どうしを1回で絞れる`);
    assert.equal(await page.locator('.nl:not(.is-hidden):not(.is-rival)').count(), 0);
    await page.locator('[data-rivals]').click();
    assert.equal(await page.locator('[data-rivals]').getAttribute('aria-pressed'), 'false', `${label}: 競合どうしを1回で解除できる`);

    await page.evaluate(() => { location.hash = '#/cosmetics/net'; });
    await page.locator('.net-svg [data-node="kirin"]').waitFor();
    await checkSelectAndClear('kirin');
    assert.deepEqual(pageErrors, [], '画面移動と操作でJavaScriptエラーが出ない');
    await context.close();
    console.log(`[${label}] network navigation and controls passed`);
  }
  console.log('NETWORK REGRESSION PASSED');
} finally {
  await browser.close();
}
