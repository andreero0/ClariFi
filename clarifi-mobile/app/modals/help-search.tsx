import React, { useState, useEffect, useCallback } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
  TextInput,
  TouchableOpacity,
  FlatList,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { useTheme } from '../../context/ThemeContext';
import { Button as CustomButton } from '../../components/ui/Button';
import { Card } from '../../components/ui/Card';
import { Icon } from '../../components/ui/Icon';
import { spacing } from '../../constants/spacing';
import { textStyles } from '../../constants/typography';
import {
  HelpContentService,
  SearchResult,
  HelpArticle,
  FAQ,
} from '../../services/support/HelpContentService';

export default function HelpSearchScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { q: initialQuery } = useLocalSearchParams<{ q?: string }>();

  const [searchQuery, setSearchQuery] = useState(initialQuery || '');
  const [searchResults, setSearchResults] = useState<SearchResult[]>([]);
  const [loading, setLoading] = useState(false);
  const [selectedCategory, setSelectedCategory] = useState<string>('all');
  const [selectedType, setSelectedType] = useState<'both' | 'article' | 'faq'>(
    'both'
  );
  const [selectedDifficulty, setSelectedDifficulty] = useState<string>('all');
  const [showFilters, setShowFilters] = useState(false);

  const categories = [
    { id: 'all', name: 'All Categories' },
    { id: 'getting-started', name: 'Getting Started' },
    { id: 'account-security', name: 'Account & Security' },
    { id: 'transactions', name: 'Transactions' },
    { id: 'budgeting', name: 'Budgeting & Goals' },
    { id: 'ai-insights', name: 'AI Insights' },
    { id: 'privacy-data', name: 'Privacy & Data' },
    { id: 'troubleshooting', name: 'Troubleshooting' },
    { id: 'billing', name: 'Billing & Subscription' },
  ];

  const difficulties = [
    { id: 'all', name: 'All Levels' },
    { id: 'beginner', name: 'Beginner' },
    { id: 'intermediate', name: 'Intermediate' },
    { id: 'advanced', name: 'Advanced' },
  ];

  const types = [
    { id: 'both', name: 'Articles & FAQs' },
    { id: 'article', name: 'Articles Only' },
    { id: 'faq', name: 'FAQs Only' },
  ];

  useEffect(() => {
    if (searchQuery.trim().length > 0) {
      performSearch();
    } else {
      setSearchResults([]);
    }
  }, [searchQuery, selectedCategory, selectedType, selectedDifficulty]);

  const performSearch = useCallback(async () => {
    if (!searchQuery.trim()) return;

    setLoading(true);
    try {
      const filters = {
        category: selectedCategory === 'all' ? undefined : selectedCategory,
        type: selectedType as 'article' | 'faq' | 'both',
        difficulty:
          selectedDifficulty === 'all' ? undefined : selectedDifficulty,
      };

      const results = await HelpContentService.search(searchQuery, filters);
      setSearchResults(results);
    } catch (error) {
      console.error('Error performing search:', error);
    } finally {
      setLoading(false);
    }
  }, [searchQuery, selectedCategory, selectedType, selectedDifficulty]);

  const handleResultPress = (result: SearchResult) => {
    if (result.type === 'article') {
      router.push(`/modals/help-article?id=${result.item.id}`);
    } else {
      // For FAQs, we could show them inline or navigate to a FAQ detail screen
      router.push(`/modals/help-faq?id=${result.item.id}`);
    }
  };

  const handleBackPress = () => {
    router.back();
  };

  const clearSearch = () => {
    setSearchQuery('');
    setSearchResults([]);
  };

  const resetFilters = () => {
    setSelectedCategory('all');
    setSelectedType('both');
    setSelectedDifficulty('all');
  };

  const highlightText = (text: string, terms: string[]): string => {
    if (!terms.length) return text;

    let highlightedText = text;
    terms.forEach(term => {
      const regex = new RegExp(`(${term})`, 'gi');
      highlightedText = highlightedText.replace(regex, '**$1**');
    });

    return highlightedText;
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
    backButton: {
      flexDirection: 'row',
      alignItems: 'center',
      marginBottom: spacing.md,
      alignSelf: 'flex-start',
    },
    backButtonText: {
      ...textStyles.bodyMedium,
      color: theme.primary,
      marginLeft: spacing.xs,
    },
    title: {
      ...textStyles.h2,
      color: theme.textPrimary,
      marginBottom: spacing.md,
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
    searchActions: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    clearButton: {
      padding: spacing.xs,
      marginRight: spacing.xs,
    },
    searchButton: {
      padding: spacing.xs,
    },
    filtersContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    filtersHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    filtersTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
    },
    toggleFiltersButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    toggleFiltersText: {
      ...textStyles.bodySmall,
      color: theme.primary,
      marginRight: spacing.xs,
    },
    filterRow: {
      marginBottom: spacing.md,
    },
    filterLabel: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      marginBottom: spacing.sm,
    },
    filterChips: {
      flexDirection: 'row',
      flexWrap: 'wrap',
    },
    filterChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      marginRight: spacing.sm,
      marginBottom: spacing.sm,
      borderWidth: 1,
    },
    filterChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    filterChipInactive: {
      backgroundColor: 'transparent',
      borderColor: theme.border,
    },
    filterChipText: {
      ...textStyles.bodySmall,
    },
    filterChipTextActive: {
      color: '#FFFFFF',
    },
    filterChipTextInactive: {
      color: theme.textSecondary,
    },
    resultsContainer: {
      flex: 1,
      padding: spacing.lg,
    },
    resultsHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
      marginBottom: spacing.md,
    },
    resultsCount: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
    },
    sortButton: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    sortText: {
      ...textStyles.bodySmall,
      color: theme.primary,
      marginRight: spacing.xs,
    },
    resultItem: {
      marginBottom: spacing.md,
    },
    resultContent: {
      padding: spacing.md,
    },
    resultHeader: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'flex-start',
      marginBottom: spacing.xs,
    },
    resultTitle: {
      ...textStyles.bodyMedium,
      color: theme.textPrimary,
      flex: 1,
    },
    resultTypeBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: spacing.sm,
    },
    resultTypeBadgeArticle: {
      backgroundColor: theme.primary,
    },
    resultTypeBadgeFAQ: {
      backgroundColor: theme.success,
    },
    resultTypeText: {
      ...textStyles.caption,
      color: '#FFFFFF',
      fontSize: 10,
    },
    resultCategory: {
      ...textStyles.bodySmall,
      color: theme.primary,
      marginBottom: spacing.xs,
    },
    resultSummary: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      marginBottom: spacing.sm,
    },
    resultMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    resultMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    resultMetaText: {
      ...textStyles.caption,
      color: theme.textTertiary,
      marginLeft: spacing.xs,
    },
    relevanceScore: {
      ...textStyles.caption,
      color: theme.primary,
      fontWeight: '600',
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
    loadingContainer: {
      padding: spacing.xl,
      alignItems: 'center',
    },
    loadingText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginTop: spacing.md,
    },
  });

  const renderFilterChip = (
    items: { id: string; name: string }[],
    selectedValue: string,
    onSelect: (value: string) => void
  ) => {
    return items.map(item => {
      const isActive = selectedValue === item.id;
      return (
        <TouchableOpacity
          key={item.id}
          style={[
            styles.filterChip,
            isActive ? styles.filterChipActive : styles.filterChipInactive,
          ]}
          onPress={() => onSelect(item.id)}
          activeOpacity={0.7}
        >
          <Text
            style={[
              styles.filterChipText,
              isActive
                ? styles.filterChipTextActive
                : styles.filterChipTextInactive,
            ]}
          >
            {item.name}
          </Text>
        </TouchableOpacity>
      );
    });
  };

  const renderSearchResult = ({ item }: { item: SearchResult }) => {
    const isArticle = item.type === 'article';
    const resultItem = item.item as HelpArticle | FAQ;
    const categoryName =
      categories.find(
        cat => cat.id === ('category' in resultItem ? resultItem.category : '')
      )?.name || '';

    return (
      <TouchableOpacity
        style={styles.resultItem}
        onPress={() => handleResultPress(item)}
        activeOpacity={0.7}
      >
        <Card>
          <View style={styles.resultContent}>
            <View style={styles.resultHeader}>
              <Text style={styles.resultTitle}>
                {isArticle
                  ? (resultItem as HelpArticle).title
                  : (resultItem as FAQ).question}
              </Text>
              <View
                style={[
                  styles.resultTypeBadge,
                  isArticle
                    ? styles.resultTypeBadgeArticle
                    : styles.resultTypeBadgeFAQ,
                ]}
              >
                <Text style={styles.resultTypeText}>
                  {isArticle ? 'ARTICLE' : 'FAQ'}
                </Text>
              </View>
            </View>

            <Text style={styles.resultCategory}>{categoryName}</Text>

            <Text style={styles.resultSummary}>
              {isArticle
                ? (resultItem as HelpArticle).summary
                : (resultItem as FAQ).answer}
            </Text>

            <View style={styles.resultMeta}>
              <View style={styles.resultMetaLeft}>
                {isArticle && (
                  <>
                    <Icon name="clock" size={12} color={theme.textTertiary} />
                    <Text style={styles.resultMetaText}>
                      {(resultItem as HelpArticle).estimatedReadTime} min read
                    </Text>
                  </>
                )}

                <Icon
                  name="thumbs-up"
                  size={12}
                  color={theme.success}
                  style={{ marginLeft: isArticle ? spacing.md : 0 }}
                />
                <Text style={[styles.resultMetaText, { color: theme.success }]}>
                  {resultItem.helpful}
                </Text>
              </View>

              <Text style={styles.relevanceScore}>
                {Math.round(item.relevanceScore)}% match
              </Text>
            </View>
          </View>
        </Card>
      </TouchableOpacity>
    );
  };

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-left" size={20} color={theme.primary} />
          <Text style={styles.backButtonText}>Help Center</Text>
        </TouchableOpacity>

        <Text style={styles.title}>Search Help</Text>

        <View style={styles.searchContainer}>
          <Icon name="search" size={20} color={theme.textTertiary} />
          <TextInput
            style={styles.searchInput}
            placeholder="Search articles and FAQs..."
            placeholderTextColor={theme.textTertiary}
            value={searchQuery}
            onChangeText={setSearchQuery}
            autoFocus
          />
          <View style={styles.searchActions}>
            {searchQuery.length > 0 && (
              <TouchableOpacity
                style={styles.clearButton}
                onPress={clearSearch}
              >
                <Icon name="x" size={16} color={theme.textTertiary} />
              </TouchableOpacity>
            )}
          </View>
        </View>
      </View>

      <View style={styles.filtersContainer}>
        <View style={styles.filtersHeader}>
          <Text style={styles.filtersTitle}>Filters</Text>
          <TouchableOpacity
            style={styles.toggleFiltersButton}
            onPress={() => setShowFilters(!showFilters)}
          >
            <Text style={styles.toggleFiltersText}>
              {showFilters ? 'Hide' : 'Show'} Filters
            </Text>
            <Icon
              name={showFilters ? 'chevron-up' : 'chevron-down'}
              size={16}
              color={theme.primary}
            />
          </TouchableOpacity>
        </View>

        {showFilters && (
          <>
            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Content Type</Text>
              <View style={styles.filterChips}>
                {renderFilterChip(types, selectedType, setSelectedType)}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Category</Text>
              <View style={styles.filterChips}>
                {renderFilterChip(
                  categories,
                  selectedCategory,
                  setSelectedCategory
                )}
              </View>
            </View>

            <View style={styles.filterRow}>
              <Text style={styles.filterLabel}>Difficulty</Text>
              <View style={styles.filterChips}>
                {renderFilterChip(
                  difficulties,
                  selectedDifficulty,
                  setSelectedDifficulty
                )}
              </View>
            </View>

            <CustomButton
              title="Reset Filters"
              onPress={resetFilters}
              variant="outline"
              style={{ alignSelf: 'flex-start' }}
            />
          </>
        )}
      </View>

      <ScrollView style={{ flex: 1 }} showsVerticalScrollIndicator={false}>
        <View style={styles.resultsContainer}>
          {searchQuery.trim() === '' ? (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyText}>
                Enter a search term to find help articles and FAQs
              </Text>
            </View>
          ) : loading ? (
            <View style={styles.loadingContainer}>
              <Icon name="loader" size={32} color={theme.textTertiary} />
              <Text style={styles.loadingText}>Searching...</Text>
            </View>
          ) : searchResults.length > 0 ? (
            <>
              <View style={styles.resultsHeader}>
                <Text style={styles.resultsCount}>
                  {searchResults.length} result
                  {searchResults.length !== 1 ? 's' : ''} found
                </Text>
              </View>

              <FlatList
                data={searchResults}
                renderItem={renderSearchResult}
                keyExtractor={(item, index) =>
                  `${item.type}-${item.item.id}-${index}`
                }
                scrollEnabled={false}
              />
            </>
          ) : (
            <View style={styles.emptyState}>
              <Icon name="search" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyText}>
                No results found for "{searchQuery}"
              </Text>
              <Text style={[styles.emptyText, { marginTop: spacing.sm }]}>
                Try different keywords or check your spelling
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
