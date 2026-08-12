'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowRight,
  BarChart3,
  Bot,
  Braces,
  Code2,
  Database,
  Mail,
  Play,
  Server,
  Sparkles,
  Terminal,
} from 'lucide-react';

const skills = [
  'Next.js',
  'React',
  'TypeScript',
  'Node.js',
  'Express',
  'Prisma',
  'PostgreSQL',
  'Redis',
  'Docker',
  'Tailwind CSS',
  'Framer Motion',
  'Jest',
  'Monaco Editor',
  'Gemini AI',
  'Groq',
];

const projectTech = ['Next.js', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Redis', 'Docker', 'Gemini AI'];

const dsaFeatures = [
  {
    title: 'Real code execution',
    desc: 'C++, Java, Python and JS with instant verdicts.',
    icon: Terminal,
  },
  {
    title: 'AI mock interviews',
    desc: 'Practice realistic DSA interviews with an AI coach.',
    icon: Bot,
  },
  {
    title: 'AI code review',
    desc: 'Get hints, complexity feedback and cleaner approaches.',
    icon: Sparkles,
  },
  {
    title: 'Performance analytics',
    desc: 'Track submissions, skills, streaks and coding progress.',
    icon: BarChart3,
  },
];

const buildHighlights = [
  { label: 'Frontend', value: 'Next.js app router, React, Tailwind v4' },
  { label: 'Backend', value: 'Express API, Prisma models, PostgreSQL' },
  { label: 'Execution', value: 'Judge0 service plus Docker runtime support' },
  { label: 'AI layer', value: 'Gemini and Groq backed coaching flows' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function PortfolioHomePage() {
  return (
    <div className="portfolio-shell min-h-screen overflow-hidden bg-[#f6f7fb] text-[#10131f]">
      <section id="home" className="relative min-h-[calc(100vh-64px)] px-4 sm:px-6 pt-16 md:pt-20 pb-14">
        <div className="absolute inset-0 portfolio-grid" />
        <div className="relative mx-auto grid max-w-7xl grid-cols-1 items-center gap-10 lg:grid-cols-[0.92fr_1.08fr]">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.45 }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-[#d8deea] bg-white/80 px-3 py-1 text-xs font-semibold text-[#4c5872] shadow-sm">
              <span className="h-2 w-2 rounded-full bg-[#17b26a]" />
              Full-stack developer portfolio
            </div>
            <h1 className="text-5xl font-black leading-[1.02] tracking-normal text-[#0c1020] sm:text-6xl md:text-7xl">
              Parth
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold text-[#2a3145] sm:text-2xl">
              Building scalable, intelligent and user-focused software.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#5a6378]">
              I work across frontend systems, backend APIs, databases, code execution flows and AI-assisted developer tools. DSA-Judge is my flagship full-stack project.
            </p>
            <div className="mt-8 flex flex-col gap-3 sm:flex-row">
              <a href="#projects" className="btn-primary rounded-lg px-6 py-3">
                <span>View My Projects</span>
                <ArrowRight size={18} />
              </a>
              <Link href="/problems" className="btn-ghost rounded-lg border-[#cfd7e6] bg-white px-6 py-3 text-[#182033] hover:bg-[#f0f3f8]">
                <Play size={18} />
                <span>Launch DSA Judge</span>
              </Link>
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative"
          >
            <div className="portfolio-product-preview">
              <div className="flex items-center justify-between border-b border-white/10 px-5 py-4">
                <div className="flex items-center gap-2">
                  <span className="h-3 w-3 rounded-full bg-[#ff5f57]" />
                  <span className="h-3 w-3 rounded-full bg-[#ffbd2e]" />
                  <span className="h-3 w-3 rounded-full bg-[#28c840]" />
                </div>
                <span className="font-mono text-xs text-slate-400">dsa-judge / solve.ts</span>
              </div>
              <div className="grid gap-4 p-5 md:grid-cols-[1.2fr_0.8fr]">
                <div className="rounded-lg border border-white/10 bg-[#080b12] p-4 font-mono text-sm leading-7 text-slate-300">
                  <p><span className="text-[#7dd3fc]">function</span> twoSum(nums, target) {'{'}</p>
                  <p className="pl-4"><span className="text-[#fbbf24]">const</span> seen = new Map();</p>
                  <p className="pl-4"><span className="text-[#a7f3d0]">return</span> submit(nums, target, seen);</p>
                  <p>{'}'}</p>
                </div>
                <div className="grid gap-3">
                  <div className="rounded-lg border border-emerald-400/20 bg-emerald-400/10 p-4">
                    <div className="text-xs font-bold uppercase text-emerald-200">Verdict</div>
                    <div className="mt-1 text-2xl font-black text-white">Accepted</div>
                  </div>
                  <div className="rounded-lg border border-sky-400/20 bg-sky-400/10 p-4">
                    <div className="text-xs font-bold uppercase text-sky-200">AI Review</div>
                    <div className="mt-1 text-sm text-slate-200">O(N) approach with hashmap lookup.</div>
                  </div>
                </div>
              </div>
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section id="about" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="border-y border-[#dde3ee] bg-white px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#59637a]">About</p>
            <h2 className="mt-3 text-3xl font-black text-[#0c1020]">Product-minded full-stack engineering.</h2>
          </div>
          <p className="text-lg leading-8 text-[#4e586f]">
            I build practical software that connects polished interfaces with real backend systems. This portfolio keeps the story concise, and DSA-Judge shows the depth: auth, problem management, code execution, AI coaching, analytics and deployment-ready infrastructure.
          </p>
        </div>
      </motion.section>

      <section id="skills" className="px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#59637a]">Skills</p>
              <h2 className="mt-3 text-3xl font-black text-[#0c1020]">Technologies proven in this codebase.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#5a6378]">
              Listed from actual dependencies, configs and implementation paths in DSA-Judge.
            </p>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="mt-8 flex flex-wrap gap-3">
            {skills.map((skill, index) => (
              <motion.span
                key={skill}
                variants={fadeUp}
                transition={{ duration: 0.28, delay: index * 0.025 }}
                className="rounded-lg border border-[#d9e0ec] bg-white px-4 py-2 text-sm font-semibold text-[#20283a] shadow-sm"
              >
                {skill}
              </motion.span>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-[#10131f] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-400">Featured Projects</p>
              <h2 className="mt-3 text-3xl font-black">Focused work, not filler.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-400">
              DSA-Judge is the strongest project available in this repository, so it gets the spotlight without inventing extra portfolio items.
            </p>
          </div>

          <motion.article whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="grid gap-0 overflow-hidden rounded-lg border border-white/10 bg-white/[0.04] md:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 md:p-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#10131f]">
                <Code2 size={24} />
              </div>
              <h3 className="text-3xl font-black">DSA-Judge</h3>
              <p className="mt-3 text-lg font-semibold text-slate-200">AI-powered coding and technical interview platform.</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                A full-stack platform for solving DSA problems, running submissions, reviewing code and practicing technical interviews.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {projectTech.map((tech) => (
                  <span key={tech} className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">{tech}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="https://github.com/Parth-star262/DSA-Judge" target="_blank" rel="noreferrer" className="btn-ghost rounded-lg border-white/15 bg-white/[0.04] px-5 py-3 text-white hover:bg-white/[0.08]">
                  <Code2 size={17} />
                  <span>GitHub</span>
                </a>
                <Link href="/problems" className="btn-primary rounded-lg px-5 py-3">
                  <span>Launch DSA Judge</span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="grid content-stretch gap-3 border-t border-white/10 bg-[#0b0f1a] p-5 md:border-l md:border-t-0">
              {dsaFeatures.map((feature) => {
                const Icon = feature.icon;
                return (
                  <div key={feature.title} className="rounded-lg border border-white/10 bg-white/[0.03] p-5 transition hover:border-white/20 hover:bg-white/[0.06]">
                    <div className="flex items-start gap-4">
                      <div className="flex h-10 w-10 shrink-0 items-center justify-center rounded-lg bg-white text-[#10131f]">
                        <Icon size={19} />
                      </div>
                      <div>
                        <h4 className="font-bold text-white">{feature.title}</h4>
                        <p className="mt-1 text-sm text-slate-400">{feature.desc}</p>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </motion.article>
        </div>
      </section>

      <section id="dsa-judge" className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#59637a]">DSA-Judge Showcase</p>
            <h2 className="mt-3 text-4xl font-black text-[#0c1020]">Serious product surface, real engineering underneath.</h2>
            <p className="mt-4 text-base leading-7 text-[#5a6378]">
              The public copy is now intentionally short. The application still keeps the detailed flows users need once they launch it.
            </p>
            <div className="mt-7 grid gap-3">
              {buildHighlights.map((item) => (
                <div key={item.label} className="flex gap-3 rounded-lg border border-[#dce3ee] bg-white p-4 shadow-sm">
                  <Braces size={18} className="mt-0.5 shrink-0 text-[#334155]" />
                  <div>
                    <div className="text-sm font-black text-[#0c1020]">{item.label}</div>
                    <div className="text-sm text-[#5a6378]">{item.value}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-lg border border-[#dce3ee] bg-white p-5 shadow-xl shadow-slate-900/10">
            <div className="grid gap-4 md:grid-cols-2">
              <div className="rounded-lg bg-[#10131f] p-5 text-white">
                <Terminal size={22} className="text-sky-300" />
                <h3 className="mt-4 text-xl font-black">Code Editor</h3>
                <p className="mt-2 text-sm text-slate-400">Monaco-powered solving workspace.</p>
              </div>
              <div className="rounded-lg bg-[#eef6f1] p-5">
                <Database size={22} className="text-emerald-700" />
                <h3 className="mt-4 text-xl font-black text-[#0c1020]">Progress</h3>
                <p className="mt-2 text-sm text-[#536173]">Submissions, streaks and topic tracking.</p>
              </div>
              <div className="rounded-lg bg-[#f5f1ff] p-5">
                <Bot size={22} className="text-violet-700" />
                <h3 className="mt-4 text-xl font-black text-[#0c1020]">Interviews</h3>
                <p className="mt-2 text-sm text-[#536173]">AI-guided DSA practice sessions.</p>
              </div>
              <div className="rounded-lg bg-[#fff7ed] p-5">
                <Server size={22} className="text-orange-700" />
                <h3 className="mt-4 text-xl font-black text-[#0c1020]">Backend</h3>
                <p className="mt-2 text-sm text-[#536173]">Express, Prisma and judge services.</p>
              </div>
            </div>
            <Link href="/problems" className="btn-primary mt-5 w-full rounded-lg py-3">
              <span>Launch DSA Judge</span>
              <ArrowRight size={18} />
            </Link>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-[#dde3ee] bg-white px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-[#59637a]">Contact</p>
            <h2 className="mt-3 text-3xl font-black text-[#0c1020]">Let&apos;s connect.</h2>
            <p className="mt-2 text-[#5a6378]">Add LinkedIn or more portfolio projects when you are ready; I only used verified repo details here.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="mailto:202451124@iiitvadodara.ac.in" className="btn-ghost rounded-lg border-[#cfd7e6] bg-white px-5 py-3 text-[#182033] hover:bg-[#f0f3f8]">
              <Mail size={17} />
              <span>Email</span>
            </a>
            <a href="https://github.com/Parth-star262" target="_blank" rel="noreferrer" className="btn-primary rounded-lg px-5 py-3">
              <Code2 size={17} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#10131f] px-4 py-8 text-sm text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
          <span>Parth - Full-stack developer portfolio</span>
          <span>DSA-Judge remains available at /problems.</span>
        </div>
      </footer>
    </div>
  );
}
