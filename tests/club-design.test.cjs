const {test}=require('node:test');
const assert=require('node:assert/strict');
const {renderNative}=require('./helpers/renderNative.cjs');
test('Club header keeps the original centered logo and collapses on keyboard without hiding title',async()=>{
 const source='src/components/ui/ClubHeader.tsx';
 const normal=await renderNative(source,'default',{title:'Biblioteca'},{width:320,fontScale:2,captureEffects:true});
 assert.equal(normal.images.length,1);assert.equal(normal.images[0].resizeMode,'contain');
 const cleanup=normal.effects.map(fn=>fn()).filter(fn=>typeof fn==='function');
 normal.calls.find(c=>c[0]==='keyboardListener'&&c[1]==='keyboardDidShow')[2]();
 assert.deepEqual(normal.updates.at(-1),[0,true]);cleanup.forEach(fn=>fn());
 assert.equal(normal.calls.filter(c=>c[0]==='removeKeyboardListener').length,2);
 const keyboard=await renderNative(source,'default',{title:'Biblioteca'},{states:{0:true}});
 assert.equal(keyboard.images.length,0);assert.match(keyboard.html,/Biblioteca/);
});
test('Game covers preserve proportions and render a neutral fallback for missing or failed images',async()=>{
 const source='src/components/ui/GameCover.tsx';
 const loaded=await renderNative(source,'default',{uri:'https://example.invalid/test-cover.png'});
 assert.equal(loaded.images[0].resizeMode,'contain');loaded.images[0].onError();assert.deepEqual(loaded.updates.at(-1),[0,true]);
 const failed=await renderNative(source,'default',{uri:'https://example.invalid/test-cover.png'},{states:{0:true}});
 assert.equal(failed.images.length,0);
 const missing=await renderNative(source,'default',{});assert.equal(missing.images.length,0);
});
