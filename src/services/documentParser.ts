// Document parsing service for RAG
export interface ParsedDocument {
  content: string;
  metadata: {
    filename: string;
    fileType: string;
    fileSize: number;
    pageCount?: number;
    uploadTime: number;
  };
}

export class DocumentParser {
  static async parseFile(file: File): Promise<ParsedDocument> {
    const fileType = file.name.split('.').pop()?.toLowerCase() || '';
    const fileSize = file.size;
    const uploadTime = Date.now();

    let content = '';
    let pageCount: number | undefined;

    switch (fileType) {
      case 'txt':
      case 'md':
      case 'markdown':
        content = await this.parseTextFile(file);
        break;
      case 'pdf':
        const pdfResult = await this.parsePDF(file);
        content = pdfResult.content;
        pageCount = pdfResult.pageCount;
        break;
      case 'docx':
      case 'doc':
        content = await this.parseWord(file);
        break;
      case 'xlsx':
      case 'xls':
      case 'csv':
        content = await this.parseExcel(file);
        break;
      default:
        throw new Error(`Unsupported file type: ${fileType}`);
    }

    return {
      content,
      metadata: {
        filename: file.name,
        fileType,
        fileSize,
        pageCount,
        uploadTime,
      },
    };
  }

  private static async parseTextFile(file: File): Promise<string> {
    return new Promise((resolve, reject) => {
      const reader = new FileReader();
      reader.onload = (e) => resolve(e.target?.result as string);
      reader.onerror = reject;
      reader.readAsText(file);
    });
  }

  private static async parsePDF(file: File): Promise<{ content: string; pageCount: number }> {
    // For browser environment, we'll use a simple text extraction
    // In production, you might want to use pdf.js or a backend service
    const text = await this.parseTextFile(file);
    
    // Simple heuristic: count form feed characters or estimate pages
    const formFeeds = (text.match(/\f/g) || []).length;
    const pageCount = formFeeds > 0 ? formFeeds : Math.ceil(text.length / 3000);
    
    return { content: text, pageCount };
  }

  private static async parseWord(file: File): Promise<string> {
    // For .docx files, extract text from XML structure
    const text = await this.parseTextFile(file);
    
    // Simple XML tag removal for docx
    if (file.name.endsWith('.docx')) {
      // Remove XML tags
      return text
        .replace(/<[^>]+>/g, ' ')
        .replace(/\s+/g, ' ')
        .trim();
    }
    
    return text;
  }

  private static async parseExcel(file: File): Promise<string> {
    const text = await this.parseTextFile(file);
    
    // For CSV, return as is
    if (file.name.endsWith('.csv')) {
      return text;
    }
    
    // For Excel files, in production you'd use a library like xlsx
    // Here we provide a placeholder
    return `[Excel file content: ${file.name}]\n\n${text.slice(0, 1000)}...`;
  }

  static getFileIcon(fileType: string): string {
    const icons: Record<string, string> = {
      pdf: '📄',
      docx: '📝',
      doc: '📝',
      xlsx: '📊',
      xls: '📊',
      csv: '📊',
      txt: '📃',
      md: '📑',
      markdown: '📑',
    };
    return icons[fileType.toLowerCase()] || '📎';
  }

  static formatFileSize(bytes: number): string {
    if (bytes < 1024) return bytes + ' B';
    if (bytes < 1024 * 1024) return (bytes / 1024).toFixed(1) + ' KB';
    return (bytes / (1024 * 1024)).toFixed(1) + ' MB';
  }
}
