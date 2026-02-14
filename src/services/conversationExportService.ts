/**
 * Conversation Export & Share Service
 * 
 * Features:
 * - Export to Markdown, PDF, JSON formats
 * - Share via link (simulated)
 * - Copy to clipboard
 * - Print support
 */

import { Conversation, Message } from '../store';

export type ExportFormat = 'markdown' | 'json' | 'txt' | 'pdf';

export interface ExportOptions {
  format: ExportFormat;
  includeMetadata?: boolean;
  includeTimestamp?: boolean;
  includeModelInfo?: boolean;
  filterSystemMessages?: boolean;
}

export interface ShareOptions {
  expiryDays?: number;
  password?: string;
  allowComments?: boolean;
}

export class ConversationExportService {
  /**
   * Export conversation to various formats
   */
  exportConversation(conversation: Conversation, options: ExportOptions): string {
    switch (options.format) {
      case 'markdown':
        return this.toMarkdown(conversation, options);
      case 'json':
        return this.toJSON(conversation, options);
      case 'txt':
        return this.toText(conversation, options);
      case 'pdf':
        return this.toPDF(conversation, options);
      default:
        return this.toMarkdown(conversation, options);
    }
  }

  /**
   * Export to Markdown format
   */
  private toMarkdown(conversation: Conversation, options: ExportOptions): string {
    const { includeMetadata = true, includeTimestamp = true, includeModelInfo = true, filterSystemMessages = true } = options;
    
    let md = '';
    
    // Header
    md += `# ${conversation.title}\n\n`;
    
    // Metadata
    if (includeMetadata) {
      md += `---\n`;
      md += `**导出时间:** ${new Date().toLocaleString('zh-CN')}\n\n`;
      if (includeModelInfo) {
        md += `**模型:** ${conversation.model}\n\n`;
        md += `**提供商:** ${conversation.provider}\n\n`;
      }
      if (includeTimestamp) {
        md += `**创建时间:** ${new Date(conversation.createdAt).toLocaleString('zh-CN')}\n\n`;
        md += `**更新时间:** ${new Date(conversation.updatedAt).toLocaleString('zh-CN')}\n\n`;
      }
      md += `---\n\n`;
    }

    // Messages
    const messages = filterSystemMessages 
      ? conversation.messages.filter(m => m.role !== 'system')
      : conversation.messages;

    messages.forEach((msg, index) => {
      const role = msg.role === 'user' ? '👤 用户' : msg.role === 'assistant' ? '🤖 助手' : '⚙️ 系统';
      md += `## ${role}\n\n`;
      
      if (includeTimestamp) {
        md += `*${new Date(msg.timestamp).toLocaleString('zh-CN')}*\n\n`;
      }
      
      // Content
      md += this.processMarkdownContent(msg.content);
      md += '\n\n';

      // Attachments
      if (msg.attachments && msg.attachments.length > 0) {
        md += `**附件:**\n`;
        msg.attachments.forEach(att => {
          md += `- ${att.name} (${this.formatFileSize(att.size)})\n`;
        });
        md += '\n';
      }

      // RAG Sources
      if (msg.ragSources && msg.ragSources.length > 0) {
        md += `**参考来源:**\n`;
        msg.ragSources.forEach((source, i) => {
          md += `${i + 1}. ${source.documentName} (相似度: ${(source.similarity * 100).toFixed(1)}%)\n`;
        });
        md += '\n';
      }

      if (index < messages.length - 1) {
        md += '---\n\n';
      }
    });

    return md;
  }

  /**
   * Export to JSON format
   */
  private toJSON(conversation: Conversation, options: ExportOptions): string {
    const { includeMetadata = true } = options;
    
    const data = includeMetadata ? conversation : {
      title: conversation.title,
      messages: conversation.messages.filter(m => m.role !== 'system'),
    };

    return JSON.stringify(data, null, 2);
  }

  /**
   * Export to Plain Text format
   */
  private toText(conversation: Conversation, options: ExportOptions): string {
    const { includeMetadata = true, filterSystemMessages = true } = options;
    
    let txt = '';
    
    if (includeMetadata) {
      txt += `对话标题: ${conversation.title}\n`;
      txt += `导出时间: ${new Date().toLocaleString('zh-CN')}\n`;
      txt += `模型: ${conversation.model}\n`;
      txt += '=' .repeat(50) + '\n\n';
    }

    const messages = filterSystemMessages 
      ? conversation.messages.filter(m => m.role !== 'system')
      : conversation.messages;

    messages.forEach(msg => {
      const role = msg.role === 'user' ? '用户' : msg.role === 'assistant' ? '助手' : '系统';
      txt += `[${role}]\n`;
      txt += `${msg.content}\n`;
      txt += '-'.repeat(50) + '\n\n';
    });

    return txt;
  }

  /**
   * Export to PDF format (HTML wrapper for print-to-PDF)
   */
  private toPDF(conversation: Conversation, options: ExportOptions): string {
    const markdown = this.toMarkdown(conversation, options);
    
    return `<!DOCTYPE html>
<html>
<head>
  <meta charset="UTF-8">
  <title>${conversation.title}</title>
  <style>
    body { font-family: -apple-system, BlinkMacSystemFont, "Segoe UI", Roboto, sans-serif; line-height: 1.6; max-width: 800px; margin: 0 auto; padding: 40px; color: #333; }
    h1 { font-size: 24px; border-bottom: 2px solid #333; padding-bottom: 10px; }
    h2 { font-size: 16px; color: #666; margin-top: 30px; }
    hr { border: none; border-top: 1px solid #ddd; margin: 20px 0; }
    pre { background: #f5f5f5; padding: 15px; border-radius: 5px; overflow-x: auto; }
    code { background: #f5f5f5; padding: 2px 5px; border-radius: 3px; font-family: monospace; }
    blockquote { border-left: 3px solid #ddd; margin: 0; padding-left: 15px; color: #666; }
    @media print { body { padding: 20px; } }
  </style>
</head>
<body>
  ${this.markdownToHTML(markdown)}
</body>
</html>`;
  }

  /**
   * Download exported content
   */
  download(content: string, filename: string, format: ExportFormat) {
    const mimeTypes: Record<ExportFormat, string> = {
      markdown: 'text/markdown',
      json: 'application/json',
      txt: 'text/plain',
      pdf: 'text/html',
    };

    const extensions: Record<ExportFormat, string> = {
      markdown: 'md',
      json: 'json',
      txt: 'txt',
      pdf: 'html',
    };

    const blob = new Blob([content], { type: mimeTypes[format] });
    const url = URL.createObjectURL(blob);
    const a = document.createElement('a');
    a.href = url;
    a.download = `${filename}.${extensions[format]}`;
    document.body.appendChild(a);
    a.click();
    document.body.removeChild(a);
    URL.revokeObjectURL(url);
  }

  /**
   * Copy to clipboard
   */
  async copyToClipboard(content: string): Promise<boolean> {
    try {
      await navigator.clipboard.writeText(content);
      return true;
    } catch {
      return false;
    }
  }

  /**
   * Print conversation
   */
  print(conversation: Conversation, options: ExportOptions) {
    const html = this.toPDF(conversation, options);
    const printWindow = window.open('', '_blank');
    if (printWindow) {
      printWindow.document.write(html);
      printWindow.document.close();
      printWindow.print();
    }
  }

  /**
   * Generate share link (simulated)
   */
  async generateShareLink(conversation: Conversation, _options: ShareOptions): Promise<string> {
    // In production, this would upload to a server and return a real link
    const shareId = btoa(conversation.id + Date.now()).replace(/[^a-zA-Z0-9]/g, '').slice(0, 16);
    return `https://nexusai.app/share/${shareId}`;
  }

  /**
   * Share via Web Share API
   */
  async nativeShare(conversation: Conversation, content: string): Promise<boolean> {
    if (navigator.share) {
      try {
        await navigator.share({
          title: conversation.title,
          text: content.slice(0, 200) + '...',
          url: window.location.href,
        });
        return true;
      } catch {
        return false;
      }
    }
    return false;
  }

  /**
   * Process markdown content
   */
  private processMarkdownContent(content: string): string {
    // Escape HTML entities
    return content
      .replace(/&/g, '&amp;')
      .replace(/</g, '&lt;')
      .replace(/>/g, '&gt;');
  }

  /**
   * Convert markdown to HTML
   */
  private markdownToHTML(markdown: string): string {
    return markdown
      .replace(/^# (.*$)/gim, '<h1>$1</h1>')
      .replace(/^## (.*$)/gim, '<h2>$1</h2>')
      .replace(/^### (.*$)/gim, '<h3>$1</h3>')
      .replace(/\*\*(.*)\*\*/gim, '<strong>$1</strong>')
      .replace(/\*(.*)\*/gim, '<em>$1</em>')
      .replace(/```([\s\S]*?)```/gim, '<pre><code>$1</code></pre>')
      .replace(/`([^`]+)`/gim, '<code>$1</code>')
      .replace(/\n/gim, '<br>');
  }

  /**
   * Format file size
   */
  private formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}

// Singleton instance
export const conversationExportService = new ConversationExportService();
export default conversationExportService;
