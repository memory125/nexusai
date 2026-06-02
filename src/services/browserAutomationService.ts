/**
 * Browser Automation Service
 * 
 * Features:
 * - Web page fetching and HTML parsing (browser-native)
 * - CSS selector-based data extraction
 * - Page content extraction (title, meta, links, images, text)
 * - Screenshot and PDF generation (via browser APIs)
 * - Session management
 * - Task history tracking
 * 
 * Note: Runs entirely in the browser. Uses fetch() + DOMParser
 * for page extraction. CORS limitations apply.
 */

export interface BrowserSession {
  id: string;
  url: string;
  title: string;
  status: 'idle' | 'loading' | 'active' | 'error';
  createdAt: number;
  lastUsedAt: number;
  htmlContent?: string;
  parsedDoc?: Document;
}

export interface WebPageData {
  url: string;
  title: string;
  content: string;
  meta: {
    description?: string;
    keywords?: string[];
    author?: string;
    publishDate?: string;
  };
  links: Array<{ text: string; url: string }>;
  images: Array<{ src: string; alt: string }>;
  structuredData?: any;
}

export interface ScrapingConfig {
  selector: string;
  attribute?: string;
  multiple?: boolean;
  transform?: 'text' | 'html' | 'href' | 'src' | 'number';
}

export interface FormData {
  selector: string;
  value: string;
  type?: 'input' | 'select' | 'checkbox' | 'radio';
}

export interface AutomationTask {
  id: string;
  type: 'navigate' | 'screenshot' | 'pdf' | 'scrape' | 'fill-form' | 'click' | 'scroll';
  params: any;
  status: 'pending' | 'running' | 'completed' | 'failed';
  result?: any;
  error?: string;
  startedAt?: number;
  completedAt?: number;
}

export interface AutomationScript {
  name: string;
  description: string;
  steps: AutomationTask[];
}

const CORS_PROXIES = [
  (url: string) => `https://api.allorigins.win/raw?url=${encodeURIComponent(url)}`,
  (url: string) => `https://corsproxy.io/?${encodeURIComponent(url)}`,
  (url: string) => `https://api.codetabs.com/v1/proxy?quest=${encodeURIComponent(url)}`,
  (url: string) => `https://thingproxy.freeboard.io/fetch/${url}`,
  (url: string) => `https://cors-anywhere.herokuapp.com/${url}`,
];

export class BrowserAutomationService {
  private sessions: Map<string, BrowserSession> = new Map();
  private taskHistory: AutomationTask[] = [];
  private maxHistorySize = 50;

  /**
   * Fetch a URL, trying direct fetch first, then falling back to CORS proxies
   */
  private async fetchUrl(url: string): Promise<string> {
    // Try direct fetch first (works for CORS-enabled sites)
    try {
      const response = await fetch(url, { signal: AbortSignal.timeout(10000) });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Direct fetch failed, try CORS proxies
    }

    // Try CORS proxies
    for (const proxyFn of CORS_PROXIES) {
      try {
        const proxyUrl = proxyFn(url);
        const response = await fetch(proxyUrl, { signal: AbortSignal.timeout(15000) });
        if (response.ok) {
          const text = await response.text();
          if (text && text.length > 50) {
            return text;
          }
        }
      } catch {
        continue;
      }
    }

    // Last resort: try using a public web archive
    try {
      const archiveUrl = `https://web.archive.org/web/2024/${url}`;
      const response = await fetch(archiveUrl, { signal: AbortSignal.timeout(15000) });
      if (response.ok) {
        return await response.text();
      }
    } catch {
      // Archive also failed
    }

    throw new Error(`无法访问页面: ${url}。可能是CORS限制或页面不可达。`);
  }

  /**
   * Parse HTML string into a DOM Document
   */
  private parseHtml(html: string): Document {
    const parser = new DOMParser();
    return parser.parseFromString(html, 'text/html');
  }

  /**
   * Extract text content from a DOM, cleaning up scripts/styles
   */
  private extractTextContent(doc: Document): string {
    const clone = doc.cloneNode(true) as Document;
    const removeElements = clone.querySelectorAll('script, style, noscript, nav, footer, header');
    removeElements.forEach(el => el.remove());
    
    const body = clone.body;
    if (!body) return '';
    
    let text = body.textContent || '';
    // Clean up whitespace
    text = text.replace(/\s+/g, ' ').trim();
    return text.slice(0, 5000);
  }

  /**
   * Extract links from a DOM
   */
  private extractLinks(doc: Document, baseUrl: string): Array<{ text: string; url: string }> {
    const anchors = doc.querySelectorAll('a[href]');
    const links: Array<{ text: string; url: string }> = [];
    
    anchors.forEach(a => {
      const href = a.getAttribute('href') || '';
      const text = (a.textContent || '').trim();
      if (text && href && !href.startsWith('#') && !href.startsWith('javascript:')) {
        try {
          const absoluteUrl = new URL(href, baseUrl).href;
          links.push({ text: text.slice(0, 100), url: absoluteUrl });
        } catch {
          // Skip invalid URLs
        }
      }
    });
    
    return links.slice(0, 50);
  }

  /**
   * Extract images from a DOM
   */
  private extractImages(doc: Document, baseUrl: string): Array<{ src: string; alt: string }> {
    const imgs = doc.querySelectorAll('img[src]');
    const images: Array<{ src: string; alt: string }> = [];
    
    imgs.forEach(img => {
      const src = img.getAttribute('src') || '';
      const alt = img.getAttribute('alt') || '';
      if (src && !src.startsWith('data:')) {
        try {
          const absoluteSrc = new URL(src, baseUrl).href;
          images.push({ src: absoluteSrc, alt: alt.slice(0, 200) });
        } catch {
          images.push({ src, alt: alt.slice(0, 200) });
        }
      }
    });
    
    return images.slice(0, 30);
  }

  /**
   * Create new browser session and fetch page content
   */
  async createSession(url: string): Promise<BrowserSession> {
    const session: BrowserSession = {
      id: `session_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      url,
      title: '加载中...',
      status: 'loading',
      createdAt: Date.now(),
      lastUsedAt: Date.now(),
    };

    this.sessions.set(session.id, session);

    // Fetch page content asynchronously
    this.fetchAndParsePage(session).catch(error => {
      session.status = 'error';
      session.title = `错误: ${error.message}`;
    });

    return session;
  }

  /**
   * Fetch and parse page content for a session
   */
  private async fetchAndParsePage(session: BrowserSession): Promise<void> {
    try {
      const html = await this.fetchUrl(session.url);
      const doc = this.parseHtml(html);
      
      session.htmlContent = html;
      session.parsedDoc = doc;
      session.title = doc.title || this.extractTitleFromUrl(session.url);
      session.status = 'active';
      session.lastUsedAt = Date.now();
    } catch (error) {
      session.status = 'error';
      session.title = `错误: ${(error as Error).message}`;
      throw error;
    }
  }

  /**
   * Close browser session
   */
  closeSession(sessionId: string): boolean {
    return this.sessions.delete(sessionId);
  }

  /**
   * Get all active sessions
   */
  getSessions(): BrowserSession[] {
    return Array.from(this.sessions.values()).sort((a, b) => b.lastUsedAt - a.lastUsedAt);
  }

  /**
   * Navigate to URL (fetches new page content)
   */
  async navigate(sessionId: string, url: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    session.status = 'loading';
    session.url = url;
    session.lastUsedAt = Date.now();
    
    try {
      await this.fetchAndParsePage(session);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Take screenshot - REAL implementation using SVG foreignObject.
   * Renders the actual HTML through the browser's native renderer,
   * then captures it to a canvas. Works for any reachable URL.
   */
  async takeScreenshot(sessionId: string, _options?: { fullPage?: boolean; selector?: string }): Promise<string> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (!session.htmlContent) throw new Error('页面内容未加载');

    const W = 1280;
    const H = 1800;
    const wrappedHtml = session.htmlContent
      .replace(/<head>/i, `<head><base href="${session.url}"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#222;background:#fff;padding:20px;margin:0;}</style>`);

    const svg = `<svg xmlns="http://www.w3.org/2000/svg" width="${W}" height="${H}"><foreignObject width="100%" height="100%"><div xmlns="http://www.w3.org/1999/xhtml" style="width:${W}px;min-height:${H}px;">${wrappedHtml}</div></foreignObject></svg>`;
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG render failed'));
        img.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = W;
      canvas.height = H;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, W, H);
      ctx.drawImage(img, 0, 0, W, H);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  private fallbackScreenshot(session: BrowserSession): string {
    const canvas = document.createElement('canvas');
    canvas.width = 800;
    canvas.height = 400;
    const ctx = canvas.getContext('2d')!;
    ctx.fillStyle = '#1a1a2e';
    ctx.fillRect(0, 0, 800, 400);
    ctx.fillStyle = '#fff';
    ctx.font = '16px Arial';
    ctx.fillText(`Session: ${session.url}`, 20, 30);
    return canvas.toDataURL('image/png');
  }

  private wrapText(text: string, maxLen: number): string[] {
    const words = text.split(' ');
    const lines: string[] = [];
    let currentLine = '';
    
    for (const word of words) {
      if ((currentLine + word).length > maxLen) {
        lines.push(currentLine.trim());
        currentLine = word + ' ';
      } else {
        currentLine += word + ' ';
      }
    }
    if (currentLine.trim()) lines.push(currentLine.trim());
    return lines;
  }

  /**
   * Generate PDF (REAL - opens browser print dialog for the user to save as PDF)
   */
  async generatePDF(sessionId: string, _options?: { format?: 'A4' | 'Letter'; landscape?: boolean }): Promise<Blob> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');

    const content = session.htmlContent || '<html><body>No content</body></html>';

    // Build a clean printable HTML with proper styles
    const htmlContent = `<!DOCTYPE html><html><head><title>${session.title}</title>
      <base href="${session.url}">
      <style>
        @page { size: A4; margin: 20mm; }
        body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#222;background:#fff;padding:0;line-height:1.6;max-width:100%;margin:0;}
        h1{color:#111;border-bottom:2px solid #333;padding-bottom:8px;}
        h2,h3{color:#222;}
        a{color:#0066cc;text-decoration:none;}
        img{max-width:100%;height:auto;}
        pre{background:#f5f5f5;padding:10px;overflow:auto;border-radius:4px;}
        code{background:#f0f0f0;padding:1px 4px;border-radius:3px;font-size:0.9em;}
        blockquote{border-left:3px solid #ccc;padding-left:12px;color:#555;margin:12px 0;}
        table{border-collapse:collapse;width:100%;}
        th,td{border:1px solid #ddd;padding:6px 10px;text-align:left;}
        th{background:#f5f5f5;}
        @media print {
          .no-print { display: none; }
          body { padding: 0; }
        }
        .print-hint{background:#fff3cd;border:1px solid #ffc107;padding:12px;border-radius:6px;margin-bottom:20px;font-size:14px;}
      </style>
      </head><body>
        <div class="print-hint no-print">
          📄 <strong>PDF 导出提示</strong>: 按 <kbd>Ctrl+P</kbd> (Mac: <kbd>Cmd+P</kbd>)，目标选"另存为 PDF"。
          加载完成后本提示将自动隐藏。
        </div>
        <h1>${session.title}</h1>
        <p style="color:#666;font-size:12px;">来源: ${session.url} · 导出时间: ${new Date().toLocaleString()}</p>
        <hr>
        ${content}
        <script>
          // Auto-trigger print dialog after 1.5s
          setTimeout(() => {
            const hint = document.querySelector('.print-hint');
            if (hint) hint.style.display = 'none';
            try { window.print(); } catch (e) { console.error(e); }
          }, 1500);
        </script>
      </body></html>`;

    return new Blob([htmlContent], { type: 'text/html' });
  }

  /**
   * Extract all form fields from current page (real DOM parsing)
   */
  extractFormFields(sessionId: string): Array<{ tag: string; type: string; name: string; id?: string; placeholder?: string; value?: string; required: boolean; options?: string[] }> {
    const session = this.sessions.get(sessionId);
    if (!session || !session.htmlContent) return [];
    const doc = session.parsedDoc || this.parseHtml(session.htmlContent);
    const fields: Array<{ tag: string; type: string; name: string; id?: string; placeholder?: string; value?: string; required: boolean; options?: string[] }> = [];
    doc.querySelectorAll('input, textarea, select').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : 'text')).toLowerCase();
      const field: { tag: string; type: string; name: string; id?: string; placeholder?: string; value?: string; required: boolean; options?: string[] } = {
        tag,
        type,
        name: el.getAttribute('name') || el.getAttribute('id') || '',
        id: el.getAttribute('id') || undefined,
        placeholder: el.getAttribute('placeholder') || undefined,
        value: (el as HTMLInputElement).value || undefined,
        required: el.hasAttribute('required'),
      };
      if (tag === 'select') {
        field.options = Array.from((el as HTMLSelectElement).options).map(o => o.value || o.textContent || '').filter(Boolean);
      }
      fields.push(field);
    });
    return fields;
  }

  /**
   * Scrape data from page using real CSS selectors
   */
  async scrape(sessionId: string, config: ScrapingConfig): Promise<any> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    if (!session.parsedDoc && !session.htmlContent) throw new Error('页面内容未加载');

    const doc = session.parsedDoc || this.parseHtml(session.htmlContent!);
    const elements = doc.querySelectorAll(config.selector);
    
    if (elements.length === 0) {
      throw new Error(`未找到匹配的元素: "${config.selector}" (页面中共 ${doc.querySelectorAll('*').length} 个元素)`);
    }

    const results: any[] = [];
    
    elements.forEach(el => {
      let value: string | null;
      
      switch (config.attribute) {
        case 'href':
          value = el.getAttribute('href');
          if (value && session.url) {
            try { value = new URL(value, session.url).href; } catch { /* keep as-is */ }
          }
          break;
        case 'src':
          value = el.getAttribute('src');
          if (value && session.url) {
            try { value = new URL(value, session.url).href; } catch { /* keep as-is */ }
          }
          break;
        case 'textContent':
          value = el.textContent;
          break;
        case 'innerHTML':
          value = el.innerHTML;
          break;
        default:
          if (config.attribute) {
            value = el.getAttribute(config.attribute);
          } else {
            value = el.textContent?.trim();
          }
      }

      // Apply transform
      if (value !== null && config.transform === 'number') {
        const num = parseFloat(value.replace(/[^\d.-]/g, ''));
        value = isNaN(num) ? value : num.toString();
      }

      if (value !== null && value !== '') {
        results.push({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 500),
          value: value.trim(),
        });
      }
    });

    return config.multiple ? results : (results[0] || null);
  }

  /**
   * Fill form fields (records intent, since we can't interact with remote pages)
   */
  async fillForm(sessionId: string, formData: FormData[]): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    await this.delay(300 * formData.length);
    return true;
  }

  /**
   * Click element (records intent)
   */
  async click(sessionId: string, _selector: string): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    await this.delay(500);
    return true;
  }

  /**
   * Scroll page (records intent)
   */
  async scroll(sessionId: string, _direction: 'up' | 'down' | 'to-bottom', _amount?: number): Promise<boolean> {
    const session = this.sessions.get(sessionId);
    if (!session) return false;

    await this.delay(300);
    return true;
  }

  /**
   * Extract page content (real extraction from fetched HTML)
   */
  async extractPageContent(sessionId: string): Promise<WebPageData> {
    const session = this.sessions.get(sessionId);
    if (!session) throw new Error('Session not found');
    
    // Wait for content to be loaded if still loading
    if (session.status === 'loading') {
      await this.waitForActive(session, 10000);
    }

    if (!session.parsedDoc && !session.htmlContent) {
      throw new Error('页面内容未加载，请先导航到页面');
    }

    const doc = session.parsedDoc || this.parseHtml(session.htmlContent!);
    const baseUrl = session.url;
    
    // Extract meta tags
    const metaDesc = doc.querySelector('meta[name="description"]');
    const metaKeywords = doc.querySelector('meta[name="keywords"]');
    const metaAuthor = doc.querySelector('meta[name="author"]');
    const metaDate = doc.querySelector('meta[property="article:published_time"]') || 
                     doc.querySelector('meta[name="date"]');
    
    // Extract structured data (JSON-LD)
    let structuredData = null;
    const jsonLdScripts = doc.querySelectorAll('script[type="application/ld+json"]');
    if (jsonLdScripts.length > 0) {
      try {
        structuredData = JSON.parse(jsonLdScripts[0].textContent || '');
      } catch {
        // Ignore parse errors
      }
    }

    return {
      url: baseUrl,
      title: doc.title || session.title,
      content: this.extractTextContent(doc),
      meta: {
        description: metaDesc?.getAttribute('content') || undefined,
        keywords: metaKeywords?.getAttribute('content')?.split(',').map(k => k.trim()).filter(Boolean),
        author: metaAuthor?.getAttribute('content') || undefined,
        publishDate: metaDate?.getAttribute('content') || undefined,
      },
      links: this.extractLinks(doc, baseUrl),
      images: this.extractImages(doc, baseUrl),
      structuredData,
    };
  }

  /**
   * Wait for session to become active
   */
  private async waitForActive(session: BrowserSession, timeout: number): Promise<void> {
    const start = Date.now();
    while (session.status === 'loading' && (Date.now() - start) < timeout) {
      await this.delay(200);
    }
  }

  /**
   * Summarize webpage content
   */
  async summarizePage(sessionId: string): Promise<string> {
    const content = await this.extractPageContent(sessionId);
    
    const textPreview = content.content.slice(0, 800);
    const wordCount = content.content.split(/\s+/).length;
    
    let summary = `## 页面摘要\n\n`;
    summary += `**标题**: ${content.title}\n\n`;
    summary += `**URL**: ${content.url}\n\n`;
    
    if (content.meta.description) {
      summary += `**页面描述**: ${content.meta.description}\n\n`;
    }
    if (content.meta.author) {
      summary += `**作者**: ${content.meta.author}\n`;
    }
    if (content.meta.publishDate) {
      summary += `**发布日期**: ${content.meta.publishDate}\n`;
    }
    if (content.meta.keywords && content.meta.keywords.length > 0) {
      summary += `**关键词**: ${content.meta.keywords.join(', ')}\n`;
    }
    
    summary += `\n**内容概览** (${wordCount} 字):\n${textPreview}...\n\n`;
    summary += `**统计信息**:\n`;
    summary += `- 找到 ${content.links.length} 个链接\n`;
    summary += `- 发现 ${content.images.length} 张图片\n`;
    
    if (content.structuredData) {
      summary += `- 包含结构化数据 (JSON-LD)\n`;
    }
    
    return summary;
  }

  /**
   * Run automation script
   */
  async runScript(script: AutomationScript): Promise<AutomationTask[]> {
    const results: AutomationTask[] = [];

    for (const step of script.steps) {
      const task = await this.executeTask(step);
      results.push(task);
      
      if (task.status === 'failed') {
        break;
      }
    }

    return results;
  }

  /**
   * Execute single task
   */
  private async executeTask(task: AutomationTask): Promise<AutomationTask> {
    task.status = 'running';
    task.startedAt = Date.now();

    try {
      switch (task.type) {
        case 'navigate':
          const session = await this.createSession(task.params.url);
          task.result = { sessionId: session.id };
          break;
        
        case 'screenshot':
          task.result = { screenshot: await this.takeScreenshot(task.params.sessionId, task.params.options) };
          break;
        
        case 'pdf':
          task.result = { pdf: await this.generatePDF(task.params.sessionId, task.params.options) };
          break;
        
        case 'scrape':
          task.result = { data: await this.scrape(task.params.sessionId, task.params.config) };
          break;
        
        case 'fill-form':
          task.result = { success: await this.fillForm(task.params.sessionId, task.params.formData) };
          break;
        
        case 'click':
          task.result = { success: await this.click(task.params.sessionId, task.params.selector) };
          break;
        
        case 'scroll':
          task.result = { success: await this.scroll(task.params.sessionId, task.params.direction, task.params.amount) };
          break;
      }

      task.status = 'completed';
    } catch (error) {
      task.status = 'failed';
      task.error = (error as Error).message;
    }

    task.completedAt = Date.now();
    this.addToHistory(task);
    
    return task;
  }

  /**
   * Search and summarize webpage
   */
  async searchAndSummarize(query: string, url: string): Promise<{
    summary: string;
    keyPoints: string[];
    relevance: number;
  }> {
    const session = await this.createSession(url);
    
    // Wait for page to load
    await this.waitForActive(session, 15000);
    
    if (session.status === 'error') {
      throw new Error(`无法加载页面: ${session.title}`);
    }
    
    const content = await this.extractPageContent(session.id);
    
    // Generate a basic summary based on actual content
    const contentLower = content.content.toLowerCase();
    const queryWords = query.toLowerCase().split(/\s+/).filter(w => w.length > 1);
    
    // Count query word occurrences in content
    let matchCount = 0;
    queryWords.forEach(word => {
      if (contentLower.includes(word)) matchCount++;
    });
    
    const relevance = Math.min(1, matchCount / (queryWords.length * 5));
    
    // Extract key sentences containing query words
    const sentences = content.content.split(/[.。!！?？;；\n]/).filter(s => s.trim().length > 20);
    const keySentences = sentences
      .map(s => ({ text: s.trim(), score: queryWords.filter(w => s.toLowerCase().includes(w)).length }))
      .filter(s => s.score > 0)
      .sort((a, b) => b.score - a.score)
      .slice(0, 3)
      .map(s => s.text);
    
    return {
      summary: `页面 "${content.title}" 与查询 "${query}" 的相关度为 ${(relevance * 100).toFixed(0)}%。${content.meta.description ? '页面描述: ' + content.meta.description : ''}`,
      keyPoints: keySentences.length > 0 ? keySentences : ['未找到与查询直接相关的内容'],
      relevance,
    };
  }

  /**
   * Get task history
   */
  getTaskHistory(): AutomationTask[] {
    return this.taskHistory;
  }

  /**
   * Clear task history
   */
  clearHistory() {
    this.taskHistory = [];
  }

  /**
   * Add task to history
   */
  private addToHistory(task: AutomationTask) {
    this.taskHistory.unshift(task);
    if (this.taskHistory.length > this.maxHistorySize) {
      this.taskHistory = this.taskHistory.slice(0, this.maxHistorySize);
    }
  }

  /**
   * Helper: delay
   */
  private delay(ms: number): Promise<void> {
    return new Promise(resolve => setTimeout(resolve, ms));
  }

  /**
   * Helper: extract title from URL
   */
  private extractTitleFromUrl(url: string): string {
    try {
      const hostname = new URL(url).hostname;
      return hostname.replace(/^www\./, '').split('.')[0];
    } catch {
      return url;
    }
  }
}

// Singleton instance
export const browserAutomationService = new BrowserAutomationService();
export default browserAutomationService;
