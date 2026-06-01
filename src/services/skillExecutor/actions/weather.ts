import type { SkillContext, SkillResult, SkillDefinition } from '../types';

export const weather: SkillDefinition = {
  id: 'weather',
  type: 'real',
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const cityMatch = ctx.userMessage.match(/(?:北京|上海|广州|深圳|杭州|成都|武汉|西安|南京|重庆|天津|苏州|长沙|青岛|沈阳|大连|厦门|福州|济南|合肥|南宁|昆明|拉萨|乌鲁木齐|哈尔滨|长春|石家庄|太原|郑州|南昌|贵阳|兰州|海口|银川|西宁|呼和浩特|香港|澳门|台北|Bangkok|Tokyo|Singapore|New York|London|Paris|Tokyo|Seoul|Sydney|Berlin|Moscow|Dubai|San Francisco|Los Angeles|Chicago|Toronto|Vancouver|Mexico City|Rio|Sao Paulo|Cape Town|Mumbai|Delhi|Jakarta|Manila|Kuala Lumpur|Ho Chi Minh|Hanoi)/);
    if (!cityMatch) return { status: 'skipped', contextBlock: '' };
    const city = cityMatch[0];
    try {
      const geoRes = await fetch(`https://geocoding-api.open-meteo.com/v1/search?name=${encodeURIComponent(city)}&count=1&language=zh&format=json`, { signal: ctx.signal });
      const geoData = await geoRes.json();
      const loc = geoData.results?.[0];
      if (!loc) return { status: 'error', error: `未找到城市: ${city}` };
      const wxRes = await fetch(
        `https://api.open-meteo.com/v1/forecast?latitude=${loc.latitude}&longitude=${loc.longitude}&current_weather=true&hourly=relative_humidity_2m&timezone=auto`,
        { signal: ctx.signal }
      );
      const wx = await wxRes.json();
      const cw = wx.current_weather;
      const weatherCodes: Record<number, string> = {
        0: '晴', 1: '基本晴', 2: '局部多云', 3: '阴',
        45: '雾', 48: '雾凇',
        51: '毛毛雨', 53: '小雨', 55: '中雨',
        61: '小雨', 63: '中雨', 65: '大雨',
        71: '小雪', 73: '中雪', 75: '大雪',
        77: '雪粒', 80: '阵雨', 81: '强阵雨', 82: '剧烈阵雨',
        85: '阵雪', 86: '强阵雪',
        95: '雷雨', 96: '雷雨夹冰雹', 99: '强雷雨夹冰雹',
      };
      const desc = weatherCodes[cw.weathercode] || `代码${cw.weathercode}`;
      return {
        status: 'success',
        contextBlock: `【天气】${loc.name} (${loc.country})\n${desc} · 气温 ${cw.temperature}°C · 风速 ${cw.windspeed} km/h · 风向 ${cw.winddirection}°\n更新时间: ${cw.time}`,
        meta: { city: loc.name, temp: cw.temperature, code: cw.weathercode },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '查询失败' };
    }
  },
};
