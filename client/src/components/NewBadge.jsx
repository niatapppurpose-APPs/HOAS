/**
 * NewBadge
 * ─────────────────────────────────────────────
 * Renders a "NEW" pill badge for sidebar navigation items.
 *
 * Two variants:
 *   <NewBadge />          — full pill label (shown when sidebar is expanded)
 *   <NewBadge dot />      — tiny glowing dot (shown when sidebar is collapsed)
 *
 * Both accept an optional `onDismiss` callback for the ✕ button.
 */
import { X } from "lucide-react";

const NewBadge = ({ dot = false, onDismiss }) => {
  if (dot) {
    // Collapsed sidebar: small pulsing dot in upper-right of icon
    return (
      <span
        className="absolute top-0.5 right-0.5 w-2 h-2 rounded-full bg-emerald-400 ring-2 ring-[var(--bg-sidebar,#1e293b)] animate-pulse"
        aria-label="New feature available"
      />
    );
  }

  return (
    <span className="inline-flex items-center gap-0.5 ml-auto flex-shrink-0">
      {/* Pill */}
      <span
        className="inline-flex items-center px-1.5 py-0.5 rounded-full text-[9px] font-bold uppercase tracking-widest leading-none"
        style={{
          background: "linear-gradient(135deg, #10b981, #059669)",
          color: "#ffffff",
          boxShadow: "0 0 6px rgba(16,185,129,0.55)",
        }}
      >
        NEW
      </span>

      {/* Dismiss button */}
      {onDismiss && (
        <button
          onClick={(e) => {
            e.stopPropagation(); // don't trigger nav click
            onDismiss();
          }}
          className="w-3.5 h-3.5 rounded-full flex items-center justify-center opacity-60 hover:opacity-100 transition-opacity"
          style={{ color: "var(--text-muted)" }}
          title="Dismiss"
          aria-label="Dismiss new badge"
        >
          <X className="w-2.5 h-2.5" />
        </button>
      )}
    </span>
  );
};

export default NewBadge;
