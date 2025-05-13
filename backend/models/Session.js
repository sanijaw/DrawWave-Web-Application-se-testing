const mongoose = require('mongoose');

const SessionSchema = new mongoose.Schema({
  sessionId: {
    type: String,
    required: true,
    unique: true
  },
  roomId: {
    type: String,
    required: true,
    unique: true
  },
  createdBy: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now,
    expires: 86400 // Sessions expire after 24 hours
  },
  participants: [{
    name: String,
    joinedAt: {
      type: Date,
      default: Date.now
    }
  }],
  canvasData: {
    type: String,  // Base64 encoded canvas state
    default: ''
  },
  drawingLayerData: {
    type: String,  // Base64 encoded drawing layer
    default: ''
  },
  lastUpdated: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('Session', SessionSchema);