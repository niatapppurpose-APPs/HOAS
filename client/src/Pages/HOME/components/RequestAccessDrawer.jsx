import { useState, useEffect } from "react";
import { motion } from "framer-motion";
import {
  X,
  Building2,
  User,
  Mail,
  Phone,
  MapPin,
  GraduationCap,
  Hotel,
  MessageSquare,
  Send,
  CheckCircle2,
  Loader2,
} from "lucide-react";

const API_BASE = (import.meta.env.VITE_API_URL || "").replace(/\/+$/, "");

const INITIAL_FORM = {
  orgName: "",
  contactPerson: "",
  email: "",
  phone: "",
  address: "",
  city: "",
  state: "",
  country: "",
  studentCount: "",
  hostelCount: "",
  message: "",
};

const REQUIRED_FIELDS = ["orgName", "contactPerson", "email", "phone", "address"];

const Field = ({ label, required, error, icon: Icon, children }) => (
  <label className="block">
    <span className="mb-1 flex items-center gap-1.5 text-xs font-bold">
      {Icon && <Icon size={13} />}
      {label}
      {required && <span className="text-rose-500">*</span>}
    </span>
    {children}
    {error && <span className="mt-1 block text-xs font-semibold text-rose-500">{error}</span>}
  </label>
);

const inputStyle = (isDark) => ({
  backgroundColor: isDark ? "rgba(255,255,255,0.05)" : "rgba(15,23,42,0.03)",
  borderColor: isDark ? "rgba(255,255,255,0.12)" : "rgba(15,23,42,0.12)",
  color: isDark ? "#f1f5f9" : "#0f172a",
});

const inputClass =
  "w-full rounded-xl border px-3.5 py-2.5 text-sm outline-none transition-colors focus:border-violet-500 focus:ring-2 focus:ring-violet-500/20 placeholder:text-slate-400";

const RequestAccessDrawer = ({ isOpen, onClose, isDark }) => {
  const [form, setForm] = useState(INITIAL_FORM);
  const [errors, setErrors] = useState({});
  const [submitting, setSubmitting] = useState(false);
  const [submitError, setSubmitError] = useState("");
  const [submitted, setSubmitted] = useState(false);

  useEffect(() => {
    if (isOpen) {
      setForm(INITIAL_FORM);
      setErrors({});
      setSubmitError("");
      setSubmitted(false);
    }
    document.body.style.overflow = isOpen ? "hidden" : "unset";
    return () => {
      document.body.style.overflow = "unset";
    };
  }, [isOpen]);

  useEffect(() => {
    const onKey = (e) => e.key === "Escape" && onClose();
    if (isOpen) window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [isOpen, onClose]);

  const handleChange = (field) => (e) => {
    setForm((prev) => ({ ...prev, [field]: e.target.value }));
    setErrors((prev) => ({ ...prev, [field]: undefined }));
  };

  const validate = () => {
    const next = {};
    REQUIRED_FIELDS.forEach((key) => {
      if (!form[key].trim()) next[key] = "This field is required";
    });
    if (form.email.trim() && !/^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(form.email.trim())) {
      next.email = "Enter a valid email address";
    }
    setErrors(next);
    return Object.keys(next).length === 0;
  };

  const handleSubmit = async (e) => {
    e.preventDefault();
    if (!validate()) return;
    setSubmitting(true);
    setSubmitError("");
    try {
      const payload = {
        ...form,
        studentCount: form.studentCount ? Number(form.studentCount) : undefined,
        hostelCount: form.hostelCount ? Number(form.hostelCount) : undefined,
      };
      const response = await fetch(`${API_BASE}/api/access-requests`, {
        method: "POST",
        headers: { "Content-Type": "application/json" },
        body: JSON.stringify(payload),
      });
      const data = await response.json().catch(() => ({}));
      if (!response.ok) {
        throw new Error(data.message || data.error || "Failed to submit request");
      }
      setSubmitted(true);
    } catch (err) {
      setSubmitError(err.message || "Something went wrong. Please try again.");
    } finally {
      setSubmitting(false);
    }
  };

  return (
    <>
      {/* Backdrop */}
      <motion.div
        initial={{ opacity: 0 }}
        animate={{ opacity: 1 }}
        exit={{ opacity: 0 }}
        onClick={onClose}
        className="fixed inset-0 z-[60] bg-slate-950/60 backdrop-blur-sm"
      />

      {/* Right sidebar panel */}
      <motion.aside
        initial={{ x: "100%" }}
        animate={{ x: 0 }}
        exit={{ x: "100%" }}
        transition={{ type: "spring", damping: 30, stiffness: 300 }}
        className="fixed top-0 right-0 z-[70] h-dvh w-full max-w-md overflow-y-auto shadow-2xl"
        style={{
          backgroundColor: isDark ? "#0b1120" : "#ffffff",
          borderLeft: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.08)"}`,
        }}
      >
        <div
          className="sticky top-0 z-10 flex items-center justify-between px-6 py-4 backdrop-blur-xl"
          style={{
            backgroundColor: isDark ? "rgba(11,17,32,0.9)" : "rgba(255,255,255,0.9)",
            borderBottom: `1px solid ${isDark ? "rgba(255,255,255,0.08)" : "rgba(15,23,42,0.06)"}`,
          }}
        >
          <div>
            <h3
              className="text-lg font-black tracking-tight"
              style={{ color: isDark ? "#fff" : "#0f172a" }}
            >
              Request Access
            </h3>
            <p className="text-xs" style={{ color: isDark ? "#94A3B8" : "#64748B" }}>
              Tell us about your organization
            </p>
          </div>
          <button
            onClick={onClose}
            className="rounded-xl p-2 transition-colors hover:bg-violet-500/10"
            style={{ color: isDark ? "#CBD5E1" : "#475569" }}
          >
            <X size={20} />
          </button>
        </div>

        <div className="px-6 py-6">
          {submitted ? (
            <motion.div
              initial={{ opacity: 0, scale: 0.95 }}
              animate={{ opacity: 1, scale: 1 }}
              className="flex flex-col items-center py-14 text-center"
            >
              <motion.div
                initial={{ scale: 0 }}
                animate={{ scale: 1 }}
                transition={{ type: "spring", damping: 12, delay: 0.1 }}
                className="mb-5 rounded-full bg-emerald-500/15 p-4"
              >
                <CheckCircle2 size={48} className="text-emerald-500" />
              </motion.div>
              <h4
                className="text-xl font-black mb-2"
                style={{ color: isDark ? "#fff" : "#0f172a" }}
              >
                Thank you!
              </h4>
              <p
                className="max-w-xs text-sm leading-relaxed mb-6"
                style={{ color: isDark ? "#94A3B8" : "#64748B" }}
              >
                Your request has been sent to the HOAS team. A confirmation email is on
                its way — once your organization is verified, your login credentials will
                be emailed to you.
              </p>
              <button
                onClick={onClose}
                className="rounded-xl px-6 py-3 text-sm font-bold text-white shadow-lg shadow-violet-600/30"
                style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
              >
                Done
              </button>
            </motion.div>
          ) : (
            <form onSubmit={handleSubmit} className="flex flex-col gap-4 pb-8">
              <Field label="Organization / College Name" required error={errors.orgName} icon={Building2}>
                <input
                  type="text"
                  value={form.orgName}
                  onChange={handleChange("orgName")}
                  placeholder="e.g. Sunrise Institute of Technology"
                  className={inputClass}
                  style={inputStyle(isDark)}
                />
              </Field>

              <Field label="Contact Person" required error={errors.contactPerson} icon={User}>
                <input
                  type="text"
                  value={form.contactPerson}
                  onChange={handleChange("contactPerson")}
                  placeholder="Principal / Director name"
                  className={inputClass}
                  style={inputStyle(isDark)}
                />
              </Field>

              <Field label="Official Email" required error={errors.email} icon={Mail}>
                <input
                  type="email"
                  value={form.email}
                  onChange={handleChange("email")}
                  placeholder="admin@college.edu"
                  className={inputClass}
                  style={inputStyle(isDark)}
                />
              </Field>

              <Field label="Phone Number" required error={errors.phone} icon={Phone}>
                <input
                  type="tel"
                  value={form.phone}
                  onChange={handleChange("phone")}
                  placeholder="+91 98765 43210"
                  className={inputClass}
                  style={inputStyle(isDark)}
                />
              </Field>

              <Field label="Address" required error={errors.address} icon={MapPin}>
                <textarea
                  rows={2}
                  value={form.address}
                  onChange={handleChange("address")}
                  placeholder="Campus full address"
                  className={`${inputClass} resize-none`}
                  style={inputStyle(isDark)}
                />
              </Field>

              <div className="grid grid-cols-2 gap-3">
                <Field label="City" error={errors.city}>
                  <input
                    type="text"
                    value={form.city}
                    onChange={handleChange("city")}
                    className={inputClass}
                    style={inputStyle(isDark)}
                  />
                </Field>
                <Field label="State" error={errors.state}>
                  <input
                    type="text"
                    value={form.state}
                    onChange={handleChange("state")}
                    className={inputClass}
                    style={inputStyle(isDark)}
                  />
                </Field>
              </div>

              <div className="grid grid-cols-2 gap-3">
                <Field label="Country" error={errors.country}>
                  <input
                    type="text"
                    value={form.country}
                    onChange={handleChange("country")}
                    className={inputClass}
                    style={inputStyle(isDark)}
                  />
                </Field>
                <Field label="Number of Students" icon={GraduationCap} error={errors.studentCount}>
                  <input
                    type="number"
                    min="0"
                    value={form.studentCount}
                    onChange={handleChange("studentCount")}
                    placeholder="e.g. 1200"
                    className={inputClass}
                    style={inputStyle(isDark)}
                  />
                </Field>
              </div>

              <Field label="Number of Hostels" icon={Hotel} error={errors.hostelCount}>
                <input
                  type="number"
                  min="0"
                  value={form.hostelCount}
                  onChange={handleChange("hostelCount")}
                  placeholder="e.g. 4"
                  className={inputClass}
                  style={inputStyle(isDark)}
                />
              </Field>

              <Field label="Additional Message" icon={MessageSquare} error={errors.message}>
                <textarea
                  rows={3}
                  value={form.message}
                  onChange={handleChange("message")}
                  placeholder="Anything else we should know?"
                  className={`${inputClass} resize-none`}
                  style={inputStyle(isDark)}
                />
              </Field>

              {submitError && (
                <div className="rounded-xl bg-rose-500/10 px-4 py-3 text-sm font-semibold text-rose-500">
                  {submitError}
                </div>
              )}

              <motion.button
                whileHover={{ scale: submitting ? 1 : 1.02 }}
                whileTap={{ scale: submitting ? 1 : 0.97 }}
                type="submit"
                disabled={submitting}
                className="mt-2 flex items-center justify-center gap-2 rounded-2xl px-6 py-3.5 text-sm font-bold text-white shadow-lg shadow-violet-600/30 disabled:opacity-60"
                style={{ background: "linear-gradient(135deg, #7C3AED, #6D28D9)" }}
              >
                {submitting ? (
                  <>
                    <Loader2 size={16} className="animate-spin" /> Submitting…
                  </>
                ) : (
                  <>
                    <Send size={16} /> Send Request
                  </>
                )}
              </motion.button>

              <p
                className="text-center text-xs"
                style={{ color: isDark ? "#64748B" : "#94A3B8" }}
              >
                After review, our team emails your login credentials to this address.
              </p>
            </form>
          )}
        </div>
      </motion.aside>
    </>
  );
};

export default RequestAccessDrawer;
