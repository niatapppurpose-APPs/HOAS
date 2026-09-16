import { useState, useEffect, useRef, useMemo } from "react";
import {
  listStudents,
  deleteUserAccount,
} from "../../../firebase/cloudFunctions";

import { useOutletContext, useLocation } from "react-router-dom";

import Header from "../../../components/OwnerServices/header";
import Avatar from "../../../components/OwnerServices/Avatar";
import EmptyState from "../../../components/OwnerServices/EmptyState";

import { useToast } from "../../../components/Toast";
import { useTheme } from "../../../context/ThemeContext";

import { HashLoader } from "react-spinners";

import {
  Mail,
  Search,
  X,
  RefreshCw,
  UserMinus,
  Building2,
  Wifi,
  WifiOff,
  ShieldCheck,
} from "lucide-react";

import NoDataLight from "../../../assets/No-Data.avif";
import NoDataDark from "../../../assets/NoDataDark.webp";

const Students = () => {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const location = useLocation();

  const toast = useToast();
  const { isDark } = useTheme();

  const searchInputRef = useRef(null);

  const [students, setStudents] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState(null);

  const [searchListStudent, setSearchListStudent] = useState("");
  const [searchOpen, setSearchOpen] = useState(false);
  const [removingId, setRemovingId] = useState(null);

  const contextInfo = {
    collegeName: "Professional Institution",
    collegeLocation: "Bangalore, Karnataka",
    hostelBlock: "Premium Hostel – Block A",
    hostelId: "HST-2024-001",
  };

  /* -------------------------------------------------------------------------- */
  /* Fetch Students                                                             */
  /* -------------------------------------------------------------------------- */

  const fetchStudents = async () => {
    try {
      setLoading(true);
      setError(null);

      const { students } = await listStudents();

      const studentList = (students || []).map((student) => ({
        id: student._id,
        uid: student.uid,

        fullName: student.name,
        displayName: student.name,

        email: student.email,

        isOnline: student.isOnline,

        photoURL: student.avatarUrl,

        hostelBlock: student.hostelBlock,
        hostelName: student.hostelId?.name,

        collegeName: student.collegeId?.name,
      }));

      setStudents(studentList);
    } catch (err) {
      console.error("Failed to load students:", err);
      setError(err.message || "Failed to load students");
    } finally {
      setLoading(false);
    }
  };

  useEffect(() => {
    fetchStudents();
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Restore Page State                                                         */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    if (location.state?.searchText !== undefined) {
      setSearchListStudent(location.state.searchText);
      setSearchOpen(Boolean(location.state.searchText));

      if (location.state.scrollPosition) {
        setTimeout(() => {
          window.scrollTo(0, location.state.scrollPosition);

          window.history.replaceState({}, document.title);
        }, 100);
      }
    }

    sessionStorage.removeItem("studentsPageState");
  }, [location.state]);

  /* -------------------------------------------------------------------------- */
  /* Realtime Updates                                                           */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleRealtimeStudentUpdate = (event) => {
      const updatedUser = event.detail?.user;

      if (!updatedUser?.uid || updatedUser.role !== "student") return;

      setStudents((current) =>
        current.map((student) =>
          student.uid === updatedUser.uid
            ? {
                ...student,

                isOnline: updatedUser.isOnline,

                fullName: updatedUser.name || student.fullName,

                displayName: updatedUser.name || student.displayName,

                email: updatedUser.email || student.email,
              }
            : student,
        ),
      );
    };

    window.addEventListener("hoas:user-updated", handleRealtimeStudentUpdate);

    return () => {
      window.removeEventListener(
        "hoas:user-updated",
        handleRealtimeStudentUpdate,
      );
    };
  }, []);

  /* -------------------------------------------------------------------------- */
  /* Search                                                                     */
  /* -------------------------------------------------------------------------- */

  const filteredStudents = useMemo(() => {
    const query = searchListStudent.trim().toLowerCase();

    if (!query) return students;

    return students.filter((student) => {
      return (
        student.fullName?.toLowerCase().includes(query) ||
        student.email?.toLowerCase().includes(query) ||
        student.collegeName?.toLowerCase().includes(query) ||
        student.hostelBlock?.toLowerCase().includes(query)
      );
    });
  }, [students, searchListStudent]);

  const clearSearch = () => {
    setSearchListStudent("");

    setTimeout(() => {
      searchInputRef.current?.focus();
    }, 0);
  };

  const handleSearchChange = (event) => {
    setSearchListStudent(event.target.value);
  };

  /* -------------------------------------------------------------------------- */
  /* Keyboard Search                                                            */
  /* -------------------------------------------------------------------------- */

  useEffect(() => {
    const handleKeyboard = (event) => {
      if ((event.ctrlKey || event.metaKey) && event.key === "k") {
        event.preventDefault();

        setSearchOpen(true);

        setTimeout(() => {
          searchInputRef.current?.focus();
        }, 50);
      }

      if (event.key === "Escape" && searchOpen) {
        setSearchOpen(false);
        searchInputRef.current?.blur();
      }
    };

    window.addEventListener("keydown", handleKeyboard);

    return () => {
      window.removeEventListener("keydown", handleKeyboard);
    };
  }, [searchOpen]);

  /* -------------------------------------------------------------------------- */
  /* Refresh                                                                    */
  /* -------------------------------------------------------------------------- */

  const handleRefresh = async () => {
    await fetchStudents();
  };

  /* -------------------------------------------------------------------------- */
  /* Save Page State                                                            */
  /* -------------------------------------------------------------------------- */

  const savePageState = () => {
    const state = {
      searchText: searchListStudent,
      scrollPosition: window.scrollY,
      returnPath: "/OwnersDashboard/students",
    };

    sessionStorage.setItem("studentsPageState", JSON.stringify(state));

    return state;
  };

  /* -------------------------------------------------------------------------- */
  /* Remove Student                                                             */
  /* -------------------------------------------------------------------------- */

  const handleRemove = async (student) => {
    const confirmed = await toast.confirm(
      `Are you sure you want to remove ${student.fullName || "this student"}?`,
      null,
      {
        confirmText: "Yes, Remove",
        cancelText: "Cancel",
      },
    );

    if (!confirmed) return;

    setRemovingId(student.id);

    try {
      await deleteUserAccount(student.id);

      setStudents((current) =>
        current.filter((item) => item.id !== student.id),
      );

      toast.success("Student removed successfully");
    } catch (err) {
      console.error("Failed to delete student:", err);

      toast.error(err.message || "Failed to remove student");
    } finally {
      setRemovingId(null);
    }
  };

  /* -------------------------------------------------------------------------- */
  /* Statistics                                                                 */
  /* -------------------------------------------------------------------------- */

  const totalStudents = students.length;

  const onlineStudents = students.filter((student) => student.isOnline).length;

  /* -------------------------------------------------------------------------- */
  /* Loading                                                                    */
  /* -------------------------------------------------------------------------- */

  if (loading) {
    return (
      <>
        <Header
          title="Hostel Students"
          isCollapsed={isCollapsed}
          setIsCollapsed={setIsCollapsed}
          onProfileClick={savePageState}
        />

        <main className="pt-24 min-h-screen px-4 sm:px-6 lg:px-8">
          <div className="min-h-[65vh] flex items-center justify-center">
            <div className="flex flex-col items-center gap-5">
              <HashLoader loading={loading} color="#6366f1" size={65} />

              <p
                className="text-sm font-medium"
                style={{
                  color: "var(--text-muted)",
                }}
              >
                Loading students...
              </p>
            </div>
          </div>
        </main>
      </>
    );
  }

  /* -------------------------------------------------------------------------- */
  /* Main                                                                       */
  /* -------------------------------------------------------------------------- */

  return (
    <>
      <Header
        title="Hostel Students"
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
        <div className="max-w-[1500px] mx-auto ">
          {/* ================================================================== */}
          {/* DIRECTORY HEADER                                                    */}
          {/* ================================================================== */}

          <section className="sticky
      top-14
      z-30
      overflow-hidden
      border
      p-5
      sm:p-7
      lg:p-9
      bg-white border-none"
       style={{
              background:
                "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-secondary) 10%)",
              borderColor: "var(--border-primary)",
              boxShadow: "0 12px 35px rgba(0, 0, 0, 0.15)",
            }}
            >
              {/* Decorative Background */}

              <div
                className="
        absolute
        -top-24
        -right-24
        w-56
        h-56
        rounded-full
        bg-indigo-500/10
        blur-3xl
        pointer-events-none
      "
              />

              <div
                className="
        absolute
        -bottom-28
        -left-20
        w-52
        h-52
        rounded-full
        bg-cyan-500/10
        blur-3xl
        pointer-events-none
      "
              />
              <div className="relative z-10">
                {/* ============================================================ */}
                {/* TOP CONTENT                                                   */}
                {/* ============================================================ */}

                <div
                  className="
                    flex
                    flex-col
                    lg:flex-row
                    lg:items-center
                    lg:justify-between
                    gap-5
                  "
                >
                  {/* Title */}

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
                        text-[10px]
                        sm:text-[11px]
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
                        Student Management
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
                            {totalStudents}
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
                            {onlineStudents}
                          </span>
                        </div>
                      </div>
                    </div>
                    <h1
                      className="
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
                      Student Directory
                    </h1>

                    <p
                      className="
                        mt-1
                        text-xs
                        sm:text-sm
                        max-w-2xl
                      "
                      style={{
                        color: "var(--text-muted)",
                      }}
                    >
                      Manage hostel students, monitor availability and keep your
                      accommodation organized.
                    </p>
                  </div>

                  {/* ========================================================== */}
                  {/* STATISTICS                                                   */}
                  {/* ========================================================== */}

                  <div
                    className="
                    hidden
                      flex
                      items-center
                      gap-2
                      sm:gap-3
                      shrink-0
                      lg:flex
                    "
                  >
                    {/* Total */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        px-3
                        py-2
                        sm:px-4
                        sm:py-3
                        rounded-xl
                        border
                      "
                      style={{
                        backgroundColor: "var(--bg-tertiary)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      <div>
                        <p
                          className="
                            text-center
                            sm:text-xl
                            font-black
                            leading-none
                          "
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {totalStudents}
                        </p>

                        <p
                          className="
                            mt-1
                            text-[8px]
                            sm:text-[10px]
                            uppercase
                            tracking-wider
                            font-bold
                          "
                          style={{
                            color: "var(--text-muted)",
                          }}
                        >
                          Students
                        </p>
                      </div>
                    </div>

                    {/* Online */}

                    <div
                      className="
                        flex
                        items-center
                        gap-2
                        px-3
                        py-2
                        sm:px-4
                        sm:py-3
                        rounded-xl
                        border
                      "
                      style={{
                        backgroundColor: "rgba(34,197,94,0.08)",
                        borderColor: "rgba(34,197,94,0.2)",
                      }}
                    >
                      <div>
                        <p
                          className="
                            text-center
                            sm:text-xl
                            font-black
                            leading-none
                            text-green-600
                          "
                        >
                          {onlineStudents}
                        </p>

                        <p
                          className="
                            mt-1
                            text-[8px]
                            sm:text-[10px]
                            uppercase
                            tracking-wider
                            font-bold
                            text-green-600
                          "
                        >
                          Online
                        </p>
                      </div>
                    </div>
                  </div>
                </div>

                {/* ============================================================ */}
                {/* SEARCH                                                         */}
                {/* ============================================================ */}

                <div className="mt-5 sm:mt-6">
                  <div
                    className="
                      flex
                      flex-row
                      gap-2
                      sm:gap-3
                    "
                  >
                    {/* Search */}

                    <div className="relative flex-1 min-w-0">
                      <Search
                        className="
                          absolute
                          left-3
                          sm:left-4
                          top-1/2
                          -translate-y-1/2
                          w-4
                          h-4
                          sm:w-5
                          sm:h-5
                          pointer-events-none
                        "
                        style={{
                          color: "var(--text-muted)",
                        }}
                      />

                      <input
                        ref={searchInputRef}
                        type="search"
                        value={searchListStudent}
                        onChange={handleSearchChange}
                        onFocus={() => setSearchOpen(true)}
                        placeholder="Search students by name, email, hostel or college..."
                        className="
                          w-full
                          h-11
                          sm:h-12
                          pl-10
                          sm:pl-12
                          pr-10
                          sm:pr-20
                          rounded-xl
                          border
                          outline-none
                          text-xs
                          sm:text-sm
                          transition-all
                          duration-200
                          focus:ring-4
                          focus:ring-indigo-500/10
                          focus:border-indigo-500
                        "
                        style={{
                          backgroundColor: "var(--bg-input)",
                          borderColor: searchOpen
                            ? "rgba(99,102,241,0.6)"
                            : "var(--border-primary)",
                          color: "var(--text-primary)",
                        }}
                      />

                      {/* Clear */}

                      {searchListStudent && (
                        <button
                          type="button"
                          onClick={clearSearch}
                          aria-label="Clear search"
                          className="
                            absolute
                            right-2
                            sm:right-3
                            top-1/2
                            -translate-y-1/2
                            w-7
                            h-7
                            rounded-lg
                            flex
                            items-center
                            justify-center
                            hover:bg-red-500/10
                          "
                        >
                          <X className="w-4 h-4 text-red-500" />
                        </button>
                      )}

                      {/* Shortcut */}

                      {!searchListStudent && (
                        <div
                          className="
                            hidden
                            sm:flex
                            absolute
                            right-3
                            top-1/2
                            -translate-y-1/2
                            items-center
                            gap-1
                          "
                        >
                          <kbd
                            className="
                              px-2
                              py-1
                              rounded-md
                              border
                              text-[10px]
                              font-semibold
                            "
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              color: "var(--text-muted)",
                            }}
                          >
                            Ctrl
                          </kbd>

                          <kbd
                            className="
                              px-2
                              py-1
                              rounded-md
                              border
                              text-[10px]
                              font-semibold
                            "
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                              color: "var(--text-muted)",
                            }}
                          >
                            K
                          </kbd>
                        </div>
                      )}
                    </div>

                    {/* Refresh */}

                    <button
                      type="button"
                      onClick={handleRefresh}
                      disabled={loading}
                      aria-label="Refresh students"
                      title="Refresh students"
                      className="
                        h-11
                        sm:h-12
                        w-11
                        sm:w-auto
                        sm:px-4
                        rounded-xl
                        border
                        flex
                        items-center
                        justify-center
                        gap-2
                        font-semibold
                        text-sm
                        transition-all
                        hover:-translate-y-0.5
                        hover:shadow-lg
                        active:scale-95
                        disabled:opacity-50
                        shrink-0
                      "
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    >
                      <RefreshCw
                        className={`w-4 h-4 ${loading ? "animate-spin" : ""}`}
                      />

                      <span className="hidden sm:inline">Refresh</span>
                    </button>
                  </div>

                  {/* Search info */}

                  {searchListStudent.trim() && (
                    <div
                      className="
                        mt-3
                        flex
                        flex-wrap
                        items-center
                        justify-between
                        gap-2
                        text-xs
                      "
                      style={{
                        color: "var(--text-muted)",
                      }}
                    >
                      <span>
                        Showing{" "}
                        <strong
                          style={{
                            color: "var(--text-primary)",
                          }}
                        >
                          {filteredStudents.length}
                        </strong>{" "}
                        result
                        {filteredStudents.length !== 1 ? "s" : ""}
                      </span>

                      <button
                        onClick={clearSearch}
                        className="
                          font-semibold
                          text-indigo-500
                          hover:text-indigo-600
                        "
                      >
                        Clear search
                      </button>
                    </div>
                  )}
                </div>
              </div>
         
          </section>

          {/* ================================================================== */}
          {/* ERROR                                                              */}
          {/* ================================================================== */}

          {error && (
            <div
              className="
                mb-6
                rounded-2xl
                border
                p-4
                flex
                flex-col
                sm:flex-row
                sm:items-center
                justify-between
                gap-4
              "
              style={{
                backgroundColor: "rgba(239,68,68,0.06)",
                borderColor: "rgba(239,68,68,0.2)",
              }}
            >
              <div>
                <p className="font-bold text-sm text-red-500">
                  Unable to load students
                </p>

                <p className="mt-1 text-xs text-red-500/70">{error}</p>
              </div>

              <button
                onClick={handleRefresh}
                className="
                  px-4
                  py-2
                  rounded-lg
                  bg-red-500
                  text-white
                  text-xs
                  font-bold
                "
              >
                Try Again
              </button>
            </div>
          )}

          {/* ================================================================== */}
          {/* SEARCH EMPTY                                                       */}
          {/* ================================================================== */}

          {!error &&
            students.length > 0 &&
            searchListStudent.trim() &&
            filteredStudents.length === 0 && (
              <div className="py-4">
                <EmptyState
                  title={`No matches for "${searchListStudent}"`}
                  description="Try another name, email, college or hostel name."
                  ctaLabel="Clear search"
                  onCta={clearSearch}
                  videoSrc={!isDark ? NoDataLight : NoDataDark}
                  className="max-w-4xl mx-auto"
                />
              </div>
            )}

          {/* ================================================================== */}
          {/* NO STUDENTS                                                        */}
          {/* ================================================================== */}

          {!error && students.length === 0 && (
            <div className="py-4">
              <EmptyState
                title="No Students Assigned"
                subtitle="This hostel is awaiting student assignments"
                description={`No students have been linked to ${contextInfo.hostelBlock} yet. Students will appear here once they are assigned.`}
                ctaLabel="Open Search"
                onCta={() => {
                  setSearchOpen(true);

                  setTimeout(() => {
                    searchInputRef.current?.focus();
                  }, 50);
                }}
                videoSrc={!isDark ? NoDataLight : NoDataDark}
                className="max-w-4xl mx-auto"
              />
            </div>
          )}

          {/* ================================================================== */}
          {/* STUDENT LIST                                                       */}
          {/* ================================================================== */}

          {!error && filteredStudents.length > 0 && (
            <section>
              {/* ============================================================ */}
              {/* CARDS                                                          */}
              {/* ============================================================ */}

              <div className="space-y-3 px-3 pt-5">
                {filteredStudents.map((student) => {
                  const name =
                    student.fullName ||
                    student.displayName ||
                    "Unknown Student";

                  const college =
                    student.collegeName || contextInfo.collegeName;

                  const hostel = student.hostelBlock || contextInfo.hostelBlock;

                  const isRemoving = removingId === student.id;

                  return (
                    <article
                      key={student.id}
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
                        hover:shadow-xl
                      "
                      style={{
                        backgroundColor: "var(--bg-card)",
                        borderColor: "var(--border-primary)",
                      }}
                    >
                      {/* ================================================== */}
                      {/* ONLINE LEFT ACCENT                                  */}
                      {/* ================================================== */}

                      <div
                        className={`
                          absolute
                          left-0
                          top-0
                          bottom-0
                          w-1
                          ${student.isOnline ? "bg-green-500" : "bg-slate-400"}
                        `}
                      />

                      {/* ================================================== */}
                      {/* CARD CONTENT                                          */}
                      {/* ================================================== */}

                      <div
                        className="
                          flex
                          flex-col
                          lg:flex-row
                          lg:items-center
                          gap-4
                          lg:gap-6
                        "
                      >
                        {/* ================================================== */}
                        {/* PROFILE                                               */}
                        {/* ================================================== */}

                        <div
                          className="
                            flex
                            items-center
                            gap-3
                            sm:gap-4
                            min-w-0
                            flex-1
                          "
                        >
                          {/* Avatar */}

                          <div className="relative shrink-0">
                            <Avatar
                              image={student.photoURL}
                              name={name}
                              size="md"
                            />

                            {/* Online indicator */}

                            <span
                              className={`
                                absolute
                                right-0
                                bottom-0
                                w-3
                                h-3
                                rounded-full
                                border-2
                                ${
                                  student.isOnline
                                    ? "bg-green-500"
                                    : "bg-slate-400"
                                }
                              `}
                              style={{
                                borderColor: "var(--bg-card)",
                              }}
                            />
                          </div>

                          {/* Name */}

                          <div className="min-w-0 flex-1">
                            <div
                              className="
                                flex
                                flex-wrap
                                items-center
                                gap-2
                              "
                            >
                              <h3
                                className="
                                  max-w-full
                                  sm:max-w-[320px]
                                  lg:max-w-[400px]
                                  truncate
                                  text-sm
                                  sm:text-base
                                  font-bold
                                "
                                style={{
                                  color: "var(--text-primary)",
                                }}
                                title={name}
                              >
                                {name}
                              </h3>

                              <span
                                className="
                                  shrink-0
                                  inline-flex
                                  items-center
                                  px-2
                                  py-1
                                  rounded-md
                                  text-[9px]
                                  sm:text-[10px]
                                  font-black
                                  uppercase
                                  tracking-wide
                                  bg-blue-500/10
                                  text-blue-500
                                  border
                                  border-blue-500/20
                                "
                              >
                                Student
                              </span>
                            </div>

                            {/* Email */}

                            {student.email && (
                              <div
                                className="
                                  mt-1.5
                                  flex
                                  items-center
                                  gap-1.5
                                  min-w-0
                                  text-xs
                                "
                                style={{
                                  color: "var(--text-muted)",
                                }}
                              >
                                <Mail
                                  className="
                                    w-3.5
                                    h-3.5
                                    shrink-0
                                  "
                                />

                                <span
                                  className="
                                    truncate
                                  "
                                  title={student.email}
                                >
                                  {student.email}
                                </span>
                              </div>
                            )}
                          </div>
                        </div>

                        {/* ================================================== */}
                        {/* DETAILS                                               */}
                        {/* ================================================== */}

                        <div
                          className="
                            grid
                            grid-cols-1
                            sm:grid-cols-2
                            lg:flex
                            lg:items-center
                            gap-2
                            sm:gap-3
                            lg:gap-4
                            w-full
                            lg:w-auto
                          "
                        >
                          {/* College */}

                          <div
                            className="
                              min-w-0
                              px-3
                              py-2.5
                              rounded-xl
                              border
                            "
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                            }}
                          >
                            <p
                              className="
                                text-[9px]
                                uppercase
                                tracking-widest
                                font-bold
                              "
                              style={{
                                color: "var(--text-muted)",
                              }}
                            >
                              College
                            </p>

                            <div
                              className="
                                mt-1
                                flex
                                items-center
                                gap-1.5
                              "
                            >
                              <Building2
                                className="
                                  w-3.5
                                  h-3.5
                                  shrink-0
                                  text-purple-500
                                "
                              />

                              <span
                                className="
                                  text-xs
                                  font-semibold
                                  truncate
                                  max-w-[260px]
                                "
                                style={{
                                  color: "var(--text-primary)",
                                }}
                                title={college}
                              >
                                {college}
                              </span>
                            </div>
                          </div>

                          {/* Hostel */}

                          <div
                            className="
                              min-w-0
                              px-3
                              py-2.5
                              rounded-xl
                              border
                            "
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "var(--border-primary)",
                            }}
                          >
                            <p
                              className="
                                text-[9px]
                                uppercase
                                tracking-widest
                                font-bold
                              "
                              style={{
                                color: "var(--text-muted)",
                              }}
                            >
                              Hostel
                            </p>

                            <div
                              className="
                                mt-1
                                flex
                                items-center
                                gap-1.5
                              "
                            >
                              <span
                                className="
                                  w-2
                                  h-2
                                  rounded-full
                                  bg-indigo-500
                                  shrink-0
                                "
                              />

                              <span
                                className="
                                  text-xs
                                  font-semibold
                                  truncate
                                  max-w-[260px]
                                "
                                style={{
                                  color: "var(--text-primary)",
                                }}
                                title={hostel}
                              >
                                {hostel}
                              </span>
                            </div>
                          </div>

                          {/* Status */}

                          <div
                            className={`
                              inline-flex
                              items-center
                              justify-center
                              sm:justify-start
                              gap-2
                              px-3
                              py-2.5
                              rounded-xl
                              text-xs
                              font-bold
                              ${
                                student.isOnline
                                  ? "bg-green-500/10 text-green-600"
                                  : "bg-slate-500/10 text-slate-500"
                              }
                            `}
                          >
                            {student.isOnline ? (
                              <>
                                <Wifi className="w-3.5 h-3.5" />
                                Online
                              </>
                            ) : (
                              <>
                                <WifiOff className="w-3.5 h-3.5" />
                                Offline
                              </>
                            )}
                          </div>
                        </div>

                        {/* ================================================== */}
                        {/* ACTION                                                */}
                        {/* ================================================== */}

                        <div
                          className="
                            w-full
                            lg:w-auto
                            shrink-0
                            pt-1
                            lg:pt-0
                          "
                        >
                          <button
                            type="button"
                            disabled={isRemoving}
                            onClick={() => handleRemove(student)}
                            className="
                              w-full
                              lg:w-auto
                              min-w-[120px]
                              h-10
                              px-4
                              rounded-xl
                              border
                              flex
                              items-center
                              justify-center
                              gap-2
                              text-xs
                              font-bold
                              transition-all
                              duration-200
                              hover:bg-red-500
                              hover:text-white
                              hover:border-red-500
                              active:scale-95
                              disabled:opacity-50
                              disabled:pointer-events-none
                            "
                            style={{
                              backgroundColor: "var(--bg-tertiary)",
                              borderColor: "rgba(239,68,68,0.25)",
                              color: "#ef4444",
                            }}
                          >
                            {isRemoving ? (
                              <>
                                <RefreshCw
                                  className="
                                    w-4
                                    h-4
                                    animate-spin
                                  "
                                />
                                Removing...
                              </>
                            ) : (
                              <>
                                <UserMinus className="w-4 h-4" />

                                <span>Remove</span>
                              </>
                            )}
                          </button>
                        </div>
                      </div>
                    </article>
                  );
                })}
              </div>
            </section>
          )}
        </div>
      </main>
    </>
  );
};

export default Students;
