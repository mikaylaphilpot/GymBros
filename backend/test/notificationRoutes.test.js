const assert = require('node:assert/strict');
const http = require('node:http');
const express = require('express');
const test = require('node:test');
const { createInMemoryPushSubscriptionStore } = require('../models/pushSubscription');
const { createNotificationRouter } = require('../routes/notificationRoutes');

function createTestServer(sendNotification = async () => undefined) {
  const app = express();
  const store = createInMemoryPushSubscriptionStore();
  app.use(express.json());
  app.use((req, _res, next) => {
    if (req.headers['x-user-id']) req.user = { id: req.headers['x-user-id'] };
    next();
  });
  app.use('/api/notifications', createNotificationRouter({
    store,
    pushClient: { sendNotification },
  }));
  app.use((error, _req, res, _next) => res.status(500).json({ message: error.message }));
  const server = http.createServer(app);
  return { server, store };
}

async function request(server, path, options = {}) {
  const address = await new Promise((resolve) => server.listen(0, () => resolve(server.address())));
  try {
    const response = await fetch(`http://127.0.0.1:${address.port}${path}`, {
      ...options,
      headers: { 'content-type': 'application/json', ...(options.headers || {}) },
    });
    return { status: response.status, body: await response.json() };
  } finally {
    await new Promise((resolve, reject) => server.close((error) => error ? reject(error) : resolve()));
  }
}

const subscription = {
  endpoint: 'https://push.example.test/subscription',
  keys: { p256dh: 'public-key', auth: 'auth-key' },
};

test('requires authentication and validates subscriptions', async () => {
  const unauthenticated = await request(createTestServer().server, '/api/notifications/subscribe', {
    method: 'POST',
    body: JSON.stringify({ subscription }),
  });
  assert.equal(unauthenticated.status, 401);

  const invalid = await request(createTestServer().server, '/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'x-user-id': 'user-1' },
    body: JSON.stringify({ subscription: {} }),
  });
  assert.equal(invalid.status, 400);
});

test('saves a subscription and sends a notification', async () => {
  let sentPayload;
  const result = await request(createTestServer((_subscription, payload) => {
    sentPayload = JSON.parse(payload);
  }).server, '/api/notifications/subscribe', {
    method: 'POST',
    headers: { 'x-user-id': 'user-2' },
    body: JSON.stringify({ subscription }),
  });
  assert.equal(result.status, 201);

  const server = createTestServer((_subscription, payload) => {
    sentPayload = JSON.parse(payload);
  });
  await server.store.save('user-2', subscription);
  const sent = await request(server.server, '/api/notifications/send', {
    method: 'POST',
    headers: { 'x-user-id': 'sender-1' },
    body: JSON.stringify({ targetUserId: 'user-2', messageText: 'Time to train!' }),
  });
  assert.equal(sent.status, 200);
  assert.deepEqual(sentPayload, {
    title: 'GymBros Notification',
    body: 'Time to train!',
    url: '/',
  });
});

test('removes expired subscriptions', async () => {
  const server = createTestServer(async () => {
    const error = new Error('expired');
    error.statusCode = 410;
    throw error;
  });
  await server.store.save('user-3', subscription);
  const result = await request(server.server, '/api/notifications/send', {
    method: 'POST',
    headers: { 'x-user-id': 'sender-1' },
    body: JSON.stringify({ targetUserId: 'user-3', messageText: 'Hello' }),
  });
  assert.equal(result.status, 410);
  assert.equal(await server.store.findByUserId('user-3'), null);
});
