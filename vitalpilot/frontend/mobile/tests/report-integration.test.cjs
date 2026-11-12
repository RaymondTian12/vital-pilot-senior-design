const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

function load(name, globals) {
  const exports = {};
  const source = fs.readFileSync(
    path.join(__dirname, "../src/services", name),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    }).outputText,
    {
      exports,
      process: { env: { EXPO_PUBLIC_API_BASE_URL: "https://test.example" } },
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      ...globals,
    },
  );
  return exports;
}
function apiClient({
  capabilities = { optional_ai: true, ai_available: true },
  status = 200,
} = {}) {
  const calls = [],
    downloads = [];
  const { api } = load("api.ts", {
    require: (name) =>
      name === "./session"
        ? { session: { version: () => 0, get: async () => "token" } }
        : name === "./report-download"
          ? {
              downloadReportFile: async (...args) => {
                downloads.push(args);
                return { uri: "file:///report", reportId: 23 };
              },
            }
          : { chatHistory: (value) => value },
    fetch: async (url, options) => {
      calls.push([url, options]);
      return {
        ok: status === 200,
        status,
        json: async () =>
          url.endsWith("/capabilities") ? capabilities : { reports: [] },
      };
    },
  });
  return { api, calls, downloads };
}

test("report history, preview and downloads use Raymond's deployed routes", async () => {
  const c = apiClient();
  await c.api.getReportHistory();
  await c.api.getReportPreview(23);
  await c.api.downloadReport(23);
  assert.equal(c.calls[0][0], "https://test.example/reports/history");
  assert.equal(c.calls[1][0], "https://test.example/reports/23/preview");
  assert.equal(c.downloads[0][0], "/reports/23/download");
  assert.equal(c.calls[0][1].headers.Authorization, "Bearer token");
});
test("generation maps 7/30/90-day requests to the existing endpoint with AI off by default", async () => {
  const c = apiClient();
  for (const days of [7, 30, 90]) {
    await c.api.generateReport(days);
    assert.equal(
      c.downloads.at(-1)[0],
      `/reports/generate?days=${days}&include_ai=false&ai_consent=false`,
    );
  }
});
test("AI generation explicitly sends consent after checking server capabilities", async () => {
  const c = apiClient();
  await c.api.generateReport(7, true);
  assert.equal(
    c.downloads[0][0],
    "/reports/generate?days=7&include_ai=true&ai_consent=true",
  );
});
test("old server or unavailable AI cannot silently override the user's consent choice", async () => {
  for (const settings of [
    { status: 404 },
    { capabilities: { optional_ai: false } },
    { capabilities: { optional_ai: true, ai_available: false } },
  ]) {
    const c = apiClient(settings);
    await assert.rejects(c.api.generateReport(7, true));
    assert.equal(c.downloads.length, 0);
  }
});
function downloader({
  status = 200,
  switchAccount = false,
  deferred = false,
  token = "token",
} = {}) {
  let version = 0,
    resolve,
    expire;
  const deleted = [],
    calls = [];
  const result = {
    status,
    uri: "file:///cache/report.pdf",
    headers: { "x-report-id": "23" },
  };
  const operation = deferred
    ? new Promise((r) => {
        resolve = r;
      })
    : Promise.resolve(result);
  const { downloadReportFile } = load("report-download.ts", {
    require: (name) =>
      name === "./session"
        ? { session: { version: () => version, get: async () => token } }
        : {
            cacheDirectory: "file:///cache/",
            downloadAsync: (...args) => {
              calls.push(args);
              if (switchAccount) version++;
              return operation;
            },
            deleteAsync: async (uri) => {
              deleted.push(uri);
            },
          },
    setTimeout: (fn) => {
      expire = fn;
      return 1;
    },
    clearTimeout: () => {},
  });
  return {
    run: () => downloadReportFile("/reports/23/download", "report.pdf"),
    calls,
    deleted,
    expire: () => expire(),
    finish: () => resolve(result),
  };
}
test("PDF download authenticates in headers and reads the existing report-id header", async () => {
  const c = downloader();
  const result = await c.run();
  assert.equal(result.reportId, 23);
  assert.equal(c.calls[0][0], "https://test.example/reports/23/download");
  assert.equal(c.calls[0][2].headers.Authorization, "Bearer token");
});
test("missing sessions and changed accounts never expose a downloaded report", async () => {
  const absent = downloader({ token: null });
  await assert.rejects(absent.run(), /Sign in/);
  assert.equal(absent.calls.length, 0);
  const changed = downloader({ switchAccount: true });
  await assert.rejects(changed.run(), /Account changed/);
  assert.equal(changed.deleted.length, 1);
});
test("failed downloads are deleted instead of opened as PDF files", async () => {
  const c = downloader({ status: 503 });
  await assert.rejects(c.run(), /503/);
  assert.equal(c.deleted.length, 1);
});
test("timeout removes both the partial download and any late completed file", async () => {
  const c = downloader({ deferred: true });
  const pending = c.run();
  await new Promise((r) => setImmediate(r));
  c.expire();
  await assert.rejects(pending, /timed out/);
  assert.equal(c.deleted.length, 1);
  c.finish();
  await new Promise((r) => setImmediate(r));
  assert.equal(c.deleted.length, 2);
});
