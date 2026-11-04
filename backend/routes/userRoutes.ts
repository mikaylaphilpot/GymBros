import { Router, type Request } from "express";
import authMiddleware from "../middleware/authMiddleware.js";
import { searchUsers } from "../api/search.js";
import { addFriend } from "../api/addFriend.js";
import { deleteFriend } from "../api/deleteFriend.js";
import { getFriendsByStats } from "../api/getFriends.js";

const router = Router();

router.use(authMiddleware);

function getAuthenticatedUserId(req: Request) {
  return (req as Request & { userId?: string }).userId;
}

router.get("/search", async (req, res) => {
  try {
    const searchContents =
      typeof req.query.q === "string" ? req.query.q : "";

    const users = await searchUsers(searchContents, getAuthenticatedUserId(req));

    res.json(users);
  } catch (error) {
    console.error("User search failed:", error);
    res.status(500).json({ message: "Unable to search users." });
  }
});

router.get("/:currentUserId/friends/stats", async (req, res) => {
  try {
    if (req.params.currentUserId !== getAuthenticatedUserId(req)) {
      return res.status(403).json({ message: "You may only access your own friends." });
    }

    const stats = await getFriendsByStats(req.params.currentUserId);

    res.json(stats);
  } catch (error) {
    console.error("Getting friend stats failed:", error);

    const message = error instanceof Error ? error.message : "Unable to get friend stats.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

router.post("/:currentUserId/friends/:friendId", async (req, res) => {
  try {
    if (req.params.currentUserId !== getAuthenticatedUserId(req)) {
      return res.status(403).json({ message: "You may only manage your own friends." });
    }

    const result = await addFriend(req.params.currentUserId, req.params.friendId);

    res.status(result.added ? 201 : 200).json(result);
  } catch (error) {
    console.error("Adding friend failed:", error);

    const message = error instanceof Error ? error.message : "Unable to add friend.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

router.delete("/:currentUserId/friends/:friendId", async (req, res) => {
  try {
    if (req.params.currentUserId !== getAuthenticatedUserId(req)) {
      return res.status(403).json({ message: "You may only manage your own friends." });
    }

    const result = await deleteFriend(req.params.currentUserId, req.params.friendId);

    res.status(result.deleted ? 200 : 404).json(result);
  } catch (error) {
    console.error("Deleting friend failed:", error);

    const message = error instanceof Error ? error.message : "Unable to delete friend.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

export default router;