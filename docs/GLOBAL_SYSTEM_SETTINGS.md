# Global System Settings Module

## Overview

The Global System Settings module provides a comprehensive admin panel for Owner-only access to configure system-wide settings including global toggles, role permission templates, approval workflows, and user limits per college/hostel.

## Database Schema

### Firestore Collections

#### 1. `systemSettings` Collection
**Document: `global`**

```javascript
{
  // Global Toggles
  registrationEnabled: boolean,        // Allow new user registrations
  approvalsEnabled: boolean,           // Enable/disable approval workflows
  maintenanceMode: boolean,            // Put system in maintenance mode
  maintenanceMessage: string,          // Message shown during maintenance
  
  // User Limits (defaults)
  defaultStudentLimit: number,         // Default student limit per hostel (500)
  defaultWardenLimit: number,          // Default warden limit per hostel (10)
  defaultHostelLimit: number,          // Default hostel limit per college (20)
  
  // Feature Flags
  features: {
    notifications: boolean,
    reports: boolean,
    analytics: boolean,
    bulkOperations: boolean,
  },
  
  // Metadata
  updatedAt: timestamp,
  updatedBy: string (uid),
  version: number,
}
```

#### 2. `rolePermissionTemplates` Collection
**Document: `{templateId}`**

```javascript
{
  name: string,
  description: string,
  role: 'student' | 'warden' | 'management' | 'principal',
  permissions: {
    canViewReports: boolean,
    canManageStudents: boolean,
    canManageWardens: boolean,
    canApproveUsers: boolean,
    canManageHostels: boolean,
    canAccessAnalytics: boolean,
    canBulkOperations: boolean,
    canExportData: boolean,
    canViewNotifications: boolean,
    canSendNotifications: boolean,
  },
  isDefault: boolean,
  isSystemGenerated: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (uid),
}
```

#### 3. `approvalWorkflows` Collection
**Document: `{workflowId}`**

```javascript
{
  name: string,
  description: string,
  targetRole: 'student' | 'warden' | 'management',
  steps: [
    {
      order: number,
      approverRole: string,
      required: boolean,
      autoApprove: boolean,
      autoApproveConditions: object,
      timeoutHours: number,
      timeoutAction: 'escalate' | 'auto-approve' | 'auto-deny',
    }
  ],
  isActive: boolean,
  createdAt: timestamp,
  updatedAt: timestamp,
  createdBy: string (uid),
}
```

#### 4. `collegeLimits` Collection
**Document: `{collegeId}`**

```javascript
{
  collegeId: string,
  collegeName: string,
  maxStudents: number,
  maxWardens: number,
  maxHostels: number,
  currentStudents: number,       // Auto-updated by triggers
  currentWardens: number,        // Auto-updated by triggers
  currentHostels: number,        // Auto-updated by triggers
  customSettings: object,
  updatedAt: timestamp,
  updatedBy: string (uid),
}
```

#### 5. `systemSettingsAudit` Collection (Auto-created)
**Document: `{auto-generated}`**

```javascript
{
  action: string,
  changes: object,
  performedBy: string (uid),
  performedAt: timestamp,
  previousVersion: number,
  newVersion: number,
}
```

## API Endpoints (Cloud Functions)

### System Settings

| Function | Description | Access |
|----------|-------------|--------|
| `getSystemSettings` | Get global system settings | Authenticated (filtered for non-admins) |
| `updateSystemSettings` | Update global settings | Admin only |
| `getSystemStatus` | Get maintenance mode & feature flags | Public |
| `initializeSystemSettings` | Initialize with defaults | Admin only |
| `checkRegistrationAllowed` | Check if registration is enabled | Public |

### Role Permission Templates

| Function | Description | Access |
|----------|-------------|--------|
| `getRolePermissionTemplates` | Get all templates | Admin only |
| `saveRolePermissionTemplate` | Create/update template | Admin only |
| `deleteRolePermissionTemplate` | Delete template | Admin only |

### Approval Workflows

| Function | Description | Access |
|----------|-------------|--------|
| `getApprovalWorkflows` | Get all workflows | Admin only |
| `saveApprovalWorkflow` | Create/update workflow | Admin only |
| `deleteApprovalWorkflow` | Delete workflow | Admin only |

### College Limits

| Function | Description | Access |
|----------|-------------|--------|
| `getCollegeLimits` | Get limits for all colleges | Admin only |
| `setCollegeLimits` | Set limits for a college | Admin only |
| `checkCollegeCapacity` | Check if college can accept more users | Authenticated |

## Client-Side Usage

### Using the Hook

```jsx
import { useSystemSettings, useRegistrationCheck, useCollegeCapacity } from '../hooks/useSystemSettings';

// Basic usage
const MyComponent = () => {
  const { 
    settings, 
    loading, 
    isFeatureEnabled, 
    isMaintenanceMode 
  } = useSystemSettings();

  if (isMaintenanceMode()) {
    return <MaintenanceScreen message={settings.maintenanceMessage} />;
  }

  if (!isFeatureEnabled('reports')) {
    return <FeatureDisabled />;
  }

  return <ReportsPage />;
};
```

### Registration Check

```jsx
const RegistrationForm = () => {
  const { allowed, message, loading } = useRegistrationCheck();

  if (loading) return <Loading />;
  
  if (!allowed) {
    return <Alert message={message} />;
  }

  return <RegistrationFormFields />;
};
```

### College Capacity Check

```jsx
const AddStudentForm = ({ collegeId }) => {
  const { allowed, remaining, loading } = useCollegeCapacity(collegeId, 'student');

  if (!allowed) {
    return <Alert>Student limit reached. {remaining} spots remaining.</Alert>;
  }

  return <StudentFormFields />;
};
```

### Gate Components

```jsx
import { FeatureGate, MaintenanceGate, RegistrationGate } from '../hooks/useSystemSettings';

// Feature gate
<FeatureGate feature="analytics" fallback={<FeatureDisabled />}>
  <AnalyticsDashboard />
</FeatureGate>

// Maintenance gate (wrap entire app)
<MaintenanceGate>
  <App />
</MaintenanceGate>

// Registration gate
<RegistrationGate disabledComponent={<RegistrationClosed />}>
  <RegistrationForm />
</RegistrationGate>
```

## Enforcement Logic

### Backend Enforcement

The enforcement happens at the API level in Cloud Functions:

1. **Registration Check**: Before creating new users, call `checkRegistrationAllowed`
2. **Capacity Check**: Before approving users, call `checkCollegeCapacity`
3. **Permission Check**: Use role permission templates when checking user actions

### Frontend Enforcement

Use the provided hooks and gate components:

1. **Maintenance Mode**: Wrap app with `MaintenanceGate`
2. **Feature Flags**: Use `FeatureGate` or `isFeatureEnabled()`
3. **Registration**: Use `RegistrationGate` or `useRegistrationCheck()`

## Admin Panel Access

Navigate to: `/OwnersDashboard/system-settings`

The Global System Settings page includes:

1. **Global Toggles Section**
   - Registration enabled/disabled
   - Approval workflows enabled/disabled
   - Maintenance mode with custom message
   - Feature flags (notifications, reports, analytics, bulk operations)

2. **Default User Limits Section**
   - Default student limit per hostel
   - Default warden limit per hostel
   - Default hostel limit per college

3. **Role Permission Templates Section**
   - View, create, edit, delete templates
   - Assign permissions per role
   - Set default template for each role

4. **Approval Workflows Section**
   - Create multi-step approval workflows
   - Configure approver roles per step
   - Set timeout actions (escalate, auto-approve, auto-deny)

5. **College/Hostel Limits Section**
   - Override default limits per college
   - View current usage vs limits
   - Real-time count updates

## Security Rules

Add these Firestore security rules:

```javascript
rules_version = '2';
service cloud.firestore {
  match /databases/{database}/documents {
    // System settings - admin only write, authenticated read
    match /systemSettings/{document} {
      allow read: if request.auth != null;
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Role permission templates - admin only
    match /rolePermissionTemplates/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Approval workflows - admin only
    match /approvalWorkflows/{document} {
      allow read, write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // College limits - admin only write, management read own
    match /collegeLimits/{collegeId} {
      allow read: if request.auth != null && 
        (request.auth.uid == collegeId || 
         get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin');
      allow write: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
    }
    
    // Audit log - admin only
    match /systemSettingsAudit/{document} {
      allow read: if request.auth != null && 
        get(/databases/$(database)/documents/users/$(request.auth.uid)).data.role == 'admin';
      allow write: if false; // Only backend can write
    }
  }
}
```

## Initial Setup

1. Deploy the cloud functions
2. Navigate to Global System Settings as an admin
3. Settings will be auto-initialized with defaults
4. Or manually call `initializeSystemSettings` function

## Changelog

- **v1.0.0** - Initial implementation
  - Global toggles (registration, approvals, maintenance)
  - Role permission templates
  - Approval workflows
  - College/hostel user limits
  - Real-time settings sync
  - Audit logging
