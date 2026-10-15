import { describe, expect, it } from "vitest";
import { handleMcp } from "../../src/mcp/server";
async function check(args: unknown, owner: string | null = "owner") {
  const request = new Request("https://example.test/mcp", { method:"POST", headers:{"Content-Type":"application/json", Accept:"application/json, text/event-stream"}, body:JSON.stringify({jsonrpc:"2.0",id:1,method:"tools/call",params:{name:"review_canva_design",arguments:args}}) });
  const response = await handleMcp(request, owner, () => { throw Error("No service or write should occur"); });
  return (await response.json() as {result: Record<string,any>}).result;
}
const input = {designId:"DA_TEST_page",pageIndex:1,width:600,height:900,texts:[{id:"headline",text:"Editable heading",box:{x:40,y:40,width:300,height:60}}],images:[{id:"background",textInImage:"not_checked"}],requiredText:["Editable heading"],expectedLinks:[],visualReview:"not_checked"};
describe("authenticated stateless Canva snapshot checkpoint", () => {
  it("requires identity and rejects unknown/unbounded fields without loading services", async () => {
    expect(await check(input,null)).toMatchObject({isError:true,structuredContent:{error:{code:"UNAUTHORIZED"}}});
    // The SDK rejects schema-invalid arguments before the handler runs.
    expect(await check({...input,images:Array(201).fill(input.images[0])})).toMatchObject({isError:true,content:[expect.objectContaining({type:"text",text:expect.stringContaining("at most 200")})]});
    expect(await check({...input,providerToken:"never accepted"})).toMatchObject({isError:true});
  });
  it("does not present unchecked image lettering as ready, and preserves baked-text blockers", async () => {
    expect(await check(input)).toMatchObject({structuredContent:{decision:"needs_visual_review",nativeTextCount:1}});
    expect(await check({...input,images:[{id:"background",textInImage:"present"}],visualReview:"passed"})).toMatchObject({structuredContent:{decision:"blocked",issues:[expect.objectContaining({code:"TEXT_BAKED_IN_IMAGE"})]}});
  });
});
