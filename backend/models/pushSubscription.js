// This file defines the MongoDB database schema for saving a user's device subscription. 
// When a user allows notifications, their browser generates a unique URL (endpoint) and security keys. 
// This model stores that data and links it to their specific user ID so the server knows exactly where to route their notifications.