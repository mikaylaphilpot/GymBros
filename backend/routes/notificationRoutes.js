// This file contains the Express API endpoints that handle the server-side notification logic. 
// The /subscribe route receives the subscription data from the frontend and saves it to the database. 
// The /send route is what you will call when a user wants to "bug" their friends; it retrieves the -
//  - target user's subscription from the database and uses the web-push library to dispatch the message payload.

// example code
// routes/notificationRoutes.js
// const express = require('express');
// const webpush = require('web-push');
// const PushSubscription = require('../models/PushSubscription');
// const router = express.Router();
// Assuming you have a JWT authentication middleware
// const { protect } = require('../middleware/authMiddleware'); 

// Configure web-push with your VAPID keys
// webpush.setVapidDetails(
//   'mailto:your-email@example.com',
//   process.env.VAPID_PUBLIC_KEY,
//   process.env.VAPID_PRIVATE_KEY
// );

// API Endpoint 1: Save User Subscription
// The React client sends this after requesting notification permissions
// router.post('/subscribe', protect, async (req, res) => {
//   try {
//     const { subscription } = req.body;
    
//     // Upsert the subscription so the user only has one active device record
//     await PushSubscription.findOneAndUpdate(
//       { userId: req.user._id },
//       { subscription: subscription },
//       { upsert: true, new: true }
//     );

//     res.status(201).json({ message: 'Subscription saved successfully.' });
//   } catch (error) {
//     res.status(500).json({ error: 'Failed to save subscription' });
//   }
// });

// // API Endpoint 2: Send Notification
// // Receives the text to display and the target user ID
// router.post('/send', protect, async (req, res) => {
//   try {
//     const { targetUserId, messageText } = req.body;

//     // Find the target user's subscription in MongoDB
//     const subRecord = await PushSubscription.findOne({ userId: targetUserId });
    
//     if (!subRecord) {
//       return res.status(404).json({ error: 'User is not subscribed to notifications' });
//     }

//     // Payload to send to the Service Worker
//     const payload = JSON.stringify({
//       title: 'GymBros Notification',
//       body: messageText,
//       icon: '/logo.png' // Add your app icon here
//     });

//     // Fire the push notification
//     await webpush.sendNotification(subRecord.subscription, payload);
    
//     res.status(200).json({ message: 'Notification sent successfully.' });
//   } catch (error) {
//     if (error.statusCode === 410) {
//       // 410 means the subscription is no longer valid (e.g., user revoked permission)
//       await PushSubscription.deleteOne({ userId: req.body.targetUserId });
//     }
//     res.status(500).json({ error: 'Failed to send notification' });
//   }
// });

// module.exports = router;