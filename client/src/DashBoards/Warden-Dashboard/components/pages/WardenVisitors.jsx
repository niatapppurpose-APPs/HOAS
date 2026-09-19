import { useState, useEffect, useCallback, useMemo } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { ClipboardList, UserPlus, CheckCircle2, XCircle, LogOut, Phone, User } from 'lucide-react';
import WardenHeader from '../layout/WardenHeader';
import { useToast } from '../../../../components/Toast';
import useRealtimeRefresh from '../../../../hooks/useRealtimeRefresh';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';

const statusStyle = (s) => {
  if (s === 'checked-in') return 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20';
  if (s === 'pending') return 'bg-amber-500/10 text-amber-500 border-amber-500/20';
  if (s === 'denied') return 'bg-red-500/10 text-red-500 border-red-500/20';
  return 'bg-slate-500/10 text-slate-500 border-slate-500/20';
};

const inputCls = 'h-10 px-3 rounded-xl border text-sm outline-none w-full';
const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-primary)',
  color: 'var(--text-primary)',
};

const WardenVisitors = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  const [visitors, setVisitors] = useState([]);
  const [loading, setLoading] = useState(true);
  const [busy, setBusy] = useState(null);
  const [tab, setTab] = useState('inside');
  const [form, setForm] = useState({ visitorName: '', phone: '', purpose: '', meetPersonName: '', hostelBlock: '' });

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

  const pending = useMemo(() => visitors.filter((v) => v.status === 'pending'), [visitors]);
  const inside = useMemo(() => visitors.filter((v) => v.status === 'checked-in'), [visitors]);
  const history = useMemo(
    () => visitors.filter((v) => v.status === 'checked-out' || v.status === 'denied'),
    [visitors],
  );
  const shown = tab === 'inside' ? inside : tab === 'pending' ? pending : history;

  const logWalkIn = async (e) => {
    e.preventDefault();
    if (!form.visitorName.trim() || !form.purpose.trim()) {
      toast.warning('Visitor name and purpose are required.');
      return;
    }
    setBusy('new');
    try {
      await cloudFunctions.createVisitor({ ...form });
      setForm({ visitorName: '', phone: '', purpose: '', meetPersonName: '', hostelBlock: '' });
      toast.success('Visitor checked in');
      await load(true);
    } catch (err) {
      toast.error(err?.message || 'Check-in failed');
    } finally {
      setBusy(null);
    }
  };

  const decide = async (id, decision) => {
    setBusy(id);
    try {
      await cloudFunctions.decideVisitor(id, decision);
      toast.success(decision === 'approve' ? 'Visitor approved & checked in' : 'Visitor denied');
      await load(true);
    } catch (err) {
      toast.error(err?.message || 'Action failed');
    } finally {
      setBusy(null);
    }
  };

  const checkout = async (id) => {
    setBusy(id);
    try {
      await cloudFunctions.checkoutVisitor(id);
      toast.success('Visitor checked out');
      await load(true);
    } catch (err) {
      toast.error(err?.message || 'Check-out failed');
    } finally {
      setBusy(null);
    }
  };

  return (
    <>
      <WardenHeader title="Visitors · Warden Portal" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              <ClipboardList className="inline w-6 h-6 text-indigo-500 mr-2 -mt-1" />
              Visitor Management
            </h2>
            <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
              Digital gate register · {inside.length} inside now · {pending.length} awaiting approval
            </p>
          </div>
        </div>

        {/* Walk-in form */}
        <form
          onSubmit={logWalkIn}
          className="rounded-2xl border p-4 sm:p-5 mb-6 grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3"
          style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}
        >
          <div className="flex items-center gap-2 sm:col-span-2 lg:col-span-3 text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            <UserPlus className="w-4 h-4 text-indigo-500" /> Log walk-in visitor
          </div>
          {[
            { k: 'visitorName', ph: 'Visitor name *' },
            { k: 'phone', ph: 'Phone' },
            { k: 'purpose', ph: 'Purpose of visit *' },
            { k: 'meetPersonName', ph: 'Person to meet' },
            { k: 'hostelBlock', ph: 'Hostel block' },
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
            disabled={busy === 'new'}
            className="h-10 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold disabled:opacity-50 transition-all"
          >
            {busy === 'new' ? 'Checking in…' : 'Check in visitor'}
          </button>
        </form>

        {/* Tabs */}
        <div className="flex gap-2 mb-4">
          {[
            { k: 'inside', label: `Inside now (${inside.length})` },
            { k: 'pending', label: `Pending (${pending.length})` },
            { k: 'history', label: `History (${history.length})` },
          ].map(({ k, label }) => (
            <button
              key={k}
              onClick={() => setTab(k)}
              className="px-4 h-9 rounded-xl border text-xs font-bold transition-all"
              style={{
                backgroundColor: tab === k ? 'rgba(99,102,241,0.15)' : 'var(--bg-card)',
                borderColor: tab === k ? 'rgba(99,102,241,0.5)' : 'var(--border-primary)',
                color: tab === k ? '#818cf8' : 'var(--text-muted)',
              }}
            >
              {label}
            </button>
          ))}
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : shown.length === 0 ? (
          <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>Nothing here</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Visitors in this view will appear here in real time.</p>
          </div>
        ) : (
          <div className="space-y-2">
            {shown.map((v) => (
              <div
                key={v._id}
                className="flex flex-col sm:flex-row sm:items-center gap-3 p-3.5 rounded-2xl border"
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
                    {v.purpose}
                    {v.meetPersonName ? ` · to meet ${v.meetPersonName}` : ''}
                    {v.phone ? ` · ${v.phone}` : ''}
                    {v.hostelBlock ? ` · Block ${v.hostelBlock}` : ''}
                  </p>
                  <p className="text-[10px] mt-0.5" style={{ color: 'var(--text-muted)' }}>
                    <Phone className="inline w-3 h-3 mr-1" />
                    {v.checkedInAt ? `In: ${new Date(v.checkedInAt).toLocaleString('en-IN')}` : `Requested: ${new Date(v.createdAt).toLocaleString('en-IN')}`}
                    {v.checkedOutAt ? ` · Out: ${new Date(v.checkedOutAt).toLocaleString('en-IN')}` : ''}
                  </p>
                </div>
                <div className="flex gap-2 flex-shrink-0">
                  {v.status === 'pending' && (
                    <>
                      <button
                        onClick={() => decide(v._id, 'approve')}
                        disabled={busy === v._id}
                        className="h-9 px-3 rounded-xl bg-emerald-600 hover:bg-emerald-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <CheckCircle2 className="w-3.5 h-3.5" /> Approve
                      </button>
                      <button
                        onClick={() => decide(v._id, 'deny')}
                        disabled={busy === v._id}
                        className="h-9 px-3 rounded-xl bg-red-600 hover:bg-red-500 text-white text-xs font-bold flex items-center gap-1 disabled:opacity-50"
                      >
                        <XCircle className="w-3.5 h-3.5" /> Deny
                      </button>
                    </>
                  )}
                  {v.status === 'checked-in' && (
                    <button
                      onClick={() => checkout(v._id)}
                      disabled={busy === v._id}
                      className="h-9 px-3 rounded-xl border text-xs font-bold flex items-center gap-1 disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                      style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-secondary)' }}
                    >
                      <LogOut className="w-3.5 h-3.5" /> Check out
                    </button>
                  )}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default WardenVisitors;
