import { useCallback, useEffect, useState } from "react";
import { useLocalSearchParams } from "expo-router";
import { api, ApiError, type ReportPreviewData } from "@/services/api";
import { Button, Heading, Notice, Screen } from "@/components/design/ui";
import { ReportPreviewBody } from "@/components/design/report-preview-body";

export default function DoctorReportPreview() {
  const params = useLocalSearchParams<{ id: string; reportId: string }>();
  const patientId = Number(params.id);
  const reportId = Number(params.reportId);

  const [data, setData] = useState<ReportPreviewData | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);

  const load = useCallback(async () => {
    if (!Number.isSafeInteger(patientId) || patientId <= 0 || !Number.isSafeInteger(reportId) || reportId <= 0) {
      setError("This report link isn't valid.");
      setLoading(false);
      return;
    }
    setLoading(true);
    setError(null);
    try {
      setData(await api.doctorPatientReportPreview(patientId, reportId));
    } catch (e: unknown) {
      setData(null);
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Failed to load this report.",
      );
    } finally {
      setLoading(false);
    }
  }, [patientId, reportId]);

  useEffect(() => {
    void load();
  }, [load]);

  if (loading) {
    return (
      <Screen back brand={false}>
        <Heading title="Patient health report" subtitle="Loading report…" />
      </Screen>
    );
  }

  if (error || !data) {
    return (
      <Screen back brand={false}>
        <Heading title="Patient health report" />
        <Notice error>{error ?? "This report could not be loaded."}</Notice>
        <Button secondary onPress={() => void load()}>Try again</Button>
      </Screen>
    );
  }

  return (
    <Screen back brand={false}>
      <Heading
        title={`${data.period_label} health report`}
        subtitle={`${data.start_date} to ${data.end_date}`}
      />

      <ReportPreviewBody data={data} />

      <Notice>
        The History of Present Illness and Summary above were drafted by an AI model from this
        patient's logged data. They are not written or reviewed by a clinician. This report is
        not a medical diagnosis.
      </Notice>
    </Screen>
  );
}
