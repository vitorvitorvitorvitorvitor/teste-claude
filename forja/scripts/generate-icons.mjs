// Gera os ícones PNG a partir de public/icons/icon.svg usando o Chromium do Playwright.
import { chromium } from 'playwright';
import { readFileSync } from 'node:fs';
import { fileURLToPath } from 'node:url';
import { dirname, join } from 'node:path';

const root = join(dirname(fileURLToPath(import.meta.url)), '..');
const svg = readFileSync(join(root, 'public/icons/icon.svg'), 'utf8');
const browser = await chromium.launch();
const page = await browser.newPage();
const out = [
  ['icon-192.png', 192, false],
  ['icon-512.png', 512, false],
  ['icon-512-maskable.png', 512, true],
  ['apple-touch-icon.png', 180, true]
];
for (const [name, size, full] of out) {
  // Maskable/Apple: fundo sem cantos arredondados (o sistema aplica a máscara).
  const body = full ? svg.replace('rx="112"', 'rx="0"') : svg;
  await page.setViewportSize({ width: size, height: size });
  await page.setContent(`<html><body style="margin:0;background:transparent">${body.replace('<svg ', `<svg width="${size}" height="${size}" `)}</body></html>`);
  await page.screenshot({ path: join(root, 'public/icons', name), omitBackground: !full, clip: { x: 0, y: 0, width: size, height: size } });
}
await browser.close();
console.log('Ícones gerados.');
