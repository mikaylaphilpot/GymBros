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
message to the authenticated development user. The endpoint requires the
temporary `x-user-id` identity header and therefore is for local testing only.
The existing `POST /api/notifications/send` endpoint remains available for
testing messages between different subscribed users.

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