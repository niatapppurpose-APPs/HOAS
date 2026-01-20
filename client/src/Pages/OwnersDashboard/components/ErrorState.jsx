import { AlertCircle } from "lucide-react";

const ErrorState = ({ error }) => {
  return (
    <div className="bg-red-500/20 border border-red-500/30 rounded-xl p-6 text-center">
      <AlertCircle className="w-12 h-12 text-red-400 mx-auto mb-4" />
      <h3 className="text-xl font-semibold mb-2" style={{ color: 'var(--text-primary)' }}>Error Loading Users</h3>
      <p className="text-red-300 max-w-md mx-auto mb-4">{error}</p>
      <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
        Make sure your Firestore security rules allow reading the users collection.
      </p>
    </div>
  );
};

export default ErrorState;
