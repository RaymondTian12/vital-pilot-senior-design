const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const ts=require('typescript');
function moduleAt(file, extras={}) {
 const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:()=>({session:{get:async()=> 'test-token',version:()=>0}}),process:{env:{EXPO_PUBLIC_API_BASE_URL:'http://test/api'}},URLSearchParams,AbortController,setTimeout,clearTimeout,Error,...extras});return exports;
}
const {createBloodPressureStore,pressureNumbers,classificationView}=moduleAt('services/blood-pressure.ts');
const tick=()=>new Promise(r=>setImmediate(r));
const component=(label='Normal Blood Pressure',alert='LOG_SUCCESS_AND_BANNER')=>({classification:label,alert_state:alert,alert_message:'Server message'});
const reading=(id=1)=>({log_id:id,metric_type:'BLOOD_PRESSURE',systolic_mmhg:116,diastolic_mmhg:75,recorded_at:`2026-10-17T12:00:${String(id%60).padStart(2,'0')}Z`,classification:{systolic:component(),diastolic:component(),overall:component(),status:'classified',unclassified_components:[]}});
const page=records=>({metric_type:'BLOOD_PRESSURE',count:records.length,records});

test('typed API uses numeric backend payload, stored auth and 20-record pages without a client timestamp',async()=>{
 const calls=[];const {api}=moduleAt('services/api.ts',{fetch:async(...args)=>{calls.push(args);return {ok:true,json:async()=>reading()}}});
 await api.submitBloodPressure(116,75);await api.getBloodPressure(20);
 assert.deepEqual(JSON.parse(calls[0][1].body),{metric_type:'BLOOD_PRESSURE',systolic_mmhg:116,diastolic_mmhg:75});
 assert.equal(calls[0][1].headers.Authorization,'Bearer test-token');
 assert.equal(calls[1][0],'http://test/api/metrics?metric_type=BLOOD_PRESSURE&limit=20&offset=20');
});
test('positive whole-number validation never turns blanks or fractions into measurements',()=>{
 for(const values of [['','75'],['0','75'],['1.5','75'],['-2','75'],['12x','75'],['1e2','75']])assert.throws(()=>pressureNumbers(...values));
 assert.equal(pressureNumbers(' 116 ','75').systolic,116);
});
test('unclassified results preserve a known critical alert without displaying a normal overall state',()=>{
 const r=reading();r.classification={systolic:component('Hypertensive Crisis','LOG_CRITICAL_AND_BANNER'),diastolic:null,overall:null,status:'unclassified',unclassified_components:['diastolic']};
 const view=classificationView(r);assert.equal(view.title,'Classification unavailable');assert.equal(view.critical,true);assert.equal(view.tone,'unknown');assert.match(view.messages[0],/^Systolic: Hypertensive Crisis/);
});
test('history pagination uses server offset, deduplicates ids and retains data on failure',async()=>{
 const offsets=[];let fail=false;const first=Array.from({length:20},(_,i)=>reading(i+1));
 const s=createBloodPressureStore({getBloodPressure:async offset=>{offsets.push(offset);if(fail)throw Error('offline');return page(offset===0?first:[reading(20),reading(21)])}});
 await s.refresh();await s.loadMore();assert.deepEqual(offsets,[0,20]);assert.equal(s.getSnapshot().records.length,21);
 fail=true;await s.refresh();assert.equal(s.getSnapshot().records.length,21);assert.equal(s.getSnapshot().error,'offline');
});
test('duplicate presses cannot issue another POST; success is shared immediately',async()=>{
 let resolve;let posts=0;const s=createBloodPressureStore({submitBloodPressure:()=>{posts++;return new Promise(r=>resolve=r)},getBloodPressure:async()=>page([reading()])});
 const first=s.save('116','75',false);assert.equal(await s.save('116','75',false),null);assert.equal(posts,1);resolve(reading());assert.equal((await first).log_id,1);await tick();assert.equal(s.getSnapshot().records[0].log_id,1);
});
test('failed saves do not become successful results or discard caller draft; sample mode cannot write',async()=>{
 let posts=0;const draft={primary:'116',secondary:'75'};const s=createBloodPressureStore({submitBloodPressure:async()=>{posts++;throw Error('failed')},getBloodPressure:async()=>page([])});
 assert.equal(await s.save(draft.primary,draft.secondary,true),null);assert.equal(posts,0);
 assert.equal(await s.save(draft.primary,draft.secondary,false),null);assert.equal(draft.primary,'116');assert.equal(s.getSnapshot().records.length,0);assert.equal(s.getSnapshot().saveError,'failed');
});
test('uncertain POST is never retried automatically and requires successful history review before explicit retry',async()=>{
 let posts=0;const s=createBloodPressureStore({submitBloodPressure:async()=>{posts++;throw Object.assign(Error('timeout'),{uncertain:true})},getBloodPressure:async()=>page([])});
 await s.save('116','75',false);await s.save('116','75',false);assert.equal(posts,1);s.allowRetry();assert.equal(s.getSnapshot().uncertain,true);
 await s.refresh();s.allowRetry();assert.equal(s.getSnapshot().uncertain,false);await s.save('116','75',false);assert.equal(posts,2);
});
test('stale loads and old-account save responses cannot populate a new account',async()=>{
 let release;const old=createBloodPressureStore({submitBloodPressure:()=>new Promise(r=>release=r),getBloodPressure:async()=>page([])});
 const pending=old.save('116','75',false);old.dispose();const next=createBloodPressureStore({getBloodPressure:async()=>page([])});release(reading());assert.equal(await pending,null);assert.equal(next.getSnapshot().records.length,0);
 let resolveOld;let count=0;const s=createBloodPressureStore({getBloodPressure:()=>++count===1?new Promise(r=>resolveOld=r):Promise.resolve(page([reading(2)]))});const stale=s.refresh();await s.refresh();resolveOld(page([reading(1)]));await stale;assert.equal(s.getSnapshot().records[0].log_id,2);
});
test('API rejects account changes while reading the token, before sending a request',async()=>{
 let version=0,calls=0;const {api}=moduleAt('services/api.ts',{require:()=>({session:{version:()=>version,get:async()=>{version++;return 'other-account-token'}}}),fetch:async()=>{calls++;}});
 await assert.rejects(api.getBloodPressure(),/Account changed/);assert.equal(calls,0);
});
test('malformed or timezone-ambiguous save response is uncertain, never added to records',async()=>{
 const bad={...reading(),recorded_at:'2026-10-17T12:00:00'};const s=createBloodPressureStore({submitBloodPressure:async()=>bad,getBloodPressure:async()=>page([])});
 assert.equal(await s.save('116','75',false),null);assert.equal(s.getSnapshot().uncertain,true);assert.equal(s.getSnapshot().records.length,0);
});
