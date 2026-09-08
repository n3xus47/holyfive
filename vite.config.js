import path from "node:path";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const projectRoot = path.dirname(fileURLToPath(import.meta.url));
const root = path.resolve(projectRoot, "src");

export default defineConfig({
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
