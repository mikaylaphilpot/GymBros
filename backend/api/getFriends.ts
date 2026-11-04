import mongoose from "mongoose";
import User from "../models/User.js";

export interface FriendDetails {
  friendId: string;
  username: string;
  streakCount: number;
  bugCount: number;
  lastBuggedAt: Date | null;
}

interface UserFriend {
  friendId: mongoose.Types.ObjectId | null;
  bugCount: number;
  lastBuggedAt: Date | null;
}

// AI-assisted: Initial Implementation suggested by Copilot
export async function getFriends(
  currentUserId: string
): Promise<FriendDetails[]> {
  if (!mongoose.isValidObjectId(currentUserId)) {
    throw new Error("Invalid current user ID.");
  }

  const user = await User.findById(currentUserId)
    .populate("friends.friendId", "_id username streakCount")
    .lean();

  if (!user) {
    throw new Error("Current user was not found.");
  }

  return user.friends
    .map((friend: UserFriend) => {
      const populatedFriend = friend.friendId as unknown as {
        _id: mongoose.Types.ObjectId;
        username: string;
        streakCount: number;
      } | null;

      // A deleted or missing referenced user should not appear in the list.
      if (!populatedFriend) {
        return null;
      }

      return {
        friendId: populatedFriend._id.toString(),
        username: populatedFriend.username,
        streakCount: populatedFriend.streakCount,
        bugCount: friend.bugCount,
        lastBuggedAt: friend.lastBuggedAt,
      };
    })
    .filter(
      (friend: FriendDetails | null): friend is FriendDetails =>
        friend !== null,
    );
}

// AI-assisted: Initial Implementation suggested by Copilot
// Friend that has the highest bug rate
export async function getBestBro(currentUserId: string) {
    const bros = await getFriends(currentUserId);

    return bros.reduce<FriendDetails | null>((highest, bro) => {
    if (!highest || bro.bugCount > highest.bugCount) {
      return bro;
    }

    return highest;
  }, null);
}

// AI-assisted: Initial Implementation suggested by Copilot
// Bro with highest streak
export async function getStreakBro(currentUserId: string) {
    const bros = await getFriends(currentUserId);

    return bros.reduce<FriendDetails | null>((highest, bro) => {
    if (!highest || bro.streakCount > highest.streakCount) {
      return bro;
    }

    return highest;
  }, null);
}

// AI-assisted: Initial Implementation suggested by Copilot
export async function getFriendsByStats(currentUserId: string) {
  const friends = await getFriends(currentUserId);

  const byStreak = [...friends].sort(
    (first, second) => second.streakCount - first.streakCount
  );

  const byBugCount = [...friends].sort(
    (first, second) => second.bugCount - first.bugCount
  );


  const streakFriendId = byStreak[0]?.friendId;
  const buggedFriendId = byBugCount[0]?.friendId;

  const otherFriends = friends.filter(
    (friend) =>
        friend.friendId !== streakFriendId &&
        friend.friendId !== buggedFriendId
    );

  return {
    otherFriends: otherFriends,
    highestStreakFriend: byStreak[0] ?? null,
    mostBuggedFriend: byBugCount[0] ?? null,
  };
}