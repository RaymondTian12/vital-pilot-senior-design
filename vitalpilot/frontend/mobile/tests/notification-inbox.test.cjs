const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");
const jsx = (type, props) => ({ type, props });
function load(file, dependencies) {
  const exports = {};
  vm.runInNewContext(
    ts.transpileModule(
      fs.readFileSync(path.join(__dirname, "../src", file), "utf8"),
      {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2021,
          jsx: ts.JsxEmit.ReactJSX,
        },
      },
    ).outputText,
    {
      exports,
      setTimeout: () => 0,
      require: (name) => {
        if (!(name in dependencies))
          throw new Error(`Unexpected dependency: ${name}`);
        return dependencies[name];
      },
    },
  );
  return exports;
}
function reactState() {
  let cursor = 0;
  const slots = [];
  return {
    reset: () => {
      cursor = 0;
    },
    createContext: () => ({ Provider: "ContextProvider" }),
    useState: (initial) => {
      const index = cursor++;
      if (!(index in slots)) slots[index] = initial;
      return [
        slots[index],
        (next) => {
          slots[index] = typeof next === "function" ? next(slots[index]) : next;
        },
      ];
    },
    useRef: (initial) => {
      const index = cursor++;
      return (slots[index] ??= { current: initial });
    },
    useMemo: (fn) => fn(),
    useCallback: (fn, deps) => {
      const index = cursor++;
      if (
        !slots[index] ||
        deps.some((value, i) => value !== slots[index].deps[i])
      )
        slots[index] = { fn, deps };
      return slots[index].fn;
    },
  };
}
function providerHarness() {
  const react = reactState();
  const { NotificationProvider } = load("context/notification-context.tsx", {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "./notification-count": {
      NotificationCountContext: { Provider: "CountProvider" },
    },
    "@/services/summary-notifications": load(
      "services/summary-notifications.ts",
      {},
    ),
    "@/components/notifications/alert-banner": { AlertBanner: "AlertBanner" },
    "@/components/notifications/critical-alert-modal": {
      CriticalAlertModal: "CriticalAlertModal",
    },
  });
  return () => {
    react.reset();
    const tree = NotificationProvider({ children: null });
    return {
      value: tree.props.value,
      modal: tree.props.children.find(
        (node) => node.type === "CriticalAlertModal",
      ).props,
    };
  };
}
function summary(ids) {
  return {
    overall_result: {
      urgent_readings: [],
      warning_readings: ids.map((log_id) => ({
        log_id,
        metric_type: "BLOOD_OXYGEN",
        recorded_at: "2026-11-11T12:00:00Z",
        classification: "Review reading",
      })),
    },
  };
}

test("opening inbox clears all unread updates without deleting history or dismissing critical guidance", () => {
  const render = providerHarness();
  let { value } = render();
  value.addNotification({
    title: "Saved",
    message: "Saved reading",
    severity: "warning",
    category: "metric",
  });
  value.addNotification({
    title: "Critical",
    message: "Review urgent guidance",
    severity: "critical",
    category: "health-alert",
  });
  ({ value } = render());
  assert.equal(value.unreadCount, 2);
  const markAll = value.markAllAsRead;
  markAll();
  const next = render();
  assert.equal(next.value.unreadCount, 0);
  assert.equal(next.value.notifications.length, 2);
  assert.ok(next.value.notifications.every((item) => item.read));
  assert.equal(next.modal.visible, true);
  assert.equal(next.value.activeCriticalNotification.title, "Critical");
  assert.equal(next.value.markAllAsRead, markAll);
  markAll();
  assert.equal(render().value.notifications.length, 2);
});

test("inbox refresh is read, repeated summaries stay read, and arrivals after opening remain unread", () => {
  const render = providerHarness();
  let { value } = render();
  value.syncSummary(summary([1]));
  ({ value } = render());
  assert.equal(value.unreadCount, 1);
  value.markAllAsRead();
  // A separate source delivers a genuinely new alert while the inbox refresh is pending.
  value.syncSummary(summary([3]));
  value.syncSummary(summary([1, 2]), { markAsRead: true });
  ({ value } = render());
  assert.equal(value.unreadCount, 1);
  assert.equal(value.notifications.length, 3);
  assert.equal(value.notifications.find((n) => n.id.endsWith(":2")).read, true);
  assert.equal(
    value.notifications.find((n) => n.id.endsWith(":3")).read,
    false,
  );
  value.syncSummary(summary([1, 2]));
  assert.equal(render().value.unreadCount, 1);
  assert.equal(render().value.notifications.length, 3);
});

function screenHarness() {
  let focus, resolve;
  const events = [];
  const pending = new Promise((done) => {
    resolve = done;
  });
  const react = reactState();
  const { default: Notifications } = load("app/notifications.tsx", {
    react,
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    "react-native": { Text: "Text", View: "View" },
    "expo-router": {
      useRouter: () => ({ push: () => {} }),
      useFocusEffect: (callback) => {
        focus = callback;
      },
    },
    "@/services/api": { api: { dailySummary: () => pending } },
    "@/services/daily-summary": { summaryWindow: () => ({}) },
    "@/context/notification-context": {
      useNotifications: () => ({
        notifications: [],
        markAsRead: () => {},
        clearAllNotifications: () => {},
        markAllAsRead: () => events.push("read"),
        syncSummary: (data, options) => events.push({ data, options }),
      }),
    },
    "@/context/preview-context": {
      usePreview: () => ({ preview: false, setPreview: () => {} }),
    },
    "@/constants/vitalpilot": { VitalPilotColors: {} },
    "@/components/design/ui": Object.fromEntries(
      [
        "Button",
        "Card",
        "Chip",
        "Empty",
        "Heading",
        "Notice",
        "PreviewBadge",
        "Row",
        "Screen",
        "ui",
      ].map((name) => [name, name === "ui" ? {} : name]),
    ),
  });
  Notifications();
  return { focus: () => focus(), resolve, events };
}

test("notification screen marks existing updates immediately and newly fetched alerts as seen", async () => {
  const h = screenHarness();
  h.focus();
  assert.deepEqual(h.events, ["read"]);
  const data = summary([1]);
  h.resolve(data);
  await new Promise(setImmediate);
  assert.equal(h.events[1].data, data);
  assert.equal(h.events[1].options.markAsRead, true);
});

test("leaving notifications before refresh completes ignores late inbox results", async () => {
  const h = screenHarness();
  const leave = h.focus();
  leave();
  h.resolve(summary([1]));
  await new Promise(setImmediate);
  assert.deepEqual(h.events, ["read"]);
});
