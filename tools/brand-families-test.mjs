// 化粧品のブランド検索から、系列・企業詳細・買収比較までを確かめる。
// 起動方法・BASE_URL・CHROMIUM_PATH は smoke-test.mjs と同じ。
import assert from 'node:assert/strict';
import { mkdirSync } from 'node:fs';

let pw;
try {
  pw = await import('playwright');
} catch {
  pw = await import('/opt/node22/lib/node_modules/playwright/index.mjs');
}

const BASE = process.env.BASE_URL || 'http://127.0.0.1:8765/';
const OUT = new URL('./screenshots/', import.meta.url).pathname;
mkdirSync(OUT, { recursive: true });
const browser = await pw.chromium.launch({ executablePath: process.env.CHROMIUM_PATH || undefined });
const pageErrors = [];

try {
  for (const [label, options] of [
    ['mobile', pw.devices['iPhone 13']],
    ['desktop', { viewport: { width: 1366, height: 900 } }],
  ]) {
    const context = await browser.newContext({ ...options, locale: 'ja-JP' });
    const page = await context.newPage();
    const watchErrors = (p) => {
      p.on('pageerror', (error) => pageErrors.push(`[${label}] ${error.message}`));
      p.on('console', (message) => {
        if (message.type() === 'error') pageErrors.push(`[${label}] ${message.text()}`);
      });
    };
    watchErrors(page);

    async function noOverflow(phase, p = page) {
      assert.equal(await p.evaluate(() => document.documentElement.scrollWidth > innerWidth + 1), false, `${label}: ${phase}で横にはみ出さない`);
    }

    async function expectFamily(query, parent, branch, brand) {
      await page.locator('.bf-search').fill(query);
      const cards = page.locator('.bf-card');
      assert.equal(await cards.count(), 1, `${label}: ${query}の親会社は1グループ`);
      assert.match(await cards.locator('h3').innerText(), parent, `${label}: ${query}の親会社`);
      assert.equal(await cards.locator('.bf-branch').count(), 1, `${label}: ${query}の運営会社を残す`);
      assert.match(await cards.locator('.bf-branch-head h4').innerText(), branch, `${label}: ${query}の運営会社`);
      assert.equal(await cards.locator('.bf-brand-name').count(), 1, `${label}: ${query}のブランドだけを表示`);
      assert.match(await cards.locator('.bf-brand-name').innerText(), brand, `${label}: ${query}のブランド`);
      assert.equal(await cards.locator('.bf-brand.is-match').count(), 1, `${label}: ${query}の一致を強調`);
      await noOverflow(`${query}の検索結果`);
    }

    async function expectCase(p = page) {
      await p.waitForURL((url) => url.hash === '#/cosmetics/info?case=kirin_fancl');
      await p.locator('#acq-kirin_fancl.is-focused').waitFor();
      await p.waitForFunction(() => document.activeElement?.id === 'acq-kirin_fancl');
      assert.equal(await p.locator('.acq-case.is-focused').count(), 1, `${label}: 指定の買収比較だけを強調`);
      await noOverflow('買収比較', p);
    }

    await page.goto(`${BASE}#/cosmetics/brands`);
    await page.locator('.bf-view').waitFor();
    assert.equal(await page.locator('[data-view="brands"]').getAttribute('aria-selected'), 'true', `${label}: ブランドタブを直接開ける`);
    assert.equal(await page.locator('.bf-card').count(), 6, `${label}: 6つの系列を表示`);
    assert.equal(await page.locator('.bf-search').getAttribute('type'), 'search');
    assert.equal(await page.locator('.bf-count').getAttribute('aria-live'), 'polite');
    await noOverflow('ブランド全体');
    await page.screenshot({ path: `${OUT}${label}-cosmetics-brands.png`, fullPage: true });

    await expectFamily('KATE', /花王/, /カネボウ/, /KATE/);
    await expectFamily('けいと', /花王/, /カネボウ/, /KATE/);
    await expectFamily('ＫＡＴＥ', /花王/, /カネボウ/, /KATE/);
    await expectFamily('THREE', /ポーラ.*オルビス/, /ACRO/, /THREE/);
    await expectFamily('アテニア', /キリン/, /ファンケル/, /アテニア/);

    await page.locator('.bf-search').fill('該当しないブランドxyz987');
    await page.locator('.bf-empty').waitFor();
    assert.equal(await page.locator('.bf-card').count(), 0, `${label}: 空結果に古いカードを残さない`);
    await noOverflow('空の検索結果');
    await page.locator('[data-bf-clear]').click();
    assert.equal(await page.locator('.bf-search').inputValue(), '');
    assert.equal(await page.locator('.bf-family-filter').inputValue(), '');
    assert.equal(await page.locator('.bf-card').count(), 6, `${label}: 条件クリアで全系列に戻る`);

    const kirinFamily = await page.locator('.bf-family-filter option').evaluateAll((options) => options.find((option) => option.textContent.includes('キリン'))?.value);
    assert.ok(kirinFamily, `${label}: キリンの親会社フィルターがある`);
    await page.locator('.bf-family-filter').selectOption(kirinFamily);
    assert.equal(await page.locator('.bf-card').count(), 1, `${label}: 親会社で絞れる`);
    assert.match(await page.locator('.bf-card h3').innerText(), /キリン/);
    await page.locator('.bf-family-filter').selectOption('');
    assert.equal(await page.locator('.bf-card').count(), 6, `${label}: 親会社の絞り込みを解除できる`);

    // 再描画で入力欄が置き換わると、途中挿入時のフォーカスやカーソルが失われる。
    await page.locator('.bf-search').fill('ATE');
    await page.locator('.bf-search').evaluate((input) => {
      window.__brandSearchInput = input;
      input.focus();
      input.setSelectionRange(0, 0);
    });
    await page.keyboard.insertText('K');
    assert.deepEqual(await page.locator('.bf-search').evaluate((input) => ({
      same: input === window.__brandSearchInput,
      focused: input === document.activeElement,
      query: input.value,
      cursor: input.selectionStart,
    })), { same: true, focused: true, query: 'KATE', cursor: 1 }, `${label}: 入力欄とカーソルを保持`);
    await page.locator('.bf-search').fill('');

    const familySnapshot = () => page.locator('.bf-card').evaluateAll((cards) => cards.map((card) => ({
      parent: card.querySelector('h3').textContent,
      branches: [...card.querySelectorAll('.bf-branch-head h4')].map((heading) => heading.textContent),
      brands: [...card.querySelectorAll('.bf-brand-name')].map((name) => name.textContent),
    })));
    const fullFamilies = await familySnapshot();
    for (const region of ['world', 'jp']) {
      await page.locator(`[data-region="${region}"]`).click();
      await page.locator('.bf-view').waitFor();
      assert.deepEqual(await familySnapshot(), fullFamilies, `${label}: ${region}表示でも系列を切断しない`);
      await noOverflow(`${region}のブランド系列`);
    }

    // 同じブランド画面の企業詳細から戻る経路でも、系列フィルターを反映する。
    await expectFamily('アテニア', /キリン/, /ファンケル/, /アテニア/);
    await page.locator('.bf-company-link[data-bf-company="fancl"]').click();
    await page.locator('#sheet[aria-hidden="false"]').waitFor();
    assert.match(await page.locator('#sheetTitle').innerText(), /ファンケル/);
    await page.locator('[data-sheet-family="fancl"]').click();
    await page.locator('#sheet[aria-hidden="true"]').waitFor({ state: 'attached' });
    assert.equal(await page.locator('.bf-search').inputValue(), '', `${label}: 詳細から系列に戻ると検索語を解除`);
    assert.equal(await page.locator('.bf-family-filter').inputValue(), kirinFamily, `${label}: 詳細から該当する系列を選ぶ`);
    assert.equal(await page.locator('.bf-card').count(), 1);
    assert.match(await page.locator('.bf-card h3').innerText(), /キリン/);
    await noOverflow('企業詳細から系列に戻った画面');

    await page.locator('[data-bf-acquisition="kirin_fancl"]').click();
    await expectCase();
    await page.locator('[data-view="net"]').click();
    await page.locator('.net-svg [data-node="kirin"]').waitFor();
    await page.locator('.net-svg [data-node="kirin"]').click();
    await page.locator('[data-acquisition-case="kirin_fancl"]').first().click();
    await expectCase();

    // 新しいページでURLを直接開き、画面内の操作履歴がなくても対象比較へ移る。
    const direct = await context.newPage();
    watchErrors(direct);
    await direct.goto(`${BASE}#/cosmetics/info?case=kirin_fancl`);
    await expectCase(direct);
    await direct.close();

    assert.deepEqual(pageErrors, [], 'ブランド検索・画面移動でJavaScriptエラーが出ない');
    await context.close();
    console.log(`[${label}] brand search, family navigation and acquisition links passed`);
  }
  console.log('BRAND FAMILIES REGRESSION PASSED');
} finally {
  await browser.close();
}
