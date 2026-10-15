import {describe,it,expect} from "vitest";
import {handleMcp} from "../../src/mcp/server";
import {buildBriefingMessage,briefingIssues,getQuestions} from "../../src/briefing/questions";
import {renderToStaticMarkup} from "react-dom/server";
import {Briefing} from "../../src/preview/Briefing";
async function rpc(name:string,args:unknown,owner:string|null="owner"){
 const req=new Request("https://example.test/mcp",{method:"POST",headers:{"Content-Type":"application/json",Accept:"application/json,text/event-stream"},body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name,arguments:args}})});
 return(await(await handleMcp(req,owner,()=>{throw Error("No service/provider write should occur");})).json() as {result:Record<string,any>}).result;
}
const answers={complexity:"Detailed",template:"Edit my existing Canva design",templateSource:"https://www.canva.com/design/DA_TEST_original/view",editRequest:"Change only the headline to violet. Use the attached photo on page2."};
describe("connected-tool edit/image orchestration; not live provider calls",()=>{
 it("uses a minimal existing-file brief instead of requesting a new topic/audience/format",()=>{
  expect(getQuestions(answers).map(q=>q.id)).toEqual(["complexity","template","templateSource","editRequest"]);expect(briefingIssues(answers)).toEqual([]);
  const msg=buildBriefingMessage({context:"Retained original instructions",answers});expect(msg).toContain('"workflowMode": "canva_edit"');expect(msg).toContain("keep the same design ID");expect(msg).toContain("plan_image_input");expect(msg).not.toContain("Use GraphicRouter create_canvas to start");
  const html=renderToStaticMarkup(<Briefing initial={{context:"",answers}} submit={async()=>{}}/>);expect(html).toContain("Ready to edit your Canva file?");expect(html).toContain("Continue editing this Canva file");
 });
 it("requires a real source/request and does not offer a fallback or template search for same-file edits",()=>{
  expect(briefingIssues({...answers,templateSource:"Find something"})[0].id).toBe("templateSource");expect(briefingIssues({...answers,editRequest:""})[0].id).toBe("editRequest");
  const html=renderToStaticMarkup(<Briefing initial={{context:"",answers:{complexity:"Balanced",template:answers.template}}}/>);expect(html).toContain("Which Canva file should we edit?");expect(html).not.toContain("Find an existing design in my Canva account");
 });
 it("authenticates all new read-only helpers and never loads storage/services",async()=>{
  for(const [name,args] of [["plan_canva_edit",{design:answers.templateSource,request:answers.editRequest}],["plan_image_input",{images:[{id:"photo",source:{kind:"chat_attachment",name:"photo.png"},role:"place",instruction:"Use on page2"}]}]] as const){expect(await rpc(name,args,null)).toMatchObject({isError:true,structuredContent:{error:{code:"UNAUTHORIZED"}}});expect((await rpc(name,args)).isError).not.toBe(true);}
  expect(await rpc("plan_canva_edit",{design:"https://evil.test/DA_TEST_original",request:"Edit"})).toMatchObject({isError:true});expect(await rpc("plan_image_input",{images:[],secret:"no"})).toMatchObject({isError:true});
 });
 it("protects snapshot review and returns actual native composition geometry through MCP",async()=>{
  const snapshot={designId:"DA_TEST_original",transactionId:"actual-transaction",complete:true,pages:[{id:"page1",index:1,width:1600,height:900,elements:[]}]};
  const review={before:snapshot,after:snapshot,targets:[],visualReview:"passed"};
  expect(await rpc("review_canva_edit",review,null)).toMatchObject({isError:true});expect((await rpc("review_canva_edit",review)).structuredContent.decision).toBe("no_changes");
  const composition={kind:"comparison",idPrefix:"p2",headline:"Compare two supplied options",blocks:[{label:"Option A",body:"Supplied content A"},{label:"Option B",body:"Supplied content B"}],theme:{background:"#F8F6F0",foreground:"#192925",muted:"#65736B",accent:"#7C3AED"}};
  expect(await rpc("compose_slide",composition,null)).toMatchObject({isError:true});const result=await rpc("compose_slide",composition);expect(result.structuredContent.elements.some((e:{type:string})=>e.type==="shape")).toBe(true);
 });
 it("returns explicit pending-read/upload states rather than fabricated read or saved status",async()=>{
  const p=await rpc("plan_canva_edit",{design:answers.templateSource,request:answers.editRequest});expect(p.structuredContent).toMatchObject({mode:"edit_original",status:"provider_read_required"});expect(p.structuredContent.instructions).toContain("explicit approval required");
  const image=await rpc("plan_image_input",{images:[{id:"a",source:{kind:"chat_attachment",name:"a.png"},role:"style_reference",instruction:"Use its visual hierarchy"}]});expect(image.structuredContent.status).toBe("not_uploaded_or_placed");
 });
 it("serves same-file and image instructions even through the cached briefing entry point",async()=>{
  const r=await rpc("start_briefing",{context:"",answers});expect(r.structuredContent.questionCount).toBe(4);const text=JSON.stringify(r.content);expect(text).toContain("plan_canva_edit");expect(text).toContain("review_canva_edit");expect(text).toContain("PICTURES IN THE PROMPT");expect(text).toContain("compose_slide");
 });
});
