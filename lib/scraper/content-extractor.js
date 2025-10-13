import { SCRAPING_CONFIG } from './config.js';

export async function extractContent(page) {
  console.log(`[Extractor] Extracting content from ${page.url()}...`);

  const data = await page.evaluate((removeSelectors) => {
    const metadata = {
      title: document.querySelector('meta[property="og:title"]')?.content ||
             document.querySelector('title')?.textContent ||
             '',
      description: document.querySelector('meta[property="og:description"]')?.content ||
                  document.querySelector('meta[name="description"]')?.content ||
                  '',
      image: document.querySelector('meta[property="og:image"]')?.content || '',
      type: document.querySelector('meta[property="og:type"]')?.content || '',
      siteName: document.querySelector('meta[property="og:site_name"]')?.content || '',
    };

    removeSelectors.forEach(selector => {
      const elements = document.querySelectorAll(selector);
      elements.forEach(el => el.remove());
    });

    const mainSelectors = [
      'main',
      'article',
      '[role="main"]',
      '.content',
      '.main-content',
      '#content',
      '#main',
      'body',
    ];

    let mainElement = null;
    for (const selector of mainSelectors) {
      mainElement = document.querySelector(selector);
      if (mainElement) break;
    }

    if (!mainElement) {
      mainElement = document.body;
    }

    let text = mainElement?.textContent || '';

    text = text
      .replace(/\s+/g, ' ')
      .replace(/\n+/g, '\n')
      .trim();

    // Limita tamanho para não exceder limite de tokens da IA
    const maxChars = 8000;
    if (text.length > maxChars) {
      text = text.slice(0, maxChars) + '...';
    }

    return { metadata, text };
  }, SCRAPING_CONFIG.removeSelectors);

  console.log(`[Extractor] Extracted ${data.text.length} characters`);

  return data;
}
