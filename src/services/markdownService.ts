// Markdown Generation & Content Filtering (inspired by Crawl4AI's pipeline)
// Pure browser implementation - no server, no deps.

export interface MarkdownOptions {
  ignoreLinks?: boolean;
  ignoreImages?: boolean;
  bodyWidth?: number;             // 0 = no wrap
  escapeHtml?: boolean;
  skipInternalLinks?: boolean;
  includeSupSub?: boolean;
  markCode?: boolean;
}

export interface PruningFilterOptions {
  threshold?: number;             // 0..1 (or "dynamic")
  thresholdType?: 'fixed' | 'dynamic';
  minWordThreshold?: number;
  // Tag importance weights (override defaults)
  tagWeights?: Record<string, number>;
}

export interface BM25FilterOptions {
  userQuery: string;
  bm25Threshold?: number;         // default 1.0
  k1?: number;                    // default 1.5
  b?: number;                     // default 0.75
  minWordThreshold?: number;
}

export interface CrawlConfig {
  // Content selection
  cssSelector?: string;
  targetElements?: string[];
  wordCountThreshold?: number;
  excludedTags?: string[];
  excludeExternalLinks?: boolean;
  excludeExternalImages?: boolean;
  excludeSocialMediaLinks?: boolean;
  excludeSocialMediaDomains?: string[];
  excludeDomains?: string[];
  // Page cleanup
  processIframes?: boolean;
  removeOverlayElements?: boolean;
  removeConsentPopups?: boolean;
  // Markdown
  markdownOptions?: MarkdownOptions;
  // Filtering pipeline
  pruning?: PruningFilterOptions | false;
  bm25?: BM25FilterOptions | false;
  // Two-pass
  twoPass?: boolean;
}

export interface CrawlLink {
  href: string;
  text: string;
  title?: string;
  baseDomain?: string;
  internal: boolean;
}

export interface CrawlMedia {
  src: string;
  alt?: string;
  desc?: string;
  score?: number;
  type: 'image' | 'video' | 'audio';
  format?: string;
  width?: number;
  height?: number;
}

export interface MarkdownResult {
  raw_markdown: string;
  fit_markdown: string;
  fit_html: string;
  markdown_with_citations: string;
  references_markdown: string;
  internal_links: CrawlLink[];
  external_links: CrawlLink[];
  media: CrawlMedia[];
  metadata: { title?: string; description?: string; lang?: string; canonical?: string };
  stats: {
    rawChars: number;
    fitChars: number;
    blocksTotal: number;
    blocksKept: number;
    bm25Scores?: number[];
    pruningScores?: number[];
  };
}

const DEFAULT_SOCIAL_DOMAINS = [
  'facebook.com', 'twitter.com', 'x.com', 'linkedin.com',
  'instagram.com', 'pinterest.com', 'tiktok.com', 'snapchat.com', 'reddit.com',
  'youtube.com', 'weibo.com', 'douyin.com',
];

const DEFAULT_TAG_WEIGHTS: Record<string, number> = {
  article: 1.0, main: 0.95, section: 0.85, p: 0.7, div: 0.4, li: 0.5, ul: 0.4, ol: 0.4,
  h1: 0.9, h2: 0.85, h3: 0.8, h4: 0.75, h5: 0.7, h6: 0.65,
  aside: -0.5, nav: -0.7, footer: -0.7, header: -0.4,
  form: -0.5, button: -0.4, input: -0.5, select: -0.4, textarea: -0.4,
  sidebar: -0.6, ad: -1.0, ads: -1.0, advertisement: -1.0,
  comment: -0.6, comments: -0.6, share: -0.4, social: -0.4,
};

const NAV_FOOTER_PATTERNS = /^(nav|footer|sidebar|aside|menu|breadcrumb|pagination|share|social|comment|related|recommend|advert|promo|popup|modal|cookie|consent|gdpr|newsletter|subscribe|search)/i;

class MarkdownService {
  private parser = new DOMParser();

  // ========== Main entry: produce MarkdownResult ==========
  async crawl(html: string, baseUrl: string = '', config: CrawlConfig = {}): Promise<MarkdownResult> {
    const opts: Required<MarkdownOptions> = {
      ignoreLinks: false, ignoreImages: false, bodyWidth: 0, escapeHtml: true,
      skipInternalLinks: false, includeSupSub: false, markCode: true,
      ...(config.markdownOptions || {}),
    };

    const doc = this.parser.parseFromString(html, 'text/html');
    const baseEl = doc.querySelector('base[href]');
    const resolvedBase = baseEl ? (baseEl as HTMLBaseElement).href : baseUrl;

    // Step 1: content selection
    this.applyContentSelection(doc, config);

    // Step 2: build cleaned HTML for downstream
    const cleanedHtml = doc.body.innerHTML;

    // Step 3: extract metadata
    const metadata = this.extractMetadata(doc, resolvedBase);

    // Step 4: extract links and media (BEFORE filtering so we keep full context)
    const { internal, external } = this.extractLinks(doc, resolvedBase, config);
    const media = this.extractMedia(doc, resolvedBase, config);

    // Step 5: raw_markdown (full conversion)
    const raw_markdown = this.htmlToMarkdown(doc.body, opts);

    // Step 6: filter pipeline → fit_html
    let fit_html = cleanedHtml;
    let bm25Scores: number[] | undefined;
    let pruningScores: number[] | undefined;

    if (config.pruning !== false) {
      const p = config.pruning || {};
      const filterRes = this.pruneHtml(cleanedHtml, p);
      fit_html = filterRes.html;
      pruningScores = filterRes.scores;
    }

    if (config.bm25 !== false) {
      const b = config.bm25 || { userQuery: '' };
      const filterRes = this.bm25FilterHtml(fit_html, b);
      fit_html = filterRes.html;
      bm25Scores = filterRes.scores;
    } else if (config.twoPass) {
      // Only do BM25 if pruning kept something
      const b: BM25FilterOptions = { userQuery: '' };
      const filterRes = this.bm25FilterHtml(fit_html, b);
      fit_html = filterRes.html;
      bm25Scores = filterRes.scores;
    }

    // Step 7: fit_markdown
    const fitDoc = this.parser.parseFromString(`<div id="__fit__">${fit_html}</div>`, 'text/html');
    const fit_body = fitDoc.getElementById('__fit__') || fitDoc.body;
    const fit_markdown = this.htmlToMarkdown(fit_body, opts);

    // Step 8: citations + references
    const { cited, references } = this.buildCitations(fit_body, opts, internal, external);

    return {
      raw_markdown,
      fit_markdown,
      fit_html,
      markdown_with_citations: cited,
      references_markdown: references,
      internal_links: internal,
      external_links: external,
      media,
      metadata,
      stats: {
        rawChars: raw_markdown.length,
        fitChars: fit_markdown.length,
        blocksTotal: (pruningScores || bm25Scores || []).length,
        blocksKept: (pruningScores || bm25Scores || []).filter(s => s > 0).length,
        bm25Scores,
        pruningScores,
      },
    };
  }

  // ========== Content selection ==========
  private applyContentSelection(doc: Document, config: CrawlConfig) {
    // Remove excluded tags globally
    const excluded = (config.excludedTags || []).map(t => t.toLowerCase());
    for (const tag of excluded) {
      doc.querySelectorAll(tag).forEach(el => el.remove());
    }

    // Remove overlay elements
    if (config.removeOverlayElements) {
      doc.querySelectorAll('[class*="modal" i], [class*="overlay" i], [class*="popup" i], [role="dialog"], [aria-modal="true"]').forEach(el => el.remove());
    }

    // Remove consent popups
    if (config.removeConsentPopups) {
      doc.querySelectorAll('[class*="consent" i], [class*="cookie" i], [id*="onetrust" i], [id*="cookiebot" i], [class*="gdpr" i]').forEach(el => el.remove());
    }

    // Process iframes (inline their textContent as note)
    if (config.processIframes) {
      doc.querySelectorAll('iframe').forEach(el => {
        const note = doc.createElement('div');
        note.setAttribute('data-iframe', el.getAttribute('src') || '');
        note.textContent = `[iframe: ${el.getAttribute('src') || ''}]`;
        el.replaceWith(note);
      });
    }

    // CSS selector / target_elements scoping
    if (config.cssSelector) {
      try {
        const el = doc.querySelector(config.cssSelector);
        if (el) {
          const newBody = doc.createElement('div');
          newBody.appendChild(el.cloneNode(true));
          doc.body.innerHTML = '';
          doc.body.appendChild(newBody);
        }
      } catch {}
    } else if (config.targetElements && config.targetElements.length > 0) {
      const newBody = doc.createElement('div');
      for (const sel of config.targetElements) {
        doc.querySelectorAll(sel).forEach(el => newBody.appendChild(el.cloneNode(true)));
      }
      doc.body.innerHTML = '';
      doc.body.appendChild(newBody);
    }
  }

  // ========== Metadata ==========
  private extractMetadata(doc: Document, baseUrl: string) {
    const get = (sel: string, attr: string = 'content') => doc.querySelector(sel)?.getAttribute(attr) || undefined;
    const og = (k: string) => doc.querySelector(`meta[property="og:${k}"]`)?.getAttribute('content') || undefined;
    const title = doc.querySelector('title')?.textContent || og('title') || undefined;
    const description = get('meta[name="description"]') || og('description');
    const lang = doc.documentElement.getAttribute('lang') || undefined;
    const canonical = doc.querySelector('link[rel="canonical"]')?.getAttribute('href');
    return { title, description, lang, canonical };
  }

  // ========== Links ==========
  private extractLinks(doc: Document, baseUrl: string, config: CrawlConfig): { internal: CrawlLink[]; external: CrawlLink[] } {
    const baseDomain = this.safeDomain(baseUrl);
    const socialDomains = new Set([...DEFAULT_SOCIAL_DOMAINS, ...(config.excludeSocialMediaDomains || [])].map(d => d.toLowerCase()));
    const blockedDomains = new Set((config.excludeDomains || []).map(d => d.toLowerCase()));
    const internal: CrawlLink[] = [];
    const external: CrawlLink[] = [];

    doc.querySelectorAll('a[href]').forEach(a => {
      const href = a.getAttribute('href') || '';
      if (!href || href.startsWith('javascript:') || href.startsWith('mailto:') || href.startsWith('tel:') || href.startsWith('#')) return;
      let abs: string;
      try { abs = new URL(href, baseUrl).toString(); } catch { return; }
      const domain = this.safeDomain(abs);
      const isInternal = !baseDomain || domain === baseDomain || domain.endsWith('.' + baseDomain);
      const link: CrawlLink = {
        href: abs, text: (a.textContent || '').trim().slice(0, 200), baseDomain: domain, internal: isInternal,
        title: a.getAttribute('title') || undefined,
      };
      if (config.excludeSocialMediaLinks && domain && socialDomains.has(domain)) return;
      if (config.excludeDomains && domain && blockedDomains.has(domain)) return;
      if (!isInternal && config.excludeExternalLinks) return;
      (isInternal ? internal : external).push(link);
    });

    return { internal, external };
  }

  // ========== Media ==========
  private extractMedia(doc: Document, baseUrl: string, config: CrawlConfig): CrawlMedia[] {
    const baseDomain = this.safeDomain(baseUrl);
    const out: CrawlMedia[] = [];
    doc.querySelectorAll('img').forEach(img => {
      const src = img.getAttribute('src') || img.getAttribute('data-src') || '';
      if (!src) return;
      let abs: string; try { abs = new URL(src, baseUrl).toString(); } catch { return; }
      const domain = this.safeDomain(abs);
      if (config.excludeExternalImages && baseDomain && domain !== baseDomain && !domain.endsWith('.' + baseDomain)) return;
      out.push({
        src: abs, alt: img.getAttribute('alt') || undefined,
        desc: (img.getAttribute('alt') || img.getAttribute('title') || '').slice(0, 200),
        type: 'image', format: (abs.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)?.[1] || '').toLowerCase() || undefined,
        width: img.naturalWidth || parseInt(img.getAttribute('width') || '0') || undefined,
        height: img.naturalHeight || parseInt(img.getAttribute('height') || '0') || undefined,
      });
    });
    doc.querySelectorAll('video, audio').forEach(m => {
      const src = m.getAttribute('src') || m.querySelector('source')?.getAttribute('src') || '';
      if (!src) return;
      let abs: string; try { abs = new URL(src, baseUrl).toString(); } catch { return; }
      out.push({ src: abs, type: m.tagName.toLowerCase() as 'video' | 'audio' });
    });
    return out;
  }

  // ========== HTML to Markdown ==========
  htmlToMarkdown(root: HTMLElement, opts: Required<MarkdownOptions> = {
    ignoreLinks: false, ignoreImages: false, bodyWidth: 0, escapeHtml: true,
    skipInternalLinks: false, includeSupSub: false, markCode: true,
  }): string {
    const out: string[] = [];
    this.walk(root, opts, out, { listDepth: 0, inCode: false, inPre: false });
    let text = out.join('').replace(/\n{3,}/g, '\n\n').trim();

    if (opts.bodyWidth && opts.bodyWidth > 0) {
      text = this.wrapText(text, opts.bodyWidth);
    }
    return text;
  }

  private walk(node: Node, opts: Required<MarkdownOptions>, out: string[], ctx: { listDepth: number; inCode: boolean; inPre: boolean }) {
    if (node.nodeType === Node.TEXT_NODE) {
      const txt = node.textContent || '';
      out.push(ctx.inCode ? txt : this.escape(txt, opts.escapeHtml));
      return;
    }
    if (node.nodeType !== Node.ELEMENT_NODE) return;
    const el = node as HTMLElement;
    const tag = el.tagName.toLowerCase();

    // Skip noise
    if (['script', 'style', 'noscript', 'iframe', 'object', 'embed'].includes(tag)) return;

    // Code blocks
    if (tag === 'pre' || tag === 'code') {
      const wasInCode = ctx.inCode;
      ctx.inCode = true;
      const text = el.textContent || '';
      if (tag === 'pre') {
        out.push('\n```\n' + text.replace(/\n+$/, '') + '\n```\n');
      } else if (!ctx.inPre) {
        out.push('`' + text + '`');
      } else {
        out.push(text);
      }
      ctx.inCode = wasInCode;
      return;
    }
    if (ctx.inPre) {
      el.childNodes.forEach(c => this.walk(c, opts, out, ctx));
      return;
    }

    switch (tag) {
      case 'h1': out.push('\n\n# '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'h2': out.push('\n\n## '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'h3': out.push('\n\n### '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'h4': out.push('\n\n#### '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'h5': out.push('\n\n##### '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'h6': out.push('\n\n###### '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'p': out.push('\n\n'); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'br': out.push('  \n'); return;
      case 'hr': out.push('\n\n---\n\n'); return;
      case 'blockquote': out.push('\n\n> '); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('\n\n'); return;
      case 'strong': case 'b': out.push('**'); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('**'); return;
      case 'em': case 'i': out.push('*'); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('*'); return;
      case 'del': case 's': case 'strike': out.push('~~'); el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); out.push('~~'); return;
      case 'a': {
        if (opts.ignoreLinks) { el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); return; }
        const href = el.getAttribute('href') || '';
        if (opts.skipInternalLinks && (href.startsWith('#') || href.startsWith('javascript:'))) {
          el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); return;
        }
        out.push('[');
        el.childNodes.forEach(c => this.walk(c, opts, out, ctx));
        out.push(`](${href})`);
        return;
      }
      case 'img': {
        if (opts.ignoreImages) return;
        const src = el.getAttribute('src') || '';
        const alt = el.getAttribute('alt') || '';
        out.push(`![${alt}](${src})`);
        return;
      }
      case 'ul': case 'ol': {
        ctx.listDepth++;
        out.push('\n');
        let i = 1;
        el.childNodes.forEach(c => {
          if ((c as HTMLElement).tagName?.toLowerCase() === 'li') {
            const prefix = tag === 'ul' ? '- ' : `${i++}. `;
            out.push('\n' + prefix);
            this.walk(c, opts, out, ctx);
          }
        });
        ctx.listDepth--;
        out.push('\n');
        return;
      }
      case 'li': el.childNodes.forEach(c => this.walk(c, opts, out, ctx)); return;
      case 'table': {
        out.push('\n\n');
        const rows: string[][] = [];
        el.querySelectorAll('tr').forEach(tr => {
          const cells: string[] = [];
          tr.querySelectorAll('th, td').forEach(c => cells.push((c.textContent || '').trim().replace(/\|/g, '\\|')));
          if (cells.length > 0) rows.push(cells);
        });
        if (rows.length > 0) {
          const cols = Math.max(...rows.map(r => r.length));
          out.push('| ' + rows[0].map(c => c || ' ').join(' | ') + ' |\n');
          out.push('|' + Array(cols).fill(' --- ').join('|') + '|\n');
          for (let i = 1; i < rows.length; i++) {
            out.push('| ' + rows[i].map(c => c || ' ').join(' | ') + ' |\n');
          }
        }
        out.push('\n');
        return;
      }
      case 'div': case 'section': case 'article': case 'main': case 'aside': case 'header': case 'footer': case 'nav': {
        el.childNodes.forEach(c => this.walk(c, opts, out, ctx));
        return;
      }
      default: el.childNodes.forEach(c => this.walk(c, opts, out, ctx));
    }
  }

  private escape(s: string, doEscape: boolean): string {
    if (!doEscape) return s;
    return s.replace(/[\\`*_{}[\]()#+\-.!]/g, ch => '\\' + ch);
  }

  private wrapText(text: string, width: number): string {
    const lines = text.split('\n');
    const wrapped: string[] = [];
    for (const line of lines) {
      if (line.length <= width || line.startsWith('#') || line.startsWith('|') || line.startsWith('>') || line.startsWith('-') || /^\d+\./.test(line) || line.startsWith('```')) {
        wrapped.push(line); continue;
      }
      const words = line.split(/\s+/);
      let cur = '';
      for (const w of words) {
        if (cur && (cur.length + 1 + w.length) > width) { wrapped.push(cur); cur = w; }
        else cur = cur ? cur + ' ' + w : w;
      }
      if (cur) wrapped.push(cur);
    }
    return wrapped.join('\n');
  }

  // ========== Citations ==========
  private buildCitations(root: HTMLElement, opts: Required<MarkdownOptions>, internal: CrawlLink[], external: CrawlLink[]): { cited: string; references: string } {
    const refs: string[] = [];
    const ownerDoc = root.ownerDocument;
    const clone = root.cloneNode(true) as HTMLElement;
    clone.querySelectorAll('a[href]').forEach(a => {
      if (opts.ignoreLinks) return;
      const href = a.getAttribute('href') || '';
      const idx = refs.length + 1;
      refs.push(`[${idx}]: ${href}`);
      const replacement = ownerDoc.createTextNode(`[${(a.textContent || '').trim()}][${idx}]`);
      a.replaceWith(replacement);
    });
    const cited = this.htmlToMarkdown(clone, opts);
    return { cited, references: refs.join('\n') };
  }

  // ========== Pruning filter ==========
  pruneHtml(html: string, opts: PruningFilterOptions = {}): { html: string; scores: number[]; kept: number; total: number } {
    const threshold = opts.threshold ?? 0.48;
    const minWords = opts.minWordThreshold ?? 5;
    const weights = { ...DEFAULT_TAG_WEIGHTS, ...(opts.tagWeights || {}) };
    const doc = this.parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
    const root = doc.getElementById('__root__')!;
    const blocks: HTMLElement[] = [];
    root.querySelectorAll('p, div, article, section, li, blockquote, pre, h1, h2, h3, h4, h5, h6, td, main').forEach(el => {
      if (!el.parentElement || (el.parentElement.closest('#__root__') === root && el.children.length === 0)) blocks.push(el);
    });
    // Dedupe: keep only leaf-ish blocks
    const unique = blocks.filter(b => !blocks.some(o => o !== b && b.contains(o)));

    const scores: number[] = [];
    const toRemove: HTMLElement[] = [];
    for (const b of unique) {
      const text = (b.textContent || '').trim();
      const wordCount = text.split(/\s+/).filter(Boolean).length;
      if (wordCount < minWords) { scores.push(0); toRemove.push(b); continue; }
      const innerHtml = b.innerHTML;
      const linkChars = (innerHtml.match(/<a\b[^>]*>([\s\S]*?)<\/a>/gi) || []).join('').length;
      const textChars = text.length;
      const textDensity = textChars / Math.max(innerHtml.length, 1);
      const linkDensity = linkChars / Math.max(textChars, 1);
      const tagName = b.tagName.toLowerCase();
      const classId = ((b.getAttribute('class') || '') + ' ' + (b.getAttribute('id') || '')).toLowerCase();
      let tagWeight = weights[tagName] ?? 0.4;
      if (NAV_FOOTER_PATTERNS.test(classId)) tagWeight -= 0.6;
      const score = 0.5 * textDensity + 0.3 * (1 - Math.min(linkDensity, 1)) + 0.2 * Math.max(0, Math.min(tagWeight, 1));
      scores.push(score);
      if (opts.thresholdType === 'dynamic') {
        // dynamic: relative to global mean
        // (deferred: simple fixed is fine for now)
        if (score < threshold) toRemove.push(b);
      } else {
        if (score < threshold) toRemove.push(b);
      }
    }
    toRemove.forEach(el => el.remove());
    return { html: root.innerHTML, scores, kept: unique.length - toRemove.length, total: unique.length };
  }

  // ========== BM25 filter ==========
  bm25FilterHtml(html: string, opts: BM25FilterOptions): { html: string; scores: number[]; kept: number; total: number } {
    const k1 = opts.k1 ?? 1.5;
    const b = opts.b ?? 0.75;
    const threshold = opts.bm25Threshold ?? 1.0;
    const minWords = opts.minWordThreshold ?? 5;

    const doc = this.parser.parseFromString(`<div id="__root__">${html}</div>`, 'text/html');
    const root = doc.getElementById('__root__')!;
    const blocks: HTMLElement[] = [];
    root.querySelectorAll('p, div, article, section, li, blockquote, pre, h1, h2, h3, h4, h5, h6, td').forEach(el => {
      if (el.closest('#__root__') === root || el.parentElement === root) blocks.push(el);
    });
    const unique = blocks.filter(x => !blocks.some(o => o !== x && x.contains(o)));

    if (unique.length === 0) return { html: root.innerHTML, scores: [], kept: 0, total: 0 };

    const tokenize = (t: string) => t.toLowerCase().replace(/[^\p{L}\p{N}\s]/gu, ' ').split(/\s+/).filter(w => w.length > 1);
    const queryTokens = tokenize(opts.userQuery || '');
    if (queryTokens.length === 0) {
      // No query → fall back to first N blocks by length (preserve structure)
      return { html: root.innerHTML, scores: unique.map(() => 1), kept: unique.length, total: unique.length };
    }

    // Build corpus: each block's text
    const blockTexts = unique.map(el => (el.textContent || '').trim());
    const blockWords = blockTexts.map(tokenize);
    const N = unique.length;
    const avgdl = blockWords.reduce((s, w) => s + w.length, 0) / N;

    // Document frequency
    const df: Record<string, number> = {};
    for (const words of blockWords) {
      const seen = new Set(words);
      for (const w of seen) df[w] = (df[w] || 0) + 1;
    }
    const idf = (term: string) => Math.log(1 + (N - df[term] + 0.5) / (df[term] + 0.5));

    const scores: number[] = [];
    const toRemove: HTMLElement[] = [];
    for (let i = 0; i < unique.length; i++) {
      const words = blockWords[i];
      if (words.length < minWords) { scores.push(0); toRemove.push(unique[i]); continue; }
      const tf: Record<string, number> = {};
      for (const w of words) tf[w] = (tf[w] || 0) + 1;
      let s = 0;
      for (const q of queryTokens) {
        const f = tf[q] || 0;
        if (f === 0) continue;
        const norm = f * (k1 + 1) / (f + k1 * (1 - b + b * words.length / avgdl));
        s += idf(q) * norm;
      }
      scores.push(s);
      if (s < threshold) toRemove.push(unique[i]);
    }
    toRemove.forEach(el => el.remove());
    return { html: root.innerHTML, scores, kept: unique.length - toRemove.length, total: unique.length };
  }

  // ========== Utils ==========
  private safeDomain(url: string): string {
    try { return new URL(url).hostname.toLowerCase().replace(/^www\./, ''); }
    catch { return ''; }
  }
}

export const markdownService = new MarkdownService();
export default markdownService;
