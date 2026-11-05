import { Router } from "express";
import mongoose from "mongoose";
import authMiddleware from "../middleware/authMiddleware.js";
import Schedule from "../models/Schedule.js";
import User from "../models/User.js";

const router = Router();

router.use(authMiddleware);

function scheduleFields() {
  return "_id dayOfWeek startTime endTime activity isCompletedToday";
}

// GET /api/schedules/me
router.get("/me", async (req, res) => {
  const userId = req.userId;

  if (!userId || !mongoose.isValidObjectId(userId)) {
    res.status(401).json({ message: "Token Verification Failed" });
    return;
  }

  try {
    const schedules = await Schedule.find({ userId })
      .select(scheduleFields())
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    console.error("Getting user schedule failed:", error);
    res.status(500).json({ message: "Unable to get workout schedule." });
  }
});

async function getFriendSchedule(friendId: string, currentUserId: string) {
  if (!mongoose.isValidObjectId(friendId)) {
    return { status: 400, body: { message: "Invalid friend ID." } };
  }

  const user = await User.findOne({
    _id: currentUserId,
    "friends.friendId": friendId
  }).select("_id");

  if (!user) {
    const currentUser = await User.exists({ _id: currentUserId });
    return currentUser
      ? { status: 403, body: { message: "The requested user is not one of your Bros." } }
      : { status: 404, body: { message: "User not found." } };
  }

  const friend = await User.findById(friendId).select("_id username");

  if (!friend) {
    return { status: 404, body: { message: "Friend not found." } };
  }

  const schedules = await Schedule.find({ userId: friend._id })
    .select(scheduleFields())
    .sort({ dayOfWeek: 1, startTime: 1 })
    .lean();

  return {
    status: 200,
    body: {
      friend: {
        id: friend._id,
        username: friend.username
      },
      schedules
    }
  };
}

// GET /api/schedules/friends/:friendId
// Returns schedules only for the requested friend, after verifying friendship.
router.get("/friends/:friendId", async (req, res) => {
  const currentUserId = req.userId;

  if (!currentUserId || !mongoose.isValidObjectId(currentUserId)) {
    res.status(401).json({ message: "Token Verification Failed" });
    return;
  }

  try {
    const result = await getFriendSchedule(req.params.friendId, currentUserId);
    res.status(result.status).json(result.body);
  } catch (error) {
    console.error("Getting friend schedule failed:", error);
    res.status(500).json({ message: "Unable to get friend schedule." });
  }
});

// GET /api/schedules/friends
// Returns schedules for every current friend.
router.get("/friends", async (req, res) => {
  const currentUserId = req.userId;

  if (!currentUserId || !mongoose.isValidObjectId(currentUserId)) {
    res.status(401).json({ message: "Token Verification Failed" });
    return;
  }

  try {
    const user = await User.findById(currentUserId).select("friends");

    if (!user) {
      res.status(404).json({ message: "User not found." });
      return;
    }

    const friendIds = user.friends.map((friend) => friend.friendId);
    const schedules = await Schedule.find({ userId: { $in: friendIds } })
      .select(`${scheduleFields()} userId`)
      .populate("userId", "_id username")
      .sort({ dayOfWeek: 1, startTime: 1 })
      .lean();

    res.json(schedules);
  } catch (error) {
    console.error("Getting friends schedules failed:", error);
    res.status(500).json({ message: "Unable to get friends schedules." });
  }
});

export default router;
