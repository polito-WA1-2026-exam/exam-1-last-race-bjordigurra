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