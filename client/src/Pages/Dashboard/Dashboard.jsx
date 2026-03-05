import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  // userData contains the Firestore role; user is the Firebase Auth object (no role field).
  const { user, userData, loading, userDataLoading } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for both auth AND Firestore data before deciding where to redirect.
    if (loading || userDataLoading) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // Prefer Firestore userData, but fallback to claims if missing
    const role = userData?.role;
    // Fallback: get claims from AuthContext (if available)
    let claimsRole = null;
    try {
      // Try to get claims from AuthContext (if available)
      const { claims } = require('../../context/AuthContext').useAuth();
      claimsRole = claims?.role;
    } catch {}

    // If admin/owner by claims, always send to owner dashboard
    if (role === 'admin' || role === 'owner' || claimsRole === 'admin' || claimsRole === 'owner') {
      navigate('/OwnersDashboard', { replace: true });
    } else if (role === 'management') {
      navigate('/dashboard/management', { replace: true });
    } else if (role === 'warden') {
      navigate('/dashboard/warden', { replace: true });
    } else if (role === 'student') {
      navigate('/dashboard/student', { replace: true });
    } else {
      // No role assigned yet — await owner/management provisioning
      navigate('/waiting-approval', { replace: true });
    }
  }, [user, userData, loading, userDataLoading, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
};

export default Dashboard;
