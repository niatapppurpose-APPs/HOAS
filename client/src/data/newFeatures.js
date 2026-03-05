/**
 * NEW FEATURE REGISTRY
 * ─────────────────────────────────────────────
 * Add an entry here whenever you ship a feature you want to highlight in the sidebar.
 *
 * Fields:
 *   id              – unique key; also used as the localStorage dismiss key
 *   label           – human-readable name (for debugging)
 *   releasedAt      – "YYYY-MM-DD" release date
 *   expiresAfterDays– badge auto-hides this many days after release (default 30)
 *   sidebarIds      – array of sidebar menu-item IDs that should wear the badge
 *                     (these must match the `id` field in each sidebar's menuItems array)
 *
 * The badge auto-disappears once `releasedAt + expiresAfterDays` has passed.
 * Users can also dismiss it early by clicking the ✕ on the badge — stored per-user
 * in localStorage as `nf_dismissed_<id>`.
 */

export const NEW_FEATURES = [
  // ── Example: Profile Photo Upload (released 2026-03-03, visible for 30 days) ─────
  {
    id: "profile-photo-upload",
    label: "Profile Photo Upload",
    releasedAt: "2026-03-03",
    expiresAfterDays: 30,
    sidebarIds: [], // no sidebar item — page-level feature, no nav badge needed
  },

  // ── Add new entries below this line ──────────────────────────────────────────────
  // Example:
  // {
  //   id: "leave-requests-v2",
  //   label: "Leave Requests v2",
  //   releasedAt: "2026-03-10",
  //   expiresAfterDays: 21,
  //   sidebarIds: ["leave"],          // badges the "leave" item in StudentSidebar
  // },
  // {
  //   id: "bulk-report-export",
  //   label: "Bulk Report Export",
  //   releasedAt: "2026-03-15",
  //   expiresAfterDays: 14,
  //   sidebarIds: ["reports"],        // badges "reports" in Owner & Management sidebars
  // },
];

// ─── Utility ─────────────────────────────────────────────────────────────────────

/**
 * Returns true if the given sidebar menu item ID has at least one active "new" feature.
 * A feature is "active" when:
 *   1. Current date is within its expiry window
 *   2. The user has NOT dismissed it in localStorage
 *
 * @param {string} sidebarItemId  - e.g. "leave", "reports"
 * @returns {boolean}
 */
export function isNavItemNew(sidebarItemId) {
  const now = Date.now();
  return NEW_FEATURES.some((f) => {
    if (!f.sidebarIds?.includes(sidebarItemId)) return false;

    // Check date window
    const release = new Date(f.releasedAt).getTime();
    const expire = release + (f.expiresAfterDays ?? 30) * 86_400_000;
    if (now < release || now > expire) return false;

    // Check if user dismissed it
    if (localStorage.getItem(`nf_dismissed_${f.id}`) === "1") return false;

    return true;
  });
}

/**
 * Returns feature ids that are "new" for a given sidebar item.
 * Used by the dismiss handler to know which features to mark dismissed.
 *
 * @param {string} sidebarItemId
 * @returns {string[]}
 */
export function getActiveFeatureIds(sidebarItemId) {
  const now = Date.now();
  return NEW_FEATURES
    .filter((f) => {
      if (!f.sidebarIds?.includes(sidebarItemId)) return false;
      const release = new Date(f.releasedAt).getTime();
      const expire = release + (f.expiresAfterDays ?? 30) * 86_400_000;
      if (now < release || now > expire) return false;
      if (localStorage.getItem(`nf_dismissed_${f.id}`) === "1") return false;
      return true;
    })
    .map((f) => f.id);
}

/**
 * Dismiss all active "new" features for a given sidebar item.
 * Call this when the user clicks ✕ on the badge.
 *
 * @param {string} sidebarItemId
 */
export function dismissNavItemFeatures(sidebarItemId) {
  getActiveFeatureIds(sidebarItemId).forEach((id) => {
    localStorage.setItem(`nf_dismissed_${id}`, "1");
  });
}
