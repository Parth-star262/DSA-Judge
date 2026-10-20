'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import { motion, type Variants } from 'framer-motion';
import {
	ArrowRight,
	ArrowUpRight,
	Bot,
	Briefcase,
	CheckCircle2,
	Code2,
	Cpu,
	Database,
	Download,
	ExternalLink,
	Globe,
	GraduationCap,
	Layers,
	Mail,
	MapPin,
	Send,
	Sparkles,
	Terminal,
	Trophy,
} from 'lucide-react';

function GithubIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path fillRule="evenodd" clipRule="evenodd" d="M12 2C6.477 2 2 6.484 2 12.017c0 4.425 2.865 8.18 6.839 9.504.5.092.682-.217.682-.483 0-.237-.008-.868-.013-1.703-2.782.605-3.369-1.343-3.369-1.343-.454-1.158-1.11-1.466-1.11-1.466-.908-.62.069-.608.069-.608 1.003.07 1.53 1.032 1.53 1.032.892 1.53 2.341 1.088 2.91.832.092-.647.35-1.088.636-1.338-2.22-.253-4.555-1.113-4.555-4.951 0-1.093.39-1.988 1.029-2.688-.103-.253-.446-1.272.098-2.65 0 0 .84-.27 2.75 1.026A9.564 9.564 0 0112 6.844c.85.004 1.705.115 2.504.337 1.909-1.296 2.747-1.027 2.747-1.027.546 1.379.202 2.398.1 2.651.64.7 1.028 1.595 1.028 2.688 0 3.848-2.339 4.695-4.566 4.943.359.309.678.92.678 1.855 0 1.338-.012 2.419-.012 2.747 0 .268.18.58.688.482A10.019 10.019 0 0022 12.017C22 6.484 17.522 2 12 2z" />
		</svg>
	);
}

function LinkedinIcon({ size = 16, className = '' }: { size?: number; className?: string }) {
	return (
		<svg width={size} height={size} viewBox="0 0 24 24" fill="currentColor" className={className}>
			<path d="M19 3a2 2 0 0 1 2 2v14a2 2 0 0 1-2 2H5a2 2 0 0 1-2-2V5a2 2 0 0 1 2-2h14m-.5 15.5v-5.3a3.26 3.26 0 0 0-3.26-3.26c-.85 0-1.84.52-2.28 1.3v-1.11h-2.79v8.37h2.79v-4.93c0-.77.62-1.4 1.39-1.4a1.4 1.4 0 0 1 1.4 1.4v4.93h2.75M6.46 10.9h2.79v8.37H6.46v-8.37M7.86 6.3a1.64 1.64 0 1 0 0 3.28 1.64 1.64 0 0 0 0-3.28z" />
		</svg>
	);
}

const launchUrl = 'https://dsa-judge.vercel.app/problems';
const repoUrl = 'https://github.com/Parth-star262/DSA-Judge';
const resumeUrl = '/resume';

const techStack = [
	{ name: 'JavaScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/javascript/javascript-original.svg' },
	{ name: 'TypeScript', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/typescript/typescript-original.svg' },
	{ name: 'React', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/react/react-original.svg' },
	{ name: 'Next.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nextjs/nextjs-original.svg' },
	{ name: 'Node.js', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/nodejs/nodejs-original.svg' },
	{ name: 'Express', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/express/express-original.svg' },
	{ name: 'PostgreSQL', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/postgresql/postgresql-original.svg' },
	{ name: 'Prisma', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/prisma/prisma-original.svg' },
	{ name: 'Docker', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/docker/docker-original.svg' },
	{ name: 'Redis', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/redis/redis-original.svg' },
	{ name: 'Tailwind', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/tailwindcss/tailwindcss-original.svg' },
	{ name: 'C++', icon: 'https://cdn.jsdelivr.net/gh/devicons/devicon/icons/cplusplus/cplusplus-original.svg' },
];

const skillCategories = [
	{
		title: 'Languages',
		icon: Code2,
		skills: ['TypeScript', 'JavaScript', 'C++', 'Python', 'SQL'],
		badgeColor: 'border-blue-500/30 text-blue-300 bg-blue-500/10',
	},
	{
		title: 'Frontend Development',
		icon: Globe,
		skills: ['React.js', 'Next.js (App Router)', 'Tailwind CSS', 'Monaco Editor', 'Framer Motion'],
		badgeColor: 'border-purple-500/30 text-purple-300 bg-purple-500/10',
	},
	{
		title: 'Backend & Databases',
		icon: Database,
		skills: ['Node.js', 'Express.js', 'PostgreSQL', 'Prisma ORM', 'Redis', 'REST APIs'],
		badgeColor: 'border-emerald-500/30 text-emerald-300 bg-emerald-500/10',
	},
	{
		title: 'DevOps & AI Systems',
		icon: Cpu,
		skills: ['Docker', 'Gemini AI API', 'Sandboxed Code Exec', 'Git & GitHub', 'Vercel / Render'],
		badgeColor: 'border-amber-500/30 text-amber-300 bg-amber-500/10',
	},
];

const dsaJudgeFeatures = [
	{
		title: 'Isolated Multi-Language Sandbox',
		desc: 'Executes C++, Java, Python, and JavaScript safely with precise wall-time and memory enforcement.',
		icon: Terminal,
	},
	{
		title: 'AI Mock Technical Interviews',
		desc: 'Simulates interactive hiring rounds with adaptive feedback on edge-cases, data structures, and trade-offs.',
		icon: Bot,
	},
	{
		title: 'Automated Code Review & Hints',
		desc: 'Analyzes asymptotic time/space complexity and guides problem solving without spoiling the full solution.',
		icon: Sparkles,
	},
	{
		title: 'Comprehensive Performance Tracking',
		desc: 'Detailed submission history, verdict breakdowns, and consistency charts for continuous practice.',
		icon: Layers,
	},
];

const fadeUpVariant: Variants = {
	hidden: { opacity: 0, y: 24 },
	visible: { opacity: 1, y: 0, transition: { duration: 0.5 } },
};

export default function PortfolioHomePage() {
	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formMessage, setFormMessage] = useState('');
	const [copiedEmail, setCopiedEmail] = useState(false);

	const myEmail = '202451124@iiitvadodara.ac.in';

	const mailtoHref = useMemo(() => {
		const subject = encodeURIComponent(`Portfolio Message from ${formName || 'Visitor'}`);
		const body = encodeURIComponent(
			`Hi Parth,\n\n${formMessage || ''}\n\nFrom: ${formName || 'Visitor'}\nEmail: ${formEmail || 'Not provided'}`,
		);
		return `mailto:${myEmail}?subject=${subject}&body=${body}`;
	}, [formEmail, formMessage, formName]);

	const submitContact = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		window.location.href = mailtoHref;
	};

	const copyEmail = () => {
		navigator.clipboard.writeText(myEmail);
		setCopiedEmail(true);
		setTimeout(() => setCopiedEmail(false), 2200);
	};

	return (
		<div className="portfolio-shell min-h-screen bg-[#030014] text-[#eef1f8] selection:bg-purple-600/40 selection:text-white">
			{/* Ambient background glows */}
			<div className="pointer-events-none fixed inset-0 -z-10 overflow-hidden">
				<div className="absolute top-[-10%] left-[15%] h-[550px] w-[550px] rounded-full bg-gradient-to-br from-indigo-600/15 via-purple-600/10 to-transparent blur-[120px]" />
				<div className="absolute top-[35%] right-[-5%] h-[600px] w-[600px] rounded-full bg-gradient-to-bl from-pink-600/10 via-purple-600/10 to-transparent blur-[140px]" />
				<div className="absolute bottom-[5%] left-[-10%] h-[500px] w-[500px] rounded-full bg-gradient-to-tr from-cyan-600/10 via-indigo-600/10 to-transparent blur-[130px]" />
				<div className="absolute inset-0 bg-[linear-gradient(to_right,rgba(255,255,255,0.02)_1px,transparent_1px),linear-gradient(to_bottom,rgba(255,255,255,0.02)_1px,transparent_1px)] bg-[size:4rem_4rem] [mask-image:radial-gradient(ellipse_60%_50%_at_50%_0%,#000_70%,transparent_100%)]" />
			</div>

			{/* ================= HERO SECTION ================= */}
			<section id="home" className="relative px-4 pt-10 pb-16 sm:px-6 md:pt-14 md:pb-20 lg:px-8">
				<div className="mx-auto max-w-7xl">
					<div className="grid grid-cols-1 items-center gap-10 lg:grid-cols-12 lg:gap-12">
						{/* Left: Introduction & CTAs */}
						<motion.div
							initial="hidden"
							animate="visible"
							variants={fadeUpVariant}
							className="order-1 lg:order-1 lg:col-span-7"
						>
							{/* Status Chip */}
							<div className="inline-flex items-center gap-2 rounded-full border border-emerald-500/25 bg-emerald-500/10 px-3.5 py-1 text-xs font-semibold text-emerald-300 shadow-sm backdrop-blur-md">
								<span className="relative flex h-2 w-2">
									<span className="absolute inline-flex h-full w-full animate-ping rounded-full bg-emerald-400 opacity-75" />
									<span className="relative inline-flex h-2 w-2 rounded-full bg-emerald-400" />
								</span>
								<span>Available for Software Engineering Opportunities</span>
							</div>

							{/* Hero Heading */}
							<h1 className="mt-4 text-3xl font-extrabold tracking-tight text-white sm:text-4xl lg:text-[44px] xl:text-5xl lg:leading-[1.15]">
								Hi, I&apos;m <span className="text-white">Parth Hada</span>
								<span className="block mt-1.5 bg-gradient-to-r from-indigo-400 via-purple-300 to-pink-400 bg-clip-text text-transparent">
									Full-Stack Developer
								</span>
								<span className="block mt-1 text-2xl sm:text-3xl lg:text-4xl font-bold text-slate-300">
									&amp; AI Systems Builder
								</span>
							</h1>

							{/* Concise Bio */}
							<p className="mt-5 max-w-xl text-sm leading-relaxed text-slate-300 sm:text-base sm:leading-7">
								Computer Science student at <strong className="font-semibold text-white">IIIT Vadodara</strong> with 500+ algorithmic problems solved. I architect production-ready web applications, automated developer tooling, and AI-powered platforms with clean systems and practical utility.
							</p>

							{/* Quick Info Badges */}
							<div className="mt-6 flex flex-wrap items-center gap-2.5 text-xs text-slate-300">
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
									<Trophy size={14} className="text-amber-400" />
									<span>500+ DSA Solved</span>
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
									<GraduationCap size={14} className="text-indigo-400" />
									<span>IIIT Vadodara &apos;28</span>
								</div>
								<div className="inline-flex items-center gap-2 rounded-full border border-white/10 bg-white/[0.04] px-3.5 py-1.5 backdrop-blur-md">
									<MapPin size={14} className="text-rose-400" />
									<span>Gandhinagar, Gujarat</span>
								</div>
							</div>

							{/* Main CTA Buttons */}
							<div className="mt-8 flex flex-wrap items-center gap-3.5">
								<a
									href="#projects"
									className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-5 py-2.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition-all duration-300 hover:scale-[1.02] hover:shadow-indigo-500/40 active:scale-[0.98]"
								>
									<span>View Featured Project</span>
									<ArrowRight size={15} />
								</a>

								<a
									href={launchUrl}
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.06] px-5 py-2.5 text-sm font-semibold text-white backdrop-blur-md transition-all duration-300 hover:border-white/40 hover:bg-white/10 hover:shadow-[0_0_20px_rgba(255,255,255,0.12)] active:scale-[0.98]"
								>
									<span>Launch DSA-Judge</span>
									<ArrowUpRight size={15} className="text-indigo-400" />
								</a>

								<a
									href={resumeUrl}
									download
									className="inline-flex items-center gap-2 rounded-full border border-white/15 bg-white/[0.04] px-4 py-2.5 text-sm font-semibold text-slate-200 transition-all duration-300 hover:bg-white/[0.1] hover:text-white"
								>
									<Download size={14} />
									<span>Resume</span>
								</a>
							</div>

							{/* Social Links Row */}
							<div className="mt-8 flex items-center gap-3 pt-5 border-t border-white/10">
								<span className="text-xs font-semibold uppercase tracking-wider text-slate-400">Connect:</span>
								<a
									href="https://github.com/Parth-star262"
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
								>
									<GithubIcon size={14} />
									<span>GitHub</span>
								</a>
								<a
									href="https://linkedin.com/in/parth-hada"
									target="_blank"
									rel="noreferrer"
									className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
								>
									<LinkedinIcon size={14} className="text-blue-400" />
									<span>LinkedIn</span>
								</a>
								<a
									href={`mailto:${myEmail}`}
									className="inline-flex items-center gap-1.5 rounded-lg border border-white/10 bg-white/[0.03] px-3 py-1.5 text-xs font-semibold text-slate-300 transition hover:border-white/25 hover:bg-white/10 hover:text-white"
								>
									<Mail size={14} className="text-rose-400" />
									<span>Email</span>
								</a>
							</div>
						</motion.div>

						{/* Right: Portrait & Interactive Visual Card */}
						<motion.div
							initial={{ opacity: 0, scale: 0.94, y: 20 }}
							animate={{ opacity: 1, scale: 1, y: 0 }}
							transition={{ duration: 0.6, ease: 'easeOut' }}
							className="order-2 flex justify-center lg:order-2 lg:col-span-5"
						>
							<div className="relative w-full max-w-[310px] sm:max-w-[340px]">
								{/* Ambient Glow behind image */}
								<div className="absolute -inset-3 rounded-[36px] bg-gradient-to-tr from-indigo-500/30 via-purple-500/20 to-pink-500/30 blur-2xl -z-10" />

								{/* Main Portrait Container */}
								<div className="relative overflow-hidden rounded-[30px] border border-white/15 bg-gradient-to-b from-white/10 via-white/[0.04] to-transparent p-2.5 backdrop-blur-xl shadow-2xl shadow-indigo-950/60">
									<div className="relative aspect-[4/5] w-full overflow-hidden rounded-[24px]">
										<Image
											src="/parth-photo.jpg"
											alt="Parth Hada"
											fill
											priority
											className="object-cover object-top transition-transform duration-500 hover:scale-105"
											sizes="(max-width: 768px) 100vw, 380px"
										/>
										<div className="absolute inset-0 bg-gradient-to-t from-[#030014]/80 via-transparent to-transparent" />

										{/* Floating Overlays */}
										<div className="absolute bottom-3 left-3 right-3 flex items-center justify-between rounded-xl border border-white/15 bg-black/60 px-3.5 py-2.5 backdrop-blur-md">
											<div>
												<p className="text-xs font-bold text-white">Parth Hada</p>
												<p className="text-[11px] text-slate-300">Creator of DSA-Judge</p>
											</div>
											<span className="inline-flex items-center gap-1 rounded-full bg-emerald-500/20 px-2 py-0.5 text-[10px] font-bold text-emerald-300 border border-emerald-500/30">
												<span className="h-1.5 w-1.5 rounded-full bg-emerald-400" />
												Online
											</span>
										</div>
									</div>
								</div>
							</div>
						</motion.div>
					</div>
				</div>
			</section>

			{/* ================= FEATURED PROJECT: DSA-JUDGE ================= */}
			<section id="projects" className="relative px-4 py-20 sm:px-6 lg:px-8 border-t border-white/10">
				<div className="mx-auto max-w-7xl">
					{/* Section Header */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeUpVariant}
						className="max-w-3xl"
					>
						<div className="inline-flex items-center gap-2 rounded-full border border-indigo-500/30 bg-indigo-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-indigo-300">
							<Sparkles size={13} />
							<span>Flagship Project</span>
						</div>
						<h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
							DSA-Judge Platform
						</h2>
						<p className="mt-3 text-sm sm:text-base leading-relaxed text-slate-300">
							A full-stack competitive programming and AI-assisted technical interview simulator built from scratch for engineering candidates and learners.
						</p>
					</motion.div>

					{/* Project Card */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={fadeUpVariant}
						className="mt-12 overflow-hidden rounded-3xl border border-white/15 bg-gradient-to-b from-white/[0.06] via-white/[0.02] to-transparent p-6 sm:p-10 backdrop-blur-xl shadow-2xl"
					>
						<div className="grid grid-cols-1 gap-10 lg:grid-cols-12 lg:items-center">
							{/* Left: Summary & CTAs */}
							<div className="lg:col-span-6 space-y-6">
								<div className="flex flex-wrap items-center gap-2">
									<span className="rounded-md border border-indigo-500/30 bg-indigo-500/15 px-2.5 py-1 text-xs font-semibold text-indigo-300">
										Next.js 16 (App Router)
									</span>
									<span className="rounded-md border border-cyan-500/30 bg-cyan-500/15 px-2.5 py-1 text-xs font-semibold text-cyan-300">
										Node.js / Express
									</span>
									<span className="rounded-md border border-purple-500/30 bg-purple-500/15 px-2.5 py-1 text-xs font-semibold text-purple-300">
										PostgreSQL &amp; Prisma
									</span>
									<span className="rounded-md border border-pink-500/30 bg-pink-500/15 px-2.5 py-1 text-xs font-semibold text-pink-300">
										Google Gemini AI
									</span>
								</div>

								<p className="text-base sm:text-lg leading-relaxed text-slate-300">
									DSA-Judge bridges the gap between solitary problem solving and real interview pressure. It provides a browser-based IDE powered by Monaco, strict judge sandboxing, interactive AI coaching, and deep telemetry on code efficiency.
								</p>

								{/* Highlights List */}
								<div className="space-y-3 pt-2">
									<div className="flex items-start gap-3">
										<CheckCircle2 size={18} className="mt-0.5 text-emerald-400 shrink-0" />
										<span className="text-sm text-slate-300">Multi-language execution (C++, Java, Python, JS) with sub-second verdict feedback.</span>
									</div>
									<div className="flex items-start gap-3">
										<CheckCircle2 size={18} className="mt-0.5 text-emerald-400 shrink-0" />
										<span className="text-sm text-slate-300">Interactive AI Mock Interviews providing real-time hints and complexity evaluation.</span>
									</div>
									<div className="flex items-start gap-3">
										<CheckCircle2 size={18} className="mt-0.5 text-emerald-400 shrink-0" />
										<span className="text-sm text-slate-300">Monaco code editor with syntax highlighting, custom test inputs, and full keyboard ergonomics.</span>
									</div>
								</div>

								<div className="flex flex-wrap items-center gap-4 pt-4">
									<a
										href={launchUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 px-6 py-3 text-sm font-bold text-white shadow-lg shadow-indigo-500/30 transition hover:scale-[1.02] hover:shadow-indigo-500/50"
									>
										<span>Launch Live App</span>
										<ArrowUpRight size={16} />
									</a>
									<a
										href={repoUrl}
										target="_blank"
										rel="noreferrer"
										className="inline-flex items-center gap-2 rounded-full border border-white/20 bg-white/[0.04] px-5 py-3 text-sm font-semibold text-slate-200 transition hover:bg-white/10 hover:text-white"
									>
										<GithubIcon size={16} />
										<span>Source Code</span>
									</a>
								</div>
							</div>

							{/* Right: Feature Grid Cards */}
							<div className="lg:col-span-6 grid grid-cols-1 sm:grid-cols-2 gap-4">
								{dsaJudgeFeatures.map((feat) => {
									const Icon = feat.icon;
									return (
										<div
											key={feat.title}
											className="rounded-2xl border border-white/10 bg-white/[0.03] p-5 backdrop-blur-md transition-all duration-300 hover:border-indigo-500/30 hover:bg-white/[0.06] hover:translate-y-[-2px]"
										>
											<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-gradient-to-tr from-indigo-500/20 to-purple-500/20 text-indigo-300 border border-indigo-500/30">
												<Icon size={19} />
											</div>
											<h3 className="mt-3.5 text-base font-bold text-white">{feat.title}</h3>
											<p className="mt-2 text-xs leading-relaxed text-slate-400">{feat.desc}</p>
										</div>
									);
								})}
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ================= TECHNICAL SKILLS ================= */}
			<section id="skills" className="relative px-4 py-20 sm:px-6 lg:px-8 border-t border-white/10">
				<div className="mx-auto max-w-7xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeUpVariant}
						className="text-center max-w-2xl mx-auto"
					>
						<div className="inline-flex items-center gap-2 rounded-full border border-purple-500/30 bg-purple-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-purple-300">
							<Code2 size={13} />
							<span>Technical Toolkit</span>
						</div>
						<h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
							Skills &amp; Technologies
						</h2>
						<p className="mt-3 text-sm sm:text-base text-slate-300">
							Languages, frameworks, and engineering tools I leverage to build resilient digital products.
						</p>
					</motion.div>

					{/* 4 Category Matrix */}
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={fadeUpVariant}
						className="mt-14 grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6"
					>
						{skillCategories.map((cat) => {
							const Icon = cat.icon;
							return (
								<div
									key={cat.title}
									className="rounded-2xl border border-white/10 bg-white/[0.02] p-6 backdrop-blur-md transition-all duration-300 hover:border-white/20 hover:bg-white/[0.04]"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/[0.06] border border-white/10 text-white">
											<Icon size={18} />
										</div>
										<h3 className="text-base font-bold text-white">{cat.title}</h3>
									</div>
									<div className="mt-5 flex flex-wrap gap-2">
										{cat.skills.map((skill) => (
											<span
												key={skill}
												className={`rounded-lg border px-2.5 py-1 text-xs font-medium ${cat.badgeColor}`}
											>
												{skill}
											</span>
										))}
									</div>
								</div>
							);
						})}
					</motion.div>

					{/* Continuous Marquee Ticker */}
					<div className="mt-16 overflow-hidden py-4 border-y border-white/10 bg-white/[0.01]">
						<div className="portfolio-tech-track flex items-center gap-12">
							{[...techStack, ...techStack, ...techStack].map((tech, idx) => (
								<div
									key={`${tech.name}-${idx}`}
									className="flex items-center gap-3 px-4 py-2 rounded-xl border border-white/10 bg-white/[0.03] shrink-0"
								>
									<img src={tech.icon} alt={tech.name} className="h-6 w-6 object-contain" />
									<span className="text-xs font-bold text-slate-300">{tech.name}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			{/* ================= ABOUT, EDUCATION & ACHIEVEMENTS ================= */}
			<section id="about" className="relative px-4 py-20 sm:px-6 lg:px-8 border-t border-white/10">
				<div className="mx-auto max-w-7xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeUpVariant}
						className="max-w-3xl"
					>
						<div className="inline-flex items-center gap-2 rounded-full border border-blue-500/30 bg-blue-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-blue-300">
							<GraduationCap size={13} />
							<span>Background</span>
						</div>
						<h2 className="mt-4 text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
							Education &amp; Milestones
						</h2>
						<p className="mt-3 text-sm sm:text-base text-slate-300">
							My academic path, competitive programming journey, and leadership on campus.
						</p>
					</motion.div>

					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.2 }}
						variants={fadeUpVariant}
						className="mt-12 grid grid-cols-1 lg:grid-cols-2 gap-8"
					>
						{/* Card 1: Education & Campus */}
						<div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
							<div className="flex items-center gap-3 text-indigo-400">
								<GraduationCap size={22} />
								<h3 className="text-xl font-bold text-white">Academic Journey</h3>
							</div>

							<div className="mt-6 border-l-2 border-indigo-500/40 pl-5">
								<h4 className="text-lg font-bold text-white">Indian Institute of Information Technology, Vadodara</h4>
								<p className="text-sm font-semibold text-indigo-300 mt-1">B.Tech in Computer Science and Engineering</p>
								<p className="text-xs text-slate-400 mt-1">2024 – 2028 • Gandhinagar Campus, Gujarat</p>
								<p className="mt-3 text-sm leading-relaxed text-slate-300">
									Rigorous coursework covering Data Structures &amp; Algorithms, Object-Oriented Design, Operating Systems, Database Management Systems, and Discrete Mathematics.
								</p>
							</div>

							<div className="mt-8 pt-6 border-t border-white/10">
								<h4 className="text-sm font-bold uppercase tracking-wider text-slate-300">Campus Involvement</h4>
								<ul className="mt-4 space-y-3">
									<li className="flex items-center gap-3 text-sm text-slate-300">
										<ArrowRight size={15} className="text-indigo-400 shrink-0" />
										<span><strong>Finance Club, IIIT Vadodara</strong> — Active Member</span>
									</li>
									<li className="flex items-center gap-3 text-sm text-slate-300">
										<ArrowRight size={15} className="text-indigo-400 shrink-0" />
										<span><strong>E-Cell, IIIT Vadodara</strong> — Active Member</span>
									</li>
								</ul>
							</div>
						</div>

						{/* Card 2: Achievements & Projects */}
						<div className="rounded-3xl border border-white/10 bg-white/[0.02] p-8 backdrop-blur-md">
							<div className="flex items-center gap-3 text-amber-400">
								<Trophy size={22} />
								<h3 className="text-xl font-bold text-white">Achievements &amp; Hackathons</h3>
							</div>

							<ul className="mt-6 space-y-5">
								<li className="flex items-start gap-4">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-amber-500/10 border border-amber-500/20 text-amber-300">
										<Code2 size={18} />
									</div>
									<div>
										<h4 className="text-base font-bold text-white">500+ Algorithmic Problems Solved</h4>
										<p className="mt-1 text-xs leading-relaxed text-slate-400">
											Consistently solved challenging problems spanning dynamic programming, graphs, trees, and system logic across major competitive platforms.
										</p>
									</div>
								</li>

								<li className="flex items-start gap-4">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-purple-500/10 border border-purple-500/20 text-purple-300">
										<Sparkles size={18} />
									</div>
									<div>
										<h4 className="text-base font-bold text-white">HackOut&apos;25 Participant (DA-IICT)</h4>
										<p className="mt-1 text-xs leading-relaxed text-slate-400">
											Collaborated under tight deadlines to design and engineer full-stack solutions during the 2025 hackathon on the DA-IICT campus.
										</p>
									</div>
								</li>

								<li className="flex items-start gap-4">
									<div className="flex h-9 w-9 shrink-0 items-center justify-center rounded-xl bg-emerald-500/10 border border-emerald-500/20 text-emerald-300">
										<Briefcase size={18} />
									</div>
									<div>
										<h4 className="text-base font-bold text-white">Coastal Threat Alert Prototype</h4>
										<p className="mt-1 text-xs leading-relaxed text-slate-400">
											Initiated development of a real-time hazard detection and alerting tool designed to keep coastal communities informed and safe.
										</p>
									</div>
								</li>
							</ul>

							<div className="mt-8 rounded-2xl border border-white/10 bg-white/[0.03] p-4 text-xs text-slate-300">
								<span className="font-bold text-white">Core Engineering Ethos:</span> Write clean, maintainable code with strict attention to performance bottlenecks and user clarity.
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ================= CONTACT SECTION ================= */}
			<section id="contact" className="relative px-4 py-20 sm:px-6 lg:px-8 border-t border-white/10">
				<div className="mx-auto max-w-7xl">
					<motion.div
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.3 }}
						variants={fadeUpVariant}
						className="grid grid-cols-1 gap-12 lg:grid-cols-12"
					>
						{/* Left: Contact Info */}
						<div className="lg:col-span-5 space-y-6">
							<div className="inline-flex items-center gap-2 rounded-full border border-pink-500/30 bg-pink-500/10 px-3 py-1 text-xs font-semibold uppercase tracking-wider text-pink-300">
								<Mail size={13} />
								<span>Get in Touch</span>
							</div>

							<h2 className="text-2xl font-bold tracking-tight text-white sm:text-3xl lg:text-4xl">
								Let&apos;s build something exceptional.
							</h2>

							<p className="text-sm sm:text-base text-slate-300 leading-relaxed">
								I am actively seeking software engineering internship opportunities, technical collaborations, and ambitious projects. Reach out via email or send a note below.
							</p>

							{/* Contact Cards */}
							<div className="space-y-3 pt-2">
								<div
									onClick={copyEmail}
									className="group flex cursor-pointer items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-indigo-500/40 hover:bg-white/[0.06]"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-indigo-500/10 text-indigo-400">
											<Mail size={18} />
										</div>
										<div>
											<p className="text-xs text-slate-400">Primary Email</p>
											<p className="text-sm font-semibold text-white">{myEmail}</p>
										</div>
									</div>
									<span className="text-xs font-medium text-slate-400 group-hover:text-indigo-300">
										{copiedEmail ? 'Copied!' : 'Click to copy'}
									</span>
								</div>

								<a
									href="https://linkedin.com/in/parth-hada"
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-blue-500/40 hover:bg-white/[0.06]"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-blue-500/10 text-blue-400">
											<LinkedinIcon size={18} />
										</div>
										<div>
											<p className="text-xs text-slate-400">Professional Profile</p>
											<p className="text-sm font-semibold text-white">linkedin.com/in/parth-hada</p>
										</div>
									</div>
									<ExternalLink size={16} className="text-slate-400" />
								</a>

								<a
									href="https://github.com/Parth-star262"
									target="_blank"
									rel="noreferrer"
									className="flex items-center justify-between rounded-2xl border border-white/10 bg-white/[0.03] p-4 transition hover:border-white/30 hover:bg-white/[0.06]"
								>
									<div className="flex items-center gap-3">
										<div className="flex h-10 w-10 items-center justify-center rounded-xl bg-white/10 text-white">
											<GithubIcon size={18} />
										</div>
										<div>
											<p className="text-xs text-slate-400">Code Repositories</p>
											<p className="text-sm font-semibold text-white">github.com/Parth-star262</p>
										</div>
									</div>
									<ExternalLink size={16} className="text-slate-400" />
								</a>
							</div>
						</div>

						{/* Right: Functional Contact Form */}
						<div className="lg:col-span-7">
							<form
								onSubmit={submitContact}
								className="rounded-3xl border border-white/15 bg-white/[0.03] p-6 sm:p-8 backdrop-blur-xl shadow-xl space-y-5"
							>
								<h3 className="text-xl font-bold text-white">Send a Direct Message</h3>
								<p className="text-xs text-slate-400">Fill in your information and this will open your email client pre-filled.</p>

								<div>
									<label htmlFor="name" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
										Your Name
									</label>
									<input
										id="name"
										type="text"
										required
										value={formName}
										onChange={(e) => setFormName(e.target.value)}
										placeholder="e.g. John Doe"
										className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
									/>
								</div>

								<div>
									<label htmlFor="email" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
										Your Email
									</label>
									<input
										id="email"
										type="email"
										required
										value={formEmail}
										onChange={(e) => setFormEmail(e.target.value)}
										placeholder="john@example.com"
										className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400"
									/>
								</div>

								<div>
									<label htmlFor="message" className="block text-xs font-semibold text-slate-300 uppercase tracking-wider mb-2">
										Message
									</label>
									<textarea
										id="message"
										required
										rows={5}
										value={formMessage}
										onChange={(e) => setFormMessage(e.target.value)}
										placeholder="Tell me about your project, internship opportunity, or idea..."
										className="w-full rounded-xl border border-white/15 bg-black/40 px-4 py-3 text-sm text-white placeholder-slate-500 outline-none transition focus:border-indigo-400 focus:ring-1 focus:ring-indigo-400 resize-none"
									/>
								</div>

								<button
									type="submit"
									className="w-full inline-flex items-center justify-center gap-2 rounded-xl bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 py-3.5 text-sm font-bold text-white shadow-lg shadow-indigo-500/25 transition hover:scale-[1.01] hover:shadow-indigo-500/40 active:scale-[0.99]"
								>
									<Send size={15} />
									<span>Send Message</span>
								</button>
							</form>
						</div>
					</motion.div>
				</div>
			</section>

			{/* ================= FOOTER ================= */}
			<footer className="border-t border-white/10 px-4 py-8 sm:px-6 lg:px-8 bg-black/30">
				<div className="mx-auto flex max-w-7xl flex-col items-center justify-between gap-4 text-xs text-slate-400 sm:flex-row">
					<p>© {new Date().getFullYear()} Parth Hada • IIIT Vadodara CSE. Built with Next.js &amp; Tailwind CSS.</p>
					<div className="flex items-center gap-5">
						<a href={launchUrl} target="_blank" rel="noreferrer" className="transition hover:text-white">
							DSA-Judge Live
						</a>
						<a href={repoUrl} target="_blank" rel="noreferrer" className="transition hover:text-white">
							GitHub
						</a>
						<a href="#home" className="transition hover:text-white">
							Back to Top ↑
						</a>
					</div>
				</div>
			</footer>
		</div>
	);
}
