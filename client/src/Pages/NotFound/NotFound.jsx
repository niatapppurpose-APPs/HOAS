import { useNavigate } from 'react-router-dom';
import { Home, ArrowLeft } from 'lucide-react';
import './NotFound.css';

const NotFound = () => {
  const navigate = useNavigate();

  const handleGoHome = () => {
    navigate('/');
  };

  const handleGoBack = () => {
    navigate(-1);
  };

  return (
    <div className="notfound-container">
      <div className="notfound-content">
        {/* 404 Image */}
        <div className="notfound-image-wrapper">
          <img 
            src="https://i.imgur.com/qIufhof.png" 
            alt="404 - Page Not Found"
            className="notfound-image"
          />
        </div>

        {/* Text Content */}
        <h1 className="notfound-title">Whoops!</h1>
        <p className="notfound-description">
          You seem to have stumbled off the beaten path.<br />
          Perhaps you should head home?
        </p>

        {/* Action Buttons */}
        <div className="notfound-actions">
          <button 
            onClick={handleGoBack} 
            className="notfound-btn notfound-btn-secondary"
          >
            <ArrowLeft className="w-5 h-5" />
            Go Back
          </button>
          <button 
            onClick={handleGoHome} 
            className="notfound-btn notfound-btn-primary"
          >
            <Home className="w-5 h-5" />
            Go Home
          </button>
        </div>
      </div>
    </div>
  );
};

export default NotFound;
