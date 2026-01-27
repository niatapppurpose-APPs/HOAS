// Tour steps configuration for driver.js
export const dashboardTourSteps = (isDark) => {
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const bgColor = isDark ? '#1e293b' : '#ffffff';
  
    return [
      // STEP 1: Welcome Header
      {
        element: '#tour-welcome',
        popover: {
          title: '👋 Welcome to Owner Dashboard',
          description: 'This is your central command center for managing the entire hostel management system. Let\'s explore all the features available to you!',
          side: "bottom",
          align: 'center'
        }
      },

      // STEP 2: Sidebar Navigation
      {
        element: '#tour-sidebar',
        popover: {
          title: '📍 Navigation Sidebar',
          description: 'Access all sections of your dashboard from here. Hover to expand or pin it to keep it always visible. Navigate to Dashboard, Wardens, Students, Analytics, Reports, and more!',
          side: "right",
          align: 'start'
        }
      },

      // STEP 3: Dashboard Menu Item
      {
        element: '#tour-nav-dashboard',
        popover: {
          title: '🏠 Dashboard Home',
          description: 'Your main dashboard shows an overview of all colleges, pending approvals, and active principals at a glance.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 4: Wardens Menu Item
      {
        element: '#tour-nav-wardens',
        popover: {
          title: '🏢 Wardens Management',
          description: 'View and manage all wardens across different colleges. Search, filter, and monitor warden activities.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 5: Students Menu Item
      {
        element: '#tour-nav-students',
        popover: {
          title: '👥 Students Management',
          description: 'Access the complete student database. View student profiles, their colleges, and hostel assignments.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 6: Analytics Menu Item
      {
        element: '#tour-nav-analytics',
        popover: {
          title: '📊 Analytics Dashboard',
          description: 'Get detailed insights and statistics about your hostel management system with visual charts and reports.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 7: Reports Menu Item
      {
        element: '#tour-nav-reports',
        popover: {
          title: '📄 Reports Center',
          description: 'Generate and export detailed reports about colleges, students, wardens, and system activities.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 8: Notifications Menu Item
      {
        element: '#tour-nav-notifications',
        popover: {
          title: '🔔 Notifications',
          description: 'Stay updated with system alerts, new registrations, and important events.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 9: Settings Menu Item
      {
        element: '#tour-nav-settings',
        popover: {
          title: '⚙️ Settings',
          description: 'Customize your dashboard preferences, manage system configurations, and update your account settings.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 10: Help & Support Menu Item
      {
        element: '#tour-nav-help',
        popover: {
          title: '❓ Help & Support',
          description: 'Get help, access documentation, and contact support if you need assistance.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 11: Stats Cards
      {
        element: '#tour-stats',
        popover: {
          title: '📈 Quick Stats Overview',
          description: 'These cards show you real-time statistics: Total Colleges registered, Pending Requests awaiting approval, and Active Principals with approved access.',
          side: "bottom",
          align: 'center'
        }
      },

      // STEP 12: Approval Board Section
      {
        element: '#tour-approval-board',
        popover: {
          title: '✅ Approval Board',
          description: 'This is where you manage college registrations. Review, approve, or deny CO-ADMIN (Principal) registration requests.',
          side: "top",
          align: 'center'
        }
      },

      // STEP 13: User List Tabs
      {
        element: '#tour-user-tabs',
        popover: {
          title: '📋 Filter Tabs',
          description: 'Switch between All colleges, Pending approvals, and Approved colleges using these tabs for quick filtering.',
          side: "bottom",
          align: 'start'
        }
      },

      // STEP 14: Bulk Actions (if visible)
      {
        element: '#tour-bulk-actions',
        popover: {
          title: '⚡ Bulk Actions',
          description: 'When you have 10 or more pending requests, bulk actions appear here. Select multiple colleges and approve them all at once!',
          side: "bottom",
          align: 'start'
        }
      },

      // STEP 15: User Card Example
      {
        element: '#tour-user-card',
        popover: {
          title: '🎴 College Card',
          description: 'Each card shows college details, status, and actions. Approve, Deny, or Delete colleges directly from here.',
          side: "top",
          align: 'center'
        }
      },

      // STEP 16: Pagination Controls
      {
        element: '#tour-pagination',
        popover: {
          title: '📖 Pagination',
          description: 'Navigate through multiple pages of colleges. The system shows 15 colleges per page for better performance.',
          side: "top",
          align: 'center'
        }
      },

      // STEP 17: Theme Toggle
      {
        element: '#tour-theme-toggle',
        popover: {
          title: '🌓 Theme Toggle',
          description: 'Switch between Light and Dark modes with a single click. Double-click to enable "Auto System" mode that matches your device preferences.',
          side: "left",
          align: 'start'
        }
      },

      // STEP 18: Logout Button
      {
        element: '#tour-logout',
        popover: {
          title: '🚪 Logout',
          description: 'Click here to safely log out of your account when you\'re done.',
          side: "left",
          align: 'start'
        }
      },

      // STEP 19: Profile Section
      {
        element: '#tour-profile',
        popover: {
          title: '👤 Your Profile',
          description: 'Click here to view and edit your profile, update your photo, change password, and manage your account settings.',
          side: "right",
          align: 'start'
        }
      },

      // STEP 20: Pin Sidebar
      {
        element: '#tour-pin-sidebar',
        popover: {
          title: '📌 Pin Sidebar',
          description: 'Pin the sidebar to keep it always expanded, or unpin to let it auto-collapse when you move your mouse away.',
          side: "right",
          align: 'start'
        }
      },

      // Final Step: Tour Complete
      {
        element: '#tour-welcome',
        popover: {
          title: '🎉 Tour Complete!',
          description: 'You\'re all set! Start exploring the dashboard and manage your hostel system efficiently. You can restart this tour anytime from the Help section.',
          side: "bottom",
          align: 'center'
        }
      }
    ];
  };