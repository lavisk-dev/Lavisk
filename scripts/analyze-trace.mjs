/**
 * Deep trace analysis for Lavisk homepage profiling.
 * Reads trace files from .profiling/ and extracts:
 *   - React commit phases
 *   - Long task breakdown by component
 *   - JavaScript execution by source
 *   - Main thread activity by category
 */

import { readFileSync, readdirSync, writeFileSync, mkdirSync, statSync } from "fs";
import { resolve, dirname } from "path";
import { fileURLToPath } from "url";

const __dirname = dirname(fileURLToPath(import.meta.url));
const PROFILING = resolve(__dirname, "..", ".profiling");

function analyzeTrace(events, runLabel) {
  const result = {
    run: runLabel,
    totalEvents: events.length,
    mainThread: {
      totalDuration: 0,
      byCategory: {},
      byName: {},
      longTasks: [],
    },
    reactCommits: [],
    v8Execution: {
      totalMs: 0,
      byFunction: {},
      byScript: {},
    },
    // Parse timing for first ~5 seconds
    parseWindow: 5000,
  };

  const startTs = events[0]?.ts || 0;
  const endTs = startTs + result.parseWindow * 1000;

  // Phase analysis: categorize trace events
  const phases = {};
  let totalDuration = 0;

  // Track "X" (Complete) events which have duration
  for (const ev of events) {
    if (ev.ph !== "X") continue;
    const ts = ev.ts - startTs;
    if (ts < 0 || ts > result.parseWindow * 1000) continue;
    const dur = ev.dur || 0;
    totalDuration += dur;

    // Categorize
    const cat = ev.cat || "unknown";
    const name = ev.name || "unknown";

    // Main thread work
    if (cat.includes("devtools.timeline") || cat.includes("v8") || cat.includes("blink")) {
      result.mainThread.byCategory[cat] = (result.mainThread.byCategory[cat] || 0) + dur;

      if (dur > 50000) {
        // 50ms = long task threshold
        result.mainThread.longTasks.push({
          name: name,
          cat: cat,
          startMs: ts / 1000,
          durationMs: dur / 1000,
        });
      }
    }

    // React commit tracking
    if (
      name === "React commit" ||
      name === "React render" ||
      name === "React effects" ||
      name === "React waitForPaint" ||
      name === "commit" ||
      name.includes("React")
    ) {
      result.reactCommits.push({
        name,
        startMs: ts / 1000,
        durationMs: dur / 1000,
      });
    }
  }

  // Total main thread blocking
  result.totalMainThreadMs = totalDuration / 1000;
  result.mainThread.totalDurationMs =
    Object.values(result.mainThread.byCategory).reduce((a, b) => a + b, 0) / 1000;

  return result;
}

function findBundleComposition() {
  // Read the app-build-manifest for chunk info
  const manifestPath = resolve(
    __dirname,
    "..",
    ".next",
    "app-build-manifest.json"
  );
  try {
    const manifest = JSON.parse(readFileSync(manifestPath, "utf-8"));

    const keys = Object.keys(manifest.pages);
    // Layout is at "/layout", homepage is at "/page"
    const layoutChunks = manifest.pages["/layout"] || [];
    const pageChunks = manifest.pages["/page"] || [];

    // Determine unique layout chunks (not in page)
    const layoutOnly = layoutChunks.filter((c) => !pageChunks.includes(c));

    return {
      layoutChunks,
      pageChunks,
      layoutOnly,
      totalLayout: layoutChunks.length,
      totalPage: pageChunks.length,
    };
  } catch (e) {
    return { error: e.message };
  }
}

function analyzeChunkSizes() {
  const chunkDir = resolve(__dirname, "..", ".next", "static", "chunks");
  const chunks = readdirSync(chunkDir).filter((f) => f.endsWith(".js"));
  const sizes = chunks.map((f) => ({
    name: f,
    sizeKB: Math.round((statSync(resolve(chunkDir, f)).size / 1024) * 10) / 10,
  }));
  return sizes.sort((a, b) => b.sizeKB - a.sizeKB);
}

function analyzeResults(results) {
  console.log("\nDeep Trace Analysis");
  console.log("=".repeat(60));

  const avgFCP =
    results.reduce((s, r) => s + r.vitals.FCP_full, 0) / results.length;
  const avgLCP =
    results.reduce((s, r) => s + r.vitals.LCP, 0) / results.length;
  const avgTBT =
    results.reduce((s, r) => s + r.vitals.TBT, 0) / results.length;

  console.log(`\nWeb Vitals (avg over ${results.length} runs):`);
  console.log(`  FCP:              ${(avgFCP / 1000).toFixed(2)}s`);
  console.log(`  LCP:              ${(avgLCP / 1000).toFixed(2)}s`);
  console.log(`  TBT:              ${(avgTBT / 1000).toFixed(2)}s`);
  console.log(`  CLS:              ${results[0].vitals.CLS?.toFixed(4)}`);

  // Long task analysis
  const allLongTasks = results.flatMap((r) => r.vitals.longTasks);
  console.log(`\nLong Tasks (${allLongTasks.length} total):`);
  if (allLongTasks.length > 0) {
    const sorted = [...allLongTasks].sort((a, b) => b.duration - a.duration);
    const totalLTTime = sorted.reduce((s, lt) => s + lt.duration, 0);
    console.log(`  Total long task time: ${(totalLTTime / 1000).toFixed(2)}s`);
    console.log(`  Avg long task:        ${(totalLTTime / sorted.length / 1000).toFixed(2)}s`);
    console.log(`  Max long task:        ${(sorted[0].duration / 1000).toFixed(2)}s`);
    console.log(`  First long task at:   ${(sorted[sorted.length - 1]?.startTime / 1000).toFixed(2)}s`);

    console.log(`\n  Long Tasks sorted by duration:`);
    sorted.forEach((lt, i) => {
      console.log(
        `    ${(i + 1).toString().padStart(2)}. ${(lt.duration / 1000).toFixed(2)}s at ${(lt.startTime / 1000).toFixed(2)}s`
      );
    });
  }

  // Resource analysis
  const allResources = results.flatMap((r) => r.resources);
  const jsResources = allResources.filter((r) => r && r.initiatorType === "script");
  const totalJSTransfer = jsResources.reduce((s, r) => s + (r.transferSize || 0), 0);
  console.log(`\nJavaScript Resources:`);
  console.log(`  Total JS files loaded: ${jsResources.length}`);
  console.log(`  Total JS transfer:     ${(totalJSTransfer / 1024).toFixed(1)} kB`);
  console.log(`  Total JS decoded:      ${(jsResources.reduce((s, r) => s + (r.decodedBodySize || 0), 0) / 1024).toFixed(1)} kB`);

  const largestJS = [...jsResources].sort((a, b) => (b.decodedBodySize || 0) - (a.decodedBodySize || 0)).slice(0, 10);
  console.log(`\n  Largest JS files (decoded):`);
  largestJS.forEach((r, i) => {
    const name = (r.name || "?").substring(0, 60);
    console.log(
      `    ${(i + 1).toString().padStart(2)}. ${(r.decodedBodySize / 1024).toFixed(1).padStart(7)} kB — ${name.padEnd(50)} (${(r.duration / 1000).toFixed(2)}s)`
    );
  });

  // Image resources
  const imgResources = allResources.filter((r) => r && (r.initiatorType === "img" || r.initiatorType === "link"));
  const totalImgTransfer = imgResources.reduce((s, r) => s + (r.transferSize || 0), 0);
  console.log(`\nImage Resources:`);
  console.log(`  Total images loaded: ${imgResources.length}`);
  console.log(`  Total image transfer: ${(totalImgTransfer / 1024).toFixed(1)} kB`);

  return {
    avgFCP,
    avgLCP,
    avgTBT,
    totalLongTasks: allLongTasks.length,
    totalLongTaskTime: allLongTasks.reduce((s, lt) => s + lt.duration, 0),
    maxLongTask: allLongTasks.length > 0 ? Math.max(...allLongTasks.map((lt) => lt.duration)) : 0,
    totalJSTransfer,
    totalImgTransfer,
  };
}

function main() {
  // Read profile results
  const profileFile = resolve(PROFILING, "profile-results.json");
  let profile;
  try {
    profile = JSON.parse(readFileSync(profileFile, "utf-8"));
  } catch {
    console.log("No profile results found. Run profile-homepage.mjs first.");
    process.exit(1);
  }

  const analysis = analyzeResults(profile.perRun);
  const bundle = findBundleComposition();
  const chunks = analyzeChunkSizes();

  console.log("\nBundle Composition:");
  console.log("=".repeat(60));
  if (!bundle.error) {
    console.log(`  Layout chunks:        ${bundle.totalLayout}`);
    console.log(`  Page-specific chunks: ${bundle.totalPage}`);
    console.log(`  Layout-only chunks:   ${bundle.layoutOnly.length}`);
    console.log(`\n  Chunk sizes (top 15):`);
    chunks.slice(0, 15).forEach((c, i) => {
      console.log(`    ${(i + 1).toString().padStart(2)}. ${c.sizeKB.toFixed(1).padStart(7)} kB — ${c.name}`);
    });
  }

  // Now calculate the cost per chunk/bundle
  const layoutChunkNames = (bundle.layoutChunks || []).map((c) => c.replace("static/chunks/", ""));
  const pageChunkNames = (bundle.pageChunks || []).map((c) => c.replace("static/chunks/", ""));

  const totalFirstLoad = chunks
    .filter((c) => layoutChunkNames.includes(c.name))
    .reduce((s, c) => s + c.sizeKB, 0);

  const totalPageLoad = chunks
    .filter((c) => pageChunkNames.includes(c.name))
    .reduce((s, c) => s + c.sizeKB, 0);

  console.log(`\n  Layout total: ${totalFirstLoad.toFixed(1)} kB`);
  console.log(`  Page total:   ${totalPageLoad.toFixed(1)} kB`);

  // Identify which JS chunks are likely causing the freeze
  // Large JS + parse/execute time = main thread blocking
  const largeChunks = chunks.filter((c) => c.sizeKB > 30);
  console.log(`\nLarge chunks (>30 kB): ${largeChunks.length}`);
  console.log(`  Total large chunk size: ${largeChunks.reduce((s, c) => s + c.sizeKB, 0).toFixed(1)} kB`);

  // Aggregate report
  const report = {
    ...analysis,
    bundleComposition: bundle,
    chunkCount: chunks.length,
    largeChunkCount: largeChunks.length,
    largeChunkTotalKB: largeChunks.reduce((s, c) => s + c.sizeKB, 0),
  };

  writeFileSync(
    resolve(PROFILING, "trace-analysis.json"),
    JSON.stringify(report, null, 2)
  );

  console.log(`\nFull analysis saved to .profiling/trace-analysis.json`);
}

main();
