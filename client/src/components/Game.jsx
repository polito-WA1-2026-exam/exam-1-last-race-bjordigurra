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
        <h3 style={{ marginBottom: '15px', fontSize: '1.5em' }}>Phase 2: Planning</h3>

          
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
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '800px', margin: '0 auto', gap: '20px' }}>
          
          <h3 style={{ margin: '0', fontSize: '1.8em', color: '#333' }}>Phase 3: Execution</h3>
          <p style={{ color: '#666', fontSize: '1.1em', marginTop: '0' }}>Let's see how your journey unfolds...</p>

          <div style={{ width: '100%', backgroundColor: '#fff', border: '1px solid #ddd', borderRadius: '12px', boxShadow: '0 4px 12px rgba(0,0,0,0.1)', overflow: 'hidden' }}>
            
            {/* Journey progress step */}
            <div style={{ backgroundColor: '#f8f9fa', padding: '15px 20px', borderBottom: '1px solid #eee', display: 'flex', justifyContent: 'space-between', alignItems: 'center' }}>
              <span style={{ fontSize: '1.2em', fontWeight: 'bold', color: '#555' }}>
                Step {currentStepIndex + 1} <span style={{ color: '#aaa', fontWeight: 'normal' }}>of {executionLog.length}</span>
              </span>
            </div>

            <div style={{ padding: '30px' }}>
              {/* Segment information */}
              <div style={{ textAlign: 'center', marginBottom: '30px', fontSize: '1.4em' }}>
                Traveling from <br/>
                <strong style={{ color: '#2196F3', fontSize: '1.2em' }}>{getStationName(executionLog[currentStepIndex].from)}</strong> 
                <span style={{ margin: '0 15px', color: '#ccc' }}>➔</span> 
                <strong style={{ color: '#2196F3', fontSize: '1.2em' }}>{getStationName(executionLog[currentStepIndex].to)}</strong>
              </div>
              
              {/* Unexpeted event box */}
              <div style={{ 
                margin: '20px 0', 
                padding: '20px', 
                backgroundColor: executionLog[currentStepIndex].event.effect >= 0 ? '#f6fff6' : '#fff5f5', 
                borderRadius: '8px', 
                borderLeft: `6px solid ${executionLog[currentStepIndex].event.effect >= 0 ? '#4CAF50' : '#f44336'}`,
                boxShadow: '0 2px 4px rgba(0,0,0,0.05)'
              }}>
                <div style={{ fontWeight: 'bold', marginBottom: '10px', fontSize: '1.1em', color: '#333' }}>
                  ⚠️ Unexpected Event:
                </div>
                <div style={{ fontSize: '1.1em', lineHeight: '1.5', color: '#555' }}>
                  {executionLog[currentStepIndex].event.description}
                </div>
                <div style={{ 
                  marginTop: '15px', 
                  fontSize: '1.3em', 
                  color: executionLog[currentStepIndex].event.effect >= 0 ? '#28a745' : '#dc3545', 
                  fontWeight: 'bold' 
                }}>
                  Effect: {executionLog[currentStepIndex].event.effect > 0 ? '+' : ''}{executionLog[currentStepIndex].event.effect} coins
                </div>
              </div>

              {/* Coins counter */}
              <div style={{ textAlign: 'center', marginTop: '30px', padding: '20px', backgroundColor: '#fff3cd', borderRadius: '8px', border: '1px solid #ffeeba' }}>
                <div style={{ fontSize: '1.1em', color: '#856404', marginBottom: '5px' }}>Current Coins</div>
                <div style={{ fontSize: '2.5em', fontWeight: 'bold', color: '#856404', fontFamily: 'monospace' }}>
                  🪙 {executionLog[currentStepIndex].coinsAfter}
                </div>
              </div>

            </div>

            {/* Next / Finish button */}
            <div style={{ padding: '20px', backgroundColor: '#f8f9fa', borderTop: '1px solid #eee' }}>
              <button 
                onClick={handleNextStep} 
                style={{ 
                  width: '100%', 
                  padding: '15px', 
                  backgroundColor: currentStepIndex + 1 === executionLog.length ? '#28a745' : '#2196F3', 
                  color: 'white', 
                  border: 'none', 
                  fontWeight: 'bold', 
                  cursor: 'pointer', 
                  borderRadius: '8px',
                  fontSize: '1.2em',
                  boxShadow: '0 2px 4px rgba(0,0,0,0.1)',
                  transition: 'transform 0.1s'
                }}
                onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
                onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
              >
                {currentStepIndex + 1 === executionLog.length ? "🏁 Finish Journey" : "Next Step ➔"}
              </button>
            </div>

          </div>
        </div>
      )}

      {/* PHASE 4: RESULT */}
      {phase === 'result' && (
        <div style={{ display: 'flex', flexDirection: 'column', alignItems: 'center', width: '100%', maxWidth: '600px', margin: '40px auto 0 auto', gap: '25px' }}>
          
          <h3 style={{ margin: '0', fontSize: '2.2em', color: '#333' }}>Phase 4: Result</h3>

          {!isValidRoute ? (
            // INVALID ROUTE
            <div style={{ width: '100%', backgroundColor: '#fff5f5', border: '2px solid #dc3545', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(220, 53, 69, 0.15)' }}>
              <div style={{ fontSize: '3.5em', marginBottom: '10px' }}>❌</div>
              <h4 style={{ color: '#dc3545', fontSize: '1.6em', margin: '0 0 15px 0' }}>Route Invalid or Incomplete!</h4>
              <p style={{ fontSize: '1.1em', color: '#555', margin: '0 0 10px 0', lineHeight: '1.5' }}>
                Your route didn't properly connect <br/>
                <strong style={{ color: '#333' }}>{mission?.start?.name}</strong> to <strong style={{ color: '#333' }}>{mission?.destination?.name}</strong>.
              </p>
              <div style={{ marginTop: '20px', padding: '15px', backgroundColor: '#dc3545', color: 'white', borderRadius: '8px', fontSize: '1.2em', fontWeight: 'bold' }}>
                You lost all your coins!
              </div>
            </div>
          ) : (
            // SUCCESS
            <div style={{ width: '100%', backgroundColor: '#f6fff6', border: '2px solid #28a745', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(40, 167, 69, 0.15)' }}>
              <div style={{ fontSize: '3.5em', marginBottom: '10px' }}>🎉</div>
              <h4 style={{ color: '#28a745', fontSize: '1.6em', margin: '0 0 15px 0' }}>Journey Completed!</h4>
              <p style={{ fontSize: '1.1em', color: '#555', margin: '0', lineHeight: '1.5' }}>
                You successfully navigated the metro system!
              </p>
            </div>
          )}

          {/* FINAL SCORE BOX */}
          <div style={{ width: '100%', backgroundColor: '#fff', border: '2px solid #ffc107', borderRadius: '12px', padding: '30px', textAlign: 'center', boxShadow: '0 4px 12px rgba(255, 193, 7, 0.15)' }}>
            <div style={{ fontSize: '1.1em', color: '#888', marginBottom: '10px', textTransform: 'uppercase', letterSpacing: '1px', fontWeight: 'bold' }}>
              Final Score
            </div>
            <div style={{ fontSize: '4em', fontWeight: 'bold', color: '#d39e00', fontFamily: 'monospace', textShadow: '1px 1px 0px #ffeeba' }}>
              🪙 {finalScore}
            </div>
          </div>

          {/* PLAY AGAIN BUTTON */}
          <button 
            onClick={() => window.dispatchEvent(new Event('reset-game'))} 
            style={{ 
              width: '100%', 
              padding: '16px', 
              backgroundColor: '#4CAF50', 
              color: 'white', 
              border: 'none', 
              fontWeight: 'bold', 
              cursor: 'pointer', 
              borderRadius: '8px',
              fontSize: '1.3em',
              boxShadow: '0 4px 6px rgba(0,0,0,0.1)',
              transition: 'transform 0.1s'
            }}
            onMouseDown={(e) => e.currentTarget.style.transform = 'scale(0.98)'}
            onMouseUp={(e) => e.currentTarget.style.transform = 'scale(1)'}
          >
            🔄 Play again
          </button>

        </div>
      )}
    </div>
  );
}

export default Game;