import assert from 'node:assert/strict';
const base='http://127.0.0.1:5173';
async function call(path,body,token){const res=await fetch(base+path,{method:body?'POST':'GET',headers:{...(body?{'Content-Type':'application/json'}:{}),...(token?{Authorization:`Bearer ${token}`}:{})},...(body?{body:JSON.stringify(body)}:{})});return {status:res.status,...await res.json()};}
const a=await call('/api/rooms',{name:'API Captain'});assert.equal(a.status,200);const path=`/api/rooms/${a.room.code}`;
assert.equal((await call(path)).status,400,'room read requires membership');
const joins=await Promise.all(Array.from({length:7},(_,i)=>call(path,{op:'join',name:`Player ${i}`})));
assert.equal(joins.filter(j=>j.status===200).length,5,'atomic join limit');
const players=[a,...joins.filter(j=>j.status===200)];
let state=await call(path,{op:'start'},a.token);assert.equal(state.room.members.length,6);
assert.equal((await call(path,{op:'join',name:'Late guest'})).status,400);
let round=0;let tokens=players.map(p=>p.token);
for(const action of ['charge','rescue','rescue','repair','rescue']){
 const results=await Promise.all(tokens.map(token=>call(path,{op:'choose',action,round},token)));
 assert.ok(results.every(r=>r.status===200),JSON.stringify(results.filter(r=>r.status!==200)));
 state=await call(path,null,a.token);assert.equal(state.room.round,round+1,'concurrent choices resolve exactly once');
 assert.ok(state.room.members.every(m=>!('token' in m)));round++;
}
assert.equal(state.room.phase,'won');
const resumed=await call(path,null,a.token);assert.equal(resumed.room.version,state.room.version,'saved state survives another request');
assert.equal((await call(path,{op:'restart'},a.token)).room.phase,'lobby');
console.log('PASS: authenticated room reads, 7 concurrent join attempts capped at 6 players, late joins blocked, 30 simultaneous player choices, exactly-once rounds, full multiplayer victory, persistent state, replay.');
