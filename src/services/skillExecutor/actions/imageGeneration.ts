import type { SkillContext, SkillResult, SkillDefinition } from '../types';

export const imageGeneration: SkillDefinition = {
  id: 'image-generation',
  type: 'real',
  needsApiKey: ['openai'],
  execute: async (ctx: SkillContext): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => {
    const key = ctx.apiKeys['openai'];
    if (!key) return { status: 'error', error: '未配置 OpenAI API Key，无法生成图片' };
    try {
      const prompt = ctx.userMessage.replace(/^.*?(生成|画|create|generate|draw)\s*/i, '').trim().slice(0, 1000) || ctx.userMessage;
      const res = await fetch('https://api.openai.com/v1/images/generations', {
        method: 'POST',
        headers: { 'Content-Type': 'application/json', 'Authorization': `Bearer ${key}` },
        body: JSON.stringify({ model: 'dall-e-3', prompt, n: 1, size: '1024x1024' }),
        signal: ctx.signal,
      });
      if (!res.ok) {
        const err = await res.text();
        return { status: 'error', error: `OpenAI 图片生成失败: ${res.status} ${err.slice(0, 200)}` };
      }
      const data = await res.json();
      const imageUrl = data.data?.[0]?.url;
      if (!imageUrl) return { status: 'error', error: '未返回图片URL' };
      return {
        status: 'success',
        contextBlock: `【图片生成成功】提示词: ${prompt}\n请向用户展示生成的图片，并描述图像内容。`,
        attachments: [{ type: 'image', url: imageUrl, name: 'generated.png' }],
        meta: { url: imageUrl, prompt },
      };
    } catch (e) {
      return { status: 'error', error: e instanceof Error ? e.message : '图片生成失败' };
    }
  },
};
