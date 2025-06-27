/**
 * Typed Supabase client export for the application.
 */

import { supabase as supabaseClient } from './supabaseClient';
import type { Database } from '../../types/supabase';

export const supabase = supabaseClient as any; // Type assertion for now

export type SupabaseClient = typeof supabase;
export type { Database };
