import React from 'react';
import { Link, useNavigate } from 'react-router-dom';
import './navbar.css';
import { useAuth } from '../../AuthContext';

const Navbar = () => {
  const { isAuthenticated, logout } = useAuth();
  const navigate = useNavigate();

  const handleLogout = () => {
    logout();
    navigate('/login');
  };

  return (
    <nav className="navbar">
      <h1>BobParty</h1>
      <ul className="nav-links">
        <li><Link to="/">Landing Page</Link></li>
        {!isAuthenticated && <li><Link to="/signup">Register</Link></li>}
        {!isAuthenticated && <li><Link to="/login">Login</Link></li>}

        {isAuthenticated && (
          <>
            <li><Link to="/home">Home</Link></li>
            <li><Link to="/friends">Friends</Link></li>
            <li><Link to="/chat">Chat</Link></li>
            <li><Link to="/party-manage">Manage Party</Link></li>
            <li>
              <button onClick={handleLogout} className="logout-btn">Logout</button>
            </li>
          </>
        )}
      </ul>
    </nav>
  );
};

export default Navbar;
