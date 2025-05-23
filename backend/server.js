const express = require('express');
const mongoose = require('mongoose');
const cors = require('cors');
const bodyParser = require('body-parser');
const passport = require('passport');
const session = require('express-session');
require('dotenv').config();

const app = express();
const PORT = process.env.PORT || 5000;

// Middleware
app.use(cors({
  origin:["https://app.drawwave.space", "http://localhost:5173"] ,
  credentials: true, // Important for authentication
  methods: ['GET', 'POST', 'PUT', 'DELETE', 'OPTIONS'],
  allowedHeaders: ['Content-Type', 'Authorization', 'x-auth-token']
}));
app.use(bodyParser.json());

// Express session
app.use(session({
  secret: process.env.SESSION_SECRET || 'drawwave_secret',
  resave: false,
  saveUninitialized: false,
  cookie: { secure: process.env.NODE_ENV === 'production' }
}));

// Passport middleware
app.use(passport.initialize());
app.use(passport.session());

// Initialize Passport config
require('./config/passport')();

// Connect to MongoDB
mongoose.connect(process.env.MONGODB_URI)
  .then(() => console.log('MongoDB connected'))
  .catch(err => console.log('MongoDB connection error:', err));

// Routes
app.use('/api/sessions', require('./routes/sessions'));
app.use('/api/users', require('./routes/users'));
app.use('/api/rooms', require('./routes/rooms'));
app.use('/api/auth', require('./routes/auth'));
app.use('/api/health', require('./routes/health'))

// Basic route
app.get('/', (req, res) => {
  res.send('DrawWave Session Management API');
});

app.listen(PORT, () => {
  console.log(`Server running on port ${PORT}`);
});