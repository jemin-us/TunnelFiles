// Compile the repo's Tailwind v4 source (src/index.css) into a materialized
// stylesheet for the DS bundle: OKLCH tokens (:root dark / .light) + every
// utility class used across the scanned content (src/components/ui,
// .design-sync/previews, and the rest of the repo). cfg.cssEntry points here.
//
// Uses @tailwindcss/node + @tailwindcss/oxide directly (deps of @tailwindcss/vite,
// not hoisted) so no network/CLI install is needed. API pattern mirrors the
// installed @tailwindcss/vite plugin. Module paths are resolved out of the pnpm
// store dynamically so a tailwind version bump doesn't break re-sync.

import { mkdirSync, readFileSync, readdirSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';
import { pathToFileURL } from 'node:url';

const REPO = process.cwd();

function pnpmModule(prefix, subpath) {
  const store = resolve(REPO, 'node_modules/.pnpm');
  // Exact-name match: "@tailwindcss+node@4.1.18" not "@tailwindcss+node-foo@…".
  const hit = readdirSync(store)
    .filter((d) => d.startsWith(prefix + '@') && !d.slice(prefix.length + 1).includes('@'))
    .sort()
    .pop();
  if (!hit) throw new Error(`cannot find ${prefix} in node_modules/.pnpm`);
  return resolve(store, hit, 'node_modules', subpath);
}

const nodeMod = pnpmModule('@tailwindcss+node', '@tailwindcss/node/dist/index.mjs');
const oxideMod = pnpmModule('@tailwindcss+oxide', '@tailwindcss/oxide/index.js');

const { compile, Features } = await import(pathToFileURL(nodeMod).href);
const { Scanner } = await import(pathToFileURL(oxideMod).href);

const inputPath = resolve(REPO, 'src/index.css');
const input = readFileSync(inputPath, 'utf8');

const compiler = await compile(input, {
  base: dirname(inputPath),
  shouldRewriteUrls: true,
  onDependency: () => {},
});

// Mirror the vite plugin's scanner-source construction (root=null → scan repo).
const sources = (
  compiler.root === 'none'
    ? []
    : compiler.root == null
      ? [{ base: REPO, pattern: '**/*', negated: false }]
      : [{ ...compiler.root, negated: false }]
).concat(compiler.sources);

const scanner = new Scanner({ sources });

let candidates = [];
if (compiler.features & Features.Utilities) {
  candidates = scanner.scan();
}

const css = compiler.build(candidates);
const outPath = resolve(REPO, '.design-sync/.cache/ds-styles.css');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, css);
console.error(`tailwind compiled: ${candidates.length} candidates → ${(css.length / 1024).toFixed(1)} KB`);
