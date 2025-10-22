// server.js (Corrected and Production-Ready)

const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const connectDB = require('./db');
const cors = require('cors'); // --- FIX: Added for handling cross-origin requests
const path = require('path'); // --- FIX: Added for serving static files

// --- 1. INITIAL SETUP ---
dotenv.config();
// connectDB(); // Still disabled for now
console.log("CLIENT_ID:", process.env.CLIENT_ID);
console.log("CLIENT_SECRET:", process.env.CLIENT_SECRET ? "Loaded" : "Missing");

const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARE SETUP ---
app.use(cors()); // Use CORS middleware
app.use(express.json()); // Modern replacement for bodyParser.json()
app.use(express.urlencoded({ extended: true })); // Modern replacement for bodyParser.urlencoded()

app.use(session({
  secret: process.env.SESSION_SECRET || 'a-default-secret-for-dev',
  resave: false,
  saveUninitialized: true,
}));

app.use(passport.initialize());
app.use(passport.session());

// --- 3. PASSPORT STRATEGY CONFIGURATION ---
const oidcConfig = {
  identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
  clientID: process.env.CLIENT_ID,
  clientSecret: process.env.CLIENT_SECRET,
  responseType: 'code id_token',
  responseMode: 'form_post',
  redirectUrl: process.env.REDIRECT_URL,
  allowHttpForRedirectUrl: process.env.NODE_ENV !== "production", // ✅ allow HTTP in dev
  scope: ['profile', 'email'],
  passReqToCallback: false
};

passport.use(new OIDCStrategy(oidcConfig,
  (iss, sub, profile, done) => {
    // In the future, you will find or create a user in your database here.
    return done(null, profile);
  }
));

passport.serializeUser((user, done) => {
  done(null, user.sub);
});
passport.deserializeUser((sub, done) => {
  done(null, { sub: sub });
});

// --- 4. API ROUTES ---
app.get('/login',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' })
);

app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' }),
  (req, res) => {
    // --- FIX: Corrected typo from "es.redirect" to "res.redirect" ---
    res.redirect(`${process.env.FRONTEND_URL}/dashboard`);
  }
);

app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
        res.redirect(process.env.FRONTEND_URL);
    });
  });
});

// --- 5. SERVE STATIC ASSETS IN PRODUCTION ---
// Serve React frontend in production
if (process.env.NODE_ENV === 'production') {
  app.use(express.static(path.join(__dirname, '../frontend/build')));

  app.get('*', (req, res) => {
    res.sendFile(path.resolve(__dirname, '../frontend/build', 'index.html'));
  });
}

// --- 6. SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});