const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const vm = require("node:vm");
const ts = require("typescript");

function client(
  baseUrl = "http://localhost:8000/",
  response = { ok: true, json: async () => ({ access_token: "test-token" }) },
) {
  const calls = [];
  const exports = {};
  const source = fs.readFileSync(
    require("node:path").join(__dirname, "../src/services/api.ts"),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: () => ({
        chatHistory: (messages) => messages.slice(-10),
        session: { get: async () => "stored-token" },
      }),
      process: { env: { EXPO_PUBLIC_API_BASE_URL: baseUrl } },
      URLSearchParams,
      AbortController,
      setTimeout,
      clearTimeout,
      fetch: async (...args) => {
        calls.push(args);
        return response;
      },
    },
  );
  return { api: exports.api, calls };
}

test("login sends JSON credentials without exposing them in the URL", async () => {
  const { api, calls } = client();
  const result = await api.signIn("test+mobile@example.com", "a&b? #");
  const [url, options] = calls[0];
  assert.equal(new URL(url).pathname, "/auth/login");
  assert.equal(new URL(url).search, "");
  assert.deepEqual(JSON.parse(options.body), {
    email: "test+mobile@example.com",
    password: "a&b? #",
  });
  assert.equal(options.headers["Content-Type"], "application/json");
  assert.equal(options.method, "POST");
  assert.equal(options.credentials, "omit");
  assert.equal(result.access_token, "test-token");
});

test("registration includes both names required by the backend", async () => {
  const { api, calls } = client();
  await api.signUp("Test", "Mobile", "test@example.com", "test-password");
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, "/auth/register");
  assert.equal(url.search, "");
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    firstname: "Test",
    lastname: "Mobile",
    email: "test@example.com",
    password: "test-password",
  });
});

test("Google sign-in exchanges the ID token in a POST body without putting it in the URL", async () => {
  const { api, calls } = client();
  await api.signInWithGoogle("google-id-token");
  assert.equal(calls[0][0], "http://localhost:8000/auth/google");
  assert.equal(calls[0][1].method, "POST");
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    id_token: "google-id-token",
  });
});

test("profile request sends a bearer token and logout uses POST", async () => {
  const { api, calls } = client();
  await api.me();
  await api.logout();
  assert.equal(calls[0][0], "http://localhost:8000/auth/me");
  assert.equal(calls[0][1].headers.Authorization, "Bearer stored-token");
  assert.equal(calls[1][1].method, "POST");
});

test("missing configuration does not simulate successful authentication", async () => {
  const { api, calls } = client("");
  await assert.rejects(
    api.signIn("test@example.com", "test"),
    /not configured/,
  );
  await assert.rejects(
    api.signUp("Test", "User", "test@example.com", "test"),
    /not configured/,
  );
  assert.equal(calls.length, 0);
});

test("server authentication errors reach the screen", async () => {
  const { api } = client("http://localhost:8000", {
    ok: false,
    status: 401,
    json: async () => ({ detail: "Invalid email or password" }),
  });
  await assert.rejects(
    api.signIn("test@example.com", "wrong"),
    /Invalid email or password/,
  );
});

test("questionnaire persists health details and selected goals with authentication", async () => {
  const { api, calls } = client();
  const payload = {
    gender: "female",
    dob: "2000-01-02",
    height_feet: 5,
    height_inches: 6,
    weight: 140,
    selectedVitals: ["SLEEP", "WATER_INTAKE"],
    sleep_goal: 8,
    water_goal: 6,
  };
  await api.saveQuestionnaire(payload);
  assert.equal(calls[0][0], "http://localhost:8000/auth/questionnare");
  assert.equal(calls[0][1].method, "POST");
  assert.equal(calls[0][1].headers.Authorization, "Bearer stored-token");
  assert.deepEqual(JSON.parse(calls[0][1].body), payload);
});

test("doctor search encodes supported filters and omits empty values", async () => {
  const { api, calls } = client();
  await api.searchDoctors({
    city: " Fort Worth ",
    state: "TX",
    specialty: "Endocrinology, Diabetes & Metabolism",
    gender: "",
  });
  const url = new URL(calls[0][0]);
  assert.equal(url.pathname, "/doctors/search");
  assert.equal(url.searchParams.get("city"), "Fort Worth");
  assert.equal(
    url.searchParams.get("specialty"),
    "Endocrinology, Diabetes & Metabolism",
  );
  assert.equal(url.searchParams.has("gender"), false);
});

test("questionnaire validation errors identify the invalid field", async () => {
  const { api } = client("http://localhost:8000", {
    ok: false,
    status: 422,
    json: async () => ({
      detail: [{ loc: ["body", "dob"], msg: "Invalid date" }],
    }),
  });
  await assert.rejects(api.saveQuestionnaire({}), /dob: Invalid date/);
});

test("missing configuration never reports saved measurements or generates a demo AI response", async () => {
  const { api, calls } = client("");
  await assert.rejects(api.submitBloodPressure(116, 75), /not configured/);
  await assert.rejects(api.chat("Explain my readings", []), /not configured/);
  assert.equal(calls.length, 0);
});

test("doctor search preserves numeric coordinates including zero", async () => {
  const { api, calls } = client();
  await api.searchDoctors({
    city: "Test",
    state: "TX",
    latitude: 0,
    longitude: -97.1,
  });
  const query = new URL(calls[0][0]).searchParams;
  assert.equal(query.get("latitude"), "0");
  assert.equal(query.get("longitude"), "-97.1");
});

test("chat maps UI messages to the Gemini endpoint contract and preserves reply", async () => {
  const { api, calls } = client("http://localhost:8000", {
    ok: true,
    json: async () => ({ reply: "A reply" }),
  });
  const result = await api.chat("Follow-up", [
    { id: "1", role: "user", text: "Earlier question" },
  ]);
  assert.equal(result.reply, "A reply");
  assert.equal(calls[0][1].headers.Authorization, "Bearer stored-token");
  assert.deepEqual(JSON.parse(calls[0][1].body), {
    message: "Follow-up",
    history: [{ role: "user", content: "Earlier question" }],
  });
});

test("context preview is separate from generation and chat includes explicit consent", async () => {
  const { api, calls } = client();
  const context = {
    metric_types: ["SLEEP"],
    start_at: "start",
    end_at: "end",
    timezone_name: "UTC",
  };
  await api.chatContext(context);
  assert.equal(calls[0][0], "http://localhost:8000/chat/context");
  assert.deepEqual(JSON.parse(calls[0][1].body), context);
  await api.chat("Explain", [], context);
  assert.equal(JSON.parse(calls[1][1].body).context_consent, true);
});

test("chat timeout stays bounded and returns an actionable retry message", async () => {
  const exports = {};
  let timeoutMs;
  const source = fs.readFileSync(
    require("node:path").join(__dirname, "../src/services/api.ts"),
    "utf8",
  );
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: { module: ts.ModuleKind.CommonJS },
    }).outputText,
    {
      exports,
      require: () => ({
        chatHistory: (messages) => messages,
        session: { get: async () => "token", version: () => 0 },
      }),
      process: { env: { EXPO_PUBLIC_API_BASE_URL: "http://test" } },
      URLSearchParams,
      AbortController,
      setTimeout: (callback, ms) => {
        timeoutMs = ms;
        callback();
        return 1;
      },
      clearTimeout: () => {},
      fetch: async (_, options) => {
        assert.equal(options.signal.aborted, true);
        throw new Error("AbortError");
      },
    },
  );
  await assert.rejects(
    exports.api.chat("Question", []),
    /took too long.*retry/,
  );
  assert.equal(timeoutMs, 40000);
});
