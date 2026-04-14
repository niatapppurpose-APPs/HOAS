import { useEffect, useMemo, useRef, useState } from 'react';
import { MessageSquareText, Send, Shield } from 'lucide-react';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../Toast';
import { getContextMessages, sendContextMessage } from '../../firebase/cloudFunctions';

const ContextChatBox = ({ contextType, contextId, title = 'Context Chat', readOnly = false }) => {
  const { user } = useAuth();
  const toast = useToast();
  const [messages, setMessages] = useState([]);
  const [conversation, setConversation] = useState(null);
  const [loading, setLoading] = useState(true);
  const [sending, setSending] = useState(false);
  const [input, setInput] = useState('');
  const endRef = useRef(null);

  const isClosed = useMemo(() => conversation?.isActive === false, [conversation]);
  const inputDisabled = readOnly || isClosed || sending;

  const refresh = async (silent = false) => {
    if (!contextType || !contextId) return;
    if (!silent) setLoading(true);
    try {
      const result = await getContextMessages({ contextType, contextId });
      setMessages(Array.isArray(result.messages) ? result.messages : []);
      setConversation(result.conversation || null);
    } catch (error) {
      if (!silent) toast.error(error.message || 'Unable to load chat messages');
    } finally {
      if (!silent) setLoading(false);
    }
  };

  useEffect(() => {
    refresh();
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextType, contextId]);

  useEffect(() => {
    if (!contextType || !contextId) return undefined;
    const timer = setInterval(() => {
      refresh(true);
    }, 6000);
    return () => clearInterval(timer);
  // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [contextType, contextId]);

  useEffect(() => {
    endRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
  }, [messages.length]);

  const onSend = async () => {
    const trimmed = input.trim();
    if (!trimmed) return;

    setSending(true);
    try {
      await sendContextMessage({
        contextType,
        contextId,
        message: trimmed,
      });
      setInput('');
      await refresh(true);
    } catch (error) {
      toast.error(error.message || 'Failed to send message');
    } finally {
      setSending(false);
    }
  };

  const onKeyDown = (e) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      if (!inputDisabled) onSend();
    }
  };

  const prettyTime = (value) => {
    if (!value) return '—';
    return new Date(value).toLocaleString('en-IN', {
      day: 'numeric',
      month: 'short',
      hour: '2-digit',
      minute: '2-digit',
    });
  };

  return (
    <div className="rounded-xl border p-3" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-tertiary)' }}>
      <div className="flex items-center justify-between gap-2 mb-2">
        <div className="flex items-center gap-2">
          <MessageSquareText className="w-4 h-4 text-blue-500" />
          <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</p>
        </div>
        <span className={`px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider ${isClosed ? 'bg-gray-200 text-gray-700' : 'bg-emerald-100 text-emerald-700'}`}>
          {isClosed ? 'Closed' : 'Active'}
        </span>
      </div>

      {readOnly && (
        <div className="mb-2 text-[11px] flex items-center gap-1 text-amber-600">
          <Shield className="w-3.5 h-3.5" /> Read-only (management audit view)
        </div>
      )}

      <div className="h-52 overflow-y-auto rounded-lg border px-2 py-2 space-y-2" style={{ borderColor: 'var(--border-primary)', backgroundColor: 'var(--bg-card)' }}>
        {loading ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Loading messages...</p>
        ) : messages.length === 0 ? (
          <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No messages yet for this context.</p>
        ) : (
          messages.map((msg) => {
            const mine = msg.senderId === user?.uid;
            return (
              <div key={msg.id} className={`max-w-[90%] ${mine ? 'ml-auto text-right' : 'mr-auto text-left'}`}>
                <div className={`inline-block px-2.5 py-1.5 rounded-lg text-xs ${mine ? 'bg-blue-600 text-white' : 'bg-gray-100 text-gray-800'}`}>
                  {!mine && (
                    <p className="text-[10px] font-bold opacity-70 mb-0.5">{msg.senderRole || 'user'}</p>
                  )}
                  <p>{msg.message}</p>
                </div>
                <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>{prettyTime(msg.createdAt)}</p>
              </div>
            );
          })
        )}
        <div ref={endRef} />
      </div>

      <div className="mt-2 flex items-end gap-2">
        <textarea
          value={input}
          onChange={(e) => setInput(e.target.value)}
          onKeyDown={onKeyDown}
          disabled={inputDisabled}
          rows={2}
          maxLength={500}
          placeholder={isClosed ? 'Conversation closed' : readOnly ? 'Read-only mode' : 'Type a message (context only)'}
          className="flex-1 px-3 py-2 rounded-lg border text-sm resize-none disabled:opacity-60"
        />
        <button
          onClick={onSend}
          disabled={inputDisabled || !input.trim()}
          className="px-3 py-2 rounded-lg bg-blue-600 text-white disabled:opacity-50"
          title="Send"
        >
          <Send className="w-4 h-4" />
        </button>
      </div>
      <p className="mt-1 text-[10px]" style={{ color: 'var(--text-muted)' }}>Audit policy: context-bound messaging only, max 10 messages, duplicate/rate-limit protection.</p>
    </div>
  );
};

export default ContextChatBox;
