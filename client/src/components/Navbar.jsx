// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';
import './Navbar.css';

function Navbar({ user, setUser }) {
  const navigate = useNavigate();

  const handleLogout = async () => {
    try {
      const response = await fetch('http://localhost:3001/api/sessions/current', {
        method: 'DELETE',
        credentials: 'include'
      });

      if (response.ok) {
        setUser(null);
        navigate('/');
      }
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
          <Link to="/login" className="nav-login">
            Login
          </Link>
        )}
      </div>
      
    </nav>
  );
}

export default Navbar;