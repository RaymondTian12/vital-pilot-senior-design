import {
  createContext,
  useContext,
  useEffect,
  useMemo,
  useSyncExternalStore,
  type ReactNode,
} from "react";
import { api } from "@/services/api";
import { createBloodPressureStore } from "@/services/blood-pressure";
const Context = createContext<ReturnType<
  typeof createBloodPressureStore
> | null>(null);
export function BloodPressureProvider({ children }: { children: ReactNode }) {
  const store = useMemo(() => createBloodPressureStore(api), []);
  useEffect(() => {
    store.activate();
    return () => store.dispose();
  }, [store]);
  return <Context.Provider value={store}>{children}</Context.Provider>;
}
export function useBloodPressure() {
  const store = useContext(Context);
  if (!store) throw new Error("Blood-pressure provider required.");
  const state = useSyncExternalStore(
    store.subscribe,
    store.getSnapshot,
    store.getSnapshot,
  );
  return {
    ...state,
    refresh: store.refresh,
    loadMore: store.loadMore,
    save: store.save,
    allowRetry: store.allowRetry,
  };
}
