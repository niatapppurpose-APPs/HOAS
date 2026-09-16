import { useState, useEffect, useRef, useMemo } from "react";
import { Navigate, useNavigate, useOutletContext } from "react-router-dom";
import { useAuth } from "../../context/AuthContext";
import { useTheme } from "../../context/ThemeContext";
import { useSystemSettings } from "../../hooks/useSystemSettings";
import * as cloudFunctions from "../../firebase/cloudFunctions";
import { useToast } from "../../components/Toast";

import Header from "../../components/OwnerServices/header";

import BulkActionsBar from "./components/BulkActionsBar";
import UserListTabs from "./components/UserListTabs";
import UserCard from "./components/UserCard";
import PaginationControls from "./components/PaginationControls";
import EmptyState from "./components/EmptyState";
import ErrorState from "./components/ErrorState";
import LoadingState from "./components/LoadingState";

import AddManagementModal from "./modals/AddManagementModal";
import { roleColors } from "./constants";

import {
  ArrowUpRight,
  BarChart3,
  Building2,
  Check,
  ChevronDown,
  Clock3,
  Filter,
  Plus,
  Search,
  ShieldCheck,
  Ticket,
  UserPlus,
  Users,
  X,
  Zap,
} from "lucide-react";

const QUICK_ACTIONS = [
  {
    title: "Wardens",
    description: "Manage hostel wardens",
    icon: ShieldCheck,
    path: "/OwnersDashboard/wardens",
    iconClass: "text-indigo-500",
    bgClass: "bg-indigo-500/10",
    hoverClass: "group-hover:bg-indigo-500",
  },
  {
    title: "Students",
    description: "View student accounts",
    icon: Users,
    path: "/OwnersDashboard/students",
    iconClass: "text-blue-500",
    bgClass: "bg-blue-500/10",
    hoverClass: "group-hover:bg-blue-500",
  },
  {
    title: "Analytics",
    description: "View platform insights",
    icon: BarChart3,
    path: "/OwnersDashboard/analytics",
    iconClass: "text-violet-500",
    bgClass: "bg-violet-500/10",
    hoverClass: "group-hover:bg-violet-500",
  },
  {
    title: "Support",
    description: "Manage support tickets",
    icon: Ticket,
    path: "/OwnersDashboard/support-tickets",
    iconClass: "text-orange-500",
    bgClass: "bg-orange-500/10",
    hoverClass: "group-hover:bg-orange-500",
  },
];

const OwnersDashboard = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();

  const { user, isAdmin, loading, adminChecked, logout } = useAuth();

  const { isDark } = useTheme();
  const { isApprovalsEnabled } = useSystemSettings();

  const navigate = useNavigate();
  const toast = useToast();

  const scrollContainerRef = useRef(null);

  /* -------------------------------------------------------------------------- */
  /* STATE                                                                      */
  /* -------------------------------------------------------------------------- */

  const [allUsers, setAllUsers] = useState([]);
  const [activeTab, setActiveTab] = useState("all");

  const [dataLoading, setDataLoading] = useState(true);
  const [fetchError, setFetchError] = useState(null);

  const [isApproving, setIsApproving] = useState(null);
  const [isDenying, setIsDenying] = useState(null);
  const [isDeleteLoading, setIsDeleteLoading] = useState(null);

  const [currentPage, setCurrentPage] = useState(1);
  const itemsPerPage = 10;

  const [selectedUsers, setSelectedUsers] = useState(new Set());
  const [isBulkApproving, setIsBulkApproving] = useState(false);

  const [isAddModalOpen, setIsAddModalOpen] = useState(false);

  const [searchQuery, setSearchQuery] = useState("");
  const [showFilters, setShowFilters] = useState(false);

  /* -------------------------------------------------------------------------- */
  /* AUTH                                                                       */
  /* -------------------------------------------------------------------------- */

  if (!loading && !user) {
    return <Navigate to="/login" replace />;
  }

  if (!loading && adminChecked && !isAdmin) {
    return <Navigate to="/login" replace />;
  }

  /* -------------------------------------------------------------------------- */
  /* RESET PAGINATION                                                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    setCurrentPage(1);
    setSelectedUsers(new Set());
  }, [activeTab, searchQuery]);

  /* -------------------------------------------------------------------------- */
  /* FETCH USERS                                                                 */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (!adminChecked || !user || !isAdmin) return;

    let cancelled = false;

    setDataLoading(true);

    cloudFunctions
      .getAllManagementUsers()
      .then(({ users }) => {
        if (cancelled) return;

        if (users && users.length > 0) {
          const mappedUsers = users.map((u) => ({
            id: u._id,
            uid: u.uid,
            displayName: u.name,
            name: u.name,
            email: u.email,
            role: u.role,
            status: u.status,
            isOnline: u.isOnline,
            photoURL: u.photoURL,
            collegeName: u.collegeId?.name,
            collegeLocation: u.collegeId?.location,
            createdAt: u.createdAt,
          }));

          setAllUsers(mappedUsers);
        } else {
          setAllUsers([]);
        }

        setFetchError(null);
        setDataLoading(false);
      })
      .catch((error) => {
        if (cancelled) return;

        console.error("Management users error:", error);

        setFetchError(error?.message || "Unable to load management users.");

        setAllUsers([]);
        setDataLoading(false);
      });

    return () => {
      cancelled = true;
    };
  }, [adminChecked, user, isAdmin]);

  /* -------------------------------------------------------------------------- */
  /* REALTIME USER UPDATES                                                       */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleRealtimeUserUpdate = (event) => {
      const updatedUser = event.detail?.user;

      if (!updatedUser?.uid) return;

      setAllUsers((current) =>
        current.map((existing) =>
          existing.uid === updatedUser.uid
            ? {
                ...existing,
                isOnline: updatedUser.isOnline,
                displayName: updatedUser.name || existing.displayName,
                name: updatedUser.name || existing.name,
                email: updatedUser.email || existing.email,
                status: updatedUser.status || existing.status,
                role: updatedUser.role || existing.role,
              }
            : existing,
        ),
      );
    };

    window.addEventListener("hoas:user-updated", handleRealtimeUserUpdate);

    return () => {
      window.removeEventListener("hoas:user-updated", handleRealtimeUserUpdate);
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /* LOGOUT                                                                     */
  /* -------------------------------------------------------------------------- */

  const handleLogout = async () => {
    try {
      await logout();

      toast.success("Logged out successfully");

      navigate("/", {
        replace: true,
      });
    } catch (error) {
      console.error("Logout error:", error);

      toast.error("Failed to logout. Please try again.");
    }
  };

  /* -------------------------------------------------------------------------- */
  /* STATUS CHANGE                                                              */
  /* -------------------------------------------------------------------------- */

  const handleStatusChange = async (userId, newStatus) => {
    if (!isApprovalsEnabled()) {
      toast.warning(
        "Approval workflows are currently disabled in System Settings.",
      );

      return;
    }

    if (newStatus === "approved") {
      setIsApproving(userId);
    }

    if (newStatus === "denied") {
      setIsDenying(userId);
    }

    try {
      const timeoutPromise = new Promise((_, reject) =>
        setTimeout(() => reject(new Error("Operation timed out")), 15000),
      );

      const operation =
        newStatus === "approved"
          ? cloudFunctions.approveUser(userId, "owner")
          : cloudFunctions.denyUser(userId, "Denied by owner");

      await Promise.race([operation, timeoutPromise]);

      setSelectedUsers((prev) => {
        const next = new Set(prev);

        next.delete(userId);

        return next;
      });

      toast.success(`User ${newStatus} successfully!`);
    } catch (error) {
      if (error?.message === "Operation timed out") {
        toast.error(`${newStatus} operation is taking longer than expected.`);
      } else {
        toast.error(
          `Failed to ${newStatus} user: ${error?.message || "Unknown error"}`,
        );
      }
    } finally {
      if (newStatus === "approved") {
        setIsApproving(null);
      }

      if (newStatus === "denied") {
        setIsDenying(null);
      }
    }
  };

  /* -------------------------------------------------------------------------- */
  /* ROLE CHANGE                                                                */
  /* -------------------------------------------------------------------------- */

  const handleRoleChange = async (userId, role) => {
    try {
      const { user: updated } = await cloudFunctions.setUserRole(userId, role);

      setAllUsers((users) =>
        users.map((item) =>
          item.id === userId
            ? {
                ...item,
                role: updated.role,
              }
            : item,
        ),
      );

      toast.success(`User role changed to ${role}.`);
    } catch (error) {
      toast.error(
        `Failed to change role: ${error?.message || "Unknown error"}`,
      );
    }
  };

  /* -------------------------------------------------------------------------- */
  /* BULK APPROVAL                                                              */
  /* -------------------------------------------------------------------------- */

  const handleBulkApprove = async () => {
    if (!isApprovalsEnabled()) {
      toast.warning(
        "Approval workflows are currently disabled in System Settings.",
      );

      return;
    }

    if (selectedUsers.size === 0) {
      toast.warning("No users selected for approval.");

      return;
    }

    const confirmed = await toast.confirm(
      `Approve ${selectedUsers.size} selected user${
        selectedUsers.size > 1 ? "s" : ""
      }?`,
    );

    if (!confirmed) return;

    setIsBulkApproving(true);

    const userIds = Array.from(selectedUsers);

    let successCount = 0;
    let failCount = 0;

    try {
      const batchSize = 5;

      for (let i = 0; i < userIds.length; i += batchSize) {
        const batch = userIds.slice(i, i + batchSize);

        const results = await Promise.allSettled(
          batch.map((id) => cloudFunctions.approveUser(id, "owner")),
        );

        results.forEach((result) => {
          if (result.status === "fulfilled") {
            successCount++;
          } else {
            failCount++;
          }
        });
      }

      setSelectedUsers(new Set());

      if (failCount === 0) {
        toast.success(
          `Successfully approved ${successCount} user${
            successCount > 1 ? "s" : ""
          }!`,
        );
      } else {
        toast.warning(`Approved ${successCount}. ${failCount} failed.`);
      }
    } catch (error) {
      toast.error(`Bulk approval error: ${error?.message || "Unknown error"}`);
    } finally {
      setIsBulkApproving(false);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* SELECTION                                                                  */
  /* -------------------------------------------------------------------------- */

  const toggleUserSelection = (userId) => {
    setSelectedUsers((prev) => {
      const next = new Set(prev);

      if (next.has(userId)) {
        next.delete(userId);
      } else {
        next.add(userId);
      }

      return next;
    });
  };

  /* -------------------------------------------------------------------------- */
  /* DELETE                                                                     */
  /* -------------------------------------------------------------------------- */

  const handleOpenDeleteModal = async (userData) => {
    setIsDeleteLoading(userData.id);

    try {
      const confirmed = await toast.confirm(
        `Delete management user "${
          userData.displayName || userData.email
        }"? This will remove their account and associated data.`,
      );

      if (!confirmed) return;

      await cloudFunctions.deleteUserAccount(userData.id);

      setAllUsers((users) => users.filter((u) => u.id !== userData.id));

      toast.success("Management user deleted successfully!");
    } catch (error) {
      console.error("Delete management user error:", error);

      toast.error("Failed to delete management user.");
    } finally {
      setIsDeleteLoading(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* COUNTS                                                                     */
  /* -------------------------------------------------------------------------- */

  const totalCount = allUsers.length;

  const pendingCount = useMemo(
    () => allUsers.filter((u) => u.status === "pending").length,
    [allUsers],
  );

  const approvedCount = useMemo(
    () => allUsers.filter((u) => u.status === "approved").length,
    [allUsers],
  );

  const suspendedCount = useMemo(
    () => allUsers.filter((u) => u.status === "suspended").length,
    [allUsers],
  );

  /* -------------------------------------------------------------------------- */
  /* FILTER USERS                                                               */
  /* -------------------------------------------------------------------------- */

  const filteredUsers = useMemo(() => {
    let users = [...allUsers];

    if (activeTab === "pending") {
      users = users.filter((u) => u.status === "pending");
    }

    if (activeTab === "approved") {
      users = users.filter((u) => u.status === "approved");
    }

    if (activeTab === "suspended") {
      users = users.filter((u) => u.status === "suspended");
    }

    if (searchQuery.trim()) {
      const query = searchQuery.trim().toLowerCase();

      users = users.filter((u) => {
        return (
          (u.displayName || "").toLowerCase().includes(query) ||
          (u.email || "").toLowerCase().includes(query) ||
          (u.collegeName || "").toLowerCase().includes(query) ||
          (u.role || "").toLowerCase().includes(query)
        );
      });
    }

    return users.sort((a, b) => {
      if (a.status === "pending" && b.status !== "pending") {
        return -1;
      }

      if (a.status !== "pending" && b.status === "pending") {
        return 1;
      }

      return (a.displayName || "").localeCompare(b.displayName || "");
    });
  }, [allUsers, activeTab, searchQuery]);

  /* -------------------------------------------------------------------------- */
  /* PAGINATION                                                                 */
  /* -------------------------------------------------------------------------- */

  const totalPages = Math.max(
    1,
    Math.ceil(filteredUsers.length / itemsPerPage),
  );

  const startIndex = (currentPage - 1) * itemsPerPage;

  const endIndex = startIndex + itemsPerPage;

  const paginatedUsers = filteredUsers.slice(startIndex, endIndex);

  const pendingOnPage = paginatedUsers.filter((u) => u.status === "pending");

  const allPendingSelected =
    pendingOnPage.length > 0 &&
    pendingOnPage.every((u) => selectedUsers.has(u.id));

  /* -------------------------------------------------------------------------- */
  /* SELECT ALL                                                                 */
  /* -------------------------------------------------------------------------- */

  const handleSelectAll = () => {
    if (allPendingSelected) {
      setSelectedUsers(new Set());
      return;
    }

    setSelectedUsers(new Set(pendingOnPage.map((u) => u.id)));
  };

  /* -------------------------------------------------------------------------- */
  /* SCROLL                                                                     */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (scrollContainerRef.current) {
      scrollContainerRef.current.scrollTop = 0;
    }
  }, [currentPage]);

  /* -------------------------------------------------------------------------- */
  /* LOADING                                                                    */
  /* -------------------------------------------------------------------------- */

  if (loading || !adminChecked) {
    return <LoadingState message="Verifying admin access..." />;
  }

  if (!user || !isAdmin) {
    return <LoadingState message="Redirecting..." />;
  }

  if (dataLoading) {
    return <LoadingState message="Loading dashboard..." />;
  }

  /* -------------------------------------------------------------------------- */
  /* UI                                                                         */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <Header
        pendingCount={pendingCount}
        handleLogout={handleLogout}
        user={user}
        title="Owner Dashboard"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
      />

      <main
        className="
          min-h-screen
          pt-20
          sm:pt-24
          px-4
          sm:px-6
          lg:px-8
          pb-10
        "
      >
        {/* ------------------------------------------------------------------ */}
        {/* PAGE HEADER                                                        */}
        {/* ------------------------------------------------------------------ */}

        <section
          className="
            mx-auto
            max-w-[1600px]
            mb-8
          "
        >
          <div
            className="
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
                  py-1
                  rounded-full
                  border
                  text-[11px]
                  font-semibold
                  tracking-wide
                  mb-3
                "
                style={{
                  borderColor: "var(--border-primary)",
                  backgroundColor: "var(--bg-tertiary)",
                  color: "var(--text-secondary)",
                }}
              >
                <span
                  className="
                    w-1.5
                    h-1.5
                    rounded-full
                    bg-emerald-500
                    animate-pulse
                  "
                />
                System operational
              </div>

              <h1
                className="
                  text-3xl
                  sm:text-4xl
                  lg:text-5xl
                  font-bold
                  tracking-[-0.04em]
                "
                style={{
                  color: "var(--text-primary)",
                }}
              >
                Good to see you,{" "}
                <span className="text-indigo-500">
                  {user?.displayName || "Admin"}
                </span>
              </h1>

              <p
                className="
                  mt-2
                  text-sm
                  sm:text-base
                  max-w-2xl
                "
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                Monitor management accounts, review registrations and keep your
                platform running smoothly.
              </p>
            </div>

            <div
              className="
                flex
                items-center
                gap-2
              "
            >
              <button
                type="button"
                onClick={() => navigate("/OwnersDashboard/analytics")}
                className="
                  hidden
                  sm:flex
                  items-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  border
                  text-sm
                  font-semibold
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                "
                style={{
                  borderColor: "var(--border-primary)",
                  color: "var(--text-primary)",
                  backgroundColor: "var(--bg-card)",
                }}
              >
                View analytics
                <ArrowUpRight className="w-4 h-4" />
              </button>

              <button
                type="button"
                onClick={() => setIsAddModalOpen(true)}
                className="
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  px-4
                  py-2.5
                  rounded-xl
                  bg-indigo-600
                  hover:bg-indigo-700
                  text-white
                  text-sm
                  font-semibold
                  shadow-lg
                  shadow-indigo-500/20
                  transition-all
                  duration-200
                  hover:-translate-y-0.5
                  active:translate-y-0
                "
              >
                <Plus className="w-4 h-4" />
                Add management
              </button>
            </div>
          </div>
        </section>
        {/* ------------------------------------------------------------------ */}
        {/* QUICK ACTIONS                                                      */}
        {/* ------------------------------------------------------------------ */}

        <section
          id="tour-actions"
          className="
            mx-auto
            max-w-[1600px]
            mb-10
          "
        >
          <div className="flex items-center justify-between mb-4">
            <div>
              <h2
                className="
                  text-lg
                  font-bold
                  tracking-tight
                "
                style={{
                  color: "var(--text-primary)",
                }}
              >
                Quick actions
              </h2>

              <p
                className="
                  text-xs
                  sm:text-sm
                  mt-0.5
                "
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                Jump directly to frequently used areas.
              </p>
            </div>

            <Zap
              className="
                w-5
                h-5
                text-indigo-500
              "
            />
          </div>

          <div
            className="
              grid
              grid-cols-1
              sm:grid-cols-2
              xl:grid-cols-4
              gap-3
            "
          >
            {QUICK_ACTIONS.map((action) => {
              const Icon = action.icon;

              return (
                <button
                  key={action.title}
                  type="button"
                  onClick={() => navigate(action.path)}
                  className="
                      group
                      relative
                      flex
                      items-center
                      gap-4
                      p-4
                      text-left
                      rounded-2xl
                      border
                      transition-all
                      duration-300
                      hover:-translate-y-1
                      hover:shadow-xl
                      active:translate-y-0
                    "
                  style={{
                    backgroundColor: "var(--bg-card)",
                    borderColor: "var(--border-primary)",
                  }}
                >
                  {/* ICON */}

                  <div
                    className={`
                        shrink-0
                        w-11
                        h-11
                        rounded-xl
                        flex
                        items-center
                        justify-center
                        ${action.bgClass}
                        ${action.hoverClass}
                        transition-all
                        duration-300
                        group-hover:scale-105
                        group-hover:shadow-lg
                      `}
                  >
                    <Icon
                      className={`
                          w-5
                          h-5
                          ${action.iconClass}
                          group-hover:text-white
                          transition-colors
                          duration-300
                        `}
                    />
                  </div>

                  <div className="min-w-0 flex-1">
                    <div
                      className="
                          flex
                          items-center
                          justify-between
                          gap-2
                        "
                    >
                      <span
                        className="
                            font-semibold
                            text-sm
                          "
                        style={{
                          color: "var(--text-primary)",
                        }}
                      >
                        {action.title}
                      </span>

                      <ArrowUpRight
                        className="
                            w-4
                            h-4
                            text-slate-400
                            opacity-0
                            -translate-x-1
                            translate-y-1
                            group-hover:opacity-100
                            group-hover:translate-x-0
                            group-hover:translate-y-0
                            transition-all
                            duration-300
                          "
                      />
                    </div>

                    <p
                      className="
                          text-xs
                          mt-1
                          truncate
                        "
                      style={{
                        color: "var(--text-secondary)",
                      }}
                    >
                      {action.description}
                    </p>
                  </div>
                </button>
              );
            })}
          </div>
        </section>

        {/* ------------------------------------------------------------------ */}
        {/* MANAGEMENT WORKSPACE                                               */}
        {/* ------------------------------------------------------------------ */}

        <section
          id="tour-approval-board"
          className="
            mx-auto
            max-w-[1600px]
          "
        >
          {/* Section heading */}

          <div
            className="
              flex
              flex-col
              lg:flex-row
              lg:items-end
              lg:justify-between
              gap-4
              mb-5
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
                <h2
                  className="
                    text-xl
                    sm:text-2xl
                    font-bold
                    tracking-tight
                  "
                  style={{
                    color: "var(--text-primary)",
                  }}
                >
                  Management
                </h2>

                {pendingCount > 0 && (
                  <span
                    className="
                      px-2
                      py-0.5
                      rounded-full
                      bg-amber-500/10
                      text-amber-500
                      text-[10px]
                      font-bold
                    "
                  >
                    {pendingCount} pending
                  </span>
                )}
              </div>

              <p
                className="
                  mt-1
                  text-sm
                "
                style={{
                  color: "var(--text-secondary)",
                }}
              >
                Review and manage registered management accounts.
              </p>
            </div>

            <button
              type="button"
              onClick={() => setIsAddModalOpen(true)}
              className="
                self-start
                lg:self-auto
                flex
                items-center
                gap-2
                px-4
                py-2.5
                rounded-xl
                border
                text-sm
                font-semibold
                transition-all
                hover:bg-indigo-500/10
                hover:border-indigo-500/30
              "
              style={{
                borderColor: "var(--border-primary)",
                color: "var(--text-primary)",
                backgroundColor: "var(--bg-card)",
              }}
            >
              <UserPlus className="w-4 h-4" />
              Add management
            </button>
          </div>

          {/* Main workspace */}

          <div
            className="
              overflow-hidden
              rounded-2xl
              border
              shadow-sm
            "
            style={{
              backgroundColor: "var(--bg-card)",
              borderColor: "var(--border-primary)",
            }}
          >
            {/* Tabs */}

            <div
              className="
                px-3
                sm:px-5
                pt-3
                border-b
              "
              style={{
                borderColor: "var(--border-primary)",
              }}
            >
              <UserListTabs
                activeTab={activeTab}
                allUsersCount={allUsers.length}
                pendingCount={pendingCount}
                approvedCount={approvedCount}
                suspendedCount={suspendedCount}
                onTabChange={setActiveTab}
              />
            </div>

            {/* Toolbar */}

            <div
              className="
                p-3
                sm:p-4
                flex
                flex-col
                md:flex-row
                gap-3
                md:items-center
                md:justify-between
              "
            >
              {/* Search */}

              <div
                className="
                  relative
                  w-full
                  md:max-w-md
                "
              >
                <Search
                  className="
                    absolute
                    left-3.5
                    top-1/2
                    -translate-y-1/2
                    w-4
                    h-4
                    text-slate-400
                  "
                />

                <input
                  type="text"
                  value={searchQuery}
                  onChange={(e) => setSearchQuery(e.target.value)}
                  placeholder="Search management, email or college..."
                  className="
                    w-full
                    h-10
                    pl-10
                    pr-10
                    rounded-xl
                    border
                    bg-transparent
                    text-sm
                    outline-none
                    transition-all
                    focus:ring-2
                    focus:ring-indigo-500/20
                    focus:border-indigo-500/50
                  "
                  style={{
                    borderColor: "var(--border-primary)",
                    color: "var(--text-primary)",
                  }}
                />

                {searchQuery && (
                  <button
                    type="button"
                    onClick={() => setSearchQuery("")}
                    className="
                      absolute
                      right-3
                      top-1/2
                      -translate-y-1/2
                      text-slate-400
                      hover:text-slate-600
                    "
                  >
                    <X className="w-4 h-4" />
                  </button>
                )}
              </div>

              {/* Filter */}

              <button
                type="button"
                onClick={() => setShowFilters((v) => !v)}
                className={`
                  inline-flex
                  items-center
                  justify-center
                  gap-2
                  h-10
                  px-3.5
                  rounded-xl
                  border
                  text-sm
                  font-medium
                  transition-all
                  ${
                    showFilters
                      ? "bg-indigo-500/10 border-indigo-500/30 text-indigo-500"
                      : ""
                  }
                `}
                style={{
                  borderColor: showFilters
                    ? undefined
                    : "var(--border-primary)",
                  color: showFilters ? undefined : "var(--text-secondary)",
                  backgroundColor: showFilters
                    ? undefined
                    : "var(--bg-tertiary)",
                }}
              >
                <Filter className="w-4 h-4" />
                Filters
                <ChevronDown
                  className={`
                    w-3.5
                    h-3.5
                    transition-transform
                    ${showFilters ? "rotate-180" : ""}
                  `}
                />
              </button>
            </div>

            {/* Optional filter panel */}

            {showFilters && (
              <div
                className="
                  mx-3
                  sm:mx-4
                  mb-4
                  p-4
                  rounded-xl
                  border
                  grid
                  grid-cols-1
                  sm:grid-cols-3
                  gap-3
                  animate-in
                  fade-in
                  slide-in-from-top-2
                  duration-200
                "
                style={{
                  borderColor: "var(--border-primary)",
                  backgroundColor: "var(--bg-tertiary)",
                }}
              >
                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      mb-1.5
                    "
                    style={{
                      color: "var(--text-secondary)",
                    }}
                  >
                    Current view
                  </label>

                  <div
                    className="
                      h-9
                      flex
                      items-center
                      px-3
                      rounded-lg
                      text-sm
                    "
                    style={{
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {activeTab === "all" ? "All management" : activeTab}
                  </div>
                </div>

                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      mb-1.5
                    "
                    style={{
                      color: "var(--text-secondary)",
                    }}
                  >
                    Results
                  </label>

                  <div
                    className="
                      h-9
                      flex
                      items-center
                      px-3
                      rounded-lg
                      text-sm
                    "
                    style={{
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {filteredUsers.length} users
                  </div>
                </div>

                <div>
                  <label
                    className="
                      block
                      text-[11px]
                      font-semibold
                      uppercase
                      tracking-wider
                      mb-1.5
                    "
                    style={{
                      color: "var(--text-secondary)",
                    }}
                  >
                    Approval status
                  </label>

                  <div
                    className="
                      h-9
                      flex
                      items-center
                      px-3
                      rounded-lg
                      text-sm
                    "
                    style={{
                      backgroundColor: "var(--bg-card)",
                      color: "var(--text-primary)",
                    }}
                  >
                    {isApprovalsEnabled() ? "Enabled" : "Disabled"}
                  </div>
                </div>
              </div>
            )}

            {/* Bulk actions */}

            {pendingCount >= 1 &&
              (activeTab === "all" || activeTab === "pending") &&
              pendingOnPage.length > 0 && (
                <div className="px-3 sm:px-4 pb-3">
                  <BulkActionsBar
                    pendingOnPage={pendingOnPage}
                    selectedUsers={selectedUsers}
                    allPendingSelected={allPendingSelected}
                    isBulkApproving={isBulkApproving}
                    onSelectAll={handleSelectAll}
                    onBulkApprove={handleBulkApprove}
                  />
                </div>
              )}

            {/* Content */}

            {fetchError ? (
              <div className="p-5">
                <ErrorState error={fetchError} />
              </div>
            ) : filteredUsers.length === 0 ? (
              <div className="p-5">
                <EmptyState activeTab={activeTab} />
              </div>
            ) : (
              <div
                ref={scrollContainerRef}
                className="
                  px-3
                  sm:px-4
                  pb-4
                  space-y-3
                "
              >
                {paginatedUsers.map((userData, index) => (
                  <div
                    key={userData.id}
                    className="
                        animate-in
                        fade-in
                        slide-in-from-bottom-2
                        duration-300
                      "
                    style={{
                      animationDelay: `${index * 35}ms`,
                    }}
                  >
                    <UserCard
                      userData={userData}
                      isSelected={selectedUsers.has(userData.id)}
                      isPending={userData.status === "pending"}
                      showCheckbox={pendingCount >= 1}
                      isApproving={isApproving}
                      isDenying={isDenying}
                      isDeleteLoading={isDeleteLoading}
                      roleColors={roleColors}
                      isFirst={index === 0}
                      onToggleSelection={toggleUserSelection}
                      onStatusChange={handleStatusChange}
                      onRoleChange={handleRoleChange}
                      onDelete={handleOpenDeleteModal}
                    />
                  </div>
                ))}
              </div>
            )}

            {/* Footer */}

            {filteredUsers.length > 0 && (
              <div
                className="
                  border-t
                  px-4
                  sm:px-5
                  py-3
                "
                style={{
                  borderColor: "var(--border-primary)",
                }}
              >
                <PaginationControls
                  currentPage={currentPage}
                  totalPages={totalPages}
                  startIndex={startIndex}
                  endIndex={Math.min(endIndex, filteredUsers.length)}
                  totalItems={filteredUsers.length}
                  onPageChange={setCurrentPage}
                />
              </div>
            )}
          </div>
        </section>
      </main>

      {/* -------------------------------------------------------------------- */}
      {/* ADD MANAGEMENT MODAL                                                */}
      {/* -------------------------------------------------------------------- */}

      <AddManagementModal
        isOpen={isAddModalOpen}
        onClose={() => setIsAddModalOpen(false)}
        isDark={isDark}
      />
    </>
  );
};

/* ========================================================================== */
/* KPI CARD                                                                   */
/* ========================================================================== */

const KpiCard = ({
  label,
  value,
  icon: Icon,
  iconClass,
  iconBg,
  highlight = false,
}) => {
  return (
    <div
      className="
        group
        relative
        overflow-hidden
        rounded-2xl
        border
        p-4
        sm:p-5
        transition-all
        duration-300
        hover:-translate-y-0.5
        hover:shadow-lg
      "
      style={{
        backgroundColor: "var(--bg-card)",
        borderColor: highlight
          ? "rgba(245,158,11,0.35)"
          : "var(--border-primary)",
      }}
    >
      <div
        className="
          flex
          items-start
          justify-between
          gap-3
        "
      >
        <div>
          <p
            className="
              text-[11px]
              sm:text-xs
              font-semibold
              uppercase
              tracking-wider
            "
            style={{
              color: "var(--text-secondary)",
            }}
          >
            {label}
          </p>

          <p
            className="
              mt-2
              text-2xl
              sm:text-3xl
              font-bold
              tracking-tight
            "
            style={{
              color: "var(--text-primary)",
            }}
          >
            {value}
          </p>
        </div>

        <div
          className={`
            w-10
            h-10
            rounded-xl
            flex
            items-center
            justify-center
            ${iconBg}
            ${iconClass}
            transition-transform
            duration-300
            group-hover:scale-110
          `}
        >
          <Icon className="w-5 h-5" />
        </div>
      </div>

      {highlight && (
        <div
          className="
            absolute
            bottom-0
            left-0
            h-0.5
            w-full
            bg-amber-500
          "
        />
      )}
    </div>
  );
};

export default OwnersDashboard;
