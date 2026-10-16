# Saved-design retention

User-selected policy:30 days from original creation. Runtime access to expired
versions is denied even if a cleanup run has not happened yet. Revisions never
restart this clock. Keep needed downloads and Canva copies yourself.

Migration0002 creates an indexed cleanup queue and permits only queued expired
version deletion. Normal version immutability remains. Application deletion covers
blueprints, source requirements, notes/history, import records and all three export
key families. Canva copies, downloaded files, provider-controlled backups/logs and
Canva OAuth connections are outside the saved-design purge. Minimal UUID/scan-time
queue rows remain for retry; they contain no owner or blueprint content.

## Administrator setup and unattended task

Configure RETENTION_ADMIN_EMAIL in Sites to the owner's email confirmed by
get_site. The server checks the trusted Sites identity, not request arguments.
No administrator capability is registered for other users or an unconfigured host.
Preserve the existing Site/App/plugin identities, audience and Canva secrets.

The owner-only run_retention_cleanup MCP tool takes {}. It returns only queued,
processed, deletedFiles, failures, remainingDue counts. It queues at most100 new
expired designs and processes20 file sets per call. Retry with a maximum of10
calls per task when remainingDue >0. If failures remain or the bound is reached,
notify the owner. Never report success from an authorization error or tool absence.
An R2 outage keeps queue rows for retry. Repeated runs are safe. No arbitrary IDs,
cutoffs or bucket paths are accepted.

Use a Sites-linked hourly cloud schedule using the owner's connected GraphicRouter
plugin. Verify the published writer through that authenticated cloud connection
and read back aggregate results before representing physical purge as operational.
Do not put credentials in the task prompt, add a public unauthenticated cleanup
endpoint, impersonate a visitor with a service bypass, or use local-machine cron.
Schedule creation alone is not execution evidence. Until verified, public privacy
copy must disclose activation status. Test expiry/cleanup only with synthetic SQL
fixtures; do not backdate or erase real designs to test this feature.

## Evidence

npm test -- tests/integration/retention.test.ts exercises real SQLite migrations,
expiry read/edit denial, owner isolation, immutable guards, expired write rejection,
all three bucket families, retry after failure, late files, in-flight export expiry,
and owner-only MCP discovery/execution. Bucket interactions in this test are doubles.
Actual production scheduling/authentication evidence belongs in docs/submission.
