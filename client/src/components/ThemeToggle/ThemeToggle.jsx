import { useRef, useState } from 'react';
import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon, Monitor } from 'lucide-react';

/**
 * A compact theme toggle button that switches between light and dark mode
 * Can be placed in headers, sidebars, or any navigation area.
 * Single click plays a flash-wipe theme animation (fires instantly);
 * double-click enables Auto System mode.
 */
const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { toggleThemeAnimated, setSystemMode, isDark, mode } = useTheme();
  const [flashKey, setFlashKey] = useState(0);
  const buttonRef = useRef(null);

  const sizes = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  };

  const { button, icon } = sizes[size] || sizes.md;

  // Fires instantly on click — no artificial delay, so the wipe feels glued
  // to the finger. A double-click toggles twice then lands on system mode.
  const fireToggle = () => {
    // Origin for the circular wipe: center of this button in viewport coords
    let x;
    let y;
    if (buttonRef.current) {
      const rect = buttonRef.current.getBoundingClientRect();
      x = rect.left + rect.width / 2;
      y = rect.top + rect.height / 2;
    }
    setFlashKey((k) => k + 1);
    toggleThemeAnimated(x, y);
  };

  const handleDoubleClick = (e) => {
    e.preventDefault();
    e.stopPropagation();
    setSystemMode(); // Enable Auto System mode
  };

  return (
    <button
      id="tour-theme-toggle"
      ref={buttonRef}
      onClick={fireToggle}
      onDoubleClick={handleDoubleClick}
      className={`${button} relative flex items-center justify-center rounded-lg transition-all duration-300 hover:scale-105 active:scale-95 ${className}`}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
        border: mode === 'system' ? '2px solid var(--accent-primary)' : '1px solid transparent' // Visual indicator for system mode
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode (Double-click for Auto System)`}
      title={`Click: Switch Theme | Double-Click: Auto System Mode (${mode === 'system' ? 'Active' : 'Inactive'})`}
    >
      {flashKey > 0 && (
        <span
          key={flashKey}
          aria-hidden="true"
          className="theme-toggle-flash"
          onAnimationEnd={(e) => {
            if (e.target === e.currentTarget) setFlashKey(0);
          }}
        />
      )}
      <span key={`${mode}-${isDark ? 'dark' : 'light'}`} className="theme-toggle-icon">
        {mode === 'system' ? (
          <Monitor className={`${icon} ${isDark ? 'text-blue-400' : 'text-blue-600'} transition-transform duration-300`} />
        ) : isDark ? (
          <Sun className={`${icon} text-yellow-400 transition-transform duration-300`} />
        ) : (
          <Moon className={`${icon} text-indigo-600 transition-transform duration-300`} />
        )}
      </span>
    </button>
  );
};

/**
 * A switch-style theme toggle (iOS style)
 */
export const ThemeSwitch = ({ className = '' }) => {
  const { isDark, toggleThemeAnimated } = useTheme();

  return (
    <button
      onClick={(e) => {
        const rect = e.currentTarget.getBoundingClientRect();
        toggleThemeAnimated(rect.left + rect.width / 2, rect.top + rect.height / 2);
      }}
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
