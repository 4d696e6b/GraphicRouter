import {describe,it,expect} from "vitest";
import {renderToStaticMarkup} from "react-dom/server";
import {Document} from "../../src/preview/Document";
import {populatedDocument} from "../engine/document-fixture";
describe("document storyboard preview",()=>{
 it("shows actual page navigation, notes, source layers and unverified import status",()=>{const blueprint=populatedDocument(),html=renderToStaticMarkup(<Document data={{result:{blueprint,canva:{status:"succeeded",jobId:"test",designId:"DA_TEST_design",editUrl:"https://www.canva.com/design/test/edit"},previewUrl:"https://example.test",review:[]},previews:blueprint.pages.map(p=>({id:p.id,svg:'<svg xmlns="http://www.w3.org/2000/svg"/>'}))}}/>);expect(html).toContain("8 pages");expect(html).toContain('aria-label="Page storyboard"');expect(html).toContain("Illustrative speaker notes for page 1");expect(html).toContain("1 text layers");expect(html).toContain("Check every page&#x27;s text layers");expect(html).not.toContain("fully editable");});
 it("offers an explicit lazy preview load without hiding saved notes or requirement status",()=>{
  const blueprint=populatedDocument(),html=renderToStaticMarkup(<Document data={{result:{blueprint,canva:{status:"not_started"},previewUrl:"https://example.test",review:[]},previews:[],partialPreviews:true,requirementCoverage:{registered:2,covered:1,blocking:1,extractionComplete:false,must:2,advisory:0,sourceChunks:1,sourceCharacters:100,scope:"Registered only"}}} invoke={async()=>{}}/>);
  expect(html).toContain("Load this page preview");expect(html).toContain("1 of 2 checked");expect(html).toContain("extraction is still in progress");expect(html).toContain("Illustrative speaker notes for page 1");
 });
 it("retains notes and files when preview is missing and escapes supplied content",()=>{const blueprint=populatedDocument();blueprint.title='<script>alert("x")</script>';const html=renderToStaticMarkup(<Document data={{result:{blueprint,canva:{status:"not_started"},previewUrl:"https://example.test",files:{pptxUrl:"https://example.test/pptx",notesUrl:"https://example.test/notes"},review:[]},previews:[],previewError:"Saved version retained; preview failed."}}/>);expect(html).not.toContain("<script>");expect(html).toContain("Saved version retained");expect(html).toContain("Download PowerPoint");expect(html).toContain("Illustrative speaker notes");});
});
