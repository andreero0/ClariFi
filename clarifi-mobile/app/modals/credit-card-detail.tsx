import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  RefreshControl,
  Dimensions,
  StatusBar,
  Animated,
  NativeScrollEvent,
  NativeSyntheticEvent,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useCreditCards } from '../../hooks/useCreditCards';
import {
  CreditCard,
  CreditCardPayment,
  getUtilizationStatus,
  getUtilizationColor,
  getPaymentStatus,
  getPaymentStatusColor,
  calculateDaysUntilDue,
  formatCreditLimit,
  getIssuerDisplayName,
} from '../../types/creditCard';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import {
  ArrowLeft,
  Edit3,
  CreditCard as CreditCardIcon,
  DollarSign,
  Calendar,
  TrendingUp,
  Bell,
  FileText,
  Trash2,
} from 'lucide-react-native';

const { width: SCREEN_WIDTH, height: SCREEN_HEIGHT } = Dimensions.get('window');
const HEADER_HEIGHT = 120;
const CARD_HEADER_HEIGHT = 200;

const CreditCardDetailModal: React.FC = () => {
  const router = useRouter();
  const { cardId } = useLocalSearchParams<{ cardId: string }>();
  const { cards, getCardPayments, deleteCard } = useCreditCards();

  const [refreshing, setRefreshing] = useState(false);
  const [showFullHistory, setShowFullHistory] = useState(false);

  const scrollY = useRef(new Animated.Value(0)).current;
  const headerOpacity = useRef(new Animated.Value(0)).current;
  const cardScale = useRef(new Animated.Value(1)).current;
  const fadeAnim = useRef(new Animated.Value(0)).current;

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const card = cards?.find(c => c.id === cardId);
  const payments = getCardPayments(cardId);

  useEffect(() => {
    if (!card) {
      // Card not found, go back
      router.back();
    }
  }, [card, router]);

  if (!card) {
    return null; // or loading state
  }

  const utilization =
    card.creditLimit > 0 ? (card.currentBalance / card.creditLimit) * 100 : 0;
  const utilizationStatus = getUtilizationStatus(utilization);
  const utilizationColor = getUtilizationColor(utilizationStatus);
  const paymentStatus = getPaymentStatus(card.paymentDueDate);
  const paymentStatusColor = getPaymentStatusColor(paymentStatus);
  const daysUntilDue = calculateDaysUntilDue(card.paymentDueDate);

  const handleRefresh = async () => {
    setRefreshing(true);
    // Simulate refresh - in real app this would reload data
    setTimeout(() => setRefreshing(false), 1000);
  };

  const handleEdit = () => {
    router.push({
      pathname: '/modals/credit-card-form',
      params: { cardId: card.id },
    });
  };

  const handleDelete = () => {
    Alert.alert(
      'Delete Credit Card',
      `Are you sure you want to delete ${card.name}? This action cannot be undone.`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
        },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCard(card.id);
              router.back();
            } catch (error) {
              Alert.alert(
                'Error',
                'Failed to delete credit card. Please try again.',
                [{ text: 'OK' }]
              );
            }
          },
        },
      ]
    );
  };

  const handleMakePayment = () => {
    router.push({
      pathname: '/modals/payment-form',
      params: { cardId: card.id },
    });
  };

  const renderParallaxCardHeader = () => {
    const cardTranslateY = scrollY.interpolate({
      inputRange: [0, CARD_HEADER_HEIGHT],
      outputRange: [0, -CARD_HEADER_HEIGHT / 2],
      extrapolate: 'clamp',
    });

    const cardOpacity = scrollY.interpolate({
      inputRange: [0, CARD_HEADER_HEIGHT / 2],
      outputRange: [1, 0.3],
      extrapolate: 'clamp',
    });

    return (
      <Animated.View
        style={[
          styles.parallaxCardHeader,
          {
            backgroundColor: card.color || colors.clarityBlue,
            transform: [{ translateY: cardTranslateY }],
            opacity: cardOpacity,
          },
        ]}
      >
        <View style={styles.cardPattern} />

        <View style={styles.cardContent}>
          <View style={styles.cardTopRow}>
            <CreditCardIcon size={32} color={colors.pureWhite} />
            <Text style={styles.cardChip}>●●●●</Text>
          </View>

          <View style={styles.cardMainInfo}>
            <Text style={styles.cardName}>{card.name}</Text>
            <Text style={styles.cardDetails}>
              {getIssuerDisplayName(card.issuer)} •••• {card.lastFourDigits}
            </Text>
          </View>

          <View style={styles.cardBottomRow}>
            <View>
              <Text style={styles.cardLimitLabel}>Credit Limit</Text>
              <Text style={styles.cardLimitAmount}>
                {formatCreditLimit(card.creditLimit)}
              </Text>
            </View>
            <View style={styles.utilizationMini}>
              <Text style={styles.utilizationMiniLabel}>Utilization</Text>
              <Text
                style={[
                  styles.utilizationMiniValue,
                  { color: utilizationColor },
                ]}
              >
                {utilization.toFixed(0)}%
              </Text>
            </View>
          </View>
        </View>
      </Animated.View>
    );
  };

  const renderUtilizationSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Credit Utilization</Text>

      <View style={styles.utilizationCard}>
        <View style={styles.utilizationHeader}>
          <Text
            style={[styles.utilizationPercentage, { color: utilizationColor }]}
          >
            {utilization.toFixed(1)}%
          </Text>
          <Text style={[styles.utilizationStatus, { color: utilizationColor }]}>
            {getUtilizationStatus(utilization).toUpperCase()}
          </Text>
        </View>

        <View style={styles.progressContainer}>
          <View style={styles.progressBar}>
            <View
              style={[
                styles.progressFill,
                {
                  width: `${Math.min(utilization, 100)}%`,
                  backgroundColor: utilizationColor,
                },
              ]}
            />
          </View>

          <View style={styles.progressLabels}>
            <Text style={styles.progressLabel}>0%</Text>
            <Text style={styles.progressLabel}>30%</Text>
            <Text style={styles.progressLabel}>80%</Text>
            <Text style={styles.progressLabel}>100%</Text>
          </View>
        </View>

        <View style={styles.balanceBreakdown}>
          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Current Balance</Text>
            <Text style={styles.balanceValue}>
              {formatCreditLimit(card.currentBalance)}
            </Text>
          </View>

          <View style={styles.balanceItem}>
            <Text style={styles.balanceLabel}>Available Credit</Text>
            <Text style={[styles.balanceValue, styles.positiveValue]}>
              {formatCreditLimit(card.availableCredit)}
            </Text>
          </View>
        </View>
      </View>
    </View>
  );

  const renderPaymentSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Payment Information</Text>

      <View style={styles.paymentCard}>
        <View style={styles.paymentRow}>
          <View style={styles.paymentInfo}>
            <Text style={styles.paymentLabel}>Next Payment Due</Text>
            <Text style={[styles.paymentDate, { color: paymentStatusColor }]}>
              {new Date(card.paymentDueDate).toLocaleDateString('en-CA', {
                weekday: 'short',
                year: 'numeric',
                month: 'short',
                day: 'numeric',
              })}
            </Text>
            <Text style={[styles.paymentStatus, { color: paymentStatusColor }]}>
              {daysUntilDue < 0
                ? `${Math.abs(daysUntilDue)} days overdue`
                : daysUntilDue === 0
                  ? 'Due today'
                  : `${daysUntilDue} days remaining`}
            </Text>
          </View>

          <View style={styles.paymentAmounts}>
            <Text style={styles.minimumPaymentLabel}>Minimum Payment</Text>
            <Text style={styles.minimumPaymentAmount}>
              {formatCreditLimit(card.minimumPayment)}
            </Text>

            <TouchableOpacity
              style={styles.paymentButton}
              onPress={handleMakePayment}
            >
              <Text style={styles.paymentButtonText}>Make Payment</Text>
            </TouchableOpacity>
          </View>
        </View>

        <View style={styles.statementInfo}>
          <Text style={styles.statementText}>
            Statement Date:{' '}
            {new Date(card.statementDate).toLocaleDateString('en-CA')}
          </Text>
          <Text style={styles.statementText}>
            Interest Rate: {card.interestRate}% APR
          </Text>
        </View>
      </View>
    </View>
  );

  const renderPaymentHistory = () => {
    const displayedPayments = showFullHistory ? payments : payments.slice(0, 3);

    return (
      <View style={styles.section}>
        <View style={styles.sectionHeader}>
          <Text style={styles.sectionTitle}>Payment History</Text>
          {payments.length > 3 && (
            <TouchableOpacity
              onPress={() => setShowFullHistory(!showFullHistory)}
            >
              <Text style={styles.showMoreButton}>
                {showFullHistory
                  ? 'Show Less'
                  : `Show All (${payments.length})`}
              </Text>
            </TouchableOpacity>
          )}
        </View>

        {payments.length === 0 ? (
          <View style={styles.emptyHistory}>
            <Text style={styles.emptyHistoryText}>No payment history yet</Text>
            <Text style={styles.emptyHistorySubtext}>
              Payments you make will appear here
            </Text>
          </View>
        ) : (
          <View style={styles.historyList}>
            {displayedPayments.map(payment => (
              <View key={payment.id} style={styles.historyItem}>
                <View style={styles.historyInfo}>
                  <Text style={styles.historyDate}>
                    {new Date(payment.paymentDate).toLocaleDateString('en-CA')}
                  </Text>
                  <Text style={styles.historyType}>
                    {payment.type.replace('-', ' ').toUpperCase()}
                  </Text>
                  {payment.description && (
                    <Text style={styles.historyDescription}>
                      {payment.description}
                    </Text>
                  )}
                </View>
                <Text style={styles.historyAmount}>
                  {formatCreditLimit(payment.amount)}
                </Text>
              </View>
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderNotesSection = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Notes</Text>
      {card.notes ? (
        <Text style={styles.notesText}>{card.notes}</Text>
      ) : (
        <Text style={styles.emptyNotesText}>
          No notes added. Tap "Edit" to add notes about this card.
        </Text>
      )}
    </View>
  );

  const renderQuickActions = () => (
    <View style={styles.section}>
      <Text style={styles.sectionTitle}>Quick Actions</Text>

      <View style={styles.actionsGrid}>
        <TouchableOpacity
          style={[styles.quickAction, styles.primaryAction]}
          onPress={handleMakePayment}
        >
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: colors.clarityBlue },
            ]}
          >
            <DollarSign size={24} color={colors.pureWhite} />
          </View>
          <Text style={styles.quickActionText}>Make Payment</Text>
        </TouchableOpacity>

        <TouchableOpacity style={styles.quickAction} onPress={handleEdit}>
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: colors.neutralGray },
            ]}
          >
            <Edit3 size={20} color={colors.pureWhite} />
          </View>
          <Text style={styles.quickActionText}>Edit Details</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() =>
            Alert.alert(
              'Feature Coming Soon',
              'Statement download will be available soon.'
            )
          }
        >
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: colors.wisdomPurple },
            ]}
          >
            <FileText size={20} color={colors.pureWhite} />
          </View>
          <Text style={styles.quickActionText}>View Statement</Text>
        </TouchableOpacity>

        <TouchableOpacity
          style={styles.quickAction}
          onPress={() =>
            Alert.alert(
              'Feature Coming Soon',
              'Payment reminders will be available soon.'
            )
          }
        >
          <View
            style={[
              styles.quickActionIcon,
              { backgroundColor: colors.growthGreen },
            ]}
          >
            <Bell size={20} color={colors.pureWhite} />
          </View>
          <Text style={styles.quickActionText}>Set Reminder</Text>
        </TouchableOpacity>
      </View>
    </View>
  );

  const handleScroll = (event: NativeSyntheticEvent<NativeScrollEvent>) => {
    const scrollOffset = event.nativeEvent.contentOffset.y;
    const opacity = Math.min(scrollOffset / CARD_HEADER_HEIGHT, 1);
    headerOpacity.setValue(opacity);
  };

  return (
    <>
      <StatusBar
        backgroundColor={card.color || colors.clarityBlue}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        {/* Floating Header */}
        <Animated.View
          style={[styles.floatingHeader, { opacity: headerOpacity }]}
        >
          <TouchableOpacity
            style={styles.floatingBackButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.pureWhite} />
          </TouchableOpacity>

          <Text style={styles.floatingHeaderTitle} numberOfLines={1}>
            {card.name}
          </Text>

          <TouchableOpacity
            style={styles.floatingEditButton}
            onPress={handleEdit}
          >
            <Edit3 size={20} color={colors.pureWhite} />
          </TouchableOpacity>
        </Animated.View>

        {/* Fixed Action Buttons */}
        <View style={styles.fixedActions}>
          <TouchableOpacity
            style={styles.fixedActionButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.pureWhite} />
          </TouchableOpacity>

          <TouchableOpacity
            style={styles.fixedActionButton}
            onPress={handleEdit}
          >
            <Edit3 size={20} color={colors.pureWhite} />
          </TouchableOpacity>
        </View>

        <Animated.ScrollView
          style={styles.scrollView}
          onScroll={Animated.event(
            [{ nativeEvent: { contentOffset: { y: scrollY } } }],
            {
              useNativeDriver: false,
              listener: handleScroll,
            }
          )}
          scrollEventThrottle={16}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.pureWhite}
              colors={[card.color || colors.clarityBlue]}
              progressViewOffset={CARD_HEADER_HEIGHT}
            />
          }
          showsVerticalScrollIndicator={false}
          contentContainerStyle={{ paddingTop: CARD_HEADER_HEIGHT }}
        >
          <Animated.View style={{ opacity: fadeAnim }}>
            {renderUtilizationSection()}
            {renderPaymentSection()}
            {renderQuickActions()}
            {renderPaymentHistory()}
            {renderNotesSection()}

            <View style={styles.bottomSpacer} />
          </Animated.View>
        </Animated.ScrollView>

        {/* Parallax Card Header */}
        {renderParallaxCardHeader()}
      </SafeAreaView>
    </>
  );
};

export default CreditCardDetailModal;

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  floatingHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: HEADER_HEIGHT,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    backgroundColor: colors.clarityBlue,
    zIndex: 1000,
  },
  floatingBackButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  floatingHeaderTitle: {
    ...textStyles.h3,
    color: colors.pureWhite,
    flex: 1,
    textAlign: 'center',
    marginHorizontal: spacing.md,
  },
  floatingEditButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  fixedActions: {
    position: 'absolute',
    top: spacing.xl + spacing.lg,
    left: 0,
    right: 0,
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    zIndex: 999,
  },
  fixedActionButton: {
    padding: spacing.sm,
    borderRadius: 20,
    backgroundColor: 'rgba(0, 0, 0, 0.3)',
    borderWidth: 1,
    borderColor: 'rgba(255, 255, 255, 0.3)',
  },
  scrollView: {
    flex: 1,
  },
  parallaxCardHeader: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    height: CARD_HEADER_HEIGHT,
    zIndex: 10,
    overflow: 'hidden',
  },
  cardPattern: {
    position: 'absolute',
    top: -50,
    right: -50,
    width: 150,
    height: 150,
    borderRadius: 75,
    backgroundColor: 'rgba(255, 255, 255, 0.1)',
  },
  cardContent: {
    flex: 1,
    padding: spacing.xl,
    paddingTop: HEADER_HEIGHT,
    justifyContent: 'space-between',
  },
  cardTopRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
  },
  cardChip: {
    ...textStyles.h2,
    color: colors.pureWhite,
    opacity: 0.8,
    letterSpacing: 4,
  },
  cardMainInfo: {
    flex: 1,
    justifyContent: 'center',
  },
  cardName: {
    ...textStyles.h2,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  cardDetails: {
    ...textStyles.body,
    color: colors.pureWhite,
    opacity: 0.9,
  },
  cardBottomRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-end',
  },
  cardLimitLabel: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  cardLimitAmount: {
    ...textStyles.h3,
    color: colors.pureWhite,
  },
  utilizationMini: {
    alignItems: 'flex-end',
  },
  utilizationMiniLabel: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.8,
    marginBottom: spacing.xs,
  },
  utilizationMiniValue: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  section: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginVertical: spacing.sm,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  sectionTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  showMoreButton: {
    fontSize: 14,
    color: '#007AFF',
    fontWeight: '500',
  },
  utilizationCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  utilizationHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 16,
  },
  utilizationPercentage: {
    fontSize: 32,
    fontWeight: '800',
  },
  utilizationStatus: {
    fontSize: 12,
    fontWeight: '700',
    letterSpacing: 1,
  },
  progressContainer: {
    marginBottom: 16,
  },
  progressBar: {
    height: 8,
    backgroundColor: '#e9ecef',
    borderRadius: 4,
    overflow: 'hidden',
    marginBottom: 8,
  },
  progressFill: {
    height: '100%',
    borderRadius: 4,
  },
  progressLabels: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  progressLabel: {
    fontSize: 10,
    color: '#6c757d',
  },
  balanceBreakdown: {
    flexDirection: 'row',
    justifyContent: 'space-between',
  },
  balanceItem: {
    alignItems: 'center',
  },
  balanceLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  balanceValue: {
    fontSize: 16,
    fontWeight: '700',
    color: '#1a1a1a',
  },
  positiveValue: {
    color: '#28a745',
  },
  paymentCard: {
    padding: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  paymentRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    marginBottom: 16,
  },
  paymentInfo: {
    flex: 1,
  },
  paymentLabel: {
    fontSize: 14,
    color: '#6c757d',
    marginBottom: 4,
  },
  paymentDate: {
    fontSize: 16,
    fontWeight: '700',
    marginBottom: 4,
  },
  paymentStatus: {
    fontSize: 12,
    fontWeight: '500',
  },
  paymentAmounts: {
    alignItems: 'flex-end',
  },
  minimumPaymentLabel: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 4,
  },
  minimumPaymentAmount: {
    fontSize: 18,
    fontWeight: '700',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  paymentButton: {
    backgroundColor: '#007AFF',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  paymentButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  statementInfo: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingTop: 16,
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
  },
  statementText: {
    fontSize: 12,
    color: '#6c757d',
  },
  actionsGrid: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.md,
  },
  quickAction: {
    width: (SCREEN_WIDTH - spacing.lg * 2 - spacing.md) / 2,
    padding: spacing.lg,
    backgroundColor: colors.cloudGray,
    borderRadius: 16,
    alignItems: 'center',
    borderWidth: 1,
    borderColor: colors.cloudGray,
  },
  primaryAction: {
    backgroundColor: colors.pureWhite,
    borderColor: colors.clarityBlue,
    borderWidth: 2,
  },
  quickActionIcon: {
    width: 48,
    height: 48,
    borderRadius: 24,
    justifyContent: 'center',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quickActionText: {
    ...textStyles.caption,
    fontWeight: '600',
    color: colors.midnightInk,
    textAlign: 'center',
  },
  historyList: {
    gap: 12,
  },
  historyItem: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    padding: 12,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
  },
  historyInfo: {
    flex: 1,
  },
  historyDate: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  historyType: {
    fontSize: 12,
    color: '#6c757d',
    marginBottom: 2,
  },
  historyDescription: {
    fontSize: 12,
    color: '#495057',
  },
  historyAmount: {
    fontSize: 16,
    fontWeight: '700',
    color: '#28a745',
  },
  emptyHistory: {
    padding: 24,
    alignItems: 'center',
  },
  emptyHistoryText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
    marginBottom: 4,
  },
  emptyHistorySubtext: {
    fontSize: 14,
    color: '#9ca3af',
  },
  notesText: {
    fontSize: 14,
    color: '#495057',
    lineHeight: 20,
  },
  emptyNotesText: {
    fontSize: 14,
    color: '#9ca3af',
    fontStyle: 'italic',
  },
  bottomSpacer: {
    height: spacing.xxl,
  },
});
