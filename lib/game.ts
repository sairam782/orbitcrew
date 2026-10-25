export type Action = "rescue" | "repair" | "charge";
export type Signal = "rescue" | "repair" | "charge" | "thinking" | "break";
export type Member = { id: string; name: string; token: string; action: Action | null; signal: Signal | null };
export type Sector = { name: string; kind: string; description: string; damage: number; rescue: number; charge: number };
export const SECTORS: Sector[] = [
  { name: "The quiet beacon", kind: "DISTRESS SIGNAL", description: "A small shuttle is drifting beside an old communications beacon. Its crew is waiting for a way home.", damage: 12, rescue: 2, charge: 3 },
  { name: "Through the asteroid belt", kind: "DEEP SPACE", description: "A mining pod is stranded among slow-moving asteroids. Help is close, but the rocks will test our hull.", damage: 22, rescue: 3, charge: 2 },
  { name: "The sunlit station", kind: "SOLAR OUTPOST", description: "An abandoned solar station still has power. A few travelers have gathered here, hoping to be found.", damage: 10, rescue: 1, charge: 4 },
  { name: "A light in the nebula", kind: "UNCHARTED SPACE", description: "A research crew has lost its way inside a bright nebula. The dust makes the journey difficult.", damage: 18, rescue: 2, charge: 3 },
  { name: "The last crossing", kind: "HOMEWARD BOUND", description: "One final rescue near the jump gate. Home is on the other side. Let’s bring everyone through together.", damage: 20, rescue: 2, charge: 3 },
];
export type Room = {
  code: string; host: string; phase: "lobby" | "playing" | "won" | "lost";
  members: Member[]; round: number; hull: number; energy: number; rescued: number;
  target: number; mode: "calm" | "expedition"; seed: number;
  log: { id: string; title: string; text: string }[]; pausedBy: string | null;
};
export type PublicRoom = Omit<Room,"members"> & { members: Omit<Member,"token">[]; sector: Sector; version: number };
export function sectorFor(room: Pick<Room,"round"|"seed">): Sector {
  if (room.round === 0) return SECTORS[0];
  if (room.round >= 4) return SECTORS[4];
  return SECTORS[((room.round - 1 + room.seed) % 3) + 1];
}
export function visible(room: Room, version: number): PublicRoom {
  return { ...room, members: room.members.map(({token,...m})=>m), sector: sectorFor(room), version };
}
export function newRoom(code: string, name: string): Room {
  const id = crypto.randomUUID();
  return { code, host:id, phase:"lobby", members:[{id,name,token:crypto.randomUUID(),action:null,signal:null}], round:0,
    hull:72, energy:3, rescued:0, target:4, mode:"calm", seed:Math.floor(Math.random()*3),
    log:[], pausedBy:null };
}
export function start(room: Room) {
  room.phase="playing";room.round=0;room.hull=72;room.energy=room.members.length*2+1;room.rescued=0;
  room.target=room.members.length*(room.mode==="calm"?3:4);room.pausedBy=null;
  room.members.forEach(m=>{m.action=null;m.signal=null});
  room.log=[{id:crypto.randomUUID(),title:"Mission started",text:`Your crew is setting out to rescue ${room.target} travelers in 5 sectors. Everyone’s choice matters.`}];
}
export function resolveRound(room: Room) {
  const sector = sectorFor(room);const n=room.members.length;
  const boosts=room.members.filter(m=>m.action==="charge").length;
  const fixes=room.members.filter(m=>m.action==="repair").length;
  const requests=room.members.filter(m=>m.action==="rescue").length;
  room.energy=Math.min(n*4+4,room.energy+boosts*sector.charge);
  const rescues=Math.min(requests,room.energy);
  room.energy-=rescues;
  const saved=rescues*sector.rescue;room.rescued+=saved;
  const repaired=fixes*Math.ceil(30/n);
  const damage=Math.round(sector.damage*(room.mode==="calm"?0.65:1));
  room.hull=Math.max(0,Math.min(100,room.hull+repaired)-damage);
  // Running out of energy makes the crossing harder but never removes a player's turn.
  const lowPower=room.energy<1;
  if(lowPower) room.hull=Math.max(0,room.hull-8); else room.energy-=1;
  room.log.unshift({id:crypto.randomUUID(),title:`Sector ${room.round+1} · ${sector.name}`,text:
    `${saved} ${saved===1?"traveler":"travelers"} rescued. ${repaired} hull repaired. ${boosts*sector.charge} energy gathered. The crossing caused ${damage}${lowPower?" + 8 low-power":""} hull damage.${rescues<requests?" Some rescue teams could not launch because energy was low.":""}`});
  room.round++;
  room.members.forEach(m=>{m.action=null;m.signal=null});
  if(room.hull<=0){room.phase="lost";room.log.unshift({id:crypto.randomUUID(),title:"A safe retreat",text:"The hull could not make the next crossing. Your crew returned to the nearest station. Try a different plan together."});}
  else if(room.round>=5){room.phase=room.rescued>=room.target?"won":"lost";room.log.unshift({id:crypto.randomUUID(),title:room.phase==="won"?"Everyone home. Together.":"A journey worth another try",text:`You brought ${room.rescued} travelers home. Your rescue goal was ${room.target}.`});}
}
export function apply(room: Room, actorId: string, body: Record<string,unknown>): void {
  const actor=room.members.find(m=>m.id===actorId);if(!actor)throw new Error("Your crew session could not be found.");
  const op=body.op;
  if(op==="start") {if(room.host!==actorId||room.phase!=="lobby")throw new Error("The captain can launch from the waiting room.");start(room);return;}
  if(op==="mode") {if(room.host!==actorId||room.phase!=="lobby")throw new Error("The captain can change the mission before launch.");if(body.mode!=="calm"&&body.mode!=="expedition")throw new Error("Choose a mission style.");room.mode=body.mode;return;}
  if(op==="restart") {if(room.host!==actorId||!["won","lost"].includes(room.phase))throw new Error("The captain can start a new mission after this one.");room.phase="lobby";room.round=0;room.pausedBy=null;room.seed=(room.seed+1)%3;room.members.forEach(m=>{m.action=null;m.signal=null});return;}
  if(op==="leave") {room.members=room.members.filter(m=>m.id!==actorId);if(room.host===actorId&&room.members[0])room.host=room.members[0].id;if(room.pausedBy===actorId)room.pausedBy=null;if(room.phase==="playing"&&room.members.length&&room.members.every(m=>m.action)&&!room.pausedBy)resolveRound(room);return;}
  if(op==="remove") {if(room.host!==actorId)throw new Error("Only the captain can remove a player.");const target=room.members.find(m=>m.id===body.memberId);if(!target||target.id===actorId)throw new Error("Choose another player.");room.members=room.members.filter(m=>m.id!==target.id);if(room.pausedBy===target.id)room.pausedBy=null;if(room.phase==="playing"&&room.members.every(m=>m.action)&&!room.pausedBy)resolveRound(room);return;}
  if(op==="pause") {if(room.phase!=="playing")throw new Error("A break is available during a mission.");if(!room.pausedBy)room.pausedBy=actorId;else if(room.pausedBy===actorId||room.host===actorId){room.pausedBy=null;if(room.members.every(m=>m.action))resolveRound(room);}else throw new Error("The player who paused or the captain can resume.");return;}
  if(room.phase!=="playing")throw new Error("Launch the mission to choose an action.");
  if(op==="signal") {if(!["rescue","repair","charge","thinking","break",null].includes(body.signal as Signal|null))throw new Error("Choose a crew signal.");actor.signal=body.signal as Signal|null;return;}
  if(op==="choose") {if(room.pausedBy)throw new Error("Your crew is taking a break. Resume to choose an action.");if(body.round!==room.round)throw new Error("The crew has moved to the next sector. Choose again.");if(!["rescue","repair","charge",null].includes(body.action as Action|null))throw new Error("Choose one of the three actions.");actor.action=body.action as Action|null;if(room.members.every(m=>m.action))resolveRound(room);return;}
  throw new Error("That action is not available.");
}
