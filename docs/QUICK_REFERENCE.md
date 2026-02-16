# Quick Reference Guide

## 🎯 Quick Access

### Context Hooks

```jsx
// Authentication
import { useAuth } from './context/AuthContext';
const { user, isAdmin, loading, logout } = useAuth();

// Modal Management
import { useModal } from './context/ModalContext';
const { openDeleteModal, closeDeleteModal } = useModal();

// Toast Notifications
import { useToast } from './components/Toast';
const toast = useToast();
toast.success('Success!');
toast.error('Error!');
toast.warning('Warning!');
toast.info('Info!');
```

### Navigation

```jsx
import { useNavigate } from 'react-router-dom';
const navigate = useNavigate();

navigate('/');                    // Go home
navigate('/dashboard');           // Go to dashboard
navigate(-1);                     // Go back
navigate('/OwnersDashboard');     // Admin dashboard
```

### Modal Usage

```jsx
const { openDeleteModal } = useModal();

// Open modal with data
openDeleteModal({
  college: collegeData,
  wardenCount: 5,
  studentCount: 100,
  onConfirm: async () => {
    await deleteCollegeAPI(id);
    toast.success('Deleted!');
  }
});
```

### Routes Map

| Route | Component | Purpose |
|-------|-----------|---------|
| `/` | Home | Landing page |
| `/login` | Login | User login |
| `/admin-login` | (redirects to `/login`) | Admin login (use `/login`) |
| `/dashboard` | Dashboard | Main dashboard |
| `/waiting-approval` | WaitingApproval | Pending approval |
| `/profile/student-profile` | StudentProfile | Student setup |
| `/profile/warden-profile` | WardenProfile | Warden setup |
| `/profile/management-profile` | ManagementProfile | Management setup |
| `/dashboard/student` | StudentDashboard | Student area |
| `/dashboard/warden` | WardenDashboard | Warden area |
| `/dashboard/management` | ManagementDashboard | Management area |
| `/OwnersDashboard` | OwnersDashboard | Admin main |
| `/OwnersDashboard/wardens` | Wardens | Manage wardens |
| `/OwnersDashboard/students` | Students | Manage students |
| `/OwnersDashboard/analytics` | Analytics | View analytics |
| `/OwnersDashboard/reports` | Reports | Generate reports |
| `/*` | NotFound | 404 page |

### Component Locations

```
components/
├── Toast/              # Toast notifications
├── Routes/             # Route definitions
└── OwnerServices/      # Admin components
    ├── GlobalDeleteModal.jsx
    ├── DeleteConfirmModal.jsx (legacy)
    ├── Avatar.jsx
    ├── StatusBadge.jsx
    └── StatsCard.jsx

context/
├── AuthContext.jsx     # Authentication
└── ModalContext.jsx    # Modal state

Pages/
├── NotFound/           # 404 page
├── HOME/
├── LoginPage/
├── Dashboard/
├── OwnersDashboard/
└── ... (other pages)
```

### Common Patterns

#### Protected Route Check
```jsx
const { user, isAdmin } = useAuth();

useEffect(() => {
  if (!user || !isAdmin) {
    navigate('/login');
  }
}, [user, isAdmin, navigate]);
```

#### Delete with Confirmation
```jsx
const handleDelete = async (college) => {
  const stats = await getCollegeStats(college.id);
  
  openDeleteModal({
    college,
    wardenCount: stats.wardens.total,
    studentCount: stats.students.total,
    onConfirm: async () => {
      await cloudFunctions.deleteCollege(college.id);
      toast.success('College deleted successfully!');
    }
  });
};
```

#### Form Submission with Toast
```jsx
const handleSubmit = async (data) => {
  try {
    await submitForm(data);
    toast.success('Submitted successfully!');
    navigate('/dashboard');
  } catch (error) {
    toast.error(`Failed: ${error.message}`);
  }
};
```

#### API Call Pattern
```jsx
const fetchData = async () => {
  setLoading(true);
  try {
    const response = await cloudFunctions.getData();
    setData(response);
  } catch (error) {
    toast.error(`Error: ${error.message}`);
  } finally {
    setLoading(false);
  }
};
```

### Styling Classes (Tailwind)

#### Common Color Schemes
```css
/* Success */
bg-green-500 text-green-400 border-green-500/30

/* Error */
bg-red-500 text-red-400 border-red-500/30

/* Warning */
bg-yellow-500 text-yellow-400 border-yellow-500/30

/* Info */
bg-blue-500 text-blue-400 border-blue-500/30

/* Gradient Background */
bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900

/* Card */
bg-slate-800 border border-slate-700 rounded-2xl shadow-xl
```

### Environment Setup

```bash
# Development
cd client
npm run dev

# Build
npm run build

# Preview
npm run preview
```

### Debugging Tips

```jsx
// Log user data
console.log('User:', user);
console.log('Is Admin:', isAdmin);

// Check modal state
const { deleteModal } = useModal();
console.log('Modal state:', deleteModal);

// Test toast
toast.info('Testing toast system');
```

---

## 📚 Documentation Files

- `ROUTING_AND_CONTEXT.md` - Full routing & context guide
- `CONTEXT_ARCHITECTURE.md` - Visual diagrams
- `TOAST_SYSTEM.md` - Toast notification docs
- This file - Quick reference

---

## 🎨 Design Tokens

```css
/* Colors */
--primary-blue: #3b82f6
--primary-purple: #8b5cf6
--success-green: #10b981
--error-red: #ef4444
--warning-orange: #f59e0b

/* Dark Theme */
--bg-dark: #0f172a (slate-900)
--bg-medium: #1e293b (slate-800)
--bg-light: #334155 (slate-700)
--text-primary: #f1f5f9 (slate-100)
--text-secondary: #94a3b8 (slate-400)

/* Spacing */
--spacing-sm: 8px
--spacing-md: 16px
--spacing-lg: 24px
--spacing-xl: 32px

/* Border Radius */
--radius-sm: 8px
--radius-md: 12px
--radius-lg: 16px
--radius-xl: 24px
```

---

## 🚀 Component Templates

### Basic Page Template
```jsx
import { useState, useEffect } from 'react';
import { useNavigate } from 'react-router-dom';
import { useAuth } from '../../context/AuthContext';
import { useToast } from '../../components/Toast';

const MyPage = () => {
  const navigate = useNavigate();
  const { user } = useAuth();
  const toast = useToast();
  const [loading, setLoading] = useState(false);

  useEffect(() => {
    // Load data
  }, []);

  return (
    <div className="min-h-screen bg-gradient-to-br from-slate-900 via-slate-800 to-slate-900">
      {/* Your content */}
    </div>
  );
};

export default MyPage;
```

### Modal-Enabled Component
```jsx
import { useModal } from '../../context/ModalContext';
import { useToast } from '../../components/Toast';

const ManagementComponent = () => {
  const { openDeleteModal } = useModal();
  const toast = useToast();

  const handleDelete = async (item) => {
    openDeleteModal({
      college: item,
      wardenCount: item.wardenCount || 0,
      studentCount: item.studentCount || 0,
      onConfirm: async () => {
        await deleteItem(item.id);
        toast.success('Deleted successfully!');
      }
    });
  };

  return (
    <button onClick={() => handleDelete(item)}>
      Delete
    </button>
  );
};

export default ManagementComponent;
```

---

## ✅ Checklist

### For New Components
- [ ] Import necessary hooks (useAuth, useToast, useNavigate)
- [ ] Use ModalContext if deletion is needed
- [ ] Add loading states
- [ ] Use toast for user feedback
- [ ] Match app's dark theme
- [ ] Add responsive classes
- [ ] Handle errors gracefully

### For New Pages
- [ ] Add route in `Routes/index.jsx`
- [ ] Implement authentication check if needed
- [ ] Use consistent styling (gradients, colors)
- [ ] Add loading states
- [ ] Test on mobile devices
- [ ] Add to documentation

---

Quick, easy, and always at your fingertips! 🎯
