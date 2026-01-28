import { useState, useEffect, useCallback } from 'react';
import { useOutletContext } from 'react-router-dom';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useToast } from '../../../components/Toast';
import Header from '../../../components/OwnerServices/header';
import * as cloudFunctions from '../../../firebase/cloudFunctions';
import { 
  Settings, 
  Shield, 
  Users, 
  Building2, 
  AlertTriangle,
  Save,
  RefreshCw,
  ToggleLeft,
  ToggleRight,
  Plus,
  Trash2,
  Edit2,
  ChevronDown,
  ChevronUp,
  Loader2,
  CheckCircle,
  XCircle,
  Info,
  Lock,
  Unlock,
  Bell,
  FileText,
  BarChart3,
  Layers,
  Clock,
  ArrowRight,
  GraduationCap,
  UserCheck,
  Home
} from 'lucide-react';

// =============================================================================
// TOGGLE SWITCH COMPONENT
// =============================================================================
const ToggleSwitch = ({ enabled, onChange, disabled = false, size = 'md' }) => {
  const sizes = {
    sm: { width: 'w-10', height: 'h-5', dot: 'w-4 h-4', translate: 'translate-x-5' },
    md: { width: 'w-12', height: 'h-6', dot: 'w-5 h-5', translate: 'translate-x-6' },
    lg: { width: 'w-14', height: 'h-7', dot: 'w-6 h-6', translate: 'translate-x-7' },
  };
  const s = sizes[size];

  return (
    <button
      type="button"
      onClick={() => !disabled && onChange(!enabled)}
      disabled={disabled}
      className={`${s.width} ${s.height} rounded-full transition-colors duration-200 ease-in-out focus:outline-none focus:ring-2 focus:ring-offset-2 focus:ring-indigo-500 ${
        disabled ? 'opacity-50 cursor-not-allowed' : 'cursor-pointer'
      } ${enabled ? 'bg-indigo-600' : 'bg-gray-300 dark:bg-gray-600'}`}
    >
      <span
        className={`${s.dot} rounded-full bg-white shadow transform transition-transform duration-200 ease-in-out flex items-center justify-center ${
          enabled ? s.translate : 'translate-x-0.5'
        }`}
      >
        {enabled ? (
          <CheckCircle className="w-3 h-3 text-indigo-600" />
        ) : (
          <XCircle className="w-3 h-3 text-gray-400" />
        )}
      </span>
    </button>
  );
};

// =============================================================================
// COLLAPSIBLE SECTION COMPONENT
// =============================================================================
const CollapsibleSection = ({ title, icon: Icon, children, defaultOpen = false, badge = null }) => {
  const [isOpen, setIsOpen] = useState(defaultOpen);
  
  return (
    <div 
      className="rounded-xl border overflow-hidden mb-4"
      style={{ 
        backgroundColor: 'var(--bg-card)', 
        borderColor: 'var(--border-primary)' 
      }}
    >
      <button
        onClick={() => setIsOpen(!isOpen)}
        className="w-full flex items-center justify-between p-4 hover:bg-opacity-50 transition-colors"
        style={{ backgroundColor: isOpen ? 'var(--bg-tertiary)' : 'transparent' }}
      >
        <div className="flex items-center gap-3">
          <div 
            className="p-2 rounded-lg"
            style={{ backgroundColor: 'var(--accent-primary)', opacity: 0.2 }}
          >
            <Icon className="w-5 h-5" style={{ color: 'var(--accent-primary)' }} />
          </div>
          <span className="font-semibold" style={{ color: 'var(--text-primary)' }}>{title}</span>
          {badge && (
            <span 
              className="px-2 py-0.5 text-xs rounded-full"
              style={{ backgroundColor: 'var(--accent-primary)', color: 'white' }}
            >
              {badge}
            </span>
          )}
        </div>
        {isOpen ? (
          <ChevronUp className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        ) : (
          <ChevronDown className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
        )}
      </button>
      {isOpen && (
        <div className="p-4 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          {children}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// GLOBAL TOGGLES SECTION
// =============================================================================
const GlobalTogglesSection = ({ settings, onUpdate, saving }) => {
  const toggles = [
    {
      key: 'registrationEnabled',
      title: 'User Registration',
      description: 'Allow new users to register in the system',
      icon: UserCheck,
      dangerWhenOff: true,
    },
    {
      key: 'approvalsEnabled',
      title: 'Approval Workflows',
      description: 'Enable approval process for new user registrations',
      icon: CheckCircle,
    },
    {
      key: 'maintenanceMode',
      title: 'Maintenance Mode',
      description: 'Put the entire system in maintenance mode',
      icon: AlertTriangle,
      dangerWhenOn: true,
      inverted: true,
    },
  ];

  const featureToggles = [
    { key: 'notifications', title: 'Notifications', icon: Bell },
    { key: 'reports', title: 'Reports', icon: FileText },
    { key: 'analytics', title: 'Analytics', icon: BarChart3 },
    { key: 'bulkOperations', title: 'Bulk Operations', icon: Layers },
  ];

  return (
    <div className="space-y-6">
      {/* Main Toggles */}
      <div className="space-y-4">
        {toggles.map((toggle) => {
          const Icon = toggle.icon;
          const isEnabled = settings[toggle.key];
          const showWarning = (toggle.dangerWhenOn && isEnabled) || (toggle.dangerWhenOff && !isEnabled);
          
          return (
            <div 
              key={toggle.key}
              className={`flex items-center justify-between p-4 rounded-lg border ${
                showWarning ? 'border-amber-500/50' : ''
              }`}
              style={{ 
                backgroundColor: showWarning ? 'rgba(245, 158, 11, 0.1)' : 'var(--bg-tertiary)',
                borderColor: showWarning ? undefined : 'var(--border-secondary)'
              }}
            >
              <div className="flex items-center gap-3">
                <Icon 
                  className={`w-5 h-5 ${showWarning ? 'text-amber-500' : ''}`} 
                  style={{ color: showWarning ? undefined : 'var(--text-secondary)' }} 
                />
                <div>
                  <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {toggle.title}
                  </p>
                  <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                    {toggle.description}
                  </p>
                </div>
              </div>
              <ToggleSwitch
                enabled={isEnabled}
                onChange={(value) => onUpdate({ [toggle.key]: value })}
                disabled={saving}
              />
            </div>
          );
        })}
      </div>

      {/* Maintenance Message */}
      {settings.maintenanceMode && (
        <div className="p-4 rounded-lg border border-amber-500/50" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Maintenance Message
          </label>
          <textarea
            value={settings.maintenanceMessage || ''}
            onChange={(e) => onUpdate({ maintenanceMessage: e.target.value })}
            className="w-full p-3 rounded-lg border resize-none"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            rows={3}
            placeholder="Enter message to show users during maintenance..."
          />
        </div>
      )}

      {/* Feature Toggles */}
      <div>
        <h4 className="text-sm font-semibold mb-3" style={{ color: 'var(--text-secondary)' }}>
          Feature Flags
        </h4>
        <div className="grid grid-cols-2 md:grid-cols-4 gap-3">
          {featureToggles.map((feature) => {
            const Icon = feature.icon;
            const isEnabled = settings.features?.[feature.key] !== false;
            
            return (
              <div
                key={feature.key}
                className="flex items-center justify-between p-3 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <div className="flex items-center gap-2">
                  <Icon className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  <span className="text-sm" style={{ color: 'var(--text-primary)' }}>
                    {feature.title}
                  </span>
                </div>
                <ToggleSwitch
                  enabled={isEnabled}
                  onChange={(value) => onUpdate({ 
                    features: { ...settings.features, [feature.key]: value } 
                  })}
                  disabled={saving}
                  size="sm"
                />
              </div>
            );
          })}
        </div>
      </div>
    </div>
  );
};

// =============================================================================
// USER LIMITS SECTION
// =============================================================================
const UserLimitsSection = ({ settings, onUpdate, saving }) => {
  const limits = [
    { 
      key: 'defaultStudentLimit', 
      title: 'Default Student Limit', 
      description: 'Maximum students per hostel',
      icon: GraduationCap,
      min: 0,
      max: 10000,
    },
    { 
      key: 'defaultWardenLimit', 
      title: 'Default Warden Limit', 
      description: 'Maximum wardens per hostel',
      icon: Shield,
      min: 0,
      max: 100,
    },
    { 
      key: 'defaultHostelLimit', 
      title: 'Default Hostel Limit', 
      description: 'Maximum hostels per college',
      icon: Home,
      min: 0,
      max: 500,
    },
  ];

  return (
    <div className="space-y-4">
      {limits.map((limit) => {
        const Icon = limit.icon;
        return (
          <div
            key={limit.key}
            className="flex items-center justify-between p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-secondary)' 
            }}
          >
            <div className="flex items-center gap-3">
              <Icon className="w-5 h-5" style={{ color: 'var(--text-secondary)' }} />
              <div>
                <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
                  {limit.title}
                </p>
                <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                  {limit.description}
                </p>
              </div>
            </div>
            <input
              type="number"
              value={settings[limit.key] || 0}
              onChange={(e) => onUpdate({ [limit.key]: parseInt(e.target.value) || 0 })}
              min={limit.min}
              max={limit.max}
              disabled={saving}
              className="w-24 p-2 rounded-lg border text-center"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            />
          </div>
        );
      })}
    </div>
  );
};

// =============================================================================
// ROLE PERMISSIONS SECTION
// =============================================================================
const RolePermissionsSection = ({ templates, onSave, onDelete, loading }) => {
  const [selectedTemplate, setSelectedTemplate] = useState(null);
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const toast = useToast();

  const permissionLabels = {
    canViewReports: 'View Reports',
    canManageStudents: 'Manage Students',
    canManageWardens: 'Manage Wardens',
    canApproveUsers: 'Approve Users',
    canManageHostels: 'Manage Hostels',
    canAccessAnalytics: 'Access Analytics',
    canBulkOperations: 'Bulk Operations',
    canExportData: 'Export Data',
    canViewNotifications: 'View Notifications',
    canSendNotifications: 'Send Notifications',
  };

  const roleColors = {
    student: 'bg-blue-500',
    warden: 'bg-green-500',
    management: 'bg-purple-500',
    principal: 'bg-amber-500',
  };

  const handleEdit = (template) => {
    setEditData({ ...template });
    setEditMode(true);
  };

  const handleSave = async () => {
    try {
      await onSave(editData, editData.id?.startsWith('default-') ? null : editData.id);
      setEditMode(false);
      setEditData(null);
      toast.success('Template saved successfully');
    } catch (error) {
      toast.error('Failed to save template');
    }
  };

  const handleCreate = () => {
    setEditData({
      name: '',
      description: '',
      role: 'student',
      permissions: Object.keys(permissionLabels).reduce((acc, key) => {
        acc[key] = false;
        return acc;
      }, {}),
      isDefault: false,
    });
    setEditMode(true);
  };

  if (editMode && editData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editData.id ? 'Edit Template' : 'Create Template'}
          </h4>
          <button
            onClick={() => { setEditMode(false); setEditData(null); }}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Template Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="Enter template name..."
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Role
            </label>
            <select
              value={editData.role}
              onChange={(e) => setEditData({ ...editData, role: e.target.value })}
              className="w-full p-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="student">Student</option>
              <option value="warden">Warden</option>
              <option value="management">Management</option>
              <option value="principal">Principal</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full p-2 rounded-lg border resize-none"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            rows={2}
            placeholder="Describe this permission template..."
          />
        </div>

        <div>
          <label className="block text-sm font-medium mb-2" style={{ color: 'var(--text-primary)' }}>
            Permissions
          </label>
          <div className="grid grid-cols-2 md:grid-cols-3 gap-2">
            {Object.entries(permissionLabels).map(([key, label]) => (
              <label
                key={key}
                className="flex items-center gap-2 p-2 rounded-lg border cursor-pointer hover:bg-opacity-50"
                style={{ 
                  backgroundColor: editData.permissions[key] ? 'rgba(99, 102, 241, 0.1)' : 'var(--bg-tertiary)', 
                  borderColor: editData.permissions[key] ? 'var(--accent-primary)' : 'var(--border-secondary)'
                }}
              >
                <input
                  type="checkbox"
                  checked={editData.permissions[key] || false}
                  onChange={(e) => setEditData({
                    ...editData,
                    permissions: { ...editData.permissions, [key]: e.target.checked }
                  })}
                  className="rounded"
                />
                <span className="text-sm" style={{ color: 'var(--text-primary)' }}>{label}</span>
              </label>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editData.isDefault}
            onChange={(e) => setEditData({ ...editData, isDefault: e.target.checked })}
            id="isDefault"
            className="rounded"
          />
          <label htmlFor="isDefault" className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Set as default template for this role
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={!editData.name || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Template
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Define permission templates for different roles
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Create Template
        </button>
      </div>

      <div className="grid grid-cols-1 md:grid-cols-2 gap-3">
        {templates.map((template) => (
          <div
            key={template.id}
            className="p-4 rounded-lg border"
            style={{ 
              backgroundColor: 'var(--bg-tertiary)', 
              borderColor: 'var(--border-secondary)' 
            }}
          >
            <div className="flex items-start justify-between mb-2">
              <div>
                <div className="flex items-center gap-2">
                  <h5 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                    {template.name}
                  </h5>
                  {template.isDefault && (
                    <span className="px-2 py-0.5 text-xs rounded-full bg-green-500/20 text-green-500">
                      Default
                    </span>
                  )}
                </div>
                <span className={`inline-block mt-1 px-2 py-0.5 text-xs rounded-full text-white ${roleColors[template.role]}`}>
                  {template.role}
                </span>
              </div>
              <div className="flex items-center gap-1">
                <button
                  onClick={() => handleEdit(template)}
                  className="p-1.5 rounded-lg hover:bg-opacity-50"
                  style={{ backgroundColor: 'var(--bg-secondary)' }}
                >
                  <Edit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                </button>
                {!template.isSystemGenerated && (
                  <button
                    onClick={() => onDelete(template.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                )}
              </div>
            </div>
            <p className="text-sm mb-2" style={{ color: 'var(--text-muted)' }}>
              {template.description || 'No description'}
            </p>
            <div className="flex flex-wrap gap-1">
              {Object.entries(template.permissions || {})
                .filter(([_, enabled]) => enabled)
                .slice(0, 4)
                .map(([key]) => (
                  <span
                    key={key}
                    className="px-2 py-0.5 text-xs rounded-full"
                    style={{ backgroundColor: 'var(--bg-secondary)', color: 'var(--text-secondary)' }}
                  >
                    {permissionLabels[key]}
                  </span>
                ))}
              {Object.values(template.permissions || {}).filter(Boolean).length > 4 && (
                <span className="text-xs" style={{ color: 'var(--text-muted)' }}>
                  +{Object.values(template.permissions).filter(Boolean).length - 4} more
                </span>
              )}
            </div>
          </div>
        ))}
      </div>
    </div>
  );
};

// =============================================================================
// APPROVAL WORKFLOWS SECTION
// =============================================================================
const ApprovalWorkflowsSection = ({ workflows, onSave, onDelete, loading }) => {
  const [editMode, setEditMode] = useState(false);
  const [editData, setEditData] = useState(null);
  const toast = useToast();

  const roleLabels = {
    student: 'Student',
    warden: 'Warden',
    management: 'Management',
    principal: 'Principal',
    admin: 'Admin/Owner',
  };

  const handleCreate = () => {
    setEditData({
      name: '',
      description: '',
      targetRole: 'student',
      steps: [
        { approverRole: 'warden', required: true, autoApprove: false, timeoutHours: 48, timeoutAction: 'escalate' }
      ],
      isActive: true,
    });
    setEditMode(true);
  };

  const handleEdit = (workflow) => {
    setEditData({ ...workflow });
    setEditMode(true);
  };

  const addStep = () => {
    setEditData({
      ...editData,
      steps: [
        ...editData.steps,
        { approverRole: 'management', required: true, autoApprove: false, timeoutHours: 48, timeoutAction: 'escalate' }
      ]
    });
  };

  const removeStep = (index) => {
    setEditData({
      ...editData,
      steps: editData.steps.filter((_, i) => i !== index)
    });
  };

  const updateStep = (index, field, value) => {
    const newSteps = [...editData.steps];
    newSteps[index] = { ...newSteps[index], [field]: value };
    setEditData({ ...editData, steps: newSteps });
  };

  const handleSave = async () => {
    try {
      await onSave(editData, editData.id);
      setEditMode(false);
      setEditData(null);
      toast.success('Workflow saved successfully');
    } catch (error) {
      toast.error('Failed to save workflow');
    }
  };

  if (editMode && editData) {
    return (
      <div className="space-y-4">
        <div className="flex items-center justify-between">
          <h4 className="font-semibold" style={{ color: 'var(--text-primary)' }}>
            {editData.id ? 'Edit Workflow' : 'Create Workflow'}
          </h4>
          <button
            onClick={() => { setEditMode(false); setEditData(null); }}
            className="text-sm px-3 py-1 rounded-lg"
            style={{ color: 'var(--text-secondary)' }}
          >
            Cancel
          </button>
        </div>

        <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Workflow Name
            </label>
            <input
              type="text"
              value={editData.name}
              onChange={(e) => setEditData({ ...editData, name: e.target.value })}
              className="w-full p-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
              placeholder="e.g., Student Registration Approval"
            />
          </div>
          <div>
            <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
              Target Role (who needs approval)
            </label>
            <select
              value={editData.targetRole}
              onChange={(e) => setEditData({ ...editData, targetRole: e.target.value })}
              className="w-full p-2 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-primary)', 
                borderColor: 'var(--border-primary)',
                color: 'var(--text-primary)'
              }}
            >
              <option value="student">Student</option>
              <option value="warden">Warden</option>
              <option value="management">Management</option>
            </select>
          </div>
        </div>

        <div>
          <label className="block text-sm font-medium mb-1" style={{ color: 'var(--text-primary)' }}>
            Description
          </label>
          <textarea
            value={editData.description}
            onChange={(e) => setEditData({ ...editData, description: e.target.value })}
            className="w-full p-2 rounded-lg border resize-none"
            style={{ 
              backgroundColor: 'var(--bg-primary)', 
              borderColor: 'var(--border-primary)',
              color: 'var(--text-primary)'
            }}
            rows={2}
            placeholder="Describe this workflow..."
          />
        </div>

        <div>
          <div className="flex items-center justify-between mb-2">
            <label className="block text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
              Approval Steps
            </label>
            <button
              onClick={addStep}
              className="flex items-center gap-1 text-sm px-2 py-1 rounded"
              style={{ color: 'var(--accent-primary)' }}
            >
              <Plus className="w-4 h-4" />
              Add Step
            </button>
          </div>

          <div className="space-y-3">
            {editData.steps.map((step, index) => (
              <div
                key={index}
                className="p-3 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <div className="flex items-center justify-between mb-2">
                  <span className="text-sm font-medium" style={{ color: 'var(--text-primary)' }}>
                    Step {index + 1}
                  </span>
                  {editData.steps.length > 1 && (
                    <button
                      onClick={() => removeStep(index)}
                      className="p-1 rounded hover:bg-red-500/20"
                    >
                      <Trash2 className="w-4 h-4 text-red-500" />
                    </button>
                  )}
                </div>

                <div className="grid grid-cols-2 md:grid-cols-4 gap-2">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Approver</label>
                    <select
                      value={step.approverRole}
                      onChange={(e) => updateStep(index, 'approverRole', e.target.value)}
                      className="w-full p-1.5 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="warden">Warden</option>
                      <option value="management">Management</option>
                      <option value="principal">Principal</option>
                      <option value="admin">Admin/Owner</option>
                    </select>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>Timeout (hours)</label>
                    <input
                      type="number"
                      value={step.timeoutHours}
                      onChange={(e) => updateStep(index, 'timeoutHours', parseInt(e.target.value) || 48)}
                      min={1}
                      className="w-full p-1.5 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    />
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>On Timeout</label>
                    <select
                      value={step.timeoutAction}
                      onChange={(e) => updateStep(index, 'timeoutAction', e.target.value)}
                      className="w-full p-1.5 rounded border text-sm"
                      style={{ 
                        backgroundColor: 'var(--bg-primary)', 
                        borderColor: 'var(--border-primary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <option value="escalate">Escalate</option>
                      <option value="auto-approve">Auto Approve</option>
                      <option value="auto-deny">Auto Deny</option>
                    </select>
                  </div>
                  <div className="flex items-end gap-3 pb-1">
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={step.required}
                        onChange={(e) => updateStep(index, 'required', e.target.checked)}
                        className="rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>Required</span>
                    </label>
                    <label className="flex items-center gap-1 text-xs">
                      <input
                        type="checkbox"
                        checked={step.autoApprove}
                        onChange={(e) => updateStep(index, 'autoApprove', e.target.checked)}
                        className="rounded"
                      />
                      <span style={{ color: 'var(--text-secondary)' }}>Auto</span>
                    </label>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div className="flex items-center gap-2">
          <input
            type="checkbox"
            checked={editData.isActive}
            onChange={(e) => setEditData({ ...editData, isActive: e.target.checked })}
            id="isActive"
            className="rounded"
          />
          <label htmlFor="isActive" className="text-sm" style={{ color: 'var(--text-primary)' }}>
            Workflow is active
          </label>
        </div>

        <button
          onClick={handleSave}
          disabled={!editData.name || editData.steps.length === 0 || loading}
          className="flex items-center gap-2 px-4 py-2 rounded-lg text-white disabled:opacity-50"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          {loading ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
          Save Workflow
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-4">
      <div className="flex items-center justify-between">
        <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
          Define multi-step approval workflows for user registrations
        </p>
        <button
          onClick={handleCreate}
          className="flex items-center gap-2 px-3 py-1.5 rounded-lg text-white text-sm"
          style={{ backgroundColor: 'var(--accent-primary)' }}
        >
          <Plus className="w-4 h-4" />
          Create Workflow
        </button>
      </div>

      {workflows.length === 0 ? (
        <div 
          className="p-8 rounded-lg border text-center"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            borderColor: 'var(--border-secondary)' 
          }}
        >
          <Clock className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No workflows defined</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            Create your first approval workflow to automate user approvals
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {workflows.map((workflow) => (
            <div
              key={workflow.id}
              className="p-4 rounded-lg border"
              style={{ 
                backgroundColor: 'var(--bg-tertiary)', 
                borderColor: 'var(--border-secondary)' 
              }}
            >
              <div className="flex items-start justify-between mb-3">
                <div>
                  <div className="flex items-center gap-2">
                    <h5 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {workflow.name}
                    </h5>
                    <span className={`px-2 py-0.5 text-xs rounded-full ${
                      workflow.isActive ? 'bg-green-500/20 text-green-500' : 'bg-gray-500/20 text-gray-500'
                    }`}>
                      {workflow.isActive ? 'Active' : 'Inactive'}
                    </span>
                  </div>
                  <p className="text-sm mt-1" style={{ color: 'var(--text-muted)' }}>
                    For: <span className="font-medium">{roleLabels[workflow.targetRole]}</span> registrations
                  </p>
                </div>
                <div className="flex items-center gap-1">
                  <button
                    onClick={() => handleEdit(workflow)}
                    className="p-1.5 rounded-lg hover:bg-opacity-50"
                    style={{ backgroundColor: 'var(--bg-secondary)' }}
                  >
                    <Edit2 className="w-4 h-4" style={{ color: 'var(--text-secondary)' }} />
                  </button>
                  <button
                    onClick={() => onDelete(workflow.id)}
                    className="p-1.5 rounded-lg hover:bg-red-500/20"
                  >
                    <Trash2 className="w-4 h-4 text-red-500" />
                  </button>
                </div>
              </div>

              {/* Steps visualization */}
              <div className="flex items-center gap-2 overflow-x-auto pb-2">
                {workflow.steps?.map((step, index) => (
                  <div key={index} className="flex items-center">
                    <div 
                      className="px-3 py-1.5 rounded-lg text-sm whitespace-nowrap"
                      style={{ 
                        backgroundColor: 'var(--bg-secondary)',
                        color: 'var(--text-primary)'
                      }}
                    >
                      <span className="font-medium">{roleLabels[step.approverRole]}</span>
                      <span className="text-xs ml-1" style={{ color: 'var(--text-muted)' }}>
                        ({step.timeoutHours}h)
                      </span>
                    </div>
                    {index < workflow.steps.length - 1 && (
                      <ArrowRight className="w-4 h-4 mx-1 flex-shrink-0" style={{ color: 'var(--text-muted)' }} />
                    )}
                  </div>
                ))}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// COLLEGE LIMITS SECTION
// =============================================================================
const CollegeLimitsSection = ({ limits, colleges, onSave, loading }) => {
  const [selectedCollege, setSelectedCollege] = useState(null);
  const [editLimits, setEditLimits] = useState({});
  const toast = useToast();

  const handleSave = async (collegeId) => {
    try {
      await onSave(collegeId, editLimits[collegeId]);
      toast.success('Limits updated successfully');
    } catch (error) {
      toast.error('Failed to update limits');
    }
  };

  const getCollegeLimits = (collegeId) => {
    const existing = limits.find(l => l.id === collegeId);
    return editLimits[collegeId] || existing || {};
  };

  const updateCollegeLimits = (collegeId, field, value) => {
    setEditLimits({
      ...editLimits,
      [collegeId]: {
        ...getCollegeLimits(collegeId),
        [field]: parseInt(value) || 0
      }
    });
  };

  return (
    <div className="space-y-4">
      <p className="text-sm" style={{ color: 'var(--text-secondary)' }}>
        Set custom user limits for specific colleges/hostels
      </p>

      {limits.length === 0 && colleges.length === 0 ? (
        <div 
          className="p-8 rounded-lg border text-center"
          style={{ 
            backgroundColor: 'var(--bg-tertiary)', 
            borderColor: 'var(--border-secondary)' 
          }}
        >
          <Building2 className="w-12 h-12 mx-auto mb-3" style={{ color: 'var(--text-muted)' }} />
          <p className="font-medium" style={{ color: 'var(--text-primary)' }}>No colleges found</p>
          <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
            College limits will appear here once colleges are registered
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {(colleges.length > 0 ? colleges : limits).map((item) => {
            const collegeId = item.id || item.collegeId;
            const collegeLimits = getCollegeLimits(collegeId);
            
            return (
              <div
                key={collegeId}
                className="p-4 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-tertiary)', 
                  borderColor: 'var(--border-secondary)' 
                }}
              >
                <div className="flex items-start justify-between mb-3">
                  <div>
                    <h5 className="font-medium" style={{ color: 'var(--text-primary)' }}>
                      {item.collegeName || item.fullName || 'Unknown College'}
                    </h5>
                    <p className="text-sm" style={{ color: 'var(--text-muted)' }}>
                      ID: {collegeId}
                    </p>
                  </div>
                  <button
                    onClick={() => handleSave(collegeId)}
                    disabled={loading}
                    className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-white text-sm"
                    style={{ backgroundColor: 'var(--accent-primary)' }}
                  >
                    {loading ? <Loader2 className="w-3 h-3 animate-spin" /> : <Save className="w-3 h-3" />}
                    Save
                  </button>
                </div>

                <div className="grid grid-cols-3 gap-3">
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Max Students
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={collegeLimits.maxStudents || ''}
                        onChange={(e) => updateCollegeLimits(collegeId, 'maxStudents', e.target.value)}
                        placeholder="Default"
                        className="w-full p-2 rounded border text-sm"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)', 
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      {collegeLimits.currentStudents !== undefined && (
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          ({collegeLimits.currentStudents} used)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Max Wardens
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={collegeLimits.maxWardens || ''}
                        onChange={(e) => updateCollegeLimits(collegeId, 'maxWardens', e.target.value)}
                        placeholder="Default"
                        className="w-full p-2 rounded border text-sm"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)', 
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      {collegeLimits.currentWardens !== undefined && (
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          ({collegeLimits.currentWardens} used)
                        </span>
                      )}
                    </div>
                  </div>
                  <div>
                    <label className="block text-xs mb-1" style={{ color: 'var(--text-muted)' }}>
                      Max Hostels
                    </label>
                    <div className="flex items-center gap-2">
                      <input
                        type="number"
                        value={collegeLimits.maxHostels || ''}
                        onChange={(e) => updateCollegeLimits(collegeId, 'maxHostels', e.target.value)}
                        placeholder="Default"
                        className="w-full p-2 rounded border text-sm"
                        style={{ 
                          backgroundColor: 'var(--bg-primary)', 
                          borderColor: 'var(--border-primary)',
                          color: 'var(--text-primary)'
                        }}
                      />
                      {collegeLimits.currentHostels !== undefined && (
                        <span className="text-xs whitespace-nowrap" style={{ color: 'var(--text-muted)' }}>
                          ({collegeLimits.currentHostels} used)
                        </span>
                      )}
                    </div>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
};

// =============================================================================
// DEFAULT SETTINGS
// =============================================================================
const DEFAULT_SETTINGS = {
  registrationEnabled: true,
  approvalsEnabled: true,
  maintenanceMode: false,
  maintenanceMessage: 'System is under maintenance. Please try again later.',
  defaultStudentLimit: 500,
  defaultWardenLimit: 10,
  defaultHostelLimit: 20,
  features: {
    notifications: true,
    reports: true,
    analytics: true,
    bulkOperations: true,
  },
};

// Default role permission templates when API is unavailable
const DEFAULT_TEMPLATES = [
  {
    id: 'default-student',
    name: 'Default Student Permissions',
    description: 'Default permissions for student role',
    role: 'student',
    permissions: {
      canViewReports: false,
      canManageStudents: false,
      canManageWardens: false,
      canApproveUsers: false,
      canManageHostels: false,
      canAccessAnalytics: false,
      canBulkOperations: false,
      canExportData: false,
      canViewNotifications: true,
      canSendNotifications: false,
    },
    isDefault: true,
    isSystemGenerated: true,
  },
  {
    id: 'default-warden',
    name: 'Default Warden Permissions',
    description: 'Default permissions for warden role',
    role: 'warden',
    permissions: {
      canViewReports: true,
      canManageStudents: true,
      canManageWardens: false,
      canApproveUsers: false,
      canManageHostels: false,
      canAccessAnalytics: true,
      canBulkOperations: false,
      canExportData: true,
      canViewNotifications: true,
      canSendNotifications: true,
    },
    isDefault: true,
    isSystemGenerated: true,
  },
  {
    id: 'default-management',
    name: 'Default Management Permissions',
    description: 'Default permissions for management role',
    role: 'management',
    permissions: {
      canViewReports: true,
      canManageStudents: true,
      canManageWardens: true,
      canApproveUsers: true,
      canManageHostels: true,
      canAccessAnalytics: true,
      canBulkOperations: true,
      canExportData: true,
      canViewNotifications: true,
      canSendNotifications: true,
    },
    isDefault: true,
    isSystemGenerated: true,
  },
];

// =============================================================================
// MAIN COMPONENT
// =============================================================================
const GlobalSystemSettings = () => {
  const { isCollapsed } = useOutletContext();
  const { user, isAdmin } = useAuth();
  const { isDark } = useTheme();
  const toast = useToast();

  // State - Start with loading false so page shows immediately
  const [loading, setLoading] = useState(false);
  const [initialLoad, setInitialLoad] = useState(true);
  const [loadError, setLoadError] = useState(null);
  const [saving, setSaving] = useState(false);
  const [settings, setSettings] = useState(DEFAULT_SETTINGS);
  const [templates, setTemplates] = useState(DEFAULT_TEMPLATES);
  const [workflows, setWorkflows] = useState([]);
  const [collegeLimits, setCollegeLimits] = useState([]);
  const [colleges, setColleges] = useState([]);
  const [hasChanges, setHasChanges] = useState(false);
  const [dataSource, setDataSource] = useState('local'); // 'local' or 'server'

  // Load all data in background
  const loadData = useCallback(async (showLoadingState = true) => {
    try {
      if (showLoadingState) {
        setLoading(true);
      }
      setLoadError(null);
      
      // Helper function to add timeout to promises (shorter timeout - 8 seconds)
      const withTimeout = (promise, timeoutMs = 8000) => {
        return Promise.race([
          promise,
          new Promise((_, reject) => 
            setTimeout(() => reject(new Error('Request timeout')), timeoutMs)
          )
        ]);
      };

      // Load each setting independently to prevent one failure from blocking all
      const results = await Promise.allSettled([
        withTimeout(cloudFunctions.getSystemSettings()),
        withTimeout(cloudFunctions.getRolePermissionTemplates()),
        withTimeout(cloudFunctions.getApprovalWorkflows()),
        withTimeout(cloudFunctions.getCollegeLimits()),
      ]);

      // Process settings result
      if (results[0].status === 'fulfilled') {
        setSettings(results[0].value?.settings || DEFAULT_SETTINGS);
      } else {
        console.warn('Failed to load settings, using defaults:', results[0].reason);
        setSettings(DEFAULT_SETTINGS);
      }

      // Process templates result
      if (results[1].status === 'fulfilled') {
        setTemplates(results[1].value?.templates || []);
      } else {
        console.warn('Failed to load templates:', results[1].reason);
        setTemplates([]);
      }

      // Process workflows result
      if (results[2].status === 'fulfilled') {
        setWorkflows(results[2].value?.workflows || []);
      } else {
        console.warn('Failed to load workflows:', results[2].reason);
        setWorkflows([]);
      }

      // Process college limits result
      if (results[3].status === 'fulfilled') {
        setCollegeLimits(results[3].value?.limits || []);
      } else {
        console.warn('Failed to load college limits:', results[3].reason);
        setCollegeLimits([]);
      }

      // Track if at least one request succeeded
      const anySucceeded = results.some(r => r.status === 'fulfilled');
      
      // Check if all failed
      const allFailed = results.every(r => r.status === 'rejected');
      if (allFailed) {
        setDataSource('local');
        // Only show error on manual refresh, not on initial load
        if (!initialLoad) {
          toast.error('Could not connect to server. Using local defaults.');
        }
      } else {
        setDataSource('server');
        // Check if some failed
        const someFailed = results.some(r => r.status === 'rejected');
        if (someFailed && !initialLoad) {
          toast.warning('Some settings could not be loaded');
        }
      }
      
      setInitialLoad(false);
      
    } catch (error) {
      console.error('Error loading system settings:', error);
      setDataSource('local');
      // Keep using defaults, don't block UI
      if (!initialLoad) {
        toast.error('Failed to load settings from server');
      }
      setInitialLoad(false);
    } finally {
      setLoading(false);
    }
  }, [toast, initialLoad]);

  // Load data on mount - in background without blocking
  useEffect(() => {
    loadData(false); // Don't show loading state on initial load
  }, []);

  // Handle settings update
  const handleSettingsUpdate = (updates) => {
    setSettings(prev => ({ ...prev, ...updates }));
    setHasChanges(true);
  };

  // Save settings
  const saveSettings = async () => {
    try {
      setSaving(true);
      await cloudFunctions.updateSystemSettings(settings);
      toast.success('Settings saved successfully');
      setHasChanges(false);
      setDataSource('server');
    } catch (error) {
      console.error('Error saving settings:', error);
      toast.error('Failed to save settings. Please check your connection.');
    } finally {
      setSaving(false);
    }
  };

  // Template handlers
  const handleSaveTemplate = async (template, templateId) => {
    setSaving(true);
    try {
      await cloudFunctions.saveRolePermissionTemplate(template, templateId);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteTemplate = async (templateId) => {
    if (!confirm('Are you sure you want to delete this template?')) return;
    try {
      await cloudFunctions.deleteRolePermissionTemplate(templateId);
      await loadData();
      toast.success('Template deleted');
    } catch (error) {
      toast.error('Failed to delete template');
    }
  };

  // Workflow handlers
  const handleSaveWorkflow = async (workflow, workflowId) => {
    setSaving(true);
    try {
      await cloudFunctions.saveApprovalWorkflow(workflow, workflowId);
      await loadData();
    } finally {
      setSaving(false);
    }
  };

  const handleDeleteWorkflow = async (workflowId) => {
    if (!confirm('Are you sure you want to delete this workflow?')) return;
    try {
      await cloudFunctions.deleteApprovalWorkflow(workflowId);
      await loadData();
      toast.success('Workflow deleted');
    } catch (error) {
      toast.error('Failed to delete workflow');
    }
  };

  // College limits handler
  const handleSaveCollegeLimits = async (collegeId, limits) => {
    setSaving(true);
    try {
      await cloudFunctions.setCollegeLimits(collegeId, limits);
      await loadData(true);
    } finally {
      setSaving(false);
    }
  };

  // No more loading blocker - page renders immediately with defaults
  // Show sync status in the header instead

  return (
    <>
      <Header title="Global System Settings" isCollapsed={isCollapsed} />
      <div 
        className="pt-24 p-6 min-h-screen"
        style={{ backgroundColor: 'var(--bg-primary)' }}
      >
        {/* Header Section */}
        <div className="mb-6">
          <div className="flex items-center justify-between flex-wrap gap-4">
            <div>
              <div className="flex items-center gap-3">
                <h1 className="text-2xl font-bold" style={{ color: 'var(--text-primary)' }}>
                  Global System Settings
                </h1>
                {/* Sync Status Indicator */}
                {loading ? (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-blue-500/10 text-blue-500">
                    <Loader2 className="w-3 h-3 animate-spin" />
                    Syncing...
                  </span>
                ) : dataSource === 'server' ? (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-green-500/10 text-green-500">
                    <CheckCircle className="w-3 h-3" />
                    Synced
                  </span>
                ) : (
                  <span className="flex items-center gap-1.5 px-2 py-1 rounded-full text-xs bg-amber-500/10 text-amber-500">
                    <AlertTriangle className="w-3 h-3" />
                    Local Only
                  </span>
                )}
              </div>
              <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
                Configure system-wide settings, permissions, and workflows
              </p>
            </div>
            <div className="flex items-center gap-3">
              <button
                onClick={() => loadData(true)}
                disabled={loading}
                className="flex items-center gap-2 px-4 py-2 rounded-lg border"
                style={{ 
                  backgroundColor: 'var(--bg-card)', 
                  borderColor: 'var(--border-primary)',
                  color: 'var(--text-primary)'
                }}
              >
                <RefreshCw className={`w-4 h-4 ${loading ? 'animate-spin' : ''}`} />
                Refresh
              </button>
              {hasChanges && (
                <button
                  onClick={saveSettings}
                  disabled={saving}
                  className="flex items-center gap-2 px-4 py-2 rounded-lg text-white"
                  style={{ backgroundColor: 'var(--accent-primary)' }}
                >
                  {saving ? <Loader2 className="w-4 h-4 animate-spin" /> : <Save className="w-4 h-4" />}
                  Save Changes
                </button>
              )}
            </div>
          </div>

          {/* Offline Warning */}
          {dataSource === 'local' && !loading && (
            <div className="mt-4 p-3 rounded-lg flex items-center gap-3 border border-amber-500/50" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <AlertTriangle className="w-5 h-5 text-amber-500 flex-shrink-0" />
              <div className="flex-1">
                <span className="font-medium text-amber-600 dark:text-amber-400">
                  Unable to connect to server
                </span>
                <p className="text-sm text-amber-600/80 dark:text-amber-400/80">
                  Showing default settings. Changes cannot be saved until connection is restored.
                </p>
              </div>
              <button
                onClick={() => loadData(true)}
                className="flex items-center gap-1 px-3 py-1.5 rounded-lg text-sm bg-amber-500 text-white hover:bg-amber-600"
              >
                <RefreshCw className="w-3 h-3" />
                Retry
              </button>
            </div>
          )}

          {/* Maintenance Mode Warning */}
          {settings.maintenanceMode && (
            <div className="mt-4 p-3 rounded-lg flex items-center gap-3 border border-amber-500/50" style={{ backgroundColor: 'rgba(245, 158, 11, 0.1)' }}>
              <AlertTriangle className="w-5 h-5 text-amber-500" />
              <span className="font-medium text-amber-600 dark:text-amber-400">
                Maintenance Mode is ACTIVE - Users will see the maintenance message
              </span>
            </div>
          )}
        </div>

        {/* Settings Sections */}
        <div className="space-y-4">
          {/* Global Toggles */}
          <CollapsibleSection 
            title="Global Toggles" 
            icon={Settings} 
            defaultOpen={true}
          >
            <GlobalTogglesSection 
              settings={settings} 
              onUpdate={handleSettingsUpdate} 
              saving={saving}
            />
          </CollapsibleSection>

          {/* User Limits */}
          <CollapsibleSection 
            title="Default User Limits" 
            icon={Users}
          >
            <UserLimitsSection 
              settings={settings} 
              onUpdate={handleSettingsUpdate} 
              saving={saving}
            />
          </CollapsibleSection>

          {/* Role Permission Templates */}
          <CollapsibleSection 
            title="Role Permission Templates" 
            icon={Shield}
            badge={templates.length}
          >
            <RolePermissionsSection 
              templates={templates}
              onSave={handleSaveTemplate}
              onDelete={handleDeleteTemplate}
              loading={saving}
            />
          </CollapsibleSection>

          {/* Approval Workflows */}
          <CollapsibleSection 
            title="Approval Workflows" 
            icon={CheckCircle}
            badge={workflows.length}
          >
            <ApprovalWorkflowsSection 
              workflows={workflows}
              onSave={handleSaveWorkflow}
              onDelete={handleDeleteWorkflow}
              loading={saving}
            />
          </CollapsibleSection>

          {/* College/Hostel Limits */}
          <CollapsibleSection 
            title="College/Hostel User Limits" 
            icon={Building2}
            badge={collegeLimits.length}
          >
            <CollegeLimitsSection 
              limits={collegeLimits}
              colleges={colleges}
              onSave={handleSaveCollegeLimits}
              loading={saving}
            />
          </CollapsibleSection>
        </div>

        {/* Info Footer */}
        <div 
          className="mt-8 p-4 rounded-lg border flex items-start gap-3"
          style={{ 
            backgroundColor: 'var(--bg-card)', 
            borderColor: 'var(--border-primary)' 
          }}
        >
          <Info className="w-5 h-5 flex-shrink-0 mt-0.5" style={{ color: 'var(--accent-primary)' }} />
          <div>
            <p className="font-medium" style={{ color: 'var(--text-primary)' }}>
              About Global System Settings
            </p>
            <p className="text-sm mt-1" style={{ color: 'var(--text-secondary)' }}>
              These settings apply system-wide and affect all users. Changes to toggles take effect immediately.
              Role permission templates and approval workflows will be applied to new users and pending approvals.
              College-specific limits override the default limits set above.
            </p>
          </div>
        </div>
      </div>
    </>
  );
};

export default GlobalSystemSettings;
