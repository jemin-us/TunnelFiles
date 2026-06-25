// Generate the DS bundle entry (a "barrel") from cfg.componentSrcMap.
//
// TunnelFiles is an app, not a published component library — there is no
// dist/ entry. This barrel re-exports every pinned component file (so the
// esbuild bundle assigns all of them to window.<globalName>) plus the
// ThemeProvider the preview provider needs. package-build.mjs is pointed at it
// via --entry; PKG_DIR resolves by walking up to the repo's package.json.
//
// Output is gitignored (.design-sync/.cache/) and regenerated each build, so a
// fresh clone reproduces it from this committed script + config.

import { mkdirSync, readFileSync, writeFileSync } from 'node:fs';
import { dirname, resolve } from 'node:path';

const REPO = process.cwd();
const cfg = JSON.parse(readFileSync(resolve(REPO, '.design-sync/config.json'), 'utf8'));

// src/components/ui/button.tsx → @/components/ui/button
const toAlias = (p) => '@/' + p.replace(/^src\//, '').replace(/\.(tsx|ts|jsx|js)$/, '');

const files = [...new Set(Object.values(cfg.componentSrcMap ?? {}))].sort();
const lines = files.map((p) => `export * from ${JSON.stringify(toAlias(p))};`);
// ThemeProvider/useTheme back the preview provider (cfg.provider) — exported so
// they land on window.<globalName> without becoming their own component cards.
lines.push('export { ThemeProvider, useTheme } from "@/lib/theme";');
// useForm ships alongside Form so previews (and the design agent) drive
// react-hook-form from the SAME instance the bundled Form uses — a second copy
// bundled into a preview wouldn't share Form's context. Filtered from the card
// list (use* + not in index.d.ts).
lines.push('export { useForm } from "react-hook-form";');
// toast ships alongside Toaster so previews (and the design agent) fire
// notifications through the SAME sonner instance the bundled Toaster renders.
lines.push('export { toast } from "sonner";');

const outPath = resolve(REPO, '.design-sync/.cache/ds-entry.tsx');
mkdirSync(dirname(outPath), { recursive: true });
writeFileSync(outPath, lines.join('\n') + '\n');
console.error(`entry barrel: ${files.length} component files + ThemeProvider → ${outPath}`);
