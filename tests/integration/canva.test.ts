import { describe, expect, it, vi } from "vitest";
import { CanvaClient } from "../../src/integrations/canva/client";
import { TokenCipher, hash } from "../../src/integrations/canva/crypto";
import { testDatabase } from "./database";
import { CanvaConnectionRequired } from "../../src/integrations/canva/errors";

const config = { clientId: "TEST-ONLY-client", clientSecret: "TEST-ONLY-secret", redirectUri: "https://example.test/api/canva/callback", tokenKey: btoa("x".repeat(32)) };
const tokenResponse = () => Response.json({ access_token: "TEST-ONLY-access", refresh_token: "TEST-ONLY-refresh", expires_in: 3600 });
function setup() {
  const { db, sql } = testDatabase();
  const fetcher = vi.fn<typeof fetch>(async () => tokenResponse());
  const client = new CanvaClient(db, config, fetcher);
  return { db, sql, fetcher, client };
}
describe("Canva OAuth/binary client against mocked HTTP, not a live integration", () => {
  it("rejects a response belonging to a different import job instead of replacing the saved identifier", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    await client.complete("owner", start.state, start.state, "code");
    for (const status of ["in_progress", "success"]) {
      fetcher.mockResolvedValueOnce(Response.json({ job: { id: "another-job", status } }));
      await expect(client.poll("owner", "original-job")).rejects.toThrow("different import job");
    }
  });
  it("binds single-use state to owner and cookie; verifier encrypted and PKCE-correct", async () => {
    const { client, sql, fetcher } = setup();
    const start = await client.begin("owner");
    const url = new URL(start.url);
    expect(url.origin).toBe("https://www.canva.com"); expect(url.searchParams.get("code_challenge_method")).toBe("S256");
    const state = sql.prepare("SELECT * FROM canva_oauth_states").get()!;
    expect(state.hash).toBe(await hash(start.state)); expect(state.hash).not.toBe(start.state);
    const verifier = await new TokenCipher(config.tokenKey).decrypt<string>("owner", String(state.verifier));
    expect(await hash(verifier)).toBe(url.searchParams.get("code_challenge"));
    await expect(client.complete("owner", start.state, "wrong", "code")).rejects.toThrow("mismatch");
    await expect(client.complete("intruder", start.state, start.state, "code")).rejects.toThrow("expired");
    expect(fetcher).not.toHaveBeenCalled();
    await client.complete("owner", start.state, start.state, "code");
    expect(await client.connected("owner")).toBe(true); expect(await client.connected("intruder")).toBe(false);
    const stored = String(sql.prepare("SELECT encrypted FROM canva_tokens").get()!.encrypted);
    expect(stored).not.toContain("TEST-ONLY-access"); expect(stored).not.toContain("TEST-ONLY-refresh");
    await expect(client.complete("owner", start.state, start.state, "code")).rejects.toThrow("expired");
    expect(fetcher).toHaveBeenCalledTimes(1);
  });
  it("rejects expired states without a token request", async () => {
    const { client, sql, fetcher } = setup(), start = await client.begin("owner");
    sql.exec("UPDATE canva_oauth_states SET expires_at = 0");
    await expect(client.complete("owner", start.state, start.state, "code")).rejects.toThrow("expired"); expect(fetcher).not.toHaveBeenCalled();
  });
  it("encrypts with owner binding, unique IVs, and detects tampering", async () => {
    const cipher = new TokenCipher(config.tokenKey), first = await cipher.encrypt("a", { token: "secret" }), second = await cipher.encrypt("a", { token: "secret" });
    expect(first).not.toBe(second); expect(await cipher.decrypt("a", first)).toEqual({ token: "secret" });
    await expect(cipher.decrypt("b", first)).rejects.toThrow();
    await expect(cipher.decrypt("a", first.slice(0, -5) + "AAAAA")).rejects.toThrow();
  });
  it("uploads exact bytes from backend and maps pending/success/failure", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    await client.complete("owner", start.state, start.state, "code");
    const bytes = new Uint8Array([80, 75, 3, 4]); // HTTP-only fixture, not an editable PPTX.
    fetcher.mockResolvedValueOnce(Response.json({ job: { id: "job", status: "in_progress" } }));
    expect(await client.start("owner", bytes, "Thai ไทย v1")).toEqual({ status: "pending", jobId: "job" });
    const [url, init] = fetcher.mock.calls[1];
    expect(url).toBe("https://api.canva.com/rest/v1/imports"); expect(new Uint8Array(init!.body as ArrayBuffer)).toEqual(bytes);
    const headers = init!.headers as Record<string, string>;
    expect(headers["Content-Type"]).toBe("application/octet-stream");
    const title = JSON.parse(headers["Import-Metadata"]).title_base64;
    expect(new TextDecoder().decode(Uint8Array.from(atob(title), c => c.charCodeAt(0)))).toBe("Thai ไทย v1");
    fetcher.mockResolvedValueOnce(Response.json({ job: { id: "job", status: "success", result: { designs: [{ id: "design", urls: { edit_url: "https://www.canva.com/design/test/edit" } }] } } }));
    expect(await client.poll("owner", "job")).toMatchObject({ status: "succeeded", designId: "design" });
    fetcher.mockResolvedValueOnce(Response.json({ job: { id: "job", status: "failed", error: { message: "unsanitized backend detail" } } }));
    const failure = await client.poll("owner", "job"); expect(failure).toMatchObject({ status: "failed" }); expect(JSON.stringify(failure)).not.toContain("unsanitized");
    expect(fetcher.mock.calls[2][1]?.method).toBeUndefined();
  });
  it("refreshes an expired token once under concurrency", async () => {
    const { client, sql, fetcher } = setup(), start = await client.begin("owner");
    fetcher.mockResolvedValueOnce(Response.json({ access_token: "TEST-expired", refresh_token: "TEST-refresh", expires_in: 1 }));
    await client.complete("owner", start.state, start.state, "code");
    fetcher.mockImplementation(async (_url, init) => {
      if (String(init?.body).includes("grant_type=refresh_token")) return tokenResponse();
      return Response.json({ job: { id: "job", status: "in_progress" } });
    });
    await Promise.allSettled([client.poll("owner", "job"), client.poll("owner", "job")]);
    expect(fetcher.mock.calls.filter(([url]) => String(url).endsWith("oauth/token"))).toHaveLength(2); // code exchange + one refresh
    expect(sql.prepare("SELECT refresh_lock_until FROM canva_tokens").get()!.refresh_lock_until).toBe(0);
  });
  it("rejects external edit URLs and does not expose backend errors", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    await client.complete("owner", start.state, start.state, "code");
    fetcher.mockResolvedValueOnce(Response.json({ job: { id: "job", status: "success", result: { designs: [{ id: "design", urls: { edit_url: "https://attacker.test/" } }] } } }));
    await expect(client.poll("owner", "job")).rejects.toThrow("valid editable");
    fetcher.mockResolvedValueOnce(new Response("secret details", { status: 401 }));
    await expect(client.poll("owner", "job")).rejects.toThrow("Reconnect");
  });
  it("classifies a missing connection before sending any import request", async () => {
    const { client, fetcher } = setup();
    await expect(client.start("owner", new Uint8Array([80, 75]), "Test")).rejects.toBeInstanceOf(CanvaConnectionRequired);
    expect(fetcher).not.toHaveBeenCalled();
  });
  it("classifies an interrupted token refresh as preflight without sending import bytes", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    fetcher.mockResolvedValueOnce(Response.json({ access_token: "TEST-expired", refresh_token: "TEST-refresh", expires_in: 1 }));
    await client.complete("owner", start.state, start.state, "code");
    fetcher.mockRejectedValueOnce(new Error("Token refresh transport failed"));
    await expect(client.start("owner", new Uint8Array([80, 75]), "Test")).rejects.toBeInstanceOf(CanvaConnectionRequired);
    expect(fetcher.mock.calls.every(([url]) => String(url).endsWith("oauth/token"))).toBe(true);
  });
  it("distinguishes a rejected import from an ambiguous transport outcome", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    await client.complete("owner", start.state, start.state, "code");
    fetcher.mockResolvedValueOnce(new Response(null, { status: 401 }));
    await expect(client.start("owner", new Uint8Array([80, 75]), "Test")).rejects.toBeInstanceOf(CanvaConnectionRequired);
    fetcher.mockRejectedValueOnce(new Error("Import response was lost"));
    await expect(client.start("owner", new Uint8Array([80, 75]), "Test")).rejects.not.toBeInstanceOf(CanvaConnectionRequired);
  });
  it("returns an actionable terminal failure for a missing existing job", async () => {
    const { client, fetcher } = setup(), start = await client.begin("owner");
    await client.complete("owner", start.state, start.state, "code");
    fetcher.mockResolvedValueOnce(new Response(null, { status: 404 }));
    expect(await client.poll("owner", "missing-job")).toMatchObject({ status: "failed", jobId: "missing-job", message: expect.stringContaining("no longer find") });
    expect(fetcher.mock.calls.at(-1)?.[1]?.method).not.toBe("POST");
  });
});
