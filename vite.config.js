import path from "node:path";
import { cpSync, readdirSync, readFileSync, writeFileSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(projectRoot, "src");
const pagesBase = process.env.PAGES_BASE || "/";

export default defineConfig({
  base: pagesBase,
  plugins: [{
    name: "holyfive-static-assets",
    closeBundle() {
      // Partials and model/texture URLs are fetched at runtime rather than imported.
      const source = path.resolve(root, "pages/views/holyfive");
      cpSync(source, path.resolve(projectRoot, "dist/pages/views/holyfive"), {
        recursive: true,
        filter: (file) => !["holyfive.html", "akademia.html", "zawodnicy.html"].includes(path.basename(file)),
      });
      // Runtime URLs in copied partials and scripts also need the repository prefix.
      if (pagesBase !== "/") {
        function rewrite(directory) {
          for (const entry of readdirSync(directory, { withFileTypes: true })) {
            const file = path.join(directory, entry.name);
            if (entry.isDirectory()) rewrite(file);
            else if (/\.(html|css|js|webmanifest)$/.test(entry.name)) {
              const content = readFileSync(file, "utf8").replace(
                /(["'`(=])\/(pages|features|shared)\//g,
                `$1${pagesBase}$2/`,
              );
              writeFileSync(file, content);
            }
          }
        }
        rewrite(path.resolve(projectRoot, "dist"));
      }
    },
  }],
  root,
  publicDir: path.resolve(projectRoot, "public"),
  build: {
    outDir: path.resolve(projectRoot, "dist"),
    emptyOutDir: true,
    rollupOptions: {
      input: {
        index: path.resolve(root, "index.html"),
        holyfive: path.resolve(root, "pages/views/holyfive/holyfive.html"),
        akademia: path.resolve(root, "pages/views/holyfive/akademia.html"),
        zawodnicy: path.resolve(root, "pages/views/holyfive/zawodnicy.html"),
      },
    },
  },
});
