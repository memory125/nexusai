import type { SkillContext, SkillResult, SkillDefinition } from '../types';

export const dictionary: SkillDefinition = {
  id: 'dictionary',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const m = ctx.userMessage.match(/(?:查|字典|define|meaning|意思|含义|释义)[^a-zA-Z]*([a-zA-Z][a-zA-Z\s-]{1,30})/i)
              || ctx.userMessage.match(/^([a-zA-Z][a-zA-Z\s-]{1,30})\s*(?:是什么意思|啥意思|怎么读|definition)/i)
              || ctx.userMessage.match(/\b([a-zA-Z]{3,20})\b/);
    const word = (m?.[1] || '').trim().toLowerCase().split(/\s+/)[0];
    if (!word || !/^[a-zA-Z-]{3,30}$/.test(word)) return { status: 'skipped', contextBlock: '' };
    try {
      const res = await fetch(`https://api.dictionaryapi.dev/api/v2/entries/en/${encodeURIComponent(word)}`, { signal: ctx.signal });
      if (res.status === 404) return { status: 'error', error: `未找到单词 "${word}"` };
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      const entry = Array.isArray(data) ? data[0] : null;
      if (!entry) return { status: 'error', error: '返回数据格式异常' };
      const phonetic = entry.phonetic || entry.phonetics?.find((p: any) => p.text)?.text || '';
      const meanings = (entry.meanings || []).slice(0, 3).map((m: any) => {
        const defs = (m.definitions || []).slice(0, 2).map((d: any, i: number) =>
          `  ${i + 1}. ${d.definition}${d.example ? `\n     例: ${d.example}` : ''}`
        ).join('\n');
        return `${m.partOfSpeech || ''}\n${defs}`;
      }).join('\n\n');
      return {
        status: 'success',
        contextBlock: `【词典】${entry.word}${phonetic ? ` ${phonetic}` : ''}\n${meanings}`,
        meta: { word: entry.word, phonetic },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '查询失败' };
    }
  },
};
