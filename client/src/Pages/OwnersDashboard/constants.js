import { Building2, GraduationCap, Shield } from "lucide-react";

// Hoisted outside component to avoid re-creation on every render
export const roleIcons = {
    student: GraduationCap,
    warden: Shield,
    management: Building2,
};

export const roleColors = {
    student: "from-blue-500 to-indigo-600",
    warden: "from-orange-500 to-amber-600",
    management: "from-emerald-500 to-teal-600",
};
