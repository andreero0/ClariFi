import { useState, useEffect, useCallback } from 'react';
import { supabase } from '../services/supabase/client';

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

interface CategoryCreateData {
  name: string;
  type: 'income' | 'expense';
  color: string;
  icon: string;
}

interface CategoryUpdateData extends Partial<CategoryCreateData> {}

export const useCategories = () => {
  const [categories, setCategories] = useState<Category[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Computed statistics
  const totalCategories = categories.length;
  const customCategories = categories.filter(c => !c.is_default).length;
  const incomeCategories = categories.filter(c => c.type === 'income').length;
  const expenseCategories = categories.filter(c => c.type === 'expense').length;

  const fetchCategories = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Fetch categories with usage statistics
      const { data, error: fetchError } = await supabase
        .from('categories')
        .select(
          `
          *,
          transactions!inner (
            id,
            amount
          )
        `
        )
        .order('name');

      if (fetchError) throw fetchError;

      // Process categories with usage stats
      const processedCategories: Category[] = (data || []).map(category => {
        const transactions = category.transactions || [];
        const usage_count = transactions.length;
        const total_amount = transactions.reduce(
          (sum: number, t: any) => sum + Math.abs(t.amount),
          0
        );

        return {
          id: category.id,
          name: category.name,
          color: category.color,
          type: category.type,
          icon: category.icon,
          is_default: category.is_default,
          usage_count,
          total_amount,
          created_at: category.created_at,
          updated_at: category.updated_at,
        };
      });

      setCategories(processedCategories);
    } catch (err) {
      console.error('Error fetching categories:', err);
      setError('Failed to load categories');
    } finally {
      setLoading(false);
    }
  }, []);

  const getCategoryById = useCallback(
    async (id: string): Promise<Category | null> => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .select('*')
          .eq('id', id)
          .single();

        if (error) throw error;
        return data;
      } catch (err) {
        console.error('Error fetching category:', err);
        return null;
      }
    },
    []
  );

  const createCategory = useCallback(
    async (categoryData: CategoryCreateData): Promise<Category> => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .insert({
            ...categoryData,
            is_default: false,
          })
          .select()
          .single();

        if (error) throw error;

        const newCategory: Category = {
          ...data,
          usage_count: 0,
          total_amount: 0,
        };

        setCategories(prev => [...prev, newCategory]);
        return newCategory;
      } catch (err) {
        console.error('Error creating category:', err);
        throw new Error('Failed to create category');
      }
    },
    []
  );

  const updateCategory = useCallback(
    async (id: string, updateData: CategoryUpdateData): Promise<Category> => {
      try {
        const { data, error } = await supabase
          .from('categories')
          .update(updateData)
          .eq('id', id)
          .select()
          .single();

        if (error) throw error;

        setCategories(prev =>
          prev.map(category =>
            category.id === id ? { ...category, ...data } : category
          )
        );

        return data;
      } catch (err) {
        console.error('Error updating category:', err);
        throw new Error('Failed to update category');
      }
    },
    []
  );

  const deleteCategory = useCallback(
    async (id: string): Promise<void> => {
      try {
        // Check if category is default
        const category = categories.find(c => c.id === id);
        if (category?.is_default) {
          throw new Error('Cannot delete default categories');
        }

        // Check if category is in use
        const { data: transactionsData, error: checkError } = await supabase
          .from('transactions')
          .select('id')
          .eq('category_id', id)
          .limit(1);

        if (checkError) throw checkError;

        if (transactionsData && transactionsData.length > 0) {
          throw new Error(
            'Cannot delete category that has transactions. Please reassign transactions first.'
          );
        }

        // Delete the category
        const { error } = await supabase
          .from('categories')
          .delete()
          .eq('id', id);

        if (error) throw error;

        setCategories(prev => prev.filter(category => category.id !== id));
      } catch (err) {
        console.error('Error deleting category:', err);
        throw err;
      }
    },
    [categories]
  );

  const refreshCategories = useCallback(async () => {
    await fetchCategories();
  }, [fetchCategories]);

  // Load categories on mount
  useEffect(() => {
    fetchCategories();
  }, [fetchCategories]);

  return {
    categories,
    loading,
    error,
    totalCategories,
    customCategories,
    incomeCategories,
    expenseCategories,
    getCategoryById,
    createCategory,
    updateCategory,
    deleteCategory,
    refreshCategories,
  };
};
