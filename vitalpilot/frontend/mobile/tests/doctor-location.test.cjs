const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
function load(location, platform = 'ios') {
 const exports = {};
 const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/doctor-location.ts'), 'utf8');
 vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports, require: name => name === 'react-native' ? { Platform: { OS: platform } } : location });
 return exports;
}
test('normalizes a U.S. region and rejects incomplete or international areas', () => {
 const { searchArea } = load({});
 assert.equal(searchArea({city:'Arlington',region:'Texas',isoCountryCode:'US'}).state,'TX');
 assert.equal(searchArea({city:'Chicago',region:'IL',isoCountryCode:'US'}).state,'IL');
 assert.throws(() => searchArea({city:'Toronto',region:'Ontario',isoCountryCode:'CA'}), /U.S./);
 assert.throws(() => searchArea({region:'TX',isoCountryCode:'US'}), /manually/);
});
test('denied permission never requests coordinates', async () => {
 let positions = 0;
 const location = { hasServicesEnabledAsync:async()=>true, requestForegroundPermissionsAsync:async()=>({granted:false}), getCurrentPositionAsync:async()=>{positions++;} };
 await assert.rejects(load(location).locateDoctorSearchArea(), /permission/);
 assert.equal(positions,0);
});
test('approved one-time lookup resolves city and state', async () => {
 const location = { Accuracy:{Balanced:3}, hasServicesEnabledAsync:async()=>true, requestForegroundPermissionsAsync:async()=>({granted:true}), getCurrentPositionAsync:async()=>({coords:{latitude:32.7,longitude:-97.1}}), reverseGeocodeAsync:async()=>[{city:'Arlington',region:'Texas',isoCountryCode:'US'}] };
 const result=await load(location).locateDoctorSearchArea();
 assert.equal(result.city,'Arlington');assert.equal(result.state,'TX');
});
