import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { HashLoader } from 'react-spinners';
import { UtensilsCrossed, Star } from 'lucide-react';
import StudentHeader from '../layout/StudentHeader';
import { useToast } from '../../../../components/Toast';
import useRealtimeRefresh from '../../../../hooks/useRealtimeRefresh';
import * as cloudFunctions from '../../../../firebase/cloudFunctions';

const MEALS = [
  { k: 'breakfast', label: 'Breakfast', icon: '🌅' },
  { k: 'lunch', label: 'Lunch', icon: '🍛' },
  { k: 'snacks', label: 'Snacks', icon: '☕' },
  { k: 'dinner', label: 'Dinner', icon: '🌙' },
];

const StudentMessMenu = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const toast = useToast();
  const [menu, setMenu] = useState(null);
  const [loading, setLoading] = useState(true);
  const [ratingDay, setRatingDay] = useState(null);
  const [myRatings, setMyRatings] = useState({});

  const load = useCallback(async (silent = false) => {
    if (!silent) setLoading(true);
    try {
      const res = await cloudFunctions.getCurrentMenu();
      setMenu(res?.menu || null);
    } catch (err) {
      if (!silent) toast.error(err?.message || 'Could not load mess menu');
    } finally {
      setLoading(false);
    }
  }, [toast]);

  useEffect(() => { load(); }, [load]);
  useRealtimeRefresh({ events: ['hoas:messmenu-updated'], refetch: () => load(true) });

  // student's own marks tracked locally per session
  const rate = async (day, score) => {
    if (!menu?._id) return;
    setRatingDay(day);
    try {
      const res = await cloudFunctions.rateMeal(menu._id, day, score);
      setMenu(res?.menu || menu);
      setMyRatings((m) => ({ ...m, [day]: score }));
      toast.success(`Rated ${day} ${score}/5`);
    } catch (err) {
      toast.error(err?.message || 'Rating failed');
    } finally {
      setRatingDay(null);
    }
  };

  return (
    <>
      <StudentHeader title="Mess Menu · Student Portal" isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      <div className="pt-20 md:pt-24 px-4 sm:px-6 lg:px-8 pb-8">
        <div className="mb-6">
          <h2 className="text-xl md:text-2xl font-black uppercase tracking-tighter" style={{ color: 'var(--text-primary)' }}>
            <UtensilsCrossed className="inline w-6 h-6 text-orange-500 mr-2 -mt-1" />
            Mess Menu
          </h2>
          <p className="text-xs font-medium mt-1 opacity-60" style={{ color: 'var(--text-muted)' }}>
            {menu ? `Week of ${new Date(menu.weekStart).toLocaleDateString('en-IN', { day: 'numeric', month: 'long' })} · tap stars to rate` : 'This week’s menu'}
          </p>
        </div>

        {loading ? (
          <div className="flex items-center justify-center py-24">
            <HashLoader color="#6366F1" size={44} />
          </div>
        ) : !menu ? (
          <div className="rounded-2xl border border-dashed p-12 text-center" style={{ borderColor: 'var(--border-primary)' }}>
            <p className="text-sm font-bold" style={{ color: 'var(--text-secondary)' }}>No menu published yet</p>
            <p className="text-xs mt-1" style={{ color: 'var(--text-muted)' }}>Check back soon — the mess menu appears here once published.</p>
          </div>
        ) : (
          <div className="grid grid-cols-1 md:grid-cols-2 xl:grid-cols-3 gap-3">
            {(menu.days || []).map((d) => (
              <div key={d.day} className="rounded-2xl border p-4" style={{ backgroundColor: 'var(--bg-card)', borderColor: 'var(--border-primary)' }}>
                <div className="flex items-center justify-between mb-3">
                  <p className="text-sm font-black" style={{ color: 'var(--text-primary)' }}>{d.day}</p>
                  {menu.averages?.[d.day] && (
                    <span className="flex items-center gap-1 text-[11px] font-bold text-amber-500">
                      <Star className="w-3.5 h-3.5 fill-amber-500" /> {menu.averages[d.day]}
                    </span>
                  )}
                </div>
                <div className="space-y-1.5 mb-3">
                  {MEALS.map(({ k, label, icon }) => (
                    <p key={k} className="text-xs" style={{ color: 'var(--text-secondary)' }}>
                      <span className="mr-1.5">{icon}</span>
                      <span className="font-bold">{label}:</span> {d[k] || '—'}
                    </p>
                  ))}
                </div>
                <div className="flex items-center gap-1 pt-2 border-t" style={{ borderColor: 'var(--border-primary)' }}>
                  {[1, 2, 3, 4, 5].map((s) => (
                    <button
                      key={s}
                      onClick={() => rate(d.day, s)}
                      disabled={ratingDay === d.day}
                      title={`Rate ${s}/5`}
                      className="p-1 hover:scale-125 active:scale-95 transition-transform disabled:opacity-50"
                    >
                      <Star className={`w-5 h-5 ${myRatings[d.day] >= s ? 'fill-amber-500 text-amber-500' : 'text-slate-400'}`} />
                    </button>
                  ))}
                </div>
              </div>
            ))}
          </div>
        )}
      </div>
    </>
  );
};

export default StudentMessMenu;
