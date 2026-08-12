'use client';

import { FormEvent, useMemo, useState } from 'react';
import Image from 'next/image';
import Link from 'next/link';
import { motion } from 'framer-motion';
import {
	ArrowRight,
	ArrowUpRight,
	Bot,
	Brain,
	ChevronDown,
	Code2,
	Gauge,
	GraduationCap,
	Lightbulb,
	Link2,
	Mail,
	MapPin,
	Sparkles,
	Terminal,
} from 'lucide-react';

const launchUrl = 'https://dsa-judge.vercel.app/';
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
];

const projectFeatures = [
	{ title: 'Real Code Execution', desc: 'Run C++, Java, Python, and JavaScript with strict test verdicts.', icon: Terminal },
	{ title: 'AI Mock Interviews', desc: 'Practice DSA interview rounds with adaptive AI prompts.', icon: Bot },
	{ title: 'AI Code Review', desc: 'Get complexity insight and cleaner approach suggestions.', icon: Sparkles },
	{ title: 'Intelligent Hints', desc: 'Request targeted support while staying in the solving flow.', icon: Lightbulb },
	{ title: 'Performance Analytics', desc: 'Track submissions, progress, and coding consistency over time.', icon: Gauge },
];

const faqs = [
	{
		q: 'What are you focused on currently?',
		a: 'I am focused on full-stack product development, AI-assisted workflows, and improving my systems thinking through practical builds.',
	},
	{
		q: 'What kind of opportunities are you open to?',
		a: 'I am open to software engineering internships, collaboration projects, and mentorship-oriented developer roles.',
	},
	{
		q: 'How can I evaluate your work quickly?',
		a: 'Start with DSA-Judge. It is my flagship public project and shows product, backend, and engineering depth in one place.',
	},
	{
		q: 'How should I contact you?',
		a: 'Email is best for first contact. You can also connect with me on GitHub and LinkedIn from the links below.',
	},
];

const fadeUp = {
	hidden: { opacity: 0, y: 22 },
	visible: { opacity: 1, y: 0 },
};

export default function PortfolioHomePage() {
	const [formName, setFormName] = useState('');
	const [formEmail, setFormEmail] = useState('');
	const [formMessage, setFormMessage] = useState('');

	const mailtoHref = useMemo(() => {
		const subject = encodeURIComponent(`Portfolio Message from ${formName || 'Visitor'}`);
		const body = encodeURIComponent(
			`Name: ${formName || ''}\nEmail: ${formEmail || ''}\n\nMessage:\n${formMessage || ''}`,
		);
		return `mailto:202451124@iiitvadodara.ac.in?subject=${subject}&body=${body}`;
	}, [formEmail, formMessage, formName]);

	const submitContact = (event: FormEvent<HTMLFormElement>) => {
		event.preventDefault();
		window.location.href = mailtoHref;
	};

	return (
		<div className="portfolio-shell min-h-screen overflow-hidden bg-[#050608] text-[#eef1f6]">
			<div className="pointer-events-none fixed inset-0 -z-10 bg-[radial-gradient(circle_at_14%_16%,rgba(106,120,156,0.15),transparent_34%),radial-gradient(circle_at_88%_82%,rgba(131,107,82,0.12),transparent_30%)]" />

			<section id="home" className="relative px-4 pb-24 pt-16 sm:px-6 md:pt-20">
				<div className="mx-auto grid min-h-[calc(100vh-76px)] max-w-7xl items-center gap-12 lg:grid-cols-[0.9fr_1.2fr_0.9fr]">
					<motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.45 }} className="hidden gap-4 lg:grid">
						<a href="https://github.com/Parth-star262" target="_blank" rel="noreferrer" className="portfolio-side-link">GitHub</a>
						<a href="https://linkedin.com/in/parth-hada" target="_blank" rel="noreferrer" className="portfolio-side-link">LinkedIn</a>
						<a href="mailto:202451124@iiitvadodara.ac.in" className="portfolio-side-link">Email</a>
					</motion.div>

					<motion.div
						initial={{ opacity: 0, y: 24, scale: 0.98 }}
						animate={{ opacity: 1, y: 0, scale: 1 }}
						transition={{ duration: 0.55 }}
						className="text-center"
					>
						<div className="mx-auto max-w-[340px] overflow-hidden rounded-[30px] border border-white/10 bg-white/5 p-2 shadow-[0_30px_70px_rgba(0,0,0,0.45)]">
							<Image
								src="/parth-photo.jpg"
								alt="Parth Hada"
								width={680}
								height={760}
								priority
								className="h-auto w-full rounded-[24px] object-cover"
							/>
						</div>
						<div className="mx-auto mt-5 flex w-fit flex-wrap justify-center gap-2">
							<a href={resumeUrl} className="portfolio-pill-btn" download>
								Resume ↓
							</a>
							<a href="#contact" className="portfolio-pill-btn portfolio-pill-btn--ghost">
								Let&apos;s Talk <ArrowUpRight size={14} />
							</a>
						</div>
					</motion.div>

					<motion.div initial="hidden" animate="visible" variants={fadeUp} transition={{ duration: 0.5, delay: 0.08 }}>
						<p className="text-center text-xs font-semibold uppercase tracking-[0.26em] text-slate-400 lg:text-right">Parth Hada</p>
						<h1 className="mt-4 text-center text-5xl font-black leading-[0.95] tracking-tight text-white sm:text-6xl md:text-7xl lg:text-right">
							Full Stack
							<span className="mx-2 inline-block rounded-sm bg-white px-2 text-black">Developer</span>
							<br />
							<span className="font-script text-[#b7c0d4]">Building Practical AI + Web Products</span>
						</h1>
						<p className="mx-auto mt-6 max-w-2xl text-center text-base leading-7 text-slate-300 lg:mx-0 lg:text-right">
							Computer Science Student at IIIT Vadodara. I build full-stack applications, AI-powered systems, and developer products focused on real-world utility.
						</p>
						<div className="mt-8 flex flex-wrap justify-center gap-3 lg:justify-end">
							<a href="#projects" className="portfolio-pill-btn">
								View Projects <ArrowRight size={15} />
							</a>
							<a href={launchUrl} target="_blank" rel="noreferrer" className="portfolio-pill-btn portfolio-pill-btn--ghost">
								Launch DSA-Judge <ArrowUpRight size={15} />
							</a>
						</div>
						<div className="mt-6 flex items-center justify-center gap-2 text-sm text-slate-400 lg:justify-end">
							<MapPin size={15} />
							Gandhinagar, Gujarat
						</div>
					</motion.div>
				</div>
			</section>

			<section id="projects" className="px-4 py-24 sm:px-6">
				<div className="mx-auto max-w-7xl">
					<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={fadeUp} className="mb-12">
						<p className="text-xs font-semibold uppercase tracking-[0.28em] text-slate-400">Featured Project</p>
						<h2 className="mt-3 text-4xl font-black leading-tight text-white sm:text-5xl">
							DSA-Judge
							<span className="ml-2 font-script text-[#b7c0d4]">Flagship Build</span>
						</h2>
						<p className="mt-4 max-w-3xl text-lg text-slate-300">AI-powered coding and technical interview platform.</p>
					</motion.div>

					<motion.article
						initial="hidden"
						whileInView="visible"
						viewport={{ once: true, amount: 0.25 }}
						variants={fadeUp}
						whileHover={{ y: -4 }}
						transition={{ duration: 0.25 }}
						className="rounded-[30px] border border-white/10 bg-[#090b0f] p-6 sm:p-8 lg:p-10"
					>
						<div className="grid gap-10 lg:grid-cols-[1.05fr_0.95fr]">
							<div>
								<div className="flex flex-wrap gap-2 text-xs font-semibold text-slate-300">
									{['Next.js', 'TypeScript', 'Express', 'Prisma', 'PostgreSQL', 'Redis', 'Docker'].map((tag) => (
										<span key={tag} className="rounded-full border border-white/12 px-3 py-1">{tag}</span>
									))}
								</div>
								<p className="mt-6 max-w-xl text-sm leading-7 text-slate-300">
									A full-stack platform for DSA practice with integrated judge execution, AI review, and interview workflows designed for consistent coding growth.
								</p>
								<div className="mt-7 flex flex-wrap gap-3">
									<a href={launchUrl} target="_blank" rel="noreferrer" className="portfolio-pill-btn">
										Launch DSA-Judge <ArrowUpRight size={15} />
									</a>
									<a href="https://github.com/Parth-star262/DSA-Judge" target="_blank" rel="noreferrer" className="portfolio-pill-btn portfolio-pill-btn--ghost">
										GitHub <ArrowUpRight size={15} />
									</a>
								</div>
							</div>

							<div className="grid gap-4">
								{projectFeatures.map((item) => {
									const Icon = item.icon;
									return (
										<div key={item.title} className="group flex items-start gap-4 rounded-2xl border border-white/10 bg-white/[0.02] p-4 transition hover:border-white/20 hover:bg-white/[0.04]">
											<div className="mt-0.5 flex h-10 w-10 shrink-0 items-center justify-center rounded-full border border-white/15 text-slate-200 transition group-hover:text-white">
												<Icon size={17} />
											</div>
											<div>
												<h3 className="text-sm font-bold text-white">{item.title}</h3>
												<p className="mt-1 text-sm leading-6 text-slate-400">{item.desc}</p>
											</div>
										</div>
									);
								})}
							</div>
						</div>
					</motion.article>
				</div>
			</section>

			<section id="skills" className="overflow-hidden px-4 py-24 sm:px-6">
				<div className="mx-auto max-w-7xl">
					<motion.h2 initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.6 }} variants={fadeUp} className="text-center text-4xl font-black text-white sm:text-5xl">
						My Tech Stack
					</motion.h2>
					<div className="mt-12 overflow-hidden">
						<div className="portfolio-tech-track">
							{[...techStack, ...techStack].map((tech, idx) => (
								<div key={`${tech.name}-${idx}`} className="portfolio-tech-orb" title={tech.name}>
									<img src={tech.icon} alt={tech.name} loading="lazy" className="h-10 w-10 object-contain" />
									<span className="mt-2 text-xs text-slate-300">{tech.name}</span>
								</div>
							))}
						</div>
					</div>
				</div>
			</section>

			<section id="about" className="px-4 py-24 sm:px-6">
				<div className="mx-auto max-w-7xl">
					<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.35 }} variants={fadeUp} className="text-center">
						<p className="inline-flex items-center gap-2 rounded-full border border-white/12 px-4 py-1 text-xs font-semibold uppercase tracking-[0.22em] text-slate-300">
							About Me
						</p>
						<h2 className="mx-auto mt-5 max-w-5xl text-4xl font-black leading-tight text-white sm:text-6xl">
							Building software where
							<span className="ml-2 font-script text-[#b7c0d4]">engineering</span>
							meets curiosity.
						</h2>
						<p className="mx-auto mt-6 max-w-3xl text-lg leading-8 text-slate-300">
							I am a B.Tech CSE student at Indian Institute of Information Technology, Vadodara (2024-2028), interested in full-stack development, AI/LLM workflows, and problem solving through DSA.
						</p>
					</motion.div>

					<motion.div initial="hidden" whileInView="visible" viewport={{ once: true, amount: 0.25 }} variants={fadeUp} className="mt-14 grid gap-6 lg:grid-cols-[1.05fr_0.95fr]">
						<div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-6">
							<h3 className="flex items-center gap-2 text-2xl font-black text-white"><GraduationCap size={22} /> Education</h3>
							<p className="mt-5 text-lg font-semibold text-white">Indian Institute of Information Technology, Vadodara</p>
							<p className="mt-2 text-slate-300">B.Tech - Computer Science Engineering (CSE)</p>
							<p className="mt-1 text-slate-400">2024-2028</p>

							<h4 className="mt-8 text-lg font-bold text-white">Campus Involvement</h4>
							<ul className="mt-3 space-y-2 text-slate-300">
								<li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0" /> Active Member - Finance Club, IIIT Vadodara</li>
								<li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0" /> Active Member - E-Cell, IIIT Vadodara</li>
							</ul>
						</div>

						<div className="rounded-[26px] border border-white/10 bg-white/[0.02] p-6">
							<h3 className="flex items-center gap-2 text-2xl font-black text-white"><Brain size={22} /> Achievements</h3>
							<ul className="mt-5 space-y-3 text-slate-300">
								<li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0" /> Solved 500+ DSA problems across coding platforms.</li>
								<li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0" /> HackOut&apos;25 (2025), DA-IICT campus participant.</li>
								<li className="flex items-start gap-2"><ArrowRight size={14} className="mt-1 shrink-0" /> Started building Coastal Threat Alert during hackathon collaboration.</li>
							</ul>

							<div className="mt-8 rounded-2xl border border-white/10 bg-[#0b0d12] p-4">
								<p className="text-sm font-semibold uppercase tracking-[0.2em] text-slate-400">Current Focus</p>
								<p className="mt-3 text-sm leading-7 text-slate-300">Full-stack product architecture, practical AI integration, and clean backend systems.</p>
							</div>
						</div>
					</motion.div>
				</div>
			</section>

			<section className="px-4 py-24 sm:px-6">
				<div className="mx-auto grid max-w-7xl gap-10 lg:grid-cols-[0.85fr_1.15fr] lg:items-start">
					<div>
						<h2 className="text-4xl font-black text-white sm:text-5xl">
							Frequently Asked
							<br />
							<span className="font-script text-[#b7c0d4]">Questions</span>
						</h2>
					</div>
					<div className="space-y-3">
						{faqs.map((item) => (
							<details key={item.q} className="group rounded-2xl border border-white/10 bg-white/[0.01] p-5 open:bg-white/[0.03]">
								<summary className="flex cursor-pointer list-none items-center justify-between gap-4 text-lg font-semibold text-white">
									{item.q}
									<ChevronDown size={18} className="transition group-open:rotate-180" />
								</summary>
								<p className="pt-3 text-sm leading-7 text-slate-300">{item.a}</p>
							</details>
						))}
					</div>
				</div>
			</section>

			<section id="contact" className="border-t border-white/10 px-4 py-24 sm:px-6">
				<div className="mx-auto max-w-7xl">
					<div className="text-center">
						<h2 className="text-5xl font-black text-white sm:text-6xl">
							Let&apos;s build something
							<br />
							<span className="font-script text-[#b7c0d4]">meaningful.</span>
						</h2>
					</div>

					<div className="mt-14 grid gap-10 lg:grid-cols-[0.9fr_1.1fr]">
						<div className="space-y-4 text-slate-200">
							<a href="mailto:202451124@iiitvadodara.ac.in" className="portfolio-contact-link">
								<Mail size={17} /> 202451124@iiitvadodara.ac.in
							</a>
							<a href="https://github.com/Parth-star262" target="_blank" rel="noreferrer" className="portfolio-contact-link">
								<Code2 size={17} /> github.com/Parth-star262
							</a>
							<a href="https://linkedin.com/in/parth-hada" target="_blank" rel="noreferrer" className="portfolio-contact-link">
								<Link2 size={17} /> linkedin.com/in/parth-hada
							</a>
							<a href={resumeUrl} className="portfolio-contact-link" download>
								<Code2 size={17} /> Resume Download
							</a>
						</div>

						<form onSubmit={submitContact} className="rounded-[28px] border border-white/10 bg-white/[0.02] p-6">
							<label className="mb-4 block text-sm font-semibold text-slate-200">
								Name
								<input
									value={formName}
									onChange={(event) => setFormName(event.target.value)}
									required
									className="mt-2 w-full rounded-xl border border-white/12 bg-transparent px-4 py-3 text-white outline-none transition focus:border-white/30"
									placeholder="Enter your name"
								/>
							</label>
							<label className="mb-4 block text-sm font-semibold text-slate-200">
								Email
								<input
									type="email"
									value={formEmail}
									onChange={(event) => setFormEmail(event.target.value)}
									required
									className="mt-2 w-full rounded-xl border border-white/12 bg-transparent px-4 py-3 text-white outline-none transition focus:border-white/30"
									placeholder="Enter your email"
								/>
							</label>
							<label className="mb-6 block text-sm font-semibold text-slate-200">
								Message
								<textarea
									value={formMessage}
									onChange={(event) => setFormMessage(event.target.value)}
									required
									rows={5}
									className="mt-2 w-full rounded-xl border border-white/12 bg-transparent px-4 py-3 text-white outline-none transition focus:border-white/30"
									placeholder="Type your message"
								/>
							</label>
							<button type="submit" className="portfolio-pill-btn">
								Submit <ArrowUpRight size={15} />
							</button>
						</form>
					</div>
				</div>
			</section>

			<footer className="border-t border-white/10 px-4 py-10 sm:px-6">
				<div className="mx-auto flex max-w-7xl flex-col gap-3 text-sm text-slate-400 sm:flex-row sm:items-center sm:justify-between">
					<span>Parth Hada - Computer Science Student | Full-Stack & AI Developer</span>
					<div className="flex items-center gap-4">
						<a href={launchUrl} target="_blank" rel="noreferrer" className="hover:text-white">Launch DSA-Judge</a>
						<Link href="/problems" className="hover:text-white">Go to Problem Set</Link>
					</div>
				</div>
			</footer>
		</div>
	);
}
