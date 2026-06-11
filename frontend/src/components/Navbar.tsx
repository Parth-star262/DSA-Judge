'use client';

import Link from 'next/link';
import { useAuth } from '@/contexts/AuthContext';
import { useRouter } from 'next/navigation';
import { Code2, LogOut, User, Zap, Sparkles } from 'lucide-react';
import { motion } from 'framer-motion';

export default function Navbar() {
  const { user, logout, enroll, isEnrolled } = useAuth();
  const router = useRouter();

  const handleLogout = () => { logout(); router.push('/'); };
  const handleEnroll = async () => {
    const res = await enroll();
    if (!res.ok) {
      alert(res.message || 'Enrollment failed');
      if ((res.message || '').toLowerCase().includes('login')) {
        router.push('/login');
      }
    }
  };

  return (
    <nav className="sticky top-0 z-50 w-full border-b border-white/5 bg-[#030014]/70 backdrop-blur-xl supports-[backdrop-filter]:bg-[#030014]/50">
      <div className="max-w-7xl mx-auto px-6 h-16 flex items-center justify-between">
        
        {/* Logo */}
        <Link href="/" className="flex items-center gap-3 group">
          <div className="w-9 h-9 rounded-xl bg-gradient-to-br from-indigo-500 to-purple-600 flex items-center justify-center shadow-lg shadow-indigo-500/20 group-hover:shadow-indigo-500/40 transition-shadow duration-300">
            <Code2 size={20} className="text-white" />
          </div>
          <span className="font-extrabold text-xl font-['Outfit'] tracking-tight text-white group-hover:text-indigo-100 transition-colors">
            DSA<span className="text-transparent bg-clip-text bg-gradient-to-r from-indigo-400 to-purple-400 group-hover:from-indigo-300 group-hover:to-purple-300">Judge</span>
          </span>
        </Link>

        {/* Links & Actions */}
        <div className="flex items-center gap-2 sm:gap-4">
          <Link 
            href="/problems" 
            className="text-sm font-medium text-slate-300 hover:text-white px-3 py-2 rounded-lg hover:bg-white/5 transition-all duration-200"
          >
            Problems
          </Link>
          {user?.role === 'ADMIN' && (
            <Link
              href="/admin"
              className="text-sm font-medium text-amber-300 hover:text-white px-3 py-2 rounded-lg hover:bg-amber-500/10 transition-all duration-200"
            >
              Admin
            </Link>
          )}

          {user ? (
            <div className="flex items-center gap-3 pl-2 sm:pl-4 border-l border-white/10">
              {!isEnrolled ? (
                <button 
                  onClick={handleEnroll} 
                  className="hidden sm:flex items-center gap-1.5 px-4 py-1.5 rounded-full bg-gradient-to-r from-indigo-500 to-purple-500 hover:from-indigo-400 hover:to-purple-400 text-white text-sm font-semibold shadow-[0_0_15px_rgba(99,102,241,0.3)] hover:shadow-[0_0_20px_rgba(99,102,241,0.5)] transition-all transform hover:-translate-y-0.5"
                >
                  <Zap size={14} className="fill-current" /> Enroll Free
                </button>
              ) : (
                <div className="hidden sm:flex items-center gap-1.5 px-3 py-1 rounded-full bg-indigo-500/10 border border-indigo-500/20 text-indigo-300 text-xs font-semibold shadow-inner">
                  <Sparkles size={12} className="text-indigo-400" /> Enrolled
                </div>
              )}

              <Link 
                href="/profile" 
                className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-sm font-medium text-slate-300 hover:text-white hover:bg-white/5 transition-colors border border-transparent hover:border-white/5"
              >
                <div className="w-6 h-6 rounded-full bg-indigo-500/20 flex items-center justify-center border border-indigo-500/30">
                  <User size={12} className="text-indigo-300" />
                </div>
                <span className="hidden sm:block">{user.name}</span>
              </Link>
              
              <button 
                onClick={handleLogout} 
                className="p-2 rounded-lg text-slate-400 hover:text-red-400 hover:bg-red-400/10 transition-colors"
                title="Logout"
              >
                <LogOut size={16} />
              </button>
            </div>
          ) : (
            <div className="flex items-center gap-2 sm:gap-3 pl-2 sm:pl-4 border-l border-white/10">
              <Link href="/login">
                <button className="text-sm font-medium text-slate-300 hover:text-white px-3 sm:px-4 py-2 rounded-lg hover:bg-white/5 transition-colors">
                  Login
                </button>
              </Link>
              <Link href="/register">
                <button className="text-sm font-semibold text-white bg-white/10 hover:bg-white/15 border border-white/10 px-4 py-2 rounded-full backdrop-blur-sm transition-all shadow-[0_4px_10px_rgba(0,0,0,0.2)] hover:shadow-[0_4px_15px_rgba(255,255,255,0.1)]">
                  Sign Up
                </button>
              </Link>
            </div>
          )}
        </div>
      </div>
    </nav>
  );
}
