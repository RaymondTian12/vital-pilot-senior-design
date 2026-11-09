const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs');
const vm=require('node:vm');
const ts=require('typescript');
const exportsObject={};
vm.runInNewContext(ts.transpileModule(fs.readFileSync(require('node:path').join(__dirname,'../src/services/summary-notifications.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2021}}).outputText,{exports:exportsObject});
const {summaryNotifications}=exportsObject;
test('summary alerts retain saved identity, timestamp, urgency and history links',()=>{
 const reading={metric_type:'BLOOD_PRESSURE',log_id:12,recorded_at:'2026-11-02T12:00:00Z',classification:'Review'};
 const result=summaryNotifications({overall_result:{urgent_readings:[reading],warning_readings:[reading,{...reading,log_id:13}]}});
 assert.equal(result.length,2);
 assert.equal(result[0].severity,'critical');
 assert.equal(result[1].severity,'warning');
 assert.equal(result[0].createdAt,reading.recorded_at);
 assert.equal(result[0].action.route,'/metric-history?metric=BLOOD_PRESSURE&log_id=12');
 assert.equal(result[0].id,summaryNotifications({overall_result:{urgent_readings:[reading],warning_readings:[]}})[0].id);
});
test('missing assessments and no alerts never fabricate notifications',()=>{
 assert.equal(summaryNotifications({}).length,0);
 assert.equal(summaryNotifications({overall_result:{urgent_readings:[],warning_readings:[]}}).length,0);
});
