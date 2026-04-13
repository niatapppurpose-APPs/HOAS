// Management Dashboard Tour Steps (driver.js)
// Targets elements rendered by ManagementDashboard + ManagementSidebar

export const managementTourSteps = () => [
  // Welcome
  {
    element: '#mgmt-tour-welcome',
    popover: {
      title: '👋 Welcome to Management Dashboard',
      description: 'This is your college management hub. Monitor wardens, students, hostels, and handle approvals — all from one place!',
      side: 'bottom',
      align: 'center',
    },
  },

  // Sidebar
  {
    element: '#mgmt-tour-sidebar',
    popover: {
      title: '📍 Navigation Sidebar',
      description: 'Navigate through all sections of your management dashboard. Hover to expand or pin it open.',
      side: 'right',
      align: 'start',
    },
  },

  // Sidebar nav items
  {
    element: '#mgmt-tour-nav-dashboard',
    popover: {
      title: '🏠 Dashboard Overview',
      description: 'Your main view with KPI cards, pending approvals, and a status table of all users under your college.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-wardens',
    popover: {
      title: '🛡️ Wardens',
      description: 'View and manage all wardens registered under your college. Approve or deny their registration requests.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-students',
    popover: {
      title: '👥 Students',
      description: 'Access the complete student directory of your college. View profiles and manage approvals.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-hostels',
    popover: {
      title: '🏘️ Hostels',
      description: 'Manage hostel blocks, room assignments, and capacity details for your college.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-complaints',
    popover: {
      title: '💬 Complaints',
      description: 'Monitor and resolve complaints raised by students across your hostels.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-reports',
    popover: {
      title: '📄 Reports',
      description: 'Generate and export detailed reports about your college operations.',
      side: 'right',
      align: 'start',
    },
  },

  // Bottom nav
  {
    element: '#mgmt-tour-nav-settings',
    popover: {
      title: '⚙️ Settings',
      description: 'Configure your college dashboard settings and preferences.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#mgmt-tour-nav-help',
    popover: {
      title: '❓ Help & Support',
      description: 'Get help, access documentation, and contact support if you need assistance.',
      side: 'right',
      align: 'start',
    },
  },

  // Main content
  {
    element: '#mgmt-tour-kpi',
    popover: {
      title: '📊 KPI Cards',
      description: 'Quick stats showing total wardens, students, pending approvals, and hostel count at a glance.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#mgmt-tour-activity',
    popover: {
      title: '🔔 Recent Activity',
      description: 'See new pending registration requests from wardens and students. Approve them directly from here!',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#mgmt-tour-status-table',
    popover: {
      title: '📋 Status Table',
      description: 'A detailed table of all users under your management. Search, filter, and review user statuses.',
      side: 'top',
      align: 'center',
    },
  },

  // Profile
  {
    element: '#mgmt-tour-profile',
    popover: {
      title: '👤 Your Profile',
      description: 'View and edit your college admin profile, upload logo, and manage account settings.',
      side: 'right',
      align: 'start',
    },
  },

  // Finish
  {
    element: '#mgmt-tour-welcome',
    popover: {
      title: '🎉 Tour Complete!',
      description: 'You\'re all set! Manage your college effectively. Restart this tour anytime from the Help section.',
      side: 'bottom',
      align: 'center',
    },
  },
];
