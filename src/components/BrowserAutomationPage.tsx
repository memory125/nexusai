import { useState, useEffect } from 'react';
import { 
  Globe, Play, Camera, FileText, Download, Search, 
  FormInput, MousePointer, ChevronDown, X, Clock,
  RotateCcw, Save, Trash2, CheckCircle, AlertCircle
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
  const [summary, setSummary] = useState('');
  const [isSummarizing, setIsSummarizing] = useState(false);

  useEffect(() => {
    const interval = setInterval(() => {
      setSessions(browserAutomationService.getSessions());
      setTaskHistory(browserAutomationService.getTaskHistory());
    }, 1000);
    return () => clearInterval(interval);
  }, []);

  const handleNavigate = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    try {
      let session: BrowserSession;
      
      if (activeSessionId) {
        await browserAutomationService.navigate(activeSessionId, url);
        session = sessions.find(s => s.id === activeSessionId)!;
      } else {
        session = await browserAutomationService.createSession(url);
        setActiveSessionId(session.id);
      }
      
      // Extract content after navigation
      const data = await browserAutomationService.extractPageContent(session.id);
      setPageData(data);
    } catch (error) {
      console.error('Navigation failed:', error);
    } finally {
      setIsLoading(false);
    }
  };

  const handleScreenshot = async () => {
    if (!activeSessionId) return;
    
    try {
      const screenshot = await browserAutomationService.takeScreenshot(activeSessionId, { fullPage: true });
      // Open screenshot in new window
      const img = new Image();
      img.src = screenshot;
      const w = window.open('', '_blank');
      w?.document.write(img.outerHTML);
    } catch (error) {
      console.error('Screenshot failed:', error);
    }
  };

  const handleGeneratePDF = async () => {
    if (!activeSessionId) return;
    
    try {
      const pdf = await browserAutomationService.generatePDF(activeSessionId);
      const url = URL.createObjectURL(pdf);
      const a = document.createElement('a');
      a.href = url;
      a.download = `page-${Date.now()}.pdf`;
      a.click();
      URL.revokeObjectURL(url);
    } catch (error) {
      console.error('PDF generation failed:', error);
    }
  };

  const handleScrape = async () => {
    if (!activeSessionId || !scrapeConfig.selector) return;
    
    try {
      const data = await browserAutomationService.scrape(activeSessionId, {
        selector: scrapeConfig.selector,
        multiple: scrapeConfig.multiple,
      });
      setScrapedData(data);
    } catch (error) {
      console.error('Scraping failed:', error);
    }
  };

  const handleSummarize = async () => {
    if (!activeSessionId) return;
    
    setIsSummarizing(true);
    try {
      const result = await browserAutomationService.summarizePage(activeSessionId);
      setSummary(result);
    } catch (error) {
      console.error('Summarization failed:', error);
    } finally {
      setIsSummarizing(false);
    }
  };

  const handleSearchAndSummarize = async () => {
    if (!url.trim()) return;
    
    setIsLoading(true);
    setIsSummarizing(true);
    try {
      const result = await browserAutomationService.searchAndSummarize('关键信息', url);
      setSummary(result.summary);
      
      // Create session
      const session = await browserAutomationService.createSession(url);
      setActiveSessionId(session.id);
    } catch (error) {
      console.error('Search failed:', error);
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
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>网页搜索、截图、数据抓取、表单填写</p>
          </div>
        </div>

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
              <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                    session.status === 'loading' ? 'bg-amber-400 animate-pulse' : 'bg-gray-400'
                  }`} />
                  <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                    {session.status === 'active' ? '活跃' : session.status === 'loading' ? '加载中' : '空闲'}
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
                  disabled={isSummarizing}
                  className="px-3 py-2 rounded-lg bg-white/5 hover:bg-white/10 transition-colors flex items-center gap-2 text-sm disabled:opacity-50"
                  style={{ color: 'var(--t-text)' }}
                >
                  {isSummarizing ? (
                    <div className="w-4 h-4 border-2 border-current border-t-transparent rounded-full animate-spin" />
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
                      onChange={e => setScrapeConfig({ ...scrapeConfig, selector: e.target.value })}
                      className="flex-1 glass-input rounded-lg py-2 px-3 text-sm"
                      placeholder="CSS 选择器 (例如: .product-title, #price)..."
                      style={{ color: 'var(--t-text)' }}
                    />
                    <label className="flex items-center gap-2 text-sm cursor-pointer" style={{ color: 'var(--t-text-secondary)' }}>
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
                      className="px-4 py-2 rounded-lg bg-amber-500/20 hover:bg-amber-500/30 text-amber-400 text-sm"
                    >
                      抓取
                    </button>
                  </div>
                  
                  {scrapedData && (
                    <div className="mt-3 p-3 rounded-lg bg-black/20">
                      <h5 className="text-xs font-medium mb-2" style={{ color: 'var(--t-text-muted)' }}>抓取结果:</h5>
                      <pre className="text-xs overflow-auto" style={{ color: 'var(--t-text-secondary)' }}>
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
                  <div className="text-sm whitespace-pre-wrap" style={{ color: 'var(--t-text-secondary)' }}>
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
                      <span className="w-20" style={{ color: 'var(--t-text-muted)' }}>标题:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.title}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20" style={{ color: 'var(--t-text-muted)' }}>URL:</span>
                      <span style={{ color: 'var(--t-accent-light)' }}>{pageData.url}</span>
                    </div>
                    {pageData.meta.description && (
                      <div className="flex">
                        <span className="w-20" style={{ color: 'var(--t-text-muted)' }}>描述:</span>
                        <span style={{ color: 'var(--t-text-secondary)' }}>{pageData.meta.description}</span>
                      </div>
                    )}
                    <div className="flex">
                      <span className="w-20" style={{ color: 'var(--t-text-muted)' }}>链接数:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.links.length}</span>
                    </div>
                    <div className="flex">
                      <span className="w-20" style={{ color: 'var(--t-text-muted)' }}>图片数:</span>
                      <span style={{ color: 'var(--t-text)' }}>{pageData.images.length}</span>
                    </div>
                  </div>
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
                输入网址开始自动化操作。支持网页截图、PDF生成、数据抓取、表单填写等功能。
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
                    <div className="w-3 h-3 border-2 border-amber-400 border-t-transparent rounded-full animate-spin" />
                  )}
                  <span style={{ color: 'var(--t-text)' }}>{task.type}</span>
                </div>
                <div className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                  {task.completedAt ? new Date(task.completedAt).toLocaleTimeString() : '进行中'}
                </div>
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
