import { inflateRawSync } from "node:zlib";

/** Minimal ZIP reader for inspecting our generated OOXML; no new dependency. */
export function readPptxBytes(bytes: Uint8Array): Map<string, Uint8Array> {
  const buffer = Buffer.from(bytes);
  let end = buffer.length - 22;
  while (end >= Math.max(0, buffer.length - 65557) && buffer.readUInt32LE(end) !== 0x06054b50) end--;
  if (end < Math.max(0, buffer.length - 65557)) throw new Error("Missing ZIP directory.");
  const result = new Map<string, Uint8Array>();
  const count = buffer.readUInt16LE(end + 10);
  let directory = buffer.readUInt32LE(end + 16);
  for (let index = 0; index < count; index++) {
    if (buffer.readUInt32LE(directory) !== 0x02014b50) throw new Error("Invalid ZIP central entry.");
    const method = buffer.readUInt16LE(directory + 10), length = buffer.readUInt32LE(directory + 20);
    const nameLength = buffer.readUInt16LE(directory + 28), extraLength = buffer.readUInt16LE(directory + 30), commentLength = buffer.readUInt16LE(directory + 32);
    const name = buffer.subarray(directory + 46, directory + 46 + nameLength).toString("utf8");
    const local = buffer.readUInt32LE(directory + 42), start = local + 30 + buffer.readUInt16LE(local + 26) + buffer.readUInt16LE(local + 28);
    const compressed = buffer.subarray(start, start + length);
    if (method !== 0 && method !== 8) throw new Error("Unsupported ZIP compression.");
    const data = method === 8 ? inflateRawSync(compressed) : compressed;
    result.set(name, data);
    directory += 46 + nameLength + extraLength + commentLength;
  }
  return result;
}

export function readPptx(bytes: Uint8Array): Map<string, string> {
  return new Map([...readPptxBytes(bytes)].map(([name, data]) => [name, Buffer.from(data).toString("utf8")]));
}
