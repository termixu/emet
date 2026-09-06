const { chromium } = require('playwright');

(async () => {
  const browser = await chromium.launch({
    headless: true,
    executablePath: 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
  });
  const page = await browser.newPage();
  const cdp = await page.context().newCDPSession(page);
  await cdp.send('Network.enable');
  await cdp.send('Network.emulateNetworkConditions', {
    offline: false,
    latency: 250,
    downloadThroughput: 600 * 1024,
    uploadThroughput: 256 * 1024
  });

  const errors = [];
  page.on('pageerror', (e) => errors.push(e.message));
  page.on('console', (m) => { if (m.type() === 'error') errors.push(m.text().slice(0, 160)); });

  const t0 = Date.now();
  try {
    await page.goto('https://ortamy.github.io/golem/apps/researchlab/', { waitUntil: 'load', timeout: 120000 });
  } catch (e) { errors.push('goto: ' + e.message); }
  await page.waitForTimeout(2000);

  const report = await page.evaluate(() => {
    const n = performance.getEntriesByType('navigation')[0] || {};
    const res = performance.getEntriesByType('resource');
    return {
      dcl: Math.round(n.domContentLoadedEventEnd || 0),
      load: Math.round(n.loadEventEnd || 0),
      bytes: Math.round(res.reduce((s, r) => s + (r.transferSize || 0), 0) / 1024),
      requests: res.length,
      dashboard: !!document.getElementById('dashboard-widgets'),
      interactive: document.readyState
    };
  });
  console.log(JSON.stringify({ wall: Date.now() - t0, report, errors }, null, 1));
  await browser.close();
})().catch((e) => { console.error('FATAL', e); process.exit(1); });
