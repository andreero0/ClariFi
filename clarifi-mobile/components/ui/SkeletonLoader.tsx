import React, { useRef, useEffect } from 'react';
import {
  View,
  StyleSheet,
  Animated,
  Dimensions,
  ViewStyle,
} from 'react-native';
import { colors } from '../../constants/colors';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface SkeletonLoaderProps {
  height?: number;
  width?: number | string;
  borderRadius?: number;
  style?: ViewStyle;
  shimmerColors?: string[];
  duration?: number;
}

export const SkeletonLoader: React.FC<SkeletonLoaderProps> = ({
  height = 20,
  width = '100%',
  borderRadius = 4,
  style,
  shimmerColors = [
    colors.neutral?.lightest || '#f8f9fa',
    colors.neutral?.light || '#e2e8f0',
    colors.neutral?.lightest || '#f8f9fa',
  ],
  duration = 1200,
}) => {
  const shimmerAnimation = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    const startShimmer = () => {
      shimmerAnimation.setValue(0);
      Animated.timing(shimmerAnimation, {
        toValue: 1,
        duration,
        useNativeDriver: false,
      }).start(() => startShimmer());
    };

    startShimmer();

    return () => {
      shimmerAnimation.stopAnimation();
    };
  }, [shimmerAnimation, duration]);

  const shimmerTranslate = shimmerAnimation.interpolate({
    inputRange: [0, 1],
    outputRange: [-width, width],
  });

  return (
    <View
      style={[
        styles.skeleton,
        {
          height,
          width,
          borderRadius,
          backgroundColor: shimmerColors[0],
        },
        style,
      ]}
    >
      <Animated.View
        style={[
          styles.shimmer,
          {
            transform: [{ translateX: shimmerTranslate }],
          },
        ]}
      >
        <View
          style={[
            styles.shimmerGradient,
            {
              backgroundColor: shimmerColors[1],
            },
          ]}
        />
      </Animated.View>
    </View>
  );
};

// Pre-built skeleton components for common UI patterns
export const SkeletonText: React.FC<{
  lines?: number;
  lineHeight?: number;
  lastLineWidth?: string;
}> = ({ lines = 1, lineHeight = 16, lastLineWidth = '75%' }) => (
  <View style={styles.textContainer}>
    {Array.from({ length: lines }, (_, index) => (
      <SkeletonLoader
        key={index}
        height={lineHeight}
        width={index === lines - 1 ? lastLineWidth : '100%'}
        style={{ marginBottom: index < lines - 1 ? spacing.xs : 0 }}
      />
    ))}
  </View>
);

export const SkeletonCard: React.FC<{
  height?: number;
  hasHeader?: boolean;
  hasFooter?: boolean;
}> = ({ height = 120, hasHeader = true, hasFooter = false }) => (
  <View style={[styles.card, { height }]}>
    {hasHeader && (
      <View style={styles.cardHeader}>
        <SkeletonLoader height={12} width="60%" />
        <SkeletonLoader height={8} width="30%" style={{ marginTop: spacing.xs }} />
      </View>
    )}
    
    <View style={styles.cardContent}>
      <SkeletonLoader height={40} width="100%" borderRadius={8} />
    </View>

    {hasFooter && (
      <View style={styles.cardFooter}>
        <SkeletonLoader height={10} width="40%" />
      </View>
    )}
  </View>
);

export const SkeletonChart: React.FC<{
  height?: number;
  barCount?: number;
}> = ({ height = 150, barCount = 31 }) => (
  <View style={[styles.chart, { height }]}>
    <View style={styles.chartHeader}>
      <SkeletonLoader height={16} width="40%" />
      <SkeletonLoader height={12} width="25%" />
    </View>
    
    <View style={styles.chartBars}>
      {Array.from({ length: barCount }, (_, index) => (
        <SkeletonLoader
          key={index}
          height={Math.random() * 80 + 20}
          width={4}
          style={{ marginHorizontal: 1 }}
        />
      ))}
    </View>
    
    <View style={styles.chartFooter}>
      <SkeletonLoader height={8} width="100%" />
    </View>
  </View>
);

export const SkeletonTransaction: React.FC = () => (
  <View style={styles.transaction}>
    <View style={styles.transactionIcon}>
      <SkeletonLoader height={32} width={32} borderRadius={16} />
    </View>
    <View style={styles.transactionContent}>
      <SkeletonLoader height={14} width="70%" />
      <SkeletonLoader 
        height={10} 
        width="50%" 
        style={{ marginTop: spacing.xs }} 
      />
    </View>
    <View style={styles.transactionAmount}>
      <SkeletonLoader height={14} width={60} />
    </View>
  </View>
);

export const SkeletonDashboard: React.FC = () => (
  <View style={styles.dashboard}>
    {/* Header */}
    <View style={styles.dashboardHeader}>
      <View>
        <SkeletonLoader height={24} width="60%" />
        <SkeletonLoader 
          height={14} 
          width="80%" 
          style={{ marginTop: spacing.sm }} 
        />
      </View>
      <View style={styles.headerActions}>
        <SkeletonLoader height={40} width={40} borderRadius={20} />
        <SkeletonLoader 
          height={40} 
          width={40} 
          borderRadius={20} 
          style={{ marginLeft: spacing.sm }} 
        />
      </View>
    </View>

    {/* Summary Cards */}
    <View style={styles.summaryCards}>
      <SkeletonCard height={100} />
      <SkeletonCard height={100} />
    </View>

    {/* Chart */}
    <SkeletonChart height={200} />

    {/* Categories */}
    <View style={styles.categories}>
      <SkeletonLoader height={18} width="40%" style={{ marginBottom: spacing.md }} />
      {Array.from({ length: 3 }, (_, index) => (
        <SkeletonCard key={index} height={80} hasHeader={false} />
      ))}
    </View>

    {/* Transactions */}
    <View style={styles.transactions}>
      <SkeletonLoader height={18} width="35%" style={{ marginBottom: spacing.md }} />
      {Array.from({ length: 4 }, (_, index) => (
        <SkeletonTransaction key={index} />
      ))}
    </View>
  </View>
);

export const SkeletonInsights: React.FC = () => (
  <View style={styles.insights}>
    {/* Header */}
    <View style={styles.insightsHeader}>
      <SkeletonLoader height={28} width="50%" />
      <SkeletonLoader 
        height={14} 
        width="70%" 
        style={{ marginTop: spacing.sm }} 
      />
    </View>

    {/* Stats */}
    <View style={styles.insightsStats}>
      {Array.from({ length: 3 }, (_, index) => (
        <View key={index} style={styles.statCard}>
          <SkeletonLoader height={32} width={32} borderRadius={16} />
          <SkeletonLoader 
            height={16} 
            width="80%" 
            style={{ marginTop: spacing.sm }} 
          />
          <SkeletonLoader 
            height={10} 
            width="60%" 
            style={{ marginTop: spacing.xs }} 
          />
        </View>
      ))}
    </View>

    {/* Main Card */}
    <SkeletonCard height={150} hasHeader hasFooter />

    {/* Additional Cards */}
    {Array.from({ length: 2 }, (_, index) => (
      <SkeletonCard key={index} height={120} hasHeader />
    ))}
  </View>
);

const styles = StyleSheet.create({
  skeleton: {
    overflow: 'hidden',
    position: 'relative',
  },
  shimmer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    opacity: 0.5,
  },
  shimmerGradient: {
    flex: 1,
    opacity: 0.8,
  },
  textContainer: {
    // Base container for text skeletons
  },
  card: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 1 },
    shadowOpacity: 0.03,
    shadowRadius: 4,
    elevation: 2,
  },
  cardHeader: {
    marginBottom: spacing.md,
  },
  cardContent: {
    flex: 1,
    justifyContent: 'center',
  },
  cardFooter: {
    marginTop: spacing.md,
  },
  chart: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.lg,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.md,
  },
  chartHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.lg,
  },
  chartBars: {
    flexDirection: 'row',
    alignItems: 'flex-end',
    height: 100,
    marginBottom: spacing.md,
  },
  chartFooter: {
    // Footer for chart legends
  },
  transaction: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: spacing.md,
    backgroundColor: colors.surface,
    borderRadius: 8,
    marginBottom: spacing.sm,
  },
  transactionIcon: {
    marginRight: spacing.md,
  },
  transactionContent: {
    flex: 1,
  },
  transactionAmount: {
    alignItems: 'flex-end',
  },
  dashboard: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary || '#fafbfd',
  },
  dashboardHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
  },
  headerActions: {
    flexDirection: 'row',
  },
  summaryCards: {
    flexDirection: 'row',
    paddingHorizontal: spacing.lg,
    gap: spacing.md,
  },
  categories: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  transactions: {
    paddingHorizontal: spacing.lg,
    marginTop: spacing.lg,
  },
  insights: {
    flex: 1,
    backgroundColor: colors.backgroundPrimary || '#fafbfd',
    paddingHorizontal: spacing.lg,
  },
  insightsHeader: {
    paddingVertical: spacing.lg,
    backgroundColor: colors.surface,
    marginHorizontal: -spacing.lg,
    paddingHorizontal: spacing.lg,
    marginBottom: spacing.md,
  },
  insightsStats: {
    flexDirection: 'row',
    gap: spacing.sm,
    marginBottom: spacing.lg,
  },
  statCard: {
    flex: 1,
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: spacing.md,
    alignItems: 'center',
  },
});