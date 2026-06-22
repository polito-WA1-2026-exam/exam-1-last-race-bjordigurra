// client/src/components/Game.jsx
import { useState, useEffect } from 'react';
import { getStations, getSegments, getMission, getEvents, saveGameScore } from '../api';
import './Game.css'; 

function Game() {
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
  const [currentStepIndex, setCurrentStepIndex] = useState(0); 
  const [finalScore, setFinalScore] = useState(0);

  // Global event listener for game resets
  useEffect(() => {
    const handleReset = () => {
      setPhase('setup');
      setRoute([]);
      setMission(null);
      setTimeLeft(90);
      setExecutionLog([]);
      setCurrentStepIndex(0);
      setFinalScore(0);
      setIsValidRoute(false);
    };
    window.addEventListener('reset-game', handleReset);
    return () => window.removeEventListener('reset-game', handleReset);
  }, []);

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


    const submitRoute = async () => {
    let currentStationId = mission.start.id;
    let isValid = true;
    let coins = 20; 
    let log = [];

    if (route.length === 0) isValid = false;

    for (let i = 0; i < route.length; i++) {
      const seg = route[i];
      let nextStationId;

      // Check if the current segment connects to the current station (bidirectional)
      if (seg.station_a === currentStationId) {
        nextStationId = seg.station_b;
      } else if (seg.station_b === currentStationId) {
        nextStationId = seg.station_a;
      } else {
        isValid = false;
        break; 
      }
      // Random event generation
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
    // Check if final station matches the mission destination
    if (isValid && currentStationId !== mission.destination.id) isValid = false;
    // Check if score is negative
    const calculatedScore = isValid ? (coins < 0 ? 0 : coins) : 0;
    
    setIsValidRoute(isValid);
    setFinalScore(calculatedScore);
    
    if (isValid) {
      setExecutionLog(log);
      setCurrentStepIndex(0);
      setPhase('execution');
    } else {
      try {
        await saveGameScore(0);
      } catch (error) {
        console.error("Could not save score:", error);
      }
      setPhase('result');
    }
  };

  // Timer logic
  useEffect(() => {
    let timer;
    if (phase === 'planning' && timeLeft > 0) {
      timer = setInterval(() => {
        setTimeLeft((prev) => prev - 1);
      }, 1000);
    } else if (phase === 'planning' && timeLeft === 0) {
      setTimeout(() => {
        submitRoute();
      }, 0);
    }
    return () => clearInterval(timer);
    // eslint-disable-next-line react-hooks/exhaustive-deps
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

  // Helper for map colors
  const getLineColor = (lineId) => {
    switch (lineId) {
      case 1: return '#4CAF50'; 
      case 2: return '#F44336'; 
      case 3: return '#FF9800'; 
      case 4: return '#2196F3'; 
      default: return '#999999';
    }
  };


  // Step logic
  const handleNextStep = async () => {
    const nextIndex = currentStepIndex + 1;
    
    if (nextIndex < executionLog.length) {
      setCurrentStepIndex(nextIndex);
    } else {
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
    <div className="game-container">

      {/* PHASE 1: SETUP */}
      {phase === 'setup' && (
        <div className="phase-container">
          <h3 className="phase-title">Setup</h3>
          
          <div className="map-box">
            <svg viewBox="0 -5 185 105" className="map-svg setup">              
              {segments.map(seg => {
                const stA = stations.find(s => s.id === seg.station_a);
                const stB = stations.find(s => s.id === seg.station_b);
                if (!stA || !stB) return null;

                return (
                  <line 
                    key={seg.id}
                    x1={stA.x} y1={stA.y} 
                    x2={stB.x} y2={stB.y} 
                    stroke={getLineColor(seg.line_id)} 
                    strokeWidth="1.2"
                  />
                );
              })}
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
                  >
                    {st.name}
                  </text>
                </g>
              ))}
            </svg>
          </div>

          <button onClick={startGame} className="btn-primary">
            Ready! Start game
          </button>
        </div>
      )}

      {/* PHASE 2: PLANNING */}
      {phase === 'planning' && mission && (
        <div className="phase-container planning-container">
          <h3 className="phase-title">Planning</h3>

          <div className="mission-highlight">
            <div className="mission-details">
              <span className="mission-label">Mission route</span>
              <div className="mission-path">
                {mission.start.name} <span className="arrow">➔</span> {mission.destination.name}
              </div>
            </div>
            <h4 className={`mission-timer ${timeLeft <= 10 ? 'danger' : ''}`}>
              ⏳ {timeLeft}s
            </h4>
          </div>
          

          <div className="map-box">
            <svg viewBox="0 -5 185 105" className="map-svg planning">
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


          <div className="lists-container">
            <div className="flex-2">
              <h4 className="box-title">Available segments</h4>
              <div className="segments-grid">
                {segments.map(seg => {
                  if (route.some(r => r.id === seg.id)) return null;
                  return (
                    <button 
                      key={seg.id} 
                      onClick={() => addSegmentToRoute(seg)} 
                      className="segment-btn"
                    >
                      <strong>{getStationName(seg.station_a)}</strong> <br/>
                      <span style={{ color: '#888', fontSize: '0.9em' }}>↕</span> <br/>
                      <strong>{getStationName(seg.station_b)}</strong>
                    </button>
                  );
                })}
              </div>
            </div>

            <div className="flex-1">
              <h4 className="box-title">Your route ({route.length} steps)</h4>
              <div className="route-list">
                {route.length === 0 ? (
                  <p style={{ color: '#888', margin: 'auto', fontSize: '0.95em', textAlign: 'center', fontStyle: 'italic' }}>
                    Select segments...
                  </p>
                ) : (
                  route.map((seg, index) => (
                    <div key={seg.id} className="route-item">
                      <span style={{ fontSize: '0.9em' }}>
                        <span style={{ color: '#666', marginRight: '5px' }}>{index + 1}.</span>
                        {getStationName(seg.station_a)} ↔ {getStationName(seg.station_b)}
                      </span>
                      <button 
                        onClick={() => removeSegmentFromRoute(seg.id)} 
                        className="btn-remove"
                      >
                        X
                      </button>
                    </div>
                  ))
                )}
              </div>
            </div>
          </div>

          <div className="action-buttons">
            <button 
              onClick={clearRoute} 
              disabled={route.length === 0} 
              className="btn-danger"
              style={{ flex: 1 }}
            >
              Clear all
            </button>
            <button 
              onClick={submitRoute} 
              className="btn-success"
              style={{ flex: 2 }}
            >
              Submit route
            </button>
          </div>

        </div>
      )}

      {/* PHASE 3: EXECUTION */}
      {phase === 'execution' && executionLog.length > 0 && (
        <div className="phase-container execution-container">
          <h3 className="execution-title">Execution</h3>
          <p className="execution-subtitle">Let's see how your journey unfolds...</p>

          <div className="execution-panel">
            <div className="step-header">
              <span>
                Step {currentStepIndex + 1} <span className="light">of {executionLog.length}</span>
              </span>
            </div>

            <div className="execution-body">
              <div className="travel-info">
                Traveling from <br/>
                <strong>{getStationName(executionLog[currentStepIndex].from)}</strong> 
                <span className="arrow">➔</span> 
                <strong>{getStationName(executionLog[currentStepIndex].to)}</strong>
              </div>
              
              <div className={`event-box ${executionLog[currentStepIndex].event.effect >= 0 ? 'event-positive' : 'event-negative'}`}>
                <div className="event-title">⚠️ Unexpected event:</div>
                <div className="event-desc">{executionLog[currentStepIndex].event.description}</div>
                <div className={`event-effect ${executionLog[currentStepIndex].event.effect >= 0 ? 'effect-positive' : 'effect-negative'}`}>
                  Effect: {executionLog[currentStepIndex].event.effect > 0 ? '+' : ''}{executionLog[currentStepIndex].event.effect} coins
                </div>
              </div>

              <div className="coins-counter">
                <div className="coins-label">Current coins</div>
                <div className="coins-value">
                  🪙 {executionLog[currentStepIndex].coinsAfter}
                </div>
              </div>
            </div>

            <div className="execution-footer">
              <button 
                onClick={handleNextStep} 
                className={`btn-next ${currentStepIndex + 1 === executionLog.length ? 'finished' : 'traveling'}`}
              >
                {currentStepIndex + 1 === executionLog.length ? "Finish journey" : "Next step ➔"}
              </button>
            </div>
          </div>
        </div>
      )}

      {/* PHASE 4: RESULT */}
      {phase === 'result' && (
        <div className="phase-container result-container">
          <h3 className="result-title">Result</h3>

          {!isValidRoute ? (
            <div className="result-box result-invalid">
              <div className="result-icon">❌</div>
              <h4 className="invalid-title">Route invalid or incomplete!</h4>
              <p className="result-desc">
                Your route didn't properly connect <br/>
                <strong>{mission?.start?.name}</strong> to <strong>{mission?.destination?.name}</strong>.
              </p>
              <div className="loss-badge">You lost all your coins!</div>
            </div>
          ) : (
            <div className="result-box result-success">
              <div className="result-icon">🎉</div>
              <h4 className="success-title">Journey completed!</h4>
              <p className="result-desc">You successfully navigated the metro system!</p>
            </div>
          )}

          <div className="score-box">
            <div className="score-label">Final Score</div>
            <div className="score-value">🪙 {finalScore}</div>
          </div>

          <button 
            onClick={() => window.dispatchEvent(new Event('reset-game'))} 
            className="btn-play-again"
          >
            Play again
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;