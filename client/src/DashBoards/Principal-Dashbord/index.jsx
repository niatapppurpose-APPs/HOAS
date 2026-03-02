import { useState, useEffect, useCallback } from "react";
import { useNavigate } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { Building2, Loader2, CheckCircle, UploadIcon } from "lucide-react";
import LocationAutocomplete from "../../components/LocationAutocomplete";
import { HashLoader } from 'react-spinners'
import { compressLogoForModal } from '../../Pages/OwnersDashboard/utils/compressLogo';
import ProfileSuccessScreen from './ProfileSuccessScreen';


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
  const [isUploading, setIsUploading] = useState(false)

  // New states for success animation
  const [showSuccess, setShowSuccess] = useState(false);
  const [uploadedLogoUrl, setUploadedLogoUrl] = useState(null);
  const [countdown, setCountdown] = useState(3);
  const [profileData, setProfileData] = useState(null);

  useEffect(() => {
    if (!loading && !user) {
      navigate("/login", { replace: true });
      return;
    }

    if (!userDataLoading && userData && userData.role === "management") {
      if (userData.collegeName) {
        if (userData.status === "approved") {
          navigate("/dashboard/management", { replace: true });
        } else {
          navigate("/waiting-approval", { replace: true });
        }
      }
    }
  }, [user, userData, userDataLoading, loading, navigate]);

  useEffect(() => {
    return () => {
      if (preview) {
        URL.revokeObjectURL(preview);
      }
    };
  }, [preview]);

  useEffect(() => {
    if (!isUploading) return undefined;

    const onWindowFocus = () => {
      const input = document.getElementById('logoInput');
      if (!input || !input.files || input.files.length === 0) {
        setIsUploading(false);
      }
    };

    window.addEventListener('focus', onWindowFocus);
    return () => window.removeEventListener('focus', onWindowFocus);
  }, [isUploading]);

  // Countdown timer for redirect
  useEffect(() => {
    if (showSuccess && countdown > 0) {
      const timer = setTimeout(() => setCountdown(countdown - 1), 1000);
      return () => clearTimeout(timer);
    } else if (showSuccess && countdown === 0) {
      navigate("/waiting-approval", { replace: true });
    }
  }, [showSuccess, countdown, navigate]);

  // Compress logo image and return base64 data URL
  // Stored directly in Firestore to avoid GCS CORS issues
  const compressLogo = (file) => {
    return new Promise((resolve, reject) => {
      const img = new Image();
      const reader = new FileReader();

      reader.onload = (e) => {
        img.onload = () => {
          try {
            const canvas = document.createElement('canvas');
            const MAX = 400; // Recommended 400x400
            let { width, height } = img;

            if (width > MAX || height > MAX) {
              const ratio = Math.min(MAX / width, MAX / height);
              width = Math.round(width * ratio);
              height = Math.round(height * ratio);
            }

            canvas.width = width;
            canvas.height = height;
            const ctx = canvas.getContext('2d');
            ctx.drawImage(img, 0, 0, width, height);

            const dataUrl = canvas.toDataURL('image/jpeg', 0.8);
            resolve(dataUrl);
          } catch (err) {
            reject(err);
          }
        };
        img.onerror = () => reject(new Error('Failed to load image'));
        img.src = e.target.result;
      };
      reader.onerror = () => reject(new Error('Failed to read file'));
      reader.readAsDataURL(file);
    });
  };

  const handleSubmit = useCallback(async (e) => {
    e.preventDefault();
    setError("");
    setIsSubmitting(true);

    if (!collegeName.trim()) {
      setError("Please enter your college/institution name");
      setIsSubmitting(false);
      return;
    }

    try {
      // Compress logo to base64 data URL
      let logoUrl = null;
      if (logoFile) {
        logoUrl = await compressLogoForModal(logoFile);
        setUploadedLogoUrl(logoUrl);
      }

      // Create user profile with logo URL
      const success = await createUserProfile("management", {
        collegeName: collegeName.trim(),
        collegeLocation: collegeLocation.trim(),
        hostelCount: hostelCount,
        collegeLogo: logoUrl,
      });

      if (success) {
        // Store profile data for success animation
        setProfileData({
          collegeName: collegeName.trim(),
          collegeLocation: collegeLocation.trim(),
          hostelCount: hostelCount,
          collegeLogo: logoUrl || preview,
          userName: user?.displayName,
          userEmail: user?.email,
          userPhoto: user?.photoURL,
        });

        // Show success animation
        setShowSuccess(true);
      } else {
        setError("Failed to create profile. Please try again.");
      }
    } catch (err) {
      console.error("Error creating profile:", err);
      setError("An error occurred. Please try again.");
    }

    setIsSubmitting(false);
  }, [collegeName, collegeLocation, hostelCount, logoFile, preview, user, createUserProfile]);

  if (loading || userDataLoading) {
    return (
      <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900 flex items-center justify-center">
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  // Success Animation Screen
  if (showSuccess && profileData) {
    return <ProfileSuccessScreen profileData={profileData} countdown={countdown} />;
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
              <LocationAutocomplete
                value={collegeLocation}
                onChange={(val) => setCollegeLocation(val)}
                onSelect={(suggestion) => setCollegeLocation(suggestion.display_name)}
                placeholder="e.g., Mumbai, Maharashtra"
                style={{
                  backgroundColor: 'rgba(51, 65, 85, 0.5)',
                  borderColor: 'rgba(71, 85, 105, 0.5)',
                }}
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
            <div>
              <label className="block text-slate-300 text-sm font-medium mb-2">
                Upload Logo (Optional)
              </label>
              <p className="text-xs text-slate-400 mb-3">
                Recommended size: <span className="text-emerald-400 font-medium">400×400 pixels</span> for best results
              </p>
              <div className="flex gap-3 items-center flex-wrap">
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
                      setIsUploaded(false);
                      setIsUploading(false)
                    }
                  }}
                />

                {isLogoUploaded ? (
                  <label
                    htmlFor="logoInput"
                    onClick={() => setIsUploading(true)}
                    className="flex justify-around items-center gap-3 px-4 py-2.5 bg-gradient-to-r from-emerald-500 to-teal-500 text-white rounded-xl cursor-pointer font-semibold shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.02] transition-all duration-300"
                  >
                    {isUploading ? (
                      <div className="flex items-center gap-2">
                        <HashLoader size={18} color="#ffffff" loading={true} />
                        <span className="text-white">Adding Logo...</span>
                      </div>
                    ) : (
                      <><UploadIcon className="w-5 h-5" />Add College Logo</>
                    )}
                  </label>
                ) : (
                  preview && (
                    <div className="flex items-center gap-4 bg-slate-700/30 border border-slate-600/50 p-3 rounded-xl w-full">
                      <img src={preview} alt="Logo preview" className="w-14 h-14 object-cover rounded-xl border-2 border-emerald-500/30" />
                      <div className="flex-1 min-w-0">
                        <p className="text-white text-sm font-medium truncate">{logoFile?.name}</p>
                        <p className="text-slate-400 text-xs">Ready to upload</p>
                      </div>
                      <button
                        type="button"
                        className="px-3 py-1.5 text-red-400 bg-red-500/10 border border-red-500/30 rounded-lg text-sm font-medium hover:bg-red-500/20 transition-colors"
                        onClick={() => {
                          setLogoFile(null);
                          if (preview) URL.revokeObjectURL(preview);
                          setPreview(null);
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
              className="w-full flex items-center justify-center gap-2 px-6 py-4 rounded-xl bg-gradient-to-r from-emerald-600 to-teal-600 hover:from-emerald-500 hover:to-teal-500 text-white font-semibold transition-all duration-300 disabled:opacity-50 disabled:cursor-not-allowed shadow-lg shadow-emerald-500/20 hover:shadow-emerald-500/30 hover:scale-[1.01]"
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
