import { createContext, useContext, useEffect, useMemo, useSyncExternalStore, type ReactNode } from "react";
import { createVitalStore, vitalFields } from "@/services/vital-readings";
import { api } from "@/services/api";
import type { OtherVitalType } from "@/types/vitalpilot";
const Context = createContext<Map<OtherVitalType, ReturnType<typeof createVitalStore>> | null>(null);
export function VitalReadingsProvider({ children }: { children: ReactNode }) {
  const stores = useMemo(() => new Map((Object.keys(vitalFields) as OtherVitalType[]).map((type) => [type, createVitalStore(type, api)])), []);
  useEffect(() => {
    stores.forEach((store) => store.activate());
    return () => stores.forEach((store) => store.dispose());
  }, [stores]);
  return <Context.Provider value={stores}>{children}</Context.Provider>;
}
export function useVitalReading(type: OtherVitalType) {
  const store = useContext(Context)?.get(type);
  if (!store) throw new Error("Vital readings provider required.");
  const state = useSyncExternalStore(store.subscribe, store.getSnapshot, store.getSnapshot);
  return { ...state, refresh: store.refresh, loadMore: store.loadMore, save: store.save, allowRetry: store.allowRetry };
}
