import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Building2, Loader2, CheckCircle } from "lucide-react";

const ManagementProfile = () => {
  const { user, userData, userDataLoading, loading, createUserProfile } = useAuth();
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState("");
  const [collegeLocation, setCollegeLocation] = useState("");
  const [hostelCount, setHostelCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => {
    // If not logged in, redirect to login
    if (!loading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    // If user already has profile filled, redirect based on status
    if (!userDataLoading && userData && userData.role === "management") {
      // Only redirect if profile details are already filled (has collegeName)
      if (userData.collegeName) {
        if (userData.status === "approved") {
          navigate("/dashboard/management", { replace: true });
        } else {
          navigate("/waiting-approval", { replace: true });
        }
      }
    }
  }, [user, userData, userDataLoading, loading, navigate]);

  const handleSubmit = async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!collegeName.trim()) {
      setError("Please enter your college/institution name");
      setIsSubmitting(false);
      return;
    }

    try {
      const success = await createUserProfile("management", {
        collegeName: collegeName.trim(),
        collegeLocation: collegeLocation.trim(),
        hostelCount: hostelCount,
      });

      if (success) {
        navigate("/waiting-approval", { replace: true });
      } else {
        setError("Failed to create profile. Please try again.");
      }
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("An error occurred. Please try again.");
    }

    setIsSubmitting(false);
  };

  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center p-4">
      <div className="w-full max-w-lg">
        {/* Logo & Branding */}
        <div className="text-center mb-8">
          <div className="inline-flex p-4 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 mb-4">
            <Building2 className="w-12 h-12 text-white" />
          </div>
          <h1 className="text-3xl font-bold text-white">Complete Your Profile</h1>
          <p className="text-slate-400 mt-2">Management / Co-Admin Registration</p>
        </div>

        {/* Profile Form */}
        <div className="bg-slate-800/50 border border-slate-700/50 rounded-2xl p-8 backdrop-blur-sm">
          {/* User Info Preview */}
          <div className="flex items-center gap-4 mb-6 pb-6 border-b border-slate-700/50">
            {user?.photoURL ? (
              <img
                src={user.photoURL}
                alt={user.displayName}
                className="w-14 h-14 rounded-full ring-2 ring-emerald-500/50"
              />
            ) : (
              <div className="w-14 h-14 rounded-full bg-emerald-600 flex items-center justify-center text-white text-xl font-bold">
                {user?.displayName?.charAt(0) || "M"}
              </div>
            )}
            <div>
              <p className="text-white font-semibold">{user?.displayName}</p>
              <p className="text-slate-400 text-sm">{user?.email}</p>
            </div>
          </div>

          <form onSubmit={handleSubmit} className="space-y-6">
            {/* College Name */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                College / Institution Name *
              </label>
              <input
                type="text"
                value={collegeName}
                onChange={(e) => setCollegeName(e.target.value)}
                placeholder="e.g., St. Xavier's College"
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
                required
              />
            </div>

            {/* College Location */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Location
              </label>
              <input
                type="text"
                value={collegeLocation}
                onChange={(e) => setCollegeLocation(e.target.value)}
                placeholder="e.g., Mumbai, Maharashtra"
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
            </div>

            {/* Number of Hostels */}
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Number of Hostels
              </label>
              <input
                type="number"
                min="1"
                max="50"
                value={hostelCount}
                onChange={(e) => setHostelCount(parseInt(e.target.value) || 1)}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
            </div>

            {/* Error Message */}
            {error && (
              <div className="p-4 rounded-xl bg-red-500/20 border border-red-500/30">
                <p className="text-red-300 text-sm">{error}</p>
              </div>
            )}

            {/* Submit Button */}
            <button
              type="submit"
              disabled={isSubmitting}
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed"
            >
              {isSubmitting ? (
                <>
                  <Loader2 className="w-5 h-5 animate-spin" />
                  Creating Profile...
                </>
              ) : (
                <>
                  <CheckCircle className="w-5 h-5" />
                  Submit for Approval
                </>
              )}
            </button>
          </form>

          <p className="text-slate-500 text-xs text-center mt-6">
            Your profile will be reviewed by the system administrator.
          </p>
        </div>
      </div>
    </div>
  );
};

export default ManagementProfile;
