/**
 * useNewBadge
 * ─────────────────────────────────────────────
 * Reactive wrapper around newFeatures.js utilities.
 * Tracks dismissed state so dismissing a badge re-renders the sidebar.
 */
import { useState, useCallback } from "react";
import {
  isNavItemNew,
  dismissNavItemFeatures,
} from "../data/newFeatures";

/**
 * @param {string} sidebarItemId  - matches the `id` in menuItems (e.g. "leave", "reports")
 * @returns {{ isNew: boolean, dismiss: () => void }}
 */
const useNewBadge = (sidebarItemId) => {
  // Local state bump so React re-renders when user dismisses
  const [, setBump] = useState(0);

  const isNew = isNavItemNew(sidebarItemId);

  const dismiss = useCallback(() => {
    dismissNavItemFeatures(sidebarItemId);
    setBump((n) => n + 1); // force re-render
  }, [sidebarItemId]);

  return { isNew, dismiss };
};

export default useNewBadge;
