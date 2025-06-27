import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Dimensions,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';

export interface TooltipData {
  id: string;
  title: string;
  content: string;
  helpArticleId?: string;
  category: 'financial' | 'feature' | 'navigation' | 'security' | 'tips';
  priority: 'low' | 'medium' | 'high';
  showOnce?: boolean;
}

export interface TooltipPosition {
  x: number;
  y: number;
  width: number;
  height: number;
}

interface TooltipSystemProps {
  tooltipData: TooltipData;
  targetPosition: TooltipPosition;
  visible: boolean;
  onDismiss: () => void;
  onLearnMore?: () => void;
  placement?: 'top' | 'bottom' | 'left' | 'right' | 'auto';
}

const { width: screenWidth, height: screenHeight } = Dimensions.get('window');

export const TooltipSystem: React.FC<TooltipSystemProps> = ({
  tooltipData,
  targetPosition,
  visible,
  onDismiss,
  onLearnMore,
  placement = 'auto',
}) => {
  const { theme } = useTheme();
  const [calculatedPlacement, setCalculatedPlacement] = useState<
    'top' | 'bottom' | 'left' | 'right'
  >('bottom');
  const [tooltipDimensions, setTooltipDimensions] = useState({
    width: 0,
    height: 0,
  });
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;

  useEffect(() => {
    if (visible) {
      const optimalPlacement = calculateOptimalPlacement();
      setCalculatedPlacement(optimalPlacement);

      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    } else {
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(scaleAnim, {
          toValue: 0.8,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const calculateOptimalPlacement = (): 'top' | 'bottom' | 'left' | 'right' => {
    if (placement !== 'auto') return placement;

    const tooltipWidth = 280;
    const tooltipHeight = 120;
    const margin = 20;

    const spaceTop = targetPosition.y - margin;
    const spaceBottom =
      screenHeight - (targetPosition.y + targetPosition.height) - margin;
    const spaceLeft = targetPosition.x - margin;
    const spaceRight =
      screenWidth - (targetPosition.x + targetPosition.width) - margin;

    if (spaceBottom >= tooltipHeight) return 'bottom';
    if (spaceTop >= tooltipHeight) return 'top';
    if (spaceRight >= tooltipWidth) return 'right';
    if (spaceLeft >= tooltipWidth) return 'left';

    return 'bottom';
  };

  const getTooltipStyle = () => {
    const tooltipWidth = Math.min(280, screenWidth - 40);
    const arrowSize = 8;
    let left = 0;
    let top = 0;

    switch (calculatedPlacement) {
      case 'top':
        left = targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2;
        top = targetPosition.y - tooltipDimensions.height - arrowSize - 5;
        break;
      case 'bottom':
        left = targetPosition.x + targetPosition.width / 2 - tooltipWidth / 2;
        top = targetPosition.y + targetPosition.height + arrowSize + 5;
        break;
      case 'left':
        left = targetPosition.x - tooltipWidth - arrowSize - 5;
        top =
          targetPosition.y +
          targetPosition.height / 2 -
          tooltipDimensions.height / 2;
        break;
      case 'right':
        left = targetPosition.x + targetPosition.width + arrowSize + 5;
        top =
          targetPosition.y +
          targetPosition.height / 2 -
          tooltipDimensions.height / 2;
        break;
    }

    left = Math.max(
      spacing.md,
      Math.min(left, screenWidth - tooltipWidth - spacing.md)
    );
    top = Math.max(
      spacing.md,
      Math.min(top, screenHeight - tooltipDimensions.height - spacing.md)
    );

    return {
      position: 'absolute' as const,
      left,
      top,
      width: tooltipWidth,
      maxWidth: tooltipWidth,
    };
  };

  const getCategoryIcon = (category: string) => {
    switch (category) {
      case 'financial':
        return '💰';
      case 'feature':
        return '⚡';
      case 'navigation':
        return '🧭';
      case 'security':
        return '🛡️';
      case 'tips':
        return '💡';
      default:
        return '❓';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'financial':
        return '#28a745';
      case 'feature':
        return '#007bff';
      case 'navigation':
        return '#6f42c1';
      case 'security':
        return '#dc3545';
      case 'tips':
        return '#ffc107';
      default:
        return theme.primary;
    }
  };

  const handleLearnMore = () => {
    onLearnMore?.();
    onDismiss();
  };

  const styles = StyleSheet.create({
    overlay: {
      flex: 1,
      backgroundColor: 'rgba(0, 0, 0, 0.1)',
    },
    tooltipContainer: {
      backgroundColor: theme.backgroundPrimary,
      borderRadius: 12,
      padding: spacing.md,
      shadowColor: '#000',
      shadowOffset: {
        width: 0,
        height: 4,
      },
      shadowOpacity: 0.15,
      shadowRadius: 12,
      elevation: 8,
      borderWidth: 1,
      borderColor: theme.border,
    },
    header: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.sm,
    },
    categoryIcon: {
      marginRight: spacing.sm,
      fontSize: 18,
    },
    title: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      flex: 1,
      fontWeight: '600',
    },
    closeButton: {
      padding: spacing.xs,
      marginLeft: spacing.sm,
    },
    closeButtonText: {
      fontSize: 16,
      color: theme.textTertiary,
    },
    content: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      lineHeight: 20,
      marginBottom: spacing.md,
    },
    actions: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    actionButton: {
      flexDirection: 'row',
      alignItems: 'center',
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 8,
      backgroundColor: theme.primary,
    },
    actionButtonSecondary: {
      backgroundColor: 'transparent',
      borderWidth: 1,
      borderColor: theme.border,
    },
    actionButtonText: {
      ...textStyles.bodySmall,
      color: '#FFFFFF',
      fontWeight: '600',
    },
    actionButtonTextSecondary: {
      color: theme.textSecondary,
    },
    priorityIndicator: {
      width: 4,
      height: '100%',
      borderRadius: 2,
      position: 'absolute',
      left: 0,
      top: 0,
    },
    priorityHigh: {
      backgroundColor: '#dc3545',
    },
    priorityMedium: {
      backgroundColor: '#ffc107',
    },
    priorityLow: {
      backgroundColor: '#28a745',
    },
  });

  const getPriorityStyle = (priority: string) => {
    switch (priority) {
      case 'high':
        return styles.priorityHigh;
      case 'medium':
        return styles.priorityMedium;
      case 'low':
        return styles.priorityLow;
      default:
        return styles.priorityLow;
    }
  };

  if (!visible) return null;

  return (
    <Modal
      transparent
      visible={visible}
      animationType="none"
      onRequestClose={onDismiss}
    >
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={onDismiss}
      >
        <Animated.View
          style={[
            getTooltipStyle(),
            {
              opacity: fadeAnim,
              transform: [{ scale: scaleAnim }],
            },
          ]}
          onLayout={event => {
            const { width, height } = event.nativeEvent.layout;
            setTooltipDimensions({ width, height });
          }}
        >
          <View style={styles.tooltipContainer}>
            <View
              style={[
                styles.priorityIndicator,
                getPriorityStyle(tooltipData.priority),
              ]}
            />

            <View style={styles.header}>
              <Text style={styles.categoryIcon}>
                {getCategoryIcon(tooltipData.category)}
              </Text>
              <Text style={styles.title}>{tooltipData.title}</Text>
              <TouchableOpacity style={styles.closeButton} onPress={onDismiss}>
                <Text style={styles.closeButtonText}>×</Text>
              </TouchableOpacity>
            </View>

            <Text style={styles.content}>{tooltipData.content}</Text>

            <View style={styles.actions}>
              <TouchableOpacity
                style={[styles.actionButton, styles.actionButtonSecondary]}
                onPress={onDismiss}
              >
                <Text
                  style={[
                    styles.actionButtonText,
                    styles.actionButtonTextSecondary,
                  ]}
                >
                  Got it
                </Text>
              </TouchableOpacity>

              {tooltipData.helpArticleId && (
                <TouchableOpacity
                  style={styles.actionButton}
                  onPress={handleLearnMore}
                >
                  <Text style={styles.actionButtonText}>Learn More</Text>
                </TouchableOpacity>
              )}
            </View>
          </View>
        </Animated.View>
      </TouchableOpacity>
    </Modal>
  );
};

export const useTooltips = () => {
  const [activeTooltip, setActiveTooltip] = useState<{
    data: TooltipData;
    position: TooltipPosition;
  } | null>(null);
  const [shownTooltips, setShownTooltips] = useState<Set<string>>(new Set());

  const showTooltip = (data: TooltipData, position: TooltipPosition) => {
    if (data.showOnce && shownTooltips.has(data.id)) {
      return;
    }

    setActiveTooltip({ data, position });

    if (data.showOnce) {
      setShownTooltips(prev => new Set([...prev, data.id]));
    }
  };

  const hideTooltip = () => {
    setActiveTooltip(null);
  };

  const isTooltipVisible = (tooltipId: string) => {
    return activeTooltip?.data.id === tooltipId;
  };

  return {
    activeTooltip,
    showTooltip,
    hideTooltip,
    isTooltipVisible,
    shownTooltips,
  };
};
