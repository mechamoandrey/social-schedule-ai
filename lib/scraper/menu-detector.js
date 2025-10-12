import { SCRAPING_CONFIG } from './config.js';

export async function detectMenuLinks(page, baseUrl) {
  console.log('[Menu Detector] Analyzing page links...');

  const allKeywords = [
    ...SCRAPING_CONFIG.menuKeywords.pt,
    ...SCRAPING_CONFIG.menuKeywords.en,
    ...SCRAPING_CONFIG.menuKeywords.es,
  ];

  const links = await page.evaluate((baseUrl, keywords, ignorePatterns) => {
    const found = [];
    const allLinks = Array.from(document.querySelectorAll('a'));

    allLinks.forEach(link => {
      try {
        const href = link.href;
        const text = link.textContent.trim();
        const rect = link.getBoundingClientRect();

        if (!text || !href) return;
        if (rect.width === 0 || rect.height === 0) return;
        if (rect.top > window.innerHeight * 2) return;
        if (!href.startsWith(baseUrl)) return;

        const shouldIgnore = ignorePatterns.some(pattern =>
          href.toLowerCase().includes(pattern.toLowerCase())
        );
        if (shouldIgnore) return;

        let priority = 0;

        const parent = link.closest('nav, header');
        if (parent) priority += 10;

        if (rect.top < 800) priority += 8;

        const textLower = text.toLowerCase();
        keywords.forEach(kw => {
          if (textLower.includes(kw)) priority += 5;
        });

        if (href.includes('/lang/') || textLower.match(/^(en|pt|es|br)$/)) {
          priority -= 5;
        }

        found.push({ href, text, priority });
      } catch (e) {
        // Ignora erros
      }
    });

    return found;
  }, baseUrl, allKeywords, SCRAPING_CONFIG.ignorePatterns);

  console.log(`[Menu Detector] Found ${links.length} potential links`);

  const uniqueLinks = [];
  const seenUrls = new Set();

  for (const link of links) {
    const cleanUrl = link.href.split('?')[0].split('#')[0];

    if (!seenUrls.has(cleanUrl) && cleanUrl !== baseUrl) {
      seenUrls.add(cleanUrl);
      uniqueLinks.push({ ...link, href: cleanUrl });
    }
  }

  uniqueLinks.sort((a, b) => b.priority - a.priority);

  const topLinks = uniqueLinks.slice(0, SCRAPING_CONFIG.maxPages - 1);

  console.log(`[Menu Detector] Selected ${topLinks.length} priority links:`);
  topLinks.forEach((link, i) => {
    console.log(`  ${i + 1}. [Priority: ${link.priority}] ${link.text} - ${link.href}`);
  });

  return topLinks;
}

export function isValidUrl(url) {
  try {
    const parsed = new URL(url);

    if (!['http:', 'https:'].includes(parsed.protocol)) {
      return false;
    }

    const hostname = parsed.hostname;
    if (
      hostname === 'localhost' ||
      hostname.startsWith('127.') ||
      hostname.startsWith('192.168.') ||
      hostname.startsWith('10.')
    ) {
      return false;
    }

    return true;
  } catch (e) {
    return false;
  }
}
