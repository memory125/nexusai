import { useState, useRef, useEffect } from 'react';
import { useStore, modelProviders } from '../store';
import { Send, Sparkles, Bot, User, ChevronDown, Paperclip, Mic, StopCircle } from 'lucide-react';
import { ProviderIcon } from './ProviderIcons';

export function ChatPage() {
  const {
    conversations, activeConversationId, addMessage,
    createConversation, selectedProvider, selectedModel,
    setSelectedProvider, setSelectedModel, isGenerating,
    activeAgent,
  } = useStore();

  const [input, setInput] = useState('');
  const [showModelPicker, setShowModelPicker] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const inputRef = useRef<HTMLTextAreaElement>(null);

  const activeConv = conversations.find(c => c.id === activeConversationId);

  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [activeConv?.messages]);

  const handleSend = () => {
    if (!input.trim() || isGenerating) return;
    let convId = activeConversationId;
    if (!convId) {
      convId = createConversation(activeAgent?.id);
    }
    addMessage(convId!, { role: 'user', content: input.trim() });
    setInput('');
    if (inputRef.current) {
      inputRef.current.style.height = 'auto';
    }
  };

  const handleKeyDown = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSend();
    }
  };

  const handleTextareaInput = (e: React.ChangeEvent<HTMLTextAreaElement>) => {
    setInput(e.target.value);
    const ta = e.target;
    ta.style.height = 'auto';
    ta.style.height = Math.min(ta.scrollHeight, 200) + 'px';
  };

  const currentProvider = modelProviders.find(p => p.id === selectedProvider);
  const currentModel = currentProvider?.models.find(m => m.id === selectedModel);

  const renderContent = (content: string) => {
    const parts = content.split(/(```[\s\S]*?```)/g);
    return parts.map((part, i) => {
      if (part.startsWith('```')) {
        const code = part.replace(/```\w*\n?/, '').replace(/```$/, '');
        return (
          <pre key={i} className="my-3 overflow-x-auto rounded-lg p-4 text-xs leading-relaxed" style={{ background: 'var(--t-code-bg)' }}>
            <code style={{ color: 'var(--t-code-text)' }}>{code}</code>
          </pre>
        );
      }
      const lines = part.split('\n');
      return (
        <div key={i}>
          {lines.map((line, j) => {
            if (line.startsWith('> ')) {
              return <blockquote key={j} className="my-2 border-l-2 pl-3 italic" style={{ borderColor: 'var(--t-accent-border)', color: 'var(--t-text-secondary)' }}>{line.slice(2)}</blockquote>;
            }
            if (line.startsWith('- ')) {
              return <div key={j} className="flex gap-2 my-0.5"><span style={{ color: 'var(--t-accent-light)' }}>•</span><span>{renderInline(line.slice(2))}</span></div>;
            }
            if (/^\d+\.\s/.test(line)) {
              const num = line.match(/^(\d+)\.\s/)?.[1];
              return <div key={j} className="flex gap-2 my-0.5"><span className="font-medium" style={{ color: 'var(--t-accent-light)' }}>{num}.</span><span>{renderInline(line.replace(/^\d+\.\s/, ''))}</span></div>;
            }
            if (line.trim() === '') return <br key={j} />;
            return <p key={j} className="my-0.5">{renderInline(line)}</p>;
          })}
        </div>
      );
    });
  };

  const renderInline = (text: string) => {
    const parts = text.split(/(\*\*.*?\*\*)/g);
    return parts.map((p, i) => {
      if (p.startsWith('**') && p.endsWith('**')) {
        return <strong key={i} className="font-semibold" style={{ color: 'var(--t-text)' }}>{p.slice(2, -2)}</strong>;
      }
      return <span key={i}>{p}</span>;
    });
  };

  // Empty state
  if (!activeConv || activeConv.messages.length === 0) {
    return (
      <div className="flex h-full flex-col">
        <div className="flex-1 flex flex-col items-center justify-center p-8">
          <div className="animate-slide-up max-w-lg text-center">
            <div
              className="mb-6 inline-flex h-20 w-20 items-center justify-center rounded-3xl"
              style={{
                background: 'var(--t-accent-subtle)',
                border: '1px solid var(--t-accent-border)',
              }}
            >
              {activeAgent ? (
                <span className="text-4xl">{activeAgent.icon}</span>
              ) : (
                <Sparkles className="h-10 w-10" style={{ color: 'var(--t-accent-light)' }} />
              )}
            </div>
            <h2 className="text-2xl font-bold mb-2" style={{ color: 'var(--t-text)' }}>
              {activeAgent ? activeAgent.name : '开始新对话'}
            </h2>
            <p className="text-sm mb-8" style={{ color: 'var(--t-text-secondary)' }}>
              {activeAgent ? activeAgent.description : '选择模型，开始与AI助手对话'}
            </p>

            {/* Model Selector */}
            <div className="mb-6 relative">
              <button
                onClick={() => setShowModelPicker(!showModelPicker)}
                className="glass-card inline-flex items-center gap-3 rounded-xl px-5 py-3 cursor-pointer"
              >
                <ProviderIcon id={selectedProvider} size={24} />
                <div className="text-left">
                  <p className="text-xs font-medium" style={{ color: 'var(--t-text)' }}>{currentModel?.name || selectedModel}</p>
                  <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{currentProvider?.name}</p>
                </div>
                <ChevronDown className={`h-4 w-4 transition-transform ${showModelPicker ? 'rotate-180' : ''}`} style={{ color: 'var(--t-text-muted)' }} />
              </button>

              {showModelPicker && (
                <div className="absolute left-1/2 -translate-x-1/2 top-full mt-2 glass-strong rounded-xl p-2 w-80 z-50 max-h-80 overflow-y-auto animate-fade-in">
                  {modelProviders.map(provider => (
                    <div key={provider.id} className="mb-1">
                      <div className="flex items-center gap-2 px-3 py-1.5 text-[10px] font-semibold uppercase tracking-wider" style={{ color: 'var(--t-text-muted)' }}>
                        <ProviderIcon id={provider.id} size={16} />
                        <span>{provider.name}</span>
                      </div>
                      {provider.models.map(model => (
                        <button
                          key={model.id}
                          onClick={() => {
                            setSelectedProvider(provider.id);
                            setSelectedModel(model.id);
                            setShowModelPicker(false);
                          }}
                          className="w-full flex items-center gap-3 rounded-lg px-3 py-2 text-left transition-all"
                          style={{
                            background: selectedModel === model.id ? 'var(--t-accent-subtle)' : 'transparent',
                            color: selectedModel === model.id ? 'var(--t-text)' : 'var(--t-text-secondary)',
                          }}
                        >
                          <div className="flex-1">
                            <p className="text-xs font-medium">{model.name}</p>
                            <p className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{model.description}</p>
                          </div>
                          <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{model.contextWindow}</span>
                        </button>
                      ))}
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Quick Prompts */}
            <div className="grid grid-cols-2 gap-2 max-w-md mx-auto">
              {[
                '帮我写一篇技术博客',
                '分析这段代码的性能',
                '设计一个产品方案',
                '翻译以下内容为英文',
              ].map((prompt, i) => (
                <button
                  key={i}
                  onClick={() => {
                    setInput(prompt);
                    inputRef.current?.focus();
                  }}
                  className="glass-card rounded-xl px-4 py-3 text-xs text-left"
                  style={{ color: 'var(--t-text-secondary)' }}
                >
                  {prompt}
                </button>
              ))}
            </div>
          </div>
        </div>

        {renderInputBar()}
      </div>
    );
  }

  function renderInputBar() {
    return (
      <div className="p-4 pt-2">
        <div className="glass-strong rounded-2xl p-2 max-w-3xl mx-auto">
          <div className="flex items-end gap-2">
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5" style={{ color: 'var(--t-text-muted)' }}>
              <Paperclip className="h-4 w-4" />
            </button>
            <textarea
              ref={inputRef}
              value={input}
              onChange={handleTextareaInput}
              onKeyDown={handleKeyDown}
              placeholder="输入消息... (Shift+Enter 换行)"
              rows={1}
              className="flex-1 resize-none bg-transparent py-2.5 text-sm focus:outline-none"
              style={{ color: 'var(--t-text)', maxHeight: 200 }}
            />
            <button className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl transition-all mb-0.5" style={{ color: 'var(--t-text-muted)' }}>
              <Mic className="h-4 w-4" />
            </button>
            {isGenerating ? (
              <button className="glass-btn flex h-9 w-9 shrink-0 items-center justify-center rounded-xl text-red-400 mb-0.5">
                <StopCircle className="h-4 w-4" />
              </button>
            ) : (
              <button
                onClick={handleSend}
                disabled={!input.trim()}
                className="glass-btn-primary flex h-9 w-9 shrink-0 items-center justify-center rounded-xl disabled:opacity-30 mb-0.5"
              >
                <Send className="h-4 w-4" />
              </button>
            )}
          </div>
          <div className="flex items-center justify-between px-2 pt-1 mt-1" style={{ borderTop: '1px solid var(--t-glass-border)' }}>
            <div className="flex items-center gap-2">
              <span className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-muted)' }}><ProviderIcon id={selectedProvider} size={12} /> {currentModel?.name}</span>
            </div>
            <span className="text-[10px]" style={{ color: 'var(--t-text-muted)' }}>{input.length} 字符</span>
          </div>
        </div>
      </div>
    );
  }

  return (
    <div className="flex h-full flex-col">
      {/* Chat Header */}
      <div className="flex items-center gap-3 px-6 py-3" style={{ borderBottom: '1px solid var(--t-glass-border)' }}>
        {activeAgent && <span className="text-xl">{activeAgent.icon}</span>}
        <div>
          <h3 className="text-sm font-medium" style={{ color: 'var(--t-text)' }}>{activeConv.title}</h3>
          <p className="flex items-center gap-1 text-[10px]" style={{ color: 'var(--t-text-muted)' }}>
            <ProviderIcon id={selectedProvider} size={12} /> {currentModel?.name} · {activeConv.messages.length} 条消息
          </p>
        </div>
      </div>

      {/* Messages */}
      <div className="flex-1 overflow-y-auto px-4 py-4">
        <div className="max-w-3xl mx-auto space-y-4">
          {activeConv.messages.map((msg) => (
            <div
              key={msg.id}
              className={`flex gap-3 animate-fade-in ${msg.role === 'user' ? 'justify-end' : ''}`}
            >
              {msg.role === 'assistant' && (
                <div
                  className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1"
                  style={{
                    background: 'var(--t-accent-subtle)',
                    border: '1px solid var(--t-accent-border)',
                  }}
                >
                  {activeAgent ? <span className="text-sm">{activeAgent.icon}</span> : <Bot className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />}
                </div>
              )}
              <div
                className={`max-w-[80%] rounded-2xl px-4 py-3 text-sm leading-relaxed ${
                  msg.role === 'user' ? 'text-white' : 'glass-card'
                }`}
                style={msg.role === 'user' ? {
                  background: `linear-gradient(135deg, var(--t-user-msg-from), var(--t-user-msg-to))`,
                } : { color: 'var(--t-text)' }}
              >
                {msg.role === 'user' ? (
                  <p className="whitespace-pre-wrap">{msg.content}</p>
                ) : (
                  <div className="whitespace-pre-wrap">{renderContent(msg.content)}</div>
                )}
                {msg.model && msg.role === 'assistant' && (
                  <p className="mt-2 text-[10px] pt-1.5" style={{ borderTop: '1px solid var(--t-glass-border)', color: 'var(--t-text-muted)' }}>{msg.model}</p>
                )}
              </div>
              {msg.role === 'user' && (
                <div className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl bg-gradient-to-br from-emerald-500/20 to-teal-600/20 border border-emerald-500/20 mt-1">
                  <User className="h-4 w-4 text-emerald-400" />
                </div>
              )}
            </div>
          ))}

          {isGenerating && (
            <div className="flex gap-3 animate-fade-in">
              <div
                className="flex h-8 w-8 shrink-0 items-center justify-center rounded-xl mt-1"
                style={{
                  background: 'var(--t-accent-subtle)',
                  border: '1px solid var(--t-accent-border)',
                }}
              >
                {activeAgent ? <span className="text-sm">{activeAgent.icon}</span> : <Bot className="h-4 w-4" style={{ color: 'var(--t-accent-light)' }} />}
              </div>
              <div className="glass-card rounded-2xl px-5 py-4">
                <div className="typing-dots">
                  <span /><span /><span />
                </div>
              </div>
            </div>
          )}
          <div ref={messagesEndRef} />
        </div>
      </div>

      {renderInputBar()}
    </div>
  );
}
