# GymBros Flutter client

This directory contains the Android app only. The website is maintained separately.

## Prerequisites

- Flutter SDK (the project currently requires Dart `^3.13.7`).
- Android Studio with an Android SDK, Android SDK Command-line Tools, and either an Android emulator or a USB-connected Android device.
- A running GymBros backend with its MongoDB and email/SMTP configuration available. New accounts need email verification before they can sign in.

Check Android setup and accept the SDK licenses with:

```sh
flutter doctor
flutter doctor --android-licenses
```

## Run the app

From this directory, fetch packages and launch an emulator or attached device:

```sh
flutter pub get
flutter emulators
flutter run
```

Start the backend separately from `backend/` with `npm run dev`. The Android emulator reaches the host computer through `10.0.2.2`, so the app defaults to `http://10.0.2.2:5001/api/auth/`.

For a physical Android device, use the computer's LAN IP address instead. The phone and computer must be on the same network, and the computer firewall must allow the backend port:

```sh
flutter run --dart-define=API_BASE_URL=http://192.168.1.10:5001/api/auth/
```

Replace `192.168.1.10` with the computer's LAN IP. `API_BASE_URL` is the full auth API base URL and should end in `/api/auth/`. The default HTTP address and cleartext traffic are for local debug development; use an HTTPS URL for release builds:

```sh
flutter build apk --release --dart-define=API_BASE_URL=https://api.example.com/api/auth/
```

The backend permits registration only when the username and email are unused, the email is valid, and the password has at least 8 characters including an uppercase letter, lowercase letter, number, and one of `@$!%*?&`. It emails a verification link after registration. Sign-in is rejected until the user follows that link.

## Authentication implementation

- [`lib/main.dart`](./lib/main.dart) contains the app theme, sign-in/sign-up forms, client-side validation, loading and error states, the signed-in profile screen, and session restoration.
- [`lib/auth/auth_service.dart`](./lib/auth/auth_service.dart) sends requests to the auth endpoints for sign-up, sign-in, profile loading, email verification, and password reset; it turns server and connection failures into user-facing errors and exposes the `AuthService` API.
- Login stores the one-hour JWT with `flutter_secure_storage`; it is never stored in preferences or logged. On app launch the client calls `/me` with the saved bearer token to restore the profile. A `401` clears an expired token. Sign-out deletes the local token because the backend does not currently have a logout endpoint.
- Sign-up success returns the user to sign-in and reminds them to verify their email. The backend's validation and verification responses are shown in the app.
- The sign-in screen can resend a verification email, submit a verification link/token, request a password-reset email, and reset the password with a pasted reset link/token. The app extracts the token from the email URL and submits it to the existing backend endpoints.
- The signed-in schedule screen loads the user's workouts and supports adding, editing, and deleting entries through `GET`, `POST`, `PATCH`, and `DELETE /api/schedules`. Requests use the saved bearer token; schedule data is refreshed by pulling down on the list. Day and time inputs follow the backend's accepted values (`Monday`-`Sunday` and a time such as `6:30 PM`).
- Schedule requests derive `/api/schedules/` from `API_BASE_URL`, which remains the full auth URL ending in `/api/auth/`. The same emulator default and physical-device override therefore work for both auth and schedule calls.
- The default auth base URL can be overridden with the compile-time `API_BASE_URL` Dart define. This keeps local network addresses out of the source and lets teammates use their emulator, phone, or deployed HTTPS API.

When adding an authenticated API feature, add the typed request/response behavior to `AuthService` (or a separate service for non-auth endpoints), pass bearer tokens through the service rather than UI widgets, surface backend error messages, and add tests for both successful and failing responses. Keep password/token values out of logs.

Email delivery still runs through the backend SMTP configuration. Before using these flows with real users, configure SMTP and replace the backend's local verification/reset URLs with a public HTTPS URL for the deployed API or an app deep link. Until then, users can paste a copied link into the corresponding mobile screen; the app extracts its token and calls the API using `API_BASE_URL`.
## Notifications API

The signed-in app exposes a **Notifications** button backed by
`NotificationService`. It reads the authenticated inbox from
`GET /api/notifications/inbox` and marks items read with
`PATCH /api/notifications/inbox/:notificationId/read`. The app also exposes
`registerDeviceToken` and `unregisterDeviceToken` for Firebase Cloud
Messaging. On login/session restore it requests Android notification
permission, registers the FCM token with the backend, and updates the backend
when Firebase rotates the token. Sign-out removes the current token.

## Configure Firebase Cloud Messaging

1. In Firebase Console, open the GymBros project, enable Cloud Messaging, and
   add an Android app with package name `com.gymbros.mobile`.
2. Download `google-services.json` to
   `mobile/android/app/google-services.json`. This file is ignored locally;
   never put a service-account JSON file in the Flutter app.
3. From `mobile/`, run:

   ```powershell
   flutter pub get
   flutter run
   ```

   The Google Services Gradle plugin is applied automatically when that file is
   present. A real device or Google Play Android emulator is required for FCM.
4. In Firebase Console > Project settings > Service accounts, create a
   backend service-account key. Store it outside the repository and configure
   the backend host with:

   ```text
   FCM_ENABLED=true
   GOOGLE_APPLICATION_CREDENTIALS=C:\secure\gymbros-firebase-admin.json
   ```

   Restart the backend after setting these variables. The backend uses the
   Firebase Admin SDK to send notifications created through
   `POST /api/notifications`; invalid FCM tokens are removed automatically.

For a complete test, sign in on the Android app, grant notification permission,
confirm the device token was stored in MongoDB, then create an in-app
notification through the API. Verify delivery while the app is backgrounded,
and verify that an invalid token is removed after a failed send. Foreground
messages remain available in the in-app inbox.

## Validate changes

Run these commands from `mobile/` before submitting Flutter changes:

```sh
dart format lib test
flutter analyze
flutter test
flutter build apk --debug
```

Service request/response tests are in [`test/auth_service_test.dart`](./test/auth_service_test.dart) and [`test/schedule_service_test.dart`](./test/schedule_service_test.dart); auth screen interaction tests are in [`test/widget_test.dart`](./test/widget_test.dart).
