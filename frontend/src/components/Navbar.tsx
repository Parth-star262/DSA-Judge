'use client';

import Link from 'next/link';
import { usePathname, useRouter } from 'next/navigation';
import { useAuth } from '@/contexts/AuthContext';
import { Code2, LogOut, User, Zap, Sparkles, Trophy, LayoutDashboard, Shield } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout, enroll, isEnrolled } = useAuth();
  const router = useRouter();
  const pathname = usePathname();

  const handleLogout = () => {
    logout();
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

  const navLinks = [
    { name: 'Problems', href: '/problems', icon: Code2 },
    { name: 'AI Coach', href: '/interview', icon: Sparkles },
    { name: 'Leaderboard', href: '/leaderboard', icon: Trophy },
  ];

  return (
    <header className="sticky top-0 z-50 w-full border-b border-white/10 bg-[#030014]/80 backdrop-blur-2xl supports-[backdrop-filter]:bg-[#030014]/60">
      <div className="max-w-7xl mx-auto px-4 sm:px-6 h-16 flex items-center justify-between">
        
        {/* Brand Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-10 h-10 rounded-xl bg-gradient-to-tr from-indigo-600 via-purple-600 to-pink-500 p-[1px] shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-all duration-300">
            <div className="w-full h-full bg-[#070818] rounded-[11px] flex items-center justify-center group-hover:bg-transparent transition-colors">
              <Code2 size={22} className="text-indigo-400 group-hover:text-white transition-colors" />
            </div>
          </div>
          <div className="flex flex-col">
            <span className="font-extrabold text-xl font-['Outfit'] tracking-tight text-white flex items-center gap-1">
              DSA<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 via-purple-400 to-pink-400">Judge</span>
              <span className="px-1.5 py-0.5 rounded text-[10px] font-extrabold bg-indigo-500/20 text-indigo-300 border border-indigo-500/30">PRO</span>
            </span>
          </div>
        </Link>

        {/* Navigation Links */}
        <nav className="hidden md:flex items-center gap-1 bg-white/[0.03] p-1 rounded-full border border-white/10 backdrop-blur-md">
          {navLinks.map((link) => {
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

        {/* Actions & User State */}
        <div className="flex items-center gap-3">
          {user ? (
            <div className="flex items-center gap-3">
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

              <Link
                href="/profile"
                className="flex items-center gap-2 px-3 py-1.5 rounded-full bg-white/[0.04] hover:bg-white/[0.08] border border-white/10 transition-colors"
              >
                <div className="w-6 h-6 rounded-full bg-gradient-to-tr from-indigo-500 to-purple-600 flex items-center justify-center text-white text-xs font-bold shadow-inner">
                  {user.name ? user.name.charAt(0).toUpperCase() : <User size={12} />}
                </div>
                <span className="hidden sm:block text-xs font-semibold text-slate-200">{user.name}</span>
              </Link>

              <button
                onClick={handleLogout}
                className="p-2 rounded-full text-slate-400 hover:text-red-400 hover:bg-red-500/10 transition-colors"
                title="Logout"
              >
                <LogOut size={17} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2">
              <Link href="/login">
                <button className="text-xs font-semibold text-slate-300 hover:text-white px-4 py-2 rounded-full hover:bg-white/5 transition-colors cursor-pointer">
                  Sign In
                </button>
              </Link>
              <Link href="/register">
                <button className="btn-primary py-1.5 px-4 text-xs font-bold cursor-pointer">
                  Get Started
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>

      {/* Mobile Sub-Navigation Bar */}
      <div className="md:hidden flex items-center justify-around border-t border-white/5 px-2 py-2 bg-[#07091b]">
        {navLinks.map((link) => {
          const Icon = link.icon;
          const isActive = pathname === link.href || pathname.startsWith(`${link.href}/`);
          return (
            <Link
              key={link.href}
              href={link.href}
              className={`flex items-center gap-1.5 px-3 py-1.5 rounded-lg text-xs font-semibold ${
                isActive ? 'text-indigo-400 bg-indigo-500/10' : 'text-slate-400'
              }`}
            >
              <Icon size={14} />
              {link.name}
            </Link>
          );
        })}
      </div>
    </header>
  );
}
