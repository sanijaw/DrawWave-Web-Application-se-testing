const express = require('express');
const router = express.Router();
const Session = require('../models/Session');

// Check if a room ID is available
router.post('/check-availability', async (req, res) => {
  try {
    const { roomId } = req.body;
    
    if (!roomId) {
      return res.status(400).json({ 
        success: false, 
        message: 'Room ID is required',
        available: false
      });
    }
    
    // Check if a session with this room ID already exists
    const existingSession = await Session.findOne({ roomId });
    
    // Return the availability status
    res.status(200).json({
      success: true,
      available: !existingSession,
      message: existingSession ? 'Room ID already in use' : 'Room ID is available'
    });
  } catch (error) {
    console.error('Error checking room ID availability:', error);
    res.status(500).json({ 
      success: false, 
      message: error.message,
      available: false // Assume not available in case of error to be safe
    });
  }
});

module.exports = router;
