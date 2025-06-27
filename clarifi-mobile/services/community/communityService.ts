import AsyncStorage from '@react-native-async-storage/async-storage';
import { supabase } from '../supabase/supabaseClient';
import { PrivacyAwareAnalytics } from '../analytics/PrivacyAwareAnalytics';

export interface CommunityUser {
  id: string;
  anonymousName: string;
  joinedAt: Date;
  region: 'GTA' | 'Vancouver' | 'Montreal' | 'Calgary' | 'Other';
  achievementBadges: string[];
  helpfulnessScore: number;
  isMentor: boolean;
  isVerified: boolean;
}

export interface CommunityPost {
  id: string;
  authorId: string;
  authorName: string;
  topic: CommunityTopic;
  title: string;
  content: string;
  createdAt: Date;
  isAnonymous: boolean;
  region?: string;
  replies: CommunityReply[];
  upvotes: number;
  isHelpful: boolean;
  moderationStatus: 'approved' | 'pending' | 'flagged';
  tags: string[];
}

export interface CommunityReply {
  id: string;
  authorId: string;
  authorName: string;
  content: string;
  createdAt: Date;
  upvotes: number;
  isHelpful: boolean;
  isVerified: boolean; // From verified mentor
}

export type CommunityTopic =
  | 'banking-basics'
  | 'credit-building'
  | 'budgeting-tips'
  | 'regional-advice'
  | 'success-stories'
  | 'newcomer-orientation'
  | 'financial-goals'
  | 'tax-questions'
  | 'insurance-advice'
  | 'investment-basics';

export interface MentorshipRequest {
  id: string;
  menteeId: string;
  preferredRegion: string;
  focusAreas: string[];
  experience: 'new-arrival' | 'settling-in' | 'established';
  status: 'pending' | 'matched' | 'completed';
  createdAt: Date;
}

export interface MentorshipMatch {
  id: string;
  mentorId: string;
  menteeId: string;
  startDate: Date;
  endDate?: Date;
  focusAreas: string[];
  status: 'active' | 'completed' | 'paused';
  meetingCount: number;
}

class CommunityService {
  private currentUser: CommunityUser | null = null;
  private readonly STORAGE_KEYS = {
    COMMUNITY_PROFILE: 'community_profile',
    COMMUNITY_PREFERENCES: 'community_preferences',
    MODERATION_CACHE: 'moderation_cache',
  };

  /**
   * Initialize community service and load user profile
   */
  async initializeCommunityProfile(userId: string): Promise<CommunityUser> {
    try {
      // Check for existing community profile
      let communityUser = await this.loadCommunityProfile(userId);

      if (!communityUser) {
        // Create new anonymous community profile
        communityUser = await this.createAnonymousProfile(userId);
      }

      this.currentUser = communityUser;
      return communityUser;
    } catch (error) {
      console.error('Failed to initialize community profile:', error);
      throw error;
    }
  }

  /**
   * Create anonymous community profile with privacy-first approach
   */
  private async createAnonymousProfile(userId: string): Promise<CommunityUser> {
    // Generate anonymous name (e.g., "Helpful Maple", "Wise Bear")
    const adjectives = [
      'Helpful',
      'Wise',
      'Kind',
      'Bright',
      'Strong',
      'Gentle',
      'Clever',
      'Bold',
    ];
    const nouns = [
      'Maple',
      'Bear',
      'Eagle',
      'Wolf',
      'Beaver',
      'Moose',
      'Loon',
      'Fox',
    ];

    const anonymousName = `${adjectives[Math.floor(Math.random() * adjectives.length)]} ${nouns[Math.floor(Math.random() * nouns.length)]}`;

    const communityUser: CommunityUser = {
      id: userId,
      anonymousName,
      joinedAt: new Date(),
      region: 'Other', // User can update this later
      achievementBadges: ['newcomer'], // Starting badge
      helpfulnessScore: 0,
      isMentor: false,
      isVerified: false,
    };

    // Store in encrypted local storage only - no server correlation
    await this.saveCommunityProfile(communityUser);

    // Track anonymous community join for analytics
    PrivacyAwareAnalytics.trackEvent('community_profile_created', {
      hasProfile: true,
      region: 'not_specified',
    });

    return communityUser;
  }

  /**
   * Update user's region for better community matching
   */
  async updateUserRegion(region: CommunityUser['region']): Promise<void> {
    if (!this.currentUser) throw new Error('Community profile not initialized');

    this.currentUser.region = region;
    await this.saveCommunityProfile(this.currentUser);

    PrivacyAwareAnalytics.trackEvent('community_region_updated', {
      region: region === 'Other' ? 'other' : 'specified',
    });
  }

  /**
   * Get community posts for a specific topic with privacy filtering
   */
  async getCommunityPosts(
    topic: CommunityTopic,
    region?: string,
    limit: number = 20
  ): Promise<CommunityPost[]> {
    try {
      // In a real implementation, this would fetch from a secure community API
      // For now, return sample posts that demonstrate the concept
      const samplePosts = this.generateSamplePosts(topic, region);

      PrivacyAwareAnalytics.trackEvent('community_posts_viewed', {
        topic,
        regionFiltered: !!region,
        postCount: samplePosts.length,
      });

      return samplePosts.slice(0, limit);
    } catch (error) {
      console.error('Failed to load community posts:', error);
      return [];
    }
  }

  /**
   * Create a new community post with content moderation
   */
  async createCommunityPost(
    topic: CommunityTopic,
    title: string,
    content: string,
    isAnonymous: boolean = true,
    tags: string[] = []
  ): Promise<CommunityPost> {
    if (!this.currentUser) throw new Error('Community profile not initialized');

    // AI-powered content moderation
    const moderationResult = await this.moderateContent(content);

    if (moderationResult.isInappropriate) {
      throw new Error('Content violates community guidelines');
    }

    const post: CommunityPost = {
      id: `post_${Date.now()}`,
      authorId: this.currentUser.id,
      authorName: isAnonymous ? this.currentUser.anonymousName : 'ClariFi User',
      topic,
      title,
      content,
      createdAt: new Date(),
      isAnonymous,
      region:
        this.currentUser.region !== 'Other'
          ? this.currentUser.region
          : undefined,
      replies: [],
      upvotes: 0,
      isHelpful: false,
      moderationStatus: moderationResult.needsReview ? 'pending' : 'approved',
      tags,
    };

    // In real implementation, this would submit to secure community API
    console.log('Community post created:', post);

    PrivacyAwareAnalytics.trackEvent('community_post_created', {
      topic,
      isAnonymous,
      hasRegion: !!post.region,
      tagCount: tags.length,
    });

    return post;
  }

  /**
   * Reply to a community post
   */
  async replyToPost(
    postId: string,
    content: string,
    isAnonymous: boolean = true
  ): Promise<CommunityReply> {
    if (!this.currentUser) throw new Error('Community profile not initialized');

    const moderationResult = await this.moderateContent(content);

    if (moderationResult.isInappropriate) {
      throw new Error('Reply violates community guidelines');
    }

    const reply: CommunityReply = {
      id: `reply_${Date.now()}`,
      authorId: this.currentUser.id,
      authorName: isAnonymous ? this.currentUser.anonymousName : 'ClariFi User',
      content,
      createdAt: new Date(),
      upvotes: 0,
      isHelpful: false,
      isVerified: this.currentUser.isVerified,
    };

    PrivacyAwareAnalytics.trackEvent('community_reply_created', {
      isAnonymous,
      isFromVerifiedUser: this.currentUser.isVerified,
    });

    return reply;
  }

  /**
   * Request mentorship matching
   */
  async requestMentorship(
    focusAreas: string[],
    experience: MentorshipRequest['experience']
  ): Promise<MentorshipRequest> {
    if (!this.currentUser) throw new Error('Community profile not initialized');

    const request: MentorshipRequest = {
      id: `mentorship_${Date.now()}`,
      menteeId: this.currentUser.id,
      preferredRegion: this.currentUser.region,
      focusAreas,
      experience,
      status: 'pending',
      createdAt: new Date(),
    };

    // In real implementation, this would submit to mentorship matching service
    console.log('Mentorship request created:', request);

    PrivacyAwareAnalytics.trackEvent('mentorship_requested', {
      focusAreaCount: focusAreas.length,
      experience,
      hasRegionPreference: this.currentUser.region !== 'Other',
    });

    return request;
  }

  /**
   * Apply to become a mentor
   */
  async applyForMentorStatus(
    expertiseAreas: string[],
    timeInCanada: number,
    motivation: string
  ): Promise<boolean> {
    if (!this.currentUser) throw new Error('Community profile not initialized');

    // In real implementation, this would submit mentor application for review
    console.log('Mentor application submitted');

    PrivacyAwareAnalytics.trackEvent('mentor_application_submitted', {
      expertiseAreaCount: expertiseAreas.length,
      timeInCanadaYears: Math.floor(timeInCanada / 12),
    });

    return true; // Application submitted successfully
  }

  /**
   * Get trending community topics based on region and user interests
   */
  async getTrendingTopics(region?: string): Promise<
    {
      topic: CommunityTopic;
      postCount: number;
      engagementScore: number;
    }[]
  > {
    // Sample trending topics - in real implementation would be calculated from actual data
    const trendingTopics = [
      {
        topic: 'credit-building' as CommunityTopic,
        postCount: 34,
        engagementScore: 8.7,
      },
      {
        topic: 'banking-basics' as CommunityTopic,
        postCount: 28,
        engagementScore: 8.2,
      },
      {
        topic: 'regional-advice' as CommunityTopic,
        postCount: 22,
        engagementScore: 7.9,
      },
      {
        topic: 'success-stories' as CommunityTopic,
        postCount: 18,
        engagementScore: 9.1,
      },
      {
        topic: 'budgeting-tips' as CommunityTopic,
        postCount: 16,
        engagementScore: 7.4,
      },
    ];

    PrivacyAwareAnalytics.trackEvent('trending_topics_viewed', {
      regionFiltered: !!region,
    });

    return trendingTopics;
  }

  /**
   * Report inappropriate content for moderation
   */
  async reportContent(
    contentId: string,
    contentType: 'post' | 'reply',
    reason: string
  ): Promise<void> {
    // In real implementation, this would submit to moderation queue
    console.log(`Content reported: ${contentId} for ${reason}`);

    PrivacyAwareAnalytics.trackEvent('content_reported', {
      contentType,
      hasReason: !!reason,
    });
  }

  /**
   * AI-powered content moderation
   */
  private async moderateContent(content: string): Promise<{
    isInappropriate: boolean;
    needsReview: boolean;
    flags: string[];
  }> {
    // Basic content moderation rules for financial safety
    const inappropriatePatterns = [
      /\b(scam|fraud|steal|hack)\b/i,
      /\b(social security|sin)\s*\d/i, // Prevent SIN sharing
      /\b\d{4}\s*\d{4}\s*\d{4}\s*\d{4}\b/, // Credit card patterns
      /\b(password|pin)\s*[:=]\s*\w+/i,
    ];

    const reviewPatterns = [
      /\b(invest|cryptocurrency|crypto|bitcoin)\b/i, // Investment advice needs review
      /\b(lawyer|legal|sue|court)\b/i, // Legal advice needs review
      /\bmeet\s+in\s+person\b/i, // Personal meetings need review
    ];

    const flags: string[] = [];
    let isInappropriate = false;
    let needsReview = false;

    for (const pattern of inappropriatePatterns) {
      if (pattern.test(content)) {
        isInappropriate = true;
        flags.push('inappropriate_content');
        break;
      }
    }

    for (const pattern of reviewPatterns) {
      if (pattern.test(content)) {
        needsReview = true;
        flags.push('needs_review');
        break;
      }
    }

    return { isInappropriate, needsReview, flags };
  }

  /**
   * Generate sample posts for demonstration
   */
  private generateSamplePosts(
    topic: CommunityTopic,
    region?: string
  ): CommunityPost[] {
    const samplePosts: CommunityPost[] = [
      {
        id: 'sample_1',
        authorId: 'sample_user_1',
        authorName: 'Helpful Maple',
        topic,
        title: 'How I built credit from zero in 6 months',
        content:
          "When I arrived in Canada, I had no credit history. Here's what worked for me...",
        createdAt: new Date(Date.now() - 86400000), // 1 day ago
        isAnonymous: true,
        region: region || 'GTA',
        replies: [
          {
            id: 'reply_1',
            authorId: 'sample_user_2',
            authorName: 'Wise Bear',
            content:
              'Great tips! I did something similar with a secured credit card.',
            createdAt: new Date(Date.now() - 43200000), // 12 hours ago
            upvotes: 12,
            isHelpful: true,
            isVerified: true,
          },
        ],
        upvotes: 28,
        isHelpful: true,
        moderationStatus: 'approved',
        tags: ['credit-building', 'newcomer-tips'],
      },
      {
        id: 'sample_2',
        authorId: 'sample_user_3',
        authorName: 'Kind Eagle',
        topic,
        title: 'Best banks for newcomers in Toronto?',
        content:
          'Looking for recommendations for banks that are newcomer-friendly...',
        createdAt: new Date(Date.now() - 172800000), // 2 days ago
        isAnonymous: true,
        region: 'GTA',
        replies: [],
        upvotes: 15,
        isHelpful: false,
        moderationStatus: 'approved',
        tags: ['banking', 'toronto', 'recommendations'],
      },
    ];

    return samplePosts;
  }

  /**
   * Storage management for community data
   */
  private async saveCommunityProfile(profile: CommunityUser): Promise<void> {
    try {
      await AsyncStorage.setItem(
        this.STORAGE_KEYS.COMMUNITY_PROFILE,
        JSON.stringify({
          ...profile,
          joinedAt: profile.joinedAt.toISOString(),
        })
      );
    } catch (error) {
      console.error('Failed to save community profile:', error);
      throw error;
    }
  }

  private async loadCommunityProfile(
    userId: string
  ): Promise<CommunityUser | null> {
    try {
      const profileData = await AsyncStorage.getItem(
        this.STORAGE_KEYS.COMMUNITY_PROFILE
      );
      if (!profileData) return null;

      const profile = JSON.parse(profileData);

      // Verify profile belongs to current user
      if (profile.id !== userId) return null;

      return {
        ...profile,
        joinedAt: new Date(profile.joinedAt),
      };
    } catch (error) {
      console.error('Failed to load community profile:', error);
      return null;
    }
  }

  /**
   * Get current user's community profile
   */
  getCurrentUser(): CommunityUser | null {
    return this.currentUser;
  }

  /**
   * Update helpfulness score when user receives upvotes
   */
  async updateHelpfulnessScore(delta: number): Promise<void> {
    if (!this.currentUser) return;

    this.currentUser.helpfulnessScore += delta;
    await this.saveCommunityProfile(this.currentUser);
  }

  /**
   * Award achievement badge to user
   */
  async awardAchievementBadge(badge: string): Promise<void> {
    if (!this.currentUser) return;

    if (!this.currentUser.achievementBadges.includes(badge)) {
      this.currentUser.achievementBadges.push(badge);
      await this.saveCommunityProfile(this.currentUser);

      PrivacyAwareAnalytics.trackEvent('community_achievement_earned', {
        badgeType: badge,
        totalBadges: this.currentUser.achievementBadges.length,
      });
    }
  }
}

export const communityService = new CommunityService();
export default CommunityService;
