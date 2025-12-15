import React, { useState } from 'react';
import "./dashboard.css"
import { useAuth } from '../../context/AuthContext';
import LogoutButton from '../LogoutButton';

const Dashboard = () => {
  const { user } = useAuth();

  // ADDED: state to control image popup open/close
  const [open, setOpen] = useState(false);
  // ADDED: get high resolution profile image wil get here
  const highResPhoto = user.photoURL
    ? user.photoURL.replace("s96-c", "s5000-c")
    : "";

  return (
    <div className="dashboard">
      <h1>Welcome to HOAS Dashboard</h1>

      <div className="user-info">
        {highResPhoto && (
          // ADDED: button wrapper to open popup on image click
          <button
            className='buttonIcon'
            onClick={() => setOpen(true)}
            style={{ background: "none", border: "none", cursor: "pointer" }}
          >
            <img
              src={highResPhoto}
              alt="Profile"
              className='image1'
              referrerPolicy='no-referrer'
            />
          </button>
        )}

        <h2>User Details</h2>
        <p><strong>Name:</strong> {user.displayName || 'N/A'}</p>
        <p><strong>Email:</strong> {user.email}</p>
        <p><strong>Email Verified:</strong> {user.emailVerified ? 'Yes' : 'No'}</p>
      </div>

      {/* ADDED: image popup modal */}
      {open && (
        <div
          className="image-popup-overlay"
          onClick={() => setOpen(false)}
        >
          <img
            src={highResPhoto}
            alt="Profile Large"
            className="image-popup"
            referrerPolicy="no-referrer"
          />
        </div>
      )}

      <LogoutButton />
    </div>
  );
};

export default Dashboard;
