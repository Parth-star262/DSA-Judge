'use client';
import dynamic from 'next/dynamic';

// 🔑 Lazy load: Monaco only loads when this component mounts (problem page only)
const MonacoEditor = dynamic(() => import('@monaco-editor/react'), {
  ssr: false,
  loading: () => (
    <div style={{
      height: '100%', background: '#1e1e2e',
      display: 'flex', alignItems: 'center', justifyContent: 'center',
      color: 'var(--text-muted)', fontSize: 14,
    }}>
      Loading editor...
    </div>
  ),
});

interface EditorProps {
  code: string;
  language: string;
  onCodeChange: (code: string) => void;
  onLanguageChange: (lang: string) => void;
}

export default function Editor({ code, language, onCodeChange, onLanguageChange }: EditorProps) {
  const languages = ['cpp', 'java', 'python', 'javascript'];

  const handleLangChange = (lang: string) => {
    onLanguageChange(lang);
  };

  return (
    <div style={{ display: 'flex', flexDirection: 'column', height: '100%', minWidth: 0 }}>
      {/* Language selector */}
      <div style={{ display: 'flex', gap: 6, padding: '10px 12px', borderBottom: '1px solid var(--border)', background: 'var(--surface-2)' }}>
        {languages.map(lang => (
          <button key={lang} onClick={() => handleLangChange(lang)} style={{
            background: language === lang ? '#6c63ff' : 'transparent',
            color: language === lang ? '#fff' : 'var(--text-muted)',
            border: language === lang ? 'none' : '1px solid var(--border)',
            borderRadius: 6, padding: '4px 14px', fontSize: 13, fontWeight: 600,
            cursor: 'pointer', transition: 'all 0.2s', fontFamily: 'inherit',
          }}>
            {lang === 'cpp' ? 'C++' : lang === 'javascript' ? 'JS' : lang.charAt(0).toUpperCase() + lang.slice(1)}
          </button>
        ))}
      </div>

      {/* Monaco Editor */}
      <div style={{ flex: 1, minHeight: 0, minWidth: 0 }}>
        <MonacoEditor
          height="100%"
          language={language === 'cpp' ? 'cpp' : language}
          value={code}
          onChange={(v) => onCodeChange(v || '')}
          theme="vs-dark"
          options={{
            fontSize: 14,
            fontFamily: "'JetBrains Mono', 'Fira Code', monospace",
            minimap: { enabled: false },
            lineNumbers: 'on',
            scrollBeyondLastLine: false,
            wordWrap: 'on',
            tabSize: 4,
            automaticLayout: true,
            padding: { top: 12 },
          }}
        />
      </div>
    </div>
  );
}
