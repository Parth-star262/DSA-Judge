'use client';

import { useEffect, useState } from 'react';
import api from '@/lib/api';
import { 
  Plus, 
  Search, 
  Edit2, 
  Trash2, 
  ExternalLink,
  ChevronLeft,
  Save,
  X,
  PlusCircle
} from 'lucide-react';
import { motion, AnimatePresence } from 'framer-motion';

// --- Types ---
type Topic = { id: string; name: string };
type TopicWithProblems = Topic & { problems: { slug: string; title: string }[] };
type TestCase = { input: string; expectedOutput: string; explanation: string; isSample: boolean; points: number };
type Hint = { level: number; content: string };
type ScalingInput = { n: number; input: string };

const blankTestCase = (): TestCase => ({ input: '', expectedOutput: '', explanation: '', isSample: false, points: 1 });
const blankHint = (level: number): Hint => ({ level, content: '' });
const blankScalingInput = (): ScalingInput => ({ n: 10, input: '' });

const blankForm = {
  slug: '',
  title: '',
  difficulty: 'EASY',
  topicId: '',
  description: '',
  constraints: '',
  inputFormat: '',
  outputFormat: '',
  optimalComplexity: 'O(N)',
  targetedTimeComplexity: '',
  targetedSpaceComplexity: '',
  isPremium: false,
  judgeConfig: '',
  editorialContent: '',
  editorialVideoUrl: '',
  companyTags: '',
};

export default function ProblemsManagement() {
  const [view, setView] = useState<'LIST' | 'EDIT'>('LIST');
  const [topics, setTopics] = useState<Topic[]>([]);
  const [problems, setProblems] = useState<any[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState('');
  
  // Editor State
  const [editingSlug, setEditingSlug] = useState('');
  const [form, setForm] = useState(blankForm);
  const [testCases, setTestCases] = useState<TestCase[]>([]);
  const [hints, setHints] = useState<Hint[]>([]);
  const [scalingInputs, setScalingInputs] = useState<ScalingInput[]>([]);
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

  const fetchProblems = async () => {
    setLoading(true);
    try {
      const res = await api.get('/problems');
      const data = res.data as TopicWithProblems[];
      setTopics(data.map(t => ({ id: t.id, name: t.name })));
      
      const allProblems = data.flatMap(topic => 
        topic.problems.map(p => ({ ...p, topicName: topic.name, topicId: topic.id }))
      );
      setProblems(allProblems);
    } catch (err) {
      console.error(err);
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchProblems();
  }, []);

  const openEditor = async (slug?: string) => {
    setMessage('');
    if (slug) {
      setEditingSlug(slug);
      const res = await api.get(`/problems/admin/${slug}`);
      const p = res.data;
      setForm({
        slug: p.slug,
        title: p.title,
        difficulty: p.difficulty,
        topicId: p.topicId,
        description: p.description,
        constraints: p.constraints,
        inputFormat: p.inputFormat,
        outputFormat: p.outputFormat,
        optimalComplexity: p.optimalComplexity || 'O(N)',
        targetedTimeComplexity: p.targetedTimeComplexity || '',
        targetedSpaceComplexity: p.targetedSpaceComplexity || '',
        isPremium: Boolean(p.isPremium),
        judgeConfig: p.judgeConfig ? JSON.stringify(p.judgeConfig, null, 2) : '',
        editorialContent: p.editorial?.content || '',
        editorialVideoUrl: p.editorial?.videoUrl || '',
        companyTags: (p.companyTags || []).map((tag: any) => tag.companyName).join(', '),
      });
      setTestCases(p.testCases || []);
      setHints(p.hints || []);
      setScalingInputs(p.scalingInputs || []);
    } else {
      setEditingSlug('');
      setForm({ ...blankForm, topicId: topics[0]?.id || '' });
      setTestCases([{ ...blankTestCase(), isSample: true }, { ...blankTestCase(), isSample: true }]);
      setHints([blankHint(1), blankHint(2), blankHint(3)]);
      setScalingInputs([]);
    }
    setView('EDIT');
  };

  const handleSave = async (e: React.FormEvent) => {
    e.preventDefault();
    setSaving(true);
    setMessage('');
    try {
      const payload = {
        ...form,
        judgeConfig: form.judgeConfig.trim() || null,
        testCases,
        hints: hints.filter(h => h.content.trim()),
        editorial: form.editorialContent.trim() ? { content: form.editorialContent, videoUrl: form.editorialVideoUrl } : null,
        companyTags: form.companyTags.split(',').map(s => s.trim()).filter(Boolean),
        scalingInputs: scalingInputs.filter(s => s.input.trim())
      };

      if (editingSlug) {
        await api.put(`/problems/admin/${editingSlug}`, payload);
      } else {
        await api.post('/problems/admin/create', payload);
      }
      
      setMessage('Problem saved successfully!');
      setTimeout(() => {
        setView('LIST');
        fetchProblems();
      }, 1000);
    } catch (err: any) {
      setMessage(err.response?.data?.error || 'Failed to save problem');
    } finally {
      setSaving(false);
    }
  };

  const filteredProblems = problems.filter(p => 
    p.title.toLowerCase().includes(search.toLowerCase()) || 
    p.slug.toLowerCase().includes(search.toLowerCase())
  );

  return (
    <div className="space-y-6">
      <AnimatePresence mode="wait">
        {view === 'LIST' ? (
          <motion.div
            key="list"
            initial={{ opacity: 0, x: -20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: 20 }}
            className="space-y-6"
          >
            <div className="flex flex-col md:flex-row md:items-center justify-between gap-4">
              <div>
                <h1 className="text-3xl font-black text-white">Problems</h1>
                <p className="text-slate-400">Manage your coding challenges and test cases.</p>
              </div>
              <button 
                onClick={() => openEditor()}
                className="bg-indigo-600 hover:bg-indigo-500 text-white px-5 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all shadow-lg shadow-indigo-600/20"
              >
                <Plus size={20} /> Create Problem
              </button>
            </div>

            {/* Filters */}
            <div className="flex items-center gap-4 p-4 bg-white/[0.03] border border-white/10 rounded-2xl">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 -translate-y-1/2 text-slate-500" size={18} />
                <input 
                  type="text" 
                  placeholder="Search by title or slug..."
                  className="w-full bg-black/20 border border-white/5 rounded-xl py-2.5 pl-10 pr-4 text-slate-200 focus:outline-none focus:border-indigo-500/50 transition-all"
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                />
              </div>
            </div>

            {/* Table */}
            <div className="bg-white/[0.02] border border-white/10 rounded-2xl overflow-hidden">
              <div className="overflow-x-auto">
                <table className="w-full text-left">
                  <thead>
                    <tr className="bg-white/5 text-slate-400 text-sm font-medium">
                      <th className="px-6 py-4">Title</th>
                      <th className="px-6 py-4">Topic</th>
                      <th className="px-6 py-4">Difficulty</th>
                      <th className="px-6 py-4 text-right">Actions</th>
                    </tr>
                  </thead>
                  <tbody className="divide-y divide-white/5">
                    {loading ? (
                      [1, 2, 3].map(i => (
                        <tr key={i} className="animate-pulse">
                          <td colSpan={4} className="px-6 py-8"><div className="h-4 bg-white/5 rounded w-1/2" /></td>
                        </tr>
                      ))
                    ) : filteredProblems.length === 0 ? (
                      <tr>
                        <td colSpan={4} className="px-6 py-12 text-center text-slate-500">No problems found.</td>
                      </tr>
                    ) : (
                      filteredProblems.map((problem) => (
                        <tr key={problem.slug} className="hover:bg-white/[0.02] transition-colors group">
                          <td className="px-6 py-4">
                            <div className="font-bold text-white group-hover:text-indigo-400 transition-colors">{problem.title}</div>
                            <div className="text-xs text-slate-500">{problem.slug}</div>
                          </td>
                          <td className="px-6 py-4">
                            <span className="px-2 py-1 rounded-md bg-white/5 text-xs text-slate-400 border border-white/5">{problem.topicName}</span>
                          </td>
                          <td className="px-6 py-4">
                            <span className={`text-xs font-bold ${
                              problem.difficulty === 'EASY' ? 'text-emerald-400' :
                              problem.difficulty === 'MEDIUM' ? 'text-amber-400' : 'text-red-400'
                            }`}>{problem.difficulty}</span>
                          </td>
                          <td className="px-6 py-4 text-right">
                            <div className="flex items-center justify-end gap-2">
                              <button 
                                onClick={() => openEditor(problem.slug)}
                                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                title="Edit"
                              >
                                <Edit2 size={16} />
                              </button>
                              <a 
                                href={`/problems/${problem.slug}`} 
                                target="_blank"
                                className="p-2 rounded-lg bg-white/5 text-slate-400 hover:text-white hover:bg-white/10 transition-all"
                                title="View Problem"
                              >
                                <ExternalLink size={16} />
                              </a>
                            </div>
                          </td>
                        </tr>
                      ))
                    )}
                  </tbody>
                </table>
              </div>
            </div>
          </motion.div>
        ) : (
          <motion.div
            key="edit"
            initial={{ opacity: 0, x: 20 }}
            animate={{ opacity: 1, x: 0 }}
            exit={{ opacity: 0, x: -20 }}
            className="space-y-6 pb-20"
          >
            <div className="flex items-center justify-between">
              <button 
                onClick={() => setView('LIST')}
                className="flex items-center gap-2 text-slate-400 hover:text-white transition-colors"
              >
                <ChevronLeft size={20} /> Back to list
              </button>
              <div className="flex items-center gap-4">
                {message && <span className="text-indigo-400 text-sm font-medium">{message}</span>}
                <button 
                  onClick={handleSave}
                  disabled={saving}
                  className="bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 text-white px-6 py-2.5 rounded-xl font-bold flex items-center gap-2 transition-all"
                >
                  {saving ? 'Saving...' : <><Save size={20} /> Save Problem</>}
                </button>
              </div>
            </div>

            <form className="grid grid-cols-1 lg:grid-cols-3 gap-8">
              {/* Main Info */}
              <div className="lg:col-span-2 space-y-6">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Core Information</h3>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Title" value={form.title} onChange={v => setForm({...form, title: v})} placeholder="e.g. Two Sum" />
                    <InputField label="Slug" value={form.slug} onChange={v => setForm({...form, slug: v})} placeholder="e.g. two-sum" />
                  </div>
                  
                  <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                    <SelectField 
                      label="Difficulty" 
                      value={form.difficulty} 
                      onChange={v => setForm({...form, difficulty: v})} 
                      options={['EASY', 'MEDIUM', 'HARD']} 
                    />
                    <div className="space-y-1.5">
                      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">Topic</label>
                      <select 
                        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
                        value={form.topicId}
                        onChange={e => setForm({...form, topicId: e.target.value})}
                      >
                        {topics.map(t => <option key={t.id} value={t.id}>{t.name}</option>)}
                      </select>
                    </div>
                    <InputField label="Optimal Complexity" value={form.optimalComplexity} onChange={v => setForm({...form, optimalComplexity: v})} placeholder="O(N)" />
                  </div>

                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <InputField label="Targeted Time Complexity" value={form.targetedTimeComplexity} onChange={v => setForm({...form, targetedTimeComplexity: v})} placeholder="O(N)" />
                    <InputField label="Targeted Space Complexity" value={form.targetedSpaceComplexity} onChange={v => setForm({...form, targetedSpaceComplexity: v})} placeholder="O(1)" />
                  </div>

                  <TextAreaField label="Description" value={form.description} onChange={v => setForm({...form, description: v})} />
                  <TextAreaField label="Constraints" value={form.constraints} onChange={v => setForm({...form, constraints: v})} rows={3} />
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <TextAreaField label="Input Format" value={form.inputFormat} onChange={v => setForm({...form, inputFormat: v})} rows={3} />
                    <TextAreaField label="Output Format" value={form.outputFormat} onChange={v => setForm({...form, outputFormat: v})} rows={3} />
                  </div>
                </div>

                {/* Test Cases */}
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between mb-4">
                    <h3 className="text-lg font-bold text-white">Test Cases</h3>
                    <button 
                      type="button" 
                      onClick={() => setTestCases([...testCases, blankTestCase()])}
                      className="text-sm text-indigo-400 hover:text-indigo-300 flex items-center gap-1"
                    >
                      <PlusCircle size={16} /> Add Test Case
                    </button>
                  </div>
                  
                  <div className="space-y-4">
                    {testCases.map((tc, i) => (
                      <div key={i} className="p-4 rounded-xl bg-black/40 border border-white/5 space-y-3 relative group">
                        <button 
                          type="button"
                          onClick={() => setTestCases(testCases.filter((_, idx) => idx !== i))}
                          className="absolute top-4 right-4 text-slate-500 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <Trash2 size={16} />
                        </button>
                        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                          <TextAreaField label="Input" value={tc.input} onChange={v => {
                            const newCases = [...testCases];
                            newCases[i].input = v;
                            setTestCases(newCases);
                          }} rows={2} />
                          <TextAreaField label="Expected Output" value={tc.expectedOutput} onChange={v => {
                            const newCases = [...testCases];
                            newCases[i].expectedOutput = v;
                            setTestCases(newCases);
                          }} rows={2} />
                        </div>
                        <div className="flex items-center gap-6">
                          <label className="flex items-center gap-2 text-sm text-slate-400 cursor-pointer">
                            <input 
                              type="checkbox" 
                              checked={tc.isSample} 
                              onChange={e => {
                                const newCases = [...testCases];
                                newCases[i].isSample = e.target.checked;
                                setTestCases(newCases);
                              }}
                              className="w-4 h-4 rounded border-white/10 bg-black/40 text-indigo-600 focus:ring-indigo-500" 
                            />
                            Is Sample?
                          </label>
                          <div className="flex items-center gap-2">
                            <span className="text-xs text-slate-500 font-bold uppercase">Points</span>
                            <input 
                              type="number" 
                              value={tc.points} 
                              onChange={e => {
                                const newCases = [...testCases];
                                newCases[i].points = Number(e.target.value);
                                setTestCases(newCases);
                              }}
                              className="w-16 bg-black/20 border border-white/10 rounded px-2 py-1 text-xs text-white"
                            />
                          </div>
                        </div>
                      </div>
                    ))}
                  </div>
                </div>
              </div>

              {/* Sidebar Info */}
              <div className="space-y-6">
                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Premium & Tags</h3>
                  <label className="flex items-center gap-3 p-4 rounded-xl bg-indigo-500/5 border border-indigo-500/10 cursor-pointer group">
                    <input 
                      type="checkbox" 
                      checked={form.isPremium} 
                      onChange={e => setForm({...form, isPremium: e.target.checked})}
                      className="w-5 h-5 rounded border-white/10 bg-black/40 text-indigo-600 focus:ring-indigo-500"
                    />
                    <div>
                      <div className="font-bold text-indigo-300">Premium Problem</div>
                      <div className="text-xs text-indigo-300/60">Requires enrollment to access.</div>
                    </div>
                  </label>
                  
                  <InputField label="Company Tags" value={form.companyTags} onChange={v => setForm({...form, companyTags: v})} placeholder="Google, Amazon, Meta" />
                  <TextAreaField label="Judge Config JSON" value={form.judgeConfig} onChange={v => setForm({...form, judgeConfig: v})} rows={7} />
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-lg font-bold text-white">Hints</h3>
                    <button 
                      type="button" 
                      onClick={() => setHints([...hints, blankHint(hints.length + 1)])}
                      className="text-xs text-indigo-400 hover:text-indigo-300"
                    >
                      + Add Hint
                    </button>
                  </div>
                  {hints.map((hint, i) => (
                    <div key={i} className="space-y-2 p-3 bg-black/20 rounded-xl border border-white/5 relative group">
                       <button 
                          type="button"
                          onClick={() => setHints(hints.filter((_, idx) => idx !== i))}
                          className="absolute top-2 right-2 text-slate-600 hover:text-red-400 transition-colors opacity-0 group-hover:opacity-100"
                        >
                          <X size={14} />
                        </button>
                      <div className="text-[10px] font-black text-slate-500 uppercase tracking-tighter">Level {hint.level}</div>
                      <textarea 
                        className="w-full bg-transparent border-none p-0 text-sm text-slate-300 focus:ring-0 resize-none"
                        placeholder={`Hint content...`}
                        rows={2}
                        value={hint.content}
                        onChange={e => {
                          const newHints = [...hints];
                          newHints[i].content = e.target.value;
                          setHints(newHints);
                        }}
                      />
                    </div>
                  ))}
                </div>

                <div className="p-6 rounded-2xl bg-white/[0.03] border border-white/10 space-y-4">
                  <h3 className="text-lg font-bold text-white mb-4">Editorial</h3>
                  <TextAreaField label="Editorial Content" value={form.editorialContent} onChange={v => setForm({...form, editorialContent: v})} rows={5} />
                  <InputField label="Video URL" value={form.editorialVideoUrl} onChange={v => setForm({...form, editorialVideoUrl: v})} placeholder="Youtube/Loom link" />
                </div>
              </div>
            </form>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

// --- Helper Components ---

function InputField({ label, value, onChange, placeholder, type = 'text' }: { label: string, value: string, onChange: (v: string) => void, placeholder?: string, type?: string }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <input 
        type={type}
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
        placeholder={placeholder}
      />
    </div>
  );
}

function TextAreaField({ label, value, onChange, rows = 4 }: { label: string, value: string, onChange: (v: string) => void, rows?: number }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <textarea 
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-all resize-y min-h-[100px]"
        value={value}
        onChange={e => onChange(e.target.value)}
        rows={rows}
      />
    </div>
  );
}

function SelectField({ label, value, onChange, options }: { label: string, value: string, onChange: (v: string) => void, options: string[] }) {
  return (
    <div className="space-y-1.5">
      <label className="text-xs font-bold text-slate-500 uppercase tracking-wider">{label}</label>
      <select 
        className="w-full bg-black/40 border border-white/10 rounded-xl px-4 py-2.5 text-slate-200 focus:outline-none focus:border-indigo-500 transition-all"
        value={value}
        onChange={e => onChange(e.target.value)}
      >
        {options.map(o => <option key={o} value={o}>{o}</option>)}
      </select>
    </div>
  );
}
