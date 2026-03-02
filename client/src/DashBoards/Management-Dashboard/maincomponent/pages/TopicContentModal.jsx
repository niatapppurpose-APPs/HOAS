import { memo } from 'react';
import { X } from 'lucide-react';
import { useTheme } from '../../../../context/ThemeContext';

const COLOR_MAP = {
  blue: { rgb: '59,130,246', hex: '#3b82f6' },
  purple: { rgb: '168,85,247', hex: '#a855f7' },
  emerald: { rgb: '16,185,129', hex: '#10b981' },
};

const TopicContentModal = memo(({ topic, contentMap, onClose }) => {
  const { isDark } = useTheme();
  const data = contentMap[topic];
  if (!data) return null;

  const colorInfo = COLOR_MAP[data.color] || COLOR_MAP.blue;
  const Icon = data.icon;

  return (
    <div
      className="fixed inset-0 z-50 flex items-center justify-center p-4 bg-black/50 backdrop-blur-sm"
      onClick={onClose}
    >
      <div
        className="w-full max-w-2xl rounded-2xl shadow-2xl overflow-hidden"
        style={{ backgroundColor: 'var(--bg-primary)', border: '1px solid var(--border-color)' }}
        onClick={(e) => e.stopPropagation()}
      >
        {/* Header */}
        <div className="px-6 py-4 flex items-center justify-between border-b" style={{ borderColor: 'var(--border-color)' }}>
          <div className="flex items-center gap-3">
            <div className="p-2 rounded-lg" style={{
              backgroundColor: isDark
                ? `rgba(${colorInfo.rgb}, 0.15)`
                : `rgba(${colorInfo.rgb}, 0.1)`
            }}>
              <Icon className="w-5 h-5" style={{ color: colorInfo.hex }} />
            </div>
            <h2 className="text-xl font-bold" style={{ color: 'var(--text-primary)' }}>
              {data.title}
            </h2>
          </div>
          <button
            onClick={onClose}
            className="p-2 rounded-full transition-colors"
            style={{ color: 'var(--text-secondary)' }}
          >
            <X className="w-5 h-5" />
          </button>
        </div>

        {/* Content */}
        <div className="p-6 max-h-[70vh] overflow-y-auto" style={{ color: 'var(--text-secondary)' }}>
          {data.content}
        </div>

        {/* Footer */}
        <div className="px-6 py-4 border-t flex justify-end" style={{ borderColor: 'var(--border-color)', backgroundColor: 'var(--bg-secondary)' }}>
          <button
            onClick={onClose}
            className="px-4 py-2 rounded-lg text-sm font-medium transition-colors border"
            style={{
              backgroundColor: 'var(--bg-primary)',
              borderColor: 'var(--border-color)',
              color: 'var(--text-primary)'
            }}
          >
            Close
          </button>
        </div>
      </div>
    </div>
  );
});

TopicContentModal.displayName = 'TopicContentModal';

export default TopicContentModal;
