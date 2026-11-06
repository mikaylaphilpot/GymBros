
import User from "../models/User.ts";

// AI-assisted: Initial Implementation suggested by Copilot
function escapeRegex(value: string): string {
  return value.replace(/[.*+?^${}()|[\]\\]/g, "\\$&");
}

// AI-assisted: Initial Implementation suggested by Copilot
export async function searchUsers(searchContents: string, currentUserId?: string) {
  const query = searchContents.trim();

  if (!query) {
    return [];
  }

  const escaped = escapeRegex(query);
  const filter: Record<string, unknown> = {
    $or: [
      { username: { $regex: escaped, $options: "i" } },
      { email: { $regex: escaped, $options: "i" } },
    ],
  };

  if (currentUserId) {
    filter._id = { $ne: currentUserId };
  }

  return User.find(filter)
    .select("_id username email isVerified")
    .limit(20)
    .lean();
}
