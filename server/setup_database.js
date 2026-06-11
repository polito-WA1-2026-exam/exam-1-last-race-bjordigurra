// server/setup_database.js
import { randomBytes, pbkdf2Sync } from 'crypto';
import pkg from 'sqlite3';
const { Database } = pkg;


// Open the database (creates the file if it doesn't exist)
const db = new Database('database.sqlite', (err) => {
    if (err) throw err;
    console.log("Connected to the SQLite database.");
});

// Helper function to generate salted hashes for user passwords
function hashPassword(password) {
    const salt = randomBytes(16).toString('hex');
    // pbkdf2Sync is secure and suitable for standard user authentication
    const hash = pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
    return { salt, hash };
}

// Prepare the 3 required users (default password is 'password' for everyone)
const users = [
    { username: 'anna06', ...hashPassword('password') },
    { username: 'bjordi-02', ...hashPassword('password') },
    { username: 'carla_26', ...hashPassword('password') }
];

db.serialize(() => {
    // 1. Drop existing tables to ensure that the script can be re-run
    db.run(`DROP TABLE IF EXISTS games`);
    db.run(`DROP TABLE IF EXISTS events`);
    db.run(`DROP TABLE IF EXISTS segments`);
    db.run(`DROP TABLE IF EXISTS stations`);
    db.run(`DROP TABLE IF EXISTS lines`);
    db.run(`DROP TABLE IF EXISTS users`);

    // 2. Create tables
    db.run(`CREATE TABLE users (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        username TEXT UNIQUE NOT NULL,
        hash TEXT NOT NULL,
        salt TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE games (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        user_id INTEGER NOT NULL,
        score INTEGER NOT NULL,
        FOREIGN KEY(user_id) REFERENCES users(id)
    )`);

    db.run(`CREATE TABLE lines (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    db.run(`CREATE TABLE stations (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        name TEXT NOT NULL
    )`);

    // The segments table represents the connections between stations.
    // A station is an 'interchange' if it appears here with different line_ids.
    db.run(`CREATE TABLE segments (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        station_a INTEGER NOT NULL,
        station_b INTEGER NOT NULL,
        line_id INTEGER NOT NULL,
        FOREIGN KEY(station_a) REFERENCES stations(id),
        FOREIGN KEY(station_b) REFERENCES stations(id),
        FOREIGN KEY(line_id) REFERENCES lines(id)
    )`);

    db.run(`CREATE TABLE events (
        id INTEGER PRIMARY KEY AUTOINCREMENT,
        description TEXT NOT NULL,
        effect INTEGER NOT NULL
    )`);

    // 3. Insert initial data (seeding)

    // Insert users (3)
    const insertUser = db.prepare(`INSERT INTO users (username, hash, salt) VALUES (?, ?, ?)`);
    users.forEach(u => insertUser.run(u.username, u.hash, u.salt));
    insertUser.finalize();

    // Insert games (at least 2 users must have successfully played)
    const insertGame = db.prepare(`INSERT INTO games (user_id, score) VALUES (?, ?)`);
    insertGame.run(1, 15); // anna06 scored 15
    insertGame.run(1, 24); // anna06 scored 24
    insertGame.run(2, 0);  // bjordi_02 scored 0
    insertGame.finalize();

    // Insert lines (at least 4)
    const insertLine = db.prepare(`INSERT INTO lines (name) VALUES (?)`);
    const lines = ['Red Line', 'Blue Line', 'Green Line', 'Yellow Line'];
    lines.forEach(l => insertLine.run(l));
    insertLine.finalize();

    // Insert stations (12)
    const insertStation = db.prepare(`INSERT INTO stations (name) VALUES (?)`);
    const stations = [
        'Alpha', 'Beta', 'Gamma', 'Delta',      
        'Epsilon', 'Zeta', 'Eta', 'Theta',       
        'Iota', 'Kappa', 'Lambda', 'Mu'          
    ];
    stations.forEach(s => insertStation.run(s));
    insertStation.finalize();

    // Insert segments (creating 4 interchange stations: Delta(4), Eta(7), Kappa(10), Alpha(1))
    const insertSegment = db.prepare(`INSERT INTO segments (station_a, station_b, line_id) VALUES (?, ?, ?)`);
    
    // Red Line (Line 1): Alpha(1) <-> Beta(2) <-> Gamma(3) <-> Delta(4)
    insertSegment.run(1, 2, 1); insertSegment.run(2, 3, 1); insertSegment.run(3, 4, 1);
    
    // Blue Line (Line 2): Delta(4) <-> Epsilon(5) <-> Zeta(6) <-> Eta(7)
    insertSegment.run(4, 5, 2); insertSegment.run(5, 6, 2); insertSegment.run(6, 7, 2);
    
    // Green Line (Line 3): Eta(7) <-> Theta(8) <-> Iota(9) <-> Kappa(10)
    insertSegment.run(7, 8, 3); insertSegment.run(8, 9, 3); insertSegment.run(9, 10, 3);
    
    // Yellow Line (Line 4): Kappa(10) <-> Lambda(11) <-> Mu(12) <-> Alpha(1)
    insertSegment.run(10, 11, 4); insertSegment.run(11, 12, 4); insertSegment.run(12, 1, 4);
    insertSegment.finalize();

    // Insert events (at least 8, with effect between -4 and +4)
    const insertEvent = db.prepare(`INSERT INTO events (description, effect) VALUES (?, ?)`);
    const events = [
        { desc: 'Found a coin on the seat', effect: 1 },
        { desc: 'Helped a tourist with directions', effect: 2 },
        { desc: 'Lucky day, found a dropped wallet and got a reward', effect: 4 },
        { desc: 'Quiet journey, nothing happens', effect: 0 },
        { desc: 'Dropped a coin at the vending machine', effect: -1 },
        { desc: 'Bought a quick snack', effect: -2 },
        { desc: 'Missed the train, bought a coffee', effect: -3 },
        { desc: 'Fined by the ticket inspector', effect: -4 }
    ];
    events.forEach(e => insertEvent.run(e.desc, e.effect));
    insertEvent.finalize();

    console.log("Database initialized successfully with seeded data!");
});

db.close();