const {test}=require('node:test');
const assert=require('node:assert/strict');
const fs=require('node:fs'),vm=require('node:vm'),ts=require('typescript'),path=require('node:path');
function load(overrides={}){
 let revision=0;const calls=[];
 const files={cacheDirectory:'file:///cache/',downloadAsync:async(url,destination,options)=>{calls.push(['download',url,options]);if(overrides.switchAccount)revision++;return {status:overrides.status||200};},deleteAsync:async()=>{calls.push(['delete']);}};
 const sharing={isAvailableAsync:async()=>true,shareAsync:async()=>{calls.push(['share']);}};
 const exports={};
 vm.runInNewContext(ts.transpileModule(fs.readFileSync(path.join(__dirname,'../src/services/report-files.ts'),'utf8'),{compilerOptions:{module:ts.ModuleKind.CommonJS,target:ts.ScriptTarget.ES2020}}).outputText,{
 exports,process:{env:{EXPO_PUBLIC_API_BASE_URL:'http://test:8000'}},require:name=>name==='react-native'?{Platform:{OS:'ios'}}:name==='./session'?{session:{version:()=>revision,get:async()=>'private-token'}}:name==='expo-file-system/legacy'?files:sharing,
 });return {...exports,calls};
}
test('report download uses auth headers, shares then removes the temporary file',async()=>{
 const client=load();await client.shareReport(12);
 assert.deepEqual(client.calls.map(call=>call[0]),['download','share','delete']);
 assert.equal(client.calls[0][1],'http://test:8000/reports/12/pdf');
 assert.equal(client.calls[0][2].headers.Authorization,'Bearer private-token');
 assert.ok(!client.calls[0][1].includes('private-token'));
});
test('account changes cancel sharing and still clean the downloaded file',async()=>{
 const client=load({switchAccount:true});await assert.rejects(client.shareReport(12),/Account changed/);
 assert.deepEqual(client.calls.map(call=>call[0]),['download','delete']);
});
test('failed authenticated download never shares an error document',async()=>{
 const client=load({status:403});await assert.rejects(client.shareReport(12),/download failed/);
 assert.deepEqual(client.calls.map(call=>call[0]),['download','delete']);
});
