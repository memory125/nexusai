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

export const realWorldService = new RealWorldService();
