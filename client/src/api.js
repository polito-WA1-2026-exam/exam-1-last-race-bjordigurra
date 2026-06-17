// client/src/api.js

const BASE_URL = 'http://localhost:3001/api';

// Fetch all stations
export async function getStations() {
  const response = await fetch(`${BASE_URL}/stations`);
  if (!response.ok) throw new Error('Failed to fetch stations');
  return await response.json();
}

// Fetch all lines
export async function getLines() {
  const response = await fetch(`${BASE_URL}/lines`);
  if (!response.ok) throw new Error('Failed to fetch lines');
  return await response.json();
}

// Fetch all segments (connections between stations)
export async function getSegments() {
  const response = await fetch(`${BASE_URL}/segments`);
  if (!response.ok) throw new Error('Failed to fetch segments');
  return await response.json();
}

// Fetch all random events
export async function getEvents() {
  const response = await fetch(`${BASE_URL}/events`);
  if (!response.ok) throw new Error('Failed to fetch events');
  return await response.json();
}

// Get mission for the planning phase (random start and destination)
export async function getMission() {
  const response = await fetch(`${BASE_URL}/mission`, { credentials: 'include' });
  if (!response.ok) throw new Error('Failed to fetch mission');
  return await response.json();
}

// POST a new game score
export async function saveGameScore(score) {
  const response = await fetch(`${BASE_URL}/games`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ score }),
    credentials: 'include', // Crucial to identify the logged-in user
  });
  if (!response.ok) throw new Error('Failed to save the game score');
  return await response.json();
}

// Fetch global rankings
export async function getRankings() {
  const response = await fetch(`${BASE_URL}/rankings`);
  if (!response.ok) throw new Error('Failed to fetch rankings');
  return await response.json();
}

// POST api/sessions for login
export async function login(username, password) {
  const response = await fetch(`${BASE_URL}/sessions`, {
    method: 'POST',
    headers: {
      'Content-Type': 'application/json',
    },
    body: JSON.stringify({ username, password }),
    credentials: 'include',
  });

  if (response.ok) {
    return await response.json();
    } else {
    throw new Error('Incorrect username or password.');
  }
}