const express = require('express');
const passport = require('passport');
const jwt = require('jsonwebtoken');
const router = express.Router();
const User = require('../models/User');

// @route   GET api/auth/google
// @desc    Authenticate with Google
// @access  Public
router.get('/google', passport.authenticate('google', { 
  scope: ['profile', 'email'] 
}));

// @route   GET api/auth/google/callback
// @desc    Google auth callback
// @access  Public
router.get('/google/callback', 
  passport.authenticate('google', { 
    failureRedirect: '/' 
  }),
  (req, res) => {
    // Create JWT token
    const payload = {
      user: {
        id: req.user.id,
        name: req.user.displayName,
        email: req.user.email,
        picture: req.user.profilePicture
      }
    };

    jwt.sign(
      payload,
      process.env.JWT_SECRET,
      { expiresIn: '7d' }, // Token expires in 7 days
      (err, token) => {
        if (err) throw err;
        // Redirect to frontend with token
        res.redirect(`${process.env.FRONTEND_URL}/auth/callback?token=${token}`);
      }
    );
  }
);

// @route   GET api/auth/user
// @desc    Get user data if authenticated
// @access  Private
router.get('/user', async (req, res) => {
  try {
    // Check for token in header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Get user by id from decoded token
    const user = await User.findById(decoded.user.id).select('-googleId');
    
    if (!user) {
      return res.status(404).json({ msg: 'User not found' });
    }

    res.json(user);
  } catch (err) {
    console.error('Error in auth/user route:', err);
    res.status(401).json({ msg: 'Token is not valid' });
  }
});

// @route   GET api/auth/verify
// @desc    Verify token and return user data
// @access  Public
router.get('/verify', (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Return user info from token
    res.json({ 
      user: decoded.user,
      isValid: true 
    });
  } catch (err) {
    res.status(401).json({ 
      msg: 'Token is not valid',
      isValid: false
    });
  }
});

// @route   POST api/auth/refresh
// @desc    Refresh JWT token
// @access  Private
router.post('/refresh', (req, res) => {
  try {
    // Get token from header
    const token = req.header('x-auth-token');
    
    if (!token) {
      return res.status(401).json({ msg: 'No token, authorization denied' });
    }

    // Verify current token
    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    // Create a new token with the same user data
    jwt.sign(
      { user: decoded.user },
      process.env.JWT_SECRET,
      { expiresIn: '7d' },
      (err, token) => {
        if (err) throw err;
        res.json({ token });
      }
    );
  } catch (err) {
    console.error('Error refreshing token:', err);
    res.status(401).json({ msg: 'Token refresh failed' });
  }
});

// @route   POST api/auth/logout
// @desc    Logout user / Clear session
// @access  Public
router.post('/logout', (req, res) => {
  req.logout();
  res.json({ msg: 'User logged out' });
});

module.exports = router;
