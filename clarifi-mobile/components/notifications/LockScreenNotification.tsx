import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Image,
} from 'react-native';
import {
  CreditCard,
  DollarSign,
  Eye,
  AlertTriangle,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface UtilizationGaugeProps {
  utilization: number;
  size?: number;
}

const MiniUtilizationGauge: React.FC<UtilizationGaugeProps> = ({ 
  utilization, 
  size = 60 
}) => {
  const getUtilizationColor = (util: number) => {
    if (util >= 90) return colors.error;
    if (util >= 70) return colors.warning;
    if (util >= 30) return colors.clarityBlue;
    return colors.success;
  };

  const circumference = 2 * Math.PI * (size / 2 - 6);
  const strokeDasharray = circumference;
  const strokeDashoffset = circumference - (utilization / 100) * circumference;

  return (
    <View style={[styles.gaugeContainer, { width: size, height: size }]}>
      {/* Background circle */}
      <View
        style={[
          styles.gaugeBackground,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 4,
            borderColor: 'rgba(255,255,255,0.2)',
          },
        ]}
      />
      
      {/* Progress indicator using border hack */}
      <View
        style={[
          styles.gaugeProgress,
          {
            width: size,
            height: size,
            borderRadius: size / 2,
            borderWidth: 4,
            borderColor: getUtilizationColor(utilization),
            borderTopColor: utilization >= 25 ? getUtilizationColor(utilization) : 'rgba(255,255,255,0.2)',
            borderRightColor: utilization >= 50 ? getUtilizationColor(utilization) : 'rgba(255,255,255,0.2)',
            borderBottomColor: utilization >= 75 ? getUtilizationColor(utilization) : 'rgba(255,255,255,0.2)',
            borderLeftColor: utilization >= 100 ? getUtilizationColor(utilization) : 'rgba(255,255,255,0.2)',
            transform: [{ rotate: '-90deg' }],
          },
        ]}
      />
      
      {/* Center content */}
      <View style={styles.gaugeCenter}>
        <Text style={styles.gaugeText}>{utilization}%</Text>
      </View>
    </View>
  );
};

interface LockScreenNotificationProps {
  cardName: string;
  utilization: number;
  creditLimit: number;
  currentBalance: number;
  isUrgent?: boolean;
  timestamp: string;
  onPayNow: () => void;
  onViewDetails: () => void;
}

const LockScreenNotification: React.FC<LockScreenNotificationProps> = ({
  cardName,
  utilization,
  creditLimit,
  currentBalance,
  isUrgent = false,
  timestamp,
  onPayNow,
  onViewDetails,
}) => {
  const availableCredit = creditLimit - currentBalance;
  
  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getAlertMessage = () => {
    if (utilization >= 90) {
      return `${cardName} is at ${utilization}% utilization - credit limit almost reached!`;
    }
    if (utilization >= 70) {
      return `${cardName} utilization is high at ${utilization}% - consider paying down balance`;
    }
    return `${cardName} utilization increased to ${utilization}%`;
  };

  return (
    <View style={styles.container}>
      {/* iPhone Lock Screen Background Blur Effect */}
      <View style={styles.backgroundBlur} />
      
      {/* Notification Card */}
      <View style={[
        styles.notificationCard,
        isUrgent && styles.urgentNotification
      ]}>
        {/* Header with App Icon and Time */}
        <View style={styles.notificationHeader}>
          <View style={styles.appIconContainer}>
            <View style={styles.appIcon}>
              <CreditCard size={16} color={colors.pureWhite} />
            </View>
            <View style={styles.headerText}>
              <Text style={styles.appName}>ClariFi</Text>
              <Text style={styles.timestamp}>{timestamp}</Text>
            </View>
          </View>
          
          {isUrgent && (
            <View style={styles.urgentBadge}>
              <AlertTriangle size={12} color={colors.pureWhite} />
            </View>
          )}
        </View>

        {/* Main Content */}
        <View style={styles.contentContainer}>
          <View style={styles.mainContent}>
            <View style={styles.textContent}>
              <Text style={styles.title}>Credit Utilization Alert</Text>
              <Text style={styles.message}>
                {getAlertMessage()}
              </Text>
              
              <View style={styles.creditInfo}>
                <Text style={styles.creditText}>
                  {formatCurrency(availableCredit)} available of {formatCurrency(creditLimit)}
                </Text>
              </View>
            </View>
            
            <View style={styles.gaugeWrapper}>
              <MiniUtilizationGauge utilization={utilization} size={70} />
            </View>
          </View>

          {/* Action Buttons */}
          <View style={styles.actionButtons}>
            <TouchableOpacity 
              style={[styles.actionButton, styles.secondaryButton]}
              onPress={onViewDetails}
            >
              <Eye size={16} color={colors.pureWhite} />
              <Text style={styles.secondaryButtonText}>View Details</Text>
            </TouchableOpacity>
            
            <TouchableOpacity 
              style={[styles.actionButton, styles.primaryButton]}
              onPress={onPayNow}
            >
              <DollarSign size={16} color={colors.pureWhite} />
              <Text style={styles.primaryButtonText}>Pay Now</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>

      {/* Lock Screen Elements */}
      <View style={styles.lockScreenFooter}>
        <View style={styles.homeIndicator} />
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: width,
    height: 800, // iPhone 16 Pro height simulation
    backgroundColor: '#000000',
    position: 'relative',
  },
  backgroundBlur: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0,0,0,0.8)',
  },
  notificationCard: {
    backgroundColor: 'rgba(50, 50, 50, 0.95)',
    marginHorizontal: spacing.lg,
    marginTop: 120,
    borderRadius: 16,
    overflow: 'hidden',
    backdropFilter: 'blur(20px)',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  urgentNotification: {
    backgroundColor: 'rgba(229, 62, 62, 0.15)',
    borderWidth: 1,
    borderColor: 'rgba(229, 62, 62, 0.3)',
  },
  notificationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.md,
    paddingTop: spacing.md,
    paddingBottom: spacing.sm,
  },
  appIconContainer: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  appIcon: {
    width: 24,
    height: 24,
    borderRadius: 6,
    backgroundColor: colors.clarityBlue,
    alignItems: 'center',
    justifyContent: 'center',
  },
  headerText: {
    marginLeft: spacing.sm,
  },
  appName: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.pureWhite,
  },
  timestamp: {
    fontSize: 10,
    color: 'rgba(255,255,255,0.7)',
  },
  urgentBadge: {
    width: 20,
    height: 20,
    borderRadius: 10,
    backgroundColor: colors.error,
    alignItems: 'center',
    justifyContent: 'center',
  },
  contentContainer: {
    padding: spacing.md,
  },
  mainContent: {
    flexDirection: 'row',
    alignItems: 'flex-start',
    marginBottom: spacing.lg,
  },
  textContent: {
    flex: 1,
    marginRight: spacing.md,
  },
  title: {
    fontSize: 16,
    fontWeight: '600',
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  message: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.9)',
    lineHeight: 20,
    marginBottom: spacing.sm,
  },
  creditInfo: {
    paddingVertical: spacing.xs,
    paddingHorizontal: spacing.sm,
    backgroundColor: 'rgba(255,255,255,0.1)',
    borderRadius: 8,
  },
  creditText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.8)',
    textAlign: 'center',
  },
  gaugeWrapper: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeContainer: {
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeBackground: {
    position: 'absolute',
  },
  gaugeProgress: {
    position: 'absolute',
  },
  gaugeCenter: {
    position: 'absolute',
    alignItems: 'center',
    justifyContent: 'center',
  },
  gaugeText: {
    fontSize: 12,
    fontWeight: '700',
    color: colors.pureWhite,
  },
  actionButtons: {
    flexDirection: 'row',
    gap: spacing.sm,
  },
  actionButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.sm,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    gap: spacing.xs,
  },
  primaryButton: {
    backgroundColor: colors.clarityBlue,
  },
  secondaryButton: {
    backgroundColor: 'rgba(255,255,255,0.2)',
    borderWidth: 1,
    borderColor: 'rgba(255,255,255,0.3)',
  },
  primaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.pureWhite,
  },
  secondaryButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: colors.pureWhite,
  },
  lockScreenFooter: {
    position: 'absolute',
    bottom: 20,
    left: 0,
    right: 0,
    alignItems: 'center',
  },
  homeIndicator: {
    width: 134,
    height: 5,
    borderRadius: 3,
    backgroundColor: 'rgba(255,255,255,0.3)',
  },
});

export default LockScreenNotification;