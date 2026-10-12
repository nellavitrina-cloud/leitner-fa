const test = require('node:test');
const assert = require('node:assert/strict');
const L = require('./core.js');
const card = {id:'come',word:'come',fa:'آمدن',category:'verb'};
test('new cards and due boundary',() => {
  const initial = L.fresh(); assert.ok(L.matches(card,initial,{mode:'due'},100));
  const s = L.answer(initial,'come',true,100);
  assert.equal(s.cards.come.box,2); assert.equal(s.cards.come.due,100+2*86400000);
  assert.equal(initial.history.length,0); assert.equal(s.history.length,1);
  assert.equal(L.matches(card,s,{mode:'due'},101),false);
  assert.ok(L.matches(card,s,{mode:'due'},s.cards.come.due));
});
test('wrong reset, box cap and filters',() => {
  let s = L.fresh(); for(let i=0;i<7;i++) s=L.answer(s,'come',true,100);
  assert.equal(s.cards.come.box,5); assert.equal(s.cards.come.due,100+16*86400000);
  s=L.answer(s,'come',false,200); assert.equal(s.cards.come.box,1); assert.equal(s.cards.come.weak,true); assert.equal(s.cards.come.due,200+86400000);
  assert.ok(L.matches(card,s,{mode:'weak',type:'verb',search:'آمد'}));
  assert.equal(L.matches(card,s,{mode:'new'}),false);
  assert.equal(L.matches(card,s,{type:'noun'}),false);
});
test('backup roundtrip and invalid input',() => {
  const s = L.answer(L.fresh(),'come',true,100);
  assert.deepEqual(L.validate(s,['come']),s);
  assert.throws(()=>L.validate(s,[]));
  s.cards.come.box=6; assert.throws(()=>L.validate(s,['come']));
  assert.throws(()=>L.validate({version:1,cards:{},history:[{id:'come',at:'bad',correct:true}]},['come']));
});
