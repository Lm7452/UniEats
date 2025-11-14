// server.js (Now with Availability logic)

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
        if (user.email !== email) {
           console.log('Updating user email from Azure AD...');
           await db.query(
             'UPDATE users SET email = $1, updated_at = NOW() WHERE id = $2',
             [email, user.id]
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
  if (req.path.startsWith('/api/')) {
    return res.status(401).json({ error: 'User not authenticated' });
  }
  res.redirect('/');
}

// *** NEW PUBLIC ENDPOINT FOR APP STATUS ***
app.get('/api/app-status', async (req, res) => {
  try {
    const result = await db.query(
      "SELECT COUNT(*) FROM users WHERE role = 'driver' AND is_available = true"
    );
    const availableDriverCount = parseInt(result.rows[0].count, 10);
    res.json({ availableDriverCount });
  } catch (err) {
    console.error('Error fetching app status:', err);
    res.status(500).json({ error: 'Failed to fetch app status' });
  }
});

// GET buildings/locations filtered by location type
// Accepts optional query param `type` which should match a value in `location_types.name`.
// If no `type` is provided, defaults to 'Residential College' to preserve previous behavior.
app.get('/api/buildings', async (req, res) => {
  try {
    const rawType = req.query.type;
    // Allow short aliases from the client (e.g., 'residential', 'upperclassmen')
    let typeName = rawType;
    if (!typeName) {
      typeName = 'Residential College';
    } else if (typeName.toLowerCase() === 'residential') {
      typeName = 'Residential College';
    } else if (typeName.toLowerCase() === 'upperclassmen') {
      typeName = 'Upperclassmen Hall';
    }

    // Join locations -> location_types to get only locations of the requested type
    const query = `
      SELECT l.name
      FROM locations l
      JOIN location_types lt ON lt.id = l.location_type_id
      WHERE lt.name = $1
      ORDER BY l.name ASC
    `;
    const result = await db.query(query, [typeName]);
    res.json(result.rows.map(row => row.name));
  } catch (err) {
    console.error('Error fetching buildings/locations:', err);
    res.status(500).json({ error: 'Failed to fetch buildings/locations' });
  }
});

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

// GET profile route (sends ALL user data, including role and availability)
app.get('/profile', isAuthenticated, (req, res) => {
  res.json(req.user); // req.user is refreshed on login, will have is_available
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

// POST a new order
app.post('/api/orders', isAuthenticated, async (req, res) => {
  const { princeton_order_number, delivery_building, delivery_room, tip_amount } = req.body;
  const customer_id = req.user.id;
  
  // --- CHECK IF DRIVERS ARE AVAILABLE BEFORE CREATING ORDER ---
  try {
    const statusResult = await db.query(
      "SELECT COUNT(*) FROM users WHERE role = 'driver' AND is_available = true"
    );
    if (parseInt(statusResult.rows[0].count, 10) === 0) {
      return res.status(503).json({ error: 'No drivers are available to take this order. Please try again later.' });
    }
  } catch (err) {
     return res.status(500).json({ error: 'Failed to check driver status.' });
  }
  // --- END OF CHECK ---

  if (!princeton_order_number || !delivery_building || !delivery_room) {
    return res.status(400).json({ error: 'Missing required order details' });
  }
  try {
    const result = await db.query(
      `INSERT INTO orders 
        (princeton_order_number, customer_id, delivery_building, delivery_room, tip_amount, status)
       VALUES 
        ($1, $2, $3, $4, $5, 'pending')
       RETURNING *`,
      [princeton_order_number, customer_id, delivery_building, delivery_room, tip_amount || 0]
    );
    const newOrder = result.rows[0];
    console.log(`New order created: ID ${newOrder.id} by user ${customer_id}`);
    res.status(201).json(newOrder); // 201 Created
  } catch (err) {
    console.error('Error creating new order:', err);
    res.status(500).json({ error: 'Failed to create order' });
  }
});

// GET Student's order history
app.get('/api/orders/my-history', isAuthenticated, async (req, res) => {
  const customer_id = req.user.id;
  try {
    const result = await db.query(
      `SELECT 
         o.id, o.princeton_order_number, o.delivery_building, o.delivery_room, o.tip_amount, o.status, o.created_at,
         u.name AS driver_name,
         u.phone_number AS driver_phone
       FROM orders o
       LEFT JOIN users u ON o.driver_id = u.id
       WHERE o.customer_id = $1
       ORDER BY o.created_at DESC`, 
      [customer_id]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Error fetching student order history:', err);
    res.status(500).json({ error: 'Failed to fetch order history' });
  }
});


app.get('/login-failed', (req, res) => {
  res.status(401).send('<h1>Login Failed</h1><p>There was an error authenticating.</p><a href="/">Home</a>');
});


// --- 5. ADMIN ROUTES ---

// Middleware to check if user is an admin
function isAdmin(req, res, next) {
  if (req.isAuthenticated() && req.user.role === 'admin') {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Requires admin privileges' });
}

// GET all users (Admin only)
app.get('/api/admin/users', isAdmin, async (req, res) => {
  try {
    // --- ADDED is_available TO THE QUERY ---
    const result = await db.query('SELECT id, name, email, role, is_available, created_at FROM users ORDER BY name ASC');
    res.json(result.rows);
  } catch (err) {
    console.error('Admin error fetching users:', err);
    res.status(500).json({ error: 'Failed to fetch users' });
  }
});

// GET all orders (Admin only) - list orders with brief details
app.get('/api/admin/orders', isAdmin, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT o.id, o.princeton_order_number, o.delivery_building, o.delivery_room, o.tip_amount, o.status, o.created_at, o.customer_id,
              u.name AS customer_name, u.email AS customer_email
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       ORDER BY o.created_at DESC`
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Admin error fetching orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// DELETE an order (Admin only)
app.delete('/api/admin/orders/:orderId', isAdmin, async (req, res) => {
  const { orderId } = req.params;
  try {
    const result = await db.query(
      'DELETE FROM orders WHERE id = $1 RETURNING *',
      [orderId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found' });
    }
    console.log(`Admin ${req.user.id} deleted order ${orderId}`);
    res.json({ deleted: true, order: result.rows[0] });
  } catch (err) {
    console.error('Admin error deleting order:', err);
    res.status(500).json({ error: 'Failed to delete order' });
  }
});

// PUT to update a user's role (Admin only)
app.put('/api/admin/users/:userId/role', isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { role } = req.body; 
  if (!['student', 'driver', 'admin'].includes(role)) {
    return res.status(400).json({ error: 'Invalid role specified' });
  }
  try {
    const result = await db.query(
      'UPDATE users SET role = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [role, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'User not found' });
    }
    console.log(`Admin ${req.user.id} set user ${userId} role to ${role}`);
    res.status(200).json(result.rows[0]); 
  } catch (err) {
    console.error('Admin error updating role:', err);
    res.status(500).json({ error: 'Failed to update role' });
  }
});

// *** NEW ADMIN ENDPOINT FOR DRIVER AVAILABILITY ***
app.put('/api/admin/users/:userId/availability', isAdmin, async (req, res) => {
  const { userId } = req.params;
  const { is_available } = req.body; // Expects true or false

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'Invalid availability status specified' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET is_available = $1, updated_at = NOW() WHERE id = $2 AND role = \'driver\' RETURNING *',
      [is_available, userId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Driver not found' });
    }
    console.log(`Admin ${req.user.id} set driver ${userId} availability to ${is_available}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Admin error updating availability:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});


// --- 6. DRIVER ROUTES ---

// Middleware to check if user is a Driver (or Admin)
function isDriver(req, res, next) {
  if (req.isAuthenticated() && (req.user.role === 'driver' || req.user.role === 'admin')) {
    return next();
  }
  res.status(403).json({ error: 'Forbidden: Requires driver privileges' });
}

// *** NEW DRIVER ENDPOINT FOR AVAILABILITY ***
app.put('/api/driver/availability', isDriver, async (req, res) => {
  const driverId = req.user.id;
  const { is_available } = req.body; // Expects true or false

  if (typeof is_available !== 'boolean') {
    return res.status(400).json({ error: 'Invalid availability status' });
  }

  try {
    const result = await db.query(
      'UPDATE users SET is_available = $1, updated_at = NOW() WHERE id = $2 RETURNING *',
      [is_available, driverId]
    );
    console.log(`Driver ${driverId} set availability to ${is_available}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Driver error updating availability:', err);
    res.status(500).json({ error: 'Failed to update availability' });
  }
});

// GET all available orders (status 'pending')
app.get('/api/driver/orders/available', isDriver, async (req, res) => {
  try {
    const result = await db.query(
      `SELECT 
         o.id, o.princeton_order_number, o.delivery_building, o.delivery_room, o.tip_amount, o.created_at,
         u.name AS customer_name,
         u.phone_number AS customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.status = 'pending'
       ORDER BY o.created_at ASC`, 
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Driver error fetching available orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// GET all orders claimed by the current driver
app.get('/api/driver/orders/mine', isDriver, async (req, res) => {
  const driverId = req.user.id;
  try {
    const result = await db.query(
      `SELECT 
         o.id, o.princeton_order_number, o.delivery_building, o.delivery_room, o.tip_amount, o.status, o.created_at,
         u.name AS customer_name,
         u.phone_number AS customer_phone
       FROM orders o
       JOIN users u ON o.customer_id = u.id
       WHERE o.driver_id = $1 AND o.status IN ('claimed', 'picked_up', 'en_route')
       ORDER BY o.created_at DESC`, 
      [driverId]
    );
    res.json(result.rows);
  } catch (err) {
    console.error('Driver error fetching claimed orders:', err);
    res.status(500).json({ error: 'Failed to fetch orders' });
  }
});

// PUT to claim an available order
app.put('/api/driver/orders/:orderId/claim', isDriver, async (req, res) => {
  const { orderId } = req.params;
  const driverId = req.user.id;
  try {
    const result = await db.query(
      `UPDATE orders 
       SET 
         driver_id = $1, 
         status = 'claimed' 
       WHERE 
         id = $2 AND status = 'pending'
       RETURNING *`,
      [driverId, orderId]
    );
    if (result.rows.length === 0) {
      return res.status(409).json({ error: 'Order is no longer available to claim.' });
    }
    const claimedOrder = result.rows[0];
    console.log(`Driver ${driverId} claimed order ${orderId}`);
    res.status(200).json(claimedOrder);
  } catch (err) {
    console.error('Driver error claiming order:', err);
    res.status(500).json({ error: 'Failed to claim order' });
  }
});

// PUT to complete a claimed order
app.put('/api/driver/orders/:orderId/complete', isDriver, async (req, res) => {
  const { orderId } = req.params;
  const driverId = req.user.id;
  try {
    const result = await db.query(
      `UPDATE orders 
       SET 
         status = 'delivered' 
       WHERE 
         id = $1 AND driver_id = $2 AND status = 'claimed'
       RETURNING *`,
      [orderId, driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or not claimed by you.' });
    }
    const completedOrder = result.rows[0];
    console.log(`Driver ${driverId} completed order ${orderId}`);
    res.status(200).json(completedOrder);
  } catch (err) {
    console.error('Driver error completing order:', err);
    res.status(500).json({ error: 'Failed to complete order' });
  }
});

// PUT to update order status (picked_up, en_route, delivered) by assigned driver
app.put('/api/driver/orders/:orderId/status', isDriver, async (req, res) => {
  const { orderId } = req.params;
  const driverId = req.user.id;
  const { status } = req.body;

  const allowed = ['claimed', 'picked_up', 'en_route', 'delivered'];
  if (!allowed.includes(status)) {
    return res.status(400).json({ error: 'Invalid status value' });
  }

  try {
    const result = await db.query(
      `UPDATE orders
       SET status = $1
       WHERE id = $2 AND driver_id = $3
       RETURNING *`,
      [status, orderId, driverId]
    );
    if (result.rows.length === 0) {
      return res.status(404).json({ error: 'Order not found or not assigned to you.' });
    }
    console.log(`Driver ${driverId} set order ${orderId} status to ${status}`);
    res.status(200).json(result.rows[0]);
  } catch (err) {
    console.error('Driver error updating order status:', err);
    res.status(500).json({ error: 'Failed to update order status' });
  }
});


// --- 7. SERVE REACT APP ---
app.use(express.static(path.join(__dirname, '../client/build')));
app.get('*', (req, res) => {
  res.sendFile(path.join(__dirname, '../client/build/index.html'));
});

// --- 8. SERVER START ---
app.listen(PORT, () => {
  console.log(`Server is listening on port ${PORT}`);
});