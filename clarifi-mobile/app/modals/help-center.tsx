import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Button as CustomButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import SupportAnalyticsDashboard from '../../components/support/SupportAnalyticsDashboard';

interface HelpCategory {
  id: string;
  title: string;
  description: string;
  icon: string;
  articleCount: number;
  featured?: boolean;
}

interface HelpArticle {
  id: string;
  title: string;
  category: string;
  summary: string;
  popular?: boolean;
}

export default function HelpCenterScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const [searchQuery, setSearchQuery] = useState('');
  const [filteredCategories, setFilteredCategories] = useState<HelpCategory[]>(
    []
  );
  const [recentArticles, setRecentArticles] = useState<HelpArticle[]>([]);
  const [showAnalyticsDashboard, setShowAnalyticsDashboard] = useState(false);

  // Mock help categories
  const helpCategories: HelpCategory[] = [
    {
      id: 'getting-started',
      title: 'Getting Started',
      description: 'Basic setup and first steps',
      icon: 'play-circle',
      articleCount: 8,
      featured: true,
    },
    {
      id: 'account-security',
      title: 'Account & Security',
      description: 'Login, password, and security settings',
      icon: 'shield',
      articleCount: 12,
      featured: true,
    },
    {
      id: 'transactions',
      title: 'Transactions',
      description: 'Managing and categorizing transactions',
      icon: 'credit-card',
      articleCount: 15,
    },
    {
      id: 'budgeting',
      title: 'Budgeting & Goals',
      description: 'Setting up budgets and financial goals',
      icon: 'target',
      articleCount: 10,
    },
    {
      id: 'ai-insights',
      title: 'AI Insights',
      description: 'Understanding your financial insights',
      icon: 'brain',
      articleCount: 6,
    },
    {
      id: 'privacy-data',
      title: 'Privacy & Data',
      description: 'Data export, privacy settings, and PIPEDA',
      icon: 'lock',
      articleCount: 9,
    },
    {
      id: 'troubleshooting',
      title: 'Troubleshooting',
      description: 'Common issues and solutions',
      icon: 'alert-circle',
      articleCount: 14,
    },
    {
      id: 'billing',
      title: 'Billing & Subscription',
      description: 'Premium features and billing questions',
      icon: 'dollar-sign',
      articleCount: 7,
    },
  ];

  // Mock popular articles
  const popularArticles: HelpArticle[] = [
    {
      id: 'how-to-categorize',
      title: 'How to categorize transactions automatically',
      category: 'Transactions',
      summary: "Learn how ClariFi's AI categorizes your transactions",
      popular: true,
    },
    {
      id: 'setup-biometric',
      title: 'Setting up biometric login',
      category: 'Account & Security',
      summary: 'Enable Face ID or fingerprint login for quick access',
      popular: true,
    },
    {
      id: 'export-data',
      title: 'How to export your financial data',
      category: 'Privacy & Data',
      summary: 'Download your data in CSV, JSON, or PDF format',
      popular: true,
    },
    {
      id: 'budget-setup',
      title: 'Creating your first budget',
      category: 'Budgeting & Goals',
      summary: 'Step-by-step guide to setting up budgets',
      popular: true,
    },
  ];

  useEffect(() => {
    if (searchQuery.trim() === '') {
      setFilteredCategories(helpCategories);
    } else {
      const filtered = helpCategories.filter(
        category =>
          category.title.toLowerCase().includes(searchQuery.toLowerCase()) ||
          category.description.toLowerCase().includes(searchQuery.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchQuery]);

  useEffect(() => {
    setRecentArticles(popularArticles);
  }, []);

  const handleCategoryPress = (categoryId: string) => {
    router.push(`/modals/help-category?id=${categoryId}`);
  };

  const handleArticlePress = (articleId: string) => {
    router.push(`/modals/help-article?id=${articleId}`);
  };

  const handleSearchPress = () => {
    if (searchQuery.trim()) {
      router.push(`/modals/help-search?q=${encodeURIComponent(searchQuery)}`);
    }
  };

  const handleContactSupport = () => {
    router.push('/modals/contact-support');
  };

  const handleJoinCommunity = () => {
    router.push('/modals/community-support');
  };

  const styles = StyleSheet.create({
    container: {
      flex: 1,
      backgroundColor: theme.backgroundPrimary,
    },
    header: {
      padding: spacing.lg,
      paddingTop: spacing.xl,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    title: {
      ...textStyles.h1,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    subtitle: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.lg,
    },
    searchContainer: {
      flexDirection: 'row',
      alignItems: 'center',
      backgroundColor: theme.backgroundSecondary,
      borderRadius: 12,
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      marginBottom: spacing.md,
    },
    searchInput: {
      flex: 1,
      ...textStyles.bodyRegular,
      color: theme.textPrimary,
      marginLeft: spacing.sm,
    },
    searchButton: {
      padding: spacing.xs,
    },
    content: {
      flex: 1,
    },
    section: {
      padding: spacing.lg,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
    },
    categoriesGrid: {
      marginBottom: spacing.xl,
    },
    categoryRow: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      marginBottom: spacing.md,
    },
    categoryCard: {
      flex: 1,
      marginHorizontal: spacing.xs,
      minHeight: 120,
    },
    categoryContent: {
      padding: spacing.md,
      alignItems: 'center',
    },
    categoryIcon: {
      marginBottom: spacing.sm,
    },
    categoryTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    categoryDescription: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      textAlign: 'center',
      marginBottom: spacing.xs,
    },
    categoryCount: {
      ...textStyles.caption,
      color: theme.textTertiary,
      textAlign: 'center',
    },
    featuredBadge: {
      position: 'absolute',
      top: spacing.xs,
      right: spacing.xs,
      backgroundColor: theme.primary,
      borderRadius: 8,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
    },
    featuredText: {
      ...textStyles.caption,
      color: '#FFFFFF',
      fontSize: 10,
    },
    articleItem: {
      marginBottom: spacing.md,
    },
    articleContent: {
      padding: spacing.md,
    },
    articleHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    articleTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      flex: 1,
    },
    popularBadge: {
      backgroundColor: theme.success,
      borderRadius: 8,
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      marginLeft: spacing.sm,
    },
    popularText: {
      ...textStyles.caption,
      color: '#FFFFFF',
      fontSize: 10,
    },
    articleCategory: {
      ...textStyles.bodySmall,
      color: theme.primary,
      marginBottom: spacing.xs,
    },
    articleSummary: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
    },
    quickActions: {
      backgroundColor: theme.backgroundSecondary,
      margin: spacing.lg,
      borderRadius: 12,
      padding: spacing.lg,
    },
    quickActionsTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
      textAlign: 'center',
    },
    actionButton: {
      marginBottom: spacing.sm,
    },
    emptyState: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    emptyText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      textAlign: 'center',
      marginTop: spacing.md,
    },
  });

  const renderCategoryCard = (category: HelpCategory) => (
    <TouchableOpacity
      key={category.id}
      style={styles.categoryCard}
      onPress={() => handleCategoryPress(category.id)}
      activeOpacity={0.7}
    >
      <Card style={{ flex: 1 }}>
        {category.featured && (
          <View style={styles.featuredBadge}>
            <Text style={styles.featuredText}>POPULAR</Text>
          </View>
        )}
        <View style={styles.categoryContent}>
          <View style={styles.categoryIcon}>
            <Icon name={category.icon} size={24} color={theme.primary} />
          </View>
          <Text style={styles.categoryTitle}>{category.title}</Text>
          <Text style={styles.categoryDescription}>{category.description}</Text>
          <Text style={styles.categoryCount}>
            {category.articleCount} articles
          </Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  const renderArticleItem = ({ item }: { item: HelpArticle }) => (
    <TouchableOpacity
      style={styles.articleItem}
      onPress={() => handleArticlePress(item.id)}
      activeOpacity={0.7}
    >
      <Card>
        <View style={styles.articleContent}>
          <View style={styles.articleHeader}>
            <Text style={styles.articleTitle}>{item.title}</Text>
            {item.popular && (
              <View style={styles.popularBadge}>
                <Text style={styles.popularText}>POPULAR</Text>
              </View>
            )}
          </View>
          <Text style={styles.articleCategory}>{item.category}</Text>
          <Text style={styles.articleSummary}>{item.summary}</Text>
        </View>
      </Card>
    </TouchableOpacity>
  );

  // Group categories into rows of 2
  const categoryRows = [];
  for (let i = 0; i < filteredCategories.length; i += 2) {
    categoryRows.push(filteredCategories.slice(i, i + 2));
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <Text style={styles.title}>Help Center</Text>
        <Text style={styles.subtitle}>
          Find answers to common questions and get support
        </Text>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search help articles..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            onSubmitEditing={handleSearchPress}
          />
          {searchQuery.length > 0 && (
            <TouchableOpacity
              style={styles.searchButton}
              onPress={handleSearchPress}
            >
              <Icon name="arrow-right" size={16} color={theme.primary} />
            </TouchableOpacity>
          )}
        </View>
      </View>

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.section}>
          <Text style={styles.sectionTitle}>Browse by Category</Text>

          {filteredCategories.length > 0 ? (
            <View style={styles.categoriesGrid}>
              {categoryRows.map((row, index) => (
                <View key={index} style={styles.categoryRow}>
                  {row.map(renderCategoryCard)}
                  {row.length === 1 && <View style={styles.categoryCard} />}
                </View>
              ))}
            </View>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyText}>
                No categories found for "{searchQuery}"
              </Text>
            </View>
          )}
        </View>

        {recentArticles.length > 0 && searchQuery.length === 0 && (
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Popular Articles</Text>
            <FlatList
              data={recentArticles}
              renderItem={renderArticleItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          </View>
        )}

        <View style={styles.quickActions}>
          <Text style={styles.quickActionsTitle}>Need More Help?</Text>

          <CustomButton
            title="Contact Support"
            onPress={handleContactSupport}
            variant="outline"
            style={styles.actionButton}
            icon="mail"
          />

          <CustomButton
            title="Join Community"
            onPress={handleJoinCommunity}
            variant="outline"
            style={styles.actionButton}
            icon="users"
          />
        </View>
      </ScrollView>
    </View>
  );
}
