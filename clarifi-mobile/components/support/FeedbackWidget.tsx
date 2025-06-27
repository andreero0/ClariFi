/**
 * Feedback Widget Component
 * Allows users to rate help content and provide optional comments
 */

import React, { useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  TextInput,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { Icon } from '../ui/Icon';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

interface FeedbackWidgetProps {
  contentId: string;
  contentType: 'article' | 'faq';
  title: string;
  category?: string;
  onFeedbackSubmitted?: (feedback: FeedbackData) => void;
  initialHelpfulCount?: number;
  initialNotHelpfulCount?: number;
}

export interface FeedbackData {
  contentId: string;
  contentType: 'article' | 'faq';
  rating: 'helpful' | 'not-helpful';
  comment?: string;
  category?: string;
}

export function FeedbackWidget({
  contentId,
  contentType,
  title,
  category,
  onFeedbackSubmitted,
  initialHelpfulCount = 0,
  initialNotHelpfulCount = 0,
}: FeedbackWidgetProps) {
  const { theme } = useTheme();
  const [userRating, setUserRating] = useState<
    'helpful' | 'not-helpful' | null
  >(null);
  const [showCommentInput, setShowCommentInput] = useState(false);
  const [comment, setComment] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [hasSubmitted, setHasSubmitted] = useState(false);
  const [helpfulCount, setHelpfulCount] = useState(initialHelpfulCount);
  const [notHelpfulCount, setNotHelpfulCount] = useState(
    initialNotHelpfulCount
  );

  const handleRatingPress = (rating: 'helpful' | 'not-helpful') => {
    if (hasSubmitted) return;

    setUserRating(rating);

    if (rating === 'not-helpful') {
      setShowCommentInput(true);
    } else {
      // For helpful ratings, submit immediately
      submitFeedback(rating);
    }
  };

  const submitFeedback = async (
    rating: 'helpful' | 'not-helpful',
    commentText?: string
  ) => {
    if (isSubmitting || hasSubmitted) return;

    setIsSubmitting(true);

    try {
      const feedbackData: FeedbackData = {
        contentId,
        contentType,
        rating,
        comment: commentText || comment,
        category,
      };

      // Update local counts
      if (rating === 'helpful') {
        setHelpfulCount(prev => prev + 1);
      } else {
        setNotHelpfulCount(prev => prev + 1);
      }

      // Call the callback
      onFeedbackSubmitted?.(feedbackData);

      setHasSubmitted(true);
      setShowCommentInput(false);

      // Show success message
      Alert.alert(
        'Thank you!',
        'Your feedback helps us improve our help content.',
        [{ text: 'OK', style: 'default' }]
      );
    } catch (error) {
      console.error('Error submitting feedback:', error);
      Alert.alert('Error', 'Unable to submit feedback. Please try again.', [
        { text: 'OK', style: 'default' },
      ]);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleCommentSubmit = () => {
    if (userRating) {
      submitFeedback(userRating, comment);
    }
  };

  const handleSkipComment = () => {
    if (userRating) {
      submitFeedback(userRating, '');
    }
  };

  const totalFeedback = helpfulCount + notHelpfulCount;
  const helpfulPercentage =
    totalFeedback > 0 ? Math.round((helpfulCount / totalFeedback) * 100) : 0;

  const styles = StyleSheet.create({
    container: {
      marginTop: spacing.lg,
      marginBottom: spacing.md,
    },
    card: {
      padding: spacing.md,
      backgroundColor: theme.backgroundSecondary,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    headerText: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginLeft: spacing.xs,
      flex: 1,
    },
    ratingContainer: {
      flexDirection: 'row',
      justifyContent: 'space-around',
      marginBottom: spacing.md,
    },
    ratingButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingVertical: spacing.sm,
      paddingHorizontal: spacing.md,
      borderRadius: 8,
      borderWidth: 1,
      borderColor: theme.border,
      backgroundColor: theme.backgroundPrimary,
      minWidth: 120,
      justifyContent: 'center',
    },
    ratingButtonSelected: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    ratingButtonDisabled: {
      opacity: 0.5,
    },
    ratingText: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginLeft: spacing.xs,
    },
    ratingTextSelected: {
      color: theme.textInverse,
    },
    commentContainer: {
      marginTop: spacing.md,
    },
    commentLabel: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginBottom: spacing.xs,
    },
    commentInput: {
      borderWidth: 1,
      borderColor: theme.border,
      borderRadius: 8,
      padding: spacing.sm,
      backgroundColor: theme.backgroundPrimary,
      color: theme.textPrimary,
      textAlignVertical: 'top',
      minHeight: 80,
      ...textStyles.bodyRegular,
    },
    commentActions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginTop: spacing.sm,
    },
    skipButton: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    },
    skipButtonText: {
      color: theme.textSecondary,
    },
    statsContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      justifyContent: 'center',
      marginTop: spacing.sm,
      paddingTop: spacing.sm,
      borderTopWidth: 1,
      borderTopColor: theme.border,
    },
    statsText: {
      ...textStyles.caption,
      color: theme.textSecondary,
      textAlign: 'center',
    },
    thankyouContainer: {
      alignItems: 'center',
      padding: spacing.md,
    },
    thankyouText: {
      ...textStyles.bodyMedium,
      color: theme.success,
      textAlign: 'center',
    },
  });

  if (hasSubmitted) {
    return (
      <View style={styles.container}>
        <Card style={styles.card}>
          <View style={styles.thankyouContainer}>
            <Icon name="check-circle" size={24} color={theme.success} />
            <Text style={styles.thankyouText}>
              Thank you for your feedback!
            </Text>
            {totalFeedback > 0 && (
              <View style={styles.statsContainer}>
                <Text style={styles.statsText}>
                  {helpfulPercentage}% found this helpful ({totalFeedback}{' '}
                  responses)
                </Text>
              </View>
            )}
          </View>
        </Card>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <Card style={styles.card}>
        <View style={styles.header}>
          <Icon name="help-circle" size={20} color={theme.textSecondary} />
          <Text style={styles.headerText}>Was this {contentType} helpful?</Text>
        </View>

        <View style={styles.ratingContainer}>
          <TouchableOpacity
            style={[
              styles.ratingButton,
              userRating === 'helpful' && styles.ratingButtonSelected,
              hasSubmitted && styles.ratingButtonDisabled,
            ]}
            onPress={() => handleRatingPress('helpful')}
            disabled={isSubmitting || hasSubmitted}
          >
            <Icon
              name="thumbs-up"
              size={18}
              color={
                userRating === 'helpful' ? theme.textInverse : theme.success
              }
            />
            <Text
              style={[
                styles.ratingText,
                userRating === 'helpful' && styles.ratingTextSelected,
              ]}
            >
              Yes ({helpfulCount})
            </Text>
          </TouchableOpacity>

          <TouchableOpacity
            style={[
              styles.ratingButton,
              userRating === 'not-helpful' && styles.ratingButtonSelected,
              hasSubmitted && styles.ratingButtonDisabled,
            ]}
            onPress={() => handleRatingPress('not-helpful')}
            disabled={isSubmitting || hasSubmitted}
          >
            <Icon
              name="thumbs-down"
              size={18}
              color={
                userRating === 'not-helpful' ? theme.textInverse : theme.error
              }
            />
            <Text
              style={[
                styles.ratingText,
                userRating === 'not-helpful' && styles.ratingTextSelected,
              ]}
            >
              No ({notHelpfulCount})
            </Text>
          </TouchableOpacity>
        </View>

        {showCommentInput && (
          <View style={styles.commentContainer}>
            <Text style={styles.commentLabel}>
              How can we improve this {contentType}? (Optional)
            </Text>
            <TextInput
              style={styles.commentInput}
              value={comment}
              onChangeText={setComment}
              placeholder="Tell us what was confusing or missing..."
              placeholderTextColor={theme.textSecondary}
              multiline
              maxLength={500}
            />
            <View style={styles.commentActions}>
              <Button
                title="Skip"
                onPress={handleSkipComment}
                variant="secondary"
                style={styles.skipButton}
                textStyle={styles.skipButtonText}
                disabled={isSubmitting}
              />
              <Button
                title="Submit Feedback"
                onPress={handleCommentSubmit}
                loading={isSubmitting}
                disabled={isSubmitting}
              />
            </View>
          </View>
        )}

        {totalFeedback > 0 && !showCommentInput && (
          <View style={styles.statsContainer}>
            <Text style={styles.statsText}>
              {helpfulPercentage}% found this helpful ({totalFeedback}{' '}
              responses)
            </Text>
          </View>
        )}
      </Card>
    </View>
  );
}
