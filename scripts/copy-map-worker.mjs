// Copies MapLibre's self-contained web worker to a stable, versioned public
// path. MapLibre v6 locates its worker next to its own module via
// import.meta.url, which bundlers relocate — so we serve it explicitly and
// point maplibregl.setWorkerUrl() at it (see MapCanvas.tsx).
import { copyFileSync, mkdirSync, readFileSync } from "node:fs";
import { createRequire } from "node:module";
import { dirname, join } from "node:path";

const require = createRequire(import.meta.url);
const pkgDir = dirname(require.resolve("maplibre-gl/package.json"));
const { version } = JSON.parse(readFileSync(join(pkgDir, "package.json"), "utf8"));
const outDir = join(process.cwd(), "public", "vendor");
mkdirSync(outDir, { recursive: true });
copyFileSync(join(pkgDir, "dist", "maplibre-gl-worker.mjs"), join(outDir, `maplibre-gl-worker-${version}.mjs`));
console.log(`maplibre worker ${version} → public/vendor/`);
