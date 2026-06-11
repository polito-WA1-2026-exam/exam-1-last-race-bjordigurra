// client/src/components/Navbar.jsx
import { Link, useNavigate } from 'react-router-dom';

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
    <nav style={{ padding: '10px', borderBottom: '1px solid black', marginBottom: '20px' }}>
      <Link to="/" style={{ marginRight: '15px' }}>Home</Link>
      <Link to="/rankings" style={{ marginRight: '15px' }}>Rankings</Link>

      {user ? (
        <>
          <Link to="/game" style={{ marginRight: '15px' }}>Play Now</Link>
          <span>Welcome, <b>{user.username}</b>! </span>
          <button onClick={handleLogout}>Logout</button>
        </>
      ) : (
        <Link to="/login" style={{ marginRight: '15px' }}>Login</Link>
      )}
    </nav>
  );
}

export default Navbar;