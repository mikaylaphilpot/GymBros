import mongoose from "mongoose";
import User, { type IFriends } from "../models/User.js";
import Schedule, { type DayOfWeek } from "../models/Schedule.js";

export interface FriendDetails {
  friendId: string;
  username: string;
  streakCount: number;
  bugCount: number;
  lastBuggedAt: Date | null;
}

export interface FriendWorkoutDetails extends FriendDetails {
  workouts: Array<{
    scheduleId: string;
    activity: string;
    startTime: string;
    endTime: string;
    isCompletedToday: boolean;
  }>;
}

function getTodayName(): DayOfWeek {
  const days: DayOfWeek[] = [
    "Sunday",
    "Monday",
    "Tuesday",
    "Wednesday",
    "Thursday",
    "Friday",
    "Saturday",
  ];

  return days[new Date().getDay()];
}

function getTodayDateKey(): string {
  const now = new Date();

  const year = now.getFullYear();
  const month = String(now.getMonth() + 1).padStart(2, "0");
  const day = String(now.getDate()).padStart(2, "0");

  return `${year}-${month}-${day}`;
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
    .map((friend: IFriends) => {
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

// AI-assisted: enriches the existing friend list with only today's schedules.
export async function getFriendsWithTodayWorkouts(
  currentUserId: string,
): Promise<FriendWorkoutDetails[]> {
  const friends = await getFriends(currentUserId);
  const friendIds = friends.map((friend) => new mongoose.Types.ObjectId(friend.friendId));
  if (friendIds.length === 0) return [];

  const schedules = await Schedule.find({
    userId: { $in: friendIds },
    dayOfWeek: getTodayName(),
  }).lean();
  const today = getTodayDateKey();
  const schedulesByUser = new Map<string, FriendWorkoutDetails["workouts"]>();

  for (const schedule of schedules) {
    const userId = schedule.userId.toString();
    const workouts = schedulesByUser.get(userId) ?? [];
    workouts.push({
      scheduleId: schedule._id.toString(),
      activity: schedule.activity,
      startTime: schedule.startTime,
      endTime: schedule.endTime,
      isCompletedToday: schedule.completedDate === today,
    });
    schedulesByUser.set(userId, workouts);
  }

  return friends.flatMap((friend) => {
    const workouts = schedulesByUser.get(friend.friendId);
    return workouts?.length ? [{ ...friend, workouts }] : [];
  });
}