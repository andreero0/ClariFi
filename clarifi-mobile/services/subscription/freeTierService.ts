import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase';

export interface UserLimits {
  maxBanks: number;
  maxDocuments: number;
  maxAIQueries: number;
  hasPremiumFeatures: boolean;
}

export interface UserUsage {
  banksConnected: number;
  documentsUploaded: number;
  aiQueriesUsed: number;
  lastResetDate: string;
}

export interface SubscriptionTier {
  id: string;
  name: 'free' | 'premium';
  limits: UserLimits;
  price?: number;
}

const SUBSCRIPTION_TIERS: Record<string, SubscriptionTier> = {
  free: {
    id: 'free',
    name: 'free',
    limits: {
      maxBanks: 1,
      maxDocuments: 1,
      maxAIQueries: 10, // per month
      hasPremiumFeatures: false,
    },
  },
  premium: {
    id: 'premium',
    name: 'premium',
    limits: {
      maxBanks: 10,
      maxDocuments: 50,
      maxAIQueries: 500, // per month
      hasPremiumFeatures: true,
    },
    price: 9.99,
  },
};

const USAGE_STORAGE_KEY = '@clarifi_user_usage';

class FreeTierService {
  /**
   * Get user's current subscription tier
   */
  async getUserTier(userId: string): Promise<SubscriptionTier> {
    try {
      const { data, error } = await supabase
        .from('user_subscriptions')
        .select('tier, expires_at')
        .eq('user_id', userId)
        .eq('active', true)
        .single();

      if (error || !data) {
        return SUBSCRIPTION_TIERS.free; // Default to free tier
      }

      // Check if subscription is still valid
      const expiresAt = new Date(data.expires_at);
      const now = new Date();

      if (expiresAt > now) {
        return SUBSCRIPTION_TIERS[data.tier] || SUBSCRIPTION_TIERS.free;
      } else {
        // Subscription expired, mark as inactive
        await this.deactivateSubscription(userId);
        return SUBSCRIPTION_TIERS.free;
      }
    } catch (error) {
      console.error('Error fetching user tier:', error);
      return SUBSCRIPTION_TIERS.free;
    }
  }

  /**
   * Get user's current usage
   */
  async getUserUsage(userId: string): Promise<UserUsage> {
    try {
      // Try to get from local storage first for quick access
      const cachedUsage = await AsyncStorage.getItem(
        `${USAGE_STORAGE_KEY}_${userId}`
      );

      if (cachedUsage) {
        const usage = JSON.parse(cachedUsage);

        // Check if we need to reset monthly counters
        const lastReset = new Date(usage.lastResetDate);
        const now = new Date();
        const isNewMonth =
          lastReset.getMonth() !== now.getMonth() ||
          lastReset.getFullYear() !== now.getFullYear();

        if (isNewMonth) {
          usage.aiQueriesUsed = 0;
          usage.lastResetDate = now.toISOString();
          await this.saveUsageToStorage(userId, usage);
        }

        return usage;
      }

      // If not in cache, fetch from database
      return await this.fetchUsageFromDatabase(userId);
    } catch (error) {
      console.error('Error fetching user usage:', error);
      return this.getDefaultUsage();
    }
  }

  /**
   * Check if user can perform an action (connect bank, upload document, ask AI)
   */
  async canPerformAction(
    userId: string,
    action: 'connect_bank' | 'upload_document' | 'ai_query'
  ): Promise<{ allowed: boolean; reason?: string; upgradeRequired?: boolean }> {
    const tier = await this.getUserTier(userId);
    const usage = await this.getUserUsage(userId);

    switch (action) {
      case 'connect_bank':
        if (usage.banksConnected >= tier.limits.maxBanks) {
          return {
            allowed: false,
            reason: `Free tier limited to ${tier.limits.maxBanks} bank connection${tier.limits.maxBanks > 1 ? 's' : ''}`,
            upgradeRequired: true,
          };
        }
        break;

      case 'upload_document':
        if (usage.documentsUploaded >= tier.limits.maxDocuments) {
          return {
            allowed: false,
            reason: `Free tier limited to ${tier.limits.maxDocuments} document${tier.limits.maxDocuments > 1 ? 's' : ''}`,
            upgradeRequired: true,
          };
        }
        break;

      case 'ai_query':
        if (usage.aiQueriesUsed >= tier.limits.maxAIQueries) {
          return {
            allowed: false,
            reason: `Monthly AI query limit reached (${tier.limits.maxAIQueries})`,
            upgradeRequired: true,
          };
        }
        break;
    }

    return { allowed: true };
  }

  /**
   * Record usage when user performs an action
   */
  async recordUsage(
    userId: string,
    action: 'connect_bank' | 'upload_document' | 'ai_query'
  ): Promise<void> {
    try {
      const usage = await this.getUserUsage(userId);

      switch (action) {
        case 'connect_bank':
          usage.banksConnected += 1;
          break;
        case 'upload_document':
          usage.documentsUploaded += 1;
          break;
        case 'ai_query':
          usage.aiQueriesUsed += 1;
          break;
      }

      await this.saveUsageToStorage(userId, usage);
      await this.syncUsageToDatabase(userId, usage);
    } catch (error) {
      console.error('Error recording usage:', error);
    }
  }

  /**
   * Get available subscription tiers
   */
  getAvailableTiers(): SubscriptionTier[] {
    return Object.values(SUBSCRIPTION_TIERS);
  }

  /**
   * Check if user has premium features
   */
  async hasPremiumAccess(userId: string): Promise<boolean> {
    const tier = await this.getUserTier(userId);
    return tier.limits.hasPremiumFeatures;
  }

  private async fetchUsageFromDatabase(userId: string): Promise<UserUsage> {
    try {
      const { data, error } = await supabase
        .from('user_usage')
        .select('*')
        .eq('user_id', userId)
        .single();

      if (error || !data) {
        const defaultUsage = this.getDefaultUsage();
        await this.saveUsageToStorage(userId, defaultUsage);
        return defaultUsage;
      }

      const usage: UserUsage = {
        banksConnected: data.banks_connected || 0,
        documentsUploaded: data.documents_uploaded || 0,
        aiQueriesUsed: data.ai_queries_used || 0,
        lastResetDate: data.last_reset_date || new Date().toISOString(),
      };

      await this.saveUsageToStorage(userId, usage);
      return usage;
    } catch (error) {
      console.error('Error fetching usage from database:', error);
      return this.getDefaultUsage();
    }
  }

  private async saveUsageToStorage(
    userId: string,
    usage: UserUsage
  ): Promise<void> {
    try {
      await AsyncStorage.setItem(
        `${USAGE_STORAGE_KEY}_${userId}`,
        JSON.stringify(usage)
      );
    } catch (error) {
      console.error('Error saving usage to storage:', error);
    }
  }

  private async syncUsageToDatabase(
    userId: string,
    usage: UserUsage
  ): Promise<void> {
    try {
      await supabase.from('user_usage').upsert({
        user_id: userId,
        banks_connected: usage.banksConnected,
        documents_uploaded: usage.documentsUploaded,
        ai_queries_used: usage.aiQueriesUsed,
        last_reset_date: usage.lastResetDate,
        updated_at: new Date().toISOString(),
      });
    } catch (error) {
      console.error('Error syncing usage to database:', error);
    }
  }

  private async deactivateSubscription(userId: string): Promise<void> {
    try {
      await supabase
        .from('user_subscriptions')
        .update({ active: false })
        .eq('user_id', userId);
    } catch (error) {
      console.error('Error deactivating subscription:', error);
    }
  }

  private getDefaultUsage(): UserUsage {
    return {
      banksConnected: 0,
      documentsUploaded: 0,
      aiQueriesUsed: 0,
      lastResetDate: new Date().toISOString(),
    };
  }
}

export const freeTierService = new FreeTierService();
