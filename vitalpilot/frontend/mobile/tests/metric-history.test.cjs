const { test } = require("node:test"),
  assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript"),
  path = require("node:path");
const exportsObject = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/services/metric-history.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  { exports: exportsObject },
);
const { historyWindow, historyPeriod, chartSeries } = exportsObject;
test("7/30/90 windows use complete local calendar days and validated period defaults", () => {
  for (const n of [7, 30, 90]) {
    const now = new Date(2026, 10, 7, 15);
    const window = historyWindow(n, now);
    const start = new Date(window.start_at),
      end = new Date(window.end_at);
    assert.equal(start.getHours(), 0);
    assert.equal(end.getDate(), 8);
    let count = 0;
    for (let day = new Date(start); day < end; day.setDate(day.getDate() + 1))
      count++;
    assert.equal(count, n);
  }
  assert.equal(historyPeriod("90"), 90);
  assert.equal(historyPeriod(["30"]), 30);
  assert.equal(historyPeriod("999"), 7);
});
test("chart series keeps missing dates undefined and preserves actual zeros", () => {
  const bins = [
    {
      date: "2026-11-01",
      count: 1,
      values: { amount_cups: { min: 0, max: 0, avg: 0 } },
      contexts: {},
    },
    { date: "2026-11-02", count: 0, values: {}, contexts: {} },
  ];
  const series = chartSeries(bins, "amount_cups");
  assert.equal(series[0].value, 0);
  assert.equal(series[1].value, undefined);
  assert.equal(series.length, 2);
});
test("glucose context filter uses separate observations without inventing unknown readings", () => {
  const bins = [
    {
      date: "2026-11-01",
      count: 2,
      values: { glucose_mgdl: { avg: 110, min: 90, max: 130 } },
      contexts: {
        fasting: {
          count: 1,
          values: { glucose_mgdl: { avg: 90, min: 90, max: 90 } },
        },
      },
    },
  ];
  assert.equal(chartSeries(bins, "glucose_mgdl", "fasting")[0].value, 90);
  assert.equal(
    chartSeries(bins, "glucose_mgdl", "unknown")[0].value,
    undefined,
  );
});
