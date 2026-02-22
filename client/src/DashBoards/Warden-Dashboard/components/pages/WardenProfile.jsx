import { useNavigate, useOutletContext } from "react-router-dom";
import {
    Building2, Mail, MapPin, Shield, ArrowLeft,
    Calendar, Award, Users, Home, BookOpen
} from "lucide-react";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import Avatar from "../../../../components/OwnerServices/Avatar";
import ProfileBanner from "../../../../components/ProfileBanner";
import AppLogo4k from "../../../../assets/AppLogo4k.png";

const WardenProfile = () => {
    const { user, userData } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();

    // Warden's collegeLogo comes from the management user's doc (fetched by WardenLayout)
    const { collegeLogo: layoutLogo, managementData } = useOutletContext() || {};

    const collegeLogo = layoutLogo || userData?.collegeLogo || null;
    const collegeName = managementData?.collegeName || userData?.collegeName || "Your College";
    const collegeLocation = managementData?.collegeLocation || userData?.collegeLocation || "Location not set";


    const cardBg = isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const mutedColor = isDark ? "#94a3b8" : "#64748b";
    const textColor = isDark ? "#f1f5f9" : "#0f172a";
    const subBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
    const accentColor = "#f97316"; // orange for warden

    return (
        <div
            className="min-h-screen p-4 sm:p-6 lg:p-8"
            style={{ background: isDark ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)" : "linear-gradient(135deg,#f8fafc,#fff7ed,#f1f5f9)" }}
        >
            <button
                onClick={() => navigate(-1)}
                className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-105"
                style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: mutedColor }}
            >
                <ArrowLeft className="w-4 h-4" />
                <span className="hidden sm:inline">Back to Dashboard</span>
                <span className="sm:hidden">Back</span>
            </button>

            <div className="max-w-4xl mx-auto space-y-6">

                {/* ── College Card ── */}
                <div className="rounded-2xl overflow-hidden shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <ProfileBanner
                        collegeLogo={collegeLogo}
                        fallbackGradient="linear-gradient(135deg,#f97316,#f59e0b,#ea580c)"
                        heightClass="h-28 sm:h-40"
                        patternStyle={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
                    />
                    <div className="px-5 sm:px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                            <div className="relative flex-shrink-0 -mt-10 sm:-mt-14 ">
                                <div className="w-16 h-16 sm:w-28 sm:h-28 rounded-xl sm:rounded-2xl overflow-hidden border-2 sm:border-4 shadow-xl"
                                    style={{ borderColor: isDark ? "#1e293b" : "#fff" }}>
                                    <img src={collegeLogo || AppLogo4k} alt="College Logo" className="w-full h-full object-cover" />
                                </div>
                            </div>
                            <div className="flex-1 min-w-0 sm:pb-1">
                                <h1 className="text-lg sm:text-2xl font-black truncate" style={{ color: textColor }}>
                                    {collegeName}
                                </h1>
                                <p className="text-xs sm:text-sm mt-0.5 font-medium opacity-80" style={{ color: mutedColor }}>
                                    {collegeLocation}
                                </p>
                                <span className="inline-flex items-center gap-1 mt-2 px-3 py-1 rounded-full text-[10px] sm:text-xs font-bold uppercase tracking-wider"
                                    style={{ backgroundColor: "rgba(249,115,22,0.15)", color: accentColor }}>
                                    <Shield className="w-3 h-3" /> Warden
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                            {[
                                { icon: Building2, label: "Institution", value: collegeName },
                                { icon: MapPin, label: "Location", value: collegeLocation },
                                { icon: Home, label: "Hostel", value: userData?.hostelName || "—" },
                                { icon: Mail, label: "Email", value: user?.email || "—" },
                                { icon: Calendar, label: "Joined", value: userData?.createdAt ? new Date(userData.createdAt).getFullYear() : "—" },
                                { icon: Award, label: "Status", value: userData?.status === "approved" ? "Approved ✓" : userData?.status || "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: subBg }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: "rgba(249,115,22,0.15)" }}>
                                        <Icon className="w-4 h-4" style={{ color: accentColor }} />
                                    </div>
                                    <div className="min-w-0">
                                        <p className="text-xs" style={{ color: mutedColor }}>{label}</p>
                                        <p className="text-sm font-medium truncate" style={{ color: textColor }}>{value}</p>
                                    </div>
                                </div>
                            ))}
                        </div>
                    </div>
                </div>

                {/* ── Personal Profile ── */}
                <div className="rounded-2xl p-6 shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <h2 className="text-lg font-bold mb-4 flex items-center gap-2" style={{ color: textColor }}>
                        <Users className="w-5 h-5" style={{ color: accentColor }} />
                        My Profile
                    </h2>
                    <div className="flex flex-col sm:flex-row items-start gap-5">
                        <Avatar image={user?.photoURL} name={user?.displayName} size="xl" rounded="xl" />
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: textColor }}>{user?.displayName || "Warden"}</h3>
                                <p className="text-sm" style={{ color: mutedColor }}>{user?.email}</p>
                            </div>
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: Shield, label: "Role", value: "Warden" },
                                    { icon: Building2, label: "College", value: collegeName },
                                    { icon: Home, label: "Hostel", value: userData?.hostelName || "—" },
                                    { icon: Award, label: "Status", value: userData?.status === "approved" ? "Approved" : userData?.status || "—" },
                                ].map(({ icon: Icon, label, value }) => (
                                    <div key={label} className="flex items-center gap-3 p-3 rounded-xl" style={{ backgroundColor: subBg }}>
                                        <Icon className="w-4 h-4 flex-shrink-0" style={{ color: accentColor }} />
                                        <div className="min-w-0">
                                            <p className="text-xs" style={{ color: mutedColor }}>{label}</p>
                                            <p className="text-sm font-medium truncate" style={{ color: textColor }}>{value}</p>
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

export default WardenProfile;
