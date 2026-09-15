import { useState } from 'react';
import { Copy, Check, Terminal } from 'lucide-react';

export default function CodeSnippet({
  code = '',
  language = 'bash',
  title = '',
  showLineNumbers = false,
  className = '',
}) {
  const [copied, setCopied] = useState(false);

  const handleCopy = async () => {
    try {
      await navigator.clipboard.writeText(code);
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    } catch {
      // fallback
    }
  };

  const lines = code.trim().split('\n');

  return (
    <div
      className={`rounded-2xl border overflow-hidden font-mono text-xs shadow-lg ${className}`}
      style={{
        backgroundColor: '#0a0f1d',
        borderColor: 'rgba(255, 255, 255, 0.1)',
      }}
    >
      {/* Top bar */}
      <div className="flex items-center justify-between px-4 py-2.5 bg-white/[0.03] border-b border-white/[0.06]">
        <div className="flex items-center gap-2">
          <Terminal className="w-3.5 h-3.5 text-indigo-400" />
          {title ? (
            <span className="text-slate-300 font-sans font-semibold text-xs">{title}</span>
          ) : (
            <span className="text-slate-400 uppercase text-[10px] tracking-wider font-bold">
              {language}
            </span>
          )}
        </div>

        <button
          type="button"
          onClick={handleCopy}
          className="flex items-center gap-1.5 px-2.5 py-1 rounded-lg bg-white/5 hover:bg-white/10 text-slate-300 hover:text-white transition"
          aria-label="Copy code snippet"
        >
          {copied ? (
            <>
              <Check className="w-3.5 h-3.5 text-emerald-400" />
              <span className="text-[11px] text-emerald-400 font-sans font-semibold">Copied</span>
            </>
          ) : (
            <>
              <Copy className="w-3.5 h-3.5" />
              <span className="text-[11px] font-sans font-semibold">Copy</span>
            </>
          )}
        </button>
      </div>

      {/* Code contents */}
      <div className="p-4 overflow-x-auto text-slate-200 leading-relaxed">
        {showLineNumbers ? (
          <table className="w-full border-collapse">
            <tbody>
              {lines.map((line, idx) => (
                <tr key={idx}>
                  <td className="pr-4 text-right select-none text-slate-600 w-8">{idx + 1}</td>
                  <td className="whitespace-pre">{line}</td>
                </tr>
              ))}
            </tbody>
          </table>
        ) : (
          <pre className="whitespace-pre-wrap break-all">{code}</pre>
        )}
      </div>
    </div>
  );
}
