'use client';

import Link from 'next/link';
import { motion } from 'framer-motion';
import {
  ArrowUpRight,
  ArrowRight,
  BarChart3,
  Bot,
  Brain,
  Briefcase,
  Code2,
  CodeXml,
  Cpu,
  Mail,
  MapPin,
  Play,
  Rocket,
  School,
  Server,
  Sparkles,
  Terminal,
  Trophy,
} from 'lucide-react';

const primarySkills = [
  'JavaScript',
  'TypeScript',
  'React',
  'Next.js',
  'Node.js',
  'Express',
  'Prisma',
  'PostgreSQL',
  'Tailwind CSS',
  'Docker',
  'Redis',
  'GitHub Actions',
];

const workingSkills = ['C++', 'Python', 'Jest', 'Monaco Editor', 'Render', 'Vercel'];

const exploringSkills = ['LLM Integrations', 'Agent Workflows', 'System Design', 'Performance Optimization'];

const projectTech = ['Next.js', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Redis', 'Docker', 'AI APIs'];

const dsaFeatures = [
  {
    title: 'Real code execution',
    desc: 'Multi-language judging with fast verdict feedback.',
    icon: Terminal,
  },
  {
    title: 'AI mock interviews',
    desc: 'Practice DSA interview rounds with AI guidance.',
    icon: Bot,
  },
  {
    title: 'AI code review',
    desc: 'Get hints and complexity feedback on submissions.',
    icon: Sparkles,
  },
  {
    title: 'Performance analytics',
    desc: 'Track streaks, activity, and learning consistency.',
    icon: BarChart3,
  },
];

const highlights = [
  { label: 'HackOut 25', value: 'Hackathon participant building production-facing ideas', icon: Trophy },
  { label: '500+ DSA Problems', value: 'Consistent problem-solving practice across platforms', icon: Brain },
  { label: 'IIIT Vadodara', value: 'B.Tech CSE (2024-2028) with focus on practical software', icon: School },
];

const involvement = [
  'Finance Club member at IIIT Vadodara',
  'E-Cell involvement with startup and product-building activities',
];

const codingProfiles = [
  { name: 'GitHub', href: 'https://github.com/Parth-star262' },
  { name: 'LinkedIn', href: 'https://linkedin.com/in/parth-hada' },
];

const fadeUp = {
  hidden: { opacity: 0, y: 18 },
  visible: { opacity: 1, y: 0 },
};

export default function PortfolioHomePage() {
  return (
    <div className="portfolio-shell min-h-screen overflow-hidden bg-[#070c18] text-[#eef3ff]">
      <section id="home" className="relative px-4 pb-20 pt-16 sm:px-6 md:pt-20">
        <div className="absolute inset-0 pointer-events-none bg-[radial-gradient(circle_at_12%_22%,rgba(27,127,255,0.22),transparent_32%),radial-gradient(circle_at_85%_16%,rgba(36,196,146,0.2),transparent_28%),radial-gradient(circle_at_78%_78%,rgba(249,115,22,0.12),transparent_30%)]" />
        <div className="absolute inset-0 opacity-30 [background:linear-gradient(rgba(130,149,187,0.16)_1px,transparent_1px),linear-gradient(90deg,rgba(130,149,187,0.16)_1px,transparent_1px)] [background-size:48px_48px]" />
        <div className="relative mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 lg:grid-cols-[1.08fr_0.92fr]">
          <motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.45 }} className="max-w-3xl">
            <div className="mb-5 inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/6 px-3 py-1 text-xs font-semibold text-slate-200 shadow-sm backdrop-blur">
              <span className="h-2 w-2 rounded-full bg-emerald-400" />
              Computer Science Student | Full-Stack & AI Developer
            </div>
            <h1 className="text-5xl font-black leading-[0.98] tracking-tight text-white sm:text-6xl md:text-7xl">
              Parth Hada
            </h1>
            <p className="mt-5 max-w-2xl text-xl font-semibold text-[#c9d4ea] sm:text-2xl">
              Turning ideas into intelligent, practical software.
            </p>
            <p className="mt-4 max-w-2xl text-base leading-7 text-[#9aa8c4]">
              I&apos;m Parth, a CSE student at IIIT Vadodara passionate about building full-stack applications, AI-powered products, and solving real-world problems through software.
            </p>
            <div className="mt-8 flex flex-wrap gap-3">
              <a href="#projects" className="btn-primary rounded-lg px-6 py-3">
                <span>View My Projects</span>
                <ArrowRight size={18} />
              </a>
              <Link href="/problems" className="btn-ghost rounded-lg border-white/20 bg-white/7 px-6 py-3 text-white hover:bg-white/12">
                <Play size={18} />
                <span>Launch DSA Judge</span>
              </Link>
              <a href="mailto:202451124@iiitvadodara.ac.in?subject=Resume%20Request%20from%20Portfolio" className="btn-ghost rounded-lg border-white/20 bg-transparent px-6 py-3 text-white/90 hover:bg-white/12">
                <Briefcase size={18} />
                <span>Request Resume</span>
              </a>
            </div>
            <div className="mt-7 inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/5 px-3 py-1 text-xs text-slate-300">
              <MapPin size={14} />
              Gandhinagar, Gujarat
            </div>
          </motion.div>

          <motion.div
            initial={{ opacity: 0, y: 24, scale: 0.98 }}
            animate={{ opacity: 1, y: 0, scale: 1 }}
            transition={{ duration: 0.55, delay: 0.1 }}
            className="relative grid gap-4"
          >
            <div className="rounded-2xl border border-white/10 bg-[#0f1729]/92 p-4 shadow-[0_30px_80px_rgba(1,6,20,0.5)]">
              <div className="rounded-xl border border-white/10 bg-[#101b31] p-5">
                <div className="mb-4 flex items-center justify-between">
                  <span className="text-xs uppercase tracking-[0.18em] text-cyan-200/80">Developer Identity</span>
                  <Cpu size={16} className="text-cyan-300" />
                </div>
                <div className="flex items-center gap-4 rounded-lg border border-white/10 bg-[#0a1326] p-4">
                  <img
                    src="https://avatars.githubusercontent.com/Parth-star262"
                    alt="Parth Hada"
                    className="h-20 w-20 rounded-xl border border-white/15 object-cover"
                  />
                  <div>
                    <div className="text-lg font-black text-white">Parth Hada</div>
                    <div className="text-sm text-slate-300">Computer Science Student</div>
                    <div className="mt-1 text-xs text-slate-400">Building software with full-stack + AI systems</div>
                  </div>
                </div>
                <div className="mt-4 rounded-lg border border-white/10 bg-[#0a1326] p-4 font-mono text-sm leading-7 text-slate-300">
                  <p><span className="text-cyan-300">const</span> builder = {'{'}</p>
                  <p className="pl-4">name: <span className="text-emerald-300">'Parth'</span>,</p>
                  <p className="pl-4">focus: [<span className="text-amber-300">'full-stack'</span>, <span className="text-amber-300">'ai'</span>],</p>
                  <p className="pl-4">mindset: <span className="text-violet-300">'build real things'</span>,</p>
                  <p>{'}'}</p>
                </div>
              </div>
            </div>

            <div className="grid gap-3 sm:grid-cols-3">
              {highlights.map((item) => {
                const Icon = item.icon;
                return (
                  <div key={item.label} className="rounded-xl border border-white/10 bg-white/6 p-4 backdrop-blur">
                    <Icon size={16} className="text-cyan-300" />
                    <div className="mt-2 text-sm font-black text-white">{item.label}</div>
                    <div className="mt-1 text-xs leading-5 text-slate-300">{item.value}</div>
                  </div>
                );
              })}
            </div>
          </motion.div>
        </div>
      </section>

      <motion.section id="about" initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.3 }} variants={fadeUp} className="border-y border-white/10 bg-[#0b1428] px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-8 lg:grid-cols-[0.7fr_1.3fr]">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">About</p>
            <h2 className="mt-3 text-3xl font-black text-white">Serious about software, curious about systems.</h2>
          </div>
          <p className="text-lg leading-8 text-[#b3c1db]">
            I enjoy building products end to end, from clean interfaces to reliable backend services. My current focus is full-stack engineering, AI-assisted workflows, and writing software that is useful in the real world. DSA-Judge is the project that best reflects this approach.
          </p>
        </div>
      </motion.section>

      <section id="skills" className="bg-[#070c18] px-4 py-20 sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Skills</p>
              <h2 className="mt-3 text-3xl font-black text-white">Technical stack and growth areas.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-[#9aa8c4]">
              Balanced between technologies I actively use, technologies I am improving, and areas I am exploring next.
            </p>
          </div>
          <motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.2 }} className="mt-8 grid gap-4 lg:grid-cols-3">
            {[{ title: 'Strong', items: primarySkills }, { title: 'Working With', items: workingSkills }, { title: 'Exploring', items: exploringSkills }].map((group, groupIndex) => (
              <motion.div key={group.title} variants={fadeUp} transition={{ duration: 0.28, delay: groupIndex * 0.06 }} className="rounded-xl border border-white/10 bg-white/6 p-5 backdrop-blur">
                <h3 className="text-lg font-black text-white">{group.title}</h3>
                <div className="mt-4 flex flex-wrap gap-2">
                  {group.items.map((skill) => (
                    <span key={skill} className="rounded-md border border-white/10 bg-[#0b1428] px-3 py-1 text-xs font-semibold text-slate-200">{skill}</span>
                  ))}
                </div>
              </motion.div>
            ))}
          </motion.div>
        </div>
      </section>

      <section id="projects" className="bg-[#0b1428] px-4 py-20 text-white sm:px-6">
        <div className="mx-auto max-w-7xl">
          <div className="mb-10 flex flex-col justify-between gap-4 md:flex-row md:items-end">
            <div>
              <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Featured Project</p>
              <h2 className="mt-3 text-3xl font-black">Building real products with measurable depth.</h2>
            </div>
            <p className="max-w-xl text-sm leading-6 text-slate-300">
              DSA-Judge is my flagship project and current public work. The page stays focused instead of adding filler projects.
            </p>
          </div>

          <motion.article whileHover={{ y: -6 }} transition={{ duration: 0.25 }} className="grid gap-0 overflow-hidden rounded-xl border border-white/10 bg-white/[0.04] md:grid-cols-[0.9fr_1.1fr]">
            <div className="p-8 md:p-10">
              <div className="mb-5 inline-flex h-12 w-12 items-center justify-center rounded-lg bg-white text-[#0b1428]">
                <Code2 size={24} />
              </div>
              <h3 className="text-3xl font-black">DSA-Judge</h3>
              <p className="mt-3 text-lg font-semibold text-slate-100">AI-powered coding and technical interview platform.</p>
              <p className="mt-4 text-sm leading-6 text-slate-400">
                Full-stack platform for solving DSA problems, running code, practicing interviews, and improving consistency through analytics.
              </p>
              <div className="mt-6 flex flex-wrap gap-2">
                {projectTech.map((tech) => (
                  <span key={tech} className="rounded-md border border-white/10 bg-white/[0.05] px-3 py-1 text-xs font-semibold text-slate-300">{tech}</span>
                ))}
              </div>
              <div className="mt-8 flex flex-col gap-3 sm:flex-row">
                <a href="https://github.com/Parth-star262/DSA-Judge" target="_blank" rel="noreferrer" className="btn-ghost rounded-lg border-white/15 bg-white/[0.04] px-5 py-3 text-white hover:bg-white/[0.08]">
                  <ArrowUpRight size={17} />
                  <span>GitHub</span>
                </a>
                <Link href="/problems" className="btn-primary rounded-lg px-5 py-3">
                  <span>Launch DSA Judge</span>
                  <ArrowRight size={17} />
                </Link>
              </div>
            </div>

            <div className="grid content-stretch gap-3 border-t border-white/10 bg-[#0a1326] p-5 md:border-l md:border-t-0">
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

      <section id="education" className="px-4 py-20 sm:px-6">
        <div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Education</p>
            <h2 className="mt-3 text-4xl font-black text-white">B.Tech CSE at IIIT Vadodara.</h2>
            <p className="mt-4 text-base leading-7 text-[#9aa8c4]">
              2024 to 2028. Building a strong base in computer science while working on production-style software projects.
            </p>
            <div className="mt-7 grid gap-3">
              {involvement.map((item) => (
                <div key={item} className="flex gap-3 rounded-lg border border-white/10 bg-white/6 p-4">
                  <Rocket size={18} className="mt-0.5 shrink-0 text-cyan-300" />
                  <div>
                    <div className="text-sm text-slate-200">{item}</div>
                  </div>
                </div>
              ))}
            </div>
          </div>

          <div className="rounded-xl border border-white/10 bg-[#0b1428] p-5">
            <h3 className="text-xl font-black text-white">Coding Profiles</h3>
            <p className="mt-2 text-sm text-slate-300">Connect with my work, updates, and project progress.</p>
            <div className="mt-5 grid gap-3">
              {codingProfiles.map((item) => (
                <a
                  key={item.name}
                  href={item.href}
                  target="_blank"
                  rel="noreferrer"
                  className="flex items-center justify-between rounded-lg border border-white/10 bg-white/5 px-4 py-3 text-sm font-semibold text-slate-100 transition hover:bg-white/10"
                >
                  <span>{item.name}</span>
                  <ArrowUpRight size={16} />
                </a>
              ))}
            </div>
            <div className="mt-6 rounded-lg border border-white/10 bg-white/5 p-4">
              <div className="flex items-center gap-2 text-slate-200">
                <CodeXml size={16} className="text-cyan-300" />
                <span className="font-semibold">Current Focus</span>
              </div>
              <p className="mt-2 text-sm text-slate-300">Shipping polished full-stack applications with practical AI integrations and strong engineering fundamentals.</p>
            </div>
          </div>
        </div>
      </section>

      <section id="contact" className="border-t border-white/10 bg-[#0b1428] px-4 py-16 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-6 md:flex-row md:items-center">
          <div>
            <p className="text-sm font-bold uppercase tracking-[0.18em] text-slate-300">Contact</p>
            <h2 className="mt-3 text-3xl font-black text-white">Open to internships and collaborations.</h2>
            <p className="mt-2 text-[#9aa8c4]">If you are building a meaningful product or hiring interns, I&apos;d love to connect.</p>
          </div>
          <div className="flex flex-col gap-3 sm:flex-row">
            <a href="mailto:202451124@iiitvadodara.ac.in" className="btn-ghost rounded-lg border-white/20 bg-white/8 px-5 py-3 text-white hover:bg-white/14">
              <Mail size={17} />
              <span>Email</span>
            </a>
            <a href="https://github.com/Parth-star262" target="_blank" rel="noreferrer" className="btn-primary rounded-lg px-5 py-3">
              <ArrowUpRight size={17} />
              <span>GitHub</span>
            </a>
          </div>
        </div>
      </section>

      <footer className="bg-[#070c18] px-4 py-8 text-sm text-slate-400 sm:px-6">
        <div className="mx-auto flex max-w-7xl flex-col justify-between gap-3 sm:flex-row">
          <span>Parth Hada | Full-Stack & AI Developer</span>
          <span>Flagship project: DSA-Judge, available at /problems.</span>
        </div>
      </footer>
    </div>
  );
}
