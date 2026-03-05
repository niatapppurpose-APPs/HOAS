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

    // Role is stored in Firestore userData, NOT on the Firebase Auth user object.
    const role = userData?.role;
    if (role === 'management') {
      navigate('/dashboard/management', { replace: true });
    } else if (role === 'warden') {
      navigate('/dashboard/warden', { replace: true });
    } else if (role === 'student') {
      navigate('/dashboard/student', { replace: true });
    } else if (role === 'admin' || role === 'owner') {
      navigate('/dashboard/owner', { replace: true });
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
