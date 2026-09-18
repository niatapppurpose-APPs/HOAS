import HOASLogo from "../assets/AppLogo4k.png";
import { CheckCircle } from "lucide-react";
import { ThemeToggle } from "./ThemeToggle";
import AnimatedLogoutButton from "./AnimatedLogoutButton";

const AccountStatusShell = ({
  isDark,
  user,
  userData,
  eyebrow = "Account status",
  title = "Account Status",
  description,
  statusLabel,
  statusColor = "indigo",
  onLogout,
  children,
  footerText = "This page will automatically update when your account status changes.",
}) => {
  const statusStyles = {
    indigo: {
      badgeBg: "rgba(99,102,241,0.10)",
      badgeBorder: "rgba(99,102,241,0.20)",
      badgeText: "#6366f1",
      glow: "bg-indigo-500/10",
    },
    amber: {
      badgeBg: "rgba(245,158,11,0.10)",
      badgeBorder: "rgba(245,158,11,0.20)",
      badgeText: "#d97706",
      glow: "bg-amber-500/10",
    },
    red: {
      badgeBg: "rgba(239,68,68,0.10)",
      badgeBorder: "rgba(239,68,68,0.20)",
      badgeText: "#ef4444",
      glow: "bg-red-500/10",
    },
    rose: {
      badgeBg: "rgba(244,63,94,0.10)",
      badgeBorder: "rgba(244,63,94,0.20)",
      badgeText: "#e11d48",
      glow: "bg-rose-500/10",
    },
  };

  const colors =
    statusStyles[statusColor] || statusStyles.indigo;

  return (
    <div
      className={`min-h-screen overflow-y-auto overflow-x-hidden ${
        isDark
          ? "bg-slate-950"
          : "bg-slate-50"
      }`}
    >
      {/* Background */}
      <div
        className="fixed inset-0 pointer-events-none"
        aria-hidden="true"
      >
        <div className="absolute -top-40 -left-40 w-[420px] h-[420px] rounded-full bg-indigo-500/10 blur-3xl" />
        <div className="absolute -bottom-40 -right-40 w-[420px] h-[420px] rounded-full bg-purple-500/10 blur-3xl" />
      </div>

      {/* Theme toggle */}
      <div className="fixed top-4 right-4 sm:top-6 sm:right-6 z-50">
        <ThemeToggle />
      </div>

      {/* Main */}
      <main
        className="
          relative
          z-10
          w-full
          max-w-[1500px]
          mx-auto
          min-h-screen
          px-3
          p-2
          sm:px-6
          sm:py-6
          lg:px-8
          flex
          items-center
        "
      >
        <div
          className="
            w-full
            grid
            grid-cols-1
            lg:grid-cols-[0.9fr_1.1fr]
            gap-4
            sm:gap-6
            lg:gap-8
          "
        >
          {/* ============================================================ */}
          {/* LEFT BRAND PANEL                                             */}
          {/* ============================================================ */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[26px]
              sm:rounded-[32px]
              border
              min-h-[300px]
              sm:min-h-[360px]
              lg:min-h-[700px]
              flex
              items-center
              justify-center
              p-6
              sm:p-10
              lg:p-12
            "
            style={{
              background: isDark
                ? "linear-gradient(145deg, rgba(30,41,59,.95), rgba(15,23,42,.98))"
                : "linear-gradient(145deg, #ffffff, #f1f5f9)",
              borderColor: "var(--border-primary)",
              boxShadow: isDark
                ? "0 25px 70px rgba(0,0,0,.35)"
                : "0 25px 70px rgba(15,23,42,.08)",
            }}
          >
            <div
              className={`
                absolute
                -top-28
                -right-28
                w-64
                h-64
                rounded-full
                blur-3xl
                ${colors.glow}
              `}
              aria-hidden="true"
            />

            <div
              className="
                absolute
                -bottom-32
                -left-32
                w-72
                h-72
                rounded-full
                bg-purple-500/10
                blur-3xl
              "
              aria-hidden="true"
            />

            <div className="relative z-10 w-full text-center">
              {/* Logo */}
              <div className="flex justify-center">
                <div
                  className="
                    relative
                    w-40
                    h-40
                    sm:w-52
                    sm:h-52
                    lg:w-[310px]
                    lg:h-[310px]
                  "
                >
                  <div
                    className="
                      absolute
                      inset-5
                      rounded-full
                      bg-indigo-500/20
                      blur-3xl
                    "
                    aria-hidden="true"
                  />

                  <img
                    src={HOASLogo}
                    alt="HOAS — Hostel Operations and Administration System"
                    className="
                      relative
                      z-10
                      w-full
                      h-full
                      object-contain
                      drop-shadow-2xl
                    "
                  />
                </div>
              </div>

              <div className="mt-4 sm:mt-6">
                <h1
                  className="
                    text-3xl
                    sm:text-4xl
                    lg:text-5xl
                    font-black
                    tracking-tight
                  "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  HOAS
                </h1>

                <p
                  className="
                    mt-2
                    text-xs
                    sm:text-sm
                    lg:text-base
                    font-medium
                    max-w-md
                    mx-auto
                  "
                  style={{
                    color: "var(--text-secondary)",
                  }}
                >
                  Hostel Operations and Administration System
                </p>
              </div>

              <div className="flex items-center justify-center gap-3 mt-5">
                <span className="h-px w-10 bg-indigo-500/30" />
                <span className="w-1.5 h-1.5 rounded-full bg-indigo-500" />
                <span className="h-px w-10 bg-indigo-500/30" />
              </div>

              <p
                className="
                  mt-4
                  text-[11px]
                  sm:text-xs
                  lg:text-sm
                  leading-relaxed
                  max-w-md
                  mx-auto
                "
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Securely managing students, wardens,
                hostels and administration in one place.
              </p>
            </div>
          </section>

          {/* ============================================================ */}
          {/* RIGHT STATUS PANEL                                           */}
          {/* ============================================================ */}

          <section
            className="
              relative
              overflow-hidden
              rounded-[26px]
              sm:rounded-[32px]
              border
              p-4
              sm:p-7
              lg:p-9
              flex
              flex-col
              justify-center
            "
            aria-labelledby="account-status-title"
            style={{
              backgroundColor: isDark
                ? "rgba(15,23,42,.90)"
                : "rgba(255,255,255,.94)",
              borderColor: "var(--border-primary)",
              boxShadow: isDark
                ? "0 25px 70px rgba(0,0,0,.35)"
                : "0 25px 70px rgba(15,23,42,.08)",
              backdropFilter: "blur(20px)",
            }}
          >
            {/* Accent */}
            <div
              className="absolute top-0 left-0 right-0 h-1 bg-gradient-to-r from-indigo-500 via-purple-500 to-cyan-500"
              aria-hidden="true"
            />

            {/* Heading */}
            <div className="mb-5 sm:mb-7">
              <div className="flex items-start justify-between gap-3">
                <div>
                  <p
                    className="
                      text-[9px]
                      sm:text-[10px]
                      uppercase
                      tracking-[.18em]
                      font-black
                    "
                    style={{
                      color: colors.badgeText,
                    }}
                  >
                    {eyebrow}
                  </p>

                  <h2
                    id="account-status-title"
                    className="
                      mt-1
                      text-xl
                      sm:text-2xl
                      lg:text-3xl
                      font-black
                      tracking-tight
                    "
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    {title}
                  </h2>
                </div>

                {statusLabel && (
                  <span
                    className="
                      shrink-0
                      inline-flex
                      items-center
                      gap-1.5
                      px-2.5
                      py-1.5
                      rounded-full
                      text-[9px]
                      sm:text-[10px]
                      font-black
                      uppercase
                      tracking-wide
                    "
                    style={{
                      backgroundColor: colors.badgeBg,
                      border: `1px solid ${colors.badgeBorder}`,
                      color: colors.badgeText,
                    }}
                  >
                    <span className="w-1.5 h-1.5 rounded-full bg-current animate-pulse" />
                    {statusLabel}
                  </span>
                )}
              </div>

              {description && (
                <p
                  className="mt-2 text-xs sm:text-sm leading-relaxed"
                  style={{
                    color: "var(--text-muted)",
                  }}
                >
                  {description}
                </p>
              )}
            </div>

            {/* User */}
            <div
              className="
                rounded-2xl
                border
                p-3
                sm:p-4
                mb-5
                sm:mb-6
              "
              style={{
                backgroundColor: isDark
                  ? "rgba(30,41,59,.50)"
                  : "rgba(248,250,252,.82)",
                borderColor: "var(--border-primary)",
              }}
            >
              <div className="flex items-center gap-3 sm:gap-4 min-w-0">
                <div className="relative shrink-0">
                  {user?.photoURL ? (
                    <img
                      src={user.photoURL}
                      alt={user.displayName || "User"}
                      className="
                        w-12
                        h-12
                        sm:w-14
                        sm:h-14
                        rounded-xl
                        sm:rounded-2xl
                        object-cover
                        ring-2
                        ring-indigo-500/25
                      "
                    />
                  ) : (
                    <div
                      className="
                        w-12
                        h-12
                        sm:w-14
                        sm:h-14
                        rounded-xl
                        sm:rounded-2xl
                        flex
                        items-center
                        justify-center
                        bg-gradient-to-br
                        from-indigo-500
                        to-purple-600
                        text-white
                        text-lg
                        sm:text-xl
                        font-black
                      "
                    >
                      {user?.displayName
                        ?.charAt(0)
                        ?.toUpperCase() || "U"}
                    </div>
                  )}
                </div>

                <div className="min-w-0 flex-1">
                  <p
                    className="font-bold text-sm sm:text-base truncate"
                    style={{
                      color: "var(--text-primary)",
                    }}
                  >
                    {user?.displayName || "User"}
                  </p>

                  <p
                    className="text-[11px] sm:text-xs truncate mt-0.5"
                    style={{
                      color: "var(--text-muted)",
                    }}
                  >
                    {user?.email}
                  </p>

                  <span
                    className="
                      inline-flex
                      mt-1.5
                      px-2
                      py-0.5
                      rounded-full
                      text-[8px]
                      sm:text-[9px]
                      font-black
                      uppercase
                    "
                    style={{
                      backgroundColor: "rgba(99,102,241,.10)",
                      color: "#6366f1",
                    }}
                  >
                    {userData?.role || "User"}
                  </span>
                </div>
              </div>
            </div>

            {/* Dynamic content */}
            <div role="status" aria-live="polite">
              {children}
            </div>

            {/* Logout */}
            <div className="mt-6 sm:mt-7 flex justify-center">
              <AnimatedLogoutButton
                onLogout={onLogout}
                variant={isDark ? "dark" : "light"}
                text="Sign Out"
              />
            </div>

            {/* Footer */}
            <div
              className="mt-5 pt-4 border-t text-center"
              style={{
                borderColor: "var(--border-primary)",
              }}
            >
              <p
                className="text-[9px] sm:text-[10px]"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                {footerText}
              </p>
            </div>
          </section>
        </div>
      </main>
    </div>
  );
};

export default AccountStatusShell;