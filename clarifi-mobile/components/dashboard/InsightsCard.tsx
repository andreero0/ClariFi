import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  ScrollView,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

export type InsightPriority = 'high' | 'medium' | 'low';
export type InsightType = 'warning' | 'tip' | 'achievement' | 'reminder';

export interface Insight {
  id: string;
  type: InsightType;
  priority: InsightPriority;
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  dismissible?: boolean;
  createdAt: Date;
}

interface InsightsCardProps {
  insights: Insight[];
  onInsightPress?: (insight: Insight) => void;
  onDismiss?: (insightId: string) => void;
  maxVisible?: number;
}

export const InsightsCard: React.FC<InsightsCardProps> = ({
  insights,
  onInsightPress,
  onDismiss,
  maxVisible = 3,
}) => {
  const [visibleInsights, setVisibleInsights] = useState(insights.slice(0, maxVisible));
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(30)).current;
  const insightAnims = useRef(
    insights.reduce((acc, insight) => ({
      ...acc,
      [insight.id]: {
        opacity: new Animated.Value(0),
        scale: new Animated.Value(0.9),
        translateX: new Animated.Value(-20),
      },
    }), {})
  ).current;

  useEffect(() => {
    setVisibleInsights(insights.slice(0, maxVisible));
    
    // Animate container in
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 400,
        useNativeDriver: true,
      }),
      Animated.spring(slideAnim, {
        toValue: 0,
        friction: 8,
        tension: 50,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Stagger insight animations
      const animations = visibleInsights.map((insight, index) => {
        const anim = insightAnims[insight.id];
        return Animated.parallel([
          Animated.timing(anim.opacity, {
            toValue: 1,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
          }),
          Animated.spring(anim.scale, {
            toValue: 1,
            friction: 8,
            tension: 40,
            delay: index * 100,
            useNativeDriver: true,
          }),
          Animated.timing(anim.translateX, {
            toValue: 0,
            duration: 300,
            delay: index * 100,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.stagger(100, animations).start();
    });
  }, [insights, maxVisible]);

  const getPriorityColor = (priority: InsightPriority) => {
    switch (priority) {
      case 'high': return '#E53E3E';
      case 'medium': return '#F59E0B';
      case 'low': return '#2B5CE6';
      default: return '#718096';
    }
  };

  const getTypeIcon = (type: InsightType) => {
    switch (type) {
      case 'warning': return 'warning-outline';
      case 'tip': return 'bulb-outline';
      case 'achievement': return 'trophy-outline';
      case 'reminder': return 'time-outline';
      default: return 'information-circle-outline';
    }
  };

  const getTypeColor = (type: InsightType) => {
    switch (type) {
      case 'warning': return '#E53E3E';
      case 'tip': return '#00C896';
      case 'achievement': return '#6B5DD3';
      case 'reminder': return '#2B5CE6';
      default: return '#718096';
    }
  };

  const handleInsightPress = (insight: Insight) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Bounce animation
    const anim = insightAnims[insight.id];
    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anim.scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onInsightPress?.(insight);
  };

  const handleDismiss = (insight: Insight) => {
    if (!insight.dismissible) return;

    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    const anim = insightAnims[insight.id];
    Animated.parallel([
      Animated.timing(anim.opacity, {
        toValue: 0,
        duration: 200,
        useNativeDriver: true,
      }),
      Animated.timing(anim.translateX, {
        toValue: 100,
        duration: 200,
        useNativeDriver: true,
      }),
    ]).start(() => {
      onDismiss?.(insight.id);
      setVisibleInsights(prev => prev.filter(i => i.id !== insight.id));
    });
  };

  const handleAction = (insight: Insight) => {
    if (insight.onAction) {
      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
      insight.onAction();
    }
  };

  const getTimeSince = (date: Date) => {
    const now = new Date();
    const diffMs = now.getTime() - date.getTime();
    const diffHours = Math.floor(diffMs / (1000 * 60 * 60));
    const diffDays = Math.floor(diffHours / 24);

    if (diffDays > 0) return `${diffDays}d ago`;
    if (diffHours > 0) return `${diffHours}h ago`;
    return 'Just now';
  };

  if (visibleInsights.length === 0) {
    return (
      <View style={styles.container}>
        <View style={styles.header}>
          <Text style={styles.title}>Insights</Text>
        </View>
        <View style={styles.emptyState}>
          <Ionicons name="analytics-outline" size={48} color="#CBD5E0" />
          <Text style={styles.emptyTitle}>No insights yet</Text>
          <Text style={styles.emptyDescription}>
            We'll analyze your spending patterns and provide personalized insights here.
          </Text>
        </View>
      </View>
    );
  }

  return (
    <Animated.View
      style={[
        styles.container,
        {
          opacity: fadeAnim,
          transform: [{ translateY: slideAnim }],
        },
      ]}
    >
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity style={styles.seeAllButton}>
          <Text style={styles.seeAllText}>See All</Text>
          <Ionicons name="chevron-forward" size={16} color="#2B5CE6" />
        </TouchableOpacity>
      </View>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.scrollContent}
        snapToInterval={280}
        decelerationRate="fast"
      >
        {visibleInsights
          .sort((a, b) => {
            const priorityOrder = { high: 3, medium: 2, low: 1 };
            return priorityOrder[b.priority] - priorityOrder[a.priority];
          })
          .map((insight, index) => (
            <Animated.View
              key={insight.id}
              style={[
                styles.insightWrapper,
                {
                  opacity: insightAnims[insight.id]?.opacity || 1,
                  transform: [
                    { scale: insightAnims[insight.id]?.scale || 1 },
                    { translateX: insightAnims[insight.id]?.translateX || 0 },
                  ],
                },
              ]}
            >
              <TouchableOpacity
                style={[
                  styles.insightCard,
                  { borderLeftColor: getPriorityColor(insight.priority) },
                ]}
                onPress={() => handleInsightPress(insight)}
                activeOpacity={0.9}
              >
                <View style={styles.insightHeader}>
                  <View style={styles.iconContainer}>
                    <View
                      style={[
                        styles.iconBackground,
                        { backgroundColor: `${getTypeColor(insight.type)}15` },
                      ]}
                    >
                      <Ionicons
                        name={getTypeIcon(insight.type) as any}
                        size={20}
                        color={getTypeColor(insight.type)}
                      />
                    </View>
                    <View style={styles.textContainer}>
                      <Text style={styles.insightTitle}>{insight.title}</Text>
                      <Text style={styles.timestamp}>{getTimeSince(insight.createdAt)}</Text>
                    </View>
                  </View>

                  {insight.dismissible && (
                    <TouchableOpacity
                      style={styles.dismissButton}
                      onPress={() => handleDismiss(insight)}
                    >
                      <Ionicons name="close" size={16} color="#CBD5E0" />
                    </TouchableOpacity>
                  )}
                </View>

                <Text style={styles.insightDescription} numberOfLines={3}>
                  {insight.description}
                </Text>

                <View style={styles.insightFooter}>
                  <View
                    style={[
                      styles.priorityBadge,
                      { backgroundColor: `${getPriorityColor(insight.priority)}15` },
                    ]}
                  >
                    <Text
                      style={[
                        styles.priorityText,
                        { color: getPriorityColor(insight.priority) },
                      ]}
                    >
                      {insight.priority.toUpperCase()}
                    </Text>
                  </View>

                  {insight.actionText && (
                    <TouchableOpacity
                      style={styles.actionButton}
                      onPress={() => handleAction(insight)}
                    >
                      <Text style={styles.actionText}>{insight.actionText}</Text>
                      <Ionicons name="arrow-forward" size={14} color="#2B5CE6" />
                    </TouchableOpacity>
                  )}
                </View>
              </TouchableOpacity>
            </Animated.View>
          ))}
      </ScrollView>

      {insights.length > maxVisible && (
        <View style={styles.moreIndicator}>
          <Text style={styles.moreText}>+{insights.length - maxVisible} more insights</Text>
        </View>
      )}
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 32,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
  },
  seeAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  seeAllText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#2B5CE6',
  },
  scrollContent: {
    paddingRight: 24,
  },
  insightWrapper: {
    width: 280,
    marginRight: 16,
  },
  insightCard: {
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    padding: 16,
    borderLeftWidth: 4,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  insightHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    marginBottom: 12,
  },
  iconContainer: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    flex: 1,
  },
  iconBackground: {
    width: 36,
    height: 36,
    borderRadius: 10,
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 12,
  },
  textContainer: {
    flex: 1,
  },
  insightTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1A1F36',
    marginBottom: 2,
  },
  timestamp: {
    fontSize: 12,
    fontWeight: '400',
    color: '#718096',
  },
  dismissButton: {
    padding: 4,
  },
  insightDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#4A5568',
    lineHeight: 20,
    marginBottom: 16,
  },
  insightFooter: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
  },
  priorityBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
  },
  priorityText: {
    fontSize: 10,
    fontWeight: '700',
    letterSpacing: 0.5,
  },
  actionButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  actionText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#2B5CE6',
  },
  moreIndicator: {
    alignItems: 'center',
    marginTop: 12,
  },
  moreText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#718096',
  },
  emptyState: {
    alignItems: 'center',
    paddingVertical: 48,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  emptyTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
    marginTop: 16,
    marginBottom: 8,
  },
  emptyDescription: {
    fontSize: 14,
    fontWeight: '400',
    color: '#718096',
    textAlign: 'center',
    paddingHorizontal: 24,
    lineHeight: 20,
  },
});