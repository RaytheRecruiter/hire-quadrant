#!/usr/bin/env node
// Mirrors QA Walkthrough Part F.3 — Lighthouse desktop + mobile audits.
// Usage:  node lighthouse-runner.mjs  [url]
// Thresholds map to PASS IF lines: desktop perf >= 70; a11y/best/seo >= 90; mobile perf >= 60; others >= 85.

import { chromium } from '@playwright/test';
import lighthouse from 'lighthouse';
import { writeFileSync } from 'node:fs';

const URL = process.argv[2] ?? process.env.QA_BASE_URL ?? 'https://hirequadrant.com';

const THRESHOLDS = {
  desktop: { performance: 70, accessibility: 90, 'best-practices': 90, seo: 90 },
  mobile:  { performance: 60, accessibility: 85, 'best-practices': 85, seo: 85 },
};

async function audit(formFactor) {
  const browser = await chromium.launch({ args: ['--remote-debugging-port=9222'] });
  try {
    const result = await lighthouse(URL, {
      port: 9222,
      output: 'json',
      logLevel: 'error',
      onlyCategories: ['performance', 'accessibility', 'best-practices', 'seo'],
      formFactor,
      screenEmulation: formFactor === 'desktop'
        ? { mobile: false, width: 1350, height: 940, deviceScaleFactor: 1, disabled: false }
        : { mobile: true,  width: 412,  height: 823, deviceScaleFactor: 1.75, disabled: false },
    });
    return result.lhr;
  } finally {
    await browser.close();
  }
}

function pct(score) { return Math.round((score ?? 0) * 100); }

const results = {};
let allPassed = true;
for (const ff of ['desktop', 'mobile']) {
  console.log(`\n— Lighthouse ${ff} on ${URL} —`);
  const lhr = await audit(ff);
  const scores = {
    performance: pct(lhr.categories.performance.score),
    accessibility: pct(lhr.categories.accessibility.score),
    'best-practices': pct(lhr.categories['best-practices'].score),
    seo: pct(lhr.categories.seo.score),
  };
  results[ff] = scores;
  for (const [k, v] of Object.entries(scores)) {
    const min = THRESHOLDS[ff][k];
    const status = v >= min ? 'PASS' : 'FAIL';
    if (status === 'FAIL') allPassed = false;
    console.log(`  ${status}  ${k.padEnd(15)} ${v} / ${min}`);
  }
}

writeFileSync('lighthouse-results.json', JSON.stringify(results, null, 2));
console.log('\nWrote lighthouse-results.json');
process.exit(allPassed ? 0 : 1);
