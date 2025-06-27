import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, AlertTriangle, Check } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

const { width, height } = Dimensions.get('window');

interface ProcessingStage {
  id: number;
  title: string;
  status: 'pending' | 'active' | 'completed' | 'error';
}

// PRD: OCR Processing Screen - Feature 2.1
const OCRProcessingModal = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const capturedImageUri = params.capturedImageUri as string;

  // PRD: Progress stepper showing three stages
  const [stages, setStages] = useState<ProcessingStage[]>([
    { id: 1, title: 'Text Extraction', status: 'active' },
    { id: 2, title: 'Finding Transactions', status: 'pending' },
    { id: 3, title: 'Smart Categorization', status: 'pending' },
  ]);

  const [currentStage, setCurrentStage] = useState(0);
  const [isProcessing, setIsProcessing] = useState(true);
  const [hasError, setHasError] = useState(false);
  const [pageCount, setPageCount] = useState({ current: 1, total: 3 });

  // PRD: Animated scanning line moving top to bottom (2s duration, ease-in-out)
  const scanLineAnimation = useRef(new Animated.Value(0)).current;
  const textHighlightAnimation = useRef(new Animated.Value(0)).current;

  // Animation for processing stages
  useEffect(() => {
    // Start scanning line animation
    const scanAnimation = () => {
      Animated.loop(
        Animated.sequence([
          Animated.timing(scanLineAnimation, {
            toValue: 1,
            duration: 2000,
            useNativeDriver: true,
          }),
          Animated.timing(scanLineAnimation, {
            toValue: 0,
            duration: 0,
            useNativeDriver: true,
          }),
        ])
      ).start();
    };

    if (isProcessing) {
      scanAnimation();
    }

    return () => {
      scanLineAnimation.stopAnimation();
    };
  }, [isProcessing]);

  // PRD: Text highlights briefly in blue as found (100ms flash)
  useEffect(() => {
    if (currentStage === 0 && isProcessing) {
      const highlightInterval = setInterval(() => {
        Animated.sequence([
          Animated.timing(textHighlightAnimation, {
            toValue: 1,
            duration: 100,
            useNativeDriver: true,
          }),
          Animated.timing(textHighlightAnimation, {
            toValue: 0,
            duration: 100,
            useNativeDriver: true,
          }),
        ]).start();
      }, 1500);

      return () => clearInterval(highlightInterval);
    }
  }, [currentStage, isProcessing]);

  // Simulate processing stages
  useEffect(() => {
    if (!isProcessing) return;

    const stageTimings = [5000, 3000, 4000]; // Duration for each stage
    let stageIndex = 0;

    const processNextStage = () => {
      if (stageIndex < stages.length) {
        // Update current stage to completed and next to active
        setStages(prev =>
          prev.map((stage, index) => {
            if (index < stageIndex) return { ...stage, status: 'completed' };
            if (index === stageIndex) return { ...stage, status: 'completed' };
            if (index === stageIndex + 1) return { ...stage, status: 'active' };
            return stage;
          })
        );

        setCurrentStage(stageIndex + 1);
        stageIndex++;

        if (stageIndex < stages.length) {
          setTimeout(processNextStage, stageTimings[stageIndex] || 3000);
        } else {
          // All stages completed
          setTimeout(() => {
            setIsProcessing(false);
            router.push({
              pathname: '/modals/transaction-review',
              params: { imageUri: capturedImageUri },
            });
          }, 1500);
        }
      }
    };

    const initialTimer = setTimeout(() => {
      processNextStage();
    }, stageTimings[0]);

    return () => clearTimeout(initialTimer);
  }, []);

  const handleTryAgain = () => {
    setHasError(false);
    setIsProcessing(true);
    setStages(prev =>
      prev.map((stage, index) => ({
        ...stage,
        status: index === 0 ? 'active' : 'pending',
      }))
    );
    setCurrentStage(0);
  };

  const handleEnterManually = () => {
    router.push('/modals/manual-transaction-entry');
  };

  const renderStageIndicator = (stage: ProcessingStage, index: number) => {
    const isActive = stage.status === 'active';
    const isCompleted = stage.status === 'completed';
    const isError = stage.status === 'error';

    return (
      <View key={stage.id} style={styles.stageContainer}>
        <View
          style={[
            styles.stageIndicator,
            isActive && styles.activeStageIndicator,
            isCompleted && styles.completedStageIndicator,
            isError && styles.errorStageIndicator,
          ]}
        >
          {isCompleted ? (
            <Animated.View style={{ transform: [{ scale: 1 }] }}>
              <Check size={16} color={colors.surface} />
            </Animated.View>
          ) : isActive ? (
            <Animated.View
              style={[
                styles.activeDot,
                {
                  opacity: scanLineAnimation.interpolate({
                    inputRange: [0, 0.5, 1],
                    outputRange: [0.5, 1, 0.5],
                  }),
                },
              ]}
            />
          ) : (
            <View style={styles.pendingDot} />
          )}
        </View>
        <Text
          style={[
            styles.stageTitle,
            isActive && styles.activeStageTitle,
            isCompleted && styles.completedStageTitle,
          ]}
        >
          {stage.title}
        </Text>
      </View>
    );
  };

  if (hasError) {
    // PRD: OCR Processing Error State
    return (
      <View style={styles.container}>
        <View style={styles.errorOverlay}>
          {/* PRD: Original image shown at 40% opacity with problem areas highlighted */}
          <View style={styles.backgroundImageContainer}>
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.backgroundImageError}
            />
            <View style={styles.errorImageOverlay} />
          </View>

          <View style={styles.errorContent}>
            {/* PRD: Red exclamation icon (32dp) */}
            <AlertTriangle
              size={32}
              color={colors.error}
              style={styles.errorIcon}
            />

            {/* PRD: "Unable to read document" H3 in Error color */}
            <Text style={styles.errorTitle}>Unable to read document</Text>

            {/* PRD: Common solutions listed */}
            <View style={styles.solutionsList}>
              <Text style={styles.solutionItem}>• Ensure good lighting</Text>
              <Text style={styles.solutionItem}>• Avoid shadows and glare</Text>
              <Text style={styles.solutionItem}>
                • Include full statement page
              </Text>
            </View>

            {/* PRD: "Try Again" primary button */}
            <TouchableOpacity
              style={styles.tryAgainButton}
              onPress={handleTryAgain}
            >
              <Text style={styles.tryAgainButtonText}>Try Again</Text>
            </TouchableOpacity>

            {/* PRD: "Enter Manually" text link below */}
            <TouchableOpacity
              style={styles.manualEntryButton}
              onPress={handleEnterManually}
            >
              <Text style={styles.manualEntryButtonText}>Enter Manually</Text>
            </TouchableOpacity>
          </View>
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      {/* PRD: Full screen modal overlay with 80% white background */}
      <View style={styles.modalOverlay}>
        {/* PRD: Statement image displayed at 60% opacity as background */}
        <View style={styles.backgroundImageContainer}>
          <Image
            source={{ uri: capturedImageUri }}
            style={styles.backgroundImage}
          />
          <View style={styles.imageOverlay} />

          {/* PRD: Animated scanning line moving top to bottom (2s duration, ease-in-out) */}
          <Animated.View
            style={[
              styles.scanLine,
              {
                transform: [
                  {
                    translateY: scanLineAnimation.interpolate({
                      inputRange: [0, 1],
                      outputRange: [0, height * 0.6],
                    }),
                  },
                ],
              },
            ]}
          />

          {/* PRD: Extracted text briefly highlights in blue as found (100ms flash) */}
          <Animated.View
            style={[
              styles.textHighlight,
              {
                opacity: textHighlightAnimation,
              },
            ]}
          />
        </View>

        {/* Content overlay */}
        <View style={styles.contentOverlay}>
          {/* Close button */}
          <TouchableOpacity
            style={styles.closeButton}
            onPress={() => router.back()}
          >
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>

          {/* PRD: "Reading your statement..." H3 header with animated ellipsis */}
          <Text style={styles.processingTitle}>
            Reading your statement
            <Animated.Text style={{ opacity: scanLineAnimation }}>
              ...
            </Animated.Text>
          </Text>

          {/* PRD: Progress stepper showing three stages */}
          <View style={styles.stagesContainer}>
            {stages.map((stage, index) => renderStageIndicator(stage, index))}
          </View>

          {/* PRD: "Processing page 1 of 3" counter if multiple pages */}
          <Text style={styles.pageCounter}>
            Processing page {pageCount.current} of {pageCount.total}
          </Text>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  // PRD: Full screen modal overlay with 80% white background
  modalOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.8)',
  },
  // PRD: Statement image displayed at 60% opacity as background
  backgroundImageContainer: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
  },
  backgroundImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.6, // PRD: 60% opacity
  },
  backgroundImageError: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
    opacity: 0.4, // PRD: 40% opacity for error state
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(255, 255, 255, 0.2)',
  },
  // PRD: Animated scanning line
  scanLine: {
    position: 'absolute',
    left: 0,
    right: 0,
    height: 3,
    backgroundColor: colors.primary,
    shadowColor: colors.primary,
    shadowOffset: { width: 0, height: 0 },
    shadowOpacity: 0.8,
    shadowRadius: 8,
  },
  // PRD: Text highlights briefly in blue as found
  textHighlight: {
    position: 'absolute',
    top: '30%',
    left: '20%',
    width: '60%',
    height: 20,
    backgroundColor: colors.primary,
    opacity: 0.3,
    borderRadius: 4,
  },
  contentOverlay: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  closeButton: {
    position: 'absolute',
    top: 60,
    right: 24,
    width: 40,
    height: 40,
    borderRadius: 20,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    alignItems: 'center',
    justifyContent: 'center',
    zIndex: 10,
  },
  // PRD: "Reading your statement..." H3 header
  processingTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 40,
  },
  // PRD: Progress stepper showing three stages
  stagesContainer: {
    alignItems: 'center',
    marginBottom: 32,
  },
  stageContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 20,
    paddingVertical: 12,
    borderRadius: 12,
    minWidth: 200,
  },
  stageIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: colors.neutral.light,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  activeStageIndicator: {
    backgroundColor: colors.primary,
  },
  completedStageIndicator: {
    backgroundColor: colors.growth,
  },
  errorStageIndicator: {
    backgroundColor: colors.error,
  },
  activeDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.surface,
  },
  pendingDot: {
    width: 8,
    height: 8,
    borderRadius: 4,
    backgroundColor: colors.neutral.medium,
  },
  stageTitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    fontWeight: '500',
  },
  activeStageTitle: {
    color: colors.primary,
    fontWeight: '600',
  },
  completedStageTitle: {
    color: colors.growth,
    fontWeight: '600',
  },
  // PRD: Page counter
  pageCounter: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    paddingHorizontal: 16,
    paddingVertical: 8,
    borderRadius: 8,
  },
  // Error state styles
  errorOverlay: {
    flex: 1,
    backgroundColor: 'rgba(255, 255, 255, 0.95)',
  },
  errorImageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(229, 62, 62, 0.1)', // Highlight problem areas
  },
  errorContent: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorIcon: {
    marginBottom: 16,
  },
  errorTitle: {
    ...textStyles.h3,
    color: colors.error,
    textAlign: 'center',
    marginBottom: 24,
  },
  solutionsList: {
    alignSelf: 'stretch',
    backgroundColor: 'rgba(255, 255, 255, 0.9)',
    borderRadius: 12,
    paddingHorizontal: 20,
    paddingVertical: 16,
    marginBottom: 32,
  },
  solutionItem: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    marginBottom: 8,
    lineHeight: 24,
  },
  tryAgainButton: {
    backgroundColor: colors.primary,
    height: 48,
    borderRadius: 12,
    paddingHorizontal: 32,
    paddingVertical: 14,
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 16,
    minWidth: 200,
  },
  tryAgainButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  manualEntryButton: {
    paddingVertical: 12,
    paddingHorizontal: 16,
  },
  manualEntryButtonText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    textDecorationLine: 'underline',
  },
});

export default OCRProcessingModal;
