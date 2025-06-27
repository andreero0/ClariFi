import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  Sliders,
  Calculator,
  CheckCircle,
  XCircle,
  Award,
  Sparkles,
  TrendingUp,
  DollarSign,
  Lightbulb,
  ArrowRight,
  Download,
  Share2,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';
import ConfettiAnimation from '../animations/ConfettiAnimation';

const { width } = Dimensions.get('window');

interface QuizQuestion {
  id: string;
  question: string;
  options: string[];
  correctAnswer: number;
  explanation: string;
}

interface CreditScoreFactors {
  paymentHistory: number;
  creditUtilization: number;
  creditLength: number;
  creditMix: number;
  newCredit: number;
}

const InteractiveLearningElements: React.FC = () => {
  // Credit Score Simulator State
  const [creditFactors, setCreditFactors] = useState<CreditScoreFactors>({
    paymentHistory: 80,
    creditUtilization: 60,
    creditLength: 40,
    creditMix: 70,
    newCredit: 90,
  });

  // Budget Calculator State
  const [budgetData, setBudgetData] = useState({
    income: '4500',
    housing: '1800',
    transportation: '400',
    food: '600',
    utilities: '200',
    insurance: '150',
    savings: '300',
    entertainment: '250',
  });

  // Quiz State
  const [currentQuestion, setCurrentQuestion] = useState(0);
  const [selectedAnswer, setSelectedAnswer] = useState<number | null>(null);
  const [isAnswerSubmitted, setIsAnswerSubmitted] = useState(false);
  const [quizScore, setQuizScore] = useState(0);
  const [showExplanation, setShowExplanation] = useState(false);
  const [quizCompleted, setQuizCompleted] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const slideAnim = useRef(new Animated.Value(50)).current;
  const confettiAnim = useRef(new Animated.Value(0)).current;
  const [showConfetti, setShowConfetti] = useState(false);

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 800,
        useNativeDriver: true,
      }),
      Animated.timing(slideAnim, {
        toValue: 0,
        duration: 800,
        useNativeDriver: true,
      }),
    ]).start();
  }, []);

  const quizQuestions: QuizQuestion[] = [
    {
      id: '1',
      question: 'What is the most important factor in calculating your credit score?',
      options: [
        'Credit utilization ratio',
        'Payment history',
        'Length of credit history',
        'Types of credit accounts'
      ],
      correctAnswer: 1,
      explanation: 'Payment history makes up 35% of your credit score and is the most important factor. Making payments on time consistently shows lenders you are reliable.'
    },
    {
      id: '2',
      question: 'What is the recommended maximum credit utilization ratio?',
      options: ['10%', '30%', '50%', '70%'],
      correctAnswer: 1,
      explanation: 'Financial experts recommend keeping your credit utilization below 30% of your available credit limit to maintain a good credit score.'
    },
    {
      id: '3',
      question: 'How often should you check your credit score in Canada?',
      options: [
        'Once a year',
        'Every 6 months',
        'Every 3 months',
        'Monthly'
      ],
      correctAnswer: 2,
      explanation: 'Checking your credit score every 3 months helps you monitor changes and catch any errors early. Many Canadian banks offer free credit score monitoring.'
    }
  ];

  const calculateCreditScore = (): number => {
    const weights = {
      paymentHistory: 0.35,
      creditUtilization: 0.30,
      creditLength: 0.15,
      creditMix: 0.10,
      newCredit: 0.10,
    };

    const score = 
      (creditFactors.paymentHistory * weights.paymentHistory) +
      (creditFactors.creditUtilization * weights.creditUtilization) +
      (creditFactors.creditLength * weights.creditLength) +
      (creditFactors.creditMix * weights.creditMix) +
      (creditFactors.newCredit * weights.newCredit);

    // Convert to FICO score range (300-850)
    return Math.round(300 + (score / 100) * 550);
  };

  const calculateBudgetTotals = () => {
    const income = parseFloat(budgetData.income) || 0;
    const expenses = 
      (parseFloat(budgetData.housing) || 0) +
      (parseFloat(budgetData.transportation) || 0) +
      (parseFloat(budgetData.food) || 0) +
      (parseFloat(budgetData.utilities) || 0) +
      (parseFloat(budgetData.insurance) || 0) +
      (parseFloat(budgetData.savings) || 0) +
      (parseFloat(budgetData.entertainment) || 0);

    const remaining = income - expenses;
    const savingsRate = income > 0 ? ((parseFloat(budgetData.savings) || 0) / income) * 100 : 0;

    return { income, expenses, remaining, savingsRate };
  };

  const handleQuizAnswer = (answerIndex: number) => {
    setSelectedAnswer(answerIndex);
    setIsAnswerSubmitted(true);
    setShowExplanation(true);

    const currentQ = quizQuestions[currentQuestion];
    if (answerIndex === currentQ.correctAnswer) {
      setQuizScore(prev => prev + 1);
    }
  };

  const nextQuestion = () => {
    if (currentQuestion < quizQuestions.length - 1) {
      setCurrentQuestion(prev => prev + 1);
      setSelectedAnswer(null);
      setIsAnswerSubmitted(false);
      setShowExplanation(false);
    } else {
      setQuizCompleted(true);
      triggerConfetti();
    }
  };

  const triggerConfetti = () => {
    setShowConfetti(true);
    Animated.timing(confettiAnim, {
      toValue: 1,
      duration: 2000,
      useNativeDriver: true,
    }).start(() => {
      setShowConfetti(false);
      confettiAnim.setValue(0);
    });
  };

  const renderCreditScoreSimulator = () => {
    const creditScore = calculateCreditScore();
    const getScoreColor = (score: number) => {
      if (score >= 750) return colors.growthGreen;
      if (score >= 650) return colors.warning;
      return colors.errorRed;
    };

    return (
      <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
        <View style={styles.sectionHeader}>
          <Sliders size={24} color={colors.clarityBlue} />
          <Text style={styles.sectionTitle}>Credit Score Simulator</Text>
        </View>

        <View style={styles.creditScoreDisplay}>
          <Text style={styles.creditScoreLabel}>Estimated Credit Score</Text>
          <Animated.Text style={[styles.creditScoreValue, { color: getScoreColor(creditScore) }]}>
            {creditScore}
          </Animated.Text>
          <Text style={styles.creditScoreRange}>300 - 850</Text>
        </View>

        <View style={styles.slidersContainer}>
          {Object.entries(creditFactors).map(([key, value]) => (
            <View key={key} style={styles.sliderRow}>
              <Text style={styles.sliderLabel}>
                {key.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase())}
              </Text>
              <View style={styles.sliderContainer}>
                <View style={styles.sliderTrack}>
                  <View 
                    style={[
                      styles.sliderFill,
                      { width: `${value}%`, backgroundColor: getScoreColor(value) }
                    ]} 
                  />
                  <TouchableOpacity
                    style={[
                      styles.sliderThumb,
                      { left: `${Math.max(0, Math.min(95, value - 2.5))}%` }
                    ]}
                    onPressIn={() => {
                      // Handle slider interaction
                    }}
                  />
                </View>
                <Text style={styles.sliderValue}>{value}%</Text>
              </View>
            </View>
          ))}
        </View>

        <View style={styles.creditTips}>
          <Lightbulb size={20} color={colors.wisdomPurple} />
          <Text style={styles.creditTipsText}>
            Move the sliders to see how different factors affect your credit score
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderBudgetCalculator = () => {
    const { income, expenses, remaining, savingsRate } = calculateBudgetTotals();

    return (
      <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
        <View style={styles.sectionHeader}>
          <Calculator size={24} color={colors.growthGreen} />
          <Text style={styles.sectionTitle}>Budget Calculator</Text>
        </View>

        <View style={styles.budgetInputs}>
          <View style={styles.inputRow}>
            <Text style={styles.inputLabel}>Monthly Income</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <TextInput
                style={styles.budgetInput}
                value={budgetData.income}
                onChangeText={(value) => setBudgetData(prev => ({ ...prev, income: value }))}
                keyboardType="numeric"
                placeholder="4500"
              />
            </View>
          </View>

          {Object.entries(budgetData).slice(1).map(([key, value]) => (
            <View key={key} style={styles.inputRow}>
              <Text style={styles.inputLabel}>
                {key.charAt(0).toUpperCase() + key.slice(1)}
              </Text>
              <View style={styles.inputContainer}>
                <Text style={styles.currencySymbol}>$</Text>
                <TextInput
                  style={styles.budgetInput}
                  value={value}
                  onChangeText={(newValue) => setBudgetData(prev => ({ ...prev, [key]: newValue }))}
                  keyboardType="numeric"
                />
              </View>
            </View>
          ))}
        </View>

        <View style={styles.budgetSummary}>
          <LinearGradient
            colors={[colors.cloudGray, colors.pureWhite]}
            style={styles.budgetSummaryGradient}
          >
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Income</Text>
              <Text style={[styles.summaryValue, { color: colors.growthGreen }]}>
                ${income.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Total Expenses</Text>
              <Text style={styles.summaryValue}>
                ${expenses.toLocaleString()}
              </Text>
            </View>
            
            <View style={[styles.summaryRow, styles.totalRow]}>
              <Text style={styles.totalLabel}>Remaining</Text>
              <Text style={[
                styles.totalValue,
                { color: remaining >= 0 ? colors.growthGreen : colors.errorRed }
              ]}>
                ${remaining.toLocaleString()}
              </Text>
            </View>
            
            <View style={styles.summaryRow}>
              <Text style={styles.summaryLabel}>Savings Rate</Text>
              <Text style={[
                styles.summaryValue,
                { color: savingsRate >= 20 ? colors.growthGreen : colors.warning }
              ]}>
                {savingsRate.toFixed(1)}%
              </Text>
            </View>
          </LinearGradient>
        </View>

        <View style={styles.budgetInsight}>
          <TrendingUp size={20} color={colors.clarityBlue} />
          <Text style={styles.budgetInsightText}>
            {savingsRate >= 20 
              ? 'Excellent! You\'re saving over 20% of your income.'
              : savingsRate >= 10
              ? 'Good start! Try to increase your savings rate to 20%.'
              : 'Consider reviewing your expenses to increase savings.'}
          </Text>
        </View>
      </Animated.View>
    );
  };

  const renderQuizInterface = () => {
    if (quizCompleted) {
      const percentage = Math.round((quizScore / quizQuestions.length) * 100);
      
      return (
        <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
          <View style={styles.quizCompletedHeader}>
            <Award size={32} color={colors.growthGreen} />
            <Text style={styles.quizCompletedTitle}>Quiz Completed!</Text>
            <Text style={styles.quizScore}>
              You scored {quizScore} out of {quizQuestions.length} ({percentage}%)
            </Text>
          </View>

          <LinearGradient
            colors={[colors.growthGreen + '10', colors.pureWhite]}
            style={styles.certificateContainer}
          >
            <Sparkles size={24} color={colors.growthGreen} />
            <Text style={styles.certificateTitle}>Certificate of Completion</Text>
            <Text style={styles.certificateText}>
              You have successfully completed the "Budgeting & Saving" quiz
            </Text>
            
            <View style={styles.certificateActions}>
              <TouchableOpacity style={styles.certificateButton}>
                <Download size={20} color={colors.clarityBlue} />
                <Text style={styles.certificateButtonText}>Download</Text>
              </TouchableOpacity>
              
              <TouchableOpacity style={styles.certificateButton}>
                <Share2 size={20} color={colors.clarityBlue} />
                <Text style={styles.certificateButtonText}>Share</Text>
              </TouchableOpacity>
            </View>
          </LinearGradient>

          {showConfetti && <ConfettiAnimation />}
        </Animated.View>
      );
    }

    const currentQ = quizQuestions[currentQuestion];

    return (
      <Animated.View style={[styles.sectionContainer, { opacity: fadeAnim }]}>
        <View style={styles.sectionHeader}>
          <Award size={24} color={colors.wisdomPurple} />
          <Text style={styles.sectionTitle}>Knowledge Quiz</Text>
        </View>

        <View style={styles.quizProgress}>
          <Text style={styles.quizProgressText}>
            Question {currentQuestion + 1} of {quizQuestions.length}
          </Text>
          <View style={styles.quizProgressBar}>
            <View 
              style={[
                styles.quizProgressFill,
                { width: `${((currentQuestion + 1) / quizQuestions.length) * 100}%` }
              ]} 
            />
          </View>
        </View>

        <View style={styles.questionContainer}>
          <Text style={styles.questionText}>{currentQ.question}</Text>
          
          {currentQ.options.map((option, index) => (
            <TouchableOpacity
              key={index}
              style={[
                styles.optionButton,
                selectedAnswer === index && styles.selectedOption,
                isAnswerSubmitted && index === currentQ.correctAnswer && styles.correctOption,
                isAnswerSubmitted && selectedAnswer === index && index !== currentQ.correctAnswer && styles.incorrectOption,
              ]}
              onPress={() => !isAnswerSubmitted && handleQuizAnswer(index)}
              disabled={isAnswerSubmitted}
            >
              <View style={styles.optionContent}>
                <Text style={[
                  styles.optionText,
                  selectedAnswer === index && styles.selectedOptionText,
                  isAnswerSubmitted && index === currentQ.correctAnswer && styles.correctOptionText,
                ]}>
                  {option}
                </Text>
                
                {isAnswerSubmitted && (
                  <View style={styles.optionIcon}>
                    {index === currentQ.correctAnswer ? (
                      <CheckCircle size={20} color={colors.growthGreen} />
                    ) : selectedAnswer === index ? (
                      <XCircle size={20} color={colors.errorRed} />
                    ) : null}
                  </View>
                )}
              </View>
            </TouchableOpacity>
          ))}
        </View>

        {showExplanation && (
          <Animated.View style={[styles.explanationContainer, { opacity: fadeAnim }]}>
            <Text style={styles.explanationTitle}>Explanation</Text>
            <Text style={styles.explanationText}>{currentQ.explanation}</Text>
            
            <TouchableOpacity style={styles.nextButton} onPress={nextQuestion}>
              <Text style={styles.nextButtonText}>
                {currentQuestion < quizQuestions.length - 1 ? 'Next Question' : 'Complete Quiz'}
              </Text>
              <ArrowRight size={20} color={colors.pureWhite} />
            </TouchableOpacity>
          </Animated.View>
        )}
      </Animated.View>
    );
  };

  return (
    <SafeAreaView style={styles.container}>
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        {/* Header */}
        <Animated.View style={[styles.header, { opacity: fadeAnim, transform: [{ translateY: slideAnim }] }]}>
          <Text style={styles.headerTitle}>Interactive Learning</Text>
          <Text style={styles.headerSubtitle}>
            Practice with real scenarios and test your knowledge
          </Text>
        </Animated.View>

        {/* Credit Score Simulator */}
        {renderCreditScoreSimulator()}

        {/* Budget Calculator */}
        {renderBudgetCalculator()}

        {/* Quiz Interface */}
        {renderQuizInterface()}

        <View style={styles.bottomSpacer} />
      </ScrollView>
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  scrollView: {
    flex: 1,
  },
  header: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
    paddingBottom: spacing.lg,
    alignItems: 'center',
  },
  headerTitle: {
    ...textStyles.h1,
    color: colors.midnightInk,
    textAlign: 'center',
    marginBottom: spacing.xs,
  },
  headerSubtitle: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
  },
  sectionContainer: {
    backgroundColor: colors.pureWhite,
    marginHorizontal: spacing.lg,
    marginBottom: spacing.xl,
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.lg,
    gap: spacing.sm,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
  },
  // Credit Score Simulator Styles
  creditScoreDisplay: {
    alignItems: 'center',
    marginBottom: spacing.xl,
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    padding: spacing.lg,
  },
  creditScoreLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  creditScoreValue: {
    ...textStyles.h1,
    fontSize: 48,
    fontWeight: '700',
    marginBottom: spacing.xs,
  },
  creditScoreRange: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  slidersContainer: {
    marginBottom: spacing.lg,
  },
  sliderRow: {
    marginBottom: spacing.lg,
  },
  sliderLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    marginBottom: spacing.sm,
    fontWeight: '600',
  },
  sliderContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    gap: spacing.md,
  },
  sliderTrack: {
    flex: 1,
    height: 8,
    backgroundColor: colors.cloudGray,
    borderRadius: 4,
    position: 'relative',
  },
  sliderFill: {
    height: 8,
    borderRadius: 4,
  },
  sliderThumb: {
    position: 'absolute',
    width: 20,
    height: 20,
    backgroundColor: colors.pureWhite,
    borderRadius: 10,
    borderWidth: 2,
    borderColor: colors.clarityBlue,
    top: -6,
  },
  sliderValue: {
    ...textStyles.caption,
    color: colors.midnightInk,
    fontWeight: '600',
    minWidth: 40,
  },
  creditTips: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.wisdomPurple + '10',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  creditTipsText: {
    ...textStyles.caption,
    color: colors.wisdomPurple,
    flex: 1,
  },
  // Budget Calculator Styles
  budgetInputs: {
    marginBottom: spacing.lg,
  },
  inputRow: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.cloudGray,
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    minWidth: 100,
  },
  currencySymbol: {
    ...textStyles.body,
    color: colors.clarityBlue,
    marginRight: spacing.xs,
  },
  budgetInput: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
    textAlign: 'right',
  },
  budgetSummary: {
    marginBottom: spacing.lg,
    borderRadius: 12,
    overflow: 'hidden',
  },
  budgetSummaryGradient: {
    padding: spacing.lg,
  },
  summaryRow: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    alignItems: 'center',
    marginBottom: spacing.sm,
  },
  summaryLabel: {
    ...textStyles.body,
    color: colors.neutralGray,
  },
  summaryValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  totalRow: {
    borderTopWidth: 1,
    borderTopColor: colors.borderLight,
    paddingTop: spacing.sm,
    marginTop: spacing.sm,
  },
  totalLabel: {
    ...textStyles.h3,
    color: colors.midnightInk,
  },
  totalValue: {
    ...textStyles.h3,
    fontWeight: '700',
  },
  budgetInsight: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.clarityBlue + '10',
    padding: spacing.md,
    borderRadius: 8,
    gap: spacing.sm,
  },
  budgetInsightText: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    flex: 1,
  },
  // Quiz Styles
  quizProgress: {
    marginBottom: spacing.lg,
  },
  quizProgressText: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.sm,
  },
  quizProgressBar: {
    height: 4,
    backgroundColor: colors.cloudGray,
    borderRadius: 2,
  },
  quizProgressFill: {
    height: 4,
    backgroundColor: colors.wisdomPurple,
    borderRadius: 2,
  },
  questionContainer: {
    marginBottom: spacing.lg,
  },
  questionText: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  optionButton: {
    borderWidth: 2,
    borderColor: colors.borderLight,
    borderRadius: 8,
    marginBottom: spacing.sm,
    backgroundColor: colors.pureWhite,
  },
  selectedOption: {
    borderColor: colors.clarityBlue,
    backgroundColor: colors.clarityBlue + '10',
  },
  correctOption: {
    borderColor: colors.growthGreen,
    backgroundColor: colors.growthGreen + '10',
  },
  incorrectOption: {
    borderColor: colors.errorRed,
    backgroundColor: colors.errorRed + '10',
  },
  optionContent: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    padding: spacing.md,
  },
  optionText: {
    ...textStyles.body,
    color: colors.midnightInk,
    flex: 1,
  },
  selectedOptionText: {
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  correctOptionText: {
    color: colors.growthGreen,
    fontWeight: '600',
  },
  optionIcon: {
    marginLeft: spacing.sm,
  },
  explanationContainer: {
    backgroundColor: colors.cloudGray,
    borderRadius: 12,
    padding: spacing.lg,
    marginBottom: spacing.lg,
  },
  explanationTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.sm,
  },
  explanationText: {
    ...textStyles.body,
    color: colors.neutralGray,
    lineHeight: 24,
    marginBottom: spacing.lg,
  },
  nextButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    backgroundColor: colors.clarityBlue,
    borderRadius: 8,
    paddingVertical: spacing.md,
    gap: spacing.sm,
  },
  nextButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
  // Quiz Completion Styles
  quizCompletedHeader: {
    alignItems: 'center',
    marginBottom: spacing.xl,
  },
  quizCompletedTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginTop: spacing.md,
    marginBottom: spacing.xs,
  },
  quizScore: {
    ...textStyles.body,
    color: colors.growthGreen,
    fontWeight: '600',
  },
  certificateContainer: {
    alignItems: 'center',
    padding: spacing.xl,
    borderRadius: 12,
  },
  certificateTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginTop: spacing.md,
    marginBottom: spacing.sm,
  },
  certificateText: {
    ...textStyles.body,
    color: colors.neutralGray,
    textAlign: 'center',
    marginBottom: spacing.xl,
  },
  certificateActions: {
    flexDirection: 'row',
    gap: spacing.lg,
  },
  certificateButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    gap: spacing.sm,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  certificateButtonText: {
    ...textStyles.button,
    color: colors.clarityBlue,
  },
  bottomSpacer: {
    height: spacing.xl,
  },
});

export default InteractiveLearningElements;