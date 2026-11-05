const mongoose = require('mongoose');

const ScheduleSchema = new mongoose.Schema({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    enum: ['Monday', 'Tuesday', 'Wednesday', 'Thursday', 'Friday', 'Saturday', 'Sunday'],
    required: true
  },
  startTime: {
    type: String, // e.g., "12:00 PM"
    required: true
  },
  endTime: {
    type: String, // e.g., "1:00 PM"
    required: true
  },
  activity: {
    type: String, // e.g., "Gym - Strength training", "Swim", "Walk"
    required: true
  },
  isCompletedToday: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

module.exports = mongoose.model('Schedule', ScheduleSchema);