const fs = require('node:fs');
const path = require('node:path');
const { test, expect } = require('@playwright/test');

const routerPath = path.resolve(__dirname, '..', 'js', 'router.js');
const screenshotDir = path.resolve(__dirname, 'screenshots');
function routesFromRouter() {
  const source = fs.readFileSync(routerPath, 'utf8');
  const match = source.match(/var routedModules = \[(.*?)\];/s);
  if (!match) throw new Error('Could not find routedModules registry in router.js');
  return [...match[1].matchAll(/['"]([^'"]+)['"]/g)].map((item) => item[1]);
}

const routes = routesFromRouter();
const quickRoutes = new Set([
  'dashboard',
  'root-dictionary',
  'learn/paleo-trainer',
  'pipelines',
  'club',
  'workbench',
  'scripture-reader',
  'researches',
  'cartography'
]);
const routesToCheck = process.env.SMOKE_QUICK === '1' ? routes.filter((route) => quickRoutes.has(route)) : routes;

function routeFileName(route) {
  return route.replace(/[^a-z0-9а-яё]+/gi, '-').replace(/^-|-$/g, '') || 'dashboard';
}

async function checkRoute(page, route, projectName) {
  const errors = [];
  page.on('console', (message) => {
    if (message.type() === 'error' && !message.text().startsWith('Failed to load resource:')) errors.push(`console: ${message.text()}`);
  });
  page.on('pageerror', (error) => errors.push(`pageerror: ${error.message}`));
  await page.goto(`/#${route}`, { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#labContent')).toBeVisible();
  const metrics = await page.evaluate(() => ({
    innerWidth: window.innerWidth,
    scrollWidth: document.documentElement.scrollWidth
  }));
  const hasMojibake = await page.locator('#labContent').evaluate((content) => {
    const walker = document.createTreeWalker(content, NodeFilter.SHOW_TEXT);
    let inspected = 0;
    while (walker.nextNode() && inspected++ < 500) {
      if (/РѕР|Ð|â€”/.test(walker.currentNode.nodeValue || '')) return true;
    }
    return false;
  }, { timeout: 5_000 });
  expect(errors, `uncaught errors on #${route}`).toEqual([]);
  expect(hasMojibake, `mojibake on #${route}`).toBe(false);
  if (projectName === 'mobile') expect(metrics.scrollWidth, `horizontal overflow on #${route}`).toBeLessThanOrEqual(metrics.innerWidth);
  if (process.env.SMOKE_QUICK === '1') return;
  await page.addStyleTag({ content: '* { animation: none !important; transition: none !important; caret-color: transparent !important; }' });
  await fs.promises.mkdir(screenshotDir, { recursive: true });
  const viewport = page.viewportSize();
  const client = await page.context().newCDPSession(page);
  const screenshot = await client.send('Page.captureScreenshot', {
    format: 'png',
    clip: { x: 0, y: 0, width: viewport.width, height: viewport.height, scale: 1 }
  });
  await fs.promises.writeFile(path.join(screenshotDir, `${routeFileName(route)}-${projectName}.png`), Buffer.from(screenshot.data, 'base64'));
  await client.detach();
}

test.describe('registered routes', () => {
  for (const route of routesToCheck) {
    test(`route #${route} renders without uncaught errors`, async ({ browser }, testInfo) => {
      for (const viewport of [{ name: 'desktop', width: 1280, height: 800 }, { name: 'mobile', width: 390, height: 844 }]) {
        const context = await browser.newContext({ viewport: { width: viewport.width, height: viewport.height }, isMobile: viewport.name === 'mobile' });
        const page = await context.newPage();
        await checkRoute(page, route, viewport.name);
        await context.close();
      }
    });
  }
});

test('agent server offline shows Сервер отключен without uncaught errors', async ({ page }) => {
  const errors = [];
  await page.route('http://127.0.0.1:5000/**', (route) => route.abort());
  page.on('pageerror', (error) => errors.push(error.message));
  await page.goto('/#pipelines', { waitUntil: 'domcontentloaded' });
  await expect(page.locator('#labContent')).toBeVisible();
  await expect(page.locator('[data-pipeline-server-status]')).toHaveAttribute('data-status', /offline|error/, { timeout: 15_000 });
  await expect(page.locator('[data-pipeline-server-status]')).toContainText('Сервер отключен', { timeout: 5_000 });
  expect(errors).toEqual([]);
});

test.describe('checkers module cards', () => {
  // Поведенческая проверка: клик по карточке-модулю на #checkers меняет
  // location.hash на её маршрут. Селектор `.gc-card[href^="#"]` берёт только
  // якорные карточки — карточки-описания без собственного маршрута пропускаются.
  test('clicking a module card sets location.hash to its route', async ({ browser }) => {
    const context = await browser.newContext({ viewport: { width: 1280, height: 800 } });
    const page = await context.newPage();
    const pageErrors = [];
    page.on('pageerror', (error) => pageErrors.push(error.message));

    await page.goto('/#checkers', { waitUntil: 'domcontentloaded' });
    await page.waitForSelector('.gc-card[href^="#"]', { timeout: 20_000 });

    const cards = await page.$$eval('.gc-card[href^="#"]', (nodes) => nodes.map((node) => ({
      hash: node.getAttribute('href'),
      title: (node.querySelector('.gc-card-title') || node).textContent.trim()
    })));
    expect(cards.length, 'маршрутизируемых карточек .gc-card на #checkers').toBeGreaterThan(0);

    // Даём отложенной перерисовке модуля завершиться: router дёргает
    // handleHash повторно на load+100ms, PageController заменяет innerHTML —
    // клик, попавший в это окно, не синтезирует click-событие.
    await page.waitForTimeout(1000);

    for (const card of cards) {
      const cardSelector = `.gc-card[href="${card.hash}"]`;
      // Возврат на #checkers перед каждым кликом; на первом проходе это no-op.
      await page.evaluate(() => { window.location.hash = '#checkers'; });
      await page.waitForSelector(cardSelector, { timeout: 20_000 });

      // Клик + ожидание смены hash; один повтор на случай гонки с перерисовкой.
      let actualHash = null;
      let navigated = false;
      for (let attempt = 0; attempt < 2 && !navigated; attempt++) {
        if (attempt > 0) {
          await page.evaluate(() => { window.location.hash = '#checkers'; });
          await page.waitForSelector(cardSelector, { timeout: 20_000 });
        }
        await page.click(cardSelector);
        try {
          await expect(async () => {
            actualHash = await page.evaluate(() => window.location.hash);
            expect(actualHash).toBe(card.hash);
          }).toPass({ timeout: 4_000 });
          navigated = true;
        } catch (error) {
          if (attempt === 1) {
            throw new Error(`Карточка «${card.title}»: ожидался hash ${card.hash}, фактически ${actualHash} (после повтора)`);
          }
        }
      }
    }

    expect(pageErrors, 'uncaught errors при навигации по карточкам #checkers').toEqual([]);
    await context.close();
  });
});