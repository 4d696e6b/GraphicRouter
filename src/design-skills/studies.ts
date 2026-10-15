import type {CanvasElement,CreateCanvasInput} from "../contracts";
import {composeComponent} from "../engine/components";
const palette={background:"#F8F6F0",foreground:"#18342D",muted:"#65736B",accent:"#126D59"};
const ink={foreground:palette.foreground,accent:palette.accent,muted:"#D8E1D9"};
const text=(id:string,text:string,x:number,y:number,width:number,height:number,fontSize:number,zIndex:number,bold=false):CanvasElement=>({id,type:"text",text,x,y,width,height,fontFamily:"Arial",fontSize,bold,align:"left",zIndex,color:{token:"foreground"}});
export function referenceStudy(skill:string){
 const comparison=["infographic-frameworks","data-storytelling"].includes(skill);
 const process=["tall-and-carousel","illustration-assets"].includes(skill);
 const elements:CanvasElement[]=[text("study-label","ILLUSTRATIVE DESIGN STUDY",80,55,1400,35,20,1,true)];
 if(comparison){
  elements.push(text("headline","Make the comparison visible",80,125,1400,110,64,2,true),text("intro","Sample values only. One shared unit and a common zero baseline.",80,255,1360,50,26,3));
  elements.push(...composeComponent({kind:"bar_chart",idPrefix:"sample",x:80,y:365,width:1400,height:330,startZIndex:4,...ink,units:"sample units",data:[{label:"Option A",value:20},{label:"Option B",value:40}]}).elements);
  elements.push(text("takeaway","Option B is twice Option A in this illustrative dataset.",80,770,1400,60,32,40,true));
 }else if(process){
  elements.push(text("headline","Plan. Compose. Review.",80,125,1400,110,64,2,true),text("intro","An abstract workflow study with three editable stages.",80,255,1360,50,26,3));
  const stages=[{name:"document",label:"Plan the message",body:"Use the supplied facts."},{name:"steps",label:"Compose objects",body:"Give each part a role."},{name:"check",label:"Inspect the result",body:"Revise useful details."}] as const;
  stages.forEach((s,i)=>{const x=80+i*480;elements.push(...composeComponent({kind:"icon",name:s.name,idPrefix:`stage${i+1}`,x,y:400,width:140,height:140,startZIndex:4+i*10,...ink}).elements);elements.push(text(`stage${i+1}-label`,s.label,x,600,420,55,32,70+i*2,true),text(`stage${i+1}-body`,s.body,x,675,420,60,24,71+i*2));});
 }else{
  elements.push(text("headline","One page.\nOne clear message.",80,150,850,250,80,2,true),text("intro","A restrained editorial direction for a sample presentation.",80,475,850,100,30,3),text("detail","This study demonstrates editable composition. It is not project evidence or a finished user deck.",80,660,820,100,24,4));
  elements.push({id:"focal-panel",type:"shape",shape:"rectangle",x:1060,y:150,width:440,height:600,zIndex:5,fill:{hex:"#E1EADF"}},...composeComponent({kind:"icon",name:"target",idPrefix:"focus",x:1120,y:300,width:320,height:320,startZIndex:6,...ink}).elements);
 }
 const brief:CreateCanvasInput["brief"]={idea:"An illustrative editable composition study",audience:"Design reviewers",purpose:"Explain composition choices",facts:["All sample values and copy are illustrative, not user evidence."],unknowns:["Actual Canva import fidelity remains unverified."]};
 return{title:comparison?"Comparison study":process?"Process study":"Editorial study",canvas:{width:1600,height:900},theme:palette,brief,designIntent:comparison?"Aligned labels and proportional bars explain a numerical relationship.":process?"Three distinct stages show progression with simple text-free geometric icons.":"Asymmetric hierarchy and open space make one message dominant.",elements,
   usage:"This is an unsaved native reference. Reuse composition principles, replace illustrative content with supplied facts, and apply elements with unique IDs/layers in batches of at most40. Do not import a reference as user evidence. Inspect the adapted result."};
}
