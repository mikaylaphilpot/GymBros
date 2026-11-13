import mongoose from "mongoose"

export type DayOfWeek =
  | "Monday"
  | "Tuesday"
  | "Wednesday"
  | "Thursday"
  | "Friday"
  | "Saturday"
  | "Sunday"

export interface ISchedule {
  userId: mongoose.Types.ObjectId
  dayOfWeek: DayOfWeek
  startTime: string
  endTime: string
  activity: string
  isCompletedToday: boolean
  completedDate: string | null
}

const ScheduleSchema = new mongoose.Schema<ISchedule>({
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: "User",
    required: true,
    index: true
  },
  dayOfWeek: {
    type: String,
    enum: ["Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday", "Sunday"],
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
  },
  completedDate: {
    type: String,
    default: null
  }
}, { timestamps: true })

export default mongoose.model<ISchedule>("Schedule", ScheduleSchema)
