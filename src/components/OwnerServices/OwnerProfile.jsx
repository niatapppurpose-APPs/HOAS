import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import { doc, getDoc, setDoc } from "firebase/firestore";
import { db } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import Avatar from "./Avatar";
import {
  User,
  Mail,
  Phone,
  Building2,
  ArrowLeft,
  Save,
  Loader2,
  ShieldCheck,
  Calendar,
  LogOut,
} from "lucide-react";

const OwnerProfile = () => {
  const { user, isAdmin, loading, adminChecked, logout } = useAuth();
  const navigate = useNavigate();

  const [profileData, setProfileData] = useState({
    displayName: "",
    email: "",
    phone: "",
    organization: "",
  });

  const [isLoading, setIsLoading] = useState(true);
  const [isSaving, setIsSaving] = useState(false);
  const [saveMessage, setSaveMessage] = useState("");

  /* ------------------ AUTH GUARD ------------------ */
  useEffect(() => {
    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        navigate("/admin-login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  /* ------------------ FETCH PROFILE ------------------ */
  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const ref = doc(db, "admins", user.uid);
        const snap = await getDoc(ref);

        if (snap.exists()) {
          setProfileData({
            displayName: snap.data().displayName || user.displayName || "",
            email: snap.data().email || user.email || "",
            phone: snap.data().phone || "",
            organization: snap.data().organization || "",
          });
        } else {
          setProfileData({
            displayName: user.displayName || "",
            email: user.email || "",
            phone: "",
            organization: "",
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

  /* ------------------ LOGOUT ------------------ */
  const handleLogout = async () => {
    try {
      await logout();
      navigate("/admin-login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /* ------------------ SAVE PROFILE ------------------ */
  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      await setDoc(doc(db, "admins", user.uid), {
        ...profileData,
        updatedAt: new Date().toISOString(),
      }, { merge: true });

      setSaveMessage("Profile updated successfully");
    } catch (error) {
      console.error("Save error:", error);
      setSaveMessage("Failed to update profile");
    } finally {
      setIsSaving(false);
      setTimeout(() => setSaveMessage(""), 3000);
    }
  };

  /* ------------------ LOADING ------------------ */
  if (loading || isLoading || !adminChecked) {
    return (
      <div className="min-h-screen bg-slate-950 flex items-center justify-center">
        <Loader2 className="w-8 h-8 animate-spin text-indigo-500" />
      </div>
    );
  }

  return (
    <div className="min-h-screen bg-slate-950 text-slate-100">
      {/* ---------------- HEADER ---------------- */}
      <header className="sticky top-0 z-50 bg-slate-900/80 backdrop-blur border-b border-slate-800">
        <div className="max-w-6xl mx-auto px-6 py-4 flex items-center justify-between">
          <div className="flex items-center gap-3">
            <button
              onClick={() => navigate("/OwnersDashboard")}
              className="p-2 rounded-lg bg-slate-800 hover:bg-slate-700"
            >
              <ArrowLeft size={18} />
            </button>
            <div className="flex items-center justify-between gap-2">
              <h1 className="text-lg font-semibold">Owner Profile</h1>
              <p className="text-lg text-slate-400">
             (HOAS)
              </p>
            </div>
          </div>

          <div className="flex items-center gap-2 text-indigo-400">
            <ShieldCheck size={30} />
            <span className="text-sm font-medium">Verified Admin</span>
          </div>
        </div>
      </header>

      {/* ---------------- MAIN ---------------- */}
      <main className="max-w-6xl mx-auto px-6 py-8">
        <div className="bg-slate-900 rounded-2xl border border-slate-800 p-6">
          {/* PROFILE TOP */}
          <div className="flex flex-col md:flex-row md:items-center gap-6 border-b border-slate-800 pb-6">
            <Avatar 
              image={user?.photoURL} 
              name={profileData.displayName || user?.displayName} 
              size={20}
              rounded="full"
            />

            <div className="flex-1">
              <h2 className="text-2xl font-semibold">
                {profileData.displayName}
              </h2>
              <p className="text-slate-400 flex items-center gap-2 mt-1">
                <Mail size={14} />
                {profileData.email}
              </p>

              <span className="inline-block mt-3 px-3 py-1 rounded-full text-xs bg-indigo-500/10 text-indigo-400">
                Owner
              </span>
            </div>
          </div>

          {/* INFO GRID */}
          <div className="grid grid-cols-1 md:grid-cols-2 gap-6 mt-6">
            {/* CONTACT */}
            <InfoCard title="Contact Details" icon={<Phone size={18} />}>
              <Input
                label="Phone Number"
                value={profileData.phone}
                onChange={(e) =>
                  setProfileData({ ...profileData, phone: e.target.value })
                }
              />
            </InfoCard>

            {/* ORGANIZATION */}
            <InfoCard title="Institution" icon={<Building2 size={18} />}>
              <Input
                label="Organization"
                value={profileData.organization}
                onChange={(e) =>
                  setProfileData({
                    ...profileData,
                    organization: e.target.value,
                  })
                }
              />
            </InfoCard>

            {/* ACCOUNT STATUS */}
            <InfoCard title="Account Status" icon={<ShieldCheck size={18} />}>
              <p className="text-sm text-slate-400 flex justify-between">
                <span className="flex items-center gap-2">
                  <Calendar size={14} /> Created
                </span>
                <span>
                  {new Date(
                    user.metadata.creationTime
                  ).toLocaleDateString()}
                </span>
              </p>
            </InfoCard>
          </div>

          {/* ACTIONS */}
          <div className="flex flex-col md:flex-row justify-end gap-4 mt-8">
            <button
              onClick={handleSave}
              disabled={isSaving}
              className="px-6 py-3 rounded-lg bg-indigo-600 hover:bg-indigo-700 flex items-center gap-2 disabled:opacity-50"
            >
              {isSaving ? (
                <Loader2 size={18} className="animate-spin" />
              ) : (
                <Save size={18} />
              )}
              Save Changes
            </button>

            <button
              onClick={handleLogout}
              className="px-6 py-3 rounded-lg bg-rose-500/10 text-rose-400 hover:bg-rose-500/20 flex items-center gap-2"
            >
              <LogOut size={18} />
              Logout
            </button>
          </div>

          {saveMessage && (
            <p className="mt-4 text-sm text-emerald-400">{saveMessage}</p>
          )}
        </div>
      </main>
    </div>
  );
};

/* ------------------ SMALL COMPONENTS ------------------ */

const InfoCard = ({ title, icon, children }) => (
  <div className="bg-slate-800 rounded-xl p-5 border border-slate-700">
    <h3 className="flex items-center gap-2 text-sm font-medium mb-4">
      {icon}
      {title}
    </h3>
    {children}
  </div>
);

const Input = ({ label, value, onChange }) => (
  <div>
    <label className="text-xs text-slate-400">{label}</label>
    <input
      value={value}
      onChange={onChange}
      className="mt-1 w-full px-3 py-2 rounded-lg bg-slate-900 border border-slate-700 focus:outline-none focus:ring-2 focus:ring-indigo-500"
    />
  </div>
);

export default OwnerProfile;