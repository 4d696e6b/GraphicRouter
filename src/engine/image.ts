import type { Asset, SlideElement } from "../contracts";
import { fail } from "./errors";

export function bytesToBase64(bytes: Uint8Array): string {
  let value = "";
  for (let start = 0; start < bytes.length; start += 8192) value += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(value);
}

function dimensions(asset: Asset): { width: number; height: number } {
  const bytes = asset.data;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (asset.mimeType === "image/png" && bytes.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b) && view.getUint32(8) === 13 && view.getUint32(12) === 0x49484452) {
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (asset.mimeType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    let offset = 2;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9 || marker === 0xda) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && length >= 8) return { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
      offset += length;
    }
  }
  fail("INVALID_ASSET", asset.id, "Asset bytes must match a supported PNG or JPEG header.");
}

export function assetRegistry(assets: Asset[]): Map<string, { asset: Asset; width: number; height: number }> {
  if (!Array.isArray(assets) || assets.length > 8) fail("INVALID_ASSET", "assets", "Supply at most eight bundled PNG/JPEG assets.");
  const registry = new Map<string, { asset: Asset; width: number; height: number }>();
  let bytes = 0;
  for (const asset of assets) {
    if (!asset || typeof asset.id !== "string" || !asset.id || registry.has(asset.id) || !(asset.data instanceof Uint8Array)) fail("INVALID_ASSET", "assets", "Each asset needs a unique ID and Uint8Array bytes.");
    bytes += asset.data.length;
    if (asset.data.length > 2 * 1024 * 1024 || bytes > 8 * 1024 * 1024) fail("ASSET_TOO_LARGE", asset.id, "Use images under 2 MiB each and 8 MiB combined.");
    const size = dimensions(asset);
    if (!size.width || !size.height || size.width > 4096 || size.height > 4096) fail("INVALID_ASSET", asset.id, "Image dimensions must be between 1 and 4096 pixels.");
    registry.set(asset.id, { asset, ...size });
  }
  return registry;
}

export function requireAsset(registry: ReturnType<typeof assetRegistry>, assetId: string) {
  const value = registry.get(assetId);
  if (!value) fail("MISSING_ASSET", assetId, `Supply the bundled asset ${assetId} before rendering or exporting. No placeholder was exported.`);
  return value;
}

export function imageDataUri(asset: Asset): string { return `data:${asset.mimeType};base64,${bytesToBase64(asset.data)}`; }

export function containImage(element: Extract<SlideElement, { type: "image" }>, image: { width: number; height: number }) {
  const scale = Math.min(element.width / image.width, element.height / image.height);
  const width = image.width * scale, height = image.height * scale;
  return { x: element.x + (element.width - width) / 2, y: element.y + (element.height - height) / 2, width, height };
}
