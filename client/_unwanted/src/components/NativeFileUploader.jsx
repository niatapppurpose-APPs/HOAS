import FileUploader from './ui/FileUploader';

/**
 * NativeFileUploader wrapper component for backwards compatibility.
 * Delegates to the new Untitled UI styled FileUploader component.
 */
export default function NativeFileUploader({ onFile, accept, maxSize, disabled, label }) {
  return (
    <FileUploader
      onFile={onFile}
      accept={accept}
      maxSize={maxSize}
      disabled={disabled}
      label={label}
    />
  );
}
