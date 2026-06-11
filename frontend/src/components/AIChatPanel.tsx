'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { MessageSquare, X, Send, Bot, User } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface Message {
  role: 'user' | 'assistant';
  content: string;
}

interface AIChatPanelProps {
  problemSlug: string;
  problemTitle: string;
  problemDescription: string;
  code: string;
  language: string;
  disabled?: boolean;
}

export default function AIChatPanel({
  problemSlug,
  problemTitle,
  problemDescription,
  code,
  language,
  disabled,
}: AIChatPanelProps) {
  const [isOpen, setIsOpen] = useState(false);
  const [messages, setMessages] = useState<Message[]>([
    {
      role: 'assistant',
      content: `Hello! I'm your AI coding buddy. I can answer questions about the **${problemTitle}** problem, help you explain your current logic, or help you figure out code bugs. How can I help you today?`,
    },
  ]);
  const [input, setInput] = useState('');
  const [loading, setLoading] = useState(false);
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const chatContainerRef = useRef<HTMLDivElement>(null);

  // Auto scroll to bottom
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages, loading]);

  const handleSendMessage = async (e: React.FormEvent) => {
    e.preventDefault();
    if (!input.trim() || loading || disabled) return;

    const userMessage = input.trim();
    setInput('');
    setMessages((prev) => [...prev, { role: 'user', content: userMessage }]);
    setLoading(true);

    try {
      const res = await api.post('/ai/debug', {
        problemSlug,
        code,
        language,
        input: `[User Question about "${problemTitle}"]: ${userMessage}`,
        expectedOutput: `Explain things, provide help or direction without writing code. Keep it brief.`,
        actualOutput: `Context description: ${problemDescription.slice(0, 500)}`,
      });

      const reply = res.data.analysis || "I'm sorry, I couldn't process that. Let's try again.";
      setMessages((prev) => [...prev, { role: 'assistant', content: reply }]);
    } catch (err: any) {
      const errMsg = err?.response?.data?.error || 'Failed to connect to AI. Please try again.';
      setMessages((prev) => [...prev, { role: 'assistant', content: `❌ Error: ${errMsg}` }]);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'fixed', bottom: '24px', right: '24px', zIndex: 1000 }}>
      {/* Floating Chat Button */}
      {!isOpen && (
        <button
          onClick={() => setIsOpen(true)}
          disabled={disabled}
          style={{
            width: '56px',
            height: '56px',
            borderRadius: '28px',
            background: 'linear-gradient(135deg, #a855f7 0%, #6c63ff 100%)',
            color: '#fff',
            border: 'none',
            display: 'flex',
            alignItems: 'center',
            justifyContent: 'center',
            cursor: disabled ? 'not-allowed' : 'pointer',
            boxShadow: '0 8px 32px rgba(108, 99, 255, 0.4)',
            transition: 'transform 0.2s ease, box-shadow 0.2s ease',
            opacity: disabled ? 0.6 : 1,
          }}
          onMouseEnter={(e) => {
            if (!disabled) {
              e.currentTarget.style.transform = 'scale(1.06)';
              e.currentTarget.style.boxShadow = '0 12px 40px rgba(108, 99, 255, 0.5)';
            }
          }}
          onMouseLeave={(e) => {
            e.currentTarget.style.transform = 'scale(1)';
            e.currentTarget.style.boxShadow = '0 8px 32px rgba(108, 99, 255, 0.4)';
          }}
        >
          <MessageSquare size={24} />
        </button>
      )}

      {/* Floating Chat Widget */}
      {isOpen && (
        <div
          ref={chatContainerRef}
          style={{
            width: '380px',
            height: '500px',
            background: 'linear-gradient(180deg, rgba(28, 25, 50, 0.98) 0%, rgba(15, 13, 30, 0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168, 85, 247, 0.25)',
            borderRadius: '16px',
            boxShadow: '0 24px 64px rgba(0, 0, 0, 0.6), 0 0 40px rgba(168, 85, 247, 0.1)',
            display: 'flex',
            flexDirection: 'column',
            overflow: 'hidden',
          }}
        >
          {/* Header */}
          <div
            style={{
              padding: '16px',
              borderBottom: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              alignItems: 'center',
              justifyContent: 'space-between',
              background: 'rgba(168, 85, 247, 0.05)',
            }}
          >
            <div style={{ display: 'flex', alignItems: 'center', gap: 10 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: '10px',
                  background: 'linear-gradient(135deg, #a855f7, #6c63ff)',
                  display: 'flex',
                  alignItems: 'center',
                  justifyContent: 'center',
                }}
              >
                <Bot size={18} color="#fff" />
              </div>
              <div>
                <div style={{ fontSize: 14, fontWeight: 700, color: '#fff' }}>AI Code Assistant</div>
                <div style={{ fontSize: 11, color: '#22c55e', display: 'flex', alignItems: 'center', gap: 4 }}>
                  <span style={{ width: 6, height: 6, borderRadius: '50%', background: '#22c55e', display: 'inline-block' }} />
                  Online (Gemini 2.5)
                </div>
              </div>
            </div>
            <button
              onClick={() => setIsOpen(false)}
              style={{
                background: 'rgba(255, 255, 255, 0.06)',
                border: 'none',
                borderRadius: '8px',
                padding: '6px',
                cursor: 'pointer',
                color: '#9ca3af',
                display: 'flex',
              }}
            >
              <X size={16} />
            </button>
          </div>

          {/* Messages Area */}
          <div style={{ flex: 1, overflowY: 'auto', padding: '16px', display: 'flex', flexDirection: 'column', gap: 14 }}>
            {messages.map((msg, index) => (
              <div
                key={index}
                style={{
                  display: 'flex',
                  gap: 10,
                  flexDirection: msg.role === 'user' ? 'row-reverse' : 'row',
                  alignItems: 'flex-start',
                }}
              >
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: msg.role === 'user' ? 'rgba(108, 99, 255, 0.2)' : 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: msg.role === 'user' ? '#a78bfa' : '#c4b5fd',
                    flexShrink: 0,
                  }}
                >
                  {msg.role === 'user' ? <User size={14} /> : <Bot size={14} />}
                </div>
                <div
                  style={{
                    maxWidth: '80%',
                    background: msg.role === 'user' ? '#6c63ff' : 'rgba(255, 255, 255, 0.05)',
                    color: msg.role === 'user' ? '#fff' : '#e2e2f0',
                    border: msg.role === 'user' ? 'none' : '1px solid rgba(255, 255, 255, 0.06)',
                    borderRadius: msg.role === 'user' ? '12px 12px 2px 12px' : '12px 12px 12px 2px',
                    padding: '10px 14px',
                    fontSize: '13px',
                    lineHeight: '1.6',
                  }}
                >
                  <ReactMarkdown remarkPlugins={[remarkGfm]}>{msg.content}</ReactMarkdown>
                </div>
              </div>
            ))}
            {loading && (
              <div style={{ display: 'flex', gap: 10, alignItems: 'center' }}>
                <div
                  style={{
                    width: 28,
                    height: 28,
                    borderRadius: '50%',
                    background: 'rgba(168, 85, 247, 0.2)',
                    display: 'flex',
                    alignItems: 'center',
                    justifyContent: 'center',
                    color: '#c4b5fd',
                  }}
                >
                  <Bot size={14} />
                </div>
                <div style={{ display: 'flex', gap: 4, alignItems: 'center', background: 'rgba(255, 255, 255, 0.05)', padding: '10px 14px', borderRadius: '12px 12px 12px 2px', border: '1px solid rgba(255, 255, 255, 0.06)' }}>
                  <span style={{ fontSize: '13px', color: '#9ca3af' }}>Thinking...</span>
                </div>
              </div>
            )}
            <div ref={messagesEndRef} />
          </div>

          {/* Input Area */}
          <form
            onSubmit={handleSendMessage}
            style={{
              padding: '12px 16px',
              borderTop: '1px solid rgba(255, 255, 255, 0.08)',
              display: 'flex',
              gap: 8,
              background: 'rgba(0, 0, 0, 0.1)',
            }}
          >
            <input
              type="text"
              value={input}
              onChange={(e) => setInput(e.target.value)}
              placeholder="Ask anything about this problem..."
              disabled={loading || disabled}
              style={{
                flex: 1,
                background: 'rgba(255, 255, 255, 0.06)',
                border: '1px solid rgba(255, 255, 255, 0.1)',
                borderRadius: '8px',
                padding: '8px 12px',
                color: '#fff',
                fontSize: '13px',
                outline: 'none',
              }}
            />
            <button
              type="submit"
              disabled={!input.trim() || loading || disabled}
              style={{
                background: '#6c63ff',
                color: '#fff',
                border: 'none',
                borderRadius: '8px',
                padding: '8px 14px',
                cursor: !input.trim() || loading || disabled ? 'not-allowed' : 'pointer',
                display: 'flex',
                alignItems: 'center',
                justifyContent: 'center',
                opacity: !input.trim() || loading || disabled ? 0.6 : 1,
              }}
            >
              <Send size={14} />
            </button>
          </form>
        </div>
      )}
    </div>
  );
}
