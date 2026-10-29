// This file contains the Express API endpoints that handle the server-side notification logic. 
// The /subscribe route receives the subscription data from the frontend and saves it to the database. 
// The /send route is what you will call when a user wants to "bug" their friends; it retrieves the -
//  - target user's subscription from the database and uses the web-push library to dispatch the message payload.