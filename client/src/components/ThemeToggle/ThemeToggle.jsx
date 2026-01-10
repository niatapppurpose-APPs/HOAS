import { useTheme } from '../../context/ThemeContext';
import { Sun, Moon } from 'lucide-react';

/**
 * A compact theme toggle button that switches between light and dark mode
 * Can be placed in headers, sidebars, or any navigation area
 */
const ThemeToggle = ({ className = '', size = 'md' }) => {
  const { toggleTheme, isDark } = useTheme();

  const sizes = {
    sm: { button: 'w-8 h-8', icon: 'w-4 h-4' },
    md: { button: 'w-10 h-10', icon: 'w-5 h-5' },
    lg: { button: 'w-12 h-12', icon: 'w-6 h-6' },
  };

  const { button, icon } = sizes[size] || sizes.md;

  return (
    <button
      onClick={toggleTheme}
      className={`${button} flex items-center justify-center rounded-lg transition-all duration-300 hover:scale-105 ${className}`}
      style={{
        backgroundColor: 'var(--bg-tertiary)',
        color: 'var(--text-primary)',
      }}
      aria-label={`Switch to ${isDark ? 'light' : 'dark'} mode`}
      title={`Switch to ${isDark ? 'light' : 'dark'} mode`}
    >
      {isDark ? (
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
