import mongoose from "mongoose"

// AI-assisted: Initial Implementation suggested by Copilot
export interface ISchedule {
  userId: mongoose.Schema.Types.ObjectId,
  dayOfWeek: string,
  startTime: string;
  endTime: string;
  activity: string;
  isCompletedToday: boolean;
}

const ScheduleSchema = new mongoose.Schema<ISchedule>({
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

export default mongoose.model("Schedule", ScheduleSchema);