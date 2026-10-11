import react from "@vitejs/plugin-react";
import { fileURLToPath } from "node:url";
import { defineConfig } from "vite";

const from = (path: string): string => fileURLToPath(new URL(path, import.meta.url));

// The showcase site at sumi.tengubyte.io. It imports the package from src, so it always shows the current code.
export default defineConfig({
  root: "site",
  plugins: [react()],
  resolve: {
    alias: {
      "@tengubyte/sumi/core": from("./src/core/index.ts"),
      "@tengubyte/sumi": from("./src/index.ts"),
    },
  },
  build: {
    outDir: "dist",
    emptyOutDir: true,
    // Fonts stay as files: the CSP in site/public/_headers only allows fonts from this origin.
    assetsInlineLimit: (file) => (/\.woff2?$/.test(file) ? false : undefined),
  },
});
