import mongoose from "mongoose";
import User from "../models/User.js";

// AI-assisted: Initial Implementation suggested by Copilot
export async function deleteFriend(currentUserId: string, friendId: string) {
  if (!mongoose.isValidObjectId(currentUserId)) {
    throw new Error("Invalid current user ID.");
  }

  if (!mongoose.isValidObjectId(friendId)) {
    throw new Error("Invalid friend ID.");
  }

  if (currentUserId === friendId) {
    throw new Error("A user cannot delete themselves as a friend.");
  }

  const currentUserObjectId = new mongoose.Types.ObjectId(currentUserId);
  const friendObjectId = new mongoose.Types.ObjectId(friendId);

  const result = await User.updateOne(
    {
      _id: currentUserObjectId,
      "friends.friendId": friendObjectId,
    },
    { $pull: { friends: { friendId: friendObjectId } } }
  );

  if (result.matchedCount === 0) {
    const currentUserExists = await User.exists({ _id: currentUserObjectId });

    if (!currentUserExists) {
      throw new Error("Current user was not found.");
    }

    return { deleted: false, message: "Friend is not in the user's friend list." };
  }

  return { deleted: true, message: "Friend deleted successfully." };
}
