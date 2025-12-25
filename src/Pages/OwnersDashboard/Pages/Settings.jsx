import Header from '../../../components/OwnerServices/header';
import { useEffect, useState } from 'react';
import { useAuth } from '../../../context/AuthContext';
import { HexColorPicker } from "react-colorful"

const Settings = () => {
  const { userData, updateUserTheme } = useAuth();
  const initial = userData?.theme || {};

  const [primary, setPrimary] = useState(initial.primary || '#6366F1');
  const [secondary, setSecondary] = useState(initial.secondary || '#8B5CF6');
  const [background, setBackground] = useState(initial.background || '#ffffff');
  const [surface, setSurface] = useState(initial.surface || '#0f172a');
  const [textColor, setTextColor] = useState(initial.text || '#ffffff');
  const [saving, setSaving] = useState(false);
  const [message, setMessage] = useState('');

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

  return (
    <>
      <Header title="Settings" />
      <div className="p-6">
        <h1 style={{ color: 'var(--owner-text)' }} className="text-2xl font-bold mb-4">Theme Settings</h1>

        <div className="grid grid-cols-1 sm:grid-cols-5 gap-10">
          <label className="flex  item-center justify-center flex-col gap-3 rounded-lg border border-slate-700 p-8">
            <span className="text-sm text-slate-300">Primary</span>
            <HexColorPicker color={primary} onChange={setPrimary} className="flex  item-center justify-center rounded-xl shadow-lg" />
          </label>

          <label className="flex flex-col gap-3 rounded-lg border border-slate-700 p-8">
            <span className="text-sm text-slate-300">Secondary</span>
            <HexColorPicker color={secondary} onChange={setSecondary} className="rounded-xl shadow-lg" />
          </label>

          <label className="flex flex-col gap-3 rounded-lg border border-slate-700 p-8">
            <span className="text-sm text-slate-300">Surface</span>
            <HexColorPicker color={surface} onChange={setSurface} className="rounded-xl shadow-lg" />
          </label>
          <label className="flex flex-col gap-3 rounded-lg border border-slate-700 p-8">
            <span className="text-sm text-slate-300">Text</span>
            <HexColorPicker color={textColor} onChange={setTextColor} className="rounded-xl shadow-lg" />
          </label>

          <label className="flex flex-col gap-3 rounded-lg border border-slate-700 p-8">
            <span className="text-sm text-slate-300">Background</span>
            <HexColorPicker color={background} onChange={setBackground} className="rounded-xl shadow-lg" />
          </label>
        </div>


        <div className="mt-6 flex items-center gap-3">
          <button onClick={handleSave} disabled={saving} className="px-4 py-2 rounded bg-indigo-600 text-white">
            {saving ? 'Saving...' : 'Save Theme'}
          </button>
          {message && <span className="text-sm text-slate-300">{message}</span>}
        </div>
      </div>
    </>
  );
};

export default Settings;
