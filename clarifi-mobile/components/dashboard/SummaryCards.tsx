import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { Badge } from '../ui/Badge';

interface SummaryCard {
  id: string;
  title: string;
  amount: number;
  previousAmount: number;
  icon: string;
  accentColor: string;
}

interface SummaryCardsProps {
  income: number;
  expenses: number;
  savings: number;
  previousIncome?: number;
  previousExpenses?: number;
  previousSavings?: number;
  onCardPress?: (cardId: string) => void;
}

const { width } = Dimensions.get('window');

export const SummaryCards: React.FC<SummaryCardsProps> = ({
  income,
  expenses,
  savings,
  previousIncome = 0,
  previousExpenses = 0,
  previousSavings = 0,
  onCardPress,
}) => {
  const scrollX = useRef(new Animated.Value(0)).current;
  const scaleAnims = useRef([
    new Animated.Value(1),
    new Animated.Value(1),
    new Animated.Value(1),
  ]).current;

  const cards: SummaryCard[] = [
    {
      id: 'income',
      title: 'Income',
      amount: income,
      previousAmount: previousIncome,
      icon: 'trending-up',
      accentColor: '#16A34A',
    },
    {
      id: 'expenses',
      title: 'Expenses',
      amount: expenses,
      previousAmount: previousExpenses,
      icon: 'cart-outline',
      accentColor: '#2563EB',
    },
    {
      id: 'savings',
      title: 'Savings',
      amount: savings,
      previousAmount: previousSavings,
      icon: 'wallet-outline',
      accentColor: '#4B5563',
    },
  ];

  const handleCardPress = (cardId: string, index: number) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    Animated.sequence([
      Animated.timing(scaleAnims[index], {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(scaleAnims[index], {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onCardPress?.(cardId);
  };

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-CA', {
      style: 'currency',
      currency: 'CAD',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(amount);
  };

  const getChangePercentage = (current: number, previous: number) => {
    if (previous === 0) return 0;
    return ((current - previous) / previous) * 100;
  };

  const AnimatedNumber: React.FC<{ value: number; style?: any }> = ({ value, style }) => {
    const animatedValue = useRef(new Animated.Value(0)).current;
    const [displayValue, setDisplayValue] = useState('$0');

    useEffect(() => {
      // Reset to 0 when value changes
      animatedValue.setValue(0);
      setDisplayValue('$0');

      // Add listener to update display value during animation
      const listener = animatedValue.addListener(({ value: currentValue }) => {
        setDisplayValue(formatCurrency(Math.round(currentValue)));
      });

      // Start animation
      Animated.timing(animatedValue, {
        toValue: value,
        duration: 1200,
        useNativeDriver: false,
      }).start();

      // Cleanup listener on unmount or value change
      return () => {
        animatedValue.removeListener(listener);
      };
    }, [value]);

    return (
      <Text style={style}>
        {displayValue}
      </Text>
    );
  };

  return (
    <ScrollView 
      horizontal 
      showsHorizontalScrollIndicator={false}
      style={styles.cardsScrollView}
      contentContainerStyle={styles.cardsContainer}
    >
      {cards.map((card, index) => {
        const change = getChangePercentage(card.amount, card.previousAmount);
        const isPositive = card.id === 'expenses' ? change <= 0 : change >= 0;
        
        const getCardStyle = (cardId: string) => {
          switch (cardId) {
            case 'income':
              return styles.incomeCard;
            case 'expenses':
              return styles.expensesCard;
            case 'savings':
              return styles.savingsCard;
            default:
              return {};
          }
        };
        
        const getTitleColor = (cardId: string) => {
          switch (cardId) {
            case 'income':
              return '#16A34A';
            case 'expenses':
              return '#2563EB';
            case 'savings':
              return '#4B5563';
            default:
              return '#718096';
          }
        };

        return (
          <Animated.View
            key={card.id}
            style={[
              styles.summaryCard,
              getCardStyle(card.id),
              {
                transform: [{ scale: scaleAnims[index] }],
              },
            ]}
          >
            <TouchableOpacity
              activeOpacity={0.9}
              onPress={() => handleCardPress(card.id, index)}
              style={styles.cardTouchable}
            >
              <Text style={[styles.cardLabel, { color: getTitleColor(card.id) }]}>
                {card.title}
              </Text>
              <AnimatedNumber value={card.amount} style={styles.cardAmount} />
              
              {/* Mini-breakdown for expenses card */}
              {card.id === 'expenses' && (
                <View style={styles.miniBreakdown}>
                  <View style={styles.miniCategory}>
                    <View style={[styles.miniCategoryDot, { backgroundColor: '#FF7A7A' }]} />
                    <Text style={styles.miniCategoryText}>Housing: $1,200</Text>
                  </View>
                  <View style={styles.miniCategory}>
                    <View style={[styles.miniCategoryDot, { backgroundColor: '#4ECDC4' }]} />
                    <Text style={styles.miniCategoryText}>Food: $850</Text>
                  </View>
                </View>
              )}
              
              {/* Percentage of income for savings card */}
              {card.id === 'savings' && (
                <Text style={[styles.savingsPercent, { color: getTitleColor(card.id) }]}>
                  {((card.amount / income) * 100).toFixed(1)}% of income
                </Text>
              )}
              
              <Badge
                variant={isPositive ? 'success' : 'error'}
                icon={
                  <Ionicons
                    name={isPositive ? 'trending-up' : 'trending-down'}
                    size={12}
                    color={isPositive ? '#166534' : '#991B1B'}
                  />
                }
              >
                {isPositive ? '+' : ''}{Math.abs(change).toFixed(1)}%
              </Badge>
            </TouchableOpacity>
          </Animated.View>
        );
      })}
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  cardsScrollView: {
    marginBottom: 8,
  },
  cardsContainer: {
    paddingHorizontal: 24,
    gap: 16,
    flexDirection: 'row',
  },
  summaryCard: {
    minWidth: 192,
    flexGrow: 1,
    flexShrink: 0,
    flexBasis: 0,
    paddingHorizontal: 16,
    paddingVertical: 16,
    borderRadius: 8,
    gap: 8,
  },
  incomeCard: {
    backgroundColor: '#F0FDF4',
  },
  expensesCard: {
    backgroundColor: '#EFF6FF',
  },
  savingsCard: {
    backgroundColor: '#F3F4F6',
  },
  cardTouchable: {
    flex: 1,
    gap: 8,
  },
  cardLabel: {
    fontSize: 12,
    fontWeight: '400',
  },
  cardAmount: {
    fontSize: 24,
    fontWeight: '600',
    color: '#1A1F36',
    letterSpacing: -0.25,
  },
  miniBreakdown: {
    marginTop: 4,
    gap: 3,
  },
  miniCategory: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  miniCategoryDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    marginRight: 6,
  },
  miniCategoryText: {
    fontSize: 10,
    fontWeight: '500',
    color: '#6B7280',
  },
  savingsPercent: {
    fontSize: 12,
    fontWeight: '600',
  },
});