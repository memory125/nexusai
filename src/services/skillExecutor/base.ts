export async function fetchJson(url: string, signal: AbortSignal, init?: RequestInit): Promise<any> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.json();
}

export async function fetchText(url: string, signal: AbortSignal, init?: RequestInit): Promise<string> {
  const res = await fetch(url, { ...init, signal });
  if (!res.ok) throw new Error(`HTTP ${res.status}`);
  return res.text();
}

export function extractKeywords(text: string, max = 8): string[] {
  const cleaned = text
    .replace(/```[\s\S]*?```/g, ' ')
    .replace(/[#*`_~>[\](){}|]/g, ' ')
    .replace(/https?:\/\/\S+/g, ' ')
    .replace(/[，。！？、；：""'',.!?;:""''()\[\]{}]/g, ' ')
    .toLowerCase();
  const words = cleaned.split(/\s+/).filter(w => w.length >= 2 && w.length <= 20);
  const stop = new Set(['the','a','an','is','are','was','were','be','been','being','have','has','had','do','does','did','will','would','should','could','can','may','might','must','shall','i','you','he','she','it','we','they','me','him','her','us','them','my','your','his','its','our','their','this','that','these','those','what','which','who','whom','where','when','why','how','and','or','but','if','then','else','for','to','of','in','on','at','by','from','as','with','about','into','through','during','before','after','above','below','up','down','out','off','over','under','again','further','once','all','any','both','each','few','more','most','other','some','such','no','nor','not','only','own','same','so','than','too','very','s','t','just','don','now','请帮我','帮我','请给我','你能','可以','一下','请问','一个','这是','那个','什么','怎么','为什么','因为','所以','但是','然后','现在','我们','你们','他们','这个','那个','一些','所有','需要','应该','可能','已经','正在','将','会','能','要','把','被','对','从','向','为','于','在','是','有','和','或','但','不','也','都','就','再','很','还','只','才','与','及','等']);
  const freq: Record<string, number> = {};
  for (const w of words) {
    if (stop.has(w)) continue;
    if (/^\d+$/.test(w)) continue;
    freq[w] = (freq[w] || 0) + 1;
  }
  return Object.entries(freq)
    .sort((a, b) => b[1] - a[1])
    .slice(0, max)
    .map(([w]) => w);
}

export function tryExtractUrl(text: string): string | null {
  const m = text.match(/https?:\/\/[^\s)\]]+/i);
  return m ? m[0].replace(/[.,;!?)]+$/, '') : null;
}

export function safeNumber(s: string): number | null {
  const n = Number(s);
  return Number.isFinite(n) ? n : null;
}
