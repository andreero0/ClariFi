import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  FlatList,
  TouchableOpacity,
  StyleSheet,
  Alert,
  RefreshControl,
  ActivityIndicator,
  Dimensions,
  TextInput,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { FolderOpen, Plus } from 'lucide-react-native';
import { useRouter } from 'expo-router';
import { CategoryItem } from '../../components/categories/CategoryItem';
import { CategoryStats } from '../../components/categories/CategoryStats';
import { useCategories } from '../../hooks/useCategories';
import { colors } from '../../constants/colors';
import { textStyles } from '../../constants/typography';

interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon?: string;
  is_default: boolean;
  usage_count?: number;
  total_amount?: number;
  created_at: string;
  updated_at: string;
}

export default function CategoriesScreen() {
  const router = useRouter();
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<
    'all' | 'income' | 'expense'
  >('all');
  const [refreshing, setRefreshing] = useState(false);

  const {
    categories,
    loading,
    error,
    totalCategories,
    customCategories,
    refreshCategories,
    deleteCategory,
  } = useCategories();

  const filteredCategories = categories.filter(category => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType =
      selectedType === 'all' || category.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleRefresh = async () => {
    setRefreshing(true);
    try {
      await refreshCategories();
    } catch (error) {
      console.error('Failed to refresh categories:', error);
      Alert.alert('Error', 'Failed to refresh categories. Please try again.');
    } finally {
      setRefreshing(false);
    }
  };

  const handleAddCategory = () => {
    router.push('/modals/category-detail');
  };

  const handleEditCategory = (category: Category) => {
    router.push(`/modals/category-detail?id=${category.id}`);
  };

  const handleDeleteCategory = (category: Category) => {
    if (category.is_default) {
      Alert.alert('Cannot Delete', 'Default categories cannot be deleted.');
      return;
    }

    Alert.alert(
      'Delete Category',
      `Are you sure you want to delete "${category.name}"? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            try {
              await deleteCategory(category.id);
              Alert.alert('Success', 'Category deleted successfully');
            } catch (error) {
              console.error('Failed to delete category:', error);
              Alert.alert(
                'Error',
                'Failed to delete category. Please try again.'
              );
            }
          },
        },
      ]
    );
  };

  const renderTypeSelector = () => (
    <View style={styles.typeSelector}>
      {(['all', 'expense', 'income'] as const).map(type => (
        <TouchableOpacity
          key={type}
          style={[
            styles.typeButton,
            selectedType === type && styles.typeButtonActive,
          ]}
          onPress={() => setSelectedType(type)}
        >
          <Text
            style={[
              styles.typeButtonText,
              selectedType === type && styles.typeButtonTextActive,
            ]}
          >
            {type === 'all'
              ? 'All'
              : type === 'expense'
                ? 'Expenses'
                : 'Income'}
          </Text>
        </TouchableOpacity>
      ))}
    </View>
  );

  const renderHeader = () => (
    <View style={styles.header}>
      <View style={styles.titleContainer}>
        <Text style={styles.title}>Categories</Text>
        <Text style={styles.subtitle}>
          {filteredCategories.length} categories
        </Text>
      </View>

      {/* Statistics */}
      <CategoryStats
        totalCategories={totalCategories}
        customCategories={customCategories}
        incomeCategories={categories.filter(c => c.type === 'income').length}
        expenseCategories={categories.filter(c => c.type === 'expense').length}
      />

      {/* Search Bar */}
      <View style={styles.searchContainer}>
        <TextInput
          style={styles.searchInput}
          placeholder="Search categories..."
          value={searchText}
          onChangeText={setSearchText}
          clearButtonMode="while-editing"
        />
        <TouchableOpacity style={styles.addButton} onPress={handleAddCategory}>
          <Text style={styles.addButtonText}>Add</Text>
        </TouchableOpacity>
      </View>

      {/* Type Filter */}
      {renderTypeSelector()}
    </View>
  );

  const renderCategory = ({ item }: { item: Category }) => (
    <CategoryItem
      category={item}
      onEdit={() => handleEditCategory(item)}
      onDelete={() => handleDeleteCategory(item)}
      showStats={true}
    />
  );

  const renderEmptyState = () => (
    <View style={styles.emptyContainer}>
      <View style={styles.emptyIconContainer}>
        <FolderOpen size={48} color={colors.textSecondary} />
      </View>
      <Text style={styles.emptyTitle}>No Categories Found</Text>
      <Text style={styles.emptySubtitle}>
        {searchText || selectedType !== 'all'
          ? 'No categories match your current filters'
          : 'Get started by creating your first category'}
      </Text>

      {!searchText && selectedType === 'all' && (
        <TouchableOpacity
          style={styles.emptyButton}
          onPress={handleAddCategory}
        >
          <Text style={styles.emptyButtonText}>Create Category</Text>
        </TouchableOpacity>
      )}
    </View>
  );

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading categories...</Text>
        </View>
      </SafeAreaView>
    );
  }

  if (error) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.errorContainer}>
          <Text style={styles.errorText}>Failed to load categories</Text>
          <TouchableOpacity style={styles.retryButton} onPress={handleRefresh}>
            <Text style={styles.retryButtonText}>Retry</Text>
          </TouchableOpacity>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <FlatList
        data={filteredCategories}
        keyExtractor={item => item.id}
        renderItem={renderCategory}
        ListHeaderComponent={renderHeader}
        ListEmptyComponent={renderEmptyState}
        refreshControl={
          <RefreshControl refreshing={refreshing} onRefresh={handleRefresh} />
        }
        contentContainerStyle={
          filteredCategories.length === 0
            ? styles.emptyListContainer
            : undefined
        }
        showsVerticalScrollIndicator={false}
      />

      {/* Floating Action Button */}
      <TouchableOpacity
        style={styles.fab}
        onPress={handleAddCategory}
        activeOpacity={0.7}
      >
        <Plus size={24} color={colors.surface} />
      </TouchableOpacity>
    </SafeAreaView>
  );
}

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: colors.neutral.lightest,
  },
  header: {
    backgroundColor: colors.surface,
    paddingHorizontal: 16,
    paddingTop: 16,
    paddingBottom: 8,
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: colors.borderLight,
  },
  titleContainer: {
    marginBottom: 16,
  },
  title: {
    ...textStyles.h1,
    color: colors.textPrimary,
  },
  subtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    marginTop: 4,
  },
  searchContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    marginBottom: 16,
  },
  searchInput: {
    flex: 1,
    height: 40,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 8,
    paddingHorizontal: 12,
    backgroundColor: '#ffffff',
    fontSize: 16,
  },
  addButton: {
    marginLeft: 12,
    paddingHorizontal: 16,
    paddingVertical: 10,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  addButtonText: {
    color: '#ffffff',
    fontSize: 14,
    fontWeight: '600',
  },
  typeSelector: {
    flexDirection: 'row',
    marginBottom: 8,
    gap: 8,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 16,
    backgroundColor: '#f8f9fa',
    borderRadius: 20,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  emptyContainer: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingHorizontal: 32,
    paddingVertical: 60,
  },
  emptyListContainer: {
    flexGrow: 1,
  },
  emptyIconContainer: {
    width: 80,
    height: 80,
    borderRadius: 40,
    backgroundColor: '#f8f9fa',
    alignItems: 'center',
    justifyContent: 'center',
    marginBottom: 24,
  },
  emptyTitle: {
    ...textStyles.h2,
    color: colors.textPrimary,
    textAlign: 'center',
    marginBottom: 12,
  },
  emptySubtitle: {
    ...textStyles.bodyRegular,
    color: colors.textSecondary,
    textAlign: 'center',
    lineHeight: 22,
    marginBottom: 32,
  },
  emptyButton: {
    paddingVertical: 16,
    paddingHorizontal: 32,
    backgroundColor: colors.primary,
    borderRadius: 12,
    alignItems: 'center',
  },
  emptyButtonText: {
    ...textStyles.button,
    color: colors.surface,
  },
  loadingContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
  },
  loadingText: {
    marginTop: 16,
    fontSize: 16,
    color: '#6c757d',
  },
  errorContainer: {
    flex: 1,
    justifyContent: 'center',
    alignItems: 'center',
    paddingHorizontal: 32,
  },
  errorText: {
    fontSize: 18,
    color: '#dc3545',
    textAlign: 'center',
    marginBottom: 16,
  },
  retryButton: {
    paddingHorizontal: 24,
    paddingVertical: 12,
    backgroundColor: '#007AFF',
    borderRadius: 8,
  },
  retryButtonText: {
    color: '#ffffff',
    fontSize: 16,
    fontWeight: '600',
  },
  fab: {
    position: 'absolute',
    bottom: 24,
    right: 24,
    width: 56,
    height: 56,
    borderRadius: 28,
    backgroundColor: colors.primary,
    alignItems: 'center',
    justifyContent: 'center',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: 4,
    },
    shadowOpacity: 0.3,
    shadowRadius: 6,
    elevation: 8,
  },
});
