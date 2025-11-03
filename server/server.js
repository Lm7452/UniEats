// server.js (Integrated Version)

const express = require('express');
const dotenv = require('dotenv');
const passport = require('passport');
const session = require('express-session');
const bodyParser = require('body-parser');
const OIDCStrategy = require('passport-azure-ad').OIDCStrategy;
const path = require('path');
const db = require('./db'); 

// --- 1. INITIAL SETUP ---
dotenv.config();
const app = express();
const PORT = process.env.PORT || 5000;

// --- 2. MIDDLEWARE SETUP ---
app.use(bodyParser.urlencoded({ extended: true }));
app.use(express.json()); // Parse JSON bodies
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
      } else {
        console.log('Existing user found:', user);
        if (user.name !== name || user.email !== email) {
           console.log('Updating user information...');
           await db.query(
             'UPDATE users SET name = $1, email = $2, updated_at = NOW() WHERE id = $3',
             [name, email, user.id]
           );
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

// Middleware to protect routes
function isAuthenticated(req, res, next) {
  if (req.isAuthenticated()) {
    return next();
  }
  res.status(401).json({ error: 'User not authenticated' });
}

// *** NEW API ENDPOINT ***
// GET all buildings
app.get('/api/buildings', async (req, res) => {
  try {
    const result = await db.query('SELECT name FROM buildings ORDER BY name ASC');
    // Send back an array of just the names
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error('Error fetching buildings:', err);
    res.status(500).json({ error: 'Failed to fetch buildings' });
  }
});
// *** END OF NEW ENDPOINT ***

app.get('/login',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' })
);
app.post('/auth/openid/return',
  passport.authenticate('azuread-openidconnect', { failureRedirect: '/login-failed' }),
  (req, res) => {
    console.log(`--- SUCCESS! Redirecting to: /dashboard ---`);
    res.redirect(`/dashboard`);
  }
);
app.get('/logout', (req, res, next) => {
  req.logout(function(err) {
    if (err) { return next(err); }
    req.session.destroy(() => {
    res.redirect('/');
    });
  });
});
app.get('/profile', isAuthenticated, (req, res) => {
  res.json(req.user); 
});
app.put('/profile', isAuthenticated, async (req, res) => {
  const {
    name,
    dorm_building,
    dorm_room,
    phone_number,
    notify_email_order_status,
    notify_email_promotions
  } = req.body;
  const userId = req.user.id;
  console.log(`Updating profile for user ${userId}:`, req.body);
  try {
    const result = await db.query(
      `UPDATE users SET
        name = $1,
        dorm_building = $2,
        dorm_room = $3,
        phone_number = $4,
        notify_email_order_status = $5,
        notify_email_promotions = $6,
        updated_at = NOW()
      WHERE id = $7 RETURNING *`,
      [
        name,
        dorm_building,
        dorm_room,
        phone_number,
        notify_email_order_status,
        notify_email_promotions,
        userId
      ]
    );
    if (result.rows.length > 0) {
      res.status(200).json(result.rows[0]);
    } else {
      res.status(404).json({ error: 'User not found' });
    }
  } catch (err) {
    console.error('Error updating profile:', err);
    res.status(500).json({ error: 'Failed to update profile' });
  }
});
app.get('/login-failed', (req, res) => {
  res.status(401).send('<h1>Login Failed</h1><p>There was an error authenticating.</p><a href="/">Home</a>');
});

// --- 5. SERVE REACT APP ---
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// --- 6. SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});