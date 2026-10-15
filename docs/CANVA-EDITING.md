# Edit the same Canva file and use supplied pictures

For an existing editor/share link plus requested changes, GraphicRouter routes to
plan_canva_edit rather than a new-design interview. The default is edit_original:
read and draft-edit the same Canva design ID/link with the separately connected
Canva tools. Template adaptation remains a separate copy-based creation route.
The application's OAuth import connection does not supply native editing access.

Detailed same-file/image workflows load on demand through their planning helpers;
shared discovery/briefing uses compact routing instructions. This avoids repeating
the entire guide on every long-deck step.

The helper validates a reference and returns an execution plan. It does not fetch
Canva or save a design. Full token-bearing share URLs go directly from the user's
message to get-design; summary output redacts them. canva.link resolves first.
Actual editable IDs come from start-editing-transaction, not get-design-content.
Only requested properties change. review_canva_edit compares complete captured
before/after selected-page properties to explicit targets and flags collateral
changes, additions/deletions, dimensions, mismatched IDs and incomplete snapshots.
It is a caller-supplied checkpoint, not a provider fetch, independent verifier or
commit lock. review_canva_design separately checks native text/copy/image claims.

Show the newest draft preview and change summary, obtain the explicit approval
required by Canva commit-editing-transaction, save that transaction, require actual
committed status and reread the same design. A successful plan or ready review is
not a saved edit. Stale/conflicted work must be reread/reapplied/reviewed, not
blindly recommitted. Never cancel another draft or automatically duplicate a file.
Original GraphicRouter source/exports stay immutable and do not sync back.

## Pictures attached in chat

plan_image_input binds each picture to one task and target:

- place: use the actual supplied picture as a separate image object;
- style_reference: inspect visual principles without uploading the screenshot;
- edit_instruction: use marked regions to find actual native targets;
- extract_content: read only legible material and resolve uncertain critical copy.

Keep order and exact asset identity. A picture can be visible in chat without its
bytes being accessible to an upload tool. Actual private/local file upload uses
create-upload-url and an authorized one-time raw-byte POST, or another explicitly
supported provider file-reference mechanism. Public image URLs can use
upload-asset-from-url. Confirm real returned asset IDs before update_fill or
insert_fill; uploading an asset does not place it. Never make a private picture
public to work around access, fabricate an asset ID or claim placement from a
filename. If byte upload is unavailable, the one blocking handoff is uploading the
picture in Canva and supplying its actual asset/design reference. The native
blueprint engine still accepts registered assets only.

References do not trigger generation, image-to-design conversion or upload.
Preserve source image ratio, subjects and logo requirements; keep surrounding text
native. resolve any supplied logo-lettering exception explicitly rather than
claiming raster lettering is editable. Current create-design has a brief/outline
schema, not arbitrary image attachments: place the supplied asset afterward with
supported editing. Availability of an attachment does not prove its pixel review.

## Richer long presentations

compose_slide supplies optional editable16:9 starting geometry for hero, editorial,
comparison, process, timeline, metrics and closing compositions. It returns native
text, panels, nodes and connectors with stable prefixed IDs, within one40-edit
batch; it never saves/overwrites a page. It checks measured text fit and rejects
excess copy rather than shrinking/truncating. Metrics require actual supplied
values. Existing compose_component still supplies data-driven charts and icons.

Choose visual structure by the page's relationship, vary chapter rhythm and keep
one coherent typography/spacing/palette system. Preserve original detail and
mandatory visible wording in requirements/notes as specified. Use real pictures
where appropriate through the supported Canva path. Human/model inspection remains
necessary; native geometry and restrained shapes are not a universal beauty score.

Synthetic QA writes seven PNG/native-blueprint studies and a24-slide PPTX with:

```sh
GRAPHICROUTER_ARTIFACTS=1 npm test -- tests/engine/slide-composition.test.ts
```

Artifacts are under artifacts/compositions and are illustrative, not customer
results or evidence of live Canva editing/import fidelity.

## Try after a fresh chat discovers the tools

Paste your actual Canva edit/share link and attach the relevant picture:

> Edit this same Canva infographic: [my link]. Change only the headline to violet.
> Replace the picture on page2 with my attached photo, keeping its aspect ratio.
> Preserve all other wording, links, colours, objects and pages. Show the latest
> draft preview and change summary before asking me to approve saving.

For a new long deck:

> Create24 slides from the detailed brief below. Give each slide a purposeful
> visual composition, using comparisons, process diagrams, timelines, actual data
> charts and supplied images where relevant. Vary layouts while keeping one design
> system. Preserve all mandatory details and separate native text. Save the brief
> and requirements, work chapter by chapter, inspect output and do not invent facts.

Actual same-file provider edits, private image upload/placement and host workflow
selection need a real supplied target and image. This release's fixtures/builds do
not establish those live checks. No unrelated design or image is used as a test.

Official tool references verified during implementation:
https://www.canva.dev/docs/apps/mcp/tools/start-editing-transaction/
https://www.canva.dev/docs/apps/mcp/tools/commit-editing-transaction/
https://www.canva.dev/docs/apps/mcp/best-practices/
