import { useState } from 'react';
import { useStore } from '../store';
import { Search, ArrowRight, Star, Zap } from 'lucide-react';

export function AgentsPage() {
  const { agents, createConversation } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState<string>('全部');

  const categories = ['全部', ...Array.from(new Set(agents.map(a => a.category)))];
  const filtered = agents.filter(a => {
    const matchSearch = a.name.includes(search) || a.description.includes(search);
    const matchCat = selectedCategory === '全部' || a.category === selectedCategory;
    return matchSearch && matchCat;
  });

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center gap-3 mb-4">
          <div
            className="flex h-10 w-10 items-center justify-center rounded-xl"
            style={{ background: 'var(--t-accent-subtle)', border: '1px solid var(--t-accent-border)' }}
          >
            <Star className="h-5 w-5" style={{ color: 'var(--t-accent-light)' }} />
          </div>
          <div>
            <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>AI Agents</h2>
            <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>选择专业Agent，获取定制化AI服务</p>
          </div>
        </div>

        {/* Search */}
        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--t-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            placeholder="搜索 Agent..."
          />
        </div>

        {/* Category Filters */}
        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: selectedCategory === cat ? 'var(--t-accent-subtle)' : 'var(--t-glass-card)',
                color: selectedCategory === cat ? 'var(--t-accent-text)' : 'var(--t-text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'var(--t-accent-border)' : 'transparent'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Agents Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((agent, i) => (
            <div
              key={agent.id}
              className="glass-card rounded-2xl p-5 animate-fade-in cursor-pointer group"
              style={{ animationDelay: `${i * 50}ms` }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: `${agent.color}15`, border: `1px solid ${agent.color}30` }}
                  >
                    {agent.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{agent.name}</h3>
                    <span
                      className="inline-block mt-0.5 rounded-md px-2 py-0.5 text-[10px] font-medium"
                      style={{ background: `${agent.color}15`, color: agent.color }}
                    >
                      {agent.category}
                    </span>
                  </div>
                </div>
              </div>

              <p className="text-xs mb-4 leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>
                {agent.description}
              </p>

              <div className="flex items-center gap-1.5 mb-4 flex-wrap">
                {agent.skills.map(skill => (
                  <span
                    key={skill}
                    className="flex items-center gap-1 rounded-md px-2 py-1 text-[10px]"
                    style={{ background: 'var(--t-glass-card)', color: 'var(--t-text-muted)' }}
                  >
                    <Zap className="h-2.5 w-2.5" />
                    {skill}
                  </span>
                ))}
              </div>

              <button
                onClick={() => createConversation(agent.id)}
                className="glass-btn flex w-full items-center justify-center gap-2 rounded-xl py-2.5 text-xs font-medium"
              >
                <span>开始对话</span>
                <ArrowRight className="h-3.5 w-3.5 transition-transform group-hover:translate-x-1" />
              </button>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
