import { env } from "cloudflare:workers";
import { D1DeckStore } from "./store";
import { DeckService, type CanvaPort } from "./service";
import { engine, assets } from "./engine-provider";
import { CanvaClient } from "../integrations/canva/client";
import { fail } from "./errors";
import { CanvaConnectionRequired } from "../integrations/canva/errors";
import { R2FileStore } from "./files";

export function database() {
  if (!env.DB) fail("NOT_IMPLEMENTED", "D1 binding DB is unavailable. Configure storage before using decks.");
  return env.DB.withSession("first-primary");
}
export function canvaClient(db = database()) {
  const { CANVA_CLIENT_ID, CANVA_CLIENT_SECRET, CANVA_REDIRECT_URI, CANVA_TOKEN_KEY } = env;
  if (!CANVA_CLIENT_ID || !CANVA_CLIENT_SECRET || !CANVA_REDIRECT_URI || !CANVA_TOKEN_KEY) return null;
  return new CanvaClient(db, { clientId: CANVA_CLIENT_ID, clientSecret: CANVA_CLIENT_SECRET, redirectUri: CANVA_REDIRECT_URI, tokenKey: CANVA_TOKEN_KEY });
}
const disconnected: CanvaPort = {
  connected: async () => false,
  start: async () => fail("CANVA_IMPORT_FAILED", "Configure Canva OAuth before importing. Download the PowerPoint for manual upload."),
  poll: async () => { throw new CanvaConnectionRequired("Restore the Canva configuration to refresh the existing job."); },
};
export function service() {
  if (!env.SITE_ORIGIN) fail("NOT_IMPLEMENTED", "Configure SITE_ORIGIN with the canonical private Site URL.");
  if (!env.BUCKET) fail("NOT_IMPLEMENTED", "R2 binding BUCKET is unavailable. Configure storage before using decks.");
  const bucket = env.BUCKET, db = database();
  return new DeckService({ store: new D1DeckStore(db), engine, assets, origin: new URL(env.SITE_ORIGIN).origin,
    canva: canvaClient(db) ?? disconnected,
    files: new R2FileStore(bucket),
  });
}
