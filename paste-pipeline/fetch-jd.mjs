/**
 * Fetch visible job description text from a URL using Playwright (SPA-safe).
 */
import { chromium } from 'playwright';

const DEFAULT_TIMEOUT_MS = 90_000;

export async function fetchJobDescription(url, { timeoutMs = DEFAULT_TIMEOUT_MS } = {}) {
  const browser = await chromium.launch({ headless: true });
  try {
    const page = await browser.newPage({
      userAgent:
        'Mozilla/5.0 (compatible; career-ops/1.0; +https://github.com/santifer/career-ops)',
    });
    await page.goto(url, { waitUntil: 'networkidle', timeout: timeoutMs });
    const title = await page.title();
    const text = await page.evaluate(() => document.body?.innerText || '');
    const trimmed = text.replace(/\n{3,}/g, '\n\n').trim();
    return {
      title,
      text: trimmed.slice(0, 50_000),
    };
  } finally {
    await browser.close();
  }
}
