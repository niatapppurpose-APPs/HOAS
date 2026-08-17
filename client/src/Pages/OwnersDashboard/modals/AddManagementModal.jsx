import React, { useCallback, useEffect, useMemo, useState } from 'react';
import { Building2, KeyRound, Mail, Phone, Plus, UploadIcon, User, X } from 'lucide-react';
import { HashLoader } from 'react-spinners';
import * as cloudFunctions from '../../../firebase/cloudFunctions';
import { useToast } from '../../../components/Toast';
import { compressLogoForModal } from '../utils/compressLogo';
import CollegeSelect from '../components/CollegeSelect';

const initialForm = {
  collegeName: '',
  principalName: '',
  email: '',
  phone: '',
  password: '',
};

const AddManagementModal = React.memo(({ isOpen, onClose, isDark }) => {
  const toast = useToast();
  const [form, setForm] = useState(initialForm);
  const [formError, setFormError] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);
  const [logoFile, setLogoFile] = useState(null);
  const [logoPreview, setLogoPreview] = useState(null);

  const panelStyle = useMemo(() => ({
    backgroundColor: isDark ? '#111827' : '#ffffff',
    borderColor: isDark ? '#374151' : '#e5e7eb',
    color: isDark ? '#ffffff' : '#111827',
  }), [isDark]);

  const inputStyle = useMemo(() => ({
    backgroundColor: isDark ? '#1f2937' : '#f9fafb',
    borderColor: isDark ? '#4b5563' : '#d1d5db',
    color: isDark ? '#ffffff' : '#111827',
  }), [isDark]);

  useEffect(() => {
    return () => {
      if (logoPreview) URL.revokeObjectURL(logoPreview);
    };
  }, [logoPreview]);

  useEffect(() => {
    if (!isOpen) {
      setForm(initialForm);
      setFormError('');
      setLogoFile(null);
      setLogoPreview(null);
    }
  }, [isOpen]);

  const generatePassword = useCallback((collegeName) => {
    const prefix = collegeName.replace(/[^a-zA-Z]/g, '').slice(0, 4).toUpperCase() || 'HOAS';
    const randomText = Math.random().toString(36).slice(-6);
    const randomNumber = Math.floor(10 + Math.random() * 90);
    return `${prefix}@${randomText}${randomNumber}`;
  }, []);

  const updateField = useCallback((field, value) => {
    setForm((current) => ({ ...current, [field]: value }));
    if (formError) setFormError('');
  }, [formError]);

  const handleCollegeNameChange = useCallback((collegeName) => {
    setForm((current) => ({
      ...current,
      collegeName,
      password: collegeName ? generatePassword(collegeName) : '',
    }));
    if (formError) setFormError('');
  }, [formError, generatePassword]);

  const validateForm = () => {
    if (!form.collegeName.trim()) return 'College name is required.';
    if (!form.principalName.trim()) return 'Principal name is required.';
    if (!form.email.trim()) return 'Principal email is required.';
    if (!form.password.trim()) return 'Temporary password is required.';
    if (form.password.length < 6) return 'Temporary password must be at least 6 characters.';
    return '';
  };

  const handleSubmit = async (event) => {
    event.preventDefault();
    const error = validateForm();
    if (error) {
      setFormError(error);
      toast.warning(error);
      return;
    }

    setIsSubmitting(true);
    try {
      const collegeLogo = logoFile ? await compressLogoForModal(logoFile) : null;
      await cloudFunctions.createManagement({
        collegeName: form.collegeName.trim(),
        principalName: form.principalName.trim(),
        email: form.email.trim().toLowerCase(),
        phone: form.phone.trim(),
        password: form.password,
        collegeLogo,
      });

      toast.success('Management account created successfully');
      onClose();
    } catch (error) {
      toast.error(`Failed to add management: ${error.message}`);
    } finally {
      setIsSubmitting(false);
    }
  };

  const handleLogoChange = (event) => {
    const file = event.target.files?.[0];
    if (!file) return;
    if (file.size > 5 * 1024 * 1024) {
      toast.warning('Logo must be smaller than 5 MB');
      return;
    }
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(file);
    setLogoPreview(URL.createObjectURL(file));
  };

  const handleRemoveLogo = () => {
    if (logoPreview) URL.revokeObjectURL(logoPreview);
    setLogoFile(null);
    setLogoPreview(null);
  };

  if (!isOpen) return null;

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center px-4">
      <button type="button" aria-label="Close modal" className="absolute inset-0 bg-black/55 backdrop-blur-sm" onClick={onClose} />

      <div className="relative max-h-[92vh] w-full max-w-2xl overflow-y-auto rounded-2xl border shadow-2xl" style={panelStyle}>
        <div className="sticky top-0 z-10 flex items-center justify-between border-b px-5 py-4" style={panelStyle}>
          <div className="flex items-center gap-3">
            <div className="flex h-10 w-10 items-center justify-center rounded-xl bg-emerald-600 text-white">
              <Building2 size={20} />
            </div>
            <div>
              <h3 className="text-lg font-bold">Add Management</h3>
              <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>
                Create a college and assign its principal account.
              </p>
            </div>
          </div>
          <button type="button" onClick={onClose} className="rounded-lg p-2 transition hover:bg-black/10">
            <X size={20} />
          </button>
        </div>

        <form onSubmit={handleSubmit} className="space-y-5 p-5">
          <div>
            <label className="mb-1.5 block text-sm font-semibold">College Name *</label>
            <CollegeSelect
              value={form.collegeName}
              onChange={handleCollegeNameChange}
              isDark={isDark}
              placeholder="Search or enter college name"
            />
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Principal Name *</label>
            <div className="relative">
              <User className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
              <input
                type="text"
                value={form.principalName}
                onChange={(event) => updateField('principalName', event.target.value)}
                placeholder="Enter principal full name"
                className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-emerald-500"
                style={inputStyle}
              />
            </div>
          </div>

          <div className="grid gap-4 md:grid-cols-2">
            <div>
              <label className="mb-1.5 block text-sm font-semibold">Principal Email *</label>
              <div className="relative">
                <Mail className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                <input
                  type="email"
                  value={form.email}
                  onChange={(event) => updateField('email', event.target.value)}
                  placeholder="principal@college.edu"
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-emerald-500"
                  style={inputStyle}
                />
              </div>
            </div>

            <div>
              <label className="mb-1.5 block text-sm font-semibold">Phone Number</label>
              <div className="relative">
                <Phone className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                <input
                  type="tel"
                  value={form.phone}
                  onChange={(event) => updateField('phone', event.target.value)}
                  placeholder="+91 9876543210"
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-emerald-500"
                  style={inputStyle}
                />
              </div>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">Temporary Password *</label>
            <div className="flex gap-2">
              <div className="relative flex-1">
                <KeyRound className="absolute left-3 top-1/2 h-4 w-4 -translate-y-1/2 text-emerald-500" />
                <input
                  type="text"
                  value={form.password}
                  onChange={(event) => updateField('password', event.target.value)}
                  placeholder="Generated after college name"
                  className="w-full rounded-xl border py-3 pl-10 pr-4 outline-none transition focus:ring-2 focus:ring-emerald-500"
                  style={inputStyle}
                />
              </div>
              <button
                type="button"
                onClick={() => updateField('password', generatePassword(form.collegeName))}
                className="rounded-xl border px-4 text-sm font-semibold transition hover:bg-emerald-500/10"
                style={{ borderColor: inputStyle.borderColor }}
              >
                Generate
              </button>
            </div>
          </div>

          <div>
            <label className="mb-1.5 block text-sm font-semibold">College Logo</label>
            {!logoPreview ? (
              <label
                className="flex cursor-pointer items-center justify-center gap-2 rounded-xl border-2 border-dashed px-4 py-4 transition hover:border-emerald-500"
                style={{ borderColor: inputStyle.borderColor, backgroundColor: isDark ? '#1f2937' : '#f9fafb' }}
              >
                <input type="file" accept="image/*" className="hidden" onChange={handleLogoChange} />
                <UploadIcon size={18} />
                <span className="text-sm font-medium">Upload optional logo</span>
              </label>
            ) : (
              <div className="flex items-center gap-3 rounded-xl border p-3" style={{ borderColor: inputStyle.borderColor }}>
                <img src={logoPreview} alt="College logo preview" className="h-14 w-14 rounded-xl object-cover" />
                <div className="min-w-0 flex-1">
                  <p className="truncate text-sm font-semibold">{logoFile?.name}</p>
                  <p className="text-xs" style={{ color: isDark ? '#9ca3af' : '#6b7280' }}>Ready to upload</p>
                </div>
                <button type="button" onClick={handleRemoveLogo} className="rounded-lg px-3 py-2 text-sm font-semibold text-red-500 hover:bg-red-500/10">
                  Remove
                </button>
              </div>
            )}
          </div>

          {formError && <p className="rounded-xl bg-red-500/10 px-4 py-3 text-sm font-medium text-red-500">{formError}</p>}

          <div className="flex flex-col-reverse gap-3 pt-2 sm:flex-row">
            <button
              type="button"
              onClick={onClose}
              className="flex-1 rounded-xl border px-4 py-3 font-semibold transition hover:bg-black/10"
              style={{ borderColor: inputStyle.borderColor }}
            >
              Cancel
            </button>
            <button
              type="submit"
              disabled={isSubmitting}
              className="flex flex-1 items-center justify-center gap-2 rounded-xl bg-emerald-600 px-4 py-3 font-semibold text-white transition hover:bg-emerald-700 disabled:cursor-not-allowed disabled:opacity-60"
            >
              {isSubmitting ? (
                <>
                  <HashLoader color="#ffffff" size={16} />
                  Creating...
                </>
              ) : (
                <>
                  <Plus size={18} />
                  Add Management
                </>
              )}
            </button>
          </div>
        </form>
      </div>
    </div>
  );
});

AddManagementModal.displayName = 'AddManagementModal';

export default AddManagementModal;
