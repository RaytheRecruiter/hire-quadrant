#!/usr/bin/env node
// Captures homepage, /jobs, /companies, /login screenshots at desktop
// and mobile viewports. Uploaded as an artifact from CI so reviewers
// can eyeball visual deltas before merging.

import { chromium } from 'playwright';
import fs from 'node:fs/promises';
import path from 'node:path';

const PAGES = [
  { path: '/', name: 'home' },
  { path: '/jobs', name: 'browse-jobs' },
  { path: '/companies', name: 'companies' },
  { path: '/login', name: 'login' },
  { path: '/register', name: 'register' },
  { path: '/about', name: 'about' },
];

const VIEWPORTS = [
  { name: 'desktop', width: 1440, height: 900 },
  { name: 'mobile', width: 390, height: 844 },
];

const base = process.env.PREVIEW_URL || 'http://localhost:4173';
const outDir = path.resolve('artifacts/visual');

await fs.mkdir(outDir, { recursive: true });

const browser = await chromium.launch();
const context = await browser.newContext();
const page = await context.newPage();

for (const viewport of VIEWPORTS) {
  await page.setViewportSize({ width: viewport.width, height: viewport.height });
  for (const p of PAGES) {
    const url = `${base}${p.path}`;
    const filename = `${p.name}-${viewport.name}.png`;
    try {
      await page.goto(url, { waitUntil: 'networkidle', timeout: 30000 });
      await page.waitForTimeout(500);
      await page.screenshot({
        path: path.join(outDir, filename),
        fullPage: false,
      });
      console.log('captured', filename);
    } catch (e) {
      console.error('failed', filename, e.message);
    }
  }
}

await browser.close();
