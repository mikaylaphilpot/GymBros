const COLLECTION_NAME = "deviceTokens";

export interface DeviceTokenStore {
  save(userId: string, token: unknown, platform: unknown): Promise<void>;
  delete(userId: string, token: unknown): Promise<void>;
  list(userId: string): Promise<string[]>;
}

interface DeviceTokenCollection {
  updateOne(
    filter: { userId: string; token: string },
    update: { $set: { platform: string; updatedAt: Date } },
    options: { upsert: true },
  ): Promise<unknown>;
  deleteOne(filter: { userId: string; token: string }): Promise<unknown>;
  find(filter: { userId: string }): {
    project(projection: { token: 1 }): {
      toArray(): Promise<Array<{ token: string }>>;
    };
  };
}

export function createDeviceTokenStore(
  collection: DeviceTokenCollection,
): DeviceTokenStore {
  return {
    async save(userId, token, platform) {
      if (typeof token !== "string" || !token.trim()) {
        throw new TypeError("token is required");
      }
      if (platform !== "android" && platform !== "ios") {
        throw new TypeError("platform must be android or ios");
      }
      await collection.updateOne(
        { userId, token: token.trim() },
        { $set: { platform, updatedAt: new Date() } },
        { upsert: true },
      );
    },
    async delete(userId, token) {
      if (typeof token !== "string" || !token.trim()) {
        throw new TypeError("token is required");
      }
      await collection.deleteOne({ userId, token: token.trim() });
    },
    async list(userId) {
      const records = await collection
        .find({ userId })
        .project({ token: 1 })
        .toArray();
      return records.map(({ token }) => token);
    },
  };
}

export { COLLECTION_NAME };
