#!/usr/bin/env node
// Usage:  node screenshot.mjs <url> [label] [viewport]
//   viewport: 'desktop' (default, 1280×800) | 'mobile' (375×800)
// Saves to ./temporary_screenshots/screenshot-N[-LABEL].png
// N auto-increments; existing files are never overwritten.

import { mkdir, readdir } from 'node:fs/promises';
import { join } from 'node:path';
import puppeteer from 'puppeteer';

const [, , url, rawLabel, rawViewport] = process.argv;

if (!url) {
  console.error('Usage: node screenshot.mjs <url> [label] [desktop|mobile]');
  process.exit(1);
}

const viewport = rawViewport === 'mobile'
  ? { width: 375, height: 800, deviceScaleFactor: 2, isMobile: true, hasTouch: true }
  : { width: 1280, height: 800, deviceScaleFactor: 2 };

const outDir = join(process.cwd(), 'temporary_screenshots');
await mkdir(outDir, { recursive: true });

const existing = await readdir(outDir).catch(() => []);
const nextN =
  existing
    .map((f) => parseInt(f.match(/^screenshot-(\d+)/)?.[1] ?? '0', 10))
    .reduce((max, n) => Math.max(max, n), 0) + 1;

const safeLabel = rawLabel
  ? `-${rawLabel.replace(/[^a-zA-Z0-9._-]+/g, '_')}`
  : '';
const outPath = join(outDir, `screenshot-${nextN}${safeLabel}.png`);

const browser = await puppeteer.launch({ headless: true });
try {
  const page = await browser.newPage();
  await page.setViewport(viewport);
  await page.goto(url, { waitUntil: 'networkidle2', timeout: 60_000 });
  await page.screenshot({ path: outPath, fullPage: true });
  console.log(outPath);
} finally {
  await browser.close();
}
