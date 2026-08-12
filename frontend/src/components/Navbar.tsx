'use client';

import { useState } from 'react';
import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { AnimatePresence, motion } from 'framer-motion';
import {
  Bot,
  Code2,
  LogOut,
  Menu,
  Shield,
  Sparkles,
  Trophy,
  User,
  X,
  Zap,
} from 'lucide-react';
import { useAuth } from '@/contexts/AuthContext';

const portfolioLinks = [
  { name: 'Home', href: '#home' },
  { name: 'About', href: '#about' },
  { name: 'Skills', href: '#skills' },
  { name: 'Projects', href: '#projects' },
  { name: 'Education', href: '#education' },
  { name: 'Contact', href: '#contact' },
];

const appLinks = [
  { name: 'Problems', href: '/problems', icon: Code2 },
  { name: 'AI Coach', href: '/interview', icon: Sparkles },
  { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
];

export default function Navbar() {
  const { user, logout, enroll, isEnrolled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();
  const [mobileOpen, setMobileOpen] = useState(false);
  const isPortfolio = pathname === '/';

  const closeMobile = () => setMobileOpen(false);

  const handleLogout = () => {
    logout();
    closeMobile();
    router.push('/');
  };

  const handleEnroll = async () => {
    const res = await enroll();
    if (!res.ok) {
      alert(res.message || 'Enrollment failed');
      if ((res.message || '').toLowerCase().includes('login')) {
        router.push('/login');
      }
    }
  };

  const brand = isPortfolio ? (
    <Link href="/" className="flex items-center gap-3 group" onClick={closeMobile}>
      <div className="flex h-10 w-10 items-center justify-center rounded-lg bg-white text-[#0b1428] shadow-sm transition group-hover:-translate-y-0.5">
        <Code2 size={22} />
      </div>
      <div className="leading-tight">
        <div className="text-base font-black text-white">Parth Hada</div>
        <div className="text-xs font-semibold text-slate-300">Full-stack & AI developer</div>
      </div>
    </Link>
  ) : (
    <Link href="/" className="flex items-center gap-3 group" onClick={closeMobile}>
      <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
        <div className="w-full h-full bg-[#070818] rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
          <Code2 size={22} className="text-indigo-400 group-hover:text-white transition-colors" />
        </div>
      </div>
      <span className="font-extrabold text-xl font-['Outfit'] tracking-tight text-white">
        DSA<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Judge</span>
      </span>
    </Link>
  );

  return (
    <header className={`sticky top-0 z-50 w-full border-b backdrop-blur-2xl ${
      isPortfolio
        ? 'border-white/10 bg-[#070c18]/88 text-white'
        : 'border-white/10 bg-[#030014]/80 text-white supports-[backdrop-filter]:bg-[#030014]/60'
    }`}>
      <div className="mx-auto flex h-16 max-w-7xl items-center justify-between px-4 sm:px-6">
        {brand}

        {isPortfolio ? (
          <nav className="hidden items-center gap-1 md:flex">
            {portfolioLinks.map((link) => (
              <a key={link.href} href={link.href} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 transition hover:bg-white/10 hover:text-white">
                {link.name}
              </a>
            ))}
          </nav>
        ) : (
          <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/10 backdrop-blur-md">
            {appLinks.map((link) => {
              const Icon = link.icon;
              const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
              return (
                <Link
                  key={link.href}
                  href={link.href}
                  className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                    isActive ? 'text-white' : 'text-slate-400 hover:text-slate-200'
                  }`}
                >
                  {isActive && (
                    <motion.div
                      layoutId="activeNav"
                      className="absolute inset-0 bg-gradient-to-r from-indigo-600/80 to-purple-600/80 rounded-full shadow-md shadow-indigo-500/25"
                      transition={{ type: 'spring', stiffness: 380, damping: 30 }}
                    />
                  )}
                  <span className="relative z-10 flex items-center gap-2">
                    <Icon size={15} className={isActive ? 'text-white' : 'text-slate-400'} />
                    {link.name}
                  </span>
                </Link>
              );
            })}

            {user?.role === 'ADMIN' && (
              <Link
                href="/admin"
                className={`relative px-4 py-1.5 rounded-full text-sm font-semibold transition-all duration-300 flex items-center gap-2 ${
                  pathname.startsWith('/admin') ? 'text-amber-300' : 'text-amber-400/80 hover:text-amber-300'
                }`}
              >
                <Shield size={15} />
                Admin
              </Link>
            )}
          </nav>
        )}

        <div className="hidden items-center gap-2 md:flex">
          {isPortfolio ? (
            <>
              <a href="https://github.com/Parth-star262" target="_blank" rel="noreferrer" className="inline-flex h-10 w-10 items-center justify-center rounded-lg border border-white/20 bg-white/5 text-white transition hover:bg-white/12" aria-label="GitHub profile">
                <Code2 size={18} />
              </a>
              <a href="mailto:202451124@iiitvadodara.ac.in?subject=Resume%20Request%20from%20Portfolio" className="btn-primary rounded-lg px-4 py-2 text-sm">Request Resume</a>
            </>
          ) : user ? (
            <>
              {!isEnrolled ? (
                <button
                  onClick={handleEnroll}
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 via-purple-500 to-pink-500 text-white text-xs font-extrabold shadow-lg shadow-indigo-500/30 hover:shadow-indigo-500/50 hover:scale-[1.03] active:scale-[0.98] transition-all cursor-pointer"
                >
                  <Zap size={14} className="fill-current text-amber-300" />
                  Enroll Free
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-emerald-500/10 border border-emerald-500/20 text-emerald-400 text-xs font-semibold">
                  <Sparkles size={13} className="text-emerald-400" /> Pro Member
                </div>
              )}

              <Link href="/profile" className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors">
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-200">{user.name}</span>
              </Link>

              <button onClick={handleLogout} className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors" title="Logout">
                <LogOut size={17} />
              </button>
            </>
          ) : (
            <>
              <Link href="/login" className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-colors">
                Sign In
              </Link>
              <Link href="/register" className="btn-primary py-1.5 px-4 text-xs font-bold">
                Get Started
              </Link>
            </>
          )}
        </div>

        <button
          type="button"
          onClick={() => setMobileOpen((open) => !open)}
          className={`inline-flex h-10 w-10 items-center justify-center rounded-lg border md:hidden ${
            isPortfolio ? 'border-white/20 bg-white/5 text-white' : 'border-white/10 bg-white/[0.04] text-white'
          }`}
          aria-label="Toggle navigation"
        >
          {mobileOpen ? <X size={20} /> : <Menu size={20} />}
        </button>
      </div>

      <AnimatePresence>
        {mobileOpen && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: 'auto', opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            className={`overflow-hidden border-t md:hidden ${isPortfolio ? 'border-white/10 bg-[#0b1428]' : 'border-white/10 bg-[#07091b]'}`}
          >
            <div className="mx-auto max-w-7xl px-4 py-3">
              {isPortfolio ? (
                <div className="grid gap-1">
                  {portfolioLinks.map((link) => (
                    <a key={link.href} href={link.href} onClick={closeMobile} className="rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/10 hover:text-white">
                      {link.name}
                    </a>
                  ))}
                  <Link href="/problems" onClick={closeMobile} className="btn-primary mt-2 rounded-lg py-2">
                    <Bot size={16} />
                    <span>Launch DSA Judge</span>
                  </Link>
                </div>
              ) : (
                <div className="grid gap-1">
                  {appLinks.map((link) => {
                    const Icon = link.icon;
                    return (
                      <Link key={link.href} href={link.href} onClick={closeMobile} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-slate-300 hover:bg-white/[0.06] hover:text-white">
                        <Icon size={16} />
                        {link.name}
                      </Link>
                    );
                  })}
                  {user?.role === 'ADMIN' && (
                    <Link href="/admin" onClick={closeMobile} className="flex items-center gap-2 rounded-lg px-3 py-2 text-sm font-semibold text-amber-300 hover:bg-white/[0.06]">
                      <Shield size={16} />
                      Admin
                    </Link>
                  )}
                  {user ? (
                    <button onClick={handleLogout} className="mt-2 flex items-center gap-2 rounded-lg px-3 py-2 text-left text-sm font-semibold text-red-300 hover:bg-red-500/10">
                      <LogOut size={16} />
                      Logout
                    </button>
                  ) : (
                    <div className="mt-2 grid grid-cols-2 gap-2">
                      <Link href="/login" onClick={closeMobile} className="btn-ghost rounded-lg py-2 text-sm">Sign In</Link>
                      <Link href="/register" onClick={closeMobile} className="btn-primary rounded-lg py-2 text-sm">Get Started</Link>
                    </div>
                  )}
                </div>
              )}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </header>
  );
}
