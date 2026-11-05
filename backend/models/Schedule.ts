import mongoose, { Schema, Types, model } from 'mongoose';

export interface ISchedule {
  userId: Types.ObjectId;
  dayOfWeek: 'Monday' | 'Tuesday' | 'Wednesday' | 'Thursday' | 'Friday' | 'Saturday' | 'Sunday';
  startTime: string;
  endTime: string;
  activity: string;
  isCompletedToday: boolean;
}

const ScheduleSchema = new Schema<ISchedule>({
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
    type: String,
    required: true
  },
  endTime: {
    type: String,
    required: true
  },
  activity: {
    type: String,
    required: true
  },
  isCompletedToday: {
    type: Boolean,
    default: false
  }
}, { timestamps: true });

export default model<ISchedule>('Schedule', ScheduleSchema);
