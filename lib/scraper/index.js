import { setupBrowser, createPage, navigateToUrl, wait } from './browser.js';
import { extractContent } from './content-extractor.js';
import { detectMenuLinks, isValidUrl } from './menu-detector.js';
import { analyzeWithAI } from './ai-analyzer.js';
import { SCRAPING_CONFIG, SCRAPING_ERRORS } from './config.js';

export async function scrapeWebsite(websiteUrl, options = {}) {
  const startTime = Date.now();
  let browser;

  console.log(`\n========================================`);
  console.log(`[Scraper] Starting scraping: ${websiteUrl}`);
  console.log(`========================================\n`);

  if (!isValidUrl(websiteUrl)) {
    throw new Error(SCRAPING_ERRORS.INVALID_URL.message);
  }

  let baseUrl = websiteUrl.trim();
  if (!baseUrl.startsWith('http')) {
    baseUrl = 'https://' + baseUrl;
  }
  baseUrl = baseUrl.replace(/\/$/, '');

  const pagesData = [];

  try {
    console.log('[Scraper] Step 1/5: Setting up browser...');
    browser = await setupBrowser();
    const page = await createPage(browser);

    console.log('[Scraper] Step 2/5: Scraping homepage...');

    await navigateToUrl(page, baseUrl, {
      timeout: SCRAPING_CONFIG.pageTimeout,
      retries: 2,
    });

    await wait(SCRAPING_CONFIG.networkIdleTimeout);

    const homeData = await extractContent(page);

    pagesData.push({
      url: baseUrl,
      type: 'home',
      menuText: 'Homepage',
      ...homeData,
    });

    console.log(`[Scraper] ✓ Homepage scraped (${homeData.text.length} chars)`);

    console.log('[Scraper] Step 3/5: Detecting menu links...');

    await wait(3000);

    const menuLinks = await detectMenuLinks(page, baseUrl);

    if (menuLinks.length === 0) {
      console.log(
        '[Scraper] ⚠ No menu links found, proceeding with homepage only'
      );
    }

    console.log(
      `[Scraper] Step 4/5: Scraping ${menuLinks.length} submenu pages...`
    );

    for (let i = 0; i < menuLinks.length; i++) {
      const link = menuLinks[i];

      try {
        console.log(
          `[Scraper] (${i + 1}/${menuLinks.length}) Scraping: ${link.text}...`
        );

        await navigateToUrl(page, link.href, {
          timeout: SCRAPING_CONFIG.pageTimeout,
          retries: 1,
        });

        await wait(2000);

        const pageData = await extractContent(page);

        pagesData.push({
          url: link.href,
          type: 'submenu',
          menuText: link.text,
          ...pageData,
        });

        console.log(
          `[Scraper] ✓ ${link.text} scraped (${pageData.text.length} chars)`
        );

        await wait(SCRAPING_CONFIG.delayBetweenPages);
      } catch (error) {
        console.error(
          `[Scraper] ✗ Failed to scrape ${link.href}:`,
          error.message
        );
      }
    }

    console.log('[Scraper] Step 5/5: Analyzing content with AI...');

    const analyzedData = await analyzeWithAI(pagesData, {
      model: options.aiModel,
    });

    const duration = Date.now() - startTime;

    const result = {
      website_url: baseUrl,
      scraped_at: new Date().toISOString(),
      scraping_duration_ms: duration,
      total_pages: pagesData.length,

      pages_scraped: pagesData.map(p => ({
        url: p.url,
        type: p.type,
        menuText: p.menuText,
        text: p.text.slice(0, 1000),
        metadata: p.metadata,
      })),

      ...analyzedData,

      error_log: null,
    };

    console.log(`\n========================================`);
    console.log(`[Scraper] ✓ SCRAPING COMPLETED`);
    console.log(`  Duration: ${(duration / 1000).toFixed(1)}s`);
    console.log(`  Pages: ${pagesData.length}`);
    console.log(`  Business: ${analyzedData.business_type}`);
    console.log(
      `  Products: ${analyzedData.products_or_services?.length || 0}`
    );
    console.log(`========================================\n`);

    return result;
  } catch (error) {
    console.error('[Scraper] ✗ SCRAPING FAILED:', error);

    if (pagesData.length > 0) {
      console.log('[Scraper] Returning partial data...');

      return {
        website_url: baseUrl,
        scraped_at: new Date().toISOString(),
        scraping_duration_ms: Date.now() - startTime,
        total_pages: pagesData.length,
        pages_scraped: pagesData,
        business_type: null,
        about: null,
        products_or_services: [],
        location: null,
        target_audience: null,
        key_differentials: [],
        themes_for_posts: [],
        error_log: error.message,
      };
    }

    throw error;
  } finally {
    if (browser) {
      try {
        await browser.close();
        console.log('[Scraper] Browser closed');
      } catch (e) {
        console.error('[Scraper] Error closing browser:', e.message);
      }
    }
  }
}
