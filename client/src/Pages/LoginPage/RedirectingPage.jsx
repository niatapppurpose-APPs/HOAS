import React, { useEffect } from 'react';
import './RedirectingPage.css';
import { useToast } from '../../components/Toast';

/**
 * RedirectingPage - A loading page shown after login while redirecting to dashboard
 * Features a Superman-style flying animation
 * @param {Object} props
 * @param {string} props.userName - User's name to display in greeting
 * @param {string} props.message - Custom message (optional)
 */
const RedirectingPage = ({ userName = 'User', message, showToast = true }) => {
  const toast = useToast();

  // show toast when page appears (backup in case LoginButton toast was missed)
  useEffect(() => {
    if (showToast) {
      toast.success(`Welcome back ${userName} 👋`, 3000);
    }
  }, [toast, userName, showToast]);

  // Prevent back navigation and page reload
  useEffect(() => {
    const handleBeforeUnload = (e) => {
      e.preventDefault();
      e.returnValue = '';
      return '';
    };

    const handlePopState = (e) => {
      window.history.pushState(null, '', window.location.href);
    };

    // Push current state to prevent back
    window.history.pushState(null, '', window.location.href);

    window.addEventListener('beforeunload', handleBeforeUnload);
    window.addEventListener('popstate', handlePopState);

    return () => {
      window.removeEventListener('beforeunload', handleBeforeUnload);
      window.removeEventListener('popstate', handlePopState);
    };
  }, []);

  return (
    <div className="redirecting-page">
      {/* Flying Superman Animation */}
      <div className="superman-body">
        <span>
          <span></span>
          <span></span>
          <span></span>
          <span></span>
        </span>
        <div className="superman-base">
          <span></span>
          <div className="superman-face"></div>
        </div>
      </div>

      {/* Speed Lines */}
      <div className="longfazers">
        <span></span>
        <span></span>
        <span></span>
        <span></span>
      </div>

      {/* Message Container */}
      <div className="redirect-message-container">
        <h1 className="redirect-greeting">
          Hi {userName}, you're almost there!
        </h1>
        <p className="redirect-warning">
          {message || "Please do not go back or reload the page"}
        </p>
        <div className="redirect-dots">
          <span></span>
          <span></span>
          <span></span>
        </div>
      </div>
    </div>
  );
};

export default RedirectingPage;
