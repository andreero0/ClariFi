import React, { useState, useEffect } from 'react';
import {
  View,
  Text,
  TextInput,
  TouchableOpacity,
  StyleSheet,
  ScrollView,
  Alert,
  KeyboardAvoidingView,
  Platform,
  ActivityIndicator,
} from 'react-native';
import { SafeAreaView } from 'react-native-safe-area-context';
import { useRouter, useLocalSearchParams } from 'expo-router';
import { ColorPicker } from '../../components/categories/ColorPicker';
import { IconPicker } from '../../components/categories/IconPicker';
import { useCategories } from '../../hooks/useCategories';

interface CategoryFormData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

const DEFAULT_COLORS = [
  '#007AFF',
  '#FF3B30',
  '#FF9500',
  '#FFCC02',
  '#34C759',
  '#5AC8FA',
  '#AF52DE',
  '#FF2D92',
  '#8E8E93',
  '#000000',
  '#5856D6',
  '#32D74B',
];

const DEFAULT_ICONS = {
  income: ['💰', '💵', '💳', '💸', '🏦', '📈', '💼', '🎯'],
  expense: ['🛒', '🍔', '⛽', '🏠', '🚗', '💊', '🎬', '👕', '📱', '✈️'],
};

export default function CategoryDetailModal() {
  const router = useRouter();
  const { id } = useLocalSearchParams<{ id?: string }>();
  const isEditing = !!id;

  const [loading, setLoading] = useState(false);
  const [saving, setSaving] = useState(false);

  const [formData, setFormData] = useState<CategoryFormData>({
    name: '',
    type: 'expense',
    color: DEFAULT_COLORS[0],
    icon: DEFAULT_ICONS.expense[0],
  });

  const [errors, setErrors] = useState<Partial<CategoryFormData>>({});

  const { getCategoryById, createCategory, updateCategory } = useCategories();

  useEffect(() => {
    if (isEditing && id) {
      loadCategory();
    }
  }, [id, isEditing]);

  const loadCategory = async () => {
    try {
      setLoading(true);
      const category = await getCategoryById(id!);
      if (category) {
        setFormData({
          name: category.name,
          type: category.type,
          color: category.color,
          icon: category.icon || getDefaultIcon(category.type),
        });
      } else {
        Alert.alert('Error', 'Category not found');
        router.back();
      }
    } catch (error) {
      console.error('Failed to load category:', error);
      Alert.alert('Error', 'Failed to load category details');
      router.back();
    } finally {
      setLoading(false);
    }
  };

  const getDefaultIcon = (type: 'income' | 'expense') => {
    return type === 'income'
      ? DEFAULT_ICONS.income[0]
      : DEFAULT_ICONS.expense[0];
  };

  const validateForm = (): boolean => {
    const newErrors: Partial<CategoryFormData> = {};

    if (!formData.name.trim()) {
      newErrors.name = 'Category name is required';
    } else if (formData.name.trim().length < 2) {
      newErrors.name = 'Category name must be at least 2 characters';
    } else if (formData.name.trim().length > 50) {
      newErrors.name = 'Category name must be less than 50 characters';
    }

    if (!formData.color) {
      newErrors.color = 'Please select a color';
    }

    if (!formData.icon) {
      newErrors.icon = 'Please select an icon';
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const handleSave = async () => {
    if (!validateForm()) {
      return;
    }

    try {
      setSaving(true);

      const categoryData = {
        name: formData.name.trim(),
        type: formData.type,
        color: formData.color,
        icon: formData.icon,
      };

      if (isEditing) {
        await updateCategory(id!, categoryData);
        Alert.alert('Success', 'Category updated successfully');
      } else {
        await createCategory(categoryData);
        Alert.alert('Success', 'Category created successfully');
      }

      router.back();
    } catch (error) {
      console.error('Failed to save category:', error);
      Alert.alert('Error', 'Failed to save category. Please try again.');
    } finally {
      setSaving(false);
    }
  };

  const handleCancel = () => {
    router.back();
  };

  const updateFormData = (field: keyof CategoryFormData, value: string) => {
    setFormData(prev => ({ ...prev, [field]: value }));

    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: undefined }));
    }

    // Update icon to match type
    if (field === 'type') {
      setFormData(prev => ({
        ...prev,
        [field]: value,
        icon: getDefaultIcon(value as 'income' | 'expense'),
      }));
    }
  };

  if (loading) {
    return (
      <SafeAreaView style={styles.container}>
        <View style={styles.loadingContainer}>
          <ActivityIndicator size="large" color="#007AFF" />
          <Text style={styles.loadingText}>Loading category...</Text>
        </View>
      </SafeAreaView>
    );
  }

  return (
    <SafeAreaView style={styles.container}>
      <KeyboardAvoidingView
        behavior={Platform.OS === 'ios' ? 'padding' : 'height'}
        style={styles.keyboardContainer}
      >
        {/* Header */}
        <View style={styles.header}>
          <TouchableOpacity onPress={handleCancel}>
            <Text style={styles.cancelButton}>Cancel</Text>
          </TouchableOpacity>
          <Text style={styles.title}>
            {isEditing ? 'Edit Category' : 'New Category'}
          </Text>
          <TouchableOpacity
            onPress={handleSave}
            disabled={saving}
            style={[styles.saveButton, saving && styles.saveButtonDisabled]}
          >
            {saving ? (
              <ActivityIndicator size="small" color="#007AFF" />
            ) : (
              <Text style={styles.saveButtonText}>Save</Text>
            )}
          </TouchableOpacity>
        </View>

        <ScrollView style={styles.content} showsVerticalScrollIndicator={false}>
          {/* Category Name */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Category Name</Text>
            <TextInput
              style={[styles.textInput, errors.name && styles.textInputError]}
              value={formData.name}
              onChangeText={text => updateFormData('name', text)}
              placeholder="Enter category name"
              autoCapitalize="words"
              maxLength={50}
            />
            {errors.name && <Text style={styles.errorText}>{errors.name}</Text>}
          </View>

          {/* Category Type */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Type</Text>
            <View style={styles.typeSelector}>
              {(['expense', 'income'] as const).map(type => (
                <TouchableOpacity
                  key={type}
                  style={[
                    styles.typeButton,
                    formData.type === type && styles.typeButtonActive,
                  ]}
                  onPress={() => updateFormData('type', type)}
                >
                  <Text
                    style={[
                      styles.typeButtonText,
                      formData.type === type && styles.typeButtonTextActive,
                    ]}
                  >
                    {type === 'expense' ? '📉 Expense' : '📈 Income'}
                  </Text>
                </TouchableOpacity>
              ))}
            </View>
          </View>

          {/* Color Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Color</Text>
            <ColorPicker
              selectedColor={formData.color}
              colors={DEFAULT_COLORS}
              onColorSelect={color => updateFormData('color', color)}
            />
            {errors.color && (
              <Text style={styles.errorText}>{errors.color}</Text>
            )}
          </View>

          {/* Icon Selection */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Icon</Text>
            <IconPicker
              selectedIcon={formData.icon}
              icons={DEFAULT_ICONS[formData.type]}
              onIconSelect={icon => updateFormData('icon', icon)}
            />
            {errors.icon && <Text style={styles.errorText}>{errors.icon}</Text>}
          </View>

          {/* Preview */}
          <View style={styles.section}>
            <Text style={styles.sectionTitle}>Preview</Text>
            <View style={styles.previewContainer}>
              <View
                style={[
                  styles.previewColorIndicator,
                  { backgroundColor: formData.color },
                ]}
              >
                <Text style={styles.previewIcon}>{formData.icon}</Text>
              </View>
              <View style={styles.previewTextContainer}>
                <Text style={styles.previewName}>
                  {formData.name || 'Category Name'}
                </Text>
                <Text style={styles.previewType}>
                  {formData.type === 'income' ? 'Income' : 'Expense'}
                </Text>
              </View>
            </View>
          </View>
        </ScrollView>
      </KeyboardAvoidingView>
    </SafeAreaView>
  );
}

const styles = StyleSheet.create({
  container: {
    flex: 1,
    backgroundColor: '#f8f9fa',
  },
  keyboardContainer: {
    flex: 1,
  },
  header: {
    flexDirection: 'row',
    alignItems: 'center',
    justifyContent: 'space-between',
    paddingHorizontal: 16,
    paddingVertical: 12,
    backgroundColor: '#ffffff',
    borderBottomWidth: StyleSheet.hairlineWidth,
    borderBottomColor: '#e1e5e9',
  },
  cancelButton: {
    fontSize: 16,
    color: '#007AFF',
  },
  title: {
    fontSize: 18,
    fontWeight: '600',
    color: '#1a1a1a',
  },
  saveButton: {
    minWidth: 50,
    alignItems: 'center',
  },
  saveButtonDisabled: {
    opacity: 0.5,
  },
  saveButtonText: {
    fontSize: 16,
    fontWeight: '600',
    color: '#007AFF',
  },
  content: {
    flex: 1,
    paddingHorizontal: 16,
  },
  section: {
    marginBottom: 24,
    paddingTop: 16,
  },
  sectionTitle: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 12,
  },
  textInput: {
    height: 50,
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    paddingHorizontal: 16,
    fontSize: 16,
    backgroundColor: '#ffffff',
  },
  textInputError: {
    borderColor: '#dc3545',
  },
  errorText: {
    fontSize: 14,
    color: '#dc3545',
    marginTop: 6,
  },
  typeSelector: {
    flexDirection: 'row',
    gap: 12,
  },
  typeButton: {
    flex: 1,
    paddingVertical: 12,
    paddingHorizontal: 16,
    backgroundColor: '#ffffff',
    borderWidth: 1,
    borderColor: '#dee2e6',
    borderRadius: 12,
    alignItems: 'center',
  },
  typeButtonActive: {
    backgroundColor: '#007AFF',
    borderColor: '#007AFF',
  },
  typeButtonText: {
    fontSize: 16,
    fontWeight: '500',
    color: '#6c757d',
  },
  typeButtonTextActive: {
    color: '#ffffff',
  },
  previewContainer: {
    flexDirection: 'row',
    alignItems: 'center',
    padding: 16,
    backgroundColor: '#ffffff',
    borderRadius: 12,
  },
  previewColorIndicator: {
    width: 48,
    height: 48,
    borderRadius: 24,
    alignItems: 'center',
    justifyContent: 'center',
    marginRight: 12,
  },
  previewIcon: {
    fontSize: 20,
  },
  previewTextContainer: {
    flex: 1,
  },
  previewName: {
    fontSize: 16,
    fontWeight: '600',
    color: '#1a1a1a',
    marginBottom: 2,
  },
  previewType: {
    fontSize: 14,
    color: '#6c757d',
    textTransform: 'capitalize',
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
});
