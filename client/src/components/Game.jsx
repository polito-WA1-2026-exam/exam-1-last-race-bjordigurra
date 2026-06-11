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

  

}

export default Game;