// Student Dashboard Tour Steps (driver.js)
// Targets elements rendered by StudentDashboard + StudentSidebar

export const studentTourSteps = () => [
  // Welcome
  {
    element: '#student-tour-welcome',
    popover: {
      title: '👋 Welcome to Your Student Portal!',
      description: 'This is your personal hostel dashboard. View complaints, apply for leave, check announcements, and manage your profile.',
      side: 'bottom',
      align: 'center',
    },
  },

  // Sidebar
  {
    element: '#student-tour-sidebar',
    popover: {
      title: '📍 Navigation Sidebar',
      description: 'Access all sections from here. Hover to expand or pin it to keep it visible.',
      side: 'right',
      align: 'start',
    },
  },

  // Sidebar nav items
  {
    element: '#student-tour-nav-dashboard',
    popover: {
      title: '🏠 Dashboard',
      description: 'Your main overview showing quick actions, recent complaint updates, and your profile summary.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#student-tour-nav-complaints',
    popover: {
      title: '📝 Complaints',
      description: 'File new complaints about room maintenance, common areas, or any hostel issues. Track their resolution status.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#student-tour-nav-leave',
    popover: {
      title: '📅 Leave Requests',
      description: 'Apply for hostel leave or outings. Your warden will review and approve your requests.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#student-tour-nav-announcements',
    popover: {
      title: '🔔 Announcements',
      description: 'Stay updated with important notices from your warden and college management.',
      side: 'right',
      align: 'start',
    },
  },

  // Bottom nav
  {
    element: '#student-tour-nav-settings',
    popover: {
      title: '⚙️ Settings',
      description: 'Manage your account preferences and notification settings.',
      side: 'right',
      align: 'start',
    },
  },
  {
    element: '#student-tour-nav-help',
    popover: {
      title: '❓ Help & Support',
      description: 'Get help and contact support if you face any issues.',
      side: 'right',
      align: 'start',
    },
  },

  // Main content
  {
    element: '#student-tour-actions',
    popover: {
      title: '⚡ Quick Actions',
      description: 'One-tap access to file complaints, view your complaints, apply for leave, and check the notice board.',
      side: 'bottom',
      align: 'center',
    },
  },
  {
    element: '#student-tour-activity',
    popover: {
      title: '📋 Recent Activity',
      description: 'Track your filed complaints here. See real-time status updates — pending, in-progress, or resolved.',
      side: 'top',
      align: 'center',
    },
  },
  {
    element: '#student-tour-info',
    popover: {
      title: '🪪 Your Profile',
      description: 'Your student details at a glance — phone, room, student ID, and college. Click to edit or view full profile.',
      side: 'left',
      align: 'start',
    },
  },
  {
    element: '#student-tour-gatepass',
    popover: {
      title: '🚪 Gate Pass Status',
      description: 'Check your current gate pass or outing status at a glance.',
      side: 'left',
      align: 'start',
    },
  },

  // Profile in sidebar
  {
    element: '#student-tour-profile',
    popover: {
      title: '👤 Profile',
      description: 'View and update your personal details from here.',
      side: 'right',
      align: 'start',
    },
  },

  // Finish
  {
    element: '#student-tour-welcome',
    popover: {
      title: '🎉 Tour Complete!',
      description: 'You\'re all set! Explore your student portal and manage your hostel experience. Restart this tour anytime from the Help section.',
      side: 'bottom',
      align: 'center',
    },
  },
];
