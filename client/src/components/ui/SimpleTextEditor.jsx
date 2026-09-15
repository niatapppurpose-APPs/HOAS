import { useState, useRef } from 'react';
import {
  Bold, Italic, Strikethrough, Heading2, List, ListOrdered,
  Link2, Code, Eye, Edit3
} from 'lucide-react';

export default function SimpleTextEditor({
  value = '',
  onChange,
  placeholder = 'Write announcement, complaint details, or message...',
  minRows = 5,
  maxLength = 2000,
  className = '',
}) {
  const [content, setContent] = useState(value);
  const [isPreview, setIsPreview] = useState(false);
  const textareaRef = useRef(null);

  const updateText = (newText) => {
    setContent(newText);
    if (onChange) onChange(newText);
  };

  const applyFormat = (prefix, suffix = '') => {
    const el = textareaRef.current;
    if (!el) return;

    const start = el.selectionStart;
    const end = el.selectionEnd;
    const selected = content.substring(start, end);
    const replacement = `${prefix}${selected || 'text'}${suffix}`;
    const newContent = content.substring(0, start) + replacement + content.substring(end);

    updateText(newContent);
    setTimeout(() => {
      el.focus();
      el.setSelectionRange(start + prefix.length, start + prefix.length + (selected.length || 4));
    }, 10);
  };

  const wordCount = content.trim() ? content.trim().split(/\s+/).length : 0;

  return (
    <div
      className={`rounded-3xl border overflow-hidden transition-all focus-within:border-indigo-500/50 shadow-sm ${className}`}
      style={{
        backgroundColor: 'var(--bg-modal, #0f172a)',
        borderColor: 'var(--border-primary, rgba(255,255,255,0.1))',
      }}
    >
      {/* Toolbar */}
      <div
        className="flex items-center justify-between gap-1 p-2 border-b overflow-x-auto no-scrollbar"
        style={{
          borderColor: 'var(--border-primary, rgba(255,255,255,0.08))',
          backgroundColor: 'rgba(0,0,0,0.15)',
        }}
      >
        <div className="flex items-center gap-1">
          <button
            type="button"
            onClick={() => applyFormat('**', '**')}
            title="Bold"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Bold className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('*', '*')}
            title="Italic"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Italic className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('~~', '~~')}
            title="Strikethrough"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Strikethrough className="w-4 h-4" />
          </button>

          <span className="w-px h-4 bg-white/10 mx-1" />

          <button
            type="button"
            onClick={() => applyFormat('## ')}
            title="Heading"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Heading2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('- ')}
            title="Bullet List"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <List className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('1. ')}
            title="Numbered List"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <ListOrdered className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('[', '](https://)')}
            title="Link"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Link2 className="w-4 h-4" />
          </button>
          <button
            type="button"
            onClick={() => applyFormat('`', '`')}
            title="Code"
            className="p-1.5 rounded-xl hover:bg-white/10 text-slate-300 hover:text-white transition"
          >
            <Code className="w-4 h-4" />
          </button>
        </div>

        {/* Preview toggle */}
        <button
          type="button"
          onClick={() => setIsPreview(!isPreview)}
          className={`flex items-center gap-1.5 px-3 py-1 rounded-xl text-xs font-semibold transition ${
            isPreview
              ? 'bg-indigo-600 text-white'
              : 'hover:bg-white/10 text-slate-400 hover:text-white'
          }`}
        >
          {isPreview ? (
            <>
              <Edit3 className="w-3.5 h-3.5" /> <span>Edit</span>
            </>
          ) : (
            <>
              <Eye className="w-3.5 h-3.5" /> <span>Preview</span>
            </>
          )}
        </button>
      </div>

      {/* Editor Body or Markdown Preview */}
      <div className="p-4">
        {isPreview ? (
          <div className="prose dark:prose-invert max-w-none min-h-[140px] text-sm text-slate-200 whitespace-pre-wrap leading-relaxed">
            {content || <span className="text-slate-500 italic">No content to preview</span>}
          </div>
        ) : (
          <textarea
            ref={textareaRef}
            rows={minRows}
            maxLength={maxLength}
            value={content}
            onChange={(e) => updateText(e.target.value)}
            placeholder={placeholder}
            className="w-full bg-transparent text-sm leading-relaxed outline-none resize-y placeholder:text-slate-500 font-sans"
            style={{ color: 'var(--text-primary)' }}
          />
        )}
      </div>

      {/* Footer character counter */}
      <div
        className="flex items-center justify-between px-4 py-2 border-t text-[11px] text-slate-400"
        style={{
          borderColor: 'var(--border-primary, rgba(255,255,255,0.08))',
          backgroundColor: 'rgba(0,0,0,0.1)',
        }}
      >
        <span>{wordCount} words</span>
        <span>
          {content.length} / {maxLength} chars
        </span>
      </div>
    </div>
  );
}
