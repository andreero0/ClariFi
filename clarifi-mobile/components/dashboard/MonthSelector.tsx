import React, { useRef, useEffect } from 'react';
import { 
  View, 
  Text, 
  TouchableOpacity, 
  StyleSheet, 
  Animated,
  Dimensions 
} from 'react-native';
import { Ionicons } from '@expo/vector-icons';

interface MonthSelectorProps {
  currentMonth: Date;
  onMonthChange: (month: Date) => void;
}

const { width } = Dimensions.get('window');

export const MonthSelector: React.FC<MonthSelectorProps> = ({
  currentMonth,
  onMonthChange,
}) => {
  const slideAnim = useRef(new Animated.Value(0)).current;
  const fadeAnim = useRef(new Animated.Value(1)).current;

  const formatMonth = (date: Date) => {
    return date.toLocaleDateString('en-CA', { 
      month: 'long', 
      year: 'numeric' 
    });
  };

  const handleMonthChange = (direction: 'prev' | 'next') => {
    // Animate out
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 0,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: direction === 'next' ? -30 : 30,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start(() => {
      // Change month
      const newMonth = new Date(currentMonth);
      if (direction === 'next') {
        newMonth.setMonth(newMonth.getMonth() + 1);
      } else {
        newMonth.setMonth(newMonth.getMonth() - 1);
      }
      onMonthChange(newMonth);

      // Reset position
      slideAnim.setValue(direction === 'next' ? 30 : -30);

      // Animate in
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 40,
          useNativeDriver: true,
        }),
      ]).start();
    });
  };

  const isCurrentMonth = () => {
    const now = new Date();
    return currentMonth.getMonth() === now.getMonth() && 
           currentMonth.getFullYear() === now.getFullYear();
  };

  return (
    <View style={styles.container}>
      <TouchableOpacity
        style={styles.navButton}
        onPress={() => handleMonthChange('prev')}
        activeOpacity={0.7}
      >
        <Ionicons name="chevron-back" size={20} color="#2B5CE6" />
      </TouchableOpacity>

      <View style={styles.monthDisplay}>
        <Animated.View
          style={{
            opacity: fadeAnim,
            transform: [{ translateX: slideAnim }],
          }}
        >
          <Text style={styles.monthText}>{formatMonth(currentMonth)}</Text>
          {isCurrentMonth() && (
            <View style={styles.currentIndicator}>
              <View style={styles.currentDot} />
              <Text style={styles.currentText}>Current</Text>
            </View>
          )}
        </Animated.View>
      </View>

      <TouchableOpacity
        style={[styles.navButton, !isCurrentMonth() && styles.navButtonActive]}
        onPress={() => handleMonthChange('next')}
        activeOpacity={0.7}
        disabled={isCurrentMonth()}
      >
        <Ionicons 
          name="chevron-forward" 
          size={20} 
          color={isCurrentMonth() ? '#E2E8F0' : '#2B5CE6'} 
        />
      </TouchableOpacity>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginHorizontal: 24,
    marginBottom: 24,
    paddingHorizontal: 20,
    paddingVertical: 16,
    backgroundColor: '#FFFFFF',
    borderRadius: 16,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 4,
    elevation: 2,
  },
  navButton: {
    width: 40,
    height: 40,
    borderRadius: 12,
    backgroundColor: 'rgba(43, 92, 230, 0.08)',
    justifyContent: 'center',
    alignItems: 'center',
  },
  navButtonActive: {
    backgroundColor: 'rgba(43, 92, 230, 0.12)',
  },
  monthDisplay: {
    flex: 1,
    alignItems: 'center',
  },
  monthText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1A1F36',
    textAlign: 'center',
  },
  currentIndicator: {
    flexDirection: 'row',
    alignItems: 'center',
    marginTop: 4,
    gap: 4,
  },
  currentDot: {
    width: 6,
    height: 6,
    borderRadius: 3,
    backgroundColor: '#00C896',
  },
  currentText: {
    fontSize: 12,
    fontWeight: '500',
    color: '#00C896',
  },
});