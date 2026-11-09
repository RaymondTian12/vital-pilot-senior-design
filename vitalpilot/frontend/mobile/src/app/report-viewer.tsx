import { useCallback, useState } from "react";
import { ActivityIndicator, Text, View } from "react-native";
import { useFocusEffect, useLocalSearchParams, useRouter } from "expo-router";
import {
  prepareReport,
  shareReport,
  type PreparedReport,
} from "@/services/report-files";
import { PdfDocument } from "@/components/design/pdf-document";
import { Button, Screen, ui } from "@/components/design/ui";
import { VitalPilotColors as C } from "@/constants/vitalpilot";
export default function ReportViewer() {
  const { id } = useLocalSearchParams<{ id?: string }>();
  const reportId = Number(id),
    valid = Number.isSafeInteger(reportId) && reportId > 0;
  const [uri, setUri] = useState<string | null>(null),
    [error, setError] = useState("");
  const [loading, setLoading] = useState(true),
    [sharing, setSharing] = useState(false),
    [retry, setRetry] = useState(0);
  const [page, setPage] = useState({ current: 0, total: 0 });
  const router = useRouter();
  useFocusEffect(
    useCallback(() => {
      // A late download must be disposed rather than displayed after navigation.
      let active = true,
        file: PreparedReport | undefined;
      setUri(null);
      setError("");
      setLoading(true);
      setPage({ current: 0, total: 0 });
      if (!valid) {
        setError("This report ID is invalid.");
        setLoading(false);
        return;
      }
      prepareReport(reportId)
        .then((result) => {
          if (!active) {
            void result.dispose();
            return;
          }
          file = result;
          setUri(result.uri);
        })
        .catch((cause) => {
          if (active)
            setError(
              cause instanceof Error
                ? cause.message
                : "Couldn’t open the report.",
            );
        })
        .finally(() => {
          if (active) setLoading(false);
        });
      return () => {
        active = false;
        setUri(null);
        // The viewer owns this temporary file/Blob for its focused lifetime only.
        if (file) void file.dispose();
      };
    }, [reportId, valid, retry]),
  );
  async function download() {
    setSharing(true);
    try {
      await shareReport(reportId);
    } catch (cause) {
      setError(cause instanceof Error ? cause.message : "Download failed.");
    } finally {
      setSharing(false);
    }
  }
  return (
    <Screen scroll={false} brand={false}>
      <View style={{ flex: 1, padding: 16, gap: 12 }}>
        <View style={[ui.row, { justifyContent: "space-between" }]}>
          <Button
            secondary
            onPress={() =>
              router.canGoBack() ? router.back() : router.replace("/reports")
            }
          >
            Back
          </Button>
          <Text accessibilityRole="header" style={ui.heading}>
            Report #{valid ? reportId : "—"}
          </Text>
        </View>
        <View
          style={[
            ui.row,
            { justifyContent: "space-between", flexWrap: "wrap" },
          ]}
        >
          <Text style={ui.small}>
            {page.total
              ? `Page ${page.current} of ${page.total}`
              : "Private PDF preview"}
          </Text>
          <Button
            secondary
            disabled={!valid || sharing}
            onPress={() => void download()}
          >
            {sharing ? "Preparing…" : "Download PDF"}
          </Button>
        </View>
        {loading && (
          <ActivityIndicator
            color={C.primary}
            accessibilityLabel="Opening PDF report"
          />
        )}
        {!!error && (
          <View style={{ gap: 8 }}>
            <Text accessibilityRole="alert" style={{ color: C.danger }}>
              {error}
            </Text>
            <Button secondary onPress={() => setRetry((value) => value + 1)}>
              Retry viewing
            </Button>
          </View>
        )}
        {uri && (
          <PdfDocument
            key={`${uri}:${retry}`}
            uri={uri}
            onPage={(current, total) => setPage({ current, total })}
            onError={() => {
              setUri(null);
              setError(
                "Couldn’t display this PDF. Try downloading it, or rebuild the development app if needed.",
              );
            }}
          />
        )}
      </View>
    </Screen>
  );
}
