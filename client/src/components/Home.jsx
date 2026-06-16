// client/src/components/Home.jsx
import { Link } from 'react-router-dom';
import './Home.css';

function Home({ user }) {
  return (
    <div className="home-container">
      
      {/* HEADER */}
      <h1 className="home-title">Welcome to Last Race 🚇</h1>
      <p className="home-subtitle">
        Navigate the Lyon metro system, avoid unexpected delays, and keep your coins safe!
      </p>

      {/* GAME RULES */}
      <div className="rules-card">
        <h2 className="rules-title">How to Play</h2>

        <div className="phase-block">
          <h3 className="phase-1-title">Phase 1: Setup</h3>
          <p className="phase-desc">
            Study the full metro network map carefully. Memorize the lines, interchange stations, and connections. When you feel ready, start the timer!
          </p>
        </div>

        <div className="phase-block">
          <h3 className="phase-2-title">Phase 2: Planning</h3>
          <p className="phase-desc">
            The colored lines will disappear! You have <strong>90 seconds</strong> to build a valid route from your assigned Start station to your Destination using only your memory of the map.
          </p>
        </div>

        <div className="phase-block">
          <h3 className="phase-3-title">Phase 3: Execution</h3>
          <p className="phase-desc">
            You start with <strong>20 coins</strong>. As you travel your planned route step-by-step, unexpected random events will occur at each stop, adding or subtracting coins. 
            <br/><br/>
            <em>Warning:</em> If your route is invalid or incomplete, you lose all your coins!
          </p>
        </div>
      </div>

      {/* CALL TO ACTION (PLAY BUTTON) */}
      <div className="cta-container">
        {user ? (
          <div>
            <p className="cta-text">Ready for your mission, <strong>{user.username}</strong>?</p>
            <Link to="/game" className="btn-play-huge">
              🎮 Play Now
            </Link>
          </div>
        ) : (
          <div className="login-prompt">
            <p><strong>Want to play?</strong> Please log in or register to start your journey.</p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Home;