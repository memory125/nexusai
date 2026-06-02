// Comprehensive Crawler Service (inspired by Crawl4AI's full stack)
// Pure browser implementation: deep crawling, adaptive, sitemap, multi-URL, cache, hooks.

import { markdownService, MarkdownResult, CrawlConfig } from './markdownService';
import { safeFetch } from './http';

export interface CrawlHooks {
  beforeFetch?: (url: string) => void | Promise<void>;
  afterFetch?: (url: string, ok: boolean, ms: number) => void | Promise<void>;
  onPageResult?: (result: CrawledPage) => void | Promise<void>;   // streaming
  onError?: (url: string, err: string) => void;
}

export interface CrawlFilter {
  match(url: string): boolean;
}

export interface CrawlScorer {
  score(url: string, ctx?: { anchorText?: string; parentUrl?: string }): number;
}

export interface CrawlPageState {
  strategy: 'bfs' | 'dfs' | 'best_first' | 'adaptive' | 'multi' | 'prefetch';
  visited: string[];
  pending: Array<{ url: string; depth: number; parentUrl?: string; score?: number }>;
  depths: Record<string, number>;
  pagesCrawled: number;
  cancelled?: boolean;
  startedAt: number;
}

export interface CrawledPage {
  url: string;
  finalUrl?: string;
  ok: boolean;
  status: number;
  depth: number;
  parentUrl?: string;
  score?: number;
  durationMs: number;
  sizeBytes: number;
  contentType?: string;
  error?: string;
  result?: MarkdownResult;
  markdown?: string;        // shortcut to result.fit_markdown
  internalLinks: string[];
  externalLinks: string[];
  retries: number;
  fromCache: boolean;
}

export interface CrawlDeepConfig {
  // Strategy
  strategy: 'bfs' | 'dfs' | 'best_first' | 'adaptive';
  startUrls: string[];
  maxDepth?: number;            // default 2
  maxPages?: number;            // default 20
  scoreThreshold?: number;      // skip URLs below this score
  // Discovery
  includeExternal?: boolean;
  allowedDomains?: string[];
  blockedDomains?: string[];
  urlPatterns?: string[];       // wildcard like '*blog*' or regex
  excludePatterns?: string[];
  contentTypeFilter?: string[]; // ['text/html'] default
  // Scorer
  keywords?: string[];
  keywordWeight?: number;       // 0..1, default 0.7
  // Adaptive
  adaptiveQuery?: string;       // for adaptive mode
  adaptiveStagnation?: number;  // stop after N consecutive below-threshold pages, default 5
  // Network
  concurrency?: number;         // default 3
  delayMs?: number;             // between requests
  timeoutMs?: number;           // per request
  retries?: number;             // default 2
  retryBackoffMs?: number;      // default 1000
  rotateUserAgent?: boolean;
  customHeaders?: Record<string, string>;
  corsProxy?: string;           // 浏览器模式 CORS 失败时回退代理模板 (e.g. 'https://corsproxy.io/?')
  // Page
  crawlConfig?: CrawlConfig;    // passed to markdownService.crawl
  // Cache
  useCache?: boolean;
  cacheTtlMs?: number;          // default 1h
  // Streaming + cancellation
  hooks?: CrawlHooks;
  signal?: AbortSignal;
  // Recovery
  resumeState?: CrawlPageState;
  onStateChange?: (state: CrawlPageState) => void;
}

export interface CrawlDeepResult {
  pages: CrawledPage[];
  state: CrawlPageState;
  stats: {
    total: number;
    success: number;
    failed: number;
    fromCache: number;
    retried: number;
    durationMs: number;
    avgPageMs: number;
    maxDepthReached: number;
    relevanceScores?: number[];
  };
  discoveredUrls: string[];   // all URLs found (not necessarily crawled)
}

// ========== Filters ==========
export class URLPatternFilter implements CrawlFilter {
  constructor(public patterns: string[], public exclude: string[] = []) {}
  match(url: string): boolean {
    if (this.exclude.some(p => this.test(url, p))) return false;
    if (this.patterns.length === 0) return true;
    return this.patterns.some(p => this.test(url, p));
  }
  private test(url: string, pattern: string): boolean {
    if (pattern.startsWith('/') && pattern.endsWith('/')) {
      try { return new RegExp(pattern.slice(1, -1), 'i').test(url); } catch { return false; }
    }
    const regex = new RegExp('^' + pattern.replace(/[.+^${}()|[\]\\]/g, '\\$&').replace(/\*/g, '.*').replace(/\?/g, '.') + '$', 'i');
    return regex.test(url);
  }
}

export class DomainFilter implements CrawlFilter {
  constructor(public allowed: string[] = [], public blocked: string[] = []) {}
  match(url: string): boolean {
    let host = '';
    try { host = new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return false; }
    if (this.blocked.some(d => host === d || host.endsWith('.' + d))) return false;
    if (this.allowed.length === 0) return true;
    return this.allowed.some(d => host === d || host.endsWith('.' + d));
  }
}

export class ContentTypeFilter implements CrawlFilter {
  constructor(public allowed: string[] = ['text/html']) {}
  match(url: string): boolean {
    const ext = url.split('?')[0].split('.').pop()?.toLowerCase() || '';
    const BLOCKED_EXTS = new Set(['pdf', 'zip', 'rar', 'tar', 'gz', '7z', 'exe', 'dmg', 'mp3', 'mp4', 'avi', 'mov', 'wmv', 'png', 'jpg', 'jpeg', 'gif', 'webp', 'svg']);
    if (BLOCKED_EXTS.has(ext)) return false;
    return true;
  }
}

// ========== Scorer ==========
export class KeywordRelevanceScorer implements CrawlScorer {
  constructor(public keywords: string[] = [], public weight: number = 0.7) {}
  score(url: string, ctx?: { anchorText?: string; parentUrl?: string }): number {
    if (this.keywords.length === 0) return 0.5; // neutral
    const text = (url + ' ' + (ctx?.anchorText || '')).toLowerCase();
    const hits = this.keywords.filter(k => text.includes(k.toLowerCase())).length;
    return (hits / this.keywords.length) * this.weight + (1 - this.weight) * 0.3;
  }
}

// ========== Sitemap discovery ==========
export interface SitemapParseResult {
  urls: string[];
  sitemaps: string[];   // for sitemap index
  type: 'urlset' | 'sitemapindex' | 'unknown';
}

class SitemapService {
  async fetchSitemap(url: string, corsProxy?: string): Promise<string | null> {
    // Try common locations
    const tryUrls = [url];
    try {
      const u = new URL(url);
      tryUrls.push(`${u.protocol}//${u.host}/sitemap.xml`);
      tryUrls.push(`${u.protocol}//${u.host}/sitemap_index.xml`);
      tryUrls.push(`${u.protocol}//${u.host}/sitemap-index.xml`);
    } catch {}
    for (const t of tryUrls) {
      try {
        const r = await safeFetch(t, undefined, corsProxy);
        if (r.ok && (r.headers['content-type'] || '').includes('xml')) {
          return await r.text();
        }
      } catch {}
    }
    return null;
  }

  parse(xml: string): SitemapParseResult {
    const result: SitemapParseResult = { urls: [], sitemaps: [], type: 'unknown' };
    if (!xml) return result;
    try {
      const doc = new DOMParser().parseFromString(xml, 'text/xml');
      const parserError = doc.querySelector('parsererror');
      if (parserError) return result;
      // urlset
      doc.querySelectorAll('url > loc').forEach(el => {
        const u = el.textContent?.trim();
        if (u) result.urls.push(u);
      });
      if (result.urls.length > 0) result.type = 'urlset';
      // sitemapindex
      doc.querySelectorAll('sitemapindex > sitemap > loc').forEach(el => {
        const u = el.textContent?.trim();
        if (u) result.sitemaps.push(u);
      });
      if (result.sitemaps.length > 0) result.type = 'sitemapindex';
    } catch {}
    return result;
  }

  async discover(url: string, maxDepth: number = 2, corsProxy?: string): Promise<string[]> {
    const collected: string[] = [];
    const visited = new Set<string>();
    const queue: Array<{ url: string; depth: number }> = [{ url, depth: 0 }];
    while (queue.length > 0) {
      const { url: cur, depth } = queue.shift()!;
      if (visited.has(cur) || depth > maxDepth) continue;
      visited.add(cur);
      const xml = await this.fetchSitemap(cur, corsProxy);
      if (!xml) continue;
      const parsed = this.parse(xml);
      collected.push(...parsed.urls);
      for (const sub of parsed.sitemaps) {
        if (!visited.has(sub)) queue.push({ url: sub, depth: depth + 1 });
      }
    }
    // Dedupe
    return Array.from(new Set(collected));
  }
}

// ========== User-Agent pool ==========
const UA_POOL = [
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/18.0 Safari/605.1.15',
  'Mozilla/5.0 (X11; Linux x86_64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64; rv:132.0) Gecko/20100101 Firefox/132.0',
  'Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Safari/537.36',
  'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/130.0.0.0 Safari/537.36 Edg/130.0.0.0',
];

function pickUA(): string {
  return UA_POOL[Math.floor(Math.random() * UA_POOL.length)];
}

// ========== Cache ==========
class CrawlCache {
  private prefix = 'nexusai:crawl-cache:';
  constructor(private ttlMs: number = 3600_000) {}
  private key(url: string) { return this.prefix + url; }
  get(url: string): { html: string; ts: number; contentType?: string } | null {
    try {
      const raw = localStorage.getItem(this.key(url));
      if (!raw) return null;
      const data = JSON.parse(raw);
      if (Date.now() - data.ts > this.ttlMs) { localStorage.removeItem(this.key(url)); return null; }
      return data;
    } catch { return null; }
  }
  set(url: string, html: string, contentType?: string) {
    try { localStorage.setItem(this.key(url), JSON.stringify({ html, ts: Date.now(), contentType })); } catch {}
  }
  clear() {
    try {
      const toDelete: string[] = [];
      for (let i = 0; i < localStorage.length; i++) {
        const k = localStorage.key(i);
        if (k && k.startsWith(this.prefix)) toDelete.push(k);
      }
      toDelete.forEach(k => localStorage.removeItem(k));
    } catch {}
  }
  size(): number {
    let n = 0;
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith(this.prefix)) n++;
    }
    return n;
  }
}

// ========== Concurrency executor ==========
async function runConcurrent<T, R>(items: T[], limit: number, worker: (item: T) => Promise<R>, signal?: AbortSignal): Promise<R[]> {
  const results: R[] = [];
  let idx = 0;
  const inFlight: Promise<void>[] = [];
  const launch = async () => {
    while (idx < items.length) {
      if (signal?.aborted) break;
      const myIdx = idx++;
      const item = items[myIdx];
      try { results[myIdx] = await worker(item); }
      catch (e) { results[myIdx] = e as any; }
    }
  };
  for (let i = 0; i < Math.min(limit, items.length); i++) inFlight.push(launch());
  await Promise.all(inFlight);
  return results;
}

// ========== Main Crawler Service ==========
class CrawlerService {
  sitemap = new SitemapService();

  // ============== Single page fetch with retry + cache ==============
  async fetchWithRetry(url: string, cfg: CrawlDeepConfig, cache: CrawlCache): Promise<{
    ok: boolean; html: string; status: number; sizeBytes: number; contentType?: string;
    finalUrl?: string; durationMs: number; retries: number; fromCache: boolean; error?: string;
  }> {
    // Cache hit?
    if (cfg.useCache) {
      const c = cache.get(url);
      if (c) return { ok: true, html: c.html, status: 200, sizeBytes: c.html.length, contentType: c.contentType, durationMs: 0, retries: 0, fromCache: true };
    }
    const maxRetries = cfg.retries ?? 2;
    const backoff = cfg.retryBackoffMs ?? 1000;
    let retries = 0;
    let lastErr = '';
    for (let attempt = 0; attempt <= maxRetries; attempt++) {
      if (cfg.signal?.aborted) throw new Error('cancelled');
      const start = Date.now();
      try {
        const headers: Record<string, string> = {
          'Accept': 'text/html,application/xhtml+xml,application/xml;q=0.9,*/*;q=0.8',
          'Accept-Language': 'en-US,en;q=0.9,zh-CN;q=0.8',
          ...(cfg.rotateUserAgent ? { 'User-Agent': pickUA() } : {}),
          ...(cfg.customHeaders || {}),
        };
        const ctrl = cfg.signal ? { signal: cfg.signal } : undefined;
        const r = await safeFetch(url, { method: 'GET', headers, ...ctrl } as RequestInit, cfg.corsProxy);
        if (r.status >= 500 || r.status === 429) {
          lastErr = `HTTP ${r.status}`;
          retries++;
          if (attempt < maxRetries) { await new Promise(rr => setTimeout(rr, backoff * Math.pow(2, attempt))); continue; }
        }
        const ct = r.headers['content-type'] || undefined;
        const text = await r.text();
        const result = {
          ok: r.ok, html: text, status: r.status, sizeBytes: text.length, contentType: ct,
          finalUrl: r.url, durationMs: Date.now() - start, retries, fromCache: false,
        };
        if (cfg.useCache && r.ok) cache.set(url, text, ct);
        return result;
      } catch (e) {
        lastErr = e instanceof Error ? e.message : String(e);
        retries++;
        if (attempt < maxRetries) { await new Promise(rr => setTimeout(rr, backoff * Math.pow(2, attempt))); continue; }
      }
    }
    return { ok: false, html: '', status: 0, sizeBytes: 0, durationMs: 0, retries, fromCache: false, error: lastErr };
  }

  // ============== Multi-URL concurrent ==============
  async crawlMulti(urls: string[], cfg: Omit<CrawlDeepConfig, 'strategy' | 'startUrls'>): Promise<CrawlDeepResult> {
    const startTime = Date.now();
    const cache = new CrawlCache(cfg.cacheTtlMs);
    const visitedSet = new Set<string>();
    const pages: CrawledPage[] = [];
    const relevanceScores: number[] = [];

    await runConcurrent(urls, cfg.concurrency ?? 3, async (url) => {
      if (cfg.signal?.aborted) return;
      const page = await this.crawlOnePage(url, 0, undefined, cfg, cache, 0);
      pages.push(page);
      if (page.result) relevanceScores.push(this.estimateRelevance(page.markdown || ''));
    }, cfg.signal);

    pages.sort((a, b) => a.url.localeCompare(b.url));
    return this.assembleResult(pages, 'multi', startTime, relevanceScores);
  }

  // ============== Prefetch: fast URL discovery ==============
  async crawlPrefetch(urls: string[], cfg: Omit<CrawlDeepConfig, 'strategy' | 'startUrls'>): Promise<CrawlDeepResult> {
    const startTime = Date.now();
    const cache = new CrawlCache(cfg.cacheTtlMs);
    const allLinks = new Set<string>();
    const pages: CrawledPage[] = [];

    await runConcurrent(urls, cfg.concurrency ?? 5, async (url) => {
      if (cfg.signal?.aborted) return;
      const r = await this.fetchWithRetry(url, cfg, cache);
      if (!r.ok) return;
      const doc = new DOMParser().parseFromString(r.html, 'text/html');
      const links = new Set<string>();
      doc.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:')) return;
        try { links.add(new URL(href, url).toString()); } catch {}
      });
      const int = Array.from(links);
      int.forEach(l => allLinks.add(l));
      pages.push({
        url, finalUrl: r.finalUrl, ok: r.ok, status: r.status, depth: 0,
        durationMs: r.durationMs, sizeBytes: r.sizeBytes, contentType: r.contentType,
        internalLinks: int, externalLinks: [], retries: r.retries, fromCache: r.fromCache,
      });
    }, cfg.signal);

    return {
      pages, discoveredUrls: Array.from(allLinks),
      state: { strategy: 'prefetch', visited: pages.map(p => p.url), pending: [], depths: {}, pagesCrawled: pages.length, startedAt: startTime },
      stats: { total: pages.length, success: pages.filter(p => p.ok).length, failed: pages.filter(p => !p.ok).length, fromCache: pages.filter(p => p.fromCache).length, retried: 0, durationMs: Date.now() - startTime, avgPageMs: 0, maxDepthReached: 0 },
    };
  }

  // ============== Deep crawl (BFS / DFS / BestFirst / Adaptive) ==============
  async crawlDeep(config: CrawlDeepConfig): Promise<CrawlDeepResult> {
    const cfg: Required<Omit<CrawlDeepConfig, 'crawlConfig' | 'hooks' | 'signal' | 'resumeState' | 'onStateChange' | 'adaptiveQuery'>> & CrawlDeepConfig = {
      strategy: 'bfs', maxDepth: 2, maxPages: 20, scoreThreshold: 0,
      includeExternal: false, allowedDomains: [], blockedDomains: [], urlPatterns: [], excludePatterns: [],
      contentTypeFilter: ['text/html'],
      keywords: [], keywordWeight: 0.7,
      adaptiveStagnation: 5,
      concurrency: 3, delayMs: 0, timeoutMs: 30000, retries: 2, retryBackoffMs: 1000,
      rotateUserAgent: false, customHeaders: {},
      useCache: true, cacheTtlMs: 3600_000,
      ...config,
    };

    const startTime = Date.now();
    const cache = new CrawlCache(cfg.cacheTtlMs);
    const state: CrawlPageState = config.resumeState || {
      strategy: cfg.strategy, visited: [], pending: [], depths: {},
      pagesCrawled: 0, startedAt: startTime,
    };
    const pages: CrawledPage[] = [];
    const relevanceScores: number[] = [];
    const discoveredSet = new Set<string>();
    let consecutiveLowRelevance = 0;

    // Initialize pending
    if (state.pending.length === 0) {
      for (const u of cfg.startUrls) {
        if (!state.visited.includes(u)) {
          state.pending.push({ url: u, depth: 0, parentUrl: undefined, score: 1 });
          discoveredSet.add(u);
        }
      }
    }

    // Filters + Scorers
    const urlFilter = new URLPatternFilter(cfg.urlPatterns, cfg.excludePatterns);
    const domainFilter = new DomainFilter(cfg.allowedDomains, cfg.blockedDomains);
    const ctFilter = new ContentTypeFilter(cfg.contentTypeFilter);
    const scorer = new KeywordRelevanceScorer(cfg.keywords, cfg.keywordWeight);

    // Save state callback wrapper
    const saveState = async () => {
      try { await config.onStateChange?.(state); } catch {}
    };

    // Worker: process one URL
    const processOne = async (item: { url: string; depth: number; parentUrl?: string; score?: number }) => {
      if (cfg.signal?.aborted) return;
      if (pages.length >= cfg.maxPages) return;
      if (state.visited.includes(item.url)) return;
      state.visited.push(item.url);
      state.depths[item.url] = item.depth;
      state.pagesCrawled++;
      await saveState();

      const page = await this.crawlOnePage(item.url, item.depth, item.parentUrl, cfg, cache, item.score || 0);
      pages.push(page);
      await config.hooks?.onPageResult?.(page);

      if (page.result) {
        relevanceScores.push(this.estimateRelevance(page.markdown || '', cfg.adaptiveQuery));
        // Adaptive stopping
        if (cfg.strategy === 'adaptive' && relevanceScores.length > 0) {
          const last = relevanceScores[relevanceScores.length - 1];
          if (last < 0.1) consecutiveLowRelevance++;
          else consecutiveLowRelevance = 0;
          if (consecutiveLowRelevance >= (cfg.adaptiveStagnation || 5)) {
            state.cancelled = true;
            return;
          }
        }
        // Discover new links (BFS/DFS)
        if (item.depth < (cfg.maxDepth || 2)) {
          for (const link of page.internalLinks) {
            discoveredSet.add(link);
            if (state.visited.includes(link)) continue;
            if (cfg.includeExternal === false && !this.isSameDomain(link, cfg.startUrls[0])) continue;
            if (!urlFilter.match(link)) continue;
            if (!domainFilter.match(link)) continue;
            if (!ctFilter.match(link)) continue;
            const s = scorer.score(link, { parentUrl: item.url });
            if (s < (cfg.scoreThreshold || 0)) continue;
            state.pending.push({ url: link, depth: item.depth + 1, parentUrl: item.url, score: s });
          }
        }
      }
      if (cfg.delayMs && cfg.delayMs > 0) await new Promise(r => setTimeout(r, cfg.delayMs));
      await saveState();
    };

    // Process queue
    while (state.pending.length > 0 && !state.cancelled && pages.length < cfg.maxPages) {
      if (cfg.signal?.aborted) break;

      // Pick next item based on strategy
      let item: { url: string; depth: number; parentUrl?: string; score?: number };
      if (cfg.strategy === 'dfs') {
        item = state.pending.pop()!;
      } else if (cfg.strategy === 'best_first' || cfg.strategy === 'adaptive') {
        // Pop highest score
        state.pending.sort((a, b) => (b.score || 0) - (a.score || 0));
        item = state.pending.shift()!;
      } else {
        // BFS
        item = state.pending.shift()!;
      }

      await processOne(item);
    }

    await saveState();
    return this.assembleResult(pages, cfg.strategy, startTime, relevanceScores, discoveredSet, state);
  }

  // ============== Internal: crawl one page ==============
  private async crawlOnePage(
    url: string, depth: number, parentUrl: string | undefined,
    cfg: CrawlDeepConfig, cache: CrawlCache, score: number
  ): Promise<CrawledPage> {
    await cfg.hooks?.beforeFetch?.(url);
    const fetchResult = await this.fetchWithRetry(url, cfg, cache);
    await cfg.hooks?.afterFetch?.(url, fetchResult.ok, fetchResult.durationMs);

    if (!fetchResult.ok) {
      cfg.hooks?.onError?.(url, fetchResult.error || `HTTP ${fetchResult.status}`);
      return {
        url, finalUrl: fetchResult.finalUrl, ok: false, status: fetchResult.status, depth, parentUrl, score,
        durationMs: fetchResult.durationMs, sizeBytes: 0, contentType: fetchResult.contentType,
        retries: fetchResult.retries, fromCache: fetchResult.fromCache, error: fetchResult.error,
        internalLinks: [], externalLinks: [],
      };
    }

    // Process with markdownService
    let result: MarkdownResult | undefined;
    let internalLinks: string[] = [];
    let externalLinks: string[] = [];
    try {
      result = await markdownService.crawl(fetchResult.html, url, cfg.crawlConfig || {});
      // Extract additional links for discovery
      const doc = new DOMParser().parseFromString(fetchResult.html, 'text/html');
      doc.querySelectorAll('a[href]').forEach(a => {
        const href = a.getAttribute('href') || '';
        if (!href || href.startsWith('javascript:') || href.startsWith('#') || href.startsWith('mailto:') || href.startsWith('tel:')) return;
        let abs: string; try { abs = new URL(href, url).toString(); } catch { return; }
        const baseDomain = this.safeDomain(url);
        const d = this.safeDomain(abs);
        const isInternal = d === baseDomain || d.endsWith('.' + baseDomain);
        (isInternal ? internalLinks : externalLinks).push(abs);
      });
    } catch (e) {
      return {
        url, ok: false, status: fetchResult.status, depth, parentUrl, score,
        durationMs: fetchResult.durationMs, sizeBytes: fetchResult.sizeBytes,
        contentType: fetchResult.contentType, retries: fetchResult.retries, fromCache: fetchResult.fromCache,
        error: e instanceof Error ? e.message : String(e),
        internalLinks: [], externalLinks: [],
      };
    }

    return {
      url, finalUrl: fetchResult.finalUrl, ok: true, status: fetchResult.status, depth, parentUrl, score,
      durationMs: fetchResult.durationMs, sizeBytes: fetchResult.sizeBytes, contentType: fetchResult.contentType,
      retries: fetchResult.retries, fromCache: fetchResult.fromCache,
      result, markdown: result.fit_markdown,
      internalLinks, externalLinks,
    };
  }

  // ============== Helpers ==============
  private estimateRelevance(text: string, query?: string): number {
    if (!query) return text.length > 100 ? 0.5 : 0.1;
    const tokens = query.toLowerCase().split(/\s+/).filter(Boolean);
    if (tokens.length === 0) return 0.5;
    const lower = text.toLowerCase();
    const hits = tokens.reduce((s, t) => s + (lower.includes(t) ? 1 : 0), 0);
    return hits / tokens.length;
  }

  private isSameDomain(url: string, ref: string): boolean {
    try {
      const a = new URL(url).hostname;
      const b = new URL(ref).hostname;
      return a === b || a.endsWith('.' + b) || b.endsWith('.' + a);
    } catch { return false; }
  }

  private safeDomain(url: string): string {
    try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); } catch { return ''; }
  }

  private assembleResult(
    pages: CrawledPage[], strategy: CrawlPageState['strategy'], startTime: number,
    relevanceScores: number[] = [], discoveredSet?: Set<string>, state?: CrawlPageState
  ): CrawlDeepResult {
    const totalMs = Date.now() - startTime;
    const success = pages.filter(p => p.ok).length;
    const failed = pages.filter(p => !p.ok).length;
    const fromCache = pages.filter(p => p.fromCache).length;
    const retried = pages.filter(p => p.retries > 0).length;
    const maxDepthReached = pages.reduce((m, p) => Math.max(m, p.depth), 0);
    return {
      pages,
      discoveredUrls: Array.from(discoveredSet || new Set()),
      state: state || {
        strategy, visited: pages.map(p => p.url), pending: [], depths: {},
        pagesCrawled: pages.length, startedAt: startTime,
      },
      stats: {
        total: pages.length, success, failed, fromCache, retried,
        durationMs: totalMs,
        avgPageMs: pages.length > 0 ? Math.round(totalMs / pages.length) : 0,
        maxDepthReached,
        relevanceScores: relevanceScores.length > 0 ? relevanceScores : undefined,
      },
    };
  }

  // ============== State save/load (localStorage) ==============
  saveStateToStorage(name: string, state: CrawlPageState): void {
    try { localStorage.setItem(`nexusai:crawl-state:${name}`, JSON.stringify(state)); } catch {}
  }
  loadStateFromStorage(name: string): CrawlPageState | null {
    try {
      const raw = localStorage.getItem(`nexusai:crawl-state:${name}`);
      return raw ? JSON.parse(raw) : null;
    } catch { return null; }
  }
  listSavedStates(): string[] {
    const out: string[] = [];
    for (let i = 0; i < localStorage.length; i++) {
      const k = localStorage.key(i);
      if (k && k.startsWith('nexusai:crawl-state:')) out.push(k.replace('nexusai:crawl-state:', ''));
    }
    return out;
  }
  deleteState(name: string): void {
    localStorage.removeItem(`nexusai:crawl-state:${name}`);
  }

  // ============== Clear cache ==============
  clearCache(): void { new CrawlCache().clear(); }
  cacheSize(): number { return new CrawlCache().size(); }
}

export const crawlerService = new CrawlerService();
export { CrawlCache };
export default crawlerService;
