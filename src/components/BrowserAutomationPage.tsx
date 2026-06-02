import { useState, useEffect } from 'react';
import {
  Globe, Play, Camera, FileText, Download, Search,
  X, Clock, RotateCcw, CheckCircle, AlertCircle, Loader2, Zap, Code2, Activity, ListTree, Send,
  Database, Layers, Save, Trash, BookOpen, Image as ImageIcon, Hash
} from 'lucide-react';
import {
  browserAutomationService,
  BrowserSession,
  AutomationTask,
  WebPageData
} from '../services/browserAutomationService';
import {
  realWorldService, ApiTestResponse, PingResult, BatchScrapeItem, CrawlResult,
  dataScrapingService, ScrapeField, FieldTransform, ScrapeRecipe, PaginationResult, StructuredDataResult
} from '../services/realWorldService';
import { markdownService, MarkdownResult, CrawlConfig } from '../services/markdownService';
import { crawlerService, CrawlDeepConfig, CrawledPage, CrawlDeepResult, CrawlPageState } from '../services/crawlerService';

type ToolTab = 'scrape' | 'api' | 'ping' | 'batch' | 'forms' | 'schema' | 'pages' | 'structured' | 'recipes' | 'deepcrawl' | 'crawler';

const COMMON_SELECTORS: { label: string; selector: string; multiple: boolean; hint: string }[] = [
  { label: '标题',  selector: 'h1',                        multiple: false, hint: '页面主标题' },
  { label: '所有标题', selector: 'h1, h2, h3',             multiple: true,  hint: '全部标题层级' },
  { label: '段落',  selector: 'p',                         multiple: true,  hint: '所有段落文本' },
  { label: '链接',  selector: 'a[href]',                   multiple: true,  hint: '全部超链接' },
  { label: '图片',  selector: 'img',                       multiple: true,  hint: '图片 src+alt' },
  { label: '列表',  selector: 'li',                        multiple: true,  hint: '列表项' },
  { label: '表格行', selector: 'table tr',                 multiple: true,  hint: '表格所有行' },
  { label: '按钮',  selector: 'button, [role="button"]',   multiple: true,  hint: '可点击元素' },
  { label: '文章',  selector: 'article',                   multiple: true,  hint: 'article 元素' },
  { label: '元描述', selector: 'meta[name="description"]', multiple: false, hint: 'meta 描述' },
  { label: '价格',  selector: '.price, [class*="price" i]', multiple: true, hint: '含 price 的元素' },
  { label: 'JSON-LD', selector: 'script[type="application/ld+json"]', multiple: false, hint: '结构化数据' },
];

function SelectorPresets({ onPick, multiple }: { onPick: (s: { selector: string; multiple: boolean }) => void; multiple?: boolean }) {
  const items = multiple === undefined ? COMMON_SELECTORS : COMMON_SELECTORS.filter(s => s.multiple === multiple);
  return (
    <div className="flex flex-wrap gap-1.5 mt-2">
      {items.map(s => (
        <button
          key={s.selector}
          onClick={() => onPick({ selector: s.selector, multiple: s.multiple })}
          title={`${s.selector}  ·  ${s.hint}`}
          className="text-xs px-2 py-1 rounded-md transition-colors hover:scale-105"
          style={{
            background: 'var(--t-accent-subtle)',
            color: 'var(--t-accent-light)',
            border: '1px solid var(--t-glass-border)',
          }}
        >
          {s.label}
        </button>
      ))}
    </div>
  );
}

// ====================================================================
// Schema Extractor Sub-Panel
// ====================================================================

const TRANSFORM_OPTIONS: { type: FieldTransform['type']; label: string; params?: Array<{ key: string; label: string; type: 'text' | 'number' }> }[] = [
  { type: 'trim', label: '去首尾空白' },
  { type: 'lowercase', label: '小写' },
  { type: 'uppercase', label: '大写' },
  { type: 'replace', label: '替换文本', params: [
    { key: 'from', label: '查找', type: 'text' }, { key: 'to', label: '替换为', type: 'text' }
  ] },
  { type: 'regex', label: '正则替换', params: [
    { key: 'pattern', label: 'pattern', type: 'text' }, { key: 'flags', label: 'flags', type: 'text' },
    { key: 'replace', label: 'replace', type: 'text' }
  ] },
  { type: 'prefix', label: '加前缀', params: [{ key: 'value', label: '前缀', type: 'text' }] },
  { type: 'suffix', label: '加后缀', params: [{ key: 'value', label: '后缀', type: 'text' }] },
  { type: 'slice', label: '切片', params: [
    { key: 'start', label: 'start', type: 'number' }, { key: 'end', label: 'end(可选)', type: 'number' }
  ] },
  { type: 'attr', label: '取属性', params: [{ key: 'name', label: '属性名', type: 'text' }] },
  { type: 'number', label: '解析为数字' },
  { type: 'date', label: '标准化日期' },
  { type: 'slug', label: 'URL slug' },
  { type: 'join', label: '多元素连接', params: [{ key: 'sep', label: '分隔符', type: 'text' }] },
];

function TransformChip({ t, onChange, onRemove }: { t: FieldTransform; onChange: (t: FieldTransform) => void; onRemove: () => void }) {
  const def = TRANSFORM_OPTIONS.find(o => o.type === t.type);
  return (
    <div className="inline-flex items-center gap-1 px-2 py-1 rounded text-[10px]" style={{ background: 'var(--t-accent-subtle)', color: 'var(--t-accent-light)' }}>
      <span>{def?.label || t.type}</span>
      {def?.params?.map(p => (
        <input
          key={p.key}
          type={p.type}
          placeholder={p.label}
          value={(t as any)[p.key] ?? ''}
          onChange={e => onChange({ ...t, [p.key]: p.type === 'number' ? (parseInt(e.target.value) || 0) : e.target.value } as FieldTransform)}
          className="w-16 px-1 py-0.5 rounded bg-black/30 text-[10px] outline-none"
        />
      ))}
      <button onClick={onRemove} className="hover:text-red-400 ml-1">×</button>
    </div>
  );
}

function SchemaPanel(props: {
  activeUrl: string;
  pageData: WebPageData | null;
  fields: ScrapeField[];
  setFields: (f: ScrapeField[]) => void;
  headers: string;
  setHeaders: (s: string) => void;
  recipeName: string;
  setRecipeName: (s: string) => void;
  results: Record<string, any>[] | null;
  setResults: (r: Record<string, any>[] | null) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
  onSave: () => void;
}) {
  const { activeUrl, pageData, fields, setFields, headers, setHeaders, recipeName, setRecipeName, results, setResults, loading, setLoading, onSave } = props;

  const addField = () => setFields([...fields, { name: `field_${fields.length + 1}`, selector: '', multiple: false, transforms: [] }]);
  const updateField = (i: number, patch: Partial<ScrapeField>) => setFields(fields.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));
  const addTransform = (i: number, type: FieldTransform['type']) => {
    const f = fields[i];
    const newT: FieldTransform = type === 'replace' ? { type, from: '', to: '' }
      : type === 'prefix' || type === 'suffix' ? { type, value: '' } as any
      : type === 'slice' ? { type, start: 0 } as any
      : type === 'attr' ? { type, name: '' } as any
      : type === 'join' ? { type, sep: ', ' } as any
      : type === 'regex' ? { type, pattern: '', flags: 'g', replace: '' } as any
      : { type } as any;
    setFields(fields.map((f2, idx) => idx === i ? { ...f2, transforms: [...(f2.transforms || []), newT] } : f2));
  };

  const handleRun = async () => {
    setLoading(true);
    try {
      let html = '';
      if (activeSessionId && pageData?.html) {
        html = pageData.html;
      } else {
        if (!activeUrl) { setLoading(false); return; }
        const r = await dataScrapingService.fetchHtml(activeUrl, headers ? { headers: JSON.parse(headers) } : undefined);
        if (!r.ok) { setResults([]); setLoading(false); return; }
        html = r.html;
      }
      const result = dataScrapingService.extractMultiField(html, fields);
      const rows = dataScrapingService.toRows(result);
      setResults(rows);
    } finally {
      setLoading(false);
    }
  };

  const exportXlsx = () => {
    if (!results) return;
    dataScrapingService.exportXlsx(results, `scrape-${Date.now()}.xlsx`, 'Data');
  };
  const exportJson = () => {
    if (!results) return;
    const blob = new Blob([JSON.stringify(results, null, 2)], { type: 'application/json' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `scrape-${Date.now()}.json`;
    a.click(); URL.revokeObjectURL(url);
  };
  const exportCsv = () => {
    if (!results || results.length === 0) return;
    const cols = Object.keys(results[0]);
    const esc = (v: any) => `"${String(v ?? '').replace(/"/g, '""')}"`;
    const csv = [cols.join(','), ...results.map(r => cols.map(c => esc(r[c])).join(','))].join('\n');
    const blob = new Blob([csv], { type: 'text/csv' });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = `scrape-${Date.now()}.csv`;
    a.click(); URL.revokeObjectURL(url);
  };

  const allColumns = results ? Array.from(new Set(results.flatMap(r => Object.keys(r)))) : [];

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        多字段 Schema 提取:为每个字段定义 CSS 选择器 + 变换管线 → 自动展开为行 → 导出 XLSX/JSON/CSV
      </p>

      {/* Field rows */}
      <div className="space-y-1.5 max-h-56 overflow-y-auto pr-1">
        {fields.map((f, i) => (
          <div key={i} className="rounded-lg p-2 space-y-1.5" style={{ background: 'rgba(0,0,0,0.2)' }}>
            <div className="flex items-center gap-1.5">
              <input
                value={f.name}
                onChange={e => updateField(i, { name: e.target.value })}
                placeholder="字段名"
                className="w-24 glass-input rounded px-2 py-1 text-xs font-mono"
              />
              <input
                value={f.selector}
                onChange={e => updateField(i, { selector: e.target.value })}
                placeholder="CSS 选择器"
                className="flex-1 glass-input rounded px-2 py-1 text-xs font-mono"
              />
              <label className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
                <input type="checkbox" checked={!!f.multiple} onChange={e => updateField(i, { multiple: e.target.checked })} className="rounded" />
                多
              </label>
              <button onClick={() => removeField(i)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                <Trash className="h-3 w-3" />
              </button>
            </div>
            <SelectorPresets onPick={p => updateField(i, { selector: p.selector, multiple: p.multiple })} />
            <div className="flex flex-wrap items-center gap-1">
              {(f.transforms || []).map((t, ti) => (
                <TransformChip
                  key={ti}
                  t={t}
                  onChange={(nt) => updateField(i, { transforms: (f.transforms || []).map((x, xi) => xi === ti ? nt : x) })}
                  onRemove={() => updateField(i, { transforms: (f.transforms || []).filter((_, xi) => xi !== ti) })}
                />
              ))}
              <select
                onChange={e => { if (e.target.value) { addTransform(i, e.target.value as any); e.target.value = ''; } }}
                className="text-[10px] px-1.5 py-1 rounded bg-black/30 outline-none"
                style={{ color: 'var(--t-text-secondary)' }}
                defaultValue=""
              >
                <option value="" disabled>+ 变换</option>
                {TRANSFORM_OPTIONS.map(o => <option key={o.type} value={o.type}>{o.label}</option>)}
              </select>
            </div>
          </div>
        ))}
      </div>
      <button onClick={addField} className="text-xs px-2 py-1 rounded border border-dashed hover:bg-white/5" style={{ borderColor: 'var(--t-glass-border)', color: 'var(--t-text-secondary)' }}>
        + 添加字段
      </button>

      {/* Headers */}
      <details className="text-xs">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🔧 自定义 Headers (JSON, 可选)</summary>
        <textarea
          value={headers}
          onChange={e => setHeaders(e.target.value)}
          placeholder='{"User-Agent": "Mozilla/5.0 ...", "Cookie": "..."}'
          className="mt-1 w-full glass-input rounded p-2 text-xs font-mono"
          rows={3}
        />
      </details>

      {/* Actions */}
      <div className="flex flex-wrap items-center gap-2">
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
          提取 ({fields.length} 字段)
        </button>
        {results && results.length > 0 && (
          <>
            <button onClick={exportXlsx} className="px-2 py-2 rounded-lg bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs flex items-center gap-1">
              <Download className="h-3 w-3" /> XLSX
            </button>
            <button onClick={exportJson} className="px-2 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs">JSON</button>
            <button onClick={exportCsv} className="px-2 py-2 rounded-lg bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-xs">CSV</button>
          </>
        )}
        <div className="flex-1" />
        <input
          value={recipeName}
          onChange={e => setRecipeName(e.target.value)}
          placeholder="配方名"
          className="w-32 glass-input rounded px-2 py-1.5 text-xs"
        />
        <button
          onClick={onSave}
          disabled={!recipeName.trim() || fields.length === 0}
          className="px-2 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs disabled:opacity-50 flex items-center gap-1"
        >
          <Save className="h-3 w-3" /> 保存配方
        </button>
      </div>

      {/* Results table */}
      {results && results.length > 0 && (
        <div className="mt-2">
          <div className="text-xs mb-1 flex items-center justify-between">
            <span style={{ color: 'var(--t-text-secondary)' }}>共 {results.length} 行 · {allColumns.length} 列</span>
          </div>
          <div className="overflow-x-auto max-h-64 border rounded-lg" style={{ borderColor: 'var(--t-glass-border)' }}>
            <table className="w-full text-[10px]">
              <thead className="sticky top-0" style={{ background: 'var(--t-bg-secondary)' }}>
                <tr>
                  {allColumns.map(c => <th key={c} className="px-2 py-1 text-left font-medium border-b" style={{ borderColor: 'var(--t-glass-border)', color: 'var(--t-accent-light)' }}>{c}</th>)}
                </tr>
              </thead>
              <tbody>
                {results.slice(0, 100).map((r, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    {allColumns.map(c => <td key={c} className="px-2 py-1 border-b max-w-xs truncate" style={{ borderColor: 'var(--t-glass-border)', color: 'var(--t-text)' }} title={String(r[c])}>{String(r[c] ?? '').slice(0, 120)}</td>)}
                  </tr>
                ))}
              </tbody>
            </table>
            {results.length > 100 && <div className="text-[10px] text-center p-1" style={{ color: 'var(--t-text-muted)' }}>仅显示前 100 行,共 {results.length} 行</div>}
          </div>
        </div>
      )}
      {results && results.length === 0 && (
        <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>无匹配数据 (检查选择器或字段配置)</div>
      )}
    </div>
  );
}

// ====================================================================
// Pagination Panel
// ====================================================================

function PaginationPanel(props: {
  url: string; setUrl: (s: string) => void;
  fields: ScrapeField[]; setFields: (f: ScrapeField[]) => void;
  nextSelector: string; setNextSelector: (s: string) => void;
  maxPages: number; setMaxPages: (n: number) => void;
  delayMs: number; setDelayMs: (n: number) => void;
  dedupeBy: string; setDedupeBy: (s: string) => void;
  result: PaginationResult | null;
  setResult: (r: PaginationResult | null) => void;
  loading: boolean; setLoading: (b: boolean) => void;
  progress: { page: number; total: number; items: number };
}) {
  const { url, setUrl, fields, setFields, nextSelector, setNextSelector, maxPages, setMaxPages, delayMs, setDelayMs, dedupeBy, setDedupeBy, result, setResult, loading, setLoading, progress } = props;

  const addField = () => setFields([...fields, { name: `field_${fields.length + 1}`, selector: '', multiple: false, transforms: [] }]);
  const updateField = (i: number, patch: Partial<ScrapeField>) => setFields(fields.map((f, idx) => idx === i ? { ...f, ...patch } : f));
  const removeField = (i: number) => setFields(fields.filter((_, idx) => idx !== i));

  const handleRun = async () => {
    if (!url.trim()) return;
    setLoading(true);
    setResult(null);
    try {
      const r = await dataScrapingService.scrapeWithPagination({
        startUrl: url.trim(),
        fields,
        nextSelector: nextSelector.trim() || undefined,
        maxPages,
        delayMs,
        dedupeBy: dedupeBy.trim() || undefined,
        onProgress: (page, total, _u, items) => {
          // progress is shown inline via state setter from outer
        },
      });
      setResult(r);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        自动翻页爬取:指定起始 URL + 下一页选择器,程序会自动抓取 N 页并合并去重结果。
      </p>
      <input
        value={url}
        onChange={e => setUrl(e.target.value)}
        placeholder="起始 URL (例如 https://example.com/news?page=1)"
        className="w-full glass-input rounded-lg py-2 px-3 text-xs font-mono"
      />
      <div className="grid grid-cols-3 gap-2">
        <input
          value={nextSelector}
          onChange={e => setNextSelector(e.target.value)}
          placeholder="下一页 CSS 选择器"
          className="glass-input rounded px-2 py-1.5 text-xs font-mono"
          title="例如 a.next, [rel=next], .pagination .next a"
        />
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--t-text-secondary)' }}>
          <span>最多</span>
          <input type="number" value={maxPages} onChange={e => setMaxPages(parseInt(e.target.value) || 1)} className="w-16 glass-input rounded px-2 py-1 text-xs" />
          <span>页</span>
        </label>
        <label className="flex items-center gap-2 text-xs" style={{ color: 'var(--t-text-secondary)' }}>
          <span>间隔</span>
          <input type="number" value={delayMs} onChange={e => setDelayMs(parseInt(e.target.value) || 0)} className="w-20 glass-input rounded px-2 py-1 text-xs" />
          <span>ms</span>
        </label>
      </div>
      <input
        value={dedupeBy}
        onChange={e => setDedupeBy(e.target.value)}
        placeholder="去重字段名 (可选, 例如 title)"
        className="w-full glass-input rounded px-2 py-1.5 text-xs"
      />

      {/* Compact field editor */}
      <details className="text-xs">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>📋 字段配置 ({fields.length})</summary>
        <div className="mt-1 space-y-1.5 max-h-40 overflow-y-auto">
          {fields.map((f, i) => (
            <div key={i} className="flex items-center gap-1.5">
              <input value={f.name} onChange={e => updateField(i, { name: e.target.value })} placeholder="字段名" className="w-24 glass-input rounded px-2 py-1 text-xs font-mono" />
              <input value={f.selector} onChange={e => updateField(i, { selector: e.target.value })} placeholder="CSS" className="flex-1 glass-input rounded px-2 py-1 text-xs font-mono" />
              <label className="flex items-center gap-1 text-[10px] cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
                <input type="checkbox" checked={!!f.multiple} onChange={e => updateField(i, { multiple: e.target.checked })} className="rounded" />
                多
              </label>
              <button onClick={() => removeField(i)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ))}
          <button onClick={addField} className="text-xs px-2 py-1 rounded border border-dashed hover:bg-white/5" style={{ borderColor: 'var(--t-glass-border)', color: 'var(--t-text-secondary)' }}>+ 添加字段</button>
        </div>
      </details>

      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          disabled={loading || !url.trim()}
          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListTree className="h-3.5 w-3.5" />}
          {loading ? `爬取中 (第 ${progress.page} 页 / ${progress.total})` : '开始分页爬取'}
        </button>
        {result && (
          <>
            <span className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>
              {result.pages.length} 页 · {result.totalItems} 条 · {result.uniqueItems} 去重 · {result.durationMs}ms
            </span>
            <button
              onClick={() => dataScrapingService.exportXlsx(result.flat, `pagination-${Date.now()}.xlsx`, 'Data')}
              className="px-2 py-1.5 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs flex items-center gap-1"
            >
              <Download className="h-3 w-3" /> XLSX
            </button>
          </>
        )}
      </div>

      {result && result.pages.length > 0 && (
        <details className="text-xs">
          <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>📄 页面详情</summary>
          <div className="mt-1 space-y-1 max-h-32 overflow-y-auto">
            {result.pages.map(p => (
              <div key={p.index} className="rounded p-1.5 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <span className={p.ok ? 'text-green-400' : 'text-red-400'}>{p.ok ? '✓' : '✗'}</span>
                <span className="text-[10px] font-mono">第 {p.index} 页</span>
                <span className="text-[10px] truncate flex-1" style={{ color: 'var(--t-text-muted)' }}>{p.url}</span>
                <span className="text-[10px]">{p.items.length} 条</span>
                {p.error && <span className="text-[10px] text-red-400">{p.error}</span>}
              </div>
            ))}
          </div>
        </details>
      )}
    </div>
  );
}

// ====================================================================
// Structured Data Panel
// ====================================================================

function StructuredDataPanel(props: {
  pageData: WebPageData | null;
  url: string;
  data: StructuredDataResult | null;
  setData: (d: StructuredDataResult | null) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
}) {
  const { pageData, url, data, setData, loading, setLoading } = props;

  const handleExtract = async () => {
    let html = '';
    let baseUrl = url;
    if (pageData?.html) {
      html = pageData.html;
    } else if (url) {
      const r = await dataScrapingService.fetchHtml(url);
      if (!r.ok) return;
      html = r.html;
    } else return;
    setLoading(true);
    try {
      setData(dataScrapingService.extractStructured(html, baseUrl));
    } finally {
      setLoading(false);
    }
  };

  const copy = (s: any) => navigator.clipboard?.writeText(typeof s === 'string' ? s : JSON.stringify(s, null, 2));

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        提取页面中嵌入的结构化数据:JSON-LD / OpenGraph / Twitter Card / Meta / RSS 链接。
      </p>
      <button
        onClick={handleExtract}
        disabled={loading || (!pageData?.html && !url)}
        className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
      >
        {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Database className="h-3.5 w-3.5" />}
        提取结构化数据
      </button>

      {data && (
        <div className="space-y-2 mt-2">
          {data.jsonLd.length > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-accent-light)' }}>JSON-LD ({data.jsonLd.length})</div>
              <pre className="text-[10px] font-mono overflow-auto max-h-32" style={{ color: 'var(--t-text-secondary)' }}>
                {JSON.stringify(data.jsonLd, null, 2)}
              </pre>
              <button onClick={() => copy(data.jsonLd)} className="text-[10px] mt-1 px-1.5 py-0.5 rounded bg-white/5 hover:bg-white/10" style={{ color: 'var(--t-text-secondary)' }}>复制</button>
            </div>
          )}
          {Object.keys(data.openGraph).length > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-accent-light)' }}>OpenGraph ({Object.keys(data.openGraph).length})</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {Object.entries(data.openGraph).map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <span className="font-mono text-purple-300">{k}:</span>
                    <span className="truncate" style={{ color: 'var(--t-text-secondary)' }} title={v}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(data.twitterCard).length > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-accent-light)' }}>Twitter Card ({Object.keys(data.twitterCard).length})</div>
              <div className="grid grid-cols-2 gap-1 text-[10px]">
                {Object.entries(data.twitterCard).map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <span className="font-mono text-blue-300">{k}:</span>
                    <span className="truncate" style={{ color: 'var(--t-text-secondary)' }} title={v}>{v}</span>
                  </div>
                ))}
              </div>
            </div>
          )}
          {Object.keys(data.meta).length > 0 && (
            <details className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <summary className="text-xs font-medium cursor-pointer" style={{ color: 'var(--t-accent-light)' }}>Meta ({Object.keys(data.meta).length})</summary>
              <div className="grid grid-cols-2 gap-1 text-[10px] mt-1">
                {Object.entries(data.meta).slice(0, 30).map(([k, v]) => (
                  <div key={k} className="flex gap-1">
                    <span className="font-mono text-gray-400">{k}:</span>
                    <span className="truncate" style={{ color: 'var(--t-text-secondary)' }} title={v}>{v}</span>
                  </div>
                ))}
              </div>
            </details>
          )}
          {data.rssAtom.length > 0 && (
            <div className="rounded-lg p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <div className="text-xs font-medium mb-1" style={{ color: 'var(--t-accent-light)' }}>RSS / Atom 源</div>
              {data.rssAtom.map((u, i) => <div key={i} className="text-[10px] font-mono" style={{ color: 'var(--t-text-secondary)' }}>{u}</div>)}
            </div>
          )}
          {data.jsonLd.length === 0 && Object.keys(data.openGraph).length === 0 && Object.keys(data.twitterCard).length === 0 && (
            <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>未发现结构化数据</div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================================================================
// Recipes Library Panel
// ====================================================================

function RecipesPanel(props: {
  recipes: ScrapeRecipe[];
  onLoad: (r: ScrapeRecipe) => void;
  onDelete: (id: string) => void;
  onExport: (r: ScrapeRecipe) => void;
}) {
  const { recipes, onLoad, onDelete, onExport } = props;
  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        已保存的爬取配方 (localStorage 持久化)。点击加载到 Schema 面板。
      </p>
      {recipes.length === 0 ? (
        <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>暂无配方。在 Schema 面板定义字段后保存即可。</div>
      ) : (
        <div className="space-y-1.5 max-h-72 overflow-y-auto">
          {recipes.map(r => (
            <div key={r.id} className="rounded-lg p-2 flex items-start gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
              <BookOpen className="h-4 w-4 mt-0.5 shrink-0" style={{ color: 'var(--t-accent-light)' }} />
              <div className="flex-1 min-w-0">
                <div className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{r.name}</div>
                <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                  {r.fields.length} 字段 · {new Date(r.updatedAt).toLocaleString('zh-CN')}
                </div>
                <div className="text-[10px] truncate" style={{ color: 'var(--t-text-muted)' }}>{r.baseUrl}</div>
              </div>
              <button onClick={() => onLoad(r)} className="px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300 text-[10px]">加载</button>
              <button onClick={() => onExport(r)} className="px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-[10px]">导出</button>
              <button onClick={() => onDelete(r.id)} className="p-1 text-red-400 hover:bg-red-500/20 rounded">
                <Trash className="h-3 w-3" />
              </button>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}

// ====================================================================
// Deep Crawl Panel (crawl4ai-style pipeline)
// ====================================================================

function DeepCrawlPanel(props: {
  activeUrl: string;
  pageData: WebPageData | null;
  config: CrawlConfig;
  setConfig: (c: CrawlConfig) => void;
  result: MarkdownResult | null;
  setResult: (r: MarkdownResult | null) => void;
  loading: boolean;
  setLoading: (b: boolean) => void;
  view: 'raw' | 'fit' | 'cited';
  setView: (v: 'raw' | 'fit' | 'cited') => void;
}) {
  const { activeUrl, pageData, config, setConfig, result, setResult, loading, setLoading, view, setView } = props;

  const updateCfg = (patch: Partial<CrawlConfig>) => setConfig({ ...config, ...patch });

  const handleRun = async () => {
    setLoading(true);
    try {
      let html = '';
      let baseUrl = activeUrl;
      if (pageData?.html) html = pageData.html;
      else if (activeUrl) {
        const r = await dataScrapingService.fetchHtml(activeUrl);
        if (!r.ok) { setResult(null); setLoading(false); return; }
        html = r.html;
        baseUrl = activeUrl;
      } else return;
      const out = await markdownService.crawl(html, baseUrl, config);
      setResult(out);
    } finally {
      setLoading(false);
    }
  };

  const copy = (s: string) => navigator.clipboard?.writeText(s);
  const download = (s: string, filename: string, mime: string) => {
    const blob = new Blob([s], { type: mime });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a'); a.href = url; a.download = filename;
    a.click(); URL.revokeObjectURL(url);
  };

  const md = result ? (view === 'raw' ? result.raw_markdown : view === 'cited' ? result.markdown_with_citations : result.fit_markdown) : '';
  const ratio = result ? (result.stats.fitChars / Math.max(result.stats.rawChars, 1) * 100).toFixed(1) : '0';

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        Crawl4AI 风格深度爬取:内容选择 → 启发式剪枝 → BM25 相关性 → Markdown 三态输出
      </p>

      {/* Quick config row */}
      <div className="grid grid-cols-3 gap-1.5">
        <label className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
          CSS 范围
          <input
            value={config.cssSelector || ''}
            onChange={e => updateCfg({ cssSelector: e.target.value || undefined })}
            placeholder="例如 #main, article"
            className="w-full glass-input rounded px-2 py-1 text-xs font-mono mt-0.5"
          />
        </label>
        <label className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
          词数阈值
          <input
            type="number" value={config.wordCountThreshold ?? 10}
            onChange={e => updateCfg({ wordCountThreshold: parseInt(e.target.value) || 0 })}
            className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5"
          />
        </label>
        <label className="text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
          BM25 查询
          <input
            value={config.bm25 && typeof config.bm25 === 'object' ? config.bm25.userQuery : ''}
            onChange={e => updateCfg({ bm25: { ...(config.bm25 && typeof config.bm25 === 'object' ? config.bm25 : { userQuery: '' }), userQuery: e.target.value } })}
            placeholder="聚焦主题关键词"
            className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5"
          />
        </label>
      </div>

      {/* Toggle row */}
      <div className="flex flex-wrap gap-1.5 text-[10px]">
        {[
          ['excludeExternalLinks', '过滤外链'],
          ['excludeExternalImages', '过滤外图'],
          ['excludeSocialMediaLinks', '过滤社媒'],
          ['processIframes', '合并 iframe'],
          ['removeOverlayElements', '移除遮罩'],
          ['removeConsentPopups', '移除 Cookie 弹窗'],
        ].map(([k, label]) => (
          <label key={k} className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" style={{ background: (config as any)[k] ? 'var(--t-accent-subtle)' : 'rgba(0,0,0,0.2)', color: (config as any)[k] ? 'var(--t-accent-light)' : 'var(--t-text-muted)' }}>
            <input type="checkbox" checked={!!(config as any)[k]} onChange={e => updateCfg({ [k]: e.target.checked })} className="rounded" />
            {label}
          </label>
        ))}
        <label className="flex items-center gap-1 px-2 py-1 rounded cursor-pointer" style={{ background: config.twoPass ? 'var(--t-accent-subtle)' : 'rgba(0,0,0,0.2)', color: config.twoPass ? 'var(--t-accent-light)' : 'var(--t-text-muted)' }}>
          <input type="checkbox" checked={!!config.twoPass} onChange={e => updateCfg({ twoPass: e.target.checked })} className="rounded" />
          🧪 剪枝 + BM25 两阶段
        </label>
      </div>

      {/* Excluded tags */}
      <details className="text-[10px]">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🏷️ 排除标签 ({config.excludedTags?.length || 0})</summary>
        <input
          value={(config.excludedTags || []).join(', ')}
          onChange={e => updateCfg({ excludedTags: e.target.value.split(',').map(s => s.trim()).filter(Boolean) })}
          placeholder="form, nav, footer, header, aside, ..."
          className="mt-1 w-full glass-input rounded px-2 py-1 text-xs"
        />
      </details>

      {/* Action row */}
      <div className="flex items-center gap-2">
        <button
          onClick={handleRun}
          disabled={loading}
          className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
        >
          {loading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Layers className="h-3.5 w-3.5" />}
          深度爬取
        </button>
        {result && (
          <>
            <div className="text-[10px] flex items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
              <span>原始 {result.stats.rawChars} 字符</span>
              <span>→</span>
              <span className="text-green-400">FIT {result.stats.fitChars} 字符 ({ratio}%)</span>
              <span>·</span>
              <span>保留 {result.stats.blocksKept}/{result.stats.blocksTotal} 块</span>
            </div>
            <div className="flex-1" />
            <div className="flex rounded-lg overflow-hidden" style={{ border: '1px solid var(--t-glass-border)' }}>
              {(['fit', 'raw', 'cited'] as const).map(v => (
                <button key={v} onClick={() => setView(v)} className="px-2 py-1 text-[10px]" style={{ background: view === v ? 'var(--t-accent-subtle)' : 'transparent', color: view === v ? 'var(--t-accent-light)' : 'var(--t-text-muted)' }}>
                  {v === 'fit' ? 'Fit' : v === 'raw' ? 'Raw' : '引用'}
                </button>
              ))}
            </div>
          </>
        )}
      </div>

      {/* Output */}
      {result && (
        <div className="space-y-2">
          <div className="flex flex-wrap items-center gap-1.5">
            <button onClick={() => copy(md)} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10" style={{ color: 'var(--t-text-secondary)' }}>📋 复制 Markdown</button>
            <button onClick={() => download(md, `crawl-${Date.now()}.md`, 'text/markdown')} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10" style={{ color: 'var(--t-text-secondary)' }}>💾 下载 .md</button>
            <button onClick={() => download(result.fit_html, `crawl-${Date.now()}-fit.html`, 'text/html')} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10" style={{ color: 'var(--t-text-secondary)' }}>🌐 fit HTML</button>
            <button onClick={() => download(JSON.stringify(result, null, 2), `crawl-${Date.now()}.json`, 'application/json')} className="text-[10px] px-2 py-1 rounded bg-white/5 hover:bg-white/10" style={{ color: 'var(--t-text-secondary)' }}>📦 完整 JSON</button>
            <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>🔗 {result.internal_links.length} 内链 / {result.external_links.length} 外链 / 🖼️ {result.media.length} 媒体</span>
          </div>

          {/* Markdown preview */}
          <pre className="p-3 rounded-lg text-[11px] font-mono whitespace-pre-wrap break-words max-h-72 overflow-auto" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text)', lineHeight: '1.5' }}>
            {md || '(空)'}
          </pre>

          {/* Collapsible sections */}
          <details className="text-[10px]">
            <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🔗 链接 ({result.internal_links.length + result.external_links.length})</summary>
            <div className="mt-1 max-h-32 overflow-y-auto grid grid-cols-2 gap-1">
              {[...result.internal_links, ...result.external_links].slice(0, 60).map((l, i) => (
                <div key={i} className="rounded p-1 truncate" style={{ background: 'rgba(0,0,0,0.2)', color: 'var(--t-text-secondary)' }} title={l.href}>
                  {l.internal ? '🔗' : '🌐'} {l.text || l.href}
                </div>
              ))}
            </div>
          </details>

          <details className="text-[10px]">
            <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🖼️ 媒体 ({result.media.length})</summary>
            <div className="mt-1 grid grid-cols-4 gap-1 max-h-40 overflow-y-auto">
              {result.media.slice(0, 20).map((m, i) => (
                <div key={i} className="rounded p-1" style={{ background: 'rgba(0,0,0,0.2)' }}>
                  {m.type === 'image' ? (
                    <img src={m.src} alt={m.alt} className="w-full h-12 object-cover rounded" onError={e => (e.target as HTMLImageElement).style.display = 'none'} />
                  ) : (
                    <div className="h-12 flex items-center justify-center" style={{ color: 'var(--t-text-muted)' }}>🎬 {m.type}</div>
                  )}
                  <div className="truncate mt-0.5" title={m.src} style={{ color: 'var(--t-text-muted)' }}>{m.alt || m.src.split('/').pop()}</div>
                </div>
              ))}
            </div>
          </details>

          {result.metadata.title && (
            <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
              📄 <strong style={{ color: 'var(--t-text)' }}>{result.metadata.title}</strong>
              {result.metadata.description && <span> — {result.metadata.description}</span>}
              {result.metadata.lang && <span> · lang={result.metadata.lang}</span>}
            </div>
          )}
        </div>
      )}
    </div>
  );
}

// ====================================================================
// Smart Crawler Panel (multi-URL / BFS-DFS / Sitemap discovery)
// ====================================================================

function SmartCrawlerPanel(props: {
  mode: 'multi' | 'deep' | 'sitemap' | 'prefetch';
  setMode: (m: 'multi' | 'deep' | 'sitemap' | 'prefetch') => void;
  strategy: 'bfs' | 'dfs' | 'best_first' | 'adaptive';
  setStrategy: (s: 'bfs' | 'dfs' | 'best_first' | 'adaptive') => void;
  urls: string; setUrls: (s: string) => void;
  sitemapUrl: string; setSitemapUrl: (s: string) => void;
  maxDepth: number; setMaxDepth: (n: number) => void;
  maxPages: number; setMaxPages: (n: number) => void;
  scoreThreshold: number; setScoreThreshold: (n: number) => void;
  keywords: string; setKeywords: (s: string) => void;
  allowedDomains: string; setAllowedDomains: (s: string) => void;
  blockedDomains: string; setBlockedDomains: (s: string) => void;
  urlPatterns: string; setUrlPatterns: (s: string) => void;
  excludePatterns: string; setExcludePatterns: (s: string) => void;
  adaptiveQuery: string; setAdaptiveQuery: (s: string) => void;
  concurrency: number; setConcurrency: (n: number) => void;
  delayMs: number; setDelayMs: (n: number) => void;
  useCache: boolean; setUseCache: (b: boolean) => void;
  rotateUA: boolean; setRotateUA: (b: boolean) => void;
  customHeaders: string; setCustomHeaders: (s: string) => void;
  result: CrawlDeepResult | null;
  setResult: (r: CrawlDeepResult | null) => void;
  loading: boolean; setLoading: (b: boolean) => void;
  log: string[]; setLog: (l: string[]) => void;
  abort: AbortController | null; setAbort: (a: AbortController | null) => void;
  checkpointName: string; setCheckpointName: (s: string) => void;
  savedStates: string[]; refreshStates: () => void;
  sitemapDiscovered: string[]; setSitemapDiscovered: (u: string[]) => void;
}) {
  const p = props;
  const addLog = (msg: string) => p.setLog([...p.log.slice(-200), `[${new Date().toLocaleTimeString()}] ${msg}`]);

  const buildConfig = (): CrawlDeepConfig | null => {
    const startUrls = p.urls.split('\n').map(s => s.trim()).filter(Boolean);
    if (startUrls.length === 0) {
      if (p.mode === 'sitemap' && p.sitemapDiscovered.length > 0) {
        // use discovered
      } else return null;
    }
    let customHeaders: Record<string, string> | undefined;
    if (p.customHeaders.trim()) {
      try { customHeaders = JSON.parse(p.customHeaders); } catch { addLog('⚠️ 自定义 Headers JSON 解析失败,已忽略'); }
    }
    return {
      strategy: p.strategy,
      startUrls: p.mode === 'sitemap' ? p.sitemapDiscovered : startUrls,
      maxDepth: p.maxDepth,
      maxPages: p.maxPages,
      scoreThreshold: p.scoreThreshold,
      keywords: p.keywords.split(',').map(s => s.trim()).filter(Boolean),
      keywordWeight: 0.7,
      allowedDomains: p.allowedDomains.split(',').map(s => s.trim()).filter(Boolean),
      blockedDomains: p.blockedDomains.split(',').map(s => s.trim()).filter(Boolean),
      urlPatterns: p.urlPatterns.split('\n').map(s => s.trim()).filter(Boolean),
      excludePatterns: p.excludePatterns.split('\n').map(s => s.trim()).filter(Boolean),
      adaptiveQuery: p.adaptiveQuery,
      adaptiveStagnation: 5,
      concurrency: p.concurrency,
      delayMs: p.delayMs,
      useCache: p.useCache,
      rotateUserAgent: p.rotateUA,
      customHeaders,
      hooks: {
        beforeFetch: (u) => { addLog(`→ ${u.slice(0, 80)}`); },
        afterFetch: (u, ok, ms) => { addLog(`  ${ok ? '✓' : '✗'} ${u.slice(0, 60)} (${ms}ms)`); },
        onPageResult: (pg) => { addLog(`📄 d=${pg.depth} ${pg.url.slice(0, 60)} ${pg.fromCache ? '[cached]' : ''}`); },
        onError: (u, e) => { addLog(`❌ ${u.slice(0, 60)}: ${e}`); },
      },
    };
  };

  const handleRun = async () => {
    p.setLog([]);
    p.setResult(null);
    const cfg = buildConfig();
    if (!cfg) { addLog('❌ 请先输入至少一个 URL 或发现 sitemap'); return; }
    if (cfg.startUrls.length === 0) { addLog('❌ 没有可用的起始 URL'); return; }
    const ctrl = new AbortController();
    p.setAbort(ctrl);
    p.setLoading(true);
    addLog(`🚀 启动 ${p.mode === 'deep' ? p.strategy.toUpperCase() : p.mode} 模式 · ${cfg.startUrls.length} 起始 URL`);

    try {
      let result: CrawlDeepResult;
      if (p.mode === 'multi' || p.mode === 'sitemap') {
        result = await crawlerService.crawlMulti(cfg.startUrls, { ...cfg, signal: ctrl.signal });
      } else if (p.mode === 'prefetch') {
        result = await crawlerService.crawlPrefetch(cfg.startUrls, { ...cfg, signal: ctrl.signal });
      } else {
        result = await crawlerService.crawlDeep({ ...cfg, signal: ctrl.signal });
      }
      p.setResult(result);
      addLog(`✅ 完成: ${result.stats.success} 成功 / ${result.stats.failed} 失败 · 用时 ${result.stats.durationMs}ms`);
    } catch (e) {
      addLog(`❌ 异常: ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      p.setLoading(false);
      p.setAbort(null);
    }
  };

  const handleCancel = () => {
    p.abort?.abort();
    addLog('⏹ 已发送取消信号');
  };

  const handleDiscoverSitemap = async () => {
    if (!p.sitemapUrl.trim()) { addLog('❌ 请输入站点 URL'); return; }
    p.setLoading(true);
    addLog(`🔍 发现 sitemap: ${p.sitemapUrl}`);
    try {
      const urls = await crawlerService.sitemap.discover(p.sitemapUrl.trim());
      p.setSitemapDiscovered(urls);
      p.setUrls(urls.join('\n'));
      addLog(`✅ 发现 ${urls.length} 个 URL`);
    } catch (e) {
      addLog(`❌ ${e instanceof Error ? e.message : String(e)}`);
    } finally {
      p.setLoading(false);
    }
  };

  const handleSaveCheckpoint = () => {
    if (!p.result || !p.checkpointName.trim()) { addLog('❌ 需要运行结果和名称'); return; }
    crawlerService.saveStateToStorage(p.checkpointName.trim(), p.result.state);
    p.refreshStates();
    addLog(`💾 已保存检查点: ${p.checkpointName}`);
  };

  const handleLoadCheckpoint = (name: string) => {
    const state = crawlerService.loadStateFromStorage(name);
    if (state) {
      const urls = state.visited.concat(state.pending.map(p => p.url));
      p.setUrls(Array.from(new Set(urls)).join('\n'));
      addLog(`📂 已加载检查点: ${name} (${state.pagesCrawled} 页已爬)`);
    }
  };

  const downloadJson = () => {
    if (!p.result) return;
    const blob = new Blob([JSON.stringify(p.result, null, 2)], { type: 'application/json' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `crawl-${Date.now()}.json`; a.click();
  };

  const downloadMarkdown = () => {
    if (!p.result) return;
    const md = p.result.pages.filter(p => p.ok).map(p =>
      `# ${p.url}\n\n深度: ${p.depth} | 状态: ${p.status} | ${p.durationMs}ms\n\n${p.markdown || ''}\n\n---\n\n`
    ).join('');
    const blob = new Blob([md], { type: 'text/markdown' });
    const a = document.createElement('a'); a.href = URL.createObjectURL(blob); a.download = `crawl-${Date.now()}.md`; a.click();
  };

  return (
    <div className="space-y-2">
      <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
        Crawl4AI 风格智能爬虫:多 URL 并发 / BFS·DFS·BestFirst·Adaptive 深度 / Sitemap 发现 / 缓存 / 重试 / 检查点
      </p>

      {/* Mode tabs */}
      <div className="flex gap-1 text-xs">
        {[
          ['multi', '📋 多 URL'],
          ['deep', '🌳 深度爬取'],
          ['sitemap', '🗺️ Sitemap'],
          ['prefetch', '⚡ 快速发现'],
        ].map(([m, l]) => (
          <button key={m} onClick={() => p.setMode(m as any)}
            className={`px-2 py-1 rounded ${p.mode === m ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/5'}`}
            style={{ color: p.mode === m ? undefined : 'var(--t-text-secondary)' }}>
            {l}
          </button>
        ))}
      </div>

      {/* Strategy for deep mode */}
      {p.mode === 'deep' && (
        <div className="flex gap-1 text-xs">
          {(['bfs', 'dfs', 'best_first', 'adaptive'] as const).map(s => (
            <button key={s} onClick={() => p.setStrategy(s)}
              className={`px-2 py-1 rounded ${p.strategy === s ? 'bg-blue-500/20 text-blue-300' : 'hover:bg-white/5'}`}
              style={{ color: p.strategy === s ? undefined : 'var(--t-text-secondary)' }}>
              {s === 'bfs' ? 'BFS 广度' : s === 'dfs' ? 'DFS 深度' : s === 'best_first' ? 'BestFirst' : 'Adaptive 自适应'}
            </button>
          ))}
        </div>
      )}

      {/* URL input */}
      {p.mode === 'sitemap' ? (
        <div className="flex gap-1.5">
          <input value={p.sitemapUrl} onChange={e => p.setSitemapUrl(e.target.value)}
            placeholder="站点 URL (例如 https://example.com)"
            className="flex-1 glass-input rounded px-2 py-1.5 text-xs font-mono" />
          <button onClick={handleDiscoverSitemap} disabled={p.loading}
            className="px-2 py-1.5 rounded bg-purple-500/20 hover:bg-purple-500/30 text-purple-300 text-xs disabled:opacity-50">
            🔍 发现 Sitemap
          </button>
        </div>
      ) : (
        <textarea value={p.urls} onChange={e => p.setUrls(e.target.value)}
          placeholder={`URL 列表 (每行一个):\nhttps://example.com\nhttps://example.com/blog\n${p.sitemapDiscovered.length > 0 ? `已发现 ${p.sitemapDiscovered.length} 个 sitemap URL` : ''}`}
          rows={4}
          className="w-full glass-input rounded p-2 text-xs font-mono" />
      )}

      {/* Depth + max pages row */}
      {p.mode === 'deep' && (
        <div className="grid grid-cols-3 gap-1.5 text-[10px]">
          <label style={{ color: 'var(--t-text-secondary)' }}>
            最大深度
            <input type="number" value={p.maxDepth} onChange={e => p.setMaxDepth(parseInt(e.target.value) || 1)}
              className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5" />
          </label>
          <label style={{ color: 'var(--t-text-secondary)' }}>
            最大页数
            <input type="number" value={p.maxPages} onChange={e => p.setMaxPages(parseInt(e.target.value) || 10)}
              className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5" />
          </label>
          <label style={{ color: 'var(--t-text-secondary)' }}>
            分数阈值
            <input type="number" step="0.05" value={p.scoreThreshold} onChange={e => p.setScoreThreshold(parseFloat(e.target.value) || 0)}
              className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5" />
          </label>
        </div>
      )}

      {/* Scorer + Adaptive query */}
      {(p.mode === 'deep' || p.mode === 'multi') && (
        <details className="text-[10px]">
          <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🎯 Scorer / 自适应停止 ({p.keywords ? p.keywords.split(',').length : 0} 关键词)</summary>
          <div className="mt-1 space-y-1">
            <input value={p.keywords} onChange={e => p.setKeywords(e.target.value)}
              placeholder="关键词 (逗号分隔) - 用于 URL 相关性评分" className="w-full glass-input rounded px-2 py-1 text-xs" />
            {p.strategy === 'adaptive' && (
              <input value={p.adaptiveQuery} onChange={e => p.setAdaptiveQuery(e.target.value)}
                placeholder="自适应查询 - 触发早停的信息目标" className="w-full glass-input rounded px-2 py-1 text-xs" />
            )}
          </div>
        </details>
      )}

      {/* Filters */}
      <details className="text-[10px]">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>🔍 过滤器 (URL 模式 / 域名)</summary>
        <div className="mt-1 grid grid-cols-2 gap-1.5">
          <input value={p.urlPatterns} onChange={e => p.setUrlPatterns(e.target.value)}
            placeholder="URL 包含 (每行, 支持 * 通配)" className="glass-input rounded px-2 py-1 text-xs" />
          <input value={p.excludePatterns} onChange={e => p.setExcludePatterns(e.target.value)}
            placeholder="URL 排除 (每行)" className="glass-input rounded px-2 py-1 text-xs" />
          <input value={p.allowedDomains} onChange={e => p.setAllowedDomains(e.target.value)}
            placeholder="允许域名 (逗号)" className="glass-input rounded px-2 py-1 text-xs" />
          <input value={p.blockedDomains} onChange={e => p.setBlockedDomains(e.target.value)}
            placeholder="阻止域名 (逗号)" className="glass-input rounded px-2 py-1 text-xs" />
        </div>
      </details>

      {/* Network options */}
      <details className="text-[10px]">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>⚙️ 网络 / 缓存</summary>
        <div className="mt-1 grid grid-cols-3 gap-1.5">
          <label style={{ color: 'var(--t-text-secondary)' }}>
            并发数
            <input type="number" value={p.concurrency} onChange={e => p.setConcurrency(parseInt(e.target.value) || 1)}
              className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5" />
          </label>
          <label style={{ color: 'var(--t-text-secondary)' }}>
            间隔 (ms)
            <input type="number" value={p.delayMs} onChange={e => p.setDelayMs(parseInt(e.target.value) || 0)}
              className="w-full glass-input rounded px-2 py-1 text-xs mt-0.5" />
          </label>
          <div className="flex flex-col gap-1 mt-3">
            <label className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
              <input type="checkbox" checked={p.useCache} onChange={e => p.setUseCache(e.target.checked)} className="rounded" />
              缓存 ({crawlerService.cacheSize()})
            </label>
            <label className="flex items-center gap-1 cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
              <input type="checkbox" checked={p.rotateUA} onChange={e => p.setRotateUA(e.target.checked)} className="rounded" />
              轮换 UA
            </label>
          </div>
        </div>
        <textarea value={p.customHeaders} onChange={e => p.setCustomHeaders(e.target.value)}
          placeholder='自定义 Headers (JSON): {"Authorization": "Bearer ..."}' rows={2}
          className="mt-1 w-full glass-input rounded p-1.5 text-xs font-mono" />
        <button onClick={() => { crawlerService.clearCache(); addLog('🗑️ 缓存已清空'); }}
          className="mt-1 text-[10px] px-2 py-1 rounded bg-red-500/10 hover:bg-red-500/20 text-red-300">
          🗑️ 清空缓存
        </button>
      </details>

      {/* Checkpoint */}
      <details className="text-[10px]">
        <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>💾 检查点 (断点续爬 · {p.savedStates.length})</summary>
        <div className="mt-1 flex gap-1.5">
          <input value={p.checkpointName} onChange={e => p.setCheckpointName(e.target.value)}
            placeholder="检查点名称" className="flex-1 glass-input rounded px-2 py-1 text-xs" />
          <button onClick={handleSaveCheckpoint} className="px-2 py-1 rounded bg-green-500/20 hover:bg-green-500/30 text-green-300 text-xs">💾 保存</button>
        </div>
        {p.savedStates.length > 0 && (
          <div className="mt-1 flex flex-wrap gap-1">
            {p.savedStates.map(name => (
              <span key={name} className="inline-flex items-center gap-1 px-1.5 py-0.5 rounded text-[10px]" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <button onClick={() => handleLoadCheckpoint(name)} className="hover:underline" style={{ color: 'var(--t-accent-light)' }}>{name}</button>
                <button onClick={() => { crawlerService.deleteState(name); p.refreshStates(); }} className="text-red-400 hover:text-red-300">×</button>
              </span>
            ))}
          </div>
        )}
      </details>

      {/* Run row */}
      <div className="flex items-center gap-2">
        {!p.loading ? (
          <button onClick={handleRun}
            className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs flex items-center gap-1.5">
            <Globe className="h-3.5 w-3.5" />
            启动爬虫
          </button>
        ) : (
          <button onClick={handleCancel}
            className="px-3 py-2 rounded-lg bg-red-500/20 hover:bg-red-500/30 text-red-400 text-xs flex items-center gap-1.5">
            <X className="h-3.5 w-3.5" /> 取消
          </button>
        )}
        {p.result && (
          <>
            <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
              ✓ {p.result.stats.success} 成功 · ✗ {p.result.stats.failed} 失败
              {p.result.stats.fromCache > 0 && ` · 💾 ${p.result.stats.fromCache} 缓存`}
              {p.result.stats.maxDepthReached > 0 && ` · 深度 ${p.result.stats.maxDepthReached}`}
              · {p.result.stats.durationMs}ms
            </div>
            <div className="flex-1" />
            <button onClick={downloadJson} className="text-[10px] px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300">JSON</button>
            <button onClick={downloadMarkdown} className="text-[10px] px-2 py-1 rounded bg-blue-500/20 hover:bg-blue-500/30 text-blue-300">MD</button>
          </>
        )}
      </div>

      {/* Live log */}
      {p.log.length > 0 && (
        <div className="rounded p-2 text-[10px] font-mono max-h-32 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text-secondary)' }}>
          {p.log.slice(-30).map((l, i) => <div key={i}>{l}</div>)}
        </div>
      )}

      {/* Results table */}
      {p.result && p.result.pages.length > 0 && (
        <details open className="text-[10px]">
          <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
            📑 页面结果 ({p.result.pages.length})
            {p.result.discoveredUrls.length > p.result.pages.length && ` · 🔍 已发现 ${p.result.discoveredUrls.length} URL`}
          </summary>
          <div className="mt-1 max-h-72 overflow-y-auto rounded border" style={{ borderColor: 'var(--t-glass-border)' }}>
            <table className="w-full">
              <thead className="sticky top-0" style={{ background: 'var(--t-bg-secondary)' }}>
                <tr>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>✓</th>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>深</th>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>分</th>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>URL</th>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>大小</th>
                  <th className="px-1 py-1 text-left" style={{ color: 'var(--t-accent-light)' }}>耗时</th>
                </tr>
              </thead>
              <tbody>
                {p.result.pages.map((pg, i) => (
                  <tr key={i} className="hover:bg-white/5">
                    <td className="px-1 py-0.5">{pg.ok ? (pg.fromCache ? '💾' : '✓') : '✗'}</td>
                    <td className="px-1 py-0.5">{pg.depth}</td>
                    <td className="px-1 py-0.5">{pg.score != null ? pg.score.toFixed(2) : '-'}</td>
                    <td className="px-1 py-0.5 max-w-xs truncate" title={pg.url}>
                      {pg.url}
                      {pg.error && <span className="text-red-400 ml-1">({pg.error.slice(0, 30)})</span>}
                    </td>
                    <td className="px-1 py-0.5">{(pg.sizeBytes / 1024).toFixed(1)}k</td>
                    <td className="px-1 py-0.5">{pg.durationMs}ms{pg.retries > 0 ? ` (×${pg.retries})` : ''}</td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>
          {p.result.discoveredUrls.length > p.result.pages.length && (
            <details className="mt-1">
              <summary className="cursor-pointer text-[10px]" style={{ color: 'var(--t-text-secondary)' }}>
                🔍 未爬取的已发现 URL ({p.result.discoveredUrls.length - p.result.pages.length})
              </summary>
              <div className="mt-1 max-h-24 overflow-y-auto text-[10px] font-mono" style={{ color: 'var(--t-text-muted)' }}>
                {p.result.discoveredUrls.filter(u => !p.result!.pages.some(pg => pg.url === u)).slice(0, 50).map((u, i) => <div key={i} className="truncate">{u}</div>)}
              </div>
            </details>
          )}
        </details>
      )}
    </div>
  );
}

export function BrowserAutomationPage() {
  const [sessions, setSessions] = useState<BrowserSession[]>([]);
  const [activeSessionId, setActiveSessionId] = useState<string | null>(null);
  const [url, setUrl] = useState('');
  const [isLoading, setIsLoading] = useState(false);
  const [pageData, setPageData] = useState<WebPageData | null>(null);
  const [taskHistory, setTaskHistory] = useState<AutomationTask[]>([]);
  const [showScrapePanel, setShowScrapePanel] = useState(false);
  const [scrapeConfig, setScrapeConfig] = useState({ selector: '', multiple: false });
  const [scrapedData, setScrapedData] = useState<any>(null);
  const [scrapeError, setScrapeError] = useState<string | null>(null);
  const [isScraping, setIsScraping] = useState(false);
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);
  const [error, setError] = useState<string | null>(null);

  // Tools panel state
  const [toolTab, setToolTab] = useState<ToolTab>('scrape');

  // API Tester state
  const [apiReq, setApiReq] = useState({ method: 'GET', url: '', headers: '', body: '' });
  const [apiRes, setApiRes] = useState<ApiTestResponse | null>(null);
  const [apiError, setApiError] = useState<string | null>(null);
  const [apiLoading, setApiLoading] = useState(false);

  // Ping state
  const [pingUrl, setPingUrl] = useState('');
  const [pingResult, setPingResult] = useState<PingResult | null>(null);
  const [pingLoading, setPingLoading] = useState(false);

  // Batch Scrape state
  const [batchUrls, setBatchUrls] = useState('');
  const [batchSelector, setBatchSelector] = useState('');
  const [batchResults, setBatchResults] = useState<BatchScrapeItem[] | null>(null);
  const [batchLoading, setBatchLoading] = useState(false);

  // Form fields state
  const [formFields, setFormFields] = useState<Array<{ tag: string; type: string; name: string; id?: string; placeholder?: string; value?: string; required: boolean; options?: string[] }> | null>(null);
  const [formLoading, setFormLoading] = useState(false);

  // Schema extractor state
  const [schemaFields, setSchemaFields] = useState<ScrapeField[]>([
    { name: 'title', selector: 'h1', multiple: false },
    { name: 'links', selector: 'a[href]', multiple: true },
  ]);
  const [schemaResults, setSchemaResults] = useState<Record<string, any>[] | null>(null);
  const [schemaLoading, setSchemaLoading] = useState(false);
  const [schemaHeaders, setSchemaHeaders] = useState('');
  const [schemaRecipeName, setSchemaRecipeName] = useState('');

  // Pagination state
  const [pagUrl, setPagUrl] = useState('');
  const [pagFields, setPagFields] = useState<ScrapeField[]>([
    { name: 'title', selector: 'h1', multiple: false },
  ]);
  const [pagNextSel, setPagNextSel] = useState('a.next, a[rel="next"], .pagination .next a');
  const [pagMax, setPagMax] = useState(5);
  const [pagDelay, setPagDelay] = useState(800);
  const [pagResult, setPagResult] = useState<PaginationResult | null>(null);
  const [pagLoading, setPagLoading] = useState(false);
  const [pagProgress, setPagProgress] = useState({ page: 0, total: 0, items: 0 });
  const [pagDedupeBy, setPagDedupeBy] = useState('');

  // URL pattern generator state
  const [urlPattern, setUrlPattern] = useState('https://example.com/list?page={n}');
  const [urlStart, setUrlStart] = useState(1);
  const [urlEnd, setUrlEnd] = useState(20);
  const [urlPad, setUrlPad] = useState(0);
  const [generatedUrls, setGeneratedUrls] = useState<string[]>([]);

  // Structured data state
  const [structuredData, setStructuredData] = useState<StructuredDataResult | null>(null);
  const [structuredLoading, setStructuredLoading] = useState(false);

  // Recipes state
  const [recipes, setRecipes] = useState<ScrapeRecipe[]>([]);
  useEffect(() => { setRecipes(dataScrapingService.loadRecipes()); }, []);
  const refreshRecipes = () => setRecipes(dataScrapingService.loadRecipes());

  // Deep crawl state (crawl4ai-style pipeline)
  const [dcConfig, setDcConfig] = useState<CrawlConfig>({
    wordCountThreshold: 10,
    excludedTags: ['form', 'nav', 'footer', 'header'],
    excludeExternalLinks: false,
    excludeSocialMediaLinks: true,
    excludeExternalImages: true,
    removeOverlayElements: true,
    removeConsentPopups: true,
    pruning: { threshold: 0.45, thresholdType: 'dynamic', minWordThreshold: 5 },
    bm25: { userQuery: '', bm25Threshold: 1.0 },
    twoPass: true,
    markdownOptions: { ignoreLinks: false, ignoreImages: false, bodyWidth: 0 },
  });
  const [dcResult, setDcResult] = useState<MarkdownResult | null>(null);
  const [dcLoading, setDcLoading] = useState(false);
  const [dcView, setDcView] = useState<'raw' | 'fit' | 'cited'>('fit');

  // Smart Crawler state (multi-URL / deep crawl / sitemap)
  const [crMode, setCrMode] = useState<'multi' | 'deep' | 'sitemap' | 'prefetch'>('multi');
  const [crStrategy, setCrStrategy] = useState<'bfs' | 'dfs' | 'best_first' | 'adaptive'>('bfs');
  const [crUrls, setCrUrls] = useState('');
  const [crSitemapUrl, setCrSitemapUrl] = useState('');
  const [crMaxDepth, setCrMaxDepth] = useState(2);
  const [crMaxPages, setCrMaxPages] = useState(20);
  const [crScoreThreshold, setCrScoreThreshold] = useState(0);
  const [crKeywords, setCrKeywords] = useState('');
  const [crAllowedDomains, setCrAllowedDomains] = useState('');
  const [crBlockedDomains, setCrBlockedDomains] = useState('');
  const [crUrlPatterns, setCrUrlPatterns] = useState('');
  const [crExcludePatterns, setCrExcludePatterns] = useState('');
  const [crAdaptiveQuery, setCrAdaptiveQuery] = useState('');
  const [crConcurrency, setCrConcurrency] = useState(3);
  const [crDelayMs, setCrDelayMs] = useState(500);
  const [crUseCache, setCrUseCache] = useState(true);
  const [crRotateUA, setCrRotateUA] = useState(false);
  const [crCustomHeaders, setCrCustomHeaders] = useState('');
  const [crResult, setCrResult] = useState<CrawlDeepResult | null>(null);
  const [crLoading, setCrLoading] = useState(false);
  const [crLog, setCrLog] = useState<string[]>([]);
  const [crAbort, setCrAbort] = useState<AbortController | null>(null);
  const [crCheckpointName, setCrCheckpointName] = useState('');
  const [crSavedStates, setCrSavedStates] = useState<string[]>([]);
  const [crSitemapDiscovered, setCrSitemapDiscovered] = useState<string[]>([]);
  const refreshCrStates = () => setCrSavedStates(crawlerService.listSavedStates());

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(browserAutomationService.getSessions());
      setTaskHistory(browserAutomationService.getTaskHistory());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  // Refresh page data when active session changes
  useEffect(() => {
    if (!activeSessionId) {
      setPageData(null);
      setSummary('');
      setScrapedData(null);
      setScrapeError(null);
      setError(null);
      return;
    }

    const session = sessions.find(s => s.id === activeSessionId);
    if (session && session.status === 'active') {
      browserAutomationService.extractPageContent(activeSessionId)
        .then(data => setPageData(data))
        .catch(err => console.error('Failed to extract page content:', err));
    }
  }, [activeSessionId, sessions]);

  const handleNavigate = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    setError(null);
    try {
      let session: BrowserSession;
      
      if (activeSessionId) {
        const success = await browserAutomationService.navigate(activeSessionId, url);
        if (!success) throw new Error('导航失败');
        session = sessions.find(s => s.id === activeSessionId)!;
      } else {
        session = await browserAutomationService.createSession(url);
        setActiveSessionId(session.id);
      }
      
      setUrl(session.url);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '导航失败';
      setError(msg);
      console.error('Navigation failed:', err);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshot = async () => {
    if (!activeSessionId) return;
    
    try {
      const screenshot = await browserAutomationService.takeScreenshot(activeSessionId, { fullPage: true });
      const img = new Image();
      img.src = screenshot;
      const w = window.open('', '_blank');
      w?.document.write(`<html><head><title>Screenshot</title><style>body{margin:0;background:#111;display:flex;align-items:center;justify-content:center;min-height:100vh;}img{max-width:100%;max-height:100vh;}</style></head><body>${img.outerHTML}</body></html>`);
    } catch (err) {
      console.error('Screenshot failed:', err);
    }
  };

  const handleGeneratePDF = async () => {
    if (!activeSessionId) return;
    
    try {
      const pdf = await browserAutomationService.generatePDF(activeSessionId);
      const pdfUrl = URL.createObjectURL(pdf);
      const w = window.open(pdfUrl, '_blank');
      if (w) {
        w.document.write(`<html><head><title>Print Page</title><style>@media print{body{margin:0;}}</style></head><body onload="window.print()"><p>如果未自动弹出打印对话框，请按 Ctrl+P 打印。</p></body></html>`);
      }
      setTimeout(() => URL.revokeObjectURL(pdfUrl), 5000);
    } catch (err) {
      console.error('PDF generation failed:', err);
    }
  };

  const handleScrape = async () => {
    if (!activeSessionId) {
      setScrapeError('请先访问一个网页');
      return;
    }
    if (!scrapeConfig.selector.trim()) {
      setScrapeError('请输入CSS选择器');
      return;
    }
    
    setIsScraping(true);
    setScrapeError(null);
    setScrapedData(null);
    try {
      const data = await browserAutomationService.scrape(activeSessionId, {
        selector: scrapeConfig.selector,
        multiple: scrapeConfig.multiple,
      });
      setScrapedData(data);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '抓取失败';
      setScrapeError(msg);
      setScrapedData(null);
    } finally {
      setIsScraping(false);
    }
  };

  const handleSummarize = async () => {
    if (!activeSessionId) return;
    
    setIsSummarizing(true);
    try {
      const result = await browserAutomationService.summarizePage(activeSessionId);
      setSummary(result);
    } catch (err) {
      console.error('Summarization failed:', err);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSearchAndSummarize = async () => {
    if (!url.trim()) return;

    setIsLoading(true);
    setIsSummarizing(true);
    setError(null);
    try {
      const result = await browserAutomationService.searchAndSummarize('关键信息', url);
      setSummary(result.summary);

      const session = await browserAutomationService.createSession(url);
      setActiveSessionId(session.id);
    } catch (err) {
      const msg = err instanceof Error ? err.message : '搜索失败';
      setError(msg);
    } finally {
      setIsLoading(false);
      setIsSummarizing(false);
    }
  };

  // API Tester
  const handleTestApi = async () => {
    if (!apiReq.url.trim()) { setApiError('请输入 URL'); return; }
    setApiLoading(true);
    setApiError(null);
    setApiRes(null);
    try {
      let headers: Record<string, string> | undefined;
      if (apiReq.headers.trim()) {
        try {
          headers = JSON.parse(apiReq.headers);
        } catch {
          // try as raw "K: V" lines
          headers = {};
          apiReq.headers.split('\n').forEach(line => {
            const idx = line.indexOf(':');
            if (idx > 0) {
              const k = line.slice(0, idx).trim();
              const v = line.slice(idx + 1).trim();
              if (k) headers![k] = v;
            }
          });
        }
      }
      const res = await realWorldService.testApi({
        method: apiReq.method as any,
        url: apiReq.url,
        headers,
        body: apiReq.body || undefined,
      });
      setApiRes(res);
    } catch (e) {
      setApiError(e instanceof Error ? e.message : String(e));
    } finally {
      setApiLoading(false);
    }
  };

  // Ping
  const handlePing = async () => {
    if (!pingUrl.trim()) return;
    setPingLoading(true);
    setPingResult(null);
    try {
      const r = await realWorldService.ping(pingUrl);
      setPingResult(r);
    } finally {
      setPingLoading(false);
    }
  };

  // Batch Scrape
  const handleBatchScrape = async () => {
    const urls = batchUrls.split('\n').map(u => u.trim()).filter(Boolean);
    if (urls.length === 0) { setBatchResults(null); return; }
    if (!batchSelector.trim()) return;
    setBatchLoading(true);
    try {
      const r = await realWorldService.batchScrape(urls, batchSelector, true);
      setBatchResults(r);
    } finally {
      setBatchLoading(false);
    }
  };

  const exportBatchJson = () => {
    if (!batchResults) return;
    realWorldService.exportJson(batchResults, `batch-scrape-${Date.now()}.json`);
  };

  const exportBatchCsv = () => {
    if (!batchResults) return;
    const rows: Array<Record<string, any>> = [];
    for (const r of batchResults) {
      if (r.items.length === 0) {
        rows.push({ url: r.url, ok: r.ok, error: r.error || '', title: r.title || '', text: '', durationMs: r.durationMs });
      } else {
        r.items.forEach((item, idx) => {
          rows.push({ url: r.url, ok: r.ok, error: r.error || '', title: r.title || '', text: item.text, index: idx + 1, durationMs: r.durationMs });
        });
      }
    }
    realWorldService.exportCsv(rows, `batch-scrape-${Date.now()}.csv`);
  };

  // Form Fields
  const handleExtractForms = () => {
    if (!activeSessionId) return;
    setFormLoading(true);
    try {
      const fields = browserAutomationService.extractFormFields(activeSessionId);
      setFormFields(fields);
    } finally {
      setFormLoading(false);
    }
  };

  const closeSession = (sessionId: string) => {
    browserAutomationService.closeSession(sessionId);
    if (activeSessionId === sessionId) {
      setActiveSessionId(null);
      setPageData(null);
    }
  };

  const activeSession = sessions.find(s => s.id === activeSessionId);

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-orange-500/20 to-red-600/20 border border-orange-500/20">
            <Globe className="h-5 w-5 text-orange-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>浏览器自动化</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>网页抓取、内容提取、截图、数据抓取</p>
          </div>
        </div>

        {/* Error Banner */}
        {error && (
          <div className="mb-3 flex items-start gap-2 rounded-lg p-3 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
            <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
            <div className="flex-1">
              <span className="text-xs text-red-400">{error}</span>
              <button onClick={() => setError(null)} className="text-red-400/60 hover:text-red-400 ml-2 text-xs">关闭</button>
            </div>
          </div>
        )}

        {/* URL Input */}
        <div className="flex gap-3">
          <div className="flex-1 relative">
            <input
              value={url}
              onChange={e => setUrl(e.target.value)}
              onKeyDown={e => e.key === 'Enter' && handleNavigate()}
              className="glass-input w-full rounded-xl py-2.5 pl-4 pr-4 text-sm"
              placeholder="输入网址 (例如: https://example.com)..."
              style={{ color: 'var(--t-text)' }}
            />
          </div>
          <button
            onClick={handleNavigate}
            disabled={isLoading || !url.trim()}
            className="px-4 py-2 rounded-xl bg-white/10 hover:bg-white/20 transition-colors flex items-center gap-2 disabled:opacity-50"
            style={{ color: 'var(--t-text)' }}
          >
            {isLoading ? (
              <Loader2 className="h-4 w-4 animate-spin" />
            ) : (
              <Play className="h-4 w-4" />
            )}
            访问
          </button>
          <button
            onClick={handleSearchAndSummarize}
            disabled={isLoading || !url.trim()}
            className="px-4 py-2 rounded-xl bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 flex items-center gap-2 disabled:opacity-50"
          >
            <Search className="h-4 w-4" />
            搜索总结
          </button>
        </div>
      </div>

      {/* Tools Tab Bar */}
      <div className="px-6 py-2 flex items-center gap-1 border-b overflow-x-auto" style={{ borderColor: 'var(--t-glass-border)' }}>
        {[
          { id: 'scrape', label: 'CSS 抓取', icon: Download },
          { id: 'schema', label: 'Schema 提取', icon: Layers },
          { id: 'pages', label: '分页爬取', icon: ListTree },
          { id: 'structured', label: '结构化数据', icon: Database },
          { id: 'deepcrawl', label: '深度爬取', icon: Layers },
          { id: 'crawler', label: '智能爬虫', icon: Globe },
          { id: 'recipes', label: '配方库', icon: BookOpen },
          { id: 'api', label: 'API 测试', icon: Code2 },
          { id: 'ping', label: '连接测试', icon: Activity },
          { id: 'batch', label: '批量抓取', icon: ListTree },
          { id: 'forms', label: '表单字段', icon: FileText },
        ].map(t => {
          const Icon = t.icon;
          const active = toolTab === t.id;
          return (
            <button
              key={t.id}
              onClick={() => setToolTab(t.id as ToolTab)}
              className={`px-3 py-1.5 rounded-lg text-xs flex items-center gap-1.5 transition-all whitespace-nowrap ${active ? 'bg-amber-500/20 text-amber-400' : 'hover:bg-white/5'}`}
              style={{ color: active ? undefined : 'var(--t-text-secondary)' }}
            >
              <Icon className="h-3.5 w-3.5" />
              {t.label}
            </button>
          );
        })}
      </div>

      {/* Tool Panels */}
      <div className="px-6 py-3 border-b max-h-96 overflow-y-auto" style={{ borderColor: 'var(--t-glass-border)' }}>
        {/* CSS Scrape (existing) */}
        {toolTab === 'scrape' && (
          <div>
            <p className="text-xs mb-2" style={{ color: 'var(--t-text-muted)' }}>
              先在上方"访问"一个网页，然后输入 CSS 选择器提取数据 (例如 <code>h1</code>, <code>.product-title</code>, <code>a[href]</code>)
            </p>
            <div className="flex gap-2">
              <input
                value={scrapeConfig.selector}
                onChange={e => { setScrapeConfig({ ...scrapeConfig, selector: e.target.value }); setScrapeError(null); }}
                onKeyDown={e => e.key === 'Enter' && handleScrape()}
                className="flex-1 glass-input rounded-lg py-2 px-3 text-sm"
                placeholder="CSS 选择器..."
                style={{ color: 'var(--t-text)' }}
              />
              <label className="flex items-center gap-2 text-xs cursor-pointer shrink-0" style={{ color: 'var(--t-text-secondary)' }}>
                <input
                  type="checkbox"
                  checked={scrapeConfig.multiple}
                  onChange={e => setScrapeConfig({ ...scrapeConfig, multiple: e.target.checked })}
                  className="rounded"
                />
                多元素
              </label>
              <button
                onClick={handleScrape}
                disabled={isScraping || !activeSessionId}
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {isScraping ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Download className="h-3.5 w-3.5" />}
                {isScraping ? '抓取中' : '抓取'}
              </button>
            </div>
            <SelectorPresets
              onPick={p => { setScrapeConfig({ selector: p.selector, multiple: p.multiple }); setScrapeError(null); }}
            />
            {scrapeError && (
              <div className="mt-2 text-xs text-red-400">⚠️ {scrapeError}</div>
            )}
            {scrapedData && (
              <pre className="mt-2 p-2 rounded-lg bg-black/20 text-xs overflow-auto max-h-48" style={{ color: 'var(--t-text-secondary)' }}>
                {JSON.stringify(scrapedData, null, 2)}
              </pre>
            )}
          </div>
        )}

        {/* API Tester */}
        {toolTab === 'api' && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
              真实 HTTP 请求测试。返回真实状态码、响应头、响应体、耗时、字节数。
            </p>
            <div className="flex gap-2">
              <select
                value={apiReq.method}
                onChange={e => setApiReq({ ...apiReq, method: e.target.value })}
                className="glass-input rounded-lg py-2 px-3 text-sm"
                style={{ color: 'var(--t-text)' }}
              >
                {['GET', 'POST', 'PUT', 'DELETE', 'PATCH', 'HEAD'].map(m => <option key={m} value={m}>{m}</option>)}
              </select>
              <input
                value={apiReq.url}
                onChange={e => setApiReq({ ...apiReq, url: e.target.value })}
                onKeyDown={e => e.key === 'Enter' && handleTestApi()}
                placeholder="https://api.github.com/repos/memory125/nexusai"
                className="flex-1 glass-input rounded-lg py-2 px-3 text-sm"
                style={{ color: 'var(--t-text)' }}
              />
              <button
                onClick={handleTestApi}
                disabled={apiLoading}
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {apiLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Send className="h-3.5 w-3.5" />}
                {apiLoading ? '请求中' : '发送'}
              </button>
            </div>
            <details className="text-xs">
              <summary style={{ color: 'var(--t-text-secondary)', cursor: 'pointer' }}>Headers / Body (可选)</summary>
              <textarea
                value={apiReq.headers}
                onChange={e => setApiReq({ ...apiReq, headers: e.target.value })}
                placeholder='Headers (JSON 或 "Key: Value" 每行一个)&#10;e.g. {"Content-Type": "application/json"}'
                className="mt-2 w-full glass-input rounded-lg p-2 text-xs font-mono"
                rows={3}
                style={{ color: 'var(--t-text)' }}
              />
              <textarea
                value={apiReq.body}
                onChange={e => setApiReq({ ...apiReq, body: e.target.value })}
                placeholder='Body (字符串, GET/HEAD 忽略)'
                className="mt-2 w-full glass-input rounded-lg p-2 text-xs font-mono"
                rows={3}
                style={{ color: 'var(--t-text)' }}
              />
            </details>
            {apiError && <div className="text-xs text-red-400">⚠️ {apiError}</div>}
            {apiRes && (
              <div className="rounded-lg p-3 space-y-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex flex-wrap items-center gap-2 text-xs">
                  <span className={`px-2 py-0.5 rounded font-bold ${apiRes.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {apiRes.status} {apiRes.statusText}
                  </span>
                  <span style={{ color: 'var(--t-text-muted)' }}>耗时 {apiRes.durationMs}ms</span>
                  <span style={{ color: 'var(--t-text-muted)' }}>{apiRes.sizeBytes} 字节</span>
                  {apiRes.contentType && <span style={{ color: 'var(--t-text-muted)' }}>{apiRes.contentType.split(';')[0]}</span>}
                </div>
                {apiRes.url !== apiRes.finalUrl && (
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>↪ {apiRes.finalUrl}</div>
                )}
                <details open>
                  <summary className="text-xs cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>Body</summary>
                  <pre className="mt-1 p-2 rounded bg-black/30 text-xs overflow-auto max-h-64" style={{ color: 'var(--t-text-secondary)' }}>
                    {apiRes.bodyJson ? JSON.stringify(apiRes.bodyJson, null, 2) : apiRes.bodyText || '(空)'}
                  </pre>
                </details>
                <details>
                  <summary className="text-xs cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>Headers ({Object.keys(apiRes.headers).length})</summary>
                  <pre className="mt-1 p-2 rounded bg-black/30 text-xs overflow-auto max-h-32" style={{ color: 'var(--t-text-secondary)' }}>
                    {Object.entries(apiRes.headers).map(([k, v]) => `${k}: ${v}`).join('\n')}
                  </pre>
                </details>
              </div>
            )}
          </div>
        )}

        {/* Connection Test (Ping) */}
        {toolTab === 'ping' && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
              HEAD 请求测量真实网络延迟。返回状态码、协议、Server 头。
            </p>
            <div className="flex gap-2">
              <input
                value={pingUrl}
                onChange={e => setPingUrl(e.target.value)}
                onKeyDown={e => e.key === 'Enter' && handlePing()}
                placeholder="https://example.com"
                className="flex-1 glass-input rounded-lg py-2 px-3 text-sm"
                style={{ color: 'var(--t-text)' }}
              />
              <button
                onClick={handlePing}
                disabled={pingLoading}
                className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
              >
                {pingLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <Zap className="h-3.5 w-3.5" />}
                {pingLoading ? '测试中' : '测试'}
              </button>
            </div>
            {pingResult && (
              <div className="rounded-lg p-3 space-y-1 text-xs" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex flex-wrap items-center gap-2">
                  <span className={`px-2 py-0.5 rounded font-bold ${pingResult.ok ? 'bg-green-500/20 text-green-400' : 'bg-red-500/20 text-red-400'}`}>
                    {pingResult.status || '失败'}
                  </span>
                  <span style={{ color: 'var(--t-text)' }}>
                    {pingResult.durationMs}ms
                  </span>
                  {pingResult.protocol && <span style={{ color: 'var(--t-text-muted)' }}>{pingResult.protocol}</span>}
                  {pingResult.server && <span style={{ color: 'var(--t-text-muted)' }}>Server: {pingResult.server}</span>}
                </div>
                {pingResult.error && <div className="text-red-400">⚠️ {pingResult.error}</div>}
                {pingResult.durationMs < 200 && pingResult.ok && (
                  <div className="text-green-400">🚀 极速响应 (&lt;200ms)</div>
                )}
                {pingResult.durationMs >= 200 && pingResult.durationMs < 800 && pingResult.ok && (
                  <div style={{ color: 'var(--t-text-secondary)' }}>✓ 正常响应</div>
                )}
                {pingResult.durationMs >= 800 && pingResult.ok && (
                  <div className="text-amber-400">⚠️ 响应较慢 (&gt;800ms)</div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Batch Scrape */}
        {toolTab === 'batch' && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
              一次抓取多个 URL 的同类数据，结果可导出为 JSON / CSV。
            </p>
            <div className="grid grid-cols-2 gap-2">
              <textarea
                value={batchUrls}
                onChange={e => setBatchUrls(e.target.value)}
                placeholder={`URL 列表 (每行一个):\nhttps://news.ycombinator.com\nhttps://example.com\nhttps://github.com/trending`}
                className="glass-input rounded-lg p-2 text-xs font-mono"
                rows={4}
                style={{ color: 'var(--t-text)' }}
              />
              <div className="space-y-2">
                <input
                  value={batchSelector}
                  onChange={e => setBatchSelector(e.target.value)}
                  placeholder="CSS 选择器 (e.g. h2, .title)"
                  className="w-full glass-input rounded-lg py-2 px-3 text-xs"
                  style={{ color: 'var(--t-text)' }}
                />
                <SelectorPresets onPick={p => setBatchSelector(p.selector)} />
                <button
                  onClick={handleBatchScrape}
                  disabled={batchLoading || !batchUrls.trim() || !batchSelector.trim()}
                  className="w-full px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center justify-center gap-1.5"
                >
                  {batchLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <ListTree className="h-3.5 w-3.5" />}
                  {batchLoading ? '抓取中...' : '开始批量抓取'}
                </button>
              </div>
            </div>
            {batchResults && (
              <div className="space-y-1">
                <div className="flex items-center gap-2 text-xs">
                  <span style={{ color: 'var(--t-text-secondary)' }}>
                    {batchResults.filter(r => r.ok).length}/{batchResults.length} 成功 · 总计 {batchResults.reduce((s, r) => s + r.items.length, 0)} 条
                  </span>
                  <button onClick={exportBatchJson} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs" style={{ color: 'var(--t-text-secondary)' }}>JSON</button>
                  <button onClick={exportBatchCsv} className="px-2 py-0.5 rounded bg-white/5 hover:bg-white/10 text-xs" style={{ color: 'var(--t-text-secondary)' }}>CSV</button>
                </div>
                <div className="space-y-1 max-h-40 overflow-y-auto">
                  {batchResults.map((r, i) => (
                    <div key={i} className="text-xs rounded p-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                      <div className="flex items-center gap-2">
                        <span className={r.ok ? 'text-green-400' : 'text-red-400'}>{r.ok ? '✓' : '✗'}</span>
                        <span className="truncate flex-1" style={{ color: 'var(--t-text-secondary)' }}>{r.url}</span>
                        <span style={{ color: 'var(--t-text-muted)' }}>{r.durationMs}ms · {r.items.length} 条</span>
                      </div>
                      {r.error && <div className="text-red-400 mt-1">{r.error}</div>}
                    </div>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}

        {/* Form Fields */}
        {toolTab === 'forms' && (
          <div className="space-y-2">
            <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>
              提取当前页面的所有表单字段 (input/textarea/select)，用于自动化填表准备。
            </p>
            <button
              onClick={handleExtractForms}
              disabled={!activeSessionId || formLoading}
              className="px-3 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs disabled:opacity-50 flex items-center gap-1.5"
            >
              {formLoading ? <Loader2 className="h-3.5 w-3.5 animate-spin" /> : <FileText className="h-3.5 w-3.5" />}
              提取表单字段
            </button>
            {formFields !== null && (
              <div>
                {formFields.length === 0 ? (
                  <div className="text-xs" style={{ color: 'var(--t-text-muted)' }}>页面中未发现表单字段</div>
                ) : (
                  <div className="space-y-1 max-h-48 overflow-y-auto">
                    {formFields.map((f, i) => (
                      <div key={i} className="text-xs rounded p-2 flex items-center gap-2" style={{ background: 'rgba(0,0,0,0.2)' }}>
                        <span className="px-1.5 py-0.5 rounded bg-blue-500/20 text-blue-300 font-mono">{f.tag}</span>
                        <span className="px-1.5 py-0.5 rounded bg-purple-500/20 text-purple-300 font-mono">{f.type}</span>
                        <span className="truncate" style={{ color: 'var(--t-text)' }}>{f.name || f.id || '(无 name)'}</span>
                        {f.placeholder && <span style={{ color: 'var(--t-text-muted)' }}>— "{f.placeholder}"</span>}
                        {f.required && <span className="text-red-400">*</span>}
                        {f.options && <span style={{ color: 'var(--t-text-muted)' }}>· {f.options.length} 选项</span>}
                      </div>
                    ))}
                  </div>
                )}
              </div>
            )}
          </div>
        )}

        {/* Schema Extractor (多字段提取 + 变换) */}
        {toolTab === 'schema' && (
          <SchemaPanel
            activeUrl={url}
            pageData={pageData}
            fields={schemaFields}
            setFields={setSchemaFields}
            headers={schemaHeaders}
            setHeaders={setSchemaHeaders}
            recipeName={schemaRecipeName}
            setRecipeName={setSchemaRecipeName}
            results={schemaResults}
            setResults={setSchemaResults}
            loading={schemaLoading}
            setLoading={setSchemaLoading}
            onSave={() => {
              if (!schemaRecipeName.trim()) return;
              const recipe: ScrapeRecipe = {
                id: `r_${Date.now()}`,
                name: schemaRecipeName.trim(),
                createdAt: Date.now(),
                updatedAt: Date.now(),
                baseUrl: url,
                fields: schemaFields,
                headers: schemaHeaders ? JSON.parse('{}') : undefined,
              };
              dataScrapingService.saveRecipe(recipe);
              refreshRecipes();
              setSchemaRecipeName('');
            }}
          />
        )}

        {/* Pagination Scraper */}
        {toolTab === 'pages' && (
          <PaginationPanel
            url={pagUrl}
            setUrl={setPagUrl}
            fields={pagFields}
            setFields={setPagFields}
            nextSelector={pagNextSel}
            setNextSelector={setPagNextSel}
            maxPages={pagMax}
            setMaxPages={setPagMax}
            delayMs={pagDelay}
            setDelayMs={setPagDelay}
            dedupeBy={pagDedupeBy}
            setDedupeBy={setPagDedupeBy}
            result={pagResult}
            setResult={setPagResult}
            loading={pagLoading}
            setLoading={setPagLoading}
            progress={pagProgress}
          />
        )}

        {/* URL Pattern Generator */}
        {toolTab === 'structured' && (
          <StructuredDataPanel
            pageData={pageData}
            url={url}
            data={structuredData}
            setData={setStructuredData}
            loading={structuredLoading}
            setLoading={setStructuredLoading}
          />
        )}

        {/* Recipes Library */}
        {toolTab === 'recipes' && (
          <RecipesPanel
            recipes={recipes}
            onLoad={(r) => {
              setSchemaFields(r.fields);
              setSchemaRecipeName(r.name);
              setToolTab('schema');
            }}
            onDelete={(id) => { dataScrapingService.deleteRecipe(id); refreshRecipes(); }}
            onExport={async (r) => {
              const XLSX = await import('xlsx');
              const ws = XLSX.utils.json_to_sheet(r.fields.map(f => ({
                name: f.name, selector: f.selector, attr: f.attr || '', multiple: !!f.multiple,
                transforms: (f.transforms || []).map(t => t.type).join('|'),
              })));
              const wb = XLSX.utils.book_new();
              XLSX.utils.book_append_sheet(wb, ws, 'Schema');
              XLSX.writeFile(wb, `recipe-${r.name}.xlsx`);
            }}
          />
        )}

        {/* Smart Crawler (multi-URL / deep / sitemap) */}
        {toolTab === 'crawler' && (
          <SmartCrawlerPanel
            mode={crMode} setMode={setCrMode}
            strategy={crStrategy} setStrategy={setCrStrategy}
            urls={crUrls} setUrls={setCrUrls}
            sitemapUrl={crSitemapUrl} setSitemapUrl={setCrSitemapUrl}
            maxDepth={crMaxDepth} setMaxDepth={setCrMaxDepth}
            maxPages={crMaxPages} setMaxPages={setCrMaxPages}
            scoreThreshold={crScoreThreshold} setScoreThreshold={setCrScoreThreshold}
            keywords={crKeywords} setKeywords={setCrKeywords}
            allowedDomains={crAllowedDomains} setAllowedDomains={setCrAllowedDomains}
            blockedDomains={crBlockedDomains} setBlockedDomains={setCrBlockedDomains}
            urlPatterns={crUrlPatterns} setUrlPatterns={setCrUrlPatterns}
            excludePatterns={crExcludePatterns} setExcludePatterns={setCrExcludePatterns}
            adaptiveQuery={crAdaptiveQuery} setAdaptiveQuery={setCrAdaptiveQuery}
            concurrency={crConcurrency} setConcurrency={setCrConcurrency}
            delayMs={crDelayMs} setDelayMs={setCrDelayMs}
            useCache={crUseCache} setUseCache={setCrUseCache}
            rotateUA={crRotateUA} setRotateUA={setCrRotateUA}
            customHeaders={crCustomHeaders} setCustomHeaders={setCrCustomHeaders}
            result={crResult} setResult={setCrResult}
            loading={crLoading} setLoading={setCrLoading}
            log={crLog} setLog={setCrLog}
            abort={crAbort} setAbort={setCrAbort}
            checkpointName={crCheckpointName} setCheckpointName={setCrCheckpointName}
            savedStates={crSavedStates} refreshStates={refreshCrStates}
            sitemapDiscovered={crSitemapDiscovered} setSitemapDiscovered={setCrSitemapDiscovered}
          />
        )}

        {/* Deep Crawl (crawl4ai-style pipeline) */}
        {toolTab === 'deepcrawl' && (
          <DeepCrawlPanel
            activeUrl={url}
            pageData={pageData}
            config={dcConfig}
            setConfig={setDcConfig}
            result={dcResult}
            setResult={setDcResult}
            loading={dcLoading}
            setLoading={setDcLoading}
            view={dcView}
            setView={setDcView}
          />
        )}

        {/* URL Pattern Generator (integrated into pages tab) */}
        {toolTab === 'pages' && (
          <div className="mt-3 pt-3 border-t" style={{ borderColor: 'var(--t-glass-border)' }}>
            <details className="text-xs">
              <summary className="cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
                🧮 URL 模式生成器 (用于配合上方分页爬取)
              </summary>
              <div className="mt-2 space-y-2 p-2 rounded-lg" style={{ background: 'rgba(0,0,0,0.2)' }}>
                <div className="flex gap-2 items-center">
                  <input
                    value={urlPattern}
                    onChange={e => setUrlPattern(e.target.value)}
                    placeholder="https://example.com/p/{n}"
                    className="flex-1 glass-input rounded px-2 py-1 text-xs font-mono"
                  />
                  <input
                    type="number" value={urlStart}
                    onChange={e => setUrlStart(parseInt(e.target.value) || 1)}
                    className="w-16 glass-input rounded px-2 py-1 text-xs"
                    placeholder="start"
                  />
                  <span style={{ color: 'var(--t-text-muted)' }}>→</span>
                  <input
                    type="number" value={urlEnd}
                    onChange={e => setUrlEnd(parseInt(e.target.value) || 1)}
                    className="w-16 glass-input rounded px-2 py-1 text-xs"
                    placeholder="end"
                  />
                  <input
                    type="number" value={urlPad}
                    onChange={e => setUrlPad(parseInt(e.target.value) || 0)}
                    className="w-16 glass-input rounded px-2 py-1 text-xs"
                    placeholder="pad"
                    title="补零位数"
                  />
                </div>
                <button
                  onClick={() => setGeneratedUrls(dataScrapingService.generateUrls({ pattern: urlPattern, start: urlStart, end: urlEnd, padLength: urlPad }))}
                  className="px-2 py-1 rounded bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-xs"
                >
                  生成 {urlEnd - urlStart + 1} 个 URL
                </button>
                {generatedUrls.length > 0 && (
                  <div className="text-xs font-mono p-2 rounded max-h-32 overflow-y-auto" style={{ background: 'rgba(0,0,0,0.3)', color: 'var(--t-text-secondary)' }}>
                    {generatedUrls.map((u, i) => <div key={i}>{i + 1}. {u}</div>)}
                  </div>
                )}
              </div>
            </details>
          </div>
        )}
      </div>

      {/* Main Content */}
      <div className="flex-1 flex overflow-hidden">
        {/* Left Panel - Sessions */}
        <div className="w-64 border-r p-4 overflow-y-auto" style={{ borderColor: 'var(--t-glass-border)' }}>
          <h3 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
            <Clock className="h-3 w-3" />
            会话 ({sessions.length})
          </h3>
          
          <div className="space-y-2">
            {sessions.map(session => (
              <div
                key={session.id}
                onClick={() => setActiveSessionId(session.id)}
                className={`p-3 rounded-xl cursor-pointer transition-all ${
                  activeSessionId === session.id ? 'bg-white/10 ring-1' : 'hover:bg-white/5'
                }`}
                style={{ borderColor: activeSessionId === session.id ? 'var(--t-accent-border)' : 'transparent' }}
              >
                <div className="flex items-start justify-between">
                  <div className="flex-1 min-w-0">
                    <div className="text-sm truncate" style={{ color: 'var(--t-text)' }}>
                      {session.title}
                    </div>
                    <div className="text-xs truncate" style={{ color: 'var(--t-text-muted)' }}>
                      {session.url}
                    </div>
                  </div>
                  <button
                    onClick={e => { e.stopPropagation(); closeSession(session.id); }}
                    className="p-1 hover:bg-white/10 rounded ml-2"
                  >
                    <X className="h-3 w-3" style={{ color: 'var(--t-text-muted)' }} />
                  </button>
                </div>
                <div className="flex items-center gap-2 mt-2">
                  <span className={`w-2 h-2 rounded-full ${
                    session.status === 'active' ? 'bg-green-400' : 
                    session.status === 'loading' ? 'bg-amber-400 animate-pulse' : 
                    session.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                  }`} />
                  <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                    {session.status === 'active' ? '活跃' : 
                     session.status === 'loading' ? '加载中' : 
                     session.status === 'error' ? '错误' : '空闲'}
                  </span>
                </div>
              </div>
            ))}
          </div>

          {sessions.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--t-text-muted)' }}>
              <Globe className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无会话</p>
            </div>
          )}
        </div>

        {/* Center Panel - Page Content */}
        <div className="flex-1 p-6 overflow-y-auto">
          {activeSession ? (
            <div className="space-y-6">
              {/* Session Status */}
              <div className="flex items-center gap-3">
                <span className={`w-3 h-3 rounded-full ${
                  activeSession.status === 'active' ? 'bg-green-400' : 
                  activeSession.status === 'loading' ? 'bg-amber-400 animate-pulse' : 
                  activeSession.status === 'error' ? 'bg-red-400' : 'bg-gray-400'
                }`} />
                <span className="text-sm" style={{ color: 'var(--t-text)' }}>{activeSession.title}</span>
                <span className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{activeSession.url}</span>
              </div>

              {/* Toolbar */}
              <div className="flex flex-wrap gap-2">
                <button
                  onClick={handleScreenshot}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  <Camera className="h-4 w-4" />
                  截图
                </button>
                <button
                  onClick={handleGeneratePDF}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm"
                  style={{ color: 'var(--t-text)' }}
                >
                  <FileText className="h-4 w-4" />
                  生成 PDF
                </button>
                <button
                  onClick={() => setShowScrapePanel(!showScrapePanel)}
                  className={`px-3 py-2 rounded-lg transition-colors flex items-center gap-2 text-sm ${
                    showScrapePanel ? 'bg-amber-500/20 text-amber-400' : 'bg-white/5 hover:bg-white/10'
                  }`}
                  style={{ color: showScrapePanel ? undefined : 'var(--t-text)' }}
                >
                  <Download className="h-4 w-4" />
                  数据抓取
                </button>
                <button
                  onClick={handleSummarize}
                  disabled={isSummarizing || activeSession.status !== 'active'}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                  style={{ color: 'var(--t-text)' }}
                >
                  {isSummarizing ? (
                    <Loader2 className="h-4 w-4 animate-spin" />
                  ) : (
                    <Search className="h-4 w-4" />
                  )}
                  总结页面
                </button>
              </div>

              {/* Scrape Panel */}
              {showScrapePanel && (
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--t-text)' }}>数据抓取配置</h4>
                  <div className="flex gap-3 mb-3">
                    <input
                      value={scrapeConfig.selector}
                      onChange={e => { setScrapeConfig({ ...scrapeConfig, selector: e.target.value }); setScrapeError(null); }}
                      onKeyDown={e => e.key === 'Enter' && handleScrape()}
                      className="flex-1 glass-input rounded-lg py-2 px-3 text-sm"
                      placeholder="CSS 选择器 (例如: h1, .product-title, a)..."
                      style={{ color: 'var(--t-text)' }}
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer shrink-0" style={{ color: 'var(--t-text-secondary)' }}>
                      <input
                        type="checkbox"
                        checked={scrapeConfig.multiple}
                        onChange={e => setScrapeConfig({ ...scrapeConfig, multiple: e.target.checked })}
                        className="rounded"
                      />
                      多元素
                    </label>
                    <button
                      onClick={handleScrape}
                      disabled={isScraping}
                      className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm disabled:opacity-50 flex items-center gap-2"
                    >
                      {isScraping ? (
                        <Loader2 className="h-4 w-4 animate-spin" />
                      ) : (
                        <Download className="h-4 w-4" />
                      )}
                      {isScraping ? '抓取中...' : '抓取'}
                    </button>
                  </div>
                  <SelectorPresets
                    onPick={p => { setScrapeConfig({ selector: p.selector, multiple: p.multiple }); setScrapeError(null); }}
                  />

                  {scrapeError && (
                    <div className="mb-3 flex items-start gap-2 rounded-lg p-2.5 animate-fade-in" style={{ background: 'rgba(239, 68, 68, 0.08)', border: '1px solid rgba(239, 68, 68, 0.15)' }}>
                      <AlertCircle className="h-4 w-4 text-red-400 shrink-0 mt-0.5" />
                      <span className="text-xs text-red-400">{scrapeError}</span>
                    </div>
                  )}

                  {scrapedData && (
                    <div className="mt-3 p-3 rounded-lg bg-black/20">
                      <h5 className="text-xs font-medium mb-2" style={{ color: 'var(--t-text-muted)' }}>
                        抓取结果 ({Array.isArray(scrapedData) ? scrapedData.length : 1} 条):
                      </h5>
                      <pre className="text-xs overflow-auto max-h-64" style={{ color: 'var(--t-text-secondary)' }}>
                        {JSON.stringify(scrapedData, null, 2)}
                      </pre>
                    </div>
                  )}
                </div>
              )}

              {/* Summary */}
              {summary && (
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text)' }}>
                    <CheckCircle className="h-4 w-4 text-green-400" />
                    页面总结
                  </h4>
                  <div className="text-sm whitespace-pre-wrap leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                    {summary}
                  </div>
                </div>
              )}

              {/* Page Info */}
              {pageData && (
                <div className="glass-card rounded-xl p-4">
                  <h4 className="text-sm font-medium mb-3" style={{ color: 'var(--t-text)' }}>页面信息</h4>
                  <div className="space-y-2 text-sm">
                    <div className="flex">
                      <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>标题:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.title}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>URL:</span>
                      <span className="break-all" style={{ color: 'var(--t-accent-light)' }}>{pageData.url}</span>
                    </div>
                    {pageData.meta.description && (
                      <div className="flex">
                        <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>描述:</span>
                        <span style={{ color: 'var(--t-text-secondary)' }}>{pageData.meta.description}</span>
                      </div>
                    )}
                    {pageData.meta.author && (
                      <div className="flex">
                        <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>作者:</span>
                        <span style={{ color: 'var(--t-text)' }}>{pageData.meta.author}</span>
                      </div>
                    )}
                    {pageData.meta.keywords && pageData.meta.keywords.length > 0 && (
                      <div className="flex">
                        <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>关键词:</span>
                        <span style={{ color: 'var(--t-text-secondary)' }}>{pageData.meta.keywords.join(', ')}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>链接数:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.links.length}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20 shrink-0" style={{ color: 'var(--t-text-muted)' }}>图片数:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.images.length}</span>
                    </div>
                    {pageData.content && (
                      <div className="mt-3">
                        <span className="text-xs font-medium" style={{ color: 'var(--t-text-muted)' }}>内容预览:</span>
                        <p className="text-xs mt-1 leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                          {pageData.content.slice(0, 500)}...
                        </p>
                      </div>
                    )}
                  </div>
                </div>
              )}

              {/* Loading state */}
              {activeSession.status === 'loading' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <Loader2 className="h-8 w-8 animate-spin mb-4" style={{ color: 'var(--t-accent-light)' }} />
                  <p className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>正在加载页面内容...</p>
                </div>
              )}

              {/* Error state */}
              {activeSession.status === 'error' && (
                <div className="flex flex-col items-center justify-center py-16 text-center">
                  <AlertCircle className="h-8 w-8 mb-4 text-red-400" />
                  <p className="text-sm mb-2" style={{ color: 'var(--t-text)' }}>页面加载失败</p>
                  <p className="text-xs" style={{ color: 'var(--t-text-muted)' }}>{activeSession.title}</p>
                </div>
              )}
            </div>
          ) : (
            <div className="flex flex-col items-center justify-center h-full text-center">
              <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-orange-500/10 to-red-500/10 flex items-center justify-center mb-4">
                <Globe className="h-8 w-8 text-orange-400/50" />
              </div>
              <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--t-text)' }}>
                浏览器自动化
              </h3>
              <p className="text-sm max-w-md" style={{ color: 'var(--t-text-secondary)' }}>
                输入网址开始自动化操作。支持网页内容提取、截图、数据抓取等功能。
              </p>
            </div>
          )}
        </div>

        {/* Right Panel - Task History */}
        <div className="w-64 border-l p-4 overflow-y-auto" style={{ borderColor: 'var(--t-glass-border)' }}>
          <h3 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
            <RotateCcw className="h-3 w-3" />
            任务历史
          </h3>
          
          <div className="space-y-2">
            {taskHistory.slice(0, 10).map((task, idx) => (
              <div
                key={`${task.id}-${idx}`}
                className="p-3 rounded-xl bg-white/5 text-sm"
              >
                <div className="flex items-center gap-2 mb-1">
                  {task.status === 'completed' ? (
                    <CheckCircle className="h-3 w-3 text-green-400" />
                  ) : task.status === 'failed' ? (
                    <AlertCircle className="h-3 w-3 text-red-400" />
                  ) : (
                    <Loader2 className="h-3 w-3 text-amber-400 animate-spin" />
                  )}
                  <span style={{ color: 'var(--t-text)' }}>{task.type}</span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                  {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : '进行中'}
                </div>
                {task.error && (
                  <div className="text-[10px] text-red-400/70 mt-1 truncate" title={task.error}>
                    {task.error}
                  </div>
                )}
              </div>
            ))}
          </div>

          {taskHistory.length === 0 && (
            <div className="text-center py-8" style={{ color: 'var(--t-text-muted)' }}>
              <RotateCcw className="h-8 w-8 mx-auto mb-2 opacity-50" />
              <p className="text-xs">暂无任务</p>
            </div>
          )}
        </div>
      </div>
    </div>
  );
}
