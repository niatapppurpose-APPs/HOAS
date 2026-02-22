import { useState, useEffect } from "react";
import { useNavigate } from "react-router-dom";
import {
    Building2, Mail, MapPin, Users, Shield,
    ArrowLeft, Globe, Calendar, Award, ImagePlus
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import Avatar from "../../../../components/OwnerServices/Avatar";
import ProfileBanner from "../../../../components/ProfileBanner";
import { collection, query, where, getDocs } from "firebase/firestore";
import { db } from "../../../../firebase/firebaseConfig";
import AppLogo4k from "../../../../assets/AppLogo4k.png";



const ManagementProfile = () => {
    const { user, userData } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const [teamMembers, setTeamMembers] = useState([]);
    const [loadingTeam, setLoadingTeam] = useState(true);
    const [promptDismissed, setPromptDismissed] = useState(false);

    const collegeLogo = userData?.collegeLogo || null;

    // Fetch team members
    useEffect(() => {
        const fetchTeam = async () => {
            if (!userData?.managementId && !userData?.uid) return;
            try {
                const managementId = userData?.managementId || userData?.uid;
                const q = query(
                    collection(db, "users"),
                    where("managementId", "==", managementId),
                    where("status", "==", "approved")
                );
                const snap = await getDocs(q);
                setTeamMembers(snap.docs.map(d => ({ id: d.id, ...d.data() })));
            } catch (e) {
                console.error("Error fetching team:", e);
            } finally {
                setLoadingTeam(false);
            }
        };
        fetchTeam();
    }, [userData]);

    // Theme tokens
    const cardBg = isDark ? "rgba(10,15,40,0.95)" : "rgba(255,255,255,1)";
    const borderColor = isDark ? "rgba(255,255,255,0.12)" : "rgba(0,0,0,0.09)";
    const mutedColor = isDark ? "#94a3b8" : "#64748b";
    const textColor = isDark ? "#f1f5f9" : "#0f172a";
    const subBg = isDark ? "rgba(255,255,255,0.07)" : "rgba(241,245,249,0.85)";
    const itemBorder = isDark ? "rgba(255,255,255,0.12)" : "rgba(148,163,184,0.35)";

    return (
        <div
            className="min-h-screen p-3 sm:p-5 lg:p-8"
            style={{
                background: isDark
                    ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)"
                    : "linear-gradient(135deg,#f8fafc,#eef2ff,#f1f5f9)"
            }}
        >
            {/* ── Back button ── */}
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-4 sm:mb-5 px-3 sm:px-4 py-2 rounded-xl text-sm font-medium transition-all hover:scale-105 active:scale-95"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: mutedColor }}
            >
                <ArrowLeft className="w-4 h-4" />
                <span>Back to Dashboard</span>
            </button>

            {/* ── No-logo prompt ── */}
            {!collegeLogo && !promptDismissed && (
                <div
                    className="max-w-4xl mx-auto mb-4 flex flex-wrap items-center gap-3 px-4 py-3 rounded-2xl"
                    style={{
                        background: isDark
                            ? "linear-gradient(135deg,rgba(251,146,60,0.12),rgba(234,88,12,0.08))"
                            : "linear-gradient(135deg,rgba(251,146,60,0.15),rgba(254,215,170,0.5))",
                        border: "1px solid rgba(251,146,60,0.35)",
                    }}
                >
                    <div className="w-9 h-9 rounded-xl flex items-center justify-center flex-shrink-0"
                        style={{ background: "rgba(251,146,60,0.2)" }}>
                        <ImagePlus className="w-4 h-4" style={{ color: "#f97316" }} />
                    </div>
                    <div className="flex-1 min-w-0" style={{ minWidth: 140 }}>
                        <p className="text-sm font-semibold leading-tight" style={{ color: isDark ? "#fdba74" : "#c2410c" }}>
                            No college logo uploaded yet
                        </p>
                        <p className="text-xs mt-0.5 leading-snug" style={{ color: isDark ? "#fb923c" : "#ea580c", opacity: 0.85 }}>
                            Upload in Settings to personalise your banner &amp; sidebar.
                        </p>
                    </div>
                    <div className="flex items-center gap-2 flex-shrink-0">
                        <button
                            onClick={() => navigate("../settings")}
                            className="px-3 py-1.5 rounded-xl text-xs font-semibold text-white transition-all hover:scale-105 active:scale-95"
                            style={{ background: "linear-gradient(135deg,#f97316,#ea580c)", boxShadow: "0 4px 12px rgba(249,115,22,0.4)" }}
                        >
                            Go to Settings
                        </button>
                        <button
                            onClick={() => setPromptDismissed(true)}
                            className="w-7 h-7 rounded-lg flex items-center justify-center text-sm font-bold transition-all hover:scale-110"
                            style={{ background: "rgba(251,146,60,0.2)", color: "#f97316" }}
                        >
                            ✕
                        </button>
                    </div>
                </div>
            )}

            <div className="max-w-4xl mx-auto space-y-4 sm:space-y-5">

                {/* ── College Card ── */}
                <div
                    className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                >
                    {/* Banner */}
                    <ProfileBanner
                        collegeLogo={collegeLogo}
                        fallbackGradient="linear-gradient(135deg,#4f46e5,#7c3aed,#6366f1)"
                    />

                    {/* Logo + College info */}
                    <div className="px-4 sm:px-6 pb-5">
                        {/* Logo row */}
                        <div className="flex flex-col sm:flex-row sm:items-end gap-3 sm:gap-4 mb-4">

                            {/* Logo — only this element overlaps the banner */}
                            <div className="relative flex-shrink-0 w-20 h-20 sm:w-24 sm:h-24 md:w-28 md:h-28 -mt-10 sm:-mt-14">
                                <div
                                    className="w-full h-full rounded-2xl overflow-hidden border-4 shadow-xl"
                                    style={{ borderColor: isDark ? "#1e293b" : "#fff" }}
                                >
                                    <img
                                        src={collegeLogo || AppLogo4k}
                                        alt="College Logo"
                                        className="w-full h-full object-cover"
                                    />
                                </div>
                                <div
                                    className="absolute -bottom-1.5 -right-0 w-4 h-4 sm:w-5 sm:h-5 md:w-6 md:h-6 rounded-full bg-green-500 border-2"
                                    style={{ borderColor: isDark ? "#0f172a" : "#fff" }}
                                />
                            </div>

                            {/* Name + badges */}
                            <div className="flex-1 min-w-0 pb-1 sm:pb-2">
                                <h1
                                    className="text-lg sm:text-xl md:text-2xl font-bold truncate"
                                    style={{ color: textColor }}
                                >
                                    {userData?.collegeName || "Your College"}
                                </h1>
                                <p className="text-xs sm:text-sm mt-0.5 truncate" style={{ color: mutedColor }}>
                                    {userData?.collegeLocation || "Location not set"}
                                </p>
                                <div className="flex flex-wrap gap-1.5 mt-2">
                                    <span
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: "rgba(99,102,241,0.15)", color: "#818cf8" }}
                                    >
                                        <Shield className="w-3 h-3" /> Management Portal
                                    </span>
                                    <span
                                        className="inline-flex items-center gap-1 px-2.5 py-0.5 rounded-full text-xs font-medium"
                                        style={{ backgroundColor: "rgba(34,197,94,0.15)", color: "#4ade80" }}
                                    >
                                        <div className="w-1.5 h-1.5 rounded-full bg-green-400" /> Active
                                    </span>
                                </div>
                            </div>
                        </div>

                        {/* Info grid: 1-col mobile → 3+2 layout on sm+ */}
                        <div className="grid grid-cols-1 sm:grid-cols-6 gap-2 sm:gap-3">
                            {[
                                { icon: Building2, label: "Institution", value: userData?.collegeName || "—" },
                                { icon: MapPin, label: "Location", value: userData?.collegeLocation || "—" },
                                { icon: Mail, label: "Email", value: user?.email || "—" },
                                { icon: Calendar, label: "Member Since", value: userData?.createdAt ? new Date(userData.createdAt).getFullYear() : "—" },
                                { icon: Award, label: "Status", value: userData?.status === "approved" ? "Approved ✓" : userData?.status || "—" },
                            ].map(({ icon: Icon, label, value }, idx) => (
                                <div
                                    key={label}
                                    className={`flex items-start gap-3 p-3 rounded-xl ${idx < 3 ? "sm:col-span-2" : "sm:col-span-3"}`}
                                    style={{ backgroundColor: subBg, border: `1px solid ${itemBorder}` }}
                                >
                                    <div
                                        className="w-7 h-7 sm:w-8 sm:h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: "rgba(99,102,241,0.15)" }}
                                    >
                                        <Icon className="w-3.5 h-3.5 sm:w-4 sm:h-4" style={{ color: "#818cf8" }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs" style={{ color: mutedColor }}>{label}</p>
                                        <p className="text-xs sm:text-sm font-medium truncate" style={{ color: textColor }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── My Profile Card ── */}
                <div
                    className="rounded-2xl p-4 sm:p-6 shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}
                >
                    <h2 className="text-base sm:text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                        <Users className="w-4 h-4 sm:w-5 sm:h-5" style={{ color: "#818cf8" }} />
                        My Profile
                    </h2>

                    <div className="flex flex-col sm:flex-row items-center sm:items-start gap-4 sm:gap-5">
                        {/* Avatar */}
                        <div className="flex-shrink-0">
                            <Avatar image={user?.photoURL} name={user?.displayName} size="xl" rounded="xl" />
                        </div>

                        {/* Details */}
                        <div className="flex-1 min-w-0 w-full space-y-3">
                            <div className="text-center sm:text-left">
                                <h3 className="text-base sm:text-xl font-bold" style={{ color: textColor }}>
                                    {user?.displayName || "Management User"}
                                </h3>
                                <p className="text-xs sm:text-sm truncate" style={{ color: mutedColor }}>{user?.email}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-2 sm:gap-3">
                                {[
                                    { icon: Shield, label: "Role", value: userData?.role ? userData.role.charAt(0).toUpperCase() + userData.role.slice(1) : "Management" },
                                    { icon: Building2, label: "College", value: userData?.collegeName || "—" },
                                    { icon: Award, label: "Account Status", value: userData?.status === "approved" ? "Approved" : userData?.status || "—" },
                                    { icon: Calendar, label: "Joined", value: userData?.createdAt ? new Date(userData.createdAt).toLocaleDateString("en-IN", { year: "numeric", month: "short" }) : "—" },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: subBg }}>
                                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: "#818cf8" }} />
                                        <div className="min-w-0">
                                            <p className="text-xs" style={{ color: mutedColor }}>{label}</p>
                                            <p className="text-xs sm:text-sm font-medium truncate" style={{ color: textColor }}>{value}</p>
                                        </div>
                                    </div>
                                ))}
                            </div>
                        </div>
                    </div>
                </div>

            </div>
        </div>
    );
};

export default ManagementProfile;
