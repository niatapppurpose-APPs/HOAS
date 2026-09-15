import { useRef, useState } from 'react';
import { UploadCloud, FileText, CheckCircle2, AlertCircle, X, Loader2 } from 'lucide-react';

export default function FileUploader({
  onFile,
  accept = 'image/*,application/pdf',
  maxSize = 5 * 1024 * 1024, // 5MB
  disabled = false,
  label = 'Click to upload or drag and drop',
  subtext = 'SVG, PNG, JPG or PDF (max. 5MB)',
  initialFile = null,
  uploading = false,
  uploadProgress = null,
  className = '',
}) {
  const inputRef = useRef(null);
  const [dragging, setDragging] = useState(false);
  const [selectedFile, setSelectedFile] = useState(initialFile);
  const [previewUrl, setPreviewUrl] = useState(null);
  const [error, setError] = useState(null);

  const formatSize = (bytes) => {
    if (!bytes || bytes === 0) return '0 B';
    const k = 1024;
    const sizes = ['B', 'KB', 'MB', 'GB'];
    const i = Math.floor(Math.log(bytes) / Math.log(k));
    return parseFloat((bytes / Math.pow(k, i)).toFixed(1)) + ' ' + sizes[i];
  };

  const handleFileSelect = (file) => {
    if (!file) return;
    setError(null);

    // Validate size
    if (file.size > maxSize) {
      setError(`File size exceeds limit of ${Math.round(maxSize / (1024 * 1024))}MB`);
      return;
    }

    setSelectedFile(file);

    // If image, create object URL for preview
    if (file.type.startsWith('image/')) {
      const url = URL.createObjectURL(file);
      setPreviewUrl(url);
    } else {
      setPreviewUrl(null);
    }

    if (onFile) {
      onFile(file);
    }
  };

  const handleDrop = (e) => {
    e.preventDefault();
    setDragging(false);
    if (disabled) return;
    const file = e.dataTransfer.files?.[0];
    handleFileSelect(file);
  };

  const handleRemove = (e) => {
    e.stopPropagation();
    setSelectedFile(null);
    setPreviewUrl(null);
    setError(null);
    if (inputRef.current) inputRef.current.value = '';
    if (onFile) onFile(null);
  };

  return (
    <div className={`w-full ${className}`}>
      <input
        ref={inputRef}
        type="file"
        accept={accept}
        onChange={(e) => handleFileSelect(e.target.files?.[0])}
        disabled={disabled || uploading}
        className="sr-only"
        id="file-upload-input"
      />

      {!selectedFile ? (
        <div
          role="button"
          tabIndex={disabled ? -1 : 0}
          onClick={() => inputRef.current?.click()}
          onKeyDown={(e) => (e.key === 'Enter' || e.key === ' ') && inputRef.current?.click()}
          onDragOver={(e) => {
            e.preventDefault();
            setDragging(true);
          }}
          onDragLeave={() => setDragging(false)}
          onDrop={handleDrop}
          className={`relative cursor-pointer rounded-3xl border-2 border-dashed p-6 sm:p-8 text-center transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/50 ${
            dragging
              ? 'border-indigo-500 bg-indigo-500/10 scale-[1.01]'
              : 'border-slate-300 dark:border-slate-700/80 hover:border-indigo-500/50 hover:bg-slate-50 dark:hover:bg-slate-900/50'
          } ${disabled ? 'pointer-events-none opacity-50' : ''}`}
          style={{ backgroundColor: dragging ? undefined : 'var(--bg-tertiary)' }}
        >
          <div className="w-12 h-12 rounded-2xl bg-indigo-500/10 text-indigo-500 border border-indigo-500/20 flex items-center justify-center mx-auto mb-3 shadow-inner">
            <UploadCloud className="w-6 h-6" />
          </div>

          <p className="text-sm font-bold" style={{ color: 'var(--text-primary)' }}>
            <span className="text-indigo-500 hover:underline">Click to upload</span> or drag and drop
          </p>
          <p className="text-xs text-slate-400 mt-1">{subtext}</p>
        </div>
      ) : (
        /* Selected file card state */
        <div
          className="relative flex items-center justify-between gap-3 p-4 rounded-2xl border transition shadow-sm"
          style={{
            backgroundColor: 'var(--bg-tertiary)',
            borderColor: 'var(--border-primary)',
          }}
        >
          <div className="flex items-center gap-3 min-w-0 flex-1">
            {previewUrl ? (
              <img
                src={previewUrl}
                alt="File preview"
                className="w-12 h-12 rounded-xl object-cover border border-slate-700 flex-shrink-0"
              />
            ) : (
              <div className="w-12 h-12 rounded-xl bg-indigo-500/10 text-indigo-400 border border-indigo-500/20 flex items-center justify-center flex-shrink-0">
                <FileText className="w-6 h-6" />
              </div>
            )}

            <div className="min-w-0 flex-1">
              <p className="text-xs sm:text-sm font-bold truncate" style={{ color: 'var(--text-primary)' }}>
                {selectedFile.name}
              </p>
              <p className="text-[11px] text-slate-400 mt-0.5">
                {formatSize(selectedFile.size)} • {selectedFile.type || 'Document'}
              </p>

              {/* Progress bar if uploading */}
              {uploading && (
                <div className="w-full bg-slate-700/50 rounded-full h-1.5 mt-2 overflow-hidden">
                  <div
                    className="bg-indigo-500 h-full rounded-full transition-all duration-300"
                    style={{ width: `${uploadProgress ?? 65}%` }}
                  />
                </div>
              )}
            </div>
          </div>

          <div className="flex items-center gap-2 flex-shrink-0">
            {uploading ? (
              <Loader2 className="w-5 h-5 text-indigo-500 animate-spin" />
            ) : (
              <CheckCircle2 className="w-5 h-5 text-emerald-500" />
            )}
            {!uploading && (
              <button
                type="button"
                onClick={handleRemove}
                className="p-1.5 rounded-lg hover:bg-red-500/10 text-slate-400 hover:text-red-400 transition"
                aria-label="Remove file"
              >
                <X className="w-4 h-4" />
              </button>
            )}
          </div>
        </div>
      )}

      {error && (
        <div className="flex items-center gap-1.5 mt-2 text-xs font-semibold text-red-400">
          <AlertCircle className="w-3.5 h-3.5" />
          <span>{error}</span>
        </div>
      )}
    </div>
  );
}
