// client/src/components/Home.jsx
import { useState, useEffect } from 'react';
import { getStations, getLines, getSegments } from '../api';

function Home() {
  const [stations, setStations] = useState([]);
  const [lines, setLines] = useState([]);
  const [segments, setSegments] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  // Fetch data on component mount
  useEffect(() => {
    async function loadMapData() {
      try {
        // Fetch all map data at the same time
        const [stationsData, linesData, segmentsData] = await Promise.all([
          getStations(),
          getLines(),
          getSegments()
        ]);
        
        setStations(stationsData);
        setLines(linesData);
        setSegments(segmentsData);
      } catch (err) {
        console.error("Error fetching map data:", err);
        setError('Failed to load map data from the server.');
      } finally {
        setLoading(false);
      }
    }

    loadMapData();
  }, []);

  if (loading) return <div>Loading map...</div>;
  if (error) return <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Phase 1: Map Setup</h2>
      <p>The database is connected! Here is the raw data:</p>
      
      <div style={{ display: 'flex', gap: '40px' }}>
        {/* List of Stations */}
        <div>
          <h3>Stations ({stations.length})</h3>
          <ul>
            {stations.map((station) => (
              <li key={station.id}>{station.name}</li>
            ))}
          </ul>
        </div>

        {/* List of Lines */}
        <div>
          <h3>Lines ({lines.length})</h3>
          <ul>
            {lines.map((line) => (
              <li key={line.id}>
                {line.name}
              </li>
            ))}
          </ul>
        </div>
        {/* List of Segments */}
        <div>
          <h3>Segments ({segments.length})</h3>
          <ul>
            {segments.map((segment) => (
              <li key={segment.id}>
                {JSON.stringify(segment)}
              </li>
            ))}
          </ul>
        </div>
      </div>
    </div>
  );
}

export default Home;