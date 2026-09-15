import { useState, useMemo } from 'react';
import { ChevronLeft, ChevronRight, Calendar as CalendarIcon } from 'lucide-react';

const DAYS = ['Su', 'Mo', 'Tu', 'We', 'Th', 'Fr', 'Sa'];
const MONTHS = [
  'January', 'February', 'March', 'April', 'May', 'June',
  'July', 'August', 'September', 'October', 'November', 'December'
];

export default function CalendarPicker({
  value,
  onChange,
  isRange = false,
  rangeStart,
  rangeEnd,
  onRangeChange,
  eventDates = [], // array of { date: 'YYYY-MM-DD', color: 'emerald' | 'amber' | 'red' | 'blue' }
  className = '',
}) {
  const [currentDate, setCurrentDate] = useState(() => {
    if (value) return new Date(value);
    if (rangeStart) return new Date(rangeStart);
    return new Date();
  });

  const year = currentDate.getFullYear();
  const month = currentDate.getMonth();

  const prevMonth = () => {
    setCurrentDate(new Date(year, month - 1, 1));
  };

  const nextMonth = () => {
    setCurrentDate(new Date(year, month + 1, 1));
  };

  const daysInMonth = new Date(year, month + 1, 0).getDate();
  const firstDayIndex = new Date(year, month, 1).getDay();

  const todayStr = useMemo(() => {
    const t = new Date();
    return `${t.getFullYear()}-${String(t.getMonth() + 1).padStart(2, '0')}-${String(t.getDate()).padStart(2, '0')}`;
  }, []);

  const eventMap = useMemo(() => {
    const map = {};
    eventDates.forEach((ev) => {
      map[ev.date] = ev.color || 'blue';
    });
    return map;
  }, [eventDates]);

  const handleDateClick = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;

    if (!isRange) {
      if (onChange) onChange(dateStr);
      return;
    }

    if (!rangeStart || (rangeStart && rangeEnd)) {
      if (onRangeChange) onRangeChange({ start: dateStr, end: null });
    } else {
      if (new Date(dateStr) < new Date(rangeStart)) {
        if (onRangeChange) onRangeChange({ start: dateStr, end: rangeStart });
      } else {
        if (onRangeChange) onRangeChange({ start: rangeStart, end: dateStr });
      }
    }
  };

  const isSelected = (dayNum) => {
    const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
    if (!isRange) return value === dateStr;
    return rangeStart === dateStr || rangeEnd === dateStr;
  };

  const isInRange = (dayNum) => {
    if (!isRange || !rangeStart || !rangeEnd) return false;
    const current = new Date(year, month, dayNum).getTime();
    return current > new Date(rangeStart).getTime() && current < new Date(rangeEnd).getTime();
  };

  // Quick preset shortcuts
  const applyPreset = (type) => {
    const now = new Date();
    const fmt = (d) => `${d.getFullYear()}-${String(d.getMonth() + 1).padStart(2, '0')}-${String(d.getDate()).padStart(2, '0')}`;

    if (type === 'today') {
      const s = fmt(now);
      if (isRange && onRangeChange) onRangeChange({ start: s, end: s });
      else if (onChange) onChange(s);
      setCurrentDate(now);
    } else if (type === 'week') {
      const end = new Date(now);
      end.setDate(now.getDate() + 7);
      if (isRange && onRangeChange) onRangeChange({ start: fmt(now), end: fmt(end) });
      setCurrentDate(now);
    } else if (type === 'month') {
      const end = new Date(now.getFullYear(), now.getMonth() + 1, 0);
      if (isRange && onRangeChange) onRangeChange({ start: fmt(now), end: fmt(end) });
      setCurrentDate(now);
    }
  };

  return (
    <div
      className={`p-4 sm:p-5 rounded-3xl border shadow-xl backdrop-blur-xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-modal, #0f172a)',
        borderColor: 'var(--border-primary, rgba(255,255,255,0.1))',
      }}
    >
      {/* Month / Year header navigation */}
      <div className="flex items-center justify-between mb-4">
        <div className="flex items-center gap-2">
          <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20">
            <CalendarIcon className="w-4 h-4" />
          </div>
          <span className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
            {MONTHS[month]} {year}
          </span>
        </div>

        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={prevMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Previous month"
          >
            <ChevronLeft className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={nextMonth}
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-400 hover:text-white transition"
            aria-label="Next month"
          >
            <ChevronRight className="w-4 h-4" />
          </button>
        </div>
      </div>

      {/* Days of week */}
      <div className="grid grid-cols-7 gap-1 text-center mb-2">
        {DAYS.map((d) => (
          <span key={d} className="text-[11px] font-bold uppercase tracking-wider text-slate-500 py-1">
            {d}
          </span>
        ))}
      </div>

      {/* Calendar dates grid */}
      <div className="grid grid-cols-7 gap-1">
        {/* Empty cells before month start */}
        {Array.from({ length: firstDayIndex }).map((_, i) => (
          <div key={`empty-${i}`} className="h-9 w-9" />
        ))}

        {/* Days of month */}
        {Array.from({ length: daysInMonth }).map((_, i) => {
          const dayNum = i + 1;
          const dateStr = `${year}-${String(month + 1).padStart(2, '0')}-${String(dayNum).padStart(2, '0')}`;
          const isToday = todayStr === dateStr;
          const selected = isSelected(dayNum);
          const inRange = isInRange(dayNum);
          const eventColor = eventMap[dateStr];

          return (
            <button
              key={dayNum}
              type="button"
              onClick={() => handleDateClick(dayNum)}
              className={`h-9 w-9 mx-auto rounded-xl text-xs font-semibold relative transition-all duration-150 flex flex-col items-center justify-center ${
                selected
                  ? 'bg-indigo-600 text-white font-bold shadow-md scale-105'
                  : inRange
                  ? 'bg-indigo-500/20 text-indigo-300 font-bold'
                  : isToday
                  ? 'border border-indigo-500/50 text-indigo-400'
                  : 'text-slate-300 hover:bg-white/10'
              }`}
            >
              <span>{dayNum}</span>

              {/* Event dot if date has marked status */}
              {eventColor && (
                <span
                  className={`w-1 h-1 rounded-full absolute bottom-1 ${
                    eventColor === 'emerald'
                      ? 'bg-emerald-400'
                      : eventColor === 'amber'
                      ? 'bg-amber-400'
                      : eventColor === 'red'
                      ? 'bg-red-400'
                      : 'bg-indigo-400'
                  }`}
                />
              )}
            </button>
          );
        })}
      </div>

      {/* Quick preset chips */}
      <div
        className="mt-4 pt-3 border-t flex items-center justify-between gap-1 text-[11px]"
        style={{ borderColor: 'var(--border-primary, rgba(255,255,255,0.08))' }}
      >
        <span className="text-slate-500 font-bold uppercase tracking-wider text-[10px]">Quick Presets:</span>
        <div className="flex items-center gap-1.5">
          <button
            type="button"
            onClick={() => applyPreset('today')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition"
          >
            Today
          </button>
          <button
            type="button"
            onClick={() => applyPreset('week')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition"
          >
            +7 Days
          </button>
          <button
            type="button"
            onClick={() => applyPreset('month')}
            className="px-2 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 font-semibold transition"
          >
            Month
          </button>
        </div>
      </div>
    </div>
  );
}
