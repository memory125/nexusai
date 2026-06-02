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

/** 智能 fetch: Tauri 环境用原生 HTTP(无 CORS), 否则用浏览器 fetch */
export async function safeFetch(url: string, options: RequestInit = {}): Promise<HttpResponse> {
  const tFetch = await getTauriFetch();
  if (tFetch) {
    try {
      const r = await tFetch(url, options);
      return responseToObject(r as unknown as Response, (r as any).url || url);
    } catch (e) {
      console.warn('[http] Tauri fetch failed, fallback to browser fetch', e);
    }
  }
  const r = await fetch(url, { credentials: 'omit', ...options });
  return responseToObject(r, r.url);
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
