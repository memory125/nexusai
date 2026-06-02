// Real-world browser automation features (all run in browser, no server)

export interface ApiTestRequest {
  url: string;
  method: 'GET' | 'POST' | 'PUT' | 'DELETE' | 'PATCH' | 'HEAD';
  headers?: Record<string, string>;
  body?: string;
  timeout?: number;
}

export interface ApiTestResponse {
  ok: boolean;
  status: number;
  statusText: string;
  headers: Record<string, string>;
  bodyText: string;
  bodyJson: any | null;
  durationMs: number;
  sizeBytes: number;
  contentType: string | null;
  url: string;
  finalUrl: string;
}

export interface PingResult {
  url: string;
  ok: boolean;
  status: number;
  durationMs: number;
  totalDurationMs: number;
  ip?: string;
  protocol?: string;
  server?: string;
  error?: string;
}

export interface BatchScrapeItem {
  url: string;
  ok: boolean;
  title?: string;
  items: Array<{ tag: string; text: string; value: string }>;
  error?: string;
  durationMs: number;
}

export interface CrawlResult {
  startUrl: string;
  visited: string[];
  pages: Array<{ url: string; title: string; items: Array<{ tag: string; text: string; value: string }> }>;
  totalDurationMs: number;
  errors: Array<{ url: string; error: string }>;
}

export interface FormField {
  tag: string;
  type: string;
  name: string;
  id?: string;
  placeholder?: string;
  value?: string;
  required: boolean;
  options?: string[]; // for select
}

class RealWorldService {
  /**
   * Real HTTP API test using browser fetch
   * - Shows real status, headers, body, timing
   * - Auto-parses JSON
   * - Supports custom headers and body
   */
  async testApi(req: ApiTestRequest): Promise<ApiTestResponse> {
    const startTime = performance.now();
    const init: RequestInit = {
      method: req.method,
      headers: req.headers,
      signal: AbortSignal.timeout(req.timeout || 30000),
      redirect: 'follow',
    };
    if (req.body && req.method !== 'GET' && req.method !== 'HEAD') {
      init.body = req.body;
    }
    const res = await fetch(req.url, init);
    const bodyText = await res.text();
    const durationMs = Math.round(performance.now() - startTime);
    const headers: Record<string, string> = {};
    res.headers.forEach((v, k) => { headers[k] = v; });
    const contentType = res.headers.get('content-type');
    let bodyJson: any = null;
    if (contentType?.includes('application/json')) {
      try { bodyJson = JSON.parse(bodyText); } catch { /* not valid JSON */ }
    }
    return {
      ok: res.ok,
      status: res.status,
      statusText: res.statusText,
      headers,
      bodyText,
      bodyJson,
      durationMs,
      sizeBytes: new Blob([bodyText]).size,
      contentType,
      url: req.url,
      finalUrl: res.url,
    };
  }

  /**
   * Connection test - measures latency, status, server info
   */
  async ping(url: string, timeout = 10000): Promise<PingResult> {
    const start = performance.now();
    try {
      const res = await fetch(url, {
        method: 'HEAD',
        signal: AbortSignal.timeout(timeout),
        redirect: 'follow',
        cache: 'no-store',
      });
      const durationMs = Math.round(performance.now() - start);
      return {
        url,
        ok: res.ok || (res.status >= 200 && res.status < 400),
        status: res.status,
        durationMs,
        totalDurationMs: durationMs,
        protocol: res.url.startsWith('https') ? 'HTTPS' : 'HTTP',
        server: res.headers.get('server') || undefined,
      };
    } catch (e) {
      const durationMs = Math.round(performance.now() - start);
      return {
        url,
        ok: false,
        status: 0,
        durationMs,
        totalDurationMs: durationMs,
        error: e instanceof Error ? e.message : String(e),
      };
    }
  }

  /**
   * Batch scrape multiple URLs with the same CSS selector
   */
  async batchScrape(urls: string[], selector: string, multiple = true, timeout = 15000): Promise<BatchScrapeItem[]> {
    const results: BatchScrapeItem[] = [];
    for (const url of urls) {
      const start = performance.now();
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) {
          results.push({ url, ok: false, items: [], error: `HTTP ${res.status}`, durationMs: Math.round(performance.now() - start) });
          continue;
        }
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const elements = doc.querySelectorAll(selector);
        const items = Array.from(elements).map(el => ({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 500),
          value: (el.textContent || '').trim().slice(0, 500),
        })).filter(i => i.text);
        results.push({
          url,
          ok: true,
          title: doc.title || url,
          items: multiple ? items : items.slice(0, 1),
          durationMs: Math.round(performance.now() - start),
        });
      } catch (e) {
        results.push({ url, ok: false, items: [], error: e instanceof Error ? e.message : String(e), durationMs: Math.round(performance.now() - start) });
      }
    }
    return results;
  }

  /**
   * BFS website crawler - extracts data from N pages
   */
  async crawlSite(startUrl: string, selector: string, maxPages = 5, sameDomain = true, timeout = 15000): Promise<CrawlResult> {
    const start = performance.now();
    const visited = new Set<string>();
    const pages: CrawlResult['pages'] = [];
    const errors: CrawlResult['errors'] = [];
    const queue: string[] = [startUrl];
    const startDomain = (() => { try { return new URL(startUrl).hostname; } catch { return ''; } })();
    while (queue.length > 0 && visited.size < maxPages) {
      const url = queue.shift()!;
      if (visited.has(url)) continue;
      visited.add(url);
      try {
        const res = await fetch(url, { signal: AbortSignal.timeout(timeout) });
        if (!res.ok) {
          errors.push({ url, error: `HTTP ${res.status}` });
          continue;
        }
        const html = await res.text();
        const parser = new DOMParser();
        const doc = parser.parseFromString(html, 'text/html');
        const elements = doc.querySelectorAll(selector);
        const items = Array.from(elements).map(el => ({
          tag: el.tagName.toLowerCase(),
          text: (el.textContent || '').trim().slice(0, 500),
          value: (el.textContent || '').trim().slice(0, 500),
        })).filter(i => i.text);
        pages.push({ url, title: doc.title || url, items });
        // Discover more URLs
        if (visited.size < maxPages) {
          const links = Array.from(doc.querySelectorAll('a[href]'));
          for (const a of links) {
            const href = a.getAttribute('href') || '';
            if (!href || href.startsWith('#') || href.startsWith('javascript:')) continue;
            try {
              const abs = new URL(href, url).href;
              if (visited.has(abs) || queue.includes(abs)) continue;
              if (sameDomain) {
                const d = new URL(abs).hostname;
                if (d !== startDomain) continue;
              }
              queue.push(abs);
            } catch { /* skip */ }
            if (queue.length + visited.size >= maxPages * 2) break;
          }
        }
      } catch (e) {
        errors.push({ url, error: e instanceof Error ? e.message : String(e) });
      }
    }
    return {
      startUrl,
      visited: Array.from(visited),
      pages,
      totalDurationMs: Math.round(performance.now() - start),
      errors,
    };
  }

  /**
   * Extract all form fields from current page
   */
  extractFormFields(html: string): FormField[] {
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const fields: FormField[] = [];
    doc.querySelectorAll('input, textarea, select').forEach(el => {
      const tag = el.tagName.toLowerCase();
      const type = (el.getAttribute('type') || (tag === 'textarea' ? 'textarea' : 'text')).toLowerCase();
      const name = el.getAttribute('name') || el.getAttribute('id') || '';
      const field: FormField = {
        tag,
        type,
        name,
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
   * Real screenshot via SVG foreignObject - renders the actual HTML
   * Returns a data URL of a PNG
   */
  async realScreenshot(url: string, width = 1280, height = 1800): Promise<string> {
    const res = await fetch(url, { signal: AbortSignal.timeout(20000) });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    // Wrap so that base URLs resolve and styles are sane
    const wrappedHtml = html.replace(/<head>/i, '<head><base href="' + url + '"><style>body{font-family:-apple-system,BlinkMacSystemFont,"Segoe UI",Roboto,sans-serif;color:#222;background:#fff;padding:20px;}</style>');
    const svg = `
<svg xmlns="http://www.w3.org/2000/svg" width="${width}" height="${height}">
  <foreignObject width="100%" height="100%">
    <div xmlns="http://www.w3.org/1999/xhtml" style="width:${width}px;min-height:${height}px;">
      ${wrappedHtml}
    </div>
  </foreignObject>
</svg>`.trim();
    const blob = new Blob([svg], { type: 'image/svg+xml' });
    const svgUrl = URL.createObjectURL(blob);
    try {
      const img = new Image();
      img.crossOrigin = 'anonymous';
      await new Promise<void>((resolve, reject) => {
        img.onload = () => resolve();
        img.onerror = () => reject(new Error('SVG render failed'));
        img.src = svgUrl;
      });
      const canvas = document.createElement('canvas');
      canvas.width = width;
      canvas.height = height;
      const ctx = canvas.getContext('2d');
      if (!ctx) throw new Error('Canvas context unavailable');
      ctx.fillStyle = '#ffffff';
      ctx.fillRect(0, 0, width, height);
      ctx.drawImage(img, 0, 0, width, height);
      return canvas.toDataURL('image/png');
    } finally {
      URL.revokeObjectURL(svgUrl);
    }
  }

  /**
   * Export data to JSON file (download)
   */
  exportJson(data: any, filename: string) {
    const blob = new Blob([JSON.stringify(data, null, 2)], { type: 'application/json' });
    this.download(blob, filename);
  }

  /**
   * Export array of objects to CSV file (download)
   */
  exportCsv(rows: Array<Record<string, any>>, filename: string) {
    if (rows.length === 0) {
      this.download(new Blob([''], { type: 'text/csv' }), filename);
      return;
    }
    const headers = Array.from(new Set(rows.flatMap(r => Object.keys(r))));
    const escape = (v: any) => {
      if (v === null || v === undefined) return '';
      const s = String(v);
      if (s.includes('"') || s.includes(',') || s.includes('\n')) {
        return '"' + s.replace(/"/g, '""') + '"';
      }
      return s;
    };
    const lines = [headers.join(',')];
    for (const row of rows) {
      lines.push(headers.map(h => escape(row[h])).join(','));
    }
    this.download(new Blob([lines.join('\n')], { type: 'text/csv;charset=utf-8' }), filename);
  }

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

// ====================================================================
// Data Scraping Service - 深度数据爬取工具
// ====================================================================

export type FieldTransform =
  | { type: 'trim' }
  | { type: 'lowercase' }
  | { type: 'uppercase' }
  | { type: 'replace'; from: string; to: string }
  | { type: 'regex'; pattern: string; flags: string; replace: string }
  | { type: 'prefix'; value: string }
  | { type: 'suffix'; value: string }
  | { type: 'slice'; start: number; end?: number }
  | { type: 'attr'; name: string }  // 提取属性而非 textContent
  | { type: 'number' }              // 解析为数字(去掉非数字字符)
  | { type: 'date'; fromFormat?: string; toFormat?: string }
  | { type: 'slug' }
  | { type: 'first' }               // 多元素时只取第一个
  | { type: 'join'; sep: string };  // 多元素时用 sep 连接

export interface ScrapeField {
  name: string;
  selector: string;
  attr?: string;  // 可选,直接用 attr 模式
  multiple?: boolean;
  transforms?: FieldTransform[];
  defaultValue?: string;
}

export interface MultiFieldResult {
  fields: Record<string, string | string[]>;
  raw: Record<string, string[]>;  // 原始匹配
  rowCount: number;
}

export interface PaginationOptions {
  startUrl: string;
  fields: ScrapeField[];
  nextSelector?: string;          // 找"下一页"链接的 CSS 选择器
  nextUrlPattern?: string;        // 或用 URL 模式(递增)
  maxPages?: number;              // 最多翻几页
  delayMs?: number;               // 每页间隔
  onProgress?: (page: number, total: number, url: string, items: number) => void;
  fetchOptions?: RequestInit;
  dedupeBy?: string;              // 用哪个字段去重
}

export interface PaginationResult {
  pages: Array<{
    url: string;
    index: number;
    ok: boolean;
    items: Record<string, any>[];
    error?: string;
  }>;
  totalItems: number;
  uniqueItems: number;
  flat: Record<string, any>[];
  durationMs: number;
}

export interface UrlPatternOptions {
  pattern: string;        // e.g. "https://example.com/page/{n}" 或 "{n}" 起始
  start: number;
  end: number;
  step?: number;
  padLength?: number;     // e.g. 3 → 001, 002
  prefix?: string;        // 替代 {n} 的多个占位符
}

export interface StructuredDataResult {
  jsonLd: any[];
  openGraph: Record<string, string>;
  twitterCard: Record<string, string>;
  meta: Record<string, string>;
  microdata: any[];
  rssAtom: string[];
}

export interface ScrapeRecipe {
  id: string;
  name: string;
  description?: string;
  createdAt: number;
  updatedAt: number;
  baseUrl: string;
  fields: ScrapeField[];
  pagination?: { nextSelector?: string; nextUrlPattern?: string; maxPages?: number };
  headers?: Record<string, string>;
}

class DataScrapingService {
  private parser = new DOMParser();

  /** 多字段提取 */
  extractMultiField(html: string, fields: ScrapeField[]): MultiFieldResult {
    const doc = this.parser.parseFromString(html, 'text/html');
    const result: Record<string, string | string[]> = {};
    const raw: Record<string, string[]> = {};

    for (const field of fields) {
      try {
        const nodes = Array.from(doc.querySelectorAll(field.selector));
        const useAttr = field.attr || (field.transforms || []).find(t => t.type === 'attr') as any;
        const rawValues = nodes.map(n => {
          if (typeof useAttr === 'string') {
            return (n as HTMLElement).getAttribute(useAttr) || '';
          }
          return (n.textContent || '').trim();
        });
        raw[field.name] = rawValues;

        let value: string | string[];
        if (field.multiple) {
          value = rawValues.map(v => this.applyTransforms(v, field.transforms || []));
        } else {
          // 单值模式: 仍取所有匹配,供 join/first 使用
          const transformed = rawValues.map(v => this.applyTransforms(v, field.transforms || []));
          const first = field.transforms?.find(t => t.type === 'first');
          const join = field.transforms?.find(t => t.type === 'join') as any;
          if (first) value = transformed[0] || field.defaultValue || '';
          else if (join) value = transformed.join(join.sep);
          else value = transformed[0] || field.defaultValue || '';
        }
        result[field.name] = value;
      } catch (e) {
        result[field.name] = field.defaultValue || '';
        raw[field.name] = [];
      }
    }

    // 计算 rowCount (用第一个 multiple 字段的行数,否则 1)
    const firstMulti = fields.find(f => f.multiple);
    const rowCount = firstMulti ? (raw[firstMulti.name]?.length || 0) : 1;

    return { fields: result, raw, rowCount };
  }

  /** 把单行结果转成多行数组 (按第一个 multiple 字段展开) */
  toRows(result: MultiFieldResult): Record<string, any>[] {
    const firstMulti = Object.keys(result.raw).find(k => Array.isArray(result.raw[k]) && result.raw[k].length > 0 && Object.keys(result.fields).length);
    // 直接用 raw: 找到最长数组作为主轴
    const arrs = Object.entries(result.raw).filter(([k]) => Array.isArray(result.raw[k]));
    if (arrs.length === 0) {
      return [this.expandSingles(result.fields)];
    }
    const maxLen = Math.max(...arrs.map(([_, v]) => v.length));
    const rows: Record<string, any>[] = [];
    for (let i = 0; i < maxLen; i++) {
      const row: Record<string, any> = {};
      // 多值字段
      for (const [k, v] of Object.entries(result.raw)) {
        row[k] = v[i] ?? '';
      }
      // 单值字段: 重复填入每行
      for (const [k, v] of Object.entries(result.fields)) {
        if (!(k in row)) row[k] = v;
      }
      rows.push(row);
    }
    return rows;
  }

  private expandSingles(fields: Record<string, string | string[]>): Record<string, any> {
    const row: Record<string, any> = {};
    for (const [k, v] of Object.entries(fields)) {
      row[k] = Array.isArray(v) ? v.join(', ') : v;
    }
    return row;
  }

  /** 单值变换 */
  applyTransforms(value: string, transforms: FieldTransform[]): string {
    let v = value;
    for (const t of transforms) {
      try {
        switch (t.type) {
          case 'trim': v = v.trim(); break;
          case 'lowercase': v = v.toLowerCase(); break;
          case 'uppercase': v = v.toUpperCase(); break;
          case 'replace':
            if (t.from) v = v.split(t.from).join(t.to);
            break;
          case 'regex': {
            if (!t.pattern) break;
            const re = new RegExp(t.pattern, t.flags || 'g');
            v = v.replace(re, t.replace || '');
            break;
          }
          case 'prefix': v = (t.value || '') + v; break;
          case 'suffix': v = v + (t.value || ''); break;
          case 'slice':
            v = v.slice(t.start, t.end);
            break;
          case 'number': {
            const n = parseFloat(v.replace(/[^\d.\-]/g, ''));
            v = isNaN(n) ? v : String(n);
            break;
          }
          case 'slug':
            v = v.toLowerCase()
              .replace(/[^\w\s-]/g, '')
              .replace(/\s+/g, '-')
              .replace(/-+/g, '-')
              .replace(/^-|-$/g, '');
            break;
          case 'date': {
            // 简化: 直接保留,标记用户可用 regex 进一步处理
            const d = new Date(v);
            if (!isNaN(d.getTime())) v = d.toISOString();
            break;
          }
        }
      } catch {
        // 跳过失败变换
      }
    }
    return v;
  }

  /** URL 模式生成: "https://example.com/p/{n}" + start=1, end=10, pad=3 → 10 URLs */
  generateUrls(opts: UrlPatternOptions): string[] {
    const { pattern, start, end, step = 1, padLength = 0, prefix = '{n}' } = opts;
    const urls: string[] = [];
    for (let i = start; i <= end; i += step) {
      const token = padLength > 0 ? String(i).padStart(padLength, '0') : String(i);
      urls.push(pattern.split(prefix).join(token));
    }
    return urls;
  }

  /** 查找下一页 URL */
  findNextPageUrl(html: string, currentUrl: string, nextSelector: string): string | null {
    try {
      const doc = this.parser.parseFromString(html, 'text/html');
      const a = doc.querySelector(nextSelector) as HTMLAnchorElement | null;
      if (!a) return null;
      const href = a.getAttribute('href');
      if (!href) return null;
      return new URL(href, currentUrl).toString();
    } catch {
      return null;
    }
  }

  /** 抓取单页 HTML (供分页和 URL 列表使用) */
  async fetchHtml(url: string, options?: RequestInit): Promise<{ ok: boolean; html: string; status: number; error?: string }> {
    try {
      const res = await fetch(url, { credentials: 'omit', ...options });
      const html = await res.text();
      return { ok: res.ok, html, status: res.status };
    } catch (e) {
      return { ok: false, html: '', status: 0, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /** 分页爬取 */
  async scrapeWithPagination(opts: PaginationOptions): Promise<PaginationResult> {
    const startTime = Date.now();
    const { startUrl, fields, nextSelector, maxPages = 5, delayMs = 800, onProgress, fetchOptions, dedupeBy } = opts;
    const pages: PaginationResult['pages'] = [];
    const flat: Record<string, any>[] = [];
    const seen = new Set<string>();

    let currentUrl: string | null = startUrl;
    let page = 0;
    while (currentUrl && page < maxPages) {
      page++;
      const { ok, html, status, error } = await this.fetchHtml(currentUrl, fetchOptions);
      if (!ok) {
        pages.push({ url: currentUrl, index: page, ok: false, items: [], error: error || `HTTP ${status}` });
        break;
      }
      const result = this.extractMultiField(html, fields);
      const rows = this.toRows(result);
      pages.push({ url: currentUrl, index: page, ok: true, items: rows });
      for (const row of rows) {
        const key = dedupeBy ? String(row[dedupeBy] || '') : JSON.stringify(row);
        if (!seen.has(key)) {
          seen.add(key);
          flat.push(row);
        }
      }
      onProgress?.(page, maxPages, currentUrl, rows.length);
      // 找下一页
      let nextUrl: string | null = null;
      if (nextSelector) nextUrl = this.findNextPageUrl(html, currentUrl, nextSelector);
      if (!nextUrl) break;
      currentUrl = nextUrl;
      if (delayMs > 0 && currentUrl) await new Promise(r => setTimeout(r, delayMs));
    }

    return {
      pages,
      totalItems: pages.reduce((s, p) => s + p.items.length, 0),
      uniqueItems: flat.length,
      flat,
      durationMs: Date.now() - startTime,
    };
  }

  /** 结构化数据提取 */
  extractStructured(html: string, baseUrl: string = ''): StructuredDataResult {
    const doc = this.parser.parseFromString(html, 'text/html');
    const result: StructuredDataResult = {
      jsonLd: [],
      openGraph: {},
      twitterCard: {},
      meta: {},
      microdata: [],
      rssAtom: [],
    };

    // JSON-LD
    doc.querySelectorAll('script[type="application/ld+json"]').forEach(s => {
      try {
        const data = JSON.parse(s.textContent || '');
        result.jsonLd.push(data);
      } catch {}
    });

    // OpenGraph
    doc.querySelectorAll('meta[property^="og:"]').forEach(m => {
      const k = m.getAttribute('property')?.replace(/^og:/, '') || '';
      const v = m.getAttribute('content') || '';
      if (k) result.openGraph[k] = v;
    });

    // Twitter Card
    doc.querySelectorAll('meta[name^="twitter:"]').forEach(m => {
      const k = m.getAttribute('name')?.replace(/^twitter:/, '') || '';
      const v = m.getAttribute('content') || '';
      if (k) result.twitterCard[k] = v;
    });

    // 普通 meta
    doc.querySelectorAll('meta[name], meta[http-equiv]').forEach(m => {
      const k = m.getAttribute('name') || m.getAttribute('http-equiv') || '';
      const v = m.getAttribute('content') || '';
      if (k && !k.startsWith('twitter:')) result.meta[k] = v;
    });

    // RSS / Atom
    doc.querySelectorAll('link[type="application/rss+xml"], link[type="application/atom+xml"]').forEach(l => {
      const href = l.getAttribute('href');
      if (href) result.rssAtom.push(new URL(href, baseUrl).toString());
    });

    return result;
  }

  /** 导出 XLSX (用已安装的 xlsx 库) */
  async exportXlsx(rows: Record<string, any>[], filename: string, sheetName: string = 'Data'): Promise<void> {
    const XLSX = await import('xlsx');
    const ws = XLSX.utils.json_to_sheet(rows);
    const wb = XLSX.utils.book_new();
    XLSX.utils.book_append_sheet(wb, ws, sheetName);
    XLSX.writeFile(wb, filename);
  }

  /** 下载图片 */
  async downloadImage(url: string, filename: string): Promise<{ ok: boolean; error?: string }> {
    try {
      const res = await fetch(url);
      if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
      const blob = await res.blob();
      this.download(blob, filename);
      return { ok: true };
    } catch (e) {
      return { ok: false, error: e instanceof Error ? e.message : String(e) };
    }
  }

  /** 批量下载图片 (从提取结果中) */
  async downloadImages(rows: Record<string, any>[], urlField: string, dirName: string = 'images'): Promise<{ ok: number; fail: number }> {
    let ok = 0, fail = 0;
    for (let i = 0; i < rows.length; i++) {
      const url = rows[i][urlField];
      if (!url) continue;
      const ext = (url.match(/\.(jpg|jpeg|png|gif|webp|svg)(\?|$)/i)?.[1] || 'jpg').toLowerCase();
      const filename = `${dirName}/${String(i + 1).padStart(4, '0')}.${ext}`;
      const result = await this.downloadImage(url, filename);
      if (result.ok) ok++; else fail++;
      await new Promise(r => setTimeout(r, 100));
    }
    return { ok, fail };
  }

  /** 配方保存/加载 (localStorage) */
  saveRecipe(recipe: ScrapeRecipe): void {
    const key = 'nexusai:scrape-recipes';
    const list = this.loadRecipes();
    const idx = list.findIndex(r => r.id === recipe.id);
    if (idx >= 0) list[idx] = recipe;
    else list.push(recipe);
    localStorage.setItem(key, JSON.stringify(list));
  }

  loadRecipes(): ScrapeRecipe[] {
    try {
      const raw = localStorage.getItem('nexusai:scrape-recipes');
      return raw ? JSON.parse(raw) : [];
    } catch { return []; }
  }

  deleteRecipe(id: string): void {
    const list = this.loadRecipes().filter(r => r.id !== id);
    localStorage.setItem('nexusai:scrape-recipes', JSON.stringify(list));
  }

  private download(blob: Blob, filename: string) {
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = filename;
    a.style.display = 'none';
    document.body.appendChild(a);
    a.click();
    setTimeout(() => {
      document.body.removeChild(a);
      URL.revokeObjectURL(url);
    }, 100);
  }
}

export const dataScrapingService = new DataScrapingService();
export const realWorldService = new RealWorldService();
