/**
 * Performance profiling script for Lavisk homepage.
 * Uses Playwright + Chrome DevTools Protocol to capture:
 *   - Performance trace (flame chart)
 *   - Web Vitals (FCP, LCP, TBT, CLS)
 *   - Long Tasks
 *   - Bundle sizes
 *   - Hydration timing
 *
 * Usage: node scripts/profile-homepage.mjs
 */

import { chromium } from "playwright";
import { writeFileSync, mkdirSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const OUT = resolve(__dirname, "..", ".profiling");
mkdirSync(OUT, { recursive: true });

const URL = "http://localhost:3000";
const RUNS = 3; // number of cold-load runs

function ms(v) {
  return v ? `${(v / 1000).toFixed(2)}s` : "N/A";
}

async function runProfile(runId) {
  console.log(`\n=== Run ${runId}/${RUNS} ===`);

  const browser = await chromium.launch({
    channel: "chrome",
    headless: true,
    args: [
      "--disable-extensions",
      "--disable-component-extensions-with-background-pages",
      "--disable-default-apps",
      "--disable-dev-shm-usage",
      "--no-sandbox",
    ],
  });

  const context = await browser.newContext({
    viewport: { width: 1440, height: 900 },
    deviceScaleFactor: 1,
    userAgent:
      "Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/126.0.0.0 Safari/537.36",
  });

  // Clear cache for cold load
  const page = await context.newPage();
  await page.route("**/*", (route) => {
    // Block analytics / external fonts to reduce noise
    const url = route.request().url();
    if (url.includes("analytics") || url.includes("googletag")) {
      route.abort();
    } else {
      route.continue();
    }
  });

  // Start CDP tracing
  const cdp = await context.newCDPSession(page);
  await cdp.send("Page.enable");
  await cdp.send("DOM.enable");
  await cdp.send("CSS.enable");

  // Start performance trace
  const traceCategories = [
    "blink",
    "blink.user_timing",
    "devtools.timeline",
    "disabled-by-default-devtools.timeline",
    "disabled-by-default-devtools.timeline.frame",
    "disabled-by-default-devtools.timeline.stack",
    "disabled-by-default-v8.cpu_profiler",
    "disabled-by-default-v8.cpu_profiler.hires",
    "latencyInfo",
    "loading",
    "navigation",
    "toplevel",
    "v8",
  ];

  await cdp.send("Tracing.start", {
    traceConfig: {
      recordMode: "recordUntilFull",
      enableSystrace: false,
      includedCategories: traceCategories,
      excludedCategories: ["*"],
    },
  });

  // Navigate and wait for network idle
  const startTime = Date.now();
  const perfTiming = await page.evaluate(() =>
    JSON.stringify(performance.timing.toJSON())
  );

  await page.goto(URL, { waitUntil: "networkidle", timeout: 30000 });

  // Wait for LCP-candidate paints
  await page.waitForLoadState("networkidle");

  const loadDuration = Date.now() - startTime;
  console.log(`  Page loaded in ${ms(loadDuration)}`);

  // Collect Web Vitals via PerformanceObserver
  const vitals = await page.evaluate(() => {
    return new Promise((resolve) => {
      const results = {};
      const observer = new PerformanceObserver((list) => {
        for (const entry of list.getEntries()) {
          if (entry.entryType === "paint") {
            results[entry.name] = entry.startTime;
          }
          if (entry.entryType === "largest-contentful-paint") {
            results["LCP"] = entry.startTime;
          }
          if (entry.entryType === "layout-shift") {
            if (!results["CLS"]) results["CLS"] = 0;
            if (!entry.hadRecentInput) results["CLS"] += entry.value;
          }
          if (entry.entryType === "longtask") {
            if (!results["longTasks"]) results["longTasks"] = [];
            results["longTasks"].push({
              duration: entry.duration,
              startTime: entry.startTime,
              name: entry.name,
            });
          }
          if (entry.entryType === "first-input") {
            results["FID"] = entry.processingStart - entry.startTime;
          }
        }
      });
      observer.observe({ type: "paint", buffered: true });
      observer.observe({ type: "largest-contentful-paint", buffered: true });
      observer.observe({ type: "layout-shift", buffered: true });
      observer.observe({ type: "longtask", buffered: true });
      observer.observe({ type: "first-input", buffered: true });
      setTimeout(() => {
        observer.disconnect();
        resolve(results);
      }, 5000);
    });
  });

  // Stop tracing
  const traceEvents = await new Promise((resolve) => {
    const events = [];
    cdp.on("Tracing.dataCollected", (event) => {
      if (event.value) events.push(...event.value);
    });
    cdp.once("Tracing.tracingComplete", () => resolve(events));
    cdp.send("Tracing.end");
  });

  // Collect JS heap stats
  const heapStats = await page.evaluate(() => ({
    jsHeapSizeLimit: (performance.memory?.jsHeapSizeLimit || 0) / 1024 / 1024,
    totalJSHeapSize: (performance.memory?.totalJSHeapSize || 0) / 1024 / 1024,
    usedJSHeapSize: (performance.memory?.usedJSHeapSize || 0) / 1024 / 1024,
  }));

  // Collect resource timing
  const resources = await page.evaluate(() =>
    performance.getEntriesByType("resource").map((r) => ({
      name: r.name.split("/").pop(),
      initiatorType: r.initiatorType,
      duration: r.duration,
      transferSize: r.transferSize,
      encodedBodySize: r.encodedBodySize,
      decodedBodySize: r.decodedBodySize,
      startTime: r.startTime,
    }))
  );

  // Analyze trace for main thread blocking
  function analyzeTrace(events) {
    let totalBlocking = 0;
    let longTasks = [];
    let mainThreadEvents = [];
    const longTaskThreshold = 50; // ms

    // Sort events by timestamp
    events.sort((a, b) => (a.ts || 0) - (b.ts || 0));

    // Find main thread tasks
    let currentTask = null;
    let taskStart = 0;

    // Identify "FunctionCall" events on the main thread
    for (const ev of events) {
      if (ev.cat?.includes("devtools.timeline") === false) continue;
      if (ev.name === "FunctionCall" && ev.ph === "B" && ev.args?.data?.frame === undefined) {
        // Parse duration
        continue;
      }

      // Track long tasks by looking at blink.user_timing longtask events
      if (
        ev.name === "longtask" &&
        ev.args?.data?.duration > longTaskThreshold
      ) {
        longTasks.push({
          duration: ev.args.data.duration,
          startTime: (ev.ts - events[0]?.ts) / 1000,
        });
        totalBlocking += ev.args.data.duration - longTaskThreshold;
      }
    }

    // Count events by category
    const categoryCounts = {};
    for (const ev of events) {
      const cats = (ev.cat || "").split(",");
      for (const cat of cats) {
        categoryCounts[cat] = (categoryCounts[cat] || 0) + 1;
      }
    }

    return { totalBlocking, longTasks, categoryCounts };
  }

  const trace = analyzeTrace(traceEvents);

  // Safely compute TBT from vitals
  let tbt = 0;
  if (vitals.longTasks) {
    tbt = vitals.longTasks.reduce(
      (sum, lt) => sum + Math.max(0, lt.duration - 50),
      0
    );
  }

  const result = {
    run: runId,
    loadDuration,
    vitals: {
      FCP: vitals["first-paint"],
      FCP_full: vitals["first-contentful-paint"],
      LCP: vitals["LCP"],
      CLS: vitals["CLS"],
      FID: vitals["FID"],
      TBT: tbt,
      longTasks: vitals.longTasks || [],
      totalLongTasks: (vitals.longTasks || []).length,
      totalBlockingTime: trace.totalBlocking,
    },
    heap: heapStats,
    resources: resources.sort((a, b) => b.duration - a.duration).slice(0, 20),
    traceEventCount: traceEvents.length,
  };

  // Save trace file for later analysis
  writeFileSync(
    resolve(OUT, `trace-run-${runId}.json`),
    JSON.stringify(traceEvents, null, 2)
  );

  await browser.close();
  return result;
}

async function main() {
  console.log("=".repeat(60));
  console.log("Lavisk Homepage Performance Profile");
  console.log("=".repeat(60));
  console.log(`Target: ${URL}`);
  console.log(`Runs: ${RUNS}\n`);

  const results = [];

  for (let i = 1; i <= RUNS; i++) {
    const r = await runProfile(i);
    results.push(r);
    console.log(`\n  Metrics for run ${i}:`);
    console.log(`  ─────────────────────────────`);
    console.log(`  Load time:        ${ms(r.loadDuration)}`);
    console.log(`  FCP:              ${ms(r.vitals.FCP_full)}`);
    console.log(`  LCP:              ${ms(r.vitals.LCP)}`);
    console.log(`  TBT:              ${ms(r.vitals.TBT)}`);
    console.log(`  CLS:              ${r.vitals.CLS?.toFixed(4) || "N/A"}`);
    console.log(`  Total Long Tasks: ${r.vitals.totalLongTasks}`);
    console.log(`  Trace events:     ${r.traceEventCount.toLocaleString()}`);
    console.log(`  Heap used:        ${r.heap?.usedJSHeapSize?.toFixed(1) || "N/A"} MB`);
  }

  // Aggregate
  const avg = (key) => {
    const vals = results.map((r) => {
      const parts = key.split(".");
      let v = r;
      for (const p of parts) v = v?.[p];
      return v != null ? v : 0;
    });
    const sum = vals.reduce((a, b) => a + b, 0);
    return sum / vals.length;
  };

  const avgLoad = avg("loadDuration");
  const avgFCP = avg("vitals.FCP_full");
  const avgLCP = avg("vitals.LCP");
  const avgTBT = avg("vitals.TBT");
  const avgCLS = avg("vitals.CLS");

  console.log("\n" + "=".repeat(60));
  console.log("AGGREGATE RESULTS (avg over " + RUNS + " runs)");
  console.log("=".repeat(60));
  console.log(`  Avg load time:      ${ms(avgLoad)}`);
  console.log(`  Avg FCP:            ${ms(avgFCP)}`);
  console.log(`  Avg LCP:            ${ms(avgLCP)}`);
  console.log(`  Avg TBT:            ${ms(avgTBT)}`);
  console.log(`  Avg CLS:            ${avgCLS?.toFixed(4) || "N/A"}`);

  const allLongTasks = results.flatMap((r) => r.vitals.longTasks);
  const totalLongTaskTime = allLongTasks.reduce((s, lt) => s + lt.duration, 0);
  console.log(`  Total long tasks:   ${allLongTasks.length}`);
  console.log(`  Long task total:    ${ms(totalLongTaskTime)}`);

  if (allLongTasks.length > 0) {
    const avgLongTaskDuration =
      totalLongTaskTime / allLongTasks.length;
    console.log(`  Avg long task:      ${ms(avgLongTaskDuration)}`);
    const maxLongTask = allLongTasks.reduce(
      (max, lt) => (lt.duration > max.duration ? lt : max),
      allLongTasks[0]
    );
    console.log(`  Max long task:      ${ms(maxLongTask.duration)}`);
  }

  // Top resources by duration
  const allResources = results.flatMap((r) => r.resources);
  const topResources = allResources
    .sort((a, b) => b.duration - a.duration)
    .slice(0, 15);

  console.log("\n" + "=".repeat(60));
  console.log("TOP RESOURCES BY LOAD TIME (all runs)");
  console.log("=".repeat(60));
  for (const r of topResources) {
    console.log(
      `  ${(r.name || "?").padEnd(40)} ${(r.initiatorType || "?").padEnd(10)} ${ms(r.duration).padStart(8)}  ${r.transferSize ? (r.transferSize / 1024).toFixed(1) + " kB" : "?"}`
    );
  }

  // Save aggregated results
  const report = {
    url: URL,
    runs: RUNS,
    date: new Date().toISOString(),
    aggregate: {
      avgLoadDuration: avgLoad,
      avgFCP: avgFCP,
      avgLCP: avgLCP,
      avgTBT: avgTBT,
      avgCLS: avgCLS,
      totalLongTasks: allLongTasks.length,
      totalLongTaskTime,
      avgLongTaskDuration: allLongTasks.length
        ? totalLongTaskTime / allLongTasks.length
        : 0,
    },
    perRun: results.map((r) => ({
      run: r.run,
      loadDuration: r.loadDuration,
      vitals: r.vitals,
      heap: r.heap,
    })),
  };

  writeFileSync(
    resolve(OUT, "profile-results.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`\nFull results saved to ${OUT}/`);
  console.log("Done.");
}

main().catch((err) => {
  console.error("Profiling failed:", err);
  process.exit(1);
});
