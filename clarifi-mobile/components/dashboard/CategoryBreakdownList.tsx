import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  FlatList,
  PanResponder,
  Alert,
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';
import { IconWithBackground } from '../ui/IconWithBackground';
import { Progress } from '../ui/Progress';
import { Button } from '../ui/Button';

interface CategoryData {
  id: string;
  name: string;
  amount: number;
  budget: number;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  transactions: number;
}

interface CategoryBreakdownListProps {
  categories: CategoryData[];
  onCategoryPress?: (category: CategoryData) => void;
  onBudgetAdjust?: (categoryId: string, newBudget: number) => void;
  showAll?: boolean;
}

export const CategoryBreakdownList: React.FC<CategoryBreakdownListProps> = ({
  categories,
  onCategoryPress,
  onBudgetAdjust,
  showAll = false,
}) => {
  const [swipedCategory, setSwipedCategory] = useState<string | null>(null);
  const animatedValues = useRef(
    categories.reduce((acc, cat) => ({
      ...acc,
      [cat.id]: {
        opacity: new Animated.Value(0),
        translateY: new Animated.Value(30),
        scale: new Animated.Value(0.95),
        swipeX: new Animated.Value(0),
      },
    }), {})
  ).current;

  useEffect(() => {
    // Stagger animations for list items
    const animations = categories.map((cat, index) => {
      const anims = animatedValues[cat.id];
      return Animated.parallel([
        Animated.timing(anims.opacity, {
          toValue: 1,
          duration: 300,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(anims.translateY, {
          toValue: 0,
          friction: 8,
          tension: 40,
          delay: index * 50,
          useNativeDriver: true,
        }),
        Animated.spring(anims.scale, {
          toValue: 1,
          friction: 8,
          tension: 40,
          delay: index * 50,
          useNativeDriver: true,
        }),
      ]);
    });

    Animated.stagger(50, animations).start();
  }, [categories]);

  const getPercentageUsed = (amount: number, budget: number) => {
    return Math.min((amount / budget) * 100, 100);
  };

  const getPercentageOfTotal = (amount: number) => {
    const total = categories.reduce((sum, cat) => sum + cat.amount, 0);
    return ((amount / total) * 100).toFixed(1);
  };

  const getProgressColor = (percentage: number) => {
    if (percentage >= 90) return '#E53E3E';
    if (percentage >= 75) return '#F59E0B';
    return '#00C896';
  };

  const getIconVariant = (color: string): 'default' | 'success' | 'error' | 'warning' | 'brand' => {
    // Map category colors to variants
    switch (color) {
      case '#00C896':
      case '#4ECDC4':
        return 'success';
      case '#E53E3E':
      case '#FF7A7A':
        return 'error';
      case '#F59E0B':
      case '#F7B731':
        return 'warning';
      case '#2B5CE6':
      case '#5F27CD':
        return 'brand';
      default:
        return 'default';
    }
  };

  const createPanResponder = (categoryId: string) => {
    return PanResponder.create({
      onStartShouldSetPanResponder: () => true,
      onMoveShouldSetPanResponder: (_, gestureState) => {
        return Math.abs(gestureState.dx) > 5;
      },
      onPanResponderGrant: () => {
        setSwipedCategory(categoryId);
      },
      onPanResponderMove: (_, gestureState) => {
        if (gestureState.dx < 0) {
          animatedValues[categoryId].swipeX.setValue(gestureState.dx);
        }
      },
      onPanResponderRelease: (_, gestureState) => {
        if (gestureState.dx < -80) {
          // Show budget adjustment
          Animated.timing(animatedValues[categoryId].swipeX, {
            toValue: -80,
            duration: 200,
            useNativeDriver: true,
          }).start();
          Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
        } else {
          // Reset position
          Animated.spring(animatedValues[categoryId].swipeX, {
            toValue: 0,
            friction: 8,
            tension: 40,
            useNativeDriver: true,
          }).start();
          setSwipedCategory(null);
        }
      },
    });
  };

  const handleCategoryPress = (category: CategoryData) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    
    // Bounce animation
    const anims = animatedValues[category.id];
    Animated.sequence([
      Animated.timing(anims.scale, {
        toValue: 0.95,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anims.scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    onCategoryPress?.(category);
  };

  const handleBudgetAdjust = (category: CategoryData) => {
    Alert.prompt(
      'Adjust Budget',
      `Current budget for ${category.name}: $${category.budget.toLocaleString()}`,
      [
        {
          text: 'Cancel',
          style: 'cancel',
          onPress: () => {
            // Reset swipe
            Animated.spring(animatedValues[category.id].swipeX, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
            setSwipedCategory(null);
          },
        },
        {
          text: 'Update',
          onPress: (value) => {
            const newBudget = parseFloat(value || '0');
            if (!isNaN(newBudget) && newBudget > 0) {
              onBudgetAdjust?.(category.id, newBudget);
              Haptics.notificationAsync(Haptics.NotificationFeedbackType.Success);
            }
            // Reset swipe
            Animated.spring(animatedValues[category.id].swipeX, {
              toValue: 0,
              friction: 8,
              tension: 40,
              useNativeDriver: true,
            }).start();
            setSwipedCategory(null);
          },
        },
      ],
      'plain-text',
      category.budget.toString(),
      'numeric'
    );
  };

  const renderCategory = ({ item: category }: { item: CategoryData }) => {
    const percentage = getPercentageUsed(category.amount, category.budget);
    const totalPercentage = getPercentageOfTotal(category.amount);
    const progressColor = getProgressColor(percentage);
    const anims = animatedValues[category.id];

    return (
      <Animated.View
        style={[
          styles.categoryWrapper,
          {
            opacity: anims.opacity,
            transform: [
              { translateY: anims.translateY },
              { scale: anims.scale },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.categoryItem}
          onPress={() => handleCategoryPress(category)}
          activeOpacity={0.9}
        >
          <View style={styles.categoryRow}>
            <IconWithBackground
              icon={<Ionicons name={category.icon} />}
              variant={getIconVariant(category.color)}
            />

            <View style={styles.categoryInfo}>
              <View style={styles.categoryHeader}>
                <Text style={styles.categoryName}>{category.name}</Text>
                <Text style={styles.amountSpent}>${category.amount.toLocaleString()}</Text>
              </View>
              <Progress 
                value={percentage} 
                color={category.color}
              />
            </View>
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  const displayCategories = showAll ? categories : categories.slice(0, 5);

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Top Categories</Text>
        <Button
          variant="neutral-tertiary"
          size="small"
          onPress={() => console.log('See all categories')}
        >
          See all
        </Button>
      </View>

      <FlatList
        data={displayCategories}
        renderItem={renderCategory}
        keyExtractor={(item) => item.id}
        scrollEnabled={false}
        showsVerticalScrollIndicator={false}
        ItemSeparatorComponent={() => <View style={styles.separator} />}
      />
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
  categoryWrapper: {
    marginBottom: 8,
  },
  categoryItem: {
    backgroundColor: '#F9FAFB',
    borderRadius: 8,
    padding: 16,
  },
  categoryRow: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: 16,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: 8,
  },
  categoryName: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F36',
  },
  amountSpent: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1A1F36',
  },
  separator: {
    height: 8,
  },
});