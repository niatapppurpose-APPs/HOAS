import { ChevronLeft, ChevronRight } from "lucide-react";

const PaginationControls = ({
  currentPage,
  totalPages,
  startIndex,
  endIndex,
  totalItems,
  onPageChange
}) => {
  if (totalPages <= 1) return null;

  return (
    <div
      id="tour-pagination"
      className="mt-4 flex-shrink-0 flex flex-col sm:flex-row items-center justify-between gap-4 rounded-xl p-4"
      style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
    >
      <div className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Showing <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{startIndex + 1}</span> to{' '}
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{Math.min(endIndex, totalItems)}</span> of{' '}
        <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{totalItems}</span> colleges
      </div>

      <div className="flex items-center gap-2">
        <button
          onClick={() => onPageChange(Math.max(1, currentPage - 1))}
          disabled={currentPage === 1}
          className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          <ChevronLeft className="w-5 h-5" />
        </button>

        <div className="flex items-center gap-1">
          {Array.from({ length: totalPages }, (_, i) => i + 1).map(page => {
            // Show first page, last page, current page, and pages around current
            if (
              page === 1 ||
              page === totalPages ||
              (page >= currentPage - 1 && page <= currentPage + 1)
            ) {
              return (
                <button
                  key={page}
                  onClick={() => onPageChange(page)}
                  className={`min-w-[2.5rem] px-3 py-2 rounded-lg text-sm font-medium transition-all ${currentPage === page ? 'bg-indigo-600 text-white' : ''
                    }`}
                  style={currentPage !== page ? { backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' } : undefined}
                >
                  {page}
                </button>
              );
            } else if (page === currentPage - 2 || page === currentPage + 2) {
              return <span key={page} className="px-2" style={{ color: 'var(--text-muted)' }}>...</span>;
            }
            return null;
          })}
        </div>

        <button
          onClick={() => onPageChange(Math.min(totalPages, currentPage + 1))}
          disabled={currentPage === totalPages}
          className="p-2 rounded-lg disabled:opacity-30 disabled:cursor-not-allowed transition-all"
          style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}
        >
          <ChevronRight className="w-5 h-5" />
        </button>
      </div>
    </div>
  );
};

export default PaginationControls;
