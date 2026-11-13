import { ObjectId } from "mongodb";

const COLLECTION_NAME = "notifications";

export interface NotificationRecord {
  id: string;
  userId: string;
  title: string;
  message: string;
  url?: string;
  read: boolean;
  createdAt: Date;
}

interface NotificationCollection {
  insertOne(document: Omit<NotificationRecord, "id">): Promise<{ insertedId: ObjectId }>;
  find(
    filter: { userId: string; read?: boolean },
    options: { limit: number },
  ): {
    sort(sort: { createdAt: -1 }): {
      toArray(): Promise<Array<NotificationRecord & { _id?: ObjectId }>>;
    };
  };
  updateOne(
    filter: { _id: ObjectId; userId: string },
    update: { $set: { read: boolean } },
  ): Promise<{ matchedCount: number }>;
}

export interface NotificationStore {
  create(input: {
    userId: string;
    title: string;
    message: string;
    url?: string;
  }): Promise<NotificationRecord>;
  list(userId: string, unreadOnly: boolean, limit: number): Promise<NotificationRecord[]>;
  markRead(userId: string, notificationId: string): Promise<boolean>;
}

export function createNotificationStore(
  collection: NotificationCollection,
): NotificationStore {
  return {
    async create(input) {
      const document = {
        ...input,
        read: false,
        createdAt: new Date(),
      };
      const result = await collection.insertOne(document);
      return { ...document, id: result.insertedId.toString() };
    },
    async list(userId, unreadOnly, limit) {
      const records = await collection
        .find(unreadOnly ? { userId, read: false } : { userId }, { limit })
        .sort({ createdAt: -1 })
        .toArray();
      return records.map((record) => ({
        ...record,
        id: record.id ?? record._id?.toString() ?? "",
      }));
    },
    async markRead(userId, notificationId) {
      if (!ObjectId.isValid(notificationId)) return false;
      const result = await collection.updateOne(
        { _id: new ObjectId(notificationId), userId },
        { $set: { read: true } },
      );
      return result.matchedCount > 0;
    },
  };
}

export function createInMemoryNotificationStore(): NotificationStore {
  const records: NotificationRecord[] = [];
  return {
    async create(input) {
      const record = {
        ...input,
        id: new ObjectId().toString(),
        read: false,
        createdAt: new Date(),
      };
      records.push(record);
      return record;
    },
    async list(userId, unreadOnly, limit) {
      return records
        .filter((record) => record.userId === userId && (!unreadOnly || !record.read))
        .sort((left, right) => right.createdAt.getTime() - left.createdAt.getTime())
        .slice(0, limit);
    },
    async markRead(userId, notificationId) {
      const record = records.find(
        (candidate) => candidate.id === notificationId && candidate.userId === userId,
      );
      if (!record) return false;
      record.read = true;
      return true;
    },
  };
}

export { COLLECTION_NAME };
