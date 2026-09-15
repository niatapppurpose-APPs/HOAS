import { useState, useRef, useId } from 'react';
import { motion, AnimatePresence } from 'framer-motion';

export default function Tooltip({
  content,
  shortcut,
  children,
  side = 'top',
  delay = 150,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const timerRef = useRef(null);
  const id = useId();

  if (!content) return children;

  const handleMouseEnter = () => {
    timerRef.current = setTimeout(() => setIsOpen(true), delay);
  };

  const handleMouseLeave = () => {
    clearTimeout(timerRef.current);
    setIsOpen(false);
  };

  const positionClasses = {
    top: 'bottom-full left-1/2 -translate-x-1/2 mb-2',
    bottom: 'top-full left-1/2 -translate-x-1/2 mt-2',
    left: 'right-full top-1/2 -translate-y-1/2 mr-2',
    right: 'left-full top-1/2 -translate-y-1/2 ml-2',
  };

  const arrowClasses = {
    top: 'top-full left-1/2 -translate-x-1/2 border-t-slate-900 border-x-transparent border-b-transparent border-t-4 border-x-4',
    bottom: 'bottom-full left-1/2 -translate-x-1/2 border-b-slate-900 border-x-transparent border-t-transparent border-b-4 border-x-4',
    left: 'left-full top-1/2 -translate-y-1/2 border-l-slate-900 border-y-transparent border-r-transparent border-l-4 border-y-4',
    right: 'right-full top-1/2 -translate-y-1/2 border-r-slate-900 border-y-transparent border-l-transparent border-r-4 border-y-4',
  };

  return (
    <span
      className="relative inline-flex"
      onMouseEnter={handleMouseEnter}
      onMouseLeave={handleMouseLeave}
    >
      <span
        aria-describedby={isOpen ? id : undefined}
        onFocus={() => setIsOpen(true)}
        onBlur={() => setIsOpen(false)}
        className="inline-flex"
      >
        {children}
      </span>

      <AnimatePresence>
        {isOpen && (
          <motion.div
            id={id}
            role="tooltip"
            initial={{ opacity: 0, scale: 0.9, y: side === 'top' ? 4 : side === 'bottom' ? -4 : 0 }}
            animate={{ opacity: 1, scale: 1, y: 0 }}
            exit={{ opacity: 0, scale: 0.95 }}
            transition={{ duration: 0.15, ease: 'easeOut' }}
            className={`pointer-events-none absolute z-[9999] flex items-center gap-1.5 whitespace-nowrap rounded-xl bg-slate-900 px-3 py-1.5 text-xs font-medium text-slate-100 shadow-[0_10px_25px_rgba(0,0,0,0.5)] border border-slate-800 ${positionClasses[side] || positionClasses.top} ${className}`}
          >
            <span>{content}</span>
            {shortcut && (
              <kbd className="ml-1 px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-semibold text-slate-400 border border-white/10">
                {shortcut}
              </kbd>
            )}
            <div className={`absolute w-0 h-0 pointer-events-none ${arrowClasses[side] || arrowClasses.top}`} />
          </motion.div>
        )}
      </AnimatePresence>
    </span>
  );
}
