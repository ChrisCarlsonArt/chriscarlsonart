// Generates responsive webp variants (-480w, -800w, -1200w) next to each source
// image under src/assets/img. Skips variants that already exist and widths
// larger than the source, so re-runs are cheap. Run automatically before builds.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";

const ROOT = path.join(process.cwd(), "src", "assets", "img");
const WIDTHS = [480, 800, 1200];

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

let made = 0, skipped = 0;
for (const file of walk(ROOT)) {
  if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
  if (/-\d+w\.webp$/i.test(file)) continue; // already a variant

  const meta = await sharp(file).metadata();
  const base = file.replace(/\.(jpe?g|png|webp)$/i, "");
  for (const w of WIDTHS) {
    const out = `${base}-${w}w.webp`;
    if (fs.existsSync(out)) { skipped++; continue; }
    if (meta.width <= w * 1.05) continue; // don't upscale or near-duplicate
    await sharp(file).resize({ width: w }).webp({ quality: 78 }).toFile(out);
    made++;
  }
}
console.log(`[images] variants created: ${made}, already present: ${skipped}`);
