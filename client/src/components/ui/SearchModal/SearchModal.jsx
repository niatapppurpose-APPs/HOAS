import { useState, useEffect, useMemo, useRef } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import {
  Search, X, ArrowRight, CornerDownLeft, Sparkles, Clock,
  LayoutDashboard, CreditCard, MessageSquare, CalendarCheck, ShieldAlert,
  User, Settings, HelpCircle, Utensils, Users, Calendar, AlertTriangle,
  Radio, CheckCircle2, Home, Building2, FileSpreadsheet, UserCheck, Shield,
  GraduationCap, ShieldCheck, BarChart3, Sliders, TrendingUp, Download,
  Crown, PlusCircle, Activity, FileText, Building, LineChart, Server, Lock,
  UserCog, AlertCircle, Receipt
} from 'lucide-react';
import { SEARCH_SCOPES } from './searchData';

// Map icon names from searchData to actual Lucide icon components
const ICON_MAP = {
  LayoutDashboard, CreditCard, MessageSquare, CalendarCheck, ShieldAlert,
  User, Settings, HelpCircle, Utensils, Users, Calendar, AlertTriangle,
  Radio, CheckCircle2, Home, Building2, FileSpreadsheet, UserCheck, Shield,
  GraduationCap, ShieldCheck, BarChart3, Sliders, TrendingUp, Download,
  Crown, PlusCircle, Activity, FileText, Building, LineChart, Server, Lock,
  UserCog, AlertCircle, Receipt,
};

function DynamicIcon({ name, className = 'w-4 h-4' }) {
  const Comp = ICON_MAP[name] || Search;
  return <Comp className={className} />;
}

const RECENT_KEY = 'hoas_recent_searches_v2';

export default function SearchModal({
  defaultScope = 'student',
  compact = false,
  triggerLabel,
  onSelectAction,
}) {
  const [isOpen, setIsOpen] = useState(false);
  const [query, setQuery] = useState('');
  const [activeCategory, setActiveCategory] = useState('All');
  const [activeScope, setActiveScope] = useState(defaultScope);
  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  const navigate = useNavigate();
  const location = useLocation();
  const inputRef = useRef(null);
  const listRef = useRef(null);

  // Auto-detect scope from location if not explicitly provided
  useEffect(() => {
    const path = location.pathname.toLowerCase();
    if (path.startsWith('/ownersdashboard')) {
      setActiveScope('owner');
    } else if (path.startsWith('/dashboard/principal')) {
      setActiveScope('principal');
    } else if (path.startsWith('/dashboard/management')) {
      setActiveScope('management');
    } else if (path.startsWith('/dashboard/warden')) {
      setActiveScope('warden');
    } else if (path.startsWith('/dashboard/student')) {
      setActiveScope('student');
    } else if (defaultScope) {
      setActiveScope(defaultScope);
    }
  }, [location.pathname, defaultScope]);

  // Load recent searches from localStorage
  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);
      if (stored) setRecentSearches(JSON.parse(stored).slice(0, 5));
    } catch {
      // ignore
    }
  }, []);

  const saveRecentSearch = (item) => {
    try {
      const updated = [item, ...recentSearches.filter((r) => r.id !== item.id)].slice(0, 5);
      setRecentSearches(updated);
      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // ignore
    }
  };

  const clearRecent = (e) => {
    e.stopPropagation();
    setRecentSearches([]);
    localStorage.removeItem(RECENT_KEY);
  };

  // Global keydown listener for Ctrl+K / Cmd+K and Esc
  useEffect(() => {
    const onKey = (e) => {
      if ((e.ctrlKey || e.metaKey) && e.key.toLowerCase() === 'k') {
        e.preventDefault();
        setIsOpen((prev) => !prev);
      } else if (e.key === 'Escape' && isOpen) {
        setIsOpen(false);
      }
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen]);

  // Focus input on open
  useEffect(() => {
    if (isOpen) {
      setTimeout(() => inputRef.current?.focus(), 50);
      setSelectedIndex(0);
    } else {
      setQuery('');
      setActiveCategory('All');
    }
  }, [isOpen]);

  const currentScopeData = SEARCH_SCOPES[activeScope] || SEARCH_SCOPES.student;

  // Filtered results
  const filteredResults = useMemo(() => {
    const q = query.trim().toLowerCase();
    const items = currentScopeData.items || [];
    const actions = currentScopeData.quickActions || [];

    // Filter by active category
    let pool = [...actions, ...items];
    if (activeCategory !== 'All') {
      pool = pool.filter((item) => item.category === activeCategory);
    }

    if (!q) return pool;

    return pool.filter((item) => {
      const title = (item.title || item.label || '').toLowerCase();
      const subtitle = (item.subtitle || item.desc || '').toLowerCase();
      const cat = (item.category || '').toLowerCase();
      return title.includes(q) || subtitle.includes(q) || cat.includes(q);
    });
  }, [query, activeCategory, currentScopeData]);

  // Handle keyboard navigation inside the list
  const handleKeyDown = (e) => {
    if (e.key === 'ArrowDown') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev + 1) % Math.max(filteredResults.length, 1));
      scrollActiveIntoView((selectedIndex + 1) % Math.max(filteredResults.length, 1));
    } else if (e.key === 'ArrowUp') {
      e.preventDefault();
      setSelectedIndex((prev) => (prev - 1 + filteredResults.length) % Math.max(filteredResults.length, 1));
      scrollActiveIntoView((selectedIndex - 1 + filteredResults.length) % Math.max(filteredResults.length, 1));
    } else if (e.key === 'Enter') {
      e.preventDefault();
      const target = filteredResults[selectedIndex];
      if (target) handleSelect(target);
    }
  };

  const scrollActiveIntoView = (index) => {
    const list = listRef.current;
    if (!list) return;
    const items = list.querySelectorAll('[data-search-item]');
    const activeEl = items[index];
    if (activeEl) {
      activeEl.scrollIntoView({ block: 'nearest' });
    }
  };

  const handleSelect = (item) => {
    saveRecentSearch(item);
    setIsOpen(false);
    if (onSelectAction) onSelectAction(item);
    if (item.path) {
      navigate(item.path);
    }
  };

  return (
    <>
      {/* Search trigger button styled for the active dashboard header */}
      <button
        type="button"
        onClick={() => setIsOpen(true)}
        aria-label={`Search in ${currentScopeData.name}`}
        className={
          compact
            ? 'relative flex items-center justify-center w-9 h-9 sm:w-10 sm:h-10 rounded-xl transition-all duration-200 hover:scale-105 active:scale-95 focus:outline-none focus:ring-2 focus:ring-indigo-500/50'
            : 'relative flex items-center gap-2.5 px-3 py-2 sm:px-4 sm:py-2.5 rounded-xl border transition-all duration-200 text-xs sm:text-sm font-medium hover:border-indigo-500/40 focus:outline-none focus:ring-2 focus:ring-indigo-500/40'
        }
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)',
          color: 'var(--text-secondary)',
        }}
      >
        <Search className="w-4 h-4 text-indigo-500 flex-shrink-0" />
        {!compact && (
          <>
            <span className="hidden sm:inline font-normal truncate max-w-[130px] md:max-w-[200px]" style={{ color: 'var(--text-muted)' }}>
              {triggerLabel || currentScopeData.placeholder.split('...')[0] + '...'}
            </span>
            <span className="flex items-center gap-0.5 ml-auto pl-2">
              <kbd className="hidden md:inline-flex items-center px-1.5 py-0.5 text-[10px] font-semibold rounded bg-black/10 dark:bg-white/10 text-slate-500 dark:text-slate-400 border border-slate-300 dark:border-slate-700">
                ⌘K
              </kbd>
            </span>
          </>
        )}
      </button>

      {/* Vengence UI / Untitled UI Style Cmd+K Modal */}
      {isOpen && (
        <div
          className="fixed inset-0 z-[9999] flex items-start justify-center p-3 sm:p-6 pt-[8vh] sm:pt-[12vh] bg-black/60 backdrop-blur-md animate-in fade-in duration-200"
          role="presentation"
          onClick={(e) => {
            if (e.target === e.currentTarget) setIsOpen(false);
          }}
        >
          <div
            role="dialog"
            aria-modal="true"
            aria-label="Command palette and search"
            className="w-full max-w-2xl rounded-3xl border shadow-[0_25px_70px_rgba(0,0,0,0.45)] overflow-hidden transition-all duration-300 flex flex-col max-h-[82vh] animate-in zoom-in-95 duration-200"
            style={{
              backgroundColor: 'var(--bg-modal, #0f172a)',
              borderColor: 'var(--border-primary, rgba(255,255,255,0.1))',
              color: 'var(--text-primary, #f8fafc)',
            }}
          >
            {/* Top Search Input Bar */}
            <div
              className="flex items-center gap-3 px-5 py-4 border-b relative"
              style={{ borderColor: 'var(--border-primary, rgba(255,255,255,0.08))' }}
            >
              <style>{`
                .hoas-search-input::-webkit-search-decoration,
                .hoas-search-input::-webkit-search-cancel-button,
                .hoas-search-input::-webkit-search-results-button,
                .hoas-search-input::-webkit-search-results-decoration {
                  -webkit-appearance: none;
                  display: none;
                }
                .hoas-search-input {
                  border: none !important;
                  outline: none !important;
                  box-shadow: none !important;
                }
                .hoas-search-input:focus,
                .hoas-search-input:focus-visible {
                  border: none !important;
                  outline: none !important;
                  box-shadow: none !important;
                  ring: 0 !important;
                }
              `}</style>
              <input
                ref={inputRef}
                type="search"
                value={query}
                onChange={(e) => {
                  setQuery(e.target.value);
                  setSelectedIndex(0);
                }}
                onKeyDown={handleKeyDown}
                placeholder={currentScopeData.placeholder}
                className="hoas-search-input w-full bg-transparent text-sm sm:text-base border-0 outline-none ring-0 focus:outline-none focus:ring-0 focus:border-0 shadow-none placeholder:text-slate-400 font-medium"
                style={{
                  color: 'var(--text-primary)',
                  border: 'none',
                  outline: 'none',
                  boxShadow: 'none',
                  WebkitAppearance: 'none',
                  appearance: 'none',
                }}
              />

              {query ? (
                <button
                  type="button"
                  onClick={() => setQuery('')}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  aria-label="Clear query"
                >
                  <X className="w-4 h-4" />
                </button>
              ) : (
                <button
                  type="button"
                  onClick={() => setIsOpen(false)}
                  className="p-1 rounded-lg hover:bg-white/10 text-slate-400 hover:text-white transition"
                  aria-label="Close modal"
                >
                  <X className="w-4 h-4" />
                </button>
              )}
            </div>

            {/* Scope Badge & Category Filter Chips */}
            <div
              className="flex items-center justify-between gap-2 px-5 py-2.5 border-b overflow-x-auto no-scrollbar text-xs"
              style={{
                borderColor: 'var(--border-primary, rgba(255,255,255,0.08))',
                backgroundColor: 'rgba(0,0,0,0.15)',
              }}
            >
              {/* Active Scope Badge */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                <span className="text-[10px] font-bold uppercase tracking-wider text-slate-400">Scope:</span>
                <span className={`px-2 py-0.5 rounded-full text-[11px] font-bold border ${currentScopeData.badgeColor}`}>
                  {currentScopeData.badge}
                </span>
              </div>

              {/* Category Pills */}
              <div className="flex items-center gap-1.5 flex-shrink-0">
                {currentScopeData.categories.map((cat) => (
                  <button
                    key={cat}
                    type="button"
                    onClick={() => {
                      setActiveCategory(cat);
                      setSelectedIndex(0);
                    }}
                    className={`px-2.5 py-1 rounded-lg font-semibold transition text-xs ${
                      activeCategory === cat
                        ? 'bg-indigo-600 text-white shadow-md'
                        : 'text-slate-400 hover:text-white hover:bg-white/5'
                    }`}
                  >
                    {cat}
                  </button>
                ))}
              </div>
            </div>

            {/* Scrollable Results Area */}
            <div ref={listRef} className="flex-1 overflow-y-auto p-3 sm:p-4 space-y-2">
              {/* Quick Actions if query is empty and viewing 'All' */}
              {!query && activeCategory === 'All' && currentScopeData.quickActions?.length > 0 && (
                <div className="mb-4">
                  <p className="px-3 text-[11px] font-black uppercase tracking-wider text-indigo-400 mb-2 flex items-center gap-1.5">
                    <Sparkles className="w-3.5 h-3.5" /> Quick Actions
                  </p>
                  <div className="grid grid-cols-1 sm:grid-cols-2 gap-2">
                    {currentScopeData.quickActions.map((action, idx) => (
                      <button
                        key={action.id}
                        type="button"
                        onClick={() => handleSelect(action)}
                        className="group flex items-start gap-3 p-3 rounded-2xl text-left border transition-all duration-200 hover:border-indigo-500/40 hover:bg-indigo-500/10 active:scale-[0.99]"
                        style={{
                          backgroundColor: 'var(--bg-tertiary, rgba(255,255,255,0.03))',
                          borderColor: 'var(--border-primary, rgba(255,255,255,0.08))',
                        }}
                      >
                        <div className="p-2 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 group-hover:bg-indigo-500 group-hover:text-white transition">
                          <DynamicIcon name={action.icon} className="w-4 h-4" />
                        </div>
                        <div className="flex-1 min-w-0">
                          <p className="text-xs sm:text-sm font-bold truncate group-hover:text-indigo-400 transition" style={{ color: 'var(--text-primary)' }}>
                            {action.label}
                          </p>
                          <p className="text-[11px] text-slate-400 truncate mt-0.5">{action.desc}</p>
                        </div>
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Recent Searches (if query is empty) */}
              {!query && recentSearches.length > 0 && (
                <div className="mb-3">
                  <div className="flex items-center justify-between px-3 mb-1.5">
                    <span className="text-[11px] font-bold uppercase tracking-wider text-slate-400 flex items-center gap-1">
                      <Clock className="w-3 h-3" /> Recent
                    </span>
                    <button
                      type="button"
                      onClick={clearRecent}
                      className="text-[10px] text-slate-500 hover:text-slate-300 font-semibold"
                    >
                      Clear history
                    </button>
                  </div>
                  <div className="space-y-1">
                    {recentSearches.map((rec) => (
                      <button
                        key={rec.id}
                        type="button"
                        onClick={() => handleSelect(rec)}
                        className="w-full flex items-center justify-between px-3 py-2 rounded-xl text-left hover:bg-white/5 transition text-xs text-slate-300 group"
                      >
                        <span className="flex items-center gap-2">
                          <DynamicIcon name={rec.icon || 'Search'} className="w-3.5 h-3.5 text-slate-400" />
                          <span className="font-medium truncate">{rec.title || rec.label}</span>
                        </span>
                        <ArrowRight className="w-3.5 h-3.5 opacity-0 group-hover:opacity-100 transition text-indigo-400" />
                      </button>
                    ))}
                  </div>
                </div>
              )}

              {/* Primary Filtered Results */}
              <div>
                {query && (
                  <p className="px-3 text-[11px] font-bold uppercase tracking-wider text-slate-400 mb-2">
                    Results ({filteredResults.length})
                  </p>
                )}

                {filteredResults.length > 0 ? (
                  <div className="space-y-1">
                    {filteredResults.map((item, idx) => {
                      const isSelected = idx === selectedIndex;
                      const title = item.title || item.label;
                      const subtitle = item.subtitle || item.desc;

                      return (
                        <button
                          key={item.id || idx}
                          data-search-item
                          type="button"
                          onClick={() => handleSelect(item)}
                          onMouseEnter={() => setSelectedIndex(idx)}
                          className={`w-full flex items-center justify-between p-3 rounded-2xl text-left transition-all duration-150 border ${
                            isSelected
                              ? 'bg-indigo-600/15 border-indigo-500/40 text-white shadow-md'
                              : 'border-transparent hover:bg-white/5 text-slate-300'
                          }`}
                        >
                          <div className="flex items-center gap-3 min-w-0 flex-1">
                            <div
                              className={`p-2 rounded-xl transition ${
                                isSelected
                                  ? 'bg-indigo-600 text-white'
                                  : 'bg-white/5 text-slate-400'
                              }`}
                            >
                              <DynamicIcon name={item.icon || 'Search'} className="w-4 h-4" />
                            </div>
                            <div className="min-w-0 flex-1">
                              <div className="flex items-center gap-2">
                                <span className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                                  {title}
                                </span>
                                {item.category && (
                                  <span className="text-[10px] px-1.5 py-0.5 rounded bg-white/5 text-slate-400 font-semibold border border-white/5">
                                    {item.category}
                                  </span>
                                )}
                              </div>
                              {subtitle && (
                                <p className="text-[11px] text-slate-400 truncate mt-0.5">
                                  {subtitle}
                                </p>
                              )}
                            </div>
                          </div>

                          <div className="flex items-center gap-2 pl-3 flex-shrink-0">
                            {isSelected ? (
                              <span className="flex items-center gap-1 text-[10px] font-bold text-indigo-400 bg-indigo-500/10 px-2 py-1 rounded-lg border border-indigo-500/20">
                                Open <CornerDownLeft className="w-2.5 h-2.5" />
                              </span>
                            ) : (
                              <ArrowRight className="w-4 h-4 text-slate-500 opacity-40" />
                            )}
                          </div>
                        </button>
                      );
                    })}
                  </div>
                ) : (
                  <div className="py-12 px-4 text-center">
                    <Search className="w-8 h-8 text-slate-500 mx-auto mb-3 opacity-40" />
                    <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
                      No results for &ldquo;{query}&rdquo;
                    </p>
                    <p className="text-xs text-slate-400 mt-1 max-w-sm mx-auto">
                      Try searching for hostel blocks, complaints, leave passes, fee receipts, or emergency tools.
                    </p>
                  </div>
                )}
              </div>
            </div>

            {/* Modal Bottom Keyboard Shortcuts Bar */}
            <div
              className="flex items-center justify-between px-5 py-3 border-t text-[11px] text-slate-400"
              style={{
                borderColor: 'var(--border-primary, rgba(255,255,255,0.08))',
                backgroundColor: 'rgba(0,0,0,0.2)',
              }}
            >
              <div className="flex items-center gap-3">
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] border border-white/10">↑</kbd>
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] border border-white/10">↓</kbd>
                  <span className="ml-1">Navigate</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] border border-white/10">↵</kbd>
                  <span className="ml-1">Select</span>
                </span>
                <span className="flex items-center gap-1">
                  <kbd className="px-1.5 py-0.5 rounded bg-white/10 font-mono text-[10px] border border-white/10">Esc</kbd>
                  <span className="ml-1">Close</span>
                </span>
              </div>
              <span className="text-[10px] font-semibold text-slate-500 hidden sm:inline">
                HOAS Intelligent Command Palette
              </span>
            </div>
          </div>
        </div>
      )}
    </>
  );
}
