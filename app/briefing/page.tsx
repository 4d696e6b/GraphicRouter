import { Briefing } from "../../src/preview/Briefing";

// No account data is read or persisted here. Hosted access remains Sites-owned.
export default function BriefingPage() {
  return <Briefing initial={{ context: "", answers: {} }} />;
}
