import assert from 'node:assert/strict';
import {connectionText} from '../lib/game.ts';
const base=process.env.ORBIT_TEST_URL||'http://127.0.0.1:5173';
async function call(path,body,token){const response=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:response.status,...await response.json()};}
const captain=await call('/api/rooms',{name:'Test Captain'});assert.equal(captain.status,200);const path=`/api/rooms/${captain.room.code}`;
assert.equal((await call(path)).status,400);
const joins=await Promise.all(Array.from({length:7},(_,i)=>call(path,{op:'join',name:`Test ${i}`})));
assert.equal(joins.filter(j=>j.status===200).length,5);
const players=[captain,...joins.filter(j=>j.status===200)];
let state=(await call(path,{op:'start'},captain.token)).room;
async function post(player,op){const result=await call(path,{round:state.round,stage:state.stage,...op},player.token);assert.equal(result.status,200,result.error);return result.room;}
async function sync(){state=(await call(path,null,captain.token)).room;return state;}
for(let jump=0;jump<4;jump++){
 const vote=state.routes.findIndex(r=>r.id.endsWith(jump===1?'safe':'bold'));
 const votes=await Promise.all(players.map(p=>post(p,{op:'vote',vote})));await sync();assert.equal(state.stage,'puzzle');
 assert.ok(!('path'in state.puzzle));assert.ok(state.puzzle.tiles.every(t=>!('solution'in t)));
 if(jump===0){
  const indices=state.puzzle.tiles.map((t,i)=>t.kind!=='blocked'?i:-1).filter(i=>i>=0).slice(0,2);
  const old=structuredClone(state.puzzle);
  const rotations=await Promise.all(indices.map((index,i)=>post(players[i],{op:'rotate',index,rotation:old.tiles[index].rotation,revision:old.revision})));
  await sync();assert.equal(state.puzzle.revision,old.revision+2,'different concurrent relays are preserved');
  for(const index of indices)assert.equal(state.puzzle.tiles[index].rotation,(old.tiles[index].rotation+1)%4);
  const index=indices[0],rotation=state.puzzle.tiles[index].rotation,revision=state.puzzle.revision;
  const same=await Promise.all(players.slice(0,2).map(p=>call(path,{op:'rotate',index,rotation,revision,round:state.round,stage:'puzzle'},p.token)));
  assert.equal(same.filter(r=>r.status===200).length,1,'same-relay races cannot overwrite');await sync();
 }
 // Solve using only public hints and public connection directions, like an assistive player can.
 for(let attempts=0;attempts<20&&!state.network.connected;attempts++){
  state=await post(captain,{op:'hint'});const hint=state.hint;assert.ok(hint);
  const desired=hint.text.match(/should connect (.+?)\./)[1];
  for(let turns=0;turns<4&&connectionText(state.puzzle.tiles[hint.index])!==desired;turns++)state=await post(captain,{op:'rotate',index:hint.index,rotation:state.puzzle.tiles[hint.index].rotation,revision:state.puzzle.revision});
 }
 assert.ok(state.network.connected,'public hints can solve every board');
 const pilot=players.find(p=>state.members.find(m=>m.id===p.memberId)?.role==='pilot'&&state.members.find(m=>m.id===p.memberId)?.charges>0);
 if(pilot)state=await post(pilot,{op:'ability'});
 const confirmations=await Promise.all(players.map(p=>post(p,{op:'ready',revision:state.puzzle.revision})));await sync();
 assert.equal(state.souvenirs.length,jump+1,'each rescue resolves once');
 if(jump<3){assert.equal(state.stage,'debrief');const vote=state.upgradesAvailable.findIndex(u=>u.id===['plates','patch','map'][jump]);await Promise.all(players.map(p=>post(p,{op:'vote',vote})));await sync();assert.equal(state.round,jump+1);assert.equal(state.stage,'route');}
}
assert.equal(state.phase,'won');assert.ok(state.rescued>=state.target);assert.equal((await call(path,null,captain.token)).room.version,state.version);
state=await post(captain,{op:'restart'});assert.equal(state.phase,'lobby');
console.log('PASS: six-player capacity under concurrent joins; protected room reads; concurrent distinct and same-relay moves; public hint solving; specialist tools; 24 synchronized rescue confirmations; upgrade voting; four-rescue victory; persistence and replay.');
