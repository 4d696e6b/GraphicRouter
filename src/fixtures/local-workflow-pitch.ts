import type { CreateDeckInput } from "../contracts";
import { finalPitch } from "./final-pitch";

/** Local integration pitch; never implies a hosted ChatGPT or app-OAuth check. */
export const localWorkflowPitch: CreateDeckInput = structuredClone(finalPitch);
localWorkflowPitch.title = "GraphicRouter — verified local workflow";
localWorkflowPitch.brief.purpose = "Pitch the locally verified presentation workflow and demonstrate a precise revision; distinguish hosted account checks still pending.";
localWorkflowPitch.brief.facts.push(
  "Builder B records real engine create, preview, revise, and export through the local service with simulated local identity.",
  "Local service tests verify immutable versions, owner-scoped downloads, and actionable revision errors.",
  "A separate manual Canva connector import succeeded; draft text editing and image movement were verified and cancelled to preserve the fixture.",
);
localWorkflowPitch.brief.unknowns = [
  "Hosted ChatGPT tool/widget behavior until access to the existing Site is restored",
  "Application Canva OAuth and backend import until developer credentials are configured",
  "Canva shape/line editing and imported font matching until checked in the editor",
  "Actual speaking pace and final-stage demonstration timing until rehearsed",
];

localWorkflowPitch.slides[1].notes = {
  core: "GraphicRouter combines three responsibilities: plan the message from supplied facts, compose separate slide elements, and direct a precise change. ChatGPT supplies the story through structured tool arguments. The engine and service now work together locally: create, preview, revise, and export are verified. The hosted ChatGPT connection still needs its account check.",
  expanded: "There are three responsibilities. Planning chooses one message per slide using facts supplied by the presenter; missing evidence remains explicit. Composition turns those messages into named text, shape, line, and image objects with deliberate hierarchy and spacing. Direction changes a particular element while preserving the rest. The model supplies structured content; the renderer needs no additional model service. Builder B has connected the engine to the service and verified the local create, preview, revise, and export flow. These checks used simulated local identity, so they do not prove production identity or an installed ChatGPT connection. That distinction matters: we can show the actual local implementation today and clearly identify the account verification still ahead.",
};
localWorkflowPitch.slides[3].takeaway = "The local service revises this blueprint. Canva text and image editing were checked separately.";
localWorkflowPitch.slides[3].blocks = [
  { heading: "Local workflow", body: "Create, preview, revise, and export." },
  { heading: "Precise change", body: "One headline. Four other slides unchanged." },
];
localWorkflowPitch.slides[3].notes = {
  core: "This deck uses our engine. Now change only slide three's headline to violet. [Allow thirty seconds for the local service demonstration, or identify the prepared engine replay explicitly.] The new version preserves the original and every unrelated element. Separately, a manual Canva import preserved editable text and images. Canva shape editing and the application's own import path still need verification.",
  expanded: "The presentation itself is a test case. This deck uses the same engine that the service calls. We target slide3.headline and request violet. [Allow thirty seconds for the local service demonstration, or identify the prepared engine replay explicitly.] The local service flow has been verified with the real engine, stored versions, previews, and native PowerPoint downloads. Tests compare unrelated blueprint elements and the four untouched slide XML files. The original version remains intact. A separate manual Canva connector check imported the fixture, changed a headline, and moved an image in a draft transaction; the transaction was cancelled to preserve the fixture. This does not verify Canva shape or line editing, imported font matching, application OAuth, or the hosted ChatGPT experience. The demonstration should state which path is actually running.",
};
localWorkflowPitch.slides[4].headline = "Working locally.\nReady for account checks.";
localWorkflowPitch.slides[4].takeaway = "Local workflow verified. Hosted ChatGPT and Canva app checks next.";
localWorkflowPitch.slides[4].blocks = [{ heading: "Next milestone", body: "Restore Site access, configure Canva, and rehearse the complete pitch." }];
localWorkflowPitch.slides[4].notes = {
  core: "Today, the engine and service work together locally, with construction previews, native exports, and precise revisions. Next we restore access to the existing Site, configure Canva application credentials, verify the hosted workflow, and rehearse the pitch. GraphicRouter makes presentations you can direct: plan the story, compose the slides, and preserve what is already right.",
  expanded: "What works today is the local workflow: create a presentation, inspect its construction stages, revise a named element, and download a native PowerPoint with speaker notes. Local tests also exercise version preservation, owner isolation, and clear errors. What remains is account-level verification. We need access to the existing Site for the hosted ChatGPT tool and widget, Canva application credentials for OAuth and backend import, and editor checks for shapes, lines, and font fidelity. Each import creates a new design version; manual Canva changes do not synchronize back. We will keep a downloadable PowerPoint and an explicitly labelled offline replay as recovery options, then rehearse the three-minute pitch with one controlled edit. Our goal remains presentations you can direct.",
};
