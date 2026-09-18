import SearchModal from './ui/SearchModal/SearchModal';

/**
 * GlobalSearch wrapper component for backwards compatibility.
 * Renders the full Vengence UI / Untitled UI command palette search modal.
 */
export default function GlobalSearch({ compact = false, scope, triggerLabel }) {
  return <SearchModal compact={compact} defaultScope={scope} triggerLabel={triggerLabel} />;
}
