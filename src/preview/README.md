# Stored-object previews

Canvas.tsx displays schemaVersion2 freeform graphics at their actual dimensions,
with layout/content/finished stages, cumulative object reveal, stored construction
history, validation and Canva delivery controls. Presentation.tsx retains the
legacy five-slide experience. Both render server-generated SVG from the exact
stored blueprint; neither recalculates geometry client-side.

widget.tsx routes MCP _meta.canvas, _meta.presentation and _meta.briefing into the
matching view. HostedCanvas and HostedPresentation provide authenticated Site
fallbacks. Briefing is the one-question-at-a-time intake; its final click sends
one complete user message to the active chat. No browser storage or credentials
are used. Closing an unsent brief can lose changes, disclosed in the card.

A preview error after a committed edit keeps the saved result and returns a clear
message with Refresh, rather than disguising the successful edit as a failed write.
Construction reveal is a view of stored objects, not a live-session recording.
