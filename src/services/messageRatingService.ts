/**
 * Message Rating Service
 * 
 * Features:
 * - Rate AI messages (thumbs up/down)
 * - Track rating statistics
 * - Analyze rating patterns by model/provider
 * - Export rating data for feedback
 */

export type Rating = 'up' | 'down';

export interface MessageRating {
  id: string;
  messageId: string;
  conversationId: string;
  rating: Rating;
  content: string;
  model?: string;
  provider?: string;
  timestamp: number;
}

export interface RatingStats {
  totalRatings: number;
  thumbsUp: number;
  thumbsDown: number;
  upRate: number;
  byModel: Record<string, { total: number; up: number; down: number }>;
  byProvider: Record<string, { total: number; up: number; down: number }>;
  recentTrend: { date: string; up: number; down: number }[];
}

const STORAGE_KEY = 'nexusai_message_ratings';

export class MessageRatingService {
  private ratings: Map<string, MessageRating> = new Map();

  constructor() {
    this.loadFromStorage();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((r: MessageRating) => {
          this.ratings.set(r.id, r);
        });
      }
    } catch (e) {
      console.error('Failed to load ratings from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.ratings.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save ratings to storage:', e);
    }
  }

  /**
   * Rate a message
   */
  rateMessage(
    messageId: string,
    conversationId: string,
    rating: Rating,
    content: string,
    model?: string,
    provider?: string
  ): MessageRating {
    // Check if already rated
    const existing = Array.from(this.ratings.values())
      .find(r => r.messageId === messageId && r.conversationId === conversationId);

    if (existing) {
      // Update existing rating
      if (existing.rating === rating) {
        // Same rating, remove it (toggle off)
        this.ratings.delete(existing.id);
        this.saveToStorage();
        return existing;
      } else {
        // Different rating, update it
        existing.rating = rating;
        existing.timestamp = Date.now();
        this.saveToStorage();
        return existing;
      }
    }

    // Create new rating
    const newRating: MessageRating = {
      id: `rating_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      messageId,
      conversationId,
      rating,
      content: content.substring(0, 500), // Store first 500 chars
      model,
      provider,
      timestamp: Date.now(),
    };

    this.ratings.set(newRating.id, newRating);
    this.saveToStorage();
    return newRating;
  }

  /**
   * Get rating for a specific message
   */
  getMessageRating(messageId: string, conversationId: string): MessageRating | null {
    return Array.from(this.ratings.values())
      .find(r => r.messageId === messageId && r.conversationId === conversationId) || null;
  }

  /**
   * Get all ratings
   */
  getAllRatings(): MessageRating[] {
    return Array.from(this.ratings.values())
      .sort((a, b) => b.timestamp - a.timestamp);
  }

  /**
   * Get ratings for a conversation
   */
  getConversationRatings(conversationId: string): MessageRating[] {
    return this.getAllRatings()
      .filter(r => r.conversationId === conversationId);
  }

  /**
   * Get statistics
   */
  getStatistics(): RatingStats {
    const allRatings = this.getAllRatings();
    const total = allRatings.length;
    const up = allRatings.filter(r => r.rating === 'up').length;
    const down = allRatings.filter(r => r.rating === 'down').length;

    // By model
    const byModel: Record<string, { total: number; up: number; down: number }> = {};
    allRatings.forEach(r => {
      const model = r.model || 'unknown';
      if (!byModel[model]) {
        byModel[model] = { total: 0, up: 0, down: 0 };
      }
      byModel[model].total++;
      if (r.rating === 'up') byModel[model].up++;
      else byModel[model].down++;
    });

    // By provider
    const byProvider: Record<string, { total: number; up: number; down: number }> = {};
    allRatings.forEach(r => {
      const provider = r.provider || 'unknown';
      if (!byProvider[provider]) {
        byProvider[provider] = { total: 0, up: 0, down: 0 };
      }
      byProvider[provider].total++;
      if (r.rating === 'up') byProvider[provider].up++;
      else byProvider[provider].down++;
    });

    // Recent trend (last 7 days)
    const recentTrend: { date: string; up: number; down: number }[] = [];
    for (let i = 6; i >= 0; i--) {
      const date = new Date();
      date.setDate(date.getDate() - i);
      const dateStr = date.toISOString().split('T')[0];
      
      const dayRatings = allRatings.filter(r => {
        const ratingDate = new Date(r.timestamp).toISOString().split('T')[0];
        return ratingDate === dateStr;
      });

      recentTrend.push({
        date: dateStr,
        up: dayRatings.filter(r => r.rating === 'up').length,
        down: dayRatings.filter(r => r.rating === 'down').length,
      });
    }

    return {
      totalRatings: total,
      thumbsUp: up,
      thumbsDown: down,
      upRate: total > 0 ? (up / total) * 100 : 0,
      byModel,
      byProvider,
      recentTrend,
    };
  }

  /**
   * Clear all ratings
   */
  clearAllRatings(): void {
    this.ratings.clear();
    this.saveToStorage();
  }

  /**
   * Delete rating by ID
   */
  deleteRating(ratingId: string): boolean {
    const deleted = this.ratings.delete(ratingId);
    if (deleted) {
      this.saveToStorage();
    }
    return deleted;
  }

  /**
   * Export ratings to JSON
   */
  exportRatings(): string {
    return JSON.stringify(this.getAllRatings(), null, 2);
  }

  /**
   * Get recent ratings (last N)
   */
  getRecentRatings(limit: number = 50): MessageRating[] {
    return this.getAllRatings().slice(0, limit);
  }

  /**
   * Get negative ratings (for analysis)
   */
  getNegativeRatings(): MessageRating[] {
    return this.getAllRatings()
      .filter(r => r.rating === 'down');
  }
}

export const messageRatingService = new MessageRatingService();
