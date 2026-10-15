import type { Asset, SlideElement } from "../contracts";
import { fail } from "./errors";

const crcTable = Uint32Array.from({ length: 256 }, (_, index) => {
  let value = index;
  for (let bit = 0; bit < 8; bit++) value = value & 1 ? 0xedb88320 ^ (value >>> 1) : value >>> 1;
  return value >>> 0;
});

function crc32(bytes: Uint8Array): number {
  let crc = 0xffffffff;
  for (const byte of bytes) crc = crcTable[(crc ^ byte) & 255] ^ (crc >>> 8);
  return (crc ^ 0xffffffff) >>> 0;
}

/** Check container structure/checksums; full pixel decoding belongs to image software. */
function completePng(bytes: Uint8Array, view: DataView): boolean {
  let offset = 8, imageBytes = 0;
  while (offset + 12 <= bytes.length) {
    const length = view.getUint32(offset), end = offset + length + 12;
    if (end > bytes.length) return false;
    const type = String.fromCharCode(...bytes.subarray(offset + 4, offset + 8));
    if (!/^[A-Za-z]{4}$/.test(type) || (type === "IHDR" && offset !== 8)) return false;
    if (crc32(bytes.subarray(offset + 4, end - 4)) !== view.getUint32(end - 4)) return false;
    if (type === "IDAT") imageBytes += length;
    if (type === "IEND") return length === 0 && imageBytes > 0 && end === bytes.length;
    offset = end;
  }
  return false;
}

export function bytesToBase64(bytes: Uint8Array): string {
  let value = "";
  for (let start = 0; start < bytes.length; start += 8192) value += String.fromCharCode(...bytes.subarray(start, start + 8192));
  return btoa(value);
}

function dimensions(asset: Asset): { width: number; height: number } {
  const bytes = asset.data;
  const view = new DataView(bytes.buffer, bytes.byteOffset, bytes.byteLength);
  if (asset.mimeType === "image/png" && bytes.length >= 33 && [137, 80, 78, 71, 13, 10, 26, 10].every((b, i) => bytes[i] === b) && view.getUint32(8) === 13 && view.getUint32(12) === 0x49484452) {
    if (!completePng(bytes, view)) fail("INVALID_ASSET", asset.id, "The PNG is truncated, has a damaged chunk checksum, or has trailing data. Supply the complete original image.");
    return { width: view.getUint32(16), height: view.getUint32(20) };
  }
  if (asset.mimeType === "image/jpeg" && bytes.length >= 4 && bytes[0] === 255 && bytes[1] === 216) {
    if (bytes[bytes.length - 2] !== 255 || bytes[bytes.length - 1] !== 217) fail("INVALID_ASSET", asset.id, "The JPEG has no complete end marker. Supply the complete original image.");
    let offset = 2;
    let frame: { width: number; height: number } | undefined;
    while (offset + 4 < bytes.length) {
      if (bytes[offset] !== 255) break;
      while (bytes[offset] === 255) offset++;
      const marker = bytes[offset++];
      if (marker === 0xd9) break;
      if (marker === 0x01 || (marker >= 0xd0 && marker <= 0xd8)) continue;
      if (offset + 2 > bytes.length) break;
      const length = view.getUint16(offset);
      if (length < 2 || offset + length > bytes.length) break;
      if (marker === 0xda) {
        if (frame && offset + length < bytes.length - 2) return frame;
        break;
      }
      if (marker >= 0xc0 && marker <= 0xcf && ![0xc4, 0xc8, 0xcc].includes(marker) && length >= 8) frame = { height: view.getUint16(offset + 3), width: view.getUint16(offset + 5) };
      offset += length;
    }
  }
  fail("INVALID_ASSET", asset.id, "Asset bytes must contain a complete supported PNG or JPEG container.");
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
