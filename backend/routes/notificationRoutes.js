const express = require('express');
const webpush = require('web-push');

function getUserId(req) {
  const userId = req.user && (req.user.id || req.user._id);
  return typeof userId === 'string' && userId.trim().length > 0 ? userId.trim() : null;
}

function createNotificationRouter({ store, pushClient = webpush }) {
  if (!store) {
    throw new TypeError('A push subscription store is required');
  }

  const router = express.Router();

  router.post('/subscribe', async (req, res, next) => {
    const userId = getUserId(req);
    if (!userId) {
      return res.status(401).json({ message: 'Authentication is required' });
    }

    try {
      await store.save(userId, req.body && req.body.subscription);
      return res.status(201).json({ message: 'Subscription saved successfully' });
    } catch (error) {
      if (error instanceof TypeError) {
        return res.status(400).json({ message: error.message });
      }
      return next(error);
    }
  });

  router.post('/send', async (req, res, next) => {
    const senderId = getUserId(req);
    const { targetUserId, messageText, title, url } = req.body || {};

    if (!senderId) {
      return res.status(401).json({ message: 'Authentication is required' });
    }
    if (typeof targetUserId !== 'string' || targetUserId.trim().length === 0) {
      return res.status(400).json({ message: 'targetUserId is required' });
    }
    if (typeof messageText !== 'string' || messageText.trim().length === 0) {
      return res.status(400).json({ message: 'messageText is required' });
    }

    try {
      const record = await store.findByUserId(targetUserId.trim());
      if (!record) {
        return res.status(404).json({ message: 'User is not subscribed to notifications' });
      }

      const payload = JSON.stringify({
        title: typeof title === 'string' && title.trim() ? title.trim() : 'GymBros Notification',
        body: messageText.trim(),
        url: typeof url === 'string' && url.trim() ? url.trim() : '/',
      });

      await pushClient.sendNotification(record.subscription, payload);
      return res.status(200).json({ message: 'Notification sent successfully' });
    } catch (error) {
      if (error.statusCode === 404 || error.statusCode === 410) {
        await store.deleteByUserId(targetUserId.trim());
        return res.status(410).json({ message: 'The target notification subscription is no longer valid' });
      }
      return next(error);
    }
  });

  return router;
}

module.exports = { createNotificationRouter };
