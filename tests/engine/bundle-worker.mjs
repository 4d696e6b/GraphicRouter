import { build } from "vite";

await build({
  configFile: false,
  logLevel: "warn",
  build: {
    outDir: "artifacts/builder-a/worker",
    target: "es2022",
    lib: { entry: "tests/engine/worker-probe.ts", formats: ["es"], fileName: () => "worker.mjs" },
    minify: false,
  },
});
