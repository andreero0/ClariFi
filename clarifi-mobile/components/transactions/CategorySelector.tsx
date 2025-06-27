import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  ScrollView,
  StyleSheet,
  Modal,
  SafeAreaView,
  TextInput,
  Dimensions,
} from 'react-native';

interface Category {
  id: string;
  name: string;
  color: string;
  type: 'income' | 'expense';
  icon?: string;
}

interface CategorySelectorProps {
  selectedCategoryId?: string;
  onCategorySelect: (categoryId: string, categoryName: string) => void;
  onClose: () => void;
  transactionType?: 'income' | 'expense' | 'all';
}

export const CategorySelector: React.FC<CategorySelectorProps> = ({
  selectedCategoryId,
  onCategorySelect,
  onClose,
  transactionType = 'all',
}) => {
  const [searchText, setSearchText] = useState('');
  const [selectedType, setSelectedType] = useState<
    'all' | 'income' | 'expense'
  >(transactionType === 'all' ? 'all' : transactionType);

  // Default categories - in a real app, these would come from Supabase
  const allCategories: Category[] = [
    // Expense Categories
    {
      id: 'food',
      name: 'Food & Dining',
      color: '#FF6B6B',
      type: 'expense',
      icon: '🍽️',
    },
    {
      id: 'groceries',
      name: 'Groceries',
      color: '#FF8E53',
      type: 'expense',
      icon: '🛒',
    },
    {
      id: 'transport',
      name: 'Transportation',
      color: '#4ECDC4',
      type: 'expense',
      icon: '🚗',
    },
    {
      id: 'gas',
      name: 'Gas & Fuel',
      color: '#45B7D1',
      type: 'expense',
      icon: '⛽',
    },
    {
      id: 'shopping',
      name: 'Shopping',
      color: '#96CEB4',
      type: 'expense',
      icon: '🛍️',
    },
    {
      id: 'entertainment',
      name: 'Entertainment',
      color: '#FECA57',
      type: 'expense',
      icon: '🎬',
    },
    {
      id: 'bills',
      name: 'Bills & Utilities',
      color: '#FF9FF3',
      type: 'expense',
      icon: '💡',
    },
    {
      id: 'healthcare',
      name: 'Healthcare',
      color: '#54A0FF',
      type: 'expense',
      icon: '🏥',
    },
    {
      id: 'education',
      name: 'Education',
      color: '#5F27CD',
      type: 'expense',
      icon: '📚',
    },
    {
      id: 'insurance',
      name: 'Insurance',
      color: '#00D2D3',
      type: 'expense',
      icon: '🛡️',
    },
    {
      id: 'rent',
      name: 'Rent & Mortgage',
      color: '#FF6348',
      type: 'expense',
      icon: '🏠',
    },
    {
      id: 'personal',
      name: 'Personal Care',
      color: '#FF9980',
      type: 'expense',
      icon: '💄',
    },
    {
      id: 'travel',
      name: 'Travel',
      color: '#48CAE4',
      type: 'expense',
      icon: '✈️',
    },
    {
      id: 'subscriptions',
      name: 'Subscriptions',
      color: '#A8E6CF',
      type: 'expense',
      icon: '📱',
    },
    {
      id: 'charity',
      name: 'Charity & Donations',
      color: '#DDA0DD',
      type: 'expense',
      icon: '💝',
    },
    {
      id: 'fees',
      name: 'Bank Fees',
      color: '#CD919E',
      type: 'expense',
      icon: '🏦',
    },
    {
      id: 'other_expense',
      name: 'Other Expense',
      color: '#8E8E93',
      type: 'expense',
      icon: '📋',
    },

    // Income Categories
    {
      id: 'salary',
      name: 'Salary',
      color: '#32D74B',
      type: 'income',
      icon: '💼',
    },
    {
      id: 'freelance',
      name: 'Freelance',
      color: '#30D158',
      type: 'income',
      icon: '💻',
    },
    {
      id: 'business',
      name: 'Business Income',
      color: '#40C4FF',
      type: 'income',
      icon: '🏢',
    },
    {
      id: 'investment',
      name: 'Investment Returns',
      color: '#64FFDA',
      type: 'income',
      icon: '📈',
    },
    {
      id: 'refund',
      name: 'Refunds',
      color: '#84FFFF',
      type: 'income',
      icon: '💰',
    },
    {
      id: 'gift',
      name: 'Gifts Received',
      color: '#B39DDB',
      type: 'income',
      icon: '🎁',
    },
    {
      id: 'government',
      name: 'Government Benefits',
      color: '#81C784',
      type: 'income',
      icon: '🏛️',
    },
    {
      id: 'rental',
      name: 'Rental Income',
      color: '#A5D6A7',
      type: 'income',
      icon: '🏠',
    },
    {
      id: 'other_income',
      name: 'Other Income',
      color: '#C8E6C9',
      type: 'income',
      icon: '📊',
    },
  ];

  const filteredCategories = allCategories.filter(category => {
    const matchesSearch = category.name
      .toLowerCase()
      .includes(searchText.toLowerCase());
    const matchesType =
      selectedType === 'all' || category.type === selectedType;
    return matchesSearch && matchesType;
  });

  const handleCategoryPress = (category: Category) => {
    onCategorySelect(category.id, category.name);
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

  const renderCategoryItem = (category: Category) => {
    const isSelected = category.id === selectedCategoryId;

    return (
      <TouchableOpacity
        key={category.id}
        style={[styles.categoryItem, isSelected && styles.categoryItemSelected]}
        onPress={() => handleCategoryPress(category)}
      >
        <View style={styles.categoryLeft}>
          <View
            style={[styles.categoryIcon, { backgroundColor: category.color }]}
          >
            <Text style={styles.categoryEmoji}>{category.icon}</Text>
          </View>

          <View style={styles.categoryInfo}>
            <Text style={styles.categoryName}>{category.name}</Text>
            <Text style={styles.categoryType}>
              {category.type === 'income' ? 'Income' : 'Expense'}
            </Text>
          </View>
        </View>

        {isSelected && (
          <View style={styles.selectedIndicator}>
            <Text style={styles.selectedCheckmark}>✓</Text>
          </View>
        )}
      </TouchableOpacity>
    );
  };

  return (
    <Modal
      visible={true}
      animationType="slide"
      presentationStyle="pageSheet"
      onRequestClose={onClose}
    >
      <SafeAreaView style={styles.container}>
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity style={styles.cancelButton} onPress={onClose}>
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>

          <Text style={styles.title}>Select Category</Text>

          <View style={styles.headerPlaceholder} />
        </View>

        {/* Search */}
        <View style={styles.searchContainer}>
          <TextInput
            style={styles.searchInput}
            value={searchText}
            onChangeText={setSearchText}
            placeholder="Search categories..."
            placeholderTextColor="#6c757d"
            autoCapitalize="none"
            autoCorrect={false}
          />
        </View>

        {/* Type Selector */}
        {transactionType === 'all' && renderTypeSelector()}

        {/* Categories List */}
        <ScrollView
          style={styles.categoriesList}
          contentContainerStyle={styles.categoriesContent}
          showsVerticalScrollIndicator={false}
        >
          {filteredCategories.length > 0 ? (
            filteredCategories.map(renderCategoryItem)
          ) : (
            <View style={styles.emptyState}>
              <Text style={styles.emptyStateText}>No categories found</Text>
              <Text style={styles.emptyStateSubtext}>
                Try adjusting your search or type filter
              </Text>
            </View>
          )}
        </ScrollView>
      </SafeAreaView>
    </Modal>
  );
};

const { width } = Dimensions.get('window');

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    paddingVertical: 4,
  },
  cancelButtonText: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  headerPlaceholder: {
    width: 50, // Balance the layout
  },
  searchContainer: {
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  searchInput: {
    height: 40,
    backgroundColor: '#f8f9fa',
    borderRadius: 8,
    paddingHorizontal: 12,
    fontSize: 16,
    color: '#1a1a1a',
  },
  typeSelector: {
    flexDirection: 'row',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
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
  categoriesList: {
    flex: 1,
  },
  categoriesContent: {
    paddingVertical: 8,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#f1f3f4',
  },
  categoryItemSelected: {
    backgroundColor: '#f0f8ff',
  },
  categoryLeft: {
    flexDirection: 'row',
    alignItems: 'center',
    flex: 1,
  },
  categoryIcon: {
    width: 40,
    height: 40,
    borderRadius: 20,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  categoryEmoji: {
    fontSize: 18,
  },
  categoryInfo: {
    flex: 1,
  },
  categoryName: {
    fontSize: 16,
    fontWeight: '500',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  categoryType: {
    fontSize: 14,
    color: '#6c757d',
  },
  selectedIndicator: {
    width: 24,
    height: 24,
    borderRadius: 12,
    backgroundColor: '#007AFF',
    alignItems: 'center',
    justifyContent: 'center',
  },
  selectedCheckmark: {
    fontSize: 14,
    color: '#ffffff',
    fontWeight: 'bold',
  },
  emptyState: {
    flex: 1,
    alignItems: 'center',
    justifyContent: 'center',
    paddingVertical: 60,
    paddingHorizontal: 32,
  },
  emptyStateText: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 8,
  },
  emptyStateSubtext: {
    fontSize: 14,
    color: '#6c757d',
    textAlign: 'center',
  },
});
