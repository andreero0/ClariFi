import React, { useState, useEffect, useRef } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
  Animated,
  Image,
  Alert,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ArrowLeft, X, AlertTriangle } from 'lucide-react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import {
  statementProcessingService,
  ProcessingStatus,
} from '../../services/statements/statementProcessingService';

// PRD: Statement Import Processing State
const StatementProcessingScreen = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const capturedImageUri = params.capturedImageUri as string;

  // PRD: Processing phases with specific order
  const [currentPhase, setCurrentPhase] = useState(0);
  const [progress, setProgress] = useState(0);
  const [isComplete, setIsComplete] = useState(false);
  const [processingError, setProcessingError] = useState<string | null>(null);
  const [statementId, setStatementId] = useState<string | null>(null);
  const [processingData, setProcessingData] = useState<ProcessingStatus | null>(
    null
  );

  // Animation values for dots
  const dotAnimations = [
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
    useRef(new Animated.Value(0)).current,
  ];

  // PRD: Three phase indicators as specified
  const phases = [
    {
      id: 0,
      title: 'Reading document',
      description: 'Extracting text from your statement',
      duration: 8000, // 8 seconds
    },
    {
      id: 1,
      title: 'Extracting transactions',
      description: 'Identifying individual transactions',
      duration: 12000, // 12 seconds
    },
    {
      id: 2,
      title: 'Categorizing expenses',
      description: 'Smart categorization using AI',
      duration: 10000, // 10 seconds
    },
  ];

  // Upload and start processing
  useEffect(() => {
    startProcessing();
  }, []);

  const startProcessing = async () => {
    try {
      if (!capturedImageUri) {
        setProcessingError('No image provided for processing');
        return;
      }

      // Upload the statement file
      const uploadResult = await statementProcessingService.uploadStatement({
        uri: capturedImageUri,
        name: `statement_${Date.now()}.jpg`,
        type: 'image/jpeg',
      });

      if (!uploadResult.success) {
        setProcessingError(uploadResult.error || 'Failed to upload statement');
        return;
      }

      setStatementId(uploadResult.statementId);

      // Start polling for processing status
      statementProcessingService
        .pollProcessingStatus(
          uploadResult.statementId,
          status => {
            setProcessingData(status);
            updateProgressFromStatus(status);
          },
          60, // 2 minutes max
          2000 // 2 second intervals
        )
        .then(finalStatus => {
          if (finalStatus) {
            if (finalStatus.status === 'completed') {
              setIsComplete(true);
              setTimeout(() => {
                router.push({
                  pathname: '/modals/statement-success',
                  params: {
                    imageUri: capturedImageUri,
                    statementId: uploadResult.statementId,
                    transactionCount: finalStatus.transactionCount || 0,
                  },
                });
              }, 2000);
            } else if (finalStatus.status === 'failed') {
              setProcessingError(
                finalStatus.errorMessage || 'Processing failed'
              );
            }
          } else {
            setProcessingError('Processing timed out. Please try again.');
          }
        });
    } catch (error) {
      console.error('Processing error:', error);
      setProcessingError('An unexpected error occurred');
    }
  };

  const updateProgressFromStatus = (status: ProcessingStatus) => {
    switch (status.status) {
      case 'pending':
        setCurrentPhase(0);
        setProgress(10);
        break;
      case 'processing':
        // Cycle through phases based on time or status details
        const phaseIndex = Math.min(Math.floor(progress / 33.33), 2);
        setCurrentPhase(phaseIndex);
        setProgress(Math.min(progress + 5, 95));
        break;
      case 'completed':
        setCurrentPhase(2);
        setProgress(100);
        setIsComplete(true);
        break;
      case 'failed':
        setProcessingError(status.errorMessage || 'Processing failed');
        break;
    }
  };

  // Animated dots for current phase
  useEffect(() => {
    const animateDots = () => {
      const animations = dotAnimations.map((dot, index) =>
        Animated.loop(
          Animated.sequence([
            Animated.delay(index * 200),
            Animated.timing(dot, {
              toValue: 1,
              duration: 600,
              useNativeDriver: true,
            }),
            Animated.timing(dot, {
              toValue: 0,
              duration: 600,
              useNativeDriver: true,
            }),
          ])
        )
      );

      Animated.parallel(animations).start();
    };

    if (currentPhase < phases.length && !isComplete) {
      animateDots();
    }

    return () => {
      dotAnimations.forEach(dot => dot.stopAnimation());
    };
  }, [currentPhase, isComplete]);

  const handleCancel = () => {
    router.back();
  };

  const handleRetry = () => {
    setProcessingError(null);
    setProgress(0);
    setCurrentPhase(0);
    setIsComplete(false);
    setStatementId(null);
    setProcessingData(null);
    startProcessing();
  };

  // Error state rendering
  if (processingError) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.header}>
          <TouchableOpacity
            style={styles.backButton}
            onPress={() => router.back()}
          >
            <ArrowLeft size={24} color={colors.primary} />
          </TouchableOpacity>
          <Text style={styles.logoText}>ClariFi</Text>
        </View>

        <View style={styles.content}>
          <View style={styles.errorContainer}>
            <AlertTriangle size={48} color={colors.error} />
            <Text style={styles.errorTitle}>Processing Failed</Text>
            <Text style={styles.errorMessage}>{processingError}</Text>

            <TouchableOpacity style={styles.retryButton} onPress={handleRetry}>
              <Text style={styles.retryButtonText}>Try Again</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.cancelButton}
              onPress={handleCancel}
            >
              <X size={20} color={colors.textSecondary} />
              <Text style={styles.cancelButtonText}>Cancel</Text>
            </TouchableOpacity>
          </View>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      {/* PRD: Header with back button */}
      <View style={styles.header}>
        <TouchableOpacity
          style={styles.backButton}
          onPress={() => router.back()}
        >
          <ArrowLeft size={24} color={colors.primary} />
        </TouchableOpacity>
        <Text style={styles.logoText}>ClariFi</Text>
      </View>

      <View style={styles.content}>
        {/* PRD: Captured image with 50% opacity overlay */}
        <View style={styles.imageContainer}>
          {capturedImageUri ? (
            <Image
              source={{ uri: capturedImageUri }}
              style={styles.capturedImage}
            />
          ) : (
            <View style={styles.imagePlaceholder}>
              <Text style={styles.imagePlaceholderText}>Statement Image</Text>
            </View>
          )}
          <View style={styles.imageOverlay} />
        </View>

        {/* PRD: Circular progress indicator with percentage text */}
        <View style={styles.progressContainer}>
          <View style={styles.circularProgress}>
            <View
              style={[
                styles.progressRing,
                {
                  transform: [
                    {
                      rotate: `${(progress / 100) * 360}deg`,
                    },
                  ],
                },
              ]}
            />
            <View style={styles.progressCenter}>
              <Text style={styles.progressPercentage}>
                {Math.round(progress)}%
              </Text>
            </View>
          </View>
        </View>

        {/* PRD: Three phase indicators with Clarity Blue highlighting */}
        <View style={styles.phasesContainer}>
          {phases.map((phase, index) => {
            const isActive = index === currentPhase && !isComplete;
            const isCompleted = index < currentPhase || isComplete;

            return (
              <View
                key={phase.id}
                style={[
                  styles.phaseItem,
                  isActive && styles.activePhase,
                  isCompleted && styles.completedPhase,
                ]}
              >
                <View style={styles.phaseHeader}>
                  <Text
                    style={[
                      styles.phaseTitle,
                      isActive && styles.activePhaseText,
                      isCompleted && styles.completedPhaseText,
                    ]}
                  >
                    {phase.title}
                    {/* PRD: Animated dots for active phase */}
                    {isActive && !isComplete && (
                      <View style={styles.dotsContainer}>
                        {dotAnimations.map((dot, dotIndex) => (
                          <Animated.Text
                            key={dotIndex}
                            style={[styles.dot, { opacity: dot }]}
                          >
                            •
                          </Animated.Text>
                        ))}
                      </View>
                    )}
                  </Text>
                </View>
                <Text
                  style={[
                    styles.phaseDescription,
                    isActive && styles.activePhaseText,
                    isCompleted && styles.completedPhaseText,
                  ]}
                >
                  {phase.description}
                </Text>
              </View>
            );
          })}
        </View>

        {/* PRD: Helper text */}
        <Text style={styles.helperText}>This usually takes 10-30 seconds</Text>

        {/* Processing status info */}
        {processingData && (
          <Text style={styles.statusText}>
            {processingData.bankName && `Bank: ${processingData.bankName}`}
            {processingData.transactionCount &&
              ` • ${processingData.transactionCount} transactions found`}
          </Text>
        )}

        {/* Spacer */}
        <View style={styles.spacer} />

        {/* PRD: Cancel button available at bottom */}
        <TouchableOpacity style={styles.cancelButton} onPress={handleCancel}>
          <X size={20} color={colors.textSecondary} />
          <Text style={styles.cancelButtonText}>Cancel</Text>
        </TouchableOpacity>
      </View>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.surface, // PRD Pure White
  },
  content: {
    flex: 1,
    paddingHorizontal: 24,
    paddingVertical: 32,
    alignItems: 'center',
  },
  // PRD: Header with logo and back arrow
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    width: '100%',
    marginBottom: 40,
  },
  backButton: {
    marginRight: 16,
    padding: 8,
  },
  logoText: {
    fontSize: 40,
    fontWeight: '700',
    color: colors.textPrimary,
  },
  // PRD: Captured image with 50% opacity overlay
  imageContainer: {
    width: '100%',
    height: 200,
    borderRadius: 12,
    overflow: 'hidden',
    position: 'relative',
    marginBottom: 40,
    backgroundColor: colors.neutral.light,
  },
  imagePlaceholder: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.neutral.light,
  },
  imagePlaceholderText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
  },
  capturedImage: {
    width: '100%',
    height: '100%',
    resizeMode: 'cover',
  },
  imageOverlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)', // PRD: 50% opacity overlay
  },
  // PRD: Circular progress indicator with percentage text
  progressContainer: {
    alignItems: 'center',
    marginBottom: 40,
  },
  circularProgress: {
    width: 120,
    height: 120,
    position: 'relative',
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressRing: {
    position: 'absolute',
    width: 120,
    height: 120,
    borderRadius: 60,
    borderWidth: 8,
    borderColor: colors.primary,
    borderTopColor: colors.neutral.light,
  },
  progressCenter: {
    alignItems: 'center',
    justifyContent: 'center',
  },
  progressPercentage: {
    ...textStyles.h2,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  // PRD: Three phase indicators with Clarity Blue highlighting
  phasesContainer: {
    width: '100%',
    marginBottom: 32,
  },
  phaseItem: {
    paddingVertical: 16,
    paddingHorizontal: 20,
    borderRadius: 12,
    marginBottom: 12,
    backgroundColor: colors.neutral.lightest,
  },
  activePhase: {
    backgroundColor: `${colors.primary}0A`, // 10% opacity Clarity Blue
    borderWidth: 1,
    borderColor: colors.primary,
  },
  completedPhase: {
    backgroundColor: `${colors.growth}0A`, // 10% opacity Growth Green
    borderWidth: 1,
    borderColor: colors.growth,
  },
  phaseHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 4,
  },
  phaseTitle: {
    ...textStyles.bodyRegular,
    fontWeight: '600',
    color: colors.textPrimary,
  },
  activePhaseText: {
    color: colors.primary,
  },
  completedPhaseText: {
    color: colors.growth,
  },
  phaseDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
  },
  // PRD: Animated dots for active phase
  dotsContainer: {
    flexDirection: 'row',
    marginLeft: 8,
  },
  dot: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    marginHorizontal: 2,
  },
  // PRD: Helper text
  helperText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 20,
  },
  spacer: {
    flex: 1,
  },
  // PRD: Cancel button at bottom
  cancelButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 12,
    paddingHorizontal: 20,
    backgroundColor: colors.neutral.lightest,
    borderRadius: 8,
  },
  cancelButtonText: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginLeft: 8,
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 24,
  },
  errorTitle: {
    ...textStyles.h2,
    color: colors.error,
    marginTop: 16,
    marginBottom: 8,
    textAlign: 'center',
  },
  errorMessage: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    marginBottom: 32,
    lineHeight: 24,
  },
  retryButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 16,
  },
  retryButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  statusText: {
    ...textStyles.caption,
    color: colors.textSecondary,
    textAlign: 'center',
    marginTop: 16,
  },
});

export default StatementProcessingScreen;
