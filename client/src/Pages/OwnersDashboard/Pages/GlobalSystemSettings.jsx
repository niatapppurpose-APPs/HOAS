import { useState, useEffect, useCallback, useMemo } from "react";

import { useOutletContext, useNavigate } from "react-router-dom";

import { useAuth } from "../../../context/AuthContext";
import { useTheme } from "../../../context/ThemeContext";
import { useToast } from "../../../components/Toast";

import Header from "../../../components/OwnerServices/header";

import * as cloudFunctions from "../../../firebase/cloudFunctions";
import { auth } from "../../../firebase/firebaseConfig";

import { EmailAuthProvider, reauthenticateWithCredential } from "firebase/auth";

import {
  StatusBadge,
  ToggleSwitch,
  RefreshButton,
} from "./components/SettingsComponents";

import AccessLogsModal from "./components/AccessLogsModal";

import { DEFAULT_SETTINGS, roleColor } from "./settingsConstants";
import {
  normalizeSettings,
  denormalizeSettingsForSave,
} from "../../../hooks/useSystemSettings";

import {
  Settings,
  Shield,
  Users,
  AlertTriangle,
  Save,
  RefreshCw,
  Loader2,
  CheckCircle,
  Info,
  Bell,
  FileText,
  BarChart3,
  Layers,
  Clock,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Home,
  Sun,
  Moon,
  Monitor,
  Palette,
  User,
  Mail,
  UserMinus,
  Activity,
  Siren,
  Timer,
  MessageSquare,
  BellRing,
  ShieldCheck,
  Fingerprint,
  Key,
  LogOut,
  Eye,
  EyeOff,
  ScrollText,
  Trash2,
  X,
  ChevronRight,
  Database,
  Lock,
  Zap,
  CircleCheck,
  CircleAlert,
  SlidersHorizontal,
  Megaphone,
  DoorOpen,
  BadgeCheck,
  ClipboardList,
  UtensilsCrossed,
} from "lucide-react";

/* =========================================================
   THEME MODES
========================================================= */

const THEME_MODES = [
  {
    id: "light",
    label: "Light",
    sub: "Bright & clean",
    icon: Sun,
  },
  {
    id: "dark",
    label: "Dark",
    sub: "Easy on eyes",
    icon: Moon,
  },
  {
    id: "system",
    label: "System",
    sub: "Follow device",
    icon: Monitor,
  },
];

/* =========================================================
   SMALL UTILITY
========================================================= */

const SettingInput = ({ value, onChange, suffix, min = 0, max, disabled }) => {
  return (
    <div className="flex items-center gap-2">
      <input
        type="number"
        value={value}
        min={min}
        max={max}
        disabled={disabled}
        onChange={(e) =>
          onChange(
            Math.max(
              min,
              max !== undefined
                ? Math.min(max, Number(e.target.value) || 0)
                : Number(e.target.value) || 0,
            ),
          )
        }
        className="
          w-20
          h-9
          px-2
          rounded-lg
          border
          text-sm
          text-center
          font-semibold
          outline-none
          transition-all
          focus:ring-2
          focus:ring-indigo-500/20
          focus:border-indigo-500
          disabled:opacity-40
        "
        style={{
          backgroundColor: "var(--bg-primary)",
          borderColor: "var(--border-primary)",
          color: "var(--text-primary)",
        }}
      />

      {suffix && (
        <span
          className="
            text-[11px]
            font-semibold
          "
          style={{
            color: "var(--text-muted)",
          }}
        >
          {suffix}
        </span>
      )}
    </div>
  );
};

/* =========================================================
   SECTION CARD
========================================================= */

const SettingsSection = ({
  title,
  description,
  icon: Icon,
  children,
  accent = "indigo",
  status,
  className = "",
  headerAction,
}) => {
  const accentMap = {
    indigo: "text-indigo-500 bg-indigo-500/10",
    blue: "text-blue-500 bg-blue-500/10",
    red: "text-red-500 bg-red-500/10",
    green: "text-emerald-500 bg-emerald-500/10",
    amber: "text-amber-500 bg-amber-500/10",
    purple: "text-purple-500 bg-purple-500/10",
    teal: "text-teal-500 bg-teal-500/10",
    pink: "text-pink-500 bg-pink-500/10",
  };

  return (
    <section
      className={`
        group
        rounded-3xl
        border
        overflow-hidden
        transition-all
        duration-300
        hover:shadow-lg
        hover:shadow-black/5
        ${className}
      `}
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: "var(--border-primary)",
      }}
    >
      {/* Top accent */}
      <div
        className={`
          h-[2px]
          w-full
          opacity-70
          transition-opacity
          group-hover:opacity-100
          bg-${accent}-500
        `}
      />

      <div className="p-5 sm:p-6">
        {/* Header */}

        <div
          className="
            flex
            items-start
            justify-between
            gap-4
            mb-5
          "
        >
          <div
            className="
              flex
              items-start
              gap-3
              min-w-0
            "
          >
            <div
              className={`
                w-10
                h-10
                rounded-xl
                flex
                items-center
                justify-center
                flex-shrink-0
                ${accentMap[accent]}
              `}
            >
              <Icon className="w-5 h-5" />
            </div>

            <div className="min-w-0">
              <div
                className="
                  flex
                  flex-wrap
                  items-center
                  gap-2
                "
              >
                <h2
                  className="
                    text-sm
                    sm:text-base
                    font-extrabold
                    tracking-tight
                  "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  {title}
                </h2>

                {status && <StatusPill status={status} />}
              </div>

              {description && (
                <p
                  className="
                    mt-1
                    text-[11px]
                    sm:text-xs
                    leading-relaxed
                  "
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  {description}
                </p>
              )}
            </div>
          </div>

          {headerAction}
        </div>

        {children}
      </div>
    </section>
  );
};

/* =========================================================
   STATUS PILL
========================================================= */

const StatusPill = ({ status }) => {
  const normalized = String(status).toLowerCase();

  const warning =
    normalized.includes("warning") ||
    normalized.includes("disabled") ||
    normalized.includes("inactive");

  const active =
    normalized.includes("active") ||
    normalized.includes("enabled") ||
    normalized.includes("secured");

  return (
    <span
      className={`
        inline-flex
        items-center
        gap-1
        px-2
        py-0.5
        rounded-full
        text-[9px]
        font-black
        uppercase
        tracking-wider
        ${
          warning
            ? "bg-amber-500/10 text-amber-500"
            : active
              ? "bg-emerald-500/10 text-emerald-500"
              : "bg-slate-500/10 text-slate-500"
        }
      `}
    >
      <span
        className={`
          w-1.5
          h-1.5
          rounded-full
          ${
            warning
              ? "bg-amber-500"
              : active
                ? "bg-emerald-500"
                : "bg-slate-400"
          }
        `}
      />

      {status}
    </span>
  );
};

/* =========================================================
   SETTING ROW
========================================================= */

const SettingItem = ({
  icon: Icon,
  title,
  description,
  children,
  warning = false,
}) => {
  return (
    <div
      className={`
        flex
        items-center
        gap-3
        p-3
        sm:p-3.5
        rounded-2xl
        border
        transition-all
        duration-200
        hover:-translate-y-[1px]
        hover:shadow-sm
        ${warning ? "border-amber-500/20" : ""}
      `}
      style={{
        backgroundColor: "var(--bg-tertiary)",
        borderColor: warning ? undefined : "var(--border-primary)",
      }}
    >
      <div
        className="
          w-9
          h-9
          rounded-xl
          flex
          items-center
          justify-center
          flex-shrink-0
        "
        style={{
          backgroundColor: warning
            ? "rgba(245,158,11,.10)"
            : "var(--bg-primary)",
          color: warning ? "#f59e0b" : "var(--text-secondary)",
        }}
      >
        <Icon className="w-4 h-4" />
      </div>

      <div className="flex-1 min-w-0">
        <div
          className="
            flex
            items-center
            gap-2
          "
        >
          <p
            className="
              text-xs
              sm:text-sm
              font-bold
              truncate
            "
            style={{
              color: "var(--text-primary)",
            }}
          >
            {title}
          </p>

          {warning && (
            <CircleAlert
              className="
                w-3
                h-3
                text-amber-500
                flex-shrink-0
              "
            />
          )}
        </div>

        <p
          className="
            text-[10px]
            sm:text-[11px]
            mt-0.5
            truncate
          "
          style={{
            color: "var(--text-muted)",
          }}
        >
          {description}
        </p>
      </div>

      <div className="flex-shrink-0">{children}</div>
    </div>
  );
};

/* =========================================================
   MAIN PAGE
========================================================= */

const GlobalSystemSettings = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  const { user, logout } = useAuth();

  const {
    theme,
    mode,
    setLightMode,
    setDarkMode,
    setSystemMode,
    isDark,
    isSystemMode,
  } = useTheme();

  const toast = useToast();
  const navigate = useNavigate();

  /* =======================================================
     STATE
  ======================================================= */

  const [loading, setLoading] = useState(false);

  const [initialLoad, setInitialLoad] = useState(true);

  const [loadError, setLoadError] = useState(null);

  const [saving, setSaving] = useState(false);

  const [settings, setSettings] = useState(DEFAULT_SETTINGS);

  const [hasChanges, setHasChanges] = useState(false);

  const [dataSource, setDataSource] = useState("local");

  /* Management users */

  const [mgmtUsers, setMgmtUsers] = useState([]);

  const [mgmtLoading, setMgmtLoading] = useState(true);

  const [busy, setBusy] = useState(null);

  /* Logs */

  const [showLogs, setShowLogs] = useState(false);

  /* Delete */

  const [showDeleteForm, setShowDeleteForm] = useState(false);

  const [deletePw, setDeletePw] = useState("");

  const [deleteEmailChallenge, setDeleteEmailChallenge] = useState("");

  const [isDeletingAccount, setIsDeletingAccount] = useState(false);

  const [showDeletePw, setShowDeletePw] = useState(false);

  /* =======================================================
     LOAD SETTINGS
  ======================================================= */

  const loadData = useCallback(
    async (showLoading = true) => {
      try {
        if (showLoading) {
          setLoading(true);
        }

        setLoadError(null);

        const timeout = (promise, ms = 25000) =>
          Promise.race([
            promise,
            new Promise((_, reject) =>
              setTimeout(() => reject(new Error("Request timed out")), ms),
            ),
          ]);

        const result = await Promise.allSettled([
          timeout(cloudFunctions.getSystemSettings()),
        ]);

        const response = result[0];

        if (response.status === "fulfilled") {
          setSettings((previous) =>
            normalizeSettings({
              ...previous,
              ...(response.value?.settings || {}),
            }),
          );

          setDataSource("server");
        } else {
          setDataSource("local");

          setLoadError(response.reason?.message || "Unable to connect");

          if (!initialLoad) {
            toast.error("Could not reach server — using local settings.");
          }
        }

        setInitialLoad(false);
      } catch (error) {
        console.error("Settings load:", error);

        setDataSource("local");

        setInitialLoad(false);
      } finally {
        setLoading(false);
      }
    },
    [toast, initialLoad],
  );

  /* =======================================================
     LOAD USERS
  ======================================================= */

  const loadUsers = useCallback(async () => {
    setMgmtLoading(true);

    try {
      const result = await cloudFunctions.getAllManagementUsers();

      setMgmtUsers(result?.users || []);
    } catch (error) {
      console.error("Management users:", error);

      setMgmtUsers([]);
    } finally {
      setMgmtLoading(false);
    }
  }, []);

  /* =======================================================
     INITIAL LOAD
  ======================================================= */

  useEffect(() => {
    loadData(false);
    loadUsers();
  }, [loadData, loadUsers]);

  /* =======================================================
     UPDATE
  ======================================================= */

  const update = (changes) => {
    setSettings((previous) => {
      const merged = {
        ...previous,
        ...changes,
        features: {
          ...(previous.features || {}),
          ...((changes.features || {})),
        },
      };
      // Keep flat aliases and nested canonical objects in sync so the
      // SMS (SIM) / Email / Critical / Activity switches always persist.
      if (changes.emailNotifications !== undefined) {
        merged.notifications = { ...(merged.notifications || {}), email: changes.emailNotifications };
      }
      if (changes.smsNotifications !== undefined) {
        merged.notifications = { ...(merged.notifications || {}), sms: changes.smsNotifications };
      }
      if (changes.criticalAlerts !== undefined) {
        merged.notifications = { ...(merged.notifications || {}), criticalAlerts: changes.criticalAlerts };
      }
      if (changes.activityNotifications !== undefined) {
        merged.notifications = { ...(merged.notifications || {}), activity: changes.activityNotifications };
      }
      if (changes.defaultStudentLimit !== undefined) {
        merged.limits = { ...(merged.limits || {}), maxStudentsPerCollege: changes.defaultStudentLimit };
      }
      if (changes.defaultWardenLimit !== undefined) {
        merged.limits = { ...(merged.limits || {}), maxWardensPerCollege: changes.defaultWardenLimit };
      }
      if (changes.defaultHostelLimit !== undefined) {
        merged.limits = { ...(merged.limits || {}), maxHostelsPerCollege: changes.defaultHostelLimit };
      }
      return merged;
    });

    setHasChanges(true);
  };

  /* =======================================================
     SAVE
  ======================================================= */

  const save = async () => {
    if (saving) return;

    setSaving(true);

    try {
      const payload = denormalizeSettingsForSave(settings);
      const result = await cloudFunctions.updateSystemSettings(payload);
      if (result?.settings) {
        setSettings(normalizeSettings(result.settings));
      }

      toast.success("Settings saved successfully");

      setHasChanges(false);
      setDataSource("server");
    } catch (error) {
      console.error("Settings save:", error);

      toast.error("Unable to save settings");
    } finally {
      setSaving(false);
    }
  };

  /* =======================================================
     USER STATUS
  ======================================================= */

  const toggleUser = async (mongoId, status) => {
    // Backend PATCH /api/users/:id/status validates a Mongo ObjectId.
    // Never send Firebase uid here — it always 400s and the button looks dead.
    if (!mongoId || !/^[0-9a-fA-F]{24}$/.test(String(mongoId))) {
      toast.error("Invalid user id — refresh the list and try again");
      return;
    }
    const next = status === "approved" ? "suspended" : "approved";
    const previousUsers = mgmtUsers;
    setBusy(mongoId);

    // Optimistic update so revoke/activate feels instant
    setMgmtUsers((list) =>
      list.map((u) => {
        const key = String(u._id || u.id || "");
        return key === String(mongoId) ? { ...u, status: next } : u;
      }),
    );

    try {
      await cloudFunctions.setUserStatus(mongoId, next);

      toast.success(
        next === "approved" ? "Account activated" : "Access revoked — account suspended",
      );

      await loadUsers();
    } catch (error) {
      console.error("User status:", error);
      // Revert optimistic change
      setMgmtUsers(previousUsers);
      const msg = String(error?.message || "");
      if (msg.includes("403") || msg.toLowerCase().includes("forbidden")) {
        toast.error("Not allowed — owner/admin only");
      } else if (msg.includes("404")) {
        toast.error("User not found — it may have been deleted");
      } else {
        toast.error(error?.message || "Unable to update account");
      }
    } finally {
      setBusy(null);
    }
  };

  /* =======================================================
     LOGOUT
  ======================================================= */

  const handleLogout = async () => {
    try {
      await logout();

      toast.success("Logged out");

      navigate("/", {
        replace: true,
      });
    } catch {
      toast.error("Logout failed");
    }
  };

  /* =======================================================
     DELETE ACCOUNT
  ======================================================= */

  const confirmDeleteAccount = async () => {
    if (!deletePw) {
      toast.error("Password required");
      return;
    }

    if (deleteEmailChallenge !== user.email) {
      toast.error("Email verification does not match");
      return;
    }

    const confirmed = await toast.confirm(
      "CRITICAL: Delete your account permanently? Your hostels and warden data will be lost forever.",
      null,
      {
        confirmText: "DELETE NOW",
        cancelText: "ABORT",
      },
    );

    if (!confirmed) return;

    setIsDeletingAccount(true);

    try {
      if (!user) return;

      const credential = EmailAuthProvider.credential(user.email, deletePw);

      await reauthenticateWithCredential(auth.currentUser, credential);

      await cloudFunctions.deleteUserAccount(user.uid);

      await auth.currentUser.delete();

      toast.success("Account deleted permanently");

      setShowDeleteForm(false);

      setDeletePw("");
      setDeleteEmailChallenge("");

      navigate("/login", {
        replace: true,
      });
    } catch (error) {
      console.error("Delete error:", error);

      let message = "Failed to delete account";

      if (error.code === "auth/wrong-password") {
        message = "Incorrect password";
      }

      if (error.code === "auth/requires-recent-login") {
        message = "Please login again before deleting your account";
      }

      toast.error(message);
    } finally {
      setIsDeletingAccount(false);
    }
  };

  /* =======================================================
     DERIVED
  ======================================================= */

  const securityStatus = useMemo(
    () => (settings.twoFactorEnabled ? "secured" : "warning"),
    [settings.twoFactorEnabled],
  );

  const themeSetters = useMemo(
    () => ({
      light: setLightMode,
      dark: setDarkMode,
      system: setSystemMode,
    }),
    [setLightMode, setDarkMode, setSystemMode],
  );

  /* =======================================================
     HEADER ACTIONS
  ======================================================= */

  const HeaderActions = () => (
    <div
      className="
        flex
        items-center
        gap-2
      "
    >
      {/* Sync status */}

      <div
        className="
          hidden
          sm:flex
          items-center
          gap-1.5
          px-3
          py-2
          rounded-xl
          border
        "
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-primary)",
        }}
      >
        {loading ? (
          <>
            <Loader2
              className="
                w-3.5
                h-3.5
                animate-spin
                text-blue-500
              "
            />

            <span
              className="
              text-[11px]
              font-bold
              text-blue-500
            "
            >
              Syncing
            </span>
          </>
        ) : dataSource === "server" ? (
          <>
            <CircleCheck
              className="
                w-3.5
                h-3.5
                text-emerald-500
              "
            />

            <span
              className="
              text-[11px]
              font-bold
              text-emerald-500
            "
            >
              Synced
            </span>
          </>
        ) : (
          <>
            <CircleAlert
              className="
                w-3.5
                h-3.5
                text-amber-500
              "
            />

            <span
              className="
              text-[11px]
              font-bold
              text-amber-500
            "
            >
              Local
            </span>
          </>
        )}
      </div>

      {/* Refresh */}

      <button
        type="button"
        onClick={() => loadData(true)}
        disabled={loading}
        aria-label="Refresh settings"
        className="
          w-10
          h-10
          rounded-xl
          border
          flex
          items-center
          justify-center
          transition-all
          duration-200
          hover:-translate-y-0.5
          hover:shadow-md
          active:scale-95
          disabled:opacity-50
        "
        style={{
          backgroundColor: "var(--bg-card)",
          borderColor: "var(--border-primary)",
          color: "var(--text-secondary)",
        }}
      >
        <RefreshCw
          className={`
            w-4
            h-4
            ${loading ? "animate-spin" : ""}
          `}
        />
      </button>

      {/* Save */}

      {hasChanges && (
        <button
          type="button"
          onClick={save}
          disabled={saving}
          className="
            h-10
            px-4
            sm:px-5
            rounded-xl
            bg-indigo-600
            hover:bg-indigo-500
            text-white
            flex
            items-center
            justify-center
            gap-2
            text-xs
            sm:text-sm
            font-bold
            shadow-lg
            shadow-indigo-600/20
            transition-all
            duration-200
            hover:-translate-y-0.5
            active:scale-95
            disabled:opacity-50
          "
        >
          {saving ? (
            <Loader2
              className="
                w-4
                h-4
                animate-spin
              "
            />
          ) : (
            <Save
              className="
              w-4
              h-4
            "
            />
          )}

          <span className="hidden sm:inline">
            {saving ? "Saving..." : "Save Changes"}
          </span>

          <span className="sm:hidden">Save</span>
        </button>
      )}
    </div>
  );

  /* =======================================================
     RENDER
  ======================================================= */

  return (
    <div
      className="
        min-h-screen
        pb-28
      "
      style={{
        backgroundColor: "var(--bg-primary)",
      }}
    >
      <Header
        title="SETTINGS"
        handleLogout={handleLogout}
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        headerExtra={<HeaderActions />}
      />

      {/* =================================================
          MAIN
      ================================================= */}

      <main
        className="
          w-full
          max-w-7xl
          mx-auto
          px-4
          sm:px-6
          lg:px-8
          pt-28
          sm:pt-32
          pb-12
        "
      >
        {/* =================================================
            PAGE INTRO
        ================================================= */}

        <div
          className="
            mb-7
            flex
            flex-col
            lg:flex-row
            lg:items-end
            lg:justify-between
            gap-5
          "
        >
          <div>
            <div
              className="
                inline-flex
                items-center
                gap-2
                px-2.5
                py-1.5
                rounded-full
                bg-indigo-500/10
                text-indigo-500
                text-[10px]
                font-black
                uppercase
                tracking-widest
                mb-3
              "
            >
              <SlidersHorizontal
                className="
                w-3
                h-3
              "
              />
              Owner controls
            </div>

            <h1
              className="
                text-2xl
                sm:text-3xl
                lg:text-4xl
                font-black
                tracking-tight
              "
              style={{
                color: "var(--text-primary)",
              }}
            >
              Platform Settings
            </h1>

            <p
              className="
                mt-2
                max-w-2xl
                text-xs
                sm:text-sm
                leading-relaxed
              "
              style={{
                color: "var(--text-muted)",
              }}
            >
              Manage security, users, notifications, complaint workflows, system
              controls, appearance, and platform preferences from one place.
            </p>
          </div>

          {/* Mobile save controls */}

          <div
            className="
            flex
            sm:hidden
            items-center
            justify-between
            gap-3
          "
          >
            <div
              className="
                flex
                items-center
                gap-2
                px-3
                py-2
                rounded-xl
                border
              "
              style={{
                backgroundColor: "var(--bg-card)",
                borderColor: "var(--border-primary)",
              }}
            >
              <span
                className={`
                  w-2
                  h-2
                  rounded-full
                  ${dataSource === "server" ? "bg-emerald-500" : "bg-amber-500"}
                `}
              />

              <span
                className="
                  text-[10px]
                  font-bold
                "
              >
                {dataSource === "server" ? "Synced" : "Local"}
              </span>
            </div>

            {hasChanges && (
              <button
                onClick={save}
                disabled={saving}
                className="
                  flex-1
                  h-10
                  rounded-xl
                  bg-indigo-600
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                "
              >
                {saving ? (
                  <Loader2
                    className="
                    w-4
                    h-4
                    animate-spin
                  "
                  />
                ) : (
                  <Save
                    className="
                    w-4
                    h-4
                  "
                  />
                )}
                Save Changes
              </button>
            )}
          </div>
        </div>

        {/* =================================================
            SERVER ERROR
        ================================================= */}

        {dataSource === "local" && !loading && loadError && (
          <div
            className="
                mb-6
                p-4
                rounded-2xl
                border
                flex
                items-center
                gap-3
              "
            style={{
              backgroundColor: "rgba(245,158,11,.06)",
              borderColor: "rgba(245,158,11,.20)",
            }}
          >
            <div
              className="
                w-9
                h-9
                rounded-xl
                bg-amber-500/10
                flex
                items-center
                justify-center
                flex-shrink-0
              "
            >
              <AlertTriangle
                className="
                  w-4
                  h-4
                  text-amber-500
                "
              />
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
                  text-amber-500
                "
              >
                Server connection unavailable
              </p>

              <p
                className="
                  text-[10px]
                  text-amber-500/70
                  mt-0.5
                  truncate
                "
              >
                {loadError}
              </p>
            </div>

            <button
              onClick={() => loadData(true)}
              className="
                  px-3
                  py-2
                  rounded-xl
                  bg-amber-500
                  hover:bg-amber-600
                  text-white
                  text-[10px]
                  font-bold
                  transition
                "
            >
              Retry
            </button>
          </div>
        )}

        {/* =================================================
            MAINTENANCE
        ================================================= */}

        {settings.maintenanceMode && (
          <div
            className="
              mb-6
              rounded-2xl
              border
              p-4
              flex
              items-center
              gap-3
              animate-[settingsFade_.3s_ease-out]
            "
            style={{
              backgroundColor: "rgba(245,158,11,.07)",
              borderColor: "rgba(245,158,11,.25)",
            }}
          >
            <div
              className="
              w-10
              h-10
              rounded-xl
              bg-amber-500/10
              flex
              items-center
              justify-center
              flex-shrink-0
            "
            >
              <AlertTriangle
                className="
                w-5
                h-5
                text-amber-500
              "
              />
            </div>

            <div>
              <p
                className="
                text-sm
                font-bold
                text-amber-500
              "
              >
                Maintenance Mode is active
              </p>

              <p
                className="
                text-[11px]
                text-amber-500/70
                mt-0.5
              "
              >
                Users may see the maintenance message configured below.
              </p>
            </div>
          </div>
        )}

        {/* =================================================
            TOP GRID
        ================================================= */}

        <div
          className="
            grid
            grid-cols-1
            xl:grid-cols-2
            gap-6
          "
        >
          {/* =================================================
              SECURITY
          ================================================= */}

          <SettingsSection
            title="Security & Platform"
            description="Protect accounts and control authentication behavior."
            icon={ShieldCheck}
            accent="blue"
            status={securityStatus}
          >
            <div className="space-y-2">
              <SettingItem
                icon={Fingerprint}
                title="Two-Factor Authentication"
                description="Add an extra security layer to account logins."
              >
                <ToggleSwitch
                  enabled={settings.twoFactorEnabled ?? false}
                  onChange={(value) =>
                    update({
                      twoFactorEnabled: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={Key}
                title="Force Password Reset"
                description="Require users to create a new password."
                warning={settings.forcePasswordReset}
              >
                <ToggleSwitch
                  enabled={settings.forcePasswordReset ?? false}
                  onChange={(value) =>
                    update({
                      forcePasswordReset: value,
                      ...(value
                        ? {
                            forcePasswordResetEnabledAt:
                              new Date().toISOString(),
                          }
                        : {}),
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={LogOut}
                title="Auto Logout"
                description="Automatically sign out inactive sessions."
                warning={(settings.autoLogoutMinutes ?? 0) > 0}
              >
                <div
                  className="
                  flex
                  items-center
                  gap-2
                "
                >
                  <ToggleSwitch
                    enabled={(settings.autoLogoutMinutes ?? 0) > 0}
                    onChange={(value) =>
                      update({
                        autoLogoutMinutes: value ? 30 : 0,
                      })
                    }
                    disabled={saving}
                  />

                  <SettingInput
                    value={settings.autoLogoutMinutes ?? 0}
                    onChange={(value) =>
                      update({
                        autoLogoutMinutes: value,
                      })
                    }
                    suffix="min"
                    max={1440}
                    disabled={saving || (settings.autoLogoutMinutes ?? 0) === 0}
                  />
                </div>
              </SettingItem>

              <SettingItem
                icon={Activity}
                title="Access Logs"
                description="Review recent administrative activity."
              >
                <button
                  onClick={() => setShowLogs(true)}
                  className="
                    flex
                    items-center
                    gap-1.5
                    px-3
                    py-2
                    rounded-lg
                    border
                    text-[10px]
                    font-bold
                    transition-all
                    hover:bg-indigo-500/10
                    hover:text-indigo-500
                  "
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-secondary)",
                  }}
                >
                  <Eye
                    className="
                    w-3.5
                    h-3.5
                  "
                  />
                  View Logs
                </button>
              </SettingItem>
            </div>

            {/* Security overview */}

            <div
              className="
              mt-4
              grid
              grid-cols-2
              sm:grid-cols-4
              gap-2
            "
            >
              {[
                {
                  label: "2FA",
                  enabled: settings.twoFactorEnabled ?? false,
                  icon: Fingerprint,
                },
                {
                  label: "Reset",
                  enabled: settings.forcePasswordReset ?? false,
                  icon: Key,
                },
                {
                  label: "Auto logout",
                  enabled: (settings.autoLogoutMinutes ?? 0) > 0,
                  icon: LogOut,
                },
                {
                  label: "Logs",
                  enabled: true,
                  icon: ScrollText,
                },
              ].map(({ label, enabled, icon: Icon }) => (
                <div
                  key={label}
                  className="
                      flex
                      items-center
                      gap-2
                      px-2.5
                      py-2
                      rounded-xl
                      border
                    "
                  style={{
                    backgroundColor: "var(--bg-tertiary)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  <Icon
                    className={`
                        w-3.5
                        h-3.5
                        ${enabled ? "text-emerald-500" : "text-slate-400"}
                      `}
                  />

                  <span
                    className="
                        text-[9px]
                        font-bold
                        truncate
                      "
                    style={{
                      color: "var(--text-secondary)",
                    }}
                  >
                    {label}
                  </span>

                  <span
                    className={`
                        ml-auto
                        w-1.5
                        h-1.5
                        rounded-full
                        flex-shrink-0
                        ${enabled ? "bg-emerald-500" : "bg-slate-400"}
                      `}
                  />
                </div>
              ))}
            </div>
          </SettingsSection>

          {/* =================================================
              ROLE & ACCESS
          ================================================= */}

          <SettingsSection
            title="Role & Access"
            description="Manage management accounts and platform access."
            icon={Users}
            accent="amber"
            status="active"
            headerAction={
              <RefreshButton onRefresh={loadUsers} loading={mgmtLoading} />
            }
          >
            {mgmtLoading ? (
              <div
                className="
                h-48
                flex
                items-center
                justify-center
              "
              >
                <Loader2
                  className="
                  w-6
                  h-6
                  animate-spin
                  text-indigo-500
                "
                />
              </div>
            ) : mgmtUsers.length === 0 ? (
              <div
                className="
                  h-48
                  rounded-2xl
                  flex
                  flex-col
                  items-center
                  justify-center
                  border
                  border-dashed
                "
                style={{
                  backgroundColor: "var(--bg-tertiary)",
                  borderColor: "var(--border-primary)",
                }}
              >
                <Users
                  className="
                  w-8
                  h-8
                  mb-2
                  opacity-40
                "
                />

                <p
                  className="
                  text-sm
                  font-bold
                "
                >
                  No management users
                </p>

                <p
                  className="
                  text-[10px]
                  text-slate-500
                  mt-1
                "
                >
                  Management accounts will appear here.
                </p>
              </div>
            ) : (
              <div
                className="
                space-y-2
                max-h-[330px]
                overflow-y-auto
                pr-1
                settings-scroll
              "
              >
                {mgmtUsers.map((managementUser) => {
                  // Mongo _id is the only id the status API accepts.
                  // uid is the Firebase id and will 400 if sent.
                  const id = managementUser._id || managementUser.id;

                  const approved = managementUser.status === "approved";

                  return (
                    <div
                      key={id}
                      className="
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
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      {/* Avatar */}

                      <div
                        className="
                            w-10
                            h-10
                            rounded-xl
                            overflow-hidden
                            flex-shrink-0
                            border
                          "
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          borderColor: "var(--border-primary)",
                        }}
                      >
                        {managementUser.photoURL ? (
                          <img
                            src={managementUser.photoURL}
                            alt=""
                            className="
                                w-full
                                h-full
                                object-cover
                              "
                          />
                        ) : (
                          <div
                            className="
                              w-full
                              h-full
                              flex
                              items-center
                              justify-center
                            "
                          >
                            <User
                              className="
                                w-4
                                h-4
                                text-slate-500
                              "
                            />
                          </div>
                        )}
                      </div>

                      {/* Info */}

                      <div
                        className="
                          flex-1
                          min-w-0
                        "
                      >
                        <p
                          className="
                              text-xs
                              sm:text-sm
                              font-bold
                              truncate
                            "
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {managementUser.displayName ||
                            managementUser.email ||
                            "Unknown"}
                        </p>

                        <div
                          className="
                            flex
                            items-center
                            gap-2
                            mt-1
                          "
                        >
                          <span
                            className="
                              text-[10px]
                              text-slate-500
                              truncate
                            "
                          >
                            {managementUser.email}
                          </span>

                          <span
                            className="
                                hidden
                                sm:inline-flex
                                px-1.5
                                py-0.5
                                rounded-md
                                text-[8px]
                                font-black
                                uppercase
                              "
                            style={{
                              backgroundColor:
                                roleColor(managementUser.role) + "18",
                              color: roleColor(managementUser.role),
                            }}
                          >
                            {managementUser.role || "N/A"}
                          </span>
                        </div>
                      </div>

                      {/* Status */}

                      <div
                        className="
                          flex
                          items-center
                          gap-2
                        "
                      >
                        <StatusBadge status={approved ? "active" : "warning"} />

                        <button
                          onClick={() => toggleUser(id, managementUser.status)}
                          disabled={busy === id || !id}
                          className="
                              w-8
                              h-8
                              rounded-lg
                              flex
                              items-center
                              justify-center
                              transition
                              hover:bg-white/5
                              disabled:opacity-40
                            "
                          title={approved ? "Revoke access (suspend)" : "Restore access (approve)"}
                        >
                          {busy === id ? (
                            <Loader2
                              className="
                                w-4
                                h-4
                                animate-spin
                                text-indigo-500
                              "
                            />
                          ) : approved ? (
                            <UserMinus
                              className="
                                w-4
                                h-4
                                text-red-400
                              "
                            />
                          ) : (
                            <UserCheck
                              className="
                                w-4
                                h-4
                                text-emerald-400
                              "
                            />
                          )}
                        </button>
                      </div>
                    </div>
                  );
                })}
              </div>
            )}
          </SettingsSection>

          {/* =================================================
              COMPLAINTS
          ================================================= */}

          <SettingsSection
            title="Complaint & Escalation"
            description="Control complaint resolution times and escalation workflows."
            icon={Siren}
            accent="red"
            status={settings.autoEscalation ? "enabled" : "disabled"}
          >
            <div className="space-y-2">
              <SettingItem
                icon={Timer}
                title="Complaint SLA"
                description="Default resolution time for complaints."
              >
                <SettingInput
                  value={settings.complaintSlaHours || 48}
                  onChange={(value) =>
                    update({
                      complaintSlaHours: value,
                    })
                  }
                  suffix="hrs"
                  min={1}
                  max={720}
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={Siren}
                title="Automatic Escalation"
                description="Escalate unresolved complaints automatically."
              >
                <ToggleSwitch
                  enabled={settings.autoEscalation ?? true}
                  onChange={(value) =>
                    update({
                      autoEscalation: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={ArrowRight}
                title="Escalate to Owner"
                description="Send final escalation to the Owner."
                warning={settings.escalateToOwner}
              >
                <ToggleSwitch
                  enabled={settings.escalateToOwner ?? false}
                  onChange={(value) =>
                    update({
                      escalateToOwner: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={Clock}
                title="Overdue Threshold"
                description="Mark complaints overdue after this duration."
              >
                <SettingInput
                  value={settings.overdueThresholdHours || 72}
                  onChange={(value) =>
                    update({
                      overdueThresholdHours: value,
                    })
                  }
                  suffix="hrs"
                  min={1}
                  max={720}
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={MessageSquare}
                title="SMS Escalation Alerts"
                description="Send an SMS when a complaint escalates."
              >
                <ToggleSwitch
                  enabled={settings.smsEscalationAlerts ?? false}
                  onChange={(value) =>
                    update({
                      smsEscalationAlerts: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={Mail}
                title="Email Escalation Alerts"
                description="Send an email when a complaint escalates."
              >
                <ToggleSwitch
                  enabled={settings.emailEscalationAlerts ?? true}
                  onChange={(value) =>
                    update({
                      emailEscalationAlerts: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>
            </div>
          </SettingsSection>

          {/* =================================================
              NOTIFICATIONS
          ================================================= */}

          <SettingsSection
            title="Notifications"
            description="Choose how important HOAS events reach administrators."
            icon={Bell}
            accent="green"
            status={settings.emailNotifications ? "active" : "inactive"}
          >
            <div className="space-y-2">
              <SettingItem
                icon={Mail}
                title="Email Notifications"
                description="Receive important platform updates by email."
              >
                <ToggleSwitch
                  enabled={settings.emailNotifications ?? true}
                  onChange={(value) =>
                    update({
                      emailNotifications: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={MessageSquare}
                title="SMS Notifications"
                description="Receive critical alerts through SMS."
              >
                <ToggleSwitch
                  enabled={settings.smsNotifications ?? false}
                  onChange={(value) =>
                    update({
                      smsNotifications: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={BellRing}
                title="Critical Alerts"
                description="Keep high-priority system warnings enabled."
                warning={!(settings.criticalAlerts ?? true)}
              >
                <ToggleSwitch
                  enabled={settings.criticalAlerts ?? true}
                  onChange={(value) =>
                    update({
                      criticalAlerts: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>

              <SettingItem
                icon={Activity}
                title="Activity Notifications"
                description="Notify about logins, registrations and events."
              >
                <ToggleSwitch
                  enabled={settings.activityNotifications ?? true}
                  onChange={(value) =>
                    update({
                      activityNotifications: value,
                    })
                  }
                  disabled={saving}
                />
              </SettingItem>
            </div>
          </SettingsSection>
        </div>

        {/* =================================================
            SYSTEM CONTROLS — FULL WIDTH
        ================================================= */}

        <div className="mt-6">
          <SettingsSection
            title="System Controls"
            description="Configure registration, approval workflows, maintenance, feature flags and platform limits."
            icon={Settings}
            accent="teal"
            status={settings.maintenanceMode ? "warning" : "active"}
          >
            {/* Main controls */}

            <div
              className="
              grid
              grid-cols-1
              lg:grid-cols-3
              gap-3
            "
            >
              {[
                {
                  key: "registrationEnabled",
                  title: "User Registration",
                  description: "Allow new users to register.",
                  icon: UserCheck,
                  warning: !settings.registrationEnabled,
                },
                {
                  key: "approvalsEnabled",
                  title: "Approval Workflows",
                  description: "Enable account approval workflows.",
                  icon: CheckCircle,
                },
                {
                  key: "maintenanceMode",
                  title: "Maintenance Mode",
                  description: "Temporarily place the platform in maintenance.",
                  icon: AlertTriangle,
                  warning: settings.maintenanceMode,
                },
              ].map(({ key, title, description, icon, warning }) => (
                <SettingItem
                  key={key}
                  icon={icon}
                  title={title}
                  description={description}
                  warning={warning}
                >
                  <ToggleSwitch
                    enabled={settings[key] ?? false}
                    onChange={(value) =>
                      update({
                        [key]: value,
                      })
                    }
                    disabled={saving}
                  />
                </SettingItem>
              ))}
            </div>

            {/* Maintenance message */}

            {settings.maintenanceMode && (
              <div
                className="
                  mt-4
                  p-4
                  rounded-2xl
                  border
                  animate-[settingsFade_.25s_ease-out]
                "
                style={{
                  backgroundColor: "rgba(245,158,11,.05)",
                  borderColor: "rgba(245,158,11,.22)",
                }}
              >
                <div
                  className="
                  flex
                  items-center
                  gap-2
                  mb-2
                "
                >
                  <AlertTriangle
                    className="
                    w-4
                    h-4
                    text-amber-500
                  "
                  />

                  <label
                    className="
                    text-[10px]
                    font-black
                    uppercase
                    tracking-widest
                    text-amber-500
                  "
                  >
                    Maintenance Message
                  </label>
                </div>

                <textarea
                  value={settings.maintenanceMessage || ""}
                  onChange={(e) =>
                    update({
                      maintenanceMessage: e.target.value,
                    })
                  }
                  rows={3}
                  disabled={saving}
                  placeholder="Message shown to users during maintenance..."
                  className="
                    w-full
                    rounded-xl
                    border
                    p-3
                    text-sm
                    resize-none
                    outline-none
                    transition
                    focus:ring-2
                    focus:ring-amber-500/20
                  "
                  style={{
                    backgroundColor: "var(--bg-primary)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                />
              </div>
            )}

            {/* Feature flags */}

            <div className="mt-6">
              <div
                className="
                flex
                items-center
                gap-2
                mb-3
              "
              >
                <Zap
                  className="
                  w-4
                  h-4
                  text-indigo-500
                "
                />

                <h3
                  className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                "
                >
                  Feature Flags
                </h3>
              </div>

              <div
                className="
                grid
                grid-cols-1
                sm:grid-cols-2
                lg:grid-cols-4
                gap-3
              "
              >
                {[
                  {
                    key: "notifications",
                    title: "Notifications",
                    desc: "In-app + push notification center.",
                    icon: Bell,
                  },
                  {
                    key: "reports",
                    title: "Reports",
                    desc: "PDF/Excel downloads & report boards.",
                    icon: FileText,
                  },
                  {
                    key: "analytics",
                    title: "Analytics",
                    desc: "Charts, trends & insights pages.",
                    icon: BarChart3,
                  },
                  {
                    key: "bulkOperations",
                    title: "Bulk Operations",
                    desc: "Bulk student upload & bulk approvals.",
                    icon: Layers,
                  },
                  {
                    key: "outings",
                    title: "Outings",
                    desc: "Student outing requests & approvals.",
                    icon: DoorOpen,
                  },
                  {
                    key: "announcements",
                    title: "Announcements",
                    desc: "Publish & scheduled announcements.",
                    icon: Megaphone,
                  },
                  {
                    key: "feesAutoVerify",
                    title: "Fee Auto-Verify",
                    desc: "Auto-verify fees after 24 hours.",
                    icon: BadgeCheck,
                  },
                  {
                    key: "visitors",
                    title: "Visitor Management",
                    desc: "Gate register, approvals & check-out.",
                    icon: ClipboardList,
                  },
                  {
                    key: "messMenu",
                    title: "Mess Menu",
                    desc: "Weekly mess menu & meal ratings.",
                    icon: UtensilsCrossed,
                  },
                ].map(({ key, title, desc, icon: Icon }) => {
                  const enabled = settings.features?.[key] !== false;

                  return (
                    <div
                      key={key}
                      className="
                          flex
                          items-center
                          justify-between
                          gap-3
                          p-3.5
                          rounded-2xl
                          border
                          transition-all
                          hover:-translate-y-0.5
                        "
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div
                        className="
                          flex
                          items-center
                          gap-3
                          min-w-0
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
                            flex-shrink-0
                          "
                        >
                          <Icon
                            className="
                              w-4
                              h-4
                            "
                          />
                        </div>

                        <div className="min-w-0">
                          <p
                            className="
                              text-xs
                              font-bold
                              truncate
                            "
                          >
                            {title}
                          </p>

                          <p
                              className="
                              text-[9px]
                              text-slate-500
                              mt-0.5
                              truncate
                            "
                            title={desc}
                          >
                            {enabled ? "Enabled" : "Disabled"} · {desc}
                          </p>
                        </div>
                      </div>

                      <ToggleSwitch
                        enabled={enabled}
                        onChange={(value) =>
                          update({
                            features: {
                              ...settings.features,
                              [key]: value,
                            },
                          })
                        }
                        disabled={saving}
                      />
                    </div>
                  );
                })}
              </div>
            </div>

            {/* Limits */}

            <div className="mt-6">
              <div
                className="
                flex
                items-center
                gap-2
                mb-3
              "
              >
                <Database
                  className="
                  w-4
                  h-4
                  text-teal-500
                "
                />

                <h3
                  className="
                  text-xs
                  font-black
                  uppercase
                  tracking-widest
                "
                >
                  Default Limits
                </h3>
              </div>

              <div
                className="
                grid
                grid-cols-1
                md:grid-cols-3
                gap-3
              "
              >
                {[
                  {
                    key: "defaultStudentLimit",
                    title: "Student Limit",
                    description: "Maximum students per hostel.",
                    icon: GraduationCap,
                    max: 10000,
                  },
                  {
                    key: "defaultWardenLimit",
                    title: "Warden Limit",
                    description: "Maximum wardens per hostel.",
                    icon: Shield,
                    max: 100,
                  },
                  {
                    key: "defaultHostelLimit",
                    title: "Hostel Limit",
                    description: "Maximum hostels per college.",
                    icon: Home,
                    max: 500,
                  },
                ].map(({ key, title, description, icon, max }) => (
                  <SettingItem
                    key={key}
                    icon={icon}
                    title={title}
                    description={description}
                  >
                    <SettingInput
                      value={settings[key] || 0}
                      onChange={(value) =>
                        update({
                          [key]: value,
                        })
                      }
                      min={0}
                      max={max}
                      disabled={saving}
                    />
                  </SettingItem>
                ))}
              </div>
            </div>
          </SettingsSection>
        </div>

        {/* =================================================
            APPEARANCE — FULL WIDTH
        ================================================= */}

        <div className="mt-6">
          <SettingsSection
            title="Appearance"
            description="Customize how the Owner dashboard looks on your device."
            icon={Palette}
            accent="pink"
          >
            <div
              className="
              grid
              grid-cols-1
              md:grid-cols-3
              gap-4
            "
            >
              {THEME_MODES.map(({ id, label, sub, icon: Icon }) => {
                const selected = mode === id;

                return (
                  <button
                    key={id}
                    type="button"
                    onClick={() => themeSetters[id]?.()}
                    className={`
                        relative
                        overflow-hidden
                        p-5
                        rounded-2xl
                        border-2
                        text-left
                        transition-all
                        duration-300
                        hover:-translate-y-1
                        ${
                          selected
                            ? "border-indigo-500 shadow-xl shadow-indigo-500/15"
                            : ""
                        }
                      `}
                    style={{
                      backgroundColor: selected
                        ? "#6366f1"
                        : "var(--bg-tertiary)",

                      borderColor: selected
                        ? "#6366f1"
                        : "var(--border-primary)",
                    }}
                  >
                    {selected && (
                      <div
                        className="
                          absolute
                          top-3
                          right-3
                        "
                      >
                        <CheckCircle
                          className="
                            w-5
                            h-5
                            text-white
                          "
                        />
                      </div>
                    )}

                    <div
                      className={`
                          w-11
                          h-11
                          rounded-xl
                          flex
                          items-center
                          justify-center
                          mb-5
                          ${
                            selected
                              ? "bg-white/15 text-white"
                              : "bg-indigo-500/10 text-indigo-500"
                          }
                        `}
                    >
                      <Icon
                        className="
                          w-5
                          h-5
                        "
                      />
                    </div>

                    <p
                      className="
                          text-sm
                          font-black
                        "
                      style={{
                        color: selected ? "#fff" : "var(--text-primary)",
                      }}
                    >
                      {label}
                    </p>

                    <p
                      className="
                          text-[10px]
                          mt-1
                        "
                      style={{
                        color: selected
                          ? "rgba(255,255,255,.7)"
                          : "var(--text-muted)",
                      }}
                    >
                      {sub}
                    </p>
                  </button>
                );
              })}
            </div>

            {/* Current theme */}

            <div
              className="
              mt-4
              flex
              flex-col
              sm:flex-row
              sm:items-center
              sm:justify-between
              gap-4
              p-4
              rounded-2xl
              border
            "
              style={{
                backgroundColor: "var(--bg-tertiary)",
                borderColor: "var(--border-primary)",
              }}
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
                  w-9
                  h-9
                  rounded-xl
                  bg-indigo-500/10
                  flex
                  items-center
                  justify-center
                "
                >
                  {isDark ? (
                    <Moon
                      className="
                      w-4
                      h-4
                      text-indigo-500
                    "
                    />
                  ) : (
                    <Sun
                      className="
                      w-4
                      h-4
                      text-indigo-500
                    "
                    />
                  )}
                </div>

                <div>
                  <p
                    className="
                    text-xs
                    font-bold
                  "
                  >
                    Current theme
                  </p>

                  <p
                    className="
                    text-[10px]
                    text-slate-500
                    mt-0.5
                  "
                  >
                    Using <strong>{theme}</strong>
                    {isSystemMode && " • follows system"}
                  </p>
                </div>
              </div>

              <button
                type="button"
                onClick={() =>
                  navigate("/OwnersDashboard", {
                    state: {
                      startTour: true,
                    },
                  })
                }
                className="
                  flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  border
                  text-xs
                  font-bold
                  transition-all
                  hover:-translate-y-0.5
                  hover:bg-indigo-500/10
                  hover:text-indigo-500
                "
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                <Layers
                  className="
                  w-4
                  h-4
                  text-indigo-500
                "
                />
                Restart Dashboard Tour
                <ChevronRight
                  className="
                  w-3.5
                  h-3.5
                "
                />
              </button>
            </div>
          </SettingsSection>
        </div>

        {/* =================================================
            DANGER ZONE
        ================================================= */}

        <div className="mt-6">
          <SettingsSection
            title="Danger Zone"
            description="Permanent and irreversible account actions."
            icon={AlertTriangle}
            accent="red"
            status="warning"
          >
            {!showDeleteForm ? (
              <div
                className="
                  p-5
                  rounded-2xl
                  border
                  flex
                  flex-col
                  sm:flex-row
                  sm:items-center
                  sm:justify-between
                  gap-4
                "
                style={{
                  backgroundColor: "rgba(239,68,68,.04)",
                  borderColor: "rgba(239,68,68,.20)",
                }}
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
                    bg-red-500/10
                    flex
                    items-center
                    justify-center
                    flex-shrink-0
                  "
                  >
                    <Trash2
                      className="
                      w-5
                      h-5
                      text-red-500
                    "
                    />
                  </div>

                  <div>
                    <p
                      className="
                      text-sm
                      font-black
                      text-red-500
                    "
                    >
                      Delete Account
                    </p>

                    <p
                      className="
                      text-[10px]
                      sm:text-xs
                      text-slate-500
                      mt-1
                      max-w-xl
                    "
                    >
                      Permanently delete your account and associated platform
                      data. This action cannot be undone.
                    </p>
                  </div>
                </div>

                <button
                  type="button"
                  onClick={() => setShowDeleteForm(true)}
                  className="
                    w-full
                    sm:w-auto
                    px-5
                    py-2.5
                    rounded-xl
                    border
                    border-red-500/30
                    bg-red-500/10
                    text-red-500
                    hover:bg-red-500
                    hover:text-white
                    text-xs
                    font-black
                    transition-all
                    duration-200
                    hover:-translate-y-0.5
                  "
                >
                  Delete Account
                </button>
              </div>
            ) : (
              <div
                className="
                  rounded-2xl
                  border-2
                  p-5
                  sm:p-6
                  animate-[settingsFade_.25s_ease-out]
                "
                style={{
                  backgroundColor: "rgba(239,68,68,.03)",
                  borderColor: "rgba(239,68,68,.22)",
                }}
              >
                {/* Warning */}

                <div
                  className="
                  flex
                  items-start
                  justify-between
                  gap-4
                  mb-6
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
                      bg-red-500/10
                      flex
                      items-center
                      justify-center
                      flex-shrink-0
                    "
                    >
                      <Lock
                        className="
                        w-5
                        h-5
                        text-red-500
                      "
                      />
                    </div>

                    <div>
                      <h3
                        className="
                        text-sm
                        font-black
                        text-red-500
                      "
                      >
                        Verify your identity
                      </h3>

                      <p
                        className="
                        text-[10px]
                        text-slate-500
                        mt-1
                      "
                      >
                        Enter your account email and password to continue.
                      </p>
                    </div>
                  </div>

                  <button
                    type="button"
                    onClick={() => {
                      setShowDeleteForm(false);
                      setDeletePw("");
                      setDeleteEmailChallenge("");
                    }}
                    className="
                      p-2
                      rounded-lg
                      text-slate-500
                      hover:text-red-500
                      hover:bg-red-500/5
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

                <div
                  className="
                  grid
                  grid-cols-1
                  md:grid-cols-2
                  gap-4
                "
                >
                  {/* Email */}

                  <div>
                    <label
                      className="
                      block
                      text-[9px]
                      font-black
                      uppercase
                      tracking-widest
                      text-slate-500
                      mb-2
                    "
                    >
                      Account Email
                    </label>

                    <input
                      type="text"
                      value={deleteEmailChallenge}
                      onChange={(e) => setDeleteEmailChallenge(e.target.value)}
                      placeholder={user?.email}
                      className="
                        w-full
                        h-11
                        px-4
                        rounded-xl
                        border
                        text-sm
                        outline-none
                        focus:ring-2
                        focus:ring-red-500/15
                        focus:border-red-500/40
                      "
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                  </div>

                  {/* Password */}

                  <div>
                    <label
                      className="
                      block
                      text-[9px]
                      font-black
                      uppercase
                      tracking-widest
                      text-slate-500
                      mb-2
                    "
                    >
                      Password
                    </label>

                    <div
                      className="
                      relative
                    "
                    >
                      <input
                        type={showDeletePw ? "text" : "password"}
                        value={deletePw}
                        onChange={(e) => setDeletePw(e.target.value)}
                        placeholder="••••••••"
                        className="
                          w-full
                          h-11
                          px-4
                          pr-11
                          rounded-xl
                          border
                          text-sm
                          outline-none
                          focus:ring-2
                          focus:ring-red-500/15
                          focus:border-red-500/40
                        "
                        style={{
                          backgroundColor: "var(--bg-primary)",
                          borderColor: "var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      />

                      <button
                        type="button"
                        onClick={() => setShowDeletePw((value) => !value)}
                        className="
                          absolute
                          right-3
                          top-1/2
                          -translate-y-1/2
                          p-1
                          text-slate-500
                          hover:text-red-500
                        "
                      >
                        {showDeletePw ? (
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
                </div>

                {/* Delete button */}

                <button
                  type="button"
                  onClick={confirmDeleteAccount}
                  disabled={
                    isDeletingAccount ||
                    !deletePw ||
                    deleteEmailChallenge !== user?.email
                  }
                  className="
                    w-full
                    mt-5
                    h-12
                    rounded-xl
                    bg-red-600
                    hover:bg-red-700
                    text-white
                    text-xs
                    font-black
                    uppercase
                    tracking-widest
                    flex
                    items-center
                    justify-center
                    gap-2
                    shadow-lg
                    shadow-red-500/20
                    transition-all
                    hover:-translate-y-0.5
                    active:scale-[.99]
                    disabled:opacity-30
                    disabled:pointer-events-none
                  "
                >
                  {isDeletingAccount ? (
                    <>
                      <Loader2
                        className="
                        w-4
                        h-4
                        animate-spin
                      "
                      />
                      Deleting...
                    </>
                  ) : (
                    <>
                      <Trash2
                        className="
                        w-4
                        h-4
                      "
                      />
                      Permanently Delete Account
                    </>
                  )}
                </button>

                <p
                  className="
                  text-[9px]
                  text-center
                  text-slate-500
                  mt-3
                "
                >
                  This action permanently removes your account and cannot be
                  reversed.
                </p>
              </div>
            )}
          </SettingsSection>
        </div>

        {/* =================================================
            INFO FOOTER
        ================================================= */}

        <div
          className="
            mt-6
            p-4
            sm:p-5
            rounded-2xl
            border
            flex
            items-start
            gap-3
          "
          style={{
            backgroundColor: "var(--bg-card)",
            borderColor: "var(--border-primary)",
          }}
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
            flex-shrink-0
          "
          >
            <Info
              className="
              w-4
              h-4
              text-indigo-500
            "
            />
          </div>

          <div>
            <p
              className="
              text-xs
              font-bold
            "
            >
              Owner-level settings
            </p>

            <p
              className="
              text-[10px]
              sm:text-[11px]
              leading-relaxed
              mt-1
              text-slate-500
            "
            >
              These controls are restricted to the Owner role. Security,
              permissions, complaint workflows, and system controls apply
              platform-wide. Appearance preferences are stored locally; other
              settings are synchronized with the server when saved.
            </p>
          </div>
        </div>
      </main>

      {/* =================================================
          STICKY SAVE BAR
      ================================================= */}

      {hasChanges && (
        <div
          className="
            fixed
            bottom-0
            left-0
            right-0
            z-40
            px-4
            sm:px-6
            lg:px-8
            py-3
            border-t
            backdrop-blur-xl
            animate-[settingsSlideUp_.25s_ease-out]
          "
          style={{
            backgroundColor:
              "color-mix(in srgb, var(--bg-card) 92%, transparent)",
            borderColor: "var(--border-primary)",
          }}
        >
          <div
            className="
            max-w-7xl
            mx-auto
            flex
            items-center
            justify-between
            gap-4
          "
          >
            <div
              className="
              hidden
              sm:flex
              items-center
              gap-2
            "
            >
              <div
                className="
                w-2
                h-2
                rounded-full
                bg-amber-500
                animate-pulse"
              />

              <span className="text-xl font-bold">Unsaved changes</span>

              <span className=" text-[10px] text-slate-500">
                Save before leaving this page.
              </span>
            </div>

            <div
              className="
              flex
              items-center
              gap-2
              w-full
              sm:w-auto
            "
            >
              <button
                type="button"
                onClick={() => {
                  loadData(true);
                  setHasChanges(false);
                }}
                className="
                  flex-1
                  sm:flex-none
                  px-4
                  h-10
                  rounded-xl
                  border
                  text-xs
                  font-bold
                  transition
                  hover:bg-white/5
                "
                style={{
                  backgroundColor: "var(--bg-primary)",
                  borderColor: "var(--border-primary)",
                  color: "var(--text-secondary)",
                }}
              >
                Discard
              </button>

              <button
                type="button"
                onClick={save}
                disabled={saving}
                className="
                  flex-1
                  sm:flex-none
                  px-5
                  h-10
                  rounded-xl
                  bg-indigo-600
                  hover:bg-indigo-500
                  text-white
                  text-xs
                  font-bold
                  flex
                  items-center
                  justify-center
                  gap-2
                  shadow-lg
                  shadow-indigo-500/20
                  transition-all
                  hover:-translate-y-0.5
                  disabled:opacity-50
                "
              >
                {saving ? (
                  <Loader2
                    className="
                    w-4
                    h-4
                    animate-spin
                  "
                  />
                ) : (
                  <Save
                    className="
                    w-4
                    h-4
                  "
                  />
                )}

                {saving ? "Saving..." : "Save Changes"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* =================================================
          ACCESS LOGS
      ================================================= */}

      {showLogs && <AccessLogsModal onClose={() => setShowLogs(false)} />}

      {/* =================================================
          ANIMATIONS
      ================================================= */}

      <style>{`
        @keyframes settingsFade {
          from {
            opacity: 0;
            transform: translateY(-6px);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        @keyframes settingsSlideUp {
          from {
            opacity: 0;
            transform: translateY(100%);
          }

          to {
            opacity: 1;
            transform: translateY(0);
          }
        }

        .settings-scroll::-webkit-scrollbar {
          width: 4px;
        }

        .settings-scroll::-webkit-scrollbar-track {
          background: transparent;
        }

        .settings-scroll::-webkit-scrollbar-thumb {
          background: var(--border-secondary);
          border-radius: 999px;
        }

        .settings-scroll::-webkit-scrollbar-thumb:hover {
          background: var(--text-muted);
        }
      `}</style>
    </div>
  );
};

export default GlobalSystemSettings;
