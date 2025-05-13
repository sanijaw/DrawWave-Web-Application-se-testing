const express = require('express');
const router = express.Router();
const Session = require('../models/Session');
const User = require('../models/User');

// Create a new session
router.post('/create', async (req, res) => {
  try {
    const { sessionId, roomId, userName } = req.body;
    
    if (!sessionId || !roomId || !userName) {
      return res.status(400).json({ success: false, message: 'All fields are required' });
    }
    
    // Check if session already exists
    const existingSession = await Session.findOne({ $or: [{ sessionId }, { roomId }] });
    if (existingSession) {
      return res.status(400).json({ success: false, message: 'Session or Room ID already exists' });
    }
    
    const newSession = new Session({
      sessionId,
      roomId,
      createdBy: userName,
      participants: [{ name: userName }]
    });
    
    await newSession.save();
    
    // Also create a user record
    const newUser = new User({
      userName,
      sessionId,
      roomId
    });
    
    await newUser.save();
    
    res.status(201).json({
      success: true,
      data: {
        sessionId: newSession.sessionId,
        roomId: newSession.roomId,
        userId: newUser._id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Validate and join a session
router.post('/validate', async (req, res) => {
  try {
    const { sessionId, userName } = req.body;
    
    if (!sessionId || !userName) {
      return res.status(400).json({ success: false, message: 'Session ID and user name are required' });
    }
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Add participant to the session
    session.participants.push({ name: userName });
    await session.save();
    
    // Create a user record for this participant
    const newUser = new User({
      userName,
      sessionId: session.sessionId,
      roomId: session.roomId
    });
    
    await newUser.save();
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        roomId: session.roomId,
        createdBy: session.createdBy,
        participantCount: session.participants.length,
        userId: newUser._id
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Get session details
router.get('/:sessionId', async (req, res) => {
  try {
    const { sessionId } = req.params;
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    res.status(200).json({
      success: true,
      data: {
        sessionId: session.sessionId,
        roomId: session.roomId,
        createdBy: session.createdBy,
        participants: session.participants.length,
        createdAt: session.createdAt,
        canvasData: session.canvasData ? `data:image/png;base64,${session.canvasData}` : null,
        drawingLayerData: session.drawingLayerData ? `data:image/png;base64,${session.drawingLayerData}` : null
      }
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
});

// Update canvas state
router.post('/update-canvas', async (req, res) => {
  try {
    const { sessionId, canvasData, isDrawingLayer } = req.body;
    
    if (!sessionId) {
      return res.status(400).json({ success: false, message: 'Session ID is required' });
    }
    
    const session = await Session.findOne({ sessionId });
    
    if (!session) {
      return res.status(404).json({ success: false, message: 'Session not found' });
    }
    
    // Update the appropriate layer
    if (isDrawingLayer) {
      session.drawingLayerData = canvasData;
    } else {
      session.canvasData = canvasData;
    }
    
    session.lastUpdated = Date.now();
    await session.save();
    
    res.status(200).json({
      success: true,
      message: 'Canvas state updated successfully'
    });
  } catch (error) {
    console.error('Error updating canvas state:', error);
    res.status(500).json({ success: false, message: error.message });
  }
});

module.exports = router;