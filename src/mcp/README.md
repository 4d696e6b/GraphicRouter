# GraphicRouter presentation planner

The five existing deck tools remain unchanged. The additional read-only
`start_briefing` MCP tool opens the existing app resource in briefing mode before
any deck exists. It does not call DeckService or create storage/import records.

`src/briefing/questions.ts` defines 20 bounded questions and the answer contract:
format; topic; audience; outcome; key message; audience knowledge; problem;
solution/process; evidence/sources; required content; exclusions; delivery setting;
time; language; mood; accent; brand; references; visual material; closing action.
Only format, topic, audience and outcome are required. Known answers can be
prefilled; optional questions can be skipped, or the user can review early.

`Briefing.tsx` renders one labelled question at a time inside a dialog card, with
progress, suggestions, free text, back/skip/review and individual answer editing.
Unsent answers live only in that open view, never browser storage. Closing or
reloading can lose them. No credential fields or arbitrary uploads are offered.

The user's Create button sends all answers and original context to the current
chat in one user message via the installed MCP Apps bridge. That message asks for
GraphicRouter create_deck followed by Canva import; it does not itself create a
deck. No automatic handoff retry occurs. Host rejection/transport failure keeps
answers visible and offers the complete message for manual copy-back.

`/briefing` offers the same dialog without a host bridge: it prepares the message
for the user to paste into a chat with GraphicRouter selected. It does not submit
background model requests or expose another user's deck data.

`planner.ts` is exposed through both MCP initialization and create_deck metadata.
For incomplete new briefs it requests start_briefing immediately and waits for
submission. Unsupported single-page graphics remain an explicit format boundary;
there is no silent fallback to image generation. Completed briefs and narrow
revisions do not restart the interview. The five-slide/Arial/16:9 Studio renderer
and its available assets remain the supported design surface.

## Conversation acceptance checks

- Sparse request: select GraphicRouter and say “Open the presentation question
  dialog.” Expected: start_briefing is called immediately, rather than just a
  prose questionnaire. One question is shown in the app card.
- Prefill: provide known topic/audience/brand. Expected: preserve those answers,
  begin at an unanswered question and include them in the final review.
- Format boundary: choose a single-page infographic. Expected: visible explanation
  and a supported five-slide option; no image generator is substituted.
- Required fields: review early with missing topic/audience/outcome. Expected:
  submission returns to the first missing answer with a clear error.
- Optional questions: skip or review early after the essentials. Expected: a usable
  brief with factual gaps explicit; no invented metrics or mandatory 20-turn chat.
- Handoff: complete/review/submit. Expected: a full user briefing message in this
  chat, followed by GraphicRouter create_deck/send_to_canva/get_deck and a real
  Canva editor link. No second questionnaire or raster infographic.
- Rejected handoff: disconnect/reject messaging. Expected: answers and a complete
  manual copy-back message remain available; no automatic retry.
- Focused edit: request only slide3.headline violet. Expected: the existing revision
  workflow, with no new intake or unrelated redesign.

Automated checks cover transport discovery/authentication/input bounds, message
completeness, format/required-field validation, HTML escaping, host send/rejection
and the existing engine/service workflow. They do not certify actual host UI
rendering, model compliance or subjective Canva appearance. Those require the
conversation checks above. Browser automation was unavailable during this change
because its security-policy verification failed; no policy bypass was attempted.
