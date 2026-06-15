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

  // Helper for map colors based on Lyon's lines
  const getLineColor = (lineId) => {
    switch (lineId) {
      case 1: return '#4CAF50'; // Green Line
      case 2: return '#F44336'; // Red Line
      case 3: return '#FF9800'; // Orange Line
      case 4: return '#2196F3'; // Blue Line
      default: return '#999999';
    }
  };

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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1000px', margin: '0 auto' }}>
          <h3 style={{ marginBottom: '15px', fontSize: '1.5em' }}>Phase 1: Setup</h3>
          
          {/* THE MAP */}
          <div style={{ width: '100%', border: '2px solid #ccc', borderRadius: '8px', backgroundColor: '#fcfcfc', overflow: 'hidden', marginBottom: '20px' }}>
            <svg viewBox="0 -5 185 105" style={{ width: '100%', height: 'auto', maxHeight: '75vh', display: 'block' }}>              
              {/* 1. Draw the lines (Segments) */}
              {segments.map(seg => {
                const stA = stations.find(s => s.id === seg.station_a);
                const stB = stations.find(s => s.id === seg.station_b);
                
                if (!stA || !stB) return null;

                return (
                  <line 
                    key={seg.id}
                    x1={stA.x} 
                    y1={stA.y} 
                    x2={stB.x} 
                    y2={stB.y} 
                    stroke={getLineColor(seg.line_id)} 
                    strokeWidth="1.2"
                  />
                );
              })}

              {/* 2. Draw the stations (Nodes) with STATIC labels */}
              {stations.map(st => (
                <g key={st.id}>
                  <circle 
                    cx={st.x} 
                    cy={st.y} 
                    r="1.4" 
                    fill="white" 
                    stroke="#333" 
                    strokeWidth="0.4" 
                  />
                  <text 
                    x={st.x + (st.label_dx || 0)} 
                    y={st.y + (st.label_dy || -3)} 
                    fontSize="2.8" 
                    textAnchor={st.label_anchor || 'middle'} 
                    fill="#333"
                    fontWeight="bold"
                  >
                    {st.name}
                  </text>
                </g>
              ))}

            </svg>
          </div>

          <button 
            onClick={startGame} 
            style={{ padding: '12px 30px', fontSize: '18px', cursor: 'pointer', backgroundColor: '#4CAF50', color: 'white', border: 'none', borderRadius: '5px', fontWeight: 'bold' }}>
            Ready! Start Game
          </button>
        </div>
      )}

      {/* PHASE 2: PLANNING */}
      {phase === 'planning' && mission && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '1100px', margin: '0 auto', gap: '15px' }}>
          
          {/* TOP: Mission & Timer Banner */}
          <div style={{ width: '100%', backgroundColor: '#f0f8ff', padding: '12px 20px', borderRadius: '8px', border: '1px solid #cce5ff', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
            <div style={{ fontSize: '1.1em' }}>
              <strong style={{ color: '#0056b3' }}>Mission:</strong>
              <span style={{ marginLeft: '10px' }}>
                From <u style={{ fontWeight: 'bold' }}>{mission.start.name}</u> to <u style={{ fontWeight: 'bold' }}>{mission.destination.name}</u>
              </span>
            </div>
            <h4 style={{ margin: 0, color: timeLeft <= 10 ? 'red' : '#333', fontSize: '1.3em', fontFamily: 'monospace' }}>
              ⏳ {timeLeft}s
            </h4>
          </div>

          {/* MIDDLE: The "Blind" Map */}
          <div style={{ width: '100%', border: '2px solid #ccc', borderRadius: '8px', backgroundColor: '#fcfcfc', overflow: 'hidden' }}>
            <svg viewBox="0 -5 185 105" style={{ width: '100%', height: 'auto', maxHeight: '70vh', display: 'block' }}>
              {/* Draw only the stations (Nodes) */}
              {stations.map(st => (
                <g key={st.id}>
                  <circle cx={st.x} cy={st.y} r="1.4" fill="white" stroke="#333" strokeWidth="0.4" />
                  <text 
                    x={st.x + (st.label_dx || 0)} 
                    y={st.y + (st.label_dy || -3)} 
                    fontSize="2.8" 
                    textAnchor={st.label_anchor || 'middle'} 
                    fill="#333"
                    fontWeight="bold"
                    style={{ pointerEvents: 'none', userSelect: 'none' }}
                  >
                    {st.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          {/* BOTTOM: Lists (Grid + Column) */}
          <div style={{ display: 'flex', width: '100%', gap: '20px' }}>
            
            {/* Left Box: Available Segments (GRID LAYOUT) */}
            <div style={{ flex: 2, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1em', color: '#444' }}>Available Segments</h4>
              <div style={{ 
                height: '300px', 
                overflowY: 'auto', 
                border: '1px solid #bbb', 
                borderRadius: '6px', 
                padding: '10px', 
                backgroundColor: '#fff', 
                display: 'grid', 
                gridTemplateColumns: 'repeat(auto-fill, minmax(210px, 1fr))', 
                gap: '8px',
                alignContent: 'start'
              }}>
                {segments.map(seg => {
                  if (route.some(r => r.id === seg.id)) return null;
                  return (
                    <button 
                      key={seg.id} 
                      onClick={() => addSegmentToRoute(seg)} 
                      style={{ 
                        padding: '8px', 
                        cursor: 'pointer', 
                        fontSize: '0.9em', 
                        border: '1px solid #ddd', 
                        borderRadius: '4px', 
                        backgroundColor: '#fdfdfd', 
                        textAlign: 'center', 
                        transition: 'background-color 0.2s'
                      }}
                      onMouseOver={(e) => { e.currentTarget.style.backgroundColor = '#f0f7ff'; e.currentTarget.style.borderColor = '#2196F3'; }}
                      onMouseOut={(e) => { e.currentTarget.style.backgroundColor = '#fdfdfd'; e.currentTarget.style.borderColor = '#ddd'; }}
                    >
                      <strong>{getStationName(seg.station_a)}</strong> <br/>
                      <span style={{ color: '#888', fontSize: '0.9em' }}>↕</span> <br/>
                      <strong>{getStationName(seg.station_b)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>

            {/* Right Box: Your Route */}
            <div style={{ flex: 1, display: 'flex', flexDirection: 'column' }}>
              <h4 style={{ margin: '0 0 8px 0', fontSize: '1.1em', color: '#444' }}>Your Route ({route.length} steps)</h4>
              <div style={{ height: '300px', overflowY: 'auto', border: '1px dashed #aaa', borderRadius: '6px', padding: '10px', backgroundColor: '#f9f9f9', display: 'flex', flexDirection: 'column', gap: '8px' }}>
                {route.length === 0 ? (
                  <p style={{ color: '#888', margin: 'auto', fontSize: '0.95em', textAlign: 'center', fontStyle: 'italic' }}>
                    Select segments...
                  </p>
                ) : (
                  route.map((seg, index) => (
                    <div key={seg.id} style={{ display: 'flex', justifyContent: 'space-between', alignItems: 'center', padding: '8px', backgroundColor: '#fff', border: '1px solid #dee2e6', borderRadius: '4px' }}>
                      <span style={{ fontSize: '0.9em' }}>
                        <span style={{ color: '#666', marginRight: '5px' }}>{index + 1}.</span>
                        {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)}
                      </span>
                      <button 
                        onClick={() => removeSegmentFromRoute(seg.id)} 
                        style={{ backgroundColor: '#ff4d4d', color: 'white', border: 'none', borderRadius: '4px', cursor: 'pointer', padding: '4px 8px', fontWeight: 'bold', fontSize: '0.8em' }}
                      >
                        X
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          {/* ACTION BUTTONS */}
          <div style={{ display: 'flex', gap: '15px', width: '100%', marginBottom: '30px' }}>
            <button 
              onClick={clearRoute} 
              disabled={route.length === 0} 
              style={{ flex: 1, padding: '12px', backgroundColor: '#f44336', color: 'white', border: 'none', borderRadius: '6px', cursor: route.length === 0 ? 'not-allowed' : 'pointer', opacity: route.length === 0 ? 0.5 : 1, fontWeight: 'bold', fontSize: '1.05em' }}
            >
              Clear All
            </button>
            <button 
              onClick={submitRoute} 
              style={{ flex: 2, padding: '12px', backgroundColor: '#28a745', color: 'white', border: 'none', borderRadius: '6px', fontWeight: 'bold', cursor: 'pointer', fontSize: '1.1em' }}
            >
              Submit Route
            </button>
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