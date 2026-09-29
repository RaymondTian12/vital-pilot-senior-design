const { test } = require('node:test');
const assert = require('node:assert/strict');
const fs = require('node:fs');
const vm = require('node:vm');
const ts = require('typescript');

function client(baseUrl = 'http://localhost:8000/', response = { ok: true, json: async () => ({ access_token: 'test-token' }) }) {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(require('node:path').join(__dirname, '../src/services/api.ts'), 'utf8');
  vm.runInNewContext(ts.transpileModule(source, { compilerOptions: { module: ts.ModuleKind.CommonJS } }).outputText, {
    exports,
    require: () => ({ session: { get: async () => 'stored-token' } }),
    process: { env: { EXPO_PUBLIC_API_BASE_URL: baseUrl } },
    URLSearchParams, AbortController, setTimeout, clearTimeout,
    fetch: async (...args) => { calls.push(args); return response; },
  });
  return { api: exports.api, calls };
}

test('login encodes the existing backend query contract and returns its token', async () => {
  const { api, calls } = client();
  const result = await api.signIn('test+mobile@example.com', 'a&b? #');
  const [url, options] = calls[0];
  assert.equal(new URL(url).pathname, '/auth/login');
  assert.equal(new URL(url).searchParams.get('password'), 'a&b? #');
  assert.equal(new URL(url).searchParams.get('email'), 'test+mobile@example.com');
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'omit');
  assert.equal(result.access_token, 'test-token');
});

test('registration includes both names required by the backend', async () => {
  const { api, calls } = client();
  await api.signUp('Test', 'Mobile', 'test@example.com', 'test-password');
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, '/auth/register');
  assert.equal(url.searchParams.get('firstname'), 'Test');
  assert.equal(url.searchParams.get('lastname'), 'Mobile');
});

test('profile request sends a bearer token and logout uses POST', async () => {
  const { api, calls } = client();
  await api.me();
  await api.logout();
  assert.equal(calls[0][0], 'http://localhost:8000/auth/me');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer stored-token');
  assert.equal(calls[1][1].method, 'POST');
});

test('missing configuration does not simulate successful authentication', async () => {
  const { api, calls } = client('');
  await assert.rejects(api.signIn('test@example.com', 'test'), /not configured/);
  await assert.rejects(api.signUp('Test', 'User', 'test@example.com', 'test'), /not configured/);
  assert.equal(calls.length, 0);
});

test('server authentication errors reach the screen', async () => {
  const { api } = client('http://localhost:8000', { ok: false, status: 401, json: async () => ({ detail: 'Invalid email or password' }) });
  await assert.rejects(api.signIn('test@example.com', 'wrong'), /Invalid email or password/);
});
