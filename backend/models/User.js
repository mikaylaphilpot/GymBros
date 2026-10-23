const mongoose = require('mongoose');

const UserSchema = new mongoose.Schema({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true // Optimized for partial-match search requirement
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true
  },
  password: {
    type: String, // Stored as a bcrypt hash by the backend
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false // For email verification requirement
  },
  verificationToken: {
    type: String,
    default: null
  },
  resetPasswordToken: {
    type: String,
    default: null
  },
  resetPasswordExpires: {
    type: Date,
    default: null
  },
  streakCount: {
    type: Number,
    default: 0 // Weekly/daily streak count
  },
  lastWorkoutCompletedAt: {
    type: Date,
    default: null
  },
  // Sub-document array to manage Bros & Bug tracking
  friends: [
    {
      friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: 'User'
      },
      bugCount: {
        type: Number,
        default: 0 // Increments when you click "Bug"
      },
      lastBuggedAt: {
        type: Date,
        default: null
      }
    }
  ]
}, { timestamps: true });

// Partial text/regex index for user search ("Find Your Bros")
UserSchema.index({ username: 'text' });

module.exports = mongoose.model('User', UserSchema);