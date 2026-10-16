import type { FileStore } from "./service";
import { fail } from "./errors";

/** Versioned exports are write-once, including under concurrent export requests. */
export class R2FileStore implements FileStore {
  constructor(private bucket: Pick<R2Bucket, "put" | "get" | "head">, private retention?: { active(key: string): Promise<boolean>; remove(key: string): Promise<void> }) {}
  async put(key: string, bytes: Uint8Array, mime: string) {
    if (this.retention && !await this.retention.active(key)) fail("NOT_FOUND", "This saved design has expired.");
    await this.bucket.put(key, new Uint8Array(bytes).buffer, {
      httpMetadata: { contentType: mime },
      onlyIf: new Headers({ "If-None-Match": "*" }),
    });
    if (this.retention && !await this.retention.active(key)) {
      await this.retention.remove(key);
      fail("NOT_FOUND", "This saved design expired during export.");
    }
  }
  async get(key: string) {
    const value = await this.bucket.get(key);
    return value ? new Uint8Array(await value.arrayBuffer()) : null;
  }
  async exists(key: string) { return !!await this.bucket.head(key); }
}
