import CleanCSS from "clean-css";
import imageDims from "./src/_data/imageDims.js";

export default function (eleventyConfig) {
  // Copy static assets straight through to the output folder.
  eleventyConfig.addPassthroughCopy({ "src/assets": "assets" });
  eleventyConfig.addPassthroughCopy("src/CNAME");
  eleventyConfig.addPassthroughCopy("src/favicon.svg");
  eleventyConfig.addPassthroughCopy("src/.nojekyll");

  // Rebuild when assets change.
  eleventyConfig.addWatchTarget("src/assets/");

  // Minify inlined CSS.
  eleventyConfig.addFilter("cssmin", (code) => new CleanCSS({}).minify(code).styles);

  // Blog posts collection (newest first).
  eleventyConfig.addCollection("posts", (api) =>
    api.getFilteredByGlob("src/blog/*.md").sort((a, b) => b.date - a.date)
  );

  // Date filters for the blog.
  eleventyConfig.addFilter("readableDate", (d) =>
    new Date(d).toLocaleDateString("en-US", {
      year: "numeric",
      month: "long",
      day: "numeric",
      timeZone: "UTC",
    })
  );
  eleventyConfig.addFilter("htmlDateString", (d) =>
    new Date(d).toISOString().split("T")[0]
  );

  // Build an absolute URL (used for canonical tags, sitemap, Open Graph, JSON-LD).
  eleventyConfig.addFilter("absoluteUrl", (path, base) => {
    try {
      return new URL(path, base).href;
    } catch (e) {
      return path;
    }
  });

  // Responsive images: add srcset (from pre-generated -480w/-800w/-1200w webp
  // variants) and missing width/height to every local image in the output HTML.
  const VARIANT_WIDTHS = [480, 800, 1200];
  eleventyConfig.addTransform("imgopt", function (content) {
    if (!(this.page.outputPath || "").endsWith(".html")) return content;
    return content.replace(/<img\b[^>]*>/g, (tag) => {
      const src = (tag.match(/\bsrc="([^"]+)"/) || [])[1];
      if (!src || !src.startsWith("/assets/img/") || /-\d+w\.webp$/.test(src)) return tag;
      let out = tag;
      const dims = imageDims[src];
      if (dims && !/\bwidth=/.test(out)) {
        out = out.replace(/^<img/, `<img width="${dims.width}" height="${dims.height}"`);
      }
      if (!/\bsrcset=/.test(out)) {
        const base = src.replace(/\.(webp|jpe?g|png)$/i, "");
        const variants = VARIANT_WIDTHS
          .map((w) => ({ w, path: `${base}-${w}w.webp` }))
          .filter((v) => imageDims[v.path]);
        if (variants.length) {
          const parts = variants.map((v) => `${v.path} ${v.w}w`);
          if (dims) parts.push(`${src} ${dims.width}w`);
          const sizes = /fetchpriority="high"/.test(out)
            ? "100vw"
            : "(min-width: 800px) 50vw, 94vw";
          out = out.replace(/^<img/, `<img srcset="${parts.join(", ")}" sizes="${sizes}"`);
        }
      }
      return out;
    });
  });

  return {
    dir: {
      input: "src",
      output: "_site",
      includes: "_includes",
      data: "_data",
    },
    markdownTemplateEngine: "njk",
    htmlTemplateEngine: "njk",
    templateFormats: ["njk", "md", "html"],
  };
}
