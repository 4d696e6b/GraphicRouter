import { describe, expect, it } from "vitest";
import { readJsonBody } from "../../src/server/json-body";
const request = (body: BodyInit, headers: Record<string,string> = {}) => new Request("https://example.test", {method:"POST", body, headers, duplex:"half"} as RequestInit);
describe("bounded JSON request parsing", () => {
  it("preserves valid multibyte copy and measures bytes rather than characters", async () => {
    const body = JSON.stringify({text:"ภาษาไทย"});
    expect((await readJsonBody(request(body), 100)).value).toEqual({text:"ภาษาไทย"});
    await expect(readJsonBody(request(body), body.length)).rejects.toThrow("request limit");
  });
  it("rejects a false small length while streaming and cancels further input", async () => {
    let cancelled = false;
    const stream = new ReadableStream<Uint8Array>({ pull(controller) { controller.enqueue(new Uint8Array(50)); }, cancel() {cancelled=true;} });
    await expect(readJsonBody(request(stream,{"content-length":"1"}), 80)).rejects.toThrow("request limit");
    expect(cancelled).toBe(true);
  });
  it("rejects declared oversized bodies before reading, and malformed UTF-8/JSON", async () => {
    await expect(readJsonBody(request("{}",{"content-length":"1000000"}),100)).rejects.toThrow("request limit");
    await expect(readJsonBody(request(new Uint8Array([0xff])))).rejects.toThrow("UTF-8 JSON");
    await expect(readJsonBody(request("{broken"))).rejects.toThrow("UTF-8 JSON");
  });
});
