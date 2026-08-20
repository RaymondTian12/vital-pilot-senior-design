import { useState } from 'react';
import {
  KeyboardAvoidingView,
  Platform,
  Pressable,
  ScrollView,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';
import { api } from '@/services/api';
import type { ChatMessage } from '@/types/vitalpilot';

const quickPrompts = [
  'Check Symptoms',
  'Explain My Vitals',
  'Find a Specialist',
  'Lifestyle Recommendations',
];

const initialMessage: ChatMessage = {
  id: 'intro',
  role: 'assistant',
  text:
    "Hello! I'm Pilot AI. I can help explain health information and discuss symptoms for informational purposes. I do not replace a licensed healthcare professional.",
};

export default function ChatbotScreen() {
  const [input, setInput] = useState('');
  const [messages, setMessages] = useState<ChatMessage[]>([
    initialMessage,
  ]);
  const [isResponding, setIsResponding] = useState(false);

  async function sendMessage(prefilledMessage?: string) {
    const messageText = (prefilledMessage ?? input).trim();

    if (!messageText || isResponding) {
      return;
    }

    const userMessage: ChatMessage = {
      id: `user-${Date.now()}`,
      role: 'user',
      text: messageText,
    };

    const updatedHistory = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedHistory);
    setInput('');
    setIsResponding(true);

    try {
      let responseText =
        'Your message is ready to be sent to the VitalPilot AI backend once the FastAPI endpoint is connected.';

      if (process.env.EXPO_PUBLIC_API_BASE_URL) {
        const response = await api.chat(
          messageText,
          updatedHistory
        );

        responseText = response.text;
      }

      const assistantMessage: ChatMessage = {
        id: `assistant-${Date.now()}`,
        role: 'assistant',
        text: responseText,
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        assistantMessage,
      ]);
    } catch {
      const errorMessage: ChatMessage = {
        id: `error-${Date.now()}`,
        role: 'assistant',
        text:
          'Pilot AI is unavailable right now. Please try again later.',
      };

      setMessages((currentMessages) => [
        ...currentMessages,
        errorMessage,
      ]);
    } finally {
      setIsResponding(false);
    }
  }

  return (
    <SafeAreaView
      style={styles.safeArea}
      edges={['top']}
    >
      <KeyboardAvoidingView
        style={styles.keyboardView}
        behavior={
          Platform.OS === 'ios'
            ? 'padding'
            : undefined
        }
      >
        <ScrollView
          contentContainerStyle={styles.content}
          showsVerticalScrollIndicator={false}
          keyboardShouldPersistTaps="handled"
        >
          <Text style={styles.title}>
            Pilot AI
          </Text>

          <Text style={styles.subtitle}>
            How can I help you with your health today?
          </Text>

          <View style={styles.quickPrompts}>
            {quickPrompts.map((prompt) => (
              <Pressable
                key={prompt}
                onPress={() => sendMessage(prompt)}
                style={({ pressed }) => [
                  styles.prompt,
                  pressed && styles.pressed,
                ]}
              >
                <Text style={styles.promptText}>
                  {prompt}
                </Text>
              </Pressable>
            ))}
          </View>

          <View style={styles.disclaimer}>
            <Text style={styles.disclaimerText}>
              AI guidance is informational and is not a medical
              diagnosis or emergency service.
            </Text>
          </View>

          <View style={styles.messages}>
            {messages.map((message) => {
              const isUser =
                message.role === 'user';

              return (
                <View
                  key={message.id}
                  style={[
                    styles.bubble,
                    isUser
                      ? styles.userBubble
                      : styles.aiBubble,
                  ]}
                >
                  <Text
                    style={[
                      styles.messageText,
                      isUser &&
                        styles.userMessageText,
                    ]}
                  >
                    {message.text}
                  </Text>
                </View>
              );
            })}

            {isResponding ? (
              <Text style={styles.typing}>
                Pilot AI is responding...
              </Text>
            ) : null}
          </View>
        </ScrollView>

        <View style={styles.composer}>
          <TextInput
            value={input}
            onChangeText={setInput}
            multiline
            placeholder="Describe symptoms or ask a health question..."
            placeholderTextColor="#98A2B3"
            style={styles.input}
          />

          <Pressable
            onPress={() => sendMessage()}
            disabled={isResponding}
            style={({ pressed }) => [
              styles.sendButton,
              pressed && styles.pressed,
              isResponding &&
                styles.sendButtonDisabled,
            ]}
          >
            <Text style={styles.sendButtonText}>
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FBF9',
  },

  keyboardView: {
    flex: 1,
    paddingBottom: BottomTabInset,
  },

  content: {
    padding: 20,
    gap: 12,
  },

  title: {
    color: VitalPilotColors.title,
    fontSize: 28,
    fontWeight: '800',
  },

  subtitle: {
    color: '#667085',
    fontSize: 16,
  },

  quickPrompts: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: 8,
  },

  prompt: {
    backgroundColor:
      VitalPilotColors.mintStrong,
    borderRadius: 18,
    paddingHorizontal: 12,
    paddingVertical: 9,
  },

  promptText: {
    color: VitalPilotColors.primaryDark,
    fontSize: 13,
    fontWeight: '700',
  },

  disclaimer: {
    backgroundColor:
      VitalPilotColors.warningBackground,
    borderRadius: 14,
    padding: 12,
  },

  disclaimerText: {
    color: VitalPilotColors.warning,
    fontSize: 12,
    lineHeight: 18,
  },

  messages: {
    gap: 10,
    marginTop: 4,
  },

  bubble: {
    maxWidth: '88%',
    padding: 13,
    borderRadius: 18,
  },

  aiBubble: {
    alignSelf: 'flex-start',
    backgroundColor: '#FFFFFF',
    borderWidth: 1,
    borderColor: VitalPilotColors.border,
  },

  userBubble: {
    alignSelf: 'flex-end',
    backgroundColor:
      VitalPilotColors.primary,
  },

  messageText: {
    color: VitalPilotColors.title,
    lineHeight: 21,
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  typing: {
    color: '#667085',
    fontStyle: 'italic',
  },

  composer: {
    backgroundColor: '#FFFFFF',
    borderTopWidth: 1,
    borderTopColor:
      VitalPilotColors.border,
    padding: 12,
    flexDirection: 'row',
    alignItems: 'flex-end',
    gap: 8,
  },

  input: {
    flex: 1,
    minHeight: 48,
    maxHeight: 120,
    borderWidth: 1,
    borderColor: '#D0D5DD',
    borderRadius: 22,
    paddingHorizontal: 14,
    paddingVertical: 11,
    color: VitalPilotColors.title,
    backgroundColor: '#FFFFFF',
  },

  sendButton: {
    width: 46,
    height: 46,
    borderRadius: 23,
    backgroundColor:
      VitalPilotColors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },

  sendButtonDisabled: {
    opacity: 0.5,
  },

  sendButtonText: {
    color: '#FFFFFF',
    fontSize: 24,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.8,
  },
});