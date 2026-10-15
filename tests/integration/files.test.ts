import { describe, expect, it, vi } from "vitest";
import { R2FileStore } from "../../src/server/files";

describe("R2 versioned file adapter", () => {
  it("requests atomic write-once behavior and checks existence without downloading", async () => {
    const put = vi.fn(async (_key: string, _value: ArrayBuffer, _options: R2PutOptions) => null), head = vi.fn(async () => ({ key: "file" })), get = vi.fn();
    const bucket = { put, head, get } as unknown as Pick<R2Bucket, "put" | "head" | "get">;
    const files = new R2FileStore(bucket);
    await files.put("file", new Uint8Array([80, 75]), "test/pptx");
    const options = put.mock.calls[0][2];
    expect((options.onlyIf as Headers).get("If-None-Match")).toBe("*");
    expect(options.httpMetadata).toEqual({ contentType: "test/pptx" });
    expect(await files.exists("file")).toBe(true);
    expect(get).not.toHaveBeenCalled();
  });
});
