import type { SkillContext, SkillResult, SkillDefinition } from '../types';

const SYMBOLS: Record<string, string> = {
  USD: '$', CNY: '¥', EUR: '€', GBP: '£', JPY: '¥', KRW: '₩',
  HKD: 'HK$', TWD: 'NT$', AUD: 'A$', CAD: 'C$', CHF: 'CHF', INR: '₹',
  RUB: '₽', SGD: 'S$', THB: '฿', VND: '₫',
};

export const currencyConverter: SkillDefinition = {
  id: 'currency-converter',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const m = ctx.userMessage.match(/(\d+(?:\.\d+)?)\s*([A-Z]{3})\s*(?:to|换|转|=>|->|=|in)\s*([A-Z]{3})/i);
    if (!m) return { status: 'skipped', contextBlock: '' };
    const amount = parseFloat(m[1]);
    const from = m[2].toUpperCase();
    const to = m[3].toUpperCase();
    if (!Number.isFinite(amount)) return { status: 'error', error: '金额无效' };
    try {
      const res = await fetch(`https://api.exchangerate.host/convert?from=${from}&to=${to}&amount=${amount}`, { signal: ctx.signal });
      if (!res.ok) throw new Error(`HTTP ${res.status}`);
      const data = await res.json();
      if (typeof data.result !== 'number') throw new Error('返回格式异常');
      const sym = SYMBOLS[to] || '';
      return {
        status: 'success',
        contextBlock: `【汇率换算】${amount} ${from} = ${data.result.toFixed(4)} ${to}${sym ? ` (${sym}${data.result.toFixed(2)})` : ''}\n汇率: 1 ${from} = ${data.info?.rate?.toFixed(6) || '?'} ${to}`,
        meta: { from, to, amount, result: data.result, rate: data.info?.rate },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '汇率查询失败' };
    }
  },
};
