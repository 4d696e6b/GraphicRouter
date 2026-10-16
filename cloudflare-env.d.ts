declare namespace Cloudflare {
  interface Env {
    DB?: D1Database;
    BUCKET?: R2Bucket;
    SITE_ORIGIN?: string;
    RETENTION_ADMIN_EMAIL?: string;
    CANVA_CLIENT_ID?: string;
    CANVA_CLIENT_SECRET?: string;
    CANVA_REDIRECT_URI?: string;
    CANVA_TOKEN_KEY?: string;
  }
}
