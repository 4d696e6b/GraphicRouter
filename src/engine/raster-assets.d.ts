declare module "graphicrouter:raster-assets" {
  export const wasmModule: Promise<WebAssembly.Module> | WebAssembly.Module;
  export const fontBuffers: Uint8Array[];
}
