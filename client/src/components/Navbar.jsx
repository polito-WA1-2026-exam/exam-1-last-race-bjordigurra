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
    <nav style={{ 
      display: 'flex', 
      justifyContent: 'space-between', 
      alignItems: 'center', 
      padding: '15px 20px', 
      borderBottom: '1px solid #ddd', 
      marginBottom: '20px',
      backgroundColor: '#f8f9fa' 
    }}>
      
      {/* Home and Rankings on the left */}
      <div>
        <Link to="/" style={{ marginRight: '20px', textDecoration: 'none', color: '#333', fontSize: '1.1em', fontWeight: 'bold' }}>Home</Link>
        <Link to="/rankings" style={{ textDecoration: 'none', color: '#333', fontSize: '1.1em', fontWeight: 'bold' }}>Rankings</Link>
      </div>

      {/* User and logout button on the right */}
      <div>
        {user ? (
          <div style={{ display: 'flex', alignItems: 'center' }}>
            <span style={{ marginRight: '15px', fontSize: '1.05em' }}>
              Welcome, <b>{user.username}</b>!
            </span>
            <button 
              onClick={handleLogout}
              style={{ 
                padding: '6px 14px', 
                backgroundColor: '#dc3545', 
                color: 'white', 
                border: 'none', 
                borderRadius: '4px', 
                cursor: 'pointer',
                fontWeight: 'bold'
              }}
            >
              Logout
            </button>
          </div>
        ) : (
          <Link 
            to="/login" 
            style={{ 
              textDecoration: 'none', 
              color: '#0056b3', 
              fontWeight: 'bold', 
              fontSize: '1.1em' 
            }}
          >
            Login
          </Link>
        )}
      </div>
      
    </nav>
  );
}

export default Navbar;