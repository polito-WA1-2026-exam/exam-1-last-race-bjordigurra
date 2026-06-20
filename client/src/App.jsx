// client/src/App.jsx
import { useState } from 'react';
import { BrowserRouter, Routes, Route } from 'react-router-dom';
import Navbar from './components/Navbar';
import Login from './components/Login';
import Home from './components/Home';
import Game from './components/Game';
import Rankings from './components/Rankings';

function App() {
  const [user, setUser] = useState(null);

  return (
    <BrowserRouter>
      <Navbar user={user} setUser={setUser} />
      
      <Routes>
        <Route path="/" element={<Home user={user} />} />
        
        <Route path="/login" element={<Login setUser={setUser} />} />
        
        <Route path="/game" element={
  user ? <Game /> : <div>You must be logged in to play!</div>
} />
        
        <Route path="/rankings" element={
  user ? <Rankings /> : <div>You must be logged in to view rankings!</div>
} />
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;