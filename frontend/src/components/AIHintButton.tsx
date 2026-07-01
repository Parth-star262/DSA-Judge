'use client';

import { useState, useRef, useEffect } from 'react';
import api from '@/lib/api';
import { Sparkles, X, Loader2, Bot } from 'lucide-react';
import ReactMarkdown from 'react-markdown';
import remarkGfm from 'remark-gfm';

interface AIHintButtonProps {
  problemSlug: string;
  code: string;
  language: string;
  disabled?: boolean;
}

export default function AIHintButton({ problemSlug, code, language, disabled }: AIHintButtonProps) {
  const [open, setOpen] = useState(false);
  const [hint, setHint] = useState<string | null>(null);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [cooldown, setCooldown] = useState(0);
  const panelRef = useRef<HTMLDivElement>(null);
  const buttonRef = useRef<HTMLButtonElement>(null);
  const closeTimerRef = useRef<ReturnType<typeof setTimeout> | null>(null);

  function hashCode(value: string) {
    let hash = 2166136261;
    for (let i = 0; i < value.length; i += 1) {
      hash ^= value.charCodeAt(i);
      hash = Math.imul(hash, 16777619);
    }
    return (hash >>> 0).toString(16);
  }

  const cacheKey = `ai-hint:${problemSlug}:${language}:${hashCode(code)}`;

  const readCachedHint = () => {
    if (typeof window === 'undefined') return null;

    const raw = localStorage.getItem(cacheKey);
    if (!raw) return null;

    try {
      const parsed = JSON.parse(raw) as { hint?: string; codeHash?: string; expiresAt?: number };
      if (parsed?.codeHash !== hashCode(code)) return null;
      if (parsed?.expiresAt && parsed.expiresAt < Date.now()) {
        localStorage.removeItem(cacheKey);
        return null;
      }
      return parsed?.hint || null;
    } catch {
      return null;
    }
  };

  const writeCachedHint = (value: string) => {
    if (typeof window === 'undefined') return;

    localStorage.setItem(cacheKey, JSON.stringify({
      hint: value,
      codeHash: hashCode(code),
      expiresAt: Date.now() + 24 * 60 * 60 * 1000,
    }));
  };

  const clearCloseTimer = () => {
    if (closeTimerRef.current) {
      clearTimeout(closeTimerRef.current);
      closeTimerRef.current = null;
    }
  };

  const scheduleAutoClose = () => {
    clearCloseTimer();
    closeTimerRef.current = setTimeout(() => setOpen(false), 25000);
  };

  // Cooldown timer
  useEffect(() => {
    if (cooldown <= 0) return;
    const timer = setInterval(() => setCooldown(c => c - 1), 1000);
    return () => clearInterval(timer);
  }, [cooldown]);

  // Click outside to close
  useEffect(() => {
    if (!open) return;
    const handler = (e: MouseEvent) => {
      if (panelRef.current && !panelRef.current.contains(e.target as Node)) {
        setOpen(false);
      }
    };
    document.addEventListener('mousedown', handler);
    return () => document.removeEventListener('mousedown', handler);
  }, [open]);

  useEffect(() => {
    if (!open) {
      clearCloseTimer();
      return;
    }

    scheduleAutoClose();
    return clearCloseTimer;
  }, [open, hint, error, loading]);

  useEffect(() => {
    const onKeyDown = (event: KeyboardEvent) => {
      if (event.key === 'Escape') setOpen(false);
    };

    if (open) {
      document.addEventListener('keydown', onKeyDown);
    }

    return () => document.removeEventListener('keydown', onKeyDown);
  }, [open]);

  useEffect(() => {
    const onShortcut = () => {
      if (!disabled) {
        void fetchHint();
      }
    };

    document.addEventListener('dsa-judge:hint-shortcut', onShortcut);
    return () => document.removeEventListener('dsa-judge:hint-shortcut', onShortcut);
  }, [disabled, code, language, problemSlug]);

  const fetchHint = async () => {
    if (loading) return;

    const cachedHint = readCachedHint();
    if (cachedHint) {
      setHint(cachedHint);
      setError(null);
      setOpen(true);
      scheduleAutoClose();
      return;
    }

    if (cooldown > 0) return;

    setLoading(true);
    setError(null);
    setHint(null);
    setOpen(true);
    scheduleAutoClose();

    try {
      const res = await api.post('/ai/hint', { problemSlug, code, language });
      setHint(res.data.hint);
      writeCachedHint(res.data.hint);
      setCooldown(45);
    } catch (err: unknown) {
      const msg = (err as { response?: { data?: { error?: string } } })?.response?.data?.error || 'Failed to get AI hint';
      setError(msg);
    } finally {
      setLoading(false);
    }
  };

  return (
    <div style={{ position: 'relative', display: 'inline-flex' }} ref={panelRef}>
      {/* Trigger Button */}
      <button
        ref={buttonRef}
        onClick={fetchHint}
        disabled={disabled || loading || cooldown > 0}
        style={{
          display: 'inline-flex',
          alignItems: 'center',
          gap: 6,
          background: 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(108,99,255,0.15) 100%)',
          color: cooldown > 0 ? 'var(--text-muted)' : '#c4b5fd',
          border: '1px solid rgba(168,85,247,0.3)',
          borderRadius: 8,
          padding: '6px 14px',
          fontSize: 13,
          fontWeight: 600,
          cursor: disabled || loading || cooldown > 0 ? 'not-allowed' : 'pointer',
          fontFamily: 'inherit',
          opacity: disabled ? 0.5 : 1,
          transition: 'all 0.2s ease',
        }}
        onMouseEnter={(e) => {
          if (!disabled && !loading && cooldown <= 0) {
            e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.25) 0%, rgba(108,99,255,0.25) 100%)';
            e.currentTarget.style.borderColor = 'rgba(168,85,247,0.5)';
          }
        }}
        onMouseLeave={(e) => {
          e.currentTarget.style.background = 'linear-gradient(135deg, rgba(168,85,247,0.15) 0%, rgba(108,99,255,0.15) 100%)';
          e.currentTarget.style.borderColor = 'rgba(168,85,247,0.3)';
        }}
      >
        {loading ? <Loader2 size={14} style={{ animation: 'spin 1s linear infinite' }} /> : <Sparkles size={14} />}
        {loading ? 'Thinking...' : cooldown > 0 ? `Wait ${cooldown}s` : 'Ask AI'}
      </button>

      {/* Hint Popover */}
      {open && (hint || error || loading) && (
        <div
          style={{
            position: 'absolute',
            top: 'calc(100% + 8px)',
            right: 0,
            width: '320px',
            zIndex: 999,
            transform: 'translateY(0)',
            background: 'linear-gradient(180deg, rgba(30,27,56,0.98) 0%, rgba(20,18,40,0.98) 100%)',
            backdropFilter: 'blur(20px)',
            border: '1px solid rgba(168,85,247,0.25)',
            borderRadius: 14,
            padding: '16px',
            boxShadow: '0 20px 60px rgba(0,0,0,0.5), 0 0 40px rgba(168,85,247,0.08)',
            animation: 'fadeSlideIn 0.25s ease-out',
            maxHeight: 'min(60vh, 420px)',
            overflow: 'auto',
          }}
        >
          {/* Header */}
          <div style={{ display: 'flex', alignItems: 'center', justifyContent: 'space-between', marginBottom: 12 }}>
            <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
              <div style={{
                width: 28, height: 28, borderRadius: 8,
                background: 'linear-gradient(135deg, #a855f7, #6c63ff)',
                display: 'flex', alignItems: 'center', justifyContent: 'center',
              }}>
                <Bot size={16} color="#fff" />
              </div>
              <span style={{ fontSize: 13, fontWeight: 700, color: '#c4b5fd' }}>AI Hint</span>
            </div>
            <button
              onClick={() => setOpen(false)}
              style={{
                background: 'rgba(255,255,255,0.06)',
                border: 'none',
                borderRadius: 6,
                padding: 4,
                cursor: 'pointer',
                color: 'var(--text-muted)',
                display: 'flex',
              }}
            >
              <X size={14} />
            </button>
          </div>

          {/* Content */}
          {loading && (
            <div style={{ display: 'flex', alignItems: 'center', gap: 10, padding: '12px 0' }}>
              <div style={{
                width: 20, height: 20,
                border: '2px solid rgba(168,85,247,0.2)',
                borderTopColor: '#a855f7',
                borderRadius: '50%',
                animation: 'spin 0.8s linear infinite',
              }} />
              <span style={{ fontSize: 13, color: 'var(--text-muted)' }}>Analyzing your code...</span>
            </div>
          )}

          {hint && (
            <div style={{
              fontSize: 13.5,
              lineHeight: 1.7,
              color: '#e2e2f0',
              padding: '8px 12px',
              background: 'rgba(168,85,247,0.06)',
              border: '1px solid rgba(168,85,247,0.12)',
              borderRadius: 10,
            }}>
              <ReactMarkdown remarkPlugins={[remarkGfm]}>{hint}</ReactMarkdown>
            </div>
          )}

          {error && (
            <div style={{
              fontSize: 13,
              color: '#f87171',
              padding: '8px 12px',
              background: 'rgba(239,68,68,0.06)',
              border: '1px solid rgba(239,68,68,0.15)',
              borderRadius: 10,
            }}>
              {error}
            </div>
          )}

          {/* Footer */}
          <div style={{ marginTop: 10, fontSize: 11, color: 'var(--text-muted)', opacity: 0.6 }}>
            Powered by Gemini · Hints only, no full solutions
          </div>
        </div>
      )}

      <style jsx>{`
        @keyframes fadeSlideIn {
          from { opacity: 0; transform: translateY(-6px); }
          to { opacity: 1; transform: translateY(0); }
        }
        :global(.prose-dark-ai p) {
          margin: 0;
        }
        @keyframes spin {
          to { transform: rotate(360deg); }
        }
      `}</style>
    </div>
  );
}
