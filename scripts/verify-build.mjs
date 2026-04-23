#!/usr/bin/env node
// Post-build safety net: parse dist/index.html and confirm every /assets/ reference
// points to a file that actually exists in dist/. Fails the build on any mismatch,
// which prevents the "text/html MIME on a CSS file" SPA whitepage class of bug.
import { existsSync, readFileSync } from 'node:fs';
import { resolve } from 'node:path';

const root = resolve(process.cwd(), 'dist');
const html = resolve(root, 'index.html');

if (!existsSync(html)) {
  console.error('verify-build: dist/index.html not found');
  process.exit(1);
}

const source = readFileSync(html, 'utf8');
const refs = new Set();
const assetRefRegex = /(?:href|src)="(\/assets\/[^"']+)"/g;
let match;
while ((match = assetRefRegex.exec(source)) !== null) refs.add(match[1]);

if (refs.size === 0) {
  console.error('verify-build: no /assets/* references found in dist/index.html — suspicious');
  process.exit(1);
}

const missing = [];
for (const ref of refs) {
  const full = resolve(root, `.${ref}`);
  if (!existsSync(full)) missing.push(ref);
}

if (missing.length > 0) {
  console.error('verify-build: dist/index.html references files missing from dist/:');
  for (const m of missing) console.error(`  - ${m}`);
  process.exit(1);
}

console.log(`verify-build: ${refs.size} asset references OK`);
