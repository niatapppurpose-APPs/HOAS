import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";
import Avatar from "./Avatar";
import AnimatedLogoutButton from "../AnimatedLogoutButton";
import {
  Eye,
  EyeOff,
  Loader2,
  X,

  Camera
} from "lucide-react";
import { HashLoader } from "react-spinners";
import Header from "./header";

const OwnerProfile = () => {
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
  const navigate = useNavigate();
  const context = useOutletContext();
  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);
  const isCollapsed = context?.isCollapsed ?? localIsCollapsed;
  const setIsCollapsed = context?.setIsCollapsed ?? setLocalIsCollapsed;


  const location = useLocation();
  const toast = useToast();
  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    organization: "",
    photoURL: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  /* ── Password Modal ── */
  const [showPwModal, setShowPwModal] = useState(false);
  const [pwForm, setPwForm] = useState({ current: "", newPass: "", confirm: "" });
  const [showPw, setShowPw] = useState({ current: false, newPass: false, confirm: false });
  const [changingPw, setChangingPw] = useState(false);

  /* ── Banner State ── */
  const [showBanner, setShowBanner] = useState(false);
  const [profileBanner, setProfileBanner] = useState(() => {
    const saved = localStorage.getItem('profileBannerImage');
    const expiry = localStorage.getItem('profileBannerExpiryDate');
    if (saved && expiry && Date.now() < parseInt(expiry, 10)) {
      return saved;
    }
    return null;
  });

  useEffect(() => {
    const bannerExpiry = localStorage.getItem('profileBannerExpiry');
    if (!bannerExpiry || Date.now() > parseInt(bannerExpiry, 10)) {
      setShowBanner(true);
    }
  }, []);

  const handleDismissBanner = () => {
    setShowBanner(false);
    // 30 days in ms = 30 * 24 * 60 * 60 * 1000 = 2592000000 
    localStorage.setItem('profileBannerExpiry', Date.now() + 2592000000);
  };

  const bannerInputRef = useRef(null);

  const handleBannerUpload = (e) => {
    const file = e.target.files[0];
    if (file) {
      if (file.size > 2 * 1024 * 1024) {
        toast.error("Banner must be under 2MB");
        return;
      }

      const reader = new FileReader();
      setIsSaving(true);
      reader.onloadend = () => {
        const base64String = reader.result;
        try {
          setProfileBanner(base64String);
          localStorage.setItem('profileBannerImage', base64String);
          // Set expiry for 1 month
          localStorage.setItem('profileBannerExpiryDate', (Date.now() + 2592000000).toString());
          toast.success("Profile banner saved locally! ✨");
        } catch (err) {
          console.error("Storage error:", err);
          toast.error("Image too large for browser memory. Try a smaller file.");
        }
        setIsSaving(false);
      };
      reader.readAsDataURL(file);
    }
  };

  /* ── Auth Guard ── */
  useEffect(() => {
    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        navigate("/login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  /* ── Fetch Profile ── */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;
      try {
        const snap = await getDoc(doc(db, "admins", user.uid));
        if (snap.exists()) {
          const data = snap.data();
          setProfileData({
            displayName: data.displayName || user.displayName || "",
            email: data.email || user.email || "",
            phone: data.phone || "",
            organization: data.organization || "",
            photoURL: data.photoURL || user.photoURL || "",
          });
          // Note: Banner is now handled by local state only
        } else {
          setProfileData({
            displayName: user.displayName || "",
            email: user.email || "",
            phone: "",
            organization: "",
            photoURL: user.photoURL || "",
          });
        }
      } catch (err) {
        console.error(err);
      } finally {
        setIsLoading(false);
      }
    };
    if (user && adminChecked) fetchProfile();
  }, [user, adminChecked]);

  /* ── Logout ── */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /* ── Save Profile ── */
  const handleSave = async () => {
    if (!user) return;
    setIsSaving(true);
    setSaveMessage("");
    try {
      await setDoc(doc(db, "admins", user.uid), {
        ...profileData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      // Also update users collection
      await setDoc(doc(db, "users", user.uid), {
        displayName: profileData.displayName,
        phone: profileData.phone,
        photoURL: profileData.photoURL,
        updatedAt: new Date().toISOString(),
      }, { merge: true });
      setSaveMessage("Profile updated successfully");
      toast.success("Profile updated");
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage("Failed to update profile");
      toast.error("Save failed");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  /* ── Change Password ── */
  const handleChangePw = async () => {
    if (pwForm.newPass !== pwForm.confirm) { toast.error("Passwords do not match"); return; }
    if (pwForm.newPass.length < 6) { toast.error("Minimum 6 characters"); return; }
    setChangingPw(true);
    try {
      const cred = EmailAuthProvider.credential(user.email, pwForm.current);
      await reauthenticateWithCredential(auth.currentUser, cred);
      await updatePassword(auth.currentUser, pwForm.newPass);
      toast.success("Password changed successfully");
      setShowPwModal(false);
      setPwForm({ current: "", newPass: "", confirm: "" });
    } catch (err) {
      toast.error(err.code === "auth/wrong-password" ? "Current password is incorrect" : "Failed to change password");
    } finally {
      setChangingPw(false);
    }
  };

  /* ── Loading ── */
  if (loading || isLoading || !adminChecked) {
    return (
      <div className="min-h-screen flex items-center justify-center" style={{ backgroundColor: "var(--bg-primary)" }}>
        <HashLoader className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  // Prevent crashes if user is null during transition/deletion
  if (!user) return null;
  return (

    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      <Header title="YOUR PROFILE 🫵" handleLogout={handleLogout} isCollapsed={isCollapsed} setIsCollapsed={setIsCollapsed} />
      {/* ── Main ── */}
      <main className="max-w-6xl mx-auto px-4 sm:px-6 pt-34 sm:pt-42 pb-8 relative z-10">
        {showBanner && (
          <div className="mb-6 rounded-2xl p-4 sm:p-5 flex items-center justify-between text-white shadow-xl shadow-pink-500/20 animate-fadeIn" style={{ background: 'linear-gradient(135deg, #f59e0b, #ec4899, #8b5cf6)' }}>
            <div>
              <h3 className="font-bold text-lg tracking-tight">Welcome to your pristine Owner Profile!</h3>
              <p className="text-sm font-medium opacity-90">Keep your details up to date to ensure account security. This banner will return in a month.</p>
            </div>
            <button onClick={handleDismissBanner} className="p-2 bg-white/20 hover:bg-white/30 rounded-full transition cursor-pointer flex-shrink-0 ml-4">
              <X size={18} />
            </button>
          </div>
        )}

        <div className="rounded-[2.5rem] p-6 lg:p-10 shadow-2xl relative overflow-hidden" style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)", backdropFilter: "blur(24px)" }}>

          <div className="grid grid-cols-1 lg:grid-cols-12 gap-6 lg:gap-8 relative z-10">

            {/* LEFT COLUMN: Profile info */}
            <div className="lg:col-span-5 rounded-[2.5rem] shadow-xl overflow-hidden flex flex-col relative z-20" style={{ backgroundColor: 'var(--bg-primary)' }}>

              {/* Profile Banner Background - Switched to relative to prevent absolute-layer overlap issues */}
              <div className="relative w-full h-20 sm:h-40 z-20 group/banner overflow-hidden">
                {profileBanner ? (
                  <img profile-banner-img="true" src={profileBanner} alt="Banner" className="w-full h-full object-cover transition-transform duration-500 group-hover/banner:scale-110" />
                ) : (
                  <div className="w-full h-full bg-slate-800 animate-pulse" />
                )}
                {/* Invisible full-area hover trigger - Upped Z-INDEX to 50 */}
                <div
                  onClick={() => bannerInputRef.current?.click()}
                  className="absolute inset-0 bg-black/40 opacity-0 group-hover/banner:opacity-100 transition-opacity flex items-center justify-center cursor-pointer text-white font-bold text-sm gap-2 backdrop-blur-sm z-[30]"
                >
                  <Camera size={20} /> Change Banner
                </div>

                {/* Small permanent Edit Pill for better UX - Upped Z-INDEX to 60 */}
                <button
                  type="button"
                  onClick={() => {
                    console.log("Edit button clicked");
                    bannerInputRef.current?.click();
                  }}
                  className="absolute top-4 right-4 z-[40] bg-white/10 hover:bg-white/20 backdrop-blur-md border border-white/20 p-2.5 rounded-full cursor-pointer text-white transition-all hover:scale-110 active:scale-95 shadow-lg flex items-center justify-center"
                >
                  <Camera size={16} />
                </button>
                <input
                  ref={bannerInputRef}
                  type="file"
                  accept="image/*"
                  className="hidden"
                  onChange={handleBannerUpload}
                  onClick={(e) => { e.stopPropagation(); }}
                />
              </div>

              {/* Avatar Positioning - Subtle thin ring without shadow */}
              <div className="w-full relative z-30 -mt-16 sm:-mt-20 flex justify-center pb-4">
                <div className="relative group/avatar p-1 rounded-full" style={{ backgroundColor: 'var(--bg-primary)', border: '4px solid var(--bg-primary)' }}>
                  <Avatar
                    uid={user?.uid}
                    image={profileData.photoURL}
                    name={profileData.displayName || user?.displayName}
                    email={user?.email}
                    size="3xl"
                    rounded="full"
                    className="w-32 h-32 sm:w-30 sm:h-30"
                    collections={["admins", "users"]}
                    editable
                    onUpload={(url) => setProfileData(p => ({ ...p, photoURL: url }))}
                  />
                </div>
              </div>

              <div className="p-8 space-y-6 flex-1">
                <div className="flex justify-between items-end border-b pb-3" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h3 className="font-extrabold text-xl" style={{ color: 'var(--text-primary)' }}>My profile</h3>
                  <div className="text-[10px] text-right" style={{ color: 'var(--text-muted)' }}>
                    Last Login {user.metadata?.lastSignInTime ? new Date(user.metadata.lastSignInTime).toLocaleDateString() : "N/A"} <br />
                    HOAS Platform
                  </div>
                </div>

                <div className="grid grid-cols-2 gap-4">
                  <Input placeholder="Full Name" value={profileData.displayName} onChange={e => setProfileData({ ...profileData, displayName: e.target.value })} />
                  <Input placeholder="Phone Number" value={profileData.phone} onChange={e => setProfileData({ ...profileData, phone: e.target.value })} />
                </div>
                <Input placeholder="Email Address" value={profileData.email} onChange={e => setProfileData({ ...profileData, email: e.target.value })} type="email" />


              </div>

              <div className="px-8 pb-8 pt-2 flex justify-center">
                <button onClick={handleSave} disabled={isSaving} className="w-2/3 py-3.5 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white font-bold text-lg shadow-lg hover:shadow-orange-500/40 transition hover:-translate-y-0.5 disabled:opacity-50 flex justify-center items-center gap-2 cursor-pointer">
                  {isSaving && <Loader2 size={18} className="animate-spin" />} Save
                </button>
              </div>
              {saveMessage && <p className={`text-center pb-4 text-sm ${saveMessage.includes("success") ? "text-emerald-500" : "text-red-500"}`}>{saveMessage}</p>}
            </div>

            {/* RIGHT COLUMN: Account Status & Actions */}
            <div className="lg:col-span-7 flex flex-col gap-6 lg:gap-8">
              {/* Card 1: Account Status */}
              <div className="rounded-[2rem] shadow-xl p-8 border" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-secondary)' }}>
                <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h3 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>My HOAS account</h3>
                </div>

                <div className="space-y-4">
                  <div className="flex justify-between items-center pb-4">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-emerald-500" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Active account</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Created: {user.metadata?.creationTime ? new Date(user.metadata.creationTime).toLocaleDateString() : "N/A"}</p>
                      </div>
                    </div>
                    <span className="px-5 py-2 rounded-full bg-gradient-to-r from-orange-400 to-pink-500 text-white text-xs font-bold shadow-md">Verified</span>
                  </div>
                </div>
              </div>

              {/* Card 2: Security & Actions */}
              <div className="rounded-[2rem] shadow-xl p-8 border flex-1" style={{ backgroundColor: 'var(--bg-primary)', borderColor: 'var(--border-secondary)' }}>
                <div className="flex justify-between items-center mb-6 border-b pb-4" style={{ borderColor: 'var(--border-secondary)' }}>
                  <h3 className="font-bold text-xl" style={{ color: 'var(--text-primary)' }}>Security Details</h3>
                  <span className="text-xs px-4 py-1.5 rounded-full font-bold" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-muted)' }}>Manage</span>
                </div>

                <div className="space-y-6 mt-4">
                  <div className="flex justify-between items-center pb-6 border-b" style={{ borderColor: 'var(--border-secondary)' }}>
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-amber-500" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>Change Password</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Update your credentials</p>
                      </div>
                    </div>
                    <button onClick={() => setShowPwModal(true)} className="px-5 py-2 rounded-full transition text-xs font-bold cursor-pointer hover:bg-black/5 dark:hover:bg-white/5" style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-primary)' }}>
                      Update
                    </button>
                  </div>

                  <div className="flex justify-between items-center">
                    <div className="flex items-center gap-4">
                      <div className="w-3 h-3 rounded-full bg-indigo-500" />
                      <div>
                        <p className="text-sm font-semibold" style={{ color: 'var(--text-primary)' }}>End Session</p>
                        <p className="text-xs" style={{ color: 'var(--text-muted)' }}>Log out securely</p>
                      </div>
                    </div>
                    <button onClick={handleLogout} className="px-5 py-2 rounded-full text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/20 transition text-xs font-bold cursor-pointer">
                      Log out
                    </button>
                  </div>
                </div>
              </div>

            </div>
          </div>
        </div>
      </main>

      {/* ── Password Change Modal ── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-md" onClick={() => setShowPwModal(false)}>
          <div className="w-full max-w-md mx-4 rounded-3xl p-8 space-y-6 shadow-2xl transition-all"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
            onClick={e => e.stopPropagation()}>

            <div className="flex items-center justify-between pb-2">
              <div>
                <h3 className="font-extrabold text-xl" style={{ color: "var(--text-primary)" }}>Change Password</h3>
                <p className="text-xs mt-1 font-medium" style={{ color: "var(--text-muted)" }}>Ensure your account is using a long, random password to stay secure.</p>
              </div>
              <button onClick={() => setShowPwModal(false)} className="p-2 rounded-xl hover:bg-gray-500/10 cursor-pointer transition-colors -mt-4">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>

            <div className="space-y-4">
              {[
                { key: "current", label: "Current Password", ph: "Enter current password" },
                { key: "newPass", label: "New Password", ph: "Minimum 6 characters" },
                { key: "confirm", label: "Confirm Password", ph: "Re-enter new password" },
              ].map(f => (
                <div key={f.key} className="space-y-1.5 focus-within:transform focus-within:scale-[1.01] transition-transform duration-200">
                  <label className="block text-xs font-bold uppercase tracking-wide" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                  <div className="relative">
                    <input type={showPw[f.key] ? "text" : "password"} value={pwForm[f.key]}
                      onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                      className="w-full py-3.5 px-4 pr-12 rounded-xl border text-sm transition-all duration-200 focus:outline-none focus:ring-2 focus:ring-indigo-500/40 focus:border-indigo-500"
                      style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-primary)", boxShadow: "inset 0 2px 4px rgba(0,0,0,0.02)" }} />
                    <button onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key] }))} className="absolute right-4 top-1/2 -translate-y-1/2 cursor-pointer p-1 rounded-md hover:bg-gray-500/10 transition-colors">
                      {showPw[f.key] ? <EyeOff className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <Eye className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                    </button>
                  </div>
                </div>
              ))}
            </div>

            <div className="pt-2">
              <button onClick={handleChangePw} disabled={changingPw || !pwForm.current || !pwForm.newPass || !pwForm.confirm}
                className="w-full py-3.5 rounded-xl text-white text-sm font-bold bg-gradient-to-r from-indigo-600 to-indigo-500 hover:from-indigo-500 hover:to-indigo-400 disabled:opacity-50 transition-all duration-300 hover:shadow-lg shadow-indigo-500/25 cursor-pointer flex items-center justify-center gap-2">
                {changingPw && <Loader2 className="w-5 h-5 animate-spin" />}
                Update Password
              </button>
            </div>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Small Components ── */

const InfoCard = ({ title, icon, children }) => (
  <div className="rounded-2xl p-6 border transition-all duration-300 hover:shadow-lg hover:-translate-y-1 relative overflow-hidden group" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
    <div className="absolute inset-0 bg-gradient-to-br from-indigo-500/5 to-transparent opacity-0 group-hover:opacity-100 transition-opacity duration-300 pointer-events-none" />
    <h3 className="flex items-center gap-3 text-xs font-bold mb-5 tracking-widest uppercase relative z-10" style={{ color: "var(--text-primary)" }}>
      <span className="p-2.5 rounded-xl bg-indigo-500/10 text-indigo-500 group-hover:scale-110 transition-transform duration-300">{icon}</span>
      {title}
    </h3>
    <div className="relative z-10 space-y-4">
      {children}
    </div>
  </div>
);

const Input = ({ value, onChange, placeholder, type = "text" }) => (
  <div className="focus-within:transform focus-within:scale-[1.02] transition-transform duration-200">
    <input type={type} value={value} onChange={onChange} placeholder={placeholder}
      className="w-full py-2 bg-transparent border-b-2 text-sm font-bold transition-all duration-200 focus:outline-none focus:border-indigo-500"
      style={{ borderColor: "var(--border-secondary)", color: "var(--text-primary)" }} />
  </div>
);

export default OwnerProfile;
