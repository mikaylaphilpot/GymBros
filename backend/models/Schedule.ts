import mongoose, { Schema, Types, model } from 'mongoose';

// The day union keeps schedule entries limited to the seven calendar days.
interface Schedule {
  userId: Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  activity: string;
  isCompletedToday: boolean;
}

const ScheduleSchema = new Schema<Schedule>({
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

export default model<Schedule>('Schedule', ScheduleSchema);
