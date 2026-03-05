import { useState, useEffect } from "react";
import { useNavigate, useLocation } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db, auth } from "../../firebase/firebaseConfig";
import { updatePassword, EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";
import Avatar from "./Avatar";
import AnimatedLogoutButton from "../AnimatedLogoutButton";
import {
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  Save,
  ShieldCheck,
  Calendar,
  Key,
  Eye,
  EyeOff,
  Loader2,
  X,
  User,
  BadgeCheck,
} from "lucide-react";
import { HashLoader } from "react-spinners";

const OwnerProfile = () => {
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
  const navigate = useNavigate();
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
          setProfileData({
            displayName: snap.data().displayName || user.displayName || "",
            email: snap.data().email || user.email || "",
            phone: snap.data().phone || "",
            organization: snap.data().organization || "",
            photoURL: snap.data().photoURL || user.photoURL || "",
          });
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

  return (
    <div className="min-h-screen" style={{ backgroundColor: "var(--bg-primary)", color: "var(--text-primary)" }}>
      {/* ── Header ── */}
      <header className="sticky top-0 z-50 backdrop-blur border-b" style={{ backgroundColor: "var(--bg-header)", borderColor: "var(--border-primary)" }}>
        <div className="max-w-5xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => {
                const returnPath = location.state?.returnPath || sessionStorage.getItem("ownerProfileReturnPath") || "/OwnersDashboard";
                navigate(returnPath, { state: location.state || {} });
                sessionStorage.removeItem("ownerProfileReturnPath");
              }}
              className="p-2 rounded-lg border transition hover:scale-105 cursor-pointer"
              style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}
              title="Go back"
            >
              <ArrowLeft size={18} style={{ color: "var(--text-secondary)" }} />
            </button>
            <div>
              <h1 className="text-lg font-semibold" style={{ color: "var(--text-primary)" }}>Owner Profile</h1>
              <p className="text-xs" style={{ color: "var(--text-muted)" }}>HOAS Platform</p>
            </div>
          </div>
          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldCheck size={24} />
            <span className="text-sm font-medium">Verified Admin</span>
          </div>
        </div>
      </header>

      {/* ── Main ── */}
      <main className="max-w-5xl mx-auto px-6 py-8">
        <div className="rounded-2xl border p-6" style={{ backgroundColor: "var(--bg-card)", borderColor: "var(--border-primary)" }}>

          {/* ── Profile Top: Avatar + Info ── */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 border-b pb-6" style={{ borderColor: "var(--border-primary)" }}>
            {/* Avatar with hover upload */}
            <Avatar
              uid={user?.uid}
              image={profileData.photoURL}
              name={profileData.displayName || user?.displayName}
              email={user?.email}
              size="xl"
              rounded="2xl"
              collections={["admins", "users"]}
              editable
              onUpload={(url) => setProfileData(p => ({ ...p, photoURL: url }))}
            />

            <div className="flex-1 min-w-0">
              <h2 className="text-2xl font-bold tracking-tight" style={{ color: "var(--text-primary)" }}>
                {profileData.displayName || "Owner"}
              </h2>
              <div className="flex items-center gap-2 mt-1 flex-wrap">
                <span className="text-sm flex items-center gap-1.5" style={{ color: "var(--text-secondary)" }}>
                  <Mail size={14} /> {profileData.email}
                </span>
                {user?.emailVerified && (
                  <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-full text-[10px] font-bold uppercase tracking-wider bg-emerald-500/15 text-emerald-500 border border-emerald-500/25">
                    <BadgeCheck className="w-3 h-3" /> Verified
                  </span>
                )}
              </div>
              <span className="inline-block mt-2 px-3 py-1 rounded-full text-xs font-semibold bg-indigo-500/15 text-indigo-400 border border-indigo-500/25">
                Owner
              </span>
            </div>
          </div>

          {/* ── Info Grid ── */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-5 mt-6">
            {/* Name */}
            <InfoCard title="Full Name" icon={<User size={18} />}>
              <Input label="Display Name" value={profileData.displayName}
                onChange={e => setProfileData({ ...profileData, displayName: e.target.value })} />
            </InfoCard>

            {/* Contact */}
            <InfoCard title="Contact" icon={<Phone size={18} />}>
              <Input label="Phone Number" value={profileData.phone}
                onChange={e => setProfileData({ ...profileData, phone: e.target.value })} placeholder="+91 XXXXX XXXXX" />
            </InfoCard>

            {/* Account Status */}
            <InfoCard title="Account Status" icon={<ShieldCheck size={18} />}>
              <div className="space-y-2">
                <p className="text-sm flex justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-2"><Calendar size={14} /> Created</span>
                  <span>{new Date(user.metadata.creationTime).toLocaleDateString()}</span>
                </p>
                <p className="text-sm flex justify-between" style={{ color: "var(--text-secondary)" }}>
                  <span className="flex items-center gap-2"><Calendar size={14} /> Last Login</span>
                  <span>{new Date(user.metadata.lastSignInTime).toLocaleDateString()}</span>
                </p>
              </div>
            </InfoCard>

            {/* Change Password Card */}
            <InfoCard title="Security" icon={<Key size={18} />}>
              <button onClick={() => setShowPwModal(true)}
                className="w-full flex items-center gap-3 p-3 rounded-xl border transition hover:border-indigo-500/40 cursor-pointer"
                style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)" }}>
                <div className="w-9 h-9 rounded-lg bg-amber-500/15 flex items-center justify-center">
                  <Key className="w-4 h-4 text-amber-500" />
                </div>
                <div className="text-left">
                  <p className="text-sm font-medium" style={{ color: "var(--text-primary)" }}>Change Password</p>
                  <p className="text-[11px]" style={{ color: "var(--text-muted)" }}>Update your credentials</p>
                </div>
              </button>
            </InfoCard>
          </div>

          {/* ── Actions ── */}
          <div className="flex flex-col md:flex-row justify-end gap-4 mt-8">
            <button onClick={handleSave} disabled={isSaving}
              className="px-6 py-3 rounded-xl bg-indigo-600 hover:bg-indigo-500 text-white flex items-center gap-2 disabled:opacity-50 transition cursor-pointer font-medium">
              {isSaving ? <Loader2 size={18} className="animate-spin" /> : <Save size={18} />}
              Save Changes
            </button>
            <AnimatedLogoutButton onLogout={handleLogout} variant="dark" text="Log Out" />
          </div>

          {saveMessage && (
            <p className={`mt-4 text-sm ${saveMessage.includes("success") ? "text-emerald-400" : "text-red-400"}`}>{saveMessage}</p>
          )}
        </div>
      </main>

      {/* ── Password Change Modal ── */}
      {showPwModal && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-black/60 backdrop-blur-sm" onClick={() => setShowPwModal(false)}>
          <div className="w-full max-w-md mx-4 rounded-2xl p-6 space-y-4 shadow-2xl"
            style={{ backgroundColor: "var(--bg-card)", border: "1px solid var(--border-primary)" }}
            onClick={e => e.stopPropagation()}>
            <div className="flex items-center justify-between">
              <h3 className="font-bold text-lg" style={{ color: "var(--text-primary)" }}>Change Password</h3>
              <button onClick={() => setShowPwModal(false)} className="p-1 rounded-lg hover:bg-gray-500/20 cursor-pointer">
                <X className="w-5 h-5" style={{ color: "var(--text-secondary)" }} />
              </button>
            </div>
            {[
              { key: "current", label: "Current Password", ph: "Enter current password" },
              { key: "newPass", label: "New Password", ph: "Minimum 6 characters" },
              { key: "confirm", label: "Confirm Password", ph: "Re-enter new password" },
            ].map(f => (
              <div key={f.key}>
                <label className="block text-[10px] font-bold mb-1 uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{f.label}</label>
                <div className="relative">
                  <input type={showPw[f.key] ? "text" : "password"} value={pwForm[f.key]}
                    onChange={e => setPwForm(p => ({ ...p, [f.key]: e.target.value }))} placeholder={f.ph}
                    className="w-full py-2.5 px-3 pr-10 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
                    style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }} />
                  <button onClick={() => setShowPw(p => ({ ...p, [f.key]: !p[f.key] }))} className="absolute right-3 top-1/2 -translate-y-1/2 cursor-pointer">
                    {showPw[f.key] ? <EyeOff className="w-4 h-4" style={{ color: "var(--text-muted)" }} /> : <Eye className="w-4 h-4" style={{ color: "var(--text-muted)" }} />}
                  </button>
                </div>
              </div>
            ))}
            <button onClick={handleChangePw} disabled={changingPw || !pwForm.current || !pwForm.newPass || !pwForm.confirm}
              className="w-full py-2.5 rounded-xl text-white text-sm font-semibold bg-indigo-600 hover:bg-indigo-500 disabled:opacity-50 transition cursor-pointer">
              {changingPw && <Loader2 className="w-4 h-4 animate-spin inline mr-2" />}Update Password
            </button>
          </div>
        </div>
      )}
    </div>
  );
};

/* ── Small Components ── */

const InfoCard = ({ title, icon, children }) => (
  <div className="rounded-xl p-5 border" style={{ backgroundColor: "var(--bg-tertiary)", borderColor: "var(--border-primary)" }}>
    <h3 className="flex items-center gap-2 text-sm font-semibold mb-4" style={{ color: "var(--text-primary)" }}>
      <span style={{ color: "var(--text-muted)" }}>{icon}</span>
      {title}
    </h3>
    {children}
  </div>
);

const Input = ({ label, value, onChange, placeholder }) => (
  <div>
    <label className="text-[10px] font-bold uppercase tracking-widest" style={{ color: "var(--text-muted)" }}>{label}</label>
    <input value={value} onChange={onChange} placeholder={placeholder}
      className="mt-1 w-full px-3 py-2.5 rounded-xl border text-sm focus:outline-none focus:ring-2 focus:ring-indigo-500/25"
      style={{ backgroundColor: "var(--bg-primary)", borderColor: "var(--border-primary)", color: "var(--text-primary)" }} />
  </div>
);

export default OwnerProfile;
