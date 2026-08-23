import { useState, useEffect } from "react";
import { useOutletContext } from "react-router-dom";
import {
    Building2, Mail, MapPin, Shield,
    Calendar, Award, Users, Home, Pencil, Save, X, Phone, ArrowLeft
} from "lucide-react";
import { updateProfile } from "firebase/auth";
import { updateProfile as apiUpdateProfile } from "../../../../firebase/cloudFunctions";
import { getHostels } from "../../../../firebase/hostelApi";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import { ThemeToggle } from "../../../../components/ThemeToggle";
import Avatar from "../../../../components/OwnerServices/Avatar";
import ProfileBanner from "../../../../components/ProfileBanner";
import AppLogo4k from "../../../../assets/AppLogo4k.webp";
import { useToast } from "../../../../components/Toast";
import { useNavigate } from "react-router";
const WardenProfile = () => {
    const { user, userData, userDataLoading } = useAuth();
    const { isDark } = useTheme();
    const toast = useToast();
    const navigate = useNavigate()

    const { collegeLogo: layoutLogo, managementData } = useOutletContext() || {};

    const collegeLogo = layoutLogo || userData?.collegeLogo || null;
    const collegeName = managementData?.collegeName || userData?.collegeName || "Your College";
    const collegeLocation = managementData?.collegeLocation || userData?.collegeLocation || "Location not set";

    const [hostelName, setHostelName] = useState("");
    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        employeeId: "",
        designation: "",
    });

    useEffect(() => {
        setFormData({
            fullName: userData?.fullName || userData?.displayName || user?.displayName || "",
            phone: userData?.phone || "",
            employeeId: userData?.employeeId || "",
            designation: userData?.designation || userData?.department || "",
        });
    }, [userData?.fullName, userData?.displayName, userData?.phone, userData?.employeeId, userData?.designation, userData?.department, user?.displayName]);

    useEffect(() => {
        const block = userData?.hostelBlock;
        if (!block) {
            setHostelName("");
            return;
        }

        let cancelled = false;

        const fetchHostel = async () => {
            try {
                const { hostels } = await getHostels();
                if (cancelled) return;
                const match = (hostels || []).find(h => h.block === block || h.name === block);
                setHostelName(match?.name || "");
            } catch (err) {
                console.error("Failed to fetch hostel name for warden profile", err);
            }
        };

        fetchHostel();

        return () => { cancelled = true; };
    }, [userData?.hostelBlock]);

    const handleProfileSave = async () => {
        const trimmedName = formData.fullName.trim();
        const trimmedPhone = formData.phone.trim();
        const trimmedEmployeeId = formData.employeeId.trim();
        const trimmedDesignation = formData.designation.trim();

        if (!user?.uid) {
            toast.error("User session not found");
            return;
        }

        if (!trimmedName) {
            toast.error("Full name is required");
            return;
        }

        setSaving(true);
        try {
            await apiUpdateProfile({
                name: trimmedName,
                phone: trimmedPhone,
            });

            if (user.displayName !== trimmedName) {
                await updateProfile(user, { displayName: trimmedName });
            }

            setIsEditing(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Failed to update warden profile", error);
            toast.error("Failed to update profile");
        } finally {
            setSaving(false);
        }
    };

    const resetEditing = () => {
        setIsEditing(false);
        setFormData({
            fullName: userData?.fullName || userData?.displayName || user?.displayName || "",
            phone: userData?.phone || "",
            employeeId: userData?.employeeId || "",
            designation: userData?.designation || userData?.department || "",
        });
    };

    const cardBg = isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const mutedColor = isDark ? "#94a3b8" : "#64748b";
    const textColor = isDark ? "#f1f5f9" : "#0f172a";
    const subBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
    const accentColor = "#f97316";

    if (userDataLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: isDark ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)" : "linear-gradient(135deg,#f8fafc,#fff7ed,#f1f5f9)" }}
            >
                <div className="w-10 h-10 border-4 border-orange-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen sm:p-8 md:p-10 lg:p-12"
            style={{ background: isDark ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)" : "linear-gradient(135deg,#f8fafc,#fff7ed,#f1f5f9)" }}
        >
            <div className="flex justify-between items-center">
                <button
                    onClick={() => navigate(-1)}
                    className="flex items-center gap-2 mb-6 px-4 py-2 rounded-xl text-xs sm:text-sm font-medium transition-all hover:scale-105"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}`, color: mutedColor }}
                >
                    <ArrowLeft className="w-4 h-4" />
                    <span className="hidden sm:inline">Back to Dashboard</span>
                    <span className="sm:hidden">Back</span>
                </button>
                <div className="flex justify-end items-center p-4">
                    <div className="p-1 rounded-xl shadow-lg backdrop-blur-md" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                        <ThemeToggle />
                    </div>
                </div>

            </div>
            <div className="max-w-4xl mx-auto space-y-6">
                <div className="overflow-hidden shadow-xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <ProfileBanner
                        collegeLogo={collegeLogo}
                        fallbackGradient="linear-gradient(135deg,#f97316,#f59e0b,#ea580c)"
                        heightClass="h-28 sm:h-40"
                        patternStyle={{ backgroundImage: "radial-gradient(circle at 30% 50%, white 1px, transparent 1px)", backgroundSize: "30px 30px" }}
                    />
                    <div className="px-5 sm:px-6 pb-6">
                        <div className="flex flex-col sm:flex-row sm:items-end gap-4 mb-4">
                            <div className="relative flex-shrink-0 -mt-10 sm:-mt-14">
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
                                { icon: Home, label: "Hostel Block", value: userData?.hostelBlock || "—" },
                                { icon: Home, label: "Hostel Name", value: hostelName || userData?.hostelName || "—" },
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

                <div className="rounded p-6 shadow-xl" style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <div className="mb-4 flex items-center justify-between gap-3">
                        <h2 className="text-lg font-bold flex items-center gap-2" style={{ color: textColor }}>
                            <Users className="w-5 h-5" style={{ color: accentColor }} />
                            My Profile
                        </h2>
                        <div className="flex items-center gap-2">
                            {isEditing && (
                                <button
                                    onClick={resetEditing}
                                    className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium"
                                    style={{ backgroundColor: subBg, color: mutedColor }}
                                >
                                    <X className="w-4 h-4" />
                                    Cancel
                                </button>
                            )}
                            <button
                                onClick={isEditing ? handleProfileSave : () => setIsEditing(true)}
                                disabled={saving}
                                className="inline-flex items-center gap-2 rounded-xl px-3 py-2 text-sm font-medium text-white"
                                style={{ background: "linear-gradient(135deg,#f97316,#ea580c)" }}
                            >
                                {isEditing ? <Save className="w-4 h-4" /> : <Pencil className="w-4 h-4" />}
                                {saving ? "Saving..." : isEditing ? "Save" : "Edit"}
                            </button>
                        </div>
                    </div>
                    <div className="flex flex-col sm:flex-row lg:items-start items-center gap-5">
                        <Avatar
                            uid={user?.uid}
                            image={userData?.photoURL || user?.photoURL}
                            name={userData?.fullName || userData?.displayName || user?.displayName}
                            email={user?.email}
                            size="xl"
                            rounded="xl"
                            collections={["users"]}
                            editable
                        />
                        <div className="flex-1 min-w-0 space-y-3">
                            <div>
                                <h3 className="text-xl font-bold" style={{ color: textColor }}>
                                    {userData?.fullName || userData?.displayName || user?.displayName || "Warden"}
                                </h3>
                                <p className="text-sm" style={{ color: mutedColor }}>{user?.email}</p>
                            </div>
                            {isEditing && (
                                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Full Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fullName}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, fullName: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Phone
                                        </label>
                                        <div className="relative">
                                            <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2" style={{ color: mutedColor }} />
                                            <input
                                                type="text"
                                                value={formData.phone}
                                                onChange={(e) => setFormData((prev) => ({ ...prev, phone: e.target.value }))}
                                                className="w-full rounded-xl border py-2.5 pl-10 pr-3 text-sm outline-none"
                                                style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                            />
                                        </div>
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Employee ID
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.employeeId}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, employeeId: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Designation
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.designation}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, designation: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: Shield, label: "Role", value: "Warden" },
                                    { icon: Building2, label: "College", value: collegeName },
                                    { icon: Building2, label: "Employee ID", value: userData?.employeeId || "—" },
                                    { icon: Building2, label: "Designation", value: userData?.designation || userData?.department || "—" },
                                    { icon: Home, label: "Hostel Block", value: userData?.hostelBlock || "—" },
                                    { icon: Home, label: "Hostel Name", value: hostelName || userData?.hostelName || "—" },
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
