const fs = require('fs');
const path = require('path');

const filePath = path.resolve(__dirname, '../frontend/src/app/problems/[slug]/page.tsx');
let content = fs.readFileSync(filePath, 'utf8');

// Normalize line endings
content = content.replace(/\r\n/g, '\n');

// Find the start of "Bottom panel" comment
const panelStart = content.indexOf('        {/* Bottom panel */}');
if (panelStart === -1) { console.error('Could not find bottom panel start'); process.exit(1); }

// Find the end — the closing of the right panel div (two closing divs before <style jsx>)
const styleJsxPos = content.indexOf('\n      <style jsx>', panelStart);
if (styleJsxPos === -1) { console.error('Could not find <style jsx>'); process.exit(1); }

// The panel ends before "      </div>\n      <style jsx>" (the right panel closing div + style)
const panelEnd = content.lastIndexOf('\n      </div>', styleJsxPos) + 1; // keep the newline before

const beforePanel = content.slice(0, panelStart);
const afterPanel = content.slice(panelEnd);

const newPanel = `        {/* Bottom panel */}
        <div style={{
          borderTop: '1px solid var(--border)',
          background: 'var(--surface)',
          display: 'flex',
          flexDirection: 'column',
          flexShrink: 0,
          height: showOutput ? 'clamp(240px, 42vh, 500px)' : 'auto',
          overflow: 'hidden',
        }}>

          {/* ── Sticky Action Bar ── */}
          <div className="action-bar" style={{
            display: 'flex', alignItems: 'center', justifyContent: 'space-between',
            padding: '10px 16px', flexShrink: 0,
            borderBottom: showOutput ? '1px solid var(--border)' : 'none',
            background: 'var(--surface)',
          }}>
            <div style={{ display: 'flex', gap: 6 }}>
              <button
                onClick={() => { setRunMode('sample'); setShowOutput(true); }}
                style={{ background: runMode === 'sample' ? 'rgba(108,99,255,0.15)' : 'transparent', border: \`1px solid \${runMode === 'sample' ? 'rgba(108,99,255,0.4)' : 'transparent'}\`, borderRadius: 6, padding: '5px 14px', fontSize: 12, color: runMode === 'sample' ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >Sample Cases</button>
              <button
                onClick={() => { setRunMode('custom'); setShowOutput(true); }}
                style={{ background: runMode === 'custom' ? 'rgba(108,99,255,0.15)' : 'transparent', border: \`1px solid \${runMode === 'custom' ? 'rgba(108,99,255,0.4)' : 'transparent'}\`, borderRadius: 6, padding: '5px 14px', fontSize: 12, color: runMode === 'custom' ? '#a78bfa' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}
              >Custom Input</button>
            </div>
            <div style={{ display: 'flex', gap: 8, alignItems: 'center' }}>
              <button onClick={() => setShowOutput(!showOutput)} style={{ background: showOutput ? 'rgba(108,99,255,0.2)' : 'transparent', color: showOutput ? '#a78bfa' : 'var(--text-muted)', border: showOutput ? '1px solid rgba(108,99,255,0.4)' : '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit' }}>
                {showOutput ? '✕ Close Output' : '○ Output'}
              </button>
              {(runResult || submitResult) && (
                <button onClick={() => { setRunResult(null); setSubmitResult(null); }} style={{ background: 'transparent', color: 'var(--text-muted)', border: '1px solid var(--border)', borderRadius: 8, padding: '6px 12px', fontWeight: 600, cursor: 'pointer', fontSize: 13, fontFamily: 'inherit' }}>
                  Clear
                </button>
              )}
              <button onClick={handleRun} disabled={runLoading || submitLoading} style={{ background: 'rgba(34,197,94,0.1)', color: '#22c55e', border: '1px solid rgba(34,197,94,0.4)', borderRadius: 8, padding: '6px 18px', fontWeight: 700, cursor: runLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', opacity: submitLoading ? 0.5 : 1 }}>
                <Play size={14} /> {runLoading ? 'Running...' : 'Run'}
              </button>
              <button onClick={handleSubmit} disabled={runLoading || submitLoading} style={{ background: '#6c63ff', color: '#fff', border: 'none', borderRadius: 8, padding: '6px 18px', fontWeight: 700, cursor: submitLoading ? 'wait' : 'pointer', display: 'flex', alignItems: 'center', gap: 6, fontSize: 13, fontFamily: 'inherit', opacity: runLoading ? 0.5 : 1 }}>
                <Send size={14} /> {submitLoading ? 'Judging...' : 'Submit'}
              </button>
            </div>
          </div>

          {/* ── Single scrollable output body ── */}
          {showOutput && (
            <div style={{ flex: 1, overflowY: 'auto', overflowX: 'hidden', padding: '14px 16px', display: 'flex', flexDirection: 'column', gap: 14 }}>

              {/* Sample Cases */}
              {runMode === 'sample' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 12 }}>
                  <div style={{ display: 'flex', gap: 6 }}>
                    {sampleCases.map((tc, i: number) => (
                      <button key={i} onClick={() => setActiveTestCase(i)} style={{ background: activeTestCase === i ? 'rgba(108,99,255,0.25)' : 'var(--surface-2)', border: \`1px solid \${activeTestCase === i ? 'rgba(108,99,255,0.5)' : 'var(--border)'}\`, borderRadius: 7, padding: '5px 14px', fontSize: 12, color: activeTestCase === i ? '#c4b5fd' : 'var(--text-muted)', cursor: 'pointer', fontFamily: 'inherit', fontWeight: 600 }}>
                        Case {i + 1}
                      </button>
                    ))}
                  </div>
                  {sampleCases[activeTestCase] && (
                    <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Input</div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e5e7eb', lineHeight: 1.7 }}>
                          {String(sampleCases[activeTestCase].input)}
                        </div>
                      </div>
                      <div>
                        <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Expected Output</div>
                        <div style={{ background: 'var(--surface-2)', border: '1px solid rgba(34,197,94,0.3)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#86efac', lineHeight: 1.7 }}>
                          {String(sampleCases[activeTestCase].expectedOutput)}
                        </div>
                      </div>
                    </div>
                  )}
                </div>
              )}

              {/* Custom Input */}
              {runMode === 'custom' && (
                <div style={{ display: 'flex', flexDirection: 'column', gap: 10 }}>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Custom Input</div>
                    <textarea value={customInput} onChange={e => setCustomInput(e.target.value)} style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, resize: 'vertical', minHeight: 80, outline: 'none', lineHeight: 1.7 }} />
                  </div>
                  <div>
                    <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>
                      Expected Output{' '}<span style={{ fontWeight: 400, textTransform: 'none', letterSpacing: 0, opacity: 0.6 }}>(optional)</span>
                    </div>
                    <textarea value={customExpectedOutput} onChange={e => setCustomExpectedOutput(e.target.value)} placeholder="Add expected output to check verdict" style={{ display: 'block', width: '100%', boxSizing: 'border-box', background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', color: 'var(--text)', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, resize: 'vertical', minHeight: 64, outline: 'none', lineHeight: 1.7 }} />
                  </div>
                </div>
              )}

              {/* Verdict Panel */}
              {(runResult || submitResult || runLoading || submitLoading) && (
                <div>
                  <VerdictPanel result={submitResult || runResult} loading={runLoading || submitLoading} />
                </div>
              )}

              {/* Program Output */}
              {runResult?.output && !runLoading && !submitLoading && (
                <div>
                  <div style={{ fontSize: 11, color: 'var(--text-muted)', fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6 }}>Your Output</div>
                  <div style={{ background: 'var(--surface-2)', border: '1px solid var(--border)', borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-all', color: '#e2e2f0', lineHeight: 1.7 }}>
                    {runResult.output}
                  </div>
                </div>
              )}

              {/* Stderr / Runtime Error */}
              {runResult?.stderr && !runLoading && !submitLoading && (
                <div>
                  <div style={{ fontSize: 11, fontWeight: 700, textTransform: 'uppercase', letterSpacing: 0.6, marginBottom: 6, color: runResult.verdict === 'RUNTIME_ERROR' ? '#ef4444' : 'var(--text-muted)' }}>
                    {runResult.verdict === 'RUNTIME_ERROR' ? '⚠ Runtime Error' : 'Stderr'}
                  </div>
                  <div style={{ background: runResult.verdict === 'RUNTIME_ERROR' ? 'rgba(239,68,68,0.07)' : 'var(--surface-2)', border: \`1px solid \${runResult.verdict === 'RUNTIME_ERROR' ? 'rgba(239,68,68,0.35)' : 'var(--border)'}\`, borderRadius: 8, padding: '10px 14px', fontFamily: "'JetBrains Mono', monospace", fontSize: 13, whiteSpace: 'pre-wrap', wordBreak: 'break-word', lineHeight: 1.7, color: runResult.verdict === 'RUNTIME_ERROR' ? '#fca5a5' : '#e2e2f0' }}>
                    {runResult.stderr}
                  </div>
                </div>
              )}

            </div>
          )}
        </div>`;

const result = beforePanel + newPanel + afterPanel;
fs.writeFileSync(filePath, result, 'utf8');
console.log('Done! Panel rewritten. Lines:', result.split('\n').length);
