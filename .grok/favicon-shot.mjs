import { chromium } from "playwright";
import { pathToFileURL } from "node:url";
import { resolve } from "node:path";
import { writeFileSync } from "node:fs";

const svgUrl = pathToFileURL(resolve("/workspace/public/favicon.svg")).href;
const browser = await chromium.launch();

for (const size of [16, 32]) {
  const html = `<!DOCTYPE html><html><body style="margin:0;background:transparent">
    <img src="${svgUrl}" width="${size}" height="${size}" />
  </body></html>`;
  const htmlPath = `/workspace/.grok/favicon-${size}.html`;
  writeFileSync(htmlPath, html);
  const page = await browser.newPage({
    viewport: { width: size, height: size },
    deviceScaleFactor: 1,
  });
  await page.goto(pathToFileURL(htmlPath).href);
  await page.screenshot({
    path: `/workspace/.grok/favicon-${size}.png`,
    omitBackground: true,
  });
  await page.close();
}
await browser.close();
console.log("rasterized");
