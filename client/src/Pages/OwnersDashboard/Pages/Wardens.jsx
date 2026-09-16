import { useState, useEffect, useRef } from "react";
import { listUsers, deleteUserAccount } from "../../../firebase/cloudFunctions";
import { useOutletContext, useLocation } from "react-router-dom";
import Header from "../../../components/OwnerServices/header";
import Avatar from "../../../components/OwnerServices/Avatar";
import { HashLoader } from "react-spinners";
import {
  Mail,
  UserMinus,
  Search,
  X,
  RefreshCw,
  ShieldCheck,
  Building2,
  MapPin,
  Circle,
} from "lucide-react";
import { useToast } from "../../../components/Toast";
import EmptyState from "../../../components/OwnerServices/EmptyState";
import { useTheme } from "../../../context/ThemeContext";
import NoDataLight from "../../../assets/No-Data.avif";
import NoDataDark from "../../../assets/NoDataDark.webp";

const Wardens = () => {
  const { isDark } = useTheme();
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const location = useLocation();

  const toast = useToast();

  const [wardens, setWardens] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchText, setSearchText] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);

  const [removingId, setRemovingId] = useState(null);

  const searchInputRef = useRef(null);

  const contextInfo = {
    collegeName: "Professional Institution",
    collegeLocation: "Bangalore, Karnataka",
    hostelBlock: "Premium Hostel – Block A",
    hostelId: "HST-2024-001",
  };

  /* -------------------------------------------------------
       MAP API DATA
    ------------------------------------------------------- */

  const mapWardens = (users = []) =>
    users.map((w) => ({
      id: w._id,
      uid: w.uid,
      fullName: w.name,
      displayName: w.name,
      email: w.email,
      isOnline: w.isOnline,
      photoURL: w.avatarUrl,
      hostelBlock: w.hostelBlock,
      collegeName: w.collegeId?.name,
      collegeLocation: w.collegeId?.location,
      wardenRole: w.wardenRole,
      position: w.position,
    }));

  /* -------------------------------------------------------
       LOAD WARDENS
    ------------------------------------------------------- */

  const loadWardens = async () => {
    setLoading(true);
    setError(null);

    try {
      const { users } = await listUsers({ role: "warden" });
      setWardens(mapWardens(users || []));
    } catch (err) {
      console.error("Failed to load wardens:", err);
      setError(err.message || "Failed to load wardens");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    let cancelled = false;

    const load = async () => {
      try {
        const { users } = await listUsers({ role: "warden" });

        if (!cancelled) {
          setWardens(mapWardens(users || []));
        }
      } catch (err) {
        if (!cancelled) {
          console.error("Failed to load wardens:", err);
          setError(err.message || "Failed to load wardens");
        }
      } finally {
        if (!cancelled) {
          setTimeout(() => {
            if (!cancelled) setLoading(false);
          }, 350);
        }
      }
    };

    load();

    return () => {
      cancelled = true;
    };
  }, []);

  /* -------------------------------------------------------
       RESTORE SEARCH STATE
    ------------------------------------------------------- */

  useEffect(() => {
    if (location.state?.searchText !== undefined) {
      setSearchText(location.state.searchText);

      if (location.state.scrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, location.state.scrollPosition);
          window.history.replaceState({}, document.title);
        }, 100);
      }
    }

    sessionStorage.removeItem("wardensPageState");
  }, [location.state]);

  /* -------------------------------------------------------
       REALTIME UPDATES
    ------------------------------------------------------- */

  useEffect(() => {
    const handleRealtimeWardenUpdate = (event) => {
      const updatedUser = event.detail?.user;

      if (!updatedUser?.uid || updatedUser.role !== "warden") {
        return;
      }

      setWardens((current) =>
        current.map((warden) =>
          warden.uid === updatedUser.uid
            ? {
                ...warden,
                isOnline: updatedUser.isOnline,
                fullName: updatedUser.name || warden.fullName,
                displayName: updatedUser.name || warden.displayName,
                email: updatedUser.email || warden.email,
              }
            : warden,
        ),
      );
    };

    window.addEventListener("hoas:user-updated", handleRealtimeWardenUpdate);

    return () =>
      window.removeEventListener(
        "hoas:user-updated",
        handleRealtimeWardenUpdate,
      );
  }, []);

  /* -------------------------------------------------------
       SEARCH
    ------------------------------------------------------- */

  useEffect(() => {
    if (!searchOpen) return;

    const timer = setTimeout(() => {
      searchInputRef.current?.focus();
    }, 100);

    return () => clearTimeout(timer);
  }, [searchOpen]);

  const clearSearch = () => {
    setSearchText("");
    searchInputRef.current?.focus();
  };

  const filteredWardens = wardens.filter((warden) => {
    const query = searchText.trim().toLowerCase();

    if (!query) return true;

    return (
      warden.fullName?.toLowerCase().includes(query) ||
      warden.email?.toLowerCase().includes(query) ||
      warden.hostelBlock?.toLowerCase().includes(query) ||
      warden.collegeName?.toLowerCase().includes(query)
    );
  });

  /* -------------------------------------------------------
       PAGE STATE
    ------------------------------------------------------- */

  const savePageState = () => {
    const state = {
      searchText,
      scrollPosition: window.scrollY,
      returnPath: "/OwnersDashboard/wardens",
    };

    sessionStorage.setItem("wardensPageState", JSON.stringify(state));

    return state;
  };

  /* -------------------------------------------------------
       REMOVE WARDEN
    ------------------------------------------------------- */

  const handleRemove = async (warden) => {
    const confirmed = await toast.confirm(
      `Are you sure you want to remove ${warden.fullName || "this warden"}?`,
      null,
      {
        confirmText: "Yes, Remove",
        cancelText: "Cancel",
      },
    );

    if (!confirmed) return;

    setRemovingId(warden.id);

    try {
      await deleteUserAccount(warden.id);

      setWardens((current) => current.filter((item) => item.id !== warden.id));

      toast.success("Warden removed successfully");
    } catch (err) {
      console.error("Failed to delete warden:", err);

      toast.error(err.message || "Failed to remove warden");
    } finally {
      setRemovingId(null);
    }
  };

  /* -------------------------------------------------------
       ROLE
    ------------------------------------------------------- */

  const getRoleLabel = (warden) => {
    if (warden.wardenRole) return warden.wardenRole;
    if (warden.position) return warden.position;
    return "Warden";
  };
  const totalWardens = wardens.length;
  const onlineWardens = wardens.filter((warden) => warden.isOnline).length;
  /* -------------------------------------------------------
       LOADING
    ------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Header
          title="Hostel Wardens"
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onProfileClick={savePageState}
        />

        <main className="pt-24 min-h-screen px-4 sm:px-6 lg:px-8">
          <div className="min-h-[70vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <HashLoader loading color="#6366f1" size={65} />

              <p
                className="text-sm font-medium"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Loading wardens...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* -------------------------------------------------------
       MAIN UI
    ------------------------------------------------------- */

  return (
    <>
      <Header
        title="Hostel Wardens"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onProfileClick={savePageState}
      />

      <main
        className="
                    min-h-screen
                    pt-24
                    pb-12
                "
      >
        <div className="max-w-[1500px] mx-auto px-0">
          {/* =====================================================
                        PAGE HERO
                    ===================================================== */}

          <section
            className="
    sticky
    top-14
    z-20
    overflow-hidden
    border
    p-5
    sm:p-7
    lg:p-9
    mb-7
  "
            style={{
              background:
                "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 10%)",
              borderColor: "var(--border-primary)",
              boxShadow: "0 12px 35px rgba(0, 0, 0, 0.08)",
            }}
          >
            {/* Decorative glow */}
            <div
              className="
                                absolute
                                -top-24
                                -right-24
                                w-72
                                h-72
                                rounded-full
                                blur-3xl
                                opacity-30
                                pointer-events-none
                            "
              style={{
                background: "linear-gradient(135deg, #6366f1, #8b5cf6)",
              }}
            />

            <div
              className="
                                absolute
                                -bottom-24
                                -left-24
                                w-64
                                h-64
                                rounded-full
                                blur-3xl
                                opacity-20
                                pointer-events-none
                            "
              style={{
                background: "#06b6d4",
              }}
            />

            <div className="relative z-10">
              {/* Top row */}
              <div
                className="
                                    flex
                                    flex-col
                                    lg:flex-row
                                    lg:items-center
                                    lg:justify-between
                                    gap-6
                                "
              >
                <div className="min-w-0">
                  <div className="flex justify-between items-center">
                    <div
                      className="
                                            inline-flex
                                            items-center
                                            gap-2
                                            px-3
                                            py-1.5
                                            rounded-full
                                            text-[8px]
                                            font-bold
                                            uppercase
                                            tracking-wider
                                            mb-3
                                        "
                      style={{
                        backgroundColor: "rgba(99,102,241,0.10)",
                        color: "#6366f1",
                        border: "1px solid rgba(99,102,241,0.18)",
                      }}
                    >
                      <ShieldCheck size={14} />
                      Warden Management
                    </div>
                    {/* Compact mobile stats */}
                    <div className="flex items-center gap-2  lg:hidden">
                      {/* Total */}
                      <div
                        className="
      flex items-center gap-2
      px-3 py-1.5
      rounded-full
      border
      text-xs
      font-semibold
      whitespace-nowrap
    "
                        style={{
                          backgroundColor: "var(--bg-card)",
                          borderColor: "var(--border-primary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span
                          className="w-1.5 h-1.5 rounded-full"
                          style={{ backgroundColor: "#6366f1" }}
                        />

                        <span>Total</span>

                        <span
                          className="font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {totalWardens}
                        </span>
                      </div>

                      {/* Online */}
                      <div
                        className="
      flex items-center gap-2
      px-3 py-1.5
      rounded-full
      border
      text-xs
      font-semibold
      whitespace-nowrap
    "
                        style={{
                          backgroundColor: "var(--bg-card)",
                          borderColor: "var(--border-primary)",
                          color: "var(--text-secondary)",
                        }}
                      >
                        <span className="relative flex h-2 w-2">
                          <span className="absolute inline-flex h-full w-full rounded-full bg-green-400 opacity-60 animate-ping" />
                          <span className="relative inline-flex h-2 w-2 rounded-full bg-green-500" />
                        </span>

                        <span>Online</span>

                        <span
                          className="font-bold"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {onlineWardens}
                        </span>
                      </div>
                    </div>
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
                    Warden Directory
                  </h1>

                  <p
                    className="
                                            mt-2
                                            max-w-2xl
                                            text-sm
                                            sm:text-base
                                            leading-6
                                        "
                    style={{
                      color: "var(--text-muted)",
                    }}
                  >
                    Manage hostel wardens, monitor availability and keep your
                    accommodation operations organized.
                  </p>
                </div>

                {/* Stats */}
                <div
                  className="
                                        grid
                                        grid-cols-2
                                        gap-3
                                        sm:flex
                                    "
                >
                  <div
                    className="hidden
                                            min-w-[110px]
                                            rounded-2xl
                                            border
                                            px-5
                                            py-4
                                            lg:flex
                                            flex-col
                                        "
                    style={{
                      backgroundColor: "var(--bg-tertiary)",
                      borderColor: "var(--border-primary)",
                    }}
                  >
                    <p
                      className="
                                                text-2xl
                                                sm:text-3xl
                                                font-black
                                            "
                      style={{
                        color: "var(--text-primary)",
                      }}
                    >
                      {wardens.length}
                    </p>

                    <p
                      className="
                                                mt-1
                                                text-[10px]
                                                uppercase
                                                tracking-widest
                                                font-bold
                                            "
                      style={{
                        color: "var(--text-muted)",
                      }}
                    >
                      Total Wardens
                    </p>
                  </div>

                  <div
                    className="hidden
                                            min-w-[110px]
                                            rounded-2xl
                                            border
                                            px-5
                                            py-4
                                            lg:flex
                                            flex-col
                                        "
                    style={{
                      backgroundColor: "rgba(34,197,94,0.07)",
                      borderColor: "rgba(34,197,94,0.20)",
                    }}
                  >
                    <p
                      className="
                                                text-2xl
                                                sm:text-3xl
                                                font-black
                                                text-green-500
                                            "
                    >
                      {wardens.filter((w) => w.isOnline).length}
                    </p>

                    <p
                      className="
                                                mt-1
                                                text-[10px]
                                                uppercase
                                                tracking-widest
                                                font-bold
                                                text-green-600
                                            "
                    >
                      Online Now
                    </p>
                  </div>
                </div>
              </div>

              {/* Toolbar */}
              <div
                className="border-t
                                    flex
                                    flex-co
                                    sm:flex-row
                                    gap-3
                                "
                style={{
                  borderColor: "var(--border-primary)",
                }}
              >
                {/* Search */}
                <div className="relative flex-1">
                  <Search
                    size={18}
                    className="
                                            absolute
                                            left-4
                                            top-1/2
                                            -translate-y-1/2
                                        "
                    style={{
                      color: "var(--text-muted)",
                    }}
                  />

                  <input
                    ref={searchInputRef}
                    type="search"
                    value={searchText}
                    onChange={(e) => setSearchText(e.target.value)}
                    onFocus={() => setSearchOpen(true)}
                    placeholder="Search wardens by name, email, hostel or college..."
                    className="
                                            w-full
                                            h-12
                                            pl-11
                                            pr-11
                                            rounded-2xl
                                            border
                                            outline-none
                                            text-sm
                                            transition-all
                                            duration-300
                                            focus:ring-4
                                            focus:ring-indigo-500/10
                                        "
                    style={{
                      backgroundColor: "var(--bg-input)",
                      borderColor: searchOpen
                        ? "rgba(99,102,241,0.5)"
                        : "var(--border-primary)",
                      color: "var(--text-primary)",
                    }}
                  />

                  {searchText && (
                    <button
                      type="button"
                      onClick={clearSearch}
                      className="
                                                absolute
                                                right-3
                                                top-1/2
                                                -translate-y-1/2
                                                w-7
                                                h-7
                                                rounded-full
                                                flex
                                                items-center
                                                justify-center
                                                transition-all
                                                hover:scale-110
                                            "
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        color: "var(--text-muted)",
                      }}
                      aria-label="Clear search"
                    >
                      <X size={14} />
                    </button>
                  )}
                </div>

                {/* Search close */}
                {searchOpen && (
                  <button
                    onClick={() => {
                      setSearchOpen(false);
                      searchInputRef.current?.blur();
                    }}
                    className="
                                            hidden
                                            sm:flex
                                            h-12
                                            px-4
                                            items-center
                                            justify-center
                                            gap-2
                                            rounded-2xl
                                            border
                                            font-semibold
                                            text-sm
                                            transition-all
                                            hover:bg-black/5
                                            dark:hover:bg-white/5
                                        "
                    style={{
                      borderColor: "var(--border-primary)",
                      color: "var(--text-secondary)",
                    }}
                  >
                    <X size={17} />
                    Close
                  </button>
                )}

                {/* Refresh */}
                <button
                  onClick={loadWardens}
                  disabled={loading}
                  className="
                                        h-12
                                        px-4
                                        sm:px-5
                                        rounded-2xl
                                        border
                                        flex
                                        items-center
                                        justify-center
                                        gap-2
                                        font-semibold
                                        text-sm
                                        transition-all
                                        duration-300
                                        hover:-translate-y-0.5
                                        active:translate-y-0
                                        disabled:opacity-50
                                    "
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                >
                  <RefreshCw
                    size={17}
                    className={loading ? "animate-spin" : ""}
                  />

                  <span className="hidden sm:inline">Refresh</span>
                </button>
              </div>
            </div>
          </section>

          {/* =====================================================
                        ERROR
                    ===================================================== */}

          {error && (
            <div
              className="
                                mb-6
                                rounded-2xl
                                border
                                px-5
                                py-4
                            "
              style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.20)",
                color: "#ef4444",
              }}
            >
              <div className="flex items-center justify-between gap-4">
                <p className="text-sm font-medium">{error}</p>

                <button
                  onClick={loadWardens}
                  className="
                                        text-xs
                                        font-bold
                                        underline
                                        whitespace-nowrap
                                    "
                >
                  Try again
                </button>
              </div>
            </div>
          )}

          {/* =====================================================
                        EMPTY SEARCH RESULT
                    ===================================================== */}

          {!loading && wardens.length > 0 && filteredWardens.length === 0 && (
            <EmptyState
              title={"No matches Found"}
              description="Try searching with another name, email, hostel or college."
              ctaLabel="Clear search"
              onCta={clearSearch}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          )}

          {/* =====================================================
                        NO WARDENS
                    ===================================================== */}

          {!loading && wardens.length === 0 && !error && (
            <EmptyState
              title="No Wardens Assigned"
              subtitle="This hostel needs warden supervision"
              description={`No wardens have been assigned to ${contextInfo.hostelBlock} yet. Assign a warden to help manage students, handle daily operations, and maintain hostel discipline.`}
              ctaLabel="Open Search"
              onCta={() => {
                setSearchOpen(true);

                setTimeout(() => {
                  searchInputRef.current?.focus();
                }, 100);
              }}
              videoSrc={!isDark ? NoDataLight : NoDataDark}
              className="max-w-5xl mx-auto"
            />
          )}

          {/* =====================================================
                        WARDEN GRID
                    ===================================================== */}

          {!loading && filteredWardens.length > 0 && (
            <section>
              <div
                className="
                                        grid
                                        grid-cols-1
                                        md:grid-cols-2
                                        2xl:grid-cols-3
                                        gap-4
                                        sm:gap-5
                                        px-3
                                    "
              >
                {filteredWardens.map((warden) => (
                  <article
                    key={warden.id}
                    className="
                                                    group
                                                    relative
                                                    overflow-hidden
                                                    rounded-[22px]
                                                    border
                                                    p-5
                                                    transition-all
                                                    duration-300
                                                    hover:-translate-y-1
                                                    hover:shadow-xl
                                                "
                    style={{
                      backgroundColor: "var(--bg-card)",
                      borderColor: "var(--border-primary)",
                    }}
                  >
                    {/* Online indicator strip */}
                    <div
                      className="
                                                        absolute
                                                        left-0
                                                        top-0
                                                        bottom-0
                                                        w-1
                                                    "
                      style={{
                        backgroundColor: warden.isOnline
                          ? "#22c55e"
                          : "#94a3b8",
                      }}
                    />

                    {/* Top section */}
                    <div className="flex items-start justify-between gap-4">
                      <div className="flex items-center gap-3 min-w-0">
                        <div className="relative shrink-0">
                          <Avatar
                            image={warden.photoURL}
                            name={
                              warden.fullName ||
                              warden.displayName ||
                              warden.email
                            }
                            size="md"
                          />

                          <span
                            className="
                                                                    absolute
                                                                    -right-0.5
                                                                    -bottom-0.5
                                                                    w-3.5
                                                                    h-3.5
                                                                    rounded-full
                                                                    border-2
                                                                "
                            style={{
                              backgroundColor: warden.isOnline
                                ? "#22c55e"
                                : "#94a3b8",
                              borderColor: "var(--bg-card)",
                            }}
                          />
                        </div>

                        <div className="min-w-0">
                          <h3
                            className="
                                                                    font-bold
                                                                    text-base
                                                                    truncate
                                                                "
                            style={{
                              color: "var(--text-primary)",
                            }}
                          >
                            {warden.fullName ||
                              warden.displayName ||
                              "Unknown Warden"}
                          </h3>
                        </div>
                      </div>

                      {/* Role badge */}
                      <span
                        className="
                                                            shrink-0
                                                            inline-flex
                                                            items-center
                                                            gap-1.5
                                                            px-2.5
                                                            py-1
                                                            rounded-full
                                                            text-[10px]
                                                            font-bold
                                                            uppercase
                                                            tracking-wide
                                                            bg-indigo-500/10
                                                            text-indigo-500
                                                            border
                                                            border-indigo-500/20
                                                        "
                      >
                        <ShieldCheck size={12} />

                        {getRoleLabel(warden)}
                      </span>
                    </div>

                    {/* Email */}
                    {warden.email && (
                      <div
                        className="
                                                            mt-5
                                                            flex
                                                            items-center
                                                            gap-2
                                                            min-w-0
                                                        "
                      >
                        <div
                          className="
                                                                w-8
                                                                h-8
                                                                rounded-lg
                                                                flex
                                                                items-center
                                                                justify-center
                                                                shrink-0
                                                            "
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                          }}
                        >
                          <Mail
                            size={14}
                            style={{
                              color: "var(--text-muted)",
                            }}
                          />
                        </div>

                        <span
                          className="
                                                                text-xs
                                                                truncate
                                                            "
                          style={{
                            color: "var(--text-muted)",
                          }}
                        >
                          {warden.email}
                        </span>
                      </div>
                    )}

                    {/* Details */}
                    <div
                      className="
                                                        mt-4
                                                        grid
                                                        grid-cols-1
                                                        sm:grid-cols-2
                                                        gap-2
                                                    "
                    >
                      {warden.hostelBlock && (
                        <div
                          className="
                                                                rounded-xl
                                                                border
                                                                px-3
                                                                py-2.5
                                                            "
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <Building2
                              size={14}
                              className="text-indigo-500 shrink-0"
                            />

                            <div className="min-w-0">
                              <p
                                className="
                                                                            text-[9px]
                                                                            uppercase
                                                                            tracking-wider
                                                                            font-bold
                                                                        "
                                style={{
                                  color: "var(--text-muted)",
                                }}
                              >
                                Hostel
                              </p>

                              <p
                                className="
                                                                            mt-0.5
                                                                            text-xs
                                                                            font-semibold
                                                                            truncate
                                                                        "
                                style={{
                                  color: "var(--text-primary)",
                                }}
                              >
                                {warden.hostelBlock}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}

                      {(warden.collegeName || contextInfo.collegeName) && (
                        <div
                          className="
                                                                rounded-xl
                                                                border
                                                                px-3
                                                                py-2.5
                                                            "
                          style={{
                            backgroundColor: "var(--bg-tertiary)",
                            borderColor: "var(--border-primary)",
                          }}
                        >
                          <div className="flex items-center gap-2">
                            <MapPin
                              size={14}
                              className="text-purple-500 shrink-0"
                            />

                            <div className="min-w-0">
                              <p
                                className="
                                                                            text-[9px]
                                                                            uppercase
                                                                            tracking-wider
                                                                            font-bold
                                                                        "
                                style={{
                                  color: "var(--text-muted)",
                                }}
                              >
                                College
                              </p>

                              <p
                                className="
                                                                            mt-0.5
                                                                            text-xs
                                                                            font-semibold
                                                                            truncate
                                                                        "
                                style={{
                                  color: "var(--text-primary)",
                                }}
                              >
                                {warden.collegeName || contextInfo.collegeName}
                              </p>
                            </div>
                          </div>
                        </div>
                      )}
                    </div>

                    {/* Footer */}
                    <div
                      className="
                                                        mt-5
                                                        pt-4
                                                        border-t
                                                        flex
                                                        items-center
                                                        justify-between
                                                        gap-3
                                                    "
                      style={{
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <span
                        className="
                                                            text-[10px]
                                                            uppercase
                                                            tracking-widest
                                                            font-bold
                                                        "
                        style={{
                          color: "var(--text-muted)",
                        }}
                      >
                        Warden Account
                      </span>

                      <button
                        onClick={() => handleRemove(warden)}
                        disabled={removingId === warden.id}
                        className="
                                                            group/remove
                                                            h-9
                                                            px-3
                                                            rounded-xl
                                                            flex
                                                            items-center
                                                            justify-center
                                                            gap-2
                                                            border
                                                            text-xs
                                                            font-bold
                                                            transition-all
                                                            duration-200
                                                            hover:bg-red-500
                                                            hover:text-white
                                                            hover:border-red-500
                                                            disabled:opacity-50
                                                            disabled:cursor-not-allowed
                                                        "
                        style={{
                          borderColor: "rgba(239,68,68,0.25)",
                          color: "#ef4444",
                          backgroundColor: "rgba(239,68,68,0.05)",
                        }}
                        title="Remove Warden"
                      >
                        <UserMinus
                          size={15}
                          className="
                                                                transition-transform
                                                                group-hover/remove:scale-110
                                                            "
                        />

                        <span className="hidden sm:inline">
                          {removingId === warden.id ? "Removing..." : "Remove"}
                        </span>
                      </button>
                    </div>
                  </article>
                ))}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default Wardens;
