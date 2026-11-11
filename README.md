# GymBros

GymBros is a MERN web application with a planned Flutter mobile client. The
backend includes the Express API scaffold, MongoDB configuration, and push
notification endpoints.

## Backend database configuration

Create a local `backend/.env` file with your MongoDB connection string:

```text
MONGODB_URI=<local or remote MongoDB connection string>
```

`backend/.env` is ignored by Git. Keep real credentials there locally, or configure `MONGODB_URI` as an environment variable in your deployment environment. Never commit the real connection string.

## Backend development

The backend runs from TypeScript files. The original JavaScript files are preserved as reference copies in `backend/legacy-js/`; they are not used by the server. Comments in the TypeScript files describe how each part works.

From the `backend/` directory, run `npm run dev` for watch mode, `npm run typecheck` to check types, or `npm run build` followed by `npm start` to run the compiled server.

## Flutter app

The Android client, including instructions for running it, configuring the API, and extending the auth flow, is in [`mobile/README.md`](./mobile/README.md). The website is maintained separately and is not part of this Flutter project.

## Authentication API

Base URL: `http://localhost:5001/api/auth`

### Signup verification email configuration

Signup sends the verification link to the email address submitted by the new
user through GymBros's server-side SMTP account. SMTP credentials belong to
GymBros, not to individual users, and must stay in the backend `.env` file.

For SendGrid SMTP, verify a sender identity in SendGrid and configure:

```text
SMTP_HOST=smtp.sendgrid.net
SMTP_PORT=587
SMTP_USER=apikey
SMTP_PASS=<SendGrid API key>
SMTP_FROM=<verified sender email>
PUBLIC_API_URL=http://137.184.142.16:5001
```

Use an HTTPS domain for `PUBLIC_API_URL` before production deployment. Never
commit or share the API key, SMTP password, or populated `.env` file.

### POST /signup
Creates a new user account.

Request body:
- username: string
- email: string
- password: string

Success: 201 Created

### POST /login
Authenticates a user and returns a JWT.

Request body:
- username: string
- password: string

Success: 200 OK

Response:
- message: string
- token: JWT string (expires after 1 hour)

### GET /me
Returns information about the authenticated user.

Required header:
Authorization: Bearer <token>

Success: 200 OK

Response:
- id: MongoDB user ID
- username: string
- email: string

Errors:
- 401: Missing, invalid, or expired JWT
- 404: User not found

### Upcoming Features
- Email verification
- Password reset

## Local web push notification test

This test requires the backend and frontend `.env` files to contain the
MongoDB, VAPID, and `VITE_API_BASE_URL` values from their `.env.example`
templates. Do not commit either populated `.env` file.

Start the backend in one terminal:

```powershell
Push-Location backend
npm run dev
```

Start the frontend in a second terminal:

```powershell
Push-Location frontend
npm run dev
```

Open `http://localhost:5173/notifications-test` in Chrome or Edge, not the
VS Code embedded browser. Enter the recipient's MongoDB user `_id`, click
**Enable notifications**, and allow browser notifications. After the page
reports that notifications are enabled, click **Send test notification**.

The page uses `POST /api/notifications/test`, which sends a default test
message to the authenticated development user. Production requests use a
bearer JWT; local testing may use the `x-user-id` identity header only when
`ALLOW_DEV_USER_HEADER=true`, so this endpoint remains for local testing only.
The existing `POST /api/notifications/send` endpoint remains available for
testing messages between different subscribed users.

### Mobile notification API

Authenticated mobile clients use the same `/api/notifications` base:

- `GET /inbox?unreadOnly=true&limit=50` lists the signed-in user's notifications.
- `PATCH /inbox/:notificationId/read` marks one owned notification as read.
- `POST /` creates an in-app notification for `targetUserId` with `title`,
  `message`, and optional `url`.
- `POST /device-token` registers a future native push token with
  `{ "token": "...", "platform": "android" }`.
- `DELETE /device-token` removes a registered token.

All mobile endpoints require the user's JWT bearer token. FCM delivery is enabled by setting `FCM_ENABLED=true` and
`GOOGLE_APPLICATION_CREDENTIALS` to a backend-only Firebase service-account
JSON path. The in-app feed continues to work when FCM is disabled. See
[`mobile/README.md`](./mobile/README.md#configure-firebase-cloud-messaging) for
the Android and server setup.

For a PowerShell API test, use the actual recipient ID and run both commands:

```powershell
$body = @{
  targetUserId = "YOUR_MONGODB_USER_ID"
  messageText = "Time to train!"
  title = "GymBros Test"
  url = "/"
} | ConvertTo-Json

Invoke-RestMethod `
  -Uri "http://localhost:5001/api/notifications/send" `
  -Method Post `
  -Headers @{ "x-user-id" = "test-sender" } `
  -ContentType "application/json" `
  -Body $body
```

Do not send the literal text `YOUR_MONGODB_USER_ID`; replace it with the same
ID used on the test page. A response saying that the user is not subscribed
means the browser subscription step did not complete for that ID.