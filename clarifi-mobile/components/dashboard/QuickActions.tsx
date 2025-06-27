import React from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
} from 'react-native';
import { FileText, Bot, BookOpen, CreditCard } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { useCreditCards } from '../../hooks/useCreditCards';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface QuickAction {
  id: string;
  title: string;
  icon: React.ReactNode;
  route: string;
  color: string;
  description: string;
}

export const QuickActions: React.FC = () => {
  const router = useRouter();
  const { triggerTestAlert } = useCreditCards();

  // Apple Design Principle: Clarity - Focus on essential actions only
  // PRD Compliance: Use specified color palette
  const actions: QuickAction[] = [
    {
      id: 'add-statement',
      title: 'Import Statement',
      icon: <FileText size={24} color={colors.surface} />,
      route: '/modals/add-statement',
      color: colors.primary, // PRD Clarity Blue
      description: 'Upload bank statement',
    },
    {
      id: 'ai-chat',
      title: 'AI Assistant',
      icon: <Bot size={24} color={colors.surface} />,
      route: '/modals/ai-chat',
      color: colors.wisdom, // PRD Wisdom Purple
      description: 'Get financial advice',
    },
    {
      id: 'education',
      title: 'Learn & Grow',
      icon: <BookOpen size={24} color={colors.surface} />,
      route: '/modals/education-module',
      color: colors.confidence, // PRD Confidence Orange
      description: 'Financial education',
    },
    {
      id: 'add-transaction',
      title: 'Add Transaction',
      icon: <CreditCard size={24} color={colors.surface} />,
      route: '/modals/transaction-detail',
      color: colors.growth, // PRD Growth Green
      description: 'Record expense or income',
    },
  ];

  const handleActionPress = (action: QuickAction) => {
    if (action.id === 'test-alert') {
      triggerTestAlert();
    } else {
      router.push(action.route as any);
    }
  };

  return (
    <View style={styles.container}>
      <Text style={styles.title}>Quick Actions</Text>

      <ScrollView
        horizontal
        showsHorizontalScrollIndicator={false}
        contentContainerStyle={styles.actionsContainer}
      >
        {actions.map(action => (
          <TouchableOpacity
            key={action.id}
            style={[styles.actionCard, { borderLeftColor: action.color }]}
            onPress={() => handleActionPress(action)}
            activeOpacity={0.7}
          >
            <View style={styles.actionHeader}>
              <View
                style={[
                  styles.actionIconContainer,
                  { backgroundColor: action.color },
                ]}
              >
                {action.icon}
              </View>
              <View
                style={[
                  styles.actionIndicator,
                  { backgroundColor: action.color },
                ]}
              />
            </View>

            <Text style={styles.actionTitle}>{action.title}</Text>
            <Text style={styles.actionDescription}>{action.description}</Text>
          </TouchableOpacity>
        ))}
      </ScrollView>

      {/* Apple Design Principle: Deference - Removed redundant featured grid to reduce visual competition */}
    </View>
  );
};

const styles = StyleSheet.create({
  // Apple Design Principle: Consistent 8dp spacing grid
  container: {
    paddingHorizontal: 24, // PRD: 24dp screen edge padding
    paddingVertical: 16, // Apple: More generous vertical spacing
    marginBottom: 24, // PRD: Section spacing
  },
  // Apple Design Principle: Clear typographic hierarchy
  title: {
    ...textStyles.h3,
    color: colors.textPrimary,
    marginBottom: 16,
    letterSpacing: -0.25,
  },
  actionsContainer: {
    paddingRight: 24, // Consistent with container padding
    gap: 16, // Apple: More generous spacing between cards
  },
  // Apple Design Principle: Subtle depth and clean aesthetics
  actionCard: {
    backgroundColor: colors.surface,
    borderRadius: 16,
    padding: 20,
    width: 160,
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 2,
    },
    shadowOpacity: 0.04,
    shadowRadius: 8,
    elevation: 3,
  },
  actionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    marginBottom: 12,
  },
  actionIconContainer: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
  },
  actionIndicator: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // Apple Design Principle: Clear, readable typography
  actionTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    marginBottom: 6,
    letterSpacing: -0.1,
  },
  actionDescription: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  // Apple Design Principle: Visual Hierarchy - Clean, focused styling
  // Removed cluttered featuredGrid styles for cleaner codebase
});
