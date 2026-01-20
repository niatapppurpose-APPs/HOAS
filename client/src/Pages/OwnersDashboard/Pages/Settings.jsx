import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { useTheme } from '../../../context/ThemeContext';
import { useOutletContext, useLocation, useNavigate } from 'react-router-dom';
import { HexColorPicker } from "react-colorful"
import Header from '../../../components/OwnerServices/header';
import { Sun, Moon, Monitor, PlayCircle, Loader2 } from 'lucide-react';

const Settings = () => {
  const { isCollapsed } = useOutletContext();
  const location = useLocation();
  const navigate = useNavigate();
  const { userData, updateUserTheme } = useAuth();
  const { theme, mode, setLightMode, setDarkMode, setSystemMode, isDark, isSystemMode } = useTheme();
  const initial = userData?.theme || {};

  const [primary, setPrimary] = useState(initial.primary || '#6366F1');
  const [secondary, setSecondary] = useState(initial.secondary || '#8B5CF6');
  const [background, setBackground] = useState(initial.background || '#ffffff');
  const [surface, setSurface] = useState(initial.surface || '#0f172a');
  const [textColor, setTextColor] = useState(initial.text || '#ffffff');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');
  
  // Tour specific state
  const [tourCountdown, setTourCountdown] = useState(null);

  useEffect(() => {
    if (tourCountdown === null) return;
    
    if (tourCountdown > 0) {
      const timer = setTimeout(() => setTourCountdown(prev => prev - 1), 1000);
      return () => clearTimeout(timer);
    } else {
      // Countdown finished
      navigate('/OwnersDashboard', { state: { startTour: true } });
      setTourCountdown(null);
    }
  }, [tourCountdown, navigate]);

  const startTourTest = () => {
    setTourCountdown(5);
  };

  // Restore scroll position when coming back from profile
  useEffect(() => {
    if (location.state?.scrollPosition) {
      setTimeout(() => {
        window.scrollTo(0, location.state.scrollPosition);
        // Clear the state after restoring
        window.history.replaceState({}, document.title);
      }, 100);
    }
    // Clear sessionStorage after checking
    sessionStorage.removeItem('settingsPageState');
  }, [location.state]);

  useEffect(() => {
    if (userData?.theme) {
      setPrimary(userData.theme.primary || primary);
      setSecondary(userData.theme.secondary || secondary);
      setBackground(userData.theme.background || background);
      setSurface(userData.theme.surface || surface);
      setTextColor(userData.theme.text || textColor);
    }
    // eslint-disable-next-line react-hooks/exhaustive-deps
  }, [userData]);

  const handleSave = async () => {
    setSaving(true);
    setMessage('');
    const theme = { primary, secondary, surface, text: textColor, background };
    const ok = await updateUserTheme(theme);
    if (ok) setMessage('Theme saved');
    else setMessage('Save failed');
    setSaving(false);
    setTimeout(() => setMessage(''), 2500);
  };

  // Save page state before navigating away
  const savePageState = () => {
    const state = {
      scrollPosition: window.scrollY,
      returnPath: '/OwnersDashboard/settings'
    };
    sessionStorage.setItem('settingsPageState', JSON.stringify(state));
    return state;
  };

  return (
    <>
      <Header 
        title="Settings" 
        isCollapsed={isCollapsed}
        onProfileClick={savePageState}
      />
      <div className="pt-24 p-6" style={{ backgroundColor: 'var(--bg-primary)', minHeight: '100vh' }}>
        {/* Appearance Mode Section */}
        <div className="mb-10">
          <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold mb-2">Appearance</h1>
          <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-6">Choose how the dashboard looks for you. Select a single theme or sync with your system settings.</p>
          
          <div className="flex flex-wrap gap-4">
            {/* Light Mode Button */}
            <button
              onClick={() => setLightMode()}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 min-w-[140px] ${
                mode === 'light' 
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'hover:border-slate-500'
              }`}
              style={{ 
                backgroundColor: mode === 'light' ? 'var(--accent-primary)' : 'var(--bg-card)',
                borderColor: mode === 'light' ? undefined : 'var(--border-secondary)'
              }}
            >
              <Sun 
                className={`w-8 h-8 mb-3 ${mode === 'light' ? 'text-white' : ''}`}
                style={{ color: mode === 'light' ? '#ffffff' : 'var(--text-secondary)' }}
              />
              <span 
                className="font-medium"
                style={{ color: mode === 'light' ? '#ffffff' : 'var(--text-primary)' }}
              >
                Light
              </span>
              <span 
                className="text-xs mt-1"
                style={{ color: mode === 'light' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
              >
                Bright & Clean
              </span>
            </button>

            {/* Dark Mode Button */}
            <button
              onClick={() => setDarkMode()}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 min-w-[140px] ${
                mode === 'dark' 
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'hover:border-slate-500'
              }`}
              style={{ 
                backgroundColor: mode === 'dark' ? 'var(--accent-primary)' : 'var(--bg-card)',
                borderColor: mode === 'dark' ? undefined : 'var(--border-secondary)'
              }}
            >
              <Moon 
                className={`w-8 h-8 mb-3`}
                style={{ color: mode === 'dark' ? '#ffffff' : 'var(--text-secondary)' }}
              />
              <span 
                className="font-medium"
                style={{ color: mode === 'dark' ? '#ffffff' : 'var(--text-primary)' }}
              >
                Dark
              </span>
              <span 
                className="text-xs mt-1"
                style={{ color: mode === 'dark' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
              >
                Easy on eyes
              </span>
            </button>

            {/* System Mode Button */}
            <button
              onClick={() => setSystemMode()}
              className={`flex flex-col items-center justify-center p-6 rounded-xl border-2 transition-all duration-300 min-w-[140px] ${
                mode === 'system' 
                  ? 'border-indigo-500 shadow-lg shadow-indigo-500/20' 
                  : 'hover:border-slate-500'
              }`}
              style={{ 
                backgroundColor: mode === 'system' ? 'var(--accent-primary)' : 'var(--bg-card)',
                borderColor: mode === 'system' ? undefined : 'var(--border-secondary)'
              }}
            >
              <Monitor 
                className={`w-8 h-8 mb-3`}
                style={{ color: mode === 'system' ? '#ffffff' : 'var(--text-secondary)' }}
              />
              <span 
                className="font-medium"
                style={{ color: mode === 'system' ? '#ffffff' : 'var(--text-primary)' }}
              >
                System
              </span>
              <span 
                className="text-xs mt-1"
                style={{ color: mode === 'system' ? 'rgba(255,255,255,0.8)' : 'var(--text-muted)' }}
              >
                Auto switch
              </span>
            </button>
          </div>

          {/* Current Theme Indicator */}
          <div 
            className="mt-4 inline-flex items-center gap-2 px-4 py-2 rounded-full text-sm"
            style={{ backgroundColor: 'var(--bg-tertiary)', color: 'var(--text-secondary)' }}
          >
            {isDark ? <Moon className="w-4 h-4" /> : <Sun className="w-4 h-4" />}
            <span>Currently using <strong style={{ color: 'var(--text-primary)' }}>{theme}</strong> mode{isSystemMode && ' (System)'}</span>
          </div>
        </div>

        {/* Divider */}
        <hr style={{ borderColor: 'var(--border-primary)' }} className="mb-10" />

        {/* Custom Color Theme Section */}
        <h1 style={{ color: 'var(--text-primary)' }} className="text-2xl font-bold mb-4">Custom Color Theme</h1>
        <p style={{ color: 'var(--text-secondary)' }} className="text-sm mb-6">Personalize your dashboard colors to match your brand or preference.</p>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-10">
          <label 
            className="flex item-center justify-center flex-col gap-3 rounded-lg p-8 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Primary</span>
            <HexColorPicker color={primary} onChange={setPrimary} className="flex item-center justify-center rounded-xl shadow-lg" />
          </label>

          <label 
            className="flex flex-col gap-3 rounded-lg p-8 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Secondary</span>
            <HexColorPicker color={secondary} onChange={setSecondary} className="rounded-xl shadow-lg" />
          </label>

          <label 
            className="flex flex-col gap-3 rounded-lg p-8 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Surface</span>
            <HexColorPicker color={surface} onChange={setSurface} className="rounded-xl shadow-lg" />
          </label>

          <label 
            className="flex flex-col gap-3 rounded-lg p-8 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Text</span>
            <HexColorPicker color={textColor} onChange={setTextColor} className="rounded-xl shadow-lg" />
          </label>

          <label 
            className="flex flex-col gap-3 rounded-lg p-8 transition-colors"
            style={{ backgroundColor: 'var(--bg-card)', border: '1px solid var(--border-primary)' }}
          >
            <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>Background</span>
            <HexColorPicker color={background} onChange={setBackground} className="rounded-xl shadow-lg" />
          </label>
        </div>


        <div className="mt-6 flex items-center gap-3">
          <button 
            onClick={handleSave} 
            disabled={saving} 
            className="px-4 py-2 rounded text-white transition-colors"
            style={{ backgroundColor: 'var(--accent-primary)' }}
          >
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
          {message && <span className="text-sm" style={{ color: 'var(--text-secondary)' }}>{message}</span>}
        </div>

        {/* User Experience / Tour Section */}
        <div className="mt-12 pt-8 border-t" style={{ borderColor: 'var(--border-primary)' }}>
          <h3 className="text-lg font-semibold mb-4" style={{ color: 'var(--text-primary)' }}>System Onboarding</h3>
          <p className="mb-6 text-sm" style={{ color: 'var(--text-secondary)' }}>
            Test the new user tour functionality. This will trigger a guided walkthrough of the dashboard features.
          </p>
          
          <button
            onClick={startTourTest}
            disabled={tourCountdown !== null}
            className={`flex items-center gap-3 px-6 py-3 rounded-xl transition-all ${tourCountdown !== null ? 'opacity-80' : 'hover:scale-[1.02]'}`}
            style={{ 
              backgroundColor: 'var(--bg-card)', 
              border: '1px solid var(--border-primary)',
              color: 'var(--text-primary)'
            }}
          >
            {tourCountdown !== null ? (
              <>
                <Loader2 className="w-5 h-5 animate-spin text-indigo-500" />
                <span className="font-medium">Starting Tour in {tourCountdown}s...</span>
              </>
            ) : (
              <>
                <PlayCircle className="w-5 h-5 text-indigo-500" />
                <span className="font-medium">Start Dashboard Tour</span>
              </>
            )}
          </button>
        </div>
      </div>
    </>
  );
};

export default Settings;
