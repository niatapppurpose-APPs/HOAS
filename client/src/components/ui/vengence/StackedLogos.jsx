import { useState } from 'react';

export default function StackedLogos({
  items = [
    { name: 'Dr. Ramesh Kumar', role: 'Chief Warden', initial: 'RK', bg: 'bg-indigo-600' },
    { name: 'Prof. Sunita Rao', role: 'Hostel Dean', initial: 'SR', bg: 'bg-emerald-600' },
    { name: 'Admin Security Team', role: 'Security Desk', initial: 'ST', bg: 'bg-blue-600' },
    { name: 'Student Council', role: 'Hostel Reps', initial: 'SC', bg: 'bg-purple-600' },
  ],
  extraCount = 14,
  className = '',
}) {
  const [hoveredIdx, setHoveredIdx] = useState(null);

  return (
    <div className={`flex items-center select-none ${className}`}>
      <div className="flex items-center -space-x-2.5">
        {items.map((item, idx) => {
          const isHovered = hoveredIdx === idx;
          return (
            <div
              key={item.name || idx}
              onMouseEnter={() => setHoveredIdx(idx)}
              onMouseLeave={() => setHoveredIdx(null)}
              className="relative transition-all duration-200"
              style={{
                zIndex: isHovered ? 40 : items.length - idx,
                transform: isHovered ? 'translateY(-4px) scale(1.1)' : 'none',
              }}
            >
              {item.avatar ? (
                <img
                  src={item.avatar}
                  alt={item.name}
                  className="w-9 h-9 rounded-full ring-2 ring-slate-900 object-cover shadow-md"
                />
              ) : (
                <div
                  className={`w-9 h-9 rounded-full ring-2 ring-slate-900 flex items-center justify-center text-xs font-black text-white shadow-md ${
                    item.bg || 'bg-indigo-600'
                  }`}
                >
                  {item.initial || item.name.charAt(0)}
                </div>
              )}

              {/* Tooltip on hover */}
              {isHovered && (
                <div className="absolute bottom-full left-1/2 -translate-x-1/2 mb-2 px-2.5 py-1 rounded-xl bg-slate-900 text-white text-[11px] font-bold whitespace-nowrap shadow-xl border border-slate-700 pointer-events-none z-50 animate-in fade-in zoom-in-95 duration-150">
                  <p>{item.name}</p>
                  {item.role && <p className="text-[10px] text-slate-400 font-normal">{item.role}</p>}
                </div>
              )}
            </div>
          );
        })}

        {/* Extra Count Pill */}
        {extraCount > 0 && (
          <div className="relative z-0">
            <div className="w-9 h-9 rounded-full ring-2 ring-slate-900 bg-slate-800 text-slate-300 flex items-center justify-center text-xs font-black border border-white/10 shadow-md">
              +{extraCount}
            </div>
          </div>
        )}
      </div>
    </div>
  );
}
