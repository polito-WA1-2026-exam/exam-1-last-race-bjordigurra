// client/src/components/Navbar.jsx
import { Link, useNavigate, useLocation } from 'react-router-dom';
import './Navbar.css';
import { logout } from '../api';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();
  const location = useLocation();

  const handleLogout = async () => {
    try {
      await logout(); // api route
      setUser(null); 
      navigate('/'); 
    } catch (err) {
      console.error("Error during logout", err);
    }
  };

  return (
    <nav className="navbar">
      
      {/* Homepage and rankings on the left */}
      <div className="nav-links">
        <Link to="/" className="nav-link">Home</Link>
        <Link to="/rankings" className="nav-link">Rankings</Link>
      </div>

      {/* User and login/logout on the right */}
      <div className="nav-user-area">
        {user ? (
          <>
            <span className="welcome-text">
              Welcome, <b>{user.username}</b>!
            </span>
            <button onClick={handleLogout} className="btn-logout">
              Logout
            </button>
          </>
        ) : (
          location.pathname !== '/login' && ( // show login button only if not already on login page
          <Link to="/login" className="nav-login">
            Login
          </Link>)
        )}
      </div>
      
    </nav>
  );
}

export default Navbar;