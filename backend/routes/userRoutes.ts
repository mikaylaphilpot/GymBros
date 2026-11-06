import { Router } from "express";
import { searchUsers } from "../api/search.ts";
import { addFriend } from "../api/addFriend.ts";
import { deleteFriend } from "../api/deleteFriend.ts";
import { getFriendsByStats } from "../api/getFriends.ts";

const router = Router();

// AI-assisted: Initial Implementation suggested by Copilot
router.get("/search", async (req, res) => {
  try {
    const searchContents =
      typeof req.query.q === "string" ? req.query.q : "";

    const currentUserId =
      typeof req.query.currentUserId === "string"
        ? req.query.currentUserId
        : undefined;

    const users = await searchUsers(searchContents, currentUserId);

    res.json(users);
  } catch (error) {
    console.error("User search failed:", error);
    res.status(500).json({ message: "Unable to search users." });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.get("/:currentUserId/friends/stats", async (req, res) => {
  try {
    const stats = await getFriendsByStats(req.params.currentUserId);

    res.json(stats);
  } catch (error) {
    console.error("Getting friend stats failed:", error);

    const message = error instanceof Error ? error.message : "Unable to get friend stats.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.post("/:currentUserId/friends/:friendId", async (req, res) => {
  try {
    const result = await addFriend(req.params.currentUserId, req.params.friendId);

    res.status(result.added ? 201 : 200).json(result);
  } catch (error) {
    console.error("Adding friend failed:", error);

    const message = error instanceof Error ? error.message : "Unable to add friend.";
    const status = message.includes("not found") ? 404 : 400;

    res.status(status).json({ message });
  }
});

// AI-assisted: Initial Implementation suggested by Copilot
router.delete("/:currentUserId/friends/:friendId", async (req, res) => {
  try {
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