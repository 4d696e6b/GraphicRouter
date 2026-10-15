"use client";
import {useState} from "react";
import {Document} from "./Document";
import type {DocumentData} from "./document-data";
import {toolErrorMessage} from "./tool-error";
export function HostedDocument({initial}:{initial:DocumentData}){const[data,setData]=useState(initial);return <Document data={data} invoke={async name=>{const{deckId,version}=data.result.blueprint;const response=await fetch(`/api/document-tools/${name}`,{method:"POST",headers:{"Content-Type":"application/json"},body:JSON.stringify({deckId,version})});if(!response.ok)throw new Error(toolErrorMessage(await response.json().catch(()=>null)));setData(await response.json() as DocumentData);}}/>;}
