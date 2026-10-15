# GraphicRouter presentation planner

The five shared tools are served by `app/mcp/route.ts`. `planner.ts` supplies the
briefing and design policy through MCP initialization instructions and the
`create_deck` description. Hosts using either discovery path receive the policy
before creation. ChatGPT conducts the interview; no additional model service,
sixth tool, new schema or stored-deck migration is required.

The planner reads existing context, asks at most three focused questions per turn,
and waits for answers. It covers audience/decision, message/evidence,
setting/language/time, visual taste/brand/references and useful visual material.
It asks only about missing details; optional assets/branding never block a draft.
An explicit request to choose or draft immediately permits stated assumptions,
with factual gaps retained in `brief.unknowns`. Once ready, it summarizes the
direction and creates without a redundant approval step.

The design policy prioritizes hierarchy, whitespace, concise content, contrast
and meaningful diagrams within the current five-slide/Arial/16:9 Studio system.
It does not promise arbitrary asset uploads, font matching or exact reference
reproduction. Preferences use existing brief fields, `artDirection` and `accent`.
Narrow revisions bypass the interview.

## Conversation acceptance checks

Run in a new ChatGPT chat after deployment; refresh/reconnect the plugin if the
host cached old tool metadata. These behavioral checks are separate from the
automated MCP transport/schema tests:

- Sparse brief: “Make a beautiful presentation about my app.” Ask for audience,
  intended action and message/supporting facts; do not create yet. After answers,
  ask only missing setting/design details.
- Rich brief: supply audience, desired decision, facts, duration, language,
  visual reference and colour. Reuse them, summarize direction and create;
  no generic questionnaire or additional approval.
- Designer decides: “Use your judgment and make a quick draft.” Choose a supported
  direction, state assumptions, keep evidence gaps explicit, then generate.
- Unsupported: “Twenty slides with custom fonts and my uploaded product photos.”
  Explain five-slide/Arial/available-assets limits and ask about an alternative.
- Honest proof: a planned feature has no results. Label plans/demo accurately;
  never fabricate metrics to fill the proof slide.
- Focused edit: “Change only slide three's headline to violet.” Revise only that
  element/version, with no intake or unrelated redesign.

Transport tests verify both discovery paths expose the policy and preserve five
schemas. They cannot prove model compliance or certify subjective visual quality;
those require conversation checks and inspection of the actual Canva result.
