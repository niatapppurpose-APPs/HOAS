import { createContext, useContext, useState, useEffect, useCallback, useMemo, useRef } from 'react';
import { flushSync } from 'react-dom';

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
  // Skipped when a View Transition reveal is driving the animation instead.
  // Timings match the CSS: 0.6s cross-fade / 0.9s circular reveal.
  const animTimer = useRef(null);
  const firstRender = useRef(true);
  const skipAnimRef = useRef(false);
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

      // Smooth cross-fade on every real switch (skip first paint).
      // When a View Transition reveal is active it owns the animation,
      // so the blanket transition would only fight the snapshot.
      if (!firstRender.current && !skipAnimRef.current) {
        root.classList.add('theme-anim');
        if (animTimer.current) clearTimeout(animTimer.current);
        animTimer.current = setTimeout(() => {
          document.documentElement.classList.remove('theme-anim');
          animTimer.current = null;
        }, 650);
      }
      firstRender.current = false;
      skipAnimRef.current = false;
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

  // Animated toggle: circular flash reveal expanding from (x, y) via the
  // View Transitions API where supported. Falls back to the plain toggle
  // (the .theme-anim cross-fade covers it). Honors reduced-motion.
  const toggleThemeAnimated = useCallback((x, y) => {
    const apply = () => {
      setIsSystemMode(false);
      localStorage.setItem('hoas-theme-mode', 'manual');
      setTheme(prevTheme => (prevTheme === 'light' ? 'dark' : 'light'));
    };

    const reduceMotion =
      typeof window !== 'undefined' &&
      typeof window.matchMedia === 'function' &&
      window.matchMedia('(prefers-reduced-motion: reduce)').matches;

    const canTransition =
      !reduceMotion &&
      typeof document !== 'undefined' &&
      typeof document.startViewTransition === 'function';

    if (!canTransition) {
      apply();
      return;
    }

    const root = document.documentElement;
    if (typeof x === 'number') root.style.setProperty('--theme-flash-x', `${x}px`);
    if (typeof y === 'number') root.style.setProperty('--theme-flash-y', `${y}px`);

    skipAnimRef.current = true;
    try {
      document.startViewTransition(() => {
        flushSync(apply);
      });
    } catch {
      skipAnimRef.current = false;
      apply();
    }
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
    toggleThemeAnimated,
    setLightMode,
    setDarkMode,
    setSystemMode,
    isDark,
    isLight,
    isSystemMode,
  }), [theme, getMode, toggleTheme, toggleThemeAnimated, setLightMode, setDarkMode, setSystemMode, isDark, isLight, isSystemMode]);

  return (
    <ThemeContext.Provider value={value}>
      {children}
    </ThemeContext.Provider>
  );
};

export default ThemeContext;
