import { chromium } from "playwright";

const URL = "http://localhost:3000";

async function main() {
  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
  });

  const page = await browser.newPage({ viewport: { width: 1440, height: 900 } });

  // Capture all requests/responses
  const requests = [];
  page.on("request", (req) => requests.push({ url: req.url(), type: req.resourceType() }));
  page.on("response", (res) => {
    const req = res.request();
    console.log(`${res.status()} ${req.resourceType().padEnd(10)} ${(req.url() || "").substring(0, 120)}`);
  });

  await page.goto(URL, { waitUntil: "load", timeout: 30000 });
  await page.waitForTimeout(2000);

  // Check what's actually rendered
  const title = await page.title();
  const bodyText = await page.evaluate(() => document.body?.innerText?.substring(0, 500));
  const scriptCount = await page.evaluate(() => document.querySelectorAll("script").length);
  const imgCount = await page.evaluate(() => document.querySelectorAll("img").length);
  const htmlLen = await page.evaluate(() => document.documentElement.innerHTML.length);

  console.log("\n=== Page Analysis ===");
  console.log(`Title: ${title}`);
  console.log(`HTML size: ${(htmlLen / 1024).toFixed(1)} kB`);
  console.log(`Script elements: ${scriptCount}`);
  console.log(`Image elements: ${imgCount}`);
  console.log(`Body text (first 500 chars):\n${bodyText}`);

  // Check if the comic-sans font issue is present
  const computedFont = await page.evaluate(() => {
    const el = document.querySelector(".font-display");
    if (!el) return "NO .font-display element found";
    return getComputedStyle(el).fontFamily;
  });
  console.log(`\n.font-display computed font: ${computedFont}`);

  // Check for errors
  page.on("console", (msg) => {
    if (msg.type() === "error") console.log(`CONSOLE ERROR: ${msg.text()}`);
  });

  await browser.close();
}

main().catch(console.error);
