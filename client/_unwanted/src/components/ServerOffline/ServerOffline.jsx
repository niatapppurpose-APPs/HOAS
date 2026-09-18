import './ServerOffline.css';

const ServerOffline = ({ lastChecked }) => {
  return (
    <div className="server-offline-container">
      <div className="server-offline-card">
        <div className="status-badge connecting">
          <span className="pulse-dot"></span>
          Attempting to reconnect...
        </div>

        <div className="icon-wrapper">
          <div className="signal-waves">
            <span></span><span></span><span></span>
          </div>
          <svg className="disconnect-icon" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="1.5">
            <path d="M18.36 6.64a9 9 0 1 1-12.73 0" strokeLinecap="round" />
            <path d="M16.24 8.76a6 6 0 1 1-8.48 0" strokeLinecap="round" />
            <path d="M12 12h.01" strokeLinecap="round" strokeWidth="3" />
            <line x1="2" y1="2" x2="22" y2="22" strokeWidth="1.5" strokeLinecap="round" />
          </svg>
        </div>

        <h1 className="title">Connection Lost</h1>
        <p className="description">
          The development server has stopped running.<br />
          Please check your terminal.
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
              <span className="path">~/client</span>
              <span className="command">npm run dev</span>
            </div>
          </div>
        </div>

        <div className="timestamp">
          Last successful check: {lastChecked.toLocaleTimeString()}
        </div>
      </div>
      
      <div className="background-shapes">
        <div className="shape shape-1"></div>
        <div className="shape shape-2"></div>
      </div>
    </div>
  );
};

export default ServerOffline;
