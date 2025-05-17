const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  userName: {
    type: String,
    required: true
  },
  sessionId: {
    type: String,
    required: true,
    ref: 'Session'
  }, 
  roomId: {
    type: String,
    required: true
  },
  createdAt: {
    type: Date,
    default: Date.now
  },
  lastActive: {
    type: Date,
    default: Date.now
  }
});

module.exports = mongoose.model('User', UserSchema);
