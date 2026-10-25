export type Role = "pilot" | "engineer" | "analyst";
export type Signal = "rescue" | "repair" | "charge" | "thinking" | "break";
export type Stage = "route" | "puzzle" | "debrief";
export type Member = {
  id: string; name: string; token: string; role: Role; charges: number;
  vote: number | null; ready: boolean; signal: Signal | null; contributions: number;
};
export type Tile = { kind: "corner" | "straight" | "blocked"; rotation: number; solution: number | null };
export type PublicTile = Omit<Tile,"solution">;
export type Puzzle = { tiles: Tile[]; start: number; end: number; path: number[]; revision: number; turns: number; hints: number };
export type Route = {
  id: string; name: string; kind: string; story: string; transmission: string; speaker: string;
  people: number; damage: number; energy: number; supply: number; color: string; pattern: number; reward: string;
};
export const ROLES: Record<Role,{name:string;ability:string;description:string}> = {
  pilot:{name:"Pilot",ability:"Raise rescue shields",description:"Absorb 10 hull damage on this crossing."},
  engineer:{name:"Engineer",ability:"Bridge two relays",description:"Align the next two unsolved relays automatically."},
  analyst:{name:"Signal analyst",ability:"Tap the signal cache",description:"Recover 2 energy and reveal the next relay’s connections."},
};
const SAFE: Omit<Route,"id"|"pattern">[] = [
  {name:"The drifting greenhouse",kind:"SANCTUARY",story:"A greenhouse ship has fallen silent. Its botanists are keeping a garden alive with the last of their power.",transmission:"We’ve kept the lights on for the seedlings. Please tell us someone can hear this.",speaker:"Botanist Iona",people:2,damage:8,energy:1,supply:0,color:"mint",reward:"The botanists will share their seed archive."},
  {name:"The sleeping observatory",kind:"LOST OUTPOST",story:"Two astronomers are stranded inside a sleeping observatory. Its solar batteries still hold a small charge.",transmission:"The stars are beautiful from here. We’d quite like to see home again, though.",speaker:"Astronomer Kei",people:2,damage:10,energy:1,supply:1,color:"blue",reward:"The observatory has a spare energy cell."},
  {name:"Whale-song relay",kind:"FIRST CONTACT",story:"An old research buoy is wrapped in a cloud of luminous space creatures. A tiny research team is waiting inside.",transmission:"They sing every time we switch on the radio. I think they’re trying to help us.",speaker:"Researcher Moss",people:2,damage:7,energy:1,supply:0,color:"violet",reward:"Bring home the first recording of a starwhale."},
  {name:"The quiet crossing",kind:"HOMEWARD ROUTE",story:"A service shuttle is waiting beside the home gate. Reach it through the sheltered side of the debris field.",transmission:"We can see the gate. We can almost see home. Just one more connection.",speaker:"Shuttle captain Ren",people:2,damage:9,energy:1,supply:0,color:"mint",reward:"A careful final crossing."},
];
const BOLD: Omit<Route,"id"|"pattern">[] = [
  {name:"The shattered ring",kind:"HIGH-RISK RESCUE",story:"Four miners are trapped on a station inside a broken planetary ring. A longer relay chain is their only route out.",transmission:"The station is holding. Mostly. If you can reach the outer relay, we can get everyone to the airlock.",speaker:"Miner Ada",people:4,damage:22,energy:2,supply:0,color:"amber",reward:"Four travelers are counting on you."},
  {name:"A train between stars",kind:"DEEP-SPACE RESCUE",story:"A passenger train has stalled across a damaged jump lane. Help its four passengers before the next crossing.",transmission:"We’ve made a game of guessing the constellations. We’ve run out of guesses. Are you our ride?",speaker:"Passenger Eli",people:4,damage:20,energy:2,supply:0,color:"blue",reward:"Recover a fragment of the old star map."},
  {name:"The glass nebula",kind:"UNSTABLE SIGNAL",story:"Four explorers are drifting inside a crystalline nebula. Reflections have scrambled their rescue signal.",transmission:"There are a thousand copies of your ship on our screen. We only need one of you to be real.",speaker:"Explorer Lumi",people:4,damage:24,energy:2,supply:0,color:"violet",reward:"A rare nebula crystal travels home with you."},
  {name:"The last lighthouse",kind:"FINAL RESCUE",story:"Four lighthouse keepers have guided others home for years. Their station is breaking apart at the edge of the home gate.",transmission:"This is the lighthouse. We’ve brought every ship through. We’re hoping someone will do the same for us.",speaker:"Keeper Sol",people:4,damage:26,energy:2,supply:0,color:"amber",reward:"Leave no light behind."},
];
export type Upgrade = { id:string; name:string; description:string };
export const UPGRADES: Upgrade[][] = [
  [{id:"plates",name:"Living hull plates",description:"Every future crossing causes 3 less hull damage."},{id:"battery",name:"Reserve capacitor",description:"Recover 3 energy now."}],
  [{id:"drone",name:"Companion rescue drone",description:"Bring one extra traveler home on each remaining rescue."},{id:"patch",name:"Self-mending shield",description:"Repair 20 hull now, up to 100."}],
  [{id:"map",name:"The keepers’ star map",description:"The final crossing causes 12 less hull damage."},{id:"pods",name:"Hidden escape pods",description:"Find and rescue 2 extra travelers now."}],
];
export type Room = {
  rulesVersion: 2; code:string; host:string; phase:"lobby"|"playing"|"won"|"lost"; stage:Stage;
  members:Member[]; round:number; hull:number; energy:number; rescued:number; target:number;
  mode:"calm"|"expedition"; seed:number; route:Route|null; puzzle:Puzzle|null;
  shield:number; upgrades:string[]; souvenirs:string[]; totalTurns:number; totalHints:number;
  hint:{index:number;text:string}|null; report:{title:string;text:string;saved:number;damage:number}|null;
  log:{id:string;title:string;text:string}[]; pausedBy:string|null;
};
export type PublicRoom = Omit<Room,"members"|"puzzle"> & {
  members:Omit<Member,"token">[]; puzzle:(Omit<Puzzle,"tiles"|"path"> & {tiles:PublicTile[]})|null;
  routes:Route[]; upgradesAvailable:Upgrade[]; network:{powered:number[];connected:boolean}; version:number;
};
export function newMember(name:string,index=0):Member {
  return {id:crypto.randomUUID(),name,token:crypto.randomUUID(),role:(["pilot","engineer","analyst"] as Role[])[index%3],charges:2,vote:null,ready:false,signal:null,contributions:0};
}
export function newRoom(code:string,name:string):Room {
  const member=newMember(name);
  return {rulesVersion:2,code,host:member.id,phase:"lobby",stage:"route",members:[member],round:0,hull:80,energy:7,rescued:0,target:10,mode:"calm",seed:Math.floor(Math.random()*1e9),route:null,puzzle:null,shield:0,upgrades:[],souvenirs:[],totalTurns:0,totalHints:0,hint:null,report:null,log:[],pausedBy:null};
}
export function upgradeRoom(value:Room):Room {
  if(value.rulesVersion===2)return value;
  const fresh=newRoom(value.code,"Nova");fresh.host=value.host;
  fresh.members=value.members.map((m,i)=>({...newMember(m.name,i),id:m.id,token:m.token}));
  fresh.log=[{id:crypto.randomUUID(),title:"A new adventure awaits",text:"Orbit Crew now has branching routes, crew roles, and shared relay puzzles. Pick your role and launch a new mission."}];
  return fresh;
}
export function routesFor(room:Pick<Room,"round"|"seed">):Route[] {
  const index=room.round===3?3:(room.seed+room.round)%3;
  const safe=SAFE[index],bold=BOLD[index];
  const pair=[{...safe,id:`${room.round}-safe`,pattern:(room.seed+room.round)%3},{...bold,id:`${room.round}-bold`,pattern:(room.seed+room.round+1)%3}];
  return (room.seed+room.round)%2?pair.reverse():pair;
}
export const DIRECTIONS=["north","east","south","west"];
export function ports(tile:Pick<Tile,"kind"|"rotation">):number[] {
  return (tile.kind==="blocked"?[]:tile.kind==="straight"?[0,2]:[0,1]).map(d=>(d+tile.rotation)%4).sort();
}
export function tileName(index:number){return `${"ABCD"[index%4]}${Math.floor(index/4)+1}`;}
export function connectionText(tile:Pick<Tile,"kind"|"rotation">){return tile.kind==="blocked"?"asteroid, no connections":ports(tile).map(d=>DIRECTIONS[d]).join(" and ");}
const PATHS=[
  [4,5,1,2,6,10,9,13,14,15,11],
  [8,9,5,1,2,6,7,11],
  [0,4,5,9,8,12,13,14,10,11,7,3],
];
function direction(from:number,to:number){if(to===from-4)return 0;if(to===from+1)return 1;if(to===from+4)return 2;return 3;}
export function makePuzzle(seed:number,pattern:number):Puzzle {
  let state=(seed+1)>>>0;const rng=()=>{state=(Math.imul(state,1664525)+1013904223)>>>0;return state;};
  const path=PATHS[pattern%3];
  const tiles:Tile[]=Array.from({length:16},()=>({kind:rng()%3===0?"blocked":rng()%2?"corner":"straight",rotation:rng()%4,solution:null}));
  path.forEach((index,p)=>{
    const required=[p?direction(index,path[p-1]):3,p<path.length-1?direction(index,path[p+1]):1].sort();
    const kind=required[1]-required[0]===2?"straight":"corner";
    let solution=0;while(solution<4&&ports({kind,rotation:solution}).join()!==required.join())solution++;
    tiles[index]={kind,solution,rotation:(solution+1+rng()%3)%4};
  });
  const puzzle={tiles,start:path[0],end:path[path.length-1],path:[...path],revision:0,turns:0,hints:0};
  if(networkFor(puzzle).connected)puzzle.tiles[puzzle.start].rotation=(puzzle.tiles[puzzle.start].rotation+1)%4;
  return puzzle;
}
export function networkFor(puzzle:{tiles:Pick<Tile,"kind"|"rotation">[];start:number;end:number}|null):{powered:number[];connected:boolean} {
  if(!puzzle||!ports(puzzle.tiles[puzzle.start]).includes(3))return {powered:[],connected:false};
  const visited=new Set<number>([puzzle.start]);const queue=[puzzle.start];
  while(queue.length){const index=queue.shift()!;for(const d of ports(puzzle.tiles[index])){
    const col=index%4,row=Math.floor(index/4);if(d===0&&row===0||d===1&&col===3||d===2&&row===3||d===3&&col===0)continue;
    const next=index+[-4,1,4,-1][d];if(!visited.has(next)&&ports(puzzle.tiles[next]).includes((d+2)%4)){visited.add(next);queue.push(next);}
  }}
  return {powered:[...visited],connected:visited.has(puzzle.end)&&ports(puzzle.tiles[puzzle.end]).includes(1)};
}
export function visible(room:Room,version:number):PublicRoom {
  const {puzzle,members,...rest}=room;
  const publicPuzzle=puzzle?(()=>{const {path,tiles,...state}=puzzle;return {...state,tiles:tiles.map(({solution,...tile})=>tile)};})():null;
  return {...rest,members:members.map(({token,...member})=>member),puzzle:publicPuzzle,routes:routesFor(room),upgradesAvailable:UPGRADES[room.round]||[],network:networkFor(puzzle),version};
}
function log(room:Room,title:string,text:string){room.log.unshift({id:crypto.randomUUID(),title,text});}
function resetVotes(room:Room){room.members.forEach(m=>{m.vote=null;m.ready=false;m.signal=null});}
export function start(room:Room){
  room.phase="playing";room.stage="route";room.round=0;room.hull=room.mode==="calm"?85:65;room.energy=room.mode==="calm"?7:5;
  room.rescued=0;room.target=room.mode==="calm"?10:12;room.route=null;room.puzzle=null;room.shield=0;room.upgrades=[];room.souvenirs=[];room.totalTurns=0;room.totalHints=0;room.hint=null;room.report=null;room.pausedBy=null;room.log=[];
  room.members.forEach(m=>{m.charges=2;m.contributions=0});resetVotes(room);
  log(room,"Beyond the last lighthouse",`Four jumps from home, your crew hears a distress call. Rescue at least ${room.target} travelers. Choose your route together, reconnect their signals, and bring them home.`);
}
function majority(room:Room){
  const left=room.members.filter(m=>m.vote===0).length,right=room.members.filter(m=>m.vote===1).length;
  return left===right?(room.members.find(m=>m.id===room.host)?.vote??0):left>right?0:1;
}
function selectRoute(room:Room){
  room.route=routesFor(room)[majority(room)];room.stage="puzzle";room.puzzle=makePuzzle(room.seed+room.round*97,room.route.pattern);room.hint=null;room.shield=0;resetVotes(room);
  log(room,`Incoming · ${room.route.speaker}`,room.route.transmission);
}
function nextHint(room:Room){
  const p=room.puzzle!;const next=p.path.find(index=>ports(p.tiles[index]).join()!==ports({...p.tiles[index],rotation:p.tiles[index].solution!}).join());
  if(next===undefined)return null;
  return {index:next,text:`Relay ${tileName(next)} should connect ${connectionText({...p.tiles[next],rotation:p.tiles[next].solution!})}. Select that relay and turn it until those connections line up.`};
}
function resolveRescue(room:Room){
  const route=room.route!;const p=room.puzzle!;
  const saved=route.people+(room.upgrades.includes("drone")?1:0);
  const shortfall=Math.max(0,route.energy-room.energy);room.energy=Math.max(0,room.energy-route.energy)+route.supply;
  const base=Math.round(route.damage*(room.mode==="calm"?.8:1));
  const mitigation=room.shield+(room.upgrades.includes("plates")?3:0)+(room.round===3&&room.upgrades.includes("map")?12:0);
  const damage=Math.max(0,base-mitigation)+shortfall*8;
  room.hull=Math.max(0,room.hull-damage);room.rescued+=saved;room.totalTurns+=p.turns;room.totalHints+=p.hints;
  room.souvenirs.push(route.name);room.stage="debrief";room.hint=null;resetVotes(room);
  const text=`${saved} travelers came aboard. The crossing used ${route.energy} energy and caused ${damage} hull damage.${route.supply?` You recovered ${route.supply} energy from the station.`:""}${shortfall?` Emergency power caused ${shortfall*8} of that damage.`:""} ${route.speaker.split(" ").slice(-1)[0]}: “We thought we were alone out there. Thank you for coming.”`;
  room.report={title:"A signal. A connection. A way home.",text,saved,damage};log(room,`Rescue ${room.round+1} complete · ${route.name}`,text);
  if(room.hull<=0){room.phase="lost";log(room,"The crew found a safe harbor",`You rescued ${room.rescued} travelers, but the ship needs repairs before it can reach home.`);}
  else if(room.round===3){room.phase=room.rescued>=room.target?"won":"lost";log(room,room.phase==="won"?"The lighthouse answers":"One more story to tell",`Your crew brought ${room.rescued} travelers home. The mission goal was ${room.target}.`);}
}
function finishDebrief(room:Room){
  const upgrade=UPGRADES[room.round][majority(room)];room.upgrades.push(upgrade.id);
  if(upgrade.id==="battery")room.energy+=3;if(upgrade.id==="patch")room.hull=Math.min(100,room.hull+20);if(upgrade.id==="pods")room.rescued+=2;
  log(room,`New upgrade · ${upgrade.name}`,upgrade.description);
  room.round++;room.stage="route";room.route=null;room.puzzle=null;room.report=null;room.hint=null;room.shield=0;resetVotes(room);
}
function advanceIfReady(room:Room){
  if(room.phase!=="playing"||room.pausedBy||!room.members.length)return;
  if(room.stage==="route"&&room.members.every(m=>m.vote!==null))selectRoute(room);
  else if(room.stage==="puzzle"&&room.members.every(m=>m.ready)&&networkFor(room.puzzle).connected)resolveRescue(room);
  else if(room.stage==="debrief"&&room.members.every(m=>m.vote!==null))finishDebrief(room);
}
export function apply(room:Room,actorId:string,body:Record<string,unknown>){
  const actor=room.members.find(m=>m.id===actorId);if(!actor)throw new Error("Your crew session could not be found.");
  const op=body.op;
  if(op==="start"){if(room.host!==actorId||room.phase!=="lobby")throw new Error("The captain can launch from the waiting room.");start(room);return;}
  if(op==="role"){if(room.phase!=="lobby")throw new Error("Choose your role before launch.");if(!["pilot","engineer","analyst"].includes(body.role as Role))throw new Error("Choose a crew role.");actor.role=body.role as Role;return;}
  if(op==="mode"){if(room.host!==actorId||room.phase!=="lobby")throw new Error("The captain can change the mission before launch.");if(body.mode!=="calm"&&body.mode!=="expedition")throw new Error("Choose a mission style.");room.mode=body.mode;return;}
  if(op==="restart"){if(room.host!==actorId||!["won","lost"].includes(room.phase))throw new Error("The captain can plan another mission after this one.");room.phase="lobby";room.stage="route";room.round=0;room.pausedBy=null;room.seed=Math.floor(Math.random()*1e9);room.route=null;room.puzzle=null;resetVotes(room);return;}
  if(op==="leave"||op==="remove"){
    if(op==="remove"&&room.host!==actorId)throw new Error("Only the captain can remove a player.");
    const target=op==="leave"?actorId:body.memberId;
    if(op==="remove"&&(!room.members.some(m=>m.id===target)||target===actorId))throw new Error("Choose another player.");
    room.members=room.members.filter(m=>m.id!==target);if(room.host===target&&room.members[0])room.host=room.members[0].id;if(room.pausedBy===target)room.pausedBy=null;advanceIfReady(room);return;
  }
  if(room.phase!=="playing")throw new Error("Launch a mission to play.");
  if(op==="signal"){if(!["rescue","repair","charge","thinking","break",null].includes(body.signal as Signal|null))throw new Error("Choose a crew signal.");actor.signal=body.signal as Signal|null;return;}
  if(op==="pause"){if(!room.pausedBy)room.pausedBy=actorId;else if(room.pausedBy===actorId||room.host===actorId){room.pausedBy=null;advanceIfReady(room);}else throw new Error("The player who paused or the captain can resume.");return;}
  if(room.pausedBy)throw new Error("Your crew is taking a break. Resume when you’re ready.");
  if(body.round!==room.round||body.stage!==room.stage)throw new Error("The crew has moved ahead. Your screen is updating; try again.");
  if(op==="vote"){
    if(!["route","debrief"].includes(room.stage))throw new Error("There is no route vote right now.");
    if(![0,1,null].includes(body.vote as number|null))throw new Error("Choose one of the two options.");
    actor.vote=body.vote as number|null;advanceIfReady(room);return;
  }
  if(room.stage!=="puzzle"||!room.puzzle)throw new Error("The relay board is not active.");
  const p=room.puzzle;
  if(op==="rotate"){
    const index=body.index;if(typeof index!=="number"||!Number.isInteger(index)||index<0||index>15||p.tiles[index].kind==="blocked")throw new Error("Choose an active relay.");
    if(body.rotation!==p.tiles[index].rotation)throw new Error("A crewmate just turned that relay. Its new position is shown.");
    p.tiles[index].rotation=(p.tiles[index].rotation+(body.direction===-1?3:1))%4;p.revision++;p.turns++;actor.contributions++;room.members.forEach(m=>m.ready=false);room.hint=null;return;
  }
  if(op==="hint"){
    if(networkFor(p).connected){room.hint={index:p.end,text:"The signal is connected. Everyone can confirm the rescue."};return;}
    room.hint=nextHint(room);p.hints++;return;
  }
  if(op==="ability"){
    if(actor.charges<=0)throw new Error("Your specialist tool needs to recharge. You can still use every relay and hint.");
    if(actor.role==="pilot"){if(room.shield>=20)throw new Error("The rescue shields are already at full strength.");room.shield=Math.min(20,room.shield+10);}
    if(actor.role==="analyst"){room.energy+=2;room.hint=nextHint(room);}
    if(actor.role==="engineer"){
      if(networkFor(p).connected)throw new Error("The signal is already connected. Save your tool for the next rescue.");
      let aligned=0;for(const index of p.path){const t=p.tiles[index];if(ports(t).join()!==ports({...t,rotation:t.solution!}).join()){t.rotation=t.solution!;aligned++;}if(aligned===2)break;}
      p.revision++;room.members.forEach(m=>m.ready=false);room.hint=null;
    }
    actor.charges--;actor.contributions++;log(room,`${actor.name} used ${ROLES[actor.role].ability.toLowerCase()}`,ROLES[actor.role].description);return;
  }
  if(op==="ready"){
    if(!networkFor(p).connected)throw new Error("Connect the signal before confirming the rescue. A hint can help.");
    if(body.revision!==p.revision)throw new Error("The board changed. Check the new signal before confirming.");
    actor.ready=!actor.ready;advanceIfReady(room);return;
  }
  throw new Error("That action is not available.");
}
export function missionRank(room:Pick<Room,"rescued"|"target"|"hull">){return room.rescued>=room.target+3&&room.hull>=25?"Constellation keepers":room.rescued>=room.target?"Lighthouse legends":"Starlight explorers";}
