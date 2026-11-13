import mongoose from "mongoose"

export interface IFriends {
  friendId: mongoose.Types.ObjectId
  bugCount: number
  lastBuggedAt: Date | null
}

// This interface describes fields stored by the Mongoose User model.
export interface IUser {
  name: string
  username: string
  email: string
  password: string
  isVerified: boolean
  verificationToken: string | null
  verificationTokenExpires: Date | null
  resetPasswordToken: string | null
  resetPasswordExpires: Date | null
  streakCount: number
  lastWorkoutCompletedAt: Date | null
  friends: IFriends[]
}

const UserSchema = new mongoose.Schema<IUser>({
  name: {
    type: String,
    default: "",
    trim: true,
    maxlength: 100
  },
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true   // Optimized for partial-match search requirement
  },
  email: {
    type: String,
    required: true,
    unique: true,
    trim: true
  },
  password: {
    type: String,   // Stored as a bcrypt hash by the backend
    required: true
  },
  isVerified: {
    type: Boolean,
    default: false    // For email verification requirement
  },
  verificationToken: {
    type: String,
    default: null
  },
  verificationTokenExpires: {
    type: Date,
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
    default: 0    // Weekly/daily streak count
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
        ref: "User"
      },
      bugCount: {
        type: Number,
        default: 0    // Increments when you click "Bug"
      },
      lastBuggedAt: {
        type: Date,
        default: null
      }
    }
  ]
}, { timestamps: true })

// Partial text/regex index for user search ("Find Your Bros")
UserSchema.index({ username: "text" })

export default mongoose.model<IUser>("User", UserSchema)
