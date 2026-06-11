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

    // Insert lines (4 lines)
    const insertLine = db.prepare(`INSERT INTO lines (name) VALUES (?)`);
    const lines = ['Green Line', 'Red Line', 'Orange Line', 'Blue Line'];
    lines.forEach(l => insertLine.run(l));
    insertLine.finalize();


    // Insert stations (25 stations, minimum is 12)
    const insertStation = db.prepare(`INSERT INTO stations (name) VALUES (?)`);
    const stations = [
        'Valmy', 'Gorge de Loup', 'Cathédrale St. Jean',      
        'Bellecour', 'Guillotière', 'Saxe Gambetta', 'Garibaldi',       
        'Perrache', 'Ampère Victor Hugo', 'Cordeliers', 'Hotel Pradel',
        'Croix Paquet', 'Croix Rousse', 'Hénon', 'Cuire', 'Place Jean Jaurés', 'Jean Macé',
        'Place Guichard', 'Vivier Merle', 'Brotteaux', 'Charpennes Hernu', 'Foch',
        'Masséna', 'Villeurbanne', 'Gratte Ciel'      
    ];
    stations.forEach(s => insertStation.run(s));
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