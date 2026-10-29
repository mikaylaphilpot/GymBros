// This frontend TypeScript file handles the browser-side setup. 
// It asks the user for permission to show notifications, registers the Service Worker, generates the subscription object using - 
// - your public VAPID key, and makes the asynchronous AJAX call to send that subscription data to your backend /subscribe route.