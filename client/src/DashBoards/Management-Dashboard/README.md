# Management Dashboard

A premium dark-themed management dashboard with glassmorphism effects and smooth purple-blue gradients.

## 🎨 Design Features

- **Dark Theme**: Smooth purple-blue gradient background with animated glow effects
- **Glassmorphism**: Blurred cards with subtle shadows and transparency
- **Modern UI**: Clean typography, rounded cards, spacious layout
- **Responsive**: Works on desktop, tablet, and mobile devices

## 📊 Dashboard Components

### 1. **Left Sidebar Navigation**
- Dashboard (Home)
- Wardens Management
- Students Management
- Hostels Overview
- Reports

**Note**: Analytics has been removed as per requirements.

### 2. **Top Header**
- Welcome message with username highlight
- Pending approvals badge (animated)
- Logout button
- User avatar with indicator

### 3. **KPI Cards (4 Cards)**
- **Total Wardens** (Purple) - Shows total and pending wardens
- **Total Students** (Blue) - Shows total and pending students
- **Pending Approvals** (Orange) - Attention-focused card
- **Hostels** (Green) - Total hostels under management

### 4. **Quick Approval Panel**
- User avatar and details
- Role badge
- Progress bar
- Approve button
- View Details button
- Shows first pending approval

### 5. **Recent Activity Section**
- Horizontal activity cards
- Shows latest 3 pending registrations
- User info with avatar
- Role and status badges
- Inline approve button
- Timestamp display

### 6. **Wardens & Students Status Table**
- Name with avatar
- Role badge (color-coded)
- Email address
- Status chip (Pending = orange, Approved = green)
- Pagination support

### 7. **Status Visualization**
- Circular progress indicators
- One for Wardens (Purple)
- One for Students (Blue)
- Shows Active vs Pending counts

## 🚀 Usage

### Import and Use

```jsx
import { ManagementDashboard } from './DashBoards/Management-Dashboard';

function App() {
  return <ManagementDashboard />;
}
```

### Add to Routes

```jsx
import { ManagementDashboard } from './DashBoards/Management-Dashboard';

<Route path="/management-dashboard" element={<ManagementDashboard />} />
```

## 📦 Dependencies

Required components from your existing codebase:
- `Avatar` from `components/OwnerServices/Avatar`
- `useAuth` from `context/AuthContext`
- `useToast` from `components/Toast`
- Firebase Firestore
- `cloudFunctions` for approve/deny operations

## 🎯 Key Features

1. **Action-First Design**: Management instantly sees what needs attention
2. **Real-time Updates**: Uses Firestore listeners for live data
3. **Quick Approvals**: One-click approve from multiple locations
4. **Visual Status**: Color-coded badges and progress indicators
5. **Smooth Animations**: Hover effects, transitions, and gradients

## 🎨 Color Scheme

- **Purple**: `#8B5CF6` - Wardens, Primary actions
- **Blue**: `#3B82F6` - Students, Secondary actions
- **Orange**: `#FB923C` - Pending/Attention items
- **Green**: `#10B981` - Approved/Success states
- **Red**: `#EF4444` - Deny/Logout actions

## 📱 Responsive Breakpoints

- **Desktop**: Full layout (1600px+)
- **Laptop**: Stacked visualization (1200px - 1600px)
- **Tablet**: Collapsed sidebar (768px - 1200px)
- **Mobile**: Icon-only sidebar (<768px)

## 🔧 Customization

### Modify Statistics
Edit the `stats` calculation in `ManagementDashboard.jsx`:

```jsx
const stats = {
  totalWardens: wardens.length,
  pendingWardens: wardens.filter(w => w.status === 'pending').length,
  totalStudents: students.length,
  pendingStudents: students.filter(s => s.status === 'pending').length,
  totalPending: ...,
  totalHostels: 2 // Update this with actual hostel count
};
```

### Change Gradient Colors
Edit the background gradient in `ManagementDashboard.css`:

```css
.management-dashboard {
  background: linear-gradient(135deg, #1e1b4b 0%, #312e81 25%, #4c1d95 50%, #5b21b6 75%, #6d28d9 100%);
}
```

## 🐛 Known Limitations

- Hostels count is hardcoded (needs hostel collection integration)
- Pagination for status table uses client-side filtering
- No deny button implementation (only approve)

## 📝 Future Enhancements

- [ ] Add deny/reject functionality
- [ ] Implement bulk actions
- [ ] Add search and filter
- [ ] Export reports feature
- [ ] Email notifications
- [ ] Advanced analytics charts

## 🎯 Role Requirements

This dashboard is specifically for **MANAGEMENT** role, not Owner or Admin. Ensure proper role-based access control in your routing logic.

---

Built with ❤️ for HOAS Management System
