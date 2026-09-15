import { useState, useRef, useEffect } from 'react';
import { MoreVertical } from 'lucide-react';

export default function ContextMenu({
  items = [], // [{ label, icon: Component, onClick, danger, shortcut, divider }]
  trigger,
  className = '',
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [menuPosition, setMenuPosition] = useState({ top: 0, left: 0 });
  const menuRef = useRef(null);

  // Close on outside click
  useEffect(() => {
    const handleClickOutside = (e) => {
      if (menuRef.current && !menuRef.current.contains(e.target)) {
        setIsOpen(false);
      }
    };
    const handleKeyDown = (e) => {
      if (e.key === 'Escape') setIsOpen(false);
    };

    if (isOpen) {
      document.addEventListener('mousedown', handleClickOutside);
      document.addEventListener('keydown', handleKeyDown);
    }
    return () => {
      document.removeEventListener('mousedown', handleClickOutside);
      document.removeEventListener('keydown', handleKeyDown);
    };
  }, [isOpen]);

  const handleTriggerClick = (e) => {
    e.stopPropagation();
    const rect = e.currentTarget.getBoundingClientRect();
    const spaceBelow = window.innerHeight - rect.bottom;
    const top = spaceBelow < 220 ? rect.top - 200 : rect.bottom + 6;
    const left = Math.min(rect.left, window.innerWidth - 220);

    setMenuPosition({ top, left });
    setIsOpen(!isOpen);
  };

  const handleItemClick = (item, e) => {
    e.stopPropagation();
    setIsOpen(false);
    if (item.onClick) item.onClick();
  };

  return (
    <div className={`relative inline-flex ${className}`}>
      {trigger ? (
        <div onClick={handleTriggerClick} className="cursor-pointer">
          {trigger}
        </div>
      ) : (
        <button
          type="button"
          onClick={handleTriggerClick}
          className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
          aria-label="Open context menu"
        >
          <MoreVertical className="w-4 h-4" />
        </button>
      )}

      {isOpen && (
        <div
          ref={menuRef}
          role="menu"
          className="fixed z-[99999] min-w-[200px] rounded-2xl border shadow-[0_15px_40px_rgba(0,0,0,0.5)] p-1.5 backdrop-blur-xl animate-in fade-in zoom-in-95 duration-150"
          style={{
            top: `${menuPosition.top}px`,
            left: `${menuPosition.left}px`,
            backgroundColor: 'var(--bg-modal, #0f172a)',
            borderColor: 'var(--border-primary, rgba(255,255,255,0.12))',
          }}
        >
          {items.map((item, idx) => {
            if (item.divider) {
              return (
                <div
                  key={`div-${idx}`}
                  className="my-1 border-t"
                  style={{ borderColor: 'var(--border-primary, rgba(255,255,255,0.08))' }}
                />
              );
            }

            const IconComp = item.icon;

            return (
              <button
                key={item.label || idx}
                type="button"
                role="menuitem"
                disabled={item.disabled}
                onClick={(e) => handleItemClick(item, e)}
                className={`w-full flex items-center justify-between px-3 py-2 rounded-xl text-xs font-semibold transition ${
                  item.danger
                    ? 'text-red-400 hover:bg-red-500/15 hover:text-red-300'
                    : 'text-slate-300 hover:bg-white/10 hover:text-white'
                } ${item.disabled ? 'opacity-40 pointer-events-none' : ''}`}
              >
                <div className="flex items-center gap-2.5">
                  {IconComp && <IconComp className="w-4 h-4 flex-shrink-0" />}
                  <span>{item.label}</span>
                </div>
                {item.shortcut && (
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 text-[10px] font-mono text-slate-400">
                    {item.shortcut}
                  </kbd>
                )}
              </button>
            );
          })}
        </div>
      )}
    </div>
  );
}
