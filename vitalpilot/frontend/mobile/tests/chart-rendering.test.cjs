const { test } = require("node:test");
const assert = require("node:assert/strict");
const fs = require("node:fs"),
  path = require("node:path"),
  vm = require("node:vm"),
  ts = require("typescript");
function load(
  file,
  requireModule = () => {
    throw new Error("Unexpected dependency");
  },
) {
  const exports = {};
  const source = fs.readFileSync(path.join(__dirname, "../src", file), "utf8");
  vm.runInNewContext(
    ts.transpileModule(source, {
      compilerOptions: {
        module: ts.ModuleKind.CommonJS,
        target: ts.ScriptTarget.ES2021,
        jsx: ts.JsxEmit.ReactJSX,
      },
    }).outputText,
    { exports, require: requireModule },
  );
  return exports;
}
const history = load("services/metric-history.ts");
const geometry = load("services/chart-layout.ts");
const colors = load("constants/vitalpilot.ts");
const jsx = (type, props) => ({ type, props });
function nodes(tree, type) {
  if (!tree || typeof tree !== "object") return [];
  if (Array.isArray(tree)) return tree.flatMap((child) => nodes(child, type));
  return [
    ...(tree.type === type ? [tree] : []),
    ...nodes(tree.props?.children, type),
  ];
}
function harness(nativeAvailable = true) {
  let cursor = 0,
    refCursor = 0;
  const values = [],
    refs = [],
    scrolls = [];
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx, Fragment: "Fragment" },
    react: {
      useState: (initial) => {
        const key = cursor++;
        if (!(key in values)) values[key] = initial;
        return [
          values[key],
          (next) => {
            values[key] = typeof next === "function" ? next(values[key]) : next;
          },
        ];
      },
      useRef: () => {
        const key = refCursor++;
        return (refs[key] ??= {
          current: { scrollTo: (options) => scrolls.push(options) },
        });
      },
      useEffect: () => {},
    },
    "react-native": {
      View: "View",
      Text: "Text",
      Platform: { OS: "ios" },
      TurboModuleRegistry: { get: () => (nativeAvailable ? {} : null) },
    },
    "@/services/chart-layout": geometry,
    "@/services/metric-history": history,
    "@/constants/vitalpilot": colors,
    "./motion": { useMotionPreference: () => false },
    "./ui": { Button: "Button", Chip: "Chip", ui: {} },
    "react-native-gifted-charts": {
      BarChart: "BarChart",
      LineChart: "LineChart",
    },
  };
  let loads = 0;
  const { MetricChart } = load("components/design/metric-chart.tsx", (name) => {
    if (name === "react-native-gifted-charts") loads++;
    if (!(name in dependencies)) throw new Error(`Unexpected ${name}`);
    return dependencies[name];
  });
  return {
    render: (props) => {
      cursor = 0;
      refCursor = 0;
      return MetricChart(props);
    },
    layout: (tree, width = 310) =>
      tree.props.onLayout({ nativeEvent: { layout: { width } } }),
    scrolls,
    loads: () => loads,
  };
}
function fixture(type, field, count, value, habit) {
  const daily = Array.from({ length: count }, (_, index) => ({
    date: `2026-11-${String(index + 1).padStart(2, "0")}`,
    count: index === count - 1 ? 1 : 0,
    contexts: {},
    values:
      index === count - 1
        ? {
            [field]: { avg: value, min: value, max: value },
            ...(type === "BLOOD_PRESSURE"
              ? { diastolic_mmhg: { avg: 76, min: 76, max: 76 } }
              : {}),
          }
        : {},
  }));
  return {
    data: {
      metric_type: type,
      start_at: "start",
      end_at: `end-${count}`,
      daily,
    },
    field,
    unit: "test units",
    habit,
  };
}

test("final-day-only values render across all eight metrics and all periods", () => {
  const fields = {
    BLOOD_PRESSURE: "systolic_mmhg",
    BLOOD_GLUCOSE: "glucose_mgdl",
    BLOOD_OXYGEN: "spo2_percentage",
    BODY_MASS_INDEX: "weight_lbs",
    PEAK_FLOW_RATE: "flow_rate_lmin",
    SLEEP: "duration_hours",
    WATER_INTAKE: "amount_cups",
    PHYSICAL_ACTIVITY: "steps_taken",
  };
  for (const [kind, field] of Object.entries(fields))
    for (const days of [7, 30, 90]) {
      const habit = ["SLEEP", "WATER_INTAKE", "PHYSICAL_ACTIVITY"].includes(
        kind,
      );
      const props = fixture(kind, field, days, 8, habit),
        h = harness();
      h.layout(h.render(props));
      const tree = h.render(props),
        chart = nodes(tree, habit ? "BarChart" : "LineChart")[0];
      assert.ok(chart, `${kind}/${days}`);
      assert.equal(chart.props.data[days - 1].value, 8);
      assert.equal(
        chart.props.scrollToIndex,
        days === 7 ? undefined : days - 1,
      );
      if (habit) assert.equal(chart.props.isAnimated, false);
      const inspect = nodes(tree, "Button").find(
        (button) => button.props.children === "Inspect latest day",
      );
      assert.equal(inspect.props.disabled, false);
      inspect.props.onPress();
      assert.ok(h.scrolls.length);
    }
});

test("seven-day geometry fits the final bar/point inside measured phone cards", () => {
  for (const width of [240, 310, 354, 564])
    for (const habit of [true, false]) {
      const layout = geometry.chartLayout(width, 7, habit);
      const finalRight =
        layout.initialSpacing + 6 * layout.step + layout.barWidth;
      assert.ok(
        finalRight <= layout.width,
        `${width}/${habit}: final day clipped`,
      );
      assert.ok(layout.width + layout.axisWidth <= width);
    }
});

test("recorded zero stays visible, gaps stay transparent, empty selection disables inspect", () => {
  const props = fixture("SLEEP", "duration_hours", 7, 0, true),
    h = harness();
  h.layout(h.render(props));
  let tree = h.render(props),
    chart = nodes(tree, "BarChart")[0];
  assert.equal(chart.props.minHeight, 2);
  assert.equal(chart.props.data[0].frontColor, "transparent");
  assert.notEqual(chart.props.data[6].frontColor, "transparent");
  const empty = {
    ...props,
    data: {
      ...props.data,
      daily: props.data.daily.map((day) => ({ ...day, count: 0, values: {} })),
    },
  };
  tree = h.render(empty);
  assert.equal(nodes(tree, "BarChart").length, 0);
  assert.equal(
    nodes(tree, "Button").find(
      (button) => button.props.children === "Inspect latest day",
    ).props.disabled,
    true,
  );
});

test("missing native SVG support skips chart loading and preserves fallback", () => {
  const props = fixture("SLEEP", "duration_hours", 7, 8, true),
    h = harness(false);
  h.layout(h.render(props));
  const tree = h.render(props);
  assert.equal(nodes(tree, "BarChart").length, 0);
  assert.equal(h.loads(), 0);
  assert.ok(
    nodes(tree, "Text").some((node) =>
      String(node.props.children).includes("Rebuild the development app"),
    ),
  );
});

test("period changes clear selected-day details and BP retains a second series", () => {
  const h = harness(),
    props = fixture("BLOOD_PRESSURE", "systolic_mmhg", 30, 118, false);
  h.layout(h.render(props));
  let tree = h.render(props);
  assert.equal(nodes(tree, "LineChart")[0].props.data2[29].value, 76);
  nodes(tree, "Button")
    .find((button) => button.props.children === "Inspect latest day")
    .props.onPress();
  assert.equal(
    nodes(h.render(props), "View").filter(
      (node) => node.props.accessibilityLiveRegion === "polite",
    ).length,
    1,
  );
  tree = h.render(fixture("BLOOD_PRESSURE", "systolic_mmhg", 7, 118, false));
  assert.equal(
    nodes(tree, "View").filter(
      (node) => node.props.accessibilityLiveRegion === "polite",
    ).length,
    0,
  );
});

test("BP legend swatches use the exact colors of the plotted series", () => {
  const props = fixture("BLOOD_PRESSURE", "systolic_mmhg", 7, 118, false),
    h = harness();
  h.layout(h.render(props));
  const tree = h.render(props),
    chart = nodes(tree, "LineChart")[0];
  const swatches = nodes(tree, "View")
    .filter((node) => node.props.style?.width === 10)
    .map((node) => node.props.style.backgroundColor);
  assert.deepEqual(swatches, [chart.props.color, chart.props.color2]);
  assert.notEqual(swatches[0], swatches[1]);
});

test("portrait failures show initials and legacy clinic photos never become headshots", () => {
  let cursor = 0;
  const values = [];
  const dependencies = {
    "react/jsx-runtime": { jsx, jsxs: jsx },
    react: {
      useState: (initial) => {
        const key = cursor++;
        if (!(key in values)) values[key] = initial;
        return [
          values[key],
          (next) => {
            values[key] = next;
          },
        ];
      },
    },
    "react-native": {
      View: "View",
      Text: "Text",
      Pressable: "Pressable",
      Linking: { openURL: async () => {} },
    },
    "expo-image": { Image: "Image" },
    "@/constants/vitalpilot": colors,
    "./ui": { ui: {} },
    "./icon": { Icon: "Icon" },
  };
  const { ProviderPortrait } = load(
    "components/design/provider-portrait.tsx",
    (name) => dependencies[name],
  );
  const doctor = {
    npi: "1669777850",
    first_name: "Maria Renela",
    last_name: "Suller",
    portrait_url: "https://official.example/portrait.jpg",
    portrait_source_url: "https://official.example/provider",
    portrait_attribution: "Official hospital",
    matched_specialty: "Endocrinology",
    matched_specialty_is_primary: false,
  };
  const render = (data) => {
    cursor = 0;
    return ProviderPortrait({ doctor: data });
  };
  let tree = render(doctor);
  assert.equal(nodes(tree, "Image").length, 1);
  assert.equal(nodes(tree, "Pressable")[0].props.accessibilityRole, "link");
  nodes(tree, "Image")[0].props.onError();
  tree = render(doctor);
  assert.equal(nodes(tree, "Image").length, 0);
  assert.ok(nodes(tree, "Text").some((node) => node.props.children === "MS"));
  tree = render({
    ...doctor,
    portrait_url: undefined,
    photo_url: "https://random.example/clinic.jpg",
  });
  assert.equal(nodes(tree, "Image").length, 0);
});
