import { chromium } from 'playwright';

(async () => {
  const browser = await chromium.launch({ headless: true });
  const context = await browser.newContext({
    userAgent: 'Mozilla/5.0 (iPhone; CPU iPhone OS 15_0 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/15.0 Mobile/15E148 Safari/604.1'
  });
  const page = await context.newPage();
  
  // Log all network requests to see if an API is called
  page.on('request', request => {
    if (request.url().includes('search') || request.url().includes('music') || request.url().includes('api')) {
      console.log('Request:', request.url());
    }
  });

  await page.goto('https://zxcprime.icu/music', { waitUntil: 'networkidle' });
  console.log('Navigated to music page. Current URL:', page.url());
  
  // Wait for the bottom nav "Search" button (it usually has an href or icon)
  // Let's just look at the DOM
  const html = await page.content();
  const fs = require('fs');
  fs.writeFileSync('zxc_mobile_home.html', html);
  console.log('Saved HTML to zxc_mobile_home.html');

  await browser.close();
})();
