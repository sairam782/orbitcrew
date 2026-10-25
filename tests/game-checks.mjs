import assert from 'node:assert/strict';
import {newRoom,newMember,start,apply,visible,makePuzzle,networkFor,ports,upgradeRoom} from '../lib/game.ts';
function command(room,id,op){return apply(room,id,{round:room.round,stage:room.stage,...op});}
function solve(room){const p=room.puzzle;for(const index of p.path){while(ports(p.tiles[index]).join()!==ports({...p.tiles[index],rotation:p.tiles[index].solution}).join()){command(room,room.host,{op:'rotate',index,rotation:p.tiles[index].rotation,revision:p.revision});}}assert.ok(networkFor(p).connected);}
function vote(room,predicate){const choice=room.stage==='route'?room.routes:[];const opts=visible(room,0);const index=room.stage==='route'?opts.routes.findIndex(predicate):opts.upgradesAvailable.findIndex(predicate);assert.ok(index>=0);for(const member of [...room.members])command(room,member.id,{op:'vote',vote:index});}
for(let seed=0;seed<60;seed++)for(let pattern=0;pattern<3;pattern++){
 const p=makePuzzle(seed,pattern);assert.ok(!networkFor(p).connected,'board starts unsolved');for(const index of p.path)p.tiles[index].rotation=p.tiles[index].solution;assert.ok(networkFor(p).connected,`board ${seed}/${pattern} has a valid route`);
}
const room=newRoom('TEST42','Nova');room.members.push(newMember('Comet',1));start(room);
command(room,room.host,{op:'vote',vote:0});assert.equal(room.stage,'route','route waits for everyone');
command(room,room.members[1].id,{op:'vote',vote:1});assert.equal(room.stage,'puzzle');assert.equal(room.route.id,visible({...room,round:0},0).routes[0].id,'captain breaks ties');
const revealed=visible(room,3);assert.ok(revealed.members.every(m=>!('token'in m)));assert.ok(revealed.puzzle.tiles.every(t=>!('solution'in t)));assert.ok(!('path'in revealed.puzzle),'solution path remains private');
const other=room.members[1];command(room,other.id,{op:'pause'});assert.throws(()=>command(room,room.host,{op:'rotate',index:room.puzzle.start,rotation:room.puzzle.tiles[room.puzzle.start].rotation}),/break/);command(room,other.id,{op:'pause'});
command(room,room.host,{op:'hint'});assert.ok(room.hint);assert.equal(room.energy,7,'hints do not cost resources');
command(room,other.id,{op:'ability'});assert.equal(other.charges,1,'engineer charges persist');
solve(room);command(room,room.host,{op:'ready',revision:room.puzzle.revision});assert.equal(room.stage,'puzzle');
const startIndex=room.puzzle.start;command(room,other.id,{op:'rotate',index:startIndex,rotation:room.puzzle.tiles[startIndex].rotation});assert.ok(room.members.every(m=>!m.ready),'board changes invalidate confirmations');
solve(room);for(const m of [...room.members])command(room,m.id,{op:'ready',revision:room.puzzle.revision});assert.equal(room.stage,'debrief');
assert.throws(()=>apply(room,room.host,{op:'rotate',round:0,stage:'puzzle',index:0,rotation:0}),/moved ahead/);
for(const m of [...room.members])command(room,m.id,{op:'vote',vote:0});assert.equal(room.stage,'route');assert.equal(room.round,1);assert.ok(room.upgrades.length===1);
for(const difficulty of ['calm','expedition'])for(let seed=0;seed<8;seed++)for(const n of [1,6]){
 const r=newRoom('SOLO42','Nova');for(let i=1;i<n;i++)r.members.push(newMember(`Player ${i}`,i));r.seed=seed;r.mode=difficulty;start(r);
 for(let jump=0;jump<4;jump++){
  const wantBold=jump!==1;vote(r,route=>route.id.endsWith(wantBold?'bold':'safe'));solve(r);
  for(const m of [...r.members]){if(m.role==='pilot'&&m.charges>0&&r.shield<20)command(r,m.id,{op:'ability'});}
  for(const m of [...r.members])command(r,m.id,{op:'ready',revision:r.puzzle.revision});
  if(r.phase==='lost')break;if(jump<3)vote(r,u=>u.id===['plates','patch','map'][jump]);
 }
 assert.equal(r.phase,'won',`winnable ${difficulty}, seed ${seed}, ${n} players`);
 const originalSeed=r.seed;command(r,r.host,{op:'restart'});assert.equal(r.phase,'lobby');assert.ok(r.members.every(m=>m.vote===null));
}
const departure=newRoom('LEAVE1','Captain');departure.members.push(newMember('Guest',1));start(departure);command(departure,departure.host,{op:'vote',vote:0});command(departure,departure.host,{op:'remove',memberId:departure.members[1].id});assert.equal(departure.stage,'puzzle','captain can unblock a route when a player disconnects');
const old={code:'OLD123',host:'one',phase:'playing',members:[{id:'one',name:'Nova',token:'keep-me'}]};const migrated=upgradeRoom(old);assert.equal(migrated.phase,'lobby');assert.equal(migrated.members[0].token,'keep-me');assert.equal(migrated.rulesVersion,2);
console.log('PASS: 180 puzzle layouts; valid solutions; private answers; shared voting and captain tie-break; pauses; free hints; specialist charges; changed-board confirmations; stale-stage rejection; upgrades; 32 full adventures with solo and six-player crews; replay; legacy room upgrade.');
