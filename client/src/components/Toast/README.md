# Toast Notification System

A beautiful, modern toast notification system for the HOAS Project with custom theming and animations.

## Features

- 🎨 **Themed Design**: Matches the app's dark gradient theme
- 🎯 **4 Toast Types**: Success, Error, Warning, Info
- ⚡ **Smooth Animations**: Slide-in effects with auto-dismiss
- 📱 **Responsive**: Works perfectly on mobile and desktop
- 🔧 **Easy to Use**: Simple hook-based API
- ⏱️ **Auto-dismiss**: Configurable duration with progress bar
- 🎭 **Icon Support**: Lucide icons for each toast type

## Installation

The Toast system is already installed and configured in the app. It's wrapped around the entire application in `main.jsx`.

## Usage

### Basic Usage

```jsx
import { useToast } from '../../components/Toast';

function MyComponent() {
  const toast = useToast();

  const handleSuccess = () => {
    toast.success('Operation completed successfully!');
  };

  const handleError = () => {
    toast.error('Something went wrong!');
  };

  const handleWarning = () => {
    toast.warning('Please check your input!');
  };

  const handleInfo = () => {
    toast.info('Here is some information.');
  };

  return (
    <button onClick={handleSuccess}>Show Success Toast</button>
  );
}
```

### Custom Duration

```jsx
// Default duration is 4000ms (4 seconds)
toast.success('Quick message', 2000); // 2 seconds
toast.error('Important error', 6000); // 6 seconds
```

### Toast Types

1. **Success** (Green) - `toast.success(message, duration)`
   - For successful operations
   - Example: "User approved successfully!"

2. **Error** (Red) - `toast.error(message, duration)`
   - For errors and failures
   - Example: "Failed to delete user"

3. **Warning** (Orange/Yellow) - `toast.warning(message, duration)`
   - For warnings and partial success
   - Example: "Some operations failed"

4. **Info** (Blue) - `toast.info(message, duration)`
   - For informational messages
   - Example: "Loading complete"

## Position Configuration

You can configure the toast position globally in `main.jsx`:

```jsx
<ToastProvider position="top-right"> {/* default */}
  <App />
</ToastProvider>
```

Available positions:
- `top-right` (default)
- `top-left`
- `top-center`
- `bottom-right`
- `bottom-left`
- `bottom-center`

## Replaced Alert Messages

The following `alert()` calls have been replaced with toast notifications:

### Owner Dashboard (`ownersdashbord.jsx`)
- ✅ User approval/denial errors → `toast.error()`
- ✅ Bulk approval success → `toast.success()`
- ✅ Partial bulk approval → `toast.warning()`
- ✅ Bulk approval errors → `toast.error()`
- ✅ Delete college errors → `toast.error()`

### Warden Dashboard (`WardenDashboard.jsx`)
- ✅ Student status change errors → `toast.error()`

### Principal Dashboard (`PrincipalDashboard.jsx`)
- ✅ User status change errors → `toast.error()`

### Reports Page (`Reports.jsx`)
- ✅ Profile not found → `toast.warning()`
- ✅ Download errors → `toast.error()`

## Component Structure

```
components/
└── Toast/
    ├── index.js              # Main export file
    ├── Toast.jsx             # Toast component
    ├── Toast.css             # Styles and animations
    └── ToastContainer.jsx    # Provider and context
```

## Styling

The toast notifications feature:
- Gradient backgrounds matching toast type
- Smooth slide-in animations
- Auto-dismiss progress bar
- Frosted glass effect (backdrop-blur)
- Responsive design for mobile
- Clean close button
- Lucide React icons

## Examples in the App

```jsx
// Success example
const handleApprove = async (userId) => {
  try {
    await approveUser(userId);
    toast.success('User approved successfully!');
  } catch (error) {
    toast.error(`Failed to approve user: ${error.message}`);
  }
};

// Bulk operation example
const handleBulkApprove = async () => {
  if (failCount === 0) {
    toast.success(`Successfully approved ${successCount} colleges!`);
  } else {
    toast.warning(`Approved ${successCount} colleges. ${failCount} failed.`);
  }
};
```

## Development Notes

- All toast messages appear in the top-right corner by default
- Multiple toasts stack vertically
- Each toast auto-dismisses after 4 seconds
- Users can manually close toasts with the X button
- Progress bar shows remaining time
- Toasts are accessible and screen-reader friendly
