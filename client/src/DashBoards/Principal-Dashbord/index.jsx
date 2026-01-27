import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { ref, uploadBytes, getDownloadURL } from "firebase/storage";
import { doc, setDoc } from "firebase/firestore";
import { storage, db } from "../../firebase/firebaseConfig";
import { Building2, Loader2, CheckCircle, UploadIcon } from "lucide-react";
import {HashLoader} from 'react-spinners'

const ManagementProfile = () => {
  const { user, userData, userDataLoading, loading, createUserProfile } = useAuth();
  const navigate = useNavigate();
  const [collegeName, setCollegeName] = useState("");
  const [collegeLocation, setCollegeLocation] = useState("");
  const [hostelCount, setHostelCount] = useState(1);
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [error, setError] = useState("");
  const [logoFile, setLogoFile] = useState(null)
  const [preview, setPreview] = useState(null)
  const [isLogoUploaded, setIsUploaded] = useState(true)
  // Track when the file-picker dialog is open or an upload is in progress
  const [isUploading, setIsUploading] = useState(false)
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

  // Revoke preview object URL when it changes or component unmounts to avoid memory leaks
  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  // If user clicks the upload label but cancels the file picker, detect it and reset the uploading state.
  useEffect(() => {
    if (!isUploading) return undefined;

    const onWindowFocus = () => {
      const input = document.getElementById('logoInput');
      // If the picker closed with no file selected, clear uploading state
      if (!input || !input.files || input.files.length === 0) {
        setIsUploading(false);
      }
    };

    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, [isUploading]);

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
                onChange={(e) => setHostelCount(parseInt(e.target.value))}
                className="w-full px-4 py-3 rounded-xl bg-slate-700/50 border border-slate-600/50 text-white placeholder-slate-500 focus:outline-none focus:border-emerald-500/50 focus:ring-1 focus:ring-emerald-500/50 transition-colors"
              />
            </div>
            {/* Upload College Logo */}
            <p>Upload Logo (Optional)</p>
            <div className="flex gap-3 items-center flex-wrap mt-2">
              <input
                id="logoInput"
                type="file"
                accept="image/*"
                className="hidden"
                onChange={(e) => {
                  const file = e.target.files && e.target.files[0];
                  if (file) {
                    if (preview) URL.revokeObjectURL(preview);
                    setLogoFile(file);
                    setPreview(URL.createObjectURL(file));
                    // Hide the upload button once a file is selected
                    setIsUploaded(false);
                    setIsUploading(false)
                  }
                }}
              />

              {isLogoUploaded ? (
                <label
                  htmlFor="logoInput"
                  onClick={() => setIsUploading(true)}
                  className="flex justify-around items-center gap-5 px-3 py-2 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-lg cursor-pointer font-semibold shadow-md hover:opacity-95 focus:outline-none focus:ring-2 focus:ring-emerald-300"
                >
                  {isUploading ? (
                    <div className="flex items-center gap-2">
                      <HashLoader size={18} color="#ffffff" loading={true} />
                      <span className="text-white">Adding Logo...</span>
                    </div>
                  ) : (
                    <><UploadIcon />Add College logo</>
                  )}
                </label>
              ) : (
                preview && (
                  <div className="flex justify-around items-center gap-3 bg-white/5 border border-slate-700/50 p-1 rounded-md">
                    <img src={preview} alt="Logo preview" className="w-12 h-12 object-cover rounded-full border border-white/5" />
                    <div className="text-slate-300 text-sm max-w-[180px] truncate">{logoFile?.name}</div>
                    <button
                      type="button"
                      className="text-red-400 bg-transparent px-2 py-1 rounded-md font-bold hover:bg-red-600/10"
                      onClick={() => {
                        setLogoFile(null);
                        if (preview) URL.revokeObjectURL(preview);
                        setPreview(null);
                        // Show the upload button again after removal
                        setIsUploaded(true);
                        setIsUploading(false)
                        const input = document.getElementById('logoInput');
                        if (input) input.value = '';
                      }}
                    >
                      Remove
                    </button>
                  </div>
                )
              )}

              
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
