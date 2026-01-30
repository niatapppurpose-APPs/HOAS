import React from 'react';
import { X, AlertCircle } from 'lucide-react';
import { useError } from '../context/ErrorContext';

const ErrorModal = () => {
  const { error, clearError } = useError();
  if (!error) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <div className="absolute inset-0 bg-black/40" onClick={clearError} />
      <div className="relative max-w-xl w-full bg-white rounded-lg p-6 shadow-lg">
        <div className="flex items-start gap-3">
          <div className="p-2 rounded-full bg-red-50 text-red-600">
            <AlertCircle />
          </div>
          <div className="flex-1">
            <div className="flex justify-between items-start">
              <div>
                <h3 className="text-lg font-semibold text-gray-900">Something went wrong</h3>
                <p className="text-sm text-gray-500 mt-1">We captured an error and our team has been notified.</p>
              </div>
              <button className="text-gray-400 hover:text-gray-700" onClick={clearError} aria-label="Close">
                <X />
              </button>
            </div>

            <div className="mt-4 bg-gray-50 rounded p-3 text-sm text-gray-700 max-h-36 overflow-auto">
              <div><strong>Message:</strong> {error.message}</div>
              {error.stack && <pre className="mt-2 text-xs text-gray-600 whitespace-pre-wrap">{error.stack}</pre>}
            </div>

            <div className="mt-4 flex justify-end gap-2">
              <button onClick={() => { clearError(); }} className="px-4 py-2 rounded-md bg-gray-100 hover:bg-gray-200">Close</button>
              <a
                href={`mailto:support@example.com?subject=App%20Error&body=${encodeURIComponent(JSON.stringify(error, null, 2))}`}
                className="px-4 py-2 rounded-md bg-red-600 text-white hover:bg-red-700"
              >
                Report
              </a>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
};

export default ErrorModal;
