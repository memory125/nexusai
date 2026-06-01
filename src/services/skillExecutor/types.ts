export interface SkillContext {
  userMessage: string;
  signal: AbortSignal;
  apiKeys: Record<string, string>;
}

export interface SkillResult {
  skillId: string;
  skillName: string;
  status: 'success' | 'error' | 'skipped';
  contextBlock?: string;
  attachments?: SkillAttachment[];
  error?: string;
  durationMs: number;
  meta?: Record<string, unknown>;
}

export interface SkillAttachment {
  type: 'image' | 'text' | 'file';
  url?: string;
  name: string;
  content?: string;
}

export type SkillActionType = 'real' | 'prompt';

export interface SkillDefinition {
  id: string;
  type: SkillActionType;
  needsApiKey?: string[];
  execute?: (ctx: SkillContext) => Promise<Omit<SkillResult, 'skillId' | 'skillName' | 'durationMs'>>;
}
