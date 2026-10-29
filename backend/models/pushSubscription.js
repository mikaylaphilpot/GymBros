// This file defines the MongoDB database schema for saving a user's device subscription. 
// When a user allows notifications, their browser generates a unique URL (endpoint) and security keys. 
// This model stores that data and links it to their specific user ID so the server knows exactly where to route their notifications.

// example code
// models/PushSubscription.js
// const mongoose = require('mongoose');

// const pushSubscriptionSchema = new mongoose.Schema({
//   userId: { 
//     type: mongoose.Schema.Types.ObjectId, 
//     ref: 'User', 
//     required: true 
//   },
//   subscription: {
//     endpoint: { type: String, required: true },
//     expirationTime: { type: Number, default: null },
//     keys: {
//       p256dh: { type: String, required: true },
//       auth: { type: String, required: true }
//     }
//   }
// }, { timestamps: true });

// module.exports = mongoose.model('PushSubscription', pushSubscriptionSchema);