import { SCRAPING_CONFIG } from './config.js';

const isDevelopment = process.env.NODE_ENV === 'development';

export async function setupBrowser() {
  let browser;

  if (isDevelopment) {
    console.log('[Scraper] Launching browser in DEVELOPMENT mode...');

    const puppeteer = await import('puppeteer-core');

    // Se Chrome não existir: npx playwright install chromium
    const chromiumPath =
      process.platform === 'darwin'
        ? '/Applications/Google Chrome.app/Contents/MacOS/Google Chrome'
        : process.platform === 'win32'
          ? 'C:\\Program Files\\Google\\Chrome\\Application\\chrome.exe'
          : '/usr/bin/google-chrome';

    browser = await puppeteer.default.launch({
      executablePath: chromiumPath,
      ...SCRAPING_CONFIG.puppeteer,
    });
  } else {
    console.log(
      '[Scraper] Launching browser in PRODUCTION mode (AWS Lambda)...'
    );

    const chromium = await import('chrome-aws-lambda');
    const puppeteer = await import('puppeteer-core');

    browser = await puppeteer.default.launch({
      executablePath: await chromium.default.executablePath,
      args: chromium.default.args,
      ...SCRAPING_CONFIG.puppeteer,
    });
  }

  console.log('[Scraper] Browser launched successfully');
  return browser;
}

export async function createPage(browser) {
  const page = await browser.newPage();

  await page.setViewport(SCRAPING_CONFIG.puppeteer.defaultViewport);

  await page.setRequestInterception(true);
  page.on('request', request => {
    const resourceType = request.resourceType();

    // Bloqueia imagens/fontes/media mas NÃO stylesheet (afeta visibilidade do menu)
    if (['image', 'font', 'media'].includes(resourceType)) {
      request.abort();
    } else {
      request.continue();
    }
  });

  await page.setUserAgent(
    'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36'
  );

  await page.setExtraHTTPHeaders({
    'Accept-Language': 'en-US,en;q=0.9,pt-BR;q=0.8,pt;q=0.7',
    Accept:
      'text/html,application/xhtml+xml,application/xml;q=0.9,image/webp,*/*;q=0.8',
  });

  return page;
}

export async function navigateToUrl(page, url, options = {}) {
  const maxRetries = options.retries || 2;
  const timeout = options.timeout || SCRAPING_CONFIG.pageTimeout;

  let lastError;

  for (let attempt = 1; attempt <= maxRetries; attempt++) {
    try {
      console.log(
        `[Scraper] Navigating to ${url} (attempt ${attempt}/${maxRetries})...`
      );

      const response = await page.goto(url, {
        waitUntil: 'networkidle2',
        timeout,
      });

      console.log(`[Scraper] Successfully loaded ${url}`);
      return response;
    } catch (error) {
      lastError = error;
      console.error(
        `[Scraper] Error navigating to ${url} (attempt ${attempt}):`,
        error.message
      );

      if (attempt < maxRetries) {
        await new Promise(resolve => setTimeout(resolve, 2000));
      }
    }
  }

  throw lastError;
}

export function wait(ms) {
  return new Promise(resolve => setTimeout(resolve, ms));
}
