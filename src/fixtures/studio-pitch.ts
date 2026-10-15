import type { CreateDeckInput } from "../contracts";
import { localWorkflowPitch } from "./local-workflow-pitch";

/** The deployed create/export call was verified in “Create GraphicRouter pitch deck”. */
export const studioPitch: CreateDeckInput = structuredClone(localWorkflowPitch);
studioPitch.title = "GraphicRouter — direct the design";
studioPitch.artDirection = "GraphicRouter Studio — editorial technology pitch, ink-black opening, warm ivory, violet routing diagrams, oversized Arial, generous negative space, crisp native shapes. Each slide makes one point; Canva is the final editable destination.";
studioPitch.brief.purpose = "Pitch GraphicRouter through a visually composed five-slide deck delivered as editable Canva pages. Demonstrate one precise revision.";
studioPitch.brief.facts.push("A signed-in GraphicRouter create_deck and export_deck call succeeded in the user's Create GraphicRouter pitch deck chat.");
studioPitch.brief.unknowns = ["Canva application OAuth/import until developer credentials are configured", "Shape/line/font fidelity of this redesigned deck until inspected after Canva import", "Actual speaking pace and full live recording until rehearsed"];
studioPitch.slides[0].headline = "Change the idea.\nKeep the design.";
studioPitch.slides[0].takeaway = "A presentation built from elements you can direct.";
studioPitch.slides[0].blocks = [{ heading: "GraphicRouter", body: "A clear story. Deliberate composition. Precise changes." }];
studioPitch.slides[1].headline = "One story.\nThree creative decisions.";
studioPitch.slides[1].takeaway = "Plan the message, compose the canvas, then direct the change.";
studioPitch.slides[1].blocks = [
 { heading: "Story", body: "One message per slide, grounded in your facts." },
 { heading: "Composition", body: "Hierarchy, space, and separate editable elements." },
 { heading: "Direction", body: "Revise the requested part. Preserve the rest." },
];
studioPitch.slides[2].headline = "From a rough brief\nto an editable deck.";
studioPitch.slides[2].takeaway = "ChatGPT plans the story. The blueprint controls the composition.";
studioPitch.slides[2].blocks = [
 { heading: "Brief", body: "Your audience, purpose, and supplied facts." },
 { heading: "Blueprint", body: "A deliberate arrangement of text and shapes." },
 { heading: "Canva", body: "Import the native deck as editable pages." },
];
studioPitch.slides[3].headline = "One headline changes.\nThe rest stays yours.";
studioPitch.slides[3].takeaway = "Change only slide three's headline to violet.";
studioPitch.slides[3].blocks = [
 { heading: "Direct the edit", body: "Target a named headline and create version two." },
 { heading: "Preserve the work", body: "Keep the other objects, notes, and original version." },
];
studioPitch.slides[4].headline = "Plan the story.\nDirect the design.";
studioPitch.slides[4].takeaway = "A finished presentation belongs in an editor you can use.";
studioPitch.slides[4].blocks = [{ heading: "Next", body: "Verify this deck in Canva, then rehearse the pitch and live edit." }];
studioPitch.slides[1].notes.core = "GraphicRouter brings three decisions together. Story determines what each slide needs to say, using the facts you supply. Composition gives those messages hierarchy, space, and separate editable elements. Direction lets you change a specific part while preserving the work around it. The signed-in ChatGPT plugin has now created and exported a deck. Canva is the intended final editable destination.";
studioPitch.slides[2].notes.core = "Start with your audience, purpose, and supplied facts. ChatGPT organizes the story and passes structured content to the engine. The blueprint records the named objects and their positions. That same plan produces the construction previews and native PowerPoint used for Canva import. The editable Canva design is the main deliverable; PowerPoint is the portable handoff and recovery file.";
studioPitch.slides[3].notes.core = "This deck is generated from that blueprint. Now change only slide three's headline to violet. [Allow thirty seconds for the actual tool call or identify the prepared replay.] A new version keeps the previous one intact. Our checks compare every unrelated blueprint object and native PowerPoint part, including the speaker notes. Canva conversion still needs its own editor check.";
studioPitch.slides[4].notes.core = "The workflow is implemented, and signed-in creation and export have been verified. The next check is this redesigned deck inside Canva: inspect the imported text, shapes, lines, images, and fonts, then rehearse the complete pitch. Each import is a separate design version. GraphicRouter's goal is simple: plan the story, direct the design, and keep the result editable.";
