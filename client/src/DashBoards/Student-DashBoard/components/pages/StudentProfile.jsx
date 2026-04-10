import { useEffect, useState } from "react";
import { useNavigate, useOutletContext } from "react-router-dom";
import {
    Building2, MapPin, ArrowLeft,
    Calendar, Award, Users, Home, GraduationCap, BookOpen, Pencil, Save, X, Phone
} from "lucide-react";
import { doc, updateDoc } from "firebase/firestore";
import { updateProfile } from "firebase/auth";
import { useAuth } from "../../../../context/AuthContext";
import { useTheme } from "../../../../context/ThemeContext";
import { db } from "../../../../firebase/firebaseConfig";
import Avatar from "../../../../components/OwnerServices/Avatar";
import ProfileBanner from "../../../../components/ProfileBanner";
import AppLogo4k from "../../../../assets/AppLogo4k.png";
import { useToast } from "../../../../components/Toast";
import { ThemeToggle } from "../../../../components/ThemeToggle";
const StudentProfile = () => {
    const { user, userData, userDataLoading } = useAuth();
    const { isDark } = useTheme();
    const navigate = useNavigate();
    const toast = useToast();
    const { collegeLogo: layoutLogo, managementData } = useOutletContext() || {};

    const [isEditing, setIsEditing] = useState(false);
    const [saving, setSaving] = useState(false);
    const [formData, setFormData] = useState({
        fullName: "",
        phone: "",
        studentCode: "",
        roomNumber: "",
        course: "",
        branch: "",
        year: "",
        fatherName: "",
        address: "",
    });

    const collegeLogo = layoutLogo || userData?.collegeLogo || null;
    const collegeName = managementData?.collegeName || userData?.collegeName || "Your College";
    const collegeLocation = managementData?.collegeLocation || userData?.collegeLocation || "Location not set";

    useEffect(() => {
        setFormData({
            fullName: userData?.fullName || userData?.displayName || user?.displayName || "",
            phone: userData?.phone || "",
            studentCode: userData?.studentId || userData?.rollNumber || "",
            roomNumber: userData?.roomNumber || userData?.hostelRoom || "",
            course: userData?.course || "",
            branch: userData?.branch || "",
            year: userData?.year || "",
            fatherName: userData?.fatherName || "",
            address: userData?.address || "",
        });
    }, [userData?.fullName, userData?.displayName, userData?.phone, userData?.studentId, userData?.rollNumber, userData?.roomNumber, userData?.hostelRoom, userData?.course, userData?.branch, userData?.year, userData?.fatherName, userData?.address, user?.displayName]);

    const handleProfileSave = async () => {
        const trimmedName = formData.fullName.trim();
        const trimmedPhone = formData.phone.trim();
        const trimmedStudentCode = formData.studentCode.trim();
        const trimmedRoomNumber = formData.roomNumber.trim();
        const trimmedCourse = formData.course.trim();
        const trimmedBranch = formData.branch.trim();
        const trimmedYear = formData.year.trim();
        const trimmedFatherName = formData.fatherName.trim();
        const trimmedAddress = formData.address.trim();

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
            await updateDoc(doc(db, "users", user.uid), {
                fullName: trimmedName,
                displayName: trimmedName,
                phone: trimmedPhone,
                studentId: trimmedStudentCode,
                rollNumber: trimmedStudentCode,
                roomNumber: trimmedRoomNumber,
                hostelRoom: trimmedRoomNumber,
                course: trimmedCourse,
                branch: trimmedBranch,
                year: trimmedYear,
                fatherName: trimmedFatherName,
                address: trimmedAddress,
                updatedAt: new Date().toISOString(),
            });

            if (user.displayName !== trimmedName) {
                await updateProfile(user, { displayName: trimmedName });
            }

            setIsEditing(false);
            toast.success("Profile updated successfully");
        } catch (error) {
            console.error("Failed to update student profile", error);
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
            studentCode: userData?.studentId || userData?.rollNumber || "",
            roomNumber: userData?.roomNumber || userData?.hostelRoom || "",
            course: userData?.course || "",
            branch: userData?.branch || "",
            year: userData?.year || "",
            fatherName: userData?.fatherName || "",
            address: userData?.address || "",
        });
    };

    const cardBg = isDark ? "rgba(15,23,42,0.8)" : "rgba(255,255,255,0.9)";
    const borderColor = isDark ? "rgba(255,255,255,0.08)" : "rgba(0,0,0,0.08)";
    const mutedColor = isDark ? "#94a3b8" : "#64748b";
    const textColor = isDark ? "#f1f5f9" : "#0f172a";
    const subBg = isDark ? "rgba(255,255,255,0.04)" : "rgba(0,0,0,0.03)";
    const accentColor = "#3b82f6";

    if (userDataLoading) {
        return (
            <div
                className="min-h-screen flex items-center justify-center"
                style={{ background: isDark ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)" : "linear-gradient(135deg,#f8fafc,#eff6ff,#f1f5f9)" }}
            >
                <div className="w-10 h-10 border-4 border-blue-500 border-t-transparent rounded-full animate-spin" />
            </div>
        );
    }

    return (
        <div
            className="min-h-screen p-4 sm:p-6 lg:p-8"
            style={{ background: isDark ? "linear-gradient(135deg,#030712,#0c0a1e,#050816)" : "linear-gradient(135deg,#f8fafc,#eff6ff,#f1f5f9)" }}
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
                <div className="overflow-hidden shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
                    <ProfileBanner
                        collegeLogo={collegeLogo}
                        fallbackGradient="linear-gradient(135deg,#3b82f6,#6366f1,#2563eb)"
                        heightClass="h-28 sm:h-40"
                        patternStyle={{ backgroundImage: "radial-gradient(circle at 70% 30%, white 1px, transparent 1px)", backgroundSize: "35px 35px" }}
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
                                    style={{ backgroundColor: "rgba(59,130,246,0.15)", color: accentColor }}>
                                    <GraduationCap className="w-3 h-3" /> Student
                                </span>
                            </div>
                        </div>

                        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-3 mt-2">
                            {[
                                { icon: Building2, label: "Institution", value: collegeName },
                                { icon: MapPin, label: "Location", value: collegeLocation },
                                { icon: Home, label: "Hostel Block", value: userData?.hostelBlock || "—" },
                                { icon: BookOpen, label: "Student ID", value: userData?.studentId || "—" },
                                { icon: Calendar, label: "Joined", value: userData?.createdAt ? new Date(userData.createdAt).getFullYear() : "—" },
                                { icon: Award, label: "Status", value: userData?.status === "approved" ? "Approved ✓" : userData?.status || "—" },
                            ].map(({ icon: Icon, label, value }) => (
                                <div key={label} className="flex items-start gap-3 p-3 rounded-xl" style={{ backgroundColor: subBg }}>
                                    <div className="w-8 h-8 rounded-lg flex items-center justify-center flex-shrink-0"
                                        style={{ backgroundColor: "rgba(59,130,246,0.15)" }}>
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

                <div className="p-6 shadow-xl"
                    style={{ backgroundColor: cardBg, border: `1px solid ${borderColor}` }}>
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
                                style={{ background: "linear-gradient(135deg,#2563eb,#1d4ed8)" }}
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
                                    {userData?.fullName || userData?.displayName || user?.displayName || "Student"}
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
                                            Student ID / Roll Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.studentCode}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, studentCode: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Room Number
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.roomNumber}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, roomNumber: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Course
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.course}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, course: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Branch
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.branch}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, branch: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Year
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.year}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, year: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div>
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Father Name
                                        </label>
                                        <input
                                            type="text"
                                            value={formData.fatherName}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, fatherName: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                    <div className="sm:col-span-2">
                                        <label className="mb-1 block text-xs font-semibold uppercase tracking-wider" style={{ color: mutedColor }}>
                                            Address
                                        </label>
                                        <textarea
                                            value={formData.address}
                                            onChange={(e) => setFormData((prev) => ({ ...prev, address: e.target.value }))}
                                            className="w-full rounded-xl border px-3 py-2.5 text-sm outline-none"
                                            rows={3}
                                            style={{ backgroundColor: subBg, borderColor, color: textColor }}
                                        />
                                    </div>
                                </div>
                            )}
                            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                                {[
                                    { icon: GraduationCap, label: "Role", value: "Student" },
                                    { icon: Building2, label: "College", value: collegeName },
                                    { icon: BookOpen, label: "Student ID", value: userData?.studentId || userData?.rollNumber || "—" },
                                    { icon: Home, label: "Room Number", value: userData?.roomNumber || userData?.hostelRoom || "—" },
                                    { icon: BookOpen, label: "Course", value: userData?.course || "—" },
                                    { icon: BookOpen, label: "Branch", value: userData?.branch || "—" },
                                    { icon: BookOpen, label: "Year", value: userData?.year || "—" },
                                    { icon: Home, label: "Hostel Block", value: userData?.hostelBlock || "—" },
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

export default StudentProfile;
