import type { SkillContext, SkillResult, SkillDefinition } from '../types';

export const calculator: SkillDefinition = {
  id: 'calculator',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const m = ctx.userMessage.match(/[0-9+\-*/().,%^√\s]+/g);
    if (!m) return { status: 'skipped', contextBlock: '' };
    const expr = m
      .map(s => s.trim())
      .filter(s => /[0-9]/.test(s) && /[+\-*/^%]/.test(s))
      .sort((a, b) => b.length - a.length)[0];
    if (!expr || expr.length < 3) return { status: 'skipped', contextBlock: '' };
    try {
      const safe = expr.replace(/\^/g, '**').replace(/√/g, 'Math.sqrt');
      if (!/^[\d+\-*/().,%*\sMath.sqrt]+$/.test(safe)) {
        return { status: 'error', error: '包含不安全的表达式' };
      }
      const fn = new Function('Math', `"use strict"; return (${safe});`);
      const result = fn(Math);
      const display = typeof result === 'number' ? (Number.isInteger(result) ? result.toString() : result.toFixed(8).replace(/\.?0+$/, '')) : String(result);
      return {
        status: 'success',
        contextBlock: `【计算结果】${expr} = ${display}`,
        meta: { expression: expr, result: display },
      };
    } catch (e) {
      return { status: 'error', error: '无法计算该表达式' };
    }
  },
};
