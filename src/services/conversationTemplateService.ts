/**
 * Conversation Template Service
 * 
 * Features:
 * - Save frequently used prompts as templates
 * - Categorize templates (general, coding, writing, etc.)
 * - Quick insert from chat input
 * - Import/export templates
 * - Template usage statistics
 */

export interface ConversationTemplate {
  id: string;
  name: string;
  description: string;
  content: string;
  category: TemplateCategory;
  tags: string[];
  variables: TemplateVariable[];
  usageCount: number;
  createdAt: number;
  updatedAt: number;
  isFavorite: boolean;
}

export type TemplateCategory = 'general' | 'coding' | 'writing' | 'analysis' | 'creative' | 'other';

export interface TemplateVariable {
  name: string;
  placeholder: string;
  defaultValue?: string;
}

export interface CreateTemplateData {
  name: string;
  description: string;
  content: string;
  category: TemplateCategory;
  tags?: string[];
  variables?: TemplateVariable[];
}

const STORAGE_KEY = 'nexusai_conversation_templates';

export class ConversationTemplateService {
  private templates: Map<string, ConversationTemplate> = new Map();
  private defaultTemplates: ConversationTemplate[] = [];

  constructor() {
    this.loadFromStorage();
    this.initDefaultTemplates();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        data.forEach((t: ConversationTemplate) => {
          this.templates.set(t.id, t);
        });
      }
    } catch (e) {
      console.error('Failed to load templates from storage:', e);
    }
  }

  private saveToStorage() {
    try {
      const data = Array.from(this.templates.values());
      localStorage.setItem(STORAGE_KEY, JSON.stringify(data));
    } catch (e) {
      console.error('Failed to save templates to storage:', e);
    }
  }

  private initDefaultTemplates() {
    if (this.templates.size > 0) return;

    this.defaultTemplates = [
      {
        id: 'default_1',
        name: '代码审查',
        description: '请求 AI 审查代码并提供改进建议',
        content: '请帮我审查以下代码，指出潜在问题并提供优化建议：\n\n```\n{{code}}\n```',
        category: 'coding',
        tags: ['代码', '审查', '优化'],
        variables: [{ name: 'code', placeholder: '粘贴你的代码', defaultValue: '' }],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
      {
        id: 'default_2',
        name: '技术博客写作',
        description: '帮助撰写技术博客文章',
        content: '请帮我写一篇关于 {{topic}} 的技术博客，要求：\n- 语言通俗易懂\n- 包含实际案例\n- 代码示例\n- 总结要点',
        category: 'writing',
        tags: ['博客', '技术', '写作'],
        variables: [{ name: 'topic', placeholder: '输入主题', defaultValue: '' }],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
      {
        id: 'default_3',
        name: 'SQL 查询优化',
        description: '分析和优化 SQL 查询性能',
        content: '请分析以下 SQL 查询，指出性能问题并提供优化方案：\n\n```sql\n{{sql}}\n```\n\n请从以下角度分析：\n1. 索引使用情况\n2. 执行计划\n3. 潜在的全表扫描',
        category: 'coding',
        tags: ['SQL', '数据库', '优化'],
        variables: [{ name: 'sql', placeholder: '粘贴 SQL 语句', defaultValue: '' }],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
      {
        id: 'default_4',
        name: '英文翻译',
        description: '将中文翻译为英文',
        content: '请将以下中文内容翻译成流畅自然的英文：\n\n{{content}}',
        category: 'general',
        tags: ['翻译', '英文'],
        variables: [{ name: 'content', placeholder: '输入要翻译的内容', defaultValue: '' }],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
      {
        id: 'default_5',
        name: '数据分析师',
        description: '分析数据并生成报告',
        content: '请分析以下数据，生成详细报告：\n\n数据：\n{{data}}\n\n请包含：\n1. 数据概览\n2. 关键发现\n3. 可视化建议\n4. 行动建议',
        category: 'analysis',
        tags: ['分析', '数据', '报告'],
        variables: [{ name: 'data', placeholder: '输入或描述数据', defaultValue: '' }],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
      {
        id: 'default_6',
        name: 'API 设计',
        description: '帮助设计 RESTful API',
        content: '请帮我设计一个 {{endpoint}} 的 RESTful API：\n\n需求：\n{{requirements}}\n\n请包含：\n1. 接口路径\n2. 请求参数\n3. 响应格式\n4. 错误处理',
        category: 'coding',
        tags: ['API', '设计', '后端'],
        variables: [
          { name: 'endpoint', placeholder: '如：用户管理', defaultValue: '' },
          { name: 'requirements', placeholder: '描述你的需求', defaultValue: '' },
        ],
        usageCount: 0,
        createdAt: Date.now(),
        updatedAt: Date.now(),
        isFavorite: false,
      },
    ];

    // Add default templates
    this.defaultTemplates.forEach(t => {
      this.templates.set(t.id, t);
    });
    this.saveToStorage();
  }

  /**
   * Get all templates
   */
  getAllTemplates(): ConversationTemplate[] {
    return Array.from(this.templates.values())
      .sort((a, b) => {
        // Favorites first, then by usage count, then by updated time
        if (a.isFavorite !== b.isFavorite) return a.isFavorite ? -1 : 1;
        if (a.usageCount !== b.usageCount) return b.usageCount - a.usageCount;
        return b.updatedAt - a.updatedAt;
      });
  }

  /**
   * Get templates by category
   */
  getTemplatesByCategory(category: TemplateCategory): ConversationTemplate[] {
    return this.getAllTemplates().filter(t => t.category === category);
  }

  /**
   * Get favorite templates
   */
  getFavoriteTemplates(): ConversationTemplate[] {
    return this.getAllTemplates().filter(t => t.isFavorite);
  }

  /**
   * Search templates
   */
  searchTemplates(query: string): ConversationTemplate[] {
    const lowerQuery = query.toLowerCase();
    return this.getAllTemplates().filter(t =>
      t.name.toLowerCase().includes(lowerQuery) ||
      t.description.toLowerCase().includes(lowerQuery) ||
      t.tags.some(tag => tag.toLowerCase().includes(lowerQuery))
    );
  }

  /**
   * Get template by ID
   */
  getTemplate(id: string): ConversationTemplate | null {
    return this.templates.get(id) || null;
  }

  /**
   * Create a new template
   */
  createTemplate(data: CreateTemplateData): ConversationTemplate {
    const template: ConversationTemplate = {
      id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
      name: data.name,
      description: data.description,
      content: data.content,
      category: data.category,
      tags: data.tags || [],
      variables: data.variables || [],
      usageCount: 0,
      createdAt: Date.now(),
      updatedAt: Date.now(),
      isFavorite: false,
    };

    this.templates.set(template.id, template);
    this.saveToStorage();
    return template;
  }

  /**
   * Update template
   */
  updateTemplate(id: string, data: Partial<CreateTemplateData>): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    Object.assign(template, data, { updatedAt: Date.now() });
    this.saveToStorage();
    return true;
  }

  /**
   * Delete template (only user-created, not defaults)
   */
  deleteTemplate(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    // Don't delete default templates
    if (template.id.startsWith('default_')) {
      return false;
    }

    this.templates.delete(id);
    this.saveToStorage();
    return true;
  }

  /**
   * Toggle favorite
   */
  toggleFavorite(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    template.isFavorite = !template.isFavorite;
    template.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * Increment usage count
   */
  incrementUsage(id: string): boolean {
    const template = this.templates.get(id);
    if (!template) return false;

    template.usageCount++;
    template.updatedAt = Date.now();
    this.saveToStorage();
    return true;
  }

  /**
   * Render template with variable values
   */
  renderTemplate(id: string, variableValues: Record<string, string>): string {
    const template = this.templates.get(id);
    if (!template) return '';

    let content = template.content;
    template.variables.forEach(v => {
      const value = variableValues[v.name] || v.defaultValue || v.placeholder;
      content = content.replace(new RegExp(`{{${v.name}}}`, 'g'), value);
    });

    // Increment usage
    this.incrementUsage(id);

    return content;
  }

  /**
   * Export templates to JSON
   */
  exportTemplates(): string {
    const userTemplates = Array.from(this.templates.values())
      .filter(t => !t.id.startsWith('default_'));
    return JSON.stringify(userTemplates, null, 2);
  }

  /**
   * Import templates from JSON
   */
  importTemplates(jsonString: string): number {
    try {
      const templates = JSON.parse(jsonString) as ConversationTemplate[];
      let imported = 0;

      templates.forEach(t => {
        // Generate new ID to avoid conflicts
        const newTemplate: ConversationTemplate = {
          ...t,
          id: `tpl_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          createdAt: Date.now(),
          updatedAt: Date.now(),
          usageCount: 0,
        };
        this.templates.set(newTemplate.id, newTemplate);
        imported++;
      });

      this.saveToStorage();
      return imported;
    } catch (e) {
      console.error('Failed to import templates:', e);
      return 0;
    }
  }

  /**
   * Get statistics
   */
  getStatistics() {
    const templates = this.getAllTemplates();
    return {
      total: templates.length,
      userCreated: templates.filter(t => !t.id.startsWith('default_')).length,
      byCategory: {
        general: templates.filter(t => t.category === 'general').length,
        coding: templates.filter(t => t.category === 'coding').length,
        writing: templates.filter(t => t.category === 'writing').length,
        analysis: templates.filter(t => t.category === 'analysis').length,
        creative: templates.filter(t => t.category === 'creative').length,
        other: templates.filter(t => t.category === 'other').length,
      },
      totalUsage: templates.reduce((sum, t) => sum + t.usageCount, 0),
      favorites: templates.filter(t => t.isFavorite).length,
    };
  }
}

export const conversationTemplateService = new ConversationTemplateService();
