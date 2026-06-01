import type { SkillContext, SkillResult, SkillDefinition } from '../types';
import { tryExtractUrl } from '../base';

export const webFetch: SkillDefinition = {
  id: 'web-fetch',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const url = tryExtractUrl(ctx.userMessage);
    if (!url) return { status: 'skipped', contextBlock: '' };
    try {
      const res = await fetch(url, { signal: ctx.signal, headers: { 'User-Agent': 'Mozilla/5.0 NexusAI/1.0' } });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const html = await res.text();
      const text = html
        .replace(/<script[\s\S]*?<\/script>/gi, ' ')
        .replace(/<style[\s\S]*?<\/style>/gi, ' ')
        .replace(/<nav[\s\S]*?<\/nav>/gi, ' ')
        .replace(/<footer[\s\S]*?<\/footer>/gi, ' ')
        .replace(/<header[\s\S]*?<\/header>/gi, ' ')
        .replace(/<[^>]+>/g, ' ')
        .replace(/&nbsp;/g, ' ').replace(/&amp;/g, '&').replace(/&lt;/g, '<').replace(/&gt;/g, '>').replace(/&quot;/g, '"')
        .replace(/\s+/g, ' ')
        .trim()
        .slice(0, 4000);
      const title = (html.match(/<title[^>]*>([\s\S]*?)<\/title>/i)?.[1] || '').trim().slice(0, 200);
      return {
        status: 'success',
        contextBlock: `【网页抓取】URL: ${url}\n标题: ${title || '(无)'}\n内容摘要:\n${text}${text.length >= 4000 ? '\n...(已截断)' : ''}`,
        meta: { url, title, length: text.length },
      };
    } catch (e) {
      return {
        status: 'error',
        error: e instanceof Error ? e.message : '抓取失败',
      };
    }
  },
};
