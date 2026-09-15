import { useState, useMemo } from 'react';
import { motion, AnimatePresence } from 'framer-motion';
import { ChevronDown, Search, HelpCircle, ThumbsUp, Check } from 'lucide-react';

export default function FaqAccordion({
  categories = [],
  data = [], // [{ category, questions: [{ q, a }] }]
  initialCategory = 'All',
  className = '',
}) {
  const [activeCategory, setActiveCategory] = useState(initialCategory);
  const [searchQuery, setSearchQuery] = useState('');
  const [expandedIndices, setExpandedIndices] = useState(new Set());
  const [helpfulFeedback, setHelpfulFeedback] = useState(new Set());

  // Extract all categories
  const allCategories = useMemo(() => {
    if (categories.length > 0) return ['All', ...categories];
    const set = new Set();
    data.forEach((group) => {
      if (group.category) set.add(group.category);
    });
    return ['All', ...Array.from(set)];
  }, [categories, data]);

  // Flatten and filter questions
  const filteredQuestions = useMemo(() => {
    const list = [];
    data.forEach((entry, gIdx) => {
      if (entry.questions && Array.isArray(entry.questions)) {
        const cat = entry.category || 'General';
        entry.questions.forEach((item, idx) => {
          list.push({
            id: `${cat}-${idx}`,
            category: cat,
            q: item.q || item.question,
            a: item.a || item.answer,
          });
        });
      } else if (entry.q || entry.question) {
        const cat = entry.category || 'General';
        list.push({
          id: entry.id || `faq-${gIdx}`,
          category: cat,
          q: entry.q || entry.question,
          a: entry.a || entry.answer,
        });
      }
    });

    return list.filter((item) => {
      const matchesCategory = activeCategory === 'All' || item.category === activeCategory;
      if (!matchesCategory) return false;

      if (!searchQuery.trim()) return true;
      const q = searchQuery.toLowerCase();
      return item.q.toLowerCase().includes(q) || item.a.toLowerCase().includes(q);
    });
  }, [data, activeCategory, searchQuery]);

  const toggleQuestion = (id) => {
    setExpandedIndices((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  const markHelpful = (id, e) => {
    e.stopPropagation();
    setHelpfulFeedback((prev) => new Set(prev).add(id));
  };

  return (
    <div className={`w-full ${className}`}>
      {/* Search Bar */}
      <div
        className="flex items-center gap-3 px-4 py-3 rounded-2xl border mb-4 backdrop-blur-md transition-all focus-within:border-indigo-500/50"
        style={{
          backgroundColor: 'var(--bg-tertiary)',
          borderColor: 'var(--border-primary)',
        }}
      >
        <Search className="w-4 h-4 text-slate-400" />
        <input
          type="search"
          value={searchQuery}
          onChange={(e) => setSearchQuery(e.target.value)}
          placeholder="Search questions, policies, rules, and troubleshooting..."
          className="w-full bg-transparent text-sm outline-none placeholder:text-slate-400"
          style={{ color: 'var(--text-primary)' }}
        />
      </div>

      {/* Category Pills */}
      {allCategories.length > 1 && (
        <div className="flex items-center gap-2 overflow-x-auto no-scrollbar pb-2 mb-4">
          {allCategories.map((cat) => (
            <button
              key={cat}
              type="button"
              onClick={() => setActiveCategory(cat)}
              className={`px-3.5 py-1.5 rounded-xl text-xs font-bold transition-all whitespace-nowrap ${
                activeCategory === cat
                  ? 'bg-indigo-600 text-white shadow-md'
                  : 'bg-white/5 hover:bg-white/10 text-slate-400 hover:text-white border border-transparent hover:border-slate-700'
              }`}
            >
              {cat}
            </button>
          ))}
        </div>
      )}

      {/* Accordion Questions List */}
      <div className="space-y-2.5">
        {filteredQuestions.length > 0 ? (
          filteredQuestions.map((item) => {
            const isExpanded = expandedIndices.has(item.id);
            const isHelpful = helpfulFeedback.has(item.id);

            return (
              <div
                key={item.id}
                className="rounded-2xl border transition-all duration-200 overflow-hidden"
                style={{
                  backgroundColor: 'var(--bg-tertiary)',
                  borderColor: isExpanded ? 'rgba(99, 102, 241, 0.4)' : 'var(--border-primary)',
                }}
              >
                <button
                  type="button"
                  onClick={() => toggleQuestion(item.id)}
                  aria-expanded={isExpanded}
                  className="w-full flex items-center justify-between p-4 sm:p-5 text-left gap-3 group"
                >
                  <div className="flex items-center gap-3 min-w-0">
                    <span className="p-2 rounded-xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex-shrink-0 group-hover:scale-105 transition">
                      <HelpCircle className="w-4 h-4" />
                    </span>
                    <div>
                      <span className="text-xs sm:text-sm font-bold block" style={{ color: 'var(--text-primary)' }}>
                        {item.q}
                      </span>
                      {activeCategory === 'All' && item.category && (
                        <span className="text-[10px] text-slate-400 font-semibold uppercase tracking-wider mt-0.5 inline-block">
                          {item.category}
                        </span>
                      )}
                    </div>
                  </div>

                  <motion.div
                    animate={{ rotate: isExpanded ? 180 : 0 }}
                    transition={{ duration: 0.2 }}
                    className="p-1 rounded-lg text-slate-400 group-hover:text-white transition flex-shrink-0"
                  >
                    <ChevronDown className="w-4 h-4" />
                  </motion.div>
                </button>

                <AnimatePresence initial={false}>
                  {isExpanded && (
                    <motion.div
                      initial={{ height: 0, opacity: 0 }}
                      animate={{ height: 'auto', opacity: 1 }}
                      exit={{ height: 0, opacity: 0 }}
                      transition={{ duration: 0.25, ease: 'easeInOut' }}
                    >
                      <div
                        className="px-5 pb-5 pt-1 border-t text-xs sm:text-sm leading-relaxed text-slate-300"
                        style={{ borderColor: 'var(--border-primary)' }}
                      >
                        <p>{item.a}</p>

                        {/* Was this helpful? */}
                        <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-slate-400">
                          <span>Was this answer helpful?</span>
                          <button
                            type="button"
                            onClick={(e) => markHelpful(item.id, e)}
                            className={`flex items-center gap-1.5 px-2.5 py-1 rounded-lg text-xs font-semibold transition ${
                              isHelpful
                                ? 'bg-emerald-500/20 text-emerald-300 border border-emerald-500/30'
                                : 'hover:bg-white/10 text-slate-400 hover:text-white'
                            }`}
                          >
                            {isHelpful ? (
                              <>
                                <Check className="w-3.5 h-3.5 text-emerald-400" />
                                <span>Thank you!</span>
                              </>
                            ) : (
                              <>
                                <ThumbsUp className="w-3.5 h-3.5" />
                                <span>Yes, helpful</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </motion.div>
                  )}
                </AnimatePresence>
              </div>
            );
          })
        ) : (
          <div className="py-12 text-center text-slate-400">
            <HelpCircle className="w-8 h-8 mx-auto mb-2 opacity-40" />
            <p className="text-sm font-semibold">No questions matched &ldquo;{searchQuery}&rdquo;</p>
            <p className="text-xs text-slate-500 mt-1">Try searching with different keywords.</p>
          </div>
        )}
      </div>
    </div>
  );
}
