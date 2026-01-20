import { HashLoader } from "react-spinners";

const LoadingState = ({ message = "Loading dashboard data..." }) => {
  return (
    <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: 'var(--bg-primary)' }}>
      <div className="text-center">
        <HashLoader className="w-8 h-8 text-indigo-500 animate-spin mx-auto" />
        <p className="mt-4" style={{ color: 'var(--text-muted)' }}>{message}</p>
      </div>
    </div>
  );
};

export default LoadingState;
