import React, { useRef } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Dimensions,
} from 'react-native';
import { PanGestureHandler, State } from 'react-native-gesture-handler';
import { Transaction } from '../../services/storage/dataModels';
import {
  TransactionListItem,
  TransactionListItemProps,
} from './TransactionListItem';

export interface SwipeAction {
  text: string;
  color: string;
  icon?: string;
  onPress: () => void;
}

export interface SwipeableTransactionItemProps
  extends TransactionListItemProps {
  leftActions?: SwipeAction[];
  rightActions?: SwipeAction[];
  onSwipeLeft?: () => void;
  onSwipeRight?: () => void;
}

export const SwipeableTransactionItem: React.FC<
  SwipeableTransactionItemProps
> = ({
  leftActions = [],
  rightActions = [],
  onSwipeLeft,
  onSwipeRight,
  ...transactionItemProps
}) => {
  const translateX = useRef(new Animated.Value(0)).current;
  const lastGestureState = useRef(0);

  const onGestureEvent = Animated.event(
    [{ nativeEvent: { translationX: translateX } }],
    { useNativeDriver: false }
  );

  const onHandlerStateChange = (event: any) => {
    if (event.nativeEvent.oldState === State.ACTIVE) {
      const { translationX } = event.nativeEvent;
      lastGestureState.current = translationX;

      // Determine swipe direction and threshold
      const threshold = 80;

      if (translationX > threshold && leftActions.length > 0) {
        // Swiped right - show left actions
        Animated.spring(translateX, {
          toValue: 120,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        onSwipeRight?.();
      } else if (translationX < -threshold && rightActions.length > 0) {
        // Swiped left - show right actions
        Animated.spring(translateX, {
          toValue: -120,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
        onSwipeLeft?.();
      } else {
        // Return to center
        Animated.spring(translateX, {
          toValue: 0,
          useNativeDriver: false,
          tension: 100,
          friction: 8,
        }).start();
      }
    }
  };

  const resetSwipe = () => {
    Animated.spring(translateX, {
      toValue: 0,
      useNativeDriver: false,
      tension: 100,
      friction: 8,
    }).start();
  };

  const renderActions = (actions: SwipeAction[], side: 'left' | 'right') => {
    if (actions.length === 0) return null;

    return (
      <View
        style={[
          styles.actionsContainer,
          side === 'left' ? styles.leftActions : styles.rightActions,
        ]}
      >
        {actions.map((action, index) => (
          <TouchableOpacity
            key={index}
            style={[styles.actionButton, { backgroundColor: action.color }]}
            onPress={() => {
              action.onPress();
              resetSwipe();
            }}
          >
            {action.icon && (
              <Text style={styles.actionIcon}>{action.icon}</Text>
            )}
            <Text style={styles.actionText}>{action.text}</Text>
          </TouchableOpacity>
        ))}
      </View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Left Actions */}
      {renderActions(leftActions, 'left')}

      {/* Right Actions */}
      {renderActions(rightActions, 'right')}

      {/* Main Transaction Item */}
      <PanGestureHandler
        onGestureEvent={onGestureEvent}
        onHandlerStateChange={onHandlerStateChange}
      >
        <Animated.View
          style={[
            styles.transactionContainer,
            {
              transform: [{ translateX }],
            },
          ]}
        >
          <TransactionListItem {...transactionItemProps} />
        </Animated.View>
      </PanGestureHandler>
    </View>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    position: 'relative',
    backgroundColor: '#f8f9fa',
  },
  transactionContainer: {
    backgroundColor: '#ffffff',
    zIndex: 1,
  },
  actionsContainer: {
    position: 'absolute',
    top: 0,
    bottom: 0,
    flexDirection: 'row',
    alignItems: 'center',
    zIndex: 0,
  },
  leftActions: {
    left: 0,
    paddingLeft: 16,
  },
  rightActions: {
    right: 0,
    paddingRight: 16,
  },
  actionButton: {
    width: 80,
    height: '80%',
    justifyContent: 'center',
    alignItems: 'center',
    marginHorizontal: 4,
    borderRadius: 8,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 2,
    elevation: 2,
  },
  actionIcon: {
    fontSize: 20,
    color: '#ffffff',
    marginBottom: 4,
  },
  actionText: {
    fontSize: 12,
    fontWeight: '600',
    color: '#ffffff',
    textAlign: 'center',
  },
});
