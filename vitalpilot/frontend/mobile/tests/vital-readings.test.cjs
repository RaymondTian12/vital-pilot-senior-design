const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');const vm=require('node:vm');const path=require('node:path');const ts=require('typescript');
function load(file, dependencies={}) {
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
  exports, require:name=>dependencies[name] || {session:{get:async()=> 'test-token',version:()=>0}},
  process:{env:{EXPO_PUBLIC_API_BASE_URL:'http://test/api'}}, URLSearchParams,AbortController,setTimeout,clearTimeout,Error,
  fetch:dependencies.fetch,
 });return exports;
}
const shared=load('blood-pressure.ts');
const {vitalInput,checkedVital,createVitalStore,vitalFields}=load('vital-readings.ts',{'./blood-pressure':shared});
const reading=(type,value,id=1)=>({metric_type:type,[vitalFields[type]]:value,log_id:id,recorded_at:'2026-10-20T12:00:00Z',...(type==='BODY_MASS_INDEX'?{bmi_value:21.6}:{})});
const cases=[['BLOOD_GLUCOSE',98],['BLOOD_OXYGEN',97],['PEAK_FLOW_RATE',450],['BODY_MASS_INDEX',150.25],['SLEEP',7.25],['PHYSICAL_ACTIVITY',6200],['WATER_INTAKE',5.5]];
test('every single-value metric sends its numeric database field and reloads history',async()=>{
 for(const [type,value] of cases){
  const saved=reading(type,value);let submitted;
  const store=createVitalStore(type,{
   submitVital:async(t,payload)=>{assert.equal(t,type);submitted=payload;return saved;},
   getVital:async(t)=>{assert.equal(t,type);return {count:1,records:[saved]};},
  });
  const result=await store.save(String(value),'',false);
  assert.equal(result[vitalFields[type]],value);
  assert.equal(submitted[vitalFields[type]],value);
  await store.refresh();assert.equal(store.getSnapshot().records[0].log_id,1);
 }
});
test('validation rejects missing, fractional integer, nonfinite, negative and overflowing values',()=>{
 for(const [type,value] of [['BLOOD_GLUCOSE',''],['BLOOD_GLUCOSE','1.2'],['BLOOD_OXYGEN','101'],['SLEEP','24.01'],['SLEEP','Infinity'],['WATER_INTAKE','100'],['WATER_INTAKE','5.555'],['PHYSICAL_ACTIVITY','-1'],['BODY_MASS_INDEX','0'],['PEAK_FLOW_RATE','1e2']]) assert.throws(()=>vitalInput(type,value));
 for(const type of ['SLEEP','WATER_INTAKE','PHYSICAL_ACTIVITY']) assert.equal(Object.values(vitalInput(type,'0'))[0],0);
});
test('wrong metric or malformed server response is never accepted as a saved reading',async()=>{
 assert.throws(()=>checkedVital('BLOOD_GLUCOSE',reading('BLOOD_OXYGEN',98)));
 assert.throws(()=>checkedVital('BODY_MASS_INDEX',{...reading('BODY_MASS_INDEX',150),bmi_value:null}));
 const store=createVitalStore('BLOOD_GLUCOSE',{submitVital:async()=>reading('BLOOD_OXYGEN',98),getVital:async()=>({count:0,records:[]})});
 assert.equal(await store.save('98','',false),null);
 assert.equal(store.getSnapshot().uncertain,true);assert.equal(store.getSnapshot().records.length,0);
});
test('sample preview and duplicate presses cannot create extra single-value records',async()=>{
 let posts=0,resolve;
 const store=createVitalStore('SLEEP',{submitVital:()=>{posts++;return new Promise(r=>resolve=r);},getVital:async()=>({count:0,records:[]})});
 assert.equal(await store.save('7.5','',true),null);assert.equal(posts,0);
 const pending=store.save('7.5','',false);assert.equal(await store.save('7.5','',false),null);assert.equal(posts,1);
 store.dispose();resolve(reading('SLEEP',7.5));assert.equal(await pending,null);assert.equal(store.getSnapshot().records.length,0);
});
test('single-value API uses authenticated POST and per-metric pagination without client timestamp',async()=>{
 const calls=[];
 const {api}=load('api.ts',{fetch:async(...args)=>{calls.push(args);return {ok:true,json:async()=>reading('BLOOD_OXYGEN',98)};}});
 await api.submitVital('BLOOD_OXYGEN',{spo2_percentage:98});await api.getVital('SLEEP',20);
 assert.deepEqual(JSON.parse(calls[0][1].body),{spo2_percentage:98,metric_type:'BLOOD_OXYGEN'});
 assert.equal(calls[0][1].headers.Authorization,'Bearer test-token');
 assert.equal(calls[1][0],'http://test/api/metrics?metric_type=SLEEP&limit=20&offset=20');
});
test('glucose context and explicit peak personal best are sent with the reading',async()=>{
 let payload;
 const glucose=createVitalStore('BLOOD_GLUCOSE',{submitVital:async(type,values)=>{payload=values;return reading(type,98);},getVital:async()=>({count:0,records:[]})});
 await glucose.save('98','',false,{glucose_context:'fasting'});assert.equal(payload.glucose_context,'fasting');
 const peak=createVitalStore('PEAK_FLOW_RATE',{submitVital:async(type,values)=>{payload=values;return reading(type,400);},getVital:async()=>({count:0,records:[]})});
 await peak.save('400','',false,{peak_personal_best:'500'});assert.equal(payload.peak_personal_best,500);
 const before=payload;
 assert.equal(await peak.save('400','',false,{peak_personal_best:'0'}),null);assert.equal(payload,before);
});
