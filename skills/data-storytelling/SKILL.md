---
name: data-storytelling
description: "Choose and compose honest data graphics from supplied values with preserved units, scales, dates, uncertainty and exact source links."
---

# Data storytelling and evidence

Start with the question the data can answer. Record values, units, denominator, period, categories, source and uncertainty before visual choices. Browse primary sources when verification is needed and available; a pasted URL or schema pass is not verification. Missing data stays unknown. Never turn forecasts into actuals or mix prices/units/time periods without an explicit explanation.
Use aligned bars for magnitude, line/step-line graphics for ordered change, and a table when exact lookup matters more than pattern. Part-to-whole requires a real common total. Avoid decorative 3D, inconsistent bar baselines or comparing areas that encode unrelated scales. Explain truncated axes and uncertainty visibly.
compose_component computes supported charts as editable text/shape/line objects. Bar charts accept nonnegative values with a common zero baseline. Line output uses the documented native connector style and must be labelled accurately; do not infer trends from category order or conceal negative values. Use the returned notes and inspect actual labels. Components return objects, not saved designs: add them via edit_canvas or edit_document with unique IDs and available layers.
Values and labels must be separate from backgrounds and chart marks. Keep short native source labels with exact verified links in Canva; companion notes retain full URLs. Native custom hyperlink export is not currently part of the canvas text schema, so do not promise that feature from PPTX alone. Preserve data and a meaningful text summary in companion notes. Inspect chart scales and the imported result. Read quality-review before delivery.

## Reference compositions

Read [examples.json](examples.json) for concrete requests, composition decisions and failure cases. These are illustrative design studies, not verified user facts or performance evidence.
