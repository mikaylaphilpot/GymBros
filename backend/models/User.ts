import mongoose from "mongoose";

export interface IUser {
  username: string;
  email: string;
  password: string;
  isVerified: boolean;
  verificationToken: string;
  verificationTokenExpires: Date;
  resetPasswordToken: string;
  resetPasswordExpires: Date;
  streakCount: number;
  lastWorkoutCompletedAt: Date;
  friends: IFriends[];
}

export interface IFriends {
  friendId: mongoose.Types.ObjectId;
  bugCount: number;
  lastBuggedAt: Date | null;
}

const UserSchema = new mongoose.Schema<IUser>({
  username: {
    type: String,
    required: true,
    unique: true,
    trim: true,
    index: true,
  },
  email: {
    type: String,
    required: true,
    unique: true,
    lowercase: true,
    trim: true,
  },
  password: {
    type: String,
    required: true,
  },
  isVerified: {
    type: Boolean,
    default: false,
  },
  verificationToken: {
    type: String,
    default: null,
  },
  verificationTokenExpires: {
    type: Date,
    default: null,
  },
  resetPasswordToken: {
    type: String,
    default: null,
  },
  resetPasswordExpires: {
    type: Date,
    default: null,
  },
  streakCount: {
    type: Number,
    default: 0,
  },
  lastWorkoutCompletedAt: {
    type: Date,
    default: null,
  },
  friends: [
    {
      friendId: {
        type: mongoose.Schema.Types.ObjectId,
        ref: "User",
      },
      bugCount: {
        type: Number,
        default: 0,
      },
      lastBuggedAt: {
        type: Date,
        default: null,
      },
    },
  ],
}, { timestamps: true });

UserSchema.index({ username: "text" });

export default mongoose.models.User ||
  mongoose.model<IUser>("User", UserSchema);