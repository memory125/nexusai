import { useState, useEffect } from 'react';
import { 
  Globe, Play, Camera, FileText, Download, Search, 
  X, Clock, RotateCcw, CheckCircle, AlertCircle, Loader2
} from 'lucide-react';
import { 
  browserAutomationService, 
  BrowserSession, 
  AutomationTask,
  WebPageData 
} from '../services/browserAutomationService';

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
