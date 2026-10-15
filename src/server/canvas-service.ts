import { canvasVersionSchema, createCanvasSchema, editCanvasSchema, inspectCanvasSchema, type Asset, type CanvasBlueprint, type CanvasEngine, type CanvasRasterizer, type CanvasResult, type CanvasToolName, type CanvaImport } from "../contracts";
import type { DeckStore } from "./store";
import type { CanvaPort, FileStore } from "./service";
import { EngineError } from "../engine/errors";
import { CanvaConnectionRequired } from "../integrations/canva/errors";
import { fail, ServiceError } from "./errors";
import { reviewDesign } from "../engine/design-review";

export class CanvasService {
  constructor(private deps: { store: DeckStore<CanvasBlueprint>; files: FileStore; engine: CanvasEngine; assets: Asset[]; canva: CanvaPort; origin: string; raster?: CanvasRasterizer }) {}
  private compose(action: () => CanvasBlueprint) {
    try {
      const b = action();
      const issues = this.deps.engine.validate(b).filter(i => i.severity === "error");
      if (issues.length) fail("VALIDATION_FAILED", issues.map(i => `${i.path}: ${i.message}`).join("\n"));
      for (const element of b.elements) if (element.type === "image" && !this.deps.assets.some(asset => asset.id === element.assetId)) fail("VALIDATION_FAILED", `${element.id}: unknown asset ${element.assetId}. Use a registered asset or a native diagram; no version was saved.`);
      return b;
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      if (error instanceof EngineError) fail(error.code, error.issues.length ? error.issues.map(i => `${i.path}: ${i.message}`).join("\n") : error.message);
      fail("VALIDATION_FAILED", "The canvas could not be composed. Check object IDs, positions and text fit. The saved version is unchanged.");
    }
  }
  private async read(owner: string, id: string, version: number) {
    const b = await this.deps.store.read(owner, id, version);
    if (b.schemaVersion !== 2 || b.kind !== "canvas") fail("NOT_FOUND", "This is not a freeform canvas. Use get_deck for legacy presentations.");
    return b;
  }
  private result(b: CanvasBlueprint, canva: CanvaImport = { status: "not_started" }): CanvasResult { return { blueprint: b, previewUrl: `${this.deps.origin}/canvases/${b.deckId}/${b.version}`, canva }; }
  private connection(): CanvaImport { return { status: "connection_required", connectUrl: `${this.deps.origin}/api/canva/connect` }; }
  key(b: CanvasBlueprint, kind: "pptx" | "notes") { return `canvases/${b.deckId}/v${b.version}/${kind}`; }
  private urls(b: CanvasBlueprint) { const path = `${this.deps.origin}/api/canvases/${b.deckId}/${b.version}/files`; return { pptxUrl: `${path}/pptx`, notesUrl: `${path}/notes` }; }
  private async exists(key: string) { return this.deps.files.exists ? this.deps.files.exists(key) : !!await this.deps.files.get(key); }
  async call(name: CanvasToolName, raw: unknown, owner: string | null): Promise<CanvasResult> {
    if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to access your canvases.");
    const parsed = (name === "create_canvas" ? createCanvasSchema : name === "edit_canvas" ? editCanvasSchema : canvasVersionSchema).safeParse(raw);
    if (!parsed.success) fail("VALIDATION_FAILED", parsed.error.issues.map(i => `${i.path.join(".")}: ${i.message}`).join("; "));
    if (name === "create_canvas") {
      const identity = { deckId: crypto.randomUUID(), version: 1 };
      const b = this.compose(() => this.deps.engine.create(createCanvasSchema.parse(raw), identity));
      if (b.deckId !== identity.deckId || b.version !== 1 || b.elements.length) fail("VALIDATION_FAILED", "A new canvas must start blank at version one.");
      await this.deps.store.create(owner, b); return this.result(b);
    }
    if (name === "edit_canvas") {
      const input = editCanvasSchema.parse(raw), current = await this.read(owner, input.deckId, input.baseVersion);
      const next = this.compose(() => this.deps.engine.edit(structuredClone(current), input));
      if (next.deckId !== current.deckId || next.version !== current.version + 1) fail("VALIDATION_FAILED", "Invalid canvas revision identity.");
      await this.deps.store.append(owner, input.baseVersion, next); return this.result(next);
    }
    const input = canvasVersionSchema.parse(raw), b = await this.read(owner, input.deckId, input.version);
    let state = await this.deps.store.importState(b.deckId, b.version);
    if (name === "get_canvas" && state.status === "pending") {
      const jobId = state.jobId;
      try { state = await this.deps.store.saveImport(b.deckId, b.version, await this.deps.canva.poll(owner, jobId)); }
      catch (error) { state = error instanceof CanvaConnectionRequired ? this.connection() : { status: "failed", jobId, code: "CANVA_POLL_FAILED", message: `Could not refresh job ${jobId}. The job and canvas are preserved. Use get_canvas to retry this same job; no second import was started.` }; }
    }
    if (name === "export_canvas" || name === "send_canvas_to_canva") {
      const files = await this.export(b);
      if (name === "send_canvas_to_canva" && state.status === "not_started") {
        if (!await this.deps.canva.connected(owner)) state = this.connection();
        else {
          let bytes: Uint8Array | null;
          try { bytes = await this.deps.files.get(this.key(b, "pptx")); } catch { fail("EXPORT_FAILED", "Could not read the saved canvas export. No Canva import started."); }
          if (!bytes) fail("EXPORT_FAILED", "The canvas export is unavailable. Export again before importing.");
          if (await this.deps.store.claimImport(b.deckId, b.version)) {
            try { state = await this.deps.canva.start(owner, bytes, `${b.title.slice(0, 35)} · v${b.version}`); }
            catch (error) {
              if (error instanceof CanvaConnectionRequired) { await this.deps.store.releaseUnstartedImport(b.deckId, b.version); return { ...this.result(b, this.connection()), files }; }
              state = { status: "failed", code: "IMPORT_OUTCOME_UNKNOWN", message: "Canva did not confirm the import outcome. Check Canva before creating a new version. Your editable PowerPoint is saved." };
            }
            state = await this.deps.store.saveImport(b.deckId, b.version, state);
          } else state = await this.deps.store.importState(b.deckId, b.version);
        }
      }
      return { ...this.result(b, state), files };
    }
    const result = this.result(b, state);
    try { if (await this.exists(this.key(b, "pptx")) && await this.exists(this.key(b, "notes"))) result.files = this.urls(b); } catch { /* Stored canvas stays readable during file-store outages. */ }
    return result;
  }
  private async export(b: CanvasBlueprint) {
    try {
      this.compose(() => structuredClone(b));
      if (!b.elements.length) fail("VALIDATION_FAILED", "The canvas is blank. Add editable elements with edit_canvas before exporting.");
      if (!await this.exists(this.key(b, "pptx"))) {
        const bytes = await this.deps.engine.compile(structuredClone(b), this.deps.assets);
        if (!bytes.length) fail("EXPORT_FAILED", "The canvas export was empty.");
        await this.deps.files.put(this.key(b, "pptx"), bytes, "application/vnd.openxmlformats-officedocument.presentationml.presentation");
      }
      if (!await this.exists(this.key(b, "notes"))) await this.deps.files.put(this.key(b, "notes"), new TextEncoder().encode(`${b.title}\n\nDesign direction\n${b.designIntent}\n\nSupplied facts\n${b.brief.facts.join("\n")}\n\nUnknowns\n${b.brief.unknowns.join("\n")}\n\nConstruction\n${b.construction.map(p => `v${p.version} · ${p.phase}: ${p.summary}`).join("\n")}`), "text/plain;charset=utf-8");
      return this.urls(b);
    } catch (error) { if (error instanceof ServiceError) throw error; if (error instanceof EngineError) fail(error.code, error.message); fail("EXPORT_FAILED", "Canvas export failed. Your blueprint and earlier files are preserved."); }
  }
  async download(owner: string | null, id: string, version: number, kind: string) {
    if (!owner) fail("UNAUTHORIZED", "Sign in to download this canvas.");
    if (kind !== "pptx" && kind !== "notes") fail("NOT_FOUND", "File not found.");
    const b = await this.read(owner, id, version), bytes = await this.deps.files.get(this.key(b, kind));
    if (!bytes) fail("NOT_FOUND", "Export this canvas version before downloading."); return bytes;
  }
  async preview(owner: string | null, id: string, version: number) {
    if (!owner) fail("UNAUTHORIZED", "Sign in to preview this canvas.");
    const b = await this.read(owner, id, version), { engine, assets } = this.deps;
    const previews = { layout: engine.render(b, "layout", assets), content: engine.render(b, "content", assets), finished: engine.render(b, "finished", assets) };
    // A bounded set of cumulative object views avoids sending 200 full SVG copies.
    const counts = [...new Set([0, Math.ceil(b.elements.length / 3), Math.ceil(2 * b.elements.length / 3), b.elements.length])];
    return { previews, constructionPreviews: counts.map(count => engine.render(b, "finished", assets, count)) };
  }
  async inspect(owner: string | null, raw: unknown) {
    if (!owner) fail("UNAUTHORIZED", "Sign in with ChatGPT to inspect this canvas.");
    const parsed = inspectCanvasSchema.safeParse(raw);
    if (!parsed.success) fail("VALIDATION_FAILED", "Supply a saved canvas ID/version and an optional in-bounds inspection region.");
    const { deckId, version, region } = parsed.data, b = await this.read(owner, deckId, version);
    if (region && (region.x + region.width > b.canvas.width || region.y + region.height > b.canvas.height)) fail("VALIDATION_FAILED", "Keep the inspection region inside this canvas. The stored design is unchanged.");
    if (!this.deps.raster) fail("NOT_IMPLEMENTED", "Image inspection is unavailable in this host. The editable canvas remains saved; use its preview link and do not claim a visual review.");
    try {
      let svg = this.deps.engine.render(b, "finished", this.deps.assets);
      if (region) svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${region.width}" height="${region.height}" viewBox="0 0 ${region.width} ${region.height}">${svg.replace("<svg ", `<svg x="${-region.x}" y="${-region.y}" `)}</svg>`;
      const image = await this.deps.raster(svg, region ?? b.canvas);
      return { image, report: { deckId, version, title: b.title, canvas: b.canvas, region: region ?? null,
        image: { width: image.width, height: image.height, fontNote: image.fontNote },
        issues: [...b.validationIssues, ...reviewDesign(b)],
        reviewInstructions: "Look at the attached PNG. Critique hierarchy, illustration meaning, balance, spacing, density and readability at the target viewing size. Tie each issue to named elements and revise only when it improves the design. This is the GraphicRouter source preview, not the imported Canva rendering; inspect Canva separately before claiming imported fidelity. Automated warnings guide review and are not a beauty score." } };
    } catch (error) {
      if (error instanceof ServiceError) throw error;
      fail("EXPORT_FAILED", "Could not render the inspection image. Your saved canvas is unchanged. Retry inspect_canvas or open its preview; do not claim visual inspection succeeded.");
    }
  }
}
