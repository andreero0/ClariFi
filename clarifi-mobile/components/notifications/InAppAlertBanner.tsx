import React, { useEffect, useRef, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import {
  AlertTriangle,
  X,
  ChevronDown,
  ChevronUp,
  CreditCard,
  Clock,
  TrendingUp,
  Lightbulb,
} from 'lucide-react-native';
import * as Haptics from 'expo-haptics';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width, height } = Dimensions.get('window');

export interface AlertBannerData {
  id: string;
  type: 'utilization' | 'payment' | 'achievement' | 'education';
  priority: 'low' | 'medium' | 'high' | 'critical';
  title: string;
  message: string;
  cardName?: string;
  cardColor?: string;
  utilizationPercentage?: number;
  suggestedPayment?: number;
  actionText?: string;
  onAction?: () => void;
  autoDismissMs?: number;
}

interface MiniProgressBarProps {
  utilization: number;
  width?: number;
}

const MiniProgressBar: React.FC<MiniProgressBarProps> = ({ 
  utilization, 
  width: barWidth = 80 
}) => {
  const getUtilizationColor = (util: number) => {
    if (util >= 90) return colors.error;
    if (util >= 70) return colors.warning;
    if (util >= 30) return colors.clarityBlue;
    return colors.success;
  };

  return (
    <View style={[styles.miniProgressContainer, { width: barWidth }]}>
      <View style={styles.miniProgressTrack}>
        <View 
          style={[
            styles.miniProgressFill,
            { 
              width: `${Math.min(utilization, 100)}%`,
              backgroundColor: getUtilizationColor(utilization)
            }
          ]} 
        />
      </View>
      <Text style={styles.miniProgressText}>{utilization}%</Text>
    </View>
  );
};

interface InAppAlertBannerProps {
  alert: AlertBannerData | null;
  onDismiss: () => void;
}

const InAppAlertBanner: React.FC<InAppAlertBannerProps> = ({
  alert,
  onDismiss,
}) => {
  const slideAnim = useRef(new Animated.Value(-120)).current;
  const blurOpacity = useRef(new Animated.Value(0)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;
  
  const [expanded, setExpanded] = useState(false);
  const [isDismissing, setIsDismissing] = useState(false);

  const isUrgent = alert?.priority === 'critical' || alert?.priority === 'high';
  const autoHideDelay = alert?.autoDismissMs || (isUrgent ? 0 : 5000);

  const getAlertIcon = () => {
    if (!alert) return null;

    switch (alert.type) {
      case 'utilization':
        return <CreditCard size={20} color={isUrgent ? colors.error : colors.warning} />;
      case 'payment':
        return <Clock size={20} color={colors.clarityBlue} />;
      case 'achievement':
        return <TrendingUp size={20} color={colors.success} />;
      case 'education':
        return <Lightbulb size={20} color={colors.wisdomPurple} />;
      default:
        return <AlertTriangle size={20} color={colors.warning} />;
    }
  };

  // Spring animation for show/hide
  useEffect(() => {
    if (alert) {
      setExpanded(false);
      setIsDismissing(false);

      Haptics.notificationAsync(
        isUrgent 
          ? Haptics.NotificationFeedbackType.Error 
          : Haptics.NotificationFeedbackType.Warning
      );
      
      Animated.parallel([
        Animated.spring(slideAnim, {
          toValue: 0,
          useNativeDriver: true,
          tension: 100,
          friction: 8,
        }),
        Animated.timing(blurOpacity, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
      ]).start();

      // Auto-hide after delay if not urgent
      if (!isUrgent && autoHideDelay > 0) {
        const timer = setTimeout(() => {
          handleDismiss();
        }, autoHideDelay);

        return () => clearTimeout(timer);
      }
    } else {
      Animated.parallel([
        Animated.timing(slideAnim, {
          toValue: -120,
          duration: 250,
          useNativeDriver: true,
        }),
        Animated.timing(blurOpacity, {
          toValue: 0,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [alert, isUrgent, autoHideDelay]);

  const handleDismiss = () => {
    if (isDismissing) return;
    
    setIsDismissing(true);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.parallel([
      Animated.timing(slideAnim, {
        toValue: -120,
        duration: 250,
        useNativeDriver: true,
      }),
      Animated.timing(blurOpacity, {
        toValue: 0,
        duration: 250,
        useNativeDriver: true,
      }),
    ]).start(() => {
      setIsDismissing(false);
      onDismiss();
    });
  };

  const handleExpand = () => {
    setExpanded(!expanded);
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    Animated.timing(scaleAnim, {
      toValue: expanded ? 1 : 1.02,
      duration: 200,
      useNativeDriver: true,
    }).start();
  };

  const handleAction = () => {
    if (alert?.onAction) {
      alert.onAction();
    }
    handleDismiss();
  };

  if (!alert && !isDismissing) {
    return null;
  }

  return (
    <View style={styles.container}>
      {/* Blurred background */}
      <Animated.View 
        style={[
          styles.backgroundBlur,
          { opacity: blurOpacity }
        ]}
      />
      
      {/* Alert Banner */}
      <Animated.View
        style={[
          styles.alertBanner,
          isUrgent && styles.urgentBanner,
          {
            transform: [
              { translateY: slideAnim },
              { scale: scaleAnim }
            ],
          },
        ]}
      >
        {/* Drag indicator */}
        <View style={styles.dragIndicator} />
        
        <View style={styles.bannerContent}>
          {/* Main Alert Content */}
          <View style={styles.alertContent}>
            <View style={styles.alertIcon}>
              {getAlertIcon()}
            </View>
            
            <View style={styles.alertText}>
              <Text style={styles.alertTitle}>{alert?.title}</Text>
              <Text style={styles.alertMessage}>{alert?.message}</Text>
            </View>
            
            <View style={styles.alertActions}>
              {alert?.utilizationPercentage && (
                <MiniProgressBar utilization={alert.utilizationPercentage} />
              )}
              <TouchableOpacity 
                style={styles.dismissButton}
                onPress={handleDismiss}
              >
                <X size={18} color={colors.neutralGray} />
              </TouchableOpacity>
            </View>
          </View>

          {/* Action Button */}
          {alert?.actionText && alert?.onAction && (
            <TouchableOpacity 
              style={styles.actionButton}
              onPress={handleAction}
            >
              <Text style={styles.actionButtonText}>{alert.actionText}</Text>
            </TouchableOpacity>
          )}

          {/* Expanded Content */}
          {expanded && alert?.utilizationPercentage && alert?.suggestedPayment && (
            <Animated.View style={styles.expandedContent}>
              <View style={styles.divider} />
              
              <View style={styles.detailsGrid}>
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Utilization</Text>
                  <Text style={[
                    styles.detailValue,
                    { color: alert.utilizationPercentage >= 70 ? colors.error : colors.success }
                  ]}>
                    {alert.utilizationPercentage}%
                  </Text>
                </View>
                
                <View style={styles.detailItem}>
                  <Text style={styles.detailLabel}>Suggested Payment</Text>
                  <Text style={styles.detailValue}>
                    ${alert.suggestedPayment.toLocaleString()}
                  </Text>
                </View>
              </View>
            </Animated.View>
          )}
        </View>
        
        {/* Expand/Collapse Button - only for utilization alerts */}
        {alert?.type === 'utilization' && (
          <TouchableOpacity 
            style={styles.expandButton}
            onPress={handleExpand}
          >
            {expanded ? (
              <ChevronUp size={20} color={colors.neutralGray} />
            ) : (
              <ChevronDown size={20} color={colors.neutralGray} />
            )}
          </TouchableOpacity>
        )}
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    zIndex: 1000,
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: height,
    backgroundColor: 'rgba(0,0,0,0.3)',
  },
  alertBanner: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.md,
    marginTop: 60, // Below status bar
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 8,
  },
  urgentBanner: {
    backgroundColor: '#FFF5F5',
    borderWidth: 1.5,
    borderColor: colors.error,
  },
  dragIndicator: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutralGray,
    borderRadius: 2,
    alignSelf: 'center',
    marginTop: spacing.sm,
    opacity: 0.5,
  },
  bannerContent: {
    padding: spacing.md,
  },
  alertContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  alertIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
  },
  alertText: {
    flex: 1,
    marginLeft: spacing.md,
    marginRight: spacing.sm,
  },
  alertTitle: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
    marginBottom: 2,
  },
  alertMessage: {
    ...textStyles.caption,
    color: colors.neutralGray,
    lineHeight: 16,
  },
  alertActions: {
    alignItems: 'flex-end',
  },
  miniProgressContainer: {
    alignItems: 'center',
    marginBottom: spacing.xs,
  },
  miniProgressTrack: {
    width: '100%',
    height: 3,
    backgroundColor: colors.cloudGray,
    borderRadius: 2,
    overflow: 'hidden',
    marginBottom: 2,
  },
  miniProgressFill: {
    height: '100%',
    borderRadius: 2,
  },
  miniProgressText: {
    fontSize: 10,
    fontWeight: '600',
    color: colors.midnightInk,
  },
  dismissButton: {
    width: 24,
    height: 24,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionButton: {
    backgroundColor: colors.clarityBlue,
    borderRadius: 12,
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  actionButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
  expandedContent: {
    marginTop: spacing.sm,
  },
  divider: {
    height: 1,
    backgroundColor: colors.borderDivider,
    marginVertical: spacing.sm,
  },
  detailsGrid: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  detailItem: {
    flex: 1,
    alignItems: 'center',
  },
  detailLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: 2,
  },
  detailValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  expandButton: {
    position: 'absolute',
    right: spacing.sm,
    top: '50%',
    width: 32,
    height: 32,
    borderRadius: 16,
    backgroundColor: colors.cloudGray,
    alignItems: 'center',
    justifyContent: 'center',
    transform: [{ translateY: -16 }],
  },
});

export default InAppAlertBanner;
export { InAppAlertBanner };