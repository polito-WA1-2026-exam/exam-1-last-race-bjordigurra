// client/src/components/Game.jsx
import { useState, useEffect } from 'react';
import { getStations, getSegments, getMission, getEvents, saveGameScore } from '../api';

function Game({ user }) {
  // Map Data
  const [stations, setStations] = useState([]);
  const [segments, setSegments] = useState([]);
  const [events, setEvents] = useState([]);
  
  // Game State
  const [phase, setPhase] = useState('setup'); // 'setup', 'planning', 'execution', 'result'
  const [mission, setMission] = useState(null);
  const [route, setRoute] = useState([]); // Stores the segments chosen by the player
  const [timeLeft, setTimeLeft] = useState(90);
  const [loading, setLoading] = useState(true);

  // Execution State
  const [isValidRoute, setIsValidRoute] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [finalScore, setFinalScore] = useState(0);

  // Load initial map data
  useEffect(() => {
    async function loadData() {
      try {
        const [s, l, seg, ev] = await Promise.all([getStations(), getSegments(), getEvents()]);
        setStations(s);
        setEvents(ev);

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

  // Remove segment from the route
  const removeSegmentFromRoute = (segmentId) => {
    setRoute(route.filter(seg => seg.id !== segmentId));
  };

  // Remove all segments from the route
  const clearRoute = () => setRoute([]);

  // Helper to get station names
  const getStationName = (id) => stations.find(s => s.id === id)?.name || 'Unknown';


// Validation logic that will be implemented in the Execution phase
  const submitRoute = async () => {
    let currentStationId = mission.start.id;
    let isValid = true;
    let coins = 20; // Starting coins
    let log = [];

    // 1. A route must have at least one segment
    if (route.length === 0) {
      isValid = false;
    }

    // 2. Traverse the route step by step
    for (let i = 0; i < route.length; i++) {
      const seg = route[i];
      let nextStationId = null;

      if (seg.station_a === currentStationId) {
        nextStationId = seg.station_b;
      } else if (seg.station_b === currentStationId) {
        nextStationId = seg.station_a;
      } else {
        isValid = false;
        break; 
      }

      // 3. Apply a random event
      const randomEvent = events[Math.floor(Math.random() * events.length)];
      coins += randomEvent.effect;

      log.push({
        step: i + 1,
        from: currentStationId,
        to: nextStationId,
        event: randomEvent,
        coinsAfter: coins
      });

      currentStationId = nextStationId;
    }

    // 4. Did we actually reach the destination?
    if (isValid && currentStationId !== mission.destination.id) {
      isValid = false;
    }

    // 5. Finalize the score and save it to the Database
    const calculatedScore = isValid ? (coins < 0 ? 0 : coins) : 0;
    
    setIsValidRoute(isValid);
    setFinalScore(calculatedScore);
    if (isValid) setExecutionLog(log);

    // Save to database
    try {
      await saveGameScore(calculatedScore);
      console.log("Game saved successfully with score:", calculatedScore);
    } catch (error) {
      console.error("Could not save game score:", error);
    }

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
          <button onClick={startGame} style={{ padding: '10px 20px', cursor: 'pointer' }}>
            Ready! Start Game
          </button>
        </div>
      )}

      {/* PHASE 2: PLANNING */}
      {phase === 'planning' && mission && (
        <div>
          <h3>Phase 2: Planning</h3>
          <h4 style={{ color: timeLeft <= 10 ? 'red' : 'black' }}>Time Left: {timeLeft} seconds</h4>
          <div style={{ backgroundColor: '#f0f8ff', padding: '15px', borderRadius: '5px', marginBottom: '20px' }}>
            <strong>Mission:</strong> Travel from <u>{mission.start.name}</u> to <u>{mission.destination.name}</u>.
          </div>

          <div style={{ display: 'flex', gap: '20px' }}>
            {/* Left column: available segments*/}
            <div style={{ flex: 2 }}>
              <h4>Available Segments</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {segments.map(seg => {
                  if (route.some(r => r.id === seg.id)) return null; // this hides already selected segments from the available list
                  return (
                    <button key={seg.id} onClick={() => addSegmentToRoute(seg)} style={{ padding: '6px', cursor: 'pointer', fontSize: '0.85em', border: '1px solid #999', borderRadius: '4px', backgroundColor: '#fff' }}>
                      {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)} <br/>
                    </button>
                  );
                })}
              </div>
            </div>
                {/* Right column: built route */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4>Your Route ({route.length} steps)</h4>
              <div style={{ flexGrow: 1, height: '320px', overflowY: 'auto', border: '1px dashed #ccc', padding: '10px', backgroundColor: '#fafafa' }}>
                {route.length === 0 && <p style={{ color: '#888' }}>Select segments from the left to build your route...</p>}
                {route.map((seg, index) => (
                  <div key={seg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '6px', borderBottom: '1px solid #eee', fontSize: '0.9em' }}>
                    <span>{index + 1}. {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)}</span>
                    <button onClick={() => removeSegmentFromRoute(seg.id)} style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '3px', cursor: 'pointer', padding: '2px 6px' }}>X</button>
                  </div>
                ))}
              </div>
              <div style={{ display: 'flex', gap: '10px', marginTop: '10px' }}>
                <button onClick={clearRoute} disabled={route.length === 0} style={{ flex: 1, padding: '10px', backgroundColor: '#f44336', color: 'white', border: 'none', cursor: route.length === 0 ? 'not-allowed' : 'pointer', opacity: route.length === 0 ? 0.5 : 1 }}>Clear All</button>
                <button onClick={submitRoute} style={{ flex: 2, padding: '10px', backgroundColor: '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer' }}>Submit Route</button>
              </div>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 3 & 4: EXECUTION AND RESULT */}
      {phase === 'execution' && (
        <div>
          <h3>Phase 3: Execution</h3>
          
          {!isValidRoute ? (
            <div style={{ backgroundColor: '#ffebee', padding: '20px', border: '1px solid red', borderRadius: '5px' }}>
              <h4 style={{ color: 'red' }}>Route Invalid or Incomplete!</h4>
              <p>Your route didn't properly connect <b>{mission.start.name}</b> to <b>{mission.destination.name}</b>.</p>
              <p>You lose all your coins. <b>Final Score: 0</b></p>
            </div>
          ) : (
            <div>
              <div style={{ backgroundColor: '#e8f5e9', padding: '20px', border: '1px solid green', borderRadius: '5px', marginBottom: '20px' }}>
                <h4 style={{ color: 'green', margin: '0 0 10px 0' }}>Route Valid!</h4>
                <p style={{ margin: 0 }}>You successfully connected the stations. Starting with 20 coins...</p>
              </div>

              <div style={{ border: '1px solid #ccc', padding: '15px' }}>
                {executionLog.map((log) => (
                  <div key={log.step} style={{ marginBottom: '15px', paddingBottom: '10px', borderBottom: '1px solid #eee' }}>
                    <strong>Step {log.step}:</strong> Travel from {getStationName(log.from)} to {getStationName(log.to)}
                    <br/>
                    <span style={{ color: log.event.effect >= 0 ? 'green' : 'red' }}>
                      <em>Event: {log.event.description} ({log.event.effect > 0 ? '+' : ''}{log.event.effect} coins)</em>
                    </span>
                    <br/>
                    <strong>Coins: {log.coinsAfter}</strong>
                  </div>
                ))}
              </div>

              <div style={{ marginTop: '20px', fontSize: '1.2em', fontWeight: 'bold', textAlign: 'center', padding: '15px', backgroundColor: '#fff3cd' }}>
                Final Score: {finalScore} coins
              </div>
            </div>
          )}

          <button 
            onClick={() => setPhase('setup')} 
            style={{ marginTop: '20px', padding: '10px 20px', backgroundColor: '#2196F3', color: 'white', border: 'none', cursor: 'pointer' }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;