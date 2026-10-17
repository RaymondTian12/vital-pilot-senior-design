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

test('login sends JSON credentials without exposing them in the URL', async () => {
  const { api, calls } = client();
  const result = await api.signIn('test+mobile@example.com', 'a&b? #');
  const [url, options] = calls[0];
  assert.equal(new URL(url).pathname, '/auth/login');
  assert.equal(new URL(url).search, '');
  assert.deepEqual(JSON.parse(options.body), { email: 'test+mobile@example.com', password: 'a&b? #' });
  assert.equal(options.headers['Content-Type'], 'application/json');
  assert.equal(options.method, 'POST');
  assert.equal(options.credentials, 'omit');
  assert.equal(result.access_token, 'test-token');
});

test('registration includes both names required by the backend', async () => {
  const { api, calls } = client();
  await api.signUp('Test', 'Mobile', 'test@example.com', 'test-password');
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, '/auth/register');
  assert.equal(url.search, '');
  assert.deepEqual(JSON.parse(calls[0][1].body), { firstname: 'Test', lastname: 'Mobile', email: 'test@example.com', password: 'test-password' });
});

test('Google sign-in exchanges the ID token in a POST body without putting it in the URL', async () => {
  const { api, calls } = client();
  await api.signInWithGoogle('google-id-token');
  assert.equal(calls[0][0], 'http://localhost:8000/auth/google');
  assert.equal(calls[0][1].method, 'POST');
  assert.deepEqual(JSON.parse(calls[0][1].body), { id_token: 'google-id-token' });
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

test('questionnaire persists health details and selected goals with authentication', async () => {
  const { api, calls } = client();
  const payload = { gender: 'female', dob: '2000-01-02', height_feet: 5, height_inches: 6, weight: 140, selectedVitals: ['SLEEP', 'WATER_INTAKE'], sleep_goal: 8, water_goal: 6 };
  await api.saveQuestionnaire(payload);
  assert.equal(calls[0][0], 'http://localhost:8000/auth/questionnare');
  assert.equal(calls[0][1].method, 'POST');
  assert.equal(calls[0][1].headers.Authorization, 'Bearer stored-token');
  assert.deepEqual(JSON.parse(calls[0][1].body), payload);
});

test('doctor search encodes supported filters and omits empty values', async () => {
  const { api, calls } = client();
  await api.searchDoctors({ city: ' Fort Worth ', state: 'TX', specialty: 'Endocrinology, Diabetes & Metabolism', gender: '' });
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, '/doctors/search');
  assert.equal(url.searchParams.get('city'), 'Fort Worth');
  assert.equal(url.searchParams.get('specialty'), 'Endocrinology, Diabetes & Metabolism');
  assert.equal(url.searchParams.has('gender'), false);
});

test('questionnaire validation errors identify the invalid field', async () => {
  const { api } = client('http://localhost:8000', { ok: false, status: 422, json: async () => ({ detail: [{ loc: ['body', 'dob'], msg: 'Invalid date' }] }) });
  await assert.rejects(api.saveQuestionnaire({}), /dob: Invalid date/);
});


test('missing configuration never reports saved measurements or generates a demo AI response', async () => {
  const { api, calls } = client('');
  await assert.rejects(api.submitBloodPressure(116, 75), /not configured/);
  await assert.rejects(api.chat('Explain my readings', []), /not configured/);
  assert.equal(calls.length, 0);
});
