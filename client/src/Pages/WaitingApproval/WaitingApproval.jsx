import { Navigate, useNavigate, useLocation } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useEffect } from "react";
import { signOut } from "firebase/auth";
import { auth } from "../../firebase/firebaseConfig";
import {
  Clock,
  Building2,
  CheckCircle,
  Loader2,
  X,
  IndianRupee,
  Moon,
  Sun,
} from "lucide-react";
import AccountStatusShell from "../../components/AccountStatusShell";
const WaitingApproval = () => {
  const { user, userData, userDataLoading, loading } = useAuth();
  const { isDark, toggleTheme } = useTheme();
  const navigate = useNavigate();
  const location = useLocation();

  useEffect(() => {
    // If not logged in, redirect to login
    if (!loading && !user && location.pathname !== "/login") {
      navigate("/login", { replace: true });
      return;
    }

    // If user data is loaded and status is approved, redirect to dashboard
    if (!userDataLoading && userData) {
      const status = userData.status?.toLowerCase();

      if (status === "approved") {
        // Redirect based on role
        if (userData.role === "management") {
          navigate("/dashboard/management", { replace: true });
        } else if (userData.role === "warden") {
          navigate("/dashboard/warden", { replace: true });
        } else if (userData.role === "student") {
          const needsPayment =
            !userData?.feeDetails?.paidFee ||
            userData?.feeDetails?.paidFee === 0;
          const unverified =
            userData?.managementVerification !== "Verified" ||
            userData?.wardenVerification !== "Verified";
          if (!needsPayment && !unverified) {
            navigate("/dashboard/student", { replace: true });
          }
        } else if (userData.role === "admin" || userData.role === "owner") {
          navigate("/OwnersDashboard", { replace: true });
        }
      } else if (status === "denied") {
        // Stay on this page but show denied message
      } else if (status === "suspended") {
        navigate("/suspended", { replace: true });
      }
    }
  }, [user, userData, userDataLoading, loading, navigate, location.pathname]);

  const handleLogout = async () => {
    try {
      await signOut(auth);
      navigate("/", { replace: true });
    } catch (error) {
      console.error("Logout error:", error);
    }
  };

  if (loading || userDataLoading) {
    return (
      <div
        className={`min-h-screen flex items-center justify-center ${
          isDark
            ? "bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900"
            : "bg-gradient-to-br from-gray-100 via-gray-50 to-gray-100"
        }`}
      >
        <Loader2 className="w-8 h-8 text-indigo-500 animate-spin" />
      </div>
    );
  }

  if (!user) return <Navigate to="/login" replace />;

  const statusLower = String(userData?.status || "").toLowerCase();
  // Suspended accounts have their own dedicated page
  if (statusLower === "suspended") return <Navigate to="/suspended" replace />;
  const isDenied = statusLower === "denied";
  const isSuspended = false;
  const isUnknownRole = !userData?.role || userData.role === "unknown";
  const needsPayment =
    userData?.role === "student" &&
    (!userData?.feeDetails?.paidFee || userData?.feeDetails?.paidFee === 0);
  const unverifyReason = userData?.unverifyReason;

  return (
    <AccountStatusShell
      isDark={isDark}
      user={user}
      userData={userData}
      eyebrow="Account verification"
      title={
        isDenied
          ? "Access Denied"
          : needsPayment
            ? "Payment Required"
            : unverifyReason
              ? "Action Required"
              : isUnknownRole
                ? "Waiting for Access"
                : "Waiting for Approval"
      }
      statusLabel={
        isDenied
          ? "Denied"
          : needsPayment
            ? "Payment"
            : unverifyReason
              ? "Action required"
              : "Pending"
      }
      statusColor={
        isDenied
          ? "red"
          : unverifyReason
            ? "rose"
            : needsPayment
              ? "amber"
              : "amber"
      }
      description={
        isDenied
          ? "Your account request has been reviewed and access was not approved."
          : needsPayment
            ? "Complete the required payment before account verification can continue."
            : unverifyReason
              ? "There is an issue that needs to be addressed before verification can continue."
              : "Your account information is being reviewed by the administration."
      }
      onLogout={handleLogout}
      footerText="This page will automatically update when your account status changes."
    >
      {/* ================================================================ */}
      {/* WAITING / DENIED / PAYMENT / ACTION REQUIRED                    */}
      {/* ================================================================ */}

      <div className="text-center">
        {/* Icon */}

        <div
          className={`
          inline-flex
          items-center
          justify-center
          w-16
          h-16
          sm:w-20
          sm:h-20
          rounded-[22px]
          mb-4
          ${
            isDenied
              ? "bg-red-500/10"
              : unverifyReason
                ? "bg-rose-500/10"
                : needsPayment
                  ? "bg-amber-500/10"
                  : "bg-yellow-500/10"
          }
        `}
        >
          {isDenied ? (
            <X
              className="w-8 h-8 sm:w-10 sm:h-10 text-red-500"
              aria-hidden="true"
            />
          ) : unverifyReason ? (
            <X
              className="w-8 h-8 sm:w-10 sm:h-10 text-rose-500"
              aria-hidden="true"
            />
          ) : needsPayment ? (
            <IndianRupee
              className="w-8 h-8 sm:w-10 sm:h-10 text-amber-500"
              aria-hidden="true"
            />
          ) : (
            <Clock
              className="
              w-8
              h-8
              sm:w-10
              sm:h-10
              text-yellow-500
              motion-safe:animate-pulse
            "
              aria-hidden="true"
            />
          )}
        </div>

        {/* Heading */}

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
          {isDenied
            ? "Access Denied"
            : needsPayment
              ? "Payment Required"
              : unverifyReason
                ? "Action Required"
                : isUnknownRole
                  ? "Waiting for access"
                  : "You're almost there!"}
        </h3>

        {/* Message */}

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
          {isDenied ? (
            <>
              Your request has been reviewed and denied by the administration.
              <br />
              Please contact support if you believe this is an error.
            </>
          ) : needsPayment ? (
            <>
              Account verification is locked until your initial payment is
              received.
            </>
          ) : unverifyReason ? (
            <>Please review the issue below and address it before continuing.</>
          ) : isUnknownRole ? (
            <>
              Your login is valid, but no HOAS role has been assigned yet.
              <br />
              Please wait until an administrator gives you access.
            </>
          ) : (
            <>
              Your profile is being verified by your administration.
              <br />
              Please wait while we review your account.
            </>
          )}
        </p>
      </div>

      {/* ================================================================ */}
      {/* PAYMENT                                                          */}
      {/* ================================================================ */}

      {needsPayment && (
        <div
          className="
          mt-5
          rounded-2xl
          border
          p-4
          text-center
        "
          style={{
            backgroundColor: isDark
              ? "rgba(245,158,11,.06)"
              : "rgba(255,251,235,.90)",
            borderColor: "rgba(245,158,11,.18)",
          }}
        >
          <p className="text-[9px] uppercase tracking-widest font-black text-amber-500">
            Current Balance
          </p>

          <p className="mt-1 text-xl font-black text-amber-500">₹0</p>
        </div>
      )}

      {/* ================================================================ */}
      {/* ACTION REQUIRED                                                  */}
      {/* ================================================================ */}

      {unverifyReason && (
        <div
          className="
          mt-5
          rounded-2xl
          border
          p-4
        "
          style={{
            backgroundColor: isDark
              ? "rgba(244,63,94,.06)"
              : "rgba(255,241,242,.80)",
            borderColor: isDark ? "rgba(244,63,94,.18)" : "rgba(244,63,94,.14)",
          }}
        >
          <p className="text-[9px] uppercase tracking-widest font-black text-rose-500 mb-2">
            Reason from Management
          </p>

          <p
            className="
            text-sm
            leading-relaxed
            italic
          "
            style={{
              color: "var(--text-secondary)",
            }}
          >
            "{unverifyReason}"
          </p>
        </div>
      )}

      {/* ================================================================ */}
      {/* PROGRESS                                                         */}
      {/* ================================================================ */}

      {!isDenied && (
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
            borderColor: "var(--border-primary)",
          }}
        >
          <div className="space-y-4">
            {/* Created */}

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
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>

              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  Account created
                </p>

                <p
                  className="text-[10px]"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Your account has been created.
                </p>
              </div>

              <span className="text-[9px] font-black text-green-500">DONE</span>
            </div>

            {/* Connector */}

            <div className="ml-[17px] h-3 border-l border-dashed border-green-500/30" />

            {/* Profile */}

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
                <CheckCircle className="w-4 h-4 text-green-500" />
              </div>

              <div className="flex-1">
                <p
                  className="text-sm font-semibold"
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  Profile submitted
                </p>

                <p
                  className="text-[10px]"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Your information was submitted.
                </p>
              </div>

              <span className="text-[9px] font-black text-green-500">DONE</span>
            </div>

            {/* Connector */}

            <div className="ml-[17px] h-3 border-l border-dashed border-yellow-500/30" />

            {/* Pending */}

            <div className="flex items-center gap-3">
              <div
                className="
                relative
                w-9
                h-9
                shrink-0
                rounded-xl
                flex
                items-center
                justify-center
                bg-yellow-500/10
              "
              >
                <span className="absolute inset-0 rounded-xl bg-yellow-500/10 motion-safe:animate-ping" />

                <Clock
                  className="
                  relative
                  w-4
                  h-4
                  text-yellow-500
                "
                />
              </div>

              <div className="flex-1">
                <p
                  className="
                  text-sm
                  font-bold
                  text-yellow-600
                  dark:text-yellow-400
                "
                >
                  Waiting for admin approval
                </p>

                <p
                  className="text-[10px]"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  Your account is currently under review.
                </p>
              </div>

              <span className="text-[9px] font-black text-yellow-600 dark:text-yellow-400">
                PENDING
              </span>
            </div>
          </div>
        </div>
      )}
    </AccountStatusShell>
  );
};

export default WaitingApproval;
