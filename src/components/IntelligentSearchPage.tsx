import { useState, useRef, useEffect } from 'react';
import { Search, Globe, History, Sparkles, X, ExternalLink, Clock, TrendingUp } from 'lucide-react';
import { intelligentSearchService, SearchResult, SearchSuggestion } from '../services/intelligentSearchService';

export function IntelligentSearchPage() {
  const [query, setQuery] = useState('');
  const [results, setResults] = useState<SearchResult[]>([]);
  const [suggestions, setSuggestions] = useState<SearchSuggestion[]>([]);
  const [isSearching, setIsSearching] = useState(false);
  const [searchTime, setSearchTime] = useState(0);
  const [enginesUsed, setEnginesUsed] = useState<string[]>([]);
  const [showSuggestions, setShowSuggestions] = useState(false);
  const [searchHistory, setSearchHistory] = useState<Array<{ query: string; timestamp: number }>>([]);
  const inputRef = useRef<HTMLInputElement>(null);

  // Load search history on mount
  useEffect(() => {
    const history = intelligentSearchService.getSearchHistory(10);
    setSearchHistory(history.map(h => ({ query: h.query, timestamp: h.timestamp })));
  }, []);

  // Update suggestions when query changes
  useEffect(() => {
    if (query.length > 0) {
      intelligentSearchService.search(query, { maxResults: 0 }).then(response => {
        setSuggestions(response.suggestions);
        setShowSuggestions(true);
      });
    } else {
      setSuggestions([]);
      setShowSuggestions(false);
    }
  }, [query]);

  const handleSearch = async (searchQuery: string = query) => {
    if (!searchQuery.trim()) return;
    
    setIsSearching(true);
    setShowSuggestions(false);
    
    try {
      const response = await intelligentSearchService.search(searchQuery, {
        engines: ['brave', 'bing', 'duckduckgo'],
        maxResults: 10,
      });
      
      setResults(response.results);
      setSearchTime(response.searchTime);
      setEnginesUsed(response.enginesUsed);
      
      // Refresh history
      const history = intelligentSearchService.getSearchHistory(10);
      setSearchHistory(history.map(h => ({ query: h.query, timestamp: h.timestamp })));
    } catch (error) {
      console.error('Search failed:', error);
    } finally {
      setIsSearching(false);
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter') {
      handleSearch();
    }
  };

  const handleSuggestionClick = (suggestion: SearchSuggestion) => {
    setQuery(suggestion.query);
    handleSearch(suggestion.query);
  };

  const clearSearch = () => {
    setQuery('');
    setResults([]);
    setSuggestions([]);
    setShowSuggestions(false);
    inputRef.current?.focus();
  };

  const getEngineIcon = (engine: string) => {
    const icons: Record<string, string> = {
      brave: '🔷',
      bing: '🔵',
      duckduckgo: '🦆',
      searxng: '🔍',
      google: '🔴',
    };
    return icons[engine] || '🔍';
  };

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-blue-500/20 to-cyan-600/20 border border-blue-500/20">
            <Globe className="h-5 w-5 text-blue-400" />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>智能搜索增强</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>多引擎聚合、智能融合、结果优化</p>
          </div>
        </div>

        {/* Search Input */}
        <div className="relative">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--t-text-muted)' }} />
          <input
            ref={inputRef}
            value={query}
            onChange={e => setQuery(e.target.value)}
            onKeyDown={handleKeyDown}
            onFocus={() => query.length > 0 && setShowSuggestions(true)}
            className="glass-input w-full rounded-xl py-3 pl-10 pr-10 text-sm"
            placeholder="输入搜索关键词，同时搜索多个引擎..."
            style={{ color: 'var(--t-text)' }}
          />
          {query && (
            <button
              onClick={clearSearch}
              className="absolute right-3 top-1/2 -translate-y-1/2 p-1 rounded-full hover:bg-white/10"
            >
              <X className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
            </button>
          )}
        </div>

        {/* Suggestions Dropdown */}
        {showSuggestions && (suggestions.length > 0 || searchHistory.length > 0) && (
          <div className="absolute z-50 mt-2 w-[calc(100%-3rem)] max-w-2xl glass-card rounded-xl overflow-hidden shadow-2xl">
            {suggestions.map((suggestion, idx) => (
              <button
                key={idx}
                onClick={() => handleSuggestionClick(suggestion)}
                className="w-full px-4 py-2.5 flex items-center gap-3 hover:bg-white/5 transition-colors text-left"
              >
                {suggestion.type === 'history' ? (
                  <Clock className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                ) : (
                  <TrendingUp className="h-4 w-4" style={{ color: 'var(--t-text-muted)' }} />
                )}
                <span className="text-sm" style={{ color: 'var(--t-text)' }}>{suggestion.query}</span>
                <span className="text-xs ml-auto" style={{ color: 'var(--t-text-muted)' }}>
                  {suggestion.type === 'history' ? '历史' : '推荐'}
                </span>
              </button>
            ))}
          </div>
        )}

        {/* Search Stats */}
        {results.length > 0 && (
          <div className="flex items-center gap-4 mt-3 text-xs" style={{ color: 'var(--t-text-secondary)' }}>
            <span>找到 {results.length} 个结果</span>
            <span>•</span>
            <span>{(searchTime / 1000).toFixed(2)} 秒</span>
            <span>•</span>
            <span>引擎: {enginesUsed.map(e => getEngineIcon(e)).join(' ')}</span>
          </div>
        )}
      </div>

      {/* Results Area */}
      <div className="flex-1 overflow-y-auto p-6">
        {isSearching ? (
          <div className="flex flex-col items-center justify-center h-full gap-4">
            <div className="animate-spin h-8 w-8 border-2 border-blue-500 border-t-transparent rounded-full" />
            <p className="text-sm" style={{ color: 'var(--t-text-secondary)' }}>正在搜索多个引擎...</p>
          </div>
        ) : results.length > 0 ? (
          <div className="space-y-4 max-w-3xl">
            {results.map((result) => (
              <div
                key={result.id}
                className="glass-card rounded-xl p-4 hover:ring-1 transition-all cursor-pointer group"
                style={{ borderColor: 'var(--t-glass-border)' }}
                onClick={() => window.open(result.url, '_blank')}
              >
                <div className="flex items-start gap-3">
                  <span className="text-lg">{getEngineIcon(result.source)}</span>
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1">
                      <h3 className="text-sm font-medium group-hover:text-blue-400 transition-colors" style={{ color: 'var(--t-text)' }}>
                        {result.title}
                      </h3>
                      <ExternalLink className="h-3 w-3 opacity-0 group-hover:opacity-100 transition-opacity" style={{ color: 'var(--t-text-muted)' }} />
                    </div>
                    <p className="text-xs mb-2 truncate" style={{ color: 'var(--t-accent-light)' }}>
                      {result.url}
                    </p>
                    <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                      {result.snippet}
                    </p>
                    <div className="flex items-center gap-3 mt-2">
                      <span className="text-[10px] px-2 py-0.5 rounded-full bg-white/5" style={{ color: 'var(--t-text-muted)' }}>
                        {result.domain}
                      </span>
                      <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
                        相关度: {(result.relevanceScore * 100).toFixed(0)}%
                      </span>
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        ) : (
          <div className="flex flex-col items-center justify-center h-full text-center">
            <div className="w-16 h-16 rounded-2xl bg-gradient-to-br from-blue-500/10 to-cyan-500/10 flex items-center justify-center mb-4">
              <Sparkles className="h-8 w-8 text-blue-400/50" />
            </div>
            <h3 className="text-lg font-medium mb-2" style={{ color: 'var(--t-text)' }}>
              智能搜索增强
            </h3>
            <p className="text-sm max-w-md" style={{ color: 'var(--t-text-secondary)' }}>
              同时搜索多个搜索引擎，智能融合去重，按相关性排序，为您提供最优质的搜索结果
            </p>
            
            {/* Recent Searches */}
            {searchHistory.length > 0 && (
              <div className="mt-8 w-full max-w-md">
                <h4 className="text-xs font-medium mb-3 flex items-center gap-2" style={{ color: 'var(--t-text-muted)' }}>
                  <History className="h-3 w-3" />
                  最近搜索
                </h4>
                <div className="flex flex-wrap gap-2">
                  {searchHistory.slice(0, 8).map((item, index) => (
                    <button
                      key={`${item.query}-${index}`}
                      onClick={() => {
                        setQuery(item.query);
                        handleSearch(item.query);
                      }}
                      className="px-3 py-1.5 rounded-lg text-xs glass-card hover:bg-white/10 transition-colors"
                      style={{ color: 'var(--t-text-secondary)' }}
                    >
                      {item.query}
                    </button>
                  ))}
                </div>
              </div>
            )}
          </div>
        )}
      </div>
    </div>
  );
}
