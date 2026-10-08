import { useEffect, useRef, useState, useCallback, forwardRef, useImperativeHandle } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import { SearchAddon } from '@xterm/addon-search';
import { WebLinksAddon } from '@xterm/addon-web-links';
import '@xterm/xterm/css/xterm.css';
import {
  Pause, Play, Trash2, Download, Copy, Search, ChevronUp, ChevronDown,
  Plus, Minus, WrapText, RefreshCw, Maximize2, Minimize2, TerminalSquare,
} from 'lucide-react';
import { stripAnsi, LIGHT_TERM_THEME } from './ansi';

/**
 * LogTerminal — reusable xterm.js terminal for Owner log pages.
 *
 * Props:
 *   lines: string[]            ANSI-formatted lines to render (newest last)
 *   plainLines?: string[]      plain-text mirror for copy/export
 *   headerLine?: string        banner printed at top of terminal
 *   placeholder?: string       shown when lines is empty
 *   live?: boolean             tail/play state (controlled by parent)
 *   onToggleLive?: () => void
 *   onRefresh?: () => void
 *   refreshing?: boolean
 *   statusText?: string        right-side status (e.g. "182 entries · live")
 *   onExport?: (format: 'log' | 'json') => void
 *   onCommand?: (cmd: string, helpers) => boolean | void
 *                              return true if handled (suppresses default help)
 *   height?: number            terminal height in px (default 480)
 *   storageKey?: string        persists fontSize/wrap across reloads
 *
 * All terminal operations live here: live tail pause/resume, refresh, clear,
 * in-terminal search (next/prev), copy, export, font +/-, line wrap,
 * fullscreen expand, auto-fit on resize, and an interactive `$` command prompt
 * (help, clear, search <q>, export, copy, pause/resume, top/bottom, font, wrap).
 * Parent pages only feed `lines`.
 */
const LogTerminal = forwardRef(function LogTerminal(
  {
    lines = [],
    plainLines = [],
    headerLine = '',
    placeholder = 'No entries yet.',
    live = true,
    onToggleLive,
    onRefresh,
    refreshing = false,
    statusText = '',
    onExport,
    onCommand,
    height = 480,
    storageKey = 'hoas-log-terminal',
  },
  ref
) {
  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const searchRef = useRef(null);
  const [ready, setReady] = useState(false);
  const [fontSize, setFontSize] = useState(() => {
    try {
      return Number(localStorage.getItem(`${storageKey}:font`)) || 12;
    } catch { return 12; }
  });
  const [wrap, setWrap] = useState(() => {
    try { return localStorage.getItem(`${storageKey}:wrap`) !== 'off'; }
    catch { return true; }
  });
  const [expanded, setExpanded] = useState(false);
  const [query, setQuery] = useState('');
  const [matchInfo, setMatchInfo] = useState('');
  const [cmd, setCmd] = useState('');
  const [cmdOut, setCmdOut] = useState([]);
  const stateRef = useRef({ lines, plainLines, headerLine, placeholder });
  stateRef.current = { lines, plainLines, headerLine, placeholder };

  // ---- terminal lifecycle (mount once) ----
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize,
      fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      lineHeight: 1.35,
      scrollback: 5000,
      allowTransparency: false,
      theme: LIGHT_TERM_THEME,
    });
    const fit = new FitAddon();
    const search = new SearchAddon({ decorations: { matchBackground: '#f59e0b', matchBorder: '#f59e0b', matchOverviewRuler: '#f59e0b', activeMatchBackground: '#6366f1', activeMatchBorder: '#6366f1', activeMatchColorOverviewRuler: '#6366f1' } });
    term.loadAddon(fit);
    term.loadAddon(search);
    term.loadAddon(new WebLinksAddon());
    term.open(containerRef.current);
    // Fit after paint + on every resize
    const raf = requestAnimationFrame(() => { try { fit.fit(); } catch { /* noop */ } });
    const ro = new ResizeObserver(() => { try { fit.fit(); } catch { /* noop */ } });
    if (containerRef.current) ro.observe(containerRef.current);

    termRef.current = term;
    fitRef.current = fit;
    searchRef.current = search;
    setReady(true);

    const onResize = () => { try { fit.fit(); } catch { /* noop */ } };
    window.addEventListener('resize', onResize);
    return () => {
      cancelAnimationFrame(raf);
      ro.disconnect();
      window.removeEventListener('resize', onResize);
      try { term.dispose(); } catch { /* noop */ }
      termRef.current = null;
    };
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, []);

  const renderAll = useCallback(() => {
    const term = termRef.current;
    if (!term) return;
    const { lines: L, headerLine: H, placeholder: P } = stateRef.current;
    term.clear();
    if (H) term.writeln(`\x1b[90m${H}\x1b[0m`);
    if (H) term.writeln('\x1b[90m' + '─'.repeat(72) + '\x1b[0m');
    if (!L.length) {
      term.writeln(`\x1b[90m${P}\x1b[0m`);
    } else {
      for (const line of L) term.writeln(line);
    }
    term.scrollToBottom();
  }, []);

  // Persist prefs + apply live
  useEffect(() => {
    try { localStorage.setItem(`${storageKey}:font`, String(fontSize)); } catch { /* noop */ }
    if (termRef.current) {
      termRef.current.options.fontSize = fontSize;
      try { fitRef.current?.fit(); } catch { /* noop */ }
    }
  }, [fontSize, storageKey]);

  useEffect(() => {
    try { localStorage.setItem(`${storageKey}:wrap`, wrap ? 'on' : 'off'); } catch { /* noop */ }
    renderAll();
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [wrap]);

  useEffect(() => {
    // Refit when expanded toggles (container height changes)
    const t = setTimeout(() => { try { fitRef.current?.fit(); } catch { /* noop */ } }, 60);
    return () => clearTimeout(t);
  }, [expanded]);

  // Re-render whenever upstream lines change
  useEffect(() => { if (ready) renderAll(); }, [lines, headerLine, placeholder, ready, renderAll]);

  // ---- imperative API for parents ----
  useImperativeHandle(ref, () => ({
    clear: () => renderAll(),
    scrollToTop: () => termRef.current?.scrollToTop(),
    scrollToBottom: () => termRef.current?.scrollToBottom(),
    print: (msg) => termRef.current?.writeln(msg),
  }), [renderAll]);

  // ---- operations ----
  const doClear = useCallback(() => { renderAll(); setCmdOut([]); }, [renderAll]);

  const plainTextAll = useCallback(() => {
    const { lines: L, plainLines: P } = stateRef.current;
    const base = (P && P.length ? P : L.map(stripAnsi)).join('\n');
    const extra = cmdOut.length ? `\n\n# session\n${cmdOut.join('\n')}` : '';
    return base + extra;
  }, [cmdOut]);

  const doCopy = useCallback(async () => {
    try {
      await navigator.clipboard.writeText(plainTextAll());
      termRef.current?.writeln('\x1b[32m✓ copied visible buffer to clipboard\x1b[0m');
    } catch {
      // Fallback: select-all via xterm
      try { termRef.current?.selectAll(); document.execCommand('copy'); termRef.current?.clearSelection(); } catch { /* noop */ }
    }
  }, [plainTextAll]);

  const doExport = useCallback((format = 'log') => {
    if (onExport) { onExport(format); return; }
    const blob = new Blob([plainTextAll()], { type: 'text/plain;charset=utf-8' });
    const a = document.createElement('a');
    a.href = URL.createObjectURL(blob);
    a.download = `${storageKey}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${format === 'json' ? 'json' : 'log'}`;
    a.click();
    setTimeout(() => URL.revokeObjectURL(a.href), 2000);
  }, [onExport, plainTextAll, storageKey]);

  const doSearch = useCallback((q, dir = 1) => {
    const addon = searchRef.current;
    if (!addon) return;
    if (!q) { try { addon.clearDecorations(); } catch { /* noop */ } setMatchInfo(''); return; }
    try {
      if (dir >= 0) addon.findNext(q, { incremental: false });
      else addon.findPrevious(q, { incremental: false });
    } catch { /* noop */ }
  }, []);

  // Live search-as-you-type (decorates all matches)
  useEffect(() => {
    if (!ready) return;
    const t = setTimeout(() => {
      const addon = searchRef.current;
      if (!addon) return;
      if (!query) { try { addon.clearDecorations(); } catch { /* noop */ } setMatchInfo(''); return; }
      try { addon.findNext(query, { incremental: true }); setMatchInfo(`matches for “${query}”`); }
      catch { setMatchInfo(''); }
    }, 250);
    return () => clearTimeout(t);
  }, [query, ready, lines]);

  const runCommand = useCallback((raw) => {
    const input = raw.trim();
    if (!input) return;
    const term = termRef.current;
    const print = (m = '') => { term?.writeln(m); setCmdOut((o) => [...o.slice(-99), stripAnsi(m)]); };
    print(`\x1b[90m$ ${input}\x1b[0m`);
    // Let parent override first (e.g. filter/level commands wired to page state)
    if (onCommand) {
      try {
        const helpers = { print, clear: doClear, export: doExport, search: (q) => { setQuery(q); doSearch(q); } };
        if (onCommand(input, helpers) === true) return;
      } catch { /* fall through to built-ins */ }
    }
    const [name, ...rest] = input.split(/\s+/);
    const arg = rest.join(' ');
    switch (name.toLowerCase()) {
      case 'help':
        print('\x1b[36mcommands: help · clear · search <q> · copy · export [log|json] · pause|resume · top|bottom · font +|- · wrap on|off\x1b[0m');
        break;
      case 'clear': doClear(); break;
      case 'search': setQuery(arg); doSearch(arg); print(arg ? `\x1b[32msearching for “${arg}” — Enter jumps next, Shift+Enter previous\x1b[0m` : '\x1b[33mcleared search\x1b[0m'); break;
      case 'copy': doCopy(); break;
      case 'export': doExport(arg === 'json' ? 'json' : 'log'); print('\x1b[32mexported visible buffer\x1b[0m'); break;
      case 'pause': onToggleLive?.(); break;
      case 'resume':
      case 'live': if (!live) onToggleLive?.(); else print('\x1b[90malready live\x1b[0m'); break;
      case 'top': term?.scrollToTop(); break;
      case 'bottom': term?.scrollToBottom(); break;
      case 'font':
        if (arg === '+') setFontSize((f) => Math.min(20, f + 1));
        else if (arg === '-') setFontSize((f) => Math.max(9, f - 1));
        else print('\x1b[33musage: font + | font -\x1b[0m');
        break;
      case 'wrap':
        if (arg === 'off') setWrap(false);
        else if (arg === 'on') setWrap(true);
        else print('\x1b[33musage: wrap on | wrap off\x1b[0m');
        break;
      default:
        // Convenience: bare text acts as search
        setQuery(input); doSearch(input);
        print('\x1b[90m(treated as search — type "help" for commands)\x1b[0m');
    }
  }, [doClear, doCopy, doExport, doSearch, live, onCommand, onToggleLive]);

  const btn = 'h-8 px-2 rounded-lg border flex items-center justify-center gap-1 text-[11px] font-bold transition-all hover:-translate-y-px disabled:opacity-40';
  const btnStyle = { backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#334155' };

  return (
    <div className={`rounded-2xl border overflow-hidden ${expanded ? 'fixed inset-3 z-50 flex flex-col' : ''}`} style={{ backgroundColor: '#ffffff', borderColor: 'var(--border-primary)' }}>
      {/* window chrome */}
      <div className="flex items-center gap-2 px-3 py-2 border-b border-slate-200" style={{ backgroundColor: '#f8fafc' }}>
        <span className="flex gap-1.5">
          <i className="w-2.5 h-2.5 rounded-full bg-red-500/80 block" />
          <i className="w-2.5 h-2.5 rounded-full bg-amber-400/80 block" />
          <i className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
        </span>
        <span className="flex items-center gap-1.5 text-[11px] font-bold text-slate-600">
          <TerminalSquare className="w-3.5 h-3.5 text-indigo-500" />
          {live ? 'live — tailing' : 'paused'}
          <span className={`w-1.5 h-1.5 rounded-full ${live ? 'bg-emerald-500 animate-pulse' : 'bg-amber-500'}`} />
        </span>
        <span className="ml-auto text-[10px] text-slate-400 truncate max-w-[40%]">{statusText}</span>
      </div>

      {/* toolbar — every terminal operation */}
      <div className="flex items-center gap-1.5 px-2.5 py-2 flex-wrap border-b border-slate-200" style={{ backgroundColor: '#ffffff' }}>
        <button className={btn} style={btnStyle} onClick={onToggleLive} title={live ? 'Pause live tail' : 'Resume live tail'}>
          {live ? <Pause className="w-3.5 h-3.5" /> : <Play className="w-3.5 h-3.5" />}
          {live ? 'Pause' : 'Resume'}
        </button>
        <button className={btn} style={btnStyle} onClick={onRefresh} disabled={refreshing} title="Refresh from server">
          <RefreshCw className={`w-3.5 h-3.5 ${refreshing ? 'animate-spin' : ''}`} /> Refresh
        </button>
        <button className={btn} style={btnStyle} onClick={doClear} title="Clear terminal (clear)">
          <Trash2 className="w-3.5 h-3.5" /> Clear
        </button>
        <button className={btn} style={btnStyle} onClick={doCopy} title="Copy visible buffer">
          <Copy className="w-3.5 h-3.5" /> Copy
        </button>
        <button className={btn} style={btnStyle} onClick={() => doExport('log')} title="Download as .log (export)">
          <Download className="w-3.5 h-3.5" /> .log
        </button>
        <div className="flex items-center gap-1 ml-auto">
          <div className="relative">
            <Search className="w-3 h-3 absolute left-2 top-1/2 -translate-y-1/2 text-slate-500" />
            <input
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              onKeyDown={(e) => {
                if (e.key === 'Enter') doSearch(query, e.shiftKey ? -1 : 1);
                if (e.key === 'Escape') { setQuery(''); doSearch(''); }
              }}
              placeholder="Search… (Enter ⏎)"
              className="h-8 pl-7 pr-2 rounded-lg border text-[11px] outline-none w-40 focus:w-52 transition-all"
              style={{ backgroundColor: '#ffffff', borderColor: '#cbd5e1', color: '#0f172a' }}
            />
          </div>
          <button className={btn} style={btnStyle} onClick={() => doSearch(query, -1)} title="Previous match (Shift+Enter)"><ChevronUp className="w-3.5 h-3.5" /></button>
          <button className={btn} style={btnStyle} onClick={() => doSearch(query, 1)} title="Next match (Enter)"><ChevronDown className="w-3.5 h-3.5" /></button>
          <button className={btn} style={btnStyle} onClick={() => setFontSize((f) => Math.max(9, f - 1))} title="Smaller font"><Minus className="w-3.5 h-3.5" /></button>
          <button className={btn} style={btnStyle} onClick={() => setFontSize((f) => Math.min(20, f + 1))} title="Larger font"><Plus className="w-3.5 h-3.5" /></button>
          <button className={btn} style={{ ...btnStyle, color: wrap ? '#6366f1' : '#334155' }} onClick={() => setWrap((w) => !w)} title="Toggle line wrap">
            <WrapText className="w-3.5 h-3.5" />
          </button>
          <button className={btn} style={btnStyle} onClick={() => setExpanded((e) => !e)} title="Fullscreen">
            {expanded ? <Minimize2 className="w-3.5 h-3.5" /> : <Maximize2 className="w-3.5 h-3.5" />}
          </button>
        </div>
      </div>
      {matchInfo && <div className="px-3 py-1 text-[10px] font-semibold text-amber-700 border-b border-slate-200" style={{ backgroundColor: '#fffbeb' }}>{matchInfo} — Enter ↓ next · Shift+Enter ↑ prev · Esc clears</div>}

      {/* xterm viewport */}
      <div className="relative" style={{ height: expanded ? '60vh' : height }}>
        <div ref={containerRef} className="absolute inset-0 px-2 py-2" style={{ overflow: 'hidden' }} />
        {!ready && <div className="absolute inset-0 flex items-center justify-center text-xs text-slate-500">Starting terminal…</div>}
      </div>

      {/* interactive prompt — type `help` */}
      <form
        onSubmit={(e) => { e.preventDefault(); runCommand(cmd); setCmd(''); }}
        className="flex items-center gap-2 px-3 py-2 border-t border-slate-200"
        style={{ backgroundColor: '#f8fafc' }}
      >
        <span className="text-emerald-600 font-mono text-xs font-black select-none">$</span>
        <input
          value={cmd}
          onChange={(e) => setCmd(e.target.value)}
          placeholder='Type a command — try "help" (clear · search <q> · export · pause · font +)'
          className="flex-1 bg-transparent outline-none font-mono text-xs placeholder:text-slate-400"
          style={{ color: '#0f172a' }}
          spellCheck={false}
          autoComplete="off"
        />
        <button type="submit" className="text-[10px] font-black uppercase tracking-widest text-indigo-600 hover:text-indigo-500">run ⏎</button>
      </form>
    </div>
  );
});

export default LogTerminal;
