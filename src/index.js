require('dotenv').config();

const path    = require('path');
const express = require('express');
const cors    = require('cors');
const { messagingApi } = require('@line/bot-sdk');
const pool = require('./db/connection');

const app = express();
const PORT = process.env.PORT || 3000;

const lineClient = new messagingApi.MessagingApiClient({
  channelAccessToken: process.env.LINE_CHANNEL_ACCESS_TOKEN,
});

// CORS — must be first, before any routes
app.use(cors({
  origin: [
    'http://localhost:5173',
    'http://localhost:3000',
    /\.ngrok-free\.app$/,
    /\.ngrok-free\.dev$/,
  ],
  methods: ['GET', 'POST', 'PUT', 'PATCH', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization'],
  credentials: true,
}));

// Static files (uploaded images)
app.use('/uploads', express.static(path.join(__dirname, '../public/uploads')));

// Middleware
app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Attach LINE client to every request
app.use((req, res, next) => {
  req.lineClient = lineClient;
  next();
});

// Routes
const authRouter = require('./routes/auth');
const casesRouter = require('./routes/cases');
const { skillsRouter, craftsmanRouter } = require('./routes/skills');
const contactsRouter = require('./routes/contacts');
const ratingsRouter = require('./routes/ratings');
const craftsmanApplicationRouter = require('./routes/craftsmanApplication');

app.use('/api/auth', authRouter);                 // POST /login  GET /me  PUT /profile
app.use('/api/cases', casesRouter);               // POST /  GET /  GET /:id  PATCH /:id  PATCH /:id/cancel  PATCH /:id/rebroadcast
app.use('/api/skills', skillsRouter);             // GET /
app.use('/api/craftsman', craftsmanRouter);       // GET /:id/skills  POST /:id/skills  GET /:id/ratings
app.use('/api', contactsRouter);                  // GET /case/:id/contacts  POST /case/:id/contact
app.use('/api', ratingsRouter);                   // POST /ratings  GET /craftsman/:id/ratings
app.use('/api/craftsman', craftsmanApplicationRouter);  // POST /apply  GET /application-status
app.use('/api', craftsmanApplicationRouter);      // GET /admin/applications  PATCH /admin/applications/:id/...

// Health check
app.get('/health', async (req, res) => {
  try {
    await pool.query('SELECT 1');
    res.json({ status: 'ok', db: 'connected', env: process.env.NODE_ENV });
  } catch (err) {
    res.status(500).json({ status: 'error', db: err.message });
  }
});

app.listen(PORT, () => {
  console.log(`Server running on http://localhost:${PORT}`);
  console.log(`ENV: ${process.env.NODE_ENV} | DB: ${process.env.MYSQL_DATABASE}`);
});
