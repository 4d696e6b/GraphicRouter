---
name: quality-review
description: "Inspect source and Canva output for readability, visual hierarchy, factual copy, links, separate text layers and focused revisions before delivery."
---

# Shared design quality review

Review actual rendered output rather than declaring success from tool completion or geometry. Inspect full pages/storyboard first, then crops of small critical labels, charts and source footers at realistic viewing size. Evaluate meaning, hierarchy, contrast, density, spacing, alignment, consistency and useful imagery. Automated warnings guide judgement; they are not a beauty score.
Use inspect_canvas or inspect_document for saved native source images. Tie each material issue to a stable element ID, make a bounded targeted revision, then inspect the latest output after the last edit. Normal work needs useful revisions, not a mandatory number of cosmetic passes. Preserve the working version and unrelated elements if a revision fails.
Validate exact required wording, values, units, dates and sources against supplied or actually verified evidence. Inspect chart geometry and legend correspondence. A corrected label elsewhere does not repair the wrong target. Prefer short source labels with actual hyperlinks where supported; do not ask a generator to draw URLs.
Source and imported Canva checks are separate. Inspect actual native richtexts and image fills, full previews and detail crops. Every heading, number, label and source must be a distinct editable text object. For suspicious image lettering, use a separate disposable background-only audit and cancel only that audit. Never commit diagnostic deletion or discard another pending draft. If lettering remains baked into pixels or cannot be inspected, do not call the design fully editable. Rebuild with clean assets/native text; never hide old copy under replacement words.
review_canva_design checks a bounded caller-supplied snapshot, not Canva itself, OCR or factual evidence. blocked/needs_visual_review is not ready. A ready result is for user review, not a commit permission. Show the latest preview and follow Canva's required explicit approval before saving. Verify saved output separately; disclose unverified steps. Do not spend more generation credits or retry uncertain imports automatically.

## Reference compositions

Read [examples.json](examples.json) for concrete requests, composition decisions and failure cases. These are illustrative design studies, not verified user facts or performance evidence.
