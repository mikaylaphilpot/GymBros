import { Router } from "express";
import { searchUsers } from "../api/search";
import { addFriend } from "../api/addFriend";
import { deleteFriend } from "../api/deleteFriend";
import { getFriendsByStats } from "../api/getFriends";
import authMiddleware from "../middleware/authMiddleware";
import type { Request, RequestHandler, Response } from "express";

const router = Router();

const requireCurrentUser: RequestHandler = (req, res, next) => {
  if (typeof req.userId !== "string") {
    return res.status(401).json({ message: "Invalid or missing authentication credentials." });
  }

  if (typeof req.params.currentUserId !== "string") {
    return res.status(400).json({ message: "Invalid user ID." });
  }

  if (req.userId !== req.params.currentUserId) {
    return res.status(403).json({ message: "You cannot access another user's friends." });
  }

  next();
};

function getAuthenticatedUserId(req: Request, res: Response): string | undefined {
  if (typeof req.userId !== "string") {
    res.status(401).json({ message: "Invalid or missing authentication credentials." });
    return undefined;
  }

  return req.userId;
}

// AI-assisted: Initial Implementation suggested by Copilot
router.get("/search", authMiddleware, async (req, res) => {
  try {
    const searchContents =
      typeof req.query.q === "string" ? req.query.q : "";

    const currentUserId = getAuthenticatedUserId(req, res);
    if (!currentUserId) return;

    const users = await searchUsers(searchContents, currentUserId);

    res.json(users);
  } catch (error) {
    console.error("User search failed:", error);
    res.status(500).json({ message: "Unable to search users." });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.get("/:currentUserId/friends/stats", authMiddleware, requireCurrentUser, async (req, res) => {
  const currentUserId = getAuthenticatedUserId(req, res);
  if (!currentUserId) return;

  try {
    const stats = await getFriendsByStats(currentUserId);

    res.json(stats);
  } catch (error) {
    console.error("Getting friend stats failed:", error);

    const message = error instanceof Error ? error.message : "Unable to get friend stats.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.post("/:currentUserId/friends/:friendId", authMiddleware, requireCurrentUser, async (req, res) => {
  const currentUserId = getAuthenticatedUserId(req, res);
  if (!currentUserId) return;
  const friendId = req.params.friendId;
  if (typeof friendId !== "string") {
    return res.status(400).json({ message: "Invalid friend ID." });
  }

  try {
    const result = await addFriend(currentUserId, friendId);

    res.status(result.added ? 201 : 200).json(result);
  } catch (error) {
    console.error("Adding friend failed:", error);

    const message = error instanceof Error ? error.message : "Unable to add friend.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.delete("/:currentUserId/friends/:friendId", authMiddleware, requireCurrentUser, async (req, res) => {
  const currentUserId = getAuthenticatedUserId(req, res);
  if (!currentUserId) return;
  const friendId = req.params.friendId;
  if (typeof friendId !== "string") {
    return res.status(400).json({ message: "Invalid friend ID." });
  }

  try {
    const result = await deleteFriend(currentUserId, friendId);

    res.status(result.deleted ? 200 : 404).json(result);
  } catch (error) {
    console.error("Deleting friend failed:", error);

    const message = error instanceof Error ? error.message : "Unable to delete friend.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

export default router;