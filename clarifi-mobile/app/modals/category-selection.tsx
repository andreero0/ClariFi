import React, { useState, useRef, useEffect } from 'react';
import {
  View,
  Text,
  StyleSheet,
  TouchableOpacity,
  ScrollView,
  TextInput,
  Dimensions,
  Animated,
  PanResponder,
} from 'react-native';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { X, Search, Clock, Plus } from 'lucide-react-native';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

const { height } = Dimensions.get('window');

interface Category {
  id: string;
  name: string;
  icon: string;
  color: string;
  isRecent?: boolean;
  isSelected?: boolean;
}

// PRD: Category Selection Modal State
const CategorySelectionModal = () => {
  const router = useRouter();
  const params = useLocalSearchParams();
  const transactionId = params.transactionId as string;
  const currentCategoryId = params.currentCategoryId as string;

  const [searchText, setSearchText] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string | null>(
    currentCategoryId
  );
  const [categories, setCategories] = useState<Category[]>([]);
  const [filteredCategories, setFilteredCategories] = useState<Category[]>([]);

  // PRD: Bottom sheet modal slides up (300ms spring animation)
  const slideAnim = useRef(new Animated.Value(height)).current;
  const scaleAnim = useRef(new Animated.Value(1)).current;

  useEffect(() => {
    // Slide up animation on mount
    Animated.spring(slideAnim, {
      toValue: 0,
      duration: 300,
      useNativeDriver: true,
      tension: 65,
      friction: 8,
    }).start();

    loadCategories();
  }, []);

  useEffect(() => {
    // Filter categories based on search
    if (searchText.trim() === '') {
      setFilteredCategories(categories);
    } else {
      const filtered = categories.filter(category =>
        category.name.toLowerCase().includes(searchText.toLowerCase())
      );
      setFilteredCategories(filtered);
    }
  }, [searchText, categories]);

  const loadCategories = () => {
    // Mock categories - in real app this would come from API
    const mockCategories: Category[] = [
      // Recently used categories (shown first)
      {
        id: 'food-dining',
        name: 'Food & Dining',
        icon: '🍔',
        color: '#FF6B6B',
        isRecent: true,
      },
      {
        id: 'transport',
        name: 'Transport',
        icon: '🚗',
        color: '#4ECDC4',
        isRecent: true,
      },
      {
        id: 'groceries',
        name: 'Groceries',
        icon: '🛒',
        color: '#45B7D1',
        isRecent: true,
      },

      // All categories
      {
        id: 'entertainment',
        name: 'Entertainment',
        icon: '🎬',
        color: '#96CEB4',
      },
      { id: 'bills', name: 'Bills & Utilities', icon: '📱', color: '#FECA57' },
      { id: 'healthcare', name: 'Healthcare', icon: '🏥', color: '#FF9FF3' },
      { id: 'education', name: 'Education', icon: '📚', color: '#54A0FF' },
      { id: 'shopping', name: 'Shopping', icon: '🛍️', color: '#5F27CD' },
      { id: 'travel', name: 'Travel', icon: '✈️', color: '#00D2D3' },
      { id: 'fitness', name: 'Fitness & Gym', icon: '🏋️', color: '#FF9F43' },
      {
        id: 'subscriptions',
        name: 'Subscriptions',
        icon: '📺',
        color: '#6C5CE7',
      },
      { id: 'income', name: 'Income', icon: '💰', color: '#00C896' },
      { id: 'investments', name: 'Investments', icon: '📈', color: '#3742FA' },
      { id: 'insurance', name: 'Insurance', icon: '🛡️', color: '#2F3542' },
      { id: 'gifts', name: 'Gifts & Donations', icon: '🎁', color: '#FF3838' },
      { id: 'business', name: 'Business', icon: '💼', color: '#2C2C54' },
      {
        id: 'personal-care',
        name: 'Personal Care',
        icon: '💅',
        color: '#FDA7DF',
      },
      { id: 'home', name: 'Home & Garden', icon: '🏠', color: '#26C6DA' },
    ];

    setCategories(mockCategories);
    setFilteredCategories(mockCategories);
  };

  const handleClose = () => {
    // Slide down animation before closing
    Animated.spring(slideAnim, {
      toValue: height,
      duration: 250,
      useNativeDriver: true,
    }).start(() => {
      router.back();
    });
  };

  const handleCategorySelect = (categoryId: string) => {
    setSelectedCategory(categoryId);

    // PRD: Selected category animates with scale pulse (1.0 to 1.05 to 1.0)
    Animated.sequence([
      Animated.timing(scaleAnim, {
        toValue: 1.05,
        duration: 100,
        useNativeDriver: true,
      }),
      Animated.timing(scaleAnim, {
        toValue: 1.0,
        duration: 100,
        useNativeDriver: true,
      }),
    ]).start();

    // Auto-close after selection (with delay for animation)
    setTimeout(() => {
      handleClose();
      // In real app, this would update the transaction category
      // router.push({ pathname: '/modals/transaction-detail', params: { transactionId, newCategoryId: categoryId } });
    }, 200);
  };

  const handleCreateCustomCategory = () => {
    router.push('/modals/create-category');
  };

  // Separate recent and regular categories
  const recentCategories = filteredCategories.filter(cat => cat.isRecent);
  const regularCategories = filteredCategories.filter(cat => !cat.isRecent);

  const renderCategoryGrid = (categories: Category[], title?: string) => {
    if (categories.length === 0) return null;

    const rows = [];
    for (let i = 0; i < categories.length; i += 3) {
      const rowCategories = categories.slice(i, i + 3);
      rows.push(
        <View key={`row-${i}`} style={styles.categoryRow}>
          {rowCategories.map(category => renderCategoryItem(category))}
          {/* Fill empty slots in the row */}
          {rowCategories.length < 3 &&
            Array.from({ length: 3 - rowCategories.length }).map((_, index) => (
              <View
                key={`empty-${i}-${index}`}
                style={styles.emptyCategorySlot}
              />
            ))}
        </View>
      );
    }

    return (
      <View style={styles.categorySection}>
        {title && (
          <View style={styles.sectionHeader}>
            {title === 'Recently Used' && (
              <Clock size={16} color={colors.textSecondary} />
            )}
            <Text style={styles.sectionTitle}>{title}</Text>
          </View>
        )}
        {rows}
      </View>
    );
  };

  const renderCategoryItem = (category: Category) => {
    const isSelected = selectedCategory === category.id;

    return (
      <Animated.View
        key={category.id}
        style={[
          styles.categoryItem,
          isSelected && styles.selectedCategoryItem,
          { transform: [{ scale: isSelected ? scaleAnim : 1 }] },
        ]}
      >
        <TouchableOpacity
          style={[
            styles.categoryButton,
            isSelected && styles.selectedCategoryButton,
            {
              backgroundColor: isSelected
                ? `${category.color}15`
                : colors.surface,
            },
          ]}
          onPress={() => handleCategorySelect(category.id)}
          activeOpacity={0.7}
        >
          {/* PRD: Each cell has icon (32dp), name, and selection radio */}
          <Text style={styles.categoryIcon}>{category.icon}</Text>
          <Text
            style={[
              styles.categoryName,
              isSelected && { color: category.color },
            ]}
            numberOfLines={2}
          >
            {category.name}
          </Text>

          {/* Selection radio */}
          <View
            style={[
              styles.radioButton,
              isSelected && { borderColor: category.color },
            ]}
          >
            {isSelected && (
              <View
                style={[
                  styles.radioButtonInner,
                  { backgroundColor: category.color },
                ]}
              />
            )}
          </View>
        </TouchableOpacity>
      </Animated.View>
    );
  };

  return (
    <View style={styles.container}>
      {/* Background overlay */}
      <TouchableOpacity
        style={styles.overlay}
        activeOpacity={1}
        onPress={handleClose}
      />

      {/* PRD: Bottom sheet modal slides up */}
      <Animated.View
        style={[
          styles.modalContainer,
          {
            transform: [{ translateY: slideAnim }],
          },
        ]}
      >
        {/* Handle indicator */}
        <View style={styles.handleContainer}>
          <View style={styles.handle} />
        </View>

        {/* PRD: "Choose Category" header with close X */}
        <View style={styles.header}>
          <Text style={styles.headerTitle}>Choose Category</Text>
          <TouchableOpacity style={styles.closeButton} onPress={handleClose}>
            <X size={24} color={colors.textSecondary} />
          </TouchableOpacity>
        </View>

        {/* PRD: Search bar with magnifying glass icon */}
        <View style={styles.searchContainer}>
          <Search
            size={20}
            color={colors.textSecondary}
            style={styles.searchIcon}
          />
          <TextInput
            style={styles.searchInput}
            placeholder="Search categories..."
            value={searchText}
            onChangeText={setSearchText}
            autoCorrect={false}
            autoCapitalize="none"
          />
        </View>

        {/* PRD: Grid layout (3 columns) of category options */}
        <ScrollView
          style={styles.categoriesContainer}
          showsVerticalScrollIndicator={false}
          contentContainerStyle={styles.categoriesContent}
        >
          {/* PRD: Recently used categories shown first with clock icon */}
          {searchText === '' &&
            recentCategories.length > 0 &&
            renderCategoryGrid(recentCategories, 'Recently Used')}

          {/* All categories */}
          {renderCategoryGrid(
            regularCategories,
            searchText === '' ? 'All Categories' : undefined
          )}

          {/* PRD: "Create Custom Category" option at bottom */}
          <TouchableOpacity
            style={styles.createCategoryButton}
            onPress={handleCreateCustomCategory}
          >
            <Plus size={20} color={colors.primary} />
            <Text style={styles.createCategoryText}>
              Create Custom Category
            </Text>
          </TouchableOpacity>
        </ScrollView>
      </Animated.View>
    </View>
  );
};

const styles = StyleSheet.create({
  container: {
    flex: 1,
    justifyContent: 'flex-end',
  },
  overlay: {
    position: 'absolute',
    top: 0,
    left: 0,
    right: 0,
    bottom: 0,
    backgroundColor: 'rgba(0, 0, 0, 0.5)',
  },
  // PRD: Bottom sheet modal
  modalContainer: {
    backgroundColor: colors.surface,
    borderTopLeftRadius: 20,
    borderTopRightRadius: 20,
    maxHeight: height * 0.85,
    minHeight: height * 0.6,
  },
  handleContainer: {
    alignItems: 'center',
    paddingVertical: 8,
  },
  handle: {
    width: 40,
    height: 4,
    backgroundColor: colors.neutral.light,
    borderRadius: 2,
  },
  // PRD: Header with title and close button
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 24,
    paddingVertical: 16,
    borderBottomWidth: 1,
    borderBottomColor: colors.neutral.light,
  },
  headerTitle: {
    ...textStyles.h3,
    color: colors.textPrimary,
  },
  closeButton: {
    padding: 4,
  },
  // PRD: Search bar with magnifying glass icon
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    marginBottom: 8,
    backgroundColor: colors.neutral.lightest,
    borderRadius: 12,
    paddingHorizontal: 16,
    height: 48,
  },
  searchIcon: {
    marginRight: 12,
  },
  searchInput: {
    flex: 1,
    ...textStyles.bodyRegular,
    color: colors.textPrimary,
    paddingVertical: 0,
  },
  categoriesContainer: {
    flex: 1,
  },
  categoriesContent: {
    paddingBottom: 32,
  },
  categorySection: {
    marginBottom: 24,
  },
  // Section headers
  sectionHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: colors.neutral.lightest,
  },
  sectionTitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    fontWeight: '600',
    marginLeft: 8,
  },
  // PRD: Grid layout (3 columns)
  categoryRow: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    marginBottom: 8,
  },
  categoryItem: {
    flex: 1,
    marginHorizontal: 8,
  },
  emptyCategorySlot: {
    flex: 1,
    marginHorizontal: 8,
  },
  // PRD: Category cells with icon, name, and radio
  categoryButton: {
    backgroundColor: colors.surface,
    borderRadius: 12,
    padding: 16,
    alignItems: 'center',
    minHeight: 100,
    borderWidth: 1,
    borderColor: colors.neutral.light,
    position: 'relative',
  },
  selectedCategoryButton: {
    borderWidth: 2,
    borderColor: colors.primary,
  },
  selectedCategoryItem: {
    // PRD: Selected category highlighted with Clarity Blue background (10% opacity)
    backgroundColor: `${colors.primary}0A`,
    borderRadius: 12,
  },
  // PRD: Icon (32dp)
  categoryIcon: {
    fontSize: 32,
    marginBottom: 8,
  },
  categoryName: {
    ...textStyles.bodySmall,
    color: colors.textPrimary,
    textAlign: 'center',
    fontWeight: '500',
    marginBottom: 8,
    lineHeight: 16,
  },
  // Selection radio button
  radioButton: {
    width: 16,
    height: 16,
    borderRadius: 8,
    borderWidth: 2,
    borderColor: colors.neutral.medium,
    alignItems: 'center',
    justifyContent: 'center',
    position: 'absolute',
    top: 8,
    right: 8,
  },
  radioButtonInner: {
    width: 8,
    height: 8,
    borderRadius: 4,
  },
  // PRD: "Create Custom Category" option at bottom
  createCategoryButton: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'center',
    marginHorizontal: 24,
    marginTop: 16,
    paddingVertical: 16,
    borderWidth: 2,
    borderColor: colors.primary,
    borderStyle: 'dashed',
    borderRadius: 12,
    backgroundColor: `${colors.primary}05`,
  },
  createCategoryText: {
    ...textStyles.bodyRegular,
    color: colors.primary,
    fontWeight: '600',
    marginLeft: 8,
  },
});

export default CategorySelectionModal;
