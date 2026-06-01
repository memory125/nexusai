import type { SkillContext, SkillResult, SkillDefinition } from '../types';
import { extractKeywords } from '../base';

export const codeSearch: SkillDefinition = {
  id: 'code-search',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const q = extractKeywords(ctx.userMessage, 5).slice(0, 3).join(' ');
    if (!q || q.length < 3) return { status: 'skipped', contextBlock: '' };
    try {
      const res = await fetch(
        `https://api.github.com/search/repositories?q=${encodeURIComponent(q)}&sort=stars&order=desc&per_page=5`,
        { signal: ctx.signal, headers: { 'Accept': 'application/vnd.github.v3+json' } }
      );
      if (!res.ok) throw new Error(`GitHub API ${res.status}`);
      const data = await res.json();
      const items = (data.items || []).slice(0, 5);
      if (items.length === 0) {
        return { status: 'success', contextBlock: `【GitHub 搜索】"${q}" 暂无仓库结果。`, meta: { query: q, count: 0 } };
      }
      const lines = items.map((r: any, i: number) =>
        `${i + 1}. ${r.full_name} ⭐${r.stargazers_count}\n   ${r.description || '(无描述)'}\n   ${r.html_url}`
      ).join('\n\n');
      return {
        status: 'success',
        contextBlock: `【GitHub 仓库搜索】关键词: ${q} (共 ${data.total_count} 个结果)\n${lines}`,
        meta: { query: q, count: items.length },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : 'GitHub 搜索失败' };
    }
  },
};
