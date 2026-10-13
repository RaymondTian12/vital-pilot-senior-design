const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');
const exportsObject = {};
const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/measurements.ts'), 'utf8');
vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, { exports: exportsObject });
const { normalizeMeasurements: normalize } = exportsObject;

test('metric height and kilograms convert to the existing imperial API contract', () => {
  const cm = normalize('cm', '', '', '167.64', 'kg', '63.5029318');
  const m = normalize('m', '', '', '1.6764', 'kg', '63.5029318');
  assert.equal(cm.height_feet, 5);
  assert.equal(cm.height_inches, 6);
  assert.ok(Math.abs(cm.weight - 140) < 0.000001);
  assert.equal(m.height_feet, cm.height_feet);
  assert.equal(m.height_inches, cm.height_inches);
});
test('rounding carries twelve inches into the next foot', () => {
  const result = normalize('cm', '', '', '182.8', 'lb', '140');
  assert.equal(result.height_feet, 6);
  assert.equal(result.height_inches, 0);
});
test('invalid, empty, and out-of-range measurements cannot be submitted', () => {
  for (const args of [ ['ft','5','12','','lb','140'], ['ft','5','','','lb','140'], ['cm','','','0','kg','60'], ['m','','','4','kg','60'], ['m','','','1.7','kg',''], ['ft','5','6','','lb','-1'] ]) {
    assert.throws(() => normalize(...args));
  }
});
