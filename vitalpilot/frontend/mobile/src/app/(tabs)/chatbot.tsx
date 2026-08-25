import { useMemo, useRef, useState } from 'react';
import {
  FlatList,
  KeyboardAvoidingView,
  Platform,
  Pressable,
  StyleSheet,
  Text,
  TextInput,
  View,
} from 'react-native';
import { useRouter } from 'expo-router';
import { SafeAreaView } from 'react-native-safe-area-context';

import { BottomTabInset } from '@/constants/theme';
import { VitalPilotColors } from '@/constants/vitalpilot';
import { api } from '@/services/api';

type MessageRole = 'user' | 'assistant';

type Urgency =
  | 'normal'
  | 'attention'
  | 'emergency';

type AppRoute =
  | '/metrics'
  | '/reports'
  | '/doctors'
  | '/profile';

type ChatAction = {
  label: string;
  route: AppRoute;
};

type ChatMessage = {
  id: string;
  role: MessageRole;
  text: string;
  timestamp?: string;
  urgency?: Urgency;
  action?: ChatAction;
};

type QuickPrompt = {
  id: string;
  icon: string;
  title: string;
  subtitle: string;
  prompt: string;
};

const quickPrompts: QuickPrompt[] = [
  {
    id: 'symptoms',
    icon: '♥',
    title: 'Check Symptoms',
    subtitle: 'Describe how you feel',
    prompt:
      'I want to discuss some symptoms I am experiencing.',
  },
  {
    id: 'vitals',
    icon: '⌁',
    title: 'Explain My Vitals',
    subtitle: 'Understand recent readings',
    prompt:
      'Help me understand my recent vital signs.',
  },
  {
    id: 'report',
    icon: '▤',
    title: 'Explain My Report',
    subtitle: 'Review health trends',
    prompt:
      'Explain my recent health report in simple terms.',
  },
  {
    id: 'specialist',
    icon: '✚',
    title: 'Find a Specialist',
    subtitle: 'Understand which specialty may help',
    prompt:
      'Help me understand what type of specialist I may need.',
  },
  {
    id: 'weekly',
    icon: '↗',
    title: 'What Changed?',
    subtitle: 'Review this week',
    prompt:
      'What changed in my health information this week?',
  },
  {
    id: 'doctor',
    icon: '◉',
    title: 'Prepare for My Visit',
    subtitle: 'Organize questions',
    prompt:
      'Help me prepare questions for my next doctor visit.',
  },
];

const welcomeMessage: ChatMessage = {
  id: 'welcome',
  role: 'assistant',
  text:
    "Hello! I'm Pilot AI. I can help explain health information, discuss symptoms, review trends, and help you prepare questions for a healthcare professional.",
  urgency: 'normal',
};

export default function ChatbotScreen() {
  const router = useRouter();

  const listRef =
    useRef<FlatList<ChatMessage>>(null);

  const [input, setInput] =
    useState('');

  const [messages, setMessages] =
    useState<ChatMessage[]>([
      welcomeMessage,
    ]);

  const [isResponding, setIsResponding] =
    useState(false);

  const conversationStarted =
    messages.length > 1;

  const currentTime = useMemo(() => {
    return new Date().toLocaleTimeString(
      [],
      {
        hour: 'numeric',
        minute: '2-digit',
      }
    );
  }, []);

  function createMessageId(
    prefix: string
  ) {
    return `${prefix}-${Date.now()}-${Math.random()
      .toString(36)
      .slice(2, 7)}`;
  }

  function newConversation() {
    setMessages([
      {
        ...welcomeMessage,
        id: createMessageId('welcome'),
      },
    ]);

    setInput('');
    setIsResponding(false);
  }

  function buildPrototypeResponse(
    text: string
  ): ChatMessage {
    const lower =
      text.toLowerCase();

    if (
      lower.includes('vital') ||
      lower.includes(
        'blood pressure'
      ) ||
      lower.includes(
        'blood glucose'
      )
    ) {
      return {
        id: createMessageId(
          'assistant'
        ),
        role: 'assistant',
        text:
          'I can help explain what your recorded measurements mean and how they changed over time. Open your VitalPilot vitals page to review the actual readings.',
        urgency: 'normal',
        action: {
          label: 'View My Vitals',
          route: '/metrics',
        },
      };
    }

    if (
      lower.includes('report') ||
      lower.includes('trend') ||
      lower.includes(
        'changed'
      )
    ) {
      return {
        id: createMessageId(
          'assistant'
        ),
        role: 'assistant',
        text:
          'Your Health Reports page summarizes recorded measurements and trends. I can help explain those results after the reporting service provides the report context.',
        urgency: 'normal',
        action: {
          label: 'Open Health Reports',
          route: '/reports',
        },
      };
    }

    if (
      lower.includes('specialist') ||
      lower.includes('doctor')
    ) {
      return {
        id: createMessageId(
          'assistant'
        ),
        role: 'assistant',
        text:
          'I can help you understand common healthcare specialties. Provider recommendations and directory information should come from the VitalPilot doctor service once it is connected.',
        urgency: 'normal',
        action: {
          label: 'Find a Doctor',
          route: '/doctors',
        },
      };
    }

    if (
      lower.includes(
        'chest pain'
      ) ||
      lower.includes(
        'cannot breathe'
      ) ||
      lower.includes(
        "can't breathe"
      ) ||
      lower.includes(
        'unconscious'
      )
    ) {
      return {
        id: createMessageId(
          'assistant'
        ),
        role: 'assistant',
        text:
          'Some symptoms can require urgent medical attention. Pilot AI is not an emergency service. If you believe you may be experiencing a medical emergency, contact emergency services or seek immediate medical care.',
        urgency: 'emergency',
      };
    }

    return {
      id: createMessageId(
        'assistant'
      ),
      role: 'assistant',
      text:
        'Your message is ready to be sent to the VitalPilot AI backend. Once that service is connected, Pilot AI can provide contextual health explanations using your authorized VitalPilot data.',
      urgency: 'normal',
    };
  }

  async function sendMessage(
    prefilledMessage?: string
  ) {
    const text = (
      prefilledMessage ?? input
    ).trim();

    if (
      !text ||
      isResponding
    ) {
      return;
    }

    const userMessage: ChatMessage = {
      id: createMessageId('user'),
      role: 'user',
      text,
      timestamp: currentTime,
      urgency: 'normal',
    };

    const updatedHistory = [
      ...messages,
      userMessage,
    ];

    setMessages(updatedHistory);
    setInput('');
    setIsResponding(true);

    requestAnimationFrame(() => {
      listRef.current?.scrollToEnd({
        animated: true,
      });
    });

    try {
      let assistantMessage:
        ChatMessage;

      if (
        process.env
          .EXPO_PUBLIC_API_BASE_URL
      ) {
        const response =
          await api.chat(
            text,
            updatedHistory.map(
              (message) => ({
                id: message.id,
                role:
                  message.role,
                text:
                  message.text,
              })
            )
          );

        assistantMessage = {
          id: createMessageId(
            'assistant'
          ),
          role: 'assistant',
          text: response.text,
          timestamp:
            new Date().toLocaleTimeString(
              [],
              {
                hour: 'numeric',
                minute:
                  '2-digit',
              }
            ),
          urgency: 'normal',
        };
      } else {
        await new Promise(
          (resolve) =>
            setTimeout(
              resolve,
              700
            )
        );

        assistantMessage =
          buildPrototypeResponse(
            text
          );

        assistantMessage.timestamp =
          new Date().toLocaleTimeString(
            [],
            {
              hour: 'numeric',
              minute: '2-digit',
            }
          );
      }

      setMessages(
        (current) => [
          ...current,
          assistantMessage,
        ]
      );
    } catch {
      setMessages(
        (current) => [
          ...current,
          {
            id: createMessageId(
              'error'
            ),
            role: 'assistant',
            text:
              'Pilot AI is unavailable right now. Please try again later.',
            urgency: 'attention',
            timestamp:
              new Date().toLocaleTimeString(
                [],
                {
                  hour:
                    'numeric',
                  minute:
                    '2-digit',
                }
              ),
          },
        ]
      );
    } finally {
      setIsResponding(false);

      setTimeout(() => {
        listRef.current?.scrollToEnd({
          animated: true,
        });
      }, 100);
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
        <View style={styles.header}>
          <View style={styles.headerText}>
            <Text style={styles.title}>
              Pilot AI
            </Text>

            <View
              style={styles.onlineRow}
            >
              <View
                style={styles.onlineDot}
              />

              <Text
                style={
                  styles.onlineText
                }
              >
                Health assistant
              </Text>
            </View>
          </View>

          <Pressable
            onPress={
              newConversation
            }
            style={({
              pressed,
            }) => [
              styles.newChatButton,
              pressed &&
                styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Start a new Pilot AI conversation"
          >
            <Text
              style={
                styles.newChatIcon
              }
            >
              ＋
            </Text>
          </Pressable>
        </View>

        <View style={styles.safetyBanner}>
          <Text
            style={styles.safetyIcon}
          >
            i
          </Text>

          <Text
            style={styles.safetyText}
          >
            Pilot AI provides
            informational guidance and
            does not replace a licensed
            healthcare professional or
            emergency service.
          </Text>
        </View>

        {!conversationStarted ? (
          <View
            style={
              styles.emptyState
            }
          >
            <View
              style={styles.aiHeroIcon}
            >
              <Text
                style={
                  styles.aiHeroIconText
                }
              >
                ✦
              </Text>
            </View>

            <Text
              style={
                styles.emptyTitle
              }
            >
              How can Pilot AI help?
            </Text>

            <Text
              style={
                styles.emptySubtitle
              }
            >
              Ask about symptoms,
              health measurements,
              trends, reports, or
              preparing for your next
              healthcare visit.
            </Text>

            <View
              style={
                styles.quickGrid
              }
            >
              {quickPrompts.map(
                (prompt) => (
                  <Pressable
                    key={prompt.id}
                    onPress={() =>
                      sendMessage(
                        prompt.prompt
                      )
                    }
                    style={({
                      pressed,
                    }) => [
                      styles.quickCard,
                      pressed &&
                        styles.pressed,
                    ]}
                  >
                    <View
                      style={
                        styles.quickIcon
                      }
                    >
                      <Text
                        style={
                          styles.quickIconText
                        }
                      >
                        {prompt.icon}
                      </Text>
                    </View>

                    <Text
                      style={
                        styles.quickTitle
                      }
                    >
                      {prompt.title}
                    </Text>

                    <Text
                      style={
                        styles.quickSubtitle
                      }
                    >
                      {
                        prompt.subtitle
                      }
                    </Text>
                  </Pressable>
                )
              )}
            </View>
          </View>
        ) : (
          <FlatList
            ref={listRef}
            data={messages}
            keyExtractor={(
              item
            ) => item.id}
            renderItem={({
              item,
            }) => (
              <ChatBubble
                message={item}
                onAction={(
                  route
                ) =>
                  router.push(
                    route
                  )
                }
              />
            )}
            contentContainerStyle={
              styles.messageList
            }
            showsVerticalScrollIndicator={
              false
            }
            keyboardShouldPersistTaps="handled"
            onContentSizeChange={() =>
              listRef.current?.scrollToEnd(
                {
                  animated:
                    true,
                }
              )
            }
            ListFooterComponent={
              isResponding ? (
                <TypingIndicator />
              ) : (
                <View
                  style={{
                    height: 6,
                  }}
                />
              )
            }
          />
        )}

        <View style={styles.composer}>
          <Pressable
            style={styles.addButton}
            accessibilityRole="button"
            accessibilityLabel="Additional Pilot AI options"
          >
            <Text
              style={
                styles.addButtonText
              }
            >
              ＋
            </Text>
          </Pressable>

          <View
            style={
              styles.inputContainer
            }
          >
            <TextInput
              value={input}
              onChangeText={setInput}
              multiline
              placeholder="Ask Pilot AI..."
              placeholderTextColor="#98A2B3"
              style={styles.input}
              maxLength={2000}
              accessibilityLabel="Message Pilot AI"
            />
          </View>

          <Pressable
            onPress={() =>
              sendMessage()
            }
            disabled={
              !input.trim() ||
              isResponding
            }
            style={({ pressed }) => [
              styles.sendButton,
              (!input.trim() ||
                isResponding) &&
                styles.sendButtonDisabled,
              pressed &&
                input.trim() &&
                !isResponding &&
                styles.pressed,
            ]}
            accessibilityRole="button"
            accessibilityLabel="Send message"
          >
            <Text
              style={
                styles.sendButtonText
              }
            >
              ↑
            </Text>
          </Pressable>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

function ChatBubble({
  message,
  onAction,
}: {
  message: ChatMessage;
  onAction: (
    route: AppRoute
  ) => void;
}) {
  const isUser =
    message.role === 'user';

  return (
    <View
      style={[
        styles.messageWrapper,
        isUser
          ? styles.userMessageWrapper
          : styles.assistantMessageWrapper,
      ]}
    >
      {!isUser ? (
        <View
          style={
            styles.assistantAvatar
          }
        >
          <Text
            style={
              styles.assistantAvatarText
            }
          >
            ✦
          </Text>
        </View>
      ) : null}

      <View
        style={[
          styles.messageContent,
          isUser
            ? styles.userMessageContent
            : styles.assistantMessageContent,
        ]}
      >
        {!isUser ? (
          <Text
            style={
              styles.assistantName
            }
          >
            Pilot AI
          </Text>
        ) : null}

        {message.urgency ===
        'attention' ? (
          <StatusBanner
            type="attention"
            text="Please review this information carefully."
          />
        ) : null}

        {message.urgency ===
        'emergency' ? (
          <StatusBanner
            type="emergency"
            text="Urgent symptoms may require immediate medical care."
          />
        ) : null}

        <View
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

        {message.action ? (
          <Pressable
            onPress={() =>
              onAction(
                message.action!
                  .route
              )
            }
            style={({
              pressed,
            }) => [
              styles.actionButton,
              pressed &&
                styles.pressed,
            ]}
          >
            <Text
              style={
                styles.actionButtonText
              }
            >
              {
                message.action
                  .label
              }
            </Text>

            <Text
              style={
                styles.actionArrow
              }
            >
              →
            </Text>
          </Pressable>
        ) : null}

        {message.timestamp ? (
          <Text
            style={[
              styles.timestamp,
              isUser &&
                styles.userTimestamp,
            ]}
          >
            {message.timestamp}
          </Text>
        ) : null}
      </View>
    </View>
  );
}

function StatusBanner({
  type,
  text,
}: {
  type:
    | 'attention'
    | 'emergency';
  text: string;
}) {
  const emergency =
    type === 'emergency';

  return (
    <View
      style={
        emergency
          ? styles.emergencyBanner
          : styles.attentionBanner
      }
    >
      <Text
        style={
          emergency
            ? styles.emergencyIcon
            : styles.attentionIcon
        }
      >
        {emergency ? '!' : 'i'}
      </Text>

      <Text
        style={
          emergency
            ? styles.emergencyText
            : styles.attentionText
        }
      >
        {text}
      </Text>
    </View>
  );
}

function TypingIndicator() {
  return (
    <View
      style={
        styles.typingWrapper
      }
    >
      <View
        style={
          styles.assistantAvatar
        }
      >
        <Text
          style={
            styles.assistantAvatarText
          }
        >
          ✦
        </Text>
      </View>

      <View
        style={styles.typingBubble}
      >
        <View
          style={styles.typingDot}
        />

        <View
          style={styles.typingDot}
        />

        <View
          style={styles.typingDot}
        />
      </View>
    </View>
  );
}

const styles = StyleSheet.create({
  safeArea: {
    flex: 1,
    backgroundColor: '#F7FAF8',
  },

  keyboardView: {
    flex: 1,
    paddingBottom:
      BottomTabInset,
  },

  header: {
    minHeight: 70,

    flexDirection: 'row',
    alignItems: 'center',

    paddingHorizontal: 20,

    backgroundColor: '#FFFFFF',

    borderBottomWidth: 1,
    borderBottomColor: '#E8ECEA',
  },

  headerText: {
    flex: 1,
  },

  title: {
    color:
      VitalPilotColors.title,

    fontSize: 24,
    fontWeight: '900',
  },

  onlineRow: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 4,
  },

  onlineDot: {
    width: 7,
    height: 7,

    borderRadius: 4,

    backgroundColor: '#15945C',

    marginRight: 6,
  },

  onlineText: {
    color: '#667085',

    fontSize: 11,
    fontWeight: '600',
  },

  newChatButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: '#EEF8F2',

    alignItems: 'center',
    justifyContent: 'center',
  },

  newChatIcon: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 22,
    fontWeight: '700',
  },

  safetyBanner: {
    flexDirection: 'row',
    alignItems: 'flex-start',

    marginHorizontal: 16,
    marginTop: 12,

    padding: 11,

    borderRadius: 13,

    backgroundColor: '#FFF8EB',
  },

  safetyIcon: {
    width: 22,
    height: 22,

    borderRadius: 11,

    backgroundColor: '#F79009',

    color: '#FFFFFF',

    textAlign: 'center',
    lineHeight: 22,

    fontSize: 12,
    fontWeight: '900',

    marginRight: 9,
  },

  safetyText: {
    flex: 1,

    color: '#7A2E0E',

    fontSize: 10,
    lineHeight: 16,
  },

  emptyState: {
    flex: 1,

    paddingHorizontal: 20,
    paddingTop: 26,
    paddingBottom: 18,
  },

  aiHeroIcon: {
    width: 72,
    height: 72,

    borderRadius: 36,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    alignSelf: 'center',

    marginBottom: 14,
  },

  aiHeroIconText: {
    color: '#FFFFFF',

    fontSize: 30,
    fontWeight: '900',
  },

  emptyTitle: {
    color: '#101828',

    fontSize: 24,
    fontWeight: '900',

    textAlign: 'center',
  },

  emptySubtitle: {
    maxWidth: 420,

    alignSelf: 'center',

    color: '#667085',

    fontSize: 13,
    lineHeight: 20,

    textAlign: 'center',

    marginTop: 7,
  },

  quickGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',

    gap: 10,

    marginTop: 24,
  },

  quickCard: {
    width: '48%',

    minHeight: 118,

    padding: 14,

    borderWidth: 1,
    borderColor: '#DFE7E3',

    borderRadius: 17,

    backgroundColor: '#FFFFFF',
  },

  quickIcon: {
    width: 36,
    height: 36,

    borderRadius: 18,

    backgroundColor: '#EAF8F0',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 11,
  },

  quickIconText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 16,
    fontWeight: '800',
  },

  quickTitle: {
    color: '#101828',

    fontSize: 13,
    fontWeight: '800',
  },

  quickSubtitle: {
    color: '#667085',

    fontSize: 10,
    lineHeight: 15,

    marginTop: 4,
  },

  messageList: {
    paddingHorizontal: 16,
    paddingTop: 18,
    paddingBottom: 18,
  },

  messageWrapper: {
    flexDirection: 'row',

    marginBottom: 17,
  },

  userMessageWrapper: {
    justifyContent: 'flex-end',
  },

  assistantMessageWrapper: {
    justifyContent: 'flex-start',
  },

  assistantAvatar: {
    width: 34,
    height: 34,

    borderRadius: 17,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginRight: 8,

    flexShrink: 0,
  },

  assistantAvatarText: {
    color: '#FFFFFF',

    fontSize: 14,
    fontWeight: '900',
  },

  messageContent: {
    maxWidth: '84%',
  },

  userMessageContent: {
    alignItems: 'flex-end',

    marginLeft: 'auto',
  },

  assistantMessageContent: {
    alignItems: 'flex-start',
  },

  assistantName: {
    color: '#344054',

    fontSize: 11,
    fontWeight: '800',

    marginBottom: 5,
  },

  bubble: {
    paddingHorizontal: 14,
    paddingVertical: 11,

    borderRadius: 18,
  },

  aiBubble: {
    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E7E4',

    borderTopLeftRadius: 5,
  },

  userBubble: {
    backgroundColor:
      VitalPilotColors.primary,

    borderTopRightRadius: 5,
  },

  messageText: {
    color: '#344054',

    fontSize: 14,
    lineHeight: 21,
  },

  userMessageText: {
    color: '#FFFFFF',
  },

  timestamp: {
    color: '#98A2B3',

    fontSize: 9,

    marginTop: 5,
  },

  userTimestamp: {
    textAlign: 'right',
  },

  actionButton: {
    minHeight: 42,

    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',

    marginTop: 8,

    paddingHorizontal: 13,

    borderRadius: 11,

    backgroundColor: '#ECF8F2',

    borderWidth: 1,
    borderColor: '#D2EADF',

    gap: 6,
  },

  actionButtonText: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 11,
    fontWeight: '800',
  },

  actionArrow: {
    color:
      VitalPilotColors.primaryDark,

    fontSize: 13,
  },

  attentionBanner: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 7,

    padding: 9,

    borderRadius: 10,

    backgroundColor: '#FFF4E5',
  },

  attentionIcon: {
    width: 20,
    height: 20,

    borderRadius: 10,

    backgroundColor: '#F79009',

    color: '#FFFFFF',

    lineHeight: 20,
    textAlign: 'center',

    fontSize: 10,
    fontWeight: '900',

    marginRight: 7,
  },

  attentionText: {
    flex: 1,

    color: '#B54708',

    fontSize: 10,
    lineHeight: 15,
  },

  emergencyBanner: {
    flexDirection: 'row',
    alignItems: 'center',

    marginBottom: 7,

    padding: 9,

    borderRadius: 10,

    backgroundColor: '#FEF3F2',
  },

  emergencyIcon: {
    width: 20,
    height: 20,

    borderRadius: 10,

    backgroundColor: '#D92D20',

    color: '#FFFFFF',

    lineHeight: 20,
    textAlign: 'center',

    fontSize: 10,
    fontWeight: '900',

    marginRight: 7,
  },

  emergencyText: {
    flex: 1,

    color: '#B42318',

    fontSize: 10,
    lineHeight: 15,
  },

  typingWrapper: {
    flexDirection: 'row',
    alignItems: 'center',

    marginTop: 3,
  },

  typingBubble: {
    flexDirection: 'row',

    alignItems: 'center',

    paddingHorizontal: 15,
    paddingVertical: 14,

    borderRadius: 18,
    borderTopLeftRadius: 5,

    backgroundColor: '#FFFFFF',

    borderWidth: 1,
    borderColor: '#E1E7E4',

    gap: 4,
  },

  typingDot: {
    width: 6,
    height: 6,

    borderRadius: 3,

    backgroundColor: '#98A2B3',
  },

  composer: {
    minHeight: 74,

    flexDirection: 'row',
    alignItems: 'flex-end',

    paddingHorizontal: 12,
    paddingTop: 10,
    paddingBottom: 10,

    backgroundColor: '#FFFFFF',

    borderTopWidth: 1,
    borderTopColor: '#E7ECE9',

    gap: 8,
  },

  addButton: {
    width: 42,
    height: 42,

    borderRadius: 21,

    backgroundColor: '#F2F4F7',

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 1,
  },

  addButtonText: {
    color: '#667085',

    fontSize: 21,
    fontWeight: '600',
  },

  inputContainer: {
    flex: 1,

    minHeight: 44,
    maxHeight: 120,

    borderWidth: 1,
    borderColor: '#D0D5DD',

    borderRadius: 22,

    backgroundColor: '#F9FAFB',

    justifyContent: 'center',
  },

  input: {
    minHeight: 42,
    maxHeight: 116,

    paddingHorizontal: 14,
    paddingVertical: 10,

    color: '#101828',

    fontSize: 14,
  },

  sendButton: {
    width: 44,
    height: 44,

    borderRadius: 22,

    backgroundColor:
      VitalPilotColors.primary,

    alignItems: 'center',
    justifyContent: 'center',

    marginBottom: 1,
  },

  sendButtonDisabled: {
    backgroundColor: '#D0D5DD',
  },

  sendButtonText: {
    color: '#FFFFFF',

    fontSize: 22,
    fontWeight: '900',
  },

  pressed: {
    opacity: 0.65,
  },
});