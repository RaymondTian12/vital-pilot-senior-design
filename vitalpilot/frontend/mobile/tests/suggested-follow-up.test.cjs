const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs");
const path = require("node:path");
const vm = require("node:vm");
const ts = require("typescript");

const jsx = (type, props) => ({ type, props });
function harness() {
  const events = [];
  const modules = {};
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    react: {
      useState: (initial) => [initial, () => {}],
      useCallback: (fn) => fn,
    },
    "react-native": {
      Text: "Text",
      View: "View",
      Linking: { openURL: async () => {} },
    },
    "expo-router": {
      useRouter: () => ({ push: (route) => events.push(route) }),
      useFocusEffect: () => {},
    },
    "./ui": { Button: "Button", Card: "Card", ui: {} },
    "./assessment-status": { AssessmentStatus: "AssessmentStatus" },
    "./history-reading": { HistoryReading: "HistoryReading" },
    "./charts": { Sparkline: "Sparkline" },
    "@/constants/vitalpilot": { VitalPilotColors: {} },
    "@/context/auth-context": { useAuth: () => ({}) },
    "@/context/blood-pressure-context": { useBloodPressure: () => ({}) },
  };
  function load(name) {
    if (modules[name]) return modules[name];
    const file =
      name === "@/services/blood-pressure"
        ? "services/blood-pressure.ts"
        : `components/design/${name.slice(2)}.tsx`;
    const exports = {};
    const source = fs.readFileSync(
      path.join(__dirname, "../src", file),
      "utf8",
    );
    vm.runInNewContext(
      ts.transpileModule(source, {
        compilerOptions: {
          module: ts.ModuleKind.CommonJS,
          target: ts.ScriptTarget.ES2021,
          jsx: ts.JsxEmit.ReactJSX,
        },
      }).outputText,
      {
        exports,
        require: (dependency) => dependencies[dependency] ?? load(dependency),
      },
    );
    modules[name] = exports;
    return exports;
  }
  function render(node) {
    if (!node || typeof node !== "object") return node;
    if (Array.isArray(node)) return node.map(render);
    if (typeof node.type === "function") return render(node.type(node.props));
    return {
      ...node,
      props: { ...node.props, children: render(node.props?.children) },
    };
  }
  function nodes(tree, type) {
    if (!tree || typeof tree !== "object") return [];
    if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
    return [
      ...(tree.type === type ? [tree] : []),
      ...nodes(tree.props?.children, type),
    ];
  }
  return { events, load, render, nodes };
}
const followUp = (status = "review") => ({
  status,
  explanation:
    status === "urgent"
      ? "Do not wait for a routine appointment."
      : "Discuss this reading with primary care.",
  primary_specialty_group: "primary_care",
  alternative_specialty_groups: ["pulmonology"],
});

test("primary care precedes alternatives and navigation carries backend groups and explanation", () => {
  const h = harness();
  const tree = h.render(
    jsx(h.load("./suggested-follow-up").SuggestedFollowUpCard, {
      followUp: followUp(),
      beforeNavigate: () => h.events.push("close-sheet"),
    }),
  );
  const buttons = h.nodes(tree, "Button");
  assert.deepEqual(
    buttons.map((button) => button.props.children),
    ["Find primary care", "Find a pulmonologist"],
  );
  for (const [index, group] of ["primary_care", "pulmonology"].entries()) {
    buttons[index].props.onPress();
    assert.equal(h.events[index * 2], "close-sheet");
    const route = h.events[index * 2 + 1];
    assert.equal(route.pathname, "/doctors");
    assert.equal(route.params.specialty_group, group);
    assert.equal(route.params.follow_up_explanation, followUp().explanation);
  }
});

test("old responses omit the card and incomplete assessments have explanation without directory actions", () => {
  const h = harness();
  const Card = h.load("./suggested-follow-up").SuggestedFollowUpCard;
  assert.equal(h.render(jsx(Card, {})), null);
  const tree = h.render(
    jsx(Card, {
      followUp: {
        status: "needs_context",
        explanation: "Missing fasting context",
        primary_specialty_group: null,
        alternative_specialty_groups: [],
      },
    }),
  );
  assert.equal(h.nodes(tree, "Button").length, 0);
  assert.ok(
    h
      .nodes(tree, "Text")
      .some((node) => node.props.children === "Missing fasting context"),
  );
});

test("urgent guidance precedes directory actions and older history retains text without actions", () => {
  const h = harness();
  const Guidance = h.load("./metric-guidance").MetricGuidance;
  const props = {
    assessment: {
      status: "classified",
      category: "health",
      next_action: "urgent",
      alert_state: "LOG_CRITICAL_AND_BANNER",
      classification: "Needs prompt attention",
      guidance: "Existing assessment guidance",
    },
    followUp: followUp("urgent"),
  };
  const tree = h.render(jsx(Guidance, props));
  assert.equal(h.nodes(tree, "Button")[0].props.children, "Call 911 (U.S.)");
  const history = h.render(jsx(Guidance, { ...props, showActions: false }));
  assert.equal(h.nodes(history, "Button").length, 0);
  assert.ok(
    h
      .nodes(history, "Text")
      .some((node) => node.props.children === props.assessment.guidance),
  );
  const old = h.render(jsx(Guidance, { assessment: props.assessment }));
  assert.equal(h.nodes(old, "Button").length, 1);
});

test("partial critical BP keeps urgent guidance ahead of backend follow-up", () => {
  const h = harness();
  const reading = {
    log_id: 1,
    metric_type: "BLOOD_PRESSURE",
    recorded_at: "2026-11-10T12:00:00Z",
    systolic_mmhg: 190,
    diastolic_mmhg: 80,
    classification: {
      status: "unclassified",
      overall: null,
      systolic: {
        classification: "Critical",
        alert_state: "LOG_CRITICAL_AND_BANNER",
        alert_message: "Existing critical guidance",
      },
      diastolic: null,
      unclassified_components: ["diastolic"],
    },
    suggested_follow_up: {
      ...followUp("urgent"),
      alternative_specialty_groups: ["cardiology"],
    },
  };
  const Result = h.load("./blood-pressure-panel").ReadingResult;
  const tree = h.render(jsx(Result, { reading, showCare: true }));
  assert.deepEqual(
    h.nodes(tree, "Button").map((node) => node.props.children),
    ["Call 911 (U.S.)", "Find primary care", "Find a cardiologist"],
  );
  assert.equal(
    h.nodes(h.render(jsx(Result, { reading, showCare: false })), "Button")
      .length,
    0,
  );
});

test("missing habit goals and peak personal best open settings without doctor recommendations", () => {
  for (const metricType of [
    "SLEEP",
    "WATER_INTAKE",
    "PHYSICAL_ACTIVITY",
    "PEAK_FLOW_RATE",
  ]) {
    const h = harness();
    const assessment = {
      status: "needs_context",
      category: metricType === "PEAK_FLOW_RATE" ? "health" : "goal",
      next_action: "add_context",
      alert_state: "NEEDS_CONTEXT",
      guidance: "Original missing-context explanation",
    };
    const followUp =
      metricType === "PEAK_FLOW_RATE"
        ? {
            status: "needs_context",
            explanation: assessment.guidance,
            primary_specialty_group: null,
            alternative_specialty_groups: [],
          }
        : null;
    const tree = h.render(
      jsx(h.load("./metric-guidance").MetricGuidance, {
        metricType,
        assessment,
        followUp,
        onFindCare: () => h.events.push("close-sheet"),
      }),
    );
    const text = h.nodes(tree, "Text").map((node) => node.props.children);
    assert.equal(
      text.filter((value) => value === assessment.guidance).length,
      1,
    );
    assert.ok(text.includes("Next step"));
    assert.ok(!text.includes("Suggested follow-up"));
    const buttons = h.nodes(tree, "Button");
    assert.equal(buttons.length, 1);
    assert.equal(
      buttons[0].props.children,
      metricType === "PEAK_FLOW_RATE"
        ? "Set peak-flow personal best"
        : "Set personal goal",
    );
    buttons[0].props.onPress();
    assert.deepEqual(h.events, ["close-sheet", "/goals"]);
    const older = h.render(
      jsx(h.load("./metric-guidance").MetricGuidance, {
        metricType,
        assessment,
        followUp,
        showActions: false,
      }),
    );
    assert.equal(h.nodes(older, "Button").length, 0);
  }
});

test("unknown glucose context appears once and directs to context entry without assuming fasting", () => {
  const h = harness();
  const props = {
    metricType: "BLOOD_GLUCOSE",
    assessment: {
      status: "needs_context",
      category: "health",
      next_action: "add_context",
      guidance: "Fasting context is not confirmed",
    },
    followUp: {
      status: "needs_context",
      explanation: "Fasting context is not confirmed",
      primary_specialty_group: null,
      alternative_specialty_groups: [],
    },
  };
  const Guidance = h.load("./metric-guidance").MetricGuidance;
  const tree = h.render(jsx(Guidance, props));
  assert.equal(
    h
      .nodes(tree, "Text")
      .filter((node) => node.props.children === props.assessment.guidance)
      .length,
    1,
  );
  const buttons = h.nodes(tree, "Button");
  assert.equal(buttons.length, 1);
  assert.equal(buttons[0].props.children, "Enter a reading with context");
  buttons[0].props.onPress();
  assert.equal(h.events[0].pathname, "/metrics");
  assert.equal(h.events[0].params.metric, "Blood Glucose");
  let scrolled = false;
  const sheet = h.render(
    jsx(Guidance, {
      ...props,
      onCompleteContext: () => {
        scrolled = true;
      },
    }),
  );
  h.nodes(sheet, "Button")[0].props.onPress();
  assert.equal(scrolled, true);
  assert.equal(h.events.length, 1);
});
