'use client';

import { motion } from 'framer-motion';
import { useEffect, useState } from 'react';

export default function LiveBackground() {
  const [mounted, setMounted] = useState(false);
  const [stars, setStars] = useState<{
    width: number;
    height: number;
    left: string;
    top: string;
    duration: number;
    delay: number;
  }[]>([]);
  
  useEffect(() => {
    let alive = true;
    Promise.resolve().then(() => {
      if (alive) {
        setMounted(true);
        setStars(Array.from({ length: 40 }).map(() => ({
          width: Math.random() * 3 + 1,
          height: Math.random() * 3 + 1,
          left: `${Math.random() * 100}%`,
          top: `${Math.random() * 100}%`,
          duration: Math.random() * 5 + 5,
          delay: Math.random() * 5,
        })));
      }
    });
    return () => {
      alive = false;
    };
  }, []);

  if (!mounted) return null;

  return (
    <div className="fixed inset-0 z-[-1] overflow-hidden bg-[#030014] pointer-events-none selection:bg-transparent">
      {/* Morphing Orbs - Slow, elegant live wallpaper feel */}
      <motion.div
        animate={{
          scale: [1, 1.2, 1],
          x: [0, 150, -50, 0],
          y: [0, -100, 100, 0],
        }}
        transition={{ duration: 25, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[-20%] left-[-10%] w-[60vw] h-[60vw] rounded-full bg-purple-600/15 blur-[120px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.5, 1],
          x: [0, -200, 100, 0],
          y: [0, 150, -50, 0],
        }}
        transition={{ duration: 30, repeat: Infinity, ease: "easeInOut" }}
        className="absolute bottom-[-20%] right-[-10%] w-[70vw] h-[70vw] rounded-full bg-indigo-600/15 blur-[140px]"
      />
      <motion.div
        animate={{
          scale: [1, 1.3, 1],
          x: [0, 100, -150, 0],
          y: [0, 50, -100, 0],
        }}
        transition={{ duration: 20, repeat: Infinity, ease: "easeInOut" }}
        className="absolute top-[30%] left-[30%] w-[50vw] h-[50vw] rounded-full bg-blue-600/10 blur-[130px]"
      />
      
      {/* Subtle Digital Grid Overlay */}
      <div className="absolute inset-0 bg-[linear-gradient(to_right,#8080800a_1px,transparent_1px),linear-gradient(to_bottom,#8080800a_1px,transparent_1px)] bg-[size:40px_40px] [mask-image:radial-gradient(ellipse_100%_100%_at_50%_50%,#000_10%,transparent_80%)]" />

      {/* Floating Star Particles */}
      {stars.map((star, i) => (
        <motion.div
          key={i}
          className="absolute rounded-full bg-white/40 shadow-[0_0_10px_#fff]"
          style={{ width: star.width, height: star.height, left: star.left, top: star.top }}
          animate={{
            y: [0, -100],
            opacity: [0, 1, 0],
          }}
          transition={{
            duration: star.duration,
            repeat: Infinity,
            delay: star.delay,
            ease: "linear",
          }}
        />
      ))}
    </div>
  );
}
