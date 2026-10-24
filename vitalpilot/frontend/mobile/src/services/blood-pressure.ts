import type {
  BloodPressurePage,
  BloodPressureReading,
} from "../types/vitalpilot";
type Client = {
  submitBloodPressure: (
    systolic: number,
    diastolic: number,
  ) => Promise<BloodPressureReading>;
  getBloodPressure: (offset?: number) => Promise<BloodPressurePage>;
};
export function pressureNumbers(primary: string, secondary: string) {
  const values = [primary, secondary].map((value) => {
    const text = value.trim();
    if (
      !/^\d+$/.test(text) ||
      !Number.isSafeInteger(Number(text)) ||
      Number(text) <= 0
    )
      throw new Error(
        "Enter both blood-pressure values as positive whole numbers.",
      );
    return Number(text);
  });
  return { systolic: values[0], diastolic: values[1] };
}
export function checkedReading(
  value: BloodPressureReading,
): BloodPressureReading {
  const componentValid = (component: unknown) =>
    component === null ||
    (typeof component === "object" &&
      component !== null &&
      ["classification", "alert_state", "alert_message"].every(
        (key) =>
          typeof (component as Record<string, unknown>)[key] === "string",
      ));
  const classification = value?.classification;
  if (
    !value ||
    !Number.isSafeInteger(value.log_id) ||
    value.metric_type !== "BLOOD_PRESSURE" ||
    !Number.isInteger(value.systolic_mmhg) ||
    !Number.isInteger(value.diastolic_mmhg) ||
    typeof value.recorded_at !== "string" ||
    !/(Z|[+-]\d{2}:\d{2})$/.test(value.recorded_at) ||
    !Number.isFinite(Date.parse(value.recorded_at)) ||
    !classification ||
    !["classified", "unclassified"].includes(classification.status) ||
    ![
      classification.systolic,
      classification.diastolic,
      classification.overall,
    ].every(componentValid) ||
    !Array.isArray(classification.unclassified_components) ||
    !classification.unclassified_components.every(
      (name) => typeof name === "string",
    )
  )
    throw new Error("The server returned an invalid blood-pressure reading.");
  return value;
}
export function classificationView(reading: BloodPressureReading) {
  const c = reading.classification;
  const complete =
    c.status === "classified" &&
    c.overall &&
    c.systolic &&
    c.diastolic &&
    c.unclassified_components?.length === 0;
  const components = [c.systolic, c.diastolic].filter(
    (value) => value !== null,
  );
  const alerts = complete ? [c.overall!] : components;
  return {
    title: complete ? c.overall!.classification : "Classification unavailable",
    tone: !complete
      ? "unknown"
      : c.overall!.alert_state.includes("CRITICAL")
        ? "critical"
        : c.overall!.alert_state.includes("WARNING")
          ? "warning"
          : c.overall!.alert_state.includes("SUCCESS")
            ? "normal"
            : "warning",
    messages: complete
      ? [c.overall!.alert_message]
      : (
          [
            ["Systolic", c.systolic],
            ["Diastolic", c.diastolic],
          ] as const
        )
          .filter(([, value]) => value !== null)
          .map(
            ([name, value]) =>
              `${name}: ${value!.classification}${value!.alert_state.includes("SUCCESS") ? "" : `. ${value!.alert_message}`}`,
          ),
    critical: alerts.some((value) => value?.alert_state.includes("CRITICAL")),
  };
}
export function createBloodPressureStore(client: Client) {
  return createReadingStore({
    getPage: (offset) => client.getBloodPressure(offset),
    submit: (numbers: { systolic: number; diastolic: number }) => client.submitBloodPressure(numbers.systolic, numbers.diastolic),
  }, checkedReading, pressureNumbers);
}
export function createReadingStore<R extends { log_id: number; recorded_at: string }, P>(
  client: { getPage: (offset: number) => Promise<{ count: number; records: R[] }>; submit: (input: P) => Promise<R> },
  check: (value: R) => R,
  parse: (primary: string, secondary: string, context?: Record<string, string>) => P,
) {
  let active = true,
    generation = 0,
    offset = 0;
  let state = {
    records: [] as BloodPressureReading[],
    records: [] as R[],
    loading: false,
    loaded: false,
    saving: false,
    more: false,
    error: "",
    saveError: "",
    uncertain: false,
    retryReady: false,
    authExpired: false,
  };
  const listeners = new Set<() => void>();
  const update = (patch: Partial<typeof state>) => {
    if (!active) return;
    state = { ...state, ...patch };
    listeners.forEach((fn) => fn());
  };
  const failure = (error: unknown) =>
    error instanceof Error ? error.message : "Please try again.";
  const expired = (error: unknown) =>
    (
      error as {
        status?: number;
      }
    )?.status === 401;
  const merge = (records: BloodPressureReading[]) =>
  const merge = (records: R[]) =>
    [
      ...new Map(records.map((record) => [record.log_id, record])).values(),
    ].sort(
      (a, b) =>
        Date.parse(b.recorded_at) - Date.parse(a.recorded_at) ||
        b.log_id - a.log_id,
    );
  const load = async (more = false) => {
    if (!active || state.saving || (more && (state.loading || !state.more)))
      return;
    const current = ++generation;
    const start = more ? offset : 0;
    update({ loading: true, error: "" });
    try {
      const page = await client.getBloodPressure(start);
      if (!active || current !== generation) return;
      if (!Array.isArray(page.records) || page.count !== page.records.length)
        throw new Error("Invalid history response.");
      const records = page.records.map(checkedReading);
      const page = await client.getPage(start);
      if (!active || current !== generation) return;
      if (!Array.isArray(page.records) || page.count !== page.records.length)
        throw new Error("Invalid history response.");
      const records = page.records.map(check);
      offset = start + records.length;
      update({
        records: merge(more ? [...state.records, ...records] : records),
        loaded: true,
        more: records.length === 20,
        retryReady: state.uncertain,
        authExpired: false,
      });
    } catch (error) {
      if (current === generation)
        update({
          error: expired(error)
            ? "Your session has expired. Sign in again."
            : failure(error),
          authExpired: expired(error),
        });
    } finally {
      if (current === generation) update({ loading: false });
    }
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    refresh: () => load(),
    loadMore: () => load(true),
    async save(primary: string, secondary: string, preview: boolean) {
    async save(primary: string, secondary: string, preview: boolean, context?: Record<string, string>) {
      if (!active || state.saving) return null;
      if (preview) {
        update({
          saveError: "Turn off Sample preview to save a real reading.",
        });
        return null;
      }
      let numbers;
      try {
        numbers = pressureNumbers(primary, secondary);
        numbers = parse(primary, secondary, context);
      } catch (error) {
        update({ saveError: failure(error) });
        return null;
      }
      if (state.uncertain) return null;
      ++generation;
      update({
        saving: true,
        loading: false,
        saveError: "",
        authExpired: false,
      });
      try {
        const raw = await client.submitBloodPressure(
          numbers.systolic,
          numbers.diastolic,
        );
        if (!active) return null;
        let reading;
        try {
          reading = checkedReading(raw);
        const raw = await client.submit(numbers);
        if (!active) return null;
        let reading;
        try {
          reading = check(raw);
        } catch {
          update({ uncertain: true, retryReady: false });
          throw new Error(
            "Save response was unreadable. Check your history before trying again.",
          );
        }
        update({
          records: merge([reading, ...state.records]),
          saving: false,
          loaded: true,
        });
        void load();
        return reading;
      } catch (error) {
        update({
          saveError: expired(error)
            ? "Your session has expired. Sign in again."
            : failure(error),
          retryReady: false,
          uncertain:
            state.uncertain ||
            Boolean(
              (
                error as {
                  uncertain?: boolean;
                }
              )?.uncertain,
            ),
          authExpired: expired(error),
        });
        return null;
      } finally {
        update({ saving: false });
      }
    },
    allowRetry: () => {
      if (state.retryReady)
        update({ uncertain: false, retryReady: false, saveError: "" });
    },
    dispose: () => {
      active = false;
      ++generation;
      listeners.clear();
    },
    activate: () => {
      active = true;
    },
  };
}
