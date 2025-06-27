import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  FlatList,
  TouchableOpacity,
  Alert,
  RefreshControl,
  ActivityIndicator,
  ScrollView,
  Dimensions,
  StatusBar,
  Animated,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter } from 'expo-router';
import { CreditCardItem } from '../../components/cards/CreditCardItem';
import { CreditCardSummary } from '../../components/cards/CreditCardSummary';
import { EmptyState } from '../../components/cards/EmptyState';
import { useCreditCards } from '../../hooks/useCreditCards';
import { CreditCard } from '../../types/creditCard';
import { colors } from '../../constants';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import { Plus, Lightbulb } from 'lucide-react-native';

const { width } = Dimensions.get('window');
const CARD_WIDTH = width - 32;
const CARD_MARGIN = 16;

const CardsScreen: React.FC = () => {
  const router = useRouter();
  const [refreshing, setRefreshing] = useState(false);
  const [currentCardIndex, setCurrentCardIndex] = useState(0);
  const scrollViewRef = useRef<ScrollView>(null);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  const {
    cards,
    loading,
    error,
    refreshCards,
    deleteCard,
    totalCreditLimit,
    totalUtilization,
    averageUtilization,
  } = useCreditCards();

  useEffect(() => {
    Animated.timing(fadeAnim, {
      toValue: 1,
      duration: 600,
      useNativeDriver: true,
    }).start();
  }, []);

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCards();
    } catch (error) {
      console.error('Failed to refresh cards:', error);
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddCard = () => {
    router.push('/modals/credit-card-form');
  };

  const handleEditCard = (card: CreditCard) => {
    router.push({
      pathname: '/modals/credit-card-form',
      params: { cardId: card.id },
    });
  };

  const handleViewCard = (card: CreditCard) => {
    router.push({
      pathname: '/modals/credit-card-detail',
      params: { cardId: card.id },
    });
  };

  const handleDeleteCard = (card: CreditCard) => {
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

  const handleCardScroll = (event: any) => {
    const contentOffset = event.nativeEvent.contentOffset.x;
    const newIndex = Math.round(contentOffset / (CARD_WIDTH + CARD_MARGIN));
    setCurrentCardIndex(newIndex);
  };

  const scrollToCard = (index: number) => {
    scrollViewRef.current?.scrollTo({
      x: index * (CARD_WIDTH + CARD_MARGIN),
      animated: true,
    });
  };

  const renderCardCarousel = () => {
    if (!cards || cards.length === 0) return null;

    return (
      <View style={styles.carouselContainer}>
        <ScrollView
          ref={scrollViewRef}
          horizontal
          pagingEnabled
          showsHorizontalScrollIndicator={false}
          onScroll={handleCardScroll}
          scrollEventThrottle={16}
          contentContainerStyle={styles.carouselContent}
          snapToInterval={CARD_WIDTH + CARD_MARGIN}
          decelerationRate="fast"
        >
          {cards.map((card, index) => (
            <View key={card.id} style={styles.cardContainer}>
              <CreditCardItem
                card={card}
                onPress={() => handleViewCard(card)}
                onEdit={() => handleEditCard(card)}
                onDelete={() => handleDeleteCard(card)}
                style={styles.carouselCard}
              />
            </View>
          ))}
        </ScrollView>

        {cards.length > 1 && (
          <View style={styles.pageIndicatorContainer}>
            {cards.map((_, index) => (
              <TouchableOpacity
                key={index}
                style={[
                  styles.pageIndicator,
                  currentCardIndex === index && styles.activePageIndicator,
                ]}
                onPress={() => scrollToCard(index)}
              />
            ))}
          </View>
        )}
      </View>
    );
  };

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>My Credit Cards</Text>
        <Text style={styles.subtitle}>
          {cards?.length || 0} card{cards?.length !== 1 ? 's' : ''} •{' '}
          {formatCurrency(totalCreditLimit)} total limit
        </Text>
      </View>

      {/* Apple Design Principle: Clarity - Single primary action in header */}
      <TouchableOpacity style={styles.addButton} onPress={handleAddCard}>
        <Plus size={16} color={colors.pureWhite} />
        <Text style={styles.addButtonText}>Add Card</Text>
      </TouchableOpacity>
    </Animated.View>
  );

  // Apple Design Principle: Clarity - Focus on primary card action only
  const renderPrimaryAction = () => (
    <Animated.View
      style={[styles.primaryActionContainer, { opacity: fadeAnim }]}
    >
      <TouchableOpacity
        style={styles.primaryActionButton}
        onPress={() => router.push('/modals/payment-optimizer')}
      >
        <View style={styles.primaryActionContent}>
          <View style={styles.primaryActionIcon}>
            <Lightbulb size={22} color={colors.surface} />
          </View>
          <View style={styles.primaryActionText}>
            <Text style={styles.primaryActionTitle}>Optimize Payments</Text>
            <Text style={styles.primaryActionSubtitle}>
              Maximize your credit score impact
            </Text>
          </View>
        </View>
      </TouchableOpacity>
    </Animated.View>
  );

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  if (loading && !cards) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#2B5CE6" />
          <Text style={styles.loadingText}>Loading your credit cards...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error && !cards) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorTitle}>Unable to Load Cards</Text>
          <Text style={styles.errorText}>
            Please check your connection and try again.
          </Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Try Again</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <>
      <StatusBar
        backgroundColor={colors.clarityBlue}
        barStyle="light-content"
      />
      <SafeAreaView style={styles.container}>
        <ScrollView
          style={styles.scrollView}
          showsVerticalScrollIndicator={false}
          refreshControl={
            <RefreshControl
              refreshing={refreshing}
              onRefresh={handleRefresh}
              tintColor={colors.clarityBlue}
              colors={[colors.clarityBlue]}
            />
          }
        >
          {renderHeader()}

          {cards && cards.length > 0 ? (
            <>
              <CreditCardSummary
                totalCreditLimit={totalCreditLimit}
                totalUtilization={totalUtilization}
                averageUtilization={averageUtilization}
                cardCount={cards.length}
              />

              {renderCardCarousel()}
              {renderPrimaryAction()}
            </>
          ) : (
            <EmptyState onAddCard={handleAddCard} />
          )}

          <View style={styles.bottomSpacer} />
        </ScrollView>
      </SafeAreaView>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'flex-start',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.clarityBlue,
    paddingTop: spacing.xl,
  },
  titleContainer: {
    flex: 1,
  },
  title: {
    ...textStyles.h1,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  subtitle: {
    ...textStyles.caption,
    color: colors.pureWhite,
    opacity: 0.8,
  },
  // Apple Design Principle: Clean, focused styling - removed unused button styles
  // Apple Design Principle: Clear, prominent primary action
  addButton: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16, // Apple: More generous padding
    paddingVertical: 10, // Apple: Better touch target
    backgroundColor: '#2B5CE6', // PRD: Clarity Blue
    borderRadius: 12, // Apple: More rounded for friendliness
    gap: 6, // Apple: Tighter spacing between icon and text
    shadowColor: '#2B5CE6', // Apple: Colored shadow for depth
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.2, // Apple: Subtle colored shadow
    shadowRadius: 4,
    elevation: 3,
  },
  addButtonText: {
    fontSize: 15, // Apple: Standard button text size
    fontWeight: '600', // Apple: Semibold for actions
    color: '#FFFFFF', // PRD: Pure White
    letterSpacing: -0.1, // Apple: Subtle letter spacing
  },
  carouselContainer: {
    marginTop: spacing.lg,
  },
  carouselContent: {
    paddingHorizontal: spacing.md,
  },
  cardContainer: {
    width: CARD_WIDTH,
    marginRight: CARD_MARGIN,
  },
  carouselCard: {
    width: '100%',
  },
  pageIndicatorContainer: {
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    marginTop: spacing.md,
    gap: spacing.xs,
  },
  pageIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutralGray,
    opacity: 0.3,
  },
  activePageIndicator: {
    backgroundColor: colors.clarityBlue,
    opacity: 1,
    width: 12,
  },
  // Apple Design Principle: Focused primary action with clear hierarchy
  primaryActionContainer: {
    paddingHorizontal: 24,
    paddingVertical: 20,
    backgroundColor: colors.pureWhite,
    marginTop: 16,
    borderRadius: 16,
    marginHorizontal: 16,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04, // Apple: Subtle shadow
    shadowRadius: 12, // Apple: Softer blur
    elevation: 3,
  },
  primaryActionButton: {
    padding: 20,
    borderRadius: 12,
    backgroundColor: '#2B5CE6', // PRD: Clarity Blue
  },
  primaryActionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  primaryActionIcon: {
    width: 44,
    height: 44,
    borderRadius: 22,
    backgroundColor: 'rgba(255, 255, 255, 0.2)', // Apple: Subtle overlay
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 16,
  },
  primaryActionText: {
    flex: 1,
  },
  primaryActionTitle: {
    fontSize: 17, // Apple: Standard action title size
    fontWeight: '600', // Apple: Semibold
    color: '#FFFFFF', // PRD: Pure White
    marginBottom: 4,
    letterSpacing: -0.1, // Apple: Subtle letter spacing
  },
  primaryActionSubtitle: {
    fontSize: 14,
    color: 'rgba(255, 255, 255, 0.8)', // Apple: Subtle secondary text
    lineHeight: 18,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  loadingText: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
    marginTop: spacing.md,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: spacing.xl,
  },
  errorTitle: {
    ...textStyles.h2,
    color: colors.errorRed,
    textAlign: 'center',
    marginBottom: spacing.sm,
  },
  errorText: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: spacing.lg,
  },
  retryButton: {
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.clarityBlue,
    borderRadius: 8,
  },
  retryButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
});

export default CardsScreen;
