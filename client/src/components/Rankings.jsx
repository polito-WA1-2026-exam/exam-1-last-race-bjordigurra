// client/src/components/Rankings.jsx
import { useState, useEffect } from 'react';
import { getRankings } from '../api';

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

  if (loading) return <div>Loading rankings...</div>;
  if (error) return <div style={{ color: 'red', fontWeight: 'bold' }}>{error}</div>;

  return (
    <div style={{ padding: '20px' }}>
      <h2>Global Rankings</h2>
      <p>Here are the best scores achieved by our players.</p>

      {rankings.length === 0 ? (
        <p style={{ color: '#666', fontStyle: 'italic' }}>No games recorded yet. Be the first to play!</p>
      ) : (
        <table style={{ width: '100%', maxWidth: '500px', borderCollapse: 'collapse', marginTop: '15px' }}>
          <thead>
            <tr style={{ borderBottom: '2px solid #ccc', textAlign: 'left' }}>
              <th style={{ padding: '10px' }}>Rank</th>
              <th style={{ padding: '10px' }}>Username</th>
              <th style={{ padding: '10px' }}>Best Score</th>
            </tr>
          </thead>
          <tbody>
            {rankings.map((row, index) => {
              // Highlight the podium or first place if you want, or just generic styles
              const isFirst = index === 0;
              return (
                <tr key={row.username} style={{ borderBottom: '1px solid #eee', backgroundColor: isFirst ? '#fff9db' : 'transparent' }}>
                  <td style={{ padding: '10px', fontWeight: isFirst ? 'bold' : 'normal' }}>
                    {isFirst ? '🏆 1' : index + 1}
                  </td>
                  <td style={{ padding: '10px', fontWeight: isFirst ? 'bold' : 'normal' }}>
                    {row.username}
                  </td>
                  <td style={{ padding: '10px', fontWeight: 'bold' }}>
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