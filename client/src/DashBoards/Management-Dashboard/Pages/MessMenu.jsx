import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { UtensilsCrossed, Save, Megaphone, Star } from 'lucide-react';
import ManagementHeader from '../components/layout/ManagementHeader';
import { useAuth } from '../../../context/AuthContext';
import { useToast } from '../../../components/Toast';
import * as cloudFunctions from '../../../firebase/cloudFunctions';

const DAYS = ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'];
const MEALS = [
  { k: 'breakfast', label: 'Breakfast' },
  { k: 'lunch', label: 'Lunch' },
  { k: 'snacks', label: 'Snacks' },
  { k: 'dinner', label: 'Dinner' },
];

const mondayOf = (d = new Date()) => {
  const x = new Date(d);
  const diff = (x.getDay() + 6) % 7;
  x.setDate(x.getDate() - diff);
  x.setHours(0, 0, 0, 0);
  return x.toISOString().slice(0, 10);
};

const inputCls = 'h-9 px-2.5 rounded-lg border text-xs outline-none w-full';
const inputStyle = {
  backgroundColor: 'var(--bg-primary)',
  borderColor: 'var(--border-primary)',
  color: 'var(--text-primary)',
};

const MessMenu = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const { userData } = useAuth();
  const toast = useToast();
  const [week, setWeek] = useState(mondayOf());
  const [days, setDays] = useState(DAYS.map((day) => ({ day, breakfast: '', lunch: '', snacks: '', dinner: '' })));
  const [menuId, setMenuId] = useState(null);
  const [published, setPublished] = useState(false);
  const [averages, setAverages] = useState({});
  const [history, setHistory] = useState([]);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);

  const loadWeek = useCallback(async (weekStart, silent = false) => {
    if (!silent) setLoading(true);
    try {
      const [cur, all] = await Promise.all([
        cloudFunctions.getCurrentMenu(),
        cloudFunctions.listMenus().catch(() => ({ menus: [] })),
      ]);
      setHistory(all?.menus || []);
      const m = cur?.menu;
      if (m && new Date(m.weekStart).toISOString().slice(0, 10) === weekStart) {
        setMenuId(m._id);
        setPublished(!!m.published);
        setAverages(m.averages || {});
        if (m.days?.length) {
          setDays(DAYS.map((day) => {
            const f = (m.days || []).find((d) => d.day === day) || {};
            return { day, breakfast: f.breakfast || '', lunch: f.lunch || '', snacks: f.snacks || '', dinner: f.dinner || '' };
          }));
        }
      } else {
        setMenuId(null);
        setPublished(false);
        setAverages({});
        setDays(DAYS.map((day) => ({ day, breakfast: '', lunch: '', snacks: '', dinner: '' })));
      }
    } catch (err) {
      if (!silent) toast.error(err?.message || 'Could not load mess menu');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { loadWeek(week); }, [loadWeek, week]);

  const setCell = (day, meal, value) => {
    setDays((prev) => prev.map((d) => (d.day === day ? { ...d, [meal]: value } : d)));
  };

  const save = async () => {
    setSaving(true);
    try {
      const collegeId = userData?.collegeId?._id || userData?.collegeId;
      const res = await cloudFunctions.saveMenu({ collegeId, weekStart: week, days });
      setMenuId(res?.menu?._id || menuId);
      toast.success('Menu saved as draft');
      await loadWeek(week, true);
    } catch (err) {
      toast.error(err?.message || 'Save failed');
    } finally {
      setSaving(false);
    }
  };

  const publish = async () => {
    if (!menuId) {
      toast.warning('Save the menu first, then publish.');
      return;
    }
    setSaving(true);
    try {
      await cloudFunctions.publishMenu(menuId);
      setPublished(true);
      toast.success('Menu published — students can see it now');
      await loadWeek(week, true);
    } catch (err) {
      toast.error(err?.message || 'Publish failed');
    } finally {
      setSaving(false);
    }
  };

  return (
    <>
      <ManagementHeader title="Mess Menu" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-3 mb-6">
          <div>
            <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
              <UtensilsCrossed className="inline w-6 h-6 text-orange-500 mr-2 -mt-1" />
              Mess Menu
            </h2>
            <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
              Plan the week, publish when ready · students rate each day
            </p>
          </div>
          <div className="flex items-center gap-2">
            <input
              type="date"
              value={week}
              onChange={(e) => e.target.value && setWeek(e.target.value)}
              className="h-10 px-3 rounded-xl border text-sm outline-none"
              style={inputStyle}
            />
            <span className={`text-[10px] font-black px-2 py-1 rounded-md border ${published ? 'bg-emerald-500/10 text-emerald-500 border-emerald-500/20' : 'bg-amber-500/10 text-amber-500 border-amber-500/20'}`}>
              {published ? 'PUBLISHED' : 'DRAFT'}
            </span>
          </div>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : (
          <>
            <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3 mb-6">
              {days.map((d) => (
                <div key={d.day} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                  <div className="flex items-center justify-between mb-3">
                    <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{d.day}</p>
                    {averages[d.day] && (
                      <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                        <Star className="w-3.5 h-3.5 fill-amber-500" /> {averages[d.day]}
                      </span>
                    )}
                  </div>
                  <div className="space-y-2">
                    {MEALS.map(({ k, label }) => (
                      <div key={k} className="flex items-center gap-2">
                        <span className="text-[10px] font-bold uppercase w-16 flex-shrink-0" style={{ color: 'var(--text-muted)' }}>{label}</span>
                        <input
                          value={d[k]}
                          onChange={(e) => setCell(d.day, k, e.target.value)}
                          placeholder={`—`}
                          className={inputCls}
                          style={inputStyle}
                        />
                      </div>
                    ))}
                  </div>
                </div>
              ))}
            </div>

            <div className="flex flex-wrap gap-3 mb-10">
              <button
                onClick={save}
                disabled={saving}
                className="h-11 px-6 rounded-xl border text-sm font-bold flex items-center gap-2 disabled:opacity-50 hover:-translate-y-0.5 transition-all"
                style={{ backgroundColor: 'var(--bg-tertiary)', borderColor: 'var(--border-primary)', color: 'var(--text-primary)' }}
              >
                <Save className="w-4 h-4" /> {saving ? 'Saving…' : 'Save draft'}
              </button>
              <button
                onClick={publish}
                disabled={saving || published}
                className="h-11 px-6 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white text-sm font-bold flex items-center gap-2 disabled:opacity-50 transition-all"
              >
                <Megaphone className="w-4 h-4" /> {published ? 'Published' : 'Publish menu'}
              </button>
            </div>

            {history.length > 0 && (
              <>
                <h3 className="text-sm font-black uppercase tracking-widest mb-3" style={{ color: 'var(--text-secondary)' }}>
                  Past weeks
                </h3>
                <div className="flex flex-wrap gap-2">
                  {history.map((h) => (
                    <button
                      key={h._id}
                      onClick={() => setWeek(new Date(h.weekStart).toISOString().slice(0, 10))}
                      className="px-3.5 h-9 rounded-xl border text-xs font-bold transition-all"
                      style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)', color: 'var(--text-muted)' }}
                    >
                      {new Date(h.weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'short' })}
                      {h.published ? ' · live' : ' · draft'}
                    </button>
                  ))}
                </div>
              </>
            )}
          </>
        )}
      </div>
    </>
  );
};

export default MessMenu;
