// client/src/components/Game.jsx
import { useState, useEffect } from 'react';
import { getStations, getLines, getSegments, getMission } from '../api';

function Game({ user }) {
  // Map Data
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [segments, setSegments] = useState([]);
  
  // Game State
  const [phase, setPhase] = useState('setup'); // 'setup', 'planning', 'execution', 'result'
  const [mission, setMission] = useState(null);
  const [route, setRoute] = useState([]); // Stores the segments chosen by the player
  const [timeLeft, setTimeLeft] = useState(90);
  const [loading, setLoading] = useState(true);

  // Load initial map data
  useEffect(() => {
    async function loadData() {
      try {
        const [s, l, seg] = await Promise.all([getStations(), getLines(), getSegments()]);
        setStations(s);
        setLines(l);
        const shuffledSegments = [...seg].sort(() => Math.random() - 0.5); // segment shuffling before displaying
        setSegments(shuffledSegments);
      } catch (err) {
        console.error("Error loading map:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Timer logic for the Planning phase
  useEffect(() => {
    let timer;
    if (phase === 'planning' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'planning' && timeLeft === 0) {
      // Time is up! Auto-submit the route
      submitRoute();
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

  // Start the game: fetch mission and start timer
  const startGame = async () => {
    try {
      setLoading(true);
      const m = await getMission();
      setMission(m);
      setPhase('planning');
      setTimeLeft(90);
      setRoute([]);
    } catch (err) {
      console.error("Error fetching mission:", err);
    } finally {
      setLoading(false);
    }
  };

  // Add a segment to the route
  const addSegmentToRoute = (segment) => {
    // A segment can be selected only once
    if (!route.some(r => r.id === segment.id)) {
      setRoute([...route, segment]);
    }
  };

  // Helpers to get names
  const getStationName = (id) => stations.find(s => s.id === id)?.name || 'Unknown';
  const getLineName = (id) => lines.find(l => l.id === id)?.name || 'Unknown';

  const submitRoute = () => {
    // This moves us to Phase 3 (Execution) where we will validate the route
    setPhase('execution');
  };

  if (loading) return <div>Loading...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Last Race - Player: {user.username}</h2>

      {/* PHASE 1: SETUP */}
      {phase === 'setup' && (
        <div>
          <h3>Phase 1: Setup</h3>
          <p>Study the map carefully. When you are ready, start the 90 seconds timer.</p>
          <button onClick={startGame} style={{ padding: '10px 20px', fontSize: '16px', cursor: 'pointer' }}>
            Ready! Start Game
          </button>
        </div>
      )}

      {/* PHASE 2: PLANNING */}
      {phase === 'planning' && mission && (
        <div>
          <h3>Phase 2: Planning</h3>
          <h4 style={{ color: timeLeft <= 10 ? 'red' : 'black' }}>
            Time Left: {timeLeft} seconds
          </h4>
          
          <div style={{ backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <strong>Mission:</strong> You must travel from <u>{mission.start.name}</u> to <u>{mission.destination.name}</u>.
          </div>

          <div style={{ display: 'flex', gap: '30px' }}>
            {/* Left Column: Available Segments */}
            <div style={{ flex: 1 }}>
              <h4>Available Segments</h4>
              <div style={{ height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {segments.map(seg => {
                  const isSelected = route.some(r => r.id === seg.id);
                  if (isSelected) return null; // Hide already selected segments

                  return (
                    <button 
                      key={seg.id}
                      onClick={() => addSegmentToRoute(seg)}
                      style={{ display: 'block', width: '100%', marginBottom: '5px', padding: '8px', cursor: 'pointer', textAlign: 'left' }}
                    >
                      {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)} <small>({getLineName(seg.line_id)})</small>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Column: Built Route */}
            <div style={{ flex: 1 }}>
              <h4>Your Route ({route.length} steps)</h4>
              <div style={{ height: '350px', overflowY: 'auto', border: '1px dashed #ccc', padding: '10px', backgroundColor: '#fafafa' }}>
                {route.length === 0 ? <p style={{ color: '#888' }}>Select segments from the left to build your route...</p> : null}
                {route.map((seg, index) => (
                  <div key={seg.id} style={{ padding: '8px', borderBottom: '1px solid #eee' }}>
                    {index + 1}. {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)}
                  </div>
                ))}
              </div>
              
              <button 
                onClick={submitRoute}
                style={{ width: '100%', padding: '12px', marginTop: '10px', backgroundColor: '#4CAF50', color: 'white', fontWeight: 'bold', cursor: 'pointer' }}
              >
                Submit Route
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3 & 4 (Placeholder for next step) */}
      {phase === 'execution' && (
        <div>
          <h3>Phase 3: Execution</h3>
          <p>Validating route and calculating events...</p>
        </div>
      )}
    </div>
  );
}

export default Game;