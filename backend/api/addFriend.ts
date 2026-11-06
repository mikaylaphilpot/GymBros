import mongoose from "mongoose";
import User from "../models/User.js";

// AI-assisted: Initial Implementation suggested by Copilot
export async function addFriend(currentUserId: string, friendId: string) {
  if (!mongoose.isValidObjectId(currentUserId)) {
    throw new Error("Invalid current user ID.");
  }

  if (!mongoose.isValidObjectId(friendId)) {
    throw new Error("Invalid friend ID.");
  }

  if (currentUserId === friendId) {
    throw new Error("A user cannot add themselves as a friend.");
  }

  const friendObjectId = new mongoose.Types.ObjectId(friendId);
  const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);

  const friendExists = await User.exists({ _id: friendObjectId });

  if (!friendExists) {
    throw new Error("Friend user was not found.");
  }

  const result = await User.updateOne(
    {
      _id: currentUserObjectId,
      "friends.friendId": { $ne: friendObjectId },
    },
    {
      $push: {
        friends: {
          friendId: friendObjectId,
          bugCount: 0,
          lastBuggedAt: null,
        },
      },
    }
  );

  if (result.matchedCount === 0) {
    const currentUserExists = await User.exists({ _id: currentUserId });

    if (!currentUserExists) {
      throw new Error("Current user was not found.");
    }

    return { added: false, message: "Friend is already added." };
  }

  return { added: true, message: "Friend added successfully." };
}
