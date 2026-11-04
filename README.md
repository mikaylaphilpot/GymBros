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