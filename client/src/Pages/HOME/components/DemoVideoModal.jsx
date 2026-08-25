import { useEffect, useRef } from "react";
import { motion } from "framer-motion";
import { X } from "lucide-react";

// Playback position survives modal re-mounts AND full page reloads
// (e.g. when a backend refresh causes the app to reload).
const POSITION_KEY = "hoas-demo-video-position";

const savePosition = (video) => {
  if (!video || Number.isNaN(video.duration)) return;
  // Don't persist a position at/near the end — next open should start fresh.
  const pos = video.currentTime;
  if (pos > 0 && pos < video.duration - 0.5) {
    try {
      sessionStorage.setItem(POSITION_KEY, String(pos));
    } catch {
      /* storage unavailable */
    }
  } else {
    try {
      sessionStorage.removeItem(POSITION_KEY);
    } catch {
      /* storage unavailable */
    }
  }
};

const loadPosition = () => {
  try {
    return parseFloat(sessionStorage.getItem(POSITION_KEY)) || 0;
  } catch {
    return 0;
  }
};

const DemoVideoModal = ({ isOpen, onClose, isDark }) => {
  const videoRef = useRef(null);
  const shouldResumeRef = useRef(true);

  useEffect(() => {
    if (!isOpen) return;
    document.body.style.overflow = "hidden";
    const onKey = (e) => e.key === "Escape" && onClose();
    window.addEventListener("keydown", onKey);

    const video = videoRef.current;
    shouldResumeRef.current = true;
    if (video && video.readyState >= 1) {
      // Already buffered — resume immediately.
      const saved = loadPosition();
      if (saved > 0 && Math.abs(video.currentTime - saved) > 0.2) {
        video.currentTime = saved;
      }
      video.play().catch(() => {});
    }

    return () => {
      document.body.style.overflow = "unset";
      window.removeEventListener("keydown", onKey);
      if (video) {
        savePosition(video);
        video.pause();
      }
    };
  }, [isOpen, onClose]);

  // Restore position as soon as metadata is available (covers remounts where
  // the <video> element was freshly created by a parent re-render/reload).
  const handleLoadedMetadata = (e) => {
    if (!shouldResumeRef.current) return;
    shouldResumeRef.current = false;
    const video = e.currentTarget;
    const saved = loadPosition();
    if (saved > 0 && saved < video.duration - 0.5) {
      video.currentTime = saved;
    }
    video.play().catch(() => {});
  };

  const handleClose = () => {
    savePosition(videoRef.current);
    onClose();
  };

  return (
    <motion.div
      initial={{ opacity: 0 }}
      animate={{ opacity: 1 }}
      exit={{ opacity: 0 }}
      className="fixed inset-0 z-[80] flex items-center justify-center p-4 bg-slate-950/85 backdrop-blur-md"
      onClick={handleClose}
    >
      <motion.div
        initial={{ scale: 0.9, y: 30 }}
        animate={{ scale: 1, y: 0 }}
        exit={{ scale: 0.9, y: 30 }}
        transition={{ type: "spring", damping: 26, stiffness: 300 }}
        className="relative w-full max-w-4xl overflow-hidden rounded-2xl shadow-2xl"
        style={{
          border: `1px solid ${isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)"}`,
        }}
        onClick={(e) => e.stopPropagation()}
      >
        <div
          className="flex items-center justify-between px-5 py-3"
          style={{
            backgroundColor: isDark ? "#0b1120" : "#ffffff",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)"}`,
          }}
        >
          <span
            className="text-sm font-black tracking-tight"
            style={{ color: isDark ? "#fff" : "#0f172a" }}
          >
            HOAS — Product Demo
          </span>
          <button
            onClick={handleClose}
            className="rounded-xl p-1.5 transition-colors hover:bg-violet-500/10"
            style={{ color: isDark ? "#CBD5E1" : "#475569" }}
          >
            <X size={20} />
          </button>
        </div>
        <video
          ref={videoRef}
          src="/demo-video.mp4"
          controls
          playsInline
          preload="auto"
          onLoadedMetadata={handleLoadedMetadata}
          onTimeUpdate={(e) => savePosition(e.currentTarget)}
          onEnded={() => {
            try {
              sessionStorage.removeItem(POSITION_KEY);
            } catch {
              /* storage unavailable */
            }
          }}
          className="block h-auto w-full bg-black"
        />
      </motion.div>
    </motion.div>
  );
};

export default DemoVideoModal;
