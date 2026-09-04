import puppeteer from 'puppeteer';

/**
 * Generates a PDF Buffer from raw HTML string using Puppeteer
 */
export async function generatePdfFromHtml(htmlContent: string): Promise<Buffer> {
  let browser = null;
  try {
    browser = await puppeteer.launch({
      headless: true,
      args: ['--no-sandbox', '--disable-setuid-sandbox', '--disable-dev-shm-usage'],
    });

    const page = await browser.newPage();
    await page.setContent(htmlContent, {
      waitUntil: 'domcontentloaded',
      timeout: 30000,
    });

    const pdfBuffer = await page.pdf({
      format: 'A4',
      printBackground: true,
      margin: {
        top: '10mm',
        right: '12mm',
        bottom: '10mm',
        left: '12mm',
      },
    });

    return Buffer.from(pdfBuffer);
  } finally {
    if (browser) {
      await browser.close();
    }
  }
}
