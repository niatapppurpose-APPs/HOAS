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
import "./index.css";

ReactDOM.createRoot(document.getElementById("root")).render(
  <BrowserRouter>
    <ThemeProvider>
      <ToastProvider position="top-right">
        <AuthProvider>
          <SystemSettingsProvider>
            <NotificationProvider>
              <ErrorProvider>
                {/* Keep ErrorModal outside of ErrorBoundary so it can show even when children crash */}
                <ErrorModal />
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
    </ThemeProvider>
  </BrowserRouter>
);
