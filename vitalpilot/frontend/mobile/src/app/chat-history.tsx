import { useCallback, useState } from "react";
import { Text } from "react-native";
import { useFocusEffect, useRouter } from "expo-router";
import { api, ApiError } from "@/services/api";
import { chatSession } from "@/services/chat-session";
import type { ChatConversationSummary, ChatMessage } from "@/types/vitalpilot";
import { Card, Empty, Heading, Notice, Row, Screen, ui } from "@/components/design/ui";

export default function ChatHistory() {
  const router = useRouter();
  const [conversations, setConversations] = useState<ChatConversationSummary[] | null>(
    null,
  );
  const [error, setError] = useState("");
  const [openingId, setOpeningId] = useState<number | null>(null);

  useFocusEffect(
    useCallback(() => {
      let active = true;
      setError("");
      api
        .chatConversations()
        .then(({ conversations }) => {
          if (active) setConversations(conversations);
        })
        .catch((e) => {
          if (active)
            setError(
              e instanceof ApiError || e instanceof Error
                ? e.message
                : "Couldn't load your past conversations.",
            );
        });
      return () => {
        active = false;
      };
    }, []),
  );

  async function openConversation(conversationId: number) {
    setOpeningId(conversationId);
    try {
      const { messages } = await api.chatConversationMessages(conversationId);
      const loaded: ChatMessage[] = messages.map((message, index) => ({
        id: `${conversationId}-${index}`,
        role: message.role,
        text: message.content,
      }));
      chatSession.loadConversation(conversationId, loaded);
      router.back();
    } catch (e) {
      setError(
        e instanceof ApiError || e instanceof Error
          ? e.message
          : "Couldn't open that conversation.",
      );
    } finally {
      setOpeningId(null);
    }
  }

  return (
    <Screen back>
      <Heading
        title="Chat history"
        subtitle="Conversations are kept for 30 days, then removed automatically."
      />
      {!!error && <Notice error>{error}</Notice>}
      {conversations === null ? (
        <Text style={ui.body}>Loading your conversations…</Text>
      ) : !conversations.length ? (
        <Empty
          title="No saved conversations yet"
          message="Conversations you have with Pilot AI will show up here."
          icon="sparkles"
        />
      ) : (
        <Card>
          {conversations.map((item) => (
            <Row
              key={item.conversation_id}
              title={item.summary || "Untitled conversation"}
              detail={
                openingId === item.conversation_id
                  ? "Opening…"
                  : new Date(item.last_message_at).toLocaleString()
              }
              icon="sparkles"
              onPress={
                openingId === null
                  ? () => void openConversation(item.conversation_id)
                  : undefined
              }
            />
          ))}
        </Card>
      )}
    </Screen>
  );
}
