import { z } from "zod";
import type { CanvaImport } from "../../contracts";
import type { CanvaPort } from "../../server/service";
import { fail } from "../../server/errors";
import { base64, hash, randomSecret, TokenCipher } from "./crypto";

export interface CanvaConfig { clientId: string; clientSecret: string; redirectUri: string; tokenKey: string }
const tokenSchema = z.object({ access_token: z.string().min(1), refresh_token: z.string().min(1), expires_in: z.number().positive() });
type Tokens = z.infer<typeof tokenSchema> & { expiresAt: number };
const jobSchema = z.object({ job: z.object({
  id: z.string().min(1), status: z.enum(["in_progress", "success", "failed"]),
  result: z.object({ designs: z.array(z.object({ id: z.string(), urls: z.object({ edit_url: z.string().url() }) })) }).optional(),
}) });

export class CanvaClient implements CanvaPort {
  private cipher: TokenCipher;
  constructor(private db: D1DatabaseSession, private config: CanvaConfig, private fetcher: typeof fetch = fetch) { this.cipher = new TokenCipher(config.tokenKey); }
  async begin(owner: string) {
    const state = randomSecret(), verifier = randomSecret();
    await this.db.prepare("DELETE FROM canva_oauth_states WHERE expires_at < ?").bind(Date.now()).run();
    await this.db.prepare("INSERT INTO canva_oauth_states (hash, owner, verifier, expires_at) VALUES (?, ?, ?, ?)").bind(await hash(state), owner, await this.cipher.encrypt(owner, verifier), Date.now() + 600_000).run();
    const url = new URL("https://www.canva.com/api/oauth/authorize");
    url.search = new URLSearchParams({ response_type: "code", client_id: this.config.clientId, redirect_uri: this.config.redirectUri,
      scope: "design:content:write design:meta:read", state, code_challenge_method: "S256", code_challenge: await hash(verifier) }).toString();
    return { url: url.toString(), state };
  }
  async complete(owner: string, state: string, cookieState: string | undefined, code: string) {
    if (!state || !cookieState || state !== cookieState || !code) fail("UNAUTHORIZED", "Canva authorization state mismatch. Start the connection again.");
    const row = await this.db.prepare("DELETE FROM canva_oauth_states WHERE hash = ? AND owner = ? AND expires_at > ? RETURNING verifier").bind(await hash(state), owner, Date.now()).first<{ verifier: string }>();
    if (!row) fail("UNAUTHORIZED", "Canva authorization expired or was already used. Start the connection again.");
    const verifier = await this.cipher.decrypt<string>(owner, row.verifier);
    const tokens = await this.exchange({ grant_type: "authorization_code", code, code_verifier: verifier, redirect_uri: this.config.redirectUri });
    await this.saveTokens(owner, tokens);
  }
  private async exchange(params: Record<string, string>): Promise<Tokens> {
    const response = await this.fetcher("https://api.canva.com/rest/v1/oauth/token", { method: "POST", headers: {
      Authorization: `Basic ${base64(new TextEncoder().encode(`${this.config.clientId}:${this.config.clientSecret}`))}`, "Content-Type": "application/x-www-form-urlencoded",
    }, body: new URLSearchParams(params), signal: AbortSignal.timeout(15000) });
    if (!response.ok) fail("CANVA_IMPORT_FAILED", "Canva authorization failed. Reconnect Canva and check the registered callback and scopes.");
    const tokens = tokenSchema.parse(await response.json());
    return { ...tokens, expiresAt: Date.now() + tokens.expires_in * 1000 };
  }
  private async saveTokens(owner: string, tokens: Tokens) {
    await this.db.prepare("INSERT INTO canva_tokens (owner, encrypted, refresh_lock_until) VALUES (?, ?, 0) ON CONFLICT(owner) DO UPDATE SET encrypted = excluded.encrypted, refresh_lock_until = 0").bind(owner, await this.cipher.encrypt(owner, tokens)).run();
  }
  async connected(owner: string) {
    return !!await this.db.prepare("SELECT owner FROM canva_tokens WHERE owner = ?").bind(owner).first();
  }
  private async access(owner: string) {
    const row = await this.db.prepare("SELECT encrypted FROM canva_tokens WHERE owner = ?").bind(owner).first<{ encrypted: string }>();
    if (!row) fail("CANVA_IMPORT_FAILED", "Connect Canva first.");
    const tokens = await this.cipher.decrypt<Tokens>(owner, row.encrypted);
    if (tokens.expiresAt > Date.now() + 60_000) return tokens.access_token;
    const locked = await this.db.prepare("UPDATE canva_tokens SET refresh_lock_until = ? WHERE owner = ? AND refresh_lock_until = 0").bind(Date.now() + 30_000, owner).run();
    if (!locked.meta.changes) fail("CANVA_IMPORT_FAILED", "Canva token refresh is in progress or was interrupted. Retry shortly; reconnect if it persists.");
    // Refresh tokens are single-use. On ambiguous failures leave the lock; reconnect safely.
    const refreshed = await this.exchange({ grant_type: "refresh_token", refresh_token: tokens.refresh_token });
    await this.saveTokens(owner, refreshed);
    return refreshed.access_token;
  }
  private async request(owner: string, path: string, init: RequestInit = {}): Promise<CanvaImport> {
    const response = await this.fetcher(`https://api.canva.com/rest/v1/${path}`, { ...init, headers: { ...init.headers, Authorization: `Bearer ${await this.access(owner)}` }, signal: AbortSignal.timeout(20_000) });
    if (!response.ok) fail("CANVA_IMPORT_FAILED", response.status === 401 ? "Canva connection expired. Reconnect Canva." : "Canva request failed. Download the saved PowerPoint for manual upload.");
    const { job } = jobSchema.parse(await response.json());
    if (job.status === "in_progress") return { status: "pending", jobId: job.id };
    if (job.status === "failed") return { status: "failed", jobId: job.id, code: "CANVA_IMPORT_FAILED", message: "Canva could not convert this PowerPoint. Download it for manual upload; keep your prior design." };
    const design = job.result?.designs[0];
    if (!design || new URL(design.urls.edit_url).hostname !== "www.canva.com" || new URL(design.urls.edit_url).protocol !== "https:") fail("CANVA_IMPORT_FAILED", "Canva did not return a valid editable design URL.");
    return { status: "succeeded", jobId: job.id, designId: design.id, editUrl: design.urls.edit_url };
  }
  start(owner: string, bytes: Uint8Array, title: string) {
    return this.request(owner, "imports", { method: "POST", headers: { "Content-Type": "application/octet-stream", "Import-Metadata": JSON.stringify({ title_base64: base64(new TextEncoder().encode(Array.from(title).slice(0, 50).join(""))), mime_type: "application/vnd.openxmlformats-officedocument.presentationml.presentation" }) }, body: new Uint8Array(bytes).buffer });
  }
  poll(owner: string, jobId: string) { return this.request(owner, `imports/${encodeURIComponent(jobId)}`); }
}
