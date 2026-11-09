import { useEffect, useRef, useState, useSyncExternalStore } from "react";
import {
  Alert,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from "react-native";
import { api } from "@/services/api";
import { chatSession } from "@/services/chat-session";
import { useAuth } from "@/context/auth-context";
import { Button, Card, Screen, ui } from "@/components/design/ui";
import {
  ChatReadings,
  ChatReadingSummary,
  metricName,
} from "@/components/design/chat-readings";
import { useMotionPreference } from "@/components/design/motion";
import { VitalPilotColors as C } from "@/constants/vitalpilot";

const suggestions = [
  [
    "Understand a measurement",
    "Can you explain what a blood pressure measurement means?",
  ],
  [
    "Prepare for an appointment",
    "What questions should I prepare for my next healthcare appointment?",
  ],
  [
    "Discuss my recent readings",
    "Help me understand my recent readings and what I should ask my healthcare professional.",
  ],
];
function confirmReset(action: () => void) {
  if (Platform.OS === "web") {
    if (
      window.confirm(
        "Start a new chat? This clears the current conversation and its shared context.",
      )
    )
      action();
  } else
    Alert.alert(
      "Start a new chat?",
      "This clears the current conversation and its shared context.",
      [
        { text: "Cancel", style: "cancel" },
        { text: "New chat", onPress: action },
      ],
    );
}
export default function Chatbot() {
  const { user } = useAuth();
  const state = useSyncExternalStore(
    chatSession.subscribe,
    chatSession.getSnapshot,
    chatSession.getSnapshot,
  );
  const [attaching, setAttaching] = useState(false);
  const [unread, setUnread] = useState(false);
  const [showContext, setShowContext] = useState(false);
  const list = useRef<ScrollView>(null);
  const nearBottom = useRef(true);
  const previousCount = useRef(state.messages.length);
  const reduced = useMotionPreference();
  // Session storage clears on every credential change, independently of whether
  // this tab is mounted. The modal also discards previews when the user changes.
  useEffect(() => {
    setAttaching(false);
    setShowContext(false);
    setUnread(false);
  }, [user?.user_id]);
  useEffect(() => {
    if (state.messages.length > previousCount.current && !nearBottom.current)
      setUnread(true);
    previousCount.current = state.messages.length;
  }, [state.messages.length]);
  function startOver() {
    const reset = () => {
      chatSession.reset();
      setUnread(false);
      setShowContext(false);
    };
    if (state.messages.length || state.draft || state.selection)
      confirmReset(reset);
    else reset();
  }
  function attach() {
    // Opening or cancelling the sheet must not destroy the current conversation.
    setAttaching(true);
  }
  return (
    <Screen brand={false} scroll={false}>
      <View style={styles.header}>
        <View style={{ flex: 1 }}>
          <Text accessibilityRole="header" style={ui.heading}>
            Pilot AI
          </Text>
          <Text style={ui.small}>AI health information assistant</Text>
        </View>
        <Pressable
          accessibilityRole="button"
          accessibilityLabel="Start a new chat"
          onPress={startOver}
          style={styles.control}
        >
          <Text style={styles.action}>New chat</Text>
        </Pressable>
      </View>
      <ScrollView
        ref={list}
        keyboardShouldPersistTaps="handled"
        keyboardDismissMode="on-drag"
        contentContainerStyle={styles.conversation}
        scrollEventThrottle={100}
        onScroll={({ nativeEvent: e }) => {
          nearBottom.current =
            e.contentSize.height -
              e.layoutMeasurement.height -
              e.contentOffset.y <
            80;
          if (nearBottom.current) setUnread(false);
        }}
        onContentSizeChange={() => {
          if (nearBottom.current)
            list.current?.scrollToEnd({ animated: false });
        }}
      >
        {!state.messages.length && (
          <View style={{ gap: 16, paddingVertical: 24 }}>
            <Text style={[ui.heading, { fontSize: 28 }]}>
              A little clarity for your health.
            </Text>
            <Text style={ui.body}>
              Ask about measurements or prepare for a healthcare visit. Attach
              saved readings if you’d like help discussing them.
            </Text>
            {suggestions.map(([label, question]) => (
              <Pressable
                key={label}
                accessibilityRole="button"
                style={styles.suggestion}
                onPress={() => chatSession.draft(question)}
              >
                <Text style={styles.action}>{label} ↗</Text>
              </Pressable>
            ))}
            <Text style={ui.small}>
              Messages are sent to Google Gemini. Saved readings are shared only
              when you choose to attach them. Chat stays in this session and
              clears when you sign out or restart the app.
            </Text>
          </View>
        )}
        {!!state.selection && !!state.messages.length && (
          <Card>
            <Pressable
              accessibilityRole="button"
              accessibilityState={{ expanded: showContext }}
              onPress={() => setShowContext(!showContext)}
              style={styles.control}
            >
              <Text style={styles.action}>
                Shared readings ·{" "}
                {state.selection.metric_types.map(metricName).join(", ")} ·{" "}
                {showContext ? "Hide" : "Details"}
              </Text>
            </Pressable>
            {showContext && state.context && (
              <ChatReadingSummary context={state.context} />
            )}
          </Card>
        )}
        {state.messages.map((message) => (
          <View
            key={message.id}
            style={message.role === "user" ? styles.user : styles.assistant}
          >
            <Text style={[ui.small, { color: C.primaryDark, marginBottom: 6 }]}>
              {message.role === "user" ? "You" : "Pilot AI · AI-generated"}
            </Text>
            <Text selectable style={[ui.body, { lineHeight: 27 }]}>
              {message.text}
            </Text>
          </View>
        ))}
        {state.busy && (
          <Text accessibilityLiveRegion="polite" style={ui.small}>
            Pilot AI is responding…
          </Text>
        )}
        {!!state.error && (
          <Card>
            <Text
              accessibilityRole="alert"
              style={[ui.body, { color: C.danger }]}
            >
              {state.error}
            </Text>
            <Button
              secondary
              onPress={() => void chatSession.send(api.chat, true)}
            >
              Retry message
            </Button>
            {state.selection && (
              <Button
                secondary
                onPress={() =>
                  confirmReset(() => {
                    const last = state.messages[state.messages.length - 1];
                    chatSession.reset();
                    chatSession.draft(last?.text ?? "");
                  })
                }
              >
                Start without readings
              </Button>
            )}
          </Card>
        )}
      </ScrollView>
      {unread && (
        <Pressable
          accessibilityRole="button"
          style={styles.newResponse}
          onPress={() => {
            list.current?.scrollToEnd({ animated: !reduced });
            nearBottom.current = true;
            setUnread(false);
          }}
        >
          <Text style={styles.action}>New response ↓</Text>
        </Pressable>
      )}
      <View style={styles.composer}>
        {state.selection && (
          <View
            style={[
              ui.row,
              { justifyContent: "space-between", flexWrap: "wrap" },
            ]}
          >
            <Text style={[ui.small, { flex: 1 }]}>
              Attached:{" "}
              {state.selection.metric_types.map(metricName).join(", ")}
            </Text>
            <Pressable
              accessibilityRole="button"
              accessibilityLabel="Remove shared readings and start a new chat"
              style={styles.control}
              onPress={() => confirmReset(() => chatSession.reset())}
            >
              <Text style={styles.action}>Remove</Text>
            </Pressable>
          </View>
        )}
        <Text accessibilityRole="header" style={ui.small}>
          Ask Pilot AI
        </Text>
        <TextInput
          accessibilityLabel="Message Pilot AI"
          multiline
          maxLength={4000}
          value={state.draft}
          onChangeText={chatSession.draft}
          placeholder="What would you like to understand?"
          placeholderTextColor={C.textSecondary}
          style={styles.input}
          textAlignVertical="top"
        />
        <View
          style={[
            ui.row,
            { justifyContent: "space-between", flexWrap: "wrap" },
          ]}
        >
          <Pressable
            accessibilityRole="button"
            disabled={state.busy}
            accessibilityState={{ disabled: state.busy }}
            style={styles.control}
            onPress={attach}
          >
            <Text style={[styles.action, state.busy && { opacity: 0.5 }]}>
              ＋ Attach readings
            </Text>
          </Pressable>
          <Button
            disabled={!state.draft.trim() || state.busy || !!state.error}
            onPress={() => void chatSession.send(api.chat)}
          >
            Send
          </Button>
        </View>
        <Text style={[ui.small, { fontSize: 12 }]}>
          AI can make mistakes. Educational information, not a diagnosis.
        </Text>
      </View>
      {attaching && (
        <ChatReadings
          onClose={() => setAttaching(false)}
          onShare={(selection, context) => {
            const apply = () => {
              const draft = chatSession.getSnapshot().draft;
              chatSession.reset(selection, context);
              chatSession.draft(draft);
              setAttaching(false);
              setUnread(false);
              setShowContext(false);
            };
            // Confirm only when committing new context, after the user previews it.
            if (state.messages.length) confirmReset(apply);
            else apply();
          }}
        />
      )}
    </Screen>
  );
}
const styles = StyleSheet.create({
  header: {
    flexDirection: "row",
    alignItems: "center",
    paddingHorizontal: 20,
    paddingVertical: 12,
    gap: 12,
    borderBottomWidth: 1,
    borderBottomColor: C.border,
  },
  conversation: {
    padding: 20,
    gap: 20,
    flexGrow: 1,
    maxWidth: 640,
    width: "100%",
    alignSelf: "center",
  },
  control: {
    minHeight: 48,
    minWidth: 48,
    justifyContent: "center",
    paddingHorizontal: 8,
  },
  action: { fontSize: 16, fontWeight: "600", color: C.primaryDark },
  suggestion: {
    borderWidth: 1,
    borderColor: C.border,
    backgroundColor: C.white,
    borderRadius: 16,
    padding: 18,
    minHeight: 56,
  },
  user: {
    alignSelf: "flex-end",
    maxWidth: "90%",
    padding: 16,
    borderRadius: 18,
    borderBottomRightRadius: 4,
    backgroundColor: C.mint,
  },
  assistant: { alignSelf: "stretch", paddingVertical: 4, paddingRight: 12 },
  composer: {
    paddingHorizontal: 20,
    paddingTop: 10,
    paddingBottom: 12,
    gap: 6,
    borderTopWidth: 1,
    borderTopColor: C.border,
    backgroundColor: C.white,
  },
  input: {
    minHeight: 54,
    maxHeight: 130,
    borderRadius: 14,
    borderWidth: 1,
    borderColor: C.border,
    padding: 12,
    fontSize: 16,
    color: C.title,
    backgroundColor: C.background,
  },
  newResponse: {
    alignSelf: "center",
    padding: 14,
    minHeight: 48,
    backgroundColor: C.mint,
    borderRadius: 24,
    margin: 8,
  },
});
