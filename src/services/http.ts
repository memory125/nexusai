// Smart fetch wrapper: uses Tauri native HTTP (CORS-free) when running in Tauri,
// falls back to browser fetch otherwise.

interface HttpResponse {
  ok: boolean;
  status: number;
  statusText: string;
  url: string;
  headers: Record<string, string>;
  text(): Promise<string>;
  json(): Promise<any>;
  blob(): Promise<Blob>;
  arrayBuffer(): Promise<ArrayBuffer>;
}

let tauriFetchFn: typeof fetch | null = null;
let tauriChecked = false;

async function isTauri(): Promise<boolean> {
  if (typeof window === 'undefined') return false;
  // Tauri v2 detection
  return !!((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
}

async function getTauriFetch(): Promise<typeof fetch | null> {
  if (tauriChecked) return tauriFetchFn;
  tauriChecked = true;
  if (!(await isTauri())) return null;
  try {
    const mod = await import('@tauri-apps/plugin-http');
    tauriFetchFn = (mod.fetch as typeof fetch);
    return tauriFetchFn;
  } catch (e) {
    console.warn('[http] Tauri fetch plugin not available, using browser fetch', e);
    return null;
  }
}

function responseToObject(r: Response, finalUrl: string): HttpResponse {
  const headers: Record<string, string> = {};
  r.headers.forEach((v, k) => { headers[k] = v; });
  return {
    ok: r.ok, status: r.status, statusText: r.statusText, url: finalUrl || r.url, headers,
    text: () => r.text(),
    json: () => r.json(),
    blob: () => r.blob(),
    arrayBuffer: () => r.arrayBuffer(),
  };
}

/** 智能 fetch: Tauri 环境用原生 HTTP(无 CORS), 否则用浏览器 fetch
 *  如果提供 corsProxy 模板 (含 {url} 占位符 或 以 ? 结尾), 在浏览器模式
 *  CORS 失败时自动通过代理重试一次。
 */
export async function safeFetch(
  url: string,
  options: RequestInit = {},
  corsProxy?: string,
): Promise<HttpResponse> {
  const tFetch = await getTauriFetch();
  if (tFetch) {
    try {
      const r = await tFetch(url, options);
      return responseToObject(r as unknown as Response, (r as any).url || url);
    } catch (e) {
      console.warn('[http] Tauri fetch failed, fallback to browser fetch', e);
    }
  }
  // 浏览器模式
  try {
    const r = await fetch(url, { credentials: 'omit', ...options });
    return responseToObject(r, r.url);
  } catch (e) {
    // CORS 错误 + 有代理 → 重试
    if (corsProxy) {
      const proxied = wrapWithProxy(url, corsProxy);
      console.log(`[http] CORS blocked, retrying via proxy: ${proxied.slice(0, 80)}…`);
      try {
        const r = await fetch(proxied, { credentials: 'omit', ...options });
        return responseToObject(r, url);
      } catch (e2) {
        // 抛原始错误
        throw e;
      }
    }
    throw e;
  }
}

/** 把 URL 包到 CORS 代理里
 *  corsproxy.io 模式:  https://corsproxy.io/?url={url}  → 传 "https://corsproxy.io/?"
 *  allorigins 模式:  https://api.allorigins.win/raw?url={url} → 传 "https://api.allorigins.win/raw?url="
 *  含 {url} 占位符: 任何带 {url} 的模板都支持
 */
export function wrapWithProxy(url: string, template: string): string {
  if (template.includes('{url}')) return template.replace(/\{url\}/g, encodeURIComponent(url));
  // 末尾是 ?  → 追加 url
  if (template.endsWith('?')) return template + encodeURIComponent(url);
  // 末尾是 &  → 追加 url=
  if (template.endsWith('&')) return template + 'url=' + encodeURIComponent(url);
  // 默认前缀
  return template + (template.includes('?') ? '&url=' : '?url=') + encodeURIComponent(url);
}

/** 检查是否在 Tauri 环境运行(异步,首次会加载插件) */
export async function isTauriEnv(): Promise<boolean> {
  return !!(await getTauriFetch());
}

/** 同步检测(不加载插件) */
export function isTauriSync(): boolean {
  if (typeof window === 'undefined') return false;
  return !!((window as any).__TAURI_INTERNALS__ || (window as any).__TAURI__);
}
