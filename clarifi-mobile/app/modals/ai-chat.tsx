import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
  Alert,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import {
  X,
  Send,
  Bot,
  User,
  Sparkles,
  BookOpen,
  Search,
} from 'lucide-react-native';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { QAApiService } from '../../services/qa/qaApiService';
import { EnhancedFAQSearchService } from '../../services/faq/enhancedFAQSearchService';
import PrivacyAwareAnalytics from '../../services/analytics/PrivacyAwareAnalytics';

interface Message {
  id: string;
  text: string;
  isUser: boolean;
  timestamp: Date;
  source?: 'faq' | 'llm' | 'cache';
  confidence?: number;
  cost?: number;
}

const AiChatModal: React.FC = () => {
  const router = useRouter();
  const scrollViewRef = useRef<ScrollView>(null);
  const qaService = useRef(QAApiService.getInstance()).current;
  const faqService = useRef(EnhancedFAQSearchService.getInstance()).current;
  const analytics = useRef(new PrivacyAwareAnalytics()).current;

  const [messages, setMessages] = useState<Message[]>([
    {
      id: '1',
      text: "Hi! I'm your ClariFi AI assistant. I can help you with Canadian finance questions, budgeting advice, and understanding credit optimization. I have access to comprehensive FAQ content and can provide AI-powered answers when needed. What would you like to know?",
      isUser: false,
      timestamp: new Date(),
      source: 'faq',
    },
  ]);
  const [inputText, setInputText] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [remainingQueries, setRemainingQueries] = useState<number>(5); // Default to 5
  const [monthlyLimit] = useState<number>(5); // As per PRD cost-capped requirement
  const [showFAQBrowser, setShowFAQBrowser] = useState<boolean>(false);
  const [faqSearchResults, setFaqSearchResults] = useState<any[]>([]);
  const [isSearchingFAQ, setIsSearchingFAQ] = useState<boolean>(false);

  const suggestedQuestions = [
    'What is a credit score in Canada?',
    'How does credit utilization affect my score?',
    "What's a TFSA and how does it work?",
    'How can I build credit as a newcomer to Canada?',
    'What are the major Canadian banks?',
    'How should I budget my monthly expenses?',
  ];

  useEffect(() => {
    // Scroll to bottom when new messages are added
    setTimeout(() => {
      scrollViewRef.current?.scrollToEnd({ animated: true });
    }, 100);
  }, [messages]);

  useEffect(() => {
    // Initialize user query limits from backend
    const initializeQueryLimits = async () => {
      try {
        const limits = await qaService.getUserLimits();
        if (limits) {
          setRemainingQueries(limits.remainingQueries);
        }
      } catch (error) {
        console.error('Error loading query limits:', error);
        // Keep default value of 5
      }
    };

    initializeQueryLimits();

    // Track modal opening
    analytics.track('qa_modal_opened', {
      initial_remaining_queries: remainingQueries,
      timestamp: new Date().toISOString(),
    });
  }, []);

  const sendMessage = async (text: string, forceFAQ: boolean = false) => {
    if (!text.trim()) return;

    const userMessage: Message = {
      id: Date.now().toString(),
      text: text.trim(),
      isUser: true,
      timestamp: new Date(),
    };

    setMessages(prev => [...prev, userMessage]);
    setInputText('');
    setIsLoading(true);

    try {
      // If user has no remaining queries or forceFAQ, search FAQ first
      if (remainingQueries <= 0 || forceFAQ) {
        const faqResults = await faqService.enhancedSearch(text.trim());

        if (faqResults.length > 0) {
          const bestResult = faqResults[0];
          const faqMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: bestResult.faq.answer,
            isUser: false,
            timestamp: new Date(),
            source: 'faq',
            confidence: bestResult.confidence,
            cost: 0,
          };

          setMessages(prev => [...prev, faqMessage]);

          // Track FAQ usage analytics
          analytics.track('faq_answer_provided', {
            confidence: bestResult.confidence,
            match_type: bestResult.matchType,
            category: bestResult.category.id,
            query_length: text.length,
            cost_saved: 0.002, // Estimated LLM cost saved
          });
          setIsLoading(false);

          // Show related questions if this was a good match
          if (bestResult.confidence > 0.7) {
            const relatedQuestions = faqService.getContextualQuestions(
              bestResult.faq.id,
              text.trim()
            );
            if (relatedQuestions.length > 0) {
              setTimeout(() => {
                const relatedMessage: Message = {
                  id: (Date.now() + 2).toString(),
                  text: `You might also be interested in:\n• ${relatedQuestions.slice(0, 3).join('\n• ')}`,
                  isUser: false,
                  timestamp: new Date(),
                  source: 'faq',
                };
                setMessages(prev => [...prev, relatedMessage]);
              }, 500);
            }
          }
          return;
        } else if (remainingQueries <= 0) {
          // No FAQ match and no queries left
          const noResultsMessage: Message = {
            id: (Date.now() + 1).toString(),
            text: "I couldn't find a direct answer in our FAQ. You've used all your AI queries for this month. You can browse our FAQ categories or wait until next month for more AI assistance.",
            isUser: false,
            timestamp: new Date(),
            source: 'faq',
          };
          setMessages(prev => [...prev, noResultsMessage]);
          setIsLoading(false);
          setShowFAQBrowser(true);
          return;
        }
      }

      // Call the QA service for AI response
      const response = await qaService.askQuestion(text.trim());

      if (response.success && response.data) {
        const aiMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: response.data.answer,
          isUser: false,
          timestamp: new Date(),
          source: response.data.source,
          confidence: response.data.confidence,
          cost: response.data.cost,
        };

        setMessages(prev => [...prev, aiMessage]);

        // Track Q&A analytics
        analytics.track('qa_query_completed', {
          source: response.data.source,
          confidence: response.data.confidence,
          cost: response.data.cost,
          cached: response.data.cached,
          query_length: text.length,
          remaining_queries: response.limits?.remainingQueries,
        });

        // Update remaining queries if this was an LLM call
        if (response.limits?.remainingQueries !== undefined) {
          setRemainingQueries(response.limits.remainingQueries);
        } else if (response.data.source === 'llm' && !response.data.cached) {
          // If no limit info from server, decrement locally for LLM calls
          setRemainingQueries(prev => Math.max(0, prev - 1));
        }
      } else {
        // Handle error response
        const errorMessage: Message = {
          id: (Date.now() + 1).toString(),
          text:
            response.error ||
            "Sorry, I couldn't process your question right now. Please try again or browse our FAQ for answers to common questions.",
          isUser: false,
          timestamp: new Date(),
          source: 'faq',
        };

        setMessages(prev => [...prev, errorMessage]);
      }
    } catch (error) {
      console.error('Error sending message:', error);

      const errorMessage: Message = {
        id: (Date.now() + 1).toString(),
        text: "I'm having trouble connecting right now. Please check your internet connection and try again, or browse our FAQ for answers to common questions.",
        isUser: false,
        timestamp: new Date(),
        source: 'faq',
      };

      setMessages(prev => [...prev, errorMessage]);
    } finally {
      setIsLoading(false);
    }
  };

  const handleSuggestedQuestion = (question: string) => {
    sendMessage(question);
  };

  const searchFAQ = async (query: string) => {
    setIsSearchingFAQ(true);
    try {
      const results = await faqService.enhancedSearch(query);
      setFaqSearchResults(results.slice(0, 5)); // Show top 5 results
    } catch (error) {
      console.error('FAQ search error:', error);
    } finally {
      setIsSearchingFAQ(false);
    }
  };

  const selectFAQResult = (result: any) => {
    const faqMessage: Message = {
      id: Date.now().toString(),
      text: result.faq.answer,
      isUser: false,
      timestamp: new Date(),
      source: 'faq',
      confidence: result.confidence,
      cost: 0,
    };

    setMessages(prev => [...prev, faqMessage]);
    setShowFAQBrowser(false);
    setFaqSearchResults([]);

    // Add contextual questions
    const relatedQuestions = faqService.getContextualQuestions(
      result.faq.id,
      ''
    );
    if (relatedQuestions.length > 0) {
      setTimeout(() => {
        const relatedMessage: Message = {
          id: (Date.now() + 1).toString(),
          text: `Related questions you might find helpful:\n• ${relatedQuestions.slice(0, 3).join('\n• ')}`,
          isUser: false,
          timestamp: new Date(),
          source: 'faq',
        };
        setMessages(prev => [...prev, relatedMessage]);
      }, 500);
    }
  };

  const renderMessage = (message: Message) => (
    <View
      key={message.id}
      style={[
        styles.messageContainer,
        message.isUser ? styles.userMessage : styles.aiMessage,
      ]}
    >
      <View style={styles.messageHeader}>
        <View
          style={[
            styles.avatar,
            message.isUser ? styles.userAvatar : styles.aiAvatar,
          ]}
        >
          {message.isUser ? (
            <User size={16} color={colors.surface} />
          ) : message.source === 'llm' ? (
            <Sparkles size={16} color={colors.surface} />
          ) : (
            <Bot size={16} color={colors.surface} />
          )}
        </View>
        <Text style={styles.messageTime}>
          {message.timestamp.toLocaleTimeString([], {
            hour: '2-digit',
            minute: '2-digit',
          })}
        </Text>
        {!message.isUser && message.source && (
          <Text style={styles.sourceIndicator}>
            {message.source === 'faq'
              ? 'FAQ'
              : message.source === 'llm'
                ? 'AI'
                : 'Cache'}
          </Text>
        )}
      </View>
      <Text
        style={[
          styles.messageText,
          message.isUser ? styles.userMessageText : styles.aiMessageText,
        ]}
      >
        {message.text}
      </Text>
      {!message.isUser && message.source === 'llm' && message.cost && (
        <Text style={styles.costIndicator}>
          Cost: ${message.cost.toFixed(4)}
        </Text>
      )}
    </View>
  );

  return (
    <SafeAreaView style={styles.container}>
      {/* Header */}
      <View style={styles.header}>
        <View style={styles.headerLeft}>
          <Sparkles size={20} color={colors.wisdom} />
        </View>
        <View style={styles.headerCenter}>
          <Text style={styles.title}>Ask ClariFi</Text>
          <Text style={styles.queryLimitText}>
            {remainingQueries}/{monthlyLimit} AI queries remaining
          </Text>
        </View>
        <TouchableOpacity
          style={styles.closeButton}
          onPress={() => router.back()}
          hitSlop={{ top: 10, bottom: 10, left: 10, right: 10 }}
        >
          <X size={24} color={colors.textPrimary} />
        </TouchableOpacity>
      </View>

      <KeyboardAvoidingView
        style={styles.content}
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
      >
        {/* Messages */}
        <ScrollView
          ref={scrollViewRef}
          style={styles.messagesContainer}
          contentContainerStyle={styles.messagesContent}
          showsVerticalScrollIndicator={false}
        >
          {messages.map(renderMessage)}

          {isLoading && (
            <View style={styles.loadingContainer}>
              <ActivityIndicator size="small" color={colors.primary} />
              <Text style={styles.loadingText}>AI is typing...</Text>
            </View>
          )}

          {/* FAQ Browser */}
          {showFAQBrowser && (
            <View style={styles.faqBrowserContainer}>
              <View style={styles.faqBrowserHeader}>
                <BookOpen size={20} color={colors.wisdom} />
                <Text style={styles.faqBrowserTitle}>Browse FAQ</Text>
                <TouchableOpacity onPress={() => setShowFAQBrowser(false)}>
                  <X size={16} color={colors.textSecondary} />
                </TouchableOpacity>
              </View>

              <View style={styles.faqSearchContainer}>
                <Search size={16} color={colors.textSecondary} />
                <TextInput
                  style={styles.faqSearchInput}
                  placeholder="Search FAQ..."
                  placeholderTextColor={colors.textSecondary}
                  onChangeText={searchFAQ}
                  autoCapitalize="none"
                />
              </View>

              {isSearchingFAQ && (
                <View style={styles.faqLoadingContainer}>
                  <ActivityIndicator size="small" color={colors.primary} />
                  <Text style={styles.faqLoadingText}>Searching FAQ...</Text>
                </View>
              )}

              <ScrollView style={styles.faqResultsContainer}>
                {faqSearchResults.map((result, index) => (
                  <TouchableOpacity
                    key={index}
                    style={styles.faqResultItem}
                    onPress={() => selectFAQResult(result)}
                  >
                    <Text style={styles.faqResultQuestion}>
                      {result.faq.question}
                    </Text>
                    <Text style={styles.faqResultCategory}>
                      {result.category.title}
                    </Text>
                    <View style={styles.faqResultMeta}>
                      <Text style={styles.faqResultConfidence}>
                        {Math.round(result.confidence * 100)}% match
                      </Text>
                      <Text style={styles.faqResultType}>
                        {result.matchType}
                      </Text>
                    </View>
                  </TouchableOpacity>
                ))}
              </ScrollView>
            </View>
          )}

          {/* Suggested Questions */}
          {messages.length === 1 && !showFAQBrowser && (
            <View style={styles.suggestionsContainer}>
              <Text style={styles.suggestionsTitle}>Try asking:</Text>
              {suggestedQuestions.map((question, index) => (
                <TouchableOpacity
                  key={index}
                  style={styles.suggestionButton}
                  onPress={() => handleSuggestedQuestion(question)}
                >
                  <Text style={styles.suggestionText}>{question}</Text>
                </TouchableOpacity>
              ))}

              {remainingQueries <= 2 && (
                <TouchableOpacity
                  style={[styles.suggestionButton, styles.faqBrowseButton]}
                  onPress={() => setShowFAQBrowser(true)}
                >
                  <BookOpen size={16} color={colors.wisdom} />
                  <Text
                    style={[styles.suggestionText, { marginLeft: spacing.xs }]}
                  >
                    Browse FAQ (Free)
                  </Text>
                </TouchableOpacity>
              )}
            </View>
          )}
        </ScrollView>

        {/* Input */}
        <View style={styles.inputContainer}>
          <TextInput
            style={styles.textInput}
            value={inputText}
            onChangeText={setInputText}
            placeholder={
              remainingQueries > 0
                ? 'Ask me about budgeting, credit, or finances...'
                : 'Search FAQ or wait for next month...'
            }
            placeholderTextColor={colors.textSecondary}
            multiline
            maxLength={500}
            onSubmitEditing={() =>
              sendMessage(inputText, remainingQueries <= 0)
            }
            blurOnSubmit={false}
          />

          {remainingQueries <= 0 && (
            <TouchableOpacity
              style={styles.faqModeButton}
              onPress={() => setShowFAQBrowser(true)}
            >
              <BookOpen size={16} color={colors.wisdom} />
            </TouchableOpacity>
          )}

          <TouchableOpacity
            style={[
              styles.sendButton,
              (!inputText.trim() || isLoading) && styles.sendButtonDisabled,
            ]}
            onPress={() => sendMessage(inputText, remainingQueries <= 0)}
            disabled={!inputText.trim() || isLoading}
          >
            <Send size={20} color={colors.surface} />
          </TouchableOpacity>
        </View>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.lightest,
  },
  headerLeft: {
    width: 24,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: spacing.xs,
  },
  content: {
    flex: 1,
  },
  messagesContainer: {
    flex: 1,
    backgroundColor: colors.backgroundSecondary,
  },
  messagesContent: {
    padding: spacing.lg,
    paddingBottom: spacing.xl,
  },
  messageContainer: {
    marginBottom: spacing.lg,
  },
  userMessage: {
    alignItems: 'flex-end',
  },
  aiMessage: {
    alignItems: 'flex-start',
  },
  messageHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  avatar: {
    width: 24,
    height: 24,
    borderRadius: 12,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
  userAvatar: {
    backgroundColor: colors.primary,
  },
  aiAvatar: {
    backgroundColor: colors.wisdom,
  },
  messageTime: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  messageText: {
    ...textStyles.bodyRegular,
    maxWidth: '85%',
    padding: spacing.md,
    borderRadius: 16,
    lineHeight: 20,
  },
  userMessageText: {
    backgroundColor: colors.primary,
    color: colors.surface,
    borderBottomRightRadius: 4,
  },
  aiMessageText: {
    backgroundColor: colors.surface,
    color: colors.textPrimary,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    borderBottomLeftRadius: 4,
  },
  loadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
  },
  loadingText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  suggestionsContainer: {
    marginTop: spacing.lg,
  },
  suggestionsTitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginBottom: spacing.md,
    fontWeight: '500',
  },
  suggestionButton: {
    backgroundColor: colors.surface,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
    borderRadius: 12,
    padding: spacing.md,
    marginBottom: spacing.sm,
  },
  suggestionText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    padding: spacing.lg,
    backgroundColor: colors.surface,
    borderTopWidth: 1,
    borderTopColor: colors.neutral.lightest,
  },
  textInput: {
    flex: 1,
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 20,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
    marginRight: spacing.sm,
    maxHeight: 100,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  sendButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
  },
  sendButtonDisabled: {
    backgroundColor: colors.neutral.medium,
  },
  headerCenter: {
    flex: 1,
    alignItems: 'center',
  },
  queryLimitText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: 2,
  },
  sourceIndicator: {
    ...textStyles.caption,
    color: colors.wisdom,
    marginLeft: spacing.xs,
    fontWeight: '500',
  },
  costIndicator: {
    ...textStyles.caption,
    color: colors.textSecondary,
    marginTop: spacing.xs,
    fontStyle: 'italic',
  },
  faqBrowserContainer: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    marginTop: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  faqBrowserHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
  },
  faqBrowserTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    marginLeft: spacing.xs,
    flex: 1,
    fontWeight: '600',
  },
  faqSearchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    marginBottom: spacing.md,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  faqSearchInput: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    flex: 1,
    marginLeft: spacing.xs,
    paddingVertical: 0,
  },
  faqLoadingContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    padding: spacing.md,
  },
  faqLoadingText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    marginLeft: spacing.sm,
  },
  faqResultsContainer: {
    maxHeight: 200,
  },
  faqResultItem: {
    backgroundColor: colors.backgroundSecondary,
    borderRadius: 8,
    padding: spacing.md,
    marginBottom: spacing.sm,
    borderWidth: 1,
    borderColor: colors.neutral.lightest,
  },
  faqResultQuestion: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '500',
    marginBottom: spacing.xs,
  },
  faqResultCategory: {
    ...textStyles.caption,
    color: colors.wisdom,
    marginBottom: spacing.xs,
  },
  faqResultMeta: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  faqResultConfidence: {
    ...textStyles.caption,
    color: colors.textSecondary,
  },
  faqResultType: {
    ...textStyles.caption,
    color: colors.primary,
    fontWeight: '500',
  },
  faqBrowseButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wisdom + '10',
    borderColor: colors.wisdom,
  },
  faqModeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: colors.wisdom,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: spacing.xs,
  },
});

export default AiChatModal;
