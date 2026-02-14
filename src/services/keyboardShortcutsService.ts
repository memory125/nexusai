/**
 * Keyboard Shortcuts Service
 * 
 * Features:
 * - Register global keyboard shortcuts
 * - Customizable key bindings
 * - Shortcut conflict detection
 * - Enable/disable shortcuts
 * - Persist user preferences
 */

export type ShortcutAction = 
  | 'send_message'
  | 'new_conversation'
  | 'toggle_model_picker'
  | 'toggle_knowledge_base'
  | 'toggle_template'
  | 'toggle_export'
  | 'toggle_sidebar'
  | 'focus_input'
  | 'escape'
  | 'copy_last_message'
  | 'tts_play'
  | 'tts_stop';

export interface Shortcut {
  id: string;
  action: ShortcutAction;
  keys: string[];  // e.g., ['ctrl', 'enter']
  description: string;
  descriptionEn: string;
  enabled: boolean;
}

export interface ShortcutCategory {
  id: string;
  name: string;
  shortcuts: Shortcut[];
}

const DEFAULT_SHORTCUTS: Shortcut[] = [
  {
    id: 'send_message',
    action: 'send_message',
    keys: ['ctrl', 'enter'],
    description: '发送消息',
    descriptionEn: 'Send message',
    enabled: true,
  },
  {
    id: 'new_conversation',
    action: 'new_conversation',
    keys: ['ctrl', 'n'],
    description: '新建对话',
    descriptionEn: 'New conversation',
    enabled: true,
  },
  {
    id: 'toggle_model_picker',
    action: 'toggle_model_picker',
    keys: ['ctrl', 'm'],
    description: '切换模型选择器',
    descriptionEn: 'Toggle model picker',
    enabled: true,
  },
  {
    id: 'toggle_knowledge_base',
    action: 'toggle_knowledge_base',
    keys: ['ctrl', 'k'],
    description: '切换知识库面板',
    descriptionEn: 'Toggle knowledge base',
    enabled: true,
  },
  {
    id: 'toggle_template',
    action: 'toggle_template',
    keys: ['ctrl', 't'],
    description: '切换模板选择器',
    descriptionEn: 'Toggle template selector',
    enabled: true,
  },
  {
    id: 'toggle_export',
    action: 'toggle_export',
    keys: ['ctrl', 'e'],
    description: '导出对话',
    descriptionEn: 'Export conversation',
    enabled: true,
  },
  {
    id: 'focus_input',
    action: 'focus_input',
    keys: ['ctrl', '/'],
    description: '聚焦输入框',
    descriptionEn: 'Focus input',
    enabled: true,
  },
  {
    id: 'copy_last_message',
    action: 'copy_last_message',
    keys: ['ctrl', 'shift', 'c'],
    description: '复制最后一条消息',
    descriptionEn: 'Copy last message',
    enabled: true,
  },
  {
    id: 'tts_play',
    action: 'tts_play',
    keys: ['ctrl', 'p'],
    description: '播放语音',
    descriptionEn: 'Play TTS',
    enabled: true,
  },
  {
    id: 'tts_stop',
    action: 'tts_stop',
    keys: ['ctrl', 'shift', 'p'],
    description: '停止语音',
    descriptionEn: 'Stop TTS',
    enabled: true,
  },
  {
    id: 'escape',
    action: 'escape',
    keys: ['escape'],
    description: '关闭弹窗/取消',
    descriptionEn: 'Close modal/Cancel',
    enabled: true,
  },
];

const STORAGE_KEY = 'nexusai_keyboard_shortcuts';

export class KeyboardShortcutsService {
  private shortcuts: Shortcut[] = [];
  private listeners: Map<ShortcutAction, () => void> = new Map();
  private keyDownHandler: (e: KeyboardEvent) => void;

  constructor() {
    this.loadFromStorage();
    this.keyDownHandler = this.handleKeyDown.bind(this);
    this.attach();
  }

  private loadFromStorage() {
    try {
      const stored = localStorage.getItem(STORAGE_KEY);
      if (stored) {
        const data = JSON.parse(stored);
        // Merge with defaults
        this.shortcuts = DEFAULT_SHORTCUTS.map(defaultShortcut => {
          const saved = data.find((s: Shortcut) => s.id === defaultShortcut.id);
          return saved || defaultShortcut;
        });
      } else {
        this.shortcuts = [...DEFAULT_SHORTCUTS];
      }
    } catch (e) {
      console.error('Failed to load shortcuts:', e);
      this.shortcuts = [...DEFAULT_SHORTCUTS];
    }
  }

  private saveToStorage() {
    try {
      localStorage.setItem(STORAGE_KEY, JSON.stringify(this.shortcuts));
    } catch (e) {
      console.error('Failed to save shortcuts:', e);
    }
  }

  /**
   * Attach keyboard event listener
   */
  attach() {
    document.addEventListener('keydown', this.keyDownHandler);
  }

  /**
   * Detach keyboard event listener
   */
  detach() {
    document.removeEventListener('keydown', this.keyDownHandler);
  }

  /**
   * Handle key down event
   */
  private handleKeyDown(e: KeyboardEvent) {
    // Ignore if typing in input/textarea
    const target = e.target as HTMLElement;
    if (target.tagName === 'INPUT' || target.tagName === 'TEXTAREA' || target.isContentEditable) {
      // Allow Escape in inputs
      if (e.key !== 'Escape') {
        return;
      }
    }

    const keys = this.getPressedKeys(e);
    
    // Find matching shortcut
    const shortcut = this.shortcuts.find(s => 
      s.enabled && 
      s.keys.length === keys.length &&
      s.keys.every((key, i) => key === keys[i])
    );

    if (shortcut) {
      e.preventDefault();
      this.triggerAction(shortcut.action);
    }
  }

  /**
   * Get pressed keys from event
   */
  private getPressedKeys(e: KeyboardEvent): string[] {
    const keys: string[] = [];
    
    if (e.ctrlKey) keys.push('ctrl');
    if (e.altKey) keys.push('alt');
    if (e.shiftKey) keys.push('shift');
    if (e.metaKey) keys.push('meta');
    
    // Add the main key (lowercase)
    if (e.key !== 'Control' && e.key !== 'Alt' && e.key !== 'Shift' && e.key !== 'Meta') {
      keys.push(e.key.toLowerCase());
    }
    
    return keys;
  }

  /**
   * Trigger action
   */
  private triggerAction(action: ShortcutAction) {
    const listener = this.listeners.get(action);
    if (listener) {
      listener();
    }
  }

  /**
   * Register action listener
   */
  onAction(action: ShortcutAction, callback: () => void) {
    this.listeners.set(action, callback);
  }

  /**
   * Remove action listener
   */
  offAction(action: ShortcutAction) {
    this.listeners.delete(action);
  }

  /**
   * Get all shortcuts
   */
  getAll(): Shortcut[] {
    return [...this.shortcuts];
  }

  /**
   * Get shortcuts by category
   */
  getByCategory(): ShortcutCategory[] {
    const categories: ShortcutCategory[] = [
      {
        id: 'message',
        name: '消息',
        shortcuts: this.shortcuts.filter(s => 
          ['send_message', 'copy_last_message'].includes(s.action)
        ),
      },
      {
        id: 'panel',
        name: '面板',
        shortcuts: this.shortcuts.filter(s => 
          ['toggle_model_picker', 'toggle_knowledge_base', 'toggle_template', 'toggle_export', 'toggle_sidebar'].includes(s.action)
        ),
      },
      {
        id: 'navigation',
        name: '导航',
        shortcuts: this.shortcuts.filter(s => 
          ['new_conversation', 'focus_input', 'escape'].includes(s.action)
        ),
      },
      {
        id: 'media',
        name: '媒体',
        shortcuts: this.shortcuts.filter(s => 
          ['tts_play', 'tts_stop'].includes(s.action)
        ),
      },
    ];

    return categories.filter(c => c.shortcuts.length > 0);
  }

  /**
   * Get shortcut by action
   */
  getByAction(action: ShortcutAction): Shortcut | undefined {
    return this.shortcuts.find(s => s.action === action);
  }

  /**
   * Update shortcut keys
   */
  updateShortcut(id: string, keys: string[]): boolean {
    const shortcut = this.shortcuts.find(s => s.id === id);
    if (!shortcut) return false;

    // Check for conflicts
    const conflict = this.shortcuts.find(s => 
      s.id !== id && 
      s.enabled && 
      s.keys.length === keys.length &&
      s.keys.every((key, i) => key === keys[i])
    );

    if (conflict) {
      console.warn(`Shortcut conflict: ${id} conflicts with ${conflict.id}`);
      return false;
    }

    shortcut.keys = keys;
    this.saveToStorage();
    return true;
  }

  /**
   * Toggle shortcut enabled
   */
  toggleShortcut(id: string): boolean {
    const shortcut = this.shortcuts.find(s => s.id === id);
    if (!shortcut) return false;

    shortcut.enabled = !shortcut.enabled;
    this.saveToStorage();
    return true;
  }

  /**
   * Enable/disable all shortcuts
   */
  setEnabled(enabled: boolean) {
    this.shortcuts.forEach(s => s.enabled = enabled);
    this.saveToStorage();
  }

  /**
   * Reset to defaults
   */
  resetToDefaults() {
    this.shortcuts = [...DEFAULT_SHORTCUTS];
    this.saveToStorage();
  }

  /**
   * Get shortcut display string
   */
  getShortcutDisplay(keys: string[]): string {
    return keys.map(k => {
      switch (k) {
        case 'ctrl': return 'Ctrl';
        case 'alt': return 'Alt';
        case 'shift': return 'Shift';
        case 'meta': return '⌘';
        case 'enter': return '↵';
        case 'escape': return 'Esc';
        default: return k.toUpperCase();
      }
    }).join(' + ');
  }

  /**
   * Check if a key combination is valid
   */
  isValidKeyCombination(keys: string[]): boolean {
    if (keys.length === 0) return false;
    
    // Must include at least one modifier or be a special key
    const hasModifier = keys.some(k => ['ctrl', 'alt', 'shift', 'meta'].includes(k));
    const hasSpecialKey = ['escape', 'enter', 'tab', 'backspace', 'delete', 'arrowup', 'arrowdown', 'arrowleft', 'arrowright'].includes(keys[keys.length - 1]);
    
    return hasModifier || hasSpecialKey;
  }
}

export const keyboardShortcutsService = new KeyboardShortcutsService();
