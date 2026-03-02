import { memo } from 'react';
import {
    CheckCircle2, AlertTriangle, Upload,
    ChevronDown, ChevronUp,
} from 'lucide-react';
import { formatTime } from './bulkUploadUtils';

/**
 * Renders the "Done" step of the bulk upload flow with stats & errors accordion.
 */
const BulkUploadResults = memo(({
    results,
    elapsedTime,
    showErrors,
    setShowErrors,
    onReset,
    onClose,
    isDark,
    textPrimary,
    textSecondary,
    bgSecondary,
    border,
}) => (
    <div className="space-y-4">
        {/* Success Banner */}
        <div className="text-center py-4">
            <div className="w-16 h-16 mx-auto mb-3 rounded-full flex items-center justify-center" style={{ background: 'linear-gradient(135deg, #16a34a, #22c55e)' }}>
                <CheckCircle2 className="w-8 h-8 text-white" />
            </div>
            <h3 className="text-xl font-bold" style={{ color: textPrimary }}>
                Upload Complete! 🎉
            </h3>
            <p className="text-sm mt-1" style={{ color: textSecondary }}>
                Completed in {formatTime(elapsedTime)}
            </p>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-3 gap-3">
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(22,163,74,0.1)' : '#f0fdf4', border: `1px solid ${isDark ? 'rgba(22,163,74,0.2)' : '#bbf7d0'}` }}>
                <p className="text-2xl font-bold" style={{ color: '#16a34a' }}>{results.created}</p>
                <p className="text-xs font-medium" style={{ color: isDark ? '#4ade80' : '#16a34a' }}>Created</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(234,179,8,0.1)' : '#fffbeb', border: `1px solid ${isDark ? 'rgba(234,179,8,0.2)' : '#fde68a'}` }}>
                <p className="text-2xl font-bold" style={{ color: '#eab308' }}>{results.skipped}</p>
                <p className="text-xs font-medium" style={{ color: isDark ? '#fbbf24' : '#d97706' }}>Skipped</p>
            </div>
            <div className="text-center p-4 rounded-xl" style={{ backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2', border: `1px solid ${isDark ? 'rgba(220,38,38,0.2)' : '#fecaca'}` }}>
                <p className="text-2xl font-bold" style={{ color: '#dc2626' }}>{results.failed}</p>
                <p className="text-xs font-medium" style={{ color: isDark ? '#f87171' : '#dc2626' }}>Failed</p>
            </div>
        </div>

        {/* Errors Accordion */}
        {results.errors && results.errors.length > 0 && (
            <div className="rounded-xl overflow-hidden" style={{ border: `1px solid ${isDark ? 'rgba(220,38,38,0.2)' : '#fecaca'}` }}>
                <button
                    type="button"
                    onClick={() => setShowErrors(!showErrors)}
                    className="w-full flex items-center justify-between px-4 py-3 transition-colors"
                    style={{ backgroundColor: isDark ? 'rgba(220,38,38,0.1)' : '#fef2f2' }}
                >
                    <span className="flex items-center gap-2 text-sm font-medium" style={{ color: isDark ? '#f87171' : '#dc2626' }}>
                        <AlertTriangle className="w-4 h-4" />
                        {results.errors.length} issue{results.errors.length > 1 ? 's' : ''} found
                    </span>
                    {showErrors ? <ChevronUp className="w-4 h-4" /> : <ChevronDown className="w-4 h-4" />}
                </button>
                {showErrors && (
                    <div className="px-4 py-3 space-y-2">
                        {results.errors.map((err, i) => (
                            <div key={i} className="flex items-start gap-2 text-xs" style={{ color: textSecondary }}>
                                <span className="font-mono shrink-0">#{err.index}</span>
                                <span className="font-medium" style={{ color: textPrimary }}>{err.name}</span>
                                <span>— {err.reason}</span>
                            </div>
                        ))}
                    </div>
                )}
            </div>
        )}

        {/* Info Note */}
        <div
            className="rounded-xl p-4"
            style={{
                backgroundColor: isDark ? 'rgba(59,130,246,0.1)' : '#eff6ff',
                border: `1px solid ${isDark ? 'rgba(59,130,246,0.2)' : '#bfdbfe'}`,
                borderLeft: '4px solid #3b82f6'
            }}
        >
            <p className="text-xs" style={{ color: isDark ? '#93c5fd' : '#1e40af' }}>
                <strong>📧 Email sent</strong> to naitapppurpose@gmail.com with the student list and download link.
                <br />
                <strong>🔑 Random passwords</strong> were generated for each student. Check the email for the full credentials list.
            </p>
        </div>

        {/* Action Buttons */}
        <div className="flex gap-3">
            <button
                type="button"
                onClick={onReset}
                className="flex-1 py-3 rounded-xl font-semibold text-sm flex items-center justify-center gap-2 transition-all border"
                style={{ borderColor: border, color: textPrimary, backgroundColor: bgSecondary }}
            >
                <Upload className="w-4 h-4" />
                Upload More
            </button>
            <button
                type="button"
                onClick={onClose}
                className="flex-1 py-3 rounded-xl font-semibold text-white text-sm flex items-center justify-center gap-2 transition-all"
                style={{ background: 'linear-gradient(135deg, #4f46e5, #7c3aed)' }}
            >
                <CheckCircle2 className="w-4 h-4" />
                Done
            </button>
        </div>
    </div>
));

BulkUploadResults.displayName = 'BulkUploadResults';

export default BulkUploadResults;
