import React, { useState, useEffect, useRef } from 'react';
import { HardwareItem } from '../types/hardware';
import { ChatMessage, sendHardwareChatMessage } from '../services/aiService';
import {
  MessageSquare,
  X,
  Send,
  Sparkles,
  Bot,
  User as UserIcon,
  Copy,
  Check,
  RotateCcw,
  Zap,
  Cpu,
  AlertTriangle,
  ChevronDown,
  Info,
  Maximize2,
  Minimize2,
} from 'lucide-react';

interface HardwareChatModalProps {
  isOpen: boolean;
  onClose: () => void;
  hardwareContext: HardwareItem | null;
  initialPrompt?: string;
}

export const HardwareChatModal: React.FC<HardwareChatModalProps> = ({
  isOpen,
  onClose,
  hardwareContext,
  initialPrompt,
}) => {
  const [messages, setMessages] = useState<ChatMessage[]>([]);
  const [inputText, setInputText] = useState('');
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [selectedModel, setSelectedModel] = useState<string>('gemini-3.5-flash');
  const [copiedIndex, setCopiedIndex] = useState<number | null>(null);
  const [isExpanded, setIsExpanded] = useState(false);

  const messagesEndRef = useRef<HTMLDivElement | null>(null);
  const inputRef = useRef<HTMLTextAreaElement | null>(null);

  // Initialize or reset when hardwareContext changes or first open
  useEffect(() => {
    if (isOpen) {
      if (messages.length === 0) {
        const welcomeMessage: ChatMessage = {
          id: `msg-welcome-${Date.now()}`,
          role: 'model',
          text: hardwareContext
            ? `Hello! I have loaded the structured specifications for **${hardwareContext.displayName}** (${hardwareContext.manufacturer} ${hardwareContext.model}).\n\nI can answer questions about pinouts, logic-level voltages, I2C/SPI bus setup, wiring to microcontrollers, safety gotchas, or provide working sample code. What would you like to know?`
            : `Hello! I am your Gemini Hardware Workbench Assistant. Point a camera or search a chip to load its pinout context, or ask me any question about circuit design, power rails, bus protocols, and firmware!`,
          timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
          modelUsed: selectedModel,
        };
        setMessages([welcomeMessage]);
      }

      // If initialPrompt was provided, trigger it
      if (initialPrompt && initialPrompt.trim()) {
        handleSendMessage(initialPrompt.trim());
      }

      setTimeout(() => {
        inputRef.current?.focus();
      }, 150);
    }
  }, [isOpen, hardwareContext?.id]);

  // Auto-scroll to bottom of messages
  useEffect(() => {
    if (isOpen) {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }
  }, [messages, loading]);

  const handleSendMessage = async (textToSend?: string) => {
    const text = textToSend !== undefined ? textToSend : inputText;
    if (!text.trim() || loading) return;

    const userMessage: ChatMessage = {
      id: `msg-user-${Date.now()}`,
      role: 'user',
      text: text.trim(),
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
    };

    const newMessages = [...messages, userMessage];
    setMessages(newMessages);
    setInputText('');
    setLoading(true);
    setError(null);

    try {
      // Prepare payload for Gemini (excluding greeting welcome message if pure model opener)
      const payloadMessages = newMessages
        .filter((m) => !m.id.startsWith('msg-welcome-'))
        .map((m) => ({
          role: m.role,
          text: m.text,
        }));

      const res = await sendHardwareChatMessage({
        messages: payloadMessages.length > 0 ? payloadMessages : [{ role: 'user', text: text.trim() }],
        hardwareContext: hardwareContext || undefined,
        model: selectedModel,
      });

      const modelMessage: ChatMessage = {
        id: `msg-model-${Date.now()}`,
        role: 'model',
        text: res.reply,
        timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
        modelUsed: res.modelUsed || selectedModel,
      };

      setMessages((prev) => [...prev, modelMessage]);
    } catch (err: any) {
      console.error('Chat error:', err);
      setError(err.message || 'Failed to receive response from Gemini. Please try again.');
    } finally {
      setLoading(false);
    }
  };

  const handleClearHistory = () => {
    const welcomeMessage: ChatMessage = {
      id: `msg-welcome-${Date.now()}`,
      role: 'model',
      text: hardwareContext
        ? `Conversation reset. Structured specifications for **${hardwareContext.displayName}** are still loaded in my context. How can I help?`
        : `Conversation reset. Ask any question about hardware, circuits, or pinouts!`,
      timestamp: new Date().toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' }),
      modelUsed: selectedModel,
    };
    setMessages([welcomeMessage]);
    setError(null);
  };

  const copyMessageText = (text: string, index: number) => {
    navigator.clipboard.writeText(text);
    setCopiedIndex(index);
    setTimeout(() => setCopiedIndex(null), 2000);
  };

  // Quick contextual prompts based on hardware context
  const getContextualPills = () => {
    if (!hardwareContext) {
      return [
        'How do I calculate an I2C pull-up resistor?',
        'Can I connect 3.3V logic to a 5V Arduino pin?',
        'Difference between SPI mode 0 and mode 3',
        'How to identify unknown IC laser markings',
      ];
    }

    const pills: string[] = [];
    const name = hardwareContext.displayName || hardwareContext.model;
    pills.push(`How do I wire the ${name} to an ESP32 or Arduino?`);

    if (hardwareContext.electrical?.supplyInputs?.[0]) {
      const logic = hardwareContext.electrical.supplyInputs[0].logicLevelVoltage || 3.3;
      pills.push(`Are the ${name} GPIOs 5V tolerant or do I need a level shifter?`);
    } else {
      pills.push(`What are the operating voltages and power requirements for ${name}?`);
    }

    if (hardwareContext.wiredInterfaces?.some((w) => w.type.toLowerCase().includes('i2c'))) {
      pills.push(`What is the default I2C address and wiring for ${name}?`);
    } else if (hardwareContext.pinsAndConnectors && hardwareContext.pinsAndConnectors.length > 0) {
      pills.push(`Are there any strapping pins or boot gotchas on ${name}?`);
    }

    pills.push(`Give me a minimal code example to initialize and read ${name}`);
    return pills;
  };

  // Simple Markdown-style parser for bold, inline code, code blocks, lists
  const renderMessageContent = (content: string) => {
    // Split by code blocks ```lang ... ```
    const codeBlockRegex = /```([a-zA-Z0-9_-]*)\n([\s\S]*?)```/g;
    const parts: React.ReactNode[] = [];
    let lastIndex = 0;
    let match: RegExpExecArray | null;

    while ((match = codeBlockRegex.exec(content)) !== null) {
      // Text before code block
      if (match.index > lastIndex) {
        parts.push(renderTextWithFormatting(content.slice(lastIndex, match.index), `txt-${lastIndex}`));
      }

      const lang = match[1] || 'code';
      const code = match[2];
      const blockId = `code-${match.index}`;

      parts.push(
        <div key={blockId} className="my-2.5 rounded-[6px] overflow-hidden border border-[#2c3e50] bg-[#1e293b] text-[#ecf0f1] text-[11px] font-mono">
          <div className="flex items-center justify-between px-3 py-1.5 bg-[#0f172a] border-b border-white/10 text-[10px] text-[#94a3b8]">
            <span className="uppercase font-bold tracking-wider">{lang}</span>
            <button
              onClick={() => navigator.clipboard.writeText(code)}
              className="flex items-center gap-1 hover:text-white transition cursor-pointer"
              title="Copy code"
            >
              <Copy className="w-3 h-3" />
              <span>Copy</span>
            </button>
          </div>
          <pre className="p-3 overflow-x-auto leading-relaxed select-text whitespace-pre">
            <code>{code}</code>
          </pre>
        </div>
      );

      lastIndex = match.index + match[0].length;
    }

    // Remaining text
    if (lastIndex < content.length) {
      parts.push(renderTextWithFormatting(content.slice(lastIndex), `txt-${lastIndex}`));
    }

    return parts;
  };

  const renderTextWithFormatting = (text: string, keyPrefix: string) => {
    const lines = text.split('\n');
    return (
      <div key={keyPrefix} className="space-y-1.5 text-xs leading-relaxed">
        {lines.map((line, lIdx) => {
          if (!line.trim()) {
            return <div key={lIdx} className="h-1" />;
          }

          // Bullet list items
          if (line.trim().startsWith('- ') || line.trim().startsWith('* ')) {
            const bulletText = line.trim().slice(2);
            return (
              <div key={lIdx} className="flex items-start gap-1.5 pl-2">
                <span className="text-[#3498db] text-[10px] mt-0.5">•</span>
                <span className="flex-1">{formatInline(bulletText)}</span>
              </div>
            );
          }

          // Numbered list
          if (/^\d+\.\s/.test(line.trim())) {
            const numMatch = line.trim().match(/^(\d+\.)\s(.*)$/);
            if (numMatch) {
              return (
                <div key={lIdx} className="flex items-start gap-1.5 pl-2">
                  <span className="font-mono text-[#3498db] text-[11px] font-bold">{numMatch[1]}</span>
                  <span className="flex-1">{formatInline(numMatch[2])}</span>
                </div>
              );
            }
          }

          // Headers
          if (line.startsWith('### ')) {
            return <h4 key={lIdx} className="font-bold text-[#2c3e50] text-xs pt-1">{formatInline(line.slice(4))}</h4>;
          }
          if (line.startsWith('## ')) {
            return <h3 key={lIdx} className="font-bold text-[#2c3e50] text-sm pt-1">{formatInline(line.slice(3))}</h3>;
          }

          return <p key={lIdx}>{formatInline(line)}</p>;
        })}
      </div>
    );
  };

  const formatInline = (str: string) => {
    // Format bold **text** and inline `code`
    const parts = str.split(/(\*\*.*?\*\*|`.*?`)/g);
    return parts.map((part, idx) => {
      if (part.startsWith('**') && part.endsWith('**')) {
        return <strong key={idx} className="font-bold text-[#2c3e50]">{part.slice(2, -2)}</strong>;
      }
      if (part.startsWith('`') && part.endsWith('`')) {
        return (
          <code key={idx} className="px-1 py-0.5 bg-[#ecf0f1] text-[#2c3e50] font-mono text-[11px] rounded border border-[#cbd5e1]/60">
            {part.slice(1, -1)}
          </code>
        );
      }
      return part;
    });
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 bg-black/60 backdrop-blur-xs flex items-center justify-center p-2 sm:p-4">
      <div
        className={`bg-white rounded-[12px] shadow-2xl flex flex-col border border-[#ecf0f1] overflow-hidden transition-all duration-200 ${
          isExpanded ? 'w-full h-[96vh] max-w-5xl' : 'w-full max-w-2xl h-[86vh] max-h-[780px]'
        }`}
      >
        {/* Header */}
        <div className="bg-[#2c3e50] text-white p-3.5 sm:px-5 flex items-center justify-between border-b border-[#34495e] shrink-0">
          <div className="flex items-center gap-2.5 min-w-0">
            <div className="w-8 h-8 rounded-[8px] bg-[#3498db] flex items-center justify-center shrink-0">
              <Bot className="w-4 h-4 text-white" />
            </div>
            <div className="min-w-0">
              <div className="flex items-center gap-2">
                <h3 className="font-bold text-sm tracking-[0.5px] truncate">
                  Gemini Hardware Assistant
                </h3>
                <span className="text-[10px] font-mono bg-white/10 text-emerald-300 px-1.5 py-0.2 rounded border border-white/10 hidden sm:inline-block">
                  Live Grounding
                </span>
              </div>
              <p className="text-[11px] text-[#ecf0f1]/70 truncate">
                {hardwareContext
                  ? `Context bound: ${hardwareContext.displayName} (${hardwareContext.model})`
                  : 'Ask circuit, wiring, pinout & firmware questions'}
              </p>
            </div>
          </div>

          <div className="flex items-center gap-1.5 shrink-0">
            {/* Model Selector */}
            <div className="relative">
              <select
                value={selectedModel}
                onChange={(e) => setSelectedModel(e.target.value)}
                className="bg-[#1e293b] text-white text-[11px] font-semibold py-1.5 pl-2.5 pr-7 rounded-[6px] border border-white/10 focus:outline-none focus:border-[#3498db] appearance-none cursor-pointer"
                title="Select Gemini Model"
              >
                <option value="gemini-3.5-flash">Gemini 3.5 Flash (General)</option>
                <option value="gemini-3.1-flash-lite">Gemini 3.1 Flash Lite (Fast)</option>
                <option value="gemini-3.1-pro-preview">Gemini 3.1 Pro (Complex)</option>
              </select>
              <ChevronDown className="w-3.5 h-3.5 text-white/60 absolute right-2 top-1/2 -translate-y-1/2 pointer-events-none" />
            </div>

            {/* Expand / Minimize Toggle */}
            <button
              onClick={() => setIsExpanded(!isExpanded)}
              className="p-1.5 rounded hover:bg-white/10 text-[#ecf0f1] transition cursor-pointer"
              title={isExpanded ? 'Restore size' : 'Expand window'}
            >
              {isExpanded ? <Minimize2 className="w-4 h-4" /> : <Maximize2 className="w-4 h-4" />}
            </button>

            {/* Clear History */}
            <button
              onClick={handleClearHistory}
              className="p-1.5 rounded hover:bg-white/10 text-[#ecf0f1] transition cursor-pointer"
              title="Reset conversation"
            >
              <RotateCcw className="w-4 h-4" />
            </button>

            {/* Close Button */}
            <button
              onClick={onClose}
              className="p-1.5 rounded hover:bg-white/10 text-[#ecf0f1] transition cursor-pointer"
              title="Close chat"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* Bound Hardware Context Banner */}
        {hardwareContext && (
          <div className="bg-[#f8f9fa] border-b border-[#ecf0f1] px-4 py-2 flex items-center justify-between text-xs shrink-0">
            <div className="flex items-center gap-2 overflow-x-auto py-0.5">
              <span className="font-bold text-[#2c3e50] shrink-0 flex items-center gap-1">
                <Cpu className="w-3.5 h-3.5 text-[#3498db]" />
                {hardwareContext.displayName}
              </span>
              <span className="text-[#cbd5e1]">•</span>
              <span className="text-[11px] text-[#7f8c8d] shrink-0">
                Logic: <strong className="text-[#2c3e50]">{hardwareContext.electrical?.supplyInputs?.[0]?.logicLevelVoltage ? `${hardwareContext.electrical.supplyInputs[0].logicLevelVoltage}V` : '3.3V'}</strong>
              </span>
              <span className="text-[#cbd5e1]">•</span>
              <span className="text-[11px] text-[#7f8c8d] shrink-0">
                Pins: <strong className="text-[#2c3e50]">{hardwareContext.pinsAndConnectors?.length || 0} mapped</strong>
              </span>
              {hardwareContext.wiredInterfaces?.[0]?.type && (
                <>
                  <span className="text-[#cbd5e1]">•</span>
                  <span className="text-[11px] text-[#7f8c8d] shrink-0">
                    Bus: <strong className="text-[#2c3e50]">{hardwareContext.wiredInterfaces[0].type}</strong>
                  </span>
                </>
              )}
            </div>

            <span className="text-[10px] text-emerald-800 bg-emerald-50 border border-emerald-200 px-2 py-0.5 rounded font-semibold shrink-0 ml-2">
              Context Injected
            </span>
          </div>
        )}

        {/* Scrollable Message Thread */}
        <div className="flex-1 overflow-y-auto p-4 sm:p-5 space-y-4 bg-[#ffffff]">
          {messages.map((msg, index) => {
            const isUser = msg.role === 'user';
            return (
              <div
                key={msg.id}
                className={`flex gap-3 max-w-[88%] ${isUser ? 'ml-auto flex-row-reverse' : 'mr-auto'}`}
              >
                {/* Avatar */}
                <div
                  className={`w-7 h-7 rounded-[6px] flex items-center justify-center shrink-0 text-xs font-bold ${
                    isUser
                      ? 'bg-[#2c3e50] text-white'
                      : 'bg-[#3498db]/15 text-[#3498db] border border-[#3498db]/30'
                  }`}
                >
                  {isUser ? <UserIcon className="w-3.5 h-3.5" /> : <Bot className="w-4 h-4" />}
                </div>

                {/* Message Body */}
                <div className="space-y-1 min-w-0">
                  <div
                    className={`rounded-[10px] p-3.5 shadow-2xs ${
                      isUser
                        ? 'bg-[#2c3e50] text-white rounded-tr-none'
                        : 'bg-[#f8f9fa] border border-[#ecf0f1] text-[#333333] rounded-tl-none'
                    }`}
                  >
                    {isUser ? (
                      <p className="text-xs leading-relaxed whitespace-pre-wrap">{msg.text}</p>
                    ) : (
                      renderMessageContent(msg.text)
                    )}
                  </div>

                  {/* Message Meta Info */}
                  <div className={`flex items-center gap-2 text-[10px] text-[#7f8c8d] px-1 ${isUser ? 'justify-end' : 'justify-start'}`}>
                    <span>{msg.timestamp}</span>
                    {msg.modelUsed && !isUser && (
                      <span className="font-mono text-[9px] bg-[#ecf0f1] px-1.5 py-0.2 rounded text-[#34495e]">
                        {msg.modelUsed}
                      </span>
                    )}
                    {!isUser && (
                      <button
                        onClick={() => copyMessageText(msg.text, index)}
                        className="hover:text-[#2c3e50] transition cursor-pointer flex items-center gap-0.5 ml-1"
                        title="Copy message"
                      >
                        {copiedIndex === index ? (
                          <Check className="w-3 h-3 text-emerald-600" />
                        ) : (
                          <Copy className="w-3 h-3" />
                        )}
                        <span>{copiedIndex === index ? 'Copied' : 'Copy'}</span>
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}

          {/* Typing Indicator */}
          {loading && (
            <div className="flex gap-3 max-w-[80%] mr-auto items-center">
              <div className="w-7 h-7 rounded-[6px] bg-[#3498db]/15 text-[#3498db] border border-[#3498db]/30 flex items-center justify-center shrink-0">
                <Bot className="w-4 h-4 animate-pulse" />
              </div>
              <div className="bg-[#f8f9fa] border border-[#ecf0f1] rounded-[10px] rounded-tl-none p-3 shadow-2xs flex items-center gap-2">
                <div className="w-2 h-2 rounded-full bg-[#3498db] animate-bounce" />
                <div className="w-2 h-2 rounded-full bg-[#3498db] animate-bounce [animation-delay:0.2s]" />
                <div className="w-2 h-2 rounded-full bg-[#3498db] animate-bounce [animation-delay:0.4s]" />
                <span className="text-[11px] text-[#7f8c8d] font-medium ml-1">
                  Synthesizing with {selectedModel}...
                </span>
              </div>
            </div>
          )}

          {/* Error Banner */}
          {error && (
            <div className="p-3 bg-red-50 border border-red-200 text-red-700 rounded-[8px] text-xs flex items-center justify-between">
              <div className="flex items-center gap-2">
                <AlertTriangle className="w-4 h-4 text-red-500 shrink-0" />
                <span>{error}</span>
              </div>
              <button
                onClick={() => handleSendMessage()}
                className="px-2 py-1 bg-red-600 text-white rounded text-[11px] font-semibold hover:bg-red-700 transition"
              >
                Retry
              </button>
            </div>
          )}

          <div ref={messagesEndRef} />
        </div>

        {/* Contextual Quick Suggestion Pills */}
        <div className="px-4 py-2 bg-[#f8f9fa] border-t border-[#ecf0f1] shrink-0">
          <div className="flex items-center gap-1.5 overflow-x-auto no-scrollbar py-0.5 text-[11px]">
            <span className="text-[#7f8c8d] font-medium shrink-0 flex items-center gap-1">
              <Zap className="w-3 h-3 text-[#3498db]" /> Suggested:
            </span>
            {getContextualPills().map((pill, idx) => (
              <button
                key={idx}
                onClick={() => handleSendMessage(pill)}
                disabled={loading}
                className="px-2.5 py-1 rounded-[6px] bg-white border border-[#ecf0f1] text-[#34495e] hover:border-[#3498db] hover:text-[#3498db] transition cursor-pointer shrink-0 disabled:opacity-50 text-[11px]"
              >
                {pill}
              </button>
            ))}
          </div>
        </div>

        {/* Input Bar */}
        <div className="p-3 sm:p-4 bg-white border-t border-[#ecf0f1] shrink-0">
          <form
            onSubmit={(e) => {
              e.preventDefault();
              handleSendMessage();
            }}
            className="flex items-end gap-2"
          >
            <div className="relative flex-1">
              <textarea
                ref={inputRef}
                value={inputText}
                onChange={(e) => setInputText(e.target.value)}
                onKeyDown={(e) => {
                  if (e.key === 'Enter' && !e.shiftKey) {
                    e.preventDefault();
                    handleSendMessage();
                  }
                }}
                rows={1}
                placeholder={
                  hardwareContext
                    ? `Ask anything about ${hardwareContext.displayName} (e.g. pin connections, sample code, 5V tolerance)...`
                    : 'Ask about pinouts, circuit wiring, logic levels, code...'
                }
                className="w-full p-2.5 text-xs bg-white border border-[#ecf0f1] rounded-[8px] focus:outline-none focus:border-[#3498db] text-[#333333] resize-none max-h-32 min-h-[42px] leading-relaxed"
              />
            </div>

            <button
              type="submit"
              disabled={!inputText.trim() || loading}
              className="px-4 py-2.5 bg-[#2c3e50] hover:bg-[#34495e] disabled:opacity-50 text-white rounded-[8px] text-xs font-semibold flex items-center gap-1.5 transition cursor-pointer shrink-0 h-[42px] shadow-xs"
            >
              <Send className="w-3.5 h-3.5 text-[#3498db]" />
              <span className="hidden sm:inline">Send</span>
            </button>
          </form>
          <div className="flex items-center justify-between pt-1.5 text-[10px] text-[#7f8c8d]">
            <span>Press <strong>Enter</strong> to send, <strong>Shift+Enter</strong> for newline</span>
            <span>Gemini uses structured hardware data + internet search</span>
          </div>
        </div>
      </div>
    </div>
  );
};
