import { useState, useEffect } from 'react';
import { useNavigate, useLocation } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();
  const location = useLocation();
  const [countdown, setCountdown] = useState(4);

  useEffect(() => {
    const timer = setInterval(() => {
      setCountdown((prev) => {
        if (prev <= 1) {
          clearInterval(timer);
          navigate('/');
          return 0;
        }
        return prev - 1;
      });
    }, 1000);

    return () => clearInterval(timer);
  }, [navigate]);

  return (
    <div className="notfound-container">
      <div className="notfound-card">
        {/* 404 Illustration */}
        <div className="illustration-wrapper">
          <img 
            src="https://i.imgur.com/qIufhof.png" 
            alt="404 Illustration" 
            className="notfound-illustration"
          />
        </div>

        <h1 className="title">Page Not Found</h1>
        <p className="description">
          The page you are looking for has vanished into the digital void.<br />
          It might have been moved or deleted.
        </p>

        <div className="terminal-window">
          <div className="terminal-header">
            <span className="dot red"></span>
            <span className="dot yellow"></span>
            <span className="dot green"></span>
            <span className="terminal-title">Terminal</span>
          </div>
          <div className="terminal-body">
            <div className="command-line">
              <span className="prompt">➜</span>
              <span className="path">~</span>
              <span className="command">GET <span className="highlight-url">"{location.pathname}"</span></span>
            </div>
            <div className="response-line">
              <span className="error">Error: 404 Not Found</span>
            </div>
          </div>
        </div>

        <div className="notfound-actions">
          <button 
            onClick={() => navigate(-1)} 
            className="action-btn secondary"
          >
            <ArrowLeft size={20} />
            <span>Go Back</span>
          </button>
          
          <button 
            onClick={() => navigate('/')} 
            className="action-btn primary"
          >
            <Home size={20} />
            <span>Return Home</span>
          </button>
        </div>

        <div className="error-code">
          <span>Error Code: 404</span>
          <span className="divider">•</span>
          <span className="auto-redirect">
             Redirecting home in {countdown}s
          </span>
        </div>
      </div>

      {/* Abstract Background Elements */}
      <div className="background-design">
        <div className="orb orb-1"></div>
        <div className="orb orb-2"></div>
        <div className="grid-overlay"></div>
      </div>
    </div>
  );
};

export default NotFound;
