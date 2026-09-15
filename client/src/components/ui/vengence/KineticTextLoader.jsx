import { useState, useEffect } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { Loader2 } from 'lucide-react';

export default function KineticTextLoader({
  messages = [
    'Synchronizing Campus Telemetry...',
    'Verifying Hostel Room Balances...',
    'Connecting Real-time Emergency Beacon...',
    'Reconciling Two-Tier Audit Records...',
  ],
  interval = 2200,
  className = '',
}) {
  const [index, setIndex] = useState(0);

  useEffect(() => {
    const timer = setInterval(() => {
      setIndex((prev) => (prev + 1) % messages.length);
    }, interval);
    return () => clearInterval(timer);
  }, [messages.length, interval]);

  return (
    <div className={`flex items-center gap-3 select-none ${className}`}>
      <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
        <Loader2 className="w-5 h-5 animate-spin" />
      </div>

      <div className="relative h-6 overflow-hidden min-w-[240px]">
        <AnimatePresence mode="wait">
          <motion.p
            key={index}
            initial={{ y: 20, opacity: 0 }}
            animate={{ y: 0, opacity: 1 }}
            exit={{ y: -20, opacity: 0 }}
            transition={{ duration: 0.35, ease: 'easeInOut' }}
            className="text-xs sm:text-sm font-bold text-slate-300 truncate"
          >
            {messages[index]}
          </motion.p>
        </AnimatePresence>
      </div>
    </div>
  );
}
