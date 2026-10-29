const COLLECTION_NAME = 'pushSubscriptions';

function validateSubscription(subscription) {
  if (!subscription || typeof subscription !== 'object') {
    throw new TypeError('subscription must be an object');
  }

  if (typeof subscription.endpoint !== 'string' || subscription.endpoint.length === 0) {
    throw new TypeError('subscription.endpoint is required');
  }

  try {
    new URL(subscription.endpoint);
  } catch {
    throw new TypeError('subscription.endpoint must be a valid URL');
  }

  if (
    !subscription.keys ||
    typeof subscription.keys.p256dh !== 'string' ||
    typeof subscription.keys.auth !== 'string' ||
    subscription.keys.p256dh.length === 0 ||
    subscription.keys.auth.length === 0
  ) {
    throw new TypeError('subscription.keys.p256dh and subscription.keys.auth are required');
  }
}

function createPushSubscriptionStore(collection) {
  return {
    async save(userId, subscription) {
      if (typeof userId !== 'string' || userId.trim().length === 0) {
        throw new TypeError('userId is required');
      }

      validateSubscription(subscription);
      const record = {
        userId: userId.trim(),
        subscription,
        updatedAt: new Date(),
      };

      await collection.updateOne(
        { userId: record.userId },
        { $set: record, $setOnInsert: { createdAt: record.updatedAt } },
        { upsert: true },
      );
      return record;
    },

    findByUserId(userId) {
      return collection.findOne({ userId });
    },

    deleteByUserId(userId) {
      return collection.deleteOne({ userId });
    },
  };
}

function createMongoPushSubscriptionStore(db) {
  return createPushSubscriptionStore(db.collection(COLLECTION_NAME));
}

function createInMemoryPushSubscriptionStore() {
  const records = new Map();
  return {
    async save(userId, subscription) {
      validateSubscription(subscription);
      const record = { userId, subscription, updatedAt: new Date() };
      records.set(userId, record);
      return record;
    },
    findByUserId(userId) {
      return Promise.resolve(records.get(userId) || null);
    },
    deleteByUserId(userId) {
      const deleted = records.delete(userId);
      return Promise.resolve({ deletedCount: deleted ? 1 : 0 });
    },
  };
}

module.exports = {
  COLLECTION_NAME,
  createInMemoryPushSubscriptionStore,
  createMongoPushSubscriptionStore,
  createPushSubscriptionStore,
  validateSubscription,
};
