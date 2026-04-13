import { createContext, useContext, useState, useEffect } from 'react';

const ThemeContext = createContext();

export const useTheme = () => {
  const context = useContext(ThemeContext);
  if (!context) {
    throw new Error('useTheme must be used within a ThemeProvider');
  }
  return context;
};

export const ThemeProvider = ({ children }) => {
  // Track if user selected "system" mode
  const [isSystemMode, setIsSystemMode] = useState(() => {
    return localStorage.getItem('hoas-theme-mode') === 'system';
  });

  // Get the actual theme (light or dark)
  const getSystemTheme = () => {
    if (typeof window !== 'undefined' && window.matchMedia) {
      return window.matchMedia('(prefers-color-scheme: dark)').matches ? 'dark' : 'light';
    }
    return 'light';
  };

  // Initialize theme from localStorage or system preference
  const [theme, setTheme] = useState(() => {
    try {
      const savedMode = localStorage.getItem('hoas-theme-mode');
      const savedTheme = localStorage.getItem('hoas-theme');

      if (savedMode === 'system') {
        return getSystemTheme();
      }

      if (savedTheme && (savedTheme === 'light' || savedTheme === 'dark')) {
        return savedTheme;
      }

      return 'light'; // Default to light
    } catch {
      return 'light';
    }
  });

  // Apply theme to document immediately and on changes
  useEffect(() => {
    const applyTheme = (themeValue) => {
      const root = document.documentElement;

      // Remove both classes first
      root.classList.remove('light', 'dark');
      // Add current theme class
      root.classList.add(themeValue);

      // Set data attribute for CSS selectors
      root.setAttribute('data-theme', themeValue);

      // Also set on body for extra compatibility
      document.body.classList.remove('light', 'dark');
      document.body.classList.add(themeValue);
      document.body.setAttribute('data-theme', themeValue);
    };

    applyTheme(theme);

    // Save to localStorage
    localStorage.setItem('hoas-theme', theme);
  }, [theme]);

  // Listen for system preference changes when in system mode
  useEffect(() => {
    if (!isSystemMode) return;

    const mediaQuery = window.matchMedia('(prefers-color-scheme: dark)');

    const handleChange = (e) => {
      const newTheme = e.matches ? 'dark' : 'light';
      setTheme(newTheme);
    };

    // Set initial theme based on system
    setTheme(getSystemTheme());

    mediaQuery.addEventListener('change', handleChange);
    return () => mediaQuery.removeEventListener('change', handleChange);
  }, [isSystemMode]);

  const toggleTheme = () => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  };

  const setLightMode = () => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme('light');
  };

  const setDarkMode = () => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme('dark');
  };

  const setSystemMode = () => {
    setIsSystemMode(true);
    localStorage.setItem('hoas-theme-mode', 'system');
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
  };

  // Get the mode for UI display (light, dark, or system)
  const getMode = () => {
    if (isSystemMode) return 'system';
    return theme;
  };

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  const value = {
    theme,
    mode: getMode(),
    toggleTheme,
    setLightMode,
    setDarkMode,
    setSystemMode,
    isDark,
    isLight,
    isSystemMode,
  };

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
