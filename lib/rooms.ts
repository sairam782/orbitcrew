import { env } from "cloudflare:workers";
import { apply, newRoom, visible, type Room } from "./game";
function db(){if(!env.DB)throw new Error("The mission service is temporarily unavailable. Please try again.");return env.DB;}
export function reply(value:unknown,status=200){return Response.json(value,{status,headers:{"Cache-Control":"no-store"}});}
export function cleanName(value:unknown){return typeof value==="string"?value.trim().replace(/[\u0000-\u001f]/g,"").slice(0,24)||"Nova":"Nova";}
export async function create(name:unknown){
  const alphabet="ABCDEFGHJKLMNPQRSTUVWXYZ23456789";
  for(let i=0;i<5;i++){
    const data=crypto.getRandomValues(new Uint8Array(6));const code=Array.from(data,b=>alphabet[b%alphabet.length]).join("");
    const room=newRoom(code,cleanName(name));
    const result=await db().prepare("INSERT OR IGNORE INTO rooms (code,state,version,updated_at) VALUES (?,?,0,?)").bind(code,JSON.stringify(room),Date.now()).run();
    if(result.meta.changes)return {room:visible(room,0),memberId:room.host,token:room.members[0].token};
  }throw new Error("We could not prepare a room. Please try again.");
}
export async function getRoom(code:string,token:string){
  const row=await db().prepare("SELECT state,version,updated_at FROM rooms WHERE code=?").bind(code).first<{state:string;version:number;updated_at:number}>();
  if(!row||Date.now()-row.updated_at>7*86400000)throw new Error("That room was not found or has expired. Check the six-character room code.");
  const room=JSON.parse(row.state) as Room;if(!room.members.some(m=>m.token===token))throw new Error("Your session has ended. Join the room again.");
  return visible(room,row.version);
}
export async function mutate(code:string,token:string,body:Record<string,unknown>){
  for(let retry=0;retry<8;retry++){
    const row=await db().prepare("SELECT state,version,updated_at FROM rooms WHERE code=?").bind(code).first<{state:string;version:number;updated_at:number}>();
    if(!row||Date.now()-row.updated_at>7*86400000)throw new Error("That room was not found or has expired. Check the six-character room code.");
    const room=JSON.parse(row.state) as Room;let joined=null;
    if(body.op==="join"){
      const existing=room.members.find(m=>m.token===token);
      if(existing)return {room:visible(room,row.version),memberId:existing.id,token:existing.token};
      if(room.phase!=="lobby")throw new Error("This mission has already launched. Ask the captain to finish and return to the waiting room.");
      if(room.members.length>=6)throw new Error("This crew is full. Each ship has room for six players.");
      joined={id:crypto.randomUUID(),token:crypto.randomUUID(),name:cleanName(body.name),action:null,signal:null};room.members.push(joined);
    }else{const actor=room.members.find(m=>m.token===token);if(!actor)throw new Error("Your session has ended. Join the room again.");apply(room,actor.id,body);}
    const result=await db().prepare("UPDATE rooms SET state=?,version=version+1,updated_at=? WHERE code=? AND version=?").bind(JSON.stringify(room),Date.now(),code,row.version).run();
    if(result.meta.changes)return {room:visible(room,row.version+1),...(joined?{memberId:joined.id,token:joined.token}:{})};
  }throw new Error("The crew is making several changes. Please try your action again.");
}
export function checkOrigin(request:Request){const origin=request.headers.get("origin");if(origin&&origin!==new URL(request.url).origin)throw new Error("Please open the game directly to continue.");}
export function tokenOf(request:Request){return request.headers.get("authorization")?.replace(/^Bearer /,"")||"";}
