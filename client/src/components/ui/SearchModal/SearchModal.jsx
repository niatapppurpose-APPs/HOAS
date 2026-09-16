import { useState, useEffect, useMemo, useRef } from "react";
import { createPortal } from "react-dom";
import { useNavigate, useLocation } from "react-router-dom";

import {
  Search,
  X,
  ArrowRight,
  CornerDownLeft,
  Sparkles,
  Clock,
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  CalendarCheck,
  ShieldAlert,
  User,
  Settings,
  HelpCircle,
  Utensils,
  Users,
  Calendar,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Home,
  Building2,
  FileSpreadsheet,
  UserCheck,
  Shield,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Sliders,
  TrendingUp,
  Download,
  Crown,
  PlusCircle,
  Activity,
  FileText,
  Building,
  LineChart,
  Server,
  Lock,
  UserCog,
  AlertCircle,
  Receipt,
} from "lucide-react";

import { SEARCH_SCOPES } from "./searchData";

/* =========================================================
   ICON MAP
========================================================= */

const ICON_MAP = {
  LayoutDashboard,
  CreditCard,
  MessageSquare,
  CalendarCheck,
  ShieldAlert,
  User,
  Settings,
  HelpCircle,
  Utensils,
  Users,
  Calendar,
  AlertTriangle,
  Radio,
  CheckCircle2,
  Home,
  Building2,
  FileSpreadsheet,
  UserCheck,
  Shield,
  GraduationCap,
  ShieldCheck,
  BarChart3,
  Sliders,
  TrendingUp,
  Download,
  Crown,
  PlusCircle,
  Activity,
  FileText,
  Building,
  LineChart,
  Server,
  Lock,
  UserCog,
  AlertCircle,
  Receipt,
};

function DynamicIcon({ name, className = "w-4 h-4" }) {
  const Icon = ICON_MAP[name] || Search;

  return <Icon className={className} />;
}

/* =========================================================
   CONSTANTS
========================================================= */

const RECENT_KEY = "hoas_recent_searches_v2";

/* =========================================================
   COMPONENT
========================================================= */

export default function SearchModal({
  defaultScope = "student",
  compact = false,
  triggerLabel,
  onSelectAction,
}) {
  const navigate = useNavigate();
  const location = useLocation();

  /* -------------------------------------------------------
     State
  ------------------------------------------------------- */

  const [isOpen, setIsOpen] = useState(false);
  const [shouldRender, setShouldRender] = useState(false);

  const [query, setQuery] = useState("");
  const [activeCategory, setActiveCategory] = useState("All");
  const [activeScope, setActiveScope] = useState(defaultScope);

  const [selectedIndex, setSelectedIndex] = useState(0);
  const [recentSearches, setRecentSearches] = useState([]);

  const [portalTarget, setPortalTarget] = useState(null);

  /* -------------------------------------------------------
     Refs
  ------------------------------------------------------- */

  const portalTargetRef = useRef(null);
  const inputRef = useRef(null);
  const listRef = useRef(null);

  /* =========================================================
     PORTAL SETUP
  ========================================================= */

  useEffect(() => {
    if (typeof document === "undefined") return;

    const target = document.createElement("div");

    target.setAttribute("data-hoas-search-portal", "");

    target.style.position = "relative";
    target.style.zIndex = "9999";

    document.body.appendChild(target);

    portalTargetRef.current = target;
    setPortalTarget(target);

    return () => {
      if (target.parentNode) {
        target.parentNode.removeChild(target);
      }

      portalTargetRef.current = null;
    };
  }, []);

  /* =========================================================
     OPEN / CLOSE
  ========================================================= */

  const openSearch = () => {
    setShouldRender(true);

    // Let React mount first, then animate in.
    requestAnimationFrame(() => {
      requestAnimationFrame(() => {
        setIsOpen(true);
      });
    });
  };

  const closeSearch = () => {
    setIsOpen(false);

    // Wait for exit animation before unmounting.
    setTimeout(() => {
      setShouldRender(false);
    }, 220);
  };

  /* =========================================================
     CTRL + K / CMD + K
  ========================================================= */

  useEffect(() => {
    const handleGlobalKeyDown = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key.toLowerCase() === "k") {
        event.preventDefault();

        if (isOpen) {
          closeSearch();
        } else {
          openSearch();
        }
      }

      if (event.key === "Escape" && isOpen) {
        event.preventDefault();
        closeSearch();
      }
    };

    window.addEventListener("keydown", handleGlobalKeyDown);

    return () => {
      window.removeEventListener("keydown", handleGlobalKeyDown);
    };
  }, [isOpen]);

  /* =========================================================
     BODY SCROLL LOCK
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    const originalOverflow = document.body.style.overflow;

    document.body.style.overflow = "hidden";

    return () => {
      document.body.style.overflow = originalOverflow;
    };
  }, [isOpen]);

  /* =========================================================
     AUTO-DETECT SCOPE
  ========================================================= */

  useEffect(() => {
    const path = location.pathname.toLowerCase();

    if (path.startsWith("/ownersdashboard")) {
      setActiveScope("owner");
    } else if (path.startsWith("/dashboard/principal")) {
      setActiveScope("principal");
    } else if (path.startsWith("/dashboard/management")) {
      setActiveScope("management");
    } else if (path.startsWith("/dashboard/warden")) {
      setActiveScope("warden");
    } else if (path.startsWith("/dashboard/student")) {
      setActiveScope("student");
    } else if (defaultScope) {
      setActiveScope(defaultScope);
    }
  }, [location.pathname, defaultScope]);

  /* =========================================================
     LOAD RECENT SEARCHES
  ========================================================= */

  useEffect(() => {
    try {
      const stored = localStorage.getItem(RECENT_KEY);

      if (!stored) return;

      const parsed = JSON.parse(stored);

      if (Array.isArray(parsed)) {
        setRecentSearches(parsed.slice(0, 5));
      }
    } catch {
      // Ignore malformed localStorage data.
    }
  }, []);

  /* =========================================================
     RESET WHEN CLOSED
  ========================================================= */

  useEffect(() => {
    if (!isOpen) {
      setQuery("");
      setActiveCategory("All");
      setSelectedIndex(0);
    }
  }, [isOpen]);

  /* =========================================================
     FOCUS INPUT
  ========================================================= */

  useEffect(() => {
    if (!isOpen) return;

    const timer = setTimeout(() => {
      inputRef.current?.focus();
    }, 80);

    return () => clearTimeout(timer);
  }, [isOpen]);

  /* =========================================================
     SEARCH DATA
  ========================================================= */

  const currentScopeData = SEARCH_SCOPES[activeScope] || SEARCH_SCOPES.student;

  /* =========================================================
     FILTER RESULTS
  ========================================================= */

  const filteredResults = useMemo(() => {
    const search = query.trim().toLowerCase();

    const items = currentScopeData.items || [];

    const actions = currentScopeData.quickActions || [];

    let pool = [...actions, ...items];

    if (activeCategory !== "All") {
      pool = pool.filter((item) => item.category === activeCategory);
    }

    if (!search) {
      return pool;
    }

    return pool.filter((item) => {
      const title = (item.title || item.label || "").toLowerCase();

      const subtitle = (item.subtitle || item.desc || "").toLowerCase();

      const category = (item.category || "").toLowerCase();

      return (
        title.includes(search) ||
        subtitle.includes(search) ||
        category.includes(search)
      );
    });
  }, [query, activeCategory, currentScopeData]);

  /* =========================================================
     SAVE RECENT SEARCH
  ========================================================= */

  const saveRecentSearch = (item) => {
    try {
      const updated = [
        item,
        ...recentSearches.filter((recent) => recent.id !== item.id),
      ].slice(0, 5);

      setRecentSearches(updated);

      localStorage.setItem(RECENT_KEY, JSON.stringify(updated));
    } catch {
      // Ignore localStorage errors.
    }
  };

  /* =========================================================
     CLEAR RECENT
  ========================================================= */

  const clearRecent = (event) => {
    event.stopPropagation();

    setRecentSearches([]);

    try {
      localStorage.removeItem(RECENT_KEY);
    } catch {
      // Ignore.
    }
  };

  /* =========================================================
     SCROLL ACTIVE ITEM
  ========================================================= */

  const scrollActiveIntoView = (index) => {
    const list = listRef.current;

    if (!list) return;

    const items = list.querySelectorAll("[data-search-item]");

    const activeElement = items[index];

    if (activeElement) {
      activeElement.scrollIntoView({
        block: "nearest",
        behavior: "smooth",
      });
    }
  };

  /* =========================================================
     SELECT RESULT
  ========================================================= */

  const handleSelect = (item) => {
    saveRecentSearch(item);

    closeSearch();

    if (onSelectAction) {
      onSelectAction(item);
    }

    if (item.path) {
      navigate(item.path);
    }
  };

  /* =========================================================
     KEYBOARD NAVIGATION
  ========================================================= */

  const handleKeyDown = (event) => {
    if (event.key === "ArrowDown") {
      event.preventDefault();

      if (filteredResults.length === 0) {
        return;
      }

      setSelectedIndex((previous) => {
        const next = (previous + 1) % filteredResults.length;

        setTimeout(() => {
          scrollActiveIntoView(next);
        }, 0);

        return next;
      });
    }

    if (event.key === "ArrowUp") {
      event.preventDefault();

      if (filteredResults.length === 0) {
        return;
      }

      setSelectedIndex((previous) => {
        const next =
          (previous - 1 + filteredResults.length) % filteredResults.length;

        setTimeout(() => {
          scrollActiveIntoView(next);
        }, 0);

        return next;
      });
    }

    if (event.key === "Enter") {
      event.preventDefault();

      const selected = filteredResults[selectedIndex];

      if (selected) {
        handleSelect(selected);
      }
    }
  };

  /* =========================================================
     PORTAL CONTENT
  ========================================================= */

  const modalContent = (
    <div
      className={`
        fixed inset-0
        z-[9999]
        flex
        items-start
        justify-center
        px-3
        sm:px-6
        pt-[8vh]
        sm:pt-[12vh]
        bg-black/60
        backdrop-blur-md
        transition-all
        duration-200
        ease-out
        ${isOpen ? "opacity-100" : "opacity-0"}
      `}
      role="presentation"
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          closeSearch();
        }
      }}
    >
      {/* =================================================
          MODAL
      ================================================= */}

      <div
        role="dialog"
        aria-modal="true"
        aria-label="Search"
        onMouseDown={(event) => event.stopPropagation()}
        className={`
          w-full
          max-w-2xl
          overflow-hidden
          rounded-3xl
          border
          shadow-[0_30px_100px_rgba(0,0,0,0.55)]
          transition-all
          duration-200
          ease-out
          ${
            isOpen
              ? "translate-y-0 scale-100 opacity-100"
              : "translate-y-3 scale-[0.98] opacity-0"
          }
        `}
        style={{
          backgroundColor: "var(--bg-modal, #0f172a)",

          borderColor: "var(--border-primary, rgba(255,255,255,0.1))",

          color: "var(--text-primary, #f8fafc)",
        }}
      >
        {/* =================================================
            SEARCH HEADER
        ================================================= */}

        <div
          className="
            flex
            items-center
            gap-3
            px-4
            sm:px-5
            py-4
            border-b
          "
          style={{
            borderColor: "var(--border-primary, rgba(255,255,255,0.08))",
          }}
        >
          <Search
            className="
              w-5
              h-5
              text-indigo-400
              flex-shrink-0
            "
          />

          <input
            ref={inputRef}
            type="text"
            value={query}
            onChange={(event) => {
              setQuery(event.target.value);
              setSelectedIndex(0);
            }}
            onKeyDown={handleKeyDown}
            placeholder={currentScopeData.placeholder}
            autoComplete="off"
            spellCheck="false"
            className="
              hoas-search-input
              flex-1
              min-w-0
              bg-transparent
              border-0
              outline-none
              ring-0
              text-sm
              sm:text-base
              font-medium
              placeholder:text-slate-500
              focus:outline-none
              focus:ring-0
              focus:border-0
            "
            style={{
              color: "var(--text-primary)",
            }}
          />

          <div className="flex items-center gap-2">
            {query && (
              <button
                type="button"
                onClick={() => setQuery("")}
                className="
                  p-1.5
                  rounded-lg
                  text-slate-400
                  hover:text-white
                  hover:bg-white/10
                  transition
                "
                aria-label="Clear search"
              >
                <X className="w-4 h-4" />
              </button>
            )}

            <button
              type="button"
              onClick={closeSearch}
              className="
                p-1.5
                rounded-lg
                text-slate-400
                hover:text-white
                hover:bg-white/10
                transition
              "
              aria-label="Close search"
            >
              <X className="w-4 h-4" />
            </button>
          </div>
        </div>

        {/* =================================================
            SCOPE + CATEGORIES
        ================================================= */}

        <div
          className="
            flex
            flex-col
            sm:flex-row
            sm:items-center
            sm:justify-between
            gap-3
            px-4
            sm:px-5
            py-3
            border-b
          "
          style={{
            borderColor: "var(--border-primary, rgba(255,255,255,0.08))",

            backgroundColor: "rgba(0,0,0,0.12)",
          }}
        >
          {/* Scope */}

          <div
            className="
            flex
            items-center
            gap-2
            flex-shrink-0
          "
          >
            <span
              className="
              text-[10px]
              font-bold
              uppercase
              tracking-wider
              text-slate-500
            "
            >
              Scope
            </span>

            <span
              className={`
                px-2.5
                py-1
                rounded-full
                text-[10px]
                font-bold
                border
                ${currentScopeData.badgeColor}
              `}
            >
              {currentScopeData.badge}
            </span>
          </div>

          {/* Categories */}

          <div
            className="
            flex
            items-center
            gap-1
            overflow-x-auto
            no-scrollbar
            pb-0.5
          "
          >
            {currentScopeData.categories.map((category) => (
              <button
                key={category}
                type="button"
                onClick={() => {
                  setActiveCategory(category);
                  setSelectedIndex(0);
                }}
                className={`
                    flex-shrink-0
                    px-2.5
                    py-1.5
                    rounded-lg
                    text-[11px]
                    font-semibold
                    transition-all
                    duration-150
                    ${
                      activeCategory === category
                        ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                        : "text-slate-400 hover:text-white hover:bg-white/5"
                    }
                  `}
              >
                {category}
              </button>
            ))}
          </div>
        </div>

        {/* =================================================
            RESULTS
        ================================================= */}

        <div
          ref={listRef}
          className="
            max-h-[55vh]
            sm:max-h-[58vh]
            overflow-y-auto
            overscroll-contain
            p-3
            sm:p-4
          "
        >
          {/* ===============================================
              QUICK ACTIONS
          =============================================== */}

          {!query &&
            activeCategory === "All" &&
            currentScopeData.quickActions?.length > 0 && (
              <div className="mb-5">
                <div
                  className="
                  px-2
                  mb-2
                  flex
                  items-center
                  gap-1.5
                  text-[10px]
                  font-black
                  uppercase
                  tracking-wider
                  text-indigo-400
                "
                >
                  <Sparkles className="w-3.5 h-3.5" />
                  Quick Actions
                </div>

                <div
                  className="
                  grid
                  grid-cols-1
                  sm:grid-cols-2
                  gap-2
                "
                >
                  {currentScopeData.quickActions.map((action) => (
                    <button
                      key={action.id}
                      type="button"
                      onClick={() => handleSelect(action)}
                      className="
                          group
                          flex
                          items-start
                          gap-3
                          p-3
                          rounded-2xl
                          text-left
                          border
                          transition-all
                          duration-200
                          hover:-translate-y-0.5
                          hover:border-indigo-500/40
                          hover:bg-indigo-500/10
                          active:scale-[0.98]
                        "
                      style={{
                        backgroundColor:
                          "var(--bg-tertiary, rgba(255,255,255,0.03))",

                        borderColor:
                          "var(--border-primary, rgba(255,255,255,0.08))",
                      }}
                    >
                      <div
                        className="
                          p-2
                          rounded-xl
                          bg-indigo-500/10
                          text-indigo-400
                          border
                          border-indigo-500/20
                          transition-all
                          duration-200
                          group-hover:bg-indigo-600
                          group-hover:text-white
                          group-hover:scale-105
                        "
                      >
                        <DynamicIcon name={action.icon} className="w-4 h-4" />
                      </div>

                      <div
                        className="
                          flex-1
                          min-w-0
                        "
                      >
                        <p
                          className="
                              text-xs
                              sm:text-sm
                              font-bold
                              truncate
                              transition
                              group-hover:text-indigo-400
                            "
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {action.label}
                        </p>

                        <p
                          className="
                            text-[11px]
                            text-slate-500
                            truncate
                            mt-0.5
                          "
                        >
                          {action.desc}
                        </p>
                      </div>

                      <ArrowRight
                        className="
                            w-3.5
                            h-3.5
                            mt-1
                            text-slate-600
                            opacity-0
                            -translate-x-1
                            transition-all
                            duration-200
                            group-hover:opacity-100
                            group-hover:translate-x-0
                          "
                      />
                    </button>
                  ))}
                </div>
              </div>
            )}

          {/* ===============================================
              RECENT SEARCHES
          =============================================== */}

          {!query && recentSearches.length > 0 && (
            <div className="mb-5">
              <div
                className="
                  flex
                  items-center
                  justify-between
                  px-2
                  mb-2
                "
              >
                <span
                  className="
                    text-[10px]
                    font-bold
                    uppercase
                    tracking-wider
                    text-slate-500
                    flex
                    items-center
                    gap-1.5
                  "
                >
                  <Clock className="w-3 h-3" />
                  Recent
                </span>

                <button
                  type="button"
                  onClick={clearRecent}
                  className="
                      text-[10px]
                      font-semibold
                      text-slate-600
                      hover:text-slate-300
                      transition
                    "
                >
                  Clear history
                </button>
              </div>

              <div className="space-y-1">
                {recentSearches.map((recent) => (
                  <button
                    key={recent.id}
                    type="button"
                    onClick={() => handleSelect(recent)}
                    className="
                          group
                          w-full
                          flex
                          items-center
                          justify-between
                          px-3
                          py-2.5
                          rounded-xl
                          text-left
                          hover:bg-white/5
                          transition
                        "
                  >
                    <span
                      className="
                          flex
                          items-center
                          gap-2
                          min-w-0
                        "
                    >
                      <DynamicIcon
                        name={recent.icon || "Search"}
                        className="
                              w-3.5
                              h-3.5
                              text-slate-500
                              flex-shrink-0
                            "
                      />

                      <span
                        className="
                            text-xs
                            font-medium
                            text-slate-300
                            truncate
                          "
                      >
                        {recent.title || recent.label}
                      </span>
                    </span>

                    <ArrowRight
                      className="
                            w-3.5
                            h-3.5
                            text-indigo-400
                            opacity-0
                            -translate-x-1
                            group-hover:opacity-100
                            group-hover:translate-x-0
                            transition-all
                          "
                    />
                  </button>
                ))}
              </div>
            </div>
          )}

          {/* ===============================================
              SEARCH RESULTS
          =============================================== */}

          <div>
            {query && (
              <p
                className="
                px-2
                text-[10px]
                font-bold
                uppercase
                tracking-wider
                text-slate-500
                mb-2
              "
              >
                Results ({filteredResults.length})
              </p>
            )}

            {filteredResults.length > 0 ? (
              <div className="space-y-1">
                {filteredResults.map((item, index) => {
                  const selected = index === selectedIndex;

                  const title = item.title || item.label;

                  const subtitle = item.subtitle || item.desc;

                  return (
                    <button
                      key={item.id || index}
                      data-search-item
                      type="button"
                      onClick={() => handleSelect(item)}
                      onMouseEnter={() => setSelectedIndex(index)}
                      className={`
                          group
                          w-full
                          flex
                          items-center
                          justify-between
                          gap-3
                          p-3
                          rounded-2xl
                          text-left
                          border
                          transition-all
                          duration-150
                          ${
                            selected
                              ? "bg-indigo-600/10 border-indigo-500/30 shadow-sm"
                              : "border-transparent hover:bg-white/5"
                          }
                        `}
                    >
                      {/* Left */}

                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          min-w-0
                          flex-1
                        "
                      >
                        <div
                          className={`
                              p-2
                              rounded-xl
                              flex-shrink-0
                              transition-all
                              duration-150
                              ${
                                selected
                                  ? "bg-indigo-600 text-white shadow-lg shadow-indigo-600/20"
                                  : "bg-white/5 text-slate-500 group-hover:bg-white/10 group-hover:text-slate-300"
                              }
                            `}
                        >
                          <DynamicIcon
                            name={item.icon || "Search"}
                            className="w-4 h-4"
                          />
                        </div>

                        <div
                          className="
                            min-w-0
                            flex-1
                          "
                        >
                          <div
                            className="
                              flex
                              items-center
                              gap-2
                            "
                          >
                            <span
                              className="
                                  text-xs
                                  sm:text-sm
                                  font-bold
                                  truncate
                                "
                              style={{
                                color: "var(--text-primary)",
                              }}
                            >
                              {title}
                            </span>

                            {item.category && (
                              <span
                                className="
                                  hidden
                                  sm:inline-flex
                                  text-[9px]
                                  px-1.5
                                  py-0.5
                                  rounded
                                  bg-white/5
                                  text-slate-500
                                  font-semibold
                                  border
                                  border-white/5
                                  flex-shrink-0
                                "
                              >
                                {item.category}
                              </span>
                            )}
                          </div>

                          {subtitle && (
                            <p
                              className="
                                text-[11px]
                                text-slate-500
                                truncate
                                mt-0.5
                              "
                            >
                              {subtitle}
                            </p>
                          )}
                        </div>
                      </div>

                      {/* Right */}

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                          pl-2
                          flex-shrink-0
                        "
                      >
                        {selected ? (
                          <span
                            className="
                              hidden
                              sm:flex
                              items-center
                              gap-1
                              text-[9px]
                              font-bold
                              text-indigo-400
                              bg-indigo-500/10
                              px-2
                              py-1
                              rounded-lg
                              border
                              border-indigo-500/20
                            "
                          >
                            Open
                            <CornerDownLeft className="w-2.5 h-2.5" />
                          </span>
                        ) : (
                          <ArrowRight
                            className="
                              w-4
                              h-4
                              text-slate-600
                              opacity-50
                              transition-transform
                              group-hover:translate-x-0.5
                            "
                          />
                        )}
                      </div>
                    </button>
                  );
                })}
              </div>
            ) : (
              /* =========================================
                 NO RESULTS
              ========================================= */

              <div
                className="
                py-14
                px-4
                text-center
              "
              >
                <div
                  className="
                  mx-auto
                  w-12
                  h-12
                  rounded-2xl
                  bg-white/5
                  border
                  border-white/5
                  flex
                  items-center
                  justify-center
                  mb-4
                "
                >
                  <Search
                    className="
                    w-5
                    h-5
                    text-slate-600
                  "
                  />
                </div>

                <p
                  className="
                    text-sm
                    font-bold
                  "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  No results found
                </p>

                {query && (
                  <p
                    className="
                    text-xs
                    text-slate-500
                    mt-1
                  "
                  >
                    No matches for "{query}"
                  </p>
                )}

                <p
                  className="
                  text-[11px]
                  text-slate-600
                  mt-2
                  max-w-sm
                  mx-auto
                "
                >
                  Try searching for hostel blocks, complaints, leave passes, fee
                  receipts, or emergency tools.
                </p>
              </div>
            )}
          </div>
        </div>

        {/* =================================================
            FOOTER
        ================================================= */}

        <div
          className="
            flex
            items-center
            justify-between
            gap-3
            px-4
            sm:px-5
            py-3
            border-t
          "
          style={{
            borderColor: "var(--border-primary, rgba(255,255,255,0.08))",

            backgroundColor: "rgba(0,0,0,0.15)",
          }}
        >
          <div
            className="
            flex
            items-center
            gap-3
            text-[10px]
            text-slate-500
          "
          >
            <span
              className="
              hidden
              sm:flex
              items-center
              gap-1
            "
            >
              <kbd
                className="
                px-1.5
                py-0.5
                rounded
                bg-white/5
                border
                border-white/10
                font-mono
              "
              >
                ↑
              </kbd>
              <kbd
                className="
                px-1.5
                py-0.5
                rounded
                bg-white/5
                border
                border-white/10
                font-mono
              "
              >
                ↓
              </kbd>
              Navigate
            </span>

            <span
              className="
              hidden
              sm:flex
              items-center
              gap-1
            "
            >
              <kbd
                className="
                px-1.5
                py-0.5
                rounded
                bg-white/5
                border
                border-white/10
                font-mono
              "
              >
                ↵
              </kbd>
              Select
            </span>

            <span
              className="
              flex
              items-center
              gap-1
            "
            >
              <kbd
                className="
                px-1.5
                py-0.5
                rounded
                bg-white/5
                border
                border-white/10
                font-mono
              "
              >
                Esc
              </kbd>
              Close
            </span>
          </div>

          <span
            className="
            hidden
            sm:block
            text-[9px]
            font-semibold
            tracking-wide
            text-slate-600
          "
          >
            HOAS COMMAND PALETTE
          </span>
        </div>
      </div>
    </div>
  );

  /* =========================================================
     RENDER
  ========================================================= */

  return (
    <>
      {/* =====================================================
          SEARCH TRIGGER
      ===================================================== */}

      <button
        type="button"
        onClick={openSearch}
        aria-label={`Search in ${currentScopeData.name}`}
        className={`
          group
          relative
          transition-all
          duration-200
          hover:scale-[1.02]
          active:scale-[0.97]
          focus:outline-none
          focus:ring-2
          focus:ring-indigo-500/40
          ${
            compact
              ? `
                flex
                items-center
                justify-center
                w-9
                h-9
                sm:w-10
                sm:h-10
                rounded-xl
              `
              : `
                flex
                items-center
                gap-2.5
                px-3
                py-2
                sm:px-4
                sm:py-2.5
                rounded-xl
                border
                text-xs
                sm:text-sm
                font-medium
              `
          }
        `}
        style={{
          backgroundColor: "var(--bg-tertiary)",

          borderColor: "var(--border-primary)",

          color: "var(--text-secondary)",
        }}
      >
        <Search
          className="
          w-4
          h-4
          text-indigo-500
          flex-shrink-0
          transition-transform
          duration-200
          group-hover:scale-110
        "
        />

        {!compact && (
          <>
            <span
              className="
                hidden
                sm:inline
                font-normal
                truncate
                max-w-[130px]
                md:max-w-[200px]
              "
              style={{
                color: "var(--text-muted)",
              }}
            >
              {triggerLabel ||
                currentScopeData.placeholder.split("...")[0] + "..."}
            </span>

            <span
              className="
              flex
              items-center
              gap-0.5
              ml-auto
              pl-2
            "
            >
              <kbd
                className="
                hidden
                md:inline-flex
                items-center
                px-1.5
                py-0.5
                text-[10px]
                font-semibold
                rounded
                bg-black/10
                dark:bg-white/10
                text-slate-500
                dark:text-slate-400
                border
                border-slate-300
                dark:border-slate-700
              "
              >
                ⌘K
              </kbd>
            </span>
          </>
        )}
      </button>

      {/* =====================================================
          PORTAL
      ===================================================== */}

      {shouldRender &&
        portalTarget &&
        portalTarget.nodeType === 1 &&
        portalTarget.isConnected &&
        createPortal(modalContent, portalTarget)}
    </>
  );
}
