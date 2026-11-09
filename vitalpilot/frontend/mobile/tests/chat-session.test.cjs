const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  vm = require("node:vm"),
  ts = require("typescript"),
  path = require("node:path");
const output = {};
vm.runInNewContext(
  ts.transpileModule(
    fs.readFileSync(
      path.join(__dirname, "../src/services/chat-session.ts"),
      "utf8",
    ),
    {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2020,
      },
    },
  ).outputText,
  { exports: output },
);
const { createChatSession } = output;
const deferred = () => {
  let resolve;
  const promise = new Promise((r) => {
    resolve = r;
  });
  return { promise, resolve };
};

test("double sends are blocked and retry preserves the unanswered message", async () => {
  const store = createChatSession(),
    pending = deferred();
  let calls = 0;
  store.draft("My question");
  const send = store.send(async () => {
    calls++;
    return pending.promise;
  });
  await store.send(async () => {
    calls++;
  });
  assert.equal(calls, 1);
  pending.resolve({ reply: "" });
  await send;
  assert.equal(store.getSnapshot().messages.length, 1);
  assert.ok(store.getSnapshot().error);
  await store.send(async (text, history) => {
    assert.equal(text, "My question");
    assert.equal(history.length, 0);
    return { reply: "A response" };
  }, true);
  assert.equal(store.getSnapshot().messages.length, 2);
  assert.equal(store.getSnapshot().messages[1].text, "A response");
});

test("reset/account boundary discards late replies and clears private context", async () => {
  const store = createChatSession(),
    pending = deferred();
  store.reset({ metric_types: ["SLEEP"] }, { metrics: [] });
  store.draft("First account");
  const send = store.send(() => pending.promise);
  store.reset();
  pending.resolve({ reply: "Private response", context: { metrics: [] } });
  await send;
  assert.equal(store.getSnapshot().messages.length, 0);
  assert.equal(store.getSnapshot().context, undefined);
  assert.equal(store.getSnapshot().busy, false);
});

test("history stays ordered and selection is attached on every turn", async () => {
  const store = createChatSession();
  const selection = { metric_types: ["SLEEP"] };
  store.reset(selection);
  store.draft("First");
  await store.send(async () => ({ reply: "Answer" }));
  store.draft("Second");
  await store.send(async (text, history, context) => {
    assert.equal(text, "Second");
    assert.equal(history.map((m) => m.role).join(","), "user,assistant");
    assert.equal(context, selection);
    return { reply: "Follow-up" };
  });
  assert.equal(store.getSnapshot().messages.length, 4);
});

test("history respects both message and character limits without changing stored conversation", () => {
  const messages = Array.from({ length: 12 }, (_, index) => ({
    id: String(index),
    role: index % 2 ? "assistant" : "user",
    text: "x".repeat(6000),
  }));
  const recent = output.chatHistory(messages);
  assert.equal(recent.length, 4);
  assert.equal(recent[0].id, "8");
  assert.equal(messages.length, 12);
});
