// Vendors cubing.js (and its random-uint-below dependency) into public/vendor
// as plain, unbundled files, resolved at runtime via the import map in
// index.html instead of being processed by Vite.
//
// Why: cubing.js runs its scrambler inside a Web Worker, and Vite/esbuild's
// bundler rewrites that worker's dynamic imports in a way that crashes in
// production builds ("document is not defined" - a known Vite/esbuild
// worker-bundling limitation, still unresolved after years). Vendoring the
// untouched dist files sidesteps the bundler entirely for this package.
//
// One extra wrinkle on top of that: cubing.js's own dist output imports its
// "random-uint-below" dependency as a bare specifier (`from "random-uint-below"`)
// inside several worker-loaded chunks. Bare specifiers need an import map to
// resolve - but the HTML import-map spec only applies to the main document,
// not to Worker module graphs (browsers ignore import maps inside workers;
// see https://github.com/WICG/import-maps/issues/2). So those bare imports
// have to be rewritten to plain relative paths instead, which resolve the
// same way everywhere (main thread or worker) with no import map needed.
//
// Run this again (`npm run vendor:cubing`) whenever the `cubing` npm
// dependency is upgraded.

import { cpSync, mkdirSync, readFileSync, readdirSync, rmSync, writeFileSync } from 'node:fs';
import path from 'node:path';
import { fileURLToPath } from 'node:url';

const root = path.dirname(path.dirname(fileURLToPath(import.meta.url)));
const cubingSrc = path.join(root, 'node_modules/cubing/dist/lib/cubing');
const randomUintBelowSrc = path.join(root, 'node_modules/random-uint-below/dist/esm/index.js');
const vendorDir = path.join(root, 'public/vendor');
const cubingDest = path.join(vendorDir, 'cubing');
const randomUintBelowDest = path.join(vendorDir, 'random-uint-below/index.js');

rmSync(cubingDest, { recursive: true, force: true });
mkdirSync(vendorDir, { recursive: true });
cpSync(cubingSrc, cubingDest, { recursive: true });
mkdirSync(path.dirname(randomUintBelowDest), { recursive: true });
cpSync(randomUintBelowSrc, randomUintBelowDest);

const chunksDir = path.join(cubingDest, 'chunks');
let patched = 0;
for (const name of readdirSync(chunksDir)) {
  if (!name.endsWith('.js')) continue;
  const file = path.join(chunksDir, name);
  const original = readFileSync(file, 'utf8');
  const rewritten = original.replaceAll('from "random-uint-below"', 'from "../../random-uint-below/index.js"');
  if (rewritten !== original) {
    writeFileSync(file, rewritten);
    patched++;
  }
}

console.log(`Vendored cubing.js into ${path.relative(root, cubingDest)}`);
console.log(`Vendored random-uint-below into ${path.relative(root, randomUintBelowDest)}`);
console.log(`Rewrote ${patched} chunk file(s) to use a relative random-uint-below import (workers ignore import maps).`);
