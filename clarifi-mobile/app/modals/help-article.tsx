import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Button as CustomButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import {
  ArrowLeft,
  Clock,
  Eye,
  ThumbsUp,
  ThumbsDown,
  Loader,
  FileText,
  Mail,
} from 'lucide-react-native';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  HelpContentService,
  HelpArticle,
} from '../../services/support/HelpContentService';

export default function HelpArticleScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id: articleId } = useLocalSearchParams<{ id: string }>();

  const [article, setArticle] = useState<HelpArticle | null>(null);
  const [relatedArticles, setRelatedArticles] = useState<HelpArticle[]>([]);
  const [loading, setLoading] = useState(true);
  const [hasRated, setHasRated] = useState(false);

  useEffect(() => {
    loadArticle();
  }, [articleId]);

  const loadArticle = async () => {
    if (!articleId) return;

    setLoading(true);
    try {
      const articleData = await HelpContentService.getArticle(articleId);
      setArticle(articleData);

      if (articleData) {
        const related = await HelpContentService.getRelatedArticles(articleId);
        setRelatedArticles(related);
      }
    } catch (error) {
      console.error('Error loading article:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleRating = async (helpful: boolean) => {
    if (!article || hasRated) return;

    try {
      await HelpContentService.rateArticle(article.id, helpful);
      setHasRated(true);

      // Update local state to reflect the rating
      setArticle(prev => {
        if (!prev) return prev;
        return {
          ...prev,
          helpful: helpful ? prev.helpful + 1 : prev.helpful,
          notHelpful: helpful ? prev.notHelpful : prev.notHelpful + 1,
        };
      });

      Alert.alert(
        'Thank you!',
        'Your feedback helps us improve our help content.',
        [{ text: 'OK' }]
      );
    } catch (error) {
      console.error('Error rating article:', error);
    }
  };

  const handleRelatedArticlePress = (relatedArticleId: string) => {
    router.push(`/modals/help-article?id=${relatedArticleId}`);
  };

  const handleBackPress = () => {
    router.back();
  };

  const handleContactSupport = () => {
    router.push('/modals/contact-support');
  };

  const formatMarkdownText = (text: string): string => {
    // Simple markdown rendering for basic formatting
    return text
      .replace(/^# (.*$)/gim, '$1') // H1
      .replace(/^## (.*$)/gim, '$1') // H2
      .replace(/^### (.*$)/gim, '$1') // H3
      .replace(/\*\*(.*)\*\*/gim, '$1') // Bold
      .replace(/\*(.*)\*/gim, '$1'); // Italic
  };

  const renderContent = (content: string) => {
    const lines = content.split('\n');
    const elements: JSX.Element[] = [];

    lines.forEach((line, index) => {
      if (line.startsWith('# ')) {
        elements.push(
          <Text key={index} style={styles.contentH1}>
            {line.substring(2)}
          </Text>
        );
      } else if (line.startsWith('## ')) {
        elements.push(
          <Text key={index} style={styles.contentH2}>
            {line.substring(3)}
          </Text>
        );
      } else if (line.startsWith('### ')) {
        elements.push(
          <Text key={index} style={styles.contentH3}>
            {line.substring(4)}
          </Text>
        );
      } else if (line.match(/^\d+\./)) {
        elements.push(
          <Text key={index} style={styles.contentListItem}>
            {line}
          </Text>
        );
      } else if (line.startsWith('- ')) {
        elements.push(
          <Text key={index} style={styles.contentListItem}>
            • {line.substring(2)}
          </Text>
        );
      } else if (line.trim() === '') {
        elements.push(<View key={index} style={styles.contentSpacing} />);
      } else {
        elements.push(
          <Text key={index} style={styles.contentBody}>
            {formatMarkdownText(line)}
          </Text>
        );
      }
    });

    return elements;
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      alignSelf: 'flex-start',
    },
    backButtonText: {
      ...textStyles.bodyMedium,
      color: theme.primary,
      marginLeft: spacing.xs,
    },
    articleTitle: {
      ...textStyles.h1,
      color: theme.textPrimary,
      marginBottom: spacing.md,
    },
    articleMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.lg,
    },
    articleMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    difficultyBadge: {
      paddingHorizontal: spacing.sm,
      paddingVertical: spacing.xs,
      borderRadius: 12,
      marginRight: spacing.md,
    },
    difficultyBeginner: {
      backgroundColor: theme.success,
    },
    difficultyIntermediate: {
      backgroundColor: '#FF9500',
    },
    difficultyAdvanced: {
      backgroundColor: theme.error,
    },
    difficultyText: {
      ...textStyles.caption,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    metaText: {
      ...textStyles.caption,
      color: theme.textTertiary,
      marginLeft: spacing.xs,
    },
    content: {
      flex: 1,
    },
    articleContent: {
      padding: spacing.lg,
    },
    contentH1: {
      ...textStyles.h2,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      marginTop: spacing.lg,
    },
    contentH2: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.sm,
      marginTop: spacing.lg,
    },
    contentH3: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginBottom: spacing.sm,
      marginTop: spacing.md,
      fontWeight: '600',
    },
    contentBody: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginBottom: spacing.sm,
      lineHeight: 24,
    },
    contentListItem: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginBottom: spacing.xs,
      marginLeft: spacing.md,
      lineHeight: 22,
    },
    contentSpacing: {
      height: spacing.md,
    },
    ratingSection: {
      backgroundColor: theme.backgroundSecondary,
      margin: spacing.lg,
      borderRadius: 12,
      padding: spacing.lg,
    },
    ratingTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    ratingQuestion: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    ratingButtons: {
      flexDirection: 'row',
      justifyContent: 'center',
      gap: spacing.md,
    },
    ratingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderRadius: 25,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: 'transparent',
    },
    ratingButtonActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    ratingButtonText: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginLeft: spacing.sm,
    },
    ratingButtonTextActive: {
      color: '#FFFFFF',
    },
    ratingStats: {
      flexDirection: 'row',
      justifyContent: 'center',
      marginTop: spacing.md,
      gap: spacing.lg,
    },
    ratingStatItem: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    ratingStatText: {
      ...textStyles.bodySmall,
      color: theme.textTertiary,
      marginLeft: spacing.xs,
    },
    relatedSection: {
      padding: spacing.lg,
    },
    relatedTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
    },
    relatedArticle: {
      marginBottom: spacing.md,
    },
    relatedArticleContent: {
      padding: spacing.md,
    },
    relatedArticleTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginBottom: spacing.xs,
    },
    relatedArticleSummary: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
    },
    supportSection: {
      backgroundColor: theme.backgroundSecondary,
      margin: spacing.lg,
      borderRadius: 12,
      padding: spacing.lg,
    },
    supportTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    supportText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
    loadingContainer: {
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginTop: spacing.md,
    },
  });

  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return styles.difficultyBeginner;
      case 'intermediate':
        return styles.difficultyIntermediate;
      case 'advanced':
        return styles.difficultyAdvanced;
      default:
        return styles.difficultyBeginner;
    }
  };

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name={Loader} size={32} color={theme.textTertiary} />
          <Text style={styles.loadingText}>Loading article...</Text>
        </View>
      </View>
    );
  }

  if (!article) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name={FileText} size={48} color={theme.textTertiary} />
          <Text style={styles.emptyText}>Article not found</Text>
          <CustomButton
            title="Back to Help Center"
            onPress={handleBackPress}
            variant="outline"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name={ArrowLeft} size={20} color={theme.primary} />
          <Text style={styles.backButtonText}>Back</Text>
        </TouchableOpacity>

        <Text style={styles.articleTitle}>{article.title}</Text>

        <View style={styles.articleMeta}>
          <View style={styles.articleMetaLeft}>
            <View
              style={[
                styles.difficultyBadge,
                getDifficultyBadgeStyle(article.difficulty),
              ]}
            >
              <Text style={styles.difficultyText}>
                {article.difficulty.toUpperCase()}
              </Text>
            </View>

            <Icon name={Clock} size={14} color={theme.textTertiary} />
            <Text style={styles.metaText}>
              {article.estimatedReadTime} min read
            </Text>
          </View>

          <View style={styles.articleMetaLeft}>
            <Icon name={Eye} size={14} color={theme.textTertiary} />
            <Text style={styles.metaText}>{article.views} views</Text>
          </View>
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.articleContent}>
          {renderContent(article.content)}
        </View>

        {!hasRated && (
          <View style={styles.ratingSection}>
            <Text style={styles.ratingTitle}>Was this helpful?</Text>
            <Text style={styles.ratingQuestion}>
              Let us know if this article helped solve your question
            </Text>

            <View style={styles.ratingButtons}>
              <TouchableOpacity
                style={styles.ratingButton}
                onPress={() => handleRating(true)}
                activeOpacity={0.7}
              >
                <Icon name={ThumbsUp} size={20} color={theme.success} />
                <Text style={styles.ratingButtonText}>Yes, helpful</Text>
              </TouchableOpacity>

              <TouchableOpacity
                style={styles.ratingButton}
                onPress={() => handleRating(false)}
                activeOpacity={0.7}
              >
                <Icon name={ThumbsDown} size={20} color={theme.error} />
                <Text style={styles.ratingButtonText}>Not helpful</Text>
              </TouchableOpacity>
            </View>
          </View>
        )}

        <View style={styles.ratingStats}>
          <View style={styles.ratingStatItem}>
            <Icon name={ThumbsUp} size={14} color={theme.success} />
            <Text style={styles.ratingStatText}>{article.helpful} helpful</Text>
          </View>

          <View style={styles.ratingStatItem}>
            <Icon name={ThumbsDown} size={14} color={theme.error} />
            <Text style={styles.ratingStatText}>
              {article.notHelpful} not helpful
            </Text>
          </View>
        </View>

        {relatedArticles.length > 0 && (
          <View style={styles.relatedSection}>
            <Text style={styles.relatedTitle}>Related Articles</Text>

            {relatedArticles.map(relatedArticle => (
              <TouchableOpacity
                key={relatedArticle.id}
                style={styles.relatedArticle}
                onPress={() => handleRelatedArticlePress(relatedArticle.id)}
                activeOpacity={0.7}
              >
                <Card>
                  <View style={styles.relatedArticleContent}>
                    <Text style={styles.relatedArticleTitle}>
                      {relatedArticle.title}
                    </Text>
                    <Text style={styles.relatedArticleSummary}>
                      {relatedArticle.summary}
                    </Text>
                  </View>
                </Card>
              </TouchableOpacity>
            ))}
          </View>
        )}

        <View style={styles.supportSection}>
          <Text style={styles.supportTitle}>Still need help?</Text>
          <Text style={styles.supportText}>
            Can't find what you're looking for? Our support team is here to
            help.
          </Text>

          <CustomButton
            title="Contact Support"
            onPress={handleContactSupport}
            variant="primary"
            icon={Mail}
          />
        </View>
      </ScrollView>
    </View>
  );
}
