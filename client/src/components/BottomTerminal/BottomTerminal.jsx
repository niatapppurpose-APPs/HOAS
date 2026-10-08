import { useEffect, useRef, useState, useCallback } from 'react';
import { Terminal } from '@xterm/xterm';
import { FitAddon } from '@xterm/addon-fit';
import '@xterm/xterm/css/xterm.css';
import { X, Trash2, Eye, EyeOff, Download } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useTheme } from '../../context/ThemeContext';
import useSocket from '../../hooks/useSocket';
import { isSecureUnlocked } from '../SecureGate/SecureGate';
import * as cloudFunctions from '../../firebase/cloudFunctions';
import {
  ANSI,
  LIGHT_TERM_THEME,
  serverEntryToAnsi,
  serverEntryToText,
  auditEntryToAnsi,
  auditEntryToText,
} from '../LogTerminal/ansi';
import { TERMINAL_EVENT, emitTerminalState } from './terminalBus';

const DRAWER_H = '44vh';
const MAX_PRINT = 120;

const HELP = [
  `${ANSI.bold}${ANSI.cyan}HOAS log terminal — command reference${ANSI.reset}`,
  `  ${ANSI.green}logs [N] [level]${ANSI.reset}        show last N server lines (default 25). e.g. ${ANSI.gray}logs 50 error${ANSI.reset}`,
  `  ${ANSI.green}tail [N] [level]${ANSI.reset}        same as logs`,
  `  ${ANSI.green}grep <pattern> [-i] [--level=L] [N]${ANSI.reset}`,
  `                            search server logs, e.g. ${ANSI.gray}grep "/api/fees" -i --level=error${ANSI.reset}`,
  `  ${ANSI.green}audit [N]${ANSI.reset}               show last N audit entries (default 25)`,
  `  ${ANSI.green}agrep <pattern> [-i] [N]${ANSI.reset} search the audit trail, e.g. ${ANSI.gray}agrep "fee" -i${ANSI.reset}`,
  `  ${ANSI.green}level <all|info|warn|error>${ANSI.reset} default level filter for logs/tail/grep`,
  `  ${ANSI.green}watch on|off${ANSI.reset}            live-stream new lines as they arrive`,
  `  ${ANSI.green}export [log|json] [server|audit]${ANSI.reset} download last fetched buffer`,
  `  ${ANSI.green}theme <light|dark|toggle>${ANSI.reset} switch the app theme`,
  `  ${ANSI.green}uptime${ANSI.reset}                  backend uptime + memory`,
  `  ${ANSI.green}whoami${ANSI.reset}                  current user + role`,
  `  ${ANSI.green}clear${ANSI.reset}                   clear screen (Ctrl+L)      ${ANSI.green}close${ANSI.reset} hides panel (Ctrl+\`)`,
];

/** Split a command line into tokens, honoring "double quotes". */
function tokenize(line) {
  const out = [];
  let cur = '';
  let quote = null;
  for (const ch of line.trim()) {
    if (quote) {
      if (ch === quote) quote = null;
      else cur += ch;
    } else if (ch === '"' || ch === "'") {
      quote = ch;
    } else if (/\s/.test(ch)) {
      if (cur) { out.push(cur); cur = ''; }
    } else cur += ch;
  }
  if (cur) out.push(cur);
  return out;
}

/**
 * BottomTerminal — VS Code-style bottom drawer shell for the Owner section.
 * Opens from the website bottom via the sidebar/header terminal button or
 * Ctrl+` . Log-reading commands reuse the SecureGate OTP unlock: run them
 * only after verifying on the Server Logs / Audit Logs pages.
 */
const BottomTerminal = () => {
  const { user, userData, isAdmin } = useAuth();
  const { setLightMode, setDarkMode, toggleTheme, isDark } = useTheme();
  useSocket();
  const [open, setOpen] = useState(false);
  const [watch, setWatch] = useState(false);

  const containerRef = useRef(null);
  const termRef = useRef(null);
  const fitRef = useRef(null);
  const openRef = useRef(false);
  const inputRef = useRef('');
  const historyRef = useRef([]);
  const historyIdxRef = useRef(-1);
  const watchRef = useRef(false);
  const levelRef = useRef('all');
  const greetedRef = useRef(false);
  const serverBufRef = useRef([]); // raw server entries, newest first
  const auditBufRef = useRef([]);  // raw audit entries, newest first
  const authRef = useRef({ isAdmin });
  authRef.current = { isAdmin };

  const setOpenBoth = useCallback((v) => {
    openRef.current = v;
    setOpen(v);
    emitTerminalState(v);
  }, []);

  const writePrompt = useCallback(() => {
    termRef.current?.write(`\r\n${ANSI.bold}${ANSI.green}owner@hoas${ANSI.reset}:${ANSI.bold}${ANSI.blue}~/logs${ANSI.reset}$ `);
  }, []);

  const println = useCallback((msg = '') => {
    termRef.current?.writeln(msg);
  }, []);

  // ---------- guards ----------
  const requireLogsAccess = useCallback((kind) => {
    if (!authRef.current.isAdmin) {
      println(`${ANSI.red}✕ owner/admin only. Sign in with an owner account.${ANSI.reset}`);
      return false;
    }
    const purpose = kind === 'audit' ? 'audit-logs' : 'server-logs';
    if (!isSecureUnlocked(purpose)) {
      const page = kind === 'audit' ? 'Audit Logs' : 'Server Logs';
      println(`${ANSI.yellow}🔒 locked — open the ${page} page and verify the emailed code first,`);
      println(`   then come back here. (Unlock lasts 15 minutes.)${ANSI.reset}`);
      return false;
    }
    return true;
  }, [println]);

  // ---------- fetchers ----------
  const fetchServer = useCallback(async (n = 25, level = levelRef.current) => {
    const res = await cloudFunctions.getServerLogs({
      level: level === 'all' ? undefined : level,
      limit: Math.max(1, Math.min(500, n || 25)),
    });
    const entries = res?.entries || [];
    serverBufRef.current = entries;
    return { entries, runtime: res?.runtime || null };
  }, []);

  const fetchAudit = useCallback(async (n = 25) => {
    const res = await cloudFunctions.getSettingsAuditLogs({ limit: Math.max(1, Math.min(500, n || 25)) });
    const logs = res?.logs || [];
    auditBufRef.current = logs;
    return logs;
  }, []);

  const printServerEntries = useCallback((entries, { plain = false } = {}) => {
    const list = entries.slice().reverse(); // oldest first so newest lands by the prompt
    const shown = list.slice(-MAX_PRINT);
    for (const e of shown) println(plain ? serverEntryToText(e) : serverEntryToAnsi(e));
    if (list.length > shown.length) println(`${ANSI.gray}… ${list.length - shown.length} more lines (narrow with grep or a smaller N)${ANSI.reset}`);
    else if (!list.length) println(`${ANSI.gray}(no entries)${ANSI.reset}`);
  }, [println]);

  const highlight = (text, pattern, insensitive) => {
    try {
      const rx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'gi' : 'g');
      return text.replace(rx, (m) => `\x1b[43m\x1b[30m${m}${ANSI.reset}`);
    } catch {
      return text;
    }
  };

  // ---------- command execution ----------
  const execute = useCallback(async (raw) => {
    const line = raw.trim();
    if (!line) { writePrompt(); return; }
    historyRef.current.push(line);
    if (historyRef.current.length > 100) historyRef.current.shift();
    historyIdxRef.current = -1;

    const [cmd, ...args] = tokenize(line);
    const name = (cmd || '').toLowerCase();

    const numArg = (dflt, max = 500) => {
      const n = args.map(Number).find((v) => Number.isFinite(v) && v > 0);
      return Math.min(max, Math.max(1, Math.round(n || dflt)));
    };
    const flag = (f) => args.includes(f);
    const levelFlag = () => {
      const m = args.find((a) => a.startsWith('--level='));
      const lv = (m ? m.split('=')[1] : levelRef.current).toLowerCase();
      return ['all', 'info', 'warn', 'error'].includes(lv) ? lv : levelRef.current;
    };
    const positionalLevel = () => {
      const lv = args.map((a) => String(a).toLowerCase()).find((a) => ['all', 'info', 'warn', 'error'].includes(a));
      return lv || levelRef.current;
    };

    try {
      switch (name) {
        case 'help':
        case '?':
          HELP.forEach(println);
          break;

        case 'logs':
        case 'tail': {
          if (!requireLogsAccess('server')) break;
          const lv = positionalLevel();
          println(`${ANSI.gray}— last ${numArg(25)} server lines [${lv}] —${ANSI.reset}`);
          const { entries } = await fetchServer(numArg(25), lv);
          printServerEntries(entries);
          break;
        }

        case 'grep': {
          if (!requireLogsAccess('server')) break;
          const pattern = args.find((a) => !a.startsWith('-') && Number.isNaN(Number(a)));
          if (!pattern) { println(`${ANSI.yellow}usage: grep <pattern> [-i] [--level=L] [N]${ANSI.reset}`); break; }
          const insensitive = flag('-i') || flag('--insensitive');
          const lv = levelFlag();
          if (!serverBufRef.current.length) await fetchServer(200, lv);
          const pool = serverBufRef.current.filter((e) => lv === 'all' || e.level === lv);
          const rx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'i' : '');
          const hits = pool.filter((e) => rx.test(serverEntryToText(e))).slice(0, numArg(100));
          println(`${ANSI.gray}— grep "${pattern}" [${lv}] → ${hits.length} match${hits.length === 1 ? '' : 'es'} —${ANSI.reset}`);
          for (const e of hits.slice().reverse()) println(highlight(serverEntryToText(e), pattern, insensitive));
          if (!hits.length) println(`${ANSI.gray}(no matches — try -i for case-insensitive)${ANSI.reset}`);
          break;
        }

        case 'audit': {
          if (!requireLogsAccess('audit')) break;
          const n = numArg(25);
          println(`${ANSI.gray}— last ${n} audit entries —${ANSI.reset}`);
          const logs = await fetchAudit(n);
          const shown = logs.slice().reverse().slice(-MAX_PRINT);
          for (const l of shown) println(auditEntryToAnsi(l));
          if (!logs.length) println(`${ANSI.gray}(no entries)${ANSI.reset}`);
          break;
        }

        case 'agrep': {
          if (!requireLogsAccess('audit')) break;
          const pattern = args.find((a) => !a.startsWith('-') && Number.isNaN(Number(a)));
          if (!pattern) { println(`${ANSI.yellow}usage: agrep <pattern> [-i] [N]${ANSI.reset}`); break; }
          const insensitive = flag('-i') || flag('--insensitive');
          if (!auditBufRef.current.length) await fetchAudit(200);
          const rx = new RegExp(pattern.replace(/[.*+?^${}()|[\]\\]/g, '\\$&'), insensitive ? 'i' : '');
          const hits = auditBufRef.current.filter((l) => rx.test(auditEntryToText(l))).slice(0, numArg(100));
          println(`${ANSI.gray}— agrep "${pattern}" → ${hits.length} match${hits.length === 1 ? '' : 'es'} —${ANSI.reset}`);
          for (const l of hits.slice().reverse()) println(highlight(auditEntryToText(l), pattern, insensitive));
          if (!hits.length) println(`${ANSI.gray}(no matches — try -i for case-insensitive)${ANSI.reset}`);
          break;
        }

        case 'level': {
          const lv = String(args[0] || '').toLowerCase();
          if (!['all', 'info', 'warn', 'error'].includes(lv)) {
            println(`${ANSI.yellow}usage: level <all|info|warn|error>  (current: ${levelRef.current})${ANSI.reset}`);
          } else {
            levelRef.current = lv;
            println(`${ANSI.green}default level → ${lv}${ANSI.reset}`);
          }
          break;
        }

        case 'watch': {
          const v = String(args[0] || '').toLowerCase();
          if (v === 'on' || v === 'off') {
            if (v === 'on' && !requireLogsAccess('server')) break;
            watchRef.current = v === 'on';
            setWatch(watchRef.current);
            println(watchRef.current
              ? `${ANSI.green}● watching — new server + audit lines stream here (watch off to stop)${ANSI.reset}`
              : `${ANSI.gray}○ watch stopped${ANSI.reset}`);
          } else {
            println(`${ANSI.yellow}usage: watch on|off  (now: ${watchRef.current ? 'on' : 'off'})${ANSI.reset}`);
          }
          break;
        }

        case 'export': {
          const fmt = args.includes('json') ? 'json' : 'log';
          const which = args.includes('audit') ? 'audit' : 'server';
          if (!requireLogsAccess(which)) break;
          const buf = which === 'audit' ? auditBufRef.current : serverBufRef.current;
          if (!buf.length) { println(`${ANSI.yellow}(nothing fetched yet — run logs/audit first)${ANSI.reset}`); break; }
          const toText = which === 'audit' ? auditEntryToText : serverEntryToText;
          const body = fmt === 'json' ? JSON.stringify(buf, null, 2) : buf.slice().reverse().map(toText).join('\n');
          const blob = new Blob([body], { type: fmt === 'json' ? 'application/json' : 'text/plain;charset=utf-8' });
          const a = document.createElement('a');
          a.href = URL.createObjectURL(blob);
          a.download = `hoas-${which}-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.${fmt === 'json' ? 'json' : 'log'}`;
          a.click();
          setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          println(`${ANSI.green}exported ${buf.length} ${which} entries as .${fmt === 'json' ? 'json' : 'log'}${ANSI.reset}`);
          break;
        }

        case 'theme': {
          const m = String(args[0] || 'toggle').toLowerCase();
          if (m === 'light') setLightMode();
          else if (m === 'dark') setDarkMode();
          else toggleTheme();
          println(`${ANSI.green}theme → ${m === 'toggle' ? (isDark ? 'light' : 'dark') : m}${ANSI.reset}`);
          break;
        }

        case 'uptime': {
          if (!requireLogsAccess('server')) break;
          const { runtime } = await fetchServer(1);
          if (runtime) println(`${ANSI.cyan}uptime ${Math.floor((runtime.uptimeSeconds || 0) / 3600)}h ${Math.floor(((runtime.uptimeSeconds || 0) % 3600) / 60)}m · node ${runtime.node} · rss ${runtime.rssMB} MB · heap ${runtime.heapUsedMB} MB${ANSI.reset}`);
          else println(`${ANSI.gray}(no runtime info)${ANSI.reset}`);
          break;
        }

        case 'whoami':
          println(`${ANSI.cyan}${user?.email || 'unknown'}${ANSI.reset}${ANSI.gray} · role ${userData?.role || (isAdmin ? 'admin' : '?')} · OTP server-logs ${isSecureUnlocked('server-logs') ? 'unlocked' : 'locked'} · audit ${isSecureUnlocked('audit-logs') ? 'unlocked' : 'locked'}${ANSI.reset}`);
          break;

        case 'clear':
          termRef.current?.clear();
          break;

        case 'close':
        case 'exit':
        case 'quit':
          setOpenBoth(false);
          break;

        default:
          println(`${ANSI.red}unknown command: ${cmd}${ANSI.reset}  ${ANSI.gray}(type ${ANSI.reset}help${ANSI.gray} for the reference)${ANSI.reset}`);
      }
    } catch (err) {
      println(`${ANSI.red}error: ${err?.message || 'command failed'}${ANSI.reset}`);
    }
    if (openRef.current && name !== 'clear') writePrompt();
  }, [println, writePrompt, requireLogsAccess, fetchServer, fetchAudit, printServerEntries, setLightMode, setDarkMode, toggleTheme, isDark, user, userData, isAdmin, setOpenBoth]);

  const executeRef = useRef(execute);
  executeRef.current = execute;

  // ---------- xterm lifecycle (mount once) ----------
  useEffect(() => {
    const term = new Terminal({
      cursorBlink: true,
      cursorStyle: 'bar',
      fontSize: 12,
      fontFamily: 'JetBrains Mono, ui-monospace, SFMono-Regular, Menlo, Consolas, monospace',
      lineHeight: 1.35,
      scrollback: 3000,
      theme: LIGHT_TERM_THEME,
    });
    const fit = new FitAddon();
    term.loadAddon(fit);
    term.open(containerRef.current);
    termRef.current = term;
    fitRef.current = fit;

    term.writeln(`${ANSI.bold}${ANSI.cyan}HOAS owner terminal${ANSI.reset} ${ANSI.gray}— type ${ANSI.reset}help${ANSI.gray} for grep-like log commands, Ctrl+\` toggles${ANSI.reset}`);

    term.onData((data) => {
      // Arrow keys / special sequences arrive whole
      if (data === '\x1b[A') { // Up — history prev
        const h = historyRef.current;
        if (!h.length) return;
        if (historyIdxRef.current === -1) historyIdxRef.current = h.length - 1;
        else if (historyIdxRef.current > 0) historyIdxRef.current -= 1;
        term.write('\b \b'.repeat(inputRef.current.length));
        inputRef.current = h[historyIdxRef.current] || '';
        term.write(inputRef.current);
        return;
      }
      if (data === '\x1b[B') { // Down — history next
        const h = historyRef.current;
        if (historyIdxRef.current === -1) return;
        if (historyIdxRef.current < h.length - 1) {
          historyIdxRef.current += 1;
          term.write('\b \b'.repeat(inputRef.current.length));
          inputRef.current = h[historyIdxRef.current];
          term.write(inputRef.current);
        } else {
          historyIdxRef.current = -1;
          term.write('\b \b'.repeat(inputRef.current.length));
          inputRef.current = '';
        }
        return;
      }
      for (const ch of data) {
        const code = ch.charCodeAt(0);
        if (ch === '\r') { // Enter
          term.write('\r\n');
          const cmd = inputRef.current;
          inputRef.current = '';
          executeRef.current(cmd);
        } else if (code === 127 || code === 8) { // Backspace
          if (inputRef.current.length) {
            inputRef.current = inputRef.current.slice(0, -1);
            term.write('\b \b');
          }
        } else if (code === 3) { // Ctrl+C
          term.write('^C');
          inputRef.current = '';
          historyIdxRef.current = -1;
          term.write('\r\n');
          executeRef.current('');
        } else if (code === 12) { // Ctrl+L
          term.clear();
        } else if (code === 21) { // Ctrl+U — kill line
          term.write('\b \b'.repeat(inputRef.current.length));
          inputRef.current = '';
        } else if (code < 32) {
          // ignore other control chars (incl. lone ESC)
        } else {
          inputRef.current += ch;
          term.write(ch);
        }
      }
    });

    const onResize = () => { if (openRef.current) { try { fit.fit(); } catch { /* noop */ } } };
    window.addEventListener('resize', onResize);
    return () => {
      window.removeEventListener('resize', onResize);
      try { term.dispose(); } catch { /* noop */ }
      termRef.current = null;
    };
  }, []);

  // ---------- open/close bus + shortcuts ----------
  useEffect(() => {
    const onBus = (e) => {
      const action = e?.detail?.action;
      if (action === 'open') setOpenBoth(true);
      else if (action === 'close') setOpenBoth(false);
      else setOpenBoth(!openRef.current);
    };
    const onKey = (e) => {
      const mod = e.ctrlKey || e.metaKey;
      if (mod && e.code === 'Backquote') {
        e.preventDefault();
        setOpenBoth(!openRef.current);
      } else if (e.key === 'Escape' && openRef.current) {
        const tag = document.activeElement?.tagName;
        if (tag !== 'INPUT' && tag !== 'TEXTAREA') setOpenBoth(false);
      }
    };
    window.addEventListener(TERMINAL_EVENT, onBus);
    window.addEventListener('keydown', onKey);
    return () => {
      window.removeEventListener(TERMINAL_EVENT, onBus);
      window.removeEventListener('keydown', onKey);
    };
  }, [setOpenBoth]);

  // Fit after slide animation + greet on first open
  useEffect(() => {
    if (!open) return;
    const t = setTimeout(() => {
      try { fitRef.current?.fit(); } catch { /* noop */ }
      if (!greetedRef.current) {
        greetedRef.current = true;
        termRef.current?.writeln(`${ANSI.gray}tip: ${ANSI.reset}logs 30${ANSI.gray} · ${ANSI.reset}grep "/api/fees" -i${ANSI.gray} · ${ANSI.reset}watch on${ANSI.gray} — full list via ${ANSI.reset}help`);
      }
      writePrompt();
    }, 320);
    return () => clearTimeout(t);
  }, [open, writePrompt]);

  // Watch mode: stream socket pushes straight into the shell
  useEffect(() => {
    const onLog = (e) => {
      if (!watchRef.current) return;
      const entry = e?.detail?.entry || e?.detail;
      if (!entry?.id) return;
      if (levelRef.current !== 'all' && entry.level !== levelRef.current) return;
      termRef.current?.writeln(serverEntryToAnsi(entry));
    };
    const onAudit = (e) => {
      if (!watchRef.current) return;
      const entry = e?.detail?.entry || e?.detail?.log || e?.detail;
      if (!entry || (!entry._id && !entry.action)) return;
      termRef.current?.writeln(auditEntryToAnsi(entry));
    };
    window.addEventListener('hoas:log-new', onLog);
    window.addEventListener('hoas:audit-new', onAudit);
    return () => {
      window.removeEventListener('hoas:log-new', onLog);
      window.removeEventListener('hoas:audit-new', onAudit);
    };
  }, []);

  const clearScreen = () => {
    termRef.current?.clear();
    if (open) writePrompt();
  };

  return (
    <div
      className="fixed inset-x-0 bottom-[76px] lg:bottom-0 z-[60]"
      style={{
        height: DRAWER_H,
        transform: open ? 'translateY(0)' : 'translateY(102%)',
        transition: 'transform 0.32s cubic-bezier(0.33, 1, 0.68, 1), visibility 0s',
        transitionDelay: open ? '0s' : '0s, 0.32s',
        visibility: open ? 'visible' : 'hidden',
        pointerEvents: open ? 'auto' : 'none',
      }}
      role="complementary"
      aria-label="Owner log terminal"
      aria-hidden={!open}
    >
      <div className="h-full mx-0 lg:mx-0 border-t-2 border-x-0 lg:border-x-0 flex flex-col overflow-hidden rounded-t-2xl shadow-2xl" style={{ backgroundColor: '#ffffff', borderColor: 'rgba(99,102,241,0.45)', boxShadow: '0 -18px 60px -12px rgba(0,0,0,0.25)' }}>
        {/* drawer header */}
        <div className="flex items-center gap-2 px-3 py-1.5 border-b border-slate-200 select-none" style={{ backgroundColor: '#f8fafc' }}>
          <span className="flex gap-1.5">
            <i className="w-2.5 h-2.5 rounded-full bg-red-500/80 block" />
            <i className="w-2.5 h-2.5 rounded-full bg-amber-400/80 block" />
            <i className="w-2.5 h-2.5 rounded-full bg-emerald-500/80 block" />
          </span>
          <span className="text-[11px] font-black tracking-widest text-slate-600">TERMINAL</span>
          <button
            onClick={() => { watchRef.current = !watchRef.current; setWatch(watchRef.current); println(watchRef.current ? `${ANSI.green}● watching${ANSI.reset}` : `${ANSI.gray}○ watch stopped${ANSI.reset}`); if (open) writePrompt(); }}
            className="ml-2 h-7 px-2 rounded-lg border flex items-center gap-1 text-[10px] font-bold"
            style={{ backgroundColor: watch ? 'rgba(22,163,74,0.12)' : '#f1f5f9', borderColor: '#e2e8f0', color: watch ? '#15803d' : '#334155' }}
            title="Live-stream new log lines (watch on|off)"
          >
            {watch ? <Eye className="w-3 h-3" /> : <EyeOff className="w-3 h-3" />}
            {watch ? 'watching' : 'watch'}
          </button>
          <span className="ml-auto hidden sm:block text-[10px] text-slate-400 font-mono">Ctrl+` toggles · Esc closes · type help</span>
          <button onClick={clearScreen} className="h-7 w-7 rounded-lg border flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#334155' }} title="Clear (clear)">
            <Trash2 className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => {
            const buf = serverBufRef.current;
            if (!buf.length) { println(`${ANSI.yellow}(nothing fetched yet — run logs first)${ANSI.reset}`); if (open) writePrompt(); return; }
            const blob = new Blob([buf.slice().reverse().map(serverEntryToText).join('\n')], { type: 'text/plain;charset=utf-8' });
            const a = document.createElement('a');
            a.href = URL.createObjectURL(blob);
            a.download = `hoas-terminal-${new Date().toISOString().slice(0, 19).replace(/[:T]/g, '-')}.log`;
            a.click();
            setTimeout(() => URL.revokeObjectURL(a.href), 2000);
          }} className="h-7 w-7 rounded-lg border flex items-center justify-center" style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#334155' }} title="Download last buffer (.log)">
            <Download className="w-3.5 h-3.5" />
          </button>
          <button onClick={() => setOpenBoth(false)} className="h-7 w-7 rounded-lg border flex items-center justify-center hover:bg-red-500/20" style={{ backgroundColor: '#f1f5f9', borderColor: '#e2e8f0', color: '#334155' }} title="Close (Esc)">
            <X className="w-3.5 h-3.5" />
          </button>
        </div>
        {/* xterm viewport */}
        <div className="relative flex-1 min-h-0">
          <div ref={containerRef} className="absolute inset-0 px-2 py-1" style={{ overflow: 'hidden' }} />
        </div>
      </div>
    </div>
  );
};

export default BottomTerminal;
