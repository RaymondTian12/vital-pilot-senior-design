const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),path=require('node:path'),ts=require('typescript');
process.env.TZ='America/Chicago';
function load(file,deps={}) {const exports={};vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services',file),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{exports,require:name=>deps[name]||{},Date,Error});return exports;}
const bp=load('blood-pressure.ts');
const vitals=load('vital-readings.ts',{'./blood-pressure':bp});
const {summaryWindow,todayReadings,goalProgress,attentionReading,recentTrend}=load('daily-summary.ts',{'./blood-pressure':bp,'./vital-readings':vitals});
const normal={classification:'Normal Blood Pressure',alert_state:'LOG_SUCCESS_AND_BANNER',alert_message:'Normal test'};
const critical={classification:'Hypertensive Crisis',alert_state:'LOG_CRITICAL_AND_BANNER',alert_message:'Critical test'};
function pressure(id,time,component){return {log_id:id,metric_type:'BLOOD_PRESSURE',systolic_mmhg:component===critical?190:118,diastolic_mmhg:component===critical?125:76,recorded_at:time,classification:{status:'classified',unclassified_components:[],systolic:component,diastolic:component,overall:component}};}
function data(records=[]) {return {...summaryWindow(new Date('2026-10-20T12:00:00-05:00')),records,goals:{SLEEP:8},truncated_metrics:[]};}
test('local day boundaries include DST changes',()=>{
 assert.equal(summaryWindow(new Date('2026-10-20T12:00:00-05:00')).today_start,'2026-10-20T05:00:00.000Z');
 for(const [now,hours] of [['2026-11-01T12:00:00-06:00',25],['2026-03-08T12:00:00-05:00',23]]){
  const w=summaryWindow(new Date(now));assert.equal((Date.parse(w.end_at)-Date.parse(w.today_start))/3600000,hours);
 }
});
test('today excludes yesterday and next midnight',()=>{
 const d=data([{log_id:1,metric_type:'SLEEP',duration_hours:7,recorded_at:'2026-10-20T04:59:59Z'},{log_id:2,metric_type:'SLEEP',duration_hours:8,recorded_at:'2026-10-20T05:00:00Z'},{log_id:3,metric_type:'SLEEP',duration_hours:9,recorded_at:'2026-10-21T05:00:00Z'}]);
 assert.equal(todayReadings(d).length,1);assert.equal(todayReadings(d)[0].log_id,2);
});
test('goal progress uses latest snapshot without summing repeated steps and preserves zero',()=>{
 const d=data([{log_id:1,metric_type:'PHYSICAL_ACTIVITY',steps_taken:4000,recorded_at:'2026-10-20T06:00:00Z'},{log_id:2,metric_type:'PHYSICAL_ACTIVITY',steps_taken:6000,recorded_at:'2026-10-20T07:00:00Z'}]);
 assert.equal(goalProgress(todayReadings(d)[0],8000).percent,75);
 assert.equal(goalProgress({...todayReadings(d)[0],steps_taken:0},8000).percent,0);
 assert.equal(goalProgress(todayReadings(d)[0],undefined),null);
 assert.equal(goalProgress(todayReadings(d)[0],4000).percent,100);
});
test('earlier critical BP remains visible after a later normal reading',()=>{
 const d=data([pressure(2,'2026-10-20T08:00:00Z',normal),pressure(1,'2026-10-20T06:00:00Z',critical)]);
 assert.equal(attentionReading(d).log_id,1);
 assert.equal(attentionReading(data([pressure(1,'2026-10-20T04:00:00Z',critical)])),undefined);
 assert.equal(attentionReading(data()),undefined);
});
test('trends use saved values in time order without fabricating missing days',()=>{
 const d=data([{log_id:2,metric_type:'SLEEP',duration_hours:8,recorded_at:'2026-10-20T08:00:00Z'},{log_id:1,metric_type:'SLEEP',duration_hours:7,recorded_at:'2026-10-18T08:00:00Z'}]);
 assert.equal(JSON.stringify(recentTrend(d,'SLEEP')),'[7,8]');assert.equal(recentTrend(d,'BLOOD_GLUCOSE').length,0);
});
