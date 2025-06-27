import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  ScrollView,
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
  HelpCategory,
  HelpArticle,
  HelpSubcategory,
} from '../../services/support/HelpContentService';

export default function HelpCategoryScreen() {
  const router = useRouter();
  const { theme } = useTheme();
  const { id: categoryId } = useLocalSearchParams<{ id: string }>();

  const [category, setCategory] = useState<HelpCategory | null>(null);
  const [articles, setArticles] = useState<HelpArticle[]>([]);
  const [selectedSubcategory, setSelectedSubcategory] = useState<string>('all');
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    loadCategoryData();
  }, [categoryId, selectedSubcategory]);

  const loadCategoryData = async () => {
    if (!categoryId) return;

    setLoading(true);
    try {
      const categoryData = await HelpContentService.getCategory(categoryId);
      setCategory(categoryData);

      if (categoryData) {
        const subcategoryId =
          selectedSubcategory === 'all' ? undefined : selectedSubcategory;
        const categoryArticles = await HelpContentService.getArticlesByCategory(
          categoryId,
          subcategoryId
        );
        setArticles(categoryArticles);
      }
    } catch (error) {
      console.error('Error loading category data:', error);
    } finally {
      setLoading(false);
    }
  };

  const handleArticlePress = (articleId: string) => {
    router.push(`/modals/help-article?id=${articleId}`);
  };

  const handleSubcategoryPress = (subcategoryId: string) => {
    setSelectedSubcategory(subcategoryId);
  };

  const handleBackPress = () => {
    router.back();
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
      ...textStyles.h1,
      color: theme.textPrimary,
      marginBottom: spacing.sm,
    },
    description: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginBottom: spacing.lg,
    },
    categoryIcon: {
      alignSelf: 'center',
      marginBottom: spacing.md,
    },
    subcategoriesContainer: {
      paddingHorizontal: spacing.lg,
      paddingVertical: spacing.md,
      borderBottomWidth: 1,
      borderBottomColor: theme.border,
    },
    subcategoriesTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.sm,
    },
    subcategoriesScroll: {
      flexDirection: 'row',
    },
    subcategoryChip: {
      paddingHorizontal: spacing.md,
      paddingVertical: spacing.sm,
      borderRadius: 20,
      marginRight: spacing.sm,
      borderWidth: 1,
    },
    subcategoryChipActive: {
      backgroundColor: theme.primary,
      borderColor: theme.primary,
    },
    subcategoryChipInactive: {
      backgroundColor: 'transparent',
      borderColor: theme.border,
    },
    subcategoryText: {
      ...textStyles.bodySmall,
    },
    subcategoryTextActive: {
      color: '#FFFFFF',
    },
    subcategoryTextInactive: {
      color: theme.textSecondary,
    },
    content: {
      flex: 1,
    },
    articlesSection: {
      padding: spacing.lg,
    },
    sectionTitle: {
      ...textStyles.h3,
      color: theme.textPrimary,
      marginBottom: spacing.md,
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
    difficultyBadge: {
      paddingHorizontal: spacing.xs,
      paddingVertical: 2,
      borderRadius: 8,
      marginLeft: spacing.sm,
    },
    difficultyBeginner: {
      backgroundColor: theme.success,
    },
    difficultyIntermediate: {
      backgroundColor: '#FF9500', // Orange
    },
    difficultyAdvanced: {
      backgroundColor: theme.error,
    },
    difficultyText: {
      ...textStyles.caption,
      color: '#FFFFFF',
      fontSize: 10,
    },
    articleSummary: {
      ...textStyles.bodySmall,
      color: theme.textSecondary,
      marginBottom: spacing.sm,
    },
    articleMeta: {
      flexDirection: 'row',
      justifyContent: 'space-between',
      alignItems: 'center',
    },
    articleMetaLeft: {
      flexDirection: 'row',
      alignItems: 'center',
    },
    articleMetaText: {
      ...textStyles.caption,
      color: theme.textTertiary,
      marginLeft: spacing.xs,
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
      flex: 1,
      justifyContent: 'center',
      alignItems: 'center',
    },
    loadingText: {
      ...textStyles.bodyRegular,
      color: theme.textSecondary,
      marginTop: spacing.md,
    },
  });

  const getDifficultyBadgeStyle = (difficulty: string) => {
    switch (difficulty) {
      case 'beginner':
        return styles.difficultyBeginner;
      case 'intermediate':
        return styles.difficultyIntermediate;
      case 'advanced':
        return styles.difficultyAdvanced;
      default:
        return styles.difficultyBeginner;
    }
  };

  const renderSubcategoryChip = (subcategory: HelpSubcategory) => {
    const isActive = selectedSubcategory === subcategory.id;
    return (
      <TouchableOpacity
        key={subcategory.id}
        style={[
          styles.subcategoryChip,
          isActive
            ? styles.subcategoryChipActive
            : styles.subcategoryChipInactive,
        ]}
        onPress={() => handleSubcategoryPress(subcategory.id)}
        activeOpacity={0.7}
      >
        <Text
          style={[
            styles.subcategoryText,
            isActive
              ? styles.subcategoryTextActive
              : styles.subcategoryTextInactive,
          ]}
        >
          {subcategory.title}
        </Text>
      </TouchableOpacity>
    );
  };

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
            <View
              style={[
                styles.difficultyBadge,
                getDifficultyBadgeStyle(item.difficulty),
              ]}
            >
              <Text style={styles.difficultyText}>
                {item.difficulty.toUpperCase()}
              </Text>
            </View>
          </View>

          <Text style={styles.articleSummary}>{item.summary}</Text>

          <View style={styles.articleMeta}>
            <View style={styles.articleMetaLeft}>
              <Icon name="clock" size={12} color={theme.textTertiary} />
              <Text style={styles.articleMetaText}>
                {item.estimatedReadTime} min read
              </Text>

              <Icon
                name="eye"
                size={12}
                color={theme.textTertiary}
                style={{ marginLeft: spacing.md }}
              />
              <Text style={styles.articleMetaText}>{item.views} views</Text>
            </View>

            <View style={styles.articleMetaLeft}>
              <Icon name="thumbs-up" size={12} color={theme.success} />
              <Text style={[styles.articleMetaText, { color: theme.success }]}>
                {item.helpful}
              </Text>
            </View>
          </View>
        </View>
      </Card>
    </TouchableOpacity>
  );

  if (loading) {
    return (
      <View style={styles.container}>
        <View style={styles.loadingContainer}>
          <Icon name="loader" size={32} color={theme.textTertiary} />
          <Text style={styles.loadingText}>Loading category...</Text>
        </View>
      </View>
    );
  }

  if (!category) {
    return (
      <View style={styles.container}>
        <View style={styles.emptyState}>
          <Icon name="alert-circle" size={48} color={theme.textTertiary} />
          <Text style={styles.emptyText}>Category not found</Text>
          <CustomButton
            title="Back to Help Center"
            onPress={handleBackPress}
            variant="outline"
            style={{ marginTop: spacing.md }}
          />
        </View>
      </View>
    );
  }

  return (
    <View style={styles.container}>
      <View style={styles.header}>
        <TouchableOpacity style={styles.backButton} onPress={handleBackPress}>
          <Icon name="arrow-left" size={20} color={theme.primary} />
          <Text style={styles.backButtonText}>Help Center</Text>
        </TouchableOpacity>

        <View style={styles.categoryIcon}>
          <Icon name={category.icon} size={32} color={theme.primary} />
        </View>

        <Text style={styles.title}>{category.title}</Text>
        <Text style={styles.description}>{category.description}</Text>
      </View>

      {category.subcategories.length > 0 && (
        <View style={styles.subcategoriesContainer}>
          <Text style={styles.subcategoriesTitle}>Filter by Topic</Text>
          <ScrollView
            horizontal
            showsHorizontalScrollIndicator={false}
            contentContainerStyle={styles.subcategoriesScroll}
          >
            <TouchableOpacity
              style={[
                styles.subcategoryChip,
                selectedSubcategory === 'all'
                  ? styles.subcategoryChipActive
                  : styles.subcategoryChipInactive,
              ]}
              onPress={() => handleSubcategoryPress('all')}
              activeOpacity={0.7}
            >
              <Text
                style={[
                  styles.subcategoryText,
                  selectedSubcategory === 'all'
                    ? styles.subcategoryTextActive
                    : styles.subcategoryTextInactive,
                ]}
              >
                All Topics
              </Text>
            </TouchableOpacity>

            {category.subcategories.map(renderSubcategoryChip)}
          </ScrollView>
        </View>
      )}

      <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
        <View style={styles.articlesSection}>
          <Text style={styles.sectionTitle}>
            {selectedSubcategory === 'all'
              ? 'All Articles'
              : category.subcategories.find(
                  sub => sub.id === selectedSubcategory
                )?.title || 'Articles'}
          </Text>

          {articles.length > 0 ? (
            <FlatList
              data={articles}
              renderItem={renderArticleItem}
              keyExtractor={item => item.id}
              scrollEnabled={false}
            />
          ) : (
            <View style={styles.emptyState}>
              <Icon name="file-text" size={48} color={theme.textTertiary} />
              <Text style={styles.emptyText}>
                No articles found in this category
              </Text>
            </View>
          )}
        </View>
      </ScrollView>
    </View>
  );
}
