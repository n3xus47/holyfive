import path from "node:path";
import { cpSync } from "node:fs";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(projectRoot, "src");

export default defineConfig({
  plugins: [{
    name: "holyfive-static-assets",
    closeBundle() {
      // Partials and model/texture URLs are fetched at runtime rather than imported.
      const source = path.resolve(root, "pages/views/holyfive");
      cpSync(source, path.resolve(projectRoot, "dist/pages/views/holyfive"), {
        recursive: true,
        filter: (file) => !["holyfive.html", "akademia.html", "zawodnicy.html"].includes(path.basename(file)),
      });
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
