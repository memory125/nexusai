import type { SkillContext, SkillResult, SkillDefinition } from '../types';

export const newsAggregator: SkillDefinition = {
  id: 'news-aggregator',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    try {
      const res = await fetch('https://hacker-news.firebaseio.com/v0/topstories.json', { signal: ctx.signal });
      if (!res.ok) throw new Error(`HN API ${res.status}`);
      const ids: number[] = (await res.json()).slice(0, 8);
      const items = await Promise.all(
        ids.map(id =>
          fetch(`https://hacker-news.firebaseio.com/v0/item/${id}.json`, { signal: ctx.signal })
            .then(r => r.ok ? r.json() : null)
            .catch(() => null)
        )
      );
      const stories = items.filter(Boolean);
      const lines = stories.map((s: any, i: number) =>
        `${i + 1}. ${s.title}\n   👍${s.score} · 💬${s.descendants || 0} · ${s.url || `https://news.ycombinator.com/item?id=${s.id}`}`
      ).join('\n\n');
      return {
        status: 'success',
        contextBlock: `【Hacker News 热门】\n${lines}`,
        meta: { count: stories.length },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '新闻抓取失败' };
    }
  },
};
