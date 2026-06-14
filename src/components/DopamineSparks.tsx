import React, { useEffect, useState } from 'react';
import { motion, AnimatePresence } from 'motion/react';

interface Particle {
  id: number;
  x: number;
  y: number;
  color: string;
  size: number;
  emoji: string;
  rotation: number;
}

const EMOJIS = ['✨', '⭐', '🎉', '🔥', '🚀', '⚡', '🏆', '💯', '+50 XP', '+100 XP'];
const COLORS = ['#6366f1', '#10b981', '#f59e0b', '#ef4444', '#ec4899', '#8b5cf6', '#3b82f6'];

export default function DopamineSparks({ trigger }: { trigger: any }) {
  const [particles, setParticles] = useState<Particle[]>([]);

  useEffect(() => {
    if (!trigger) return;

    // Spawn particles on trigger
    const newParticles: Particle[] = Array.from({ length: 30 }).map((_, idx) => {
      const angle = Math.random() * Math.PI * 2;
      const distance = 100 + Math.random() * 160;
      const x = Math.cos(angle) * distance;
      const y = Math.sin(angle) * distance - 20; // fly outwards
      const size = 14 + Math.random() * 18;
      
      // Let's mix emojis and raw EXP tags
      let emoji = EMOJIS[Math.floor(Math.random() * (EMOJIS.length - 2))];
      if (Math.random() > 0.75) {
        emoji = trigger.includes('+50') ? '+50 XP' : trigger.includes('+100') ? '+100 XP' : '✨';
      }
      
      const color = COLORS[Math.floor(Math.random() * COLORS.length)];
      const rotation = (Math.random() - 0.5) * 720; // spin wild

      return {
        id: Date.now() + idx,
        x,
        y,
        color,
        size,
        emoji,
        rotation,
      };
    });

    setParticles(newParticles);
    
    const timer = setTimeout(() => {
      setParticles([]);
    }, 1400);

    return () => clearTimeout(timer);
  }, [trigger]);

  return (
    <div className="absolute inset-0 pointer-events-none overflow-visible z-50 flex items-center justify-center">
      <AnimatePresence>
        {particles.map((p) => (
          <motion.div
            key={p.id}
            initial={{ opacity: 1, scale: 0.1, x: 0, y: 0, rotate: 0 }}
            animate={{
              opacity: [1, 1, 0],
              scale: [0.5, 1.3, 0.5],
              x: p.x,
              y: p.y,
              rotate: p.rotation,
            }}
            exit={{ opacity: 0 }}
            transition={{
              duration: 1.2,
              ease: [0.1, 0.8, 0.3, 1], // snappy explosion
            }}
            style={{
              position: 'absolute',
              fontSize: `${p.size}px`,
              color: p.color,
              fontWeight: 'black',
              fontFamily: 'sans-serif',
              textShadow: '0 2px 10px rgba(0,0,0,0.15), 0 0 20px rgba(255,255,255,0.7)',
            }}
          >
            {p.emoji}
          </motion.div>
        ))}
      </AnimatePresence>
    </div>
  );
}
