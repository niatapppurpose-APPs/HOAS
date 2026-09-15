import { useState } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronRight, ChevronLeft } from 'lucide-react';

export default function ElasticStack({
  items = [
    { id: 1, title: 'Live Emergency Location Broadcast', desc: 'Instant SOS tracking with warden sirens and sub-second beacon telemetry.', badge: 'Campus Safety' },
    { id: 2, title: 'Two-Tier Fee Verification', desc: 'Warden first-pass review and Management audit ensure 100% financial reconciliation.', badge: 'Finances' },
    { id: 3, title: 'Digital Gate Passes & Outings', desc: 'QR-coded leave passes approved by block wardens with parent SMS notifications.', badge: 'Gate Security' },
  ],
  className = '',
}) {
  const [cards, setCards] = useState(items);

  const handleNext = () => {
    setCards((prev) => {
      const copy = [...prev];
      const first = copy.shift();
      if (first) copy.push(first);
      return copy;
    });
  };

  const handlePrev = () => {
    setCards((prev) => {
      const copy = [...prev];
      const last = copy.pop();
      if (last) copy.unshift(last);
      return copy;
    });
  };

  return (
    <div className={`relative flex flex-col items-center justify-center p-4 ${className}`}>
      {/* Cards Stack */}
      <div className="relative w-full max-w-sm h-64">
        <AnimatePresence>
          {cards.slice(0, 3).map((item, index) => {
            const isTop = index === 0;
            return (
              <motion.div
                key={item.id}
                initial={{ scale: 0.9, y: index * 14, opacity: 0.7 }}
                animate={{
                  scale: 1 - index * 0.05,
                  y: index * 14,
                  opacity: 1 - index * 0.2,
                  zIndex: 30 - index,
                }}
                exit={{ x: 200, opacity: 0, scale: 0.8 }}
                transition={{ type: 'spring', stiffness: 260, damping: 20 }}
                className="absolute inset-0 p-6 rounded-3xl border shadow-xl backdrop-blur-xl flex flex-col justify-between"
                style={{
                  backgroundColor: 'var(--bg-modal, #0f172a)',
                  borderColor: isTop ? 'rgba(99, 102, 241, 0.5)' : 'rgba(255, 255, 255, 0.08)',
                }}
              >
                <div>
                  {item.badge && (
                    <span className="px-2.5 py-0.5 rounded-full text-[10px] font-black uppercase tracking-wider bg-indigo-500/15 text-indigo-400 border border-indigo-500/20">
                      {item.badge}
                    </span>
                  )}
                  <h4 className="text-base font-bold mt-3" style={{ color: 'var(--text-primary)' }}>
                    {item.title}
                  </h4>
                  <p className="text-xs text-slate-400 mt-2 leading-relaxed">{item.desc}</p>
                </div>

                <div className="flex items-center justify-between pt-3 border-t border-white/5 text-xs text-slate-500 font-semibold">
                  <span>Card {index + 1} of {cards.length}</span>
                  {isTop && <span className="text-indigo-400 font-bold">Active Feature</span>}
                </div>
              </motion.div>
            );
          })}
        </AnimatePresence>
      </div>

      {/* Navigation Buttons */}
      <div className="flex items-center gap-3 mt-8 z-40">
        <button
          type="button"
          onClick={handlePrev}
          className="p-2.5 rounded-2xl border border-white/10 hover:border-indigo-500/40 bg-white/5 text-slate-300 hover:text-white transition shadow-sm"
          aria-label="Previous card"
        >
          <ChevronLeft className="w-4 h-4" />
        </button>
        <button
          type="button"
          onClick={handleNext}
          className="p-2.5 rounded-2xl border border-white/10 hover:border-indigo-500/40 bg-white/5 text-slate-300 hover:text-white transition shadow-sm"
          aria-label="Next card"
        >
          <ChevronRight className="w-4 h-4" />
        </button>
      </div>
    </div>
  );
}
