/**
 * Supabase database type definitions for ClariFi.
 */

export interface Database {
  public: {
    Tables: {
      transactions: {
        Row: {
          id: string;
          date: string;
          amount: number;
          category_id: string;
          category_name: string | null;
          merchant_name: string | null;
          description: string;
          is_recurring: boolean | null;
          user_verified: boolean | null;
          statement_import_id: string | null;
          tags: string[] | null;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          date: string;
          amount: number;
          category_id: string;
          category_name?: string | null;
          merchant_name?: string | null;
          description: string;
          is_recurring?: boolean | null;
          user_verified?: boolean | null;
          statement_import_id?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          date?: string;
          amount?: number;
          category_id?: string;
          category_name?: string | null;
          merchant_name?: string | null;
          description?: string;
          is_recurring?: boolean | null;
          user_verified?: boolean | null;
          statement_import_id?: string | null;
          tags?: string[] | null;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
      categories: {
        Row: {
          id: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon: string | null;
          is_default: boolean;
          created_at: string;
          updated_at: string;
          user_id: string;
        };
        Insert: {
          id?: string;
          name: string;
          type: 'income' | 'expense';
          color: string;
          icon?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
        Update: {
          id?: string;
          name?: string;
          type?: 'income' | 'expense';
          color?: string;
          icon?: string | null;
          is_default?: boolean;
          created_at?: string;
          updated_at?: string;
          user_id?: string;
        };
      };
    };
    Views: {
      [_ in never]: never;
    };
    Functions: {
      [_ in never]: never;
    };
    Enums: {
      [_ in never]: never;
    };
  };
}
