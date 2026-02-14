import { useStore, type Conversation } from '../store';

export interface ConversationSearchResult {
  conversation: Conversation;
  matchedIn: 'title' | 'message';
  matchedContent: string;
  messageIndex: number;
}

class ConversationSearchService {
  /**
   * Search conversations by title or message content
   */
  search(query: string): ConversationSearchResult[] {
    if (!query.trim()) return [];

    const store = useStore.getState();
    const lowerQuery = query.toLowerCase();
    const results: ConversationSearchResult[] = [];

    store.conversations.forEach(conv => {
      // Search in title
      if (conv.title.toLowerCase().includes(lowerQuery)) {
        results.push({
          conversation: conv,
          matchedIn: 'title',
          matchedContent: conv.title,
          messageIndex: -1,
        });
      }

      // Search in messages
      conv.messages.forEach((msg, idx) => {
        if (msg.content.toLowerCase().includes(lowerQuery)) {
          results.push({
            conversation: conv,
            matchedIn: 'message',
            matchedContent: this.getSnippet(msg.content, query),
            messageIndex: idx,
          });
        }
      });
    });

    // Sort by recency
    return results.sort((a, b) => b.conversation.updatedAt - a.conversation.updatedAt);
  }

  /**
   * Get a snippet of content around the match
   */
  private getSnippet(content: string, query: string, contextLen = 50): string {
    const lowerContent = content.toLowerCase();
    const lowerQuery = query.toLowerCase();
    const index = lowerContent.indexOf(lowerQuery);

    if (index === -1) return content.slice(0, 100);

    const start = Math.max(0, index - contextLen);
    const end = Math.min(content.length, index + query.length + contextLen);

    let snippet = content.slice(start, end);
    if (start > 0) snippet = '...' + snippet;
    if (end < content.length) snippet = snippet + '...';

    return snippet;
  }

  /**
   * Get total count of conversations and messages
   */
  getStats() {
    const store = useStore.getState();
    return {
      totalConversations: store.conversations.length,
      totalMessages: store.conversations.reduce((sum, c) => sum + c.messages.length, 0),
    };
  }
}

export const conversationSearchService = new ConversationSearchService();
export default conversationSearchService;
