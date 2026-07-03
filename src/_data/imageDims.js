// Build-time image dimensions, keyed by site path ("/assets/img/...").
// Templates use these to emit width/height attributes so the browser can
// reserve space before images load (prevents layout shift, helps CWV/SEO).
import fs from "node:fs";
import path from "node:path";
import { imageSize } from "image-size";

const ROOT = path.join(process.cwd(), "src", "assets", "img");

function walk(dir) {
  let out = [];
  for (const f of fs.readdirSync(dir)) {
    const p = path.join(dir, f);
    if (fs.statSync(p).isDirectory()) out.push(...walk(p));
    else out.push(p);
  }
  return out;
}

export default (() => {
  const map = {};
  for (const file of walk(ROOT)) {
    if (!/\.(jpe?g|png|webp)$/i.test(file)) continue;
    try {
      const { width, height } = imageSize(fs.readFileSync(file));
      const key = "/assets/img/" + path.relative(ROOT, file).split(path.sep).join("/");
      map[key] = { width, height };
    } catch (e) {
      /* skip unreadable images */
    }
  }
  return map;
})();
