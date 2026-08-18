import { useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';

const Dashboard = () => {
  // userData contains the Firestore role; user is the Firebase Auth object (no role field).
  const { user, userData, loading, userDataLoading, isAdmin, claims, adminChecked } = useAuth();
  const navigate = useNavigate();

  useEffect(() => {
    // Wait for auth claims and Firestore data before deciding where to redirect.
    if (loading || userDataLoading || !adminChecked) return;

    if (!user) {
      navigate('/login', { replace: true });
      return;
    }

    // BULLETPROOF: Always allow admin/owner to OwnersDashboard, even if userData is missing
    const claimsRole = claims?.role;
    if (isAdmin || claimsRole === 'admin' || claimsRole === 'owner') {
      navigate('/OwnersDashboard', { replace: true });
      return;
    }

    const role = userData?.role;
    if (role === 'admin' || role === 'owner') {
      navigate('/OwnersDashboard', { replace: true });
    } else if (role === 'management') {
      navigate('/dashboard/management', { replace: true });
    } else if (role === 'warden') {
      navigate('/dashboard/warden', { replace: true });
    } else if (role === 'student') {
      const needsPayment = !userData?.feeDetails?.paidFee || userData?.feeDetails?.paidFee === 0;
      const unverified = userData?.managementVerification !== 'Verified' || userData?.wardenVerification !== 'Verified';
      
      if (needsPayment || unverified) {
        navigate('/waiting-approval', { replace: true });
      } else {
        navigate('/dashboard/student', { replace: true });
      }
    } else {
      // No role assigned yet — await owner/management provisioning
      navigate('/waiting-approval', { replace: true });
    }
  }, [user, userData, loading, userDataLoading, isAdmin, claims, navigate]);

  return (
    <div className="min-h-screen flex items-center justify-center">
      <div className="text-center">
        <div className="animate-spin rounded-full h-12 w-12 border-4 border-indigo-500 border-t-transparent mx-auto"></div>
      </div>
    </div>
  );
};

export default Dashboard;
