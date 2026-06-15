// client/src/components/Home.jsx
import { Link } from 'react-router-dom';

function Home({ user }) {
  return (
    <div style={{ maxWidth: '800px', margin: '0 auto', padding: '40px 20px', lineHeight: '1.6' }}>
      
      {/* HEADER */}
      <h1 style={{ textAlign: 'center', fontSize: '2.8em', marginBottom: '10px', color: '#333' }}>
        Last Race 🚇
      </h1>
      <p style={{ textAlign: 'center', fontSize: '1.2em', color: '#666', marginBottom: '40px' }}>
        Navigate the metro system, avoid unexpected delays, and keep your coins safe!
      </p>

      {/* GAME RULES */}
      <div style={{ backgroundColor: '#fcfcfc', border: '1px solid #eee', borderRadius: '12px', padding: '30px', boxShadow: '0 4px 6px rgba(0,0,0,0.05)' }}>
        <h2 style={{ marginTop: 0, borderBottom: '2px solid #eee', paddingBottom: '10px' }}>How to play</h2>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#2196F3', marginBottom: '5px' }}>Phase 1: Setup</h3>
          <p style={{ margin: 0 }}>
            Study the full metro network map carefully: memorize lines, interchange stations, and connections. When you feel ready, start the timer!
          </p>
        </div>

        <div style={{ marginBottom: '25px' }}>
          <h3 style={{ color: '#FF9800', marginBottom: '5px' }}>Phase 2: Planning</h3>
          <p style={{ margin: 0 }}>
            The metro lines will disappear! You have <strong>90 seconds</strong> to build a valid route from your assigned Start station to your Destination using only your memory of the map.
          </p>
        </div>

        <div>
          <h3 style={{ color: '#4CAF50', marginBottom: '5px' }}>Phase 3: Execution</h3>
          <p style={{ margin: 0 }}>
            You start with <strong>20 coins</strong>. As you travel your planned route, unexpected random events will occur at each stop, winning or losing coins. 
            <br/><br/>
            <em>Warning:</em> If your route is invalid or incomplete, you lose all your coins!
          </p>
        </div>
      </div>

      {/* CALL TO ACTION (PLAY BUTTON) */}
      <div style={{ textAlign: 'center', marginTop: '50px' }}>
        {user ? (
          <div>
            <p style={{ fontSize: '1.1em', marginBottom: '15px' }}>Ready for your mission, <strong>{user.username}</strong>?</p>
            <Link 
              to="/game" 
              style={{ display: 'inline-block', padding: '15px 40px', fontSize: '1.5em', backgroundColor: '#4CAF50', color: 'white', textDecoration: 'none', borderRadius: '8px', fontWeight: 'bold', boxShadow: '0 4px 6px rgba(0,0,0,0.1)', transition: 'transform 0.2s' }}
              onMouseOver={(e) => e.currentTarget.style.transform = 'scale(1.05)'}
              onMouseOut={(e) => e.currentTarget.style.transform = 'scale(1)'}
            >
              🎮 Play now
            </Link>
          </div>
        ) : (
          <div style={{ padding: '20px', backgroundColor: '#fff3cd', border: '1px solid #ffeeba', borderRadius: '8px', display: 'inline-block' }}>
            <p style={{ margin: 0, fontSize: '1.1em', color: '#856404' }}>
              <strong>Want to play?</strong> Please log in to start your journey.
            </p>
          </div>
        )}
      </div>

    </div>
  );
}

export default Home;