import React from 'react';

const StatsCard = ({ title, value, subtitle, gradient, icon: Icon }) => {
  return (
    <div 
      className={`relative group overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10`}
      style={{
        background: `linear-gradient(135deg, var(--bg-card) 0%, var(--bg-primary) 100%)`,
        boxShadow: `0 10px 30px -10px rgba(0,0,0,0.3)`
      }}
    >
      {/* Decorative Gradient Background */}
      <div className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${gradient} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`} />
      
      <div className="relative z-10 flex flex-col h-full justify-between">
        <div className="flex items-center justify-between mb-4">
          <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all">
            {Icon && <Icon size={18} />}
          </div>
          <div className="flex flex-col items-end">
            <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground m-0">{title}</span>
          </div>
        </div>

        <div className="space-y-1">
          <h2 className="text-3xl font-black tracking-tight text-primary">
            {value}
          </h2>
          <p className="text-[10px] font-bold text-muted-foreground flex items-center gap-1 opacity-70">
            {subtitle}
          </p>
        </div>

        {/* Bottom indicator line */}
        <div className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${gradient} transition-all duration-500 w-0 group-hover:w-full`} />
      </div>
    </div>
  );
};

export default React.memo(StatsCard);
