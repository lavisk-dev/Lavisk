import { chromium } from "playwright";
const browser = await chromium.launch({ channel: "chrome", headless: true });
const page = await browser.newPage();
const timings = {};

page.on("response", (resp) => {
  const url = resp.url();
  if (url.includes("localhost:3333") && !url.includes("favicon")) {
    const name = url.split("/").pop().substring(0, 45);
    timings[name] = { status: resp.status(), timing: resp.request().timing() };
  }
});

const start = Date.now();
await page.goto("http://localhost:3333/", { waitUntil: "commit", timeout: 30000 });
const navStart = Date.now() - start;

// Get timing from performance API
const navTiming = await page.evaluate(() => {
  const n = performance.getEntriesByType("navigation")[0];
  if (!n) return {};
  return {
    domContentLoaded: n.domContentLoadedEventEnd,
    domInteractive: n.domInteractive,
    loadEventEnd: n.loadEventEnd,
    responseStart: n.responseStart,
    responseEnd: n.responseEnd,
    requestStart: n.requestStart,
    domComplete: n.domComplete,
  };
});

console.log("\nNavigation Timing:");
for (const [k, v] of Object.entries(navTiming)) {
  console.log(`  ${k}: ${v.toFixed(0)}ms`);
}

const paints = await page.evaluate(() => {
  return performance.getEntriesByType("paint").map(e => ({ name: e.name, startTime: e.startTime }));
});
console.log("\nPaint timings:");
for (const p of paints) {
  console.log(`  ${p.name}: ${p.startTime.toFixed(0)}ms`);
}

// Long tasks
const longTasks = await page.evaluate(() => {
  return new Promise((resolve) => {
    const tasks = [];
    const obs = new PerformanceObserver((list) => {
      for (const entry of list.getEntries()) {
        tasks.push({ duration: entry.duration, startTime: entry.startTime });
      }
    });
    obs.observe({ type: "longtask", buffered: true });
    setTimeout(() => { obs.disconnect(); resolve(tasks); }, 5000);
  });
});
console.log(`\nLong tasks (${longTasks.length}):`);
for (const t of longTasks.slice(0, 10)) {
  console.log(`  duration=${t.duration.toFixed(0)}ms at ${t.startTime.toFixed(0)}ms`);
}

// Resource timing sorted by responseStart
const resources = await page.evaluate(() => {
  return performance.getEntriesByType("resource")
    .filter(r => !r.name.includes("favicon"))
    .map(r => ({
      name: r.name.split("/").pop().substring(0, 45),
      initiatorType: r.initiatorType,
      requestStart: r.requestStart,
      responseStart: r.responseStart,
      responseEnd: r.responseEnd,
      transferSize: r.transferSize,
      decodedBodySize: r.decodedBodySize,
      duration: r.duration,
    }))
    .sort((a, b) => a.requestStart - b.requestStart);
});

console.log("\nResource waterfall (sorted by request start):");
for (const r of resources) {
  const total = r.duration;
  const wait = r.responseStart - r.requestStart;
  const dl = r.responseEnd - r.responseStart;
  const label = `${r.name.padEnd(45)} ${(r.initiatorType || "?").padEnd(8)} total=${total.toFixed(0).padStart(5)}ms wait=${wait.toFixed(0).padStart(4)}ms dl=${dl.toFixed(0).padStart(4)}ms size=${(r.transferSize/1024).toFixed(1)}kB`;
  console.log(`  ${label}`);
}

console.log("\nDocument TTFB:", navTiming.responseStart?.toFixed(0), "ms");

await browser.close();
