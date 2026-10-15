import {describe,it,expect} from "vitest";
import {referenceStudy} from "../../src/design-skills/studies";
import {canvasEngine} from "../../src/engine/canvas";
import {getDesignSkill} from "../../src/design-skills/catalog";
import {renderInspectionPng} from "../../src/engine/raster";
import {mkdirSync,writeFileSync} from "node:fs";
describe("editable reference composition studies",()=>{
 it("builds actual comparison/process/editorial blueprints with separate native text and meaningful geometry",async()=>{
  for(const id of ["infographic-frameworks","illustration-assets","art-direction"]){const{elements,usage,...input}=referenceStudy(id),blank=canvasEngine.create(input,{deckId:crypto.randomUUID(),version:1});const b=canvasEngine.edit(blank,{deckId:blank.deckId,baseVersion:1,phase:"content",summary:"Illustrative native reference study.",operations:elements.map(element=>({type:"add_element",element}))});expect(canvasEngine.validate(b).filter(i=>i.severity==="error")).toEqual([]);expect(elements.some(e=>e.type==="text")).toBe(true);expect(elements.every(e=>e.type!=="image")).toBe(true);const svg=canvasEngine.render(b,"finished",[]),image=await renderInspectionPng(svg,b.canvas);expect(image.bytes.byteLength).toBeGreaterThan(10000);if(process.env.GRAPHICROUTER_ARTIFACTS==="1"){mkdirSync("artifacts/skills",{recursive:true});writeFileSync(`artifacts/skills/${id}.png`,image.bytes);writeFileSync(`artifacts/skills/${id}.json`,JSON.stringify(b,null,2));writeFileSync(`artifacts/skills/${id}.pptx`,await canvasEngine.compile(b,[]));}}
 });
 it("returns reference geometry only on request, preserving sample labels and caveats",()=>{expect(getDesignSkill({skill:"art-direction"})).not.toHaveProperty("nativeStudy");expect(getDesignSkill({skill:"art-direction",includeStudy:true}).nativeStudy?.brief.facts[0]).toContain("illustrative");});
});
