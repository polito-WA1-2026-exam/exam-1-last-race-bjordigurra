// server/index.js

// imports
import express from "express";
import cors from "cors";
import pkg from "sqlite3";
import session from "express-session";
import passport from "passport";
import { initPassport, isLoggedIn } from "./auth.js";

const { Database } = pkg;

// init express
const app = express();
const port = 3001;

// database connection
const db = new Database('database.sqlite', (err) => {
    if (err) throw err;
    console.log("Connected to the SQLite database.");
});

// Initialize passport strategy
initPassport(db);

// middleware
const corsOptions = {
    origin: 'http://localhost:5173',
    credentials: true, // Crucial for sessions/cookies to work cross-origin
};
app.use(cors(corsOptions));
app.use(express.json());

// Configure express-session before passport
app.use(session({
    secret: "a secret string to sign the session cookie, make it secure",
    resave: false,
    saveUninitialized: false
}));

// Initialize passport session support
app.use(passport.initialize());
app.use(passport.session());


// api routes

// GET /api/stations - this retrieves all the stations
app.get('/api/stations', (req, res) => {
    const sql = 'SELECT * FROM stations';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error during station retrieval" });
        }
        res.json(rows);
    });
});


// GET /api/lines - retrieves all lines
app.get('/api/lines', (req, res) => {
    const sql = 'SELECT * FROM lines';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error during lines retrieval" });
        }
        res.json(rows);
    });
});

// GET /api/segments - retrieves all connections between stations
app.get('/api/segments', (req, res) => {
    const sql = 'SELECT * FROM segments';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error during segments retrieval" });
        }
        res.json(rows);
    });
});

// GET /api/events - retrieves all possible random events
app.get('/api/events', (req, res) => {
    const sql = 'SELECT * FROM events';
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error during events retrieval" });
        }
        res.json(rows);
    });
});

// GET /api/mission - Randomly assigns a valid start and destination (distance >= 3)
app.get('/api/mission', isLoggedIn, (req, res) => {
    // 1. Fetch all stations and segments
    db.all('SELECT * FROM stations', [], (err, stations) => {
        if (err) return res.status(500).json({ error: "Error fetching stations" });
        
        db.all('SELECT * FROM segments', [], (err, segments) => {
            if (err) return res.status(500).json({ error: "Error fetching segments" });

            // 2. Build the graph (Adjacency List)
            const graph = {};
            stations.forEach(s => graph[s.id] = []);
            
            segments.forEach(seg => {
                // Assuming connections are bidirectional
                graph[seg.station_a].push(seg.station_b);
                graph[seg.station_b].push(seg.station_a);
            });

            // 3. Helper function: Breadth-First Search to find distances from a start node
            const getDistances = (startId) => {
                const distances = {};
                stations.forEach(s => distances[s.id] = Infinity);
                distances[startId] = 0;
                
                const queue = [startId];

                while (queue.length > 0) {
                    const current = queue.shift();
                    graph[current].forEach(neighbor => {
                        if (distances[neighbor] === Infinity) {
                            distances[neighbor] = distances[current] + 1;
                            queue.push(neighbor);
                        }
                    });
                }
                return distances;
            };

            // 4. Find all valid pairs (distance >= 3)
            const validPairs = [];
            stations.forEach(startStation => {
                const distances = getDistances(startStation.id);
                
                stations.forEach(destStation => {
                    if (distances[destStation.id] >= 3 && distances[destStation.id] !== Infinity) {
                        validPairs.push({
                            start: startStation,
                            destination: destStation,
                            minimumDistance: distances[destStation.id]
                        });
                    }
                });
            });

            if (validPairs.length === 0) {
                return res.status(500).json({ error: "Network geometry invalid: no stations are 3 segments apart." });
            }

            // 5. Pick a random pair
            const randomIndex = Math.floor(Math.random() * validPairs.length);
            res.json(validPairs[randomIndex]);
        });
    });
});

// ==========================================
// AUTHENTICATION API ROUTES
// ==========================================

// POST /api/sessions - LOGIN
app.post('/api/sessions', passport.authenticate('local'), (req, res) => {
    // If this function gets called, authentication was successful.
    // req.user contains the authenticated user.
    const safeUser = {
        id: req.user.id,
        username: req.user.username
    };
    res.status(201).json(safeUser);
});

// DELETE /api/sessions/current - LOGOUT
app.delete('/api/sessions/current', (req, res) => {
    req.logout((err) => {
        if (err) return res.status(500).json({ error: "Error during logout" });
        res.end();
    });
});

// GET /api/sessions/current - CHECK CURRENT SESSION
// Used by React to check if the user is already logged in when reloading the page
app.get('/api/sessions/current', (req, res) => {
    if (req.isAuthenticated()) {
        const safeUser = {
            id: req.user.id,
            username: req.user.username
        };
        res.json(safeUser);
    } else {
        res.status(401).json({ error: "Not authenticated" });
    }
});

// GET /api/rankings - GET RANKING (BY BEST SCORE)
app.get('/api/rankings', (req, res) => {
    // SQL query to join users and games, taking the MAX score for each user
    const sql = `
        SELECT users.username, MAX(games.score) as best_score
        FROM games
        JOIN users ON games.user_id = users.id
        GROUP BY users.id
        ORDER BY best_score DESC
    `;
    
    db.all(sql, [], (err, rows) => {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error retrieving rankings" });
        }
        res.json(rows);
    });
});

// POST /api/games - This saves the result of a game for the logged-in user
app.post('/api/games', isLoggedIn, (req, res) => {
    let finalScore = req.body.score;
    
    // If the score is negative, it is set to 0
    if (finalScore < 0) {
        finalScore = 0;
    }

    const sql = 'INSERT INTO games (user_id, score) VALUES (?, ?)';
    
    db.run(sql, [req.user.id, finalScore], function(err) {
        if (err) {
            console.error(err.message);
            return res.status(500).json({ error: "Error saving the game" });
        }
        // Return the saved score and the ID of the new row in the database
        res.status(201).json({ id: this.lastID, score: finalScore });
    });
});


// activate the server
app.listen(port, () => {
  console.log(`Server listening at http://localhost:${port}`);
});