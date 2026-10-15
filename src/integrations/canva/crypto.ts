export function base64(bytes: Uint8Array) { return btoa(Array.from(bytes, c => String.fromCharCode(c)).join("")); }
export function randomSecret() { return base64(crypto.getRandomValues(new Uint8Array(32))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, ""); }
export async function hash(value: string) {
  return base64(new Uint8Array(await crypto.subtle.digest("SHA-256", new TextEncoder().encode(value)))).replace(/\+/g, "-").replace(/\//g, "_").replace(/=/g, "");
}
export class TokenCipher {
  private key: Promise<CryptoKey>;
  constructor(encodedKey: string) {
    const bytes = Uint8Array.from(atob(encodedKey), c => c.charCodeAt(0));
    if (bytes.length !== 32) throw new Error("CANVA_TOKEN_KEY must be base64 of 32 random bytes.");
    this.key = crypto.subtle.importKey("raw", bytes, "AES-GCM", false, ["encrypt", "decrypt"]);
  }
  async encrypt(owner: string, value: unknown) {
    const iv = crypto.getRandomValues(new Uint8Array(12));
    const bytes = await crypto.subtle.encrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) }, await this.key, new TextEncoder().encode(JSON.stringify(value)));
    return `${base64(iv)}.${base64(new Uint8Array(bytes))}`;
  }
  async decrypt<T>(owner: string, value: string): Promise<T> {
    const [iv, data] = value.split(".").map(v => Uint8Array.from(atob(v), c => c.charCodeAt(0)));
    const bytes = await crypto.subtle.decrypt({ name: "AES-GCM", iv, additionalData: new TextEncoder().encode(owner) }, await this.key, data);
    return JSON.parse(new TextDecoder().decode(bytes));
  }
}
