import { useState } from 'react';
import { useStore } from '../store';
import { Zap, Search, ToggleLeft, ToggleRight } from 'lucide-react';

export function SkillsPage() {
  const { skills, toggleSkill } = useStore();
  const [search, setSearch] = useState('');
  const [selectedCategory, setSelectedCategory] = useState('全部');

  const categories = ['全部', ...Array.from(new Set(skills.map(s => s.category)))];
  const filtered = skills.filter(s => {
    const matchSearch = s.name.includes(search) || s.description.includes(search);
    const matchCat = selectedCategory === '全部' || s.category === selectedCategory;
    return matchSearch && matchCat;
  });

  const enabledCount = skills.filter(s => s.enabled).length;

  return (
    <div className="flex h-full flex-col overflow-hidden">
      {/* Header */}
      <div className="p-6 pb-4" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        <div className="flex items-center justify-between mb-4">
          <div className="flex items-center gap-3">
            <div
              className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-br from-amber-500/20 to-orange-600/20 border border-amber-500/20"
            >
              <Zap className="h-5 w-5 text-amber-400" />
            </div>
            <div>
              <h2 className="text-lg font-bold" style={{ color: 'var(--t-text)' }}>Skills 技能</h2>
              <p className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>管理AI助手的技能组合</p>
            </div>
          </div>
          <div className="glass-card rounded-xl px-4 py-2">
            <span className="text-xs" style={{ color: 'var(--t-text-secondary)' }}>已启用 </span>
            <span className="text-sm font-bold" style={{ color: 'var(--t-accent-light)' }}>{enabledCount}</span>
            <span className="text-xs" style={{ color: 'var(--t-text-secondary)' }}> / {skills.length}</span>
          </div>
        </div>

        <div className="relative mb-4">
          <Search className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: 'var(--t-text-muted)' }} />
          <input
            value={search}
            onChange={e => setSearch(e.target.value)}
            className="glass-input w-full rounded-xl py-2.5 pl-10 pr-4 text-sm"
            placeholder="搜索技能..."
          />
        </div>

        <div className="flex gap-2 flex-wrap">
          {categories.map(cat => (
            <button
              key={cat}
              onClick={() => setSelectedCategory(cat)}
              className="rounded-lg px-3 py-1.5 text-xs font-medium transition-all"
              style={{
                background: selectedCategory === cat ? 'rgba(245, 158, 11, 0.15)' : 'var(--t-glass-card)',
                color: selectedCategory === cat ? '#fbbf24' : 'var(--t-text-secondary)',
                border: `1px solid ${selectedCategory === cat ? 'rgba(245, 158, 11, 0.3)' : 'transparent'}`,
              }}
            >
              {cat}
            </button>
          ))}
        </div>
      </div>

      {/* Skills Grid */}
      <div className="flex-1 overflow-y-auto p-6">
        <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-4">
          {filtered.map((skill, i) => (
            <div
              key={skill.id}
              className={`glass-card rounded-2xl p-5 animate-fade-in transition-all ${
                skill.enabled ? 'ring-1' : ''
              }`}
              style={{
                animationDelay: `${i * 50}ms`,
                boxShadow: skill.enabled ? '0 0 0 1px var(--t-accent-border)' : undefined,
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div className="flex items-center gap-3">
                  <div
                    className="flex h-12 w-12 items-center justify-center rounded-2xl text-2xl"
                    style={{ background: 'var(--t-glass-card)', border: '1px solid var(--t-glass-border)' }}
                  >
                    {skill.icon}
                  </div>
                  <div>
                    <h3 className="text-sm font-semibold" style={{ color: 'var(--t-text)' }}>{skill.name}</h3>
                    <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{skill.category}</span>
                  </div>
                </div>
                <button
                  onClick={() => toggleSkill(skill.id)}
                  className="transition-all hover:scale-110"
                >
                  {skill.enabled ? (
                    <ToggleRight className="h-7 w-7" style={{ color: 'var(--t-accent-light)' }} />
                  ) : (
                    <ToggleLeft className="h-7 w-7" style={{ color: 'var(--t-text-muted)' }} />
                  )}
                </button>
              </div>

              <p className="text-xs leading-relaxed" style={{ color: 'var(--t-text-secondary)' }}>{skill.description}</p>

              <div className="mt-3 flex items-center gap-2">
                <div className={`h-1.5 w-1.5 rounded-full ${skill.enabled ? 'bg-green-400' : ''}`}
                  style={!skill.enabled ? { background: 'var(--t-text-muted)' } : {}}
                />
                <span className={`text-[10px] font-medium ${skill.enabled ? 'text-green-400' : ''}`}
                  style={!skill.enabled ? { color: 'var(--t-text-muted)' } : {}}
                >
                  {skill.enabled ? '已启用' : '未启用'}
                </span>
              </div>
            </div>
          ))}
        </div>
      </div>
    </div>
  );
}
