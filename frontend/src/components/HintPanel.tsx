'use client';
import { useState } from 'react';
import { Lightbulb, Lock, ChevronDown } from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';

interface Hint { level: number; content: string | null; locked: boolean; }

interface HintPanelProps {
  hints: Hint[];
}

export default function HintPanel({ hints }: HintPanelProps) {
  const [revealed, setRevealed] = useState<Set<number>>(new Set());
  const { isEnrolled, enroll } = useAuth();
  const router = useRouter();

  const handleEnroll = async () => {
    const res = await enroll();
    if (!res.ok) {
      alert(res.message || 'Enrollment failed');
      if ((res.message || '').toLowerCase().includes('login')) {
        router.push('/login');
      }
    }
  };

  const toggle = (level: number) => {
    if (!isEnrolled && level > 1) return;
    setRevealed(prev => {
      const next = new Set(prev);
      if (next.has(level)) {
        next.delete(level);
      } else {
        next.add(level);
      }
      return next;
    });
  };

  if (!hints || hints.length === 0) return null;

  return (
    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
      <div style={{ display: 'flex', alignItems: 'center', gap: 8, marginBottom: 4 }}>
        <Lightbulb size={16} color="#f59e0b" />
        <span style={{ fontWeight: 700, color: '#fff', fontSize: 15 }}>Hints</span>
      </div>

      {hints.map(hint => {
        const isLocked = hint.locked;
        const isOpen = revealed.has(hint.level);

        return (
          <div key={hint.level} style={{
            border: `1px solid ${isLocked ? 'rgba(245,158,11,0.2)' : 'var(--border)'}`,
            borderRadius: 10, overflow: 'hidden',
            background: isLocked ? 'rgba(245,158,11,0.03)' : 'var(--surface-2)',
          }}>
            <button onClick={() => toggle(hint.level)} style={{
              width: '100%', background: 'none', border: 'none', cursor: isLocked ? 'default' : 'pointer',
              padding: '12px 16px', display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            }}>
              <div style={{ display: 'flex', alignItems: 'center', gap: 8 }}>
                {isLocked ? <Lock size={14} color="#f59e0b" /> : <Lightbulb size={14} color="#f59e0b" />}
                <span style={{ fontWeight: 600, fontSize: 14, color: isLocked ? '#f59e0b' : 'var(--text)' }}>
                  Hint {hint.level}
                </span>
                {isLocked && (
                  <span style={{ fontSize: 11, color: '#f59e0b', background: 'rgba(245,158,11,0.1)', padding: '1px 8px', borderRadius: 10 }}>
                    Enroll to unlock
                  </span>
                )}
              </div>
              {!isLocked && <ChevronDown size={14} color="var(--text-muted)" style={{ transform: isOpen ? 'rotate(180deg)' : 'none', transition: 'transform 0.2s' }} />}
            </button>

            {/* Locked overlay */}
            {isLocked && (
              <div style={{ padding: '0 16px 14px' }}>
                <div style={{ position: 'relative', overflow: 'hidden', borderRadius: 8 }}>
                  <div style={{ filter: 'blur(5px)', userSelect: 'none', color: 'var(--text-muted)', fontSize: 13, lineHeight: 1.6 }}>
                    This hint contains detailed guidance about the approach you should take to solve this problem...
                  </div>
                  <div style={{
                    position: 'absolute', inset: 0, display: 'flex', alignItems: 'center', justifyContent: 'center',
                    background: 'rgba(10,10,15,0.6)',
                  }}>
                    <button onClick={handleEnroll} style={{
                      background: 'linear-gradient(135deg, #6c63ff, #a855f7)', color: '#fff',
                      border: 'none', borderRadius: 8, padding: '8px 20px',
                      fontWeight: 600, cursor: 'pointer', fontSize: 13,
                    }}>
                      Enroll Free to Unlock
                    </button>
                  </div>
                </div>
              </div>
            )}

            {/* Open content */}
            {!isLocked && isOpen && hint.content && (
              <div style={{ padding: '0 16px 14px', color: 'var(--text-muted)', fontSize: 14, lineHeight: 1.7, borderTop: '1px solid var(--border)' }}>
                {hint.content}
              </div>
            )}
          </div>
        );
      })}
    </div>
  );
}
