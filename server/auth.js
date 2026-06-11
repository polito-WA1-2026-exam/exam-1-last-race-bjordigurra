// server/auth.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';

// Helper function to verify if the password matches the stored hash
function verifyPassword(password, hash, salt) {
    const hashedPassword = crypto.pbkdf2Sync(password, salt, 310000, 32, 'sha256').toString('hex');
    return crypto.timingSafeEqual(Buffer.from(hash, 'hex'), Buffer.from(hashedPassword, 'hex'));
}

export function initPassport(db) {
    // 1. Define the Local Strategy for login
    passport.use(new LocalStrategy((username, password, done) => {
        const sql = 'SELECT * FROM users WHERE username = ?';
        
        db.get(sql, [username], (err, row) => {
            if (err) return done(err);
            if (!row) {
                // User not found
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            
            // Verify password using our helper function
            if (!verifyPassword(password, row.hash, row.salt)) {
                // Password doesn't match
                return done(null, false, { message: 'Incorrect username or password.' });
            }
            
            // Authentication successful
            return done(null, row);
        });
    }));

    // 2. Serialize user (stores user info inside the session cookie)
    passport.serializeUser((user, done) => {
        done(null, { id: user.id, username: user.username });
    });

    // 3. Deserialize user (retrieves full user info on subsequent requests)
    passport.deserializeUser((user, done) => {
        done(null, user); // req.user will contain this object
    });
}

// Middleware to check if the user is authenticated
export function isLoggedIn(req, res, next) {
    if (req.isAuthenticated()) {
        return next();
    }
    return res.status(401).json({ error: 'Not authenticated' });
}