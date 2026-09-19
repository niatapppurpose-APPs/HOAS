import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { ClipboardList, UserPlus, User } from 'lucide-react';
import StudentHeader from '../layout/StudentHeader';
import { useToast } from '../../../../components/Toast';
import useRealtimeRefresh from '../../../../hooks/useRealtimeRefresh';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';

const inputCls = 'h-10 px-3 rounded-xl border text-sm outline-none w-full';
const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-primary)',
  color: 'var(--text-primary)',
};

const statusStyle = (s) => {
  if (s === 'checked-in') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (s === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (s === 'denied') return 'bg-red-500/10 text-red-500 border-red-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const StudentVisitors = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [form, setForm] = useState({ visitorName: '', phone: '', purpose: '', meetPersonName: '' });

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await cloudFunctions.listVisitors();
      setVisitors(res?.visitors || []);
    } catch (err) {
      if (!silent) toast.error(err?.message || 'Could not load visitors');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh({ events: ['hoas:visitor-updated'], refetch: () => load(true) });

  const active = useMemo(
    () => visitors.filter((v) => v.status === 'pending' || v.status === 'checked-in'),
    [visitors],
  );
  const past = useMemo(
    () => visitors.filter((v) => v.status === 'checked-out' || v.status === 'denied'),
    [visitors],
  );

  const preregister = async (e) => {
    e.preventDefault();
    if (!form.visitorName.trim() || !form.purpose.trim()) {
      toast.warning('Visitor name and purpose are required.');
      return;
    }
    setSaving(true);
    try {
      await cloudFunctions.createVisitor({ ...form });
      setForm({ visitorName: '', phone: '', purpose: '', meetPersonName: '' });
      toast.success('Visitor pre-registered — warden will approve on arrival');
      await load(true);
    } catch (err) {
      toast.error(err?.message || 'Request failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <StudentHeader title="My Visitors · Student Portal" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            <ClipboardList className="inline w-6 h-6 text-indigo-500 mr-2 -mt-1" />
            My Visitors
          </h2>
          <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
            Pre-register guests so the gate clears them faster
          </p>
        </div>

        <form
          onSubmit={preregister}
          className="rounded-2xl border p-4 sm:p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 gap-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2 sm:col-span-2 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            <UserPlus className="w-4 h-4 text-indigo-500" /> Pre-register a visitor
          </div>
          {[
            { k: 'visitorName', ph: 'Visitor name *' },
            { k: 'phone', ph: 'Phone' },
            { k: 'purpose', ph: 'Purpose of visit *' },
            { k: 'meetPersonName', ph: 'Your name / room (optional)' },
          ].map(({ k, ph }) => (
            <input
              key={k}
              value={form[k]}
              onChange={(e) => setForm((f) => ({ ...f, [k]: e.target.value }))}
              placeholder={ph}
              className={inputCls}
              style={inputStyle}
            />
          ))}
          <button
            type="submit"
            disabled={saving}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50 transition-all sm:col-span-2"
          >
            {saving ? 'Sending…' : 'Send for approval'}
          </button>
        </form>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : (
          <>
            <h3 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
              Active ({active.length})
            </h3>
            <div className="space-y-2 mb-8">
              {active.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No active visitor requests.</p>
              )}
              {active.map((v) => (
                <VisitorRow key={v._id} v={v} />
              ))}
            </div>
            <h3 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
              Past visits ({past.length})
            </h3>
            <div className="space-y-2">
              {past.length === 0 && (
                <p className="text-xs" style={{ color: 'var(--text-muted)' }}>No past visits yet.</p>
              )}
              {past.map((v) => (
                <VisitorRow key={v._id} v={v} />
              ))}
            </div>
          </>
        )}
      </div>
    </>
  );
};

const VisitorRow = ({ v }) => (
  <div
    className="flex items-center gap-3 p-3.5 rounded-2xl border"
    style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
  >
    <div className="w-10 h-10 rounded-xl bg-indigo-500/10 text-indigo-500 flex items-center justify-center flex-shrink-0">
      <User className="w-5 h-5" />
    </div>
    <div className="flex-1 min-w-0">
      <p className="text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
        {v.visitorName}
        <span className={`ml-2 text-[10px] font-bold px-1.5 py-0.5 rounded-md border ${statusStyle(v.status)}`}>
          {v.status}
        </span>
      </p>
      <p className="text-[11px] truncate mt-0.5" style={{ color: 'var(--text-muted)' }}>
        {v.purpose}{v.phone ? ` · ${v.phone}` : ''}
      </p>
    </div>
    <span className="text-[10px] flex-shrink-0" style={{ color: 'var(--text-muted)' }}>
      {new Date(v.createdAt).toLocaleDateString('en-IN')}
    </span>
  </div>
);

export default StudentVisitors;
