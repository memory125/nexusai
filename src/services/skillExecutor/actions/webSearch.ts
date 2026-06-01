import type { SkillContext, SkillResult, SkillDefinition } from '../types';
import { extractKeywords } from '../base';

export const webSearch: SkillDefinition = {
  id: 'web-search',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const q = extractKeywords(ctx.userMessage, 6).join(' ');
    if (!q) return { status: 'skipped', contextBlock: '' };
    try {
      const url = `https://api.duckduckgo.com/?q=${encodeURIComponent(q)}&format=json&no_html=1&skip_disambig=1`;
      const res = await fetch(url, { signal: ctx.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const lines: string[] = [];
      if (data.AbstractText) {
        lines.push(`【${data.AbstractSource || '摘要'}】 ${data.AbstractText}`);
        if (data.AbstractURL) lines.push(`链接: ${data.AbstractURL}`);
      }
      if (Array.isArray(data.RelatedTopics)) {
        for (const t of data.RelatedTopics.slice(0, 5)) {
          if (t.Text) {
            const text = t.Text.length > 200 ? t.Text.slice(0, 200) + '…' : t.Text;
            const u = t.FirstURL ? ` (${t.FirstURL})` : '';
            lines.push(`• ${text}${u}`);
          }
        }
      }
      if (lines.length === 0) {
        return {
          status: 'success',
          contextBlock: `【网络搜索】关键词: ${q}\nDuckDuckGo 暂无直接摘要结果，请基于你的知识回答，或建议用户使用更具体的关键词。`,
          meta: { query: q, results: 0 },
        };
      }
      return {
        status: 'success',
        contextBlock: `【网络搜索结果】关键词: ${q}\n${lines.join('\n')}`,
        meta: { query: q, results: lines.length },
      };
    } catch (e) {
      return {
        status: 'error',
        error: e instanceof Error ? e.message : '搜索失败',
        contextBlock: `【网络搜索失败】关键词: ${q}\n请基于你的知识回答。`,
      };
    }
  },
};
