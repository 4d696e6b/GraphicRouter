import { describe, expect, it, vi } from "vitest";
import { DeckService, type CanvaPort, type FileStore } from "../../src/server/service";
import { D1DeckStore } from "../../src/server/store";
import { testDatabase } from "./database";
import { testEngine } from "./engine-double";
import { sampleDeck } from "../../src/fixtures/sample-deck";
import { engine as productionEngine } from "../../src/server/engine-provider";
import { engine as realEngine } from "../../src/engine";
import { CanvaConnectionRequired } from "../../src/integrations/canva/errors";

function setup() {
  const { db, sql } = testDatabase(), store = new D1DeckStore(db), objects = new Map<string, Uint8Array>();
  const files: FileStore = { put: async (k, b) => { objects.set(k, b); }, get: async k => objects.get(k) ?? null };
  const canva = { connected: vi.fn(async () => true), start: vi.fn<CanvaPort["start"]>(async () => ({ status: "pending", jobId: "real-job-shaped-test" })), poll: vi.fn<CanvaPort["poll"]>(async () => ({ status: "succeeded", jobId: "real-job-shaped-test", designId: "test-design", editUrl: "https://www.canva.com/design/test/edit" })) };
  const engine = { ...testEngine };
  const service = new DeckService({ store, files, engine, canva, assets: [], origin: "https://example.test" });
  return { service, store, files, canva, objects, engine, sql };
}
const owner = "owner-one";
const revision = (deckId: string) => ({ deckId, baseVersion: 1, operations: [{ type: "set_element_color", elementId: "slide3.headline", color: "#7C3AED" }] });
describe("service using labelled engine double, real SQLite migrations", () => {
  it("rejects missing identity and malformed content before the engine", async () => {
    const { service, engine } = setup();
    const create = vi.spyOn(engine, "createBlueprint");
    await expect(service.call("create_deck", sampleDeck, null)).rejects.toMatchObject({ detail: { code: "UNAUTHORIZED" } });
    await expect(service.call("create_deck", { ...sampleDeck, slides: [] }, owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED" } });
    expect(create).not.toHaveBeenCalled();
  });
  it("creates server IDs, isolates users on reads/files/previews", async () => {
    const { service } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    const input = { deckId: b.deckId, version: 1 };
    await service.call("export_deck", input, owner);
    for (const action of [() => service.call("get_deck", input, "intruder"), () => service.download("intruder", b.deckId, 1, "pptx"), () => service.preview("intruder", b.deckId, 1, "finished")]) await expect(action()).rejects.toMatchObject({ detail: { code: "NOT_FOUND" } });
    await expect(service.download(null, b.deckId, 1, "notes")).rejects.toMatchObject({ detail: { code: "UNAUTHORIZED" } });
    expect(await service.download(owner, b.deckId, 1, "pptx")).toBeInstanceOf(Uint8Array);
  });
  it("one concurrent revision wins; old version and unrelated elements stay unchanged", async () => {
    const { service, store, sql } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    const results = await Promise.allSettled([service.call("revise_deck", revision(b.deckId), owner), service.call("revise_deck", revision(b.deckId), owner)]);
    expect(results.filter(r => r.status === "fulfilled")).toHaveLength(1);
    expect(results.find(r => r.status === "rejected")).toMatchObject({ reason: { detail: { code: "VERSION_CONFLICT", currentVersion: 2 } } });
    expect(await store.read(owner, b.deckId, 1)).toEqual(b);
    const next = await store.read(owner, b.deckId, 2);
    expect(next.slides[0]).toEqual(b.slides[0]);
    expect(next.slides[2].elements[0]).toMatchObject({ color: { hex: "#7C3AED" } });
    expect(() => sql.prepare("UPDATE deck_versions SET blueprint = '{}' WHERE deck_id = ?").run(b.deckId)).toThrow("IMMUTABLE_VERSION");
    expect(() => sql.prepare("DELETE FROM deck_versions WHERE deck_id = ?").run(b.deckId)).toThrow("IMMUTABLE_VERSION");
  });
  it("failed engine validation leaves previous version intact", async () => {
    const { service, store, engine } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    engine.validateBlueprint = () => [{ severity: "error", code: "FIT", path: "slide3", message: "Shorten headline" }];
    await expect(service.call("revise_deck", revision(b.deckId), owner)).rejects.toMatchObject({ detail: { code: "VALIDATION_FAILED" } });
    expect(await store.read(owner, b.deckId, 1)).toEqual(b);
    await expect(store.read(owner, b.deckId, 2)).rejects.toThrow();
  });
  it("export failure preserves blueprint and does not create import jobs", async () => {
    const { service, store, engine, canva } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    engine.compilePowerPoint = async () => { throw new Error("secret internal details"); };
    await expect(service.call("send_to_canva", { deckId: b.deckId, version: 1 }, owner)).rejects.toMatchObject({ detail: { code: "EXPORT_FAILED" } });
    expect(await store.read(owner, b.deckId, 1)).toEqual(b);
    expect(await store.importState(b.deckId, 1)).toEqual({ status: "not_started" });
    expect(canva.start).not.toHaveBeenCalled();
  });
  it("exports both notes durations and previews from the stored blueprint", async () => {
    const { service, engine, objects } = setup();
    const render = vi.spyOn(engine, "renderSlideSvg"), compile = vi.spyOn(engine, "compilePowerPoint");
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    const result = await service.call("export_deck", { deckId: b.deckId, version: 1 }, owner);
    expect(result.files?.pptxUrl).toContain(`/api/decks/${b.deckId}/1/files/pptx`);
    expect(new TextDecoder().decode(objects.get(service.key(b, "notes")))).toContain(b.slides[0].notes.expanded);
    await service.preview(owner, b.deckId, 1, "layout");
    expect(compile.mock.calls[0][0]).toEqual(b);
    expect(render.mock.calls[0][0]).toEqual(b.slides[0]);
  });
  it("missing Canva auth returns connection instructions with a PPTX fallback", async () => {
    const { service, canva } = setup(); canva.connected.mockResolvedValue(false);
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    const result = await service.call("send_to_canva", { deckId: b.deckId, version: 1 }, owner);
    expect(result.canva).toMatchObject({ status: "connection_required" }); expect(result.files).toBeDefined(); expect(canva.start).not.toHaveBeenCalled();
  });
  it("claims import once under concurrency and polls without reimporting", async () => {
    const { service, canva } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    await Promise.all([service.call("send_to_canva", input, owner), service.call("send_to_canva", input, owner)]);
    expect(canva.start).toHaveBeenCalledTimes(1);
    expect((await service.call("get_deck", input, owner)).canva.status).toBe("succeeded");
    await service.call("send_to_canva", input, owner);
    expect(canva.start).toHaveBeenCalledTimes(1); expect(canva.poll).toHaveBeenCalledTimes(1);
  });
  it("failed imports keep downloads and are not retried automatically", async () => {
    const { service, canva } = setup(); canva.start.mockRejectedValue(new Error("unknown transport outcome"));
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    const result = await service.call("send_to_canva", input, owner);
    expect(result.canva).toMatchObject({ status: "failed", code: "IMPORT_OUTCOME_UNKNOWN" }); expect(result.files).toBeDefined();
    await service.call("send_to_canva", input, owner); expect(canva.start).toHaveBeenCalledTimes(1);
  });
  it("releases only an unstarted import after auth failure so reconnect can resume", async () => {
    const { service, canva, store } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    canva.start.mockRejectedValueOnce(new CanvaConnectionRequired());
    const first = await service.call("send_to_canva", input, owner);
    expect(first.canva).toMatchObject({ status: "connection_required", connectUrl: "https://example.test/api/canva/connect" });
    expect(first.files).toBeDefined();
    expect(await store.importState(b.deckId, 1)).toEqual({ status: "not_started" });
    const retried = await service.call("send_to_canva", input, owner);
    expect(retried.canva).toEqual({ status: "pending", jobId: "real-job-shaped-test" });
    expect(canva.start).toHaveBeenCalledTimes(2); // First call failed before sending bytes.
    await store.releaseUnstartedImport(b.deckId, 1);
    expect(await store.importState(b.deckId, 1)).toEqual({ status: "pending", jobId: "real-job-shaped-test" });
  });
  it("poll authorization failure offers reconnect without losing or restarting the pending job", async () => {
    const { service, canva, store } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    await service.call("send_to_canva", input, owner);
    canva.poll.mockRejectedValueOnce(new CanvaConnectionRequired());
    const needsAuth = await service.call("get_deck", input, owner);
    expect(needsAuth.canva.status).toBe("connection_required"); expect(needsAuth.files).toBeDefined();
    expect(await store.importState(b.deckId, 1)).toEqual({ status: "pending", jobId: "real-job-shaped-test" });
    expect((await service.call("get_deck", input, owner)).canva.status).toBe("succeeded");
    expect(canva.poll.mock.calls.every(([, id]) => id === "real-job-shaped-test")).toBe(true);
    expect(canva.start).toHaveBeenCalledTimes(1);
    await store.releaseUnstartedImport(b.deckId, 1);
    expect((await store.importState(b.deckId, 1)).status).toBe("succeeded");
  });
  it("transient polling failure preserves the pending job", async () => {
    const { service, canva } = setup(); canva.poll.mockRejectedValue(new Error("timeout"));
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    await service.call("send_to_canva", input, owner);
    expect((await service.call("get_deck", input, owner)).canva.status).toBe("pending"); expect(canva.start).toHaveBeenCalledTimes(1);
  });
  it.each(["succeeded", "failed"] as const)("a late pending poll cannot regress a %s import", async status => {
    const { service, canva, store } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner), input = { deckId: b.deckId, version: 1 };
    await service.call("send_to_canva", input, owner);
    let finishLate!: (state: Awaited<ReturnType<CanvaPort["poll"]>>) => void;
    let entered!: () => void;
    const started = new Promise<void>(resolve => { entered = resolve; });
    canva.poll.mockImplementationOnce(() => { entered(); return new Promise(resolve => { finishLate = resolve; }); });
    const late = service.call("get_deck", input, owner);
    await started;
    const terminal = status === "succeeded"
      ? { status: "succeeded" as const, jobId: "real-job-shaped-test", designId: "design", editUrl: "https://www.canva.com/design/test/edit" }
      : { status: "failed" as const, jobId: "real-job-shaped-test", code: "CANVA_IMPORT_FAILED", message: "Test conversion failed" };
    canva.poll.mockResolvedValueOnce(terminal);
    expect((await service.call("get_deck", input, owner)).canva).toEqual(terminal);
    finishLate({ status: "pending", jobId: "real-job-shaped-test" });
    expect((await late).canva).toEqual(terminal);
    expect(await store.importState(b.deckId, 1)).toEqual(terminal);
    expect(canva.start).toHaveBeenCalledTimes(1);
  });
  it("R2 discovery failure does not hide an intact saved presentation", async () => {
    const { service, files } = setup();
    const { blueprint: b } = await service.call("create_deck", sampleDeck, owner);
    files.get = async () => { throw new Error("R2 unavailable"); };
    const result = await service.call("get_deck", { deckId: b.deckId, version: 1 }, owner);
    expect(result.blueprint).toEqual(b);
    expect(result.files).toBeUndefined();
    expect((await service.preview(owner, b.deckId, 1, "finished")).slides).toHaveLength(5);
  });
  it("production provider is the reviewed real engine, never the test double", () => {
    expect(productionEngine).toBe(realEngine);
    expect(productionEngine).not.toBe(testEngine);
  });
});
