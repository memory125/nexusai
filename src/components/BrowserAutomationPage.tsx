import { useState, useEffect } from 'react';
import {
  Globe, Play, Camera, FileText, Download, Search,
  X, Clock, RotateCcw, CheckCircle, AlertCircle, Loader2, Zap, Code2, Activity, ListTree, Send
} from 'lucide-react';
import {
  browserAutomationService,
  BrowserSession,
  AutomationTask,
  WebPageData
} from '../services/browserAutomationService';
import { realWorldService, ApiTestResponse, PingResult, BatchScrapeItem, CrawlResult } from '../services/realWorldService';

type ToolTab = 'scrape' | 'api' | 'ping' | 'batch' | 'forms';

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
