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

const CHUNK_RELOAD_FLAG = "hoas_chunk_reload_done";

const recoverFromChunkLoadFailure = (reason) => {
  const message = String(reason || "").toLowerCase();
  const isChunkError =
    message.includes("failed to fetch dynamically imported module") ||
    message.includes("importing a module script failed") ||
    message.includes("loading chunk");

  if (!isChunkError) return;
  if (sessionStorage.getItem(CHUNK_RELOAD_FLAG) === "1") return;

  sessionStorage.setItem(CHUNK_RELOAD_FLAG, "1");
  window.location.reload();
};

// Handle Vite dynamic import errors (e.g., when a new deployment invalidates old chunks)
window.addEventListener('vite:preloadError', (event) => {
  console.log('Caught a Vite dynamic import error, reloading the page...');
  event.preventDefault();
  recoverFromChunkLoadFailure(event?.payload || event?.error || "vite:preloadError");
});

window.addEventListener("unhandledrejection", (event) => {
  recoverFromChunkLoadFailure(event?.reason);
});

window.addEventListener("error", (event) => {
  const errorMessage = event?.error?.message || event?.message || "";
  recoverFromChunkLoadFailure(errorMessage);
});

window.addEventListener("load", () => {
  sessionStorage.removeItem(CHUNK_RELOAD_FLAG);
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
