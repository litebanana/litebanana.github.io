import { defineConfig } from "vite";
import react from "@vitejs/plugin-react";

// GitHub Pages configuration
// ---------------------------
// `base: "./"` makes every asset URL relative, so the built site works at:
//   - https://<username>.github.io/            (user / organization page)
//   - https://<username>.github.io/<repo>/     (project page)
// No absolute localhost paths are used anywhere in the project.
export default defineConfig({
  plugins: [react()],
  base: "./",
  build: {
    outDir: "dist",
    sourcemap: false,
    // Keep the initial bundle light for fast GitHub Pages loads.
    assetsInlineLimit: 4096,
  },
});
