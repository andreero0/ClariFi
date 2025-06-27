import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Alert,
} from 'react-native';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
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
}

export const SimpleQuizComponent: React.FC<QuizComponentProps> = ({
  quiz,
  language,
  onQuizComplete,
  onSkip,
}) => {
  const { theme } = useTheme();
  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: {},
    showExplanation: false,
    isAnswered: false,
    selectedAnswer: null,
    score: 0,
    isCompleted: false,
    timeRemaining: quiz.timeLimit ? quiz.timeLimit * 60 : null,
  });

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
      default:
        return false;
    }
  };

  const handleNextQuestion = () => {
    if (state.currentQuestionIndex < totalQuestions - 1) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
        showExplanation: false,
        isAnswered: false,
        selectedAnswer: null,
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

    setState(prev => ({ ...prev, isCompleted: true }));

    setTimeout(() => {
      onQuizComplete(finalScore, state.answers);
    }, 1000);
  };

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

          let backgroundColor = theme.backgroundOffset;
          let borderColor = theme.borderLight;
          let textColor = theme.textPrimary;

          if (showResult) {
            if (isSelected && isCorrect) {
              backgroundColor = theme.success;
              borderColor = theme.success;
              textColor = theme.white;
            } else if (isSelected && !isCorrect) {
              backgroundColor = theme.error;
              borderColor = theme.error;
              textColor = theme.white;
            } else if (isCorrect) {
              borderColor = theme.success;
            }
          } else if (isSelected) {
            backgroundColor = theme.primary;
            borderColor = theme.primary;
            textColor = theme.white;
          }

          return (
            <TouchableOpacity
              key={option.id}
              style={[styles.optionButton, { backgroundColor, borderColor }]}
              onPress={() => handleAnswerSelect(option.id)}
              disabled={state.isAnswered}
            >
              <Text style={[styles.optionText, { color: textColor }]}>
                {option.text[language]}
              </Text>
              {showResult && isCorrect && (
                <Icon
                  name={'check-circle' as any}
                  size={20}
                  color={textColor}
                />
              )}
              {showResult && isSelected && !isCorrect && (
                <Icon name={'x-circle' as any} size={20} color={textColor} />
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

          let backgroundColor = theme.backgroundOffset;
          let borderColor = theme.borderLight;
          let textColor = theme.textPrimary;

          if (showResult) {
            if (isSelected && isCorrect) {
              backgroundColor = theme.success;
              borderColor = theme.success;
              textColor = theme.white;
            } else if (isSelected && !isCorrect) {
              backgroundColor = theme.error;
              borderColor = theme.error;
              textColor = theme.white;
            } else if (isCorrect) {
              borderColor = theme.success;
            }
          } else if (isSelected) {
            backgroundColor = theme.primary;
            borderColor = theme.primary;
            textColor = theme.white;
          }

          return (
            <TouchableOpacity
              key={answer}
              style={[styles.trueFalseButton, { backgroundColor, borderColor }]}
              onPress={() => handleAnswerSelect(answer)}
              disabled={state.isAnswered}
            >
              <Text style={[styles.trueFalseText, { color: textColor }]}>
                {answer === 'true' ? 'True' : 'False'}
              </Text>
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
      <View
        style={[
          styles.explanationCard,
          { backgroundColor: isCorrect ? theme.success : theme.error },
        ]}
      >
        <View style={styles.explanationHeader}>
          <Icon
            name={(isCorrect ? 'check-circle' : 'x-circle') as any}
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
      </View>
    );
  };

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
              name={(passed ? 'award' : 'x-circle') as any}
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
    >
      <View style={styles.header}>
        <Text style={[styles.quizTitle, { color: theme.textPrimary }]}>
          {quiz.title[language]}
        </Text>
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

      <Card style={styles.questionCard}>
        {currentQuestion.type === 'multiple-choice' &&
          renderMultipleChoiceQuestion(currentQuestion)}
        {currentQuestion.type === 'true-false' &&
          renderTrueFalseQuestion(currentQuestion)}

        {renderExplanation()}

        <View style={styles.navigationButtons}>
          {onSkip && !state.isAnswered && (
            <Button
              title="Skip Quiz"
              variant="outline"
              onPress={() => onSkip?.()}
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
      </Card>
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
  quizTitle: {
    fontSize: 20,
    fontWeight: '600',
    marginBottom: spacing.sm,
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
  },
  explanationCard: {
    marginTop: spacing.lg,
    marginBottom: spacing.lg,
    padding: spacing.md,
    borderRadius: 8,
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

export default SimpleQuizComponent;
