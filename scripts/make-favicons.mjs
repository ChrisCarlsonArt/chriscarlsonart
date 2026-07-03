// One-off: generate the favicon set from src/assets/img/site/logo.png.
// Outputs into src/ (root icons) so they land at the web root on build.
import fs from "node:fs";
import path from "node:path";
import sharp from "sharp";
import pngToIco from "png-to-ico";

const SRC = path.join(process.cwd(), "src", "assets", "img", "site", "logo.png");
const OUT = path.join(process.cwd(), "src");

const png = (size, name) =>
  sharp(SRC).resize(size, size, { fit: "cover" }).png().toFile(path.join(OUT, name));

await png(16, "favicon-16.png");
await png(32, "favicon-32.png");
await png(48, "favicon-48.png");
await png(180, "apple-touch-icon.png");
await png(192, "icon-192.png");
await png(512, "icon-512.png");

const ico = await pngToIco([
  path.join(OUT, "favicon-16.png"),
  path.join(OUT, "favicon-32.png"),
  path.join(OUT, "favicon-48.png"),
]);
fs.writeFileSync(path.join(OUT, "favicon.ico"), ico);

console.log("[favicons] generated ico + png set");
