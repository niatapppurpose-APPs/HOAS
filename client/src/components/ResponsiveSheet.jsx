import { useCallback, useEffect, useRef, useState } from 'react';

/**
 * ResponsiveSheet — shared shell for the Add Management / Add Warden /
 * Add Student / Bulk Upload modals.
 *
 * - Mobile (< 768px): bottom sheet that slides up, with a drag handle.
 *   Dismissed ONLY by dragging down (plus the in-content X button).
 *   Backdrop taps do NOT close on mobile.
 * - Desktop (>= 768px): right-side panel that slides in from the right.
 *   Dismissed via backdrop click, the X button, or Escape.
 *
 * `busy` disables every dismiss gesture (used while submitting/uploading).
 * Only the panel positioning/animation/drag lives here — inner form
 * content is untouched.
 */
const ResponsiveSheet = ({
  isOpen,
  onClose,
  busy = false,
  children,
  panelClassName = '',
  panelStyle = {},
  desktopWidthClass = 'md:w-[520px]',
  ariaLabel = 'Dialog',
}) => {
  const [isMobile, setIsMobile] = useState(
    () => typeof window !== 'undefined' && window.matchMedia('(max-width: 767px)').matches
  );
  const [dragY, setDragY] = useState(0);
  const [isDragging, setIsDragging] = useState(false);
  const startYRef = useRef(0);
  const draggingRef = useRef(false);

  // Track viewport so backdrop/drag behaviour follows the current layout
  useEffect(() => {
    if (typeof window === 'undefined' || !window.matchMedia) return;
    const mq = window.matchMedia('(max-width: 767px)');
    const onChange = (e) => setIsMobile(e.matches);
    mq.addEventListener('change', onChange);
    return () => mq.removeEventListener('change', onChange);
  }, []);

  // Lock body scroll while open
  useEffect(() => {
    if (!isOpen) return;
    const prev = document.body.style.overflow;
    document.body.style.overflow = 'hidden';
    return () => {
      document.body.style.overflow = prev;
    };
  }, [isOpen]);

  // Central close: always reset drag state first (no setState-in-effect needed)
  const handleClose = useCallback(() => {
    draggingRef.current = false;
    setDragY(0);
    setIsDragging(false);
    onClose();
  }, [onClose]);

  // Escape closes (desktop + mobile), unless busy
  useEffect(() => {
    if (!isOpen) return;
    const onKey = (e) => {
      if (e.key === 'Escape' && !busy) handleClose();
    };
    window.addEventListener('keydown', onKey);
    return () => window.removeEventListener('keydown', onKey);
  }, [isOpen, busy, handleClose]);

  const handleBackdropClick = (e) => {
    if (e.target !== e.currentTarget || busy) return;
    if (isMobile) return; // mobile: drag handle / X button only
    handleClose();
  };

  // ---- Bottom-sheet drag (mobile only) ----
  const onDragTouchStart = (e) => {
    if (!isMobile || busy) return;
    draggingRef.current = true;
    startYRef.current = e.touches[0].clientY;
    setIsDragging(true);
  };

  const onDragTouchMove = (e) => {
    if (!draggingRef.current || !isMobile || busy) return;
    const dy = e.touches[0].clientY - startYRef.current;
    setDragY(dy > 0 ? dy : 0);
  };

  const onDragTouchEnd = () => {
    if (!draggingRef.current) return;
    const shouldClose = dragY > 110 && !busy;
    draggingRef.current = false;
    setIsDragging(false);
    setDragY(0);
    if (shouldClose) onClose();
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50" role="dialog" aria-modal="true" aria-label={ariaLabel}>
      {/* Backdrop */}
      <div
        className="rs-backdrop absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={handleBackdropClick}
      />

      {/* Panel: bottom sheet on mobile, right drawer on desktop */}
      <div
        className={`rs-panel absolute bottom-0 left-0 right-0 max-h-[92dvh] w-full overflow-y-auto rounded-t-[1.75rem] shadow-2xl md:bottom-0 md:left-auto md:right-0 md:top-0 md:h-full md:h-dvh md:max-h-none md:rounded-none ${desktopWidthClass} md:max-w-[94vw] ${panelClassName}`}
        style={{
          ...panelStyle,
          ...(dragY > 0 ? { transform: `translateY(${dragY}px)` } : {}),
          transition: isDragging ? 'none' : undefined,
        }}
      >
        {/* Drag handle — mobile only. Dragging down dismisses (unless busy). */}
        <div
          className="sticky top-0 z-10 flex justify-center pb-1 pt-3 md:hidden"
          style={{ backgroundColor: 'transparent' }}
          onTouchStart={onDragTouchStart}
          onTouchMove={onDragTouchMove}
          onTouchEnd={onDragTouchEnd}
        >
          <div
            className="h-1.5 w-12 rounded-full"
            style={{ backgroundColor: 'var(--border-primary, rgba(128,128,128,0.45))' }}
          />
        </div>

        {children}
      </div>

      <style>{`
        @keyframes rs-sheet-up {
          from { transform: translateY(100%); }
          to { transform: translateY(0); }
        }
        @keyframes rs-sheet-right {
          from { transform: translateX(100%); }
          to { transform: translateX(0); }
        }
        @keyframes rs-fade {
          from { opacity: 0; }
          to { opacity: 1; }
        }
        .rs-backdrop { animation: rs-fade 0.25s ease; }
        .rs-panel { animation: rs-sheet-up 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
        @media (min-width: 768px) {
          .rs-panel { animation: rs-sheet-right 0.34s cubic-bezier(0.22, 1, 0.36, 1); }
        }
        @media (prefers-reduced-motion: reduce) {
          .rs-panel, .rs-backdrop { animation: none; }
        }
      `}</style>
    </div>
  );
};

export default ResponsiveSheet;
