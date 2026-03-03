import { ShieldOff } from 'lucide-react';

/**
 * Fallback component shown when a feature is disabled via system settings.
 */
const FeatureDisabled = ({ feature = 'This feature' }) => {
  const featureLabels = {
    notifications: 'Notifications',
    reports: 'Reports',
    analytics: 'Analytics',
    bulkOperations: 'Bulk Operations',
  };

  const label = featureLabels[feature] || feature;

  return (
    <div className="flex flex-col items-center justify-center min-h-[60vh] p-8">
      <div className="w-16 h-16 mb-4 rounded-full flex items-center justify-center"
        style={{ backgroundColor: 'rgba(239, 68, 68, 0.1)' }}>
        <ShieldOff className="w-8 h-8 text-red-500" />
      </div>
      <h2 className="text-xl font-bold mb-2" style={{ color: 'var(--text-primary)' }}>
        {label} Disabled
      </h2>
      <p className="text-sm text-center max-w-md" style={{ color: 'var(--text-muted)' }}>
        The <strong>{label}</strong> feature has been disabled by the system administrator.
        Please contact the owner if you believe this is an error.
      </p>
    </div>
  );
};

export default FeatureDisabled;
