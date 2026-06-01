import type { SkillContext, SkillResult, SkillDefinition } from './types';
import { webSearch } from './actions/webSearch';
import { webFetch } from './actions/webFetch';
import { imageGeneration } from './actions/imageGeneration';
import { calculator } from './actions/calculator';
import { datetime } from './actions/datetime';
import { dictionary } from './actions/dictionary';
import { wikipedia } from './actions/wikipedia';
import { weather } from './actions/weather';
import { currencyConverter } from './actions/currencyConverter';
import { codeSearch } from './actions/codeSearch';
import { academicSearch } from './actions/academicSearch';
import { newsAggregator } from './actions/newsAggregator';

const PROMPT_ONLY: Record<string, string> = {
  'writing': '你是专业写作助手，注重结构清晰、表达准确、读者友好。',
  'copywriting': '你是广告文案专家，突出价值主张与CTA。',
  'poetry': '你是诗人，注重韵律、意境、情感。',
  'screenwriting': '你是编剧，遵循三幕结构与场景节拍。',
  'storytelling': '你是故事创作者，注重人物弧线、冲突、高潮。',
  'headline-generator': '生成吸睛、简洁、贴合主题的标题。',
  'email-writer': '撰写专业商务邮件。',
  'blog-writer': '撰写技术博客，含小标题、代码块、列表。',
  'social-post': '撰写社媒帖子，短小精悍。',
  'video-script': '按镜头、台词、时长编写视频脚本。',
  'data-analysis': '数据分析师，回答包含方法、结论、可视化建议。',
  'chart-generation': '生成图表时选择最合适类型并标注坐标轴。',
  'statistical-analysis': '使用正确的检验方法与显著性解释。',
  'trend-analysis': '趋势分析含历史回顾与未来预测。',
  'competitor-analysis': '按维度比较并给出差异化建议。',
  'swot-analysis': 'SWOT 分析结构清晰、可操作。',
  'sentiment-analysis': '包含正负面与强度判断。',
  'translation': '翻译时保持原意、风格与术语一致。',
  'proofreading': '校对时关注语法、拼写、标点、流畅度。',
  'paraphrasing': '改写时保持原意，变换句式与用词。',
  'summarization': '摘要保留核心论点与关键数据。',
  'language-learning': '语言学习辅导含例句、语法点、练习。',
  'tone-adjustment': '调整正式度，保持信息不变。',
  'design': 'UI/UX 建议考虑可用性、可达性、视觉层级。',
  'color-palette': '配色方案遵循色彩理论并给出 HEX 值。',
  'typography': '字体建议考虑可读性、层级与品牌调性。',
  'layout-suggestion': '布局建议符合视觉动线与栅格系统。',
  'logo-ideas': 'Logo 创意简洁、辨识度高、易延展。',
  'mockup-generator': '原型描述清晰，可被设计师直接实现。',
  'marketing': '营销策略基于目标用户与渠道特性。',
  'seo': 'SEO 建议包含关键词、标题、Meta、内链。',
  'ad-copy': '投放文案吸睛、有力、有差异化。',
  'campaign-ideas': '营销活动创意包含主题、机制、时间表。',
  'social-strategy': '社媒策略覆盖内容、互动、数据复盘。',
  'email-marketing': '邮件营销注重主题、CTA、分段。',
  'content-strategy': '内容策略包含选题、节奏、转化路径。',
  'task-management': '任务建议按优先级与依赖关系组织。',
  'note-taking': '笔记整理使用层级化结构与标签。',
  'meeting-notes': '会议纪要包含决议、行动项、负责人。',
  'schedule-planner': '日程规划平衡重要紧急四象限。',
  'brainstorming': '头脑风暴鼓励发散并引导收敛。',
  'ppt-generator': 'PPT 大纲按章节、要点、视觉建议组织。',
  'resume-builder': '简历优化突出成就与量化指标。',
  'interview-prep': '面试准备包含 STAR 法则与模拟问答。',
  'video-analysis': '视频分析按镜头、节奏、叙事展开。',
  'audio-transcription': '语音转写时标注说话人与情绪。',
  'ocr': '文字识别时考虑版式还原与排版校对。',
  'chart-to-text': '图表解读按数据、趋势、洞察组织。',
  'legal-consult': '法律咨询以中国法律法规为准，并提示专业律师建议。',
  'medical-consult': '健康咨询仅供参考，不替代专业医生诊断。',
  'financial-consult': '理财建议提示风险，不构成投资建议。',
  'career-consult': '职业咨询关注兴趣、能力与市场需求。',
  'psychological': '心理咨询保持倾听、共情、不评判。',
  'game-companion': '游戏攻略包含角色、配装、副本流程。',
  'movie-recommender': '影视推荐按类型、心情、时长筛选。',
  'music-recommender': '音乐推荐按风格、场景、心情。',
  'book-summarizer': '书籍解读按主旨、要点、金句组织。',
  'recipe-generator': '菜谱包含食材、步骤、技巧与小贴士。',
  'travel-planner': '旅行规划按日程、交通、住宿、必玩项目。',
  'fitness-coaching': '健身指导按目标、动作组数、饮食建议。',
  'horoscope': '星座运势保持积极温和。',
  'joke-generator': '笑话得体、不冒犯、轻松幽默。',
  'coding': '回答代码问题时，优先给出可运行示例、关键注释与边界情况。',
  'code-review': '按可读性、性能、安全、可维护性逐项分析。',
  'debugging': '先复现问题，再给出根因分析与最小修复方案。',
  'refactoring': '重构时保留行为不变，并提供重构前后对比。',
  'testing': '回答测试问题时，给出单元测试、边界用例与覆盖率建议。',
  'git-helper': '提供等价的安全命令与回滚方案。',
  'api-design': 'API 设计遵循 RESTful 规范，给出 URL、参数、响应示例。',
  'database-design': '数据库设计时给出表结构、索引建议与 SQL 示例。',
  'docker-helper': '提供 Dockerfile 与 docker-compose 示例。',
  'k8s-helper': 'K8s 回答提供 YAML 清单与命令示例。',
  'security-scan': '关注 OWASP Top 10 风险。',
  'performance-opt': '性能优化建议包含 profiling、瓶颈分析、具体优化手段。',
  'docs-generator': '生成文档时使用清晰的章节结构与示例代码。',
};

export const SKILL_REGISTRY: Record<string, SkillDefinition> = {
  'web-search': webSearch,
  'web-fetch': webFetch,
  'image-generation': imageGeneration,
  'calculator': calculator,
  'datetime': datetime,
  'dictionary': dictionary,
  'wikipedia': wikipedia,
  'weather': weather,
  'currency-converter': currencyConverter,
  'code-search': codeSearch,
  'academic-search': academicSearch,
  'news-aggregator': newsAggregator,
};

for (const [id, prompt] of Object.entries(PROMPT_ONLY)) {
  if (SKILL_REGISTRY[id]) continue;
  SKILL_REGISTRY[id] = {
    id,
    type: 'prompt',
    execute: async (): Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>> => ({
      status: 'success',
      contextBlock: prompt,
    }),
  };
}

export async function executeSkill(
  skillId: string,
  ctx: SkillContext
): Promise<SkillResult | null> {
  const def = SKILL_REGISTRY[skillId];
  if (!def) return null;
  const start = Date.now();
  try {
    const partial = await def.execute!(ctx);
    return {
      skillId,
      skillName: skillId,
      durationMs: Date.now() - start,
      ...partial,
    };
  } catch (e) {
    return {
      skillId,
      skillName: skillId,
      status: 'error',
      error: e instanceof Error ? e.message : '执行失败',
      durationMs: Date.now() - start,
    };
  }
}

export function getSkillType(skillId: string): 'real' | 'prompt' | 'unknown' {
  return SKILL_REGISTRY[skillId]?.type || 'unknown';
}
