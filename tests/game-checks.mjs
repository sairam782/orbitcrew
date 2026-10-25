import assert from 'node:assert/strict';
import {newRoom,start,apply,visible,resolveRound} from '../lib/game.ts';
const a=newRoom('TEST42','Nova');
a.members.push({id:'two',token:'secret-two',name:'Comet',action:null,signal:null});start(a);
assert.equal(a.target,6);assert.equal(a.phase,'playing');
apply(a,a.host,{op:'choose',action:'rescue',round:0});assert.equal(a.round,0,'round waits for all players');
apply(a,'two',{op:'pause'});assert.throws(()=>apply(a,a.host,{op:'choose',action:'charge',round:0}),/break/);
apply(a,'two',{op:'pause'});apply(a,'two',{op:'choose',action:'charge',round:0});
assert.equal(a.round,1);assert.equal(a.rescued,2);assert.equal(a.energy,6);assert.equal(a.hull,64);
assert.throws(()=>apply(a,a.host,{op:'choose',action:'rescue',round:0}),/next sector/);
assert.ok(visible(a,1).members.every(m=>!('token' in m)),'session secrets stay server-side');
assert.throws(()=>apply(a,'two',{op:'restart'}),/captain/);
apply(a,a.host,{op:'choose',action:'repair',round:1});apply(a,'two',{op:'leave'});assert.equal(a.round,2,'leaving player does not block round');
for(let seed=0;seed<3;seed++){
 const solo=newRoom('SOLO42','Nova');solo.seed=seed;start(solo);
 for(const action of ['charge','rescue','rescue','repair','rescue'])apply(solo,solo.host,{op:'choose',action,round:solo.round});
 assert.equal(solo.phase,'won',`a calm mission is winnable, seed ${seed}`);
 apply(solo,solo.host,{op:'restart'});assert.equal(solo.phase,'lobby');
}
const low=newRoom('LOW123','Nova');start(low);low.energy=0;apply(low,low.host,{op:'choose',action:'rescue',round:0});assert.equal(low.rescued,0);assert.equal(low.energy,0);assert.equal(low.hull,56);
console.log('PASS: waiting for crew, pause/resume, shared effects, stale round protection, token privacy, captain controls, player departure, all solo routes, restart, low-energy crossing.');
