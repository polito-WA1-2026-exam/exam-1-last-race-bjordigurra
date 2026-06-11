// client/src/App.jsx
import { BrowserRouter, Routes, Route } from 'react-router-dom';

// Here the real components will be imported later, for now we use some temporary divs
// import Navbar from './components/Navbar';
// import Home from './components/Home';
// import Login from './components/Login';
// import Game from './components/Game';
// import Rankings from './components/Rankings';

function App() {
  return (
    <BrowserRouter>
      {/* The <Navbar /> here will be visible in all pages */}
      
      <Routes>
        <Route path="/" element={<div>Welcome to Last Race (Home)</div>} />
        <Route path="/login" element={<div>Login</div>} />
        <Route path="/game" element={<div>Game screen</div>} />
        <Route path="/rankings" element={<div>General ranking</div>} />
        <Route path="*" element={<div>404 - Page not found</div>} />
      </Routes>
    </BrowserRouter>
  );
}

export default App;