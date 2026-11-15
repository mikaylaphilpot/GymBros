//AI-assisted: Initial implementation suggested by Copilot (reviewed and modified)
import { afterEach, describe, expect, jest, test } from "@jest/globals";
import mongoose from "mongoose";
import Schedule from "../models/Schedule";
import User from "../models/User";
import { addFriend } from "../api/addFriend";
import { deleteFriend } from "../api/deleteFriend";
import {
  getBestBro,
  getFriends,
  getFriendsByStats,
  getFriendsWithTodayWorkouts,
  getStreakBro,
} from "../api/getFriends";
import { searchUsers } from "../api/search";

const currentUserId = "64b000000000000000000001";
const firstFriendId = "64b000000000000000000002";
const secondFriendId = "64b000000000000000000003";

function populatedUser(friends: unknown[]) {
  return {
    populate: jest.fn().mockReturnThis(),
    lean: jest.fn(async () => ({ friends })),
  };
}

function friend(friendId: string, username: string, streakCount: number, bugCount: number) {
  return {
    friendId: { _id: new mongoose.Types.ObjectId(friendId), username, streakCount },
    bugCount,
    lastBuggedAt: null,
  };
}

afterEach(() => {
  jest.restoreAllMocks();
});

describe("friend APIs", () => {
  test("rejects invalid IDs and omits deleted friend references", async () => {
    await expect(getFriends("invalid-id")).rejects.toThrow("Invalid current user ID.");

    const query = populatedUser([
      friend(firstFriendId, "strong-bro", 8, 2),
      { friendId: null, bugCount: 0, lastBuggedAt: null },
    ]);
    jest.spyOn(User, "findById").mockReturnValue(query as never);

    await expect(getFriends(currentUserId)).resolves.toEqual([
      {
        friendId: firstFriendId,
        username: "strong-bro",
        streakCount: 8,
        bugCount: 2,
        lastBuggedAt: null,
      },
    ]);
    expect(query.populate).toHaveBeenCalledWith("friends.friendId", "_id username streakCount");
  });

  test("returns null statistics for an empty list and selects leaders for populated lists", async () => {
    const emptyQuery = populatedUser([]);
    jest.spyOn(User, "findById").mockReturnValue(emptyQuery as never);
    await expect(getBestBro(currentUserId)).resolves.toBeNull();
    await expect(getStreakBro(currentUserId)).resolves.toBeNull();
    await expect(getFriendsByStats(currentUserId)).resolves.toEqual({
      otherFriends: [],
      highestStreakFriend: null,
      mostBuggedFriend: null,
    });

    const leaders = [
      friend(firstFriendId, "streak-leader", 10, 1),
      friend(secondFriendId, "bug-leader", 4, 7),
    ];
    jest.spyOn(User, "findById").mockReturnValue(populatedUser(leaders) as never);

    await expect(getBestBro(currentUserId)).resolves.toMatchObject({ friendId: secondFriendId });
    await expect(getStreakBro(currentUserId)).resolves.toMatchObject({ friendId: firstFriendId });
    await expect(getFriendsByStats(currentUserId)).resolves.toMatchObject({
      highestStreakFriend: { friendId: firstFriendId },
      mostBuggedFriend: { friendId: secondFriendId },
      otherFriends: [],
    });
  });

  test("attaches today's schedules to friends with workouts", async () => {
    const friendsQuery = populatedUser([friend(firstFriendId, "workout-bro", 3, 0)]);
    jest.spyOn(User, "findById").mockReturnValue(friendsQuery as never);
    const now = new Date();
    const today = `${now.getFullYear()}-${String(now.getMonth() + 1).padStart(2, "0")}-${String(now.getDate()).padStart(2, "0")}`;
    const scheduleQuery = {
      lean: jest.fn(async () => [{
        _id: new mongoose.Types.ObjectId("64b000000000000000000004"),
        userId: new mongoose.Types.ObjectId(firstFriendId),
        activity: "Lift",
        startTime: "8:00 AM",
        endTime: "9:00 AM",
        completedDate: today,
      }]),
    };
    jest.spyOn(Schedule, "find").mockReturnValue(scheduleQuery as never);

    const results = await getFriendsWithTodayWorkouts(currentUserId);

    expect(results).toHaveLength(1);
    expect(results[0]).toMatchObject({
      friendId: firstFriendId,
      workouts: [{ activity: "Lift", isCompletedToday: true }],
    });
    expect(Schedule.find as jest.Mock).toHaveBeenCalledWith({
      userId: { $in: [new mongoose.Types.ObjectId(firstFriendId)] },
      dayOfWeek: ["Sunday", "Monday", "Tuesday", "Wednesday", "Thursday", "Friday", "Saturday"][now.getDay()],
    });
  });

  test("adds a friend and reports existing or missing users", async () => {
    jest.spyOn(User, "exists").mockResolvedValueOnce({ _id: firstFriendId } as never);
    jest.spyOn(User, "updateOne").mockResolvedValueOnce({ matchedCount: 1 } as never);

    await expect(addFriend(currentUserId, firstFriendId)).resolves.toEqual({
      added: true,
      message: "Friend added successfully.",
    });

    jest.spyOn(User, "exists").mockResolvedValueOnce({ _id: firstFriendId } as never);
    jest.spyOn(User, "updateOne").mockResolvedValueOnce({ matchedCount: 0 } as never);
    jest.spyOn(User, "exists").mockResolvedValueOnce({ _id: currentUserId } as never);
    await expect(addFriend(currentUserId, firstFriendId)).resolves.toEqual({
      added: false,
      message: "Friend is already added.",
    });

    await expect(addFriend(currentUserId, currentUserId)).rejects.toThrow("A user cannot add themselves");
  });

  test("deletes an existing friend and reports an absent relationship", async () => {
    const updateOne = jest.spyOn(User, "updateOne")
      .mockResolvedValueOnce({ matchedCount: 1 } as never)
      .mockResolvedValueOnce({ matchedCount: 0 } as never);
    jest.spyOn(User, "exists").mockResolvedValueOnce({ _id: currentUserId } as never);

    await expect(deleteFriend(currentUserId, firstFriendId)).resolves.toEqual({
      deleted: true,
      message: "Friend deleted successfully.",
    });
    await expect(deleteFriend(currentUserId, firstFriendId)).resolves.toEqual({
      deleted: false,
      message: "Friend is not in the user's friend list.",
    });
    expect(updateOne as jest.Mock).toHaveBeenCalledWith(
      { _id: new mongoose.Types.ObjectId(currentUserId), "friends.friendId": new mongoose.Types.ObjectId(firstFriendId) },
      { $pull: { friends: { friendId: new mongoose.Types.ObjectId(firstFriendId) } } },
    );
  });
});

describe("user search API", () => {
  test("ignores blank searches and escapes regular expression characters", async () => {
    await expect(searchUsers("   ", currentUserId)).resolves.toEqual([]);

    const query = {
      select: jest.fn().mockReturnThis(),
      limit: jest.fn().mockReturnThis(),
      lean: jest.fn(async () => [] as unknown[]),
    };
    jest.spyOn(User, "find").mockReturnValue(query as never);

    await expect(searchUsers("  a.b+  ", currentUserId)).resolves.toEqual([]);
    expect(User.find).toHaveBeenCalledWith({
      $or: [
        { username: { $regex: "a\\.b\\+", $options: "i" } },
        { email: { $regex: "a\\.b\\+", $options: "i" } },
      ],
      _id: { $ne: currentUserId },
    });
    expect(query.limit).toHaveBeenCalledWith(20);
  });
});