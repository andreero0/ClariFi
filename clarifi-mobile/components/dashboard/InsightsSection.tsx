import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import { IconWithBackground } from '../ui/IconWithBackground';

interface Insight {
  id: string;
  type: 'warning' | 'tip' | 'achievement';
  title: string;
  description: string;
  actionText?: string;
  onAction?: () => void;
  priority: 'high' | 'medium' | 'low';
}

interface InsightsSectionProps {
  insights: Insight[];
}

export const InsightsSection: React.FC<InsightsSectionProps> = ({
  insights,
}) => {
  const getInsightIcon = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return 'warning-outline';
      case 'tip':
        return 'bulb-outline';
      case 'achievement':
        return 'trophy-outline';
      default:
        return 'information-circle-outline';
    }
  };

  const getInsightColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return '#F59E0B';
      case 'tip':
        return '#2B5CE6';
      case 'achievement':
        return '#00C896';
      default:
        return '#718096';
    }
  };

  const getInsightIconVariant = (type: Insight['type']): 'default' | 'success' | 'error' | 'warning' | 'brand' => {
    switch (type) {
      case 'warning':
        return 'error';
      case 'tip':
        return 'brand';
      case 'achievement':
        return 'success';
      default:
        return 'default';
    }
  };

  const getInsightBackgroundStyle = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return {
          backgroundColor: '#FEF2F2',
          borderColor: '#FCA5A5',
          borderWidth: 1,
        };
      case 'tip':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#86EFAC',
          borderWidth: 1,
        };
      case 'achievement':
        return {
          backgroundColor: '#F0FDF4',
          borderColor: '#86EFAC', 
          borderWidth: 1,
        };
      default:
        return {};
    }
  };

  const getInsightTextColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return '#B91C1C';
      case 'tip':
        return '#15803D';
      case 'achievement':
        return '#15803D';
      default:
        return '#1A1F36';
    }
  };

  const getInsightDescriptionColor = (type: Insight['type']) => {
    switch (type) {
      case 'warning':
        return '#DC2626';
      case 'tip':
        return '#16A34A';
      case 'achievement':
        return '#16A34A';
      default:
        return '#4B5563';
    }
  };

  const renderInsight = (insight: Insight) => {
    const iconName = getInsightIcon(insight.type);
    const color = getInsightColor(insight.type);

    return (
      <View key={insight.id} style={[
        styles.insightCard,
        getInsightBackgroundStyle(insight.type)
      ]}>
        <View style={styles.insightHeader}>
          <IconWithBackground
            variant={getInsightIconVariant(insight.type)}
            icon={<Ionicons name={iconName as any} />}
          />
          <Text style={[styles.insightTitle, { color: getInsightTextColor(insight.type) }]}>
            {insight.title}
          </Text>
        </View>
        <Text style={[styles.insightDescription, { color: getInsightDescriptionColor(insight.type) }]}>
          {insight.description}
        </Text>
      </View>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Insights</Text>
        <TouchableOpacity style={styles.viewAllButton}>
          <Text style={styles.viewAllText}>View All</Text>
          <Ionicons name="chevron-forward" size={16} color="#2B5CE6" />
        </TouchableOpacity>
      </View>
      
      <View style={styles.insightsList}>
        {insights.slice(0, 3).map(renderInsight)}
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    marginHorizontal: 24,
    marginBottom: 24,
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
  viewAllButton: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 4,
  },
  viewAllText: {
    fontSize: 13,
    fontWeight: '500',
    color: '#2B5CE6',
  },
  insightsList: {
    gap: 12,
  },
  insightCard: {
    borderRadius: 8,
    padding: 16,
    marginBottom: 12,
  },
  insightHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 8,
    marginBottom: 12,
  },
  insightTitle: {
    fontSize: 14,
    fontWeight: '600',
    flex: 1,
  },
  insightDescription: {
    fontSize: 14,
    fontWeight: '400',
    lineHeight: 20,
  },
});
