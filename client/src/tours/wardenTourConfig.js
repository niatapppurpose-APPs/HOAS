// Warden Dashboard Tour Steps (driver.js)
// Targets elements rendered by WardenDashboard + WardenSidebar

export const wardenTourSteps = (isDark) => [
  // Welcome
  {
    element: '#warden-tour-welcome',
    popover: {
      title: '👋 Welcome, Warden!',
      description: 'This is your command center for managing hostel operations. Let\'s walk through every feature available to you!',
      side: 'bottom',
      align: 'center',
    },
  },

  // Sidebar
  {
    element: '#warden-tour-sidebar',
    popover: {
      title: '📍 Navigation Sidebar',
      description: 'Access all sections from here — students, complaints, leave requests, and announcements. Hover to expand or pin it.',
      side: 'right',
      align: 'start',
    },
  },

  // Sidebar nav items
  {
    element: '#warden-tour-nav-dashboard',
    popover: {
      title: '🏠 Dashboard',
      description: 'Your main overview with quick actions, recent complaints, and your profile summary.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#warden-tour-nav-students',
    popover: {
      title: '👥 Students',
      description: 'View the complete student directory for your hostel. Check rooms, contact info, and attendance.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#warden-tour-nav-complaints',
    popover: {
      title: '📝 Complaints',
      description: 'Review and resolve complaints raised by students. Track status from pending to resolved.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#warden-tour-nav-leave-requests',
    popover: {
      title: '📅 Leave Requests',
      description: 'Manage student leave and gate-pass requests. Approve or deny as needed.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#warden-tour-nav-announcements',
    popover: {
      title: '🔔 Announcements',
      description: 'Post important notices and announcements for students in your hostel.',
      side: 'right',
      align: 'start',
    },
  },

  // Bottom nav
  {
    element: '#warden-tour-nav-settings',
    popover: {
      title: '⚙️ Settings',
      description: 'Manage your preferences and notification settings.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#warden-tour-nav-help',
    popover: {
      title: '❓ Help & Support',
      description: 'Get assistance, documentation, and support for your dashboard.',
      side: 'right',
      align: 'start',
    },
  },

  // Main content
  {
    element: '#warden-tour-actions',
    popover: {
      title: '⚡ Quick Actions',
      description: 'One-tap access to your most-used features — Complaints, Students, Notice Board, and Attendance.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#warden-tour-activity',
    popover: {
      title: '📋 Recent Activity',
      description: 'Live feed of the latest complaints from students. Click any item to view details and take action.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#warden-tour-info',
    popover: {
      title: '🪪 Your Profile Card',
      description: 'Your warden profile at a glance — contact details, college, and quick access to edit your info.',
      side: 'left',
      align: 'start',
    },
  },

  // Profile in sidebar
  {
    element: '#warden-tour-profile',
    popover: {
      title: '👤 Profile',
      description: 'Click here to view your full profile and update your personal details.',
      side: 'right',
      align: 'start',
    },
  },

  // Finish
  {
    element: '#warden-tour-welcome',
    popover: {
      title: '🎉 Tour Complete!',
      description: 'You\'re all set! Start managing your hostel operations efficiently. Restart this tour from the Help section anytime.',
      side: 'bottom',
      align: 'center',
    },
  },
];
