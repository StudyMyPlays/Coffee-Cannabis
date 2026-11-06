#!/usr/bin/env node
/**
 * Coffee & Cannabis Club — image pipeline.
 *
 *   npm run images
 *
 * 1. Resolves a source for every manifest name:
 *      assets/<name>.{png,jpg,jpeg,webp,avif}   (takes precedence)
 *      → the UUID-named reference PNGs in the repo root (SOURCE_MAP)
 * 2. Writes public/assets/<name>.jpg (mozjpeg q84, max 2400w, metadata stripped).
 *    Next/Image derives AVIF/WebP + srcset from these at request time.
 * 3. Composes public/assets/og-share.jpg (1200×630) when no og-share source exists.
 * 4. Renders the monogram PNG fallbacks + src/app/apple-icon.png from
 *    public/assets/logo/cc-monogram.svg.
 * 5. Emits src/lib/image-manifest.generated.ts (dimensions + blur placeholders).
 *
 * Source PNGs are only ever read, never modified.
 */
import { readdir, readFile, writeFile, mkdir, stat } from "node:fs/promises";
import { existsSync } from "node:fs";
import path from "node:path";
import { fileURLToPath } from "node:url";
import sharp from "sharp";

const ROOT = path.resolve(path.dirname(fileURLToPath(import.meta.url)), "..");
const OVERRIDE_DIR = path.join(ROOT, "assets");
const OUT_DIR = path.join(ROOT, "public", "assets");
const LOGO_SVG = path.join(OUT_DIR, "logo", "cc-monogram.svg");
const MANIFEST_TS = path.join(ROOT, "src", "lib", "image-manifest.generated.ts");

const MAX_WIDTH = 2400;
const JPEG_QUALITY = 84;
const BLUR_WIDTH = 16;
const OVERRIDE_EXTS = ["png", "jpg", "jpeg", "webp", "avif"];

const GOLD = "#bf9c5c";
const GOLD_LIGHT = "#d2b578";
const CREAM = "#f7eedb";
const GREEN_800 = "#145024";

/** Every image name the site may ask for (order = manifest order). */
export const MANIFEST_NAMES = [
  "hero-field",
  "texture-parchment",
  "texture-green-grain",
  "drink-green-goddess",
  "drink-purp",
  "drink-gold-drip",
  "drink-pink-velvet",
  "drink-green-mile",
  "community-table",
  "community-dj",
  "community-arrival",
  "community-hands",
  "event-backdrop",
  "member-card",
  "og-share",
  "event-frame",
  "paisley-frame-square",
];

/** Reference renders shipped in the repo root. */
const SOURCE_MAP = {
  "hero-field": "C139F1F6-D56C-476F-A7A4-AF0FE9EC2E12.png",
  "texture-green-grain": "0A3FEE7F-5FCA-42CB-A64F-03C51741DA5A.png",
  "texture-parchment": "95C6A162-7569-4BFF-BF3C-014DEB1AD243.png",
  "event-backdrop": "3A05C313-81A0-48C6-A42C-738970B57597.png",
  "member-card": "164A8C38-56A2-42D4-A38D-A57A076D3F33.png",
  "event-frame": "3E84E534-F9D0-4EBD-88AE-26F0640B5F16.png",
  "paisley-frame-square": "0137140B-7D27-4636-9219-88BDF453A27F.png",
};

/** Serif stack for SVG text rendered by librsvg (system fonts only). */
const OG_SERIF = "'Cormorant Garamond', 'FreeSerif', 'Liberation Serif', Georgia, serif";

const rel = (p) => path.relative(ROOT, p);
const kb = (bytes) => `${(bytes / 1024).toFixed(1)} KB`;

async function findOverride(name) {
  if (!existsSync(OVERRIDE_DIR)) return null;
  const files = await readdir(OVERRIDE_DIR);
  for (const ext of OVERRIDE_EXTS) {
    const hit = files.find((f) => f.toLowerCase() === `${name}.${ext}`);
    if (hit) return path.join(OVERRIDE_DIR, hit);
  }
  return null;
}

async function resolveSource(name) {
  const override = await findOverride(name);
  if (override) return { file: override, origin: "override" };
  const mapped = SOURCE_MAP[name];
  if (mapped) {
    const file = path.join(ROOT, mapped);
    if (existsSync(file)) return { file, origin: "reference" };
    console.warn(`  ! ${name}: mapped source ${mapped} not found`);
  }
  return null;
}

/** Encode any sharp pipeline / buffer to the canonical JPG + return manifest entry. */
async function writeJpeg(name, input) {
  const outFile = path.join(OUT_DIR, `${name}.jpg`);
  const { data, info } = await sharp(input)
    .rotate() // honour EXIF orientation before metadata is dropped
    .resize({ width: MAX_WIDTH, withoutEnlargement: true })
    .flatten({ background: GREEN_800 })
    .toColourspace("srgb")
    .jpeg({ quality: JPEG_QUALITY, mozjpeg: true, chromaSubsampling: "4:2:0" })
    .toBuffer({ resolveWithObject: true });
  await writeFile(outFile, data);

  const blur = await sharp(data)
    .resize({ width: BLUR_WIDTH })
    .webp({ quality: 40, effort: 6 })
    .toBuffer();

  return {
    src: `/assets/${name}.jpg`,
    width: info.width,
    height: info.height,
    blurDataURL: `data:image/webp;base64,${blur.toString("base64")}`,
    bytes: data.length,
  };
}

function escapeXml(s) {
  return s.replace(/&/g, "&amp;").replace(/</g, "&lt;").replace(/>/g, "&gt;");
}

/** Monogram SVG tinted to a fixed colour (librsvg has no CSS currentColor context). */
async function tintedMonogram(color) {
  const svg = await readFile(LOGO_SVG, "utf8");
  return Buffer.from(svg.replace(/currentColor/g, color));
}

async function composeOgShare(heroFile) {
  const W = 1200;
  const H = 630;
  const background = await sharp(heroFile)
    .resize(W, H, { fit: "cover", position: "attention" })
    .modulate({ brightness: 0.78, saturation: 0.95 })
    .toBuffer();

  // Gentle vignette + darkening behind the type for legibility.
  const shade = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <defs>
    <radialGradient id="v" cx="50%" cy="46%" r="75%">
      <stop offset="0" stop-color="#0b2e15" stop-opacity="0.15"/>
      <stop offset="0.7" stop-color="#0b2e15" stop-opacity="0.45"/>
      <stop offset="1" stop-color="#0b2e15" stop-opacity="0.7"/>
    </radialGradient>
  </defs>
  <rect width="${W}" height="${H}" fill="url(#v)"/>
</svg>`);

  const MARK_H = 220;
  const mark = await sharp(await tintedMonogram(GOLD_LIGHT), { density: 300 })
    .resize({ height: MARK_H })
    .png()
    .toBuffer();
  const markMeta = await sharp(mark).metadata();
  const markTop = 110;

  const title = escapeXml("COFFEE & CANNABIS CLUB");
  const tagline = escapeXml("Find your people.");
  const ruleY = 402;
  const text = Buffer.from(`<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}">
  <g fill="none" stroke="${GOLD}" stroke-width="1.2" opacity="0.9">
    <rect x="28" y="28" width="${W - 56}" height="${H - 56}"/>
    <rect x="36" y="36" width="${W - 72}" height="${H - 72}" stroke-width="0.6"/>
    <line x1="${W / 2 - 150}" y1="${ruleY}" x2="${W / 2 - 14}" y2="${ruleY}"/>
    <line x1="${W / 2 + 14}" y1="${ruleY}" x2="${W / 2 + 150}" y2="${ruleY}"/>
  </g>
  <path d="M${W / 2} ${ruleY - 6} L${W / 2 + 6} ${ruleY} L${W / 2} ${ruleY + 6} L${W / 2 - 6} ${ruleY} Z" fill="${GOLD}"/>
  <text x="${W / 2}" y="${ruleY + 64}" text-anchor="middle" font-family="${OG_SERIF}"
        font-size="44" letter-spacing="9" fill="${CREAM}">${title}</text>
  <text x="${W / 2}" y="${ruleY + 114}" text-anchor="middle" font-family="${OG_SERIF}"
        font-style="italic" font-size="32" letter-spacing="1" fill="${GOLD_LIGHT}">${tagline}</text>
</svg>`);

  return sharp(background)
    .composite([
      { input: shade, top: 0, left: 0 },
      { input: mark, top: markTop, left: Math.round((W - markMeta.width) / 2) },
      { input: text, top: 0, left: 0 },
    ])
    .png()
    .toBuffer();
}

async function renderLogoPngs() {
  if (!existsSync(LOGO_SVG)) {
    console.warn(`  ! ${rel(LOGO_SVG)} missing — skipping logo PNGs`);
    return [];
  }
  const gold = await tintedMonogram(GOLD);
  const outputs = [];
  for (const [size, file] of [
    [512, path.join(OUT_DIR, "logo", "cc-monogram.png")],
    [1024, path.join(OUT_DIR, "logo", "cc-monogram-1024.png")],
  ]) {
    await sharp(gold, { density: 72 * (size / 452) * 2 })
      .resize(size, size, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
      .png({ compressionLevel: 9, palette: false })
      .toFile(file);
    outputs.push(file);
  }

  // Apple touch icon: gold mark on a full-bleed green-800 square (iOS rounds corners itself).
  const APPLE = 180;
  const inset = 22;
  const markSize = APPLE - inset * 2;
  const mark = await sharp(gold, { density: 300 })
    .resize(markSize, markSize, { fit: "contain", background: { r: 0, g: 0, b: 0, alpha: 0 } })
    .png()
    .toBuffer();
  const appleFile = path.join(ROOT, "src", "app", "apple-icon.png");
  await sharp({ create: { width: APPLE, height: APPLE, channels: 4, background: GREEN_800 } })
    .composite([{ input: mark, top: inset, left: inset }])
    .flatten({ background: GREEN_800 })
    .png({ compressionLevel: 9 })
    .toFile(appleFile);
  outputs.push(appleFile);
  return outputs;
}

function renderManifestModule(entries, missing) {
  const body = Object.entries(entries)
    .map(
      ([name, e]) =>
        `  ${JSON.stringify(name)}: {\n` +
        `    src: ${JSON.stringify(e.src)},\n` +
        `    width: ${e.width},\n` +
        `    height: ${e.height},\n` +
        `    blurDataURL:\n      ${JSON.stringify(e.blurDataURL)},\n` +
        `  },`,
    )
    .join("\n");
  return `/**
 * GENERATED by scripts/optimize-images.mjs — do not edit by hand.
 * Run \`npm run images\` after adding or replacing a source in /assets.
 */

export const IMAGE_MANIFEST = {
${body}
} as const;

export const MISSING_IMAGES = ${JSON.stringify(missing)} as const;
`;
}

async function main() {
  await mkdir(OUT_DIR, { recursive: true });
  await mkdir(path.join(OUT_DIR, "logo"), { recursive: true });

  const entries = {};
  const missing = [];
  const report = [];

  for (const name of MANIFEST_NAMES) {
    const source = await resolveSource(name);
    if (source) {
      const entry = await writeJpeg(name, source.file);
      entries[name] = entry;
      report.push([name, `${entry.width}×${entry.height}`, kb(entry.bytes), `${source.origin}: ${rel(source.file)}`]);
    } else if (name !== "og-share") {
      missing.push(name);
    }
  }

  // og-share: composed from hero-field + monogram when no explicit source exists.
  if (!entries["og-share"]) {
    const hero = await resolveSource("hero-field");
    if (hero && existsSync(LOGO_SVG)) {
      const composed = await composeOgShare(hero.file);
      const entry = await writeJpeg("og-share", composed);
      entries["og-share"] = entry;
      report.push(["og-share", `${entry.width}×${entry.height}`, kb(entry.bytes), "composed: hero-field + monogram"]);
    } else {
      missing.push("og-share");
    }
  }

  // Keep manifest key order stable.
  const ordered = Object.fromEntries(
    MANIFEST_NAMES.filter((n) => entries[n]).map((n) => [n, entries[n]]),
  );
  const orderedMissing = MANIFEST_NAMES.filter((n) => missing.includes(n));

  await writeFile(MANIFEST_TS, renderManifestModule(ordered, orderedMissing));

  const logoFiles = await renderLogoPngs();

  console.log("\nImages");
  for (const row of report) console.log(`  ${row[0].padEnd(22)} ${row[1].padEnd(11)} ${row[2].padStart(9)}  ${row[3]}`);
  console.log("\nLogo");
  for (const f of logoFiles) console.log(`  ${rel(f).padEnd(44)} ${kb((await stat(f)).size).padStart(9)}`);
  console.log(`\nMissing (${orderedMissing.length}): ${orderedMissing.join(", ") || "none"}`);
  console.log(`Manifest → ${rel(MANIFEST_TS)}\n`);
}

main().catch((err) => {
  console.error(err);
  process.exit(1);
});
