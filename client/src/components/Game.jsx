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
  const [route, setRoute] = useState([]); 
  const [timeLeft, setTimeLeft] = useState(90);
  const [loading, setLoading] = useState(true);

  // Execution State
  const [isValidRoute, setIsValidRoute] = useState(false);
  const [executionLog, setExecutionLog] = useState([]);
  const [currentStepIndex, setCurrentStepIndex] = useState(0); // Tracks the "step by step" progress
  const [finalScore, setFinalScore] = useState(0);

  // Load initial map data
  useEffect(() => {
    async function loadData() {
      try {
        const [s, seg, ev] = await Promise.all([getStations(), getSegments(), getEvents()]);
        setStations(s);
        setEvents(ev);

        const shuffledSegments = [...seg].sort(() => Math.random() - 0.5);
        setSegments(shuffledSegments);
      } catch (err) {
        console.error("Error loading map:", err);
      } finally {
        setLoading(false);
      }
    }
    loadData();
  }, []);

  // Timer logic
  useEffect(() => {
    let timer;
    if (phase === 'planning' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'planning' && timeLeft === 0) {
      submitRoute();
    }
    return () => clearInterval(timer);
  }, [phase, timeLeft]);

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

  const addSegmentToRoute = (segment) => {
    if (!route.some(r => r.id === segment.id)) {
      setRoute([...route, segment]);
    }
  };

  const removeSegmentFromRoute = (segmentId) => {
    setRoute(route.filter(seg => seg.id !== segmentId));
  };

  const clearRoute = () => setRoute([]);

  const getStationName = (id) => stations.find(s => s.id === id)?.name || 'Unknown';

  // Validation Engine
  const submitRoute = async () => {
    let currentStationId = mission.start.id;
    let isValid = true;
    let coins = 20; 
    let log = [];

    if (route.length === 0) {
      isValid = false;
    }

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

    if (isValid && currentStationId !== mission.destination.id) {
      isValid = false;
    }

    const calculatedScore = isValid ? (coins < 0 ? 0 : coins) : 0;
    
    setIsValidRoute(isValid);
    setFinalScore(calculatedScore);
    
    if (isValid) {
      setExecutionLog(log);
      setCurrentStepIndex(0); // Start reading the log from step 0
      setPhase('execution');
    } else {
      // Invalid route: phase is skipped, score is 0, save immediately
      try {
        await saveGameScore(0);
      } catch (error) {
        console.error("Could not save score:", error);
      }
      setPhase('result');
    }
  };

  // Handles stepping through the journey one event at a time
  const handleNextStep = async () => {
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < executionLog.length) {
      // Still traveling
      setCurrentStepIndex(nextIndex);
    } else {
      // Journey finished! Save to DB and move to result
      try {
        await saveGameScore(finalScore);
      } catch (error) {
        console.error("Could not save score:", error);
      }
      setPhase('result');
    }
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
            <div style={{ flex: 2 }}>
              <h4>Available Segments</h4>
              <div style={{ display: 'grid', gridTemplateColumns: 'repeat(auto-fill, minmax(200px, 1fr))', gap: '8px', height: '400px', overflowY: 'auto', border: '1px solid #ccc', padding: '10px' }}>
                {segments.map(seg => {
                  if (route.some(r => r.id === seg.id)) return null;
                  return (
                    <button key={seg.id} onClick={() => addSegmentToRoute(seg)} style={{ padding: '6px', cursor: 'pointer', fontSize: '0.85em', border: '1px solid #999', borderRadius: '4px', backgroundColor: '#fff' }}>
                      {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)} <br/>
                    </button>
                  );
                })}
              </div>
            </div>
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

      {/* PHASE 3: EXECUTION (Step-by-step logic) */}
      {phase === 'execution' && executionLog.length > 0 && (
        <div>
          <h3>Phase 3: Execution</h3>
          <div style={{ border: '2px solid #2196F3', borderRadius: '8px', padding: '20px', maxWidth: '500px', backgroundColor: '#e3f2fd' }}>
            <h4 style={{ margin: '0 0 15px 0' }}>Step {currentStepIndex + 1} of {executionLog.length}</h4>
            <p style={{ fontSize: '1.1em' }}>
              Traveling from <strong>{getStationName(executionLog[currentStepIndex].from)}</strong> to <strong>{getStationName(executionLog[currentStepIndex].to)}</strong>...
            </p>
            
            <div style={{ margin: '20px 0', padding: '15px', backgroundColor: '#fff', borderRadius: '5px', borderLeft: `5px solid ${executionLog[currentStepIndex].event.effect >= 0 ? 'green' : 'red'}` }}>
              <strong>Unexpected Event:</strong> {executionLog[currentStepIndex].event.description}
              <br/>
              <span style={{ color: executionLog[currentStepIndex].event.effect >= 0 ? 'green' : 'red', fontWeight: 'bold' }}>
                Effect: {executionLog[currentStepIndex].event.effect > 0 ? '+' : ''}{executionLog[currentStepIndex].event.effect} coins
              </span>
            </div>

            <h4 style={{ margin: '0 0 15px 0' }}>Current Coins: {executionLog[currentStepIndex].coinsAfter}</h4>

            <button 
              onClick={handleNextStep} 
              style={{ width: '100%', padding: '12px', backgroundColor: '#2196F3', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
            >
              {currentStepIndex + 1 === executionLog.length ? "Finish Journey" : "Next Step ➔"}
            </button>
          </div>
        </div>
      )}

      {/* PHASE 4: RESULT */}
      {phase === 'result' && (
        <div style={{ maxWidth: '500px' }}>
          <h3>Phase 4: Result</h3>
          
          {!isValidRoute ? (
            <div style={{ backgroundColor: '#ffebee', padding: '20px', border: '1px solid red', borderRadius: '5px' }}>
              <h4 style={{ color: 'red', marginTop: 0 }}>Route Invalid or Incomplete!</h4>
              <p>Your route didn't properly connect <b>{mission.start.name}</b> to <b>{mission.destination.name}</b>.</p>
              <p>You lose all your coins.</p>
            </div>
          ) : (
             <div style={{ backgroundColor: '#e8f5e9', padding: '20px', border: '1px solid green', borderRadius: '5px' }}>
                <h4 style={{ color: 'green', marginTop: 0 }}>Journey Completed!</h4>
                <p>You successfully navigated the metro system.</p>
             </div>
          )}

          <div style={{ marginTop: '20px', fontSize: '1.5em', fontWeight: 'bold', textAlign: 'center', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '5px', border: '1px solid #ffeeba' }}>
            Final Score: {finalScore} coins
          </div>

          <button 
            onClick={() => setPhase('setup')} 
            style={{ marginTop: '20px', width: '100%', padding: '12px', backgroundColor: '#4CAF50', color: 'white', border: 'none', fontWeight: 'bold', cursor: 'pointer', borderRadius: '4px' }}
          >
            Play Again
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;