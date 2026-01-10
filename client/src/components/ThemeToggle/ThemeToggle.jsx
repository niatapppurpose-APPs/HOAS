import { useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * A compact theme toggle button that switches between light and dark mode
 * Can be placed in headers, sidebars, or any navigation area
 */
const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { toggleTheme, setSystemMode, isDark, mode } = useTheme();
  const [clickTimeout, setClickTimeout] = useState(null);

  const sizes = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  };

  const { button, icon } = sizes[size] || sizes.md;

  const handleSingleClick = (e) => {
    // If a timer is already running, it means this is a second click coming in fast.
    // We clear the timer (canceling the single click action) to let the double click handler take over.
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
      return;
    }

    // Set a timer to delay the single click action
    const timeout = setTimeout(() => {
      toggleTheme();
      setClickTimeout(null);
    }, 250); 
    
    setClickTimeout(timeout);
  };

  const handleDoubleClick = (e) => {
    // Clear any pending single click action
    if (clickTimeout) {
      clearTimeout(clickTimeout);
      setClickTimeout(null);
    }
    e.preventDefault();
    e.stopPropagation();
    setSystemMode(); // Enable Auto System mode
  };

  return (
    <button
      id="tour-theme-toggle"
      onClick={handleSingleClick}
      onDoubleClick={handleDoubleClick}
      className={`${button} flex items-center justify-center rounded-lg transition-all duration-300 hover:scale-105 ${className}`}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: mode === 'system' ? '2px solid var(--accent-primary)' : '1px solid transparent' // Visual indicator for system mode
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (Double-click for Auto System)`}
      title={`Click: Switch Theme | Double-Click: Auto System Mode (${mode === 'system' ? 'Active' : 'Inactive'})`}
    >
      {mode === 'system' ? (
        <Monitor className={`${icon} ${isDark ? 'text-blue-400' : 'text-blue-600'} transition-transform duration-300`} />
      ) : isDark ? (
        <Sun className={`${icon} text-yellow-400 transition-transform duration-300`} />
      ) : (
        <Moon className={`${icon} text-indigo-600 transition-transform duration-300`} />
      )}
    </button>
  );
};

/**
 * A switch-style theme toggle (iOS style)
 */
export const ThemeSwitch = ({ className = '' }) => {
  const { isDark, toggleTheme } = useTheme();

  return (
    <button
      onClick={toggleTheme}
      className={`relative w-14 h-7 rounded-full transition-colors duration-300 ${className}`}
      style={{
        backgroundColor: isDark ? 'var(--accent-primary)' : '#e2e8f0',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      <div
        className={`absolute top-0.5 w-6 h-6 rounded-full shadow-md transition-all duration-300 flex items-center justify-center ${
          isDark ? 'left-7' : 'left-0.5'
        }`}
        style={{
          backgroundColor: isDark ? '#1e293b' : '#ffffff',
        }}
      >
        {isDark ? (
          <Moon className="w-3.5 h-3.5 text-indigo-400" />
        ) : (
          <Sun className="w-3.5 h-3.5 text-yellow-500" />
        )}
      </div>
    </button>
  );
};

export default ThemeToggle;
