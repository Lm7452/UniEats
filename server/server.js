// server.js (Integrated Version)

const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const cors = require('cors');
const path = require('path'); // <-- ADDED
const db = require('./db'); 

// --- 1. INITIAL SETUP ---
// Load environment variables from .env file FIRST
dotenv.config();

const app = express();
const PORT = process.env.PORT || 5000;


// --- 2. MIDDLEWARE SETUP ---
// Body parser middleware to handle form submissions
app.use(bodyParser.urlencoded({ extended: true }));

// Session middleware - required for Passport to maintain a login session
app.use(session({
  secret: process.env.SESSION_SECRET || 'a-default-secret-for-dev', 
  resave: false,
  saveUninitialized: true,
}));

// Initialize Passport and have it use the session
app.use(passport.initialize());
app.use(passport.session());

// CORS is not strictly needed in production if frontend/backend are same origin
// but it doesn't hurt and is useful for local dev.
app.use(cors({
    origin: process.env.FRONTEND_URL, // This is for local dev
    credentials: true
}));

// --- 3. PASSPORT STRATEGY CONFIGURATION ---
// (Your existing Passport config)
const oidcConfig = {
    identityMetadata: `https://login.microsoftonline.com/${process.env.TENANT_ID}/v2.0/.well-known/openid-configuration`,
    clientID: process.env.CLIENT_ID,
    clientSecret: process.env.CLIENT_SECRET,
    responseType: 'code id_token',
    responseMode: 'form_post',
    redirectUrl: process.env.REDIRECT_URL || 'http://localhost:5000/auth/openid/return',
    allowHttpForRedirectUrl: true, 

    scope: ['profile', 'email'],
    
    passReqToCallback: false
};

console.log('--- Initializing Passport with this OIDC Config ---');
console.log(oidcConfig);

passport.use(new OIDCStrategy(oidcConfig,
  async (iss, sub, profile, done) => { 
    console.log('--- OIDC CALLBACK TRIGGERED ---');
    console.log('Authentication with Microsoft was successful.');
    
    const azureOid = profile.oid;
    const email = profile.upn || profile._json?.email || profile.emails?.[0]?.value;
    const name = profile.displayName || 'UniEats User';

    if (!azureOid || !email) {
       console.error('Azure profile object missing oid or email:', profile);
       return done(new Error('Authentication profile is missing required identifiers.'), null);
    }

    try {
      let userResult = await db.query('SELECT * FROM users WHERE azure_oid = $1', [azureOid]);
      let user = userResult.rows[0];

      if (!user) {
        console.log(`User not found with OID ${azureOid}, creating new user...`);
        const insertResult = await db.query(
          'INSERT INTO users (azure_oid, email, name) VALUES ($1, $2, $3) RETURNING *',
          [azureOid, email, name]
        );
        user = insertResult.rows[0];
        console.log('New user created:', user);
      } else {
        console.log('Existing user found:', user);
        if (user.name !== name || user.email !== email) {
           console.log('Updating user information...');
           const updateResult = await db.query(
             'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3 RETURNING *',
             [name, email, user.id]
           );
           user = updateResult.rows[0];
           console.log('User updated:', user);
        }
      }
      return done(null, user);

    } catch (err) {
      console.error('Error during database user lookup/creation:', err);
      return done(err, null);
    }
  }
));

passport.serializeUser((user, done) => {
  done(null, user.id); 
});

passport.deserializeUser(async (id, done) => {
  try {
    const userResult = await db.query('SELECT * FROM users WHERE id = $1', [id]);
    const user = userResult.rows[0];
    done(null, user || false); 
  } catch (err) {
    done(err, null);
  }
});

// --- 4. API & AUTH ROUTES ---
// (Your existing routes)

app.get('/login',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' })
);

app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' }),
  (req, res) => {
    console.log(`--- SUCCESS! Redirecting to: /dashboard ---`);
    // Authentication was successful. Redirect to the FRONTEND dashboard.
    // NOTE: On Heroku, we redirect to a relative path, not the full FRONTEND_URL
    res.redirect(`/dashboard`);
  }
);

app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
    // Redirect to the home page
    res.redirect('/');
    });
  });
});

app.get('/profile', (req, res) => {
    if (req.isAuthenticated()) { 
        res.json(req.user); // Send user data as JSON
    } else {
        res.status(401).json({ error: 'User not authenticated' });
    }
});

app.get('/login-failed', (req, res) => {
  res.status(401).send('<h1>Login Failed</h1><p>There was an error authenticating.</p><a href="/">Home</a>');
});


// --- 5. SERVE REACT APP (THE CRITICAL INTEGRATION) ---
// Serve static files from the React build folder
app.use(express.static(path.join(__dirname, '../client/build')));

// All other requests (that are not API routes) serve the React app
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});


// --- 6. SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});

