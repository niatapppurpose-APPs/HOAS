import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';

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

  // Apply theme to document immediately and on changes.
  // Adds .theme-anim for a smooth cross-fade (removed after the transition).
  const animTimer = useRef(null);
  const firstRender = useRef(true);
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

      // Smooth cross-fade on every real switch (skip first paint)
      if (!firstRender.current) {
        root.classList.add('theme-anim');
        if (animTimer.current) clearTimeout(animTimer.current);
        animTimer.current = setTimeout(() => {
          document.documentElement.classList.remove('theme-anim');
          animTimer.current = null;
        }, 450);
      }
      firstRender.current = false;
    };

    applyTheme(theme);

    // Save to localStorage
    localStorage.setItem('hoas-theme', theme);

    return () => {
      if (animTimer.current) {
        clearTimeout(animTimer.current);
        animTimer.current = null;
      }
    };
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

  const toggleTheme = useCallback(() => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme(prevTheme => prevTheme === 'light' ? 'dark' : 'light');
  }, []);

  const setLightMode = useCallback(() => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme('light');
  }, []);

  const setDarkMode = useCallback(() => {
    setIsSystemMode(false);
    localStorage.setItem('hoas-theme-mode', 'manual');
    setTheme('dark');
  }, []);

  const setSystemMode = useCallback(() => {
    setIsSystemMode(true);
    localStorage.setItem('hoas-theme-mode', 'system');
    const systemTheme = getSystemTheme();
    setTheme(systemTheme);
  }, []);

  // Get the mode for UI display (light, dark, or system)
  const getMode = useCallback(() => {
    if (isSystemMode) return 'system';
    return theme;
  }, [isSystemMode, theme]);

  const isDark = theme === 'dark';
  const isLight = theme === 'light';

  const value = useMemo(() => ({
    theme,
    mode: getMode(),
    toggleTheme,
    setLightMode,
    setDarkMode,
    setSystemMode,
    isDark,
    isLight,
    isSystemMode,
  }), [theme, getMode, toggleTheme, setLightMode, setDarkMode, setSystemMode, isDark, isLight, isSystemMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
