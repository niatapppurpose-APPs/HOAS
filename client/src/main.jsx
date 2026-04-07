import React from "react";
import ReactDOM from "react-dom/client";
import { BrowserRouter } from "react-router-dom";
import App from "./App";
import { AuthProvider } from "./context/AuthContext";
import { ModalProvider } from "./context/ModalContext";
import { ThemeProvider } from "./context/ThemeContext";
import { ToastProvider } from "./components/Toast";
import { ErrorProvider } from "./context/ErrorContext";
import { NotificationProvider } from "./context/NotificationContext";
import { SystemSettingsProvider } from "./hooks/useSystemSettings.jsx";
import ErrorModal from "./components/ErrorModal";
import ErrorBoundary from "./components/ErrorBoundary";
import * as Tooltip from '@radix-ui/react-tooltip';
import { registerServiceWorker } from "./registerSW";
import "./index.css";

// Handle Vite dynamic import errors (e.g., when a new deployment invalidates old chunks)
window.addEventListener('vite:preloadError', (event) => {
  console.log('Caught a Vite dynamic import error, reloading the page...');
  event.preventDefault();
  window.location.reload();
});

// Register PWA service worker
registerServiceWorker();

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <Tooltip.Provider delayDuration={0}>
        <ToastProvider position="top-right">
          <AuthProvider>
            <SystemSettingsProvider>
              <NotificationProvider>
                <ErrorProvider>
                  <ErrorBoundary>
                    <ModalProvider>
                      <App />
                    </ModalProvider>
                  </ErrorBoundary>
                </ErrorProvider>
              </NotificationProvider>
            </SystemSettingsProvider>
          </AuthProvider>
        </ToastProvider>
      </Tooltip.Provider>
    </ThemeProvider>
  </BrowserRouter>
);
