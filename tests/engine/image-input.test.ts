import { describe, it, expect } from "vitest";
import { planImageInput } from "../../src/engine/image-input";
const photo = { id: "product", source: { kind: "chat_attachment", name: "actual-product.png" }, role: "place", instruction: "Use this exact picture on slide3", target: "slide3 product image" };
describe("specific picture inputs", () => {
  it("retains user image order, purpose and target without claiming upload, reading or placement", () => {
    const r=planImageInput({images:[photo,{...photo,id:"reference",role:"style_reference",instruction:"Use only its spacing"}]});expect(r.status).toBe("not_uploaded_or_placed");expect(r.images.map(i=>i.id)).toEqual(["product","reference"]);expect(r.images[0].target).toBe(photo.target);expect(r.images[0].action).toContain("not confirmed accessible");expect(r.images[1].action).toContain("do not upload");
  });
  it("routes public/private/actual-asset sources separately and never echoes URL query secrets", () => {
    const privatePlan=planImageInput({images:[{...photo,source:{kind:"chat_attachment",name:"photo.jpg",bytesAccessible:true}}]});expect(privatePlan.images[0].action).toContain("raw-byte");
    const publicPlan=planImageInput({images:[{...photo,source:{kind:"public_url",url:"https://example.org/photo.png?token=must-not-echo"}}]});expect(publicPlan.images[0].action).toContain("upload-asset-from-url");expect(JSON.stringify(publicPlan)).not.toContain("must-not-echo");
    expect(planImageInput({images:[{...photo,source:{kind:"canva_asset",assetId:"actual-returned-id"}}]}).images[0]).toMatchObject({assetId:"actual-returned-id"});
  });
  it("calculates contain placement preserving aspect ratio and does not apply it to references", () => {
    const p={...photo,dimensions:{width:1200,height:600},box:{x:100,y:200,width:600,height:600}};
    expect(planImageInput({images:[p]}).images[0].containSuggestion).toEqual({left:100,top:350,width:600,height:300});
    expect(planImageInput({images:[{...p,role:"edit_instruction"}]}).images[0]).not.toHaveProperty("containSuggestion");
  });
  it("rejects duplicate picture IDs, missing instructions, excess images, credentials and local/private URL inputs", () => {
    for(const images of [[photo,photo],Array.from({length:11},(_,i)=>({...photo,id:`img${i}`})),[{...photo,instruction:""}]])expect(()=>planImageInput({images})).toThrow();
    for(const url of ["file:///tmp/photo.png","http://example.org/a.png","https://127.0.0.1/a.png","https://10.1.2.3/a.png","https://test.local/a.png","https://user:password@example.org/a.png"])expect(()=>planImageInput({images:[{...photo,source:{kind:"public_url",url}}]})).toThrow();
  });
});
