import React, { useState, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Modal,
  Animated,
  Dimensions,
} from 'react-native';
import { X, ChevronLeft, ChevronRight } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width, height } = Dimensions.get('window');

interface TourStep {
  id: string;
  title: string;
  description: string;
  targetArea?: {
    x: number;
    y: number;
    width: number;
    height: number;
  };
}

interface QuickTourProps {
  isVisible: boolean;
  onClose: () => void;
  onComplete: () => void;
}

const tourSteps: TourStep[] = [
  {
    id: 'welcome',
    title: 'Welcome to ClariFi!',
    description: 'Let\'s take a quick tour of your new financial dashboard. This will help you understand all the powerful features available to you.',
  },
  {
    id: 'dashboard',
    title: 'Your Dashboard',
    description: 'This is your main hub. Here you\'ll see your spending overview, recent transactions, and key financial insights at a glance.',
    targetArea: { x: 20, y: 120, width: width - 40, height: 200 },
  },
  {
    id: 'spending',
    title: 'Spending Analysis',
    description: 'View your categorized spending with AI-powered insights. Track where your money goes and identify spending patterns.',
    targetArea: { x: 20, y: 340, width: width - 40, height: 150 },
  },
  {
    id: 'cards',
    title: 'Credit Card Management',
    description: 'Monitor your credit card utilization, get payment reminders, and receive optimization advice for better credit health.',
    targetArea: { x: 20, y: 510, width: width - 40, height: 120 },
  },
  {
    id: 'navigation',
    title: 'Easy Navigation',
    description: 'Use the bottom tabs to navigate between Dashboard, Transactions, Cards, and your Profile. Everything is organized for quick access.',
    targetArea: { x: 0, y: height - 100, width: width, height: 100 },
  },
  {
    id: 'complete',
    title: 'You\'re Ready!',
    description: 'That\'s it! You\'re now ready to take control of your finances with ClariFi. Explore at your own pace and discover all the features.',
  },
];

const QuickTour: React.FC<QuickTourProps> = ({ isVisible, onClose, onComplete }) => {
  const [currentStep, setCurrentStep] = useState(0);
  const fadeAnim = useRef(new Animated.Value(0)).current;

  React.useEffect(() => {
    if (isVisible) {
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 300,
        useNativeDriver: true,
      }).start();
    }
  }, [isVisible]);

  const handleNext = () => {
    if (currentStep < tourSteps.length - 1) {
      setCurrentStep(currentStep + 1);
    } else {
      handleComplete();
    }
  };

  const handlePrevious = () => {
    if (currentStep > 0) {
      setCurrentStep(currentStep - 1);
    }
  };

  const handleComplete = () => {
    Animated.timing(fadeAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
    }).start(() => {
      onComplete();
      onClose();
    });
  };

  const currentTourStep = tourSteps[currentStep];

  const renderTargetHighlight = () => {
    if (!currentTourStep.targetArea) return null;

    const { x, y, width: targetWidth, height: targetHeight } = currentTourStep.targetArea;

    return (
      <View style={styles.highlightContainer}>
        {/* Top overlay */}
        <View style={[styles.overlay, { height: y }]} />
        
        {/* Middle row with left, highlight, right */}
        <View style={[styles.middleRow, { top: y, height: targetHeight }]}>
          <View style={[styles.overlay, { width: x }]} />
          <View style={[styles.highlight, { width: targetWidth, height: targetHeight }]} />
          <View style={[styles.overlay, { flex: 1 }]} />
        </View>
        
        {/* Bottom overlay */}
        <View style={[styles.overlay, { flex: 1 }]} />
      </View>
    );
  };

  if (!isVisible) return null;

  return (
    <Modal
      visible={isVisible}
      transparent
      animationType="none"
      statusBarTranslucent
    >
      <Animated.View style={[styles.container, { opacity: fadeAnim }]}>
        {renderTargetHighlight()}
        
        <View style={styles.content}>
          {/* Close button */}
          <TouchableOpacity style={styles.closeButton} onPress={onClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* Step indicator */}
          <View style={styles.stepIndicator}>
            {tourSteps.map((_, index) => (
              <View
                key={index}
                style={[
                  styles.stepDot,
                  {
                    backgroundColor: index <= currentStep 
                      ? colors.primary 
                      : colors.neutral.light,
                  },
                ]}
              />
            ))}
          </View>

          {/* Tour content */}
          <View style={styles.tourContent}>
            <Text style={styles.tourTitle}>{currentTourStep.title}</Text>
            <Text style={styles.tourDescription}>{currentTourStep.description}</Text>
          </View>

          {/* Navigation buttons */}
          <View style={styles.navigationButtons}>
            <TouchableOpacity
              style={[
                styles.navButton,
                styles.previousButton,
                { opacity: currentStep > 0 ? 1 : 0.5 },
              ]}
              onPress={handlePrevious}
              disabled={currentStep === 0}
            >
              <ChevronLeft size={20} color={colors.primary} />
              <Text style={styles.navButtonText}>Previous</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.navButton, styles.nextButton]}
              onPress={handleNext}
            >
              <Text style={styles.navButtonTextPrimary}>
                {currentStep === tourSteps.length - 1 ? 'Get Started' : 'Next'}
              </Text>
              {currentStep < tourSteps.length - 1 && (
                <ChevronRight size={20} color={colors.surface} />
              )}
            </TouchableOpacity>
          </View>
        </View>
      </Animated.View>
    </Modal>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  highlightContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  overlay: {
    backgroundColor: 'rgba(0, 0, 0, 0.7)',
  },
  middleRow: {
    position: 'absolute',
    left: 0,
    right: 0,
    flexDirection: 'row',
  },
  highlight: {
    borderWidth: 3,
    borderColor: colors.primary,
    borderRadius: 8,
    backgroundColor: 'transparent',
  },
  content: {
    position: 'absolute',
    bottom: 60,
    left: spacing.lg,
    right: spacing.lg,
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  closeButton: {
    position: 'absolute',
    top: spacing.md,
    right: spacing.md,
    padding: spacing.xs,
  },
  stepIndicator: {
    flexDirection: 'row',
    justifyContent: 'center',
    marginBottom: spacing.lg,
    marginTop: spacing.sm,
  },
  stepDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    marginHorizontal: 4,
  },
  tourContent: {
    marginBottom: spacing.xl,
  },
  tourTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    marginBottom: spacing.sm,
    textAlign: 'center',
  },
  tourDescription: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
  },
  navButton: {
    flex: 1,
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: spacing.md,
    borderRadius: 12,
    minHeight: 48,
  },
  previousButton: {
    borderWidth: 1,
    borderColor: colors.primary,
    backgroundColor: 'transparent',
  },
  nextButton: {
    backgroundColor: colors.primary,
  },
  navButtonText: {
    ...textStyles.button,
    color: colors.primary,
    marginLeft: spacing.xs,
  },
  navButtonTextPrimary: {
    ...textStyles.button,
    color: colors.surface,
  },
});

export default QuickTour;