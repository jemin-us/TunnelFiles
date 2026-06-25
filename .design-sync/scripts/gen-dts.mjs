// Emit real .d.ts for the UI components from their .tsx sources.
//
// TunnelFiles ships no built .d.ts and declares props inline in each component
// signature (React.ComponentProps<"…"> & VariantProps<…> & {…}). Without a
// declaration tree, package-build's ts-morph extractor falls back to
// `[key: string]: unknown` for every component. We run tsc --emitDeclarationOnly
// into .design-sync/.cache/dts/ — which sits under the repo, so package-build's
// `<repo>/**/*.d.ts` scan (node_modules excluded) picks it up automatically and
// resolves rich props (variant/size unions, asChild, inherited HTML attrs).
//
// tsc is run with noEmitOnError off semantics (we ignore its exit code): type
// errors in unrelated app code must not block declaration emit for the UI set.
//
// IMPORTANT: emit to a NON-dot dir. ts-morph's scan uses fast-glob with
// dot:false, so a `.design-sync/.cache/` path is invisible to it. `build/ts/`
// is findTypesRoot's first heuristic match, so the extractor's glob narrows to
// exactly these declarations (no repo-wide traversal, no pollution).

import { execFileSync } from 'node:child_process';
import { mkdirSync, readFileSync, rmSync, writeFileSync } from 'node:fs';
import { resolve } from 'node:path';

const REPO = process.cwd();
const outDir = resolve(REPO, 'build/ts');
const tsconfigPath = resolve(REPO, '.design-sync/.cache/dts-tsconfig.json');
const cfg = JSON.parse(readFileSync(resolve(REPO, '.design-sync/config.json'), 'utf8'));

rmSync(outDir, { recursive: true, force: true });
mkdirSync(outDir, { recursive: true });

const tsconfig = {
  compilerOptions: {
    target: 'ES2020',
    module: 'ESNext',
    moduleResolution: 'bundler',
    jsx: 'react-jsx',
    lib: ['ES2020', 'DOM', 'DOM.Iterable'],
    skipLibCheck: true,
    strict: false,
    noEmit: false,
    declaration: true,
    emitDeclarationOnly: true,
    noEmitOnError: false,
    outDir,
    baseUrl: REPO,
    paths: { '@/*': ['src/*'] },
    types: [],
  },
  // UI components + the @/ modules they import (so tsc resolves and types resolve).
  include: [
    'src/components/ui/**/*.ts',
    'src/components/ui/**/*.tsx',
    'src/lib/**/*.ts',
    'src/lib/**/*.tsx',
    'src/types/**/*.ts',
    'src/hooks/**/*.ts',
    'src/hooks/**/*.tsx',
  ].map((p) => resolve(REPO, p)),
};

writeFileSync(tsconfigPath, JSON.stringify(tsconfig, null, 2));

try {
  execFileSync(resolve(REPO, 'node_modules/.bin/tsc'), ['-p', tsconfigPath], {
    cwd: REPO,
    stdio: 'pipe',
  });
} catch {
  // tsc exits non-zero on type errors but still emits .d.ts (noEmitOnError off).
}

// Barrel entry at the repo root: package-build's projectFor resolves the
// component value-declaration through `<pkgDir>/index.d.ts` (its props fallback
// reads the call signature there), and exportedNames reads the SAME file to
// build the component list. Named re-exports of exactly the 29 parents keep
// that list at 29 — a bare `export *` would re-surface ~140 sub-components.
// (Sub-components still ship in the JS bundle via the ds-entry.tsx barrel.)
const reexports = Object.entries(cfg.componentSrcMap ?? {})
  .map(([name, src]) => {
    const mod = './build/ts/' + src.replace(/^src\//, '').replace(/\.(tsx|ts)$/, '');
    return `export { ${name} } from ${JSON.stringify(mod)};`;
  })
  .sort();
writeFileSync(resolve(REPO, 'index.d.ts'), reexports.join('\n') + '\n');

console.error(`dts emitted → ${outDir} (UI component declarations) + index.d.ts barrel (${reexports.length} parents)`);
