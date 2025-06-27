import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  SafeAreaView,
  Alert,
} from 'react-native';
import { useTranslation } from 'react-i18next';
import { useTheme } from '../../context/ThemeContext';
import { spacing } from '../../constants/spacing';
import { Card } from '../ui/Card';
import { Button } from '../ui/Button';
import Icon from '../ui/Icon';
import ProgressBar from '../ui/ProgressBar';
import { Quiz, QuizQuestion, QuizResult } from '../../types/education';

interface QuizInterfaceProps {
  quiz: Quiz;
  onComplete: (result: QuizResult) => void;
  onClose: () => void;
}

interface QuizState {
  currentQuestionIndex: number;
  answers: Array<{ questionId: string; answer: string }>;
  showResult: boolean;
  result: QuizResult | null;
  timeStarted: Date;
}

export const QuizInterface: React.FC<QuizInterfaceProps> = ({
  quiz,
  onComplete,
  onClose,
}) => {
  const { t } = useTranslation();
  const { theme } = useTheme();

  const [state, setState] = useState<QuizState>({
    currentQuestionIndex: 0,
    answers: [],
    showResult: false,
    result: null,
    timeStarted: new Date(),
  });

  const currentQuestion = quiz.questions[state.currentQuestionIndex];
  const isLastQuestion =
    state.currentQuestionIndex === quiz.questions.length - 1;
  const progress =
    ((state.currentQuestionIndex + 1) / quiz.questions.length) * 100;

  const selectAnswer = (questionId: string, answer: string) => {
    setState(prev => {
      const newAnswers = prev.answers.filter(a => a.questionId !== questionId);
      newAnswers.push({ questionId, answer });
      return { ...prev, answers: newAnswers };
    });
  };

  const getCurrentAnswer = (questionId: string): string | null => {
    const answer = state.answers.find(a => a.questionId === questionId);
    return answer ? answer.answer : null;
  };

  const nextQuestion = () => {
    if (isLastQuestion) {
      completeQuiz();
    } else {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex + 1,
      }));
    }
  };

  const previousQuestion = () => {
    if (state.currentQuestionIndex > 0) {
      setState(prev => ({
        ...prev,
        currentQuestionIndex: prev.currentQuestionIndex - 1,
      }));
    }
  };

  const completeQuiz = () => {
    const timeEnded = new Date();
    const timeSpent = Math.floor(
      (timeEnded.getTime() - state.timeStarted.getTime()) / 1000
    );

    let correctAnswers = 0;
    const answerDetails = quiz.questions.map(question => {
      const userAnswer =
        state.answers.find(a => a.questionId === question.id)?.answer || '';
      let correct = false;

      if (question.type === 'multiple-choice') {
        const correctOption = question.options?.find(opt => opt.isCorrect);
        correct = userAnswer === correctOption?.id;
      } else if (question.type === 'true-false') {
        correct = userAnswer === question.correctAnswer;
      }

      if (correct) correctAnswers++;

      return {
        questionId: question.id,
        userAnswer,
        correct,
      };
    });

    const score = Math.round((correctAnswers / quiz.questions.length) * 100);
    const passed = score >= quiz.passingScore;

    const result: QuizResult = {
      score,
      totalQuestions: quiz.questions.length,
      correctAnswers,
      timeSpent,
      passed,
      completedAt: timeEnded,
      answers: answerDetails,
    };

    setState(prev => ({
      ...prev,
      showResult: true,
      result,
    }));

    onComplete(result);
  };

  const renderQuestionProgress = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressHeader}>
        <Text style={[styles.progressText, { color: theme.textSecondary }]}>
          {t('education.quiz.questionProgress', {
            current: state.currentQuestionIndex + 1,
            total: quiz.questions.length,
          })}
        </Text>
        <TouchableOpacity
          onPress={onClose}
          style={styles.closeButton}
          accessibilityRole="button"
          accessibilityLabel={t('common.close')}
          accessibilityHint={t('education.quiz.closeQuiz')}
        >
          <Icon name="x" size={24} color={theme.textSecondary} />
        </TouchableOpacity>
      </View>
      <ProgressBar
        progress={progress}
        height={8}
        backgroundColor={theme.backgroundOffset}
        progressColor={theme.primary}
      />
    </View>
  );

  const renderMultipleChoice = (question: QuizQuestion) => {
    const currentAnswer = getCurrentAnswer(question.id);

    return (
      <View style={styles.optionsContainer}>
        {question.options?.map(option => {
          const isSelected = currentAnswer === option.id;

          return (
            <TouchableOpacity
              key={option.id}
              style={[
                styles.optionButton,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.backgroundOffset,
                  borderColor: isSelected ? theme.primary : theme.borderLight,
                },
              ]}
              onPress={() => selectAnswer(question.id, option.id)}
              accessibilityRole="radio"
              accessibilityLabel={option.text.en}
              accessibilityState={{ selected: isSelected }}
            >
              <View style={styles.optionContent}>
                <View
                  style={[
                    styles.radioButton,
                    {
                      borderColor: isSelected ? theme.white : theme.borderLight,
                      backgroundColor: isSelected ? theme.white : 'transparent',
                    },
                  ]}
                >
                  {isSelected && (
                    <View
                      style={[
                        styles.radioInner,
                        { backgroundColor: theme.primary },
                      ]}
                    />
                  )}
                </View>
                <Text
                  style={[
                    styles.optionText,
                    { color: isSelected ? theme.white : theme.textPrimary },
                  ]}
                >
                  {option.text.en}
                </Text>
              </View>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderTrueFalse = (question: QuizQuestion) => {
    const currentAnswer = getCurrentAnswer(question.id);

    return (
      <View style={styles.trueFalseContainer}>
        {['true', 'false'].map(value => {
          const isSelected = currentAnswer === value;
          const label =
            value === 'true'
              ? t('education.quiz.true')
              : t('education.quiz.false');

          return (
            <TouchableOpacity
              key={value}
              style={[
                styles.trueFalseButton,
                {
                  backgroundColor: isSelected
                    ? theme.primary
                    : theme.backgroundOffset,
                  borderColor: isSelected ? theme.primary : theme.borderLight,
                },
              ]}
              onPress={() => selectAnswer(question.id, value)}
              accessibilityRole="radio"
              accessibilityLabel={label}
              accessibilityState={{ selected: isSelected }}
            >
              <Text
                style={[
                  styles.trueFalseText,
                  { color: isSelected ? theme.white : theme.textPrimary },
                ]}
              >
                {label}
              </Text>
            </TouchableOpacity>
          );
        })}
      </View>
    );
  };

  const renderQuestion = (question: QuizQuestion) => (
    <Card style={styles.questionCard}>
      <Text style={[styles.questionText, { color: theme.textPrimary }]}>
        {question.question.en}
      </Text>

      {question.type === 'multiple-choice' && renderMultipleChoice(question)}
      {question.type === 'true-false' && renderTrueFalse(question)}
    </Card>
  );

  const renderNavigation = () => {
    const currentAnswer = getCurrentAnswer(currentQuestion.id);
    const canProceed = currentAnswer !== null;
    const isFirstQuestion = state.currentQuestionIndex === 0;

    return (
      <View style={styles.navigationContainer}>
        <Button
          title={t('common.previous')}
          onPress={previousQuestion}
          disabled={isFirstQuestion}
          variant="outline"
          style={[styles.navButton, isFirstQuestion && styles.disabledButton]}
        />

        <Button
          title={isLastQuestion ? t('education.quiz.finish') : t('common.next')}
          onPress={nextQuestion}
          disabled={!canProceed}
          style={[styles.navButton, !canProceed && styles.disabledButton]}
        />
      </View>
    );
  };

  const renderResult = () => {
    if (!state.result) return null;

    const { result } = state;
    const minutes = Math.floor(result.timeSpent / 60);
    const seconds = result.timeSpent % 60;

    return (
      <View style={styles.resultContainer}>
        <Card style={styles.resultCard}>
          <View style={styles.resultHeader}>
            <Icon
              name={result.passed ? 'check-circle' : 'x-circle'}
              size={48}
              color={result.passed ? theme.success : theme.error}
            />
            <Text
              style={[
                styles.resultTitle,
                { color: result.passed ? theme.success : theme.error },
              ]}
            >
              {result.passed
                ? t('education.quiz.passed')
                : t('education.quiz.failed')}
            </Text>
          </View>

          <View style={styles.resultStats}>
            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {result.score}%
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.quiz.score')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {result.correctAnswers}/{result.totalQuestions}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.quiz.correct')}
              </Text>
            </View>

            <View style={styles.statItem}>
              <Text style={[styles.statValue, { color: theme.primary }]}>
                {minutes}:{seconds.toString().padStart(2, '0')}
              </Text>
              <Text style={[styles.statLabel, { color: theme.textSecondary }]}>
                {t('education.quiz.timeSpent')}
              </Text>
            </View>
          </View>

          <Text style={[styles.resultMessage, { color: theme.textSecondary }]}>
            {result.passed
              ? t('education.quiz.passMessage', {
                  passingScore: quiz.passingScore,
                })
              : t('education.quiz.failMessage', {
                  passingScore: quiz.passingScore,
                })}
          </Text>

          <Button
            title={t('education.quiz.backToModule')}
            onPress={onClose}
            style={styles.backButton}
          />
        </Card>
      </View>
    );
  };

  if (state.showResult) {
    return (
      <SafeAreaView
        style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
      >
        <ScrollView contentContainerStyle={styles.scrollContent}>
          {renderResult()}
        </ScrollView>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView
      style={[styles.container, { backgroundColor: theme.backgroundDefault }]}
    >
      {renderQuestionProgress()}

      <ScrollView
        style={styles.scrollView}
        contentContainerStyle={styles.scrollContent}
        showsVerticalScrollIndicator={false}
      >
        <View style={styles.quizHeader}>
          <Text style={[styles.quizTitle, { color: theme.textPrimary }]}>
            {quiz.title.en}
          </Text>
          <Text
            style={[styles.quizDescription, { color: theme.textSecondary }]}
          >
            {quiz.description.en}
          </Text>
        </View>

        {renderQuestion(currentQuestion)}
        {renderNavigation()}
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
  },
  scrollView: {
    flex: 1,
  },
  scrollContent: {
    padding: spacing.lg,
  },
  progressContainer: {
    padding: spacing.lg,
    paddingBottom: spacing.md,
  },
  progressHeader: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  progressText: {
    fontSize: 14,
    fontWeight: '500',
  },
  closeButton: {
    padding: spacing.xs,
  },
  quizHeader: {
    marginBottom: spacing.xl,
  },
  quizTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginBottom: spacing.sm,
  },
  quizDescription: {
    fontSize: 16,
    lineHeight: 24,
  },
  questionCard: {
    marginBottom: spacing.lg,
  },
  questionText: {
    fontSize: 18,
    fontWeight: '600',
    lineHeight: 26,
    marginBottom: spacing.lg,
  },
  optionsContainer: {
    gap: spacing.md,
  },
  optionButton: {
    borderRadius: 12,
    borderWidth: 2,
    padding: spacing.md,
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
  },
  radioButton: {
    width: 20,
    height: 20,
    borderRadius: 10,
    borderWidth: 2,
    marginRight: spacing.md,
    alignItems: 'center',
    justifyContent: 'center',
  },
  radioInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  optionText: {
    fontSize: 16,
    lineHeight: 22,
    flex: 1,
  },
  trueFalseContainer: {
    flexDirection: 'row',
    gap: spacing.md,
  },
  trueFalseButton: {
    flex: 1,
    paddingVertical: spacing.lg,
    paddingHorizontal: spacing.md,
    borderRadius: 12,
    borderWidth: 2,
    alignItems: 'center',
  },
  trueFalseText: {
    fontSize: 16,
    fontWeight: '600',
  },
  navigationContainer: {
    flexDirection: 'row',
    gap: spacing.md,
    marginTop: spacing.lg,
  },
  navButton: {
    flex: 1,
  },
  disabledButton: {
    opacity: 0.5,
  },
  resultContainer: {
    flex: 1,
    justifyContent: 'center',
  },
  resultCard: {
    padding: spacing.xl,
    alignItems: 'center',
  },
  resultHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  resultTitle: {
    fontSize: 24,
    fontWeight: 'bold',
    marginTop: spacing.md,
  },
  resultStats: {
    flexDirection: 'row',
    justifyContent: 'space-around',
    width: '100%',
    marginBottom: spacing.xl,
  },
  statItem: {
    alignItems: 'center',
  },
  statValue: {
    fontSize: 24,
    fontWeight: 'bold',
  },
  statLabel: {
    fontSize: 12,
    marginTop: spacing.xs,
  },
  resultMessage: {
    fontSize: 16,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: spacing.xl,
  },
  backButton: {
    minWidth: 200,
  },
});

export default QuizInterface;
