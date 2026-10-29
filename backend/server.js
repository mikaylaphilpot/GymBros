const express = require('express');
const cors = require('cors');
const dotenv = require('dotenv');
const { MongoClient } = require('mongodb');
const {
  createInMemoryPushSubscriptionStore,
  createMongoPushSubscriptionStore,
} = require('./models/pushSubscription');
const { createNotificationRouter } = require('./routes/notificationRoutes');

dotenv.config();
const app = express();

app.use(cors());
app.use(express.json());

//Test API
app.get('/api/test', (req, res) => {
  res.json({ message: 'Backend is working!' });
});

if (process.env.ALLOW_DEV_USER_HEADER === 'true') {
  app.use((req, _res, next) => {
    if (typeof req.headers['x-user-id'] === 'string') {
      req.user = { id: req.headers['x-user-id'] };
    }
    next();
  });
}

function createUnavailableStore() {
  return {
    save: async () => {
      const error = new Error('MongoDB is not configured');
      error.statusCode = 503;
      throw error;
    },
    findByUserId: async () => null,
    deleteByUserId: async () => undefined,
  };
}

async function startServer() {
  let client;
  let store = createInMemoryPushSubscriptionStore();
  if (process.env.MONGODB_URI) {
    client = new MongoClient(process.env.MONGODB_URI);
    await client.connect();
    store = createMongoPushSubscriptionStore(
      client.db(process.env.MONGODB_DB || 'gymbros'),
    );
  } else if (process.env.NODE_ENV === 'production') {
    store = createUnavailableStore();
  } else {
    console.warn('MONGODB_URI is not configured; using in-memory push subscriptions');
  }

  app.use('/api/notifications', createNotificationRouter({ store }));
  app.use((error, _req, res, _next) => {
    const status = Number.isInteger(error.statusCode) ? error.statusCode : 500;
    res.status(status).json({ message: error.message || 'Internal server error' });
  });

  const port = Number(process.env.PORT) || 5001;
  return app.listen(port, () => {
    console.log(`Server running on port ${port}`);
  });
}

if (require.main === module) {
  startServer().catch((error) => {
    console.error('Failed to start server:', error.message);
    process.exitCode = 1;
  });
}

module.exports = { app, startServer };