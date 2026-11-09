import { useCallback, useRef, useState } from "react";
import { useFocusEffect } from "expo-router";
import { api } from "@/services/api";
import {
  historyWindow,
  type HistoryPeriod,
  type MetricHistoryData,
} from "@/services/metric-history";
import type { VitalType } from "@/types/vitalpilot";
export function useMetricHistory(metric: VitalType, days: HistoryPeriod) {
  const key = `${metric}:${days}`;
  const [result, setResult] = useState<{
    key: string;
    value: MetricHistoryData;
  } | null>(null);
  const [loading, setLoading] = useState(true),
    [loadingMore, setLoadingMore] = useState(false);
  const [error, setError] = useState("");
  const [retry, setRetry] = useState(0);
  // Each focus/filter change invalidates older responses, including pending pages.
  const generation = useRef(0),
    nextOffset = useRef(0),
    loadingRef = useRef(false);
  useFocusEffect(
    useCallback(() => {
      const id = ++generation.current;
      setLoading(true);
      setError("");
      setResult(null);
      setLoadingMore(false);
      loadingRef.current = false;
      api
        .metricHistory(metric, historyWindow(days))
        .then((value) => {
          if (generation.current === id) {
            setResult({ key, value });
            nextOffset.current = value.records.length;
          }
        })
        .catch((cause) => {
          if (generation.current === id)
            setError(
              cause instanceof Error
                ? cause.message
                : "Couldn’t load readings.",
            );
        })
        .finally(() => {
          if (generation.current === id) setLoading(false);
        });
      return () => {
        generation.current++;
      };
    }, [metric, days, key, retry]),
  );
  const data = result?.key === key ? result.value : null;
  async function loadMore() {
    if (!data || !data.more || loadingRef.current) return;
    const id = generation.current;
    loadingRef.current = true;
    setLoadingMore(true);
    setError("");
    try {
      // Reuse the original date window so paging does not move the chart period.
      const page = await api.metricHistory(metric, data, nextOffset.current);
      if (id !== generation.current) return;
      // Advance by server rows, not deduplicated rows, to preserve the API offset.
      nextOffset.current += page.records.length;
      setResult((current) =>
        current?.key === key
          ? {
              key,
              value: {
                ...current.value,
                more: page.more,
                records: [
                  ...new Map(
                    [...current.value.records, ...page.records].map(
                      (record) => [record.log_id, record],
                    ),
                  ).values(),
                ],
              },
            }
          : current,
      );
    } catch (cause) {
      if (id === generation.current)
        setError(
          cause instanceof Error
            ? cause.message
            : "Couldn’t load more readings.",
        );
    } finally {
      if (id === generation.current) {
        loadingRef.current = false;
        setLoadingMore(false);
      }
    }
  }
  return {
    data,
    loading,
    loadingMore,
    error,
    refresh: () => setRetry((value) => value + 1),
    loadMore,
  };
}
