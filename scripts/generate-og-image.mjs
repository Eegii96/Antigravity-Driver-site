// Generates public/og.jpg (1200x630) — the social-share card. Run manually
// when the brand/tagline changes: node scripts/generate-og-image.mjs
// Uses the system Chrome via Playwright (channel: 'chrome'), so no browser
// download is needed.
import { chromium } from '@playwright/test';
import { fileURLToPath } from 'url';
import path from 'path';

const __dirname = path.dirname(fileURLToPath(import.meta.url));
const outPath = path.join(__dirname, '..', 'public', 'og.jpg');

const html = `<!DOCTYPE html>
<html><head><meta charset="utf-8"><style>
  * { margin: 0; padding: 0; box-sizing: border-box; }
  body {
    width: 1200px; height: 630px; overflow: hidden;
    background: #1A1C1E;
    font-family: 'Arial Narrow', 'Roboto Condensed', Arial, sans-serif;
    color: #F4F5F2; position: relative;
  }
  .stripe {
    position: absolute; left: 0; right: 0; height: 26px;
    background: repeating-linear-gradient(45deg, #FFC400 0, #FFC400 30px, #1A1C1E 30px, #1A1C1E 60px);
  }
  .stripe.top { top: 0; }
  .stripe.bottom { bottom: 0; }
  .content { position: absolute; left: 90px; top: 130px; right: 90px; }
  .kicker {
    display: inline-block; color: #FFC400; border: 2px solid rgba(255,196,0,0.45);
    background: rgba(255,196,0,0.09); padding: 10px 22px; font-size: 26px;
    font-weight: bold; letter-spacing: 4px; text-transform: uppercase;
  }
  h1 {
    margin-top: 34px; font-size: 108px; line-height: 1.02; font-weight: 900;
    text-transform: uppercase; letter-spacing: -1px;
  }
  h1 .hl { background: #FFC400; color: #1A1C1E; padding: 0 18px; }
  .sub { margin-top: 30px; font-size: 34px; color: rgba(244,245,242,0.75); font-family: Arial, sans-serif; }
  .domain {
    position: absolute; right: 90px; bottom: 64px; font-size: 34px; font-weight: bold;
    color: #FFC400; letter-spacing: 2px; font-family: 'Courier New', monospace;
  }
</style></head>
<body>
  <div class="stripe top"></div>
  <div class="content">
    <span class="kicker">Газар шорооны ажлын зах зээл</span>
    <h1>Жолооч <span class="hl">Монголиа</span></h1>
    <div class="sub">Хүнд машин, механизмын ажил олгогч, жолооч, операторыг үнэлгээгээр холбоно</div>
  </div>
  <div class="domain">jolooch.net</div>
  <div class="stripe bottom"></div>
</body></html>`;

const browser = await chromium.launch({ channel: 'chrome', headless: true });
const page = await browser.newPage({ viewport: { width: 1200, height: 630 } });
await page.setContent(html, { waitUntil: 'networkidle' });
await page.screenshot({ path: outPath, type: 'jpeg', quality: 88 });
await browser.close();
console.log('OG image written to', outPath);
