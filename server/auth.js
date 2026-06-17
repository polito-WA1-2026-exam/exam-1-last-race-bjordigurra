// server/auth.js
import passport from 'passport';
import { Strategy as LocalStrategy } from 'passport-local';
import crypto from 'crypto';


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

            // Hash the provided password with the stored salt and compare to the stored hash
            crypto.scrypt(password, row.salt, 32, (err, hashedPassword) => {
                if (err) return done(err);

                if (!crypto.timingSafeEqual(Buffer.from(row.hash, 'hex'), hashedPassword)) {
                    // Password doesn't match
                    return done(null, false, { message: 'Incorrect username or password.' });
                }
            
                // Authentication successful
                return done(null, row);
            });
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