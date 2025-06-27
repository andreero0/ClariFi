import React, { useRef, useEffect, useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Animated,
  Modal,
  Dimensions,
  PanResponder,
} from 'react-native';
import { BlurView } from 'expo-blur';
import { LinearGradient } from 'expo-linear-gradient';
import { Ionicons } from '@expo/vector-icons';
import * as Haptics from 'expo-haptics';

interface QuickAction {
  id: string;
  title: string;
  subtitle: string;
  icon: keyof typeof Ionicons.glyphMap;
  color: string;
  gradientColors: string[];
  onPress: () => void;
}

interface QuickActionsMenuProps {
  visible: boolean;
  onClose: () => void;
  actions?: QuickAction[];
}

const { width, height } = Dimensions.get('window');

const defaultActions: QuickAction[] = [
  {
    id: 'add-expense',
    title: 'Add Expense',
    subtitle: 'Record new spending',
    icon: 'card-outline',
    color: '#E53E3E',
    gradientColors: ['#E53E3E', '#FC8181'],
    onPress: () => console.log('Add Expense'),
  },
  {
    id: 'add-income',
    title: 'Add Income',
    subtitle: 'Record new earnings',
    icon: 'trending-up',
    color: '#00C896',
    gradientColors: ['#00C896', '#48BB78'],
    onPress: () => console.log('Add Income'),
  },
  {
    id: 'set-budget',
    title: 'Set Budget',
    subtitle: 'Create spending limit',
    icon: 'pie-chart-outline',
    color: '#2B5CE6',
    gradientColors: ['#2B5CE6', '#4B7BF5'],
    onPress: () => console.log('Set Budget'),
  },
  {
    id: 'export-data',
    title: 'Export Data',
    subtitle: 'Download your reports',
    icon: 'download-outline',
    color: '#6B5DD3',
    gradientColors: ['#6B5DD3', '#9F7AEA'],
    onPress: () => console.log('Export Data'),
  },
  {
    id: 'view-goals',
    title: 'View Goals',
    subtitle: 'Check your progress',
    icon: 'flag-outline',
    color: '#F59E0B',
    gradientColors: ['#F59E0B', '#FBD38D'],
    onPress: () => console.log('View Goals'),
  },
  {
    id: 'settings',
    title: 'Settings',
    subtitle: 'Customize your app',
    icon: 'settings-outline',
    color: '#718096',
    gradientColors: ['#718096', '#A0AEC0'],
    onPress: () => console.log('Settings'),
  },
];

export const QuickActionsMenu: React.FC<QuickActionsMenuProps> = ({
  visible,
  onClose,
  actions = defaultActions,
}) => {
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(0.8)).current;
  const [panY, setPanY] = useState(0);

  const actionAnims = useRef(
    actions.reduce((acc, action) => ({
      ...acc,
      [action.id]: {
        scale: new Animated.Value(0),
        opacity: new Animated.Value(0),
        rotate: new Animated.Value(0),
      },
    }), {})
  ).current;

  useEffect(() => {
    if (visible) {
      // Show animation
      Animated.parallel([
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 300,
          useNativeDriver: true,
        }),
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
        Animated.spring(scaleAnim, {
          toValue: 1,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }),
      ]).start(() => {
        // Stagger action button animations
        const animations = actions.map((action, index) => {
          const anim = actionAnims[action.id];
          return Animated.parallel([
            Animated.spring(anim.scale, {
              toValue: 1,
              friction: 6,
              tension: 40,
              delay: index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim.opacity, {
              toValue: 1,
              duration: 200,
              delay: index * 50,
              useNativeDriver: true,
            }),
            Animated.timing(anim.rotate, {
              toValue: 1,
              duration: 400,
              delay: index * 50,
              useNativeDriver: true,
            }),
          ]);
        });

        Animated.stagger(50, animations).start();
      });

      Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Light);
    } else {
      // Hide animation
      const hideAnimations = actions.map(action => {
        const anim = actionAnims[action.id];
        return Animated.parallel([
          Animated.timing(anim.scale, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
          Animated.timing(anim.opacity, {
            toValue: 0,
            duration: 150,
            useNativeDriver: true,
          }),
        ]);
      });

      Animated.parallel([
        ...hideAnimations,
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(slideAnim, {
          toValue: height,
          duration: 250,
          useNativeDriver: true,
        }),
      ]).start();
    }
  }, [visible]);

  const panResponder = PanResponder.create({
    onStartShouldSetPanResponder: (_, gestureState) => {
      return Math.abs(gestureState.dy) > 5;
    },
    onMoveShouldSetPanResponder: (_, gestureState) => {
      return gestureState.dy > 0 && Math.abs(gestureState.dy) > Math.abs(gestureState.dx);
    },
    onPanResponderMove: (_, gestureState) => {
      if (gestureState.dy > 0) {
        setPanY(gestureState.dy);
        slideAnim.setValue(gestureState.dy);
      }
    },
    onPanResponderRelease: (_, gestureState) => {
      if (gestureState.dy > 100 || gestureState.vy > 0.5) {
        onClose();
      } else {
        Animated.spring(slideAnim, {
          toValue: 0,
          friction: 8,
          tension: 50,
          useNativeDriver: true,
        }).start();
      }
      setPanY(0);
    },
  });

  const handleActionPress = (action: QuickAction) => {
    Haptics.impactAsync(Haptics.ImpactFeedbackStyle.Medium);
    
    // Animate button press
    const anim = actionAnims[action.id];
    Animated.sequence([
      Animated.timing(anim.scale, {
        toValue: 0.9,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.spring(anim.scale, {
        toValue: 1,
        friction: 3,
        tension: 40,
        useNativeDriver: true,
      }),
    ]).start();

    // Execute action and close menu
    setTimeout(() => {
      action.onPress();
      onClose();
    }, 150);
  };

  const renderActionButton = (action: QuickAction, index: number) => {
    const anim = actionAnims[action.id];
    const rotation = anim.rotate.interpolate({
      inputRange: [0, 1],
      outputRange: ['180deg', '0deg'],
    });

    return (
      <Animated.View
        key={action.id}
        style={[
          styles.actionWrapper,
          {
            opacity: anim.opacity,
            transform: [
              { scale: anim.scale },
              { rotate: rotation },
            ],
          },
        ]}
      >
        <TouchableOpacity
          style={styles.actionButton}
          onPress={() => handleActionPress(action)}
          activeOpacity={0.9}
        >
          <LinearGradient
            colors={action.gradientColors}
            style={styles.actionGradient}
            start={{ x: 0, y: 0 }}
            end={{ x: 1, y: 1 }}
          >
            <View style={styles.actionIcon}>
              <Ionicons name={action.icon} size={24} color="#FFFFFF" />
            </View>
            <View style={styles.actionText}>
              <Text style={styles.actionTitle}>{action.title}</Text>
              <Text style={styles.actionSubtitle}>{action.subtitle}</Text>
            </View>
            <View style={styles.actionArrow}>
              <Ionicons name="chevron-forward" size={20} color="rgba(255,255,255,0.7)" />
            </View>
          </LinearGradient>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <Modal
      visible={visible}
      transparent
      animationType="none"
      statusBarTranslucent
      onRequestClose={onClose}
    >
      <Animated.View style={[styles.overlay, { opacity: fadeAnim }]}>
        <BlurView intensity={20} style={styles.blurView}>
          <TouchableOpacity
            style={styles.backdrop}
            activeOpacity={1}
            onPress={onClose}
          />
        </BlurView>

        <Animated.View
          {...panResponder.panHandlers}
          style={[
            styles.menuContainer,
            {
              transform: [
                { translateY: slideAnim },
                { scale: scaleAnim },
              ],
            },
          ]}
        >
          <View style={styles.handle} />
          
          <View style={styles.header}>
            <Text style={styles.title}>Quick Actions</Text>
            <TouchableOpacity style={styles.closeButton} onPress={onClose}>
              <Ionicons name="close" size={24} color="#718096" />
            </TouchableOpacity>
          </View>

          <View style={styles.actionsGrid}>
            {actions.map((action, index) => renderActionButton(action, index))}
          </View>

          <View style={styles.footer}>
            <Text style={styles.footerText}>Tap any action to get started</Text>
          </View>
        </Animated.View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  overlay: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  blurView: {
    ...StyleSheet.absoluteFillObject,
  },
  backdrop: {
    flex: 1,
  },
  menuContainer: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#FFFFFF',
    borderTopLeftRadius: 24,
    borderTopRightRadius: 24,
    paddingTop: 8,
    paddingBottom: 34, // Safe area bottom
    maxHeight: height * 0.8,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: -4 },
    shadowOpacity: 0.15,
    shadowRadius: 12,
    elevation: 12,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: '#E2E8F0',
    borderRadius: 2,
    alignSelf: 'center',
    marginBottom: 16,
  },
  header: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    paddingHorizontal: 24,
    marginBottom: 24,
  },
  title: {
    fontSize: 20,
    fontWeight: '700',
    color: '#1A1F36',
  },
  closeButton: {
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: '#F7F9FC',
    justifyContent: 'center',
    alignItems: 'center',
  },
  actionsGrid: {
    paddingHorizontal: 24,
    gap: 12,
  },
  actionWrapper: {
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.1,
    shadowRadius: 8,
    elevation: 4,
  },
  actionButton: {
    borderRadius: 16,
    overflow: 'hidden',
  },
  actionGradient: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 20,
  },
  actionIcon: {
    width: 48,
    height: 48,
    borderRadius: 12,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
    justifyContent: 'center',
    alignItems: 'center',
    marginRight: 16,
  },
  actionText: {
    flex: 1,
  },
  actionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#FFFFFF',
    marginBottom: 2,
  },
  actionSubtitle: {
    fontSize: 12,
    fontWeight: '400',
    color: 'rgba(255, 255, 255, 0.8)',
  },
  actionArrow: {
    marginLeft: 12,
  },
  footer: {
    alignItems: 'center',
    paddingTop: 24,
    paddingHorizontal: 24,
  },
  footerText: {
    fontSize: 14,
    fontWeight: '400',
    color: '#718096',
    textAlign: 'center',
  },
});