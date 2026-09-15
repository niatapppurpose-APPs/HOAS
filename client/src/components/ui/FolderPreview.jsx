import { useState } from 'react';
import { Folder, FolderOpen, FileText, FileSpreadsheet, Image as ImageIcon, ChevronRight } from 'lucide-react';

export default function FolderPreview({
  title = 'Hostel Fee Receipts & Audits',
  subtitle = 'Monthly statements & proofs',
  files = [
    { name: 'July_2026_Mess_Dues.pdf', type: 'pdf', size: '1.2 MB' },
    { name: 'Room_Occupancy_Report.xlsx', type: 'excel', size: '840 KB' },
    { name: 'Hostel_Maintenance_Audit.pdf', type: 'pdf', size: '2.4 MB' },
  ],
  onClick,
  className = '',
}) {
  const [isHovered, setIsHovered] = useState(false);

  const getIcon = (type) => {
    if (type === 'excel') return FileSpreadsheet;
    if (type === 'image') return ImageIcon;
    return FileText;
  };

  return (
    <div
      role="button"
      tabIndex={0}
      onClick={onClick}
      onMouseEnter={() => setIsHovered(true)}
      onMouseLeave={() => setIsHovered(false)}
      className={`relative group cursor-pointer p-5 rounded-3xl border transition-all duration-300 transform hover:-translate-y-1 hover:shadow-2xl ${className}`}
      style={{
        backgroundColor: 'var(--bg-tertiary, #1e293b)',
        borderColor: isHovered ? 'rgba(99, 102, 241, 0.5)' : 'var(--border-primary, rgba(255, 255, 255, 0.1))',
      }}
    >
      {/* Folder Header */}
      <div className="flex items-start justify-between gap-3 mb-4">
        <div className="flex items-center gap-3">
          <div
            className={`p-3 rounded-2xl transition-transform duration-300 ${
              isHovered
                ? 'bg-indigo-600 text-white scale-110 shadow-lg shadow-indigo-500/30'
                : 'bg-indigo-500/10 text-indigo-400 border border-indigo-500/20'
            }`}
          >
            {isHovered ? <FolderOpen className="w-6 h-6" /> : <Folder className="w-6 h-6" />}
          </div>
          <div>
            <h4 className="text-sm font-bold tracking-tight" style={{ color: 'var(--text-primary)' }}>
              {title}
            </h4>
            <p className="text-[11px] text-slate-400 mt-0.5">{subtitle}</p>
          </div>
        </div>

        <span className="px-2 py-0.5 rounded-full text-[10px] font-extrabold bg-white/10 text-slate-300 border border-white/10">
          {files.length} items
        </span>
      </div>

      {/* Layered Document Cards Stack */}
      <div className="relative mt-3 space-y-2">
        {files.slice(0, 3).map((f, idx) => {
          const Icon = getIcon(f.type);
          return (
            <div
              key={f.name || idx}
              className="flex items-center justify-between p-2.5 rounded-xl border transition-all duration-300"
              style={{
                backgroundColor: 'rgba(0,0,0,0.2)',
                borderColor: 'var(--border-primary, rgba(255,255,255,0.06))',
                transform: isHovered ? `translateX(${idx * 4}px)` : 'none',
              }}
            >
              <div className="flex items-center gap-2.5 min-w-0">
                <div className="p-1.5 rounded-lg bg-white/5 text-slate-400">
                  <Icon className="w-3.5 h-3.5" />
                </div>
                <span className="text-xs font-semibold truncate text-slate-300 max-w-[180px]">
                  {f.name}
                </span>
              </div>
              <span className="text-[10px] font-mono text-slate-500">{f.size}</span>
            </div>
          );
        })}
      </div>

      {/* Footer View Action */}
      <div className="mt-4 pt-3 border-t border-white/5 flex items-center justify-between text-xs text-indigo-400 font-bold group-hover:text-indigo-300">
        <span>Open Folder Contents</span>
        <ChevronRight className="w-4 h-4 transform group-hover:translate-x-1 transition-transform" />
      </div>
    </div>
  );
}
