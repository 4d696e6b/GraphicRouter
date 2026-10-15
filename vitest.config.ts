import { defineConfig } from "vitest/config";
import { previewBundle } from "./src/preview/bundle-plugin";
import { rasterBundle } from "./src/engine/raster-bundle-plugin";
import { fileURLToPath } from "node:url";

export default defineConfig({
  plugins: [previewBundle(), rasterBundle({ target: "node" })],
  resolve: { alias: { "@": fileURLToPath(new URL(".", import.meta.url)) } },
  test: { environment: "node", include: ["tests/**/*.test.ts", "tests/**/*.test.tsx"], exclude: ["node_modules", "dist"] },
});
