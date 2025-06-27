import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
  Animated,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { useAnalyticsSafe } from '../../hooks/useAnalyticsSafe';
import { spacing } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import { Clock, CheckCircle, XCircle, Award } from 'lucide-react-native';
import ProgressBar from '../ui/ProgressBar';
import { Quiz, QuizQuestion, QuizComponentProps } from '../../types/education';

interface QuizState {
  currentQuestionIndex: number;
  answers: Record<string, string>;
  showExplanation: boolean;
  isAnswered: boolean;
  selectedAnswer: string | null;
  score: number;
  isCompleted: boolean;
  timeRemaining: number | null;
  startTime: Date;
  questionStartTime: Date;
}

export const QuizComponent: React.FC<QuizComponentProps> = ({
  quiz,
  language,
  onQuizComplete,
  onSkip,
}) => {
  const { theme } = useTheme();
  const { track, events } = useAnalyticsSafe();
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    showExplanation: false,
    isAnswered: false,
    selectedAnswer: null,
    score: 0,
    isCompleted: false,
    timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
    startTime: new Date(),
    questionStartTime: new Date(),
  });

  const [fadeAnim] = useState(new Animated.Value(1));

  // Timer effect
  useEffect(() => {
    let interval: NodeJS.Timeout;

    if (
      state.timeRemaining !== null &&
      state.timeRemaining > 0 &&
      !state.isCompleted
    ) {
      interval = setInterval(() => {
        setState(prev => {
          if (prev.timeRemaining !== null && prev.timeRemaining <= 1) {
            // Time's up - auto-submit quiz
            handleQuizComplete();
            return prev;
          }
          return {
            ...prev,
            timeRemaining:
              prev.timeRemaining !== null ? prev.timeRemaining - 1 : null,
          };
        });
      }, 1000);
    }

    return () => {
      if (interval) clearInterval(interval);
    };
  }, [state.timeRemaining, state.isCompleted]);

  const currentQuestion = quiz.questions[state.currentQuestionIndex];
  const totalQuestions = quiz.questions.length;
  const progress =
    ((state.currentQuestionIndex + (state.isAnswered ? 1 : 0)) /
      totalQuestions) *
    100;

  const handleAnswerSelect = (answer: string) => {
    if (state.isAnswered) return;

    setState(prev => ({
      ...prev,
      selectedAnswer: answer,
      isAnswered: true,
      showExplanation: true,
      answers: {
        ...prev.answers,
        [currentQuestion.id]: answer,
      },
    }));

    // Calculate score for this question
    const isCorrect = checkAnswerCorrect(currentQuestion, answer);
    if (isCorrect) {
      setState(prev => ({
        ...prev,
        score: prev.score + currentQuestion.points,
      }));
    }
  };

  const checkAnswerCorrect = (
    question: QuizQuestion,
    answer: string
  ): boolean => {
    switch (question.type) {
      case 'multiple-choice':
        const correctOption = question.options?.find(opt => opt.isCorrect);
        return correctOption?.id === answer;
      case 'true-false':
        return question.correctAnswer === answer;
      case 'fill-in-blank':
        return (
          question.correctAnswer?.toLowerCase().trim() ===
          answer.toLowerCase().trim()
        );
      default:
        return false;
    }
  };

  const handleNextQuestion = () => {
    if (state.currentQuestionIndex < totalQuestions - 1) {
      // Animate transition
      Animated.sequence([
        Animated.timing(fadeAnim, {
          toValue: 0,
          duration: 200,
          useNativeDriver: true,
        }),
        Animated.timing(fadeAnim, {
          toValue: 1,
          duration: 200,
          useNativeDriver: true,
        }),
      ]).start();

      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showExplanation: false,
        isAnswered: false,
        selectedAnswer: null,
        questionStartTime: new Date(),
      }));
    } else {
      handleQuizComplete();
    }
  };

  const handleQuizComplete = () => {
    const totalPossiblePoints = quiz.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
    const finalScore =
      totalPossiblePoints > 0 ? (state.score / totalPossiblePoints) * 100 : 0;
    const totalTimeSpent = Math.floor(
      (new Date().getTime() - state.startTime.getTime()) / 1000
    );

    // Track quiz completion
    track(events.education.quizAttempted, {
      quiz_id: quiz.id,
      quiz_title: quiz.title[language],
      final_score: finalScore,
      questions_answered: Object.keys(state.answers).length,
      total_questions: totalQuestions,
      time_spent_seconds: totalTimeSpent,
      language,
      completed: true,
    });

    setState(prev => ({ ...prev, isCompleted: true }));

    setTimeout(() => {
      onQuizComplete(finalScore, state.answers);
    }, 1000);
  };

  const handleSkipQuiz = () => {
    Alert.alert(
      'Skip Quiz',
      "Are you sure you want to skip this quiz? Your progress will be saved but you won't receive a score.",
      [
        { text: 'Continue Quiz', style: 'cancel' },
        { text: 'Skip', onPress: () => onSkip?.() },
      ]
    );
  };

  const formatTime = (seconds: number): string => {
    const mins = Math.floor(seconds / 60);
    const secs = seconds % 60;
    return `${mins}:${secs.toString().padStart(2, '0')}`;
  };

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.headerTop}>
        <Text style={[styles.quizTitle, { color: theme.textPrimary }]}>
          {quiz.title[language]}
        </Text>
        {state.timeRemaining !== null && (
          <View
            style={[
              styles.timerContainer,
              {
                backgroundColor:
                  state.timeRemaining < 60
                    ? theme.error
                    : theme.backgroundOffset,
              },
            ]}
          >
            <Icon
              name={Clock}
              size={16}
              color={
                state.timeRemaining < 60 ? theme.white : theme.textSecondary
              }
            />
            <Text
              style={[
                styles.timerText,
                {
                  color:
                    state.timeRemaining < 60
                      ? theme.white
                      : theme.textSecondary,
                },
              ]}
            >
              {formatTime(state.timeRemaining)}
            </Text>
          </View>
        )}
      </View>

      <Text style={[styles.quizDescription, { color: theme.textSecondary }]}>
        {quiz.description[language]}
      </Text>

      <View style={styles.progressSection}>
        <ProgressBar
          progress={progress}
          height={6}
          backgroundColor={theme.backgroundOffset}
          progressColor={theme.primary}
        />
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          Question {state.currentQuestionIndex + 1} of {totalQuestions}
        </Text>
      </View>
    </View>
  );

  const renderMultipleChoiceQuestion = (question: QuizQuestion) => (
    <View style={styles.questionContainer}>
      <Text style={[styles.questionText, { color: theme.textPrimary }]}>
        {question.question[language]}
      </Text>

      <View style={styles.optionsContainer}>
        {question.options?.map(option => {
          const isSelected = state.selectedAnswer === option.id;
          const isCorrect = option.isCorrect;
          const showResult = state.showExplanation;

          let dynamicStyle = {};
          let textColor = theme.textPrimary;
          let iconName: typeof CheckCircle | typeof XCircle | null = null;
          let iconColor = theme.textSecondary;

          if (showResult) {
            if (isSelected && isCorrect) {
              dynamicStyle = {
                backgroundColor: theme.success,
                borderColor: theme.success,
              };
              textColor = theme.white;
              iconName = CheckCircle;
              iconColor = theme.white;
            } else if (isSelected && !isCorrect) {
              dynamicStyle = {
                backgroundColor: theme.error,
                borderColor: theme.error,
              };
              textColor = theme.white;
              iconName = XCircle;
              iconColor = theme.white;
            } else if (!isSelected && isCorrect) {
              dynamicStyle = { borderColor: theme.success, borderWidth: 2 };
              iconName = CheckCircle;
              iconColor = theme.success;
            } else {
              dynamicStyle = { opacity: 0.6 };
            }
          } else if (isSelected) {
            dynamicStyle = {
              backgroundColor: theme.primary,
              borderColor: theme.primary,
            };
            textColor = theme.white;
          } else {
            dynamicStyle = {
              backgroundColor: theme.backgroundOffset,
              borderColor: theme.borderLight,
            };
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionButton, dynamicStyle]}
              onPress={() => handleAnswerSelect(option.id)}
              disabled={state.isAnswered}
              accessibilityLabel={`Option: ${option.text[language]}`}
              accessibilityState={{ selected: isSelected }}
            >
              <Text style={[styles.optionText, { color: textColor }]}>
                {option.text[language]}
              </Text>
              {showResult && iconName && (
                <Icon name={iconName} size={20} color={iconColor} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderTrueFalseQuestion = (question: QuizQuestion) => (
    <View style={styles.questionContainer}>
      <Text style={[styles.questionText, { color: theme.textPrimary }]}>
        {question.question[language]}
      </Text>

      <View style={styles.trueFalseContainer}>
        {['true', 'false'].map(answer => {
          const isSelected = state.selectedAnswer === answer;
          const isCorrect = question.correctAnswer === answer;
          const showResult = state.showExplanation;

          const buttonStyle = [styles.trueFalseButton];
          const textStyle = [
            styles.trueFalseText,
            { color: theme.textPrimary },
          ];
          let iconName: typeof CheckCircle | typeof XCircle | null = null;
          let iconColor = theme.textSecondary;

          if (showResult) {
            if (isSelected && isCorrect) {
              buttonStyle.push({ backgroundColor: theme.success });
              textStyle[1] = { color: theme.white };
              iconName = CheckCircle;
              iconColor = theme.white;
            } else if (isSelected && !isCorrect) {
              buttonStyle.push({ backgroundColor: theme.error });
              textStyle[1] = { color: theme.white };
              iconName = XCircle;
              iconColor = theme.white;
            } else if (!isSelected && isCorrect) {
              buttonStyle.push({ borderColor: theme.success, borderWidth: 2 });
              iconName = CheckCircle;
              iconColor = theme.success;
            } else {
              buttonStyle.push({ opacity: 0.6 });
            }
          } else if (isSelected) {
            buttonStyle.push({ backgroundColor: theme.primary });
            textStyle[1] = { color: theme.white };
          } else {
            buttonStyle.push({ backgroundColor: theme.backgroundOffset });
          }

          return (
            <TouchableOpacity
              key={answer}
              style={buttonStyle}
              onPress={() => handleAnswerSelect(answer)}
              disabled={state.isAnswered}
              accessibilityLabel={`${answer === 'true' ? 'True' : 'False'}`}
            >
              <Text style={textStyle}>
                {answer === 'true' ? 'True' : 'False'}
              </Text>
              {showResult && iconName && (
                <Icon name={iconName} size={20} color={iconColor} />
              )}
            </TouchableOpacity>
          );
        })}
      </View>
    </View>
  );

  const renderExplanation = () => {
    if (!state.showExplanation || !currentQuestion.explanation) return null;

    const isCorrect = checkAnswerCorrect(
      currentQuestion,
      state.selectedAnswer || ''
    );

    return (
      <Card
        style={[
          styles.explanationCard,
          { backgroundColor: isCorrect ? theme.success : theme.error },
        ]}
      >
        <View style={styles.explanationHeader}>
          <Icon
            name={isCorrect ? CheckCircle : XCircle}
            size={24}
            color={theme.white}
          />
          <Text style={[styles.explanationTitle, { color: theme.white }]}>
            {isCorrect ? 'Correct!' : 'Incorrect'}
          </Text>
        </View>
        <Text style={[styles.explanationText, { color: theme.white }]}>
          {currentQuestion.explanation[language]}
        </Text>
      </Card>
    );
  };

  const renderNavigationButtons = () => (
    <View style={styles.navigationButtons}>
      {onSkip && !state.isAnswered && (
        <Button
          title="Skip Quiz"
          variant="outline"
          onPress={handleSkipQuiz}
          style={styles.skipButton}
        />
      )}

      {state.isAnswered && (
        <Button
          title={
            state.currentQuestionIndex < totalQuestions - 1
              ? 'Next Question'
              : 'Complete Quiz'
          }
          onPress={handleNextQuestion}
          style={styles.nextButton}
        />
      )}
    </View>
  );

  const renderCompletionScreen = () => {
    const totalPossiblePoints = quiz.questions.reduce(
      (sum, q) => sum + q.points,
      0
    );
    const finalScore =
      totalPossiblePoints > 0 ? (state.score / totalPossiblePoints) * 100 : 0;
    const passed = finalScore >= quiz.passingScore;

    return (
      <View style={styles.completionContainer}>
        <Card style={styles.completionCard}>
          <View style={styles.completionHeader}>
            <Icon
              name={passed ? Award : XCircle}
              size={64}
              color={passed ? theme.success : theme.error}
            />
            <Text
              style={[styles.completionTitle, { color: theme.textPrimary }]}
            >
              Quiz Complete!
            </Text>
          </View>

          <View style={styles.scoreContainer}>
            <Text style={[styles.scoreLabel, { color: theme.textSecondary }]}>
              Your Score
            </Text>
            <Text
              style={[
                styles.scoreValue,
                { color: passed ? theme.success : theme.error },
              ]}
            >
              {Math.round(finalScore)}%
            </Text>
            <Text style={[styles.scoreSubtext, { color: theme.textSecondary }]}>
              {state.score} / {totalPossiblePoints} points
            </Text>
          </View>

          <View style={styles.resultContainer}>
            <Text
              style={[
                styles.resultText,
                { color: passed ? theme.success : theme.error },
              ]}
            >
              {passed
                ? 'Congratulations! You passed!'
                : `You need ${quiz.passingScore}% to pass.`}
            </Text>
          </View>
        </Card>
      </View>
    );
  };

  if (state.isCompleted) {
    return renderCompletionScreen();
  }

  return (
    <ScrollView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      contentContainerStyle={styles.scrollContent}
      showsVerticalScrollIndicator={false}
    >
      {renderHeader()}

      <Animated.View style={[styles.questionCard, { opacity: fadeAnim }]}>
        <Card>
          {currentQuestion.type === 'multiple-choice' &&
            renderMultipleChoiceQuestion(currentQuestion)}
          {currentQuestion.type === 'true-false' &&
            renderTrueFalseQuestion(currentQuestion)}

          {renderExplanation()}
          {renderNavigationButtons()}
        </Card>
      </Animated.View>
    </ScrollView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  header: {
    marginBottom: spacing.lg,
  },
  headerTop: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  quizTitle: {
    fontSize: 20,
    fontWeight: '600',
    flex: 1,
  },
  timerContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    borderRadius: 16,
    marginLeft: spacing.md,
  },
  timerText: {
    fontSize: 14,
    fontWeight: '500',
    marginLeft: spacing.xs,
  },
  quizDescription: {
    fontSize: 14,
    marginBottom: spacing.md,
  },
  progressSection: {
    marginTop: spacing.sm,
  },
  progressText: {
    fontSize: 12,
    marginTop: spacing.xs,
    textAlign: 'right',
  },
  questionCard: {
    marginBottom: spacing.xl,
  },
  questionContainer: {
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: 16,
    lineHeight: 24,
    marginBottom: spacing.lg,
    fontWeight: '500',
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    padding: spacing.md,
    borderRadius: 8,
    borderWidth: 1,
  },
  optionText: {
    fontSize: 16,
    flex: 1,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trueFalseButton: {
    flex: 1,
    flexDirection: 'row',
    justifyContent: 'center',
    alignItems: 'center',
    padding: spacing.lg,
    borderRadius: 8,
    borderWidth: 1,
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '500',
    marginRight: spacing.sm,
  },
  explanationCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
  },
  explanationHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  explanationTitle: {
    fontSize: 16,
    fontWeight: '600',
    marginLeft: spacing.sm,
  },
  explanationText: {
    fontSize: 14,
    lineHeight: 20,
  },
  navigationButtons: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  skipButton: {
    flex: 1,
  },
  nextButton: {
    flex: 2,
  },
  completionContainer: {
    flex: 1,
    justifyContent: 'center',
    padding: spacing.xl,
  },
  completionCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  completionHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  completionTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.lg,
  },
  scoreContainer: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  scoreLabel: {
    fontSize: 16,
    marginBottom: spacing.sm,
  },
  scoreValue: {
    fontSize: 48,
    fontWeight: 'bold',
    marginBottom: spacing.xs,
  },
  scoreSubtext: {
    fontSize: 14,
  },
  resultContainer: {
    alignItems: 'center',
  },
  resultText: {
    fontSize: 16,
    fontWeight: '600',
    textAlign: 'center',
  },
});

export default QuizComponent;
