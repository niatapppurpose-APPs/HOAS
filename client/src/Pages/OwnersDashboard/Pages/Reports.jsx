import { useState, useEffect, useMemo, useCallback } from "react";
import { HashLoader } from "react-spinners";
import { useOutletContext, useLocation } from "react-router-dom";
import Header from "../../../components/OwnerServices/header";
import {
  FileText,
  Download,
  Calendar,
  FileSpreadsheet,
  FileType,
  Search,
  X,
  CheckSquare,
  Square,
  BarChart3,
  GraduationCap,
  Shield,
  Building2,
  CheckCircle2,
  ArrowDownToLine,
} from "lucide-react";

import {
  saveBlob,
  generateTimestamp,
  generatePdfReport,
  generateExcelReport,
} from "../../../../src/Pages/OwnersDashboard/utils/reportGenerators";
import { useAuth } from "../../../context/AuthContext";
import { useToast } from "../../../components/Toast";
import * as cloudFunctions from "../../../firebase/cloudFunctions";


/**
 * Generate a PDF report from structured data.
 * @param {object} params
 * @param {string} params.title - Report title
 * @param {string} params.subtitle - e.g. college name
 * @param {object} params.stats - { students, wardens }
 * @param {Array} params.studentsList - array of student objects
 * @param {Array} params.wardensList - array of warden objects
 * @param {string} params.collegeName
 */

// ════════════════════════════════════════════════════════════
//  REPORTS PAGE COMPONENT
// ════════════════════════════════════════════════════════════
export default function Reports() {
  const { isCollapsed, setIsCollapsed } = useOutletContext();
  const location = useLocation();
  const { user, userData } = useAuth();
  const toast = useToast();
  const [downloadingId, setDownloadingId] = useState(null);
  const [downloadingFormat, setDownloadingFormat] = useState(null);
  const [collegeInfo, setCollegeInfo] = useState(null);
  const [stats, setStats] = useState({ students: 0, wardens: 0, colleges: 0 });
  const [loading, setLoading] = useState(true);

  // Raw data from Firestore (used for report generation)
  const [allStudents, setAllStudents] = useState([]);
  const [allWardens, setAllWardens] = useState([]);
  const [collegesList, setCollegesList] = useState([]);

  // Enhanced features
  const [searchQuery, setSearchQuery] = useState("");
  const [selectedFilter, setSelectedFilter] = useState("all");
  const [selectedReports, setSelectedReports] = useState(new Set());
  const [bulkDownloading, setBulkDownloading] = useState(false);
  const [bulkFormat, setBulkFormat] = useState(null);

  // Restore scroll
  useEffect(() => {
    if (location.state?.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, location.state.scrollPosition);
        window.history.replaceState({}, document.title);
      }, 100);
    }
    sessionStorage.removeItem("reportsPageState");
  }, [location.state]);

  // Fetch all data
  useEffect(() => {
    if (!user) return;

    const fetchAdminData = async () => {
      const [studentsRes, wardensRes, collegesRes] = await Promise.all([
        cloudFunctions.listUsers({ role: "student" }),
        cloudFunctions.listUsers({ role: "warden" }),
        cloudFunctions.listUsers({ role: "management" }),
      ]);

      const students = (studentsRes.users || []).map((s) => ({
        id: s._id,
        ...s,
        managementId: s.collegeId?._id || null,
      }));
      const wardens = (wardensRes.users || []).map((w) => ({
        id: w._id,
        ...w,
        managementId: w.collegeId?._id || null,
      }));
      const colleges = (collegesRes.users || []).map((c) => ({
        id: c.collegeId?._id || c._id,
        ...c,
        collegeName: c.collegeId?.name || c.name,
        collegeLogo: c.collegeId?.logoUrl || null,
      }));

      setAllStudents(students);
      setAllWardens(wardens);
      setStats({
        students: students.length,
        wardens: wardens.length,
        colleges: colleges.length,
      });
      setCollegeInfo({
        name: "System Administrator",
        location: "All Colleges",
        id: "ADMIN",
      });

      // Build per-college list (include collegeLogo)
      const list = colleges.map((c) => ({
        id: c.id,
        name: c.collegeName || c.name || c.email,
        location: c.location || "Not specified",
        email: c.email,
        collegeLogo: c.collegeLogo || null,
        studentsCount: students.filter((s) => s.managementId === c.id).length,
        wardensCount: wardens.filter((w) => w.managementId === c.id).length,
      }));
      setCollegesList(list);
    };

    const fetchManagementData = async () => {
      // Backend scopes these lists to the management user's own college
      const [studentsRes, wardensRes] = await Promise.all([
        cloudFunctions.listUsers({ role: "student" }),
        cloudFunctions.listUsers({ role: "warden" }),
      ]);

      const students = (studentsRes.users || []).map((s) => ({
        id: s._id,
        ...s,
      }));
      const wardens = (wardensRes.users || []).map((w) => ({
        id: w._id,
        ...w,
      }));

      setAllStudents(students);
      setAllWardens(wardens);
      setStats({
        students: students.length,
        wardens: wardens.length,
        colleges: 0,
      });
      setCollegeInfo({
        name: userData?.collegeId?.name || userData?.name || userData?.email,
        location: userData?.location || "Not specified",
        id: userData?.uid || user.uid,
      });
      setCollegesList([
        {
          id: user.uid,
          name: userData?.collegeId?.name || userData?.name || userData?.email,
          location: userData?.location || "Not specified",
          email: userData?.email,
          collegeLogo: userData?.collegeId?.logoUrl || null,
          studentsCount: students.length,
          wardensCount: wardens.length,
        },
      ]);
    };

    const fetchUserData = async () => {
      try {
        const role = userData?.role;
        if (role === "admin" || role === "owner") {
          await fetchAdminData();
        } else if (role === "management") {
          await fetchManagementData();
        } else {
          toast.warning("User profile not found.");
        }
      } catch (error) {
        console.error("Error fetching user data:", error);
      } finally {
        setLoading(false);
      }
    };

    fetchUserData();
  }, [user, userData]);

  // ── Build reports list ──
  const reportsData = useMemo(() => {
    const reports = [];
    const now = new Date();

    if (collegeInfo?.id === "ADMIN") {
      // System overview
      reports.push({
        id: "sys-overview",
        name: "System Overview Report",
        description: "Complete system-wide analytics across all institutions.",
        generatedDate: now,
        category: "overview",
        icon: BarChart3,
        gradient: "from-blue-500 to-indigo-600",
        collegeName: "All Colleges",
        students: stats.students,
        wardens: stats.wardens,
        colleges: stats.colleges,
      });

      // Per-college reports
      collegesList.forEach((college, i) => {
        reports.push({
          id: `college-${college.id}`,
          name: college.name,
          description: `Students, wardens, and hostel data for ${college.name}${college.location !== "Not specified" ? ` — ${college.location}` : ""}.`,
          generatedDate: new Date(now.getTime() - (i + 1) * 3600000),
          category: "college",
          icon: Building2,
          collegeLogo: college.collegeLogo || null,
          gradient: [
            "from-emerald-500 to-teal-600",
            "from-purple-500 to-fuchsia-600",
            "from-orange-500 to-amber-600",
            "from-sky-500 to-cyan-600",
            "from-rose-500 to-pink-600",
            "from-violet-500 to-purple-600",
          ][i % 6],
          collegeName: college.name,
          collegeId: college.id,
          students: college.studentsCount,
          wardens: college.wardensCount,
        });
      });
    } else {
      // Management: own college
      collegesList.forEach((college) => {
        reports.push({
          id: `college-${college.id}`,
          name: `${college.name} Report`,
          description: `Detailed report for ${college.name}.`,
          generatedDate: now,
          category: "college",
          icon: Building2,
          collegeLogo: college.collegeLogo || null,
          gradient: "from-blue-500 to-indigo-600",
          collegeName: college.name,
          collegeId: college.id,
          students: college.studentsCount,
          wardens: college.wardensCount,
        });
      });
    }

    return reports;
  }, [collegeInfo, stats, collegesList]);

  // ── Filter & Search ──
  const filteredReports = useMemo(() => {
    let results = reportsData;
    if (selectedFilter !== "all")
      results = results.filter((r) => r.category === selectedFilter);
    if (searchQuery.trim()) {
      const q = searchQuery.toLowerCase();
      results = results.filter(
        (r) =>
          r.name.toLowerCase().includes(q) ||
          r.description.toLowerCase().includes(q) ||
          r.collegeName.toLowerCase().includes(q),
      );
    }
    return results;
  }, [reportsData, selectedFilter, searchQuery]);

  const filterOptions = useMemo(() => {
    const cats = [...new Set(reportsData.map((r) => r.category))];
    const meta = {
      overview: { label: "Overview", icon: BarChart3 },
      college: { label: "Colleges", icon: Building2 },
    };
    return [
      { key: "all", label: "All Reports", icon: FileText },
      ...cats.map((c) => ({
        key: c,
        label: meta[c]?.label || c,
        icon: meta[c]?.icon || FileText,
      })),
    ];
  }, [reportsData]);

  // ── Selection ──
  const toggleSelect = useCallback((id) => {
    setSelectedReports((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  }, []);

  const toggleSelectAll = useCallback(() => {
    setSelectedReports((prev) =>
      prev.size === filteredReports.length
        ? new Set()
        : new Set(filteredReports.map((r) => r.id)),
    );
  }, [filteredReports]);

  const isAllSelected =
    filteredReports.length > 0 &&
    selectedReports.size === filteredReports.length;

  const getReportPayload = useCallback(
    (report) => {
      const mapStudent = (student) => ({
        name: student.name,
        email: student.email,

        status: student.status,

        phone: student.phone || student.phoneNumber,

        phoneNumber: student.phoneNumber,

        studentId: student.studentId,

        rollNumber: student.rollNumber,

        idNumber: student.idNumber,

        collegeName: student.collegeId?.name || report.collegeName,

        hostelBlock: student.hostelBlock,

        roomNumber: student.roomNumber,

        course: student.course,

        branch: student.branch,

        year: student.year,

        feeDetails: student.feeDetails,

        managementVerification: student.managementVerification,

        wardenVerification: student.wardenVerification,

        isOnline: student.isOnline,

        createdAt: student.createdAt,
      });

      const mapWarden = (warden) => ({
        name: warden.name,
        email: warden.email,

        status: warden.status,

        phone: warden.phone || warden.phoneNumber,

        phoneNumber: warden.phoneNumber,

        employeeId: warden.employeeId,

        designation: warden.designation,

        department: warden.department,

        collegeName: warden.collegeId?.name || report.collegeName,

        hostelBlock: warden.hostelBlock,

        isOnline: warden.isOnline,

        createdAt: warden.createdAt,
      });

      /* -------------------------------------------------------------- */
      /* SYSTEM REPORT                                                   */
      /* -------------------------------------------------------------- */

      if (report.id === "sys-overview") {
        return {
          title: report.name,

          subtitle: report.description,

          collegeName: "All Colleges",

          stats: {
            students: allStudents.length,

            wardens: allWardens.length,

            colleges: stats.colleges,
          },

          studentsList: allStudents.map(mapStudent),

          wardensList: allWardens.map(mapWarden),

          collegesList: collegesList,
        };
      }

      /* -------------------------------------------------------------- */
      /* COLLEGE REPORT                                                  */
      /* -------------------------------------------------------------- */

      const collegeId = report.collegeId;

      const college = collegesList.find(
        (item) => String(item.id) === String(collegeId),
      );

      const students = allStudents
        .filter((student) => String(student.managementId) === String(collegeId))
        .map(mapStudent);

      const wardens = allWardens
        .filter((warden) => String(warden.managementId) === String(collegeId))
        .map(mapWarden);

      return {
        title: report.name,

        subtitle: report.description,

        collegeName: report.collegeName,

        collegeEmail: college?.email,

        collegeLocation: college?.location,

        stats: {
          students: students.length,

          wardens: wardens.length,

          colleges: 1,
        },

        studentsList: students,

        wardensList: wardens,

        collegesList: college ? [college] : [],
      };
    },
    [allStudents, allWardens, collegesList, stats.colleges],
  );

  const handleDownload = async (reportId, format) => {
    const report = reportsData.find((item) => item.id === reportId);

    if (!report) return;

    setDownloadingId(reportId);
    setDownloadingFormat(format);

    try {
      const payload = getReportPayload(report);

      const timestamp = generateTimestamp();

      const safeName = String(report.collegeName || report.name || "report")
        .trim()
        .replace(/[^a-zA-Z0-9]+/g, "-")
        .replace(/^-+|-+$/g, "");

      if (format === "pdf") {
        const pdf = await generatePdfReport(payload);

        const blob = pdf.output("blob");

        saveBlob(blob, `HOAS-${safeName}-${timestamp}.pdf`);
      }

      if (format === "excel") {
        const buffer = await generateExcelReport(payload);

        const blob = new Blob([buffer], {
          type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
        });

        saveBlob(blob, `HOAS-${safeName}-${timestamp}.xlsx`);
      }

      toast.success(`${format.toUpperCase()} report downloaded successfully.`);
    } catch (error) {
      console.error("Report download failed:", error);

      toast.error(
        `Failed to generate ${format.toUpperCase()} report: ${
          error?.message || "Unknown error"
        }`,
      );
    } finally {
      setDownloadingId(null);
      setDownloadingFormat(null);
    }
  };
  const handleBulkDownload = async (format) => {
    if (selectedReports.size === 0) return;
    setBulkDownloading(true);
    setBulkFormat(format);
    try {
      for (const rid of selectedReports) {
        const report = reportsData.find((r) => r.id === rid);
        if (!report) continue;
        const payload = getReportPayload(report);
        const ts = generateTimestamp();
        const safeName = report.collegeName.replace(/[^a-zA-Z0-9]/g, "-");

        if (format === "pdf") {
          const pdf = await generatePdfReport(payload);
          saveBlob(pdf.output("blob"), `HOAS-${safeName}-${ts}.pdf`);
        } else {
          const bytes = await generateExcelReport(payload);
          saveBlob(
            new Blob([bytes], {
              type: "application/vnd.openxmlformats-officedocument.spreadsheetml.sheet",
            }),
            `HOAS-${safeName}-${ts}.xlsx`,
          );
        }
        // Small delay between downloads so browser doesn't block them
        await new Promise((r) => setTimeout(r, 400));
      }
      toast.success(
        `${selectedReports.size} ${format.toUpperCase()} report(s) downloaded!`,
      );
      setSelectedReports(new Set());
    } catch (err) {
      toast.error("Bulk download failed: " + (err.message || err));
    } finally {
      setBulkDownloading(false);
      setBulkFormat(null);
    }
  };

  const formatDate = (d) =>
    d.toLocaleDateString("en-IN", {
      day: "2-digit",
      month: "short",
      year: "numeric",
    });
  const formatTime = (d) =>
    d.toLocaleTimeString("en-IN", {
      hour: "2-digit",
      minute: "2-digit",
      hour12: true,
    });

  const savePageState = () => {
    sessionStorage.setItem(
      "reportsPageState",
      JSON.stringify({
        scrollPosition: window.scrollY,
        returnPath: "/OwnersDashboard/reports",
      }),
    );
  };

  // ════════════════════════════════════════════════════════════
  //  RENDER
  // ════════════════════════════════════════════════════════════
  return (
    <>
      <Header
        title="Reports Board"
        isCollapsed={isCollapsed}
        setIsCollapsed={setIsCollapsed}
        onProfileClick={savePageState}
      />

      <style>{`
        @keyframes slideUp {
          from { opacity: 0; transform: translateX(-50%) translateY(30px); }
          to { opacity: 1; transform: translateX(-50%) translateY(0); }
        }
        @keyframes fadeInUp {
          from { opacity: 0; transform: translateY(12px); }
          to { opacity: 1; transform: translateY(0); }
        }
        .rpt-card:hover { transform: translateY(-2px); box-shadow: 0 12px 40px -12px rgba(0,0,0,0.3); }
        .rpt-search:focus { border-color: rgba(129,140,248,0.5) !important; box-shadow: 0 0 0 3px rgba(129,140,248,0.1) !important; }
        .rpt-dl:hover { transform: translateY(-1px); filter: brightness(1.1); }
        .rpt-bulk:hover { background: rgba(255,255,255,0.22) !important; transform: scale(1.04); }
      `}</style>

      <div className="pt-24 p-6 min-h-screen">
        {loading ? (
          <div className="flex items-center justify-center py-80">
            <HashLoader color="#818cf8" size={70} />
          </div>
        ) : (
          <>
            {/* ═══ Stats Grid (Analytics StatsCard pattern) ═══ */}
            {collegeInfo && (
              <div
                className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-5 mb-8"
                style={{ animation: "fadeInUp 0.4s ease" }}
              >
                {[
                  {
                    title: collegeInfo.id === "ADMIN" ? "Platform" : "College",
                    value: collegeInfo.name,
                    sub: collegeInfo.location,
                    Icon: Building2,
                    grad: "from-blue-500 to-indigo-600",
                    isText: true,
                  },
                  {
                    title: "Students",
                    value: stats.students,
                    sub: "Total enrolled",
                    Icon: GraduationCap,
                    grad: "from-emerald-500 to-teal-600",
                  },
                  {
                    title: "Wardens",
                    value: stats.wardens,
                    sub: "Assigned",
                    Icon: Shield,
                    grad: "from-purple-500 to-fuchsia-600",
                  },
                  {
                    title: collegeInfo.id === "ADMIN" ? "Colleges" : "Reports",
                    value:
                      collegeInfo.id === "ADMIN"
                        ? stats.colleges
                        : reportsData.length,
                    sub:
                      collegeInfo.id === "ADMIN" ? "Registered" : "Available",
                    Icon: FileText,
                    grad: "from-orange-500 to-amber-600",
                  },
                ].map(({ title, value, sub, Icon, grad, isText }, idx) => (
                  <div
                    key={idx}
                    className="relative group overflow-hidden rounded-[1.5rem] p-5 transition-all duration-300 hover:scale-[1.02] hover:shadow-2xl border border-white/10"
                    style={{
                      background:
                        "linear-gradient(135deg, var(--bg-card) 0%, var(--bg-primary) 100%)",
                      boxShadow: "0 10px 30px -10px rgba(0,0,0,0.3)",
                    }}
                  >
                    <div
                      className={`absolute -right-4 -top-4 w-24 h-24 bg-gradient-to-br ${grad} opacity-10 blur-2xl group-hover:opacity-20 transition-opacity`}
                    />
                    <div className="relative z-10 flex flex-col h-full justify-between">
                      <div className="flex items-center justify-between mb-4">
                        <div className="p-2.5 rounded-2xl bg-white/5 border border-white/5 text-white/70 group-hover:text-white group-hover:scale-110 transition-all">
                          <Icon size={18} />
                        </div>
                        <span className="text-[10px] font-black uppercase tracking-[0.15em] text-muted-foreground">
                          {title}
                        </span>
                      </div>
                      <div className="space-y-1">
                        <h2
                          className={`${isText ? "text-xl" : "text-3xl"} font-black tracking-tight text-primary ${isText ? "truncate" : ""}`}
                        >
                          {value}
                        </h2>
                        <p className="text-[10px] font-bold text-muted-foreground opacity-70">
                          {sub}
                        </p>
                      </div>
                      <div
                        className={`absolute bottom-0 left-0 h-1 bg-gradient-to-r ${grad} transition-all duration-500 w-0 group-hover:w-full`}
                      />
                    </div>
                  </div>
                ))}
              </div>
            )}

            {/* ═══ Search & Filter ═══ */}
            <div
              className="backdrop-blur-sm rounded-xl shadow-2xl p-6 mb-6"
              style={{
                backgroundColor: "var(--bg-card)",
                border: "1px solid var(--border-primary)",
                animation: "fadeInUp 0.5s ease",
              }}
            >
              <div className="flex flex-col gap-4">
                <div className="flex flex-col sm:flex-row sm:items-center justify-between gap-4">
                  <div>
                    <h2
                      className="text-xl font-bold"
                      style={{ color: "var(--text-primary)" }}
                    >
                      Available Reports
                    </h2>
                    <p
                      className="text-sm mt-1"
                      style={{ color: "var(--text-muted)" }}
                    >
                      Select &amp; download college reports in PDF or Excel
                    </p>
                  </div>
                  <div className="relative w-full sm:w-80">
                    <Search
                      size={16}
                      className="absolute left-3.5 top-1/2 -translate-y-1/2 pointer-events-none"
                      style={{ color: "var(--text-muted)" }}
                    />
                    <input
                      type="text"
                      placeholder="Search reports..."
                      value={searchQuery}
                      onChange={(e) => setSearchQuery(e.target.value)}
                      className="rpt-search w-full pl-10 pr-9 py-2.5 rounded-xl text-sm outline-none transition-all duration-200"
                      style={{
                        backgroundColor: "var(--bg-primary)",
                        border: "1px solid var(--border-primary)",
                        color: "var(--text-primary)",
                      }}
                    />
                    {searchQuery && (
                      <button
                        onClick={() => setSearchQuery("")}
                        className="absolute right-2.5 top-1/2 -translate-y-1/2 p-1 rounded-md"
                        style={{
                          background: "var(--bg-card)",
                          color: "var(--text-muted)",
                        }}
                      >
                        <X size={12} />
                      </button>
                    )}
                  </div>
                </div>

                <div className="flex flex-wrap items-center justify-between gap-3">
                  <div className="flex flex-wrap gap-2">
                    {filterOptions.map((opt) => {
                      const FIcon = opt.icon;
                      const active = selectedFilter === opt.key;
                      return (
                        <button
                          key={opt.key}
                          onClick={() => {
                            setSelectedFilter(opt.key);
                            setSelectedReports(new Set());
                          }}
                          className="inline-flex items-center gap-1.5 px-3.5 py-1.5 rounded-full text-xs font-semibold transition-all duration-200"
                          style={{
                            border: active
                              ? "1px solid rgba(129,140,248,0.5)"
                              : "1px solid var(--border-primary)",
                            backgroundColor: active
                              ? "rgba(129,140,248,0.15)"
                              : "transparent",
                            color: active ? "#818cf8" : "var(--text-muted)",
                          }}
                        >
                          <FIcon size={13} /> {opt.label}
                        </button>
                      );
                    })}
                  </div>
                  {filteredReports.length > 0 && (
                    <button
                      onClick={toggleSelectAll}
                      className="inline-flex items-center gap-2 px-3.5 py-1.5 rounded-lg text-xs font-semibold transition-all duration-200"
                      style={{
                        border: "1px solid var(--border-primary)",
                        background: isAllSelected
                          ? "rgba(129,140,248,0.1)"
                          : "transparent",
                        color: isAllSelected ? "#818cf8" : "var(--text-muted)",
                      }}
                    >
                      {isAllSelected ? (
                        <CheckSquare size={14} />
                      ) : (
                        <Square size={14} />
                      )}
                      {isAllSelected ? "Deselect All" : "Select All"} (
                      {filteredReports.length})
                    </button>
                  )}
                </div>
              </div>
            </div>

            {/* ═══ Reports List ═══ */}
            <div
              className="space-y-3"
              style={{ animation: "fadeInUp 0.6s ease" }}
            >
              {filteredReports.map((report) => {
                const isSelected = selectedReports.has(report.id);
                const RIcon = report.icon;
                const isDl = downloadingId === report.id;

                return (
                  <div
                    key={report.id}
                    className="rpt-card relative group overflow-hidden rounded-xl transition-all duration-300 cursor-pointer"
                    style={{
                      backgroundColor: "var(--bg-card)",
                      border: isSelected
                        ? "1.5px solid rgba(129,140,248,0.5)"
                        : "1px solid var(--border-primary)",
                      boxShadow: isSelected
                        ? "0 0 0 3px rgba(129,140,248,0.08), 0 10px 30px -10px rgba(0,0,0,0.3)"
                        : "0 10px 30px -10px rgba(0,0,0,0.15)",
                    }}
                    onClick={(e) => {
                      if (!e.target.closest("button")) toggleSelect(report.id);
                    }}
                  >
                    <div
                      className={`absolute bottom-0 left-0 h-[2px] bg-gradient-to-r ${report.gradient} transition-all duration-500 w-0 group-hover:w-full`}
                    />

                    <div className="p-5 flex flex-col lg:flex-row lg:items-center gap-4">
                      {/* Checkbox */}
                      <div
                        className="flex-shrink-0 w-5 h-5 rounded-md flex items-center justify-center transition-all duration-200 cursor-pointer"
                        style={{
                          border: isSelected
                            ? "none"
                            : "2px solid var(--border-primary)",
                          background: isSelected
                            ? "linear-gradient(135deg, #818cf8, #a78bfa)"
                            : "transparent",
                        }}
                        onClick={(e) => {
                          e.stopPropagation();
                          toggleSelect(report.id);
                        }}
                      >
                        {isSelected && (
                          <svg
                            width="12"
                            height="12"
                            viewBox="0 0 12 12"
                            fill="none"
                          >
                            <path
                              d="M2 6L5 9L10 3"
                              stroke="#fff"
                              strokeWidth="2"
                              strokeLinecap="round"
                              strokeLinejoin="round"
                            />
                          </svg>
                        )}
                      </div>

                      {/* College Logo or Fallback Icon */}
                      {report.collegeLogo ? (
                        <div className="w-16 h-16 rounded-xl overflow-hidden flex-shrink-0 border border-white/10 bg-white">
                          <img
                            src={report.collegeLogo}
                            alt={report.collegeName}
                            className="w-full h-full object-cover"
                          />
                        </div>
                      ) : (
                        <div
                          className={`p-3 rounded-2xl bg-gradient-to-br ${report.gradient} flex-shrink-0`}
                        >
                          <RIcon size={20} className="text-white" />
                        </div>
                      )}

                      {/* Info */}
                      <div className="flex-1 min-w-0">
                        <h3
                          className="font-bold text-base truncate mb-1"
                          style={{ color: "var(--text-primary)" }}
                        >
                          {report.name}
                        </h3>
                        <p
                          className="text-xs mb-2 leading-relaxed"
                          style={{ color: "var(--text-muted)" }}
                        >
                          {report.description}
                        </p>
                        <div className="flex flex-wrap items-center gap-2">
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-emerald-500/10 text-emerald-400 border border-emerald-500/20">
                            <GraduationCap size={11} /> {report.students}{" "}
                            Students
                          </span>
                          <span className="inline-flex items-center gap-1 px-2 py-0.5 rounded-md text-[11px] font-semibold bg-purple-500/10 text-purple-400 border border-purple-500/20">
                            <Shield size={11} /> {report.wardens} Wardens
                          </span>
                          <span
                            className="flex items-center gap-1 text-[11px]"
                            style={{ color: "var(--text-muted)" }}
                          >
                            <Calendar size={11} />{" "}
                            {formatDate(report.generatedDate)} •{" "}
                            {formatTime(report.generatedDate)}
                          </span>
                        </div>
                      </div>

                      {/* Download Buttons */}
                      <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(report.id, "pdf");
                          }}
                          disabled={isDl && downloadingFormat === "pdf"}
                          className="rpt-dl inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-200"
                          style={{
                            background:
                              "linear-gradient(135deg, #7c3aed, #db2777)",
                            boxShadow: "0 4px 15px rgba(124,58,237,0.25)",
                            opacity:
                              isDl && downloadingFormat === "pdf" ? 0.6 : 1,
                          }}
                        >
                          {isDl && downloadingFormat === "pdf" ? (
                            <HashLoader color="#fff" size={13} />
                          ) : (
                            <FileType size={14} />
                          )}{" "}
                          PDF
                        </button>
                        <button
                          onClick={(e) => {
                            e.stopPropagation();
                            handleDownload(report.id, "excel");
                          }}
                          disabled={isDl && downloadingFormat === "excel"}
                          className="rpt-dl inline-flex items-center gap-1.5 px-4 py-2 rounded-xl text-white text-xs font-semibold transition-all duration-200"
                          style={{
                            background:
                              "linear-gradient(135deg, #16a34a, #059669)",
                            boxShadow: "0 4px 15px rgba(22,163,74,0.25)",
                            opacity:
                              isDl && downloadingFormat === "excel" ? 0.6 : 1,
                          }}
                        >
                          {isDl && downloadingFormat === "excel" ? (
                            <HashLoader color="#fff" size={13} />
                          ) : (
                            <FileSpreadsheet size={14} />
                          )}{" "}
                          Excel
                        </button>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>

            {/* ═══ Empty State ═══ */}
            {filteredReports.length === 0 && (
              <div
                className="backdrop-blur-sm rounded-xl shadow-2xl p-16 text-center"
                style={{
                  backgroundColor: "var(--bg-card)",
                  border: "1px solid var(--border-primary)",
                  animation: "fadeInUp 0.4s ease",
                }}
              >
                <div className="w-16 h-16 rounded-2xl bg-white/5 border border-white/5 flex items-center justify-center mx-auto mb-4">
                  <Search size={28} style={{ color: "var(--text-muted)" }} />
                </div>
                <h3
                  className="text-lg font-bold mb-2"
                  style={{ color: "var(--text-primary)" }}
                >
                  {searchQuery
                    ? "No reports match your search"
                    : "No Reports Available"}
                </h3>
                <p
                  className="text-sm max-w-md mx-auto"
                  style={{ color: "var(--text-muted)" }}
                >
                  {searchQuery
                    ? `Try adjusting "${searchQuery}" or changing filters.`
                    : `Reports for ${collegeInfo?.name || "your college"} will appear here once generated.`}
                </p>
                {searchQuery && (
                  <button
                    onClick={() => {
                      setSearchQuery("");
                      setSelectedFilter("all");
                    }}
                    className="mt-4 px-5 py-2 rounded-xl text-sm font-semibold"
                    style={{
                      border: "1px solid var(--border-primary)",
                      color: "#818cf8",
                      background: "transparent",
                    }}
                  >
                    Clear filters
                  </button>
                )}
              </div>
            )}

            {/* ═══ Floating Bulk Action Bar ═══ */}
            {selectedReports.size > 0 && (
              <div
                style={{
                  position: "fixed",
                  bottom: "24px",
                  left: "50%",
                  transform: "translateX(-50%)",
                  display: "flex",
                  alignItems: "center",
                  gap: "12px",
                  padding: "12px 24px",
                  borderRadius: "1rem",
                  background:
                    "linear-gradient(135deg, rgba(79,70,229,0.95), rgba(124,58,237,0.95))",
                  backdropFilter: "blur(20px)",
                  boxShadow:
                    "0 20px 60px rgba(79,70,229,0.4), 0 0 0 1px rgba(255,255,255,0.1) inset",
                  zIndex: 50,
                  animation: "slideUp 0.35s cubic-bezier(0.34,1.56,0.64,1)",
                }}
              >
                <div className="flex items-center gap-2 text-white text-sm font-bold">
                  <CheckCircle2 size={16} />{" "}
                  <span>{selectedReports.size} selected</span>
                </div>
                <div
                  className="w-px h-7"
                  style={{ backgroundColor: "rgba(255,255,255,0.2)" }}
                />
                <button
                  onClick={() => handleBulkDownload("pdf")}
                  disabled={bulkDownloading}
                  className="rpt-bulk flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    opacity: bulkDownloading && bulkFormat === "pdf" ? 0.5 : 1,
                  }}
                >
                  {bulkDownloading && bulkFormat === "pdf" ? (
                    <HashLoader color="#fff" size={12} />
                  ) : (
                    <ArrowDownToLine size={14} />
                  )}{" "}
                  Download PDF
                </button>
                <button
                  onClick={() => handleBulkDownload("excel")}
                  disabled={bulkDownloading}
                  className="rpt-bulk flex items-center gap-1.5 px-4 py-2 rounded-lg text-white text-xs font-bold transition-all duration-200"
                  style={{
                    background: "rgba(255,255,255,0.15)",
                    border: "1px solid rgba(255,255,255,0.2)",
                    opacity:
                      bulkDownloading && bulkFormat === "excel" ? 0.5 : 1,
                  }}
                >
                  {bulkDownloading && bulkFormat === "excel" ? (
                    <HashLoader color="#fff" size={12} />
                  ) : (
                    <FileSpreadsheet size={14} />
                  )}{" "}
                  Download Excel
                </button>
                <button
                  onClick={() => setSelectedReports(new Set())}
                  className="p-2 rounded-lg transition-all"
                  style={{
                    background: "rgba(255,255,255,0.1)",
                    border: "none",
                    color: "rgba(255,255,255,0.7)",
                    cursor: "pointer",
                  }}
                >
                  <X size={14} />
                </button>
              </div>
            )}
            {selectedReports.size > 0 && <div className="h-20" />}
          </>
        )}
      </div>
    </>
  );
}
