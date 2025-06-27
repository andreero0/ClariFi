/**
 * Custom hook for managing transaction data with Supabase integration.
 * Provides CRUD operations, filtering, and real-time updates.
 */

import { useState, useEffect, useCallback, useMemo } from 'react';
import { Transaction } from '../services/storage/dataModels';
import { supabase } from '../services/supabase/client';
import { Database } from '../types/supabase';

type TransactionRow = Database['public']['Tables']['transactions']['Row'];
type TransactionInsert = Database['public']['Tables']['transactions']['Insert'];
type TransactionUpdate = Database['public']['Tables']['transactions']['Update'];

interface UseTransactionsReturn {
  transactions: Transaction[];
  loading: boolean;
  error: string | null;
  totalIncome: number;
  totalExpenses: number;
  refreshTransactions: () => Promise<void>;
  updateTransaction: (
    id: string,
    updates: Partial<Transaction>
  ) => Promise<void>;
  bulkUpdateTransactions: (
    ids: string[],
    updates: Partial<Transaction>
  ) => Promise<void>;
  deleteTransaction: (id: string) => Promise<void>;
  addTransaction: (transaction: Omit<Transaction, 'id'>) => Promise<void>;
}

export const useTransactions = (): UseTransactionsReturn => {
  const [transactions, setTransactions] = useState<Transaction[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Convert Supabase row to Transaction format
  const mapRowToTransaction = useCallback(
    (row: TransactionRow): Transaction => {
      return {
        id: row.id,
        date: row.date,
        amount: row.amount,
        category_id: row.category_id,
        category_name: row.category_name || undefined,
        merchant_name: row.merchant_name || undefined,
        description: row.description,
        is_recurring: row.is_recurring || false,
        user_verified: row.user_verified || false,
        statement_import_id: row.statement_import_id || undefined,
        tags: row.tags || undefined,
      };
    },
    []
  );

  // Convert Transaction to Supabase format
  const mapTransactionToUpdate = useCallback(
    (transaction: Partial<Transaction>): TransactionUpdate => {
      return {
        date: transaction.date,
        amount: transaction.amount,
        category_id: transaction.category_id,
        category_name: transaction.category_name,
        merchant_name: transaction.merchant_name,
        description: transaction.description,
        is_recurring: transaction.is_recurring,
        user_verified: transaction.user_verified,
        statement_import_id: transaction.statement_import_id,
        tags: transaction.tags,
      };
    },
    []
  );

  // Fetch transactions from Supabase
  const fetchTransactions = useCallback(async () => {
    try {
      setLoading(true);
      setError(null);

      // Check authentication status first
      const { data: { session } } = await supabase.auth.getSession();
      
      if (!session) {
        console.log('No active session, using mock data for development');
        // User not authenticated, provide mock data instead of failing
        if (__DEV__) {
          const mockTransactions: Transaction[] = [
            {
              id: 'mock-1',
              date: new Date().toISOString(),
              amount: -45.67,
              category_id: 'cat-1',
              category_name: 'Groceries',
              merchant_name: 'Metro',
              description: 'Metro Grocery Store',
              is_recurring: false,
              user_verified: false,
            },
            {
              id: 'mock-2',
              date: new Date(Date.now() - 86400000).toISOString(),
              amount: -12.5,
              category_id: 'cat-2',
              category_name: 'Coffee',
              merchant_name: 'Starbucks',
              description: 'Starbucks Coffee',
              is_recurring: false,
              user_verified: false,
            },
            {
              id: 'mock-3',
              date: new Date(Date.now() - 172800000).toISOString(),
              amount: 2500.0,
              category_id: 'cat-3',
              category_name: 'Salary',
              merchant_name: 'Employer Inc',
              description: 'Salary Deposit',
              is_recurring: true,
              user_verified: true,
            },
          ];
          setTransactions(mockTransactions);
          setError(null);
          return;
        } else {
          // In production, set empty state or prompt for login
          setTransactions([]);
          setError('Please sign in to view your transactions');
          return;
        }
      }

      const { data, error: supabaseError } = await supabase
        .from('transactions')
        .select('*')
        .order('date', { ascending: false })
        .limit(1000); // Reasonable limit for mobile performance

      if (supabaseError) {
        throw supabaseError;
      }

      const mappedTransactions = data?.map(mapRowToTransaction) || [];
      setTransactions(mappedTransactions);
    } catch (err) {
      console.error('Error fetching transactions:', err);
      setError(
        err instanceof Error ? err.message : 'Failed to fetch transactions'
      );

      // For development - provide mock data when database access fails
      if (__DEV__) {
        const mockTransactions: Transaction[] = [
          {
            id: 'mock-1',
            date: new Date().toISOString(),
            amount: -45.67,
            category_id: 'cat-1',
            category_name: 'Groceries',
            merchant_name: 'Metro',
            description: 'Metro Grocery Store',
            is_recurring: false,
            user_verified: false,
          },
          {
            id: 'mock-2',
            date: new Date(Date.now() - 86400000).toISOString(),
            amount: -12.5,
            category_id: 'cat-2',
            category_name: 'Coffee',
            merchant_name: 'Starbucks',
            description: 'Starbucks Coffee',
            is_recurring: false,
            user_verified: false,
          },
          {
            id: 'mock-3',
            date: new Date(Date.now() - 172800000).toISOString(),
            amount: 2500.0,
            category_id: 'cat-3',
            category_name: 'Salary',
            merchant_name: 'Employer Inc',
            description: 'Salary Deposit',
            is_recurring: true,
            user_verified: true,
          },
        ];
        setTransactions(mockTransactions);
        setError(null); // Clear error when using mock data
      }
    } finally {
      setLoading(false);
    }
  }, [mapRowToTransaction]);

  // Refresh transactions
  const refreshTransactions = useCallback(async () => {
    await fetchTransactions();
  }, [fetchTransactions]);

  // Update a single transaction
  const updateTransaction = useCallback(
    async (id: string, updates: Partial<Transaction>) => {
      try {
        const updateData = mapTransactionToUpdate(updates);

        const { error: supabaseError } = await supabase
          .from('transactions')
          .update(updateData)
          .eq('id', id);

        if (supabaseError) {
          throw supabaseError;
        }

        // Optimistically update local state
        setTransactions(prev =>
          prev.map(transaction =>
            transaction.id === id ? { ...transaction, ...updates } : transaction
          )
        );
      } catch (err) {
        console.error('Error updating transaction:', err);
        throw err;
      }
    },
    [mapTransactionToUpdate]
  );

  // Bulk update transactions
  const bulkUpdateTransactions = useCallback(
    async (ids: string[], updates: Partial<Transaction>) => {
      try {
        const updateData = mapTransactionToUpdate(updates);

        const { error: supabaseError } = await supabase
          .from('transactions')
          .update(updateData)
          .in('id', ids);

        if (supabaseError) {
          throw supabaseError;
        }

        // Optimistically update local state
        setTransactions(prev =>
          prev.map(transaction =>
            ids.includes(transaction.id)
              ? { ...transaction, ...updates }
              : transaction
          )
        );
      } catch (err) {
        console.error('Error bulk updating transactions:', err);
        throw err;
      }
    },
    [mapTransactionToUpdate]
  );

  // Delete a transaction
  const deleteTransaction = useCallback(async (id: string) => {
    try {
      const { error: supabaseError } = await supabase
        .from('transactions')
        .delete()
        .eq('id', id);

      if (supabaseError) {
        throw supabaseError;
      }

      // Remove from local state
      setTransactions(prev =>
        prev.filter(transaction => transaction.id !== id)
      );
    } catch (err) {
      console.error('Error deleting transaction:', err);
      throw err;
    }
  }, []);

  // Add a new transaction
  const addTransaction = useCallback(
    async (transaction: Omit<Transaction, 'id'>) => {
      try {
        const insertData: TransactionInsert = {
          date: transaction.date,
          amount: transaction.amount,
          category_id: transaction.category_id,
          category_name: transaction.category_name,
          merchant_name: transaction.merchant_name,
          description: transaction.description,
          is_recurring: transaction.is_recurring || false,
          user_verified: transaction.user_verified || false,
          statement_import_id: transaction.statement_import_id,
          tags: transaction.tags,
        };

        const { data, error: supabaseError } = await supabase
          .from('transactions')
          .insert(insertData)
          .select()
          .single();

        if (supabaseError) {
          throw supabaseError;
        }

        if (data) {
          const newTransaction = mapRowToTransaction(data);
          setTransactions(prev => [newTransaction, ...prev]);
        }
      } catch (err) {
        console.error('Error adding transaction:', err);
        throw err;
      }
    },
    [mapRowToTransaction]
  );

  // Calculate totals
  const { totalIncome, totalExpenses } = useMemo(() => {
    return transactions.reduce(
      (totals, transaction) => {
        if (transaction.amount > 0) {
          totals.totalIncome += transaction.amount;
        } else {
          totals.totalExpenses += Math.abs(transaction.amount);
        }
        return totals;
      },
      { totalIncome: 0, totalExpenses: 0 }
    );
  }, [transactions]);

  // Set up real-time subscription
  useEffect(() => {
    // Initial fetch
    fetchTransactions();

    // Set up real-time subscription
    const subscription = supabase
      .channel('transactions_changes')
      .on(
        'postgres_changes',
        {
          event: '*',
          schema: 'public',
          table: 'transactions',
        },
        payload => {
          console.log('Transaction change received:', payload);

          if (payload.eventType === 'INSERT' && payload.new) {
            const newTransaction = mapRowToTransaction(
              payload.new as TransactionRow
            );
            setTransactions(prev => [newTransaction, ...prev]);
          } else if (payload.eventType === 'UPDATE' && payload.new) {
            const updatedTransaction = mapRowToTransaction(
              payload.new as TransactionRow
            );
            setTransactions(prev =>
              prev.map(transaction =>
                transaction.id === updatedTransaction.id
                  ? updatedTransaction
                  : transaction
              )
            );
          } else if (payload.eventType === 'DELETE' && payload.old) {
            setTransactions(prev =>
              prev.filter(
                transaction =>
                  transaction.id !== (payload.old as TransactionRow).id
              )
            );
          }
        }
      )
      .subscribe();

    // Cleanup subscription on unmount
    return () => {
      subscription.unsubscribe();
    };
  }, [fetchTransactions, mapRowToTransaction]);

  return {
    transactions,
    loading,
    error,
    totalIncome,
    totalExpenses,
    refreshTransactions,
    updateTransaction,
    bulkUpdateTransactions,
    deleteTransaction,
    addTransaction,
  };
};
