import { useEffect, useState } from 'react';

const TIPS = [
  'Waking up the server…',
  'Free servers sleep when idle — this takes under a minute.',
  'Almost there…',
];

export default function WakeUpScreen({ offline = false }) {
  const [tipIndex, setTipIndex] = useState(0);

  useEffect(() => {
    if (offline) return;
    const id = setInterval(() => {
      setTipIndex((i) => Math.min(i + 1, TIPS.length - 1));
    }, 6000);
    return () => clearInterval(id);
  }, [offline]);

  return (
    <div className="fixed inset-0 w-full h-full flex flex-col items-center justify-center bg-slate-950 text-slate-100 px-6 overflow-hidden select-none">
      {/* Ambient glow */}
      <div className="absolute -top-40 left-1/2 -translate-x-1/2 w-[30rem] h-[30rem] max-w-[150vw] rounded-full bg-indigo-600/20 blur-3xl pointer-events-none" />
      <div className="absolute -bottom-24 -right-24 w-72 h-72 rounded-full bg-blue-500/10 blur-3xl pointer-events-none" />

      {/* Pulsing logo ring */}
      <div className="relative z-10 mb-8 sm:mb-10">
        <span
          className="absolute inset-0 rounded-full bg-indigo-500/25 animate-ping"
          style={{ animationDuration: '1.8s' }}
        />
        <span className="absolute -inset-3 rounded-full border border-indigo-400/40 animate-pulse" />
        <div className="relative w-20 h-20 sm:w-24 sm:h-24 rounded-full bg-gradient-to-br from-indigo-500 to-blue-600 flex items-center justify-center shadow-2xl shadow-indigo-900/50">
          <svg
            className="absolute -inset-4 w-[calc(100%+2rem)] h-[calc(100%+2rem)] animate-spin"
            style={{ animationDuration: '2.4s' }}
            viewBox="0 0 100 100"
            fill="none"
          >
            <circle cx="50" cy="50" r="46" stroke="rgba(99,102,241,0.15)" strokeWidth="3" />
            <path d="M50 4 a46 46 0 0 1 46 46" stroke="#818cf8" strokeWidth="3" strokeLinecap="round" />
          </svg>
          <span className="text-xl sm:text-2xl font-black tracking-tight">HOAS</span>
        </div>
      </div>

      {/* Status */}
      <h1 className="relative z-10 text-lg sm:text-2xl font-bold mb-3 text-center">
        {offline ? "You're offline" : 'Starting up your dashboard'}
      </h1>

      {/* Single rotating tip — fixed height so nothing shifts */}
      <div className="relative z-10 h-5 mb-8 w-full max-w-xs flex items-start justify-center">
        <p
          key={tipIndex}
          className="text-xs sm:text-sm text-slate-400 text-center animate-[wakeFade_.6s_ease]"
        >
          {offline ? 'Check your internet connection — we will reconnect automatically.' : TIPS[tipIndex]}
        </p>
      </div>

      {/* Progress shimmer bar */}
      <div className="relative z-10 w-56 sm:w-64 h-1.5 rounded-full bg-slate-800 overflow-hidden">
        <div
          className="h-full w-1/3 rounded-full bg-gradient-to-r from-indigo-500 via-blue-400 to-indigo-500"
          style={{ animation: 'wakeSlide 1.6s ease-in-out infinite' }}
        />
      </div>

      <style>{`
        @keyframes wakeSlide {
          0% { transform: translateX(-120%); }
          100% { transform: translateX(420%); }
        }
        @keyframes wakeFade {
          from { opacity: 0; transform: translateY(4px); }
          to { opacity: 1; transform: translateY(0); }
        }
      `}</style>
    </div>
  );
}
