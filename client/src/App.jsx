import { useAuth } from "./context/AuthContext";
import Routes_path from "./components/Routes/index";
import GlobalDeleteModal from "./components/OwnerServices/GlobalDeleteModal";
import { useServerStatus } from "./hooks/useServerStatus";
import ServerOffline from "./components/ServerOffline/ServerOffline";
import FirebaseModeIndicator from "./components/FirebaseModeIndicator";
import { useToast } from "./components/Toast";
import { useTranslation } from "./hooks/useTranslation";
import { Languages, Loader2 } from 'lucide-react';
import { useLocation } from 'react-router-dom';
import { useEffect } from 'react';

const App = () => {
  const { isServerOnline, lastChecked } = useServerStatus();
  const toast = useToast();
  // Initialize translation globally so every page honors saved language
  const { currentLanguage, languages, translatePage, translating } = useTranslation(toast);
  const location = useLocation();

  // Re-apply translation when route changes (SPA navigation) so new nodes get translated
  useEffect(() => {
    if (currentLanguage && currentLanguage !== 'en') {
      // don't show toasts for auto re-translation
      translatePage(currentLanguage, false);
    }
  }, [location.pathname, currentLanguage, translatePage]);

  // Show server offline screen if server is down
  if (!isServerOnline) {
    return <ServerOffline lastChecked={lastChecked} />;
  }

  return (
    <>
      {/* Global translation overlay (high z-index to cover everything) */}
      {translating && (
        <div className="fixed inset-0 bg-black bg-opacity-50 flex items-center justify-center z-[9999]">
          <div className="bg-white p-6 rounded-lg shadow-lg flex items-center gap-3">
            <Loader2 className="w-6 h-6 animate-spin text-blue-600" />
            <span className="text-gray-700">Translating page...</span>
          </div>
        </div>
      )}

      <Routes_path />
      <GlobalDeleteModal />
      {import.meta.env.DEV && <FirebaseModeIndicator />}

      {/* Global bottom-right language selector */}
      <div className="fixed bottom-4 right-4 z-[9999] flex items-center gap-2">
        <div className="bg-green-600 text-white rounded-lg px-3 py-1 shadow-lg flex items-center gap-2">
          <Languages className="w-4 h-4" />
          <select
            value={currentLanguage}
            onChange={(e) => translatePage(e.target.value)}
            className="bg-transparent text-white text-sm outline-none"
          >
            {languages.map(lang => (
              <option key={lang.code} value={lang.code}>{lang.name}</option>
            ))}
          </select>
        </div>
      </div>
    </>
  );
};

export default App;
