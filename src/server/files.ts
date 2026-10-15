import type { FileStore } from "./service";

/** Versioned exports are write-once, including under concurrent export requests. */
export class R2FileStore implements FileStore {
  constructor(private bucket: Pick<R2Bucket, "put" | "get" | "head">) {}
  async put(key: string, bytes: Uint8Array, mime: string) {
    await this.bucket.put(key, new Uint8Array(bytes).buffer, {
      httpMetadata: { contentType: mime },
      onlyIf: new Headers({ "If-None-Match": "*" }),
    });
  }
  async get(key: string) {
    const value = await this.bucket.get(key);
    return value ? new Uint8Array(await value.arrayBuffer()) : null;
  }
  async exists(key: string) { return !!await this.bucket.head(key); }
}
