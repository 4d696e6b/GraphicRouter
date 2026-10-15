# Owner-scoped services

DeckService and CanvasService use the production engines through explicit ports,
D1 immutable versions and R2 write-once exports. HTTP/MCP boundaries authorize the
Sites owner and return sanitized errors; Canva jobs are claimed once per version
and polled without starting duplicate imports. See SETUP.md for runtime bindings,
OAuth configuration and dated integration evidence.

review_canva_design is a separate read-only snapshot checker: no service writes,
Canva fetch, OCR or external commit lock. It cannot certify caller-reported image
inspection. See docs/CONTRACTS.md and the current Builder A task evidence.
