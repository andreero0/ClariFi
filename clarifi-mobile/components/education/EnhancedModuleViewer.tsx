import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TouchableOpacity,
  Animated,
  Dimensions,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import {
  ArrowLeft,
  Bookmark,
  BookmarkCheck,
  ChevronLeft,
  ChevronRight,
  HelpCircle,
  Calculator,
  Volume2,
  Play,
  Pause,
} from 'lucide-react-native';
import { LinearGradient } from 'expo-linear-gradient';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';
import { spacing } from '../../constants/spacing';

const { width } = Dimensions.get('window');

interface ModuleSection {
  id: string;
  type: 'text' | 'calculator' | 'definition' | 'quiz' | 'video';
  title?: string;
  content: string;
  definition?: string;
  interactive?: boolean;
  keyTerms?: string[];
}

interface ModuleContent {
  id: string;
  title: string;
  totalSections: number;
  currentSection: number;
  estimatedTime: string;
  sections: ModuleSection[];
}

const EnhancedModuleViewer: React.FC = () => {
  const [moduleContent] = useState<ModuleContent>({
    id: '4',
    title: 'Budgeting & Saving',
    totalSections: 8,
    currentSection: 3,
    estimatedTime: '18 min',
    sections: [
      {
        id: '1',
        type: 'text',
        title: 'Why Budgeting Matters',
        content: 'Creating a budget is one of the most important financial skills you can develop as a newcomer to Canada. A budget helps you understand where your money goes and ensures you can cover essential expenses while building towards your financial goals.\n\nIn Canada, the cost of living varies significantly by province and city. Understanding your income and expenses helps you make informed decisions about housing, transportation, and other major expenses.',
        keyTerms: ['budget', 'cost of living', 'expenses'],
      },
      {
        id: '2',
        type: 'definition',
        title: 'Key Terms',
        content: 'Essential budgeting vocabulary for Canadian newcomers',
        keyTerms: ['budget', 'income', 'expenses', 'emergency fund'],
      },
      {
        id: '3',
        type: 'calculator',
        title: 'Budget Calculator',
        content: 'Use this interactive calculator to create your first Canadian budget. Enter your monthly income and expenses to see how much you can save.',
        interactive: true,
      },
    ],
  });

  const [isBookmarked, setIsBookmarked] = useState(false);
  const [selectedTerm, setSelectedTerm] = useState<string | null>(null);
  const [isAudioPlaying, setIsAudioPlaying] = useState(false);

  // Animation refs
  const fadeAnim = useRef(new Animated.Value(0)).current;
  const progressAnim = useRef(new Animated.Value(0)).current;
  const bookmarkAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    Animated.parallel([
      Animated.timing(fadeAnim, {
        toValue: 1,
        duration: 600,
        useNativeDriver: true,
      }),
      Animated.timing(progressAnim, {
        toValue: moduleContent.currentSection / moduleContent.totalSections,
        duration: 800,
        useNativeDriver: false,
      }),
    ]).start();
  }, []);

  const definitions = {
    budget: 'A plan for how you will spend your money over a specific period, typically monthly.',
    'cost of living': 'The amount of money needed to cover basic expenses like housing, food, and transportation in a specific location.',
    expenses: 'Money spent on goods and services, including fixed costs (rent) and variable costs (groceries).',
    income: 'Money received from work, government benefits, or other sources.',
    'emergency fund': 'Money set aside to cover unexpected expenses or loss of income, typically 3-6 months of expenses.',
  };

  const toggleBookmark = () => {
    setIsBookmarked(!isBookmarked);
    Animated.sequence([
      Animated.timing(bookmarkAnim, {
        toValue: 1.2,
        duration: 150,
        useNativeDriver: true,
      }),
      Animated.timing(bookmarkAnim, {
        toValue: 1,
        duration: 150,
        useNativeDriver: true,
      }),
    ]).start();
  };

  const renderProgressBar = () => (
    <View style={styles.progressContainer}>
      <View style={styles.progressBar}>
        <Animated.View
          style={[
            styles.progressFill,
            {
              width: progressAnim.interpolate({
                inputRange: [0, 1],
                outputRange: ['0%', '100%'],
              }),
            },
          ]}
        />
      </View>
      <Text style={styles.progressText}>
        {moduleContent.currentSection} of {moduleContent.totalSections}
      </Text>
    </View>
  );

  const renderHeader = () => (
    <Animated.View style={[styles.header, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.backButton}>
        <ArrowLeft size={24} color={colors.midnightInk} />
      </TouchableOpacity>
      
      <View style={styles.headerContent}>
        <Text style={styles.headerTitle}>{moduleContent.title}</Text>
        <Text style={styles.headerSubtitle}>{moduleContent.estimatedTime} remaining</Text>
      </View>
      
      <TouchableOpacity style={styles.audioButton} onPress={() => setIsAudioPlaying(!isAudioPlaying)}>
        {isAudioPlaying ? (
          <Pause size={20} color={colors.clarityBlue} />
        ) : (
          <Volume2 size={20} color={colors.clarityBlue} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const renderKeyTerm = (term: string) => (
    <TouchableOpacity
      key={term}
      style={styles.keyTerm}
      onPress={() => setSelectedTerm(selectedTerm === term ? null : term)}
    >
      <Text style={styles.keyTermText}>{term}</Text>
      <HelpCircle size={16} color={colors.clarityBlue} />
    </TouchableOpacity>
  );

  const renderDefinitionPopup = () => {
    if (!selectedTerm || !definitions[selectedTerm as keyof typeof definitions]) return null;

    return (
      <Animated.View style={[styles.definitionPopup, { opacity: fadeAnim }]}>
        <LinearGradient
          colors={[colors.wisdomPurple, colors.clarityBlue]}
          style={styles.definitionGradient}
        >
          <Text style={styles.definitionTerm}>{selectedTerm}</Text>
          <Text style={styles.definitionText}>
            {definitions[selectedTerm as keyof typeof definitions]}
          </Text>
          <TouchableOpacity
            style={styles.closeDefinition}
            onPress={() => setSelectedTerm(null)}
          >
            <Text style={styles.closeDefinitionText}>Got it!</Text>
          </TouchableOpacity>
        </LinearGradient>
      </Animated.View>
    );
  };

  const renderTextSection = (section: ModuleSection) => (
    <View style={styles.textSection}>
      {section.title && <Text style={styles.sectionTitle}>{section.title}</Text>}
      <Text style={styles.sectionContent}>{section.content}</Text>
      
      {section.keyTerms && section.keyTerms.length > 0 && (
        <View style={styles.keyTermsContainer}>
          <Text style={styles.keyTermsLabel}>Key Terms:</Text>
          <View style={styles.keyTermsList}>
            {section.keyTerms.map(renderKeyTerm)}
          </View>
        </View>
      )}
    </View>
  );

  const renderCalculatorSection = (section: ModuleSection) => (
    <View style={styles.calculatorSection}>
      <LinearGradient
        colors={[colors.cloudGray, colors.pureWhite]}
        style={styles.calculatorContainer}
      >
        <View style={styles.calculatorHeader}>
          <Calculator size={24} color={colors.clarityBlue} />
          <Text style={styles.calculatorTitle}>{section.title}</Text>
        </View>
        
        <Text style={styles.calculatorDescription}>{section.content}</Text>
        
        <View style={styles.calculatorInteractive}>
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Income (CAD)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <Text style={styles.inputValue}>4,500</Text>
            </View>
          </View>
          
          <View style={styles.inputGroup}>
            <Text style={styles.inputLabel}>Monthly Expenses (CAD)</Text>
            <View style={styles.inputContainer}>
              <Text style={styles.currencySymbol}>$</Text>
              <Text style={styles.inputValue}>3,200</Text>
            </View>
          </View>
          
          <View style={styles.resultContainer}>
            <Text style={styles.resultLabel}>Available for Savings</Text>
            <Text style={styles.resultValue}>$1,300</Text>
            <Text style={styles.resultSubtext}>29% of income</Text>
          </View>
        </View>
        
        <TouchableOpacity style={styles.interactiveButton}>
          <Text style={styles.interactiveButtonText}>Try Different Amounts</Text>
        </TouchableOpacity>
      </LinearGradient>
    </View>
  );

  const renderNavigation = () => (
    <Animated.View style={[styles.navigationContainer, { opacity: fadeAnim }]}>
      <TouchableOpacity style={styles.navButton}>
        <ChevronLeft size={20} color={colors.clarityBlue} />
        <Text style={styles.navButtonText}>Previous</Text>
      </TouchableOpacity>
      
      <TouchableOpacity style={styles.navButton}>
        <Text style={styles.navButtonText}>Next</Text>
        <ChevronRight size={20} color={colors.clarityBlue} />
      </TouchableOpacity>
    </Animated.View>
  );

  const renderBookmarkButton = () => (
    <Animated.View style={[styles.bookmarkContainer, { transform: [{ scale: bookmarkAnim }] }]}>
      <TouchableOpacity style={styles.bookmarkButton} onPress={toggleBookmark}>
        {isBookmarked ? (
          <BookmarkCheck size={24} color={colors.pureWhite} />
        ) : (
          <Bookmark size={24} color={colors.pureWhite} />
        )}
      </TouchableOpacity>
    </Animated.View>
  );

  const currentSection = moduleContent.sections[moduleContent.currentSection - 1];

  return (
    <SafeAreaView style={styles.container}>
      {/* Progress Bar */}
      {renderProgressBar()}
      
      {/* Header */}
      {renderHeader()}
      
      <ScrollView style={styles.scrollView} showsVerticalScrollIndicator={false}>
        <Animated.View style={[styles.content, { opacity: fadeAnim }]}>
          {currentSection?.type === 'text' && renderTextSection(currentSection)}
          {currentSection?.type === 'calculator' && renderCalculatorSection(currentSection)}
        </Animated.View>
        
        {/* Navigation */}
        {renderNavigation()}
        
        <View style={styles.bottomSpacer} />
      </ScrollView>
      
      {/* Floating Elements */}
      {renderDefinitionPopup()}
      {renderBookmarkButton()}
    </SafeAreaView>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.appBackground,
  },
  progressContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    backgroundColor: colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  progressBar: {
    flex: 1,
    height: 4,
    backgroundColor: colors.cloudGray,
    borderRadius: 2,
    marginRight: spacing.md,
  },
  progressFill: {
    height: 4,
    backgroundColor: colors.clarityBlue,
    borderRadius: 2,
  },
  progressText: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.lg,
    backgroundColor: colors.pureWhite,
    borderBottomWidth: 1,
    borderBottomColor: colors.borderLight,
  },
  backButton: {
    marginRight: spacing.md,
  },
  headerContent: {
    flex: 1,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
  },
  headerSubtitle: {
    ...textStyles.caption,
    color: colors.neutralGray,
  },
  audioButton: {
    padding: spacing.sm,
    backgroundColor: colors.cloudGray,
    borderRadius: 20,
  },
  scrollView: {
    flex: 1,
  },
  content: {
    paddingHorizontal: spacing.lg,
    paddingTop: spacing.xl,
  },
  textSection: {
    marginBottom: spacing.xl,
  },
  sectionTitle: {
    ...textStyles.h2,
    color: colors.midnightInk,
    marginBottom: spacing.lg,
  },
  sectionContent: {
    ...textStyles.body,
    color: colors.midnightInk,
    lineHeight: 28,
    marginBottom: spacing.lg,
  },
  keyTermsContainer: {
    backgroundColor: colors.pureWhite,
    borderRadius: 12,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
  },
  keyTermsLabel: {
    ...textStyles.h3,
    color: colors.midnightInk,
    marginBottom: spacing.md,
  },
  keyTermsList: {
    flexDirection: 'row',
    flexWrap: 'wrap',
    gap: spacing.sm,
  },
  keyTerm: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.clarityBlue + '10',
    borderWidth: 1,
    borderColor: colors.clarityBlue,
    borderStyle: 'dashed',
    borderRadius: 8,
    paddingHorizontal: spacing.sm,
    paddingVertical: spacing.xs,
    gap: spacing.xs,
  },
  keyTermText: {
    ...textStyles.caption,
    color: colors.clarityBlue,
    fontWeight: '600',
  },
  calculatorSection: {
    marginBottom: spacing.xl,
  },
  calculatorContainer: {
    borderRadius: 16,
    padding: spacing.lg,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.08,
    shadowRadius: 12,
    elevation: 6,
  },
  calculatorHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: spacing.md,
    gap: spacing.sm,
  },
  calculatorTitle: {
    ...textStyles.h3,
    color: colors.midnightInk,
  },
  calculatorDescription: {
    ...textStyles.body,
    color: colors.neutralGray,
    marginBottom: spacing.lg,
  },
  calculatorInteractive: {
    marginBottom: spacing.lg,
  },
  inputGroup: {
    marginBottom: spacing.md,
  },
  inputLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  inputContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderWidth: 2,
    borderColor: colors.clarityBlue,
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  currencySymbol: {
    ...textStyles.body,
    color: colors.clarityBlue,
    marginRight: spacing.xs,
  },
  inputValue: {
    ...textStyles.body,
    color: colors.midnightInk,
    fontWeight: '600',
  },
  resultContainer: {
    backgroundColor: colors.growthGreen + '10',
    borderRadius: 12,
    padding: spacing.lg,
    alignItems: 'center',
    marginTop: spacing.md,
  },
  resultLabel: {
    ...textStyles.caption,
    color: colors.neutralGray,
    marginBottom: spacing.xs,
  },
  resultValue: {
    ...textStyles.h2,
    color: colors.growthGreen,
    fontWeight: '700',
  },
  resultSubtext: {
    ...textStyles.caption,
    color: colors.growthGreen,
  },
  interactiveButton: {
    backgroundColor: colors.clarityBlue,
    borderRadius: 8,
    paddingVertical: spacing.md,
    alignItems: 'center',
  },
  interactiveButtonText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
  navigationContainer: {
    flexDirection: 'row',
    justifyContent: 'space-between',
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.xl,
  },
  navButton: {
    flexDirection: 'row',
    alignItems: 'center',
    backgroundColor: colors.pureWhite,
    borderRadius: 8,
    paddingHorizontal: spacing.lg,
    paddingVertical: spacing.md,
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 2 },
    shadowOpacity: 0.06,
    shadowRadius: 8,
    elevation: 3,
    gap: spacing.xs,
  },
  navButtonText: {
    ...textStyles.button,
    color: colors.clarityBlue,
  },
  definitionPopup: {
    position: 'absolute',
    bottom: 120,
    left: spacing.lg,
    right: spacing.lg,
    borderRadius: 16,
    overflow: 'hidden',
    shadowColor: '#000',
    shadowOffset: { width: 0, height: 8 },
    shadowOpacity: 0.15,
    shadowRadius: 20,
    elevation: 15,
  },
  definitionGradient: {
    padding: spacing.lg,
  },
  definitionTerm: {
    ...textStyles.h3,
    color: colors.pureWhite,
    marginBottom: spacing.xs,
  },
  definitionText: {
    ...textStyles.body,
    color: colors.pureWhite,
    opacity: 0.9,
    marginBottom: spacing.lg,
  },
  closeDefinition: {
    alignSelf: 'flex-end',
    backgroundColor: colors.pureWhite + '30',
    borderRadius: 8,
    paddingHorizontal: spacing.md,
    paddingVertical: spacing.sm,
  },
  closeDefinitionText: {
    ...textStyles.button,
    color: colors.pureWhite,
  },
  bookmarkContainer: {
    position: 'absolute',
    bottom: 40,
    right: spacing.lg,
  },
  bookmarkButton: {
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.clarityBlue,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: colors.clarityBlue,
    shadowOffset: { width: 0, height: 4 },
    shadowOpacity: 0.3,
    shadowRadius: 12,
    elevation: 8,
  },
  bottomSpacer: {
    height: 120,
  },
});

export default EnhancedModuleViewer;