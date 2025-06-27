import React from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  Dimensions,
} from 'react-native';
import {
  CreditCard,
  BarChart3,
  Calendar,
  TrendingUp,
  Shield,
  MapPin,
  Lock,
} from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface EmptyStateProps {
  onAddCard: () => void;
}

export const EmptyState: React.FC<EmptyStateProps> = ({ onAddCard }) => {
  const screenHeight = Dimensions.get('window').height;
  const containerHeight = screenHeight * 0.6; // Take up 60% of screen height

  return (
    <View style={[styles.container, { minHeight: containerHeight }]}>
      {/* Illustration */}
      <View style={styles.illustration}>
        <View style={styles.creditCardIconContainer}>
          <CreditCard size={64} color={colors.primary} />
        </View>
        <View style={styles.iconBackground} />
      </View>

      {/* Content */}
      <View style={styles.content}>
        <Text style={styles.title}>Start Managing Your Credit Cards</Text>
        <Text style={styles.description}>
          Add your credit cards to track utilization, payment due dates, and
          maintain a healthy credit score.
        </Text>

        {/* Benefits list */}
        <View style={styles.benefitsList}>
          <View style={styles.benefit}>
            <View style={styles.benefitIconContainer}>
              <BarChart3 size={20} color={colors.primary} />
            </View>
            <Text style={styles.benefitText}>
              Track utilization across all cards
            </Text>
          </View>

          <View style={styles.benefit}>
            <View style={styles.benefitIconContainer}>
              <Calendar size={20} color={colors.primary} />
            </View>
            <Text style={styles.benefitText}>
              Never miss a payment deadline
            </Text>
          </View>

          <View style={styles.benefit}>
            <View style={styles.benefitIconContainer}>
              <TrendingUp size={20} color={colors.primary} />
            </View>
            <Text style={styles.benefitText}>Improve your credit score</Text>
          </View>

          <View style={styles.benefit}>
            <View style={styles.benefitIconContainer}>
              <Shield size={20} color={colors.primary} />
            </View>
            <Text style={styles.benefitText}>Secure offline storage</Text>
          </View>
        </View>

        {/* Add card button */}
        <TouchableOpacity style={styles.addButton} onPress={onAddCard}>
          <Text style={styles.addButtonText}>Add Your First Card</Text>
        </TouchableOpacity>

        {/* Canadian context */}
        <View style={styles.canadianInfo}>
          <View style={styles.canadianTitleContainer}>
            <MapPin size={16} color={colors.error} />
            <Text style={styles.canadianTitle}>Canadian Credit Tips</Text>
          </View>
          <Text style={styles.canadianText}>
            Keep utilization under 30% across all cards to maintain a good
            credit score with Equifax and TransUnion Canada.
          </Text>
        </View>

        {/* Privacy note */}
        <View style={styles.privacyNote}>
          <View style={styles.privacyTextContainer}>
            <Lock size={16} color={colors.growth} />
            <Text style={styles.privacyText}>
              Your credit card information is stored securely on your device and
              never shared with third parties.
            </Text>
          </View>
        </View>
      </View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 24,
    paddingVertical: 40,
  },
  illustration: {
    alignItems: 'center',
    marginBottom: 32,
    position: 'relative',
  },
  creditCardIconContainer: {
    marginBottom: 16,
    padding: 16,
    backgroundColor: colors.neutral.lightest,
    borderRadius: 32,
  },
  iconBackground: {
    position: 'absolute',
    top: 20,
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: colors.primary,
    opacity: 0.1,
    zIndex: -1,
  },
  content: {
    alignItems: 'center',
    maxWidth: 320,
  },
  title: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
    lineHeight: 30,
  },
  description: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 24,
    marginBottom: 32,
  },
  benefitsList: {
    alignSelf: 'stretch',
    marginBottom: 32,
  },
  benefit: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
    paddingHorizontal: 16,
  },
  benefitIconContainer: {
    width: 28,
    height: 28,
    borderRadius: 14,
    backgroundColor: colors.neutral.lightest,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  benefitText: {
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    flex: 1,
    lineHeight: 20,
  },
  addButton: {
    backgroundColor: colors.primary,
    paddingHorizontal: 32,
    paddingVertical: 16,
    borderRadius: 12,
    marginBottom: 24,
    shadowColor: colors.primary,
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 8,
    elevation: 8,
  },
  addButtonText: {
    ...textStyles.button,
    color: colors.surface,
    textAlign: 'center',
  },
  canadianInfo: {
    backgroundColor: colors.neutral.lightest,
    padding: 16,
    borderRadius: 12,
    borderLeftWidth: 4,
    borderLeftColor: colors.error,
    marginBottom: 20,
    alignSelf: 'stretch',
  },
  canadianTitleContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 6,
    gap: 6,
  },
  canadianTitle: {
    ...textStyles.bodyMedium,
    color: colors.textPrimary,
    fontWeight: '700',
  },
  canadianText: {
    ...textStyles.bodySmall,
    color: colors.textSecondary,
    lineHeight: 18,
  },
  privacyNote: {
    backgroundColor: colors.growth + '20',
    padding: 12,
    borderRadius: 8,
    alignSelf: 'stretch',
  },
  privacyTextContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    gap: 6,
  },
  privacyText: {
    ...textStyles.caption,
    color: colors.growth,
    textAlign: 'center',
    lineHeight: 16,
    flex: 1,
  },
});
