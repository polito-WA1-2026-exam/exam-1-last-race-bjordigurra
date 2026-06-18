// client/src/components/Login.jsx
import { useState } from 'react';
import { useNavigate } from 'react-router-dom';
import { login } from '../api';
import './Login.css';

function Login({ setUser }) {
  const [username, setUsername] = useState('');
  const [password, setPassword] = useState('');
  const [errorMessage, setErrorMessage] = useState('');
  
  const navigate = useNavigate();

  const handleSubmit = async (event) => {
    event.preventDefault();
    setErrorMessage('');

    try {
      const userData = await login(username, password);
      setUser(userData);
      navigate('/');
    } catch (err) {
      console.error('Login error:', err);
      setErrorMessage(err.message || 'Error connecting to the server.');
    }
  };

  return (
    <div className="login-container">
      <h2 className="login-title">Login</h2>
      <form onSubmit={handleSubmit} className="login-form">
        
        {errorMessage && <div className="error-message">{errorMessage}</div>}
        
        <div className="form-group">
          <label className="form-label">Username:</label>
          <input 
            type="text" 
            value={username} 
            onChange={(e) => setUsername(e.target.value)} 
            required 
            className="form-input"
          />
        </div>
        
        <div className="form-group">
          <label className="form-label">Password:</label>
          <input 
            type="password" 
            value={password} 
            onChange={(e) => setPassword(e.target.value)} 
            required 
            className="form-input"
          />
        </div>
        
        <button type="submit" className="btn-submit">Login</button>
      </form>
    </div>
  );
}

export default Login;