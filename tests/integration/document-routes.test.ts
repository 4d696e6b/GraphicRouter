import {beforeEach,describe,it,expect,vi} from "vitest";
const mocks=vi.hoisted(()=>({user:vi.fn(),service:vi.fn()}));
vi.mock("../../app/chatgpt-auth",()=>({getChatGPTUser:mocks.user}));
vi.mock("../../src/server/runtime",()=>({documentService:mocks.service}));
import {POST as tool} from "../../app/api/document-tools/[name]/route";
import {GET as file} from "../../app/api/documents/[deckId]/[version]/files/[kind]/route";
const id="12345678-1234-4123-8123-123456789abc",url="https://example.test";
beforeEach(()=>{vi.resetAllMocks();mocks.user.mockResolvedValue(null);mocks.service.mockImplementation(()=>{throw Error("private backend");});});
describe("document HTTP boundaries",()=>{
 it("rejects unauthenticated, cross-origin and malformed requests before storage",async()=>{expect((await tool(new Request(`${url}/api/document-tools/get_document`,{method:"POST",body:"{}"}),{params:Promise.resolve({name:"get_document"})})).status).toBe(401);mocks.user.mockResolvedValue({userId:"owner"});expect((await tool(new Request(url,{method:"POST",headers:{Origin:"https://other.test","Content-Type":"application/json"},body:"{}"}),{params:Promise.resolve({name:"get_document"})})).status).toBe(401);expect((await file(new Request(url),{params:Promise.resolve({deckId:"../other",version:"0",kind:"pptx"})})).status).toBe(404);expect(mocks.service).not.toHaveBeenCalled();});
 it("returns safe private download headers with owner identity",async()=>{mocks.user.mockResolvedValue({userId:"owner"});const download=vi.fn(async()=>new Uint8Array([1,2,3]));mocks.service.mockReturnValue({download});const result=await file(new Request(url),{params:Promise.resolve({deckId:id,version:"2",kind:"pptx"})});expect(download).toHaveBeenCalledWith("owner",id,2,"pptx");expect(result.headers.get("Cache-Control")).toBe("private, no-store");expect(result.headers.get("Content-Disposition")).toContain("graphicrouter-document-v2.pptx");});
 it("streams bounded JSON and sanitizes unavailable backend failures",async()=>{mocks.user.mockResolvedValue({userId:"owner"});const result=await tool(new Request(url,{method:"POST",headers:{Origin:url,"Content-Type":"application/json"},body:'{"padding":"'+"x".repeat(128000)+'"}'}),{params:Promise.resolve({name:"get_document"})});expect(result.status).toBe(400);expect(mocks.service).not.toHaveBeenCalled();});
});
