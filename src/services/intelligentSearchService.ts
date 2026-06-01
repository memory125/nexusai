/**
 * Intelligent Search Enhancement Service
 * 
 * Features:
 * - Multi-engine aggregation (Brave, Bing, DuckDuckGo, SearXNG)
 * - Intelligent result fusion with deduplication
 * - Semantic relevance ranking
 * - Search result summarization
 * - Caching for performance
 * - Search history and suggestions
 */

export interface SearchResult {
  id: string;
  title: string;
  url: string;
  snippet: string;
  source: string;
  relevanceScore: number;
  publishedDate?: string;
  thumbnail?: string;
  domain: string;
}

export interface SearchOptions {
  engines?: SearchEngine[];
  maxResults?: number;
  timeout?: number;
  safeSearch?: boolean;
  region?: string;
  timeRange?: 'day' | 'week' | 'month' | 'year' | 'all';
  includeImages?: boolean;
  includeNews?: boolean;
}

export type SearchEngine = 'brave' | 'bing' | 'duckduckgo' | 'searxng' | 'google' | 'wikipedia' | 'stackoverflow' | 'github' | 'hackernews' | 'reddit' | 'npm' | 'openlibrary' | 'arxiv';

export interface SearchHistoryItem {
  id: string;
  query: string;
  timestamp: number;
  resultCount: number;
  clickedResults: string[];
}

export interface SearchSuggestion {
  query: string;
  type: 'history' | 'trending' | 'related';
  score: number;
}

interface CacheEntry<T> {
  data: T;
  timestamp: number;
  ttl: number;
}

interface SearchResponse {
  results: SearchResult[];
  totalResults: number;
  enginesUsed: string[];
  searchTime: number;
  suggestions: SearchSuggestion[];
}

export class IntelligentSearchService {
  private apiKeys: Record<string, string> = {};
  private GOOGLE_CX = '017576662512468239146:omuauf_gy68';
  private searchHistory: SearchHistoryItem[] = [];
  private maxHistoryItems = 100;
  private memoryCache: Map<string, CacheEntry<any>> = new Map();
  private readonly CACHE_TTL = 5 * 60 * 1000;

  constructor() {
    this.loadApiKeys();
    this.loadSearchHistory();
  }

  private loadApiKeys() {
    this.apiKeys = {
      brave: localStorage.getItem('BRAVE_API_KEY') || '',
      bing: localStorage.getItem('BING_API_KEY') || '',
      google: localStorage.getItem('GOOGLE_API_KEY') || '',
      searxng: localStorage.getItem('SEARXNG_URL') || 'https://searx.space',
    };
  }

  private loadSearchHistory() {
    try {
      const stored = localStorage.getItem('intelligent_search_history');
      if (stored) {
        this.searchHistory = JSON.parse(stored);
      }
    } catch {
      this.searchHistory = [];
    }
  }

  private saveSearchHistory() {
    try {
      localStorage.setItem(
        'intelligent_search_history',
        JSON.stringify(this.searchHistory.slice(0, this.maxHistoryItems))
      );
    } catch {
      // Ignore storage errors
    }
  }

  async search(query: string, options: SearchOptions = {}): Promise<SearchResponse> {
    const startTime = Date.now();
    const {
      engines = ['duckduckgo', 'wikipedia', 'stackoverflow', 'github', 'hackernews'],
      maxResults = 10,
    } = options;

    const cacheKey = this.generateCacheKey(query, options);
    const cached = this.getCachedSearch(cacheKey);
    if (cached) {
      return { ...cached, searchTime: Date.now() - startTime };
    }

    const searchPromises = engines.map(engine =>
      this.searchWithEngine(engine, query).catch(error => {
        console.warn(`Search engine ${engine} failed:`, error);
        return [] as SearchResult[];
      })
    );

    const results = await Promise.allSettled(searchPromises);
    const allResults: SearchResult[] = [];
    const enginesUsed: string[] = [];

    results.forEach((result, index) => {
      if (result.status === 'fulfilled' && result.value.length > 0) {
        allResults.push(...result.value);
        enginesUsed.push(engines[index]);
      }
    });

    const fusedResults = this.fuseResults(allResults, maxResults);
    const suggestions = await this.generateSuggestions(query);
    this.addToHistory(query, fusedResults.length);

    const searchResponse: SearchResponse = {
      results: fusedResults,
      totalResults: allResults.length,
      enginesUsed,
      searchTime: Date.now() - startTime,
      suggestions,
    };

    this.cacheSearch(cacheKey, searchResponse);
    return searchResponse;
  }

  private async searchWithEngine(engine: SearchEngine, query: string): Promise<SearchResult[]> {
    switch (engine) {
      case 'brave':
        return this.searchBrave(query);
      case 'bing':
        return this.searchBing(query);
      case 'duckduckgo':
        return this.searchDuckDuckGo(query);
      case 'searxng':
        return this.searchSearXNG(query);
      case 'google':
        return this.searchGoogle(query);
      case 'wikipedia':
        return this.searchWikipedia(query);
      case 'stackoverflow':
        return this.searchStackOverflow(query);
      case 'github':
        return this.searchGithub(query);
      case 'hackernews':
        return this.searchHackerNews(query);
      case 'reddit':
        return this.searchReddit(query);
      case 'npm':
        return this.searchNpm(query);
      case 'openlibrary':
        return this.searchOpenLibrary(query);
      case 'arxiv':
        return this.searchArxiv(query);
      default:
        return [];
    }
  }

  private async searchBrave(query: string): Promise<SearchResult[]> {
    if (!this.apiKeys.brave) {
      console.info('Brave search skipped: no API key configured');
      return [];
    }

    const params = new URLSearchParams({ q: query, count: '20', offset: '0' });

    const response = await fetch(`https://api.search.brave.com/res/v1/web/search?${params}`, {
      headers: {
        'X-Subscription-Token': this.apiKeys.brave,
        'Accept': 'application/json',
      },
      signal: AbortSignal.timeout(10000),
    });

    if (!response.ok) throw new Error(`Brave search failed: ${response.status}`);

    const data = await response.json();
    return (data.web?.results || []).map((item: any) => ({
      id: `brave_${item.url}`,
      title: item.title,
      url: item.url,
      snippet: item.description,
      source: 'brave',
      relevanceScore: 0.8,
      publishedDate: item.age,
      domain: new URL(item.url).hostname,
    }));
  }

  private async searchBing(query: string): Promise<SearchResult[]> {
    if (!this.apiKeys.bing) {
      console.info('Bing search skipped: no API key configured');
      return [];
    }

    const response = await fetch(
      `https://api.bing.microsoft.com/v7.0/search?q=${encodeURIComponent(query)}&count=20`,
      { headers: { 'Ocp-Apim-Subscription-Key': this.apiKeys.bing } }
    );

    if (!response.ok) throw new Error(`Bing search failed: ${response.status}`);

    const data = await response.json();
    return (data.webPages?.value || []).map((item: any) => ({
      id: `bing_${item.url}`,
      title: item.name,
      url: item.url,
      snippet: item.snippet,
      source: 'bing',
      relevanceScore: 0.75,
      publishedDate: item.dateLastCrawled,
      domain: new URL(item.url).hostname,
    }));
  }

  private async searchDuckDuckGo(query: string): Promise<SearchResult[]> {
    try {
      const res = await fetch(
        `https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`,
        {
          headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) NexusAI/1.0' },
          signal: AbortSignal.timeout(10000),
        }
      );
      if (!res.ok) throw new Error(`DDG HTTP ${res.status}`);
      const html = await res.text();
      const doc = new DOMParser().parseFromString(html, 'text/html');
      const items: SearchResult[] = [];
      const resultNodes = doc.querySelectorAll('div.result, div.results_links, div.web-result');
      resultNodes.forEach((node, i) => {
        if (i >= 15) return;
        const titleEl = node.querySelector('a.result__a, h2 a, a.result-link');
        const snippetEl = node.querySelector('.result__snippet, .result-snippet, a.result__snippet');
        if (!titleEl) return;
        let href = titleEl.getAttribute('href') || '';
        const uddg = href.match(/uddg=([^&]+)/);
        if (uddg) {
          try { href = decodeURIComponent(uddg[1]); } catch { /* keep original */ }
        }
        if (!href.startsWith('http')) return;
        const title = (titleEl.textContent || '').trim();
        const snippet = (snippetEl?.textContent || '').trim();
        if (!title) return;
        try {
          const domain = new URL(href).hostname;
          items.push({
            id: `ddg_${href}`,
            title,
            url: href,
            snippet: snippet || title,
            source: 'duckduckgo',
            relevanceScore: 0.75,
            domain,
          });
        } catch { /* skip invalid URL */ }
      });
      if (items.length === 0) throw new Error('DDG returned no parseable results');
      return items;
    } catch (e) {
      console.warn('DuckDuckGo HTML search failed, falling back to lite API:', e);
      try {
        const lite = await fetch(
          `https://api.duckduckgo.com/?q=${encodeURIComponent(query)}&format=json&no_html=1&skip_disambig=1`,
          { signal: AbortSignal.timeout(8000) }
        );
        if (!lite.ok) throw new Error(`DDG lite ${lite.status}`);
        const data = await lite.json();
        const out: SearchResult[] = [];
        if (data.AbstractText && data.AbstractURL) {
          out.push({
            id: `ddg_abs_${data.AbstractURL}`,
            title: data.Heading || data.AbstractSource || query,
            url: data.AbstractURL,
            snippet: data.AbstractText,
            source: 'duckduckgo',
            relevanceScore: 0.9,
            domain: new URL(data.AbstractURL).hostname,
          });
        }
        if (Array.isArray(data.RelatedTopics)) {
          for (const t of data.RelatedTopics.slice(0, 10)) {
            if (t.Text && t.FirstURL) {
              try {
                out.push({
                  id: `ddg_rt_${t.FirstURL}`,
                  title: t.Text.split(' - ')[0] || t.Text.slice(0, 80),
                  url: t.FirstURL,
                  snippet: t.Text,
                  source: 'duckduckgo',
                  relevanceScore: 0.65,
                  domain: new URL(t.FirstURL).hostname,
                });
              } catch { /* skip */ }
            }
          }
        }
        return out;
      } catch (inner) {
        console.warn('DDG lite also failed:', inner);
        return [];
      }
    }
  }

  private async searchSearXNG(query: string): Promise<SearchResult[]> {
    const searxngUrl = this.apiKeys.searxng;
    const params = new URLSearchParams({ q: query, format: 'json', engines: 'google,bing,duckduckgo' });

    try {
      const response = await fetch(`${searxngUrl}/search?${params}`, {
        signal: AbortSignal.timeout(10000),
      });
      if (!response.ok) throw new Error('SearXNG failed');

      const data = await response.json();
      return (data.results || []).map((item: any) => ({
        id: `searxng_${item.url}`,
        title: item.title,
        url: item.url,
        snippet: item.content,
        source: 'searxng',
        relevanceScore: 0.85,
        domain: item.parsed_url?.[1] || new URL(item.url).hostname,
      }));
    } catch (e) {
      console.warn('SearXNG failed:', e);
      return [];
    }
  }

  private async searchGoogle(query: string): Promise<SearchResult[]> {
    if (!this.apiKeys.google) {
      console.info('Google search requires API key (CX configured). Skipping.');
      return [];
    }
    try {
      const { GOOGLE_CX } = this;
      const url = `https://www.googleapis.com/customsearch/v1?key=${this.apiKeys.google}&cx=${GOOGLE_CX}&q=${encodeURIComponent(query)}`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Google ${res.status}`);
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: `google_${item.link}`,
        title: item.title,
        url: item.link,
        snippet: item.snippet,
        source: 'google',
        relevanceScore: 0.88,
        domain: new URL(item.link).hostname,
      }));
    } catch (e) {
      console.warn('Google search failed:', e);
      return [];
    }
  }

  // Wikipedia REST API - CORS enabled, no key required
  private async searchWikipedia(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://en.wikipedia.org/w/api.php?action=query&list=search&srsearch=${encodeURIComponent(query)}&format=json&origin=*&srlimit=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`Wikipedia ${res.status}`);
      const data = await res.json();
      const hits = data?.query?.search || [];
      return hits.map((item: any) => {
        const title = String(item.title || '').replace(/<[^>]+>/g, '');
        const snippet = String(item.snippet || '').replace(/<[^>]+>/g, '');
        const pageUrl = `https://en.wikipedia.org/wiki/${encodeURIComponent(String(item.title || '').replace(/ /g, '_'))}`;
        return {
          id: `wiki_${item.pageid}`,
          title,
          url: pageUrl,
          snippet,
          source: 'wikipedia',
          relevanceScore: 0.82,
          domain: 'wikipedia.org',
        };
      });
    } catch (e) {
      console.warn('Wikipedia search failed:', e);
      return [];
    }
  }

  // StackOverflow public API - CORS enabled, no key required
  private async searchStackOverflow(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://api.stackexchange.com/2.3/search/advanced?order=desc&sort=relevance&q=${encodeURIComponent(query)}&site=stackoverflow&pagesize=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`StackOverflow ${res.status}`);
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: `so_${item.question_id}`,
        title: item.title,
        url: item.link,
        snippet: this.stripHtml(item.body || '').slice(0, 240),
        source: 'stackoverflow',
        relevanceScore: 0.78,
        domain: 'stackoverflow.com',
        publishedDate: item.creation_date ? new Date(item.creation_date * 1000).toISOString() : undefined,
      }));
    } catch (e) {
      console.warn('StackOverflow search failed:', e);
      return [];
    }
  }

  private stripHtml(html: string): string {
    return html.replace(/<[^>]+>/g, ' ').replace(/\s+/g, ' ').trim();
  }

  // GitHub REST search API - CORS enabled (rate-limited to 10 req/min unauthenticated)
  private async searchGithub(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://api.github.com/search/repositories?q=${encodeURIComponent(query)}&per_page=10&sort=stars&order=desc`;
      const res = await fetch(url, {
        headers: { 'Accept': 'application/vnd.github.v3+json' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`GitHub ${res.status}`);
      const data = await res.json();
      return (data.items || []).map((item: any) => ({
        id: `gh_${item.id}`,
        title: `${item.full_name}  ★${(item.stargazers_count || 0).toLocaleString()}`,
        url: item.html_url,
        snippet: (item.description || '').slice(0, 240) || `主要语言: ${item.language || 'N/A'}`,
        source: 'github',
        relevanceScore: 0.86,
        publishedDate: item.updated_at,
        domain: 'github.com',
      }));
    } catch (e) {
      console.warn('GitHub search failed:', e);
      return [];
    }
  }

  // HackerNews Algolia search - CORS enabled, no key
  private async searchHackerNews(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://hn.algolia.com/api/v1/search?query=${encodeURIComponent(query)}&hitsPerPage=10&tags=story`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`HN ${res.status}`);
      const data = await res.json();
      return (data.hits || []).map((item: any) => ({
        id: `hn_${item.objectID}`,
        title: item.title || item.story_title || '(无标题)',
        url: item.url || `https://news.ycombinator.com/item?id=${item.objectID}`,
        snippet: `${item.points || 0} 分 · ${item.num_comments || 0} 评论 · ${item.author}`,
        source: 'hackernews',
        relevanceScore: 0.74,
        publishedDate: item.created_at,
        domain: 'news.ycombinator.com',
      }));
    } catch (e) {
      console.warn('HackerNews search failed:', e);
      return [];
    }
  }

  // Reddit public JSON - CORS enabled, no key (rate-limited)
  private async searchReddit(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://www.reddit.com/search.json?q=${encodeURIComponent(query)}&limit=10&sort=relevance`;
      const res = await fetch(url, {
        headers: { 'User-Agent': 'NexusAI/1.0' },
        signal: AbortSignal.timeout(10000),
      });
      if (!res.ok) throw new Error(`Reddit ${res.status}`);
      const data = await res.json();
      return (data?.data?.children || []).map((c: any) => {
        const d = c.data || {};
        return {
          id: `reddit_${d.id}`,
          title: d.title,
          url: `https://reddit.com${d.permalink}`,
          snippet: (d.selftext || '').slice(0, 240) || `r/${d.subreddit} · ${d.score} 分 · ${d.num_comments} 评论`,
          source: 'reddit',
          relevanceScore: 0.7,
          publishedDate: d.created_utc ? new Date(d.created_utc * 1000).toISOString() : undefined,
          domain: 'reddit.com',
        };
      });
    } catch (e) {
      console.warn('Reddit search failed:', e);
      return [];
    }
  }

  // npm registry search - CORS enabled, no key
  private async searchNpm(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://registry.npmjs.com/-/v1/search?text=${encodeURIComponent(query)}&size=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`npm ${res.status}`);
      const data = await res.json();
      return (data.objects || []).map((item: any) => {
        const p = item.package || {};
        return {
          id: `npm_${p.name}`,
          title: `${p.name}  v${p.version || ''}`,
          url: p.links?.npm || `https://www.npmjs.com/package/${p.name}`,
          snippet: (p.description || '').slice(0, 240) || `作者: ${p.publisher?.username || ''}`,
          source: 'npm',
          relevanceScore: 0.72,
          domain: 'npmjs.com',
        };
      });
    } catch (e) {
      console.warn('npm search failed:', e);
      return [];
    }
  }

  // Open Library search - CORS enabled, no key
  private async searchOpenLibrary(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://openlibrary.org/search.json?q=${encodeURIComponent(query)}&limit=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (!res.ok) throw new Error(`OpenLibrary ${res.status}`);
      const data = await res.json();
      return (data.docs || []).map((item: any, i: number) => ({
        id: `ol_${item.key || i}`,
        title: item.title,
        url: `https://openlibrary.org${item.key}`,
        snippet: `${item.author_name?.[0] || '匿名'} · 首次出版 ${item.first_publish_year || '未知'}`,
        source: 'openlibrary',
        relevanceScore: 0.68,
        domain: 'openlibrary.org',
      }));
    } catch (e) {
      console.warn('OpenLibrary search failed:', e);
      return [];
    }
  }

  // arXiv API - supports CORS via &origin=*
  private async searchArxiv(query: string): Promise<SearchResult[]> {
    try {
      const url = `https://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(query)}&max_results=10`;
      const res = await fetch(url, { signal: AbortSignal.timeout(12000) });
      if (!res.ok) throw new Error(`arXiv ${res.status}`);
      const xml = await res.text();
      const doc = new DOMParser().parseFromString(xml, 'application/xml');
      const entries = Array.from(doc.querySelectorAll('entry')).slice(0, 10);
      return entries.map((entry) => {
        const title = (entry.querySelector('title')?.textContent || '').trim().replace(/\s+/g, ' ');
        const summary = (entry.querySelector('summary')?.textContent || '').trim().replace(/\s+/g, ' ').slice(0, 240);
        const link = entry.querySelector('id')?.textContent || '';
        const published = entry.querySelector('published')?.textContent || '';
        return {
          id: `arxiv_${link}`,
          title,
          url: link,
          snippet: summary,
          source: 'arxiv',
          relevanceScore: 0.8,
          publishedDate: published,
          domain: 'arxiv.org',
        };
      });
    } catch (e) {
      console.warn('arXiv search failed:', e);
      return [];
    }
  }

  private fuseResults(results: SearchResult[], maxResults: number): SearchResult[] {
    const seen = new Set<string>();
    const unique: SearchResult[] = [];

    for (const result of results) {
      const normalizedUrl = result.url.toLowerCase().replace(/^https?:\/\//, '').replace(/\/$/, '');
      if (!seen.has(normalizedUrl)) {
        seen.add(normalizedUrl);
        unique.push(result);
      }
    }

    const scored = unique.map(result => ({
      ...result,
      finalScore: this.calculateRelevanceScore(result),
    }));

    scored.sort((a: any, b: any) => b.finalScore - a.finalScore);

    return scored.slice(0, maxResults);
  }

  private calculateRelevanceScore(result: SearchResult): number {
    let score = result.relevanceScore;

    const reliableDomains = ['wikipedia.org', 'github.com', 'stackoverflow.com', '.edu', '.gov'];
    if (reliableDomains.some(d => result.domain.includes(d))) {
      score += 0.1;
    }

    if (result.publishedDate) {
      const age = Date.now() - new Date(result.publishedDate).getTime();
      const daysOld = age / (1000 * 60 * 60 * 24);
      if (daysOld < 7) score += 0.05;
      else if (daysOld < 30) score += 0.03;
    }

    if (result.snippet.length > 100 && result.snippet.length < 300) {
      score += 0.02;
    }

    return Math.min(score, 1.0);
  }

  private async generateSuggestions(query: string): Promise<SearchSuggestion[]> {
    const suggestions: SearchSuggestion[] = [];

    const historyMatches = this.searchHistory
      .filter(h => h.query.toLowerCase().includes(query.toLowerCase()) || 
                   query.toLowerCase().includes(h.query.toLowerCase()))
      .slice(0, 3)
      .map(h => ({ query: h.query, type: 'history' as const, score: 0.9 }));

    suggestions.push(...historyMatches);

    const relatedQueries = [
      `${query} tutorial`,
      `${query} documentation`,
      `${query} examples`,
      `best ${query}`,
      `how to ${query}`,
    ];

    relatedQueries.forEach((q, i) => {
      if (!suggestions.find(s => s.query === q)) {
        suggestions.push({ query: q, type: 'related', score: 0.7 - i * 0.05 });
      }
    });

    return suggestions.sort((a, b) => b.score - a.score).slice(0, 5);
  }

  private addToHistory(query: string, resultCount: number) {
    const item: SearchHistoryItem = {
      id: Math.random().toString(36).slice(2),
      query,
      timestamp: Date.now(),
      resultCount,
      clickedResults: [],
    };

    this.searchHistory.unshift(item);
    if (this.searchHistory.length > this.maxHistoryItems) {
      this.searchHistory = this.searchHistory.slice(0, this.maxHistoryItems);
    }

    this.saveSearchHistory();
  }

  async recordClick(query: string, resultId: string) {
    const historyItem = this.searchHistory.find(h => h.query === query);
    if (historyItem && !historyItem.clickedResults.includes(resultId)) {
      historyItem.clickedResults.push(resultId);
      this.saveSearchHistory();
    }
  }

  getSearchHistory(limit: number = 20): SearchHistoryItem[] {
    return this.searchHistory.slice(0, limit);
  }

  async clearHistory() {
    this.searchHistory = [];
    this.saveSearchHistory();
  }

  private generateCacheKey(query: string, options: SearchOptions): string {
    return `search_${query.toLowerCase().trim()}_${JSON.stringify(options)}`;
  }

  private getCachedSearch(key: string): SearchResponse | null {
    const cached = this.memoryCache.get(key);
    if (cached && Date.now() - cached.timestamp < cached.ttl) {
      return cached.data;
    }
    this.memoryCache.delete(key);
    return null;
  }

  private cacheSearch(key: string, results: SearchResponse) {
    this.memoryCache.set(key, {
      data: results,
      timestamp: Date.now(),
      ttl: this.CACHE_TTL,
    });
  }

  async summarizeResults(results: SearchResult[], query: string): Promise<string> {
    const keyPoints = results.slice(0, 5).map(r => `• ${r.title}: ${r.snippet.slice(0, 100)}...`);
    
    return `## 搜索结果摘要\n\n针对"**${query}**"的搜索，找到 ${results.length} 个相关结果：\n\n${keyPoints.join('\n')}\n\n这些结果来自多个搜索引擎的综合排序。`;
  }
}

export const intelligentSearchService = new IntelligentSearchService();
export default intelligentSearchService;
