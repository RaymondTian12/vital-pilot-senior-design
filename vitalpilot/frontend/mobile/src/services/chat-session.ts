import type {
  ChatContext,
  ChatContextSelection,
  ChatMessage,
  ChatResponse,
} from "../types/vitalpilot";

type State = {
  messages: ChatMessage[];
  draft: string;
  busy: boolean;
  error: string;
  conversationId: number | null;
  selection?: ChatContextSelection;
  context?: ChatContext;
};
const empty = (): State => ({
  messages: [],
  draft: "",
  busy: false,
  error: "",
  conversationId: null,
});

// Match the backend's bounded conversation contract without truncating a turn.
export function chatHistory(messages: ChatMessage[]) {
  let size = 0;
  const recent: ChatMessage[] = [];
  for (const message of messages.slice(-10).reverse()) {
    if (size + message.text.length > 24000) break;
    recent.unshift(message);
    size += message.text.length;
  }
  return recent;
}

// The active conversation's messages live only in this in-memory session --
// closing the app loses the view of it, though it's saved server-side (see
// conversationId/loadConversation) and can be reopened from chat history.
// Version guards prevent late responses crossing a new chat or account
// boundary; retries reuse the unanswered user message rather than append.
export function createChatSession() {
  let state = empty();
  let revision = 0;
  let sequence = 0;
  const listeners = new Set<() => void>();
  const update = (patch: Partial<State>) => {
    state = { ...state, ...patch };
    listeners.forEach((listener) => listener());
  };
  return {
    getSnapshot: () => state,
    subscribe: (listener: () => void) => {
      listeners.add(listener);
      return () => {
        listeners.delete(listener);
      };
    },
    draft: (draft: string) => update({ draft }),
    reset(selection?: ChatContextSelection, context?: ChatContext) {
      revision++;
      state = { ...empty(), selection, context };
      listeners.forEach((listener) => listener());
    },
    // Reopens a saved conversation loaded from history so the user can keep
    // chatting in it. Invalidates any in-flight request from whatever was
    // showing before, same as reset().
    loadConversation(conversationId: number, messages: ChatMessage[]) {
      revision++;
      state = { ...empty(), conversationId, messages };
      listeners.forEach((listener) => listener());
    },
    async send(
      request: (
        message: string,
        history: ChatMessage[],
        conversationId: number | null,
        context?: ChatContextSelection,
      ) => Promise<ChatResponse>,
      retry = false,
    ) {
      if (state.busy) return;
      const last = state.messages[state.messages.length - 1];
      if (retry && (!state.error || last?.role !== "user")) return;
      if (!retry && state.error) return;
      const text = retry ? last.text : state.draft.trim();
      if (!text || text.length > 4000) return;
      const history = retry ? state.messages.slice(0, -1) : state.messages;
      const id = ++revision;
      update({
        busy: true,
        error: "",
        draft: retry ? state.draft : "",
        messages: retry
          ? state.messages
          : [...history, { id: String(++sequence), role: "user", text }],
      });
      try {
        const result = await request(
          text,
          chatHistory(history),
          state.conversationId,
          state.selection,
        );
        if (id !== revision) return;
        if (!result.reply?.trim())
          throw new Error("Pilot AI returned an empty reply. Please retry.");
        update({
          busy: false,
          context: result.context ?? state.context,
          conversationId: result.conversation_id ?? state.conversationId,
          messages: [
            ...state.messages,
            { id: String(++sequence), role: "assistant", text: result.reply },
          ],
        });
      } catch (cause) {
        if (id === revision)
          update({
            busy: false,
            error:
              cause instanceof Error
                ? cause.message
                : "Couldn’t send your message. Try again.",
          });
      }
    },
  };
}
export const chatSession = createChatSession();
