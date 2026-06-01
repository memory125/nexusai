import type { SkillContext, SkillResult, SkillDefinition } from '../types';
import { extractKeywords } from '../base';

export const wikipedia: SkillDefinition = {
  id: 'wikipedia',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const q = extractKeywords(ctx.userMessage, 4).slice(0, 3).join(' ') || ctx.userMessage.slice(0, 50);
    if (!q) return { status: 'skipped', contextBlock: '' };
    try {
      const searchRes = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=opensearch&search=${encodeURIComponent(q)}&limit=1&format=json&origin=*`,
        { signal: ctx.signal }
      );
      if (!searchRes.ok) throw new Error('搜索失败');
      const searchData = await searchRes.json();
      const title = searchData[1]?.[0];
      if (!title) return { status: 'error', error: `未找到 "${q}" 相关词条` };
      const sumRes = await fetch(
        `https://zh.wikipedia.org/w/api.php?action=query&prop=extracts&exintro=1&explaintext=1&titles=${encodeURIComponent(title)}&format=json&origin=*`,
        { signal: ctx.signal }
      );
      const sumData = await sumRes.json();
      const pages = sumData.query?.pages || {};
      const page = Object.values(pages)[0] as any;
      const extract = (page?.extract || '').slice(0, 1500);
      const url = `https://zh.wikipedia.org/wiki/${encodeURIComponent(title)}`;
      return {
        status: 'success',
        contextBlock: `【维基百科】${title}\n${extract}${extract.length >= 1500 ? '\n...(已截断)' : ''}\n来源: ${url}`,
        meta: { title, url },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '查询失败' };
    }
  },
};
