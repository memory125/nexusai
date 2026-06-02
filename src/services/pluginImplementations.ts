// Real plugin implementations - each function actually does something useful.
// PluginPage calls these via plugin ID when user activates and uses a feature.

import { getOllamaService } from './ollamaService';
import { LLMService } from './llmService';
import { useStore } from '../store';

// ====== Storage helpers (per-plugin, namespaced in localStorage) ======
function getNotes(): Array<{ id: string; content: string; createdAt: number; updatedAt: number }> {
  try { return JSON.parse(localStorage.getItem('plugin:notes') || '[]'); } catch { return []; }
}
function saveNotes(notes: any[]) { localStorage.setItem('plugin:notes', JSON.stringify(notes)); }

function getTasks(): Array<{ id: string; title: string; done: boolean; priority: 'low'|'medium'|'high'; createdAt: number }> {
  try { return JSON.parse(localStorage.getItem('plugin:tasks') || '[]'); } catch { return []; }
}
function saveTasks(tasks: any[]) { localStorage.setItem('plugin:tasks', JSON.stringify(tasks)); }

// ====== Code Runner ======
export async function runCode(language: string, code: string, timeoutMs = 5000): Promise<{ ok: boolean; output: string; error?: string; durationMs: number }> {
  const start = performance.now();
  if (language === 'javascript' || language === 'typescript') {
    let output = '';
    const fakeConsole = {
      log: (...args: any[]) => { output += args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'; },
      warn: (...args: any[]) => { output += '⚠️ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'; },
      error: (...args: any[]) => { output += '❌ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'; },
      info: (...args: any[]) => { output += 'ℹ️ ' + args.map(a => typeof a === 'object' ? JSON.stringify(a) : String(a)).join(' ') + '\n'; },
    };
    try {
      // Use Promise.race for timeout
      const work = new Promise<void>((resolve, reject) => {
        try {
          const fn = new Function('console', code);
          const result = fn(fakeConsole);
          if (result instanceof Promise) {
            result.then(() => resolve()).catch(e => reject(e));
          } else {
            resolve();
          }
        } catch (e) {
          reject(e);
        }
      });
      await Promise.race([
        work,
        new Promise<void>((_, reject) => setTimeout(() => reject(new Error(`执行超时 (${timeoutMs}ms)`)), timeoutMs)),
      ]);
      return { ok: true, output: output || '(无输出)', durationMs: Math.round(performance.now() - start) };
    } catch (e) {
      return { ok: false, output, error: e instanceof Error ? e.message : String(e), durationMs: Math.round(performance.now() - start) };
    }
  }
  if (language === 'python') {
    return { ok: false, output: '', error: 'Python 在浏览器沙箱中不可用。请使用 Node.js 后端或 Pyodide 集成。', durationMs: 0 };
  }
  return { ok: false, output: '', error: `不支持的语言: ${language}`, durationMs: 0 };
}

// ====== API Tester ======
export async function testApi(req: { method: string; url: string; headers?: string; body?: string; timeout?: number }) {
  const start = performance.now();
  let headers: Record<string, string> = {};
  if (req.headers?.trim()) {
    try { headers = JSON.parse(req.headers); } catch {
      req.headers.split('\n').forEach(line => {
        const i = line.indexOf(':');
        if (i > 0) headers[line.slice(0, i).trim()] = line.slice(i + 1).trim();
      });
    }
  }
  const init: RequestInit = {
    method: req.method,
    headers,
    signal: AbortSignal.timeout(req.timeout || 30000),
  };
  if (req.body && req.method !== 'GET' && req.method !== 'HEAD') init.body = req.body;
  const res = await fetch(req.url, init);
  const bodyText = await res.text();
  const durationMs = Math.round(performance.now() - start);
  const resHeaders: Record<string, string> = {};
  res.headers.forEach((v, k) => { resHeaders[k] = v; });
  let bodyJson: any = null;
  if (resHeaders['content-type']?.includes('json')) {
    try { bodyJson = JSON.parse(bodyText); } catch { /* ignore */ }
  }
  return {
    ok: res.ok,
    status: res.status,
    statusText: res.statusText,
    headers: resHeaders,
    bodyText: bodyText.length > 5000 ? bodyText.slice(0, 5000) + '\n...(已截断)' : bodyText,
    bodyJson,
    durationMs,
    sizeBytes: new Blob([bodyText]).size,
  };
}

// ====== Web Search (real via DuckDuckGo HTML endpoint) ======
export async function webSearch(query: string, maxResults = 8): Promise<Array<{ title: string; url: string; snippet: string }>> {
  if (!query.trim()) return [];
  const start = performance.now();
  try {
    const res = await fetch(`https://html.duckduckgo.com/html/?q=${encodeURIComponent(query)}`, {
      headers: { 'User-Agent': 'Mozilla/5.0 NexusAI' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) throw new Error(`HTTP ${res.status}`);
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    doc.querySelectorAll('.result').forEach((el, idx) => {
      if (idx >= maxResults) return;
      const titleEl = el.querySelector('.result__a');
      const snippetEl = el.querySelector('.result__snippet');
      const href = titleEl?.getAttribute('href') || '';
      const title = (titleEl?.textContent || '').trim();
      const snippet = (snippetEl?.textContent || '').trim();
      if (title && href) results.push({ title, url: href, snippet });
    });
    if (results.length === 0) {
      // Fallback: try Google
      return await googleFallback(query, maxResults);
    }
    return results;
  } catch (e) {
    return await googleFallback(query, maxResults);
  }
}

async function googleFallback(query: string, maxResults: number) {
  try {
    const url = `https://www.google.com/search?q=${encodeURIComponent(query)}&num=${maxResults}`;
    const res = await fetch(url, {
      headers: { 'User-Agent': 'Mozilla/5.0 (Windows NT 10.0; Win64; x64) AppleWebKit/537.36' },
      signal: AbortSignal.timeout(15000),
    });
    if (!res.ok) return [];
    const html = await res.text();
    const parser = new DOMParser();
    const doc = parser.parseFromString(html, 'text/html');
    const results: Array<{ title: string; url: string; snippet: string }> = [];
    doc.querySelectorAll('div.g, .MjjYud').forEach((el, idx) => {
      if (idx >= maxResults) return;
      const titleEl = el.querySelector('h3');
      const linkEl = el.querySelector('a[href^="http"]');
      const snippetEl = el.querySelector('.VwiC3b, .yXK7lf');
      const title = (titleEl?.textContent || '').trim();
      const url2 = linkEl?.getAttribute('href') || '';
      const snippet = (snippetEl?.textContent || '').trim();
      if (title && url2) results.push({ title, url: url2, snippet });
    });
    return results;
  } catch {
    return [];
  }
}

// ====== Word Counter ======
export function analyzeText(text: string) {
  const trimmed = text.trim();
  const chars = text.length;
  const charsNoSpace = text.replace(/\s/g, '').length;
  const words = trimmed.split(/\s+/).filter(Boolean).length;
  const lines = text.split('\n').length;
  const sentences = (text.match(/[.。!！?？]+/g) || []).length;
  const paragraphs = text.split(/\n\s*\n/).filter((p: string) => p.trim()).length;
  const readingMinutes = Math.max(1, Math.round(words / 200));
  // Top words
  const wordMap: Record<string, number> = {};
  text.toLowerCase().replace(/[\p{L}\p{N}]+/gu, '').split(/\s+/).forEach((w: string) => {
    if (w.length > 1) wordMap[w] = (wordMap[w] || 0) + 1;
  });
  const topWords = Object.entries(wordMap).sort((a, b) => b[1] - a[1]).slice(0, 5);
  return { chars, charsNoSpace, words, lines, sentences, paragraphs, readingMinutes, topWords };
}

// ====== Calculator ======
export function calc(expression: string): { ok: boolean; value: string; error?: string } {
  if (!expression.trim()) return { ok: false, value: '', error: '空表达式' };
  // Sanitize: only allow digits, ops, parens, decimal, math functions, constants
  const safe = expression
    .replace(/\s+/g, '')
    .replace(/×/g, '*')
    .replace(/÷/g, '/')
    .replace(/−/g, '-')
    .replace(/π/g, 'Math.PI')
    .replace(/\be\b/g, 'Math.E');
  if (!/^[0-9+\-*/().,%MathPIELaINbetsqracosindlogxpowr]*$/.test(safe)) {
    return { ok: false, value: '', error: '包含不安全字符。仅允许 0-9 + - * / ( ) . , % π e sin cos tan log sqrt pow' };
  }
  try {
    const fn = new Function(`return (${safe})`);
    const result = fn();
    if (typeof result !== 'number' || !isFinite(result)) {
      return { ok: false, value: '', error: '结果非有限数' };
    }
    return { ok: true, value: Number(result.toPrecision(12)).toString() };
  } catch (e) {
    return { ok: false, value: '', error: e instanceof Error ? e.message : String(e) };
  }
}

// ====== URL Shortener (real via is.gd) ======
export async function shortenUrl(longUrl: string): Promise<{ ok: boolean; shortUrl?: string; error?: string }> {
  if (!longUrl.trim()) return { ok: false, error: '空 URL' };
  try {
    const res = await fetch(`https://is.gd/create.php?format=json&url=${encodeURIComponent(longUrl)}`, {
      signal: AbortSignal.timeout(10000),
    });
    if (!res.ok) return { ok: false, error: `HTTP ${res.status}` };
    const data = await res.json();
    if (data.shorturl) return { ok: true, shortUrl: data.shorturl };
    return { ok: false, error: data.errormessage || '未知错误' };
  } catch (e) {
    return { ok: false, error: e instanceof Error ? e.message : String(e) };
  }
}

// ====== Notes CRUD ======
export const notesOps = {
  list: () => getNotes().sort((a, b) => b.updatedAt - a.updatedAt),
  add: (content: string) => {
    const n = { id: `n_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, content, createdAt: Date.now(), updatedAt: Date.now() };
    saveNotes([...getNotes(), n]);
    return n;
  },
  update: (id: string, content: string) => {
    const all = getNotes().map(n => n.id === id ? { ...n, content, updatedAt: Date.now() } : n);
    saveNotes(all);
  },
  remove: (id: string) => saveNotes(getNotes().filter(n => n.id !== id)),
  search: (q: string) => {
    const lower = q.toLowerCase();
    return getNotes().filter(n => n.content.toLowerCase().includes(lower));
  },
};

// ====== Tasks CRUD ======
export const tasksOps = {
  list: () => getTasks().sort((a, b) => Number(a.done) - Number(b.done) || b.createdAt - a.createdAt),
  add: (title: string, priority: 'low'|'medium'|'high' = 'medium') => {
    const t = { id: `t_${Date.now()}_${Math.random().toString(36).slice(2, 6)}`, title, done: false, priority, createdAt: Date.now() };
    saveTasks([...getTasks(), t]);
    return t;
  },
  toggle: (id: string) => {
    saveTasks(getTasks().map(t => t.id === id ? { ...t, done: !t.done } : t));
  },
  remove: (id: string) => saveTasks(getTasks().filter(t => t.id !== id)),
  clearDone: () => saveTasks(getTasks().filter(t => !t.done)),
};

// ====== Real LLM-based helpers (use store's selected model) ======
export async function summarizeText(text: string, maxWords = 200): Promise<string> {
  const { selectedProvider, selectedModel, ollamaEndpoint, lmstudioEndpoint, apiKeys } = useStore.getState();
  const prompt = `请用中文简洁总结以下内容,不超过 ${maxWords} 字:\n\n${text.slice(0, 4000)}`;
  return await callLLM(selectedProvider, selectedModel, ollamaEndpoint, lmstudioEndpoint, apiKeys, [
    { role: 'system', content: '你是一个专业的中文摘要助手。' },
    { role: 'user', content: prompt },
  ]);
}

export async function translateText(text: string, targetLang: string): Promise<string> {
  const { selectedProvider, selectedModel, ollamaEndpoint, lmstudioEndpoint, apiKeys } = useStore.getState();
  return await callLLM(selectedProvider, selectedModel, ollamaEndpoint, lmstudioEndpoint, apiKeys, [
    { role: 'system', content: `你是一个专业翻译助手,只输出翻译结果,不要解释。` },
    { role: 'user', content: `将以下内容翻译为${targetLang}:\n\n${text.slice(0, 3000)}` },
  ]);
}

export async function callLLM(
  provider: string,
  model: string,
  ollamaEndpoint: string,
  lmstudioEndpoint: string,
  apiKeys: Record<string, string>,
  messages: Array<{ role: 'system'|'user'|'assistant'; content: string }>,
): Promise<string> {
  if (provider === 'ollama') {
    const ollama = getOllamaService(ollamaEndpoint);
    ollama.setDefaultModel(model);
    return await ollama.chat(messages as any, model);
  }
  if (provider === 'lmstudio') {
    const res = await fetch(`${lmstudioEndpoint}/v1/chat/completions`, {
      method: 'POST',
      headers: {
        'Content-Type': 'application/json',
        ...(apiKeys['lmstudio'] ? { 'Authorization': `Bearer ${apiKeys['lmstudio']}` } : {}),
      },
      body: JSON.stringify({ model, messages, stream: false, temperature: 0.3 }),
      signal: AbortSignal.timeout(60000),
    });
    if (!res.ok) throw new Error(`LM Studio ${res.status}`);
    const data = await res.json();
    return data.choices?.[0]?.message?.content || '';
  }
  // Other providers
  const map: Record<string, { baseUrl: string; keyName: string }> = {
    openai:   { baseUrl: 'https://api.openai.com/v1', keyName: 'openai' },
    google:   { baseUrl: 'https://generativelanguage.googleapis.com/v1beta/openai', keyName: 'google' },
    qwen:     { baseUrl: 'https://dashscope.aliyuncs.com/compatible-mode/v1', keyName: 'qwen' },
    zhipu:    { baseUrl: 'https://open.bigmodel.cn/api/paas/v4', keyName: 'zhipu' },
    deepseek: { baseUrl: 'https://api.deepseek.com/v1', keyName: 'deepseek' },
  };
  const cfg = map[provider];
  if (!cfg) throw new Error(`不支持的厂商: ${provider}`);
  const key = apiKeys[cfg.keyName];
  if (!key) throw new Error(`未配置 ${provider} API Key`);
  const llm = new LLMService(key, cfg.baseUrl);
  return await llm.chatCompletion({ model, messages, stream: false });
}
