'use client';
import React, { useState } from 'react';

type TestCase = { input: string; expectedOutput: string; isSample?: boolean; points?: number };
type ScalingInput = { n: number; input: string };

export default function AdminCreateProblem() {
  const [slug, setSlug] = useState('');
  const [title, setTitle] = useState('');
  const [difficulty, setDifficulty] = useState('EASY');
  const [description, setDescription] = useState('');
  const [constraints, setConstraints] = useState('');
  const [inputFormat, setInputFormat] = useState('');
  const [outputFormat, setOutputFormat] = useState('');
  const [optimalComplexity, setOptimalComplexity] = useState('O(N)');
  const [isPremium, setIsPremium] = useState(false);
  const [templates, setTemplates] = useState({ python: '', cpp: '', javascript: '', java: '' });
  const [unorderedPair, setUnorderedPair] = useState(false);
  const [testCases, setTestCases] = useState<TestCase[]>([{ input: '', expectedOutput: '', isSample: true }]);
  const [scalingInputs, setScalingInputs] = useState<ScalingInput[]>([]);

  const token = typeof window !== 'undefined' ? localStorage.getItem('token') : null;

  const ensureUserCodePlaceholder = (tmpl: string) => /\{\{\s*USER_CODE\s*\}\}/.test(tmpl);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!slug.trim() || !title.trim()) return alert('slug and title required');
    if (testCases.length === 0) return alert('At least one test case required');

    for (const [lang, tmpl] of Object.entries(templates)) {
      if (tmpl && !ensureUserCodePlaceholder(tmpl)) {
        return alert(`Template for ${lang} must include {{USER_CODE}}`);
      }
    }

    const payload = {
      slug: slug.trim(),
      title: title.trim(),
      difficulty,
      description,
      constraints,
      inputFormat,
      outputFormat,
      optimalComplexity,
      isPremium,
      judgeConfig: {
        templates,
        compare: { unorderedPair },
      },
      testCases,
      scalingInputs,
    };

    try {
      const res = await fetch('/api/admin/problems', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
          ...(token ? { Authorization: `Bearer ${token}` } : {}),
        },
        body: JSON.stringify(payload),
      });
      if (!res.ok) {
        const text = await res.text();
        throw new Error(text || res.statusText);
      }
      const created = await res.json();
      alert('Created: ' + created.slug);
    } catch (err: any) {
      alert('Error: ' + (err.message || err));
    }
  };

  return (
    <form onSubmit={handleSubmit} style={{ maxWidth: 900, margin: '0 auto' }}>
      <h2>Create Problem</h2>
      <div>
        <label>Slug</label>
        <input value={slug} onChange={(e) => setSlug(e.target.value)} />
      </div>
      <div>
        <label>Title</label>
        <input value={title} onChange={(e) => setTitle(e.target.value)} />
      </div>
      <div>
        <label>Difficulty</label>
        <select value={difficulty} onChange={(e) => setDifficulty(e.target.value)}>
          <option value="EASY">EASY</option>
          <option value="MEDIUM">MEDIUM</option>
          <option value="HARD">HARD</option>
        </select>
      </div>
      <div>
        <label>Description</label>
        <textarea value={description} onChange={(e) => setDescription(e.target.value)} />
      </div>
      <div>
        <label>Constraints</label>
        <textarea value={constraints} onChange={(e) => setConstraints(e.target.value)} />
      </div>
      <div>
        <label>Input Format</label>
        <input value={inputFormat} onChange={(e) => setInputFormat(e.target.value)} />
      </div>
      <div>
        <label>Output Format</label>
        <input value={outputFormat} onChange={(e) => setOutputFormat(e.target.value)} />
      </div>
      <div>
        <label>Optimal Complexity</label>
        <input value={optimalComplexity} onChange={(e) => setOptimalComplexity(e.target.value)} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={isPremium} onChange={(e) => setIsPremium(e.target.checked)} /> Premium
        </label>
      </div>

      <h3>Templates (must include {'{{USER_CODE}}'})</h3>
      <div>
        <label>Python</label>
        <textarea value={templates.python} onChange={(e) => setTemplates({ ...templates, python: e.target.value })} />
      </div>
      <div>
        <label>CPP</label>
        <textarea value={templates.cpp} onChange={(e) => setTemplates({ ...templates, cpp: e.target.value })} />
      </div>
      <div>
        <label>JavaScript</label>
        <textarea value={templates.javascript} onChange={(e) => setTemplates({ ...templates, javascript: e.target.value })} />
      </div>
      <div>
        <label>Java</label>
        <textarea value={templates.java} onChange={(e) => setTemplates({ ...templates, java: e.target.value })} />
      </div>
      <div>
        <label>
          <input type="checkbox" checked={unorderedPair} onChange={(e) => setUnorderedPair(e.target.checked)} /> Unordered-pair compare
        </label>
      </div>

      <h3>Test Cases</h3>
      {testCases.map((t, i) => (
        <div key={i} style={{ border: '1px solid #eee', padding: 8, marginBottom: 8 }}>
          <div>
            <label>Input</label>
            <textarea value={t.input} onChange={(e) => { const next = [...testCases]; next[i] = { ...next[i], input: e.target.value }; setTestCases(next); }} />
          </div>
          <div>
            <label>Expected Output</label>
            <textarea value={t.expectedOutput} onChange={(e) => { const next = [...testCases]; next[i] = { ...next[i], expectedOutput: e.target.value }; setTestCases(next); }} />
          </div>
          <div>
            <label>
              <input type="checkbox" checked={!!t.isSample} onChange={(e) => { const next = [...testCases]; next[i] = { ...next[i], isSample: e.target.checked }; setTestCases(next); }} />
              Sample
            </label>
            <button type="button" onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))}>Remove</button>
          </div>
        </div>
      ))}
      <button type="button" onClick={() => setTestCases([...testCases, { input: '', expectedOutput: '', isSample: false }])}>Add Test Case</button>

      <h3>Scaling Inputs</h3>
      {scalingInputs.map((s, i) => (
        <div key={i}>
          <input type="number" value={s.n} onChange={(e) => { const next = [...scalingInputs]; next[i] = { ...next[i], n: Number(e.target.value) }; setScalingInputs(next); }} />
          <textarea value={s.input} onChange={(e) => { const next = [...scalingInputs]; next[i] = { ...next[i], input: e.target.value }; setScalingInputs(next); }} />
          <button type="button" onClick={() => setScalingInputs(scalingInputs.filter((_, idx) => idx !== i))}>Remove</button>
        </div>
      ))}
      <button type="button" onClick={() => setScalingInputs([...scalingInputs, { n: 0, input: '' }])}>Add Scaling Input</button>

      <div style={{ marginTop: 16 }}>
        <button type="submit">Create Problem</button>
      </div>
    </form>
  );
}