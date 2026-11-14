import { lookup } from "node:dns/promises";
import net from "node:net";

const COLLECTION_NAME = "pushSubscriptions";

export interface PushSubscription {
  endpoint: string;
  expirationTime?: number | null;
  keys: {
    p256dh: string;
    auth: string;
  };
}

export interface PushSubscriptionRecord {
  userId: string;
  subscription: PushSubscription;
  updatedAt: Date;
  createdAt?: Date;
}

interface PushSubscriptionCollection {
  updateOne(
    filter: { userId: string },
    update: {
      $set: PushSubscriptionRecord;
      $setOnInsert: { createdAt: Date };
    },
    options: { upsert: true },
  ): Promise<unknown>;
  findOne(filter: { userId: string }): Promise<PushSubscriptionRecord | null>;
  deleteOne(filter: { userId: string }): Promise<{ deletedCount: number }>;
}

interface MongoDatabase {
  collection(name: string): PushSubscriptionCollection;
}

export interface PushSubscriptionStore {
  save(userId: string, subscription: unknown): Promise<PushSubscriptionRecord>;
  findByUserId(userId: string): Promise<PushSubscriptionRecord | null>;
  deleteByUserId(userId: string): Promise<{ deletedCount: number }>;
}

function isPrivateAddress(address: string): boolean {
  const version = net.isIP(address);
  if (version === 4) {
    const octets = address.split(".").map(Number);
    return (
      octets[0] === 10 ||
      octets[0] === 127 ||
      (octets[0] === 169 && octets[1] === 254) ||
      (octets[0] === 172 && octets[1] >= 16 && octets[1] <= 31) ||
      (octets[0] === 192 && octets[1] === 168) ||
      octets[0] === 0
    );
  }

  if (version === 6) {
    const normalized = address.toLowerCase();
    return (
      normalized === "::1" ||
      normalized === "::" ||
      normalized.startsWith("fc") ||
      normalized.startsWith("fd") ||
      normalized.startsWith("fe8") ||
      normalized.startsWith("fe9") ||
      normalized.startsWith("fea") ||
      normalized.startsWith("feb")
    );
  }

  return true;
}

function isSupportedPushOrigin(url: URL): boolean {
  return (
    url.protocol === "https:" &&
    (url.hostname === "fcm.googleapis.com" ||
      url.hostname === "updates.push.services.mozilla.com" ||
      url.hostname.endsWith(".notify.windows.com")) ||
      url.hostname.endsWith(".push.apple.com")
  );
}

// AI-assisted: validates browser subscriptions and blocks SSRF-capable endpoints.
// The allowlist and DNS check ensure web-push cannot be used as an internal
// network proxy, including when a public hostname resolves to a private address.
export async function validateSubscription(
  subscription: unknown,
): Promise<PushSubscription> {
  if (!subscription || typeof subscription !== "object") {
    throw new TypeError("subscription must be an object");
  }

  const candidate = subscription as Partial<PushSubscription>;
  if (typeof candidate.endpoint !== "string" || candidate.endpoint.length === 0) {
    throw new TypeError("subscription.endpoint is required");
  }

  let endpoint: URL;
  try {
    endpoint = new URL(candidate.endpoint);
  } catch {
    throw new TypeError("subscription.endpoint must be a valid URL");
  }

  if (!isSupportedPushOrigin(endpoint)) {
    throw new TypeError("subscription.endpoint is not a supported push-service URL");
  }

  const addresses = await lookup(endpoint.hostname, { all: true, verbatim: true });
  if (addresses.length === 0 || addresses.some(({ address }) => isPrivateAddress(address))) {
    throw new TypeError("subscription.endpoint resolves to a private or invalid address");
  }

  if (
    !candidate.keys ||
    typeof candidate.keys.p256dh !== "string" ||
    typeof candidate.keys.auth !== "string" ||
    candidate.keys.p256dh.length === 0 ||
    candidate.keys.auth.length === 0
  ) {
    throw new TypeError("subscription.keys.p256dh and subscription.keys.auth are required");
  }

  return candidate as PushSubscription;
}

// The store persists one current browser subscription per user and abstracts
// MongoDB from the route layer so the same behavior is testable in memory.
export function createPushSubscriptionStore(
  collection: PushSubscriptionCollection,
): PushSubscriptionStore {
  return {
    async save(userId, subscription) {
      if (typeof userId !== "string" || userId.trim().length === 0) {
        throw new TypeError("userId is required");
      }

      const validatedSubscription = await validateSubscription(subscription);
      const record: PushSubscriptionRecord = {
        userId: userId.trim(),
        subscription: validatedSubscription,
        updatedAt: new Date(),
      };

      await collection.updateOne(
        { userId: record.userId },
        { $set: record, $setOnInsert: { createdAt: record.updatedAt } },
        { upsert: true },
      );
      return record;
    },
    findByUserId: (userId) => collection.findOne({ userId }),
    deleteByUserId: (userId) => collection.deleteOne({ userId }),
  };
}

export function createMongoPushSubscriptionStore(
  database: MongoDatabase,
): PushSubscriptionStore {
  return createPushSubscriptionStore(database.collection(COLLECTION_NAME));
}

export function createInMemoryPushSubscriptionStore(): PushSubscriptionStore {
  const records = new Map<string, PushSubscriptionRecord>();
  return {
    async save(userId, subscription) {
      const validatedSubscription = await validateSubscription(subscription);
      const record: PushSubscriptionRecord = {
        userId,
        subscription: validatedSubscription,
        updatedAt: new Date(),
      };
      records.set(userId, record);
      return record;
    },
    findByUserId: async (userId) => records.get(userId) ?? null,
    deleteByUserId: async (userId) => ({
      deletedCount: records.delete(userId) ? 1 : 0,
    }),
  };
}

export { COLLECTION_NAME };
