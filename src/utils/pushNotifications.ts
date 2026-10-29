// This frontend TypeScript file handles the browser-side setup. 
// It asks the user for permission to show notifications, registers the Service Worker, generates the subscription object using - 
// - your public VAPID key, and makes the asynchronous AJAX call to send that subscription data to your backend /subscribe route.

// example code
// utils/pushNotifications.ts
// Call this function after the user successfully logs in
// export async function subscribeToPushNotifications(token: string) {
//   if (!('serviceWorker' in navigator) || !('PushManager' in window)) {
//     console.warn('Push notifications are not supported by the browser.');
//     return;
//   }

//   try {
//     // 1. Register the Service Worker
//     const register = await navigator.serviceWorker.register('/service-worker.js');

//     // 2. Request permission and subscribe to PushManager
//     const publicVapidKey = process.env.REACT_APP_VAPID_PUBLIC_KEY as string;
//     const subscription = await register.pushManager.subscribe({
//       userVisibleOnly: true,
//       applicationServerKey: publicVapidKey,
//     });

//     // 3. Send the subscription to your Express API via AJAX
//     await fetch('https://your-api-domain.com/api/notifications/subscribe', {
//       method: 'POST',
//       body: JSON.stringify({ subscription }),
//       headers: {
//         'Content-Type': 'application/json',
//         'Authorization': `Bearer ${token}` // Pass JWT for security
//       },
//     });

//     console.log('Successfully subscribed to push notifications!');
//   } catch (error) {
//     console.error('Push subscription failed:', error);
//   }
// }