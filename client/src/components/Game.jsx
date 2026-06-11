// client/src/components/Game.jsx
import { useState, useEffect } from 'react';
import { getStations, getLines, getSegments } from '../api';

function Game({ user }) {
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  
  // Game states
  const [selectedSegments, setSelectedSegments] = useState([]);
  const [phase, setPhase] = useState('planning'); // 'planning', 'execution', 'result'

  useEffect(() => {
    async function loadGameData() {
      try {
        const [stationsData, linesData, segmentsData] = await Promise.all([
          getStations(),
          getLines(),
          getSegments()
        ]);
        setStations(stationsData);
        setLines(linesData);
        setSegments(segmentsData);
      } catch (err) {
        console.error("Error fetching game data:", err);
      } finally {
        setLoading(false);
      }
    }
    loadGameData();
  }, []);

  // Helper functions to translate IDs into names
  const getStationName = (id) => {
    const station = stations.find((s) => s.id === id);
    return station ? station.name : 'Unknown';
  };

  const getLineName = (id) => {
    const line = lines.find((l) => l.id === id);
    return line ? line.name : 'Unknown';
  };

  // Handle clicking a segment
  const toggleSegment = (segmentId) => {
    if (selectedSegments.includes(segmentId)) {
      // If already selected, remove it
      setSelectedSegments(selectedSegments.filter(id => id !== segmentId));
    } else {
      // If not selected, add it ONLY if we have less than 2
      if (selectedSegments.length < 2) {
        setSelectedSegments([...selectedSegments, segmentId]);
      }
    }
  };

  if (loading) return <div>Loading game data...</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Last Race - Player: {user.username}</h2>

      {phase === 'planning' && (
        <div>
          <h3>Phase 2: Planning</h3>
          <p>Select exactly 2 segments to close for maintenance.</p>
          
          <div style={{ display: 'flex', flexDirection: 'column', gap: '10px', maxWidth: '400px' }}>
            {segments.map((segment) => {
              const isSelected = selectedSegments.includes(segment.id);
              return (
                <button 
                  key={segment.id}
                  onClick={() => toggleSegment(segment.id)}
                  style={{
                    padding: '10px',
                    cursor: 'pointer',
                    backgroundColor: isSelected ? '#ff4d4d' : '#f0f0f0',
                    color: isSelected ? 'white' : 'black',
                    border: '1px solid #ccc',
                    fontWeight: isSelected ? 'bold' : 'normal'
                  }}
                >
                  {getStationName(segment.station_a)} ↔ {getStationName(segment.station_b)} 
                  <br/>
                  <small>({getLineName(segment.line_id)})</small>
                </button>
              );
            })}
          </div>

          <div style={{ marginTop: '20px' }}>
            <strong>Selected: {selectedSegments.length} / 2</strong>
          </div>

          {/* Proceed button enabled only if exactly 2 are selected */}
          <button 
            disabled={selectedSegments.length !== 2}
            style={{
              marginTop: '15px',
              padding: '10px 20px',
              backgroundColor: selectedSegments.length === 2 ? '#4CAF50' : '#cccccc',
              color: 'white',
              cursor: selectedSegments.length === 2 ? 'pointer' : 'not-allowed',
              fontSize: '16px'
            }}
          >
            Confirm & Proceed to Execution
          </button>
        </div>
      )}
    </div>
  );
}

export default Game;