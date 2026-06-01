import type { SkillResult, SkillDefinition } from '../types';

export const datetime: SkillDefinition = {
  id: 'datetime',
  type: 'real',
  execute: async (): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const now = new Date();
    const utc = now.toISOString();
    const local = now.toLocaleString('zh-CN', { hour12: false, timeZoneName: 'short' });
    const weekday = ['日','一','二','三','四','五','六'][now.getDay()];
    const week = Math.ceil(((now.getTime() - new Date(now.getFullYear(), 0, 1).getTime()) / 86400000 + new Date(now.getFullYear(), 0, 1).getDay() + 1) / 7);
    return {
      status: 'success',
      contextBlock: `【当前时间】本地: ${local} (周${weekday} · 第${week}周)\nUTC: ${utc}\n时间戳: ${now.getTime()}`,
      meta: { local, utc, ts: now.getTime() },
    };
  },
};
