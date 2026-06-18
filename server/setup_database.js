// server/setup_database.js
import { randomBytes, scryptSync } from 'crypto';
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
    // Using scrypt in its synchronous form only for database setup
    const hash = scryptSync(password, salt, 32).toString('hex');    
    
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
        name TEXT NOT NULL,
        x INTEGER NOT NULL,
        y INTEGER NOT NULL,
        label_dx INTEGER,
        label_dy INTEGER,
        label_anchor TEXT
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
    insertGame.run(2, 16);  // bjordi-02 scored 16
    insertGame.run(2, 18);  // bjordi-02 scored 18
    insertGame.run(3, 12); // carla_26 scored 12
    insertGame.finalize();

    // Insert lines (4 lines)
    const insertLine = db.prepare(`INSERT INTO lines (name) VALUES (?)`);
    const lines = ['Green Line', 'Red Line', 'Orange Line', 'Blue Line'];
    lines.forEach(l => insertLine.run(l));
    insertLine.finalize();


  // Stations with coordinates for map visualization and label positioning
    const insertStation = db.prepare(`INSERT INTO stations (name, x, y, label_dx, label_dy, label_anchor) VALUES (?, ?, ?, ?, ?, ?)`);
    const stations = [
        /* 1 */ { name: 'Valmy', x: 10, y: 50, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 2 */ { name: 'Gorge de Loup', x: 28, y: 50, label_dx: 0, label_dy: 4.5, label_anchor: 'middle' },
        /* 3 */ { name: 'Cathédrale St. Jean', x: 46, y: 50, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 4 */ { name: 'Bellecour', x: 64, y: 50, label_dx: -2, label_dy: 4, label_anchor: 'end' },
        /* 5 */ { name: 'Guillotière', x: 82, y: 50, label_dx: 0, label_dy: 4.5, label_anchor: 'middle' },
        /* 6 */ { name: 'Saxe', x: 100, y: 50, label_dx: -2, label_dy: -2.5, label_anchor: 'end' },
        /* 7 */ { name: 'Garibaldi', x: 118, y: 50, label_dx: 0, label_dy: 4.5, label_anchor: 'middle' },
        /* 8 */ { name: 'Perrache', x: 64, y: 90, label_dx: -3, label_dy: 1, label_anchor: 'end' },
        /* 9 */ { name: 'Ampère Victor Hugo', x: 64, y: 70, label_dx: -3, label_dy: 1, label_anchor: 'end' },
        /* 10 */ { name: 'Cordeliers', x: 64, y: 38, label_dx: -3, label_dy: 1, label_anchor: 'end' },
        /* 11 */ { name: 'Hotel Pradel', x: 64, y: 25, label_dx: -3, label_dy: 1, label_anchor: 'end' },
        /* 12 */ { name: 'Croix Paquet', x: 55, y: 15, label_dx: 2, label_dy: -1, label_anchor: 'start' },
        /* 13 */ { name: 'Croix Rousse', x: 46, y: 5, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 14 */ { name: 'Hénon', x: 28, y: 5, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 15 */ { name: 'Cuire', x: 10, y: 5, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 16 */ { name: 'Place Jean Jaurés', x: 100, y: 90, label_dx: 3, label_dy: 1, label_anchor: 'start' },
        /* 17 */ { name: 'Jean Macé', x: 100, y: 70, label_dx: 3, label_dy: 1, label_anchor: 'start' },
        /* 18 */ { name: 'Place Guichard', x: 118, y: 40, label_dx: -2, label_dy: -2.5, label_anchor: 'end' },
        /* 19 */ { name: 'Vivier Merle', x: 136, y: 40, label_dx: 3, label_dy: 1, label_anchor: 'start' },
        /* 20 */ { name: 'Brotteaux', x: 136, y: 33, label_dx: -3, label_dy: 1, label_anchor: 'end' },
        /* 21 */ { name: 'Charpennes Hernu', x: 136, y: 25, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 22 */ { name: 'Foch', x: 82, y: 25, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 23 */ { name: 'Masséna', x: 100, y: 25, label_dx: 0, label_dy: -3, label_anchor: 'middle' },
        /* 24 */ { name: 'Villeurbanne', x: 154, y: 25, label_dx: 0, label_dy: 4.5, label_anchor: 'middle' },
        /* 25 */ { name: 'Gratte Ciel', x: 172, y: 25, label_dx: 0, label_dy: -3, label_anchor: 'middle' }
    ];

    stations.forEach(s => insertStation.run(s.name, s.x, s.y, s.label_dx, s.label_dy, s.label_anchor));
    insertStation.finalize();

    // Insert segments 
    // Creating 4 interchange stations: Bellecour (4), Hotel Pradel (11), Saxe Gambetta (6), Charrpennes Hernu (21)
    const insertSegment = db.prepare(`INSERT INTO segments (station_a, station_b, line_id) VALUES (?, ?, ?)`);
    
    
    // Green Line (Line 1): 
    insertSegment.run(1, 2, 1); insertSegment.run(2, 3, 1); insertSegment.run(3, 4, 1); insertSegment.run(4, 5, 1);
    insertSegment.run(5, 6, 1); insertSegment.run(6, 7, 1);

    // Red Line (Line 2):
    insertSegment.run(8, 9, 2); insertSegment.run(9, 4, 2); insertSegment.run(4, 10, 2); insertSegment.run(10, 11, 2); 
    insertSegment.run(11, 22, 2); insertSegment.run(22, 23, 2); insertSegment.run(23, 21, 2); insertSegment.run(21, 24, 2); 
    insertSegment.run(24, 25, 2);

    // Orange Line (Line 3): 
    insertSegment.run(11, 12, 3); insertSegment.run(12, 13, 3); insertSegment.run(13, 14, 3); insertSegment.run(14, 15, 3);

    // Blue Line (Line 4)
    insertSegment.run(16, 17, 4); insertSegment.run(17, 6, 4); insertSegment.run(6, 18, 4); insertSegment.run(18, 19, 4); 
    insertSegment.run(19, 20, 4); insertSegment.run(20, 21, 4);
    
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