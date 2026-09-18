import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useEffect, useMemo, useCallback } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import { HashLoader } from "react-spinners";
import {
  ShieldX,
  CheckCircle,
  Ban,
} from "lucide-react";

import AccountStatusShell from "../../components/AccountStatusShell";

const Suspended = () => {
  const {
    user,
    userData,
    userDataLoading,
    loading,
  } = useAuth();

  const { isDark } = useTheme();

  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    if (
      !loading &&
      !user &&
      location.pathname !== "/login"
    ) {
      navigate("/login", {
        replace: true,
      });

      return;
    }

    if (!userDataLoading && userData) {
      const status = String(
        userData.status || ""
      ).toLowerCase();

      if (status === "approved") {
        if (userData.role === "management") {
          navigate("/dashboard/management", {
            replace: true,
          });
        } else if (userData.role === "warden") {
          navigate("/dashboard/warden", {
            replace: true,
          });
        } else if (userData.role === "student") {
          navigate("/dashboard/student", {
            replace: true,
          });
        } else if (
          userData.role === "admin" ||
          userData.role === "owner"
        ) {
          navigate("/OwnersDashboard", {
            replace: true,
          });
        } else {
          navigate("/waiting-approval", {
            replace: true,
          });
        }
      } else if (
        status === "pending" ||
        status === "denied"
      ) {
        navigate("/waiting-approval", {
          replace: true,
        });
      }
    }
  }, [
    user,
    userData,
    userDataLoading,
    loading,
    navigate,
    location.pathname,
  ]);

  const handleLogout = useCallback(async () => {
    try {
      await signOut(auth);

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error(
        "Logout error:",
        error
      );
    }
  }, [navigate]);

  const statusLower = useMemo(
    () =>
      String(
        userData?.status || ""
      ).toLowerCase(),
    [userData]
  );

  const suspendedAt = useMemo(() => {
    if (!userData?.suspendedAt) {
      return null;
    }

    try {
      return new Date(
        userData.suspendedAt
      ).toLocaleString();
    } catch {
      return null;
    }
  }, [userData]);

  if (loading || userDataLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-slate-950"
            : "bg-slate-50"
        }`}
      >
        <div className="flex flex-col items-center gap-3">
          <div
            className="
              w-12
              h-12
            
              flex
              items-center
              justify-center
            "
          >
            <HashLoader
              className="
                w-6
                h-6
              
              "
            />
          </div>

          <p
            className="text-xs"
            style={{
              color: "var(--text-muted)",
            }}
          >
            Checking account status...
          </p>
        </div>
      </div>
    );
  }

  if (!user) {
    return (
      <Navigate
        to="/login"
        replace
      />
    );
  }

  if (
    statusLower === "approved"
  ) {
    if (userData?.role === "management") {
      return (
        <Navigate
          to="/dashboard/management"
          replace
        />
      );
    }

    if (userData?.role === "warden") {
      return (
        <Navigate
          to="/dashboard/warden"
          replace
        />
      );
    }

    if (userData?.role === "student") {
      return (
        <Navigate
          to="/dashboard/student"
          replace
        />
      );
    }

    if (
      userData?.role === "admin" ||
      userData?.role === "owner"
    ) {
      return (
        <Navigate
          to="/OwnersDashboard"
          replace
        />
      );
    }

    return (
      <Navigate
        to="/waiting-approval"
        replace
      />
    );
  }

  if (
    statusLower === "pending" ||
    statusLower === "denied"
  ) {
    return (
      <Navigate
        to="/waiting-approval"
        replace
      />
    );
  }

  return (
    <AccountStatusShell
      isDark={isDark}
      user={user}
      userData={userData}
      eyebrow="Security & access"
      title="Account Suspended"
      statusLabel="Suspended"
      statusColor="red"
      description="Your account access has been suspended by the administration."
      onLogout={handleLogout}
      footerText="This page will update automatically if your access is restored."
    >
      {/* ============================================================ */}
      {/* STATUS                                                       */}
      {/* ============================================================ */}

      <div className="text-center">
        <div
          className="
            inline-flex
            items-center
            justify-center
            w-16
            h-16
            sm:w-20
            sm:h-20
            rounded-[22px]
            mb-4
            bg-red-500/10
          "
        >
          <ShieldX
            className="
              w-8
              h-8
              sm:w-10
              sm:h-10
              text-red-500
            "
            aria-hidden="true"
          />
        </div>

        <h3
          className="
            text-xl
            sm:text-2xl
            font-black
          "
          style={{
            color: "var(--text-primary)",
          }}
        >
          Access Revoked
        </h3>

        <p
          className="
            mt-2
            text-xs
            sm:text-sm
            leading-relaxed
            max-w-lg
            mx-auto
          "
          style={{
            color: "var(--text-muted)",
          }}
        >
          Your account has been suspended by
          the administration. Access to HOAS
          dashboards and services is currently
          unavailable.
        </p>

        {suspendedAt && (
          <div
            className="
              inline-flex
              mt-4
              px-3
              py-1.5
              rounded-full
              bg-red-500/10
              text-red-500
              text-[10px]
              font-bold
            "
          >
            Suspended on {suspendedAt}
          </div>
        )}
      </div>

      {/* ============================================================ */}
      {/* STATUS TIMELINE                                              */}
      {/* ============================================================ */}

      <div
        className="
          mt-6
          rounded-2xl
          border
          p-4
          sm:p-5
        "
        style={{
          backgroundColor: isDark
            ? "rgba(30,41,59,.40)"
            : "rgba(248,250,252,.70)",
          borderColor:
            "var(--border-primary)",
        }}
      >
        <div className="space-y-4">

          {/* Account created */}

          <div className="flex items-center gap-3">
            <div
              className="
                w-9
                h-9
                shrink-0
                rounded-xl
                flex
                items-center
                justify-center
                bg-green-500/10
              "
            >
              <CheckCircle
                className="
                  w-4
                  h-4
                  text-green-500
                "
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="text-sm font-semibold"
                style={{
                  color:
                    "var(--text-primary)",
                }}
              >
                Account created
              </p>

              <p
                className="text-[10px]"
                style={{
                  color:
                    "var(--text-muted)",
                }}
              >
                Your HOAS account was created.
              </p>
            </div>

            <span className="text-[9px] font-black text-green-500">
              DONE
            </span>
          </div>

          {/* Connector */}

          <div className="ml-[17px] h-3 border-l border-dashed border-red-500/30" />

          {/* Suspended */}

          <div className="flex items-center gap-3">
            <div
              className="
                w-9
                h-9
                shrink-0
                rounded-xl
                flex
                items-center
                justify-center
                bg-red-500/10
              "
            >
              <Ban
                className="
                  w-4
                  h-4
                  text-red-500
                "
              />
            </div>

            <div className="flex-1 min-w-0">
              <p
                className="
                  text-sm
                  font-bold
                  text-red-500
                "
              >
                Access revoked
              </p>

              <p
                className="text-[10px]"
                style={{
                  color:
                    "var(--text-muted)",
                }}
              >
                Administration has suspended your access.
              </p>
            </div>

            <span className="text-[9px] font-black text-red-500">
              BLOCKED
            </span>
          </div>
        </div>
      </div>

      {/* Support message */}

      <div
        className="
          mt-4
          rounded-xl
          border
          px-4
          py-3
          text-center
        "
        style={{
          backgroundColor: isDark
            ? "rgba(239,68,68,.05)"
            : "rgba(254,242,242,.75)",
          borderColor: isDark
            ? "rgba(239,68,68,.15)"
            : "rgba(239,68,68,.12)",
        }}
      >
        <p
          className="text-xs leading-relaxed"
          style={{
            color:
              "var(--text-secondary)",
          }}
        >
          Please contact your administration
          or support team if you believe this
          suspension was made in error.
        </p>
      </div>
    </AccountStatusShell>
  );
};

export default Suspended;