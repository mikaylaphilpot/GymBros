// This is a background JavaScript file that runs in the user's browser independently of the web page. 
// It listens for incoming push events dispatched by your backend. When it receives a push event, it parses - 
// - the data and tells the browser's operating system to display the actual visual pop-up notification on the screen. 
// It also controls what happens when the user clicks the notification (e.g., opening your app's URL).


// example code
// public/service-worker.js
// self.addEventListener('push', function(event) {
//   if (event.data) {
//     const data = event.data.json();
    
//     const options = {
//       body: data.body, // The custom text sent from your API
//       icon: data.icon,
//       badge: '/badge.png',
//       vibrate: [200, 100, 200]
//     };

//     event.waitUntil(
//       self.registration.showNotification(data.title, options)
//     );
//   }
// });

// // Handle notification clicks
// self.addEventListener('notificationclick', function(event) {
//   event.notification.close();
//   event.waitUntil(
//     clients.openWindow('https://your-domain.com/')
//   );
// });