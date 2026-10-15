import {describe,it,expect} from "vitest";
import {composeSlide} from "../../src/engine/slide-composition";
import {canvasEngine} from "../../src/engine/canvas";
import {renderInspectionPng} from "../../src/engine/raster";
import {documentEngine} from "../../src/engine/document";
import {documentInput} from "./document-fixture";
import {readPptx} from "./read-pptx";
import {mkdirSync,writeFileSync} from "node:fs";
const kinds=["hero","editorial","comparison","process","timeline","metrics","closing"] as const;
const theme={background:"#F8F6F0",foreground:"#192925",muted:"#65736B",accent:"#7C3AED"};
const brief={idea:"Illustrative QA",audience:"Internal reviewers",purpose:"Validate editable composition",facts:["Synthetic QA; not customer evidence."],unknowns:[]};
const input=(kind:string,id="qa")=>({kind,idPrefix:id,headline:kind==="hero"?"Design starts with a clear story":"Plan. Compose. Refine.",kicker:"ILLUSTRATIVE QA",body:"A native composition study using supplied sample copy.",footer:"Synthetic QA only. No customer or Canva fidelity evidence.",theme,blocks:[{label:"Plan the message",body:"Keep the supplied facts.",...(["metrics","timeline"].includes(kind)?{value:"24"}:{})},{label:"Compose the story",body:"Keep each part editable.",...(["metrics","timeline"].includes(kind)?{value:"96"}:{})}]});
describe("native visual starting compositions",()=>{
 it("produces seven distinct complete editable object compositions with valid text fit and bounds",async()=>{
  const fingerprints=new Set<string>();
  for(const kind of kinds){const result=composeSlide(input(kind)),blank=canvasEngine.create({title:"Illustrative QA",brief,theme,canvas:{width:1600,height:900},designIntent:"Native visual composition study."},{deckId:crypto.randomUUID(),version:1});
   expect(result.elements.length).toBeLessThanOrEqual(40);expect(result.elements.some(e=>e.type==="shape")).toBe(true);expect(result.elements.filter(e=>e.type==="text").length).toBeGreaterThan(3);expect(new Set(result.elements.map(e=>e.id)).size).toBe(result.elements.length);
   const b=canvasEngine.edit(blank,{deckId:blank.deckId,baseVersion:1,phase:"content",summary:"Apply unsaved geometry",operations:result.elements.map(element=>({type:"add_element",element}))});expect(canvasEngine.validate(b).filter(i=>i.severity==="error")).toEqual([]);fingerprints.add(JSON.stringify(result.elements.map(e=>[e.type,e.x,e.y,e.width,e.height])));
   if(kind==="timeline"){const connector=result.elements.find(e=>e.id.endsWith("progress-connector"))!;for(const period of result.elements.filter(e=>e.id.includes("period-")))expect(period.y+period.height).toBeLessThan(connector.y);}
   const svg=canvasEngine.render(b,"finished",[]);expect(svg).toContain("ILLUSTRATIVE QA");
   if(process.env.GRAPHICROUTER_ARTIFACTS==="1"){mkdirSync("artifacts/compositions",{recursive:true});writeFileSync(`artifacts/compositions/${kind}.png`,(await renderInspectionPng(svg,b.canvas)).bytes);writeFileSync(`artifacts/compositions/${kind}.json`,JSON.stringify(b,null,2));}
  }
  // Hero and closing intentionally share a strong statement structure.
  expect(fingerprints.size).toBeGreaterThanOrEqual(6);
 });
 it("exports a24-page mixed-composition presentation with separate native shapes and labels",async()=>{
  let doc=documentEngine.create({...documentInput,theme,pages:Array.from({length:24},(_,i)=>({id:`page${i+1}`,title:`Synthetic page ${i+1}`,message:`Supplied QA message ${i+1}`,section:`Chapter ${Math.floor(i/4)+1}`,notes:"Synthetic QA. Original detailed content remains in companion notes, not repeated as tiny paragraphs."}))},{deckId:crypto.randomUUID(),version:1});
  for(let i=0;i<24;i++){const result=composeSlide(input(kinds[i%kinds.length],`p${i+1}`));doc=documentEngine.edit(doc,{deckId:doc.deckId,baseVersion:doc.version,summary:"Compose intended blank page",operations:[{type:"edit_elements",pageId:`page${i+1}`,operations:result.elements.map(element=>({type:"add_element",element}))}]});}
  const pptx=await documentEngine.compile(doc,[]),files=readPptx(pptx);expect([...files.keys()].filter(k=>/^ppt\/slides\/slide\d+\.xml$/.test(k))).toHaveLength(24);expect(doc.pages.every(p=>p.elements.some(e=>e.type==="shape"))).toBe(true);expect(files.get("ppt/slides/slide24.xml")).toContain("<p:sp>");expect(files.get("ppt/slides/slide24.xml")).not.toContain("<p:pic>");
  if(process.env.GRAPHICROUTER_ARTIFACTS==="1")writeFileSync("artifacts/compositions/synthetic-24-visual-slides.pptx",pptx);
 });
 it("rejects invented/missing metric values, text overflow and unsupported fields without truncating source",()=>{
  const raw=input("process"),before=structuredClone(raw);expect(()=>composeSlide({...raw,blocks:[{label:"x".repeat(55),body:"W".repeat(140)},{label:"Next",body:"Fine"}]})).toThrow();expect(raw).toEqual(before);
  expect(()=>composeSlide({...input("metrics"),blocks:[{label:"Missing number"},{label:"Also missing"}]})).toThrow();expect(()=>composeSlide({...raw,providerToken:"no"})).toThrow();
 });
});
