import type { SkillContext, SkillResult, SkillDefinition } from '../types';
import { extractKeywords } from '../base';

export const academicSearch: SkillDefinition = {
  id: 'academic-search',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const q = extractKeywords(ctx.userMessage, 6).slice(0, 5).join(' ') || ctx.userMessage.slice(0, 100);
    if (!q) return { status: 'skipped', contextBlock: '' };
    try {
      const res = await fetch(
        `http://export.arxiv.org/api/query?search_query=all:${encodeURIComponent(q)}&start=0&max_results=5&sortBy=relevance`,
        { signal: ctx.signal }
      );
      if (!res.ok) throw new Error(`arXiv API ${res.status}`);
      const xml = await res.text();
      const entries: string[] = [];
      const entryRe = /<entry>([\s\S]*?)<\/entry>/g;
      let m;
      while ((m = entryRe.exec(xml)) !== null) {
        const block = m[1];
        const title = (block.match(/<title>([\s\S]*?)<\/title>/)?.[1] || '').replace(/\s+/g, ' ').trim();
        const summary = (block.match(/<summary>([\s\S]*?)<\/summary>/)?.[1] || '').replace(/\s+/g, ' ').trim().slice(0, 300);
        const authors = Array.from(block.matchAll(/<author>\s*<name>([\s\S]*?)<\/name>/g)).map(a => a[1].trim()).slice(0, 3).join(', ');
        const link = block.match(/<id>([\s\S]*?)<\/id>/)?.[1] || '';
        const published = block.match(/<published>([\s\S]*?)<\/published>/)?.[1] || '';
        if (title) {
          entries.push(`• ${title}\n  作者: ${authors}\n  发布: ${published.slice(0, 10)}\n  摘要: ${summary}${summary.length >= 300 ? '…' : ''}\n  链接: ${link}`);
        }
      }
      if (entries.length === 0) {
        return { status: 'success', contextBlock: `【arXiv 搜索】"${q}" 暂无相关论文。`, meta: { query: q, count: 0 } };
      }
      return {
        status: 'success',
        contextBlock: `【arXiv 学术搜索】关键词: ${q}\n${entries.join('\n\n')}`,
        meta: { query: q, count: entries.length },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : 'arXiv 搜索失败' };
    }
  },
};
