import { memo } from "react";
import {
  Building2,
  CheckCircle,
  MapPin,
  Home,
  Sparkles,
  ArrowRight,
  Loader2,
} from "lucide-react";

/** Full-screen success animation shown after profile creation */
const ProfileSuccessScreen = memo(({ profileData, countdown }) => (
  <div className="min-h-screen bg-gradient-to-br from-slate-900 via-purple-900/20 to-slate-900 flex items-center justify-center p-4 overflow-hidden">
    {/* Background animated elements */}
    <div className="absolute inset-0 overflow-hidden">
      <div className="absolute top-1/4 left-1/4 w-96 h-96 bg-emerald-500/10 rounded-full blur-3xl animate-pulse" />
      <div
        className="absolute bottom-1/4 right-1/4 w-96 h-96 bg-purple-500/10 rounded-full blur-3xl animate-pulse"
        style={{ animationDelay: "1s" }}
      />
      <div className="absolute top-1/2 left-1/2 -translate-x-1/2 -translate-y-1/2 w-[600px] h-[600px] bg-indigo-500/5 rounded-full blur-3xl" />
    </div>

    <div
      className="relative z-10 w-full max-w-xl"
      style={{
        animation:
          "fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) forwards",
      }}
    >
      {/* Success checkmark */}
      <div className="text-center mb-8">
        <div
          className="inline-flex p-5 rounded-full bg-gradient-to-br from-emerald-500 to-teal-600 mb-6 shadow-2xl shadow-emerald-500/30"
          style={{
            animation:
              "scaleIn 0.6s cubic-bezier(0.34, 1.56, 0.64, 1) 0.2s forwards",
            opacity: 0,
            transform: "scale(0)",
          }}
        >
          <CheckCircle className="w-16 h-16 text-white" />
        </div>
        <h1
          className="text-3xl md:text-4xl font-bold text-white mb-2"
          style={{
            animation:
              "fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.4s forwards",
            opacity: 0,
          }}
        >
          Profile Created Successfully!
        </h1>
        <p
          className="text-slate-400"
          style={{
            animation:
              "fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 0.5s forwards",
            opacity: 0,
          }}
        >
          Your college has been registered
        </p>
      </div>

      {/* College Profile Card */}
      <div
        className="bg-slate-800/70 border border-slate-700/50 rounded-3xl p-8 backdrop-blur-xl shadow-2xl"
        style={{
          animation:
            "fadeSlideUp 0.8s cubic-bezier(0.16, 1, 0.3, 1) 0.6s forwards",
          opacity: 0,
          boxShadow:
            "0 25px 80px -12px rgba(16, 185, 129, 0.25), 0 0 60px rgba(139, 92, 246, 0.1)",
        }}
      >
        {/* College Header with Logo */}
        <div className="flex items-center gap-5 mb-6 pb-6 border-b border-slate-700/50">
          {profileData.collegeLogo ? (
            <div className="relative">
              <div className="w-20 h-20 rounded-2xl overflow-hidden ring-4 ring-emerald-500/30 shadow-xl">
                <img
                  src={profileData.collegeLogo}
                  alt="College Logo"
                  className="w-full h-full object-cover"
                />
              </div>
              <div className="absolute -bottom-1 -right-1 w-6 h-6 bg-emerald-500 rounded-full flex items-center justify-center">
                <CheckCircle className="w-4 h-4 text-white" />
              </div>
            </div>
          ) : (
            <div className="w-20 h-20 rounded-2xl bg-gradient-to-br from-emerald-500 to-teal-600 flex items-center justify-center ring-4 ring-emerald-500/30">
              <Building2 className="w-10 h-10 text-white" />
            </div>
          )}
          <div className="flex-1">
            <h2 className="text-2xl font-bold text-white mb-1">
              {profileData.collegeName}
            </h2>
            {profileData.collegeLocation && (
              <div className="flex items-center gap-2 text-slate-400">
                <MapPin className="w-4 h-4" />
                <span>{profileData.collegeLocation}</span>
              </div>
            )}
          </div>
        </div>

        {/* Stats Grid */}
        <div className="grid grid-cols-2 gap-4 mb-6">
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-purple-500/20">
                <Home className="w-5 h-5 text-purple-400" />
              </div>
              <div>
                <p className="text-2xl font-bold text-white">
                  {profileData.hostelCount}
                </p>
                <p className="text-xs text-slate-400">Hostels</p>
              </div>
            </div>
          </div>
          <div className="bg-slate-700/30 rounded-xl p-4 border border-slate-600/30">
            <div className="flex items-center gap-3">
              <div className="p-2 rounded-lg bg-emerald-500/20">
                <Sparkles className="w-5 h-5 text-emerald-400" />
              </div>
              <div>
                <p className="text-sm font-semibold text-emerald-400">
                  Pending
                </p>
                <p className="text-xs text-slate-400">Approval</p>
              </div>
            </div>
          </div>
        </div>

        {/* Admin Info */}
        <div className="flex items-center gap-4 p-4 bg-slate-700/20 rounded-xl border border-slate-600/20">
          {profileData.userPhoto ? (
            <img
              src={profileData.userPhoto}
              alt={profileData.userName}
              className="w-12 h-12 rounded-full ring-2 ring-emerald-500/50"
            />
          ) : (
            <div className="w-12 h-12 rounded-full bg-emerald-600 flex items-center justify-center text-white text-lg font-bold">
              {profileData.userName?.charAt(0) || "M"}
            </div>
          )}
          <div className="flex-1">
            <p className="text-white font-medium">{profileData.userName}</p>
            <p className="text-slate-400 text-sm">{profileData.userEmail}</p>
          </div>
          <div className="px-3 py-1 rounded-full bg-emerald-500/20 text-emerald-400 text-xs font-medium">
            Management
          </div>
        </div>
      </div>

      {/* Redirect countdown */}
      <div
        className="text-center mt-8"
        style={{
          animation:
            "fadeSlideUp 0.6s cubic-bezier(0.16, 1, 0.3, 1) 1s forwards",
          opacity: 0,
        }}
      >
        <div className="inline-flex items-center gap-3 px-6 py-3 rounded-full bg-slate-800/50 border border-slate-700/50">
          <div className="flex items-center gap-2">
            <Loader2 className="w-4 h-4 text-emerald-400 animate-spin" />
            <span className="text-slate-300">Redirecting in</span>
          </div>
          <span className="text-2xl font-bold text-emerald-400">
            {countdown}
          </span>
          <ArrowRight className="w-4 h-4 text-slate-400" />
        </div>
        <p className="text-slate-500 text-sm mt-3">
          Taking you to the approval waiting page...
        </p>
      </div>
    </div>

    {/* CSS Keyframes */}
    <style>{`
      @keyframes fadeSlideUp {
        from { opacity: 0; transform: translateY(30px); }
        to { opacity: 1; transform: translateY(0); }
      }
      @keyframes scaleIn {
        from { opacity: 0; transform: scale(0); }
        to { opacity: 1; transform: scale(1); }
      }
    `}</style>
  </div>
));
ProfileSuccessScreen.displayName = "ProfileSuccessScreen";

export default ProfileSuccessScreen;
