// client/src/components/Rankings.jsx
import { useState, useEffect } from 'react';
import { getRankings } from '../api';
import './Rankings.css';

function Rankings() {
  const [rankings, setRankings] = useState([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState('');

  useEffect(() => {
    async function fetchScores() {
      try {
        const data = await getRankings();
        setRankings(data);
      } catch (err) {
        console.error("Error fetching rankings:", err);
        setError('Failed to load rankings.');
      } finally {
        setLoading(false);
      }
    }
    fetchScores();
  }, []);

  if (loading) return <div style={{ textAlign: 'center', marginTop: '50px' }}>Loading rankings...</div>;
  if (error) return <div style={{ color: 'red', textAlign: 'center', marginTop: '50px', fontWeight: 'bold' }}>{error}</div>;

  return (
    <div className="rankings-container">
      <h2 className="rankings-title">Global rankings</h2>
      <p className="rankings-subtitle">Here are the best scores achieved by our players.</p>

      {rankings.length === 0 ? (
        <p className="empty-message">No games recorded yet. Be the first to play!</p>
      ) : (
        <table className="rankings-table">
          <thead>
            <tr>
              <th>Rank</th>
              <th>Username</th>
              <th>Best Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((row, index) => {
              const isFirst = index === 0;
              return (
                <tr key={row.username} className={isFirst ? "rank-row-first" : ""}>
                  <td className={isFirst ? "" : "rank-bold"}>
                    {isFirst ? '🏆 1' : index + 1}
                  </td>
                  <td>
                    {row.username}
                  </td>
                  <td className="rank-bold">
                    {row.best_score} coins
                  </td>
                </tr>
              );
            })}
          </tbody>
        </table>
      )}
    </div>
  );
}

export default Rankings;