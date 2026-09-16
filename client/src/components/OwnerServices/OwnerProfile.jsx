import { useState, useEffect, useRef } from "react";
import { useNavigate, useLocation, useOutletContext } from "react-router-dom";

import {
  updatePassword,
  EmailAuthProvider,
  reauthenticateWithCredential,
} from "firebase/auth";

import { auth } from "../../firebase/firebaseConfig";
import { useAuth } from "../../context/AuthContext";
import { useToast } from "../Toast";
import Avatar from "./Avatar";
import Header from "./header";

import {
  Eye,
  EyeOff,
  Loader2,
  X,
  Camera,
  ShieldCheck,
  Mail,
  Phone,
  Building2,
  CalendarDays,
  Clock3,
  LockKeyhole,
  LogOut,
  CheckCircle2,
  UserRound,
  Pencil,
  Sparkles,
  KeyRound,
  Shield,
} from "lucide-react";

import { HashLoader } from "react-spinners";
import { updateProfile as apiUpdateProfile } from "../../firebase/cloudFunctions";

/* =========================================================
   OWNER PROFILE
========================================================= */

const OwnerProfile = () => {
  const { user, userData, isAdmin, loading, adminChecked, logout } = useAuth();

  const navigate = useNavigate();
  const location = useLocation();
  const context = useOutletContext();
  const toast = useToast();

  const [localIsCollapsed, setLocalIsCollapsed] = useState(false);

  const isCollapsed = context?.isCollapsed ?? localIsCollapsed;

  const setIsCollapsed = context?.setIsCollapsed ?? setLocalIsCollapsed;

  /* =======================================================
     PROFILE
  ======================================================= */

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

  /* =======================================================
     PASSWORD
  ======================================================= */

  const [showPwModal, setShowPwModal] = useState(false);

  const [pwForm, setPwForm] = useState({
    current: "",
    newPass: "",
    confirm: "",
  });

  const [showPw, setShowPw] = useState({
    current: false,
    newPass: false,
    confirm: false,
  });

  const [changingPw, setChangingPw] = useState(false);

  /* =======================================================
     BANNER
  ======================================================= */

  const [showBanner, setShowBanner] = useState(false);

  const [profileBanner, setProfileBanner] = useState(() => {
    try {
      const saved = localStorage.getItem("profileBannerImage");

      const expiry = localStorage.getItem("profileBannerExpiryDate");

      if (saved && expiry && Date.now() < parseInt(expiry, 10)) {
        return saved;
      }
    } catch {
      // Ignore localStorage errors.
    }

    return null;
  });

  const bannerInputRef = useRef(null);

  /* =======================================================
     BANNER EXPIRY
  ======================================================= */

  useEffect(() => {
    try {
      const expiry = localStorage.getItem("profileBannerExpiry");

      if (!expiry || Date.now() > parseInt(expiry, 10)) {
        setShowBanner(true);
      }
    } catch {
      setShowBanner(false);
    }
  }, []);

  const handleDismissBanner = () => {
    setShowBanner(false);

    try {
      localStorage.setItem(
        "profileBannerExpiry",
        Date.now() + 30 * 24 * 60 * 60 * 1000,
      );
    } catch {
      // Ignore.
    }
  };

  /* =======================================================
     BANNER UPLOAD
  ======================================================= */

  const handleBannerUpload = (event) => {
    const file = event.target.files?.[0];

    if (!file) return;

    if (file.size > 2 * 1024 * 1024) {
      toast.error("Banner must be under 2MB");

      event.target.value = "";
      return;
    }

    const reader = new FileReader();

    setIsSaving(true);

    reader.onloadend = () => {
      const base64String = reader.result;

      try {
        setProfileBanner(base64String);

        localStorage.setItem("profileBannerImage", base64String);

        localStorage.setItem(
          "profileBannerExpiryDate",
          (Date.now() + 30 * 24 * 60 * 60 * 1000).toString(),
        );

        toast.success("Profile banner updated ✨");
      } catch (error) {
        console.error("Storage error:", error);

        toast.error("Image is too large for browser storage.");
      } finally {
        setIsSaving(false);
      }
    };

    reader.readAsDataURL(file);

    event.target.value = "";
  };

  /* =======================================================
     AUTH GUARD
  ======================================================= */

  useEffect(() => {
    if (!loading && adminChecked) {
      if (!user || !isAdmin) {
        navigate("/login", { replace: true });
      }
    }
  }, [user, isAdmin, loading, adminChecked, navigate]);

  /* =======================================================
     FETCH PROFILE
  ======================================================= */

  useEffect(() => {
    const fetchProfile = async () => {
      if (!user) return;

      try {
        const data = userData || {};

        setProfileData({
          displayName: data.name || user.displayName || "",

          email: data.email || user.email || "",

          phone: data.phone || "",

          organization: data.address || "",

          photoURL: data.avatarUrl || user.photoURL || "",
        });
      } catch (error) {
        console.error("Profile load error:", error);
      } finally {
        setIsLoading(false);
      }
    };

    if (user && adminChecked) {
      fetchProfile();
    }
  }, [user, userData, adminChecked]);

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      await logout();

      navigate("/login", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  /* =======================================================
     SAVE PROFILE
  ======================================================= */

  const handleSave = async () => {
    if (!user) return;

    setIsSaving(true);
    setSaveMessage("");

    try {
      await apiUpdateProfile({
        name: profileData.displayName,

        phone: profileData.phone,

        avatarUrl: profileData.photoURL || undefined,
      });

      setSaveMessage("Profile updated successfully");

      toast.success("Profile updated");
    } catch (error) {
      console.error("Save error:", error);

      setSaveMessage("Failed to update profile");

      toast.error("Save failed");
    } finally {
      setIsSaving(false);

      setTimeout(() => {
        setSaveMessage("");
      }, 3000);
    }
  };

  /* =======================================================
     CHANGE PASSWORD
  ======================================================= */

  const handleChangePw = async () => {
    if (pwForm.newPass !== pwForm.confirm) {
      toast.error("Passwords do not match");

      return;
    }

    if (pwForm.newPass.length < 6) {
      toast.error("Minimum 6 characters");

      return;
    }

    if (!auth.currentUser) {
      toast.error("Authentication session expired");

      return;
    }

    setChangingPw(true);

    try {
      const credential = EmailAuthProvider.credential(
        user.email,
        pwForm.current,
      );

      await reauthenticateWithCredential(auth.currentUser, credential);

      await updatePassword(auth.currentUser, pwForm.newPass);

      toast.success("Password changed successfully");

      setShowPwModal(false);

      setPwForm({
        current: "",
        newPass: "",
        confirm: "",
      });
    } catch (error) {
      console.error("Password change error:", error);

      toast.error(
        error.code === "auth/wrong-password"
          ? "Current password is incorrect"
          : "Failed to change password",
      );
    } finally {
      setChangingPw(false);
    }
  };

  /* =======================================================
     LOADING
  ======================================================= */

  if (loading || isLoading || !adminChecked) {
    return (
      <div
        className="
          min-h-screen
          flex
          items-center
          justify-center
        "
        style={{
          backgroundColor: "var(--bg-primary)",
        }}
      >
        <HashLoader size={42} color="#6366f1" />
      </div>
    );
  }

  if (!user) return null;

  /* =======================================================
     DERIVED DATA
  ======================================================= */

  const creationDate = user.metadata?.creationTime
    ? new Date(user.metadata.creationTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  const lastLogin = user.metadata?.lastSignInTime
    ? new Date(user.metadata.lastSignInTime).toLocaleDateString(undefined, {
        month: "short",
        day: "numeric",
        year: "numeric",
      })
    : "N/A";

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        pb-10
      "
      style={{
        backgroundColor: "var(--bg-primary)",

        color: "var(--text-primary)",
      }}
    >
      <Header
        title="YOUR PROFILE"
        handleLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      {/* ===================================================
          MAIN
      =================================================== */}

      <main
        className="
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          pt-28
          sm:pt-32
          pb-10
        "
      >
        {/* =================================================
            WELCOME BANNER
        ================================================= */}

        {showBanner && (
          <div
            className="
              mb-6
              rounded-2xl
              border
              overflow-hidden
              relative
              animate-[fadeIn_0.4s_ease-out]
            "
            style={{
              background:
                "linear-gradient(135deg, rgba(99,102,241,.16), rgba(168,85,247,.12))",

              borderColor: "rgba(99,102,241,.2)",
            }}
          >
            <div
              className="
              p-4
              sm:p-5
              flex
              items-start
              gap-4
            "
            >
              <div
                className="
                hidden
                sm:flex
                w-10
                h-10
                rounded-xl
                bg-indigo-500/10
                border
                border-indigo-500/20
                items-center
                justify-center
                flex-shrink-0
              "
              >
                <Sparkles
                  className="
                  w-5
                  h-5
                  text-indigo-400
                "
                />
              </div>

              <div className="flex-1 min-w-0">
                <h3
                  className="
                    text-sm
                    sm:text-base
                    font-bold
                  "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  Welcome to your profile
                </h3>

                <p
                  className="
                    mt-1
                    text-xs
                    sm:text-sm
                    leading-relaxed
                  "
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Keep your personal information up to date for a better HOAS
                  experience.
                </p>
              </div>

              <button
                type="button"
                onClick={handleDismissBanner}
                className="
                  p-2
                  rounded-xl
                  transition
                  hover:bg-black/5
                  dark:hover:bg-white/5
                  flex-shrink-0
                "
              >
                <X
                  className="
                  w-4
                  h-4
                "
                />
              </button>
            </div>
          </div>
        )}

        {/* =================================================
            PROFILE HERO
        ================================================= */}

        <section
          className="
            rounded-3xl
            border
            overflow-hidden
            shadow-sm
          "
          style={{
            backgroundColor: "var(--bg-card)",

            borderColor: "var(--border-primary)",
          }}
        >
          {/* Banner */}

          <div
            className="
              relative
              h-36
              sm:h-48
              lg:h-56
              overflow-hidden
              group
            "
          >
            {profileBanner ? (
              <img
                src={profileBanner}
                alt="Profile banner"
                className="
                  w-full
                  h-full
                  object-cover
                  transition-transform
                  duration-700
                  group-hover:scale-105
                "
              />
            ) : (
              <div
                className="
                  w-full
                  h-full
                "
                style={{
                  background:
                    "linear-gradient(135deg, #312e81 0%, #4f46e5 45%, #7c3aed 100%)",
                }}
              />
            )}

            {/* Gradient */}

            <div
              className="
              absolute
              inset-0
              bg-gradient-to-t
              from-black/45
              via-black/10
              to-transparent
              pointer-events-none
            "
            />

            {/* Change banner */}

            <button
              type="button"
              onClick={() => bannerInputRef.current?.click()}
              className="
                absolute
                top-4
                right-4
                flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                bg-black/25
                hover:bg-black/40
                backdrop-blur-md
                border
                border-white/20
                text-white
                text-xs
                font-semibold
                transition-all
                duration-200
                hover:scale-[1.02]
                active:scale-95
              "
            >
              <Camera
                className="
                w-4
                h-4
              "
              />

              <span
                className="
                hidden
                sm:inline
              "
              >
                Change cover
              </span>
            </button>

            <input
              ref={bannerInputRef}
              type="file"
              accept="image/*"
              className="hidden"
              onChange={handleBannerUpload}
            />
          </div>

          {/* Profile Identity */}

          <div
            className="
            px-5
            sm:px-8
            lg:px-10
            pb-7
          "
          >
            <div
              className="
              flex
              flex-col
              sm:flex-row
              sm:items-end
              gap-5
              -mt-14
              sm:-mt-16
              relative
              z-10
            "
            >
              {/* Avatar */}

              <div
                className="
                  w-fit
                  rounded-full
                  p-1.5
                  shadow-xl
                "
                style={{
                  backgroundColor: "var(--bg-card)",
                }}
              >
                <Avatar
                  uid={user.uid}
                  image={profileData.photoURL}
                  name={profileData.displayName || user.displayName}
                  email={user.email}
                  size="3xl"
                  rounded="full"
                  className="
                    w-24
                    h-24
                    sm:w-32
                    sm:h-32
                  "
                  collections={["admins", "users"]}
                  editable
                  onUpload={(url) =>
                    setProfileData((previous) => ({
                      ...previous,
                      photoURL: url,
                    }))
                  }
                />
              </div>

              {/* Identity */}

              <div
                className="
                flex-1
                min-w-0
                pb-1
              "
              >
                <div
                  className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
                >
                  <h1
                    className="
                      text-2xl
                      sm:text-3xl
                      font-extrabold
                      tracking-tight
                    "
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    {profileData.displayName || "HOAS Owner"}
                  </h1>

                  <span
                    className="
                    inline-flex
                    items-center
                    gap-1
                    px-2
                    py-1
                    rounded-full
                    text-[10px]
                    font-bold
                    bg-emerald-500/10
                    text-emerald-500
                    border
                    border-emerald-500/20
                  "
                  >
                    <CheckCircle2
                      className="
                      w-3
                      h-3
                    "
                    />
                    Verified
                  </span>
                </div>

                <p
                  className="
                    mt-1
                    text-sm
                    flex
                    items-center
                    gap-2
                  "
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  <Mail
                    className="
                    w-3.5
                    h-3.5
                  "
                  />

                  {profileData.email || user.email}
                </p>
              </div>

              {/* Role */}

              <div
                className="
                flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                border
                w-fit
              "
                style={{
                  backgroundColor: "var(--bg-tertiary)",

                  borderColor: "var(--border-primary)",
                }}
              >
                <ShieldCheck
                  className="
                  w-4
                  h-4
                  text-indigo-500
                "
                />

                <div>
                  <p
                    className="
                    text-[9px]
                    uppercase
                    tracking-wider
                    font-bold
                    text-slate-500
                  "
                  >
                    Account
                  </p>

                  <p
                    className="
                    text-xs
                    font-bold
                  "
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    Owner
                  </p>
                </div>
              </div>
            </div>
          </div>
        </section>

        {/* =================================================
            CONTENT GRID
        ================================================= */}

        <div
          className="
          grid
          grid-cols-1
          lg:grid-cols-3
          gap-6
          mt-6
        "
        >
          {/* ===============================================
              PROFILE INFORMATION
          =============================================== */}

          <section
            className="
              lg:col-span-2
              rounded-3xl
              border
              p-5
              sm:p-7
            "
            style={{
              backgroundColor: "var(--bg-card)",

              borderColor: "var(--border-primary)",
            }}
          >
            {/* Header */}

            <div
              className="
              flex
              items-center
              justify-between
              gap-4
              mb-7
            "
            >
              <div>
                <div
                  className="
                  flex
                  items-center
                  gap-2
                "
                >
                  <div
                    className="
                    w-9
                    h-9
                    rounded-xl
                    bg-indigo-500/10
                    flex
                    items-center
                    justify-center
                  "
                  >
                    <UserRound
                      className="
                      w-4
                      h-4
                      text-indigo-500
                    "
                    />
                  </div>

                  <h2
                    className="
                    text-base
                    sm:text-lg
                    font-bold
                  "
                  >
                    Personal information
                  </h2>
                </div>

                <p
                  className="
                  mt-1
                  ml-11
                  text-xs
                  sm:text-sm
                "
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Update the information associated with your account.
                </p>
              </div>

              <Pencil
                className="
                w-4
                h-4
                text-slate-400
              "
              />
            </div>

            {/* Fields */}

            <div
              className="
              grid
              grid-cols-1
              sm:grid-cols-2
              gap-5
            "
            >
              <ProfileField
                label="Full name"
                value={profileData.displayName}
                placeholder="Your full name"
                icon={<UserRound className="w-4 h-4" />}
                onChange={(value) =>
                  setProfileData((previous) => ({
                    ...previous,
                    displayName: value,
                  }))
                }
              />

              <ProfileField
                label="Phone number"
                value={profileData.phone}
                placeholder="Your phone number"
                icon={<Phone className="w-4 h-4" />}
                onChange={(value) =>
                  setProfileData((previous) => ({
                    ...previous,
                    phone: value,
                  }))
                }
              />

              <ProfileField
                label="Email address"
                value={profileData.email}
                placeholder="Email address"
                icon={<Mail className="w-4 h-4" />}
                disabled
              />

              <ProfileField
                label="Organization"
                value={profileData.organization}
                placeholder="Organization"
                icon={<Building2 className="w-4 h-4" />}
                disabled
              />
            </div>

            {/* Save */}

            <div
              className="
              mt-7
              pt-6
              border-t
              flex
              flex-col
              sm:flex-row
              sm:items-center
              justify-between
              gap-4
            "
              style={{
                borderColor: "var(--border-primary)",
              }}
            >
              <div>
                {saveMessage && (
                  <p
                    className={`
                    text-xs
                    font-semibold
                    ${
                      saveMessage.includes("success")
                        ? "text-emerald-500"
                        : "text-red-500"
                    }
                  `}
                  >
                    {saveMessage}
                  </p>
                )}

                {!saveMessage && (
                  <p
                    className="
                    text-xs
                    text-slate-500
                  "
                  >
                    Changes are saved to your HOAS account.
                  </p>
                )}
              </div>

              <button
                type="button"
                onClick={handleSave}
                disabled={isSaving}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-6
                  py-3
                  rounded-xl
                  bg-indigo-600
                  hover:bg-indigo-500
                  text-white
                  text-sm
                  font-bold
                  shadow-lg
                  shadow-indigo-600/20
                  hover:shadow-indigo-600/30
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  active:translate-y-0
                  disabled:opacity-50
                  disabled:pointer-events-none
                "
              >
                {isSaving ? (
                  <>
                    <Loader2
                      className="
                      w-4
                      h-4
                      animate-spin
                    "
                    />
                    Saving...
                  </>
                ) : (
                  "Save changes"
                )}
              </button>
            </div>
          </section>

          {/* ===============================================
              RIGHT SIDEBAR
          =============================================== */}

          <div
            className="
            flex
            flex-col
            gap-6
          "
          >
            {/* ACCOUNT */}

            <section
              className="
                rounded-3xl
                border
                p-5
              "
              style={{
                backgroundColor: "var(--bg-card)",

                borderColor: "var(--border-primary)",
              }}
            >
              <SectionHeading
                icon={
                  <Shield
                    className="
                    w-4
                    h-4
                  "
                  />
                }
                title="Account status"
              />

              <div
                className="
                mt-5
                rounded-2xl
                p-4
                border
                bg-emerald-500/5
                border-emerald-500/10
              "
              >
                <div
                  className="
                  flex
                  items-center
                  justify-between
                  gap-3
                "
                >
                  <div
                    className="
                    flex
                    items-center
                    gap-3
                  "
                  >
                    <div
                      className="
                      w-10
                      h-10
                      rounded-xl
                      bg-emerald-500/10
                      flex
                      items-center
                      justify-center
                    "
                    >
                      <CheckCircle2
                        className="
                        w-5
                        h-5
                        text-emerald-500
                      "
                      />
                    </div>

                    <div>
                      <p
                        className="
                        text-sm
                        font-bold
                      "
                      >
                        Active
                      </p>

                      <p
                        className="
                        text-[11px]
                        text-slate-500
                      "
                      >
                        Account verified
                      </p>
                    </div>
                  </div>

                  <span
                    className="
                    text-[10px]
                    font-bold
                    px-2
                    py-1
                    rounded-full
                    bg-emerald-500/10
                    text-emerald-500
                  "
                  >
                    GOOD
                  </span>
                </div>
              </div>

              <div
                className="
                mt-5
                space-y-4
              "
              >
                <MetaRow
                  icon={<CalendarDays className="w-4 h-4" />}
                  label="Created"
                  value={creationDate}
                />

                <MetaRow
                  icon={<Clock3 className="w-4 h-4" />}
                  label="Last login"
                  value={lastLogin}
                />
              </div>
            </section>

            {/* SECURITY */}

            <section
              className="
                rounded-3xl
                border
                p-5
                flex-1
              "
              style={{
                backgroundColor: "var(--bg-card)",

                borderColor: "var(--border-primary)",
              }}
            >
              <SectionHeading
                icon={
                  <LockKeyhole
                    className="
                    w-4
                    h-4
                  "
                  />
                }
                title="Security"
              />

              <div
                className="
                mt-5
                space-y-2
              "
              >
                <ActionRow
                  icon={
                    <KeyRound
                      className="
                      w-4
                      h-4
                    "
                    />
                  }
                  title="Password"
                  description="Update your account password"
                  button="Update"
                  onClick={() => setShowPwModal(true)}
                />

                <ActionRow
                  danger
                  icon={
                    <LogOut
                      className="
                      w-4
                      h-4
                    "
                    />
                  }
                  title="Sign out"
                  description="End your current session"
                  button="Log out"
                  onClick={handleLogout}
                />
              </div>
            </section>
          </div>
        </div>
      </main>

      {/* ===================================================
          PASSWORD MODAL
      =================================================== */}

      {showPwModal && (
        <PasswordModal
          pwForm={pwForm}
          setPwForm={setPwForm}
          showPw={showPw}
          setShowPw={setShowPw}
          changingPw={changingPw}
          onClose={() => setShowPwModal(false)}
          onSubmit={handleChangePw}
        />
      )}

      {/* ===================================================
          ANIMATION STYLES
      =================================================== */}

      <style>{`
        @keyframes fadeIn {
          from {
            opacity: 0;
            transform: translateY(-8px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }
      `}</style>
    </div>
  );
};

/* =========================================================
   PROFILE FIELD
========================================================= */

const ProfileField = ({
  label,
  value,
  placeholder,
  icon,
  onChange,
  disabled = false,
}) => {
  return (
    <div className="space-y-2">
      <label
        className="
          text-[11px]
          font-bold
          uppercase
          tracking-wider
          text-slate-500
          flex
          items-center
          gap-2
        "
      >
        {icon}

        {label}
      </label>

      <input
        type="text"
        value={value}
        placeholder={placeholder}
        disabled={disabled}
        onChange={(event) => onChange?.(event.target.value)}
        className="
          w-full
          h-12
          px-4
          rounded-xl
          border
          text-sm
          font-medium
          outline-none
          transition-all
          duration-200
          focus:ring-2
          focus:ring-indigo-500/20
          focus:border-indigo-500
          disabled:opacity-60
          disabled:cursor-not-allowed
        "
        style={{
          backgroundColor: "var(--bg-primary)",

          borderColor: "var(--border-primary)",

          color: "var(--text-primary)",
        }}
      />
    </div>
  );
};

/* =========================================================
   SECTION HEADING
========================================================= */

const SectionHeading = ({ icon, title }) => {
  return (
    <div
      className="
      flex
      items-center
      gap-3
    "
    >
      <div
        className="
        w-9
        h-9
        rounded-xl
        bg-indigo-500/10
        text-indigo-500
        flex
        items-center
        justify-center
      "
      >
        {icon}
      </div>

      <h2
        className="
        text-base
        font-bold
      "
      >
        {title}
      </h2>
    </div>
  );
};

/* =========================================================
   META ROW
========================================================= */

const MetaRow = ({ icon, label, value }) => {
  return (
    <div
      className="
      flex
      items-center
      gap-3
    "
    >
      <div
        className="
        w-8
        h-8
        rounded-lg
        bg-white/5
        flex
        items-center
        justify-center
        text-slate-500
      "
      >
        {icon}
      </div>

      <div className="min-w-0">
        <p
          className="
          text-[10px]
          uppercase
          tracking-wider
          font-bold
          text-slate-500
        "
        >
          {label}
        </p>

        <p
          className="
          text-xs
          font-semibold
          mt-0.5
        "
          style={{
            color: "var(--text-primary)",
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
};

/* =========================================================
   ACTION ROW
========================================================= */

const ActionRow = ({
  icon,
  title,
  description,
  button,
  onClick,
  danger = false,
}) => {
  return (
    <div
      className="
      group
      flex
      items-center
      gap-3
      p-3
      rounded-2xl
      border
      transition-all
      duration-200
      hover:-translate-y-0.5
    "
      style={{
        backgroundColor: "var(--bg-primary)",

        borderColor: "var(--border-primary)",
      }}
    >
      <div
        className={`
        w-9
        h-9
        rounded-xl
        flex
        items-center
        justify-center
        flex-shrink-0
        ${
          danger
            ? "bg-red-500/10 text-red-500"
            : "bg-indigo-500/10 text-indigo-500"
        }
      `}
      >
        {icon}
      </div>

      <div
        className="
        flex-1
        min-w-0
      "
      >
        <p
          className="
          text-xs
          font-bold
        "
        >
          {title}
        </p>

        <p
          className="
          text-[10px]
          text-slate-500
          truncate
          mt-0.5
        "
        >
          {description}
        </p>
      </div>

      <button
        type="button"
        onClick={onClick}
        className={`
          flex-shrink-0
          px-3
          py-2
          rounded-lg
          text-[10px]
          font-bold
          transition-all
          duration-200
          active:scale-95
          ${
            danger
              ? "text-red-500 bg-red-500/10 hover:bg-red-500/15"
              : "text-indigo-500 bg-indigo-500/10 hover:bg-indigo-500/15"
          }
        `}
      >
        {button}
      </button>
    </div>
  );
};

/* =========================================================
   PASSWORD MODAL
========================================================= */

const PasswordModal = ({
  pwForm,
  setPwForm,
  showPw,
  setShowPw,
  changingPw,
  onClose,
  onSubmit,
}) => {
  const fields = [
    {
      key: "current",
      label: "Current password",
      placeholder: "Enter current password",
    },
    {
      key: "newPass",
      label: "New password",
      placeholder: "Minimum 6 characters",
    },
    {
      key: "confirm",
      label: "Confirm password",
      placeholder: "Re-enter new password",
    },
  ];

  return (
    <div
      className="
        fixed
        inset-0
        z-[9999]
        flex
        items-center
        justify-center
        p-4
        bg-black/60
        backdrop-blur-md
        animate-[fadeIn_0.2s_ease-out]
      "
      onMouseDown={(event) => {
        if (event.target === event.currentTarget) {
          onClose();
        }
      }}
    >
      <div
        className="
          w-full
          max-w-md
          rounded-3xl
          border
          p-5
          sm:p-7
          shadow-2xl
          animate-[modalIn_0.25s_ease-out]
        "
        style={{
          backgroundColor: "var(--bg-card)",

          borderColor: "var(--border-primary)",
        }}
        onMouseDown={(event) => event.stopPropagation()}
      >
        {/* Header */}

        <div
          className="
          flex
          items-start
          justify-between
          gap-4
        "
        >
          <div
            className="
            flex
            items-start
            gap-3
          "
          >
            <div
              className="
              w-10
              h-10
              rounded-xl
              bg-indigo-500/10
              text-indigo-500
              flex
              items-center
              justify-center
              flex-shrink-0
            "
            >
              <LockKeyhole
                className="
                w-5
                h-5
              "
              />
            </div>

            <div>
              <h2
                className="
                text-lg
                font-extrabold
              "
              >
                Change password
              </h2>

              <p
                className="
                text-xs
                text-slate-500
                mt-1
                leading-relaxed
              "
              >
                Choose a strong password to keep your account secure.
              </p>
            </div>
          </div>

          <button
            type="button"
            onClick={onClose}
            className="
              p-2
              rounded-xl
              text-slate-500
              hover:text-slate-300
              hover:bg-white/5
              transition
            "
          >
            <X
              className="
              w-4
              h-4
            "
            />
          </button>
        </div>

        {/* Fields */}

        <div
          className="
          mt-6
          space-y-4
        "
        >
          {fields.map((field) => (
            <div key={field.key} className="space-y-2">
              <label
                className="
                block
                text-[10px]
                uppercase
                tracking-wider
                font-bold
                text-slate-500
              "
              >
                {field.label}
              </label>

              <div
                className="
                relative
              "
              >
                <input
                  type={showPw[field.key] ? "text" : "password"}
                  value={pwForm[field.key]}
                  onChange={(event) =>
                    setPwForm((previous) => ({
                      ...previous,
                      [field.key]: event.target.value,
                    }))
                  }
                  placeholder={field.placeholder}
                  className="
                    w-full
                    h-12
                    px-4
                    pr-11
                    rounded-xl
                    border
                    text-sm
                    outline-none
                    transition-all
                    focus:ring-2
                    focus:ring-indigo-500/20
                    focus:border-indigo-500
                  "
                  style={{
                    backgroundColor: "var(--bg-primary)",

                    borderColor: "var(--border-primary)",

                    color: "var(--text-primary)",
                  }}
                />

                <button
                  type="button"
                  onClick={() =>
                    setShowPw((previous) => ({
                      ...previous,
                      [field.key]: !previous[field.key],
                    }))
                  }
                  className="
                    absolute
                    right-3
                    top-1/2
                    -translate-y-1/2
                    p-1.5
                    rounded-lg
                    text-slate-500
                    hover:text-slate-300
                    hover:bg-white/5
                    transition
                  "
                >
                  {showPw[field.key] ? (
                    <EyeOff
                      className="
                      w-4
                      h-4
                    "
                    />
                  ) : (
                    <Eye
                      className="
                      w-4
                      h-4
                    "
                    />
                  )}
                </button>
              </div>
            </div>
          ))}
        </div>

        {/* Buttons */}

        <div
          className="
          mt-6
          flex
          flex-col-reverse
          sm:flex-row
          gap-2
        "
        >
          <button
            type="button"
            onClick={onClose}
            className="
              flex-1
              h-11
              rounded-xl
              border
              text-sm
              font-bold
              transition
              hover:bg-white/5
            "
            style={{
              borderColor: "var(--border-primary)",

              color: "var(--text-secondary)",
            }}
          >
            Cancel
          </button>

          <button
            type="button"
            onClick={onSubmit}
            disabled={
              changingPw ||
              !pwForm.current ||
              !pwForm.newPass ||
              !pwForm.confirm
            }
            className="
              flex-1
              h-11
              rounded-xl
              bg-indigo-600
              hover:bg-indigo-500
              text-white
              text-sm
              font-bold
              transition-all
              duration-200
              hover:-translate-y-0.5
              active:translate-y-0
              disabled:opacity-50
              disabled:pointer-events-none
              flex
              items-center
              justify-center
              gap-2
            "
          >
            {changingPw && (
              <Loader2
                className="
                w-4
                h-4
                animate-spin
              "
              />
            )}

            {changingPw ? "Updating..." : "Update password"}
          </button>
        </div>
      </div>

      <style>{`
        @keyframes modalIn {
          from {
            opacity: 0;
            transform: translateY(10px) scale(.98);
          }

          to {
            opacity: 1;
            transform: translateY(0) scale(1);
          }
        }
      `}</style>
    </div>
  );
};

export default OwnerProfile;
