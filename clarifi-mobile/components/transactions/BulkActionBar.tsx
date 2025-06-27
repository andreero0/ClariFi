import React, { useState } from 'react';
import {
  View,
  Text,
  TouchableOpacity,
  StyleSheet,
  Modal,
  Alert,
  SafeAreaView,
  ScrollView,
} from 'react-native';

interface BulkActionBarProps {
  selectedCount: number;
  onAction: (action: string, data?: any) => Promise<void>;
  onCancel: () => void;
}

interface CategoryOption {
  id: string;
  name: string;
  color: string;
}

export const BulkActionBar: React.FC<BulkActionBarProps> = ({
  selectedCount,
  onAction,
  onCancel,
}) => {
  const [showCategoryModal, setShowCategoryModal] = useState(false);
  const [isPerformingAction, setIsPerformingAction] = useState(false);

  const categories: CategoryOption[] = [
    { id: 'food', name: 'Food & Dining', color: '#FF6B6B' },
    { id: 'transport', name: 'Transportation', color: '#4ECDC4' },
    { id: 'shopping', name: 'Shopping', color: '#45B7D1' },
    { id: 'entertainment', name: 'Entertainment', color: '#96CEB4' },
    { id: 'bills', name: 'Bills & Utilities', color: '#FECA57' },
    { id: 'income', name: 'Income', color: '#48CAE4' },
    { id: 'healthcare', name: 'Healthcare', color: '#FF9FF3' },
    { id: 'education', name: 'Education', color: '#54A0FF' },
  ];

  const handleCategorizePress = () => {
    setShowCategoryModal(true);
  };

  const handleCategorySelect = async (category: CategoryOption) => {
    setShowCategoryModal(false);
    setIsPerformingAction(true);

    try {
      await onAction('categorize', {
        categoryId: category.id,
        categoryName: category.name,
      });
    } catch (error) {
      console.error('Failed to categorize transactions:', error);
      Alert.alert(
        'Error',
        'Failed to categorize transactions. Please try again.'
      );
    } finally {
      setIsPerformingAction(false);
    }
  };

  const handleMarkVerified = async () => {
    Alert.alert(
      'Mark as Verified',
      `Mark ${selectedCount} transaction${selectedCount > 1 ? 's' : ''} as user-verified?`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Mark Verified',
          style: 'default',
          onPress: async () => {
            setIsPerformingAction(true);
            try {
              await onAction('mark_verified');
            } catch (error) {
              console.error('Failed to mark transactions as verified:', error);
              Alert.alert(
                'Error',
                'Failed to mark transactions as verified. Please try again.'
              );
            } finally {
              setIsPerformingAction(false);
            }
          },
        },
      ]
    );
  };

  const handleDelete = async () => {
    Alert.alert(
      'Delete Transactions',
      `Are you sure you want to delete ${selectedCount} transaction${selectedCount > 1 ? 's' : ''}? This action cannot be undone.`,
      [
        { text: 'Cancel', style: 'cancel' },
        {
          text: 'Delete',
          style: 'destructive',
          onPress: async () => {
            setIsPerformingAction(true);
            try {
              await onAction('delete');
            } catch (error) {
              console.error('Failed to delete transactions:', error);
              Alert.alert(
                'Error',
                'Failed to delete transactions. Please try again.'
              );
            } finally {
              setIsPerformingAction(false);
            }
          },
        },
      ]
    );
  };

  return (
    <>
      <View style={styles.container}>
        <View style={styles.content}>
          <Text style={styles.selectedText}>{selectedCount} selected</Text>

          <View style={styles.actionsContainer}>
            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleCategorizePress}
              disabled={isPerformingAction}
            >
              <Text style={styles.actionButtonText}>Categorize</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={styles.actionButton}
              onPress={handleMarkVerified}
              disabled={isPerformingAction}
            >
              <Text style={styles.actionButtonText}>Verify</Text>
            </TouchableOpacity>

            <TouchableOpacity
              style={[styles.actionButton, styles.dangerButton]}
              onPress={handleDelete}
              disabled={isPerformingAction}
            >
              <Text style={[styles.actionButtonText, styles.dangerButtonText]}>
                Delete
              </Text>
            </TouchableOpacity>
          </View>

          <TouchableOpacity
            style={styles.cancelButton}
            onPress={onCancel}
            disabled={isPerformingAction}
          >
            <Text style={styles.cancelButtonText}>Cancel</Text>
          </TouchableOpacity>
        </View>
      </View>

      {/* Category Selection Modal */}
      <Modal
        visible={showCategoryModal}
        animationType="slide"
        presentationStyle="pageSheet"
        onRequestClose={() => setShowCategoryModal(false)}
      >
        <SafeAreaView style={styles.modalContainer}>
          <View style={styles.modalHeader}>
            <TouchableOpacity
              style={styles.modalCancelButton}
              onPress={() => setShowCategoryModal(false)}
            >
              <Text style={styles.modalCancelText}>Cancel</Text>
            </TouchableOpacity>
            <Text style={styles.modalTitle}>Select Category</Text>
            <View style={styles.modalPlaceholder} />
          </View>

          <ScrollView style={styles.modalContent}>
            <Text style={styles.modalSubtitle}>
              Choose a category for {selectedCount} transaction
              {selectedCount > 1 ? 's' : ''}
            </Text>

            <View style={styles.categoriesGrid}>
              {categories.map(category => (
                <TouchableOpacity
                  key={category.id}
                  style={styles.categoryItem}
                  onPress={() => handleCategorySelect(category)}
                >
                  <View
                    style={[
                      styles.categoryIcon,
                      { backgroundColor: category.color },
                    ]}
                  />
                  <Text style={styles.categoryName}>{category.name}</Text>
                  <Text style={styles.categoryArrow}>›</Text>
                </TouchableOpacity>
              ))}
            </View>
          </ScrollView>
        </SafeAreaView>
      </Modal>
    </>
  );
};

const styles = StyleSheet.create({
  container: {
    position: 'absolute',
    bottom: 0,
    left: 0,
    right: 0,
    backgroundColor: '#ffffff',
    borderTopWidth: StyleSheet.hairlineWidth,
    borderTopColor: '#e1e5e9',
    shadowColor: '#000',
    shadowOffset: {
      width: 0,
      height: -2,
    },
    shadowOpacity: 0.1,
    shadowRadius: 4,
    elevation: 5,
  },
  content: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingHorizontal: 16,
    paddingVertical: 12,
    paddingBottom: 24, // Account for safe area
  },
  selectedText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#1a1a1a',
    marginRight: 16,
  },
  actionsContainer: {
    flex: 1,
    flexDirection: 'row',
    gap: 8,
  },
  actionButton: {
    flex: 1,
    paddingVertical: 8,
    paddingHorizontal: 12,
    backgroundColor: '#007AFF',
    borderRadius: 6,
    alignItems: 'center',
  },
  actionButtonText: {
    fontSize: 14,
    fontWeight: '600',
    color: '#ffffff',
  },
  dangerButton: {
    backgroundColor: '#dc3545',
  },
  dangerButtonText: {
    color: '#ffffff',
  },
  cancelButton: {
    marginLeft: 16,
    paddingVertical: 8,
    paddingHorizontal: 12,
  },
  cancelButtonText: {
    fontSize: 14,
    fontWeight: '500',
    color: '#6c757d',
  },
  modalContainer: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  modalHeader: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 16,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  modalCancelButton: {
    paddingVertical: 4,
  },
  modalCancelText: {
    fontSize: 16,
    color: '#007AFF',
  },
  modalTitle: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  modalPlaceholder: {
    width: 50, // Balance the layout
  },
  modalContent: {
    flex: 1,
    paddingHorizontal: 16,
  },
  modalSubtitle: {
    fontSize: 16,
    color: '#6c757d',
    textAlign: 'center',
    marginVertical: 20,
  },
  categoriesGrid: {
    gap: 1,
  },
  categoryItem: {
    flexDirection: 'row',
    alignItems: 'center',
    paddingVertical: 16,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
  },
  categoryIcon: {
    width: 32,
    height: 32,
    borderRadius: 16,
    marginRight: 16,
  },
  categoryName: {
    flex: 1,
    fontSize: 16,
    color: '#1a1a1a',
  },
  categoryArrow: {
    fontSize: 18,
    color: '#6c757d',
    fontWeight: '300',
  },
});
