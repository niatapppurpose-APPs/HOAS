// Tour steps configuration for driver.js
export const dashboardTourSteps = (isDark) => {
    const textColor = isDark ? '#ffffff' : '#0f172a';
    const bgColor = isDark ? '#1e293b' : '#ffffff';
  
    return [
      {
        element: '#tour-welcome',
        popover: {
          title: 'Welcome to Your Dashboard',
          description: 'This is your central command center. Here you can manage everything related to your hostel management system.',
          side: "center",
          align: 'start'
        }
      },
      {
        element: '#tour-stats', // We need to add IDs to these elements
        popover: {
          title: 'Quick Stats',
          description: 'Get an immediate overview of your system stats like Total Principals, Pending Requests, and Active Users.',
          side: "bottom",
          align: 'start'
        }
      },
      {
        element: '#tour-approval-board',
        popover: {
            title: 'Approval Board',
            description: 'This is where you manage pending requests. You can approve or deny requests from here.',
            side: "top",
            align: 'start'
        }
    },
      {
        element: '#tour-theme-toggle', // Header theme toggle
        popover: {
          title: 'Theme & System Settings',
          description: 'Toggle between Light and Dark modes. Double-click to enable "Auto System" mode matches your device settings.',
          side: "left",
          align: 'start'
        }
      },
      {
        element: '#tour-profile', // Profile dropdown
        popover: {
          title: 'Your Profile',
          description: 'Manage your account settings, view your profile details, or logout from the system.',
          side: "left",
          align: 'start'
        }
      }
    ];
  };