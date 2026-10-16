# Security reporting

GraphicRouter is a prototype with account-dependent release checks and recorded
upstream dependency findings. It does not currently promise a security response
SLA or a completed security review. See [release quality](docs/RELEASE-QUALITY.md).

## Report a suspected vulnerability

Use GitHub’s **Security → Report a vulnerability** for this repository if private
reporting is available. If that control is unavailable, open an issue that asks
for a private reporting channel **without disclosing the vulnerability details**.
No dedicated security email or other private contact is configured in this repo.

Do not post credentials, tokens, customer files, private Canva links, exploit
payloads containing sensitive data or unredacted logs in public issues. A useful
private report describes affected code/version, impact, a minimal reproduction
using your own test data, and any proposed mitigation.

If you accidentally commit a secret, revoke or rotate it with the provider first.
Removing it from the latest file does not revoke the credential or remove history.
Coordinate repository cleanup with the maintainer; do not rewrite shared history
without authorization.

## Developer safeguards

- Keep credentials in ignored local files or Sites server-side secret storage.
- Preserve authenticated per-user access to documents, files and Canva tokens.
- Do not expose the Worker behind a proxy that trusts caller-supplied identity.
- Do not log authentication secrets or place them in tool results or browser code.
- Review dependency findings across the full build/runtime pipeline. A clean
  production-only audit does not establish that bundled runtime code is safe.
- Keep Original and Test Site identities and credentials separate.
