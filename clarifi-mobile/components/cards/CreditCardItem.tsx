import React, { useRef, useEffect } from 'react';
import { View, Text, StyleSheet, TouchableOpacity, Alert, Animated } from 'react-native';
import { LinearGradient } from 'expo-linear-gradient';
import * as Haptics from 'expo-haptics';
import {
  CreditCard,
  getUtilizationStatus,
  getUtilizationColor,
  getPaymentStatus,
  getPaymentStatusColor,
  calculateDaysUntilDue,
  formatCreditLimit,
  getIssuerDisplayName,
} from '../../types/creditCard';
import { colors } from '../../constants/colors';
import { UtilizationGauge } from './UtilizationGauge';
import { Button } from '../ui/Button';

interface CreditCardItemProps {
  card: CreditCard;
  onPress: () => void;
  onEdit: () => void;
  onDelete: () => void;
  onNotificationSettings?: () => void;
  style?: any;
}

export const CreditCardItem: React.FC<CreditCardItemProps> = ({
  card,
  onPress,
  onEdit,
  onDelete,
  style,
}) => {
  const scaleAnim = useRef(new Animated.Value(1)).current;
  const utilization =
    card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
  const utilizationStatus = getUtilizationStatus(utilization);
  const utilizationColor = getUtilizationColor(utilizationStatus);

  const paymentStatus = getPaymentStatus(card.paymentDueDate);
  const paymentStatusColor = getPaymentStatusColor(paymentStatus);
  const daysUntilDue = calculateDaysUntilDue(card.paymentDueDate);

  const getPaymentStatusText = () => {
    if (daysUntilDue < 0) {
      return `${Math.abs(daysUntilDue)} day${Math.abs(daysUntilDue) !== 1 ? 's' : ''} overdue`;
    } else if (daysUntilDue === 0) {
      return 'Due today';
    } else if (daysUntilDue <= 7) {
      return `Due in ${daysUntilDue} day${daysUntilDue !== 1 ? 's' : ''}`;
    } else {
      return `Due ${new Date(card.paymentDueDate).toLocaleDateString('en-CA')}`;
    }
  };

  const getUtilizationStatusText = () => {
    switch (utilizationStatus) {
      case 'excellent':
        return 'Excellent usage';
      case 'good':
        return 'Good usage';
      case 'fair':
        return 'Fair usage';
      case 'poor':
        return 'High usage';
      case 'critical':
        return 'Critical usage';
      default:
        return '';
    }
  };

  const getCardGradient = () => {
    if (card.color) {
      return [card.color, '#FFFFFF'];
    }
    // Default gradients based on bank/issuer
    switch (card.issuer) {
      case 'visa':
        return ['#1A1F71', '#4B7BF5'];
      case 'mastercard':
        return ['#EB001B', '#F79E1B'];
      case 'amex':
        return ['#006FCF', '#00A2E8'];
      default:
        return ['#2B5CE6', '#4B7BF5'];
    }
  };

  const handlePressIn = () => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    Animated.timing(scaleAnim, {
      toValue: 0.97,
      duration: 150,
      useNativeDriver: true,
    }).start();
  };

  const handlePressOut = () => {
    Animated.spring(scaleAnim, {
      toValue: 1,
      friction: 3,
      useNativeDriver: true,
    }).start();
  };

  const handleLongPress = () => {
    Alert.alert(card.name, 'Choose an action', [
      {
        text: 'View Details',
        onPress: onPress,
      },
      {
        text: 'Edit',
        onPress: onEdit,
      },
      {
        text: 'Delete',
        style: 'destructive',
        onPress: onDelete,
      },
      {
        text: 'Cancel',
        style: 'cancel',
      },
    ]);
  };

  return (
    <Animated.View style={[
      styles.container,
      style,
      {
        transform: [{ scale: scaleAnim }],
      }
    ]}>
      <TouchableOpacity
        onPress={onPress}
        onLongPress={handleLongPress}
        onPressIn={handlePressIn}
        onPressOut={handlePressOut}
        activeOpacity={1}
        style={styles.touchable}
      >
        <LinearGradient
          colors={getCardGradient()}
          start={{ x: 0, y: 0 }}
          end={{ x: 1, y: 1 }}
          style={styles.cardGradient}
        >
        {/* Header Section */}
        <View style={styles.header}>
          <View style={styles.cardInfo}>
            <Text style={styles.cardName} numberOfLines={1}>
              {card.name}
            </Text>
            <Text style={styles.cardDetails}>
              {getIssuerDisplayName(card.issuer)} •••• {card.lastFourDigits}
            </Text>
          </View>

          <View style={[styles.utilizationBadge, { backgroundColor: utilizationColor }]}>
            <Text style={styles.utilizationPercentage}>
              {utilization.toFixed(0)}%
            </Text>
          </View>
        </View>

        {/* Balance and Limit Section */}
        <View style={styles.balanceSection}>
          <View style={styles.mainBalance}>
            <Text style={styles.balanceAmount}>
              {formatCreditLimit(card.currentBalance)}
            </Text>
            <Text style={styles.balanceLabel}>Current Balance</Text>
          </View>
          
          <View style={styles.limitInfo}>
            <Text style={styles.limitText}>
              {formatCreditLimit(card.availableCredit)} available of {formatCreditLimit(card.creditLimit)}
            </Text>
          </View>
        </View>

        {/* Utilization Progress Bar */}
        <View style={styles.utilizationProgressSection}>
          <View style={styles.progressBar}>
            <View style={[styles.progressFill, { width: `${Math.min(utilization, 100)}%`, backgroundColor: utilizationColor }]} />
          </View>
        </View>

        {/* Payment Info */}
        <View style={styles.paymentSection}>
          <View
            style={[
              styles.paymentBadge,
              { backgroundColor: daysUntilDue <= 3 ? colors.warning : 'rgba(255,255,255,0.2)' },
            ]}
          >
            <Text style={[styles.paymentText, {
              color: daysUntilDue <= 3 ? colors.midnightInk : colors.pureWhite
            }]}>
              {getPaymentStatusText()}
            </Text>
          </View>
        </View>
        </LinearGradient>
      </TouchableOpacity>
    </Animated.View>
  );
};

const styles = StyleSheet.create({
  container: {
    width: 343,
    height: 200,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.15,
    elevation: 8,
  },
  touchable: {
    flex: 1,
    borderRadius: 16,
    overflow: 'hidden',
  },
  cardGradient: {
    flex: 1,
    padding: 20,
    justifyContent: 'space-between',
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardInfo: {
    flex: 1,
  },
  cardName: {
    fontSize: 18,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: 4,
  },
  cardDetails: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  utilizationBadge: {
    paddingHorizontal: 8,
    paddingVertical: 4,
    borderRadius: 8,
    minWidth: 42,
    alignItems: 'center',
  },
  utilizationPercentage: {
    fontSize: 12,
    fontWeight: '600',
    color: colors.pureWhite,
  },
  balanceSection: {
    flex: 1,
    justifyContent: 'center',
  },
  mainBalance: {
    marginBottom: 8,
  },
  balanceAmount: {
    fontSize: 24,
    fontWeight: '700',
    color: colors.pureWhite,
    marginBottom: 2,
  },
  balanceLabel: {
    fontSize: 14,
    color: 'rgba(255,255,255,0.8)',
  },
  limitInfo: {
    marginBottom: 8,
  },
  limitText: {
    fontSize: 12,
    color: 'rgba(255,255,255,0.7)',
  },
  utilizationProgressSection: {
    marginBottom: 12,
  },
  progressBar: {
    height: 4,
    backgroundColor: 'rgba(255,255,255,0.3)',
    borderRadius: 2,
    overflow: 'hidden',
  },
  progressFill: {
    height: '100%',
    borderRadius: 2,
  },
  paymentSection: {
    alignItems: 'flex-end',
  },
  paymentBadge: {
    paddingHorizontal: 12,
    paddingVertical: 6,
    borderRadius: 12,
  },
  paymentText: {
    fontSize: 12,
    fontWeight: '600',
  },
});
